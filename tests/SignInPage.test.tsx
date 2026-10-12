import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import SignInPage from '../src/pages/SignInPage';

// The page now delegates authentication to Clerk's prebuilt <SignIn>
// component (CAPTCHA/bot protection) instead of a custom Supabase form.
// These mocks let us assert that wiring without a live Clerk instance.
const mockClerkSignIn = vi.fn(() => <div data-testid="clerk-sign-in" />);

vi.mock('@clerk/react', () => ({
  SignIn: (props: Record<string, unknown>) => mockClerkSignIn(props),
}));

vi.mock('../src/components/MagicSparkles', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../src/components/SparkleEffect', () => ({
  default: () => <div data-testid="sparkle-effect" />,
}));

vi.mock('../src/components/premium/ParticleBackground', () => ({
  default: () => <div data-testid="particle-background" />,
}));

vi.mock('../src/components/premium/GradientOrb', () => ({
  default: () => <div data-testid="gradient-orb" />,
}));

const renderSignInPage = () => {
  return render(
    <HelmetProvider>
      <BrowserRouter>
        <SignInPage />
      </BrowserRouter>
    </HelmetProvider>,
  );
};

describe('SignInPage (Clerk prebuilt implementation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the Clerk SignIn component with path routing config', () => {
      renderSignInPage();

      expect(screen.getByTestId('clerk-sign-in')).toBeInTheDocument();

      expect(mockClerkSignIn).toHaveBeenCalledWith(
        expect.objectContaining({
          routing: 'path',
          path: '/signin',
          redirectUrl: '/dashboard',
        }),
      );
    });

    it('should display welcome back heading', () => {
      renderSignInPage();

      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      expect(
        screen.getByText(/sign in to continue your personalized marketing journey/i),
      ).toBeInTheDocument();
    });

    it('should display back to home link', () => {
      renderSignInPage();

      const backLink = screen.getByText(/back to home/i);
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('should display benefits section', () => {
      renderSignInPage();

      expect(screen.getByText(/what you'll get with videoremix.vip/i)).toBeInTheDocument();
      expect(screen.getByText(/37\+ marketing personalization tools/i)).toBeInTheDocument();
      expect(screen.getByText(/unlimited audience segmentation/i)).toBeInTheDocument();
      expect(screen.getByText(/ai-powered campaign personalization/i)).toBeInTheDocument();
    });

    it('should set the page title via Helmet', async () => {
      renderSignInPage();

      await waitFor(() => {
        expect(document.title).toBe('Sign In | VideoRemix.vip');
      });
    });
  });

  describe('Clerk migration guarantees', () => {
    it('should not render a custom email/password form', () => {
      renderSignInPage();

      // Authentication is delegated to Clerk; a local form here would bypass
      // Clerk's CAPTCHA and bot protection.
      expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
    });

    it('should not render a local "sign in" submit button', () => {
      renderSignInPage();

      expect(screen.queryByRole('button', { name: /^sign in$/i })).not.toBeInTheDocument();
    });
  });
});
