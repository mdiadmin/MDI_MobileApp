import Constants from 'expo-constants';
import { BookingSubmission, SubmitResult } from '@/types/bookings';

const ENDPOINT = (Constants.expoConfig?.extra?.bookingsEndpoint as string) ?? '';
const SECRET = (Constants.expoConfig?.extra?.bookingsSecret as string) ?? '';

// Thrown when the backend hasn't been connected yet (see BOOKINGS_START_HERE.md,
// Step 7). Screens use this to show a "not available yet" message rather than a
// generic failure.
export class BookingsNotConfiguredError extends Error {
  constructor() {
    super('Bookings are not set up yet.');
    this.name = 'BookingsNotConfiguredError';
  }
}

export function isBookingsConfigured(): boolean {
  return ENDPOINT.trim().length > 0;
}

// Submits a booking to the Google Apps Script endpoint and returns its
// reference number. Throws BookingsNotConfiguredError if the endpoint is unset,
// or a plain Error on a network/server failure so callers can offer a retry.
export async function submitBooking(submission: BookingSubmission): Promise<SubmitResult> {
  if (!isBookingsConfigured()) {
    throw new BookingsNotConfiguredError();
  }

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      // text/plain avoids a CORS preflight on web; on native it's irrelevant.
      // Apps Script reads the raw body regardless of content type.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret: SECRET, ...submission }),
    });
  } catch {
    throw new Error('Could not reach the server. Please check your connection and try again.');
  }

  if (!response.ok) {
    throw new Error(`The server rejected the request (status ${response.status}).`);
  }

  let data: { ok?: boolean; reference?: string; error?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error('The server sent an unexpected response. Please try again.');
  }

  if (!data.ok || !data.reference) {
    throw new Error(
      data.error === 'unauthorized'
        ? 'This app version is not authorized to submit. Please contact the masjid.'
        : 'Your request could not be saved. Please try again.'
    );
  }

  return { reference: data.reference };
}
