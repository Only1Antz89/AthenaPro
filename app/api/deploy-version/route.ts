import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      version:
        process.env.DEPLOY_ID ??
        process.env.COMMIT_REF ??
        process.env.NEXT_PUBLIC_DEPLOY_ID ??
        "local"
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
