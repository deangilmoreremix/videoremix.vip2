// src/pages/agentos/DashboardAppPage.tsx
//
// Route: /dashboard/apps/:slug — one app, inside the dashboard.
//
// An app opens its converted React page when that page matches upstream, and
// otherwise UpstreamAppPage, which draws upstream's own screen
// (src/config/appScreens.ts). A slug that is not an Awesome LLM app keeps the
// AI app runner. The conversions were written as full pages, so they are
// framed here to sit in the dashboard column.

import { lazy, Suspense, useMemo } from "react";
import { useParams } from "react-router-dom";
import { AppTopBar } from "../../components/agentos/apps/HireAgentButton";
import { CONVERTED_APP_PAGES, CONVERTED_PAGES_WITHOUT_KEY_FIELD } from "../../config/convertedAppPages";
import { appScreen } from "../../config/appScreens";
import { YourApiKeyField } from "../../components/ai/YourApiKeyField";
import { Spinner } from "../../components/agentos/ui";

const AIAppRunnerPage = lazy(() => import("../AIAppRunnerPage"));
const UpstreamApp = lazy(() => import("../../components/apps/UpstreamAppRoute"));

const DashboardAppPage: React.FC = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const screen = appScreen(slug);
  const loader = screen === "converted" ? CONVERTED_APP_PAGES[slug] : undefined;
  // One lazy component per app, so a re-render never remounts the page.
  const ConvertedPage = useMemo(() => (loader ? lazy(loader) : null), [loader]);

  if (ConvertedPage) {
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
  }

  return (
    <>
      <AppTopBar slug={slug} />
      <Suspense fallback={<Spinner label="Loading app…" />}>
        <UpstreamApp slug={slug} fallback={<AIAppRunnerPage />} />
      </Suspense>
    </>
  );
};

export default DashboardAppPage;
