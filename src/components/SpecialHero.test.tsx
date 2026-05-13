import React from 'react';
import { render, screen } from '@testing-library/react';
import { LandingPageProvider } from '../context/LandingPageContext';
import SpecialHero from './SpecialHero';

// Mock the useLandingPageContent hook
vi.mock('../context/LandingPageContext', async () => {
  const actual = await vi.importActual('../context/LandingPageContext');
  return {
    ...actual,
    useLandingPageContent: vi.fn(),
  };
});

const mockHeroData = {
  id: 'test-hero-id',
  title: 'Custom Hero Title from CMS',
  subtitle: 'Custom hero subtitle from CMS for testing purposes',
  description: 'Benefit one from CMS\nBenefit two from CMS\nBenefit three from CMS',
  primary_button_text: 'Start Free Trial',
  primary_button_url: '/custom-signup',
  secondary_button_text: 'Learn More',
  secondary_button_url: '/about',
  background_image_url: 'https://example.com/custom-bg.jpg',
  enabled: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

describe('SpecialHero', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  it('renders provider-supplied hero copy when data is available', () => {
    // Mock the context to return our test hero data
    const { useLandingPageContent } = require('../context/LandingPageContext');
    useLandingPageContent.mockReturnValue({
      hero: mockHeroData,
      benefitsFeatures: [],
      testimonials: [],
      faqs: [],
      pricingPlans: [],
      isLoading: false,
      error: null,
      refetchContent: vi.fn(),
    });

    render(
      <LandingPageProvider>
        <SpecialHero />
      </LandingPageProvider>
    );

    // Assert that the provider-supplied copy is displayed
    expect(screen.getByText('Custom Hero Title from CMS')).toBeInTheDocument();
    expect(screen.getByText('Custom hero subtitle from CMS for testing purposes')).toBeInTheDocument();
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
    
    // Check that the button links to the correct URL
    const ctaButton = screen.getByRole('link', { name: /Start Free Trial/i });
    expect(ctaButton).toHaveAttribute('href', '/custom-signup');
  });

  it('renders fallback content when hero data is null', () => {
    const { useLandingPageContent } = require('../context/LandingPageContext');
    useLandingPageContent.mockReturnValue({
      hero: null,
      benefitsFeatures: [],
      testimonials: [],
      faqs: [],
      pricingPlans: [],
      isLoading: false,
      error: null,
      refetchContent: vi.fn(),
    });

    render(
      <LandingPageProvider>
        <SpecialHero />
      </LandingPageProvider>
    );

    // Assert that fallback content is displayed
    expect(screen.getByText(/Welcome to.*VideoRemix/i)).toBeInTheDocument();
    expect(screen.getByText(/GET STARTED WITH VIDEOREMIX/i)).toBeInTheDocument();
  });

  it('renders benefits from hero description when available', () => {
    const { useLandingPageContent } = require('../context/LandingPageContext');
    useLandingPageContent.mockReturnValue({
      hero: mockHeroData,
      benefitsFeatures: [],
      testimonials: [],
      faqs: [],
      pricingPlans: [],
      isLoading: false,
      error: null,
      refetchContent: vi.fn(),
    });

    render(
      <LandingPageProvider>
        <SpecialHero />
      </LandingPageProvider>
    );

    // Check that benefits from the description are rendered
    expect(screen.getByText('Benefit one from CMS')).toBeInTheDocument();
    expect(screen.getByText('Benefit two from CMS')).toBeInTheDocument();
    expect(screen.getByText('Benefit three from CMS')).toBeInTheDocument();
  });
});
