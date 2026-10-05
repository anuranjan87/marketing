
import { NextResponse } from "next/server";

const ADS_API = "https://api.ads.openai.com/v1";

async function adsRequest(
  path: string,
  options: RequestInit = {}
) {
  const API_KEY = process.env.OPENAI_ADS_API_KEY;

  if (!API_KEY) {
    throw new Error(
      "OPENAI_ADS_API_KEY is missing from .env.local"
    );
  }

  const response = await fetch(`${ADS_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const text = await response.text();

  let data: any;

  try {
    data = JSON.parse(text);
  } catch {
    data = {
      raw_response: text,
    };
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export async function POST(request: Request) {
  try {
    const requestBody = await request.json().catch(() => ({}));
    const campaignName = String(requestBody.campaignName || "").trim();
    const adGroupName = String(requestBody.adGroupName || "").trim();
    const adName = String(requestBody.adName || "").trim();
    const title = String(requestBody.title || "").trim();
    const body = String(requestBody.body || "").trim();
    const targetUrl = String(requestBody.targetUrl || "").trim();
    const imageUrl = String(requestBody.imageUrl || "").trim();
    const lifetimeBudget = Number(requestBody.lifetimeBudget);
    const maxBid = Number(requestBody.maxBid);
    const contextHints = Array.isArray(requestBody.contextHints)
      ? requestBody.contextHints
          .map((hint: unknown) => String(hint).trim())
          .filter(Boolean)
      : [];

    if (
      !campaignName ||
      !adGroupName ||
      !adName ||
      !title ||
      !body ||
      !targetUrl ||
      !imageUrl ||
      !Number.isFinite(lifetimeBudget) ||
      lifetimeBudget <= 0 ||
      !Number.isFinite(maxBid) ||
      maxBid <= 0 ||
      contextHints.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          failed_step: "validation",
          error: "Complete every field with a positive budget and bid, and provide at least one context hint.",
        },
        { status: 400 }
      );
    }

    let parsedImageUrl: URL;
    let parsedTargetUrl: URL;
    try {
      parsedImageUrl = new URL(imageUrl);
      parsedTargetUrl = new URL(targetUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          failed_step: "url_validation",
          error: "The image and destination URLs must be valid HTTP or HTTPS URLs.",
        },
        { status: 400 }
      );
    }

    if (
      !["http:", "https:"].includes(parsedImageUrl.protocol) ||
      parsedImageUrl.pathname.toLowerCase().endsWith(".ico") ||
      !["http:", "https:"].includes(parsedTargetUrl.protocol)
    ) {
      return NextResponse.json(
        {
          success: false,
          failed_step: "url_validation",
          error: "Use HTTP or HTTPS URLs, and do not use an ICO favicon as the creative image.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------
     * 1. CHECK ACCOUNT
     * ----------------------------------------
     */

    const accountResult = await adsRequest(
      "/ad_account",
      {
        method: "GET",
        headers: {
          "Content-Type": undefined as any,
        },
      }
    );

    if (!accountResult.ok) {
      return NextResponse.json(
        {
          success: false,
          failed_step: "ad_account",
          status: accountResult.status,
          response: accountResult.data,
        },
        { status: accountResult.status }
      );
    }

    /*
     * ----------------------------------------
     * 2. UPLOAD IMAGE
     * ----------------------------------------
     *
     * IMPORTANT:
     * This must be a real publicly accessible
     * image URL.
     */

    const uploadResult = await adsRequest(
      "/upload",
      {
        method: "POST",
        body: JSON.stringify({
          image_url: imageUrl,
        }),
      }
    );

    if (!uploadResult.ok) {
      return NextResponse.json(
        {
          success: false,
          failed_step: "upload",
          status: uploadResult.status,
          account: accountResult.data,
          response: uploadResult.data,
        },
        { status: uploadResult.status }
      );
    }

    /*
     * ----------------------------------------
     * 3. CAMPAIGN
     * ----------------------------------------
     */

    const campaignResult = await adsRequest(
      "/campaigns",
      {
        method: "POST",
        body: JSON.stringify({
          name: campaignName,

          status: "paused",

          bidding_type: "impressions",

          budget: {
            lifetime_spend_limit_micros: Math.round(
              lifetimeBudget * 1_000_000
            ),
          },
        }),
      }
    );

    if (!campaignResult.ok) {
      return NextResponse.json(
        {
          success: false,
          failed_step: "campaign",
          status: campaignResult.status,
          account: accountResult.data,
          upload: uploadResult.data,
          response: campaignResult.data,
        },
        { status: campaignResult.status }
      );
    }

    /*
     * ----------------------------------------
     * 4. AD GROUP
     * ----------------------------------------
     */

    const adGroupResult = await adsRequest(
      "/ad_groups",
      {
        method: "POST",
        body: JSON.stringify({
          campaign_id:
            campaignResult.data.id,

          name: adGroupName,

          status: "paused",

          context_hints: contextHints,

          bidding_config: {
            billing_event_type: "impression",

            strategy: "fixed_bid",

            max_bid_micros: Math.round(maxBid * 1_000_000),
          },
        }),
      }
    );

    if (!adGroupResult.ok) {
      return NextResponse.json(
        {
          success: false,
          failed_step: "ad_group",
          status: adGroupResult.status,
          account: accountResult.data,
          upload: uploadResult.data,
          campaign: campaignResult.data,
          response: adGroupResult.data,
        },
        { status: adGroupResult.status }
      );
    }

    /*
     * ----------------------------------------
     * 5. AD
     * ----------------------------------------
     */

    const adResult = await adsRequest(
      "/ads",
      {
        method: "POST",
        body: JSON.stringify({
          ad_group_id:
            adGroupResult.data.id,

          name: adName,

          status: "paused",

          creative: {
            type: "chat_card",

            title,

            body,

            target_url: targetUrl,

            file_id:
              uploadResult.data.file_id,
          },
        }),
      }
    );

    if (!adResult.ok) {
      return NextResponse.json(
        {
          success: false,
          failed_step: "ad",
          status: adResult.status,

          account: accountResult.data,

          upload: uploadResult.data,

          campaign: campaignResult.data,

          adGroup: adGroupResult.data,

          response: adResult.data,
        },
        { status: adResult.status }
      );
    }

    /*
     * ----------------------------------------
     * SUCCESS
     * ----------------------------------------
     */

    return NextResponse.json({
      success: true,

      account: accountResult.data,

      upload: uploadResult.data,

      campaign: campaignResult.data,

      adGroup: adGroupResult.data,

      ad: adResult.data,
    });
  } catch (error: any) {
    console.error(
      "OpenAI Ads API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        failed_step: "server",
        error:
          error?.message ||
          "Unknown server error",
      },
      { status: 500 }
    );
  }
}

