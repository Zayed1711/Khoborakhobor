import fs from "fs";
import path from "path";

// The Android APK is a thin shell around this site (a "Trusted Web Activity"), built with
// Bubblewrap from android/twa-manifest.json and offered from our own server, not Google Play.
// Dropping the file at public/downloads/khoborakhobor.apk is all it takes to show the button.

export const APK_PACKAGE = "com.kkhobor.app";
export const APK_PATH = "/downloads/khoborakhobor.apk";

export interface ApkInfo {
  url: string;
  sizeMb: string;
}

/** The APK on offer, or null while none has been built yet. */
export function apkInfo(): ApkInfo | null {
  try {
    const stat = fs.statSync(path.join(process.cwd(), "public", APK_PATH));
    if (!stat.isFile() || stat.size < 10_000) return null;
    // "?v=" changes with every new build, so phones never download a cached old one
    return { url: `${APK_PATH}?v=${Math.floor(stat.mtimeMs / 1000)}`, sizeMb: (stat.size / 1_048_576).toFixed(1) };
  } catch {
    return null;
  }
}

/**
 * SHA-256 fingerprints of the APK signing key (TWA_SHA256_FINGERPRINTS, comma-separated).
 * Chrome checks them at /.well-known/assetlinks.json; when they match, the app opens
 * full screen with no address bar.
 */
export function apkFingerprints(): string[] {
  return (process.env.TWA_SHA256_FINGERPRINTS || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s));
}
