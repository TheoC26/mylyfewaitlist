
import { google } from 'googleapis';
import path from 'path';

export async function POST(req) {
  const { email } = await req.json();

  if (!email) {
    return new Response(
      JSON.stringify({ message: 'Email is required' }),
      { status: 400 }
    );
  }

  try {
    let auth;
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      const credentialsPath = path.join(process.cwd(), 'google-credentials.json');
      auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    }

    const sheets = google.sheets({ version: 'v4', auth });    const spreadsheetId = '1TJ4yFjPc-HjdnK4N1bzBCGvU7C3LkTGmIZRD2ApXFqc';
    const range = 'Sheet1!A:B'; // Assumes you want to write to columns A and B of "Sheet1"

    const now = new Date().toLocaleString('en-US', { timeZone: 'UTC' });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[email, now]],
      },
    });

    return new Response(
      JSON.stringify({ message: 'Successfully added to waitlist' }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ message: 'Error adding to waitlist' }),
      { status: 500 }
    );
  }
}
