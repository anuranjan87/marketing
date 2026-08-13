"use client";

import { useEffect, useRef, useState } from "react";

// ======================================================
// TYPES
// ======================================================

type Campaign = {
  id: string;
  name: string;
  status: string;
  channelType: string;
  startDate: string;
  endDate?: string;
  resourceName: string;
  campaignBudget?: string;
  biddingStrategy?: string;
  primaryStatus?: string;
};

type CampaignLocation = {
  id: string;
  name: string;
  canonicalName: string;
  countryCode: string;
  targetType: string;
  status: string;
  resourceName: string;
  reach: number | null;
  searchTerm?: string;
};

type FormState = {
  campaignName: string;
  dailyBudget: number;
  status: "PAUSED" | "ENABLED";
  biddingStrategy: string;
  maxCpc: number;
  websiteUrl: string;

  locations: CampaignLocation[];

  containsEuPoliticalAdvertising: string;

  targetGoogleSearch: boolean;
  targetSearchNetwork: boolean;
  targetContentNetwork: boolean;
  targetPartnerSearchNetwork: boolean;

  adGroupName: string;

  keywords: string[];
  headlines: string[];
  descriptions: string[];
};

// ======================================================
// DEFAULT FORM
// ======================================================

const defaultForm: FormState = {
  campaignName: "7wingz Website Builder",

  dailyBudget: 500,

  status: "PAUSED",

  biddingStrategy: "MANUAL_CPC",

  maxCpc: 20,

  websiteUrl: "https://7wingz.com",

  locations: [],

  containsEuPoliticalAdvertising:
    "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",

  targetGoogleSearch: true,

  targetSearchNetwork: true,

  targetContentNetwork: false,

  targetPartnerSearchNetwork: false,

  adGroupName: "Website Builder",

  keywords: [
    "website builder",
    "create website",
    "ai website builder",
  ],

  headlines: [
    "Build Your Website With 7wingz",
    "Create A Website In Minutes",
    "Beautiful Website Templates",
  ],

  descriptions: [
    "Create a beautiful website with 7wingz.",
    "Choose a template and start building today.",
  ],
};

// ======================================================
// PAGE
// ======================================================

export default function GoogleAdsPage() {
  // ====================================================
  // NAVIGATION
  // ====================================================

  const [activeTab, setActiveTab] = useState<
    "create" | "history"
  >("create");

  // ====================================================
  // FORM
  // ====================================================

  const [form, setForm] = useState<FormState>({
    ...defaultForm,
    keywords: [...defaultForm.keywords],
    headlines: [...defaultForm.headlines],
    descriptions: [...defaultForm.descriptions],
    locations: [],
  });

  const [editingCampaignId, setEditingCampaignId] =
    useState<string | null>(null);

  // ====================================================
  // CREATE
  // ====================================================

  const [creating, setCreating] = useState(false);

  const [createError, setCreateError] =
    useState("");

  const [createSuccess, setCreateSuccess] =
    useState("");

  // ====================================================
  // CAMPAIGN HISTORY
  // ====================================================

  const [campaigns, setCampaigns] =
    useState<Campaign[]>([]);

  const [campaignsLoading, setCampaignsLoading] =
    useState(false);

  const [campaignsError, setCampaignsError] =
    useState("");

  // ====================================================
  // LOCATION SEARCH
  // ====================================================

  const [locationQuery, setLocationQuery] =
    useState("");

  const [locationResults, setLocationResults] =
    useState<CampaignLocation[]>([]);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [locationError, setLocationError] =
    useState("");

  const [locationDropdownOpen, setLocationDropdownOpen] =
    useState(false);

  const locationSearchTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  // ====================================================
  // DELETE / REMOVE CAMPAIGN
  // ====================================================

  const [deletingCampaign, setDeletingCampaign] =
    useState<Campaign | null>(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState("");

  // ====================================================
  // LOAD HISTORY
  // ====================================================

  useEffect(() => {
    if (activeTab === "history") {
      fetchCampaigns();
    }
  }, [activeTab]);

  // ====================================================
  // UPDATE FORM
  // ====================================================

  function updateForm<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ====================================================
  // RESET FORM
  // ====================================================

  function resetForm() {
    setForm({
      ...defaultForm,

      keywords: [
        ...defaultForm.keywords,
      ],

      headlines: [
        ...defaultForm.headlines,
      ],

      descriptions: [
        ...defaultForm.descriptions,
      ],

      locations: [],
    });

    setEditingCampaignId(null);

    setCreateError("");

    setCreateSuccess("");

    setLocationQuery("");

    setLocationResults([]);

    setLocationError("");

    setLocationDropdownOpen(false);
  }

  // ====================================================
  // NEW CAMPAIGN
  // ====================================================

  function startNewCampaign() {
    resetForm();

    setActiveTab("create");
  }

  // ====================================================
  // FETCH CAMPAIGNS
  // ====================================================

  async function fetchCampaigns() {
    setCampaignsLoading(true);

    setCampaignsError("");

    try {
      const response = await fetch(
        "/api/google-ads/campaigns",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to fetch campaigns"
        );
      }

      setCampaigns(
        data.campaigns || []
      );
    } catch (error: any) {
      console.error(
        "Campaign fetch error:",
        error
      );

      setCampaignsError(
        error?.message ||
          "Failed to fetch campaigns"
      );
    } finally {
      setCampaignsLoading(false);
    }
  }

  // ====================================================
  // LOCATION SEARCH
  // ====================================================

  function handleLocationSearch(
    value: string
  ) {
    setLocationQuery(value);

    setLocationError("");

    if (locationSearchTimer.current) {
      clearTimeout(
        locationSearchTimer.current
      );
    }

    if (value.trim().length < 2) {
      setLocationResults([]);

      setLocationDropdownOpen(false);

      return;
    }

    setLocationDropdownOpen(true);

    locationSearchTimer.current =
      setTimeout(() => {
        searchLocations(
          value.trim()
        );
      }, 400);
  }

  async function searchLocations(
    query: string
  ) {
    setLocationLoading(true);

    setLocationError("");

    try {
      const response = await fetch(
        `/api/google-ads/location?query=${encodeURIComponent(
          query
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to search locations"
        );
      }

      setLocationResults(
        data.locations || []
      );
    } catch (error: any) {
      console.error(
        "Location search error:",
        error
      );

      setLocationResults([]);

      setLocationError(
        error?.message ||
          "Failed to search locations"
      );
    } finally {
      setLocationLoading(false);
    }
  }

  // ====================================================
  // ADD LOCATION
  // ====================================================

  function addLocation(
    location: CampaignLocation
  ) {
    const alreadySelected =
      form.locations.some(
        (selected) =>
          selected.resourceName ===
          location.resourceName
      );

    if (alreadySelected) {
      return;
    }

    updateForm(
      "locations",
      [
        ...form.locations,
        location,
      ]
    );

    setLocationQuery("");

    setLocationResults([]);

    setLocationDropdownOpen(false);
  }

  // ====================================================
  // REMOVE LOCATION
  // ====================================================

  function removeLocation(
    resourceName: string
  ) {
    updateForm(
      "locations",
      form.locations.filter(
        (location) =>
          location.resourceName !==
          resourceName
      )
    );
  }

  // ====================================================
  // KEYWORDS
  // ====================================================

  function updateKeyword(
    index: number,
    value: string
  ) {
    const keywords = [
      ...form.keywords,
    ];

    keywords[index] = value;

    updateForm(
      "keywords",
      keywords
    );
  }

  function addKeyword() {
    updateForm(
      "keywords",
      [
        ...form.keywords,
        "",
      ]
    );
  }

  function removeKeyword(
    index: number
  ) {
    updateForm(
      "keywords",
      form.keywords.filter(
        (_, i) => i !== index
      )
    );
  }

  // ====================================================
  // HEADLINES
  // ====================================================

  function updateHeadline(
    index: number,
    value: string
  ) {
    const headlines = [
      ...form.headlines,
    ];

    headlines[index] = value;

    updateForm(
      "headlines",
      headlines
    );
  }

  function addHeadline() {
    updateForm(
      "headlines",
      [
        ...form.headlines,
        "",
      ]
    );
  }

  function removeHeadline(
    index: number
  ) {
    updateForm(
      "headlines",
      form.headlines.filter(
        (_, i) => i !== index
      )
    );
  }

  // ====================================================
  // DESCRIPTIONS
  // ====================================================

  function updateDescription(
    index: number,
    value: string
  ) {
    const descriptions = [
      ...form.descriptions,
    ];

    descriptions[index] = value;

    updateForm(
      "descriptions",
      descriptions
    );
  }

  function addDescription() {
    updateForm(
      "descriptions",
      [
        ...form.descriptions,
        "",
      ]
    );
  }

  function removeDescription(
    index: number
  ) {
    updateForm(
      "descriptions",
      form.descriptions.filter(
        (_, i) => i !== index
      )
    );
  }

  // ====================================================
  // CREATE CAMPAIGN
  // ====================================================

  async function createCampaign() {
    setCreating(true);

    setCreateError("");

    setCreateSuccess("");

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!form.campaignName.trim()) {
      setCreateError(
        "Campaign name is required."
      );

      setCreating(false);

      return;
    }

    if (
      !form.dailyBudget ||
      form.dailyBudget <= 0
    ) {
      setCreateError(
        "Daily budget must be greater than zero."
      );

      setCreating(false);

      return;
    }

    if (!form.websiteUrl.trim()) {
      setCreateError(
        "Final URL is required."
      );

      setCreating(false);

      return;
    }

    if (
      form.locations.length === 0
    ) {
      setCreateError(
        "Please select at least one target location."
      );

      setCreating(false);

      return;
    }

    const cleanKeywords =
      form.keywords
        .map((keyword) =>
          keyword.trim()
        )
        .filter(Boolean);

    const cleanHeadlines =
      form.headlines
        .map((headline) =>
          headline.trim()
        )
        .filter(Boolean);

    const cleanDescriptions =
      form.descriptions
        .map((description) =>
          description.trim()
        )
        .filter(Boolean);

    if (
      cleanKeywords.length === 0
    ) {
      setCreateError(
        "Please add at least one keyword."
      );

      setCreating(false);

      return;
    }

    if (
      cleanHeadlines.length < 3
    ) {
      setCreateError(
        "Please add at least 3 headlines."
      );

      setCreating(false);

      return;
    }

    if (
      cleanDescriptions.length < 2
    ) {
      setCreateError(
        "Please add at least 2 descriptions."
      );

      setCreating(false);

      return;
    }

    try {
      const payload = {
        ...form,

        campaignName:
          form.campaignName.trim(),

        websiteUrl:
          form.websiteUrl.trim(),

        adGroupName:
          form.adGroupName.trim(),

        keywords:
          cleanKeywords,

        headlines:
          cleanHeadlines,

        descriptions:
          cleanDescriptions,

        locations:
          form.locations,
      };

      const response = await fetch(
        "/api/google-ads/create-campaign",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload
          ),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        const step =
          data.step
            ? ` (${data.step})`
            : "";

        throw new Error(
          `${
            data.error ||
            "Failed to create campaign"
          }${step}`
        );
      }

      setCreateSuccess(
        "Campaign created successfully."
      );

      setEditingCampaignId(null);

      await fetchCampaigns();

      setActiveTab("history");
    } catch (error: any) {
      console.error(
        "Create campaign error:",
        error
      );

      setCreateError(
        error?.message ||
          "Failed to create campaign"
      );
    } finally {
      setCreating(false);
    }
  }

  // ====================================================
  // PAUSE / RESTART
  // ====================================================

  async function updateCampaignStatus(
    campaignResourceName: string,
    status:
      | "ENABLED"
      | "PAUSED"
  ) {
    try {
      setCampaignsError("");

      const response = await fetch(
        "/api/google-ads/campaigns/status",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            campaignResourceName,
            status,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to update campaign"
        );
      }

      await fetchCampaigns();
    } catch (error: any) {
      console.error(
        "Status update error:",
        error
      );

      setCampaignsError(
        error?.message ||
          "Failed to update campaign"
      );
    }
  }

  // ====================================================
  // DELETE / REMOVE CAMPAIGN
  // ====================================================

  async function deleteCampaign(
    campaign: Campaign
  ) {
    setDeleteLoading(true);

    setDeleteError("");

    try {
      const response = await fetch(
        "/api/google-ads/campaigns/delete",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            campaignResourceName:
              campaign.resourceName,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to remove campaign"
        );
      }

      setDeletingCampaign(null);

      await fetchCampaigns();
    } catch (error: any) {
      console.error(
        "Delete campaign error:",
        error
      );

      setDeleteError(
        error?.message ||
          "Failed to remove campaign"
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  // ====================================================
  // EDIT CAMPAIGN
  // ====================================================

  function editCampaign(
    campaign: Campaign
  ) {
    setEditingCampaignId(
      campaign.id
    );

    setForm({
      ...defaultForm,

      campaignName:
        campaign.name,

      status:
        campaign.status ===
        "ENABLED"
          ? "ENABLED"
          : "PAUSED",

      biddingStrategy:
        campaign.biddingStrategy ||
        "MANUAL_CPC",

      locations: [],
    });

    setCreateError("");

    setCreateSuccess("");

    setActiveTab("create");
  }

  // ====================================================
  // STATUS BADGE
  // ====================================================

  function StatusBadge({
    status,
  }: {
    status: string;
  }) {
    if (status === "ENABLED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Active
        </span>
      );
    }

    if (status === "PAUSED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
          Paused
        </span>
      );
    }

    if (status === "REMOVED") {
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
          Removed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
        {status}
      </span>
    );
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      <div className="flex min-h-screen">

        {/* ==================================================
            SIDEBAR
        ================================================== */}

        <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r bg-white">

          <div className="border-b px-6 py-6">

            <div className="text-xl font-bold">
              7wingz
            </div>

            <div className="mt-1 text-sm text-gray-500">
              Google Ads
            </div>

          </div>

          <nav className="flex-1 p-3">

            {/* CREATE */}

            <button
              type="button"
              onClick={() =>
                setActiveTab("create")
              }
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                activeTab === "create"
                  ? "bg-gray-100 text-black"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >

              <span className="flex h-6 w-6 items-center justify-center rounded-md border text-lg">
                +
              </span>

              Create New Campaign

            </button>

            {/* HISTORY */}

            <button
              type="button"
              onClick={() =>
                setActiveTab("history")
              }
              className={`mt-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                activeTab === "history"
                  ? "bg-gray-100 text-black"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >

              <span className="flex h-6 w-6 items-center justify-center rounded-md border text-sm">
                ≡
              </span>

              Campaign History

            </button>

          </nav>

        </aside>

        {/* ==================================================
            MAIN
        ================================================== */}

        <main className="ml-64 flex-1">

          {/* HEADER */}

          <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-white px-8">

            <div className="font-semibold">

              {activeTab === "create"
                ? editingCampaignId
                  ? "Edit Campaign"
                  : "Create New Campaign"
                : "Campaign History"}

            </div>

          </header>

          <div className="mx-auto max-w-6xl p-8">

            {/* ==================================================
                CREATE TAB
            ================================================== */}

            {activeTab === "create" && (
              <div>

                <div className="mb-8">

                  <h1 className="text-2xl font-semibold">

                    {editingCampaignId
                      ? "Edit Campaign"
                      : "Create Google Ads Campaign"}

                  </h1>

                  <p className="mt-2 text-gray-500">
                    Configure your Search campaign
                    before sending it to Google Ads.
                  </p>

                </div>

                {/* SUCCESS */}

                {createSuccess && (
                  <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {createSuccess}
                  </div>
                )}

                {/* ERROR */}

                {createError && (
                  <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {createError}
                  </div>
                )}

                {/* ==================================================
                    CAMPAIGN
                ================================================== */}

                <section className="rounded-xl border bg-white p-6">

                  <h2 className="text-lg font-semibold">
                    Campaign
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Basic campaign settings.
                  </p>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">

                    <div className="md:col-span-2">

                      <label className="text-sm font-medium">
                        Campaign name
                      </label>

                      <input
                        type="text"
                        value={
                          form.campaignName
                        }
                        onChange={(e) =>
                          updateForm(
                            "campaignName",
                            e.target.value
                          )
                        }
                        className="mt-2 w-full rounded-lg border px-3 py-2.5 outline-none focus:border-gray-400"
                      />

                    </div>

                    <div>

                      <label className="text-sm font-medium">
                        Daily budget
                      </label>

                      <div className="relative mt-2">

                        <span className="absolute left-3 top-2.5 text-gray-500">
                          ₹
                        </span>

                        <input
                          type="number"
                          min="1"
                          value={
                            form.dailyBudget
                          }
                          onChange={(e) =>
                            updateForm(
                              "dailyBudget",
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-full rounded-lg border py-2.5 pl-8 pr-3"
                        />

                      </div>

                    </div>

                    <div>

                      <label className="text-sm font-medium">
                        Status
                      </label>

                      <select
                        value={
                          form.status
                        }
                        onChange={(e) =>
                          updateForm(
                            "status",
                            e.target.value as
                              | "PAUSED"
                              | "ENABLED"
                          )
                        }
                        className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5"
                      >

                        <option value="PAUSED">
                          Paused
                        </option>

                        <option value="ENABLED">
                          Enabled
                        </option>

                      </select>

                    </div>

                    <div>

                      <label className="text-sm font-medium">
                        Maximum CPC
                      </label>

                      <div className="relative mt-2">

                        <span className="absolute left-3 top-2.5 text-gray-500">
                          ₹
                        </span>

                        <input
                          type="number"
                          min="1"
                          value={
                            form.maxCpc
                          }
                          onChange={(e) =>
                            updateForm(
                              "maxCpc",
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-full rounded-lg border py-2.5 pl-8 pr-3"
                        />

                      </div>

                    </div>

                    <div>

                      <label className="text-sm font-medium">
                        Final URL
                      </label>

                      <input
                        type="url"
                        value={
                          form.websiteUrl
                        }
                        onChange={(e) =>
                          updateForm(
                            "websiteUrl",
                            e.target.value
                          )
                        }
                        className="mt-2 w-full rounded-lg border px-3 py-2.5"
                        placeholder="https://7wingz.com"
                      />

                    </div>

                  </div>

                </section>

                {/* ==================================================
                    LOCATION
                ================================================== */}

                <section className="mt-6 rounded-xl border bg-white p-6">

                  <h2 className="text-lg font-semibold">
                    Location
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Search Google Ads targetable
                    countries, states, cities and regions.
                  </p>

                  <div className="relative mt-5">

                    <label className="text-sm font-medium">
                      Target locations
                    </label>

                    <input
                      type="text"
                      value={
                        locationQuery
                      }
                      onChange={(e) =>
                        handleLocationSearch(
                          e.target.value
                        )
                      }
                      onFocus={() => {
                        if (
                          locationQuery.trim()
                            .length >= 2
                        ) {
                          setLocationDropdownOpen(
                            true
                          );
                        }
                      }}
                      placeholder="Search for a location..."
                      className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-gray-400"
                    />

                    {locationDropdownOpen &&
                      locationQuery.trim()
                        .length >= 2 && (
                        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-auto rounded-xl border bg-white shadow-xl">

                          {locationLoading && (
                            <div className="px-4 py-5 text-sm text-gray-500">
                              Searching Google Ads
                              locations...
                            </div>
                          )}

                          {locationError && (
                            <div className="px-4 py-5 text-sm text-red-600">
                              {locationError}
                            </div>
                          )}

                          {!locationLoading &&
                            !locationError &&
                            locationResults.length ===
                              0 && (
                              <div className="px-4 py-5 text-sm text-gray-500">
                                No targetable
                                locations found.
                              </div>
                            )}

                          {!locationLoading &&
                            locationResults.map(
                              (location) => {
                                const selected =
                                  form.locations.some(
                                    (item) =>
                                      item.resourceName ===
                                      location.resourceName
                                  );

                                return (
                                  <button
                                    type="button"
                                    key={
                                      location.resourceName
                                    }
                                    disabled={
                                      selected
                                    }
                                    onClick={() =>
                                      addLocation(
                                        location
                                      )
                                    }
                                    className={`w-full border-b px-4 py-3 text-left last:border-b-0 ${
                                      selected
                                        ? "cursor-default bg-gray-50 opacity-50"
                                        : "hover:bg-gray-50"
                                    }`}
                                  >

                                    <div className="flex items-start justify-between gap-4">

                                      <div className="min-w-0">

                                        <div className="text-sm font-medium">

                                          {
                                            location.name
                                          }

                                          {selected && (
                                            <span className="ml-2 text-xs text-green-600">
                                              Selected
                                            </span>
                                          )}

                                        </div>

                                        {location.canonicalName && (
                                          <div className="mt-1 text-xs text-gray-500">
                                            {
                                              location.canonicalName
                                            }
                                          </div>
                                        )}

                                        <div className="mt-1 text-xs text-gray-400">

                                          {
                                            location.targetType
                                          }

                                          {location.countryCode &&
                                            ` · ${location.countryCode}`}

                                        </div>

                                      </div>

                                      {location.reach && (
                                        <div className="shrink-0 text-xs text-gray-400">
                                          {location.reach.toLocaleString()}
                                          {" reach"}
                                        </div>
                                      )}

                                    </div>

                                  </button>
                                );
                              }
                            )}

                        </div>
                      )}

                  </div>

                  <div className="mt-6">

                    <div className="mb-2 text-sm font-medium">
                      Selected locations
                    </div>

                    {form.locations.length ===
                    0 ? (
                      <div className="rounded-lg border border-dashed px-4 py-5 text-sm text-gray-500">
                        No locations selected.
                        Search above to add a
                        location.
                      </div>
                    ) : (
                      <div className="space-y-2">

                        {form.locations.map(
                          (location) => (
                            <div
                              key={
                                location.resourceName
                              }
                              className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-3"
                            >

                              <div className="min-w-0">

                                <div className="text-sm font-medium">
                                  {
                                    location.name
                                  }
                                </div>

                                <div className="mt-1 truncate text-xs text-gray-500">
                                  {
                                    location.canonicalName
                                  }
                                </div>

                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeLocation(
                                    location.resourceName
                                  )
                                }
                                className="ml-4 rounded-md px-2 py-1 text-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                              >
                                ×
                              </button>

                            </div>
                          )
                        )}

                      </div>
                    )}

                  </div>

                </section>

                {/* ==================================================
                    NETWORKS
                ================================================== */}

                <section className="mt-6 rounded-xl border bg-white p-6">

                  <h2 className="text-lg font-semibold">
                    Networks
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Choose where your ads can appear.
                  </p>

                  <div className="mt-5 space-y-4">

                    <label className="flex items-center gap-3">

                      <input
                        type="checkbox"
                        checked={
                          form.targetGoogleSearch
                        }
                        onChange={(e) =>
                          updateForm(
                            "targetGoogleSearch",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4"
                      />

                      <span className="text-sm">
                        Google Search
                      </span>

                    </label>

                    <label className="flex items-center gap-3">

                      <input
                        type="checkbox"
                        checked={
                          form.targetSearchNetwork
                        }
                        onChange={(e) =>
                          updateForm(
                            "targetSearchNetwork",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4"
                      />

                      <span className="text-sm">
                        Search partners
                      </span>

                    </label>

                    <label className="flex items-center gap-3">

                      <input
                        type="checkbox"
                        checked={
                          form.targetContentNetwork
                        }
                        onChange={(e) =>
                          updateForm(
                            "targetContentNetwork",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4"
                      />

                      <span className="text-sm">
                        Display Network
                      </span>

                    </label>

                    <label className="flex items-center gap-3">

                      <input
                        type="checkbox"
                        checked={
                          form.targetPartnerSearchNetwork
                        }
                        onChange={(e) =>
                          updateForm(
                            "targetPartnerSearchNetwork",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4"
                      />

                      <span className="text-sm">
                        Search partner network
                      </span>

                    </label>

                  </div>

                </section>

                {/* ==================================================
                    AD GROUP
                ================================================== */}

                <section className="mt-6 rounded-xl border bg-white p-6">

                  <h2 className="text-lg font-semibold">
                    Ad Group
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Organize your keywords and ads.
                  </p>

                  <input
                    value={
                      form.adGroupName
                    }
                    onChange={(e) =>
                      updateForm(
                        "adGroupName",
                        e.target.value
                      )
                    }
                    className="mt-5 w-full rounded-lg border px-3 py-2.5"
                    placeholder="Website Builder"
                  />

                </section>

                {/* ==================================================
                    KEYWORDS
                ================================================== */}

                <section className="mt-6 rounded-xl border bg-white p-6">

                  <div className="flex items-center justify-between">

                    <div>

                      <h2 className="text-lg font-semibold">
                        Keywords
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Phrase-match keywords.
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={
                        addKeyword
                      }
                      className="text-sm font-medium hover:underline"
                    >
                      + Add keyword
                    </button>

                  </div>

                  <div className="mt-5 space-y-3">

                    {form.keywords.map(
                      (
                        keyword,
                        index
                      ) => (
                        <div
                          key={index}
                          className="flex gap-2"
                        >

                          <input
                            value={
                              keyword
                            }
                            onChange={(e) =>
                              updateKeyword(
                                index,
                                e.target.value
                              )
                            }
                            className="flex-1 rounded-lg border px-3 py-2.5"
                            placeholder="website builder"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeKeyword(
                                index
                              )
                            }
                            className="rounded-lg px-3 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          >
                            ×
                          </button>

                        </div>
                      )
                    )}

                  </div>

                </section>

                {/* ==================================================
                    RESPONSIVE SEARCH AD
                ================================================== */}

                <section className="mt-6 rounded-xl border bg-white p-6">

                  <h2 className="text-lg font-semibold">
                    Responsive Search Ad
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Add headlines and descriptions.
                  </p>

                  {/* HEADLINES */}

                  <div className="mt-6">

                    <div className="flex items-center justify-between">

                      <label className="text-sm font-medium">
                        Headlines
                      </label>

                      <button
                        type="button"
                        onClick={
                          addHeadline
                        }
                        className="text-sm font-medium hover:underline"
                      >
                        + Add headline
                      </button>

                    </div>

                    <div className="mt-3 space-y-3">

                      {form.headlines.map(
                        (
                          headline,
                          index
                        ) => (
                          <div
                            key={index}
                            className="flex items-start gap-2"
                          >

                            <input
                              value={
                                headline
                              }
                              maxLength={30}
                              onChange={(e) =>
                                updateHeadline(
                                  index,
                                  e.target.value
                                )
                              }
                              className="flex-1 rounded-lg border px-3 py-2.5"
                              placeholder="Headline"
                            />

                            <span className="w-12 pt-3 text-xs text-gray-400">
                              {
                                headline.length
                              }
                              /30
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                removeHeadline(
                                  index
                                )
                              }
                              className="rounded-lg px-2 py-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                            >
                              ×
                            </button>

                          </div>
                        )
                      )}

                    </div>

                  </div>

                  {/* DESCRIPTIONS */}

                  <div className="mt-8">

                    <div className="flex items-center justify-between">

                      <label className="text-sm font-medium">
                        Descriptions
                      </label>

                      <button
                        type="button"
                        onClick={
                          addDescription
                        }
                        className="text-sm font-medium hover:underline"
                      >
                        + Add description
                      </button>

                    </div>

                    <div className="mt-3 space-y-3">

                      {form.descriptions.map(
                        (
                          description,
                          index
                        ) => (
                          <div
                            key={index}
                            className="flex items-start gap-2"
                          >

                            <textarea
                              value={
                                description
                              }
                              maxLength={90}
                              rows={2}
                              onChange={(e) =>
                                updateDescription(
                                  index,
                                  e.target.value
                                )
                              }
                              className="flex-1 resize-none rounded-lg border px-3 py-2.5"
                              placeholder="Description"
                            />

                            <span className="w-12 pt-3 text-xs text-gray-400">
                              {
                                description.length
                              }
                              /90
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                removeDescription(
                                  index
                                )
                              }
                              className="rounded-lg px-2 py-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                            >
                              ×
                            </button>

                          </div>
                        )
                      )}

                    </div>

                  </div>

                </section>

                {/* ==================================================
                    EU DECLARATION
                ================================================== */}

                <section className="mt-6 rounded-xl border bg-white p-6">

                  <h2 className="text-lg font-semibold">
                    Advertising Declaration
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Required by Google Ads.
                  </p>

                  <select
                    value={
                      form.containsEuPoliticalAdvertising
                    }
                    onChange={(e) =>
                      updateForm(
                        "containsEuPoliticalAdvertising",
                        e.target.value
                      )
                    }
                    className="mt-5 w-full rounded-lg border bg-white px-3 py-2.5"
                  >

                    <option value="DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING">
                      Does not contain EU political advertising
                    </option>

                    <option value="CONTAINS_EU_POLITICAL_ADVERTISING">
                      Contains EU political advertising
                    </option>

                  </select>

                </section>

                {/* ==================================================
                    CREATE BUTTON
                ================================================== */}

                <div className="mt-8 flex items-center justify-end gap-3">

                  {editingCampaignId && (
                    <button
                      type="button"
                      onClick={
                        startNewCampaign
                      }
                      className="rounded-lg border bg-white px-5 py-3 text-sm font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={
                      createCampaign
                    }
                    disabled={creating}
                    className="rounded-lg bg-black px-7 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating
                      ? "Creating..."
                      : editingCampaignId
                        ? "Update Campaign"
                        : "Create Campaign"}
                  </button>

                </div>

              </div>
            )}

            {/* ==================================================
                HISTORY
            ================================================== */}

            {activeTab === "history" && (
              <div>

                {/* HEADER */}

                <div className="mb-8 flex items-center justify-between">

                  <div>

                    <h1 className="text-2xl font-semibold">
                      Campaign History
                    </h1>

                    <p className="mt-2 text-gray-500">
                      Manage campaigns connected
                      to your Google Ads account.
                    </p>

                  </div>

                  <div className="flex gap-3">

                    <button
                      type="button"
                      onClick={
                        fetchCampaigns
                      }
                      disabled={
                        campaignsLoading
                      }
                      className="rounded-lg border bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      {campaignsLoading
                        ? "Refreshing..."
                        : "Refresh"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        startNewCampaign
                      }
                      className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      + New Campaign
                    </button>

                  </div>

                </div>

                {/* ERROR */}

                {campaignsError && (
                  <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {campaignsError}
                  </div>
                )}

                {/* LOADING */}

                {campaignsLoading ? (
                  <div className="rounded-xl border bg-white p-16 text-center">

                    <div className="text-sm text-gray-500">
                      Loading campaigns from
                      Google Ads...
                    </div>

                  </div>
                ) : campaigns.length === 0 ? (

                  <div className="rounded-xl border bg-white p-16 text-center">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                      📢
                    </div>

                    <h3 className="mt-5 font-semibold">
                      No campaigns found
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      No campaigns were found
                      in this Google Ads account.
                    </p>

                    <button
                      type="button"
                      onClick={
                        startNewCampaign
                      }
                      className="mt-6 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white"
                    >
                      Create Campaign
                    </button>

                  </div>

                ) : (

                  <div className="overflow-hidden rounded-xl border bg-white">

                    {/* TABLE HEADER */}

                    <div className="grid grid-cols-12 gap-4 border-b bg-gray-50 px-6 py-4 text-xs font-medium text-gray-500">

                      <div className="col-span-3">
                        Campaign
                      </div>

                      <div className="col-span-2">
                        Type
                      </div>

                      <div className="col-span-2">
                        Status
                      </div>

                      <div className="col-span-2">
                        Start date
                      </div>

                      <div className="col-span-3 text-right">
                        Actions
                      </div>

                    </div>

                    {/* CAMPAIGNS */}

                    {campaigns.map(
                      (campaign) => {

                        const isPaused =
                          campaign.status ===
                          "PAUSED";

                        const isEnabled =
                          campaign.status ===
                          "ENABLED";

                        const isRemoved =
                          campaign.status ===
                          "REMOVED";

                        return (
                          <div
                            key={
                              campaign.resourceName
                            }
                            className="grid grid-cols-12 items-center gap-4 border-b px-6 py-5 last:border-b-0 hover:bg-gray-50"
                          >

                            {/* NAME */}

                            <div className="col-span-3 min-w-0">

                              <div className="truncate text-sm font-medium">
                                {
                                  campaign.name
                                }
                              </div>

                              <div className="mt-1 truncate text-xs text-gray-400">
                                ID:{" "}
                                {
                                  campaign.id
                                }
                              </div>

                            </div>

                            {/* TYPE */}

                            <div className="col-span-2 text-sm text-gray-600">

                              {campaign.channelType ===
                              "SEARCH"
                                ? "Search"
                                : campaign.channelType}

                            </div>

                            {/* STATUS */}

                            <div className="col-span-2">

                              <StatusBadge
                                status={
                                  campaign.status
                                }
                              />

                            </div>

                            {/* DATE */}

                            <div className="col-span-2 text-sm text-gray-500">

                              {
                                campaign.startDate ||
                                "—"
                              }

                            </div>

                            {/* ACTIONS */}

                            <div className="col-span-3 flex justify-end gap-2">

                              {!isRemoved &&
                                isPaused && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateCampaignStatus(
                                        campaign.resourceName,
                                        "ENABLED"
                                      )
                                    }
                                    className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                                  >
                                    Restart
                                  </button>
                                )}

                              {!isRemoved &&
                                isEnabled && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateCampaignStatus(
                                        campaign.resourceName,
                                        "PAUSED"
                                      )
                                    }
                                    className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700"
                                  >
                                    Pause
                                  </button>
                                )}

                              {!isRemoved && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    editCampaign(
                                      campaign
                                    )
                                  }
                                  className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
                                >
                                  Edit
                                </button>
                              )}

                              {!isRemoved && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteError(
                                      ""
                                    );

                                    setDeletingCampaign(
                                      campaign
                                    );
                                  }}
                                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              )}

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                )}

              </div>
            )}

          </div>

        </main>

      </div>

      {/* ====================================================
          DELETE CONFIRMATION MODAL
      ==================================================== */}

      {deletingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            {/* TITLE */}

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                !
              </div>

              <div className="min-w-0">

                <h3 className="text-lg font-semibold">
                  Remove campaign?
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  You are about to remove:
                </p>

                <p className="mt-2 truncate font-medium">
                  {
                    deletingCampaign.name
                  }
                </p>

              </div>

            </div>

            {/* WARNING */}

            <div className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">

              Removing this campaign will
              change its Google Ads status
              to{" "}
              <strong>
                REMOVED
              </strong>
              .

              <div className="mt-2 text-xs text-gray-500">
                The campaign will no longer
                be eligible to serve ads.
              </div>

            </div>

            {/* ERROR */}

            {deleteError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {deleteError}
              </div>
            )}

            {/* ACTIONS */}

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                disabled={
                  deleteLoading
                }
                onClick={() =>
                  setDeletingCampaign(
                    null
                  )
                }
                className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  deleteLoading
                }
                onClick={() =>
                  deleteCampaign(
                    deletingCampaign
                  )
                }
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteLoading
                  ? "Removing..."
                  : "Remove Campaign"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}