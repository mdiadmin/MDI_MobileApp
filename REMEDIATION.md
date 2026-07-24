# MDI Mobile App — Remediation Tracker

Tracks the audit findings from 2026-07-20 and their fix status. Update the
status line for an item as soon as its fix lands — don't batch.

Legend: 🔴 P0 release blocker · 🟠 P1 security/compliance · 🟡 P2 performance · 🟢 P3 quality of life

---

## 🔴 P0 — Release blockers

| # | Issue | Status |
|---|-------|--------|
| 1 | Compass dead-ends on a permanent spinner when location permission is denied | ✅ Fixed |
| 2 | Compass freezes permanently on devices without a gyroscope | ✅ Fixed |
| 3 | Sensors run at 60Hz forever, on every screen (battery drain) | ✅ Fixed |
| 4 | OneSignal hardcoded to `mode: "development"` | ✅ Fixed |
| 5 | Missing iOS usage descriptions (NSLocationWhenInUseUsageDescription, NSMotionUsageDescription) | ✅ Fixed |
| 6 | Production app points at a staging server (Announcements.tsx) | ⚠️ Partially fixed |

## 🟠 P1 — Security & compliance

| # | Issue | Status |
|---|-------|--------|
| 7 | Privacy Policy is factually wrong (OneSignal/aladhan.com undisclosed) | ✅ Fixed |
| 8 | WebViews allow unrestricted navigation (Announcements, DonateModal) | ✅ Fixed |
| 9 | API key hardcoded in the bundle (PrayerNotifications.tsx) | ✅ Fixed |
| 10 | `SCHEDULE_EXACT_ALARM` permission risks Play Store rejection | ✅ Fixed |
| 11 | Two permission prompts race on first launch | ✅ Fixed |

## 🟡 P2 — Performance

| # | Issue | Status |
|---|-------|--------|
| 12 | Prayer times scraped via WebView instead of JSON API | ✅ Fixed |
| 13 | Quran surah renders every ayah at once (no virtualization) | ✅ Fixed |
| 14 | Full-resolution images used as 72×72 thumbnails | ✅ Fixed |
| 15 | Compass re-renders React 60 times per second | ✅ Fixed |
| 16 | GeometricPattern builds a full-screen SVG for a 150px header | ⚠️ Partially fixed |
| 17 | Notification rescheduling thrashes on every foreground | ✅ Fixed |
| 18 | Cold-start/misc (SafeAreaProvider placement, missing memo, decodeHtmlEntities, stale location, no caching) | ✅ Fixed |

## 🟢 P3 — Quality of life

| Item | Status |
|------|--------|
| Compass haptics on alignment, widen ±3° threshold, calibration prompt, numeric bearing fallback | ⬜ Not started |
| Prayer notifications: pre-prayer reminder, per-prayer toggles, adhan sound, iqamah/adhan choice | ⬜ Not started |
| Quran: search, last-read position, bookmarks, font-size control | ⬜ Not started (`router.back()` fix done, bundled into #13) |

---

## Notes

- **Adhan notifications — device bug fixes (2026-07-24):** two separate
  symptoms, both in the local scheduler (not OneSignal/Announcements).
  - *Fires late on some devices (e.g. 5:00 adhan arriving ~5:26).* Root cause:
    without an exact-alarm permission, Android 12+ schedules `expo-notifications`
    DATE triggers as **inexact** alarms, which Doze / aggressive-OEM battery
    managers delay. #10 dropped `SCHEDULE_EXACT_ALARM` — correct for *that*
    permission (Play-rejection risk), but it left punctuality broken. **Fix:**
    added `android.permission.USE_EXACT_ALARM` in `app.config.ts` — auto-granted,
    no runtime prompt, and Play-policy-permitted for exact-alarm-core apps like a
    prayer-time reminder. **Do not re-remove it.** Needs a native rebuild (EAS /
    `expo run:android`), not an OTA update.
  - *Duplicate adhan on in-place-upgraded devices.* Builds before the identifier
    refactor scheduled notifications with no `identifier` (random UUIDs), which
    `cancelOwnedPrayerNotifications()`'s prefix filter can't clear, so they fire
    alongside the new `prayer-notif:` ones. **Fix:** `runLegacyCleanupOnce()` in
    `PrayerNotifications.tsx` clears all scheduled notifications exactly once per
    install (guarded by `@prayer_notifications_legacy_cleanup_done`) before the
    normal prefixed reschedule. Safe because adhan reminders are the only local
    notifications this app schedules.
  - *Still open (latent):* `combineDateTime` builds the fire time in the
    device's timezone, but the portal returns the masjid's (Eastern) wall-clock
    times — adhan fires at the wrong moment for a device not on Eastern time.
    Not the cause of either symptom above; fix separately if it matters.

- No device/simulator was available during remediation; sensor-behavior fixes
  (#1, #2, #3, #15) are verified by reading the code paths, not by running on
  hardware. Flagged individually below if device verification is still needed.
- **Post-fix follow-up (device testing):** user reported the compass needle
  stuttering on a physical device via `expo run:android`. Investigated
  whether it was USB debugging or dev-build JS-thread jitter and widened the
  dial's tween duration (60ms → 110ms) to compensate — user reported this
  "isn't much better" and asked to revert. **Reverted**: `QiblaFinder.tsx`'s
  dial tween is back to the original `duration: 60`. Compass stutter remains
  unresolved; root cause still unconfirmed. Next step if revisited: test on
  a release build (`expo run:android --variant release` or an EAS
  preview/production build) to isolate dev-build overhead from a real bug.
- **Prayer Times widget — restyle iteration 2:** the first restyle (native
  rows, own approximation of the old look) didn't match well enough. Rebuilt
  `PrayerTimesWidget.tsx`'s styles as a line-by-line port of the original
  injected CSS (still native, no WebView, per explicit request): a `Prayer /
  Adhan / Iqamah` label row with its own border-bottom, exact color values
  pulled from `colors` where they matched 1:1 (`colors.foreground`,
  `colors.muted`, `colors.primary`, `colors.primaryLight`, `colors.accent`),
  `flexBasis` percentages matching the CSS `flex: 1 1 45%` / `flex: 0 0 24%`
  column proportions plus a `gap: 12`, and a hand-matched shadow
  (`shadowOffset {0,16}`, `shadowRadius 40`, `shadowOpacity 0.08`) instead of
  the app's generic `shadows.widget`. Also fixed a real bug from the first
  attempt: the alternating row-stripe direction was inverted — the CSS's
  `nth-of-type(even)` counts the header row too, so the first *data* row is
  actually the white one, not the tinted one. The highlighted (next-prayer)
  row's Adhan column now also goes bold on highlight, matching
  `.tr.highlight .td p`, which the first attempt missed.

### Per-item detail

- **#1/#2/#3/#15 (QiblaFinder.tsx)**: rewritten together. Location resolution
  now has an explicit `fatalError` state with retry + "Open Settings"
  (extended `ErrorState` to support this). Gyro-unavailable/stalled devices
  fall back to a magnetometer-only heading via a 500ms watchdog. Sensor
  listeners now start/stop on `useFocusEffect` + `AppState`, sampled at 30Hz
  instead of 60Hz. Heading UI text throttled to ~4Hz; `setAligned` only fires
  on an actual flip (with a haptic on lock). Alignment threshold widened
  3°→5°. Added `maxAge`/`requiredAccuracy` to `getLastKnownPositionAsync`,
  and a numeric bearing readout as a fallback.
- **#4/#5/#6/#9/#10**: `app.json` converted to `app.config.ts`. OneSignal
  `mode` now derives from `APP_VARIANT` (set per-profile in `eas.json`);
  added `NSLocationWhenInUseUsageDescription` / `NSMotionUsageDescription`;
  `SCHEDULE_EXACT_ALARM` permission dropped entirely (not required —
  `expo-notifications` DATE triggers don't need it *to schedule*);
  the WordPress URL and
  ad-din API key moved to `extra` so they're config, not inline strings.
  **#6 is only partially fixed**: the URL still points at
  `daruliman.org/mystaging02` because the real production endpoint isn't
  known to me — someone with that answer needs to update `WP_POSTS_URL` in
  `app.config.ts` before shipping.
- **#8**: Announcements WebView now pins `originWhitelist`/
  `onShouldStartLoadWithRequest` to `daruliman.org` and bounces everything
  else to the system browser via `expo-web-browser`; added an offline error
  view. `DonateModal.tsx` was deleted outright per the audit's stronger
  recommendation — `DonateBanner` now calls
  `WebBrowser.openBrowserAsync(DONATE_URL)` directly (Custom
  Tabs/SFSafariViewController instead of an in-app WebView for a payment
  page).
- **#7**: `legal.ts` rewritten — added `LAST_UPDATED` (surfaced in Settings
  rows and both legal documents), corrected the prayer-times provider
  (aladhan.com → portal.ad-din.ca), and disclosed OneSignal by name (push
  token + device/OS info + IP-derived country, with a link to its privacy
  policy) instead of claiming "no data leaves the device." The Terms
  acceptance summary text in `_layout.tsx` was also softened to match.
- **#11**: `OneSignal.ts` no longer auto-requests the OS permission on init —
  `initializeOneSignal()` now only registers the SDK. `PrayerNotifications.tsx`'s
  `initPrayerNotifications()` no longer auto-prompts on first run either; it
  only refreshes a decision that's already been made. The single decision
  point is a new one-time `NotificationSoftPrompt` modal in `_layout.tsx`,
  shown once after Terms acceptance, which calls
  `setPrayerNotificationsEnabled()` — the only remaining code path that
  triggers the native permission dialog.
- **#17**: `PrayerNotifications.tsx` — notifications now get a stable
  `prayer-notif:<day>:<prayerName>` identifier, and cancellation targets only
  those (via `getAllScheduledNotificationsAsync` + filter) instead of
  `cancelAllScheduledNotificationsAsync()`, which used to nuke anything else
  scheduled. Added an in-flight promise guard so overlapping calls (foreground
  event racing the midnight timer) share one run instead of interleaving.
  Added a `@prayer_notifications_last_refresh` timestamp so a same-day
  refresh within 6 hours of the last one is skipped outright — repeated
  app-switches no longer cancel + reschedule up to 35 notifications each
  time. Enabling the toggle in Settings still forces an immediate refresh.
- **#12**: extracted the JSON fetch/cache logic already in
  `PrayerNotifications.tsx` into a new shared `services/prayerTimes.ts`
  (both modules now import from it — no duplication). `PrayerTimesWidget.tsx`
  no longer uses a WebView at all: it reads the cache instantly for a paint
  with zero network latency, then refreshes in the background, and renders
  native `View`/`Text` rows with the "next prayer" row highlighted (computed
  locally, no more scraped `.highlight` class). Full offline support, no
  WebView boot cost, no cache-busted network fetch on every mount, ~200 lines
  of injected CSS deleted. Note: the row set (Fajr/Sunrise/Dhuhr/Asr/Maghrib/
  Isha/Jumah) is inferred from the API response and may not exactly match
  every column the old scraped table showed — worth a visual sanity check
  against the live portal.
  **Update:** the initial restyle didn't match the original scraped table's
  look, since it was my own approximation rather than a direct port of the
  original CSS. Reworked to mirror the original injected stylesheet more
  closely: a label row ("Prayer" / "Adhan" / "Iqamah"), alternating
  white/light-green row stripes, a 3-column layout (name ~45%, two time
  columns ~24% each), and the same color values the old CSS used
  (`#1A2E1E` name text, `#4A7A5E` Adhan text, `#1B5E38` bold Iqamah text,
  `#1B5E38` highlight-row background with white name/Adhan text and
  `colors.accent` Iqamah text on the next-prayer row).
- **#16**: `GeometricPattern.tsx` now defines one SVG `<Pattern>` tile and a
  single `<Rect fill="url(#...)">` instead of building a `cols × rows` grid
  of individually-positioned `<Polygon>` nodes (~150-200 → 2), wrapped the
  component in `React.memo`, and deleted the unused RNG (`seed`,
  `mulberry32`, `rand`) and unused `Circle` import. **Partially fixed**: none
  of the six call sites (`Header`, `ScreenHeader` ×2, `Announcements`,
  `Settings`, `DonateBanner`) were updated to pass the new `height` prop, so
  the pattern still sizes itself to the full window height by default inside
  headers that are only ~150px tall with `overflow: hidden`. I didn't know
  the exact rendered height of each header without running the app on a
  device — passing the real value in is a follow-up.
- **#13**: `[surahNumber].tsx` now merges the two parallel ayah arrays into
  one `{arabic, translation}[]` upfront and renders them with a `FlatList`
  (`initialNumToRender={10}`, `maxToRenderPerBatch={10}`, `windowSize={7}`,
  `removeClippedSubviews`) instead of mapping all 286 `AyahCard`s into a
  `ScrollView` at once. `AyahCard` and `SurahListItem` are now
  `React.memo`-wrapped. Also swapped the back button's `router.push('/quran')`
  for `router.back()` while touching that line, per the audit's P3 note (it
  was growing the navigation history stack on every visit).
- **#14**: `Announcements.tsx`'s `getImageUrl` now reads
  `media_details.sizes` from the WordPress REST response and picks
  `thumbnail`/`medium` for the 72×72 list rows vs. `medium_large`/`large` for
  the featured card, instead of always returning the original full-resolution
  upload. Fixed the dead `?? undefined; undefined;` statement in the same
  function. Swapped `Image` (react-native) for `Image` (expo-image, already a
  dependency but previously unused) for disk caching and a 150ms fade-in
  transition. `CategoryPill` and `AnnouncementRow` are now `React.memo`-wrapped.
- **#18**: `SafeAreaProvider` moved from `(tabs)/index.tsx` to the root
  `app/_layout.tsx`, wrapping the Terms/notification-prompt modals as well as
  the tab navigator (previously Settings/Announcements/`ScreenHeader`/`Header`
  called `useSafeAreaInsets()` with no provider ancestor outside the home
  tab). `decodeHtmlEntities` in `Announcements.tsx` now uses a module-scope
  entity map and a single combined regex pass instead of rebuilding the map
  and doing 11 `split().join()` passes per call. Added cache-first
  AsyncStorage reads for both the Quran surah list (`services/quranApi.ts`,
  new `getCachedSurahList`) and Announcements (`@announcements_cache_v1`) so
  cold starts paint instantly from the last-fetched data instead of a blank
  loading screen, with the network response updating both the UI and the
  cache in the background. The `getLastKnownPositionAsync` `maxAge`/
  `requiredAccuracy` fix was already covered under #1/#2/#3/#15.
