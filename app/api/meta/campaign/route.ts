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
  const endpoint = `https://graph.facebook.com/v24.0/act_${accountId}/campaigns`;
  const campaigns = [];
  let after: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const url = new URL(endpoint);
    url.searchParams.set("fields", "id,name,status,effective_status,created_time,objective");
    url.searchParams.set("limit", "100");
    if (after) url.searchParams.set("after", after);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    campaigns.push(...(data.data || []));
    hasNextPage = Boolean(data.paging?.next && data.paging?.cursors?.after);
    after = data.paging?.cursors?.after;
  }

  return NextResponse.json({ data: campaigns });
}

export async function PATCH(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("meta_access_token")?.value;
    const { campaignId, status } = await req.json();

    if (!accessToken) {
      return NextResponse.json({ error: "Meta account is not connected" }, { status: 401 });
    }

    if (typeof campaignId !== "string" || !campaignId.trim()) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    if (status !== "ACTIVE" && status !== "PAUSED") {
      return NextResponse.json({ error: "Status must be ACTIVE or PAUSED" }, { status: 400 });
    }

    const response = await fetch(`https://graph.facebook.com/v24.0/${encodeURIComponent(campaignId)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ status }).toString(),
      cache: "no-store",
    });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update campaign status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("meta_access_token")?.value;
    const { adAccountId, name, objective } = await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Meta account is not connected" },
        { status: 401 }
      );
    }

    if (!adAccountId || !name?.trim() || !objective) {
      return NextResponse.json(
        { error: "Campaign name, objective, and ad account are required" },
        { status: 400 }
      );
    }

    const accountId = String(adAccountId).replace(/^act_/, "");
    const campaignParams = new URLSearchParams({
      name: name.trim(),
      objective,
      status: "PAUSED",
      special_ad_categories: "[]",
      is_adset_budget_sharing_enabled: "false",
    });
    const response = await fetch(
      `https://graph.facebook.com/v24.0/act_${accountId}/campaigns`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: campaignParams.toString(),
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}