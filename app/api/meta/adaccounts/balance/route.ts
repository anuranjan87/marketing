import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get("meta_access_token")?.value;
  const adAccountId = req.nextUrl.searchParams.get("adAccountId");

  if (!accessToken) {
    return NextResponse.json({ error: "Meta account is not connected" }, { status: 401 });
  }

  if (!adAccountId) {
    return NextResponse.json({ error: "Ad account is required" }, { status: 400 });
  }

  const accountId = adAccountId.replace(/^act_/, "");
  if (!/^\d+$/.test(accountId)) {
    return NextResponse.json({ error: "Invalid ad account ID" }, { status: 400 });
  }

  const url = new URL(`https://graph.facebook.com/v24.0/act_${accountId}`);
  url.searchParams.set("fields", "balance,currency,amount_spent");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}