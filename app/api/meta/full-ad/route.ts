import { NextRequest, NextResponse } from "next/server";

function getMetaErrorMessage(error: any) {
  if (!error) return "Meta API request failed.";

  const details = [
    error?.error_user_title,
    error?.error_user_msg,
    error?.message,
    error?.code
      ? `Meta error ${error.code}${
          error.error_subcode
            ? `/${error.error_subcode}`
            : ""
        }`
      : "",
  ].filter(Boolean);

  return details.join(" ") || "Meta API request failed.";
}

async function callMetaGraph(
  endpoint: string,
  body: Record<string, any>,
  accessToken: string
) {
  const response = await fetch(
    `https://graph.facebook.com/v24.0/${endpoint}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    throw Object.assign(
      new Error(
        getMetaErrorMessage(data.error || data)
      ),
      {
        metaError: data.error || data,
      }
    );
  }

  return data;
}

function parseCarouselItems(input: unknown) {
  if (Array.isArray(input)) {
    return input;
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

export async function POST(
  req: NextRequest
) {
  let stage = "request validation";

  const created: Record<string, string> = {};

  try {
    // =========================================================
    // AUTHENTICATION
    // =========================================================

    const accessToken =
      req.cookies.get(
        "meta_access_token"
      )?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Meta account is not connected",
        },
        { status: 401 }
      );
    }

    // =========================================================
    // REQUEST BODY
    // =========================================================

    const body = await req.json();

    const {
      adAccountId,
      campaignName,
      objective,

      adSetName,
      dailyBudget,

      country,
      ageMin,
      ageMax,

      pageId,

      creativeType,
      primaryText,
      headline,
      description,
      destinationUrl,

      imageUrl,
      videoId,
      carouselItems,

      callToAction,
    } = body || {};

    // =========================================================
    // VALIDATION
    // =========================================================

    if (
      !adAccountId ||
      !campaignName?.trim() ||
      !objective
    ) {
      return NextResponse.json(
        {
          error:
            "Campaign account, name, and objective are required.",
        },
        { status: 400 }
      );
    }

    if (
      !adSetName?.trim() ||
      !dailyBudget ||
      !pageId ||
      !primaryText?.trim() ||
      !headline?.trim() ||
      !destinationUrl?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Ad set name, daily budget, page ID, primary text, headline, and destination URL are required.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // CREATIVE TYPE
    // =========================================================

    const creativeKind = String(
      creativeType || "image"
    ).toLowerCase();

    const slideItems =
      parseCarouselItems(
        carouselItems
      ).filter(Boolean);

    if (
      ![
        "image",
        "video",
        "carousel",
      ].includes(creativeKind)
    ) {
      return NextResponse.json(
        {
          error:
            "Creative type must be image, video, or carousel.",
        },
        { status: 400 }
      );
    }

    if (
      creativeKind === "image" &&
      !imageUrl?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Image URL is required for image ads.",
        },
        { status: 400 }
      );
    }

    if (
      creativeKind === "video" &&
      !videoId?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Video ID is required for video ads.",
        },
        { status: 400 }
      );
    }

    if (
      creativeKind === "carousel" &&
      (slideItems.length < 2 ||
        slideItems.length > 10)
    ) {
      return NextResponse.json(
        {
          error:
            "Carousel ads require between 2 and 10 slides.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // NORMALIZE VALUES
    // =========================================================

    const accountId = String(
      adAccountId
    ).replace(/^act_/, "");

    const budgetValue =
      Number(dailyBudget);

    if (
      !Number.isFinite(
        budgetValue
      ) ||
      budgetValue <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Daily budget must be a positive number.",
        },
        { status: 400 }
      );
    }

    /*
     * Meta expects ad budgets in the
     * smallest currency unit.
     *
     * Example:
     * $10 -> 1000
     */
    const normalizedBudget =
      Math.round(
        budgetValue * 100
      );

    // Keep age values for backwards compatibility.
    // They are NOT sent to Advantage+ Audience targeting.
    const ageMinValue =
      Number(ageMin || 18);

    const ageMaxValue =
      Number(ageMax || 65);

    if (
      ageMinValue < 18 ||
      ageMaxValue < ageMinValue
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid age range.",
        },
        { status: 400 }
      );
    }

    const countryCode =
      String(country || "US")
        .trim()
        .toUpperCase();

    const ctaType =
      String(
        callToAction ||
          "LEARN_MORE"
      ).trim();

    // =========================================================
    // OBJECTIVE → OPTIMIZATION GOAL
    // =========================================================

    const optimizationGoalMap: Record<
      string,
      string
    > = {
      OUTCOME_TRAFFIC:
        "LINK_CLICKS",

      OUTCOME_SALES:
        "OFFSITE_CONVERSIONS",

      OUTCOME_LEADS:
        "LEAD_GENERATION",

      OUTCOME_ENGAGEMENT:
        "POST_ENGAGEMENT",

      OUTCOME_AWARENESS:
        "REACH",

      OUTCOME_APP_PROMOTION:
        "APP_INSTALLS",
    };

    const optimizationGoal =
      optimizationGoalMap[
        String(objective)
      ] || "LINK_CLICKS";





      // =========================================================
// FACEBOOK PAGE VALIDATION
// =========================================================

stage = "facebook page validation";

const pageCheck = await fetch(
  `https://graph.facebook.com/v24.0/${String(
    pageId
  )}?fields=id,name&access_token=${accessToken}`,
  {
    method: "GET",
    cache: "no-store",
  }
);

const pageData = await pageCheck.json();

if (!pageCheck.ok || pageData.error) {
  throw Object.assign(
    new Error(
      `Facebook Page ${pageId} is not accessible: ${
        pageData?.error?.message ||
        "Unknown Page error"
      }`
    ),
    {
      metaError: pageData.error,
    }
  );
}

console.log("META PAGE:", pageData);

    // =========================================================
    // 1. CREATE CAMPAIGN
    // =========================================================

    stage =
      "campaign creation";

    const campaign =
      await callMetaGraph(
        `act_${accountId}/campaigns`,
        {
          name: String(
            campaignName
          ).trim(),

          objective:
            String(objective),

          status: "PAUSED",

          special_ad_categories: [],

          is_adset_budget_sharing_enabled:
            false,
        },
        accessToken
      );

    created.campaignId =
      String(campaign.id);

    // =========================================================
    // 2. CREATE AD SET
    // =========================================================

    stage =
      "ad set creation";

    /*
     * Advantage+ Audience
     *
     * Do NOT send:
     * - age_min
     * - age_max
     * - promoted_object
     */

    const targeting = {
      geo_locations: {
        countries: [
          countryCode,
        ],
      },

      targeting_automation: {
        advantage_audience: 1,
      },
    };

    const adSet =
      await callMetaGraph(
        `act_${accountId}/adsets`,
        {
          name: String(
            adSetName
          ).trim(),

          campaign_id:
            String(
              campaign.id
            ),

          daily_budget:
            normalizedBudget,

          billing_event:
            "IMPRESSIONS",

          optimization_goal:
            optimizationGoal,

          bid_strategy:
            "LOWEST_COST_WITHOUT_CAP",

          status: "PAUSED",

          targeting,
        },
        accessToken
      );

    created.adSetId =
      String(adSet.id);

    // =========================================================
    // 3. CREATE CREATIVE
    // =========================================================

    let creativeBody: Record<
      string,
      any
    >;

    // =========================================================
    // IMAGE CREATIVE
    // =========================================================

    if (
      creativeKind ===
      "image"
    ) {
      stage =
        "creative creation";

      /*
       * IMPORTANT
       *
       * We DO NOT call:
       *
       * /adimages
       *
       * Instead Meta receives the public
       * image URL through:
       *
       * object_story_spec.link_data.picture
       *
       * This is appropriate for a public
       * image URL such as Unsplash.
       */

      creativeBody = {
        name: `${String(
          campaignName
        ).trim()} Image Creative`,

        object_story_spec: {
          page_id:
            String(pageId),

          link_data: {
            link: String(
              destinationUrl
            ).trim(),

            message: String(
              primaryText
            ).trim(),

            name: String(
              headline
            ).trim(),

            ...(description?.trim()
              ? {
                  description:
                    String(
                      description
                    ).trim(),
                }
              : {}),

            picture:
              String(
                imageUrl
              ).trim(),

            call_to_action: {
              type: ctaType,

              value: {
                link: String(
                  destinationUrl
                ).trim(),
              },
            },
          },
        },
      };
    }

    // =========================================================
    // VIDEO CREATIVE
    // =========================================================

    else if (
      creativeKind ===
      "video"
    ) {
      stage =
        "creative creation";

      creativeBody = {
        name: `${String(
          campaignName
        ).trim()} Video Creative`,

        object_story_spec: {
          page_id:
            String(pageId),

          video_data: {
            video_id:
              String(
                videoId
              ).trim(),

            message:
              String(
                primaryText
              ).trim(),

            title:
              String(
                headline
              ).trim(),

            ...(description?.trim()
              ? {
                  description:
                    String(
                      description
                    ).trim(),
                }
              : {}),

            call_to_action: {
              type: ctaType,

              value: {
                link: String(
                  destinationUrl
                ).trim(),
              },
            },
          },
        },
      };
    }

    // =========================================================
    // CAROUSEL CREATIVE
    // =========================================================

    else {
      stage =
        "carousel creative creation";

      const carouselAttachments =
        [];

      for (
        let index = 0;
        index <
        slideItems.length;
        index++
      ) {
        const slide =
          slideItems[index];

        const slideImageUrl =
          String(
            slide?.image_url ||
              slide?.imageUrl ||
              imageUrl ||
              ""
          ).trim();

        if (!slideImageUrl) {
          throw new Error(
            `Carousel slide ${
              index + 1
            } is missing an image URL.`
          );
        }

        const slideLink =
          String(
            slide?.link ||
              destinationUrl
          ).trim();

        const slideTitle =
          String(
            slide?.title ||
              `${headline} ${
                index + 1
              }`
          ).trim();

        const slideDescription =
          String(
            slide?.description ||
              description ||
              ""
          ).trim();

        /*
         * Do NOT upload the image.
         *
         * Meta receives the public URL
         * directly through "picture".
         */

        carouselAttachments.push({
          link: slideLink,

          picture:
            slideImageUrl,

          name:
            slideTitle,

          ...(slideDescription
            ? {
                description:
                  slideDescription,
              }
            : {}),

          call_to_action: {
            type: ctaType,

            value: {
              link: slideLink,
            },
          },
        });
      }

      creativeBody = {
        name: `${String(
          campaignName
        ).trim()} Carousel Creative`,

        object_story_spec: {
          page_id:
            String(pageId),

          link_data: {
            link: String(
              destinationUrl
            ).trim(),

            message: String(
              primaryText
            ).trim(),

            name: String(
              headline
            ).trim(),

            child_attachments:
              carouselAttachments,
          },
        },
      };
    }

    // =========================================================
    // 4. CREATE AD CREATIVE
    // =========================================================

    stage =
      "creative creation";

    const creative =
      await callMetaGraph(
        `act_${accountId}/adcreatives`,
        creativeBody,
        accessToken
      );

    created.creativeId =
      String(creative.id);

    // =========================================================
    // 5. CREATE AD
    // =========================================================

    stage =
      "ad creation";

    const ad =
      await callMetaGraph(
        `act_${accountId}/ads`,
        {
          name: `${String(
            campaignName
          ).trim()} Ad`,

          adset_id:
            String(
              adSet.id
            ),

          creative: {
            creative_id:
              String(
                creative.id
              ),
          },

          status: "PAUSED",
        },
        accessToken
      );

    created.adId =
      String(ad.id);

    // =========================================================
    // SUCCESS
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        campaign,

        adSet,

        creative,

        ad,

        message:
          "Meta campaign, ad set, creative, and ad were created successfully.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    // =========================================================
    // ERROR
    // =========================================================

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Something went wrong while creating the Meta ad.",

        stage,

        created,

        metaError:
          error?.metaError
            ? {
                code:
                  error.metaError
                    .code,

                subcode:
                  error.metaError
                    .error_subcode,

                fbtraceId:
                  error.metaError
                    .fbtrace_id,

                type:
                  error.metaError
                    .type,

                message:
                  error.metaError
                    .message,
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}