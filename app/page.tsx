"use client";

import { useEffect, useRef, useState } from "react";

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

const defaultForm: FormState = {
  campaignName: "7wingz Website Builder",
  dailyBudget: 500,
  status: "PAUSED",
  biddingStrategy: "MANUAL_CPC",
  maxCpc: 20,
  websiteUrl: "https://7wingz.com",
  locations: [],
  containsEuPoliticalAdvertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
  targetGoogleSearch: true,
  targetSearchNetwork: true,
  targetContentNetwork: false,
  targetPartnerSearchNetwork: false,
  adGroupName: "Website Builder",
  keywords: ["website builder", "create website", "ai website builder"],
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

function Icon({
  name,
  size = 18,
}: {
  name:
    | "plus"
    | "history"
    | "refresh"
    | "search"
    | "x"
    | "check"
    | "chevron"
    | "pause"
    | "play"
    | "edit"
    | "trash"
    | "globe"
    | "target"
    | "layers"
    | "sparkles"
    | "alert"
    | "arrow";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<string, React.ReactNode> = {
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.9-3L3 10" /><path d="M3 5v5h5" /><path d="M4 13a8 8 0 0 0 14.9 3L21 14" /><path d="M21 19v-5h-5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    x: <><path d="m7 7 10 10" /><path d="m17 7-10 10" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    pause: <><path d="M8 6v12" /><path d="M16 6v12" /></>,
    play: <path d="m8 5 11 7-11 7z" />,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="m6 7 1 13h10l1-13" /><path d="M9 7V4h6v3" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18" /><path d="M12 3a14 14 0 0 0 0 18" /></>,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="M2 12h3" /><path d="M19 12h3" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 16 9 5 9-5" /></>,
    sparkles: <><path d="m12 3-1.3 4.2L7 8.5l3.7 1.3L12 14l1.3-4.2L17 8.5l-3.7-1.3Z" /><path d="m19 14-.7 2.3L16 17l2.3.7L19 20l.7-2.3L22 17l-2.3-.7Z" /></>,
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function StatusBadge({ status }: { status: string }) {
  const config =
    status === "ENABLED"
      ? {
          label: "Active",
          dot: "bg-emerald-500",
          style: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        }
      : status === "PAUSED"
        ? {
            label: "Paused",
            dot: "bg-amber-500",
            style: "bg-amber-50 text-amber-700 ring-amber-100",
          }
        : status === "REMOVED"
          ? {
              label: "Removed",
              dot: "bg-red-500",
              style: "bg-red-50 text-red-700 ring-red-100",
            }
          : {
              label: status,
              dot: "bg-gray-400",
              style: "bg-gray-100 text-gray-600 ring-gray-200",
            };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${config.style}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function SectionHeader({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: "target" | "globe" | "layers" | "sparkles" | "check";
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-950 text-xs font-bold text-white shadow-sm">
        {number}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold tracking-tight text-gray-950">
            {title}
          </h2>
          <span className="hidden text-gray-300 sm:inline">•</span>
          <span className="hidden text-xs text-gray-400 sm:inline">
            {icon === "target" && "Campaign settings"}
            {icon === "globe" && "Audience"}
            {icon === "layers" && "Distribution"}
            {icon === "sparkles" && "Ad creative"}
            {icon === "check" && "Compliance"}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-gray-800">{label}</span>
        {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
}: {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
}) {
  return (
    <div className="relative mt-2">
      {prefix && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-11 w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none transition placeholder:text-gray-300 hover:border-gray-300 focus:border-gray-950 focus:ring-4 focus:ring-gray-100 ${
          prefix ? "pl-8 pr-3.5" : "px-3.5"
        }`}
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mt-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 pr-10 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-gray-950 focus:ring-4 focus:ring-gray-100"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
        <Icon name="chevron" size={15} />
      </span>
    </div>
  );
}

function ToggleRow({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left transition ${
        checked
          ? "border-gray-300 bg-gray-50"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/70"
      }`}
    >
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-900">{title}</div>
        <div className="mt-1 text-[11px] leading-4 text-gray-500">
          {description}
        </div>
      </div>
      <span
        className={`relative h-6 w-10 shrink-0 rounded-full transition ${
          checked ? "bg-gray-950" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "left-5" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

export default function GoogleAdsPage() {
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [form, setForm] = useState<FormState>({
    ...defaultForm,
    locations: [],
    keywords: [...defaultForm.keywords],
    headlines: [...defaultForm.headlines],
    descriptions: [...defaultForm.descriptions],
  });

  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState("");

  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<CampaignLocation[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const locationSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (activeTab === "history") fetchCampaigns();

    return () => {
      if (locationSearchTimer.current) clearTimeout(locationSearchTimer.current);
    };
  }, [activeTab]);

  function updateForm<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function resetForm() {
    setForm({
      ...defaultForm,
      locations: [],
      keywords: [...defaultForm.keywords],
      headlines: [...defaultForm.headlines],
      descriptions: [...defaultForm.descriptions],
    });
    setEditingCampaignId(null);
    setCreateError("");
    setCreateSuccess("");
    setLocationQuery("");
    setLocationResults([]);
    setLocationError("");
    setLocationDropdownOpen(false);
  }

  function startNewCampaign() {
    resetForm();
    setActiveTab("create");
  }

  async function fetchCampaigns() {
    setCampaignsLoading(true);
    setCampaignsError("");

    try {
      const response = await fetch("/api/google-ads/campaigns", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch campaigns");
      }

      setCampaigns(data.campaigns || []);
    } catch (error: any) {
      console.error("Campaign fetch error:", error);
      setCampaignsError(error?.message || "Failed to fetch campaigns");
    } finally {
      setCampaignsLoading(false);
    }
  }

  function handleLocationSearch(value: string) {
    setLocationQuery(value);
    setLocationError("");

    if (locationSearchTimer.current) clearTimeout(locationSearchTimer.current);

    if (value.trim().length < 2) {
      setLocationResults([]);
      setLocationDropdownOpen(false);
      return;
    }

    setLocationDropdownOpen(true);
    locationSearchTimer.current = setTimeout(() => {
      searchLocations(value.trim());
    }, 350);
  }

  async function searchLocations(query: string) {
    setLocationLoading(true);
    setLocationError("");

    try {
      const response = await fetch(
        `/api/google-ads/location?query=${encodeURIComponent(query)}`,
        { method: "GET", cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to search locations");
      }

      setLocationResults(data.locations || []);
    } catch (error: any) {
      console.error("Location search error:", error);
      setLocationResults([]);
      setLocationError(error?.message || "Failed to search locations");
    } finally {
      setLocationLoading(false);
    }
  }

  function addLocation(location: CampaignLocation) {
    if (
      form.locations.some(
        (selected) => selected.resourceName === location.resourceName
      )
    ) {
      return;
    }

    updateForm("locations", [...form.locations, location]);
    setLocationQuery("");
    setLocationResults([]);
    setLocationDropdownOpen(false);
  }

  function removeLocation(resourceName: string) {
    updateForm(
      "locations",
      form.locations.filter((location) => location.resourceName !== resourceName)
    );
  }

  function updateList(
    field: "keywords" | "headlines" | "descriptions",
    index: number,
    value: string
  ) {
    const next = [...form[field]];
    next[index] = value;
    updateForm(field, next);
  }

  function addListItem(field: "keywords" | "headlines" | "descriptions") {
    updateForm(field, [...form[field], ""]);
  }

  function removeListItem(
    field: "keywords" | "headlines" | "descriptions",
    index: number
  ) {
    updateForm(
      field,
      form[field].filter((_, itemIndex) => itemIndex !== index)
    );
  }

  async function createCampaign() {
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");

    if (!form.campaignName.trim()) {
      setCreateError("Campaign name is required.");
      setCreating(false);
      return;
    }

    if (!form.dailyBudget || form.dailyBudget <= 0) {
      setCreateError("Daily budget must be greater than zero.");
      setCreating(false);
      return;
    }

    if (!form.websiteUrl.trim()) {
      setCreateError("Final URL is required.");
      setCreating(false);
      return;
    }

    if (form.locations.length === 0) {
      setCreateError("Please select at least one target location.");
      setCreating(false);
      return;
    }

    const cleanKeywords = form.keywords.map((item) => item.trim()).filter(Boolean);
    const cleanHeadlines = form.headlines.map((item) => item.trim()).filter(Boolean);
    const cleanDescriptions = form.descriptions
      .map((item) => item.trim())
      .filter(Boolean);

    if (cleanKeywords.length === 0) {
      setCreateError("Please add at least one keyword.");
      setCreating(false);
      return;
    }

    if (cleanHeadlines.length < 3) {
      setCreateError("Please add at least 3 headlines.");
      setCreating(false);
      return;
    }

    if (cleanDescriptions.length < 2) {
      setCreateError("Please add at least 2 descriptions.");
      setCreating(false);
      return;
    }

    try {
      const payload = {
        ...form,
        campaignName: form.campaignName.trim(),
        websiteUrl: form.websiteUrl.trim(),
        adGroupName: form.adGroupName.trim(),
        keywords: cleanKeywords,
        headlines: cleanHeadlines,
        descriptions: cleanDescriptions,
        locations: form.locations,
      };

      const response = await fetch("/api/google-ads/create-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const step = data.step ? ` (${data.step})` : "";
        throw new Error(
          `${data.error || "Failed to create campaign"}${step}`
        );
      }

      setCreateSuccess("Campaign created successfully.");
      setEditingCampaignId(null);
      await fetchCampaigns();
      setActiveTab("history");
    } catch (error: any) {
      console.error("Create campaign error:", error);
      setCreateError(error?.message || "Failed to create campaign");
    } finally {
      setCreating(false);
    }
  }

  async function updateCampaignStatus(
    campaignResourceName: string,
    status: "ENABLED" | "PAUSED"
  ) {
    try {
      setCampaignsError("");

      const response = await fetch("/api/google-ads/campaigns/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignResourceName, status }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update campaign");
      }

      await fetchCampaigns();
    } catch (error: any) {
      console.error("Status update error:", error);
      setCampaignsError(error?.message || "Failed to update campaign");
    }
  }

  async function deleteCampaign(campaign: Campaign) {
    setDeleteLoading(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/google-ads/campaigns/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignResourceName: campaign.resourceName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to remove campaign");
      }

      setDeletingCampaign(null);
      await fetchCampaigns();
    } catch (error: any) {
      console.error("Delete campaign error:", error);
      setDeleteError(error?.message || "Failed to remove campaign");
    } finally {
      setDeleteLoading(false);
    }
  }

  function editCampaign(campaign: Campaign) {
    setEditingCampaignId(campaign.id);
    setForm({
      ...defaultForm,
      campaignName: campaign.name,
      status: campaign.status === "ENABLED" ? "ENABLED" : "PAUSED",
      biddingStrategy: campaign.biddingStrategy || "MANUAL_CPC",
      locations: [],
    });
    setCreateError("");
    setCreateSuccess("");
    setActiveTab("create");
  }

  const completedSteps = [
    Boolean(form.campaignName.trim()),
    Boolean(form.locations.length),
    Boolean(form.targetGoogleSearch || form.targetSearchNetwork || form.targetContentNetwork),
    Boolean(form.adGroupName.trim()),
    form.keywords.filter(Boolean).length > 0 &&
      form.headlines.filter(Boolean).length >= 3 &&
      form.descriptions.filter(Boolean).length >= 2,
  ].filter(Boolean).length;

  const previewHeadline =
    form.headlines.find((headline) => headline.trim())?.trim() ||
    "Build Your Website With 7wingz";

  const previewDescription =
    form.descriptions.find((description) => description.trim())?.trim() ||
    "Create a beautiful website with 7wingz.";

  const previewUrl =
    form.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") ||
    "7wingz.com";

  return (
    <div className="min-h-screen bg-[#f6f6f3] text-gray-950">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] border-r border-gray-200/80 bg-white lg:flex lg:flex-col">
          <div className="flex h-[72px] items-center border-b border-gray-100 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-950 text-sm font-bold text-white">
                7
              </div>
              <div>
                <div className="text-[15px] font-bold tracking-tight">7wingz</div>
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                  Ads Manager
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 px-3 py-5">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
              Campaigns
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`group mb-1.5 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                activeTab === "create"
                  ? "bg-gray-950 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  activeTab === "create" ? "bg-white/10" : "bg-gray-100"
                }`}
              >
                <Icon name="plus" size={16} />
              </span>
              <span>
                <span className="block text-xs font-semibold">New campaign</span>
                <span
                  className={`mt-0.5 block text-[10px] ${
                    activeTab === "create" ? "text-gray-400" : "text-gray-400"
                  }`}
                >
                  Build a search campaign
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                activeTab === "history"
                  ? "bg-gray-950 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  activeTab === "history" ? "bg-white/10" : "bg-gray-100"
                }`}
              >
                <Icon name="history" size={16} />
              </span>
              <span>
                <span className="block text-xs font-semibold">Campaigns</span>
                <span
                  className={`mt-0.5 block text-[10px] ${
                    activeTab === "history" ? "text-gray-400" : "text-gray-400"
                  }`}
                >
                  View and manage
                </span>
              </span>
            </button>
          </div>

          <div className="border-t border-gray-100 p-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white shadow-sm">
                  <Icon name="sparkles" size={13} />
                </span>
                Keep it simple
              </div>
              <p className="mt-2 text-[11px] leading-5 text-gray-500">
                Start with one focused campaign. You can expand your strategy later.
              </p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 lg:ml-[252px]">
          <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-gray-200/80 bg-white/90 px-5 backdrop-blur-xl sm:px-8">
            <div className="flex items-center gap-3">
              <div className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-gray-950 text-xs font-bold text-white">
                7
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">
                  {activeTab === "create"
                    ? editingCampaignId
                      ? "Edit campaign"
                      : "Create campaign"
                    : "Campaigns"}
                </div>
                <div className="hidden text-[11px] text-gray-400 sm:block">
                  {activeTab === "create"
                    ? "Set up your Google Search campaign"
                    : "Manage campaigns connected to Google Ads"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === "history" && (
                <button
                  type="button"
                  onClick={fetchCampaigns}
                  disabled={campaignsLoading}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Icon name="refresh" size={14} />
                  <span className="hidden sm:inline">
                    {campaignsLoading ? "Refreshing" : "Refresh"}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={startNewCampaign}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-gray-950 px-3.5 text-xs font-semibold text-white transition hover:bg-gray-800"
              >
                <Icon name="plus" size={14} />
                <span className="hidden sm:inline">New campaign</span>
              </button>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
            {activeTab === "create" ? (
              <>
                {/* Page intro */}
                <div className="mb-7">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                      {editingCampaignId ? "Editing" : "New campaign"}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {completedSteps}/5 sections ready
                    </span>
                  </div>

                  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                    <div>
                      <h1 className="text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
                        {editingCampaignId
                          ? "Update your campaign"
                          : "Create your campaign"}
                      </h1>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                        Set your budget, audience, networks, keywords and ad copy in one clean workflow.
                      </p>
                    </div>

                    <div className="hidden min-w-[210px] md:block">
                      <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                        <span>Setup progress</span>
                        <span>{Math.round((completedSteps / 5) * 100)}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-gray-950 transition-all"
                          style={{ width: `${(completedSteps / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {createSuccess && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
                    <Icon name="check" size={17} />
                    <span>{createSuccess}</span>
                  </div>
                )}

                {createError && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                    <Icon name="alert" size={17} />
                    <span>{createError}</span>
                  </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
                  <div className="min-w-0 space-y-5">
                    {/* Campaign */}
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.025)] sm:p-6">
                      <SectionHeader
                        number="01"
                        icon="target"
                        title="Campaign basics"
                        description="Give the campaign a clear identity and set your budget."
                      />

                      <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Field label="Campaign name">
                            <TextInput
                              value={form.campaignName}
                              onChange={(value) => updateForm("campaignName", value)}
                              placeholder="e.g. 7wingz Website Builder"
                            />
                          </Field>
                        </div>

                        <Field label="Daily budget" hint="INR / day">
                          <TextInput
                            type="number"
                            value={form.dailyBudget}
                            onChange={(value) =>
                              updateForm("dailyBudget", Number(value))
                            }
                            prefix="₹"
                          />
                        </Field>

                        <Field label="Campaign status">
                          <SelectInput
                            value={form.status}
                            onChange={(value) =>
                              updateForm("status", value as "PAUSED" | "ENABLED")
                            }
                          >
                            <option value="PAUSED">Paused</option>
                            <option value="ENABLED">Enabled</option>
                          </SelectInput>
                        </Field>

                        <Field label="Maximum CPC" hint="INR">
                          <TextInput
                            type="number"
                            value={form.maxCpc}
                            onChange={(value) =>
                              updateForm("maxCpc", Number(value))
                            }
                            prefix="₹"
                          />
                        </Field>

                        <Field label="Final URL">
                          <TextInput
                            type="url"
                            value={form.websiteUrl}
                            onChange={(value) => updateForm("websiteUrl", value)}
                            placeholder="https://7wingz.com"
                          />
                        </Field>
                      </div>
                    </section>

                    {/* Locations */}
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.025)] sm:p-6">
                      <SectionHeader
                        number="02"
                        icon="globe"
                        title="Target locations"
                        description="Choose where people should be able to see your ads."
                      />

                      <div className="relative mt-6">
                        <Field label="Search locations" hint="Google Ads locations">
                          <div className="relative mt-2">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                              <Icon name="search" size={16} />
                            </span>
                            <input
                              value={locationQuery}
                              onChange={(e) => handleLocationSearch(e.target.value)}
                              onFocus={() => {
                                if (locationQuery.trim().length >= 2) {
                                  setLocationDropdownOpen(true);
                                }
                              }}
                              placeholder="Search for a city, state or country..."
                              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-300 hover:border-gray-300 focus:border-gray-950 focus:ring-4 focus:ring-gray-100"
                            />
                          </div>
                        </Field>

                        {locationDropdownOpen && locationQuery.trim().length >= 2 && (
                          <div className="absolute left-0 right-0 top-[68px] z-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
                            {locationLoading ? (
                              <div className="flex items-center gap-3 px-4 py-5 text-xs text-gray-500">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-950" />
                                Searching Google Ads locations…
                              </div>
                            ) : locationError ? (
                              <div className="px-4 py-5 text-xs text-red-600">
                                {locationError}
                              </div>
                            ) : locationResults.length === 0 ? (
                              <div className="px-4 py-5 text-xs text-gray-500">
                                No targetable locations found.
                              </div>
                            ) : (
                              <div className="max-h-80 overflow-auto py-1">
                                {locationResults.map((location) => {
                                  const selected = form.locations.some(
                                    (item) =>
                                      item.resourceName === location.resourceName
                                  );

                                  return (
                                    <button
                                      key={location.resourceName}
                                      type="button"
                                      disabled={selected}
                                      onClick={() => addLocation(location)}
                                      className={`flex w-full items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 text-left last:border-0 ${
                                        selected
                                          ? "cursor-default bg-gray-50 opacity-50"
                                          : "hover:bg-gray-50"
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <div className="text-xs font-semibold text-gray-900">
                                          {location.name}
                                          {selected && (
                                            <span className="ml-2 text-[10px] font-medium text-emerald-600">
                                              Selected
                                            </span>
                                          )}
                                        </div>
                                        {location.canonicalName && (
                                          <div className="mt-1 truncate text-[10px] text-gray-500">
                                            {location.canonicalName}
                                          </div>
                                        )}
                                        <div className="mt-1 text-[10px] text-gray-400">
                                          {location.targetType}
                                          {location.countryCode
                                            ? ` · ${location.countryCode}`
                                            : ""}
                                        </div>
                                      </div>
                                      {location.reach ? (
                                        <span className="shrink-0 text-[10px] text-gray-400">
                                          {location.reach.toLocaleString()} reach
                                        </span>
                                      ) : null}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-800">
                            Selected locations
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {form.locations.length} selected
                          </span>
                        </div>

                        {form.locations.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 px-4 py-5 text-center">
                            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                              <Icon name="globe" size={16} />
                            </div>
                            <p className="mt-2 text-xs font-medium text-gray-600">
                              No locations selected
                            </p>
                            <p className="mt-1 text-[10px] text-gray-400">
                              Search above to add your first location.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {form.locations.map((location) => (
                              <div
                                key={location.resourceName}
                                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-3"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm">
                                    <Icon name="globe" size={14} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-semibold text-gray-900">
                                      {location.name}
                                    </div>
                                    <div className="mt-0.5 truncate text-[10px] text-gray-500">
                                      {location.canonicalName}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeLocation(location.resourceName)}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                  aria-label={`Remove ${location.name}`}
                                >
                                  <Icon name="x" size={15} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Networks */}
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.025)] sm:p-6">
                      <SectionHeader
                        number="03"
                        icon="layers"
                        title="Networks"
                        description="Choose where Google can show your campaign."
                      />

                      <div className="mt-6 space-y-2.5">
                        <ToggleRow
                          checked={form.targetGoogleSearch}
                          onChange={(checked) =>
                            updateForm("targetGoogleSearch", checked)
                          }
                          title="Google Search"
                          description="Reach people actively searching on Google."
                        />
                        <ToggleRow
                          checked={form.targetSearchNetwork}
                          onChange={(checked) =>
                            updateForm("targetSearchNetwork", checked)
                          }
                          title="Search Partners"
                          description="Extend your reach to other search properties."
                        />
                        <ToggleRow
                          checked={form.targetContentNetwork}
                          onChange={(checked) =>
                            updateForm("targetContentNetwork", checked)
                          }
                          title="Websites & apps"
                          description="Show ads across Google's content network."
                        />
                      </div>
                    </section>

                    {/* Ad group */}
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.025)] sm:p-6">
                      <SectionHeader
                        number="04"
                        icon="layers"
                        title="Ad group"
                        description="Organize related keywords and ads under one focused theme."
                      />
                      <div className="mt-6">
                        <Field label="Ad group name">
                          <TextInput
                            value={form.adGroupName}
                            onChange={(value) => updateForm("adGroupName", value)}
                            placeholder="e.g. Website Builder"
                          />
                        </Field>
                      </div>
                    </section>

                    {/* Creative */}
                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.025)]">
                      <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 via-white to-gray-50 px-5 py-5 sm:px-6">
                        <SectionHeader
                          number="05"
                          icon="sparkles"
                          title="Ad creative"
                          description="Add the search terms, headlines and descriptions people will see."
                        />
                      </div>

                      <div className="p-5 sm:p-6">
                        {/* Keywords */}
                        <div>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xs font-bold text-gray-900">
                                Keywords
                              </h3>
                              <p className="mt-1 text-[11px] leading-5 text-gray-500">
                                What might your customer type into Google?
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addListItem("keywords")}
                              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-gray-950 hover:underline"
                            >
                              <Icon name="plus" size={13} />
                              Add
                            </button>
                          </div>

                          <div className="mt-4 space-y-2">
                            {form.keywords.map((keyword, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <input
                                  value={keyword}
                                  onChange={(e) =>
                                    updateList("keywords", index, e.target.value)
                                  }
                                  placeholder="e.g. website builder"
                                  className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50/60 px-3 text-xs outline-none transition placeholder:text-gray-300 hover:border-gray-300 hover:bg-white focus:border-gray-950 focus:bg-white focus:ring-4 focus:ring-gray-100"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeListItem("keywords", index)}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500"
                                >
                                  <Icon name="x" size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Headlines */}
                        <div className="mt-8 border-t border-gray-100 pt-8">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xs font-bold text-gray-900">
                                Headlines
                              </h3>
                              <p className="mt-1 text-[11px] leading-5 text-gray-500">
                                Short, clear reasons to click. Maximum 30 characters each.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addListItem("headlines")}
                              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-gray-950 hover:underline"
                            >
                              <Icon name="plus" size={13} />
                              Add
                            </button>
                          </div>

                          <div className="mt-4 space-y-2">
                            {form.headlines.map((headline, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="relative min-w-0 flex-1">
                                  <input
                                    value={headline}
                                    maxLength={30}
                                    onChange={(e) =>
                                      updateList("headlines", index, e.target.value)
                                    }
                                    placeholder="e.g. Build Your Website"
                                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50/60 px-3 pr-12 text-xs outline-none transition placeholder:text-gray-300 hover:border-gray-300 hover:bg-white focus:border-gray-950 focus:bg-white focus:ring-4 focus:ring-gray-100"
                                  />
                                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] text-gray-300">
                                    {headline.length}/30
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeListItem("headlines", index)}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500"
                                >
                                  <Icon name="x" size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Descriptions */}
                        <div className="mt-8 border-t border-gray-100 pt-8">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xs font-bold text-gray-900">
                                Descriptions
                              </h3>
                              <p className="mt-1 text-[11px] leading-5 text-gray-500">
                                Explain the value clearly. Maximum 90 characters each.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addListItem("descriptions")}
                              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-gray-950 hover:underline"
                            >
                              <Icon name="plus" size={13} />
                              Add
                            </button>
                          </div>

                          <div className="mt-4 space-y-2">
                            {form.descriptions.map((description, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="relative min-w-0 flex-1">
                                  <textarea
                                    value={description}
                                    maxLength={90}
                                    rows={2}
                                    onChange={(e) =>
                                      updateList(
                                        "descriptions",
                                        index,
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g. Build a beautiful website in minutes."
                                    className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50/60 p-3 pr-12 text-xs leading-5 outline-none transition placeholder:text-gray-300 hover:border-gray-300 hover:bg-white focus:border-gray-950 focus:bg-white focus:ring-4 focus:ring-gray-100"
                                  />
                                  <span className="pointer-events-none absolute right-3 top-3 font-mono text-[9px] text-gray-300">
                                    {description.length}/90
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeListItem("descriptions", index)
                                  }
                                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500"
                                >
                                  <Icon name="x" size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Compliance */}
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.025)] sm:p-6">
                      <SectionHeader
                        number="06"
                        icon="check"
                        title="Google Ads declaration"
                        description="Confirm whether this campaign contains EU political advertising."
                      />

                      <div className="mt-6">
                        <SelectInput
                          value={form.containsEuPoliticalAdvertising}
                          onChange={(value) =>
                            updateForm(
                              "containsEuPoliticalAdvertising",
                              value
                            )
                          }
                        >
                          <option value="DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING">
                            Does not contain EU political advertising
                          </option>
                          <option value="CONTAINS_EU_POLITICAL_ADVERTISING">
                            Contains EU political advertising
                          </option>
                        </SelectInput>
                      </div>
                    </section>

                    {/* Action bar */}
                    <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-[0_15px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl">
                      {editingCampaignId ? (
                        <button
                          type="button"
                          onClick={startNewCampaign}
                          className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      ) : (
                        <div className="hidden text-[11px] text-gray-400 sm:block">
                          Campaigns can be refined later.
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={createCampaign}
                        disabled={creating}
                        className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl bg-gray-950 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {creating ? (
                          <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Creating…
                          </>
                        ) : (
                          <>
                            {editingCampaignId ? "Update campaign" : "Create campaign"}
                            <Icon name="arrow" size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  <aside className="hidden xl:block">
                    <div className="sticky top-[96px]">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-gray-900">
                            Live preview
                          </div>
                          <div className="mt-0.5 text-[10px] text-gray-400">
                            Approximate search result
                          </div>
                        </div>
                        <span className="rounded-full border border-gray-200 bg-white px-2 py-1 text-[9px] font-semibold text-gray-400">
                          Search ad
                        </span>
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_12px_35px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span className="rounded-full border border-gray-200 px-1.5 py-0.5 font-semibold text-gray-700">
                            Sponsored
                          </span>
                          <span>·</span>
                          <span className="truncate">{previewUrl}</span>
                        </div>

                        <div className="mt-3 text-[15px] font-medium leading-5 text-blue-700">
                          {previewHeadline}
                        </div>

                        <div className="mt-2 text-[11px] leading-5 text-gray-600">
                          {previewDescription}
                        </div>

                        <div className="mt-2 text-[10px] font-medium text-emerald-700">
                          {previewUrl}
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                          Campaign snapshot
                        </div>

                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-gray-500">Budget</span>
                            <span className="text-xs font-semibold text-gray-900">
                              ₹{Number(form.dailyBudget || 0).toLocaleString("en-IN")}/day
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-gray-500">Locations</span>
                            <span className="text-xs font-semibold text-gray-900">
                              {form.locations.length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-gray-500">Keywords</span>
                            <span className="text-xs font-semibold text-gray-900">
                              {form.keywords.filter((item) => item.trim()).length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-gray-500">Status</span>
                            <StatusBadge status={form.status} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-gray-950 p-4 text-white">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <Icon name="sparkles" size={14} />
                          A focused campaign wins
                        </div>
                        <p className="mt-2 text-[10px] leading-5 text-gray-400">
                          Keep the keywords, landing page and ad message tightly aligned.
                        </p>
                      </div>
                    </div>
                  </aside>
                </div>
              </>
            ) : (
              /* History */
              <div>
                <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <div className="mb-3 inline-flex rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
                      Google Ads
                    </div>
                    <h1 className="text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
                      Your campaigns
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
                      Review status, edit active campaigns and control which campaigns are serving.
                    </p>
                  </div>
                </div>

                {campaignsError && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                    <Icon name="alert" size={17} />
                    <span>{campaignsError}</span>
                  </div>
                )}

                {campaignsLoading ? (
                  <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-[0_8px_30px_rgba(0,0,0,0.025)]">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-950" />
                    <p className="mt-4 text-xs font-medium text-gray-500">
                      Loading campaigns…
                    </p>
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-[0_8px_30px_rgba(0,0,0,0.025)]">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-950 text-white">
                      <Icon name="target" size={21} />
                    </div>
                    <h2 className="mt-5 text-sm font-bold">No campaigns yet</h2>
                    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-gray-500">
                      Create your first campaign to start reaching people through Google Search.
                    </p>
                    <button
                      type="button"
                      onClick={startNewCampaign}
                      className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-gray-950 px-4 text-xs font-bold text-white hover:bg-gray-800"
                    >
                      <Icon name="plus" size={14} />
                      Create campaign
                    </button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.025)]">
                    <div className="hidden grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/70 px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 md:grid">
                      <div className="col-span-4">Campaign</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Start date</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {campaigns.map((campaign) => {
                      const isPaused = campaign.status === "PAUSED";
                      const isEnabled = campaign.status === "ENABLED";
                      const isRemoved = campaign.status === "REMOVED";

                      return (
                        <div
                          key={campaign.resourceName}
                          className="border-b border-gray-100 p-5 last:border-0 md:grid md:grid-cols-12 md:items-center md:gap-4"
                        >
                          <div className="min-w-0 md:col-span-4">
                            <div className="truncate text-sm font-semibold text-gray-900">
                              {campaign.name}
                            </div>
                            <div className="mt-1 truncate text-[10px] text-gray-400">
                              Campaign ID · {campaign.id}
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between md:col-span-2 md:mt-0 md:block">
                            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 md:hidden">
                              Type
                            </span>
                            <span className="text-xs text-gray-600">
                              {campaign.channelType === "SEARCH"
                                ? "Search"
                                : campaign.channelType}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between md:col-span-2 md:mt-0 md:block">
                            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 md:hidden">
                              Status
                            </span>
                            <StatusBadge status={campaign.status} />
                          </div>

                          <div className="mt-3 flex items-center justify-between md:col-span-2 md:mt-0 md:block">
                            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 md:hidden">
                              Start
                            </span>
                            <span className="text-xs text-gray-500">
                              {campaign.startDate || "—"}
                            </span>
                          </div>

                          <div className="mt-5 flex flex-wrap justify-end gap-2 md:col-span-2 md:mt-0">
                            {!isRemoved && isPaused && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateCampaignStatus(
                                    campaign.resourceName,
                                    "ENABLED"
                                  )
                                }
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-[10px] font-bold text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                              >
                                <Icon name="play" size={12} />
                                Restart
                              </button>
                            )}

                            {!isRemoved && isEnabled && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateCampaignStatus(
                                    campaign.resourceName,
                                    "PAUSED"
                                  )
                                }
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-[10px] font-bold text-gray-700 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                              >
                                <Icon name="pause" size={12} />
                                Pause
                              </button>
                            )}

                            {!isRemoved && (
                              <button
                                type="button"
                                onClick={() => editCampaign(campaign)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-[10px] font-bold text-gray-700 transition hover:bg-gray-50"
                              >
                                <Icon name="edit" size={12} />
                                Edit
                              </button>
                            )}

                            {!isRemoved && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError("");
                                  setDeletingCampaign(campaign);
                                }}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-100 px-2.5 text-[10px] font-bold text-red-600 transition hover:bg-red-50"
                              >
                                <Icon name="trash" size={12} />
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete modal */}
      {deletingCampaign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Icon name="trash" size={17} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-950">
                  Remove campaign?
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-gray-500">
                  This will mark the campaign as REMOVED in Google Ads. It will no longer be eligible to serve.
                </p>
                <div className="mt-3 truncate rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-800">
                  {deletingCampaign.name}
                </div>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-700">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeletingCampaign(null)}
                className="h-10 rounded-xl border border-gray-200 px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => deleteCampaign(deletingCampaign)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Removing…
                  </>
                ) : (
                  <>
                    <Icon name="trash" size={13} />
                    Remove campaign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
