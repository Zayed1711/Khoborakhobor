# Android app (APK)

The APK is a thin shell around https://www.kkhobor.com (a Trusted Web Activity). News and
features update with every website deploy; a new APK is only needed when this folder changes.
It is offered from our own site at `/app`, not from Google Play.

## Before the first build

1. The website with the PWA must be live (`/manifest.webmanifest` must open).
2. One-time tools (about 1 GB, downloaded by Bubblewrap on first run: JDK 17 + Android SDK):
   `npm i -g @bubblewrap/cli`

## The signing key (make once, never lose)

The key lives **outside this repo** in `../kkhobor-keys/` (see `signingKey.path` in
`twa-manifest.json`). It is never committed and never copied to the server.

    keytool -genkeypair -v -keystore ../kkhobor-keys/khoborakhobor.keystore -alias khoborakhobor -keyalg RSA -keysize 2048 -validity 10000

Keep 3 backups: a password-protected zip on Google Drive, a USB stick at home, and the
password in a password manager. If the key is lost, users must uninstall and reinstall.

## Build

    cd android
    bubblewrap update        # creates the Android project from twa-manifest.json
    bubblewrap build         # asks for the key password; writes app-release-signed.apk
    bubblewrap fingerprint   # not needed; the line below prints the fingerprint

    keytool -list -v -keystore ../kkhobor-keys/khoborakhobor.keystore -alias khoborakhobor | findstr SHA256

## Publish

1. Copy `android/app-release-signed.apk` to `public/downloads/khoborakhobor.apk` and commit it.
   The "Download APK" button on `/app` appears by itself once the file is there.
2. Put the SHA-256 fingerprint in the server's `.env` as `TWA_SHA256_FINGERPRINTS=AA:BB:...`
   and restart the site. Check that `https://www.kkhobor.com/.well-known/assetlinks.json`
   lists it. Without it the app works but shows an address bar.

## A new version later

Raise `appVersionCode` (and `appVersionName`) in `twa-manifest.json`, build, replace the file
in `public/downloads/`. Use the **same key**.
