# MDI Bookings — Your Complete Setup Guide (START HERE)

> **This is the only file you need to follow.** Everything technical (the app
> screens + the backend script) is already built. Your job is to set up the
> **Google side** and hand two values back. Follow this top to bottom.
> Budget **~30–45 minutes** once you have account access.
>
> No coding knowledge needed. Where a term might be unfamiliar, it's explained
> inline. Nothing here is assumed — every click is written out.

---

## Contents

0. [What's live now, and what we left out](#0-whats-live-now-and-what-we-left-out) ← read first
1. [Before you start: the account decision](#1-before-you-start-the-account-decision) ← your main blocker
2. [Create the two notification emails](#2-create-the-two-notification-emails)
3. [Create the main booking sheet](#3-create-the-main-booking-sheet)
4. [Create the confidential Zakat sheet](#4-create-the-confidential-zakat-sheet)
5. [Add and configure the script](#5-add-and-configure-the-script)
6. [Publish the script (get the link)](#6-publish-the-script-get-the-link)
7. [Connect the app](#7-connect-the-app)
8. [Optional: Google Calendar](#8-optional-google-calendar)
9. [Test everything](#9-test-everything)
10. [Changing prices and details later](#10-changing-prices-and-details-later-no-developer)
11. [Questions to confirm with the masjid](#11-questions-to-confirm-with-the-masjid)
12. [Troubleshooting](#12-troubleshooting)

---

## 0. What's live now, and what we left out

### ✅ In the app right now (the "Bookings & Services" tab)
| Service | How it works |
|---|---|
| **Facility Booking** | Full in-app form → saved to the sheet + emailed. Live price estimate. |
| **Zakat Application** | Full in-app form (private) → separate confidential sheet + email. |
| **Funeral Services** | One-tap **call** to the coordinator + info checklist (not a form). |
| **Sports Booking** | Opens **Skedda** in the browser (their own booking system). |
| **Counselling** | Opens the external counselling provider's website. |

### ⏸️ What we deliberately LEFT OUT (so you remember)
| Left out | Why | What it needs to come back |
|---|---|---|
| **Nikah** | It's a legal marriage certificate (signatures + registrar seal), not a simple form. | A sit-down with your supervisor (see [Q section](#11-questions-to-confirm-with-the-masjid)). Fields are already researched and saved. |
| **Program Enrollment** | The academy hasn't confirmed which programs are open or what to ask. | The open-program list + fields. *(The screen is already built — it's just hidden from the tab.)* |
| **Donate button** | You asked to remove it from the Bookings tab for now. | It still exists on the **Home** screen. Say the word to re-add it. |
| **Document uploads** (e.g. Zakat proof-of-income) | Kept the first version simple and dependency-free. | Ask me to add file uploads (a follow-up build). |
| **SIN on the Zakat form** | Privacy/liability — storing SINs in a spreadsheet is risky. | Intentionally not collected; identity is verified in person. Only add if the zakat committee insists. |
| **Native Sports booking form** | Depends on Skedda's API and whether bookings are paid. | The Skedda API answers (see [Q section](#11-questions-to-confirm-with-the-masjid)). For now it links out. |
| **Google Calendar** | Built but off by default until you decide. | Turn it on in [Step 8](#8-optional-google-calendar) if the masjid wants it. |

---

## 1. Before you start: the account decision

Everything below needs **one masjid-owned Google account** that will own the
booking sheet, the script, and (optionally) the calendar, and will send the
notification emails. Call this the **"engine account."**

⚠️ You mentioned the masjid has a `@daruliman.org` email that **you don't have
access to.** So first, sort out which of these three paths you'll take:

| Path | When to use it | What you do |
|---|---|---|
| **A. Use the masjid's Google account** | The masjid runs on **Google Workspace** (staff log into Gmail with `@daruliman.org`) and someone can give you access. | Get logged into that account (or have the admin add you), then do all steps below in it. |
| **B. A staff member drives** | They can't give you the login, but someone with access can sit with you. | You guide them through Steps 2–8 on their screen. |
| **C. Make a dedicated Gmail** | The masjid email is **not** on Google, or nobody can grant access. | Create one new free Gmail (e.g. `mdi.bookings.system@gmail.com`) to be the engine account, and do everything in it. |

**How to tell if they're on Google Workspace:** ask whoever manages the website/
email, *"Do we log into our @daruliman.org email through Gmail?"* If yes →
Path A is possible. If they don't know or it's Outlook/other → Path C.

**Two things that are true no matter which path:**
- The notification emails (Step 2) are just **destinations** — they do **not**
  each need their own Google account.
- Emails will **appear to come from the engine account's address**, so if you go
  Path C, pick a sensible-looking address.

> **To create a new Gmail (Path C):** go to **accounts.google.com** →
> **Create account** → **For my own personal use** → enter a name → choose the
> address (e.g. `mdi.bookings.system`) → set a strong password (save it in the
> masjid's password manager) → complete phone verification. Stay logged into
> this account for everything below.

**✔️ Before moving on:** you are logged into the engine account in your browser.

---

## 2. Create the two notification emails

Goal: booking submissions land somewhere **other than `info@`**, so `info@` keeps
only general questions.

- **`bookings@`** — everyday services (Facility, later Enrollment).
- **`zakat@`** — zakat only (kept separate because it's sensitive).

Pick whichever row matches your situation:

| Situation | What to do |
|---|---|
| **Google Workspace** (custom `@daruliman.org`) | Ask the email admin to create `bookings@daruliman.org` and `zakat@daruliman.org` as **groups** or **aliases**, and add the right people as members. *(An "alias" = another address that drops into an existing inbox. A "group" = a shared address several people can read.)* |
| **No custom email / plain Gmail** | Create two addresses, e.g. `mdibookings@gmail.com` and `mdizakat@gmail.com`. **Or** use **Google Groups**: go to **groups.google.com → Create group**, name it, and add members — this gives a shared inbox without new logins. |

You just need **two working email addresses**. It's fine (to start) if they both
go to the same person — but keeping zakat separate is strongly recommended.

**✏️ Write these down — you'll paste them into the script in Step 5:**
- bookings email: `____________________`
- zakat email: `____________________`

---

## 3. Create the main booking sheet

1. Go to **sheets.google.com** (logged in as the engine account).
2. Click the **＋ Blank spreadsheet**.
3. Click the name **"Untitled spreadsheet"** (top-left) and rename it to
   **`MDI Bookings`**.
4. **Leave it empty.** You do **not** create any columns or tabs by hand — the
   script builds them automatically:
   - a tab per service (e.g. `Facility Booking`) the first time each form is
     submitted, and
   - a **`Pricing`** tab the first time the Facility form is opened.

Keep this browser tab open — you'll add the script to it in Step 5.

---

## 4. Create the confidential Zakat sheet

Zakat data is sensitive, so it lives in its **own** file that only the zakat
people can open.

1. Open a new tab → **sheets.google.com** → **＋ Blank spreadsheet**.
2. Rename it to **`MDI Zakat (Confidential)`**.
3. Click the green **Share** button (top-right). Add **only** the person/people
   who handle zakat, set their role to **Editor**, and click **Send**. Do **not**
   share it widely.
4. **Copy its ID.** Look at the address bar. The URL looks like:
   `https://docs.google.com/spreadsheets/d/`**`1AbCdEf... (long code) ...xYz`**`/edit`
   The **bold middle part** (between `/d/` and `/edit`) is the ID.

**✏️ Write it down:**
- Zakat spreadsheet ID: `____________________`

> Don't want a separate file yet? You can skip this and leave the ID blank in
> Step 5 — zakat will then save into the main sheet. **Separate is strongly
> recommended**, though.

---

## 5. Add and configure the script

An **Apps Script** is a small free program that lives inside a Google Sheet. Ours
receives each submission, saves it, and sends the email. It's already written —
you just paste it and fill in your details.

1. Go back to the **`MDI Bookings`** sheet.
2. Top menu → **Extensions → Apps Script**. A code editor opens in a new tab.
3. You'll see a little starter block like `function myFunction() {}`. **Select all
   of it and delete it** so the editor is empty.
4. In this project, open the file **`backend/bookings-apps-script/Code.gs`**,
   **select all**, **copy**, and **paste** it into the empty editor.
5. At the very top you'll see a block called `CONFIG`. Fill in the five values:

   ```js
   var CONFIG = {
     SHARED_SECRET: 'CHANGE-ME-to-a-long-random-string',   // ← make up a long password
     BOOKINGS_EMAIL: 'bookings@example.com',                // ← your bookings email (Step 2)
     ZAKAT_EMAIL: 'zakat@example.com',                      // ← your zakat email (Step 2)
     ZAKAT_SPREADSHEET_ID: '',                              // ← the ID from Step 4 (or leave '')
     ENABLE_CALENDAR: false,                                // ← leave false for now
     CALENDAR_ID: ''                                        // ← leave empty for now
   };
   ```
   - **`SHARED_SECRET`** — invent a long random string, like
     `mdi-bookings-7Qx2-9f3k-secret`. **Write it down** — it goes into the app in
     Step 7, and the two must match exactly.
   - Keep the single quotes `'...'` around each value.
6. Click the **💾 Save** icon (or press **Ctrl+S**).

**✏️ Write down:**
- Secret: `____________________`

---

## 6. Publish the script (get the link)

This turns the script into a web address the app can talk to.

1. In the Apps Script editor, click the blue **Deploy** button (top-right) →
   **New deployment**.
2. Click the **⚙️ gear icon** (next to "Select type") → choose **Web app**.
3. Fill in:
   - **Description:** `MDI Bookings`
   - **Execute as:** **Me** *(this means the script runs as the engine account —
     it sends emails from it and uses its sheet/calendar).*
   - **Who has access:** **Anyone** *(required so the app can reach it — it's
     protected by your secret from Step 5, not a Google login).*
4. Click **Deploy**.
5. Google asks you to **Authorize access**. Click it → choose the engine account.
   - You'll likely see **"Google hasn't verified this app."** This is normal —
     *you* wrote it. Click **Advanced** → **Go to … (unsafe)** → **Allow**.
6. It shows a **Web app URL** ending in **`/exec`**. Click **Copy**.
   **This is the important link.**

**✏️ Write it down:**
- Web app URL (`/exec`): `____________________`

> **Important for later:** if you ever change the script, the change is **not
> live** until you re-publish: **Deploy → Manage deployments → ✏️ Edit →
> Version: New version → Deploy.** (Just saving is not enough.)

---

## 7. Connect the app

Two values from above go into the app so it knows where to send submissions:

- the **Web app URL** (Step 6) → `BOOKINGS_ENDPOINT`
- the **secret** (Step 5) → `BOOKINGS_SECRET`

You have two options:

**Option 1 — hand them to me.** Send me the two values and I'll wire them in.

**Option 2 — do it yourself.** Open **`frontend/app.config.ts`**. Near the top
find these two lines and paste your values between the quotes:

```ts
const BOOKINGS_ENDPOINT = "";                              // ← paste the /exec URL here
const BOOKINGS_SECRET = "CHANGE-ME-to-match-the-apps-script"; // ← paste the SAME secret here
```

Save the file. That's the only code change on your side.

> Until this is done, the Bookings forms show a friendly *"not available yet"*
> message instead of failing — so it's safe to ship without it and add it later.

---

## 8. Optional: Google Calendar

Only if the masjid wants facility bookings to show on a shared calendar (a visual
schedule, helps avoid double-booking a hall).

1. Go to **calendar.google.com** (as the engine account).
2. Left sidebar → next to **"Other calendars"** click **＋ → Create new
   calendar**. Name it **`MDI Facility Bookings`** → **Create calendar**.
3. Still in Settings, click that calendar in the left list → scroll to
   **"Integrate calendar"** → copy the **Calendar ID** (looks like
   `abc123@group.calendar.google.com`).
4. Go back to the **Apps Script** editor (Step 5), and in `CONFIG` set:
   ```js
   ENABLE_CALENDAR: true,
   CALENDAR_ID: 'abc123@group.calendar.google.com'   // ← paste your Calendar ID
   ```
5. **Save**, then **re-publish** (Deploy → Manage deployments → Edit → New
   version → Deploy — see the note in Step 6).

Facility bookings will now also appear as **tentative** calendar events titled
`⏳ PENDING — …`. Staff change them to confirmed after approving.

---

## 9. Test everything

1. Open the app → **Bookings** tab → **Facility Booking**. Fill it in and submit.
2. Check all three happened:
   - a new **row** appears in the `MDI Bookings` sheet (in a `Facility Booking` tab),
   - an **email** arrives at your `bookings@` address,
   - the app shows a **reference number** (e.g. `FAC-20260722-143005`).
3. Open **Zakat Application**, submit a test → confirm it lands in the **separate**
   `MDI Zakat (Confidential)` sheet and emails **`zakat@`** (not `info@`).
4. If you enabled the calendar (Step 8), confirm a tentative event appeared for
   the facility test.

If any of these fail, see [Troubleshooting](#12-troubleshooting).

---

## 10. Changing prices and details later (no developer)

Facility prices are **not** locked in the app — they live in the sheet.

- The first time the Facility form is opened (after Step 7), the script creates a
  **`Pricing`** tab in `MDI Bookings`, pre-filled with the current prices.
- To change a price, **edit the number** in that tab (`Price` for optional/AV
  items; `Base` and `Mandatory` for halls). The app uses the new price the next
  time the form is opened — **no app update needed.**
- **Columns:** `Section` (space / optional / av) · `Key` (**don't change**) ·
  `Label` · `Price` · `Base` · `Mandatory` · `Note` · `Capacity` · `Included` ·
  `Active` (set to `no` to hide a row).
- **Add** an item = new row with a new unique `Key`. **Retire** one = set
  `Active` to `no`.
- If the sheet is ever unreachable, the app falls back to the last prices it saw,
  so the form never breaks. The office confirms the final total anyway, so the
  in-app number is an **estimate**.

---

## 11. Questions to confirm with the masjid

Gather these so the system reflects reality. 🔴 = blocks launch · 🟡 = soon · ⚪ = later.

**Accounts & email (🔴 — do first, see Step 1–2)**
- [ ] 🔴 Is `@daruliman.org` on Google Workspace, or another provider?
- [ ] 🔴 Who administers the masjid Google account, and how will you get set up (Path A/B/C)?
- [ ] 🔴 Can `bookings@` and `zakat@` be created? Who monitors each?
- [ ] 🟡 Confirm `info@` stays for general questions only.

**Zakat (🔴/🟡)**
- [ ] 🔴 Is verifying identity **in person** OK (i.e. we don't collect SIN)? Or does the committee insist on it?
- [ ] 🔴 Who is allowed to see zakat applications (who gets the confidential sheet)?
- [ ] 🟡 Are proof documents required? *(If yes, we need to add uploads.)*
- [ ] 🟡 How long should applications be kept, and who deletes them?

**Facility (🟡)**
- [ ] 🔴 Are the halls, capacities, and prices still current? *(You can edit these yourself — Step 10.)*
- [ ] 🟡 Any bookable spaces beyond Hall 1, Hall 3, Kitchen, Sound System?
- [ ] 🟡 Confirm policies: $500 deposit · $150 cancellation within 2 weeks · 10:30 PM cutoff (+$50/hr).
- [ ] 🟡 Who approves facility bookings?

**Funeral (🔴/🟡)**
- [ ] 🔴 Confirm the coordinator's **name, number, and 24/7 availability** (app currently dials 647-233-4766).
- [ ] 🟡 Confirm the "call, don't fill a form" approach is right.

**Sports / Skedda (🟡 — decides native form vs link-out)**
- [ ] 🔴 Who administers the Skedda account?
- [ ] 🔴 What plan are they on — does it include **API access**? Can it **create** bookings or only read?
- [ ] 🔴 Are sports bookings **paid** at booking, or free?
- [ ] 🟡 Per-court IDs, hours, and pricing (I couldn't read `icmsportscomplex.com`).

**Program Enrollment (🟡 — hidden until answered)**
- [ ] 🟡 Which programs have **open registration**, and what fields does each need?
- [ ] 🟡 Any registration fee? Where should submissions go?

**Nikah (⚪ — parked; for the supervisor meeting)**
- [ ] ⚪ How is the Nikah Nama used in the Ontario context? Adapt the location fields?
- [ ] ⚪ Should the polygamy/Arbitration-Council fields be collected in-app or only in person?
- [ ] ⚪ Simple booking request, or full data intake?

**Privacy & publishing (🟡)**
- [ ] 🟡 Does the **Privacy Policy** need updating to cover booking data? Who approves the wording?
- [ ] 🟡 Who owns the **app-store / EAS account** for publishing updates?

---

## 12. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| App says **"not available yet"** | The `/exec` URL + secret aren't in `app.config.ts` yet (Step 7). |
| Submitting does **nothing / "not authorized"** | The secret in the app doesn't **exactly** match `SHARED_SECRET` in the script. |
| **Changed the script but nothing changed** | You didn't re-publish a **New version** (Step 6 note). |
| **No email arrived** | Check the address in `CONFIG`, and look in the engine account's **Spam** once. |
| **Zakat saved to the wrong sheet** | `ZAKAT_SPREADSHEET_ID` is blank or wrong (Step 4/5). |
| **Calendar event missing** | `ENABLE_CALENDAR` is still `false`, or you didn't re-publish after enabling. |
| **Prices look wrong** | Edit the `Pricing` tab (Step 10); reopen the form to refresh. |

---

### The finish line
Once Steps 1–7 are done, send me:
- ✅ **`BOOKINGS_ENDPOINT`** = the `/exec` URL
- ✅ **`BOOKINGS_SECRET`** = your secret

…and everything is connected. (These are the *only* two things I need from you.)

> Note: this is the single source for everything **you** do. `BOOKINGS_PLAN.md`
> and `BOOKINGS_BUILD_STEPS.md` are background/developer reference only.
