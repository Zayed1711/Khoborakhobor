import { NextResponse } from "next/server";
import { APK_PACKAGE, apkFingerprints } from "@/lib/app-download";

export const dynamic = "force-dynamic";

// Tells Android that our APK really belongs to this site (Digital Asset Links).
// Without a matching fingerprint the app still works, but shows an address bar.
export async function GET() {
  const fingerprints = apkFingerprints();
  const body = fingerprints.length
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: { namespace: "android_app", package_name: APK_PACKAGE, sha256_cert_fingerprints: fingerprints },
        },
      ]
    : [];
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=300" } });
}
