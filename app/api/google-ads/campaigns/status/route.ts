
import { NextResponse } from "next/server";
import { GoogleAdsApi } from "google-ads-api";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const {
      campaignResourceName,
      status,
    } = body;

    if (!campaignResourceName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Campaign resource name is required",
        },
        { status: 400 }
      );
    }

    if (
      status !== "ENABLED" &&
      status !== "PAUSED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Status must be ENABLED or PAUSED",
        },
        { status: 400 }
      );
    }

    const client =
      new GoogleAdsApi({
        client_id:
          process.env
            .GOOGLE_ADS_CLIENT_ID!,

        client_secret:
          process.env
            .GOOGLE_ADS_CLIENT_SECRET!,

        developer_token:
          process.env
            .GOOGLE_ADS_DEVELOPER_TOKEN!,
      });

    const customer =
      client.Customer({
        customer_id:
          process.env
            .GOOGLE_ADS_CUSTOMER_ID!,

        login_customer_id:
          process.env
            .GOOGLE_ADS_LOGIN_CUSTOMER_ID,

        refresh_token:
          process.env
            .GOOGLE_ADS_REFRESH_TOKEN!,
      });

    await customer.campaigns.update([
      {
        resource_name:
          campaignResourceName,

        status,
      },
    ]);

    return NextResponse.json({
      success: true,

      resourceName:
        campaignResourceName,

      status,
    });

  } catch (error: any) {
    console.error(
      "Campaign status update error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Failed to update campaign",

        details:
          error?.errors || null,
      },
      {
        status: 500,
      }
    );
  }
}
