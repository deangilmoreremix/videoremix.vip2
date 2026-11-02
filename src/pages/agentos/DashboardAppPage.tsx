// src/pages/agentos/DashboardAppPage.tsx
//
// Route: /dashboard/apps/:slug — one app, inside the dashboard.
//
// An app with a React conversion (src/config/convertedAppPages.ts) opens that
// page; any other app opens the AI app runner. The conversions were written
// as full pages, so they are framed here to sit in the dashboard column.

import { lazy, Suspense, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CONVERTED_APP_PAGES, CONVERTED_PAGES_WITHOUT_KEY_FIELD } from "../../config/convertedAppPages";
import { YourApiKeyField } from "../../components/ai/YourApiKeyField";
import { Spinner } from "../../components/agentos/ui";

const AIAppRunnerPage = lazy(() => import("../AIAppRunnerPage"));

const DashboardAppPage: React.FC = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const loader = CONVERTED_APP_PAGES[slug];
  // One lazy component per app, so a re-render never remounts the page.
  const ConvertedPage = useMemo(() => (loader ? lazy(loader) : null), [loader]);

  if (!ConvertedPage) {
    return (
      <Suspense fallback={<Spinner label="Loading app…" />}>
        <AIAppRunnerPage />
      </Suspense>
    );
  }

  return (
    <div className="converted-app">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pt-4 sm:px-6">
        <Link
          to="/dashboard/apps"
          className="inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> App Library
        </Link>
      </div>
      {CONVERTED_PAGES_WITHOUT_KEY_FIELD.has(slug) ? (
        <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
          <YourApiKeyField />
        </div>
      ) : null}
      <Suspense fallback={<Spinner label="Loading app…" />}>
        <ConvertedPage />
      </Suspense>
    </div>
  );
};

export default DashboardAppPage;
