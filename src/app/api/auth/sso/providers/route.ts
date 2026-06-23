import { NextResponse } from "next/server";
import { SSO_PROVIDERS, providerPublicMeta } from "@/lib/sso-core";

export async function GET() {
  return NextResponse.json({
    providers: SSO_PROVIDERS.map((p) => providerPublicMeta(p.code)),
  });
}
