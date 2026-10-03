import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const destination = new URL("/meta", request.url);
    destination.searchParams.set(
      "error",
      errorDescription || error
    );
    return NextResponse.redirect(destination);
  }

  if (!code) {
    const destination = new URL("/meta", request.url);
    destination.searchParams.set("error", "Meta did not return an authorization code");
    return NextResponse.redirect(destination);
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI;

  if (!appId || !appSecret || !redirectUri) {
    const destination = new URL("/meta", request.url);
    destination.searchParams.set("error", "Meta connection is not configured");
    return NextResponse.redirect(destination);
  }

  try {
    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    });

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v24.0/oauth/access_token?${tokenParams.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error("Meta token exchange failed");
      const destination = new URL("/meta", request.url);
      destination.searchParams.set("error", "Meta authorization could not be completed");
      return NextResponse.redirect(destination);
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      const destination = new URL("/meta", request.url);
      destination.searchParams.set("error", "Meta did not return an access token");
      return NextResponse.redirect(destination);
    }

    const destination = new URL("/meta?connected=1", request.url);
    const response = NextResponse.redirect(destination);
    response.cookies.set("meta_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/meta",
      maxAge: Number(tokenData.expires_in) || 60 * 60,
    });
    return response;
  } catch (error) {
    console.error("Meta callback error:", error);
    const destination = new URL("/meta", request.url);
    destination.searchParams.set("error", "Something went wrong connecting to Meta");
    return NextResponse.redirect(destination);
  }
}