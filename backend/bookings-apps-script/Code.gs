/**
 * MDI Bookings — Google Apps Script backend
 * ------------------------------------------------------------------
 * Receives booking submissions from the MDI mobile app and:
 *   1) stores each one as a row in a per-service tab of a Google Sheet,
 *   2) emails a notification (bookings@ for everyday services, zakat@ for zakat),
 *   3) optionally creates a *tentative* Google Calendar event (Facility).
 *
 * Setup instructions: see BOOKINGS_START_HERE.md in the project root.
 * You only need to edit the CONFIG block just below.
 */

// ─── CONFIG — EDIT THESE FIVE VALUES ──────────────────────────────
var CONFIG = {
  // A made-up password. Must EXACTLY match `bookingsSecret` in the app's
  // frontend/app.config.ts. Anything else is rejected.
  SHARED_SECRET: 'CHANGE-ME-to-a-long-random-string',

  // Everyday service notifications (Facility, Enrollment, ...).
  BOOKINGS_EMAIL: 'bookings@example.com',

  // Zakat notifications (kept separate — sensitive financial data).
  ZAKAT_EMAIL: 'zakat@example.com',

  // ID of the separate "MDI Zakat (Confidential)" spreadsheet (the long part
  // of its URL between /d/ and /edit). Leave '' to keep zakat in THIS sheet
  // (not recommended).
  ZAKAT_SPREADSHEET_ID: '',

  // Optional calendar for time-based bookings (Facility). Leave disabled until
  // you've created a calendar and pasted its ID.
  ENABLE_CALENDAR: false,
  CALENDAR_ID: '' // e.g. 'abc123@group.calendar.google.com' or 'primary'
};
// ──────────────────────────────────────────────────────────────────

// GET endpoint. `?config=pricing` returns the current facility prices (from the
// staff-editable "Pricing" tab). Otherwise it's a health check.
function doGet(e) {
  if (e && e.parameter && e.parameter.config === 'pricing') {
    return json({ ok: true, pricing: readPricing() });
  }
  return json({ ok: true, service: 'MDI Bookings', time: new Date().toISOString() });
}

// Main entry point — the app POSTs here.
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (!CONFIG.SHARED_SECRET || body.secret !== CONFIG.SHARED_SECRET) {
      return json({ ok: false, error: 'unauthorized' });
    }

    var formType = String(body.formType || 'unknown');
    var serviceLabel = String(body.serviceLabel || formType);
    var fields = body.fields || {};

    var reference = makeReference(formType);
    writeRow(formType, serviceLabel, reference, fields);
    notify(formType, serviceLabel, reference, fields);

    if (CONFIG.ENABLE_CALENDAR && body.calendar) {
      createCalendarEvent(body.calendar, reference);
    }

    return json({ ok: true, reference: reference });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// e.g. FAC-20260722-143005
function makeReference(formType) {
  var prefixes = { facility: 'FAC', zakat: 'ZKT', enrollment: 'ENR' };
  var prefix = prefixes[formType] || 'BKG';
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
  return prefix + '-' + stamp;
}

// Zakat goes to its own spreadsheet (if configured); everything else stays here.
function targetSpreadsheet(formType) {
  if (formType === 'zakat' && CONFIG.ZAKAT_SPREADSHEET_ID) {
    return SpreadsheetApp.openById(CONFIG.ZAKAT_SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// Appends a row to a per-service tab, creating the tab + headers on first use.
// Adapts automatically to whatever fields the form sends.
function writeRow(formType, serviceLabel, reference, fields) {
  var ss = targetSpreadsheet(formType);
  var tabName = serviceLabel || formType;
  var sheet = ss.getSheetByName(tabName);
  var fieldKeys = Object.keys(fields);
  var baseHeaders = ['Timestamp', 'Reference #', 'Status', 'Assigned To', 'Staff Notes'];

  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.appendRow(baseHeaders.concat(fieldKeys));
    sheet.getRange(1, 1, 1, baseHeaders.length + fieldKeys.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Add any brand-new field columns to the end of the header row.
  fieldKeys.forEach(function (k) {
    if (headers.indexOf(k) === -1) {
      sheet.getRange(1, headers.length + 1).setValue(k).setFontWeight('bold');
      headers.push(k);
    }
  });

  var row = headers.map(function (h) {
    if (h === 'Timestamp') return new Date();
    if (h === 'Reference #') return reference;
    if (h === 'Status') return 'New';
    if (h === 'Assigned To' || h === 'Staff Notes') return '';
    return Object.prototype.hasOwnProperty.call(fields, h) ? fields[h] : '';
  });
  sheet.appendRow(row);
}

// Emails a readable notification to the right inbox.
function notify(formType, serviceLabel, reference, fields) {
  var to = (formType === 'zakat') ? CONFIG.ZAKAT_EMAIL : CONFIG.BOOKINGS_EMAIL;
  if (!to) return;

  var lines = [
    'A new ' + serviceLabel + ' was submitted from the MDI app.',
    '',
    'Reference: ' + reference,
    ''
  ];
  Object.keys(fields).forEach(function (k) {
    lines.push(k + ': ' + fields[k]);
  });
  lines.push('', 'Open the MDI Bookings spreadsheet to review and update its status.');

  MailApp.sendEmail(to, 'New ' + serviceLabel + ' — ' + reference, lines.join('\n'));
}

// ─── Pricing (staff-editable "Pricing" tab) ──────────────────────────────────
// Columns: Section | Key | Label | Price | Base | Mandatory | Note | Capacity |
//          Included | Active
// Section is one of: space | optional | av. Set Active to "no" to hide a row.
var PRICING_HEADERS = [
  'Section', 'Key', 'Label', 'Price', 'Base', 'Mandatory', 'Note', 'Capacity', 'Included', 'Active',
];

// Seed values — only written once, when the Pricing tab is first created. After
// that, staff edits win; this is never re-applied.
var DEFAULT_PRICING_ROWS = [
  ['space', 'hall1', 'Hall 1', '', 500, 125, 'Cleaning fee', 140, '140 chairs · 17 round tables · 8 serving tables (+ covers)', 'yes'],
  ['space', 'hall3', 'Hall 3', '', 700, 200, 'Cleaning fee', 300, '200 chairs · 25 round tables · stage · middle partition · 8 serving tables (+ covers)', 'yes'],
  ['space', 'kitchen', 'Kitchen Area', '', 50, 0, '', '', 'Use of the kitchen area', 'yes'],
  ['space', 'sound', 'Sound System & Podium', '', 150, 200, 'Security deposit', '', '1 wired microphone', 'yes'],
  ['optional', 'plasticCovers', 'Plastic table covers', 2.5, '', '', '', '', '', 'yes'],
  ['optional', 'clothCovers', 'Cloth table covers (white)', 7.5, '', '', '', '', '', 'yes'],
  ['optional', 'chairCoversNoSetup', 'Chair covers (no set-up)', 1.5, '', '', '', '', '', 'yes'],
  ['optional', 'chairCoversSetup', 'Chair covers (incl. set-up)', 2.5, '', '', '', '', '', 'yes'],
  ['optional', 'stageUnit', 'Additional stage unit (4′ × 4′)', 25, '', '', '', '', '', 'yes'],
  ['optional', 'stageBackdrop', 'Stage backdrop', 200, '', '', '', '', '', 'yes'],
  ['optional', 'partition', 'Additional set of partition (around hall)', 200, '', '', '', '', '', 'yes'],
  ['optional', 'servingTables', 'Additional serving tables', 10, '', '', '', '', '', 'yes'],
  ['optional', 'roundTables', 'Additional round tables (8 chairs incl.)', 10, '', '', '', '', '', 'yes'],
  ['optional', 'chafingDish', 'Chafing dish (incl. 1 fuel can)', 25, '', '', '', '', '', 'yes'],
  ['optional', 'fuelCan', 'Additional fuel can', 3, '', '', '', '', '', 'yes'],
  ['optional', 'teaPercolator', 'Tea percolator', 25, '', '', '', '', '', 'yes'],
  ['av', 'wiredMic', 'Additional wired microphone', 100, '', '', '', '', '', 'yes'],
  ['av', 'wirelessMic', 'Wireless microphone (+ $500 security deposit)', 200, '', '', '+ $500 deposit', '', '', 'yes'],
  ['av', 'wirelessMicExtra', 'Additional wireless microphone', 150, '', '', '', '', '', 'yes'],
  ['av', 'extraSpeaker', 'Extra speaker (on floor)', 100, '', '', '', '', '', 'yes'],
  ['av', 'tv', '75″ TV ×2 with HDMI (no camera/laptop provided)', 150, '', '', '', '', '', 'yes'],
  ['av', 'techSupport', 'Tech support (30 mins on site)', 75, '', '', '', '', '', 'yes'],
];

function ensurePricingSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Pricing');
  if (!sheet) {
    sheet = ss.insertSheet('Pricing');
    sheet.appendRow(PRICING_HEADERS);
    sheet.getRange(1, 1, 1, PRICING_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    DEFAULT_PRICING_ROWS.forEach(function (r) { sheet.appendRow(r); });
  }
  return sheet;
}

function readPricing() {
  var sheet = ensurePricingSheet();
  var values = sheet.getDataRange().getValues();
  var out = { spaces: [], optional: [], av: [] };

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var section = String(row[0] || '').trim().toLowerCase();
    var key = String(row[1] || '').trim();
    if (!key) continue;

    var active = String(row[9] || 'yes').trim().toLowerCase();
    if (active === 'no' || active === 'false') continue;

    if (section === 'space') {
      out.spaces.push({
        key: key,
        label: String(row[2] || ''),
        base: Number(row[4]) || 0,
        mandatory: Number(row[5]) || 0,
        mandatoryNote: String(row[6] || ''),
        capacity: Number(row[7]) || undefined,
        included: String(row[8] || ''),
      });
    } else if (section === 'optional' || section === 'av') {
      var item = {
        key: key,
        label: String(row[2] || ''),
        price: Number(row[3]) || 0,
        note: String(row[6] || ''),
      };
      (section === 'optional' ? out.optional : out.av).push(item);
    }
  }
  return out;
}

// Creates a tentative calendar event. Failures never break the submission.
function createCalendarEvent(cal, reference) {
  try {
    var calendar = CONFIG.CALENDAR_ID
      ? CalendarApp.getCalendarById(CONFIG.CALENDAR_ID)
      : CalendarApp.getDefaultCalendar();
    if (!calendar || !cal.startISO || !cal.endISO) return;

    calendar.createEvent(
      cal.title || ('PENDING — ' + reference),
      new Date(cal.startISO),
      new Date(cal.endISO),
      { description: (cal.description || '') + '\nReference: ' + reference }
    );
  } catch (err) {
    // Intentionally swallowed — a calendar hiccup must not lose the booking.
  }
}
