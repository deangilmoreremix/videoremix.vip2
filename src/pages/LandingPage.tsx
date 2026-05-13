import React, { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import SpecialHero from "../components/SpecialHero";
import ProblemSection from "../components/ProblemSection";
import SolutionSection from "../components/SolutionSection";
import FeatureMap from "../components/FeatureMap";
import SEO from "../components/SEO";

const BenefitsSection = lazy(() => import("../components/BenefitsSection"));
const ToolsCarouselSection = lazy(
  () => import("../components/ToolsCarouselSection"),
);
const PersonalizationWorkflowSection = lazy(
  () => import("../components/PersonalizationWorkflowSection"),
);
const AppGallerySection = lazy(() => import("../components/AppGallerySection"));
const DemoSection = lazy(() => import("../components/DemoSection"));
const CaseStudiesSection = lazy(() => import("../components/CaseStudiesSection"));
const TestimonialsSection = lazy(
  () => import("../components/TestimonialsSection"),
);
const PricingSection = lazy(() => import("../components/PricingSection"));
const GuaranteeSection = lazy(() => import("../components/GuaranteeSection"));
const FAQSection = lazy(() => import("../components/FAQSection"));
const FinalCTA = lazy(() => import("../components/FinalCTA"));
import ROICalculator from "../components/premium/ROICalculator";
import InteractiveComparisonTable from "../components/premium/InteractiveComparisonTable";
import LogoWall from "../components/premium/LogoWall";
import ParticleBackground from "../components/premium/ParticleBackground";
import ProgressIndicator from "../components/premium/ProgressIndicator";
import StickyWidget from "../components/premium/StickyWidget";
import BackToTop from "../components/premium/BackToTop";
import ExitIntentPopup from "../components/premium/ExitIntentPopup";
import AnimatedStatsCounter from "../components/premium/AnimatedStatsCounter";
import InteractiveCard from "../components/premium/InteractiveCard";
import FloatingIcon from "../components/premium/FloatingIcon";
import GradientOrb from "../components/premium/GradientOrb";
import TextReveal from "../components/premium/TextReveal";
import TypedText from "../components/premium/TypedText";
import PersonalizationSimulator from "../components/premium/PersonalizationSimulator";
import AnimatedBorderGradient from "../components/premium/AnimatedBorderGradient";
import AnimatedTestimonialCard from "../components/premium/AnimatedTestimonialCard";
import LiveActivityFeed from "../components/premium/LiveActivityFeed";
import { BarChart3, Users, DollarSign, TrendingUp } from "lucide-react";


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
    <main className="bg-[#050510]">
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
      <section className="py-20 bg-[#0f0d2b] relative overflow-hidden">
        <GradientOrb className="absolute top-20 right-20 w-64 h-64 opacity-20" />
        <ParticleBackground particleCount={30} className="opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <TextReveal
            text="ROI Calculator"
            className="text-2xl font-bold text-white mb-2"
          />
          <p className="text-gray-400 mb-6">Calculate your personalization ROI</p>
          <ROICalculator />
        </div>
      </section>

      {/* Hero Stats Section */}
      <section className="py-16 bg-gradient-to-b from-[#0f0d2b] to-[#1e1b4a]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Trusted by Marketing Teams Worldwide
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-600 to-violet-500 mx-auto rounded-full"></div>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <InteractiveCard>
              <AnimatedStatsCounter
                from={0}
                to={12467}
                suffix="+"
                label="Marketing Professionals"
                icon={<Users className="h-8 w-8 text-primary-400" />}
                className="bg-[#1e1b4a] p-6 rounded-xl border border-gray-700"
              />
            </InteractiveCard>
            <InteractiveCard>
              <AnimatedStatsCounter
                from={0}
                to={490}
                suffix="%"
                label="Average ROI Increase"
                icon={<DollarSign className="h-8 w-8 text-green-400" />}
                className="bg-[#1e1b4a] p-6 rounded-xl border border-gray-700"
              />
            </InteractiveCard>
            <InteractiveCard>
              <AnimatedStatsCounter
                from={0}
                to={215}
                suffix="%"
                label="Engagement Improvement"
                icon={<TrendingUp className="h-8 w-8 text-yellow-400" />}
                className="bg-[#1e1b4a] p-6 rounded-xl border border-gray-700"
              />
            </InteractiveCard>
          </div>
        </div>
      </section>

      {/* Marketing Impact Statistics */}
      <section className="py-20 bg-[#0f0d2b]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center mb-16"
          >
            <TextReveal
              text="Marketing Impact By The Numbers"
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
            />
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Personalized marketing delivers measurable results across all key metrics
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <InteractiveCard>
              <AnimatedStatsCounter
                from={0}
                to={215}
                suffix="%"
                label="Higher Engagement Rate"
                icon={<BarChart3 className="h-8 w-8 text-primary-400" />}
                className="bg-[#1e1b4a] p-6 rounded-xl border border-gray-700"
              />
            </InteractiveCard>
            <InteractiveCard>
              <AnimatedStatsCounter
                from={0}
                to={183}
                suffix="%"
                label="Better Conversion Rate"
                icon={<TrendingUp className="h-8 w-8 text-green-400" />}
                className="bg-[#1e1b4a] p-6 rounded-xl border border-gray-700"
              />
            </InteractiveCard>
            <InteractiveCard>
              <AnimatedStatsCounter
                from={0}
                to={300}
                suffix="%"
                label="ROI Improvement"
                icon={<DollarSign className="h-8 w-8 text-yellow-400" />}
                className="bg-[#1e1b4a] p-6 rounded-xl border border-gray-700"
              />
            </InteractiveCard>
            <InteractiveCard>
              <AnimatedStatsCounter
                from={0}
                to={500}
                suffix="%"
                label="More Time Watching Videos"
                icon={<Users className="h-8 w-8 text-purple-400" />}
                className="bg-[#1e1b4a] p-6 rounded-xl border border-gray-700"
              />
            </InteractiveCard>
          </div>
        </div>
      </section>

      {/* Interactive Comparison Table */}
      <section className="py-20 bg-[#0f0d2b]">
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

      {/* Logo Wall */}
      <section className="py-20 bg-[#1e1b4a]">
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

      {/* Floating Icons */}
      <FloatingIcon 
        icon={<TrendingUp className="h-6 w-6 text-primary-400" />} 
        delay={0} 
        tooltip="Marketing Growth"
        containerClassName="fixed top-20 left-20 hidden md:block"
      />
      <FloatingIcon 
        icon={<Users className="h-6 w-6 text-violet-400" />} 
        delay={1} 
        tooltip="Audience Engagement"
        containerClassName="fixed bottom-20 right-20 hidden md:block"
      />
      <FloatingIcon 
        icon={<DollarSign className="h-6 w-6 text-green-400" />} 
        delay={2} 
        tooltip="ROI Impact"
        containerClassName="fixed top-20 right-20 hidden md:block"
      />

      {/* Live Activity Feed - Fixed position */}
      <div className="fixed bottom-4 left-4 z-40 w-64 hidden md:block">
        <LiveActivityFeed />
      </div>

      <ProgressIndicator />
      <StickyWidget />
      <BackToTop />
      <ExitIntentPopup />
    </main>
  );
};

export default LandingPage;
