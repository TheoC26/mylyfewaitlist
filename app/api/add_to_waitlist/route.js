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

async function joinViaApi(email) {
  if (!API_BASE || !process.env.WAITLIST_API_SECRET) {
    console.warn('[waitlist] API base or secret unset — recording in the Sheet only.');
    return null;
  }

  const res = await fetch(`${API_BASE}/api/waitlist/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Server-only. If this ever picks up a NEXT_PUBLIC_ prefix it ships to
      // every browser, and anyone can mail the entire list.
      'x-waitlist-secret': process.env.WAITLIST_API_SECRET,
    },
    body: JSON.stringify({ email, source: 'web' }),
    signal: AbortSignal.timeout(8000),
  });

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

  // Both run; neither is allowed to sink the other.
  const [apiResult, sheetResult] = await Promise.allSettled([
    joinViaApi(email),
    appendToSheet(email),
  ]);

  const joined = apiResult.status === 'fulfilled' ? apiResult.value : null;

  if (apiResult.status === 'rejected') {
    console.error('[waitlist] join API threw:', apiResult.reason?.message);
  }
  if (sheetResult.status === 'rejected') {
    console.error('[waitlist] sheet append failed:', sheetResult.reason?.message);
  }

  // Both stores failed — the one case where the signup is genuinely lost.
  if (!joined && sheetResult.status === 'rejected') {
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
