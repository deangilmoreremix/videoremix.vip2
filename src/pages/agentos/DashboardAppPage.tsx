// src/pages/agentos/DashboardAppPage.tsx
//
// Route: /dashboard/apps/:slug — one app, inside the dashboard.
//
// An app with a React conversion (src/config/convertedAppPages.ts) opens that
// page; any other app opens the AI app runner. The conversions were written
// as full pages, so they are framed here to sit in the dashboard column.

import { lazy, Suspense, useMemo } from "react";
import { useParams } from "react-router-dom";
import { AppTopBar } from "../../components/agentos/apps/HireAgentButton";
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
      <>
        <AppTopBar slug={slug} />
        <Suspense fallback={<Spinner label="Loading app…" />}>
          <AIAppRunnerPage />
        </Suspense>
      </>
    );
  }

  return (
    <div className="converted-app">
      <AppTopBar slug={slug} />
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
