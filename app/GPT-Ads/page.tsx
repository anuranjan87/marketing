
"use client";

import { useState } from "react";

export default function AdsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function createAd() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        "/api/openai-ads/test",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      // Always show the complete server response
      setResult({
        http_status: response.status,
        http_ok: response.ok,
        ...data,
      });
    } catch (error: any) {
      setResult({
        client_error:
          error?.message ||
          "Could not connect to the API route",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold">
          7Wingz Ads Test
        </h1>

        <p className="mb-8 text-gray-600">
          OpenAI Ads API connection test
        </p>

        <button
          onClick={createAd}
          disabled={loading}
          className="rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Testing..."
            : "Create Test Ad"}
        </button>

        {result && (
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-lg font-semibold">
                API Response
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
              {JSON.stringify(
                result,
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}

