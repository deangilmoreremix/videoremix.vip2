import React from 'react';
import { Helmet } from 'react-helmet-async';
import { featuresData } from '../../data/featuresData';
import FeatureHero from '../../components/FeatureHero';
import FeatureKeyPoints from '../../components/FeatureKeyPoints';
import FeatureUseCases from '../../components/FeatureUseCases';
import FeatureStats from '../../components/FeatureStats';
import FeatureTestimonials from '../../components/FeatureTestimonials';
import FeatureFAQ from '../../components/FeatureFAQ';
import FeatureCTA from '../../components/FeatureCTA';
import { Globe } from 'lucide-react';

const AutoCaptionsPage: React.FC = () => {
  // Find feature data
  const feature = featuresData.find(f => f.id === 'auto-captions');
  
  if (!feature) {
    return <div className="text-center py-32 text-white">Feature data not found</div>;
  }
  
  // Map related features
  const relatedFeatures = feature.relatedFeatures.map(id => {
    const relatedFeature = featuresData.find(f => f.id === id);
    return {
      id,
      title: relatedFeature?.title || id
    };
  });

  return (
    <>
      <Helmet>
        <title>{feature.title} | VideoRemix.vip Features</title>
        <meta name="description" content={feature.description} />
        <meta property="og:title" content={`${feature.title} | VideoRemix.vip Features`} />
        <meta property="og:description" content={feature.description} />
        <meta property="og:image" content={feature.image} />
        <meta name="twitter:title" content={`${feature.title} | VideoRemix.vip Features`} />
        <meta name="twitter:description" content={feature.description} />
        <meta name="twitter:image" content={feature.image} />
        <meta name="keywords" content="automatic captions, video subtitles, multilingual captions, video accessibility, subtitle generator" />
      </Helmet>

      <main>
        {/* Hero Section */}
        <FeatureHero 
          title={feature.title}
          description={feature.description}
          image={feature.image}
          icon={React.createElement(Globe)}
          videoUrl={feature.videoUrl}
        />
        
        {/* Key Points */}
        <FeatureKeyPoints 
          points={feature.keyPoints}
          benefits={feature.benefits}
        />
        
        {/* Use Cases */}
        <FeatureUseCases 
          useCases={feature.useCases}
        />
        
        {/* Statistics */}
        <FeatureStats stats={feature.stats} />
        
        {/* Testimonials */}
        <FeatureTestimonials testimonials={feature.testimonials} />
        
        {/* FAQ */}
        <FeatureFAQ faqs={feature.faq} />
        
        {/* CTA */}
        <FeatureCTA 
          title={`Ready to Try ${feature.title}?`}
          relatedFeatures={relatedFeatures}
        />
      </main>
    </>
  );
};

export default AutoCaptionsPage;