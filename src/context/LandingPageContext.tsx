import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getAllLandingPageContent, 
  HeroContent, 
  BenefitFeature, 
  Testimonial, 
  FAQ, 
  PricingPlan 
} from '../utils/supabaseClient';

interface LandingPageContextType {
  hero: HeroContent | null;
  benefitsFeatures: BenefitFeature[];
  testimonials: Testimonial[];
  faqs: FAQ[];
  pricingPlans: PricingPlan[];
  isLoading: boolean;
  error: string | null;
  refetchContent: () => Promise<void>;
}

const defaultContext: LandingPageContextType = {
  hero: null,
  benefitsFeatures: [],
  testimonials: [],
  faqs: [],
  pricingPlans: [],
  isLoading: true,
  error: null,
  refetchContent: async () => {}
};

const LandingPageContext = createContext<LandingPageContextType>(defaultContext);

export const useLandingPageContent = () => useContext(LandingPageContext);

interface LandingPageProviderProps {
  children: ReactNode;
}

const LandingPageProvider: React.FC<LandingPageProviderProps> = ({ children }) => {
  const [content, setContent] = useState<Omit<LandingPageContextType, 'isLoading' | 'error' | 'refetchContent'>>({
    hero: null,
    benefitsFeatures: [],
    testimonials: [],
    faqs: [],
    pricingPlans: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await getAllLandingPageContent();
      
      setContent({
        hero: data.hero,
        benefitsFeatures: data.benefits || [],
        testimonials: data.testimonials || [],
        faqs: data.faqs || [],
        pricingPlans: data.pricing || []
      });
    } catch (err) {
      console.error('Error fetching landing page content:', err);
      setError('Failed to load content. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const value = {
    ...content,
    isLoading,
    error,
    refetchContent: fetchContent
  };

  return (
    <LandingPageContext.Provider value={value}>
      {children}
    </LandingPageContext.Provider>
  );
};