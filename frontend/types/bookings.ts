// Shared types for the Bookings feature.

export type FormType = 'facility' | 'zakat' | 'enrollment';

// Optional Google Calendar event the backend can create for time-based
// bookings (e.g. Facility). Times are ISO strings computed on the device.
export type BookingCalendarInfo = {
  title: string;
  startISO: string;
  endISO: string;
  description?: string;
};

// A submission the app POSTs to the Apps Script endpoint. `fields` is an
// ordered, human-readable map — its keys become spreadsheet columns and email
// lines exactly as written, so label them the way staff should read them.
export type BookingSubmission = {
  formType: FormType;
  // Human label; also used as the spreadsheet tab name (e.g. "Facility Booking").
  serviceLabel: string;
  fields: Record<string, string | number>;
  calendar?: BookingCalendarInfo;
};

export type SubmitResult = { reference: string };
