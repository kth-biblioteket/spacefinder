import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { normalizeCountryCode } from "@/lib/visitorAnalytics";

export const Route = createFileRoute("/api/public/visitor-country")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const country = normalizeCountryCode(
          request.headers.get("cf-ipcountry") ??
            request.headers.get("x-vercel-ip-country") ??
            request.headers.get("x-country-code"),
        );
        return Response.json(
          { country },
          { headers: { "Cache-Control": "private, max-age=3600" } },
        );
      },
    },
  },
});