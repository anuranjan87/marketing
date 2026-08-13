import { NextResponse } from "next/server";
import { GoogleAdsApi } from "google-ads-api";

// ======================================================
// GOOGLE ADS ENUM HELPERS
// ======================================================

function normalizeEnumValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  // Some versions / responses can expose enums as
  // strings, while others can expose their numeric value.
  if (typeof value === "object") {
    if ("value" in value) {
      return String(value.value);
    }

    if ("name" in value) {
      return String(value.name);
    }

    if ("toString" in value) {
      return String(value.toString());
    }
  }

  return String(value);
}

// ======================================================
// CAMPAIGN STATUS
// ======================================================

function getCampaignStatus(
  value: any
): string {
  const normalized =
    normalizeEnumValue(value);

  switch (normalized) {
    // Google Ads CampaignStatus enum
    case "2":
      return "Enabled";

    case "3":
      return "Paused";

    case "4":
      return "Removed";

    case "ENABLED":
      return "Enabled";

    case "PAUSED":
      return "Paused";

    case "REMOVED":
      return "Removed";

    case "UNKNOWN":
      return "Unknown";

    case "UNSPECIFIED":
      return "Unspecified";

    default:
      return normalized || "Unknown";
  }
}

// ======================================================
// ADVERTISING CHANNEL TYPE
// ======================================================

function getCampaignType(
  value: any
): string {
  const normalized =
    normalizeEnumValue(value);

  switch (normalized) {
    /*
     * Google Ads AdvertisingChannelType
     *
     * We handle both the enum string and
     * numeric representation.
     */

    case "2":
      return "Search";

    case "3":
      return "Display";

    case "4":
      return "Shopping";

    case "5":
      return "Hotel";

    case "6":
      return "Video";

    case "7":
      return "Multi Channel";

    case "8":
      return "Local";

    case "9":
      return "Smart";

    case "10":
      return "Performance Max";

    case "11":
      return "Local Services";

    case "12":
      return "Travel";

    case "13":
      return "Demand Gen";

    case "SEARCH":
      return "Search";

    case "DISPLAY":
      return "Display";

    case "SHOPPING":
      return "Shopping";

    case "HOTEL":
      return "Hotel";

    case "VIDEO":
      return "Video";

    case "MULTI_CHANNEL":
      return "Multi Channel";

    case "LOCAL":
      return "Local";

    case "SMART":
      return "Smart";

    case "PERFORMANCE_MAX":
      return "Performance Max";

    case "LOCAL_SERVICES":
      return "Local Services";

    case "TRAVEL":
      return "Travel";

    case "DEMAND_GEN":
      return "Demand Gen";

    case "UNKNOWN":
      return "Unknown";

    case "UNSPECIFIED":
      return "Unspecified";

    default:
      return normalized || "Unknown";
  }
}

// ======================================================
// BIDDING STRATEGY
// ======================================================

function getBiddingStrategy(
  value: any
): string {
  const normalized =
    normalizeEnumValue(value);

  switch (normalized) {
    case "MANUAL_CPC":
      return "Manual CPC";

    case "MAXIMIZE_CLICKS":
      return "Maximize Clicks";

    case "MAXIMIZE_CONVERSIONS":
      return "Maximize Conversions";

    case "MAXIMIZE_CONVERSION_VALUE":
      return "Maximize Conversion Value";

    case "TARGET_CPA":
      return "Target CPA";

    case "TARGET_ROAS":
      return "Target ROAS";

    case "TARGET_IMPRESSION_SHARE":
      return "Target Impression Share";

    case "MAXIMIZE_CLICKS":
      return "Maximize Clicks";

    case "COMMISSION":
      return "Commission";

    case "TARGET_SPEND":
      return "Target Spend";

    case "MANUAL_CPM":
      return "Manual CPM";

    case "MANUAL_CPV":
      return "Manual CPV";

    case "PAGE_ONE_PROMOTED":
      return "Page One Promoted";

    case "UNKNOWN":
      return "Unknown";

    case "UNSPECIFIED":
      return "Unspecified";

    default:
      return normalized || "Unknown";
  }
}

// ======================================================
// FORMAT DATE
// ======================================================

function formatCampaignDate(
  value: any
): string {
  if (!value) {
    return "";
  }

  const dateString =
    String(value);

  // Google Ads normally returns:
  //
  // 2026-08-12 04:23:37
  //
  // Keep it readable instead of converting it
  // through the browser timezone.

  if (
    /^\d{4}-\d{2}-\d{2}/.test(
      dateString
    )
  ) {
    return dateString;
  }

  return dateString;
}

// ======================================================
// EXTRACT CAMPAIGN ID
// ======================================================

function getCampaignId(
  resourceName: string,
  fallbackId?: any
): string {
  if (fallbackId !== undefined) {
    return String(fallbackId);
  }

  const parts =
    String(resourceName).split("/");

  return parts[parts.length - 1] || "";
}

// ======================================================
// GET CAMPAIGNS
// ======================================================

export async function GET() {
  try {
    // ==================================================
    // ENVIRONMENT VALIDATION
    // ==================================================

    const requiredEnv = [
      "GOOGLE_ADS_CLIENT_ID",
      "GOOGLE_ADS_CLIENT_SECRET",
      "GOOGLE_ADS_DEVELOPER_TOKEN",
      "GOOGLE_ADS_CUSTOMER_ID",
      "GOOGLE_ADS_REFRESH_TOKEN",
    ];

    const missingEnv =
      requiredEnv.filter(
        (key) =>
          !process.env[key]
      );

    if (missingEnv.length > 0) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Missing Google Ads environment variables",

          missing:
            missingEnv,
        },
        {
          status: 500,
        }
      );
    }

    // ==================================================
    // GOOGLE ADS CLIENT
    // ==================================================

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

    // ==================================================
    // CUSTOMER
    // ==================================================

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

    // ==================================================
    // GOOGLE ADS QUERY
    // ==================================================
    //
    // IMPORTANT:
    //
    // Do NOT use:
    //
    // campaign.start_date
    //
    // Google Ads v24 exposes:
    //
    // campaign.start_date_time
    //
    // ==================================================

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.resource_name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.advertising_channel_sub_type,
        campaign.start_date_time,
        campaign.campaign_budget,
        campaign.bidding_strategy_type,
        campaign.primary_status
      FROM campaign
      ORDER BY campaign.id DESC
    `;

    console.log(
      "Fetching Google Ads campaigns..."
    );

    // ==================================================
    // RUN QUERY
    // ==================================================

    const rows =
      await customer.query(
        query
      );

    console.log(
      `Google Ads returned ${
        rows.length
      } campaigns`
    );

    // ==================================================
    // MAP RESPONSE
    // ==================================================

    const campaigns =
      rows.map(
        (row: any) => {
          const campaign =
            row.campaign;

          if (!campaign) {
            return null;
          }

          const resourceName =
            campaign.resource_name ||
            "";

          return {
            // ------------------------------------------
            // BASIC INFORMATION
            // ------------------------------------------

            id: getCampaignId(
              resourceName,
              campaign.id
            ),

            name:
              campaign.name ||
              "Unnamed Campaign",

            resourceName:
              resourceName,

            // ------------------------------------------
            // HUMAN READABLE STATUS
            // ------------------------------------------

            status:
              getCampaignStatus(
                campaign.status
              ),

            // ------------------------------------------
            // HUMAN READABLE TYPE
            // ------------------------------------------

            channelType:
              getCampaignType(
                campaign.advertising_channel_type
              ),

            // ------------------------------------------
            // SUB TYPE
            // ------------------------------------------

            channelSubType:
              normalizeEnumValue(
                campaign.advertising_channel_sub_type
              ),

            // ------------------------------------------
            // DATE
            // ------------------------------------------

            startDate:
              formatCampaignDate(
                campaign.start_date_time
              ),

            // ------------------------------------------
            // BUDGET
            // ------------------------------------------

            campaignBudget:
              campaign.campaign_budget ||
              null,

            // ------------------------------------------
            // BIDDING STRATEGY
            // ------------------------------------------

            biddingStrategy:
              getBiddingStrategy(
                campaign.bidding_strategy_type
              ),

            // ------------------------------------------
            // PRIMARY STATUS
            // ------------------------------------------

            primaryStatus:
              normalizeEnumValue(
                campaign.primary_status
              ),
          };
        }
      );

    // Remove any null values
    const cleanCampaigns =
      campaigns.filter(
        Boolean
      );

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json({
      success: true,

      count:
        cleanCampaigns.length,

      campaigns:
        cleanCampaigns,
    });
  } catch (error: any) {
    // ==================================================
    // ERROR LOGGING
    // ==================================================

    console.error(
      "Google Ads API Error:",
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

    // ==================================================
    // ERROR RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Failed to fetch campaigns",

        details:
          error?.errors || null,
      },
      {
        status: 500,
      }
    );
  }
}