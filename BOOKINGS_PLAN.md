# Bookings & Services — Implementation Plan

> Status: **Planning only. Nothing implemented yet.**
> Branch: `bookingTab`
> Author's goal: Add a **Bookings** tab so users can complete masjid service
> forms *inside the app*, with each submission routed to the right place —
> **not** dumped into `info@daruliman.org` where it competes with general
> questions and has to be sifted by hand.
>
> ⏸️ **Scope note:** **Nikah is deferred** — it needs a supervisor sit-down before
> any build (it's a *legal marriage certificate*, not a simple form). It stays in
> this document as a candidate service for context, but it is **not** in the
> current build scope. See the parking details in
> [`BOOKINGS_BUILD_STEPS.md`](BOOKINGS_BUILD_STEPS.md#deferred--parked).

---

## 1. The real problem we're solving

Today, for most services the flow is:

1. User visits daruliman.org, downloads a **PDF** (Facility Booking, Zakat, Nikah).
2. Prints / fills it, then **emails it to `info@daruliman.org`**.
3. Staff manually read `info@`, which *also* receives every general question,
   so booking requests get buried and mis-triaged.

The supervisor's actual ask is **routing + structure**, not just "put a form in
the app." So the plan is built around two principles:

- **P1 — Keep service requests out of `info@`.** There aren't separate teams to
  route to — the point is simply that booking/service submissions land in a
  **dedicated place** (a `bookings@` inbox + the spreadsheet) instead of `info@`,
  which keeps *only* general questions. Submissions stay **organized by service**
  via per-service tabs, so a varied set of services is still easy to read.
  **Zakat is the one exception routed separately** (`zakat@` + a restricted
  sheet) — for privacy of financial-hardship data, not because it's a different
  team.
- **P2 — Make email a notification, not the system of record.** Every
  submission is stored in a place staff can **filter, sort, and mark "done"**
  (a spreadsheet — optionally with a **Google Calendar** for time-based bookings
  like Facility). Email just pings that a new one arrived.

Everything below serves those two principles.

---

## 2. Audit — what each service is today

| Service | Current mechanism | Time-sensitive? | Sensitive data? | Where it goes today |
|---|---|---|---|---|
| **Facility / hall booking** | Downloadable PDF (`ICM Facility Booking Form_2023-New.pdf`) | No | Low | `info@daruliman.org` |
| **Nikah (marriage)** | "Nikah Form" (PDF/link) | Somewhat | Medium (IDs, witnesses) | `info@` / imam |
| **Funeral / Janazah** | **Manual** — 24/7 coordinator (Imamuddin Khan, 647‑233‑4766); staff fill forms *with* the family | **Critical (hours matter)** | High | Direct phone |
| **Zakat application** | Downloadable PDF (`Zakat-Application.pdf`) | No (but needful) | **High (financial hardship)** | `info@` / zakat committee |
| **Iman Academy enrollment** (Hifz, Madrasa, Sunday School, Summer Camp, Seniors Tajweed) | Program registration | Seasonal | Medium (child info) | Academy staff |
| **Counselling** | Link to external provider (happystrongfamily.com) | Varies | — | External site |
| **Donations** | External portal (app.irm.io) — **already in app** via `DonateBanner` | No | Payment | IRM (handled) |
| **Sports facility booking** | **Skedda** (mdisports.skedda.com) — own accounts, rules, payments | Real-time slots | Payment | Skedda |

**Design takeaway:** these are *not* all the same problem. Some should become
native in-app forms; some should **link out** to systems that already do the job
better than we could rebuild; and one (funeral) should **not** be a form at all.

---

## 3. The core decision — rebuild vs. link out

We do **not** rebuild systems that already work as hosted products. We rebuild
the painful PDF-and-email flows.

| Service | Approach | Why |
|---|---|---|
| Facility booking | **Native in-app form** | The worst PDF/email offender; high volume; structured fields. |
| Zakat application | **Native in-app form** (+ document attach) | Sensitive; needs private routing off `info@`. |
| Nikah request | ⏸️ **Deferred** (was: native request form) | It's a legal marriage certificate — needs a supervisor discussion before any build. |
| Program enrollment | **Native in-app form** (per active program) | Seasonal, structured, child data. |
| Funeral | **Not a form — one-tap "Call coordinator now" + info sheet** | Time-critical; a form that sits in a queue could cause real harm. |
| Counselling | **Link out** (`WebBrowser`) to happystrongfamily.com | It's a third-party provider; nothing to rebuild. |
| Donations | **Already done** (`DonateBanner` → IRM) | Reuse; maybe surface a shortcut in the Bookings hub. |
| **Sports booking** | **Link out** (`WebBrowser`) to **Skedda** | Skedda owns real-time availability, conflict rules, accounts, and payment. Rebuilding = re-implementing a paid SaaS. See §7. |

---

## 4. In-app architecture (frontend)

Follows the existing app conventions: `expo-router` file routes, the custom
arch tab bar in [`app/(tabs)/_layout.tsx`](frontend/app/(tabs)/_layout.tsx),
`WebBrowser.openBrowserAsync` for external links (as in
[`DonateBanner.tsx`](frontend/components/DonateBanner.tsx)), theme tokens from
[`constants/theme.ts`](frontend/constants/theme.ts), and backend config injected
through `app.config.ts` → `extra` (as `wpPostsUrl` already is).

### 4.1 Navigation shape — a "Bookings" hub, not 6 flat tabs

Add **one** tab, `Bookings`, that opens a **hub screen** listing service cards.
Each card pushes a detail/form screen. This scales to any number of services
without crowding the tab bar (which currently has 5 pointed-arch segments; a 6th
fits but is near the practical limit — a hub avoids ever needing a 7th).

```
app/(tabs)/
  _layout.tsx                 ← register "bookings" + add tab icon (e.g. 'calendar-check')
  bookings/
    _layout.tsx               ← Stack for the bookings section
    index.tsx                 ← HUB: cards for each service (+ Sports, Donate shortcuts)
    facility.tsx              ← Facility booking form
    zakat.tsx                 ← Zakat application form
    nikah.tsx                 ← Nikah request form
    funeral.tsx               ← Funeral info + "Call now" (NOT a form)
    enrollment.tsx            ← Program enrollment form (program chosen via param)
    submitted.tsx             ← Success screen (reference #, "what happens next")
```

### 4.2 Reusable pieces to build once

- `components/bookings/ServiceCard.tsx` — hub tile (matches `QuickActions` style).
- `components/forms/` — themed field primitives so every form looks native and
  consistent: `FormTextField`, `FormDropdown`, `FormDatePicker`,
  `FormDateTimePicker`, `FormAttachment` (doc/photo picker), `FormSection`,
  `SubmitButton`. Built on the existing theme tokens.
- `services/bookingsApi.ts` — **single** `submitBooking(formType, payload, files?)`
  that POSTs to one backend endpoint. Adding a new form later = a new screen +
  a new `formType` string, no new networking code.
- `constants/bookingsForms.ts` — declarative field definitions per form (labels,
  types, required, options) so forms are data-driven and easy to tweak.
- `types/bookings.ts` — `FormType`, `BookingSubmission`, per-form payload types.

### 4.3 Cross-cutting UX to get right

- **Validation** before submit (required fields, email/phone format, date not in
  the past). Native forms are the big UX win over PDFs — use it.
- **Attachments**: `expo-document-picker` / `expo-image-picker` for Zakat proof
  docs and Nikah IDs. (Uploading photos of documents beats printing a PDF.)
- **Offline / failure**: if submit fails, keep the draft and offer retry; never
  silently lose a filled form.
- **Confirmation**: show a reference number and a plain-language "the facilities
  team will email you within N business days" so users don't re-send to `info@`.
- **Sensitive-data notice**: a short line on Zakat/Nikah forms stating who can
  see the submission and that it's stored securely (see §8).
- **Accessibility & i18n**: labels and roles on every field; keep copy simple.

---

## 5. Backend — where submissions actually go (the important decision)

All native forms POST to **one endpoint** that (a) stores the submission and
(b) emails a **per-service** address. Here are the realistic options, cheapest/
fastest first.

### Option A — Google Forms (zero code) — *fastest possible, weakest UX*
Recreate each PDF as a Google Form; the app just opens it (`WebBrowser` or a
`WebView`). Responses auto-collect in a **Google Sheet**; per-form email
notifications route to the right staff.
- ➕ No backend code, no server, free, non-technical staff can manage it.
- ➖ Not native (generic Google UI), off-brand, weak in-app validation, clunky
  attachments. Doesn't feel like "a better system," just a relocated one.
- **Use as a Phase 0 stopgap** to kill the `info@` funnel *this week*, if needed.

### Option B — Native forms → **Google Apps Script Web App → Google Sheets** — *recommended MVP*
Native themed forms in the app POST JSON to a Google Apps Script web-app URL.
The script appends a row to a per-service **Sheet tab** and emails a
notification (`MailApp.sendEmail`) to the dedicated `bookings@` inbox (`zakat@`
for zakat). The Sheet *is* the staff dashboard (filter, sort, mark "Done",
share). The same script can optionally create **Google Calendar** events for
time-based bookings (Facility) via `CalendarApp`.
- ➕ Free, no server to run, best-in-class UX (fully native forms), trivial to
  add forms, spreadsheet dashboard is instantly usable by non-technical staff,
  routing is per-service out of the box.
- ➖ Needs a Google Workspace/account owner; attachments need a little extra
  (upload to Drive from the script, or store links); Apps Script quotas (fine at
  masjid volume).
- **This is the recommended balance of effort, cost, and "actually better."**

### Option C — Native forms → **WordPress plugin** (Fluent Forms / Gravity Forms) — *best "one house" integration*
The masjid already runs WordPress (the app reads announcements from its REST
API). A forms plugin gives per-form entries in **wp-admin**, per-form email
routing, file uploads, and a submit REST endpoint the app can POST to.
- ➕ Everything lives in the masjid's existing infrastructure and staff logins;
  no new vendor; announcements + bookings under one roof.
- ➖ Requires WP admin access and (often) a paid plugin tier; POSTing from the
  app needs a public submit endpoint with spam/abuse protection (nonce/App
  Password/CAPTCHA); staff must be comfortable in wp-admin.
- **Recommended if the supervisor wants everything inside WordPress** rather than
  a Google account.

### Option D — Airtable / Formspree / Supabase / Firebase / custom server
More power (status workflows, roles, automations) at more setup/cost. Overkill
for MVP; revisit only if they outgrow B or C.

### Recommendation
- **MVP:** **Option B (native forms → Apps Script → Sheets).** Fastest path to a
  genuinely better, native experience that keeps requests out of `info@`, with a
  usable per-service dashboard (and optional calendar), at zero cost.
- **If "keep it all in WordPress" is a hard requirement:** **Option C.**
- The app is written so the backend is **one function + one config URL**
  (`bookingsApi.ts` + an `extra.bookingsEndpoint`), so **switching B ↔ C later is
  a config change, not a rewrite.**

---

## 6. Per-service specifications

> Field lists below are the *proposed* intake for each form. The source PDFs
> should be opened to confirm exact fields before building (the Zakat/Facility
> PDFs didn't extract cleanly over the web — see §10 open items).

### 6.1 Facility booking → native form
- **Fields:** full name, email, phone, organization (optional), **space/room**
  (dropdown — needs the real list of bookable spaces), event type, **date**,
  **start/end time**, expected attendees, setup needs (tables/chairs/AV),
  catering (y/n), notes.
- **Routes to:** the dedicated **`bookings@`** inbox (a *new, dedicated* address —
  see §8) + optionally a Google Calendar event.
- **Confirmation copy:** "Availability isn't guaranteed until the facilities
  team confirms; they'll email you."

### 6.2 Zakat application → native form (sensitive)
- **Fields:** applicant name, contact, household size, monthly income vs.
  expenses, nature of need, amount requested, **supporting documents** (attach),
  consent/attestation checkbox.
- **Routes to:** a **separate `zakat@` inbox + restricted sheet** — do not CC
  `info@`. Separated for **privacy** (financial-hardship data), not team reasons.
- **Extra care:** privacy notice; restricted access to the zakat sheet (see §8).

### 6.3 Nikah request → ⏸️ DEFERRED (pending supervisor discussion)

> Parked — see [`BOOKINGS_BUILD_STEPS.md`](BOOKINGS_BUILD_STEPS.md#deferred--parked).
> Kept below for reference only; not in current scope.
- **Fields:** groom name/contact, bride name/contact, wali present (y/n) +
  details, two witnesses, preferred date(s), Muslim/marriage-license status,
  document checklist acknowledgement.
- **Routes to:** imam's office / nikah coordinator.
- **Note:** this books a *conversation*, not a confirmed ceremony slot.

### 6.4 Funeral → **info + immediate contact, NOT a form**
- One-tap **"Call funeral coordinator (24/7)"** (`Linking.openURL('tel:6472334766')`).
- Static, offline-available checklist: required IDs, the three forms (Statement
  of Death – Form 15, Family Questionnaire, Burial Services & Cemetery Info),
  what ICM/ISM handle (ghusl, shroud, Janazah). Optional email/WhatsApp buttons.
- **Rationale:** hours matter during a death; a queued form is the wrong tool and
  could cause harm. Confirm this framing with the coordinator.

### 6.5 Program enrollment → native form(s)
- One reusable form; the specific program passed as a route param. Fields:
  student name, age/DOB, parent/guardian + contact, program (Hifz / Part-Time
  Hifz / Evening Madrasa / Sunday School / Summer Camp / Seniors Tajweed),
  level/notes, medical/allergy notes (for youth programs).
- **Routes to:** the shared **`bookings@`** inbox (own tab; no separate team).
- Only show programs with **open registration**; hide the rest.

### 6.6 Counselling & Donations → link out (reuse existing pattern)
- Counselling → `WebBrowser.openBrowserAsync('https://www.happystrongfamily.com/')`.
- Donations → reuse the existing IRM link from `DonateBanner`; optionally surface
  a shortcut card in the Bookings hub.

---

## 7. Sports booking (ICM Sports Complex → Skedda)

**Recommendation: link out to Skedda; do not rebuild booking.**

Skedda (`mdisports.skedda.com`) is a hosted space-booking platform that owns
real-time availability, double-booking prevention, booking rules/quotas,
accounts, and (often) payment. Rebuilding that in the app would mean duplicating
a paid SaaS and keeping two sources of truth in sync — high effort, high risk.

- **MVP:** a "Book Sports Facilities" card in the Bookings hub that opens Skedda
  via `WebBrowser.openBrowserAsync(...)`. This mirrors the `DonateBanner`
  decision: external domain visible, and the system browser (SFSafariViewController /
  Chrome Custom Tabs) lets the user's saved login and Apple/Google Pay work —
  which they **don't** inside a `WebView`. Deep-link straight to a space using
  the `spacefeatureids` query param
  (`.../booking?spacefeatureids=81031`) so users land on the right court.
- **Nice-to-have (later):** if the masjid's Skedda plan includes API access, we
  could *read* availability to show an in-app preview ("Court 2 free at 6pm"),
  while the actual booking still completes in Skedda. Confirm plan/API before
  committing.
- **Info card:** show facilities (basketball, soccer, karate, badminton per
  daruliman.org), hours, and pricing as static content.

> ⚠️ `icmsportscomplex.com` returned **HTTP 403** to automated fetching, so I
> could not verify its hours/pricing/booking instructions. **Confirm these
> manually** (see §10).

---

## 8. Non-code setup / "external access" checklist

These are the things **you can't code** — they need accounts, admin access, or a
decision from the masjid. Get these lined up early; they gate the build.

| # | What's needed | Who provides it | Blocks |
|---|---|---|---|
| 1 | **Decide the backend**: Google (Option B) vs WordPress plugin (Option C) | Supervisor | Everything server-side |
| 2 | **Two new addresses** (or aliases): a shared `bookings@` for services + a separate `zakat@` for the sensitive data; keep `info@` for general Qs | Masjid IT / whoever owns daruliman.org email | Keeping requests out of `info@` (P1) |
| 2b | **Google Calendar decision** (optional): shared calendar for time-based bookings (Facility)? | Supervisor | Calendar integration |
| 3 | If Option B: a **Google account/Workspace** to own the Apps Script + Sheets, and a person to receive/triage each Sheet | Supervisor | MVP submissions |
| 4 | If Option C: **WordPress admin access** + chosen forms plugin (Fluent/Gravity) + a submit endpoint with spam protection | Masjid webmaster | MVP submissions |
| 5 | **Exact fields** from the current PDFs (Facility, Zakat, Nikah forms) | Download the real PDFs / ask coordinators | Building each form correctly |
| 6 | **List of bookable facility spaces/rooms** + any rules (deposit, min notice) | Facilities coordinator | Facility form dropdown |
| 7 | **Funeral coordinator sign-off** on the "call, don't queue" approach + correct phone/hours | Funeral coordinator (Imamuddin Khan) | Funeral screen |
| 8 | **Which programs have open registration** + their intake fields | Iman Academy | Enrollment form |
| 9 | **Skedda**: confirm public booking URL(s), per-space `spacefeatureids`, whether their plan has an API, and pricing/hours | Sports complex admin | Sports card |
| 10 | **Privacy stance** for sensitive forms (Zakat financials, Nikah/child data): who can access, retention, a short privacy notice | Supervisor / masjid | Zakat, Nikah, enrollment |
| 11 | **Spam/abuse protection** for whatever public submit endpoint we expose (rate limiting, honeypot, or CAPTCHA) | Backend owner | Public launch |

---

## 9. What needs to be **coded** (frontend)

Concrete, matching the existing structure:

- **Tab + routing**
  - Register `bookings` in [`app/(tabs)/_layout.tsx`](frontend/app/(tabs)/_layout.tsx) and add its icon to `TAB_ICONS`.
  - `app/(tabs)/bookings/_layout.tsx` (Stack) + `index.tsx` hub + the screen files in §4.1.
- **Reusable UI**
  - `components/bookings/ServiceCard.tsx`
  - `components/forms/*` field primitives (text, dropdown, date/time, attachment, section, submit) themed via `constants/theme.ts`.
- **Data & config**
  - `constants/bookingsForms.ts` (declarative field defs).
  - `types/bookings.ts`.
  - `services/bookingsApi.ts` (single `submitBooking()` → one endpoint).
  - Add `bookingsEndpoint` (+ any per-form config) to `app.config.ts` → `extra`, read via `Constants.expoConfig.extra` like `wpPostsUrl`.
- **Native modules to add**
  - `expo-document-picker`, `expo-image-picker` (attachments), `@react-native-community/datetimepicker` or an Expo-compatible date/time picker. `expo-web-browser` and `expo-linking` are already available/used.
- **Per-service screens**: facility, zakat, nikah, funeral (call/info), enrollment, submitted/success.
- **States**: reuse existing `LoadingState` / `ErrorState` components for submit
  progress and failures.

**What needs to be coded outside the app** (depends on §5 choice):
- Option B: a small **Apps Script** (`doPost` → append row + `MailApp.sendEmail`;
  optional Drive upload for attachments). ~1 file.
- Option C: WordPress **forms + a submit endpoint** config (mostly plugin
  configuration, minimal custom PHP if any).

---

## 10. Open questions / things to confirm before coding

1. **Backend choice** (Option B vs C) — the one decision everything hangs on.
2. **Exact PDF fields** for Facility, Zakat, and Nikah — the web fetch couldn't
   extract them reliably; open the real PDFs or ask the coordinators.
3. **Bookable facility spaces** and booking rules (deposit, minimum notice, who approves).
4. **Skedda specifics** — confirmed booking URL(s), per-space IDs, API availability, pricing/hours (couldn't verify; `icmsportscomplex.com` blocked automated access with a 403).
5. **Funeral approach** — confirm "call the coordinator" (not a queued form) is right, and the correct 24/7 number/hours.
6. **Open programs + intake fields** for enrollment, and whether child data needs guardian consent handling.
7. **Privacy/retention** rules for Zakat, Nikah, and child data, and the exact routing addresses to create.
8. **Tab vs hub confirmation** — one "Bookings" tab opening a hub of services (recommended), vs. surfacing individual services elsewhere.

---

## 11. Suggested phased roadmap

- **Phase 0 (optional, days):** stand up Google Forms for the top 1–2 forms to
  *immediately* divert bookings off `info@` while the native version is built.
- **Phase 1 — MVP (native):** Bookings hub tab; Facility + Zakat native forms →
  chosen backend (dedicated `bookings@`/`zakat@` + per-service dashboard, optional
  calendar); Funeral info/call screen; Sports + Counselling + Donate link-outs.
  **This alone solves the supervisor's core problem.**
- **Phase 2:** Program enrollment form; document attachments; confirmation
  reference numbers. *(Nikah remains deferred pending the supervisor discussion.)*
- **Phase 3:** Submission status/tracking; optional Skedda availability preview;
  richer staff dashboard (Airtable/WP workflow) if volume warrants.

---

### One-line summary
Add a single **Bookings** tab that opens a **hub** of service cards. Turn the
painful **PDF-email** services (Facility, Zakat, enrollment) into **native
in-app forms** that POST to **one backend** which **stores each submission in a
per-service spreadsheet and notifies a dedicated `bookings@` inbox** (`zakat@`
for the sensitive zakat data, optional Google Calendar for time-based bookings)
— pulling those requests out of `info@`. **Link out** to the systems that already
work well (**Skedda** for sports, IRM for donations, the external counsellor), and
make **Funeral** a one-tap call, not a queued form. *(Nikah deferred — see scope note.)*
