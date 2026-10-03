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
  carouselItems: JSON.stringify([
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
  ], null, 2),
  callToAction: "LEARN_MORE",
};

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
    if (nextStatus === "ACTIVE" && !window.confirm(`Activate "${campaign.name || "this campaign"}"? Eligible ads may begin delivering.`)) {
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
          details.push(`Created paused objects: ${Object.entries(data.created).map(([kind, id]) => `${kind} ${id}`).join(", ")}.`);
        }
        if (data.metaError?.code) {
          details.push(`Meta error ${data.metaError.code}${data.metaError.subcode ? `/${data.metaError.subcode}` : ""}${data.metaError.fbtraceId ? ` (trace ${data.metaError.fbtraceId})` : ""}.`);
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

  const previewImage = form.creativeType === "image" ? form.imageUrl : form.creativeType === "video" ? "" : previewSlides[0]?.image_url || form.imageUrl;
  const previewHeadline = form.headline || "Your headline";
  const previewText = form.primaryText || "Your ad copy appears here.";
  const previewDescription = form.description || "A short description preview.";

  return (
    <main className="min-h-screen bg-[#f7f7f8] px-6 py-10">
      <div className="mx-auto max-w-6xl rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">Create full Meta ad</h1>
            <p className="mt-2 text-sm text-zinc-500">
              This creates a campaign, ad set, creative, and ad in one flow.
            </p>
          </div>
          {!accounts.length && (
            <button
              onClick={connectMeta}
              disabled={loading}
              className="rounded-xl bg-[#0866FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0757d6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Connecting..." : "Connect Meta"}
            </button>
          )}
          {accounts.length > 0 && (
            <button
              onClick={loadCampaigns}
              disabled={campaignsLoading || !form.adAccountId}
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {campaignsLoading ? "Loading campaigns..." : campaignsVisible ? "Refresh campaigns" : "Campaigns"}
            </button>
          )}
        </div>

        {accounts.length > 0 && (
          <section className="mb-8 flex flex-col gap-5 border-y border-zinc-200 py-5 sm:flex-row sm:items-center sm:justify-between" aria-label="Ad account billing" aria-live="polite">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Account billing</h2>
              {billingError ? (
                <p className="mt-1 text-sm text-red-600">{billingError}</p>
              ) : billingLoading ? (
                <p className="mt-1 text-sm text-zinc-500">Loading account balance...</p>
              ) : (
                <dl className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
                  <div>
                    <dt className="text-xs text-zinc-500">Balance</dt>
                    <dd className="mt-0.5 text-lg font-semibold text-zinc-900">
                      {formatMetaAmount(accountBilling?.balance, accountBilling?.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Amount spent</dt>
                    <dd className="mt-0.5 text-lg font-semibold text-zinc-900">
                      {formatMetaAmount(accountBilling?.amount_spent, accountBilling?.currency)}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
            {form.adAccountId && (
              <a
                href={`https://www.facebook.com/ads/manager/account_settings/account_billing/?act=${form.adAccountId.replace(/^act_/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center justify-center rounded-lg bg-[#0866FF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0757d6]"
              >
                Add balance
              </a>
            )}
          </section>
        )}

        {campaignsVisible && (
          <section className="mb-8 overflow-hidden rounded-xl border border-zinc-200" aria-label="Campaign list">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-zinc-900">Campaigns</h2>
              <button
                type="button"
                onClick={() => setCampaignsVisible(false)}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Hide
              </button>
            </div>
            {campaignsError ? (
              <p role="alert" className="px-5 py-4 text-sm text-red-600">{campaignsError}</p>
            ) : campaignsLoading ? (
              <p className="px-5 py-4 text-sm text-zinc-500">Loading campaigns...</p>
            ) : campaigns.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Campaign</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Created</th>
                      <th className="px-5 py-3 font-medium">Objective</th>
                      <th className="px-5 py-3 font-medium">Campaign ID</th>
                      <th className="px-5 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id}>
                        <td className="px-5 py-3 font-medium text-zinc-900">{campaign.name || "Unnamed campaign"}</td>
                        <td className="px-5 py-3 text-zinc-700">{campaign.effective_status || campaign.status || "Unknown"}</td>
                        <td className="px-5 py-3 text-zinc-700">
                          {campaign.created_time ? new Date(campaign.created_time).toLocaleString() : "Unknown"}
                        </td>
                        <td className="px-5 py-3 text-zinc-700">{campaign.objective || "Unknown"}</td>
                        <td className="px-5 py-3 font-mono text-xs text-zinc-600">{campaign.id}</td>
                        <td className="px-5 py-3">
                          {(campaign.status === "ACTIVE" || campaign.status === "PAUSED") && (
                            <button
                              type="button"
                              onClick={() => updateCampaignStatus(campaign)}
                              disabled={updatingCampaignId !== null}
                              className="font-medium text-blue-700 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {updatingCampaignId === campaign.id
                                ? "Updating..."
                                : campaign.status === "ACTIVE" ? "Pause" : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-4 text-sm text-zinc-500">No campaigns found for this ad account.</p>
            )}
          </section>
        )}

        {accounts.length ? (
          <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
            <form onSubmit={createFullAd} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-800">Ad account</label>
                  <select
                    value={form.adAccountId}
                    onChange={(event) => handleFieldChange("adAccountId", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal"
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name || account.account_id || account.id}
                        {account.currency ? ` (${account.currency})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-800">Campaign name</label>
                  <input
                    required
                    value={form.campaignName}
                    onChange={(event) => handleFieldChange("campaignName", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-800">Objective</label>
                  <select
                    value={form.objective}
                    onChange={(event) => handleFieldChange("objective", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5"
                  >
                    <option value="OUTCOME_TRAFFIC">Traffic</option>
                    <option value="OUTCOME_SALES">Sales</option>
                    <option value="OUTCOME_LEADS">Leads</option>
                    <option value="OUTCOME_ENGAGEMENT">Engagement</option>
                    <option value="OUTCOME_AWARENESS">Awareness</option>
                    <option value="OUTCOME_APP_PROMOTION">App promotion</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-800">Ad set name</label>
                  <input
                    required
                    value={form.adSetName}
                    onChange={(event) => handleFieldChange("adSetName", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-800">Daily budget (USD)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.dailyBudget}
                    onChange={(event) => handleFieldChange("dailyBudget", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-800">Country</label>
                  <input
                    value={form.country}
                    onChange={(event) => handleFieldChange("country", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
                    placeholder="US"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-800">Min age</label>
                  <input
                    type="number"
                    min="18"
                    value={form.ageMin}
                    onChange={(event) => handleFieldChange("ageMin", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-800">Max age</label>
                  <input
                    type="number"
                    min="18"
                    value={form.ageMax}
                    onChange={(event) => handleFieldChange("ageMax", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-800">Meta Page ID</label>
                  <input
                    required
                    value={form.pageId}
                    onChange={(event) => handleFieldChange("pageId", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
                    placeholder="Enter your Facebook Page ID"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-800">Creative type</label>
                  <select
                    value={form.creativeType}
                    onChange={(event) => handleFieldChange("creativeType", event.target.value as FullAdForm["creativeType"])}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5"
                  >
                    <option value="image">Image ad</option>
                    <option value="video">Video ad</option>
                    <option value="carousel">Carousel ad</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-800">Primary text</label>
                  <textarea
                    required
                    rows={3}
                    value={form.primaryText}
                    onChange={(event) => handleFieldChange("primaryText", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-800">Headline</label>
                  <input
                    required
                    value={form.headline}
                    onChange={(event) => handleFieldChange("headline", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-800">Description</label>
                  <input
                    value={form.description}
                    onChange={(event) => handleFieldChange("description", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-800">Destination URL</label>
                  <input
                    required
                    value={form.destinationUrl}
                    onChange={(event) => handleFieldChange("destinationUrl", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-800">CTA</label>
                  <select
                    value={form.callToAction}
                    onChange={(event) => handleFieldChange("callToAction", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5"
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
                    <label className="block text-sm font-medium text-zinc-800">Image URL</label>
                    <input
                      value={form.imageUrl}
                      onChange={(event) => handleFieldChange("imageUrl", event.target.value)}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                )}

                {form.creativeType === "video" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-800">Video ID</label>
                    <input
                      value={form.videoId}
                      onChange={(event) => handleFieldChange("videoId", event.target.value)}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
                      placeholder="Meta video ID from your Media Library"
                    />
                  </div>
                )}

                {form.creativeType === "carousel" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-800">Carousel items JSON</label>
                    <textarea
                      rows={8}
                      value={form.carouselItems}
                      onChange={(event) => handleFieldChange("carouselItems", event.target.value)}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 font-mono text-sm"
                      placeholder='[{"title":"Slide 1","description":"...","link":"https://example.com","image_url":"https://..."}]'
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-6">
                <p className="text-xs text-zinc-500">The ad is created in a paused state by default.</p>
                <button
                  type="submit"
                  disabled={creating || !form.adAccountId}
                  className="rounded-xl bg-[#0866FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0757d6] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? "Creating full ad..." : "Create full Meta ad"}
                </button>
              </div>
            </form>

            <aside className="rounded-[28px] border border-zinc-200 bg-[#f1f3f5] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900">Preview</h2>
                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                  {form.creativeType}
                </span>
              </div>

              <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[22px] border border-zinc-200 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-[#f9fafb] px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      f
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-zinc-900">Facebook</p>
                      <p className="text-[10px] text-zinc-500">Sponsored</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  </div>
                </div>

                {form.creativeType === "carousel" ? (
                  <div className="bg-white">
                    <div className="border-b border-zinc-200 p-3">
                      <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
                        <span>Carousel</span>
                        <span>{previewSlides.length || 1} slides</span>
                      </div>
                    </div>

                    <div className="space-y-3 p-3">
                      {(previewSlides.length ? previewSlides : [{ title: previewHeadline, description: previewDescription, link: form.destinationUrl, image_url: previewImage }]).map((slide, index) => (
                        <div key={`${slide.title}-${index}`} className="overflow-hidden rounded-[16px] border border-zinc-200 bg-zinc-50">
                          <img
                            src={slide.image_url || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80"}
                            alt={slide.title}
                            className="h-32 w-full object-cover"
                          />
                          <div className="space-y-1 border-t border-zinc-200 p-3">
                            <h3 className="text-[13px] font-semibold text-zinc-900">{slide.title || previewHeadline}</h3>
                            <p className="text-[11px] leading-4 text-zinc-600">{slide.description || previewDescription}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-center gap-2 border-t border-zinc-200 bg-zinc-50 px-3 py-2">
                      {Array.from({ length: Math.max(1, previewSlides.length || 1) }).map((_, index) => (
                        <span
                          key={index}
                          className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-blue-600" : "bg-zinc-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {(form.creativeType === "image" || form.creativeType === "video") && (
                      <div className="relative">
                        <img
                          src={form.creativeType === "video" ? "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80" : previewImage || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80"}
                          alt={previewHeadline}
                          className="h-[210px] w-full object-cover"
                        />
                        {form.creativeType === "video" && (
                          <div className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white">
                            ▶
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-3 px-4 py-3.5">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        {form.pageId ? `Page ${form.pageId}` : "Page preview"}
                      </div>

                      <h3 className="text-[17px] font-semibold leading-5 text-zinc-900">{previewHeadline}</h3>
                      <p className="text-[13px] leading-5 text-zinc-700">{previewText}</p>
                      {previewDescription && (
                        <p className="text-[11px] leading-4 text-zinc-500">{previewDescription}</p>
                      )}

                      <div className="flex items-center justify-between border-t border-zinc-200 pt-2 text-[11px] text-zinc-600">
                        <span className="font-medium text-zinc-800">{form.callToAction}</span>
                        <span className="truncate max-w-[150px] text-right">{form.destinationUrl}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>
        ) : null}

        {error && <p role="alert" className="mt-6 text-sm text-red-600">{error}</p>}
        {message && <p role="status" className="mt-6 text-sm text-emerald-700">{message}</p>}
      </div>
    </main>
  );
}