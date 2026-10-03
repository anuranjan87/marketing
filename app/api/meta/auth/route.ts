import { NextResponse } from "next/server";

export async function GET() {
  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;

  if (!appId || !redirectUri) {
    return NextResponse.json(
      {
        error: "Missing META_APP_ID or META_REDIRECT_URI",
      },
      { status: 500 }
    );
  }

  const scopes = [
    "ads_read",
    "ads_management",
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_ads",
  ].join(",");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
  });

  const metaAuthUrl =
    `https://www.facebook.com/v24.0/dialog/oauth?${params.toString()}`;

  return NextResponse.redirect(metaAuthUrl);
}