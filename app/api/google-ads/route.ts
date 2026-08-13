import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get OAuth access token
    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
          client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
          refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
          grant_type: "refresh_token",
        }),
      }
    );

    const token = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json(
        {
          error: "OAuth failed",
          details: token,
        },
        { status: 401 }
      );
    }

    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!;
    const managerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!;

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type
      FROM campaign
      ORDER BY campaign.id
    `;

    const response = await fetch(
      `https://googleads.googleapis.com/v25/customers/${customerId}/googleAds:search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.access_token}`,
          "developer-token":
            process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
          "login-customer-id": managerId,
        },
        body: JSON.stringify({
          query,
        }),
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: String(error),
      },
      { status: 500 }
    );
  }
}