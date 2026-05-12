import React, { lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import SpecialHero from "../components/SpecialHero";
import ProblemSection from "../components/ProblemSection";
import SolutionSection from "../components/SolutionSection";
import FeatureMap from "../components/FeatureMap";
import SEO from "../components/SEO";

// Lazy loaded components for better performance
const BenefitsSection = lazy(() => import("../components/BenefitsSection"));
const ToolsCarouselSection = lazy(
  () => import("../components/ToolsCarouselSection"),
);
const PersonalizationWorkflowSection = lazy(
  () => import("../components/PersonalizationWorkflowSection"),
);
const AppGallerySection = lazy(() => import("../components/AppGallerySection"));
const DemoSection = lazy(() => import("../components/DemoSection"));
const CaseStudiesSection = lazy(
  () => import("../components/CaseStudiesSection"),
);
const TestimonialsSection = lazy(
  () => import("../components/TestimonialsSection"),
);
const PricingSection = lazy(() => import("../components/PricingSection"));
const GuaranteeSection = lazy(() => import("../components/GuaranteeSection"));
const FAQSection = lazy(() => import("../components/FAQSection"));
const FinalCTA = lazy(() => import("../components/FinalCTA"));
import ROICalculator from "../components/premium/ROICalculator";
import PersonalizationSimulator from "../components/premium/PersonalizationSimulator";
import InteractiveComparisonTable from "../components/premium/InteractiveComparisonTable";
import AnimatedTestimonialCard from "../components/premium/AnimatedTestimonialCard";
import LiveActivityFeed from "../components/premium/LiveActivityFeed";
import LogoWall from "../components/premium/LogoWall";
import ParticleBackground from "../components/premium/ParticleBackground";
import ParallaxSection from "../components/premium/ParallaxSection";
import ProgressIndicator from "../components/premium/ProgressIndicator";
import StickyWidget from "../components/premium/StickyWidget";
import BackToTop from "../components/premium/BackToTop";
import ExitIntentPopup from "../components/premium/ExitIntentPopup";
import GradientOrb from "../components/premium/GradientOrb";
import AnimatedBorderGradient from "../components/premium/AnimatedBorderGradient";


// Loading fallback component
const SectionLoader = () => (
  <div className="flex justify-center items-center py-20 text-white">
    <div className="relative">
      <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs text-primary-500 font-medium">Loading</span>
      </div>
    </div>
  </div>
);

interface LandingPageProps {
  isMobile: boolean;
  isTablet: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ isMobile, isTablet }) => {
  return (
    <main className="bg-[#050505]">
      <SEO 
        title="VideoRemix.vip - AI-Powered Video Personalization Platform"
        description="Transform your video marketing with AI-powered personalization. Create engaging, personalized videos at scale with our comprehensive AI agent ecosystem."
        keywords={["AI video", "video personalization", "marketing automation", "AI agents", "video creation"]}
        image="https://videoremix.vip/og-image.jpg"
        url="https://videoremix.vip"
      />
      <SpecialHero />
      <ProblemSection />
      <SolutionSection />

      <FeatureMap
        title="Comprehensive Marketing Personalization Features"
        subtitle="Explore the powerful personalization capabilities of VideoRemix.vip's marketing platform"
      />

      {/* New Personalization Workflow Section - showing how simple it is */}
      <Suspense fallback={<SectionLoader />}>
        <PersonalizationWorkflowSection />
      </Suspense>

      {/* Tools Carousel Section - showcasing personalization tools */}
      <Suspense fallback={<SectionLoader />}>
        <ToolsCarouselSection />
      </Suspense>

      {/* Benefits Section */}
      <Suspense fallback={<SectionLoader />}>
        <BenefitsSection />
      </Suspense>

      {/* App Gallery Section */}
      <Suspense fallback={<SectionLoader />}>
        <AppGallerySection />
      </Suspense>

      {/* Demo Section */}
      <Suspense fallback={<SectionLoader />}>
        <DemoSection />
      </Suspense>

      {/* Case Studies Section */}
      <Suspense fallback={<SectionLoader />}>
        <CaseStudiesSection />
      </Suspense>

      {/* Testimonials Section */}
      <Suspense fallback={<SectionLoader />}>
        <TestimonialsSection />
      </Suspense>

      {/* Pricing Section */}
      <Suspense fallback={<SectionLoader />}>
        <PricingSection />
      </Suspense>

      {/* Guarantee Section */}
      <Suspense fallback={<SectionLoader />}>
        <GuaranteeSection />
      </Suspense>

      {/* FAQ Section */}
      <Suspense fallback={<SectionLoader />}>
        <FAQSection />
      </Suspense>

      {/* Final CTA */}
      <Suspense fallback={<SectionLoader />}>
        <FinalCTA />
      </Suspense>

        {/* ROI Calculator Section */}
        <section className="py-20 bg-[#050505] relative">
          <ParticleBackground particleCount={30} className="opacity-30" />
          <div className="container mx-auto px-4 relative z-10">
            <ROICalculator />
          </div>
        </section>

        {/* Personalization Simulator Section */}
        <ParallaxSection speed={0.3}>
          <section className="py-20 bg-black relative">
            <div className="container mx-auto px-4">
              <PersonalizationSimulator />
            </div>
          </section>
        </ParallaxSection>

        {/* Interactive Comparison Table */}
        <section className="py-20 bg-[#050505]">
          <div className="container mx-auto px-4">
            <InteractiveComparisonTable
              title="Generic vs. Personalized Marketing"
              rows={[
                { feature: "Engagement Rate", generic: "2.3%", personalized: "5.3%", lift: "2.3x" },
                { feature: "Conversion Rate", generic: "2.23%", personalized: "6-8%", lift: "80%" },
                { feature: "ROI", generic: "Standard", personalized: true, lift: "5-8x" },
                { feature: "Customer Retention", generic: "38%", personalized: "64%", lift: "68%" },
                { feature: "Time to Convert", generic: "14 days", personalized: "5 days", lift: "64%" },
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
                { name: "Airbnb", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Airbnb_Logo_B%C3%A9lo.svg/512px-Airbnb_Logo_B%C3%A9lo.svg.png" },
                { name: "Meta", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platform_logo.svg/512px-Meta_Platform_logo.svg.png" },
                { name: "Stripe", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/512px-Stripe_Logo%2C_revised_2016.svg.png" },
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
