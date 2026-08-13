import { NextResponse } from "next/server";
import { GoogleAdsApi } from "google-ads-api";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const campaignResourceName =
      body?.campaignResourceName;

    if (!campaignResourceName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "campaignResourceName is required",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "Removing Google Ads campaign:",
      campaignResourceName
    );

    // ==================================================
    // GOOGLE ADS CLIENT
    // ==================================================

    const client = new GoogleAdsApi({
      client_id:
        process.env.GOOGLE_ADS_CLIENT_ID!,

      client_secret:
        process.env.GOOGLE_ADS_CLIENT_SECRET!,

      developer_token:
        process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });

    // ==================================================
    // CUSTOMER
    // ==================================================

    const customer = client.Customer({
      customer_id:
        process.env.GOOGLE_ADS_CUSTOMER_ID!,

      login_customer_id:
        process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,

      refresh_token:
        process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    });

    // ==================================================
    // REMOVE CAMPAIGN
    // ==================================================
    //
    // IMPORTANT:
    //
    // Do NOT do:
    //
    // {
    //   resource_name: campaignResourceName,
    //   status: "REMOVED"
    // }
    //
    // Google Ads requires a REMOVE operation.
    //
    // ==================================================

    const response =
      await customer.campaigns.remove([
        campaignResourceName,
      ]);

    console.log(
      "Google Ads campaign removed:",
      response
    );

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json({
      success: true,

      campaign:
        campaignResourceName,

      status: "REMOVED",
    });
  } catch (error: any) {
    console.error(
      "Google Ads delete campaign error:",
      error
    );

    if (error?.errors) {
      console.error(
        "Google Ads errors:",
        JSON.stringify(
          error.errors,
          null,
          2
        )
      );
    }

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Failed to remove campaign",

        details:
          error?.errors || null,
      },
      {
        status: 500,
      }
    );
  }
}