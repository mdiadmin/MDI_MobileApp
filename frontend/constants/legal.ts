export const APP_NAME = 'Masjid Darul Iman';
export const APP_VERSION = '1.0.0';
export const ORGANIZATION_NAME = 'Masjid Darul Iman';
export const WEBSITE_URL = 'https://daruliman.org';
export const PRAYER_TIMES_PROVIDER_URL = 'https://portal.ad-din.ca';
export const LAST_UPDATED = 'July 20, 2026';

export const TERMS_AND_CONDITIONS = `
TERMS AND CONDITIONS

Last Updated: ${LAST_UPDATED}

1. ACCEPTANCE OF TERMS

By downloading, installing, or using the ${APP_NAME} mobile application (the "App"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, do not use the App.

2. ABOUT THE APP

The ${APP_NAME} App is a free mobile application provided by ${ORGANIZATION_NAME} for the benefit of our community. The App provides the following features:
  • Prayer time display and reminders based on the masjid's schedule (data provided by ${PRAYER_TIMES_PROVIDER_URL})
  • Qibla direction finder using your device's compass and location sensors
  • Quran reading (data provided by alquran.cloud)
  • Announcements and community updates from ${WEBSITE_URL}
  • Push notifications, delivered via OneSignal
  • Links to external donation pages

3. USE OF THE APP

You agree to use the App only for lawful purposes and in a manner consistent with these Terms. You are responsible for ensuring that your device meets the minimum requirements to run the App.

4. THIRD-PARTY SERVICES

The App relies on third-party services and APIs, including but not limited to:
  • ${PRAYER_TIMES_PROVIDER_URL} for prayer time data
  • Alquran.cloud API for Quran text
  • WordPress REST API from ${WEBSITE_URL} for announcements
  • OneSignal for delivering push notifications

${ORGANIZATION_NAME} is not responsible for the availability, accuracy, or content of these third-party services. Interruptions or errors in these services may affect the functionality of the App.

5. DONATIONS

The App may provide links to external donation pages. All donations are processed through third-party platforms. ${ORGANIZATION_NAME} does not process, store, or handle any payment information within the App. Please review the terms and privacy policies of the respective donation platforms before making a contribution.

6. LOCATION AND DEVICE PERMISSIONS

The App requires access to your device's location services and compass sensors to:
  • Calculate accurate prayer times for your area
  • Determine the Qibla direction

You may deny these permissions, but certain features of the App may not function correctly as a result.

7. INTELLECTUAL PROPERTY

All content, branding, and design within the App, including but not limited to text, graphics, logos, and icons, are the property of ${ORGANIZATION_NAME} or its licensors and are protected by applicable intellectual property laws. The Quran text is provided as-is from the public domain.

8. DISCLAIMER OF WARRANTIES

The App is provided "as is" without warranties of any kind, either express or implied. ${ORGANIZATION_NAME} does not warrant that the App will be uninterrupted, error-free, or free of viruses or other harmful components. Prayer times displayed in the App are for reference only and should be verified with local masjid authorities.

9. LIMITATION OF LIABILITY

To the fullest extent permitted by law, ${ORGANIZATION_NAME} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, arising from your use of the App.

10. CHANGES TO THESE TERMS

We reserve the right to update or modify these Terms at any time. Changes will be effective immediately upon posting within the App. Your continued use of the App after any changes constitutes acceptance of the new Terms.

11. CONTACT

If you have any questions about these Terms, please contact us at ${WEBSITE_URL}.
`;

export const PRIVACY_POLICY = `
PRIVACY POLICY

Last Updated: ${LAST_UPDATED}

1. INTRODUCTION

${ORGANIZATION_NAME} ("we," "us," or "our") respects your privacy. This Privacy Policy explains how we handle information when you use the ${APP_NAME} mobile application (the "App").

2. INFORMATION WE DO NOT COLLECT

We do NOT collect, store, or share:
  • Your name, email address, or phone number (unless you separately contact us)
  • User account credentials or login data
  • Payment or financial information
  • Photos, contacts, or messages from your device

3. INFORMATION WE ACCESS AND COLLECT

Location Data:
  • Your approximate or precise location is used to determine the Qibla direction and, where relevant, to tailor prayer-time information to your area.
  • Location data is processed on your device and is not transmitted to or stored on ${ORGANIZATION_NAME}'s own servers.

Device Sensors:
  • Compass, accelerometer, and gyroscope sensors are accessed to display the Qibla direction.
  • Sensor data is processed in real-time on your device and is not stored or transmitted.

Push Notification Data:
  • If you enable notifications, a device push token and basic device information (device model, operating system version, app version, language, and an IP-derived approximate country/timezone) are collected by our notification provider, OneSignal, so that prayer-time reminders and masjid announcements can be delivered to your device.
  • This information is used only to deliver and measure delivery of notifications sent by ${ORGANIZATION_NAME}. See Section 4 for details on OneSignal.

4. THIRD-PARTY SERVICES

The App communicates with the following third-party services:

OneSignal (push notifications):
  • Used to deliver prayer-time reminders and announcement notifications.
  • Collects a device push token, device/OS information, app usage and engagement events (e.g. whether a notification was opened), and an IP-derived approximate location, as described above.
  • Privacy policy: https://onesignal.com/privacy_policy

${PRAYER_TIMES_PROVIDER_URL} (ad-din masjid portal):
  • Used to fetch the masjid's daily prayer times.
  • No personal data is sent to this service beyond a standard network request (which includes your IP address, as with any web request).

Alquran.cloud API:
  • Used to fetch Quran text and translations.
  • No personal data is transmitted to this service.
  • Privacy policy: https://alquran.cloud

${WEBSITE_URL} (WordPress):
  • Used to fetch community announcements and posts.
  • Standard web server logs may record your IP address as per WordPress's own policies.
  • Privacy policy: ${WEBSITE_URL}

Donation Platforms:
  • The App links out to external donation pages using your device's browser, outside the App.
  • We do not process or store any payment information, and no donation-page data passes through the App itself.
  • Please review the privacy policy of the respective donation platform before contributing.

5. DATA STORAGE

The App stores the following data locally on your device:
  • Your acceptance of the Terms and Conditions and Privacy Policy
  • App preferences and settings (e.g. whether prayer notifications are enabled)
  • A cached copy of prayer times, to allow the App to work offline

This data is stored using your device's local storage. The push token described in Section 3 is the only identifier transmitted off-device by the App itself, and it is used solely for the purpose of delivering notifications.

6. CHILDREN'S PRIVACY

The App does not knowingly collect any information from children under the age of 13. If you believe a child has provided us with personal information, please contact us and we will take steps to delete such information.

7. DATA SECURITY

Since we do not collect or store personal information on our servers, there is minimal risk of data breach from our side. All third-party services used by the App have their own security measures and privacy policies.

8. YOUR RIGHTS

You have the right to:
  • Deny location or sensor permissions at any time through your device settings
  • Disable push notifications at any time from the App's Settings tab or your device's notification settings, which stops the App from sending your push token further notifications
  • Uninstall the App at any time
  • Request information about how your data is handled

9. CHANGES TO THIS PRIVACY POLICY

We may update this Privacy Policy from time to time. Changes will be posted within the App. Your continued use of the App after changes are posted constitutes acceptance of the updated Privacy Policy.

10. CONTACT US

If you have questions or concerns about this Privacy Policy, please contact us at ${WEBSITE_URL}.
`;
