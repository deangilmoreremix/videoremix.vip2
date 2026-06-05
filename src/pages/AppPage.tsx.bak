import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import AppDetailPage from "../components/AppDetailPage";
import { appsData } from "../data/appsData";

const AppPage: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const ai-design-studio = appsData.find((ai-design-studio) => ai-design-studio.id === appId);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>
          {ai-design-studio
            ? `${ai-design-studio.name} | VideoRemix.vip`
            : "App Details | VideoRemix.vip"}
        </title>
        <meta
          name="description"
          content={
            ai-design-studio
              ? ai-design-studio.description
              : "Explore our powerful video creation applications."
          }
        />
        {ai-design-studio && (
          <>
            <meta
              property="og:title"
              content={`${ai-design-studio.name} | VideoRemix.vip`}
            />
            <meta property="og:description" content={ai-design-studio.description} />
            <meta property="og:image" content={ai-design-studio.image} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta
              name="twitter:title"
              content={`${ai-design-studio.name} | VideoRemix.vip`}
            />
            <meta name="twitter:description" content={ai-design-studio.description} />
            <meta name="twitter:image" content={ai-design-studio.image} />
          </>
        )}
      </Helmet>

      <AppDetailPage />
    </>
  );
};

export default AppPage;
