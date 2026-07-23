# Bookings — Build Playbook (Actionable Steps)

> Companion to [`BOOKINGS_PLAN.md`](BOOKINGS_PLAN.md) (the strategy). This file is
> the **sequenced, checkbox build guide**. Storage decision is settled: **the
> system of record is a spreadsheet ("everything on Excel")** — see Phase 1.
>
> **Legend:** ☐ = to do · 🔒 = sensitive data · 🌐 = needs external access / a
> non-code decision · ⛔ = blocked until someone provides info.

---

## Storage decision (confirmed): spreadsheet as the system of record

Staff wanted **everything in Excel**. That's the design:

- **Live store:** one **Google Sheet workbook** with **one tab per service**.
  Staff view/sort/filter it exactly like Excel and can **Download → .xlsx** any
  time. Each row is one submission with a **Status** column (`New` →
  `In progress` → `Done`) so nothing gets lost the way it does in `info@`.
- **How rows get there:** native app forms POST JSON to a **Google Apps Script
  Web App**, which appends the row to the right **per-service tab** and sends a
  notification email.
- **Routing (there aren't separate teams — the goal is just to keep service
  requests out of `info@`):**
  - **One dedicated inbox** — e.g. `bookings@` — receives *all* the everyday
    service notifications (Facility, Enrollment, etc.). `info@` keeps only
    general questions. Per-service **tabs** + a service tag in the email subject
    keep it understandable even though it's one inbox.
  - **Zakat is the exception** — it goes to a **separate `zakat@` inbox and a
    separate restricted sheet**, not for team reasons but because it holds
    financial-hardship data (and possibly SINs). Worth the separation long-term. 🔒
- **Optional — Google Calendar for time-based bookings:** the same Apps Script can
  auto-create a **Calendar event** (via `CalendarApp`) for bookings that have a
  date + time — mainly **Facility** — so staff get a visual schedule and catch
  clashes. Best created as **tentative**, then confirmed by staff. Sports already
  has Skedda's own calendar; Zakat/enrollment aren't events. 🌐 *(Confirm the
  masjid actually wants this — see Phase 1D.)*
- **If MDI is a Microsoft 365 shop instead of Google:** identical design, different
  plumbing — **Microsoft Forms → Excel workbook**, or a **Power Automate** HTTP
  flow writing to an Excel file on SharePoint/OneDrive (+ Outlook Calendar for
  the calendar option). Pick whichever account the masjid already owns.
  🌐 *(Decision needed — see Phase 0.)*

---

## Phase 0 — Decisions & access to secure first  🌐

Nothing server-side can start until these are answered. Chase them in parallel
with Phase 2 (app scaffolding, which doesn't depend on them).

- ☐ **Google vs Microsoft** for the spreadsheet + endpoint (Phase 1 plumbing depends on this).
- ☐ Create **two** destinations (not one per service — there are no separate teams): a dedicated **`bookings@`** (or `services@`) for everyday services, and a **separate `zakat@`** for the sensitive zakat data. Keep **`info@`** for general questions only.
- ☐ Name **who watches** the bookings inbox / sheet (and, separately, who handles zakat).
- ☐ **Google Calendar decision:** confirm whether confirmed time-based bookings (Facility) should also appear on a shared **Google Calendar** — see Phase 1D. 🌐
- ☐ **Nikah — deferred** (needs a supervisor sit-down; not in current scope). Parked under [Deferred / Parked](#deferred--parked).
- ☐ Get the **list of open programs + their intake fields** for enrollment. ⛔ blocks Phase 8.
- ☐ Confirm **Skedda** public booking URL(s) + per-space `spacefeatureids` + hours/pricing. ⛔ blocks Phase 7 sports card content.
- ☐ Confirm **funeral coordinator** name/number/hours + sign-off on "call, don't queue." ⛔ blocks Phase 6 copy.
- ☐ 🔒 **Zakat privacy decision** — see the SIN warning in Phase 5 before building.

---

## Phase 1 — Storage & backend (spreadsheet + routing endpoint)

### 1A — Build the master spreadsheet 🌐
- ☐ Create a Google Sheet named e.g. **"MDI Bookings"**. One tab per service.
- ☐ Every tab starts with these **operational columns**, then the service fields:
  `Timestamp | Reference # | Status | Assigned To | Staff Notes | …fields…`
- ☐ Create a **separate, restricted** workbook **"MDI Zakat (Confidential)"**, access limited to whoever handles zakat — separated for **privacy** (financial-hardship data), not because it's a different team. 🔒

**Facility tab columns** (from the real form — full spec in Phase 4):
`Timestamp | Ref# | Status | Assigned To | Notes | First | Middle | Last | Organization | Address | City | Province | Postal | Home Phone | Cell Phone | Email | Event Date | Set-up Time | Start Time | End Time | Clean-up Time | Event Type | Event Summary | Attendees Brothers | Attendees Sisters | Attendees Total | Halls/Spaces (Hall1/Hall3/Kitchen/Sound) | Optional Services (JSON list w/ qty) | AV Requirements (JSON list w/ qty) | Other Requests | Estimated Total | T&C Accepted | Waiver Accepted | Signature Name | Date Signed`

**Zakat tab columns** (restricted workbook) — see 🔒 SIN note in Phase 5:
`Timestamp | Ref# | Status | Assigned To | Notes | First | Middle | Last | Address | City | Province | Postal | DOB | Phone | #Dependents | Dependents (JSON) | Income:Current | Income:OtherHousehold | Income:ChildSupport | Income:ChildBenefit | Income:Welfare/OW | Trillium (Y/N + approx) | Tax Line150 Yr1 | Tax Line150 Yr2 | Exp:Rent | Exp:Food | Exp:Childcare | Exp:Transport | Exp:Insurance | Exp:Medical | Exp:Other | Certify | Attachments (Drive links) | Signature Name`

### 1B — Apps Script Web App (the endpoint) 🌐
- ☐ In the Sheet: **Extensions → Apps Script**. Add a `doPost(e)` that:
  - parses JSON, validates a shared secret (basic anti-spam),
  - generates a **Reference #** (e.g. `FAC-20260722-014`),
  - appends a row to the tab named by `formType`,
  - sends a notification email via `MailApp.sendEmail(routeFor(formType), …)`,
  - returns `{ ok: true, reference }`.
- ☐ `routeFor(formType)` is simple: **`zakat` → `zakat@`**, **everything else → `bookings@`**. (Not a per-service fan-out — just keeping service traffic and sensitive zakat data out of `info@`.) The **subject line carries the service name** so one inbox stays sortable.
- ☐ **Deploy → New deployment → Web app**, execute as *me*, access *Anyone*. Copy the `/exec` URL — this is `bookingsEndpoint` for the app.
- ☐ Attachments: accept uploaded files, save to a **Drive folder**, store the shareable link in the row. 🔒 (Zakat/Nikah docs.)
- ☐ Test with `curl`/Postman before wiring the app.

### 1C — Notifications
- ☐ Per-service email subject like `New Facility Booking — Ref FAC-…` so staff can filter one inbox.
- ☐ (Optional) Slack/WhatsApp webhook from the script for high-priority ones.

### 1D — Google Calendar (optional; time-based bookings only) 🌐
> Only if the masjid wants it (Phase 0 decision). Applies to **Facility** now
> (has date + times); potentially Nikah later. Sports is on Skedda already;
> Zakat/enrollment aren't events.
- ☐ Create/choose a shared calendar (e.g. **"MDI Facility Bookings"**).
- ☐ In the same Apps Script, on a facility submission also call `CalendarApp.getCalendarById(...).createEvent(...)` using the event date + set-up→clean-up times.
- ☐ Create it as **tentative** (title prefixed `⏳ PENDING —`) so an event ≠ a confirmed booking; staff flip it to confirmed after approval. Put the reference # + submitter in the event description.
- ☐ (Nice-to-have) write the created event's ID back to the sheet row so status changes can update/delete the event.

---

## Phase 2 — App plumbing (no backend dependency; start immediately)

- ☐ Add config in [`app.config.ts`](frontend/app.config.ts) → `extra.bookingsEndpoint` (+ `extra.bookingsSecret`), read via `Constants.expoConfig.extra` like `wpPostsUrl` already is.
- ☐ Add deps: `expo-document-picker`, `expo-image-picker`, an Expo-compatible date/time picker (e.g. `@react-native-community/datetimepicker`). (`expo-web-browser`, `expo-linking` already available.)
- ☐ `types/bookings.ts` — `FormType`, `BookingSubmission`, per-form payload types.
- ☐ `services/bookingsApi.ts` — single `submitBooking(formType, payload, files?)` that POSTs to `bookingsEndpoint`; returns the reference #; handles/retries failure.
- ☐ `constants/bookingsForms.ts` — declarative field definitions (label, type, required, options) so forms are data-driven.
- ☐ `components/forms/` primitives themed via [`constants/theme.ts`](frontend/constants/theme.ts): `FormTextField`, `FormPhoneField`, `FormDropdown`, `FormDatePicker`, `FormTimePicker`, `FormCheckbox`, `FormAttachment`, `FormSection`, `SubmitButton`, `RunningTotal`.
- ☐ Reuse existing [`LoadingState`](frontend/components/LoadingState.tsx) / [`ErrorState`](frontend/components/ErrorState.tsx) for submit/failure.

---

## Phase 3 — Bookings tab + hub

- ☐ Register `bookings` in [`app/(tabs)/_layout.tsx`](frontend/app/(tabs)/_layout.tsx) and add its icon to `TAB_ICONS` (e.g. `calendar-check`).
- ☐ Create the nested route:
  - ☐ `app/(tabs)/bookings/_layout.tsx` (Stack)
  - ☐ `app/(tabs)/bookings/index.tsx` — **hub**: cards for Facility, Zakat, Enrollment, Funeral, Sports, Counselling, Donate. *(Nikah deferred — see Deferred / Parked.)*
  - ☐ `app/(tabs)/bookings/submitted.tsx` — success screen: **reference #** + "what happens next" + "don't email info@; the team will contact you."
- ☐ `components/bookings/ServiceCard.tsx` — matches the [`QuickActions`](frontend/components/QuickActions.tsx) tile look.

---

## Phase 4 — Facility booking form  ✅ *fields fully known*

Route file: `app/(tabs)/bookings/facility.tsx`. `formType: "facility"`.
**Only the applicant-facing sections** — the PDF's "Office Use" + "Payment
Information" blocks are **staff-side** and belong in the spreadsheet, not the app.

- ☐ **Client Information:** First / Middle / Last name · Organization (optional) · Address · City · Province · Postal Code · Home Phone · Cell Phone · Email.
- ☐ **Event Information:** Date (DD/MM/YYYY) · Set-up / Start / End / Clean-up times (AM/PM) · Event Type · Event Summary · Attendees (Brothers, Sisters, auto Total).
- ☐ **Requested facilities** (multi-select with capacity + price shown):
  - Hall 1 (cap 140) — $500 + $125 cleaning = **$625**
  - Hall 3 (cap 300) — $700 + $200 cleaning = **$900**
  - Kitchen Area — **$50**
  - Sound System & Podium (1 wired mic) — $150 + $200 security deposit = **$350**
- ☐ **Optional services** (checkbox + quantity): plastic covers $2.50 · cloth covers $7.50 · chair covers no-setup $1.50 · chair covers w/setup $2.50 · stage unit 4×4 $25 · stage backdrop $200 · extra partition $200 · serving tables $10 · round tables (8 chairs) $10 · chafing dish $25 · fuel can $3 · tea percolator $25.
- ☐ **AV requirements** (checkbox + quantity): extra wired mic $100 · wireless mic (+$500 deposit) $200 · extra wireless mic $150 · extra speaker $100 · 75″ TV ×2 HDMI $150 · tech support (30 min) $75.
- ☐ **Other requirements** (free text).
- ☐ **`RunningTotal`** component: show a **live estimate** as they select (huge UX win over the PDF). Label it *"Estimate — final total confirmed by ICM office."*
- ☐ **Terms & Conditions + Waiver of Liability:** show the full text; require a checkbox ("I have read and agree") + typed full name as e-signature + auto date. Store `T&C Accepted`, `Waiver Accepted`, `Signature Name`, `Date Signed`.
- ☐ Show the key **policies inline** so they aren't a surprise: 10:30pm cutoff (+$50/hr after), $500 refundable deposit, $150 cancellation fee within 2 weeks, ICM dress-code/conduct rules, full payment at booking.
- ☐ On submit → `bookingsApi.submitBooking("facility", …)` → success screen.
- ☐ Routes to the dedicated **`bookings@`** inbox (keeps it out of `info@`), and **optionally creates a tentative Google Calendar event** (Phase 1D).

---

## Phase 5 — Zakat application form  ✅ *fields fully known* · 🔒 sensitive

Route file: `app/(tabs)/bookings/zakat.tsx`. `formType: "zakat"`.
**Writes to the restricted "MDI Zakat (Confidential)" workbook**, routes to
**`zakat@` only** — never CC `info@`.

### ⚠️ Read before building — two data-handling calls
- 🔒 **Social Insurance Number:** the paper form asks for a SIN. **Recommendation: do NOT collect SIN in the app.** Storing SINs in a spreadsheet is a serious privacy/liability risk. Either omit it and verify identity **in person**, or (if the committee insists) collect it through a properly secured channel — not a Sheet. **Get an explicit decision before coding this field.** 🌐
- ☐ **Tax "Line 150" years are hardcoded 2017/2018** on the PDF — make them **dynamic** ("last 2 tax years") in the app.

### Fields
- ☐ **Personal:** First / Middle / Last · Address (Street #, Street 1, Street 2) · City · Province · Postal · DOB (mm/dd/yyyy) · Phone number(s). *(SIN — see warning above.)*
- ☐ **Dependents** (repeatable list, "Add dependent"): First / Middle / Last · DOB · Student (Yes/No). Store count + JSON list.
- ☐ **Income (monthly):** Current income · Other household/family income · Child support · Child benefit (ON & Federal) · Welfare incl. Ontario Works · Trillium Drug Benefits (Yes/No + approx amount) · Tax return Line 150 for the last 2 years.
- ☐ **Expenses (monthly):** Rent · Food/Groceries · Childcare · Transportation · Insurance · Medical · Others (free text).
- ☐ **Supporting documents:** `FormAttachment` (proof of income, etc.) → Drive folder link. 🔒
- ☐ **Terms & Conditions:** three checkboxes (certify accurate · falsified info → declined + legal action · MDI may verify) + typed full name.
- ☐ **Privacy notice** on screen: who can see this, that it's stored securely, that it's used only for zakat assessment.
- ☐ Route to **`zakat@`** (restricted).

---

## Phase 6 — Funeral (info + one-tap call, **NOT a form**)

Route file: `app/(tabs)/bookings/funeral.tsx`. No submission.

- ☐ Prominent **"Call funeral coordinator (24/7)"** button → `Linking.openURL('tel:…')` (confirm number in Phase 0).
- ☐ Optional **WhatsApp / email** buttons.
- ☐ Static, **offline-available** checklist: required IDs; the three forms (Statement of Death – Form 15, Family Questionnaire, Burial Services & Cemetery Info); what ICM/ISM handle (ghusl, shroud, Janazah).
- ☐ One line: *"During a bereavement, please call — don't wait on a form."*

---

## Phase 7 — Sports, Counselling, Donate (link-outs, reuse `WebBrowser`)

- ☐ **Sports card** → `WebBrowser.openBrowserAsync(SKEDDA_URL)` (system browser, per the [`DonateBanner`](frontend/components/DonateBanner.tsx) rationale — saved logins & Apple/Google Pay work there, not in a WebView). Deep-link a space via `?spacefeatureids=…`. 🌐 confirm URLs/IDs.
- ☐ Sports **info** (static): facilities (basketball, soccer, karate, badminton), hours, pricing — 🌐 verify (`icmsportscomplex.com` blocked automated access).
- ☐ **Counselling card** → `WebBrowser.openBrowserAsync('https://www.happystrongfamily.com/')`.
- ☐ **Donate card** → reuse the existing IRM URL from `DonateBanner`.

---

## Phase 8 — Program enrollment  ⛔ *blocked on field lists*

- ☐ `app/(tabs)/bookings/enrollment.tsx`, `formType: "enrollment"`: one reusable form, program passed as a route param; show only **open** programs. Fields (pending confirmation): student name, DOB/age, parent/guardian + contact, program, level/notes, medical/allergy notes for youth. 🔒 child data. Routes to the shared **`bookings@`** inbox (own tab; no separate team).

> **Nikah is out of current scope** — parked pending a supervisor discussion. See [Deferred / Parked](#deferred--parked) at the end for the preserved research.

---

## Phase 9 — QA, privacy, launch

- ☐ Field validation on every form (required, email/phone format, no past dates).
- ☐ Submit-failure UX: keep the draft, offer retry — never silently lose a filled form.
- ☐ End-to-end test: submit each form → row lands in the correct **tab** → notification hits the right inbox (`bookings@`, or `zakat@` for zakat) → reference # shows in-app. If Calendar (1D) is on, a tentative event appears for Facility.
- ☐ 🔒 Confirm Zakat submissions land **only** in the restricted workbook/inbox.
- ☐ Verify **nothing routes to `info@`** except the (still web-based) general-question path.
- ☐ Add spam protection on the endpoint (shared secret + honeypot/rate-limit).
- ☐ Short **privacy note** in Settings covering what booking data is collected and where it goes.
- ☐ Update [`REMEDIATION.md`](REMEDIATION.md) / release notes; ship behind the `production` variant only after the endpoint is live.

---

## Deferred / Parked

*Not in the current scope, the Bookings hub, or the build order. Research kept here so nothing is lost when it's picked up.*

### Nikah service — parked pending a supervisor discussion

Deliberately deferred: it needs a proper sit-down with the supervisor before any
build. **Why it's not just another form:** what was provided is the **Nikah Nama /
Marriage Certificate** (Rules 8 & 10, Muslim Family Ordinance 1961) — a legal
document completed at/after the ceremony, ending in wet **signatures** (bride,
groom, both wakeels, witnesses, officiant) and the **Registrar's seal**. An app
can't issue that; at most it could *pre-collect the data* for the imam's office
to print and sign in person. **Do not** collect signatures or imply the app
issues a marriage certificate.

**Questions to settle with the supervisor:**
- How is this Pakistani-jurisdiction form used at ICM (Markham, Ontario)? Should the Ward / Tehsil / Union / Police-station location fields (field 1) be adapted or dropped?
- Should the sensitive polygamy / Arbitration-Council fields (21–22) be collected in-app at all, or only in person? 🔒
- Desired scope: a simple **booking request** (just schedule the nikah), or full **Nikah Nama data intake** the office prints for signing?

**Captured field reference (25 fields), for when it's revived:**
- Location (1): Ward · Town/Union · Tehsil · Police Station · District.
- Bridegroom (2,3,9,10): name, father, residence · DOB/age · wakeel (name, father, residence) · witnesses to that appointment (repeatable).
- Bride (4,5,6,7,8): name, father, residence · status Virgin/Widow/Divorced · DOB/age · wakeel · witnesses to that appointment (repeatable).
- Witnesses to the marriage (11): name, father, residence (repeatable, ~2).
- Date solemnized (12).
- Mahr/Dowery (13–16): amount · paid vs deferred · portion paid at time · property in lieu (with valuation).
- Conditions (17–20): special conditions · talaq-e-tafweez + terms · husband's divorce right curtailed? · separate guarantee/maintenance document.
- 🔒 Existing marriage/polygamy (21,22): existing wife? Arbitration-Council permission + communication no./date.
- Officiant (23): name, father, address.
- **In-person only (never an app field):** registration date & fee (24–25) + all signatures + Registrar's seal.

---

## Quick status of source material

| Service | Fields known? | Source |
|---|---|---|
| Facility booking | ✅ Complete | Attached PDF |
| Zakat application | ✅ Complete (mind the 🔒 SIN decision) | Attached PDF |
| Funeral | ✅ (no form — call flow) | daruliman.org |
| Sports | ⚠️ Link-out; need Skedda URLs/IDs + hours/pricing | Skedda / ICM (site blocked) |
| Counselling / Donate | ✅ Link-outs | Existing |
| **Nikah** | ⏸️ **Deferred** — parked pending supervisor. Fields captured (see Deferred / Parked) | Screenshots provided |
| Enrollment | ⛔ Need open-program list + intake fields | Iman Academy |

---

### Recommended build order
**Phase 0 (in parallel) → 1 → 2 → 3 → 4 (Facility, the highest-volume pain) →
5 (Zakat) → 6 (Funeral) → 7 (link-outs) → 8 (Enrollment once unblocked) →
9.** Shipping Phases 1–4 alone already pulls the biggest chunk of traffic out of
`info@` — that's the win to demo to your supervisor first. *(Nikah is parked —
see Deferred / Parked.)*
