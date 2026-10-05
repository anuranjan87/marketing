"use client";

import { useState } from "react";

type AdForm = {
  campaignName: string;
  lifetimeBudget: string;
  adSetName: string;
  maxBid: string;
  contextHints: string;
  adName: string;
  title: string;
  body: string;
  targetUrl: string;
  imageUrl: string;
};

const initialForm: AdForm = {
  campaignName: "7Wingz Website Builder Campaign",
  lifetimeBudget: "25",
  adSetName: "AI Website Builder Audience",
  maxBid: "0.06",
  contextHints:
    "website builder, small business website, AI website design",
  adName: "7Wingz AI Builder Chat Card",
  title: "Build your website with AI",
  body: "Launch a beautiful website in minutes.\nNo coding needed.",
  targetUrl: "https://7wingz.com",
  imageUrl:
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85",
};

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100";

export default function AdsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState<AdForm>(initialForm);

  function updateField(field: keyof AdForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function createAd() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/openai-ads/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,

          lifetimeBudget: Number(form.lifetimeBudget),
          adGroupName: form.adSetName,
          maxBid: Number(form.maxBid),

          contextHints: form.contextHints
            .split(",")
            .map((hint) => hint.trim())
            .filter(Boolean),
        }),
      });

      const data = await response.json();

      setResult({
        http_status: response.status,
        http_ok: response.ok,
        ...data,
      });
    } catch (error: any) {
      setResult({
        client_error:
          error?.message || "Could not connect to the API route",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <header className="mb-8 border-b border-gray-200 pb-6">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            7Wingz · Ads
          </p>

          <h1 className="text-3xl font-bold text-gray-950">
            Create an ad
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Campaigns, ad sets, and ads are created paused.
          </p>
        </header>

        <div className="space-y-10">
          {/* Form */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void createAd();
            }}
            className="space-y-8"
          >
            {/* ===================================================== */}
            {/* CAMPAIGN */}
            {/* ===================================================== */}

            <section
              aria-labelledby="campaign-heading"
              className="space-y-4"
            >
              <h2
                id="campaign-heading"
                className="text-lg font-semibold text-gray-900"
              >
                Campaign
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Campaign name */}
                <label className="block text-sm font-medium text-gray-700">
                  Campaign name

                  <input
                    required
                    value={form.campaignName}
                    onChange={(event) =>
                      updateField(
                        "campaignName",
                        event.target.value
                      )
                    }
                    disabled={loading}
                    className={`${inputClass} mt-1.5`}
                  />
                </label>

                {/* Lifetime budget */}
                <label className="block text-sm font-medium text-gray-700">
                  Lifetime budget (account currency)

                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.lifetimeBudget}
                    onChange={(event) =>
                      updateField(
                        "lifetimeBudget",
                        event.target.value
                      )
                    }
                    disabled={loading}
                    className={`${inputClass} mt-1.5`}
                  />
                </label>
              </div>
            </section>

            {/* ===================================================== */}
            {/* AD SET */}
            {/* ===================================================== */}

            <section
              aria-labelledby="ad-set-heading"
              className="space-y-4 border-t border-gray-200 pt-6"
            >
              <h2
                id="ad-set-heading"
                className="text-lg font-semibold text-gray-900"
              >
                Ad set
              </h2>

              <div className="space-y-4">
                {/* Ad set name */}
                <label className="block text-sm font-medium text-gray-700">
                  Ad set name

                  <input
                    required
                    value={form.adSetName}
                    onChange={(event) =>
                      updateField(
                        "adSetName",
                        event.target.value
                      )
                    }
                    disabled={loading}
                    className={`${inputClass} mt-1.5`}
                  />
                </label>

                {/* Context hints */}
                <label className="block text-sm font-medium text-gray-700">
                  Context hints

                  <input
                    required
                    value={form.contextHints}
                    onChange={(event) =>
                      updateField(
                        "contextHints",
                        event.target.value
                      )
                    }
                    placeholder="Example: home renovation, interior design"
                    disabled={loading}
                    className={`${inputClass} mt-1.5`}
                  />

                  <p className="mt-1.5 text-xs text-gray-500">
                    Separate multiple hints with commas.
                  </p>
                </label>

                {/* Maximum bid */}
                <label className="block text-sm font-medium text-gray-700">
                  Maximum bid (account currency)

                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.maxBid}
                    onChange={(event) =>
                      updateField("maxBid", event.target.value)
                    }
                    disabled={loading}
                    className={`${inputClass} mt-1.5`}
                  />

                  <span className="mt-1.5 block text-xs font-normal text-gray-500">
                    Used as the fixed impression bid.
                  </span>
                </label>
              </div>
            </section>

            {/* ===================================================== */}
            {/* CREATIVE */}
            {/* ===================================================== */}

            <section
              aria-labelledby="creative-heading"
              className="space-y-4 border-t border-gray-200 pt-6"
            >
              <h2
                id="creative-heading"
                className="text-lg font-semibold text-gray-900"
              >
                Creative
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Ad name */}
                <label className="block text-sm font-medium text-gray-700">
                  Ad name

                  <input
                    required
                    value={form.adName}
                    onChange={(event) =>
                      updateField(
                        "adName",
                        event.target.value
                      )
                    }
                    disabled={loading}
                    className={`${inputClass} mt-1.5`}
                  />
                </label>

                {/* Headline */}
                <label className="block text-sm font-medium text-gray-700">
                  Headline

                  <input
                    required
                    value={form.title}
                    onChange={(event) =>
                      updateField(
                        "title",
                        event.target.value
                      )
                    }
                    disabled={loading}
                    className={`${inputClass} mt-1.5`}
                  />
                </label>

                {/* Ad text */}
                <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                  Ad text

                  <textarea
                    required
                    rows={4}
                    value={form.body}
                    onChange={(event) =>
                      updateField(
                        "body",
                        event.target.value
                      )
                    }
                    disabled={loading}
                    className={`${inputClass} mt-1.5`}
                  />
                </label>

                {/* Destination URL */}
                <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                  Destination URL

                  <input
                    required
                    type="url"
                    value={form.targetUrl}
                    onChange={(event) =>
                      updateField(
                        "targetUrl",
                        event.target.value
                      )
                    }
                    placeholder="https://example.com"
                    disabled={loading}
                    className={`${inputClass} mt-1.5`}
                  />
                </label>

                {/* Creative image */}
                <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                  Creative image URL

                  <input
                    required
                    type="url"
                    value={form.imageUrl}
                    onChange={(event) =>
                      updateField(
                        "imageUrl",
                        event.target.value
                      )
                    }
                    placeholder="https://example.com/ad-image.jpg"
                    disabled={loading}
                    className={`${inputClass} mt-1.5`}
                  />
                </label>
              </div>
            </section>

            {/* ===================================================== */}
            {/* CREATE BUTTON */}
            {/* ===================================================== */}

            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating ad..."
                  : "Create paused ad"}
              </button>
            </div>
          </form>

          {/* ===================================================== */}
          {/* AD PREVIEW */}
          {/* ===================================================== */}

          <aside
            aria-labelledby="preview-heading"
            className="max-w-4xl border-t border-gray-200 pt-8"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="preview-heading"
                className="text-lg font-semibold text-gray-900"
              >
                Ad preview
              </h2>

              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Chat card
              </span>
            </div>

            <article className="grid min-h-[132px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:grid-cols-[0.95fr_1.05fr]">
              {/* Image */}
              <div className="relative min-h-[150px] bg-[#f1efff] sm:min-h-0">
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt="Ad creative preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center px-5 text-center text-sm text-gray-500">
                    Add an image URL to preview the creative
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex min-w-0 flex-col justify-center gap-2.5 p-4 sm:p-5">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">
                      7W
                    </span>

                    <span className="truncate text-sm font-semibold text-gray-900">
                      7Wingz
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      Ad
                    </span>

                    <span
                      aria-label="More options"
                      className="text-lg leading-none text-gray-500"
                    >
                      ···
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-semibold leading-5 text-gray-950">
                  {form.title || "Your ad headline"}
                </h3>

                <p className="whitespace-pre-line text-sm leading-5 text-gray-600">
                  {form.body || "Your ad text will appear here."}
                </p>
              </div>
            </article>

            <p className="mt-3 break-all text-xs text-gray-500">
              {form.targetUrl || "Destination URL not set"}
            </p>
          </aside>

          {/* ===================================================== */}
          {/* RESULT */}
          {/* ===================================================== */}

          {result && (
            <div className="mt-8">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-lg font-semibold">
                  Creation result
                </h2>

                {result.http_status && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      result.http_ok
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    HTTP {result.http_status}
                  </span>
                )}
              </div>

              <pre className="max-h-[700px] overflow-auto rounded-xl bg-gray-900 p-6 text-sm leading-6 text-white">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}