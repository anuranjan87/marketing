
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

export async function POST() {
  try {
    const imageUrl = process.env.OPENAI_ADS_IMAGE_URL;
    if (!imageUrl) {
      return NextResponse.json(
        {
          success: false,
          failed_step: "configuration",
          error: "Set OPENAI_ADS_IMAGE_URL to a publicly accessible PNG or JPEG creative image URL.",
        },
        { status: 500 }
      );
    }

    let parsedImageUrl: URL;
    try {
      parsedImageUrl = new URL(imageUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          failed_step: "configuration",
          error: "OPENAI_ADS_IMAGE_URL must be a valid public HTTP or HTTPS image URL.",
        },
        { status: 500 }
      );
    }

    if (
      !["http:", "https:"].includes(parsedImageUrl.protocol) ||
      parsedImageUrl.pathname.toLowerCase().endsWith(".ico")
    ) {
      return NextResponse.json(
        {
          success: false,
          failed_step: "configuration",
          error: "OPENAI_ADS_IMAGE_URL must point to a publicly accessible PNG or JPEG, not an ICO favicon.",
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
          name: "7Wingz Test Campaign",

          status: "paused",

          bidding_type: "impressions",

          budget: {
            lifetime_spend_limit_micros: 25000000,
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

          name: "7Wingz Test Group",

          status: "paused",

          context_hints: [
            "website builder",
            "AI website builder",
            "AI",
          ],

          bidding_config: {
            billing_event_type: "click",

            strategy: "fixed_bid",

            max_bid_micros: 60000,
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

          name: "7Wingz Test Ad",

          status: "paused",

          creative: {
            type: "chat_card",

            title:
              "Build your website with AI",

            body:
              "Create and launch your website with 7Wingz.",

            target_url:
              "https://7wingz.com",

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

