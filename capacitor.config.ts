import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pocketmeeple.app",
  appName: "PocketMeeple",
  webDir: "dist/client",
  server: {
    androidScheme: "https",
    // Uncomment and set your deployed server URL for server functions to work:
    // url: "https://your-deployed-app.pages.dev",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
  ios: {
    contentInset: "automatic",
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
