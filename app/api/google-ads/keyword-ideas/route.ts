import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GenerateKeywordIdeasBody = {
  keywords?: string[];
  pageUrl?: string;
  locations?: string[];
  useSearchPartners?: boolean;
};

function normalizeCustomerId(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeGeoTarget(value: string) {
  if (value.startsWith("geoTargetConstants/")) {
    return value;
  }

  return `geoTargetConstants/${value}`;
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as GenerateKeywordIdeasBody;

    const customerId = normalizeCustomerId(
      process.env.GOOGLE_ADS_CUSTOMER_ID || ""
    );

    const developerToken =
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";

    const clientId =
      process.env.GOOGLE_ADS_CLIENT_ID || "";

    const clientSecret =
      process.env.GOOGLE_ADS_CLIENT_SECRET || "";

    const refreshToken =
      process.env.GOOGLE_ADS_REFRESH_TOKEN || "";

    const loginCustomerId = process.env
      .GOOGLE_ADS_LOGIN_CUSTOMER_ID
      ? normalizeCustomerId(
          process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
        )
      : "";

    if (
      !customerId ||
      !developerToken ||
      !clientId ||
      !clientSecret ||
      !refreshToken
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Google Ads credentials are not configured on the server.",
        },
        { status: 500 }
      );
    }

    const keywords = Array.isArray(body.keywords)
      ? body.keywords
          .map((keyword) => String(keyword).trim())
          .filter(Boolean)
          .slice(0, 20)
      : [];

    const pageUrl =
      typeof body.pageUrl === "string"
        ? body.pageUrl.trim()
        : "";

    if (!keywords.length && !pageUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Provide at least one keyword or a website URL.",
        },
        { status: 400 }
      );
    }

    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
        cache: "no-store",
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error(
        "Google OAuth token error:",
        tokenData
      );

      return NextResponse.json(
        {
          success: false,
          error:
            tokenData.error_description ||
            "Could not refresh the Google Ads access token.",
        },
        { status: 401 }
      );
    }

    const geoTargetConstants = Array.isArray(
      body.locations
    )
      ? body.locations
          .filter(Boolean)
          .slice(0, 10)
          .map(normalizeGeoTarget)
      : [];

    const payload: Record<string, unknown> = {
      customerId,
      language: "languageConstants/1000",
      geoTargetConstants,
      includeAdultKeywords: false,
      keywordPlanNetwork: body.useSearchPartners
        ? "GOOGLE_SEARCH_AND_PARTNERS"
        : "GOOGLE_SEARCH",
      pageSize: 100,
    };

    // Google requires exactly one seed type.
    if (keywords.length && pageUrl) {
      payload.keywordAndUrlSeed = {
        keywords,
        url: pageUrl,
      };
    } else if (keywords.length) {
      payload.keywordSeed = {
        keywords,
      };
    } else {
      payload.urlSeed = {
        url: pageUrl,
      };
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "developer-token": developerToken,
      Authorization: `Bearer ${tokenData.access_token}`,
    };

    if (loginCustomerId) {
      headers["login-customer-id"] = loginCustomerId;
    }

    const googleResponse = await fetch(
      `https://googleads.googleapis.com/v25/customers/${customerId}:generateKeywordIdeas`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const googleData = await googleResponse.json();

    if (!googleResponse.ok) {
      console.error(
        "GenerateKeywordIdeas error:",
        JSON.stringify(googleData)
      );

      const googleMessage =
        googleData?.error?.message ||
        "Google Ads could not generate keyword ideas.";

      return NextResponse.json(
        {
          success: false,
          error: googleMessage,
        },
        { status: googleResponse.status }
      );
    }

    const ideas = Array.isArray(googleData.results)
      ? googleData.results
          .map((result: any) => {
            const metrics =
              result.keywordIdeaMetrics || {};

            return {
              text: result.text || "",
              avgMonthlySearches: Number(
                metrics.avgMonthlySearches || 0
              ),
              competition:
                metrics.competition || "UNSPECIFIED",
              competitionIndex:
                metrics.competitionIndex == null
                  ? null
                  : Number(metrics.competitionIndex),
            };
          })
          .filter((idea: { text: string }) =>
            Boolean(idea.text)
          )
          .sort(
            (
              a: { avgMonthlySearches: number },
              b: { avgMonthlySearches: number }
            ) =>
              b.avgMonthlySearches -
              a.avgMonthlySearches
          )
          .slice(0, 30)
      : [];

    return NextResponse.json({
      success: true,
      ideas,
      totalSize: Number(
        googleData.totalSize || ideas.length
      ),
      nextPageToken:
        googleData.nextPageToken || null,
    });
  } catch (error: any) {
    console.error(
      "Keyword ideas route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to generate keyword ideas.",
      },
      { status: 500 }
    );
  }
}