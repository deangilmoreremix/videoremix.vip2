import React, { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
import SpecialHero from "../components/SpecialHero";
import ProblemSection from "../components/ProblemSection";
import SolutionSection from "../components/SolutionSection";
import FeatureMap from "../components/FeatureMap";

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

// Optimized loading fallback component with skeleton
const SectionLoader = ({ height = "400px" }: { height?: string }) => (
  <div className="flex justify-center items-center py-20 text-white" style={{ minHeight: height }}>
    <div className="relative">
      <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 border-solid rounded-full animate-spin"></div>
    </div>
  </div>
);

// Intersection Observer Hook for viewport-based loading
const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasIntersected) {
          setIsIntersecting(true);
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px', // Load 100px before entering viewport
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, options]);

  return [ref, hasIntersected] as const;
};

// Progressive loading component with prefetch
const LazySection: React.FC<{
  children: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  preloadDistance?: number;
  skeletonHeight?: string;
}> = ({ children, priority = 'medium', preloadDistance = 200, skeletonHeight = "400px" }) => {
  const [ref, hasIntersected] = useIntersectionObserver({
    rootMargin: `${preloadDistance}px`
  });

  // Load high priority sections immediately, others on intersection
  const shouldLoad = priority === 'high' || hasIntersected;

  return (
    <div ref={ref}>
      <Suspense fallback={<SectionLoader height={skeletonHeight} />}>
        {shouldLoad ? children : null}
      </Suspense>
    </div>
  );
};

// Preload critical sections and prefetch resources
const preloadCriticalResources = () => {
  // Preload high-priority sections immediately
  const criticalPromises = [
    import("../components/PersonalizationWorkflowSection"),
    import("../components/ToolsCarouselSection"),
  ];

  // Preload medium-priority sections after a delay
  setTimeout(() => {
    import("../components/FeatureMap");
    import("../components/BenefitsSection");
  }, 200);

  return criticalPromises;
};

// Resource hints for browser optimization
const useResourceHints = () => {
  useEffect(() => {
    // Prefetch critical components
    const prefetchLinks = [
      '/src/components/PersonalizationWorkflowSection.tsx',
      '/src/components/ToolsCarouselSection.tsx',
      '/src/components/FeatureMap.tsx',
    ];

    prefetchLinks.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    });

    return () => {
      // Cleanup prefetch links on unmount
      prefetchLinks.forEach(href => {
        const link = document.querySelector(`link[href="${href}"]`);
        if (link) link.remove();
      });
    };
  }, []);
};

interface LandingPageProps {
  isMobile: boolean;
  isTablet: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ isMobile, isTablet }) => {
  // Enable resource hints for better loading
  useResourceHints();

  // Preload critical resources on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      preloadCriticalResources();
    }, 50); // Small delay to allow initial render

    return () => clearTimeout(timer);
  }, []);

  return (
    <main>
      {/* Critical sections - load immediately (no lazy loading) */}
      <SpecialHero />
      <ProblemSection />
      <SolutionSection />

      {/* High priority sections - load soon with intersection observer */}
      <LazySection priority="high" skeletonHeight="600px">
        <PersonalizationWorkflowSection />
      </LazySection>

      <LazySection priority="high" skeletonHeight="500px">
        <ToolsCarouselSection />
      </LazySection>

      <LazySection priority="high" skeletonHeight="400px">
        <FeatureMap
          title="Comprehensive Marketing Personalization Features"
          subtitle="Explore the powerful personalization capabilities of VideoRemix.vip's marketing platform"
        />
      </LazySection>

      {/* Medium priority sections - load when near viewport */}
      <LazySection priority="medium" skeletonHeight="500px">
        <BenefitsSection />
      </LazySection>

      <LazySection priority="medium" skeletonHeight="600px">
        <CaseStudiesSection />
      </LazySection>

      <LazySection priority="medium" skeletonHeight="800px">
        <AppGallerySection />
      </LazySection>

      <LazySection priority="medium" skeletonHeight="400px">
        <DemoSection />
      </LazySection>

      <LazySection priority="medium" skeletonHeight="500px">
        <TestimonialsSection />
      </LazySection>

      {/* Low priority sections - load when closer to viewport */}
      <LazySection priority="low" skeletonHeight="400px" preloadDistance={300}>
        <PricingSection />
      </LazySection>

      <LazySection priority="low" skeletonHeight="300px" preloadDistance={300}>
        <GuaranteeSection />
      </LazySection>

      <LazySection priority="low" skeletonHeight="600px" preloadDistance={300}>
        <FAQSection />
      </LazySection>

      <LazySection priority="low" skeletonHeight="400px" preloadDistance={300}>
        <FinalCTA />
      </LazySection>
    </main>
  );
};

export default LandingPage;