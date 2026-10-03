import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get("meta_access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ error: "Meta account is not connected" }, { status: 401 });
  }

  const response = await fetch(
    "https://graph.facebook.com/v24.0/me/adaccounts?fields=id,name,account_id,currency,account_status",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}