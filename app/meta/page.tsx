"use client";

import { FormEvent, useEffect, useState } from "react";

type AdAccount = {
  id: string;
  name?: string;
  account_id?: string;
  currency?: string;
};

type Campaign = {
  id: string;
  name?: string;
  status?: string;
  effective_status?: string;
  created_time?: string;
  objective?: string;
};

type AccountBilling = {
  balance?: string;
  currency?: string;
  amount_spent?: string;
};

type FullAdForm = {
  adAccountId: string;
  campaignName: string;
  objective: string;
  adSetName: string;
  dailyBudget: string;
  country: string;
  ageMin: string;
  ageMax: string;
  pageId: string;
  creativeType: "image" | "video" | "carousel";
  primaryText: string;
  headline: string;
  description: string;
  destinationUrl: string;
  imageUrl: string;
  videoId: string;
  carouselItems: string;
  callToAction: string;
};

const defaultForm: FullAdForm = {
  adAccountId: "",
  campaignName: "Spring Launch",
  objective: "OUTCOME_TRAFFIC",
  adSetName: "Spring Launch Ad Set",
  dailyBudget: "10",
  country: "US",
  ageMin: "25",
  ageMax: "55",
  pageId: "",
  creativeType: "image",
  primaryText: "Shop our new spring collection today.",
  headline: "Fresh styles, big savings",
  description: "Limited-time discounts for your favorite products.",
  destinationUrl: "https://example.com",
  imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
  videoId: "",
  carouselItems: JSON.stringify(
    [
      {
        title: "Slide 1",
        description: "Premium essentials for less.",
        link: "https://example.com/products",
        image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
      },
      {
        title: "Slide 2",
        description: "New arrivals this week.",
        link: "https://example.com/new-arrivals",
        image_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    null,
    2
  ),
  callToAction: "LEARN_MORE",
};

/* ---------- Facebook-flavoured class tokens ---------- */
const FB_BLUE = "#1877F2";
const FB_BLUE_HOVER = "#166FE5";

const inputClass =
  "w-full rounded-md border border-[#CED0D4] bg-white px-3 py-2.5 text-[15px] text-[#050505] outline-none transition placeholder:text-[#8A8D91] hover:border-[#BCC0C4] focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20";

const labelClass = "block text-[13px] font-semibold text-[#65676B]";

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md bg-[#1877F2] px-4 py-2.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#166FE5] active:bg-[#1465cf] disabled:cursor-not-allowed disabled:opacity-60";

const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-md border border-[#CED0D4] bg-white px-4 py-2.5 text-[15px] font-semibold text-[#050505] transition hover:bg-[#F2F2F2] active:bg-[#E4E6EB] disabled:cursor-not-allowed disabled:opacity-60";

const cardClass = "rounded-lg border border-[#DADDE1] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.1)]";

export default function MetaAdsPage() {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [form, setForm] = useState<FullAdForm>(defaultForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsVisible, setCampaignsVisible] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState("");
  const [updatingCampaignId, setUpdatingCampaignId] = useState<string | null>(null);
  const [accountBilling, setAccountBilling] = useState<AccountBilling | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) setMessage("Meta account connected successfully.");
    if (params.get("error")) setError(params.get("error") || "Meta connection failed.");

    fetch("/api/meta/adaccounts")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 401) {
            setError("Meta is not connected in this browser. Select Connect Meta and approve the requested access.");
            return;
          }
          throw new Error(data.error || "Could not load ad accounts.");
        }
        const list = data.data || [];
        setAccounts(list);
        if (list.length) {
          setForm((current) => ({ ...current, adAccountId: list[0].id }));
        }
      })
      .catch((loadError: Error) => setError(loadError.message));
  }, []);

  useEffect(() => {
    if (!form.adAccountId) {
      setAccountBilling(null);
      return;
    }

    let cancelled = false;
    setBillingLoading(true);
    setBillingError("");

    const params = new URLSearchParams({ adAccountId: form.adAccountId });
    fetch(`/api/meta/adaccounts/balance?${params.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || data.error || "Could not load account billing.");
        if (!cancelled) setAccountBilling(data);
      })
      .catch((loadError: Error) => {
        if (!cancelled) setBillingError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setBillingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.adAccountId]);

  function connectMeta() {
    setLoading(true);
    window.location.href = "/api/meta/auth";
  }

  function handleFieldChange(field: keyof FullAdForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function formatMetaAmount(value?: string, currency?: string) {
    if (value === undefined) return "--";
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "--";
    if (!currency) return amount.toLocaleString();

    try {
      const formatter = new Intl.NumberFormat(undefined, { style: "currency", currency });
      const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
      return formatter.format(amount / 10 ** fractionDigits);
    } catch {
      return `${amount.toLocaleString()} ${currency}`;
    }
  }

  async function loadCampaigns() {
    if (!form.adAccountId) return;

    setCampaignsLoading(true);
    setCampaignsError("");
    setCampaignsVisible(true);

    try {
      const params = new URLSearchParams({ adAccountId: form.adAccountId });
      const response = await fetch(`/api/meta/campaign?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load campaigns.");
      setCampaigns(data.data || []);
    } catch (loadError) {
      setCampaignsError(loadError instanceof Error ? loadError.message : "Could not load campaigns.");
    } finally {
      setCampaignsLoading(false);
    }
  }

  async function updateCampaignStatus(campaign: Campaign) {
    const nextStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    if (
      nextStatus === "ACTIVE" &&
      !window.confirm(`Activate "${campaign.name || "this campaign"}"? Eligible ads may begin delivering.`)
    ) {
      return;
    }

    setUpdatingCampaignId(campaign.id);
    setCampaignsError("");

    try {
      const response = await fetch("/api/meta/campaign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id, status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok || data.error || data.success === false) {
        throw new Error(data.error || "Could not update campaign status.");
      }
      await loadCampaigns();
    } catch (updateError) {
      setCampaignsError(updateError instanceof Error ? updateError.message : "Could not update campaign status.");
    } finally {
      setUpdatingCampaignId(null);
    }
  }

  async function createFullAd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/meta/full-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        const details = [data.error || "Could not create the full Meta ad flow."];
        if (data.stage) details.push(`Failed during ${data.stage}.`);
        if (data.created && Object.keys(data.created).length) {
          details.push(
            `Created paused objects: ${Object.entries(data.created)
              .map(([kind, id]) => `${kind} ${id}`)
              .join(", ")}.`
          );
        }
        if (data.metaError?.code) {
          details.push(
            `Meta error ${data.metaError.code}${data.metaError.subcode ? `/${data.metaError.subcode}` : ""}${
              data.metaError.fbtraceId ? ` (trace ${data.metaError.fbtraceId})` : ""
            }.`
          );
        }
        throw new Error(details.join(" "));
      }

      const campaignId = data.campaign?.id;
      const adSetId = data.adSet?.id;
      const creativeId = data.creative?.id;
      const adId = data.ad?.id;

      setMessage(
        `Meta ad flow created successfully. Campaign: ${campaignId}, Ad Set: ${adSetId}, Creative: ${creativeId}, Ad: ${adId}.`
      );
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create the full Meta ad flow.");
    } finally {
      setCreating(false);
    }
  }

  let previewSlides: Array<{ title: string; description: string; link: string; image_url: string }> = [];
  try {
    previewSlides = JSON.parse(form.carouselItems || "[]");
  } catch {
    previewSlides = [];
  }

  const previewImage =
    form.creativeType === "image"
      ? form.imageUrl
      : form.creativeType === "video"
        ? ""
        : previewSlides[0]?.image_url || form.imageUrl;
  const previewHeadline = form.headline || "Your headline";
  const previewText = form.primaryText || "Your ad copy appears here.";
  const previewDescription = form.description || "A short description preview.";

  return (
    <main className="min-h-screen bg-[#F0F2F5] pb-20 font-sans text-[#050505] antialiased">
      {/* ---------- Facebook blue header ---------- */}
      <header className="sticky top-0 z-30 bg-[#1877F2] shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[26px] font-bold leading-none text-[#1877F2]">
              f
            </span>
            <span className="hidden text-[17px] font-bold tracking-tight text-white sm:block">
              Meta Ads Manager
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-medium text-white/90 md:inline">
              {accounts.length ? `${accounts.length} ad account${accounts.length > 1 ? "s" : ""}` : "Not connected"}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E4E6EB] text-[13px] font-bold text-[#1877F2] ring-2 ring-white/70">
              A
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* ---------- Page title + actions ---------- */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[24px] font-bold leading-tight text-[#050505]">Create full Meta ad</h1>
            <p className="mt-1 text-[14px] text-[#65676B]">
              This creates a campaign, ad set, creative, and ad in one flow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!accounts.length && (
              <button onClick={connectMeta} disabled={loading} className={btnPrimary}>
                {loading ? "Connecting..." : "Connect Meta"}
              </button>
            )}
            {accounts.length > 0 && (
              <button
                onClick={loadCampaigns}
                disabled={campaignsLoading || !form.adAccountId}
                className={btnSecondary}
              >
                {campaignsLoading ? "Loading campaigns..." : campaignsVisible ? "Refresh campaigns" : "Campaigns"}
              </button>
            )}
          </div>
        </div>

        {/* ---------- Billing ---------- */}
        {accounts.length > 0 && (
          <section
            className={`${cardClass} mb-6 p-5`}
            aria-label="Ad account billing"
            aria-live="polite"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold text-[#050505]">Account billing</h2>
                <p className="mt-1 max-w-xl text-[13px] leading-5 text-[#65676B]">
                  Meta does not expose prepaid funds separately through the API. View your available prepaid
                  balance in Meta billing.
                </p>

                {billingError ? (
                  <p className="mt-3 rounded-md bg-[#FFEBE8] px-3 py-2 text-[13px] text-[#C0392B]">
                    {billingError}
                  </p>
                ) : billingLoading ? (
                  <p className="mt-3 text-[13px] text-[#65676B]">Loading billing details...</p>
                ) : (
                  <dl className="mt-4 flex flex-wrap gap-x-12 gap-y-4">
                    <div className="rounded-lg bg-[#F0F2F5] px-4 py-3">
                      <dt className="text-[12px] font-medium uppercase tracking-wide text-[#65676B]">
                        Amount due
                      </dt>
                      <dd className="mt-1 text-[20px] font-bold text-[#050505]">
                        {formatMetaAmount(accountBilling?.balance, accountBilling?.currency)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-[#F0F2F5] px-4 py-3">
                      <dt className="text-[12px] font-medium uppercase tracking-wide text-[#65676B]">
                        Amount spent
                      </dt>
                      <dd className="mt-1 text-[20px] font-bold text-[#050505]">
                        {formatMetaAmount(accountBilling?.amount_spent, accountBilling?.currency)}
                      </dd>
                    </div>
                  </dl>
                )}
              </div>

              {form.adAccountId && (
                <a
                  href={`https://www.facebook.com/ads/manager/account_settings/account_billing/?act=${form.adAccountId.replace(
                    /^act_/,
                    ""
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${btnPrimary} shrink-0`}
                >
                  View prepaid balance in Meta
                </a>
              )}
            </div>
          </section>
        )}

        {/* ---------- Campaigns ---------- */}
        {campaignsVisible && (
          <section className={`${cardClass} mb-6 overflow-hidden`} aria-label="Campaign list">
            <div className="flex items-center justify-between border-b border-[#E4E6EB] px-5 py-4">
              <h2 className="text-[17px] font-bold text-[#050505]">Campaigns</h2>
              <button
                type="button"
                onClick={() => setCampaignsVisible(false)}
                className="rounded-md px-2 py-1 text-[14px] font-semibold text-[#1877F2] transition hover:bg-[#F0F2F5]"
              >
                Hide
              </button>
            </div>

            {campaignsError ? (
              <p role="alert" className="m-4 rounded-md bg-[#FFEBE8] px-3 py-2 text-[13px] text-[#C0392B]">
                {campaignsError}
              </p>
            ) : campaignsLoading ? (
              <p className="px-5 py-5 text-[14px] text-[#65676B]">Loading campaigns...</p>
            ) : campaigns.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-[14px]">
                  <thead className="bg-[#F0F2F5] text-[12px] uppercase tracking-wide text-[#65676B]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Campaign</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Created</th>
                      <th className="px-5 py-3 font-semibold">Objective</th>
                      <th className="px-5 py-3 font-semibold">Campaign ID</th>
                      <th className="px-5 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E6EB]">
                    {campaigns.map((campaign) => {
                      const status = campaign.effective_status || campaign.status || "UNKNOWN";
                      const isActive = status === "ACTIVE";
                      const isPaused = status === "PAUSED";
                      return (
                        <tr key={campaign.id} className="transition hover:bg-[#F7F8FA]">
                          <td className="px-5 py-3 font-semibold text-[#050505]">
                            {campaign.name || "Unnamed campaign"}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                                isActive
                                  ? "bg-[#E3F2E6] text-[#1E7A34]"
                                  : isPaused
                                    ? "bg-[#F0F2F5] text-[#65676B]"
                                    : "bg-[#FFF3E0] text-[#9A6700]"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isActive ? "bg-[#1E7A34]" : isPaused ? "bg-[#8A8D91]" : "bg-[#9A6700]"
                                }`}
                              />
                              {status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[#65676B]">
                            {campaign.created_time ? new Date(campaign.created_time).toLocaleString() : "Unknown"}
                          </td>
                          <td className="px-5 py-3 text-[#65676B]">{campaign.objective || "Unknown"}</td>
                          <td className="px-5 py-3 font-mono text-[12px] text-[#65676B]">{campaign.id}</td>
                          <td className="px-5 py-3">
                            {(campaign.status === "ACTIVE" || campaign.status === "PAUSED") && (
                              <button
                                type="button"
                                onClick={() => updateCampaignStatus(campaign)}
                                disabled={updatingCampaignId !== null}
                                className="rounded-md px-2 py-1 text-[14px] font-semibold text-[#1877F2] transition hover:bg-[#F0F2F5] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {updatingCampaignId === campaign.id
                                  ? "Updating..."
                                  : campaign.status === "ACTIVE"
                                    ? "Pause"
                                    : "Activate"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-5 text-[14px] text-[#65676B]">No campaigns found for this ad account.</p>
            )}
          </section>
        )}

        {/* ---------- Form + preview ---------- */}
        {accounts.length ? (
          <div className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
            <form onSubmit={createFullAd} className={`${cardClass} p-5 sm:p-6`}>
              {/* Ad account */}
              <div className="space-y-2">
                <label className={labelClass}>Ad account</label>
                <select
                  value={form.adAccountId}
                  onChange={(event) => handleFieldChange("adAccountId", event.target.value)}
                  className={inputClass}
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name || account.account_id || account.id}
                      {account.currency ? ` (${account.currency})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campaign section */}
              <SectionHeading title="Campaign" subtitle="Name and objective" />
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={labelClass}>Campaign name</label>
                  <input
                    required
                    value={form.campaignName}
                    onChange={(event) => handleFieldChange("campaignName", event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Objective</label>
                  <select
                    value={form.objective}
                    onChange={(event) => handleFieldChange("objective", event.target.value)}
                    className={inputClass}
                  >
                    <option value="OUTCOME_TRAFFIC">Traffic</option>
                    <option value="OUTCOME_SALES">Sales</option>
                    <option value="OUTCOME_LEADS">Leads</option>
                    <option value="OUTCOME_ENGAGEMENT">Engagement</option>
                    <option value="OUTCOME_AWARENESS">Awareness</option>
                    <option value="OUTCOME_APP_PROMOTION">App promotion</option>
                  </select>
                </div>
              </div>

              {/* Ad set section */}
              <SectionHeading title="Ad set" subtitle="Budget and audience" />
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className={labelClass}>Ad set name</label>
                  <input
                    required
                    value={form.adSetName}
                    onChange={(event) => handleFieldChange("adSetName", event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Daily budget (USD)</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-[#8A8D91]">
                      $
                    </span>
                    <input
                      required
                      type="number"
                      min="1"
                      value={form.dailyBudget}
                      onChange={(event) => handleFieldChange("dailyBudget", event.target.value)}
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Country</label>
                  <input
                    value={form.country}
                    onChange={(event) => handleFieldChange("country", event.target.value)}
                    className={inputClass}
                    placeholder="US"
                  />
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Min age</label>
                  <input
                    type="number"
                    min="18"
                    value={form.ageMin}
                    onChange={(event) => handleFieldChange("ageMin", event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Max age</label>
                  <input
                    type="number"
                    min="18"
                    value={form.ageMax}
                    onChange={(event) => handleFieldChange("ageMax", event.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Creative section */}
              <SectionHeading title="Ad creative" subtitle="How your ad looks in the feed" />
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className={labelClass}>Meta Page ID</label>
                  <input
                    required
                    value={form.pageId}
                    onChange={(event) => handleFieldChange("pageId", event.target.value)}
                    className={inputClass}
                    placeholder="Enter your Facebook Page ID"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className={labelClass}>Creative type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { value: "image", label: "Image" },
                        { value: "video", label: "Video" },
                        { value: "carousel", label: "Carousel" },
                      ] as const
                    ).map((option) => {
                      const selected = form.creativeType === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleFieldChange("creativeType", option.value)}
                          className={`rounded-md border px-3 py-2.5 text-[14px] font-semibold transition ${
                            selected
                              ? "border-[#1877F2] bg-[#E7F3FF] text-[#1877F2]"
                              : "border-[#CED0D4] bg-white text-[#050505] hover:bg-[#F2F2F2]"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className={labelClass}>Primary text</label>
                  <textarea
                    required
                    rows={3}
                    value={form.primaryText}
                    onChange={(event) => handleFieldChange("primaryText", event.target.value)}
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Headline</label>
                  <input
                    required
                    value={form.headline}
                    onChange={(event) => handleFieldChange("headline", event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Description</label>
                  <input
                    value={form.description}
                    onChange={(event) => handleFieldChange("description", event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Destination URL</label>
                  <input
                    required
                    value={form.destinationUrl}
                    onChange={(event) => handleFieldChange("destinationUrl", event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Call to action</label>
                  <select
                    value={form.callToAction}
                    onChange={(event) => handleFieldChange("callToAction", event.target.value)}
                    className={inputClass}
                  >
                    <option value="LEARN_MORE">Learn more</option>
                    <option value="SHOP_NOW">Shop now</option>
                    <option value="SIGN_UP">Sign up</option>
                    <option value="BOOK_TRAVEL">Book travel</option>
                    <option value="DOWNLOAD">Download</option>
                    <option value="GET_QUOTE">Get quote</option>
                  </select>
                </div>

                {form.creativeType === "image" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className={labelClass}>Image URL</label>
                    <input
                      value={form.imageUrl}
                      onChange={(event) => handleFieldChange("imageUrl", event.target.value)}
                      className={inputClass}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                )}

                {form.creativeType === "video" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className={labelClass}>Video ID</label>
                    <input
                      value={form.videoId}
                      onChange={(event) => handleFieldChange("videoId", event.target.value)}
                      className={inputClass}
                      placeholder="Meta video ID from your Media Library"
                    />
                  </div>
                )}

                {form.creativeType === "carousel" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className={labelClass}>Carousel items JSON</label>
                    <textarea
                      rows={8}
                      value={form.carouselItems}
                      onChange={(event) => handleFieldChange("carouselItems", event.target.value)}
                      className={`${inputClass} resize-y font-mono text-[13px]`}
                      placeholder='[{"title":"Slide 1","description":"...","link":"https://example.com","image_url":"https://..."}]'
                    />
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col-reverse items-stretch gap-3 border-t border-[#E4E6EB] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] text-[#65676B]">
                  The ad is created in a paused state by default.
                </p>
                <button type="submit" disabled={creating || !form.adAccountId} className={btnPrimary}>
                  {creating ? "Creating full ad..." : "Create full Meta ad"}
                </button>
              </div>
            </form>

            {/* ---------- Preview ---------- */}
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <div className={`${cardClass} p-4`}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[17px] font-bold text-[#050505]">Preview</h2>
                  <span className="rounded-full bg-[#F0F2F5] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#65676B]">
                    {form.creativeType}
                  </span>
                </div>

                {/* Feed post mock */}
                <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-lg border border-[#DADDE1] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                  {/* Post header */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-[15px] font-bold text-white">
                        f
                      </div>
                      <div className="leading-tight">
                        <p className="text-[13px] font-semibold text-[#050505]">
                          {form.pageId ? `Page ${form.pageId}` : "Your Page"}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-[#65676B]">
                          Sponsored
                          <span aria-hidden>·</span>
                          <span aria-hidden>🌐</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[#65676B]">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    </div>
                  </div>

                  {/* Primary text */}
                  <p className="px-4 pb-3 text-[14px] leading-5 text-[#050505]">{previewText}</p>

                  {/* Media */}
                  {form.creativeType === "carousel" ? (
                    <div className="border-y border-[#E4E6EB]">
                      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-medium text-[#65676B]">
                        <span>Carousel</span>
                        <span>{previewSlides.length || 1} slides</span>
                      </div>

                      <div className="space-y-3 px-3 pb-3">
                        {(previewSlides.length
                          ? previewSlides
                          : [
                              {
                                title: previewHeadline,
                                description: previewDescription,
                                link: form.destinationUrl,
                                image_url: previewImage,
                              },
                            ]
                        ).map((slide, index) => (
                          <div
                            key={`${slide.title}-${index}`}
                            className="overflow-hidden rounded-md border border-[#E4E6EB] bg-[#F0F2F5]"
                          >
                            <img
                              src={
                                slide.image_url ||
                                "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80"
                              }
                              alt={slide.title}
                              className="h-32 w-full object-cover"
                            />
                            <div className="space-y-1 border-t border-[#E4E6EB] bg-white p-3">
                              <h3 className="text-[13px] font-semibold text-[#050505]">
                                {slide.title || previewHeadline}
                              </h3>
                              <p className="text-[11px] leading-4 text-[#65676B]">
                                {slide.description || previewDescription}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-center gap-2 border-t border-[#E4E6EB] bg-white py-2">
                        {Array.from({ length: Math.max(1, previewSlides.length || 1) }).map((_, index) => (
                          <span
                            key={index}
                            className={`h-2 w-2 rounded-full ${index === 0 ? "bg-[#1877F2]" : "bg-[#CED0D4]"}`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative border-y border-[#E4E6EB]">
                        <img
                          src={
                            form.creativeType === "video"
                              ? "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
                              : previewImage ||
                                "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80"
                          }
                          alt={previewHeadline}
                          className="h-[210px] w-full object-cover"
                        />
                        {form.creativeType === "video" && (
                          <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-[11px] font-bold text-white">
                            ▶
                          </div>
                        )}
                      </div>

                      {/* Link card footer */}
                      <div className="flex items-center justify-between gap-3 bg-[#F0F2F5] px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] uppercase tracking-wide text-[#65676B]">
                            {form.destinationUrl.replace(/^https?:\/\//, "").split("/")[0]}
                          </p>
                          <h3 className="mt-0.5 truncate text-[15px] font-semibold text-[#050505]">
                            {previewHeadline}
                          </h3>
                          {previewDescription && (
                            <p className="mt-0.5 truncate text-[12px] text-[#65676B]">{previewDescription}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          tabIndex={-1}
                          className="shrink-0 rounded-md bg-[#E4E6EB] px-3 py-2 text-[12px] font-semibold text-[#050505]"
                        >
                          {form.callToAction.replace(/_/g, " ")}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Engagement bar */}
                  <div className="border-t border-[#E4E6EB] px-2 py-1">
                    <div className="flex items-center justify-between text-[13px] font-semibold text-[#65676B]">
                      {[
                        { icon: "👍", label: "Like" },
                        { icon: "💬", label: "Comment" },
                        { icon: "↗", label: "Share" },
                      ].map((action) => (
                        <span
                          key={action.label}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 transition hover:bg-[#F0F2F5]"
                        >
                          <span aria-hidden>{action.icon}</span>
                          {action.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-center text-[11px] text-[#65676B]">
                  Preview is an approximation of the Facebook feed placement.
                </p>
              </div>
            </aside>
          </div>
        ) : (
          /* ---------- Empty / not connected state ---------- */
          <div className={`${cardClass} px-6 py-14 text-center`}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F3FF] text-[28px] font-bold text-[#1877F2]">
              f
            </div>
            <h2 className="mt-4 text-[17px] font-bold text-[#050505]">Connect your Meta account</h2>
            <p className="mx-auto mt-1 max-w-md text-[14px] leading-5 text-[#65676B]">
              Link a Meta account to load your ad accounts, review billing, and publish campaigns, ad sets,
              creatives, and ads.
            </p>
            <button onClick={connectMeta} disabled={loading} className={`${btnPrimary} mt-5`}>
              {loading ? "Connecting..." : "Connect Meta"}
            </button>
          </div>
        )}

        {/* ---------- Banners ---------- */}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-md border border-[#F5C2C0] bg-[#FFEBE8] px-4 py-3 text-[14px] text-[#C0392B]"
          >
            {error}
          </p>
        )}
        {message && (
          <p
            role="status"
            className="mt-5 rounded-md border border-[#B7E1C0] bg-[#E3F2E6] px-4 py-3 text-[14px] text-[#1E7A34]"
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

/* ---------- Small helper ---------- */
function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mt-8 mb-5 border-b border-[#E4E6EB] pb-2">
      <h2 className="text-[17px] font-bold text-[#050505]">{title}</h2>
      {subtitle && <p className="mt-0.5 text-[13px] text-[#65676B]">{subtitle}</p>}
    </div>
  );
}