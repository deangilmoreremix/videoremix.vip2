import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPageProvider, useLandingPageContent } from '../context/LandingPageContext';
import SpecialHero from './SpecialHero';

const renderHero = () =>
  render(
    <MemoryRouter>
      <LandingPageProvider>
        <SpecialHero />
      </LandingPageProvider>
    </MemoryRouter>
  );

// Mock the useLandingPageContent hook
vi.mock('../context/LandingPageContext', async () => {
  const actual = await vi.importActual('../context/LandingPageContext');
  return {
    ...actual,
    useLandingPageContent: vi.fn(),
  };
});

// ActiveUsers uses react-use-measure, which requires a constructable
// ResizeObserver; stub the decorative counter (not covered by these tests).
vi.mock('./SpecialHero/ActiveUsers', () => ({
  default: () => null,
}));

// tests/setup.ts mocks IntersectionObserver with an arrow-function vi.fn(),
// which cannot be constructed with `new`. Provide a constructable stand-in
// scoped to this file so TextReveal's observer can attach in jsdom.
class TestIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

beforeAll(() => {
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    TestIntersectionObserver;
});

const mockHeroData = {
  id: 'test-hero-id',
  title: 'Custom Hero Title from CMS',
  subtitle: 'Custom hero subtitle from CMS for testing purposes',
  description: 'Benefit one from CMS\nBenefit two from CMS\nBenefit three from CMS',
  primary_button_text: 'Get Started',
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
    vi.mocked(useLandingPageContent).mockReturnValue({
      hero: mockHeroData,
      benefitsFeatures: [],
      testimonials: [],
      faqs: [],
      pricingPlans: [],
      isLoading: false,
      error: null,
      refetchContent: vi.fn(),
    });

    renderHero();

    // Assert that the provider-supplied copy is displayed
    expect(screen.getByText('Custom Hero Title from CMS')).toBeInTheDocument();
    expect(screen.getByText('Custom hero subtitle from CMS for testing purposes')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();

    // Check that the button links to the correct URL
    const ctaButton = screen.getByRole('link', { name: /Get Started/i });
    expect(ctaButton).toHaveAttribute('href', '/custom-signup');
  });

  it('renders fallback content when hero data is null', () => {
    vi.mocked(useLandingPageContent).mockReturnValue({
      hero: null,
      benefitsFeatures: [],
      testimonials: [],
      faqs: [],
      pricingPlans: [],
      isLoading: false,
      error: null,
      refetchContent: vi.fn(),
    });

    const { container } = renderHero();

    // The default headline is rendered as a character-reveal animation, so match
    // the heading's text content instead of a single text node.
    expect(container.querySelector('h1')?.textContent).toMatch(/Your\s+Entire\s+Business/);

    // Assert that fallback benefit copy is displayed
    expect(
      screen.getByText('113+ AI apps covering marketing, sales, video, hiring, and productivity')
    ).toBeInTheDocument();

    // Assert that the fallback CTA label is displayed
    expect(screen.getByText(/GET STARTED WITH VIDEOREMIX/i)).toBeInTheDocument();
  });

  it('renders benefits from hero description when available', () => {
    vi.mocked(useLandingPageContent).mockReturnValue({
      hero: mockHeroData,
      benefitsFeatures: [],
      testimonials: [],
      faqs: [],
      pricingPlans: [],
      isLoading: false,
      error: null,
      refetchContent: vi.fn(),
    });

    renderHero();

    // Check that benefits from the description are rendered
    expect(screen.getByText('Benefit one from CMS')).toBeInTheDocument();
    expect(screen.getByText('Benefit two from CMS')).toBeInTheDocument();
    expect(screen.getByText('Benefit three from CMS')).toBeInTheDocument();
  });
});
