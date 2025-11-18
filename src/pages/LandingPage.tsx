import React, { lazy, Suspense } from 'react';
import SpecialHero from '../components/SpecialHero';
import ProblemSection from '../components/ProblemSection';
import SolutionSection from '../components/SolutionSection';
import FeatureMap from '../components/FeatureMap';

// Lazy loaded components for better performance
const BenefitsSection = lazy(() => import('../components/BenefitsSection'));
const ToolsCarouselSection = lazy(() => import('../components/ToolsCarouselSection'));
const PersonalizationWorkflowSection = lazy(() => import('../components/PersonalizationWorkflowSection'));
const AppGallerySection = lazy(() => import('../components/AppGallerySection'));
const DemoSection = lazy(() => import('../components/DemoSection'));
const CaseStudiesSection = lazy(() => import('../components/CaseStudiesSection'));
const TestimonialsSection = lazy(() => import('../components/TestimonialsSection'));
const PricingSection = lazy(() => import('../components/PricingSection'));
const GuaranteeSection = lazy(() => import('../components/GuaranteeSection'));
const FAQSection = lazy(() => import('../components/FAQSection'));
const FinalCTA = lazy(() => import('../components/FinalCTA'));

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
    <main>
      <SpecialHero />
      <ProblemSection />
      <SolutionSection />
      
      {/* New Personalization Workflow Section - showing how simple it is */}
      <Suspense fallback={<SectionLoader />}>
        <PersonalizationWorkflowSection />
      </Suspense>
      
      {/* Tools Carousel Section - showcasing personalization tools */}
      <Suspense fallback={<SectionLoader />}>
        <ToolsCarouselSection />
      </Suspense>
      
      {/* Feature Map - comprehensive feature overview */}
      <Suspense fallback={<SectionLoader />}>
        <FeatureMap 
          title="Comprehensive Marketing Personalization Features"
          subtitle="Explore the powerful personalization capabilities of VideoRemix.vip's marketing platform"
        />
      </Suspense>
      
      {/* Lazy loaded sections with suspense fallbacks */}
      <Suspense fallback={<SectionLoader />}>
        <BenefitsSection />
      </Suspense>
      
      {/* New Case Studies Section - showcasing customer success stories */}
      <Suspense fallback={<SectionLoader />}>
        <CaseStudiesSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <AppGallerySection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <DemoSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <TestimonialsSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <PricingSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <GuaranteeSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <FAQSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <FinalCTA />
      </Suspense>
    </main>
  );
};

export default LandingPage;