import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import SignUpPage from '../src/pages/SignUpPage';

// The page now delegates registration to Clerk's prebuilt <SignUp>
// component (CAPTCHA/bot protection) instead of a custom Supabase form.
// These mocks let us assert that wiring without a live Clerk instance.
const mockClerkSignUp = vi.fn(() => <div data-testid="clerk-sign-up" />);

vi.mock('@clerk/react', () => ({
  SignUp: (props: Record<string, unknown>) => mockClerkSignUp(props),
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

const renderSignUpPage = () => {
  return render(
    <HelmetProvider>
      <BrowserRouter>
        <SignUpPage />
      </BrowserRouter>
    </HelmetProvider>,
  );
};

describe('SignUpPage (Clerk prebuilt implementation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the Clerk SignUp component with path routing config', () => {
      renderSignUpPage();

      expect(screen.getByTestId('clerk-sign-up')).toBeInTheDocument();

      expect(mockClerkSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          routing: 'path',
          path: '/signup',
          redirectUrl: '/dashboard',
        }),
      );
    });

    it('should display start your journey heading', () => {
      renderSignUpPage();

      expect(screen.getByText(/start your journey/i)).toBeInTheDocument();
      expect(
        screen.getByText(/join thousands using personalized marketing/i),
      ).toBeInTheDocument();
    });

    it('should display back to home link', () => {
      renderSignUpPage();

      const backLink = screen.getByText(/back to home/i);
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('should display benefits section', () => {
      renderSignUpPage();

      expect(screen.getByText(/start your account today/i)).toBeInTheDocument();
      expect(screen.getByText(/no credit card required to start/i)).toBeInTheDocument();
      expect(screen.getByText(/37\+ marketing tools immediately/i)).toBeInTheDocument();
    });

    it('should set the page title via Helmet', async () => {
      renderSignUpPage();

      await waitFor(() => {
        expect(document.title).toBe('Sign Up | VideoRemix.vip');
      });
    });
  });

  describe('Clerk migration guarantees', () => {
    it('should not render a custom registration form', () => {
      renderSignUpPage();

      // Registration is delegated to Clerk; a local form here would bypass
      // Clerk's CAPTCHA and bot protection.
      expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/last name/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
    });

    it('should not render a local "create account" submit button', () => {
      renderSignUpPage();

      expect(screen.queryByRole('button', { name: /create account/i })).not.toBeInTheDocument();
    });
  });
});
