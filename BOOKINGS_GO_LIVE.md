# MDI Bookings — Going Live on the Masjid's Google Account

**What this is:** the Bookings & Services system is already built and has been
tested end-to-end on a throwaway Google account — a real booking created a sheet
row, sent the email, and made a calendar event. This guide is how to set the same
thing up properly on the masjid's own `@daruliman.org` account, and *why* each
step matters. Budget about **45 minutes** once you have account access.

For the exact click-by-click on each screen, see
[`BOOKINGS_START_HERE.md`](BOOKINGS_START_HERE.md). This guide is the plain-English
version with the reasons and the lessons we learned while testing.

---

## The idea in one paragraph

Every booking the app sends goes to **one masjid-owned Google account** — the
"engine account." That account owns a Google Sheet and a small script (already
written) that does three things for each booking: saves a row, emails the right
inbox, and (for facility bookings) adds a calendar event. Prices live in the
sheet, so staff can change them without a developer. Right now the app just isn't
pointed at a real engine account yet — connecting it is two short values at the
end.

**Why a dedicated engine account:** the sheet, the script, the calendar, and the
outgoing emails all need one owner. If that owner is a personal account or a
staff member who later leaves, the masjid loses the whole booking system. Tie it
to a masjid-owned account and it stays under masjid control for good.

---

## Step 1 — Pick the engine account

You need one masjid-owned Google account to own everything.

- **Best:** a masjid `@daruliman.org` account — ideally a shared or role account
  (like `admin@` or a new `bookings-system@`) rather than one person's mailbox.
- **If nobody can give you the login:** have a staff member who has access sit
  with you and do the clicks.
- **If `@daruliman.org` isn't on Google at all** (it's Outlook or similar): make
  one dedicated free Gmail, owned by the masjid, and keep the password in the
  masjid's password manager.

Not sure if you're on Google? Ask whoever runs the email: *"Do we log into our
`@daruliman.org` email through Gmail?"* If yes, you can use it.

**One important note:** the test we did on a personal Gmail is throwaway. You
don't move it over — Google Sheets and scripts don't transfer cleanly between
accounts. You simply rebuild these steps on the real account. It's quick, and the
test already proved the system works.

---

## Step 2 — Check the account is allowed to publish the script

Later (Step 6) you'll publish the script and set who can reach it to **"Anyone."**
Some workplace Google accounts block that by policy.

You'll find out at Step 6: if the only option offered is *"Anyone within
daruliman.org"* instead of plain *"Anyone,"* the account is blocked. If that
happens, switch to a dedicated Gmail (Step 1) — a personal Gmail has no such
limit.

**Why it matters:** the phone app isn't logged into Google, so the script has to
be publicly reachable, or the app can't talk to it. It's kept safe by a password
(Step 5), not by a Google login.

---

## Step 3 — Create two inboxes

You want bookings to land somewhere other than `info@`, and you want zakat kept
separate because it's sensitive.

Create two addresses:

- **`bookings@daruliman.org`** — everyday services (facility bookings, later
  enrollment).
- **`zakat@daruliman.org`** — zakat only.

On Google Workspace, ask the email admin to make these as **Google Groups**
(shared inboxes several people can read, with no extra logins) or as aliases. On
a plain Gmail, make two addresses or two Google Groups.

**Why keep zakat separate:** a zakat application shows someone's financial need.
Sending it to its own inbox (and its own sheet, next step) limits who can see it
to the people who actually handle zakat.

Write both addresses down — you'll paste them into the script in Step 5.

---

## Step 4 — Create two spreadsheets

**The main sheet.** Go to sheets.google.com, make a blank spreadsheet, and name
it **`MDI Bookings`**. Leave it completely empty — the script builds the columns
and tabs itself. Keep it open; the script goes inside it in Step 5.

**The confidential zakat sheet.** Make a second blank spreadsheet named **`MDI
Zakat (Confidential)`**. Share it with only the zakat handlers (as Editor).
Then copy its ID from the address bar — it's the long code between `/d/` and
`/edit` in the URL. Write it down.

**Why a separate file for zakat, not just a separate tab:** you can't lock down
one tab inside a sheet — anyone who can open the file sees every tab. A separate
file is the only real way to limit who sees zakat data.

**Lesson from testing:** bookings show up in a **new tab named after the service**
(like `Facility Booking`), added at the **bottom** of the tab bar — not in the
default `Sheet1`. If a booking looks missing, check the tabs along the bottom and
refresh the page. This tripped us up during testing and looked like a bug when it
wasn't.

---

## Step 5 — Add and set up the script

1. In the `MDI Bookings` sheet, open **Extensions → Apps Script**. Delete the
   little starter code so the editor is empty.
2. Open [`backend/bookings-apps-script/Code.gs`](backend/bookings-apps-script/Code.gs)
   in this project, copy all of it, and paste it into the editor.
3. At the top, fill in the `CONFIG` block:
   - `SHARED_SECRET` — a long random password you make up (see below).
   - `BOOKINGS_EMAIL` — your bookings address from Step 3.
   - `ZAKAT_EMAIL` — your zakat address from Step 3.
   - `ZAKAT_SPREADSHEET_ID` — the ID from Step 4.
   - Leave `ENABLE_CALENDAR` off for now (Step 8 turns it on).
4. Save.

**Why the secret:** it's a made-up password that must match a value in the app.
The app sends it with every booking, and the script rejects anything that doesn't
match — that's what stops random spam. It's not high security (a copy ships
inside the app), so it just needs to be long and hard to guess. You invent it
here; it doesn't come from anywhere.

**Why the zakat spreadsheet ID:** it's the one switch that sends zakat to its
confidential file. Leave it blank and zakat lands in the main sheet with
everything else, which defeats the purpose.

**Double-check the email domains.** This is the mistake we hit in testing: it's
easy to change the name part of the address but leave the placeholder ending
`@example.com`. Mail to `@example.com` goes nowhere, so no emails arrive. Make
sure both addresses end in your real domain (`@daruliman.org` or `@gmail.com`).

Write your secret down.

---

## Step 6 — Publish the script

1. Click **Deploy → New deployment**, choose type **Web app**.
2. Set **Execute as: Me** and **Who has access: Anyone**, then **Deploy**.
3. When Google warns *"Google hasn't verified this app,"* that's normal (the
   masjid wrote it): click **Advanced → Go to… → Allow**.
4. Copy the **web app URL** — it ends in `/exec`. Write it down.

**Why those two settings:** "Execute as Me" means the script runs as the engine
account, so it uses the engine's sheet, calendar, and email. "Anyone" is what
lets the phone app reach it (it's protected by your secret, not a login). If
"Anyone" isn't offered, see Step 2.

**The rule everyone forgets:** any time you change the script later — a price, an
email, the calendar toggle — it does **not** go live until you re-publish. Go to
**Deploy → Manage deployments → Edit → Version: New version → Deploy.** Just
saving is not enough. During testing, our emails kept going to the wrong address
for a while simply because the fix hadn't been re-published.

---

## Step 7 — Connect the app

Two values from above go into [`frontend/app.config.ts`](frontend/app.config.ts):

- the `/exec` URL from Step 6 → `BOOKINGS_ENDPOINT`
- the secret from Step 5 → `BOOKINGS_SECRET`

**Watch out — these are two different things.** The endpoint is the URL; the
secret is the password. If you paste the URL into both by mistake, the app sends
the URL as its password and every booking is rejected with *"This app version is
not authorized to submit."* The secret also has to match the script exactly — a
stray space or a curly quote will fail. (We hit both of these in testing.)

Easiest path: hand the two values to the developer, who wires them in and ships
the app update. (This one is a code change, not an instant spreadsheet change, so
it needs a new app build.)

Until this is done, the booking forms just show a friendly "not available yet"
message, so it's safe to ship the app before this step.

---

## Step 8 — Optional: a shared calendar

Only if the masjid wants facility bookings to appear on a shared calendar, to
help avoid double-booking a hall.

Make a new calendar at calendar.google.com (name it `MDI Facility Bookings`),
copy its Calendar ID from its settings, then in the script's `CONFIG` set
`ENABLE_CALENDAR` to true and paste the ID into `CALENDAR_ID`. Save and
**re-publish a new version** (Step 6).

Bookings then show up as tentative events titled `⏳ PENDING — …`. Staff mark
them confirmed after approving — because a submission is a request, not a
confirmed booking.

---

## Step 9 — Test it

1. In the app, submit a **Facility Booking**. Check all four: the app shows a
   reference number, a row appears in a `Facility Booking` tab (check the bottom
   tabs and refresh), an email arrives at `bookings@`, and — if you did Step 8 —
   a tentative calendar event appears.
2. Submit a **Zakat Application**. Confirm it lands in the confidential zakat
   file (not the main sheet) and emails `zakat@`.
3. Edit a price in the `Pricing` tab and reopen the facility form — the estimate
   should update, with no app change. That proves staff can manage prices
   themselves.

**Lesson from testing:** the first email may land in **Spam** — check there once
before assuming it failed. And remember the notification goes to the masjid
inbox, *not* to the email the applicant typed into the form.

---

## Changing prices later — no developer needed

All prices live in the `Pricing` tab of `MDI Bookings`. Change a number and the
app uses it the next time the form opens. To add an item, add a row with a new
unique `Key`; to retire one, set its `Active` column to `no`. Don't edit the
`Key` column. If the sheet is ever unreachable, the app falls back to the last
prices it saw, so the form never breaks — and the office confirms the real total
anyway, so the in-app number is only an estimate.

Already fixed for you: an earlier version showed `#ERROR!` on one price note
because a value starting with `+` was read as a spreadsheet formula. The script
now stores such values as plain text (which also protects phone numbers like
`+1…` and blocks bad input from running as a formula).

---

## Things to confirm with the masjid

Blocks launch:
- Is `@daruliman.org` on Google Workspace, and who administers it?
- Can `bookings@` and `zakat@` be created, and who monitors each?
- Is verifying zakat identity in person OK, so we don't store SINs? Exactly who
  may see zakat applications?
- Are the halls, capacities, and prices still current? Who approves facility
  bookings?
- Confirm the funeral coordinator's name, number, and 24/7 availability (the app
  currently dials 647-233-4766).

Soon / later:
- Sports (Skedda): who administers it, does the plan include API access, and are
  bookings paid? This decides whether we can build a native form instead of
  linking out.
- Enrollment: which programs are open and what does each need? (The screen is
  built but hidden until answered.)
- Nikah: simple booking request, or full legal intake? (Parked for a supervisor
  conversation.)
- Does the Privacy Policy need updating to cover booking data?

---

## Ownership and privacy

Keep the engine account's password in the masjid's password manager, not in one
person's head. Review who's on the `zakat@` inbox and the confidential sheet from
time to time. And don't commit the real secret, `/exec` URL, or calendar/zakat
IDs into the code repo — those belong in the deployed script and the built app,
with the repo left on placeholder values.

---

## The finish line

Once Steps 1–7 are done on the engine account, the developer needs just two
things to switch it on: the `/exec` URL (`BOOKINGS_ENDPOINT`) and the secret
(`BOOKINGS_SECRET`). Everything else — prices, who gets notified, the calendar —
is yours to manage from Google, with no developer needed.
