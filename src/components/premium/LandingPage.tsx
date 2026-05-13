import React from 'react';
import { Helmet } from 'react-helmet-async';
import ROICalculator from './ROICalculator';
import PersonalizationSimulator from './PersonalizationSimulator';
import InteractiveComparisonTable from './InteractiveComparisonTable';
import AnimatedTestimonialCard from './AnimatedTestimonialCard';
import LiveActivityFeed from './LiveActivityFeed';
import LogoWall from './LogoWall';
import ParticleBackground from './ParticleBackground';
import ParallaxSection from './ParallaxSection';
import ProgressIndicator from './ProgressIndicator';
import StickyWidget from './StickyWidget';
import BackToTop from './BackToTop';
import ExitIntentPopup from './ExitIntentPopup';
import AnimatedBorderGradient from './AnimatedBorderGradient';
import GradientOrb from './GradientOrb';

const LandingPage: React.FC<{isMobile: boolean; isTablet: boolean}> = ({ isMobile, isTablet }) => {
  return (
    <main className="bg-[#050505]">
      {/* SEO Meta */}
      <Helmet>
        <title>VideoRemix.vip - AI-Powered Video Personalization Platform</title>
        <meta name="description" content="Transform your video marketing with AI-powered personalization. Create engaging, personalized videos at scale." />
      </Helmet>

      {/* Hero Section with Premium Effects */}
      <section className="relative min-h-screen flex items-center justify-center">
        <ParticleBackground particleCount={50} className="absolute inset-0" />
        <GradientOrb className="absolute top-20 left-20" />
        <div className="relative z-10 text-center">
          <AnimatedBorderGradient>
            <h1 className="text-6xl font-bold text-white mb-4">
              Impeccable AI Video Personalization
            </h1>
          </AnimatedBorderGradient>
          <p className="text-xl text-gray-300 mb-8">
            Transform generic videos into personalized experiences at scale
          </p>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-20 bg-[#050505] relative">
        <ParticleBackground particleCount={30} className="opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <ROICalculator />
        </div>
      </section>

      {/* Personalization Simulator */}
      <ParallaxSection speed={0.3}>
        <section className="py-20 bg-black relative">
          <div className="container mx-auto px-4">
            <PersonalizationSimulator />
          </div>
        </section>
      </ParallaxSection>

      {/* Interactive Comparison */}
      <section className="py-20 bg-[#050505]">
        <div className="container mx-auto px-4">
          <InteractiveComparisonTable
            title="Generic vs. Personalized Marketing"
            rows={[
              { feature: "Engagement Rate", generic: "2.3%", personalized: "5.3%", lift: "2.3x" },
              { feature: "Conversion Rate", generic: "2.23%", personalized: "6-8%", lift: "80%" },
              { feature: "ROI", generic: "Standard", personalized: true, lift: "5-8x" },
            ]}
          />
        </div>
      </section>

      {/* Live Activity Feed */}
      <section className="fixed bottom-4 right-4 z-50 w-80 hidden md:block">
        <LiveActivityFeed />
      </section>

      {/* Logo Wall */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <LogoWall
            logos={[
              { name: "Netflix", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/2560px-Netflix_2015_logo.svg.png" },
              { name: "Adobe", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Adobe_Acrobat_DC_logo_2023.svg/512px-Adobe_Acrobat_DC_logo_2023.svg.png" },
              { name: "Spotify", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/512px-Spotify_logo_without_text.svg.png" },
            ]}
          />
        </div>
      </section>

      {/* Progress Indicator */}
      <ProgressIndicator />

      {/* Sticky Widget */}
      <StickyWidget />

      {/* Back to Top */}
      <BackToTop />

      {/* Exit Intent Popup */}
      <ExitIntentPopup />
    </main>
  );
};

export default LandingPage;