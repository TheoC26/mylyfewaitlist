import { google } from 'googleapis';
import path from 'path';

/**
 * Waitlist signup.
 *
 * Writes to TWO places on purpose, and treats them very differently:
 *
 *   1. The MyLyfe API (Supabase) — the source of truth. It mints the token and
 *      position the video-wall invite depends on, and sends the welcome email.
 *      If this fails, we lose the upload link.
 *   2. The Google Sheet — the original store, kept as a safety net through the
 *      launch sprint. Best-effort, never blocks the response.
 *
 * The failure handling is deliberately asymmetric. If the API is down but the
 * Sheet append lands we still return 200, with token: null — the visitor sees
 * exactly the success message this page showed before any of this existed,
 * their address is safely recorded, and the backfill script can import them
 * later. A lost signup is the only truly unrecoverable outcome here, so
 * everything is arranged so that cannot happen.
 */

const API_BASE = (process.env.NEXT_PUBLIC_MYLYFE_API_BASE || '').replace(/\/$/, '');
const SPREADSHEET_ID = '1TJ4yFjPc-HjdnK4N1bzBCGvU7C3LkTGmIZRD2ApXFqc';

/** Mirrors normalizeEmail() on the server so the two never disagree. */
const EMAIL_RE = /^[^\s@,;:<>()[\]\\]+@[^\s@.,;:<>()[\]\\]+\.[^\s@,;:<>()[\]\\]{2,}$/;

function normalizeEmail(raw) {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return null;
  return email;
}

async function appendToSheet(email) {
  let auth;
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  } else {
    auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'google-credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  const sheets = google.sheets({ version: 'v4', auth });
  const now = new Date().toLocaleString('en-US', { timeZone: 'UTC' });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!A:B',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[email, now]] },
  });
}

/**
 * The visitor's real IP, for rate limiting on the API side.
 *
 * Prefer x-real-ip: Vercel sets it from the actual connection, so a client
 * cannot forge it. x-forwarded-for is a client-appendable list, so if we fall
 * back to it we take only the FIRST entry — the one the edge prepended —
 * otherwise anyone could send a header full of junk and get a fresh rate-limit
 * bucket per request, which defeats the entire point.
 */
function clientIp(req) {
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : '';
}

async function joinViaApi(email, ip) {
  // Named individually, not as one combined check. Both produce exactly the
  // same user-visible symptom — the address lands in the Sheet, nothing reaches
  // Supabase, no email goes out — so a log line that does not say WHICH one is
  // missing leaves you guessing between two different fixes.
  if (!API_BASE) {
    console.warn(
      '[waitlist] NEXT_PUBLIC_MYLYFE_API_BASE is not set — signup recorded in the Sheet only.',
    );
    return null;
  }
  if (!process.env.WAITLIST_API_SECRET) {
    console.warn(
      '[waitlist] WAITLIST_API_SECRET is not set on this deployment — signup ' +
        'recorded in the Sheet only. Add it in Vercel (Production scope) and REDEPLOY: ' +
        'env vars are bound at deploy time, so adding one does not affect a ' +
        'deployment that already exists.',
    );
    return null;
  }

  const res = await fetch(`${API_BASE}/api/waitlist/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Server-only. If this ever picks up a NEXT_PUBLIC_ prefix it ships to
      // every browser, and anyone can mail the entire list.
      'x-waitlist-secret': process.env.WAITLIST_API_SECRET,
      // Without this the API sees only Vercel's egress address, identical for
      // every signup on earth, and cannot tell one visitor from a script.
      ...(ip ? { 'x-client-ip': ip } : {}),
    },
    body: JSON.stringify({ email, source: 'web' }),
    signal: AbortSignal.timeout(8000),
  });

  // 429 is reported rather than swallowed, because it is the one failure that
  // must NOT fall through to the Sheet. Everything else here degrades to
  // "record it somewhere and carry on"; a throttled request is one we have
  // deliberately decided not to accept at all.
  if (res.status === 429) return { rateLimited: true };

  if (res.status === 401) {
    console.error(
      '[waitlist] join API returned 401 — WAITLIST_API_SECRET here does not match ' +
        'the one on App Runner. They must be byte-identical; check for a trailing ' +
        'newline or quotes picked up when pasting. Signup recorded in the Sheet only.',
    );
    return null;
  }

  if (!res.ok) {
    console.error(`[waitlist] join API returned ${res.status}`);
    return null;
  }
  return res.json();
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: 'Invalid request.' }, { status: 400 });
  }

  const email = normalizeEmail(body?.email);
  if (!email) {
    return Response.json(
      { message: 'Please enter a valid email address.' },
      { status: 400 },
    );
  }

  // The API goes FIRST and alone, rather than in parallel with the Sheet.
  // It owns rate limiting, and a throttled request has to be able to stop the
  // Sheet write too — running them together would mean a flood still filled the
  // spreadsheet with junk even while the API was busy rejecting it.
  let joined = null;
  try {
    joined = await joinViaApi(email, clientIp(req));
  } catch (error) {
    console.error('[waitlist] join API threw:', error.message);
  }

  if (joined?.rateLimited) {
    return Response.json(
      { message: "That's a few too many tries — give it a minute and try again." },
      { status: 429 },
    );
  }

  // Skip the Sheet when the API already knew this address. The Sheet is a
  // safety net for addresses we might otherwise LOSE, and a repeat signup is
  // by definition already recorded — appending it again only creates a row
  // that has to be deduplicated later, and makes the sheet's length look like
  // a signup count when it is not.
  //
  // Note this is only knowable when the API answered. If it did not, we cannot
  // tell a duplicate from a new address, so we append: a redundant row is
  // trivial to clean up, a lost signup is not.
  let sheetOk = true;
  if (joined?.alreadyJoined) {
    console.log(`[waitlist] ${email} already on the list — skipping Sheet append.`);
  } else {
    try {
      await appendToSheet(email);
    } catch (error) {
      sheetOk = false;
      console.error('[waitlist] sheet append failed:', error.message);
    }
  }

  // Both stores failed — the one case where the signup is genuinely lost.
  if (!joined && !sheetOk) {
    return Response.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }

  return Response.json({
    message: 'Successfully added to waitlist',
    token: joined?.token ?? null,
    position: joined?.position ?? null,
    eligible: joined?.eligible ?? false,
    cap: joined?.cap ?? 1000,
    uploadPath: joined?.uploadPath ?? null,
    alreadyJoined: joined?.alreadyJoined ?? false,
  });
}
