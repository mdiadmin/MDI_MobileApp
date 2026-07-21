import { ExpoConfig, ConfigContext } from "expo/config";

// EAS build profiles set APP_VARIANT via eas.json ("env"). Locally (expo
// start / expo run:*) this is unset, which we also treat as development.
const IS_PRODUCTION = process.env.APP_VARIANT === "production";

// TODO: point this at the live daruliman.org site before shipping to
// production — this still targets the staging subsite.
//
// Deliberately omits `content` — the list/paged endpoint is used for
// scrolling, and a post's full body is only ever fetched on demand when
// it's actually opened (services/announcementsApi.ts:fetchPostById), so
// scrolling through years of archives never downloads or holds article
// bodies for posts that are only being browsed, not read.
const WP_POSTS_URL =
  "https://daruliman.org/mystaging02/wp-json/wp/v2/posts?_fields=id,date,link,title,excerpt,category_info,_links,_embedded&_embed=wp:featuredmedia&per_page=10";

// Public key published on the masjid's own display page (portal.ad-din.ca).
// Not a secret — kept in config instead of inline so rotation is a config
// change, not a code change.
const ADDIN_API_KEY =
  "WVeh6FdhekwxiEiaxhKGsvy7sOh9V4Y6rWDt2vyoFvvMAFQ2eqxYBePjW1EXEAOL8jr6j0cddjcCJRZRAtrobKmXDy7BCEqi";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MDI Mobile App",
  slug: "mdimobileapp",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "frontend",
  userInterfaceStyle: "automatic",
  icon: "./assets/images/MDI_logo_no_background.png",
  ios: {
    icon: "./assets/images/MDI_logo_no_background.png",
    bundleIdentifier: "com.mdi-admin.mdimobileapp",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Your location is used to calculate the Qibla direction and local prayer times.",
      NSMotionUsageDescription:
        "Motion sensors are used to power the Qibla compass.",
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/MDI_logo_no_background.png",
    },
    predictiveBackGestureEnabled: false,
    package: "com.mdiadminsorganization.mdimobileapp",
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#FFFFFF",
        image: "./assets/images/MDI_logo_no_background.png",
        imageWidth: 180,
        resizeMode: "contain",
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon-small.png",
        color: "#0C9544",
      },
    ],
    [
      "onesignal-expo-plugin",
      {
        mode: IS_PRODUCTION ? "production" : "development",
        smallIcons: ["./assets/images/notification-icon-small.png"],
        largeIcons: ["./assets/images/notification-icon-large.png"],
        smallIconAccentColor: "#0C9544",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "474d174d-8726-45c7-b9b4-e2e635761834",
    },
    oneSignalAppId: "1848012c-7b3b-4974-a183-76afa8f84bb1",
    wpPostsUrl: WP_POSTS_URL,
    adDinApiKey: ADDIN_API_KEY,
  },
  owner: "mdiadmins-organization",
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/474d174d-8726-45c7-b9b4-e2e635761834",
  },
});
