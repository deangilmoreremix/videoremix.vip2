import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import AppDetailPage from '../components/AppDetailPage';
import { appsData } from '../data/appsData';

const AppPage: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const app = appsData.find(app => app.id === appId);
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>{app ? `${app.name} | VideoRemix.vip` : 'App Details | VideoRemix.vip'}</title>
        <meta 
          name="description" 
          content={app ? app.description : 'Explore our powerful video creation applications.'} 
        />
        {app && (
          <>
            <meta property="og:title" content={`${app.name} | VideoRemix.vip`} />
            <meta property="og:description" content={app.description} />
            <meta property="og:image" content={app.image} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={`${app.name} | VideoRemix.vip`} />
            <meta name="twitter:description" content={app.description} />
            <meta name="twitter:image" content={app.image} />
          </>
        )}
      </Helmet>
      
      <AppDetailPage />
    </>
  );
};

export default AppPage;