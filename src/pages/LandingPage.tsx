import React, { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
import SpecialHero from "../components/SpecialHero";
import ProblemSection from "../components/ProblemSection";
import SolutionSection from "../components/SolutionSection";
import FeatureMap from "../components/FeatureMap";

// Direct imports for critical sections to avoid lazy loading issues
import PersonalizationWorkflowSection from "../components/PersonalizationWorkflowSection";
import ToolsCarouselSection from "../components/ToolsCarouselSection";

// Lazy loaded components for better performance
const BenefitsSection = lazy(() => import("../components/BenefitsSection"));
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

// Error boundary for lazy sections
class LazySectionErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; componentName?: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode; componentName?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.warn(`LazySection error caught in ${this.props.componentName || 'unknown component'}:`, error.message);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn(`LazySection error details for ${this.props.componentName || 'unknown component'}:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <SectionLoader height="400px" />;
    }

    return this.props.children;
  }
}

// Progressive loading component with error boundary
const LazySection: React.FC<{
  children: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  preloadDistance?: number;
  skeletonHeight?: string;
  componentName?: string;
}> = ({ children, priority = 'medium', preloadDistance = 200, skeletonHeight = "400px", componentName }) => {
  const [ref, hasIntersected] = useIntersectionObserver({
    rootMargin: `${preloadDistance}px`
  });

  // Load high priority sections immediately, others on intersection
  const shouldLoad = priority === 'high' || hasIntersected;

  return (
    <div ref={ref}>
      <LazySectionErrorBoundary componentName={componentName}>
        <Suspense fallback={<SectionLoader height={skeletonHeight} />}>
          {shouldLoad ? children : null}
        </Suspense>
      </LazySectionErrorBoundary>
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

      {/* Critical sections - load immediately */}
      <PersonalizationWorkflowSection />

      <ToolsCarouselSection />

      <FeatureMap
        title="Comprehensive Marketing Personalization Features"
        subtitle="Explore the powerful personalization capabilities of VideoRemix.vip's marketing platform"
      />

      {/* Medium priority sections - load when near viewport */}
      <LazySection priority="medium" skeletonHeight="500px" componentName="BenefitsSection">
        <BenefitsSection />
      </LazySection>

      <LazySection priority="medium" skeletonHeight="600px" componentName="CaseStudiesSection">
        <CaseStudiesSection />
      </LazySection>

      <LazySection priority="medium" skeletonHeight="800px" componentName="AppGallerySection">
        <AppGallerySection />
      </LazySection>

      <LazySection priority="medium" skeletonHeight="400px" componentName="DemoSection">
        <DemoSection />
      </LazySection>

      <LazySection priority="medium" skeletonHeight="500px" componentName="TestimonialsSection">
        <TestimonialsSection />
      </LazySection>

      {/* Low priority sections - load when closer to viewport */}
      <LazySection priority="low" skeletonHeight="400px" preloadDistance={300} componentName="PricingSection">
        <PricingSection />
      </LazySection>

      <LazySection priority="low" skeletonHeight="300px" preloadDistance={300} componentName="GuaranteeSection">
        <GuaranteeSection />
      </LazySection>

      <LazySection priority="low" skeletonHeight="600px" preloadDistance={300} componentName="FAQSection">
        <FAQSection />
      </LazySection>

      <LazySection priority="low" skeletonHeight="400px" preloadDistance={300} componentName="FinalCTA">
        <FinalCTA />
      </LazySection>
    </main>
  );
};

export default LandingPage;