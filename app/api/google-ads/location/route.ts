import { NextResponse } from "next/server";
import { GoogleAdsApi } from "google-ads-api";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("query")?.trim() || "";
    const countryCode =
      searchParams.get("countryCode")?.trim() || "";

    if (!query) {
      return NextResponse.json(
        {
          success: true,
          locations: [],
        },
        {
          headers: corsHeaders,
        }
      );
    }

    // --------------------------------------------------
    // GOOGLE ADS CLIENT
    // --------------------------------------------------

    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });

    // --------------------------------------------------
    // CUSTOMER
    // --------------------------------------------------

    const customer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
      login_customer_id:
        process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    });

    // --------------------------------------------------
    // CREATE REQUEST
    // --------------------------------------------------

    const requestBody: any = {
      locale: "en",
      location_names: {
        names: [query],
      },
    };

    // Optional country filter
    if (countryCode) {
      requestBody.country_code =
        countryCode.toUpperCase();
    }

    // --------------------------------------------------
    // GOOGLE ADS GEO TARGET SEARCH
    // --------------------------------------------------

    const response =
      await customer.geoTargetConstants.suggestGeoTargetConstants(
        requestBody
      );

    // --------------------------------------------------
    // FORMAT RESULTS
    // --------------------------------------------------

    const suggestions =
      response.geo_target_constant_suggestions || [];

    const locations = suggestions
      .map((suggestion: any) => {
        const geo = suggestion.geo_target_constant;

        if (!geo) {
          return null;
        }

        return {
          id: geo.id?.toString() || "",

          name: geo.name || "",

          canonicalName:
            geo.canonical_name || "",

          countryCode:
            geo.country_code || "",

          targetType:
            geo.target_type || "",

          status:
            geo.status || "",

          resourceName:
            geo.resource_name || "",

          reach: suggestion.reach
            ? Number(suggestion.reach)
            : null,

          searchTerm:
            suggestion.search_term || query,

          parents: (
            suggestion.geo_target_constant_parents || []
          ).map((parent: any) => ({
            id: parent.id?.toString() || "",

            name: parent.name || "",

            resourceName:
              parent.resource_name || "",
          })),
        };
      })
      .filter(Boolean);

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        query,
        count: locations.length,
        locations,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    console.error(
      "Google Ads location search error:",
      error
    );

    // Detailed Google Ads error logging
    if (error?.errors) {
      for (const err of error.errors) {
        console.error(
          "Google Ads location error:",
          err.message
        );

        console.error(
          "Error code:",
          JSON.stringify(
            err.error_code,
            null,
            2
          )
        );

        console.error(
          "Location:",
          JSON.stringify(
            err.location,
            null,
            2
          )
        );

        console.error(
          "Trigger:",
          JSON.stringify(
            err.trigger,
            null,
            2
          )
        );
      }
    }

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Failed to search Google Ads locations",

        details:
          error?.errors || null,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}