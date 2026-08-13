
import { NextResponse } from "next/server";
import { GoogleAdsApi } from "google-ads-api";

export async function POST(request: Request) {
  let currentStep = "initialization";

  try {
    // ==================================================
    // READ REQUEST
    // ==================================================

    const body = await request.json();

    const {
      campaignName,
      dailyBudget,
      status,
      biddingStrategy,
      maxCpc,
      websiteUrl,

      containsEuPoliticalAdvertising,

      targetGoogleSearch,
      targetSearchNetwork,
      targetContentNetwork,
      targetPartnerSearchNetwork,

      adGroupName,

      keywords,
      headlines,
      descriptions,
    } = body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!campaignName?.trim()) {
      throw new Error(
        "Campaign name is required."
      );
    }

    if (
      !dailyBudget ||
      Number(dailyBudget) <= 0
    ) {
      throw new Error(
        "Daily budget must be greater than 0."
      );
    }

    if (!websiteUrl?.trim()) {
      throw new Error(
        "Final URL is required."
      );
    }

    if (!adGroupName?.trim()) {
      throw new Error(
        "Ad group name is required."
      );
    }

    if (
      !containsEuPoliticalAdvertising
    ) {
      throw new Error(
        "EU political advertising declaration is required."
      );
    }

    // ==================================================
    // CLEAN ARRAYS
    // ==================================================

    const cleanKeywords = (
      Array.isArray(keywords)
        ? keywords
        : []
    )
      .map((keyword: string) =>
        String(keyword).trim()
      )
      .filter(Boolean);

    const cleanHeadlines = (
      Array.isArray(headlines)
        ? headlines
        : []
    )
      .map((headline: string) =>
        String(headline).trim()
      )
      .filter(Boolean);

    const cleanDescriptions = (
      Array.isArray(descriptions)
        ? descriptions
        : []
    )
      .map((description: string) =>
        String(description).trim()
      )
      .filter(Boolean);

    if (
      cleanKeywords.length === 0
    ) {
      throw new Error(
        "At least one keyword is required."
      );
    }

    if (
      cleanHeadlines.length < 3
    ) {
      throw new Error(
        "At least 3 headlines are required for the responsive search ad."
      );
    }

    if (
      cleanDescriptions.length < 2
    ) {
      throw new Error(
        "At least 2 descriptions are required for the responsive search ad."
      );
    }

    // ==================================================
    // GOOGLE ADS CLIENT
    // ==================================================

    currentStep =
      "connecting to Google Ads";

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

    // ==================================================
    // UNIQUE NAMES
    // ==================================================

    const timestamp =
      Date.now();

    const budgetName =
      `${campaignName} Budget ${timestamp}`;

    const finalCampaignName =
      `${campaignName} ${timestamp}`;

    // ==================================================
    // 1. CREATE BUDGET
    // ==================================================

    currentStep =
      "creating campaign budget";

    console.log(
      "[Google Ads] Step 1: Creating budget"
    );

    const budgetResponse =
      await customer.campaignBudgets.create([
        {
          name: budgetName,

          amount_micros:
            Math.round(
              Number(dailyBudget) *
                1_000_000
            ),

          delivery_method:
            "STANDARD",
        },
      ]);

    const budgetResource =
      budgetResponse.results[0]
        ?.resource_name;

    if (!budgetResource) {
      throw new Error(
        "Google Ads created the budget but did not return a resource name."
      );
    }

    console.log(
      "[Google Ads] Budget created:",
      budgetResource
    );

    // ==================================================
    // 2. CREATE CAMPAIGN
    // ==================================================

    currentStep =
      "creating campaign";

    console.log(
      "[Google Ads] Step 2: Creating campaign"
    );

    const campaignResponse =
      await customer.campaigns.create([
        {
          name: finalCampaignName,

          advertising_channel_type:
            "SEARCH",

          status:
            status === "ENABLED"
              ? "ENABLED"
              : "PAUSED",

          campaign_budget:
            budgetResource,

          // Manual CPC
          manual_cpc: {},

          // Required by current Google Ads API
          contains_eu_political_advertising:
            containsEuPoliticalAdvertising,

          network_settings: {
            target_google_search:
              targetGoogleSearch !== false,

            target_search_network:
              targetSearchNetwork === true,

            target_content_network:
              targetContentNetwork === true,

            target_partner_search_network:
              targetPartnerSearchNetwork ===
              true,
          },
        },
      ]);

    const campaignResource =
      campaignResponse.results[0]
        ?.resource_name;

    if (!campaignResource) {
      throw new Error(
        "Google Ads created the campaign but did not return a resource name."
      );
    }

    console.log(
      "[Google Ads] Campaign created:",
      campaignResource
    );

    // ==================================================
    // 3. CREATE AD GROUP
    // ==================================================

    currentStep =
      "creating ad group";

    console.log(
      "[Google Ads] Step 3: Creating ad group"
    );

    const adGroupResponse =
      await customer.adGroups.create([
        {
          name:
            adGroupName.trim(),

          campaign:
            campaignResource,

          status: "PAUSED",

          cpc_bid_micros:
            Math.round(
              Number(maxCpc || 20) *
                1_000_000
            ),
        },
      ]);

    const adGroupResource =
      adGroupResponse.results[0]
        ?.resource_name;

    if (!adGroupResource) {
      throw new Error(
        "Google Ads created the ad group but did not return a resource name."
      );
    }

    console.log(
      "[Google Ads] Ad group created:",
      adGroupResource
    );

    // ==================================================
    // 4. CREATE KEYWORDS
    // ==================================================

   // ==================================================
// 4. CREATE KEYWORDS
// ==================================================

currentStep = "creating keywords";

console.log(
  "[Google Ads] Step 4: Creating keywords"
);

const keywordOperations = cleanKeywords.map(
  (keyword: string) => ({
    ad_group: adGroupResource,

    status: "PAUSED",

    keyword: {
      text: keyword,
      match_type: "PHRASE",
    },
  })
);

// google-ads-api@24.1.0 has an overly restrictive
// TypeScript type for create().
// These are valid create operations even though
// the generated type expects the full resource.
await customer.adGroupCriteria.create(
  keywordOperations as any
);

console.log(
  "[Google Ads] Keywords created:",
  cleanKeywords
);
    // ==================================================
    // 5. CREATE RESPONSIVE SEARCH AD
    // ==================================================

    currentStep =
      "creating responsive search ad";

    console.log(
      "[Google Ads] Step 5: Creating responsive search ad"
    );

    const adResponse =
      await customer.adGroupAds.create([
        {
          ad_group:
            adGroupResource,

          status:
            "PAUSED",

          ad: {
            responsive_search_ad: {
              headlines:
                cleanHeadlines.map(
                  (
                    headline: string
                  ) => ({
                    text: headline,
                  })
                ),

              descriptions:
                cleanDescriptions.map(
                  (
                    description: string
                  ) => ({
                    text:
                      description,
                  })
                ),
            },

            final_urls: [
              websiteUrl.trim(),
            ],
          },
        },
      ]);

    const adResource =
      adResponse.results[0]
        ?.resource_name;

    if (!adResource) {
      throw new Error(
        "Google Ads created the ad but did not return a resource name."
      );
    }

    console.log(
      "[Google Ads] Ad created:",
      adResource
    );

    // ==================================================
    // SUCCESS
    // ==================================================

    return NextResponse.json({
      success: true,

      message:
        "Google Ads campaign created successfully.",

      campaign: {
        name:
          finalCampaignName,

        resource_name:
          campaignResource,

        status:
          status === "ENABLED"
            ? "ENABLED"
            : "PAUSED",
      },

      budget: {
        name:
          budgetName,

        resource_name:
          budgetResource,

        daily_budget:
          Number(dailyBudget),
      },

      ad_group: {
        name:
          adGroupName,

        resource_name:
          adGroupResource,
      },

      keywords:
        cleanKeywords,

      ad: {
        resource_name:
          adResource,

        final_url:
          websiteUrl,
      },
    });

  } catch (error: any) {
    // ==================================================
    // DETAILED ERROR
    // ==================================================

    console.error(
      "=========================================="
    );

    console.error(
      "GOOGLE ADS CREATE CAMPAIGN FAILED"
    );

    console.error(
      "STEP:",
      currentStep
    );

    console.error(
      "MESSAGE:",
      error?.message
    );

    console.error(
      "FULL ERROR:",
      JSON.stringify(
        error,
        null,
        2
      )
    );

    if (error?.errors) {
      for (
        const err of error.errors
      ) {
        console.error(
          "------------------------------------------"
        );

        console.error(
          "ERROR MESSAGE:",
          err.message
        );

        console.error(
          "ERROR CODE:",
          JSON.stringify(
            err.error_code,
            null,
            2
          )
        );

        console.error(
          "LOCATION:",
          JSON.stringify(
            err.location,
            null,
            2
          )
        );

        console.error(
          "TRIGGER:",
          JSON.stringify(
            err.trigger,
            null,
            2
          )
        );
      }
    }

    console.error(
      "=========================================="
    );

    return NextResponse.json(
      {
        success: false,

        step:
          currentStep,

        error:
          error?.message ||
          "Failed to create Google Ads campaign",

        details:
          error?.errors || null,
      },
      {
        status: 500,
      }
    );
  }
}

