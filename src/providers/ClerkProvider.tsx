// src/providers/ClerkProvider.tsx
import React, { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClerkProvider as ClerkProviderBase,
  useUser,
  useSession,
  useSignIn,
  useSignUp,
  useClerk,
} from "@clerk/react";
import { resolvePublishableKey } from "./clerkKey";

/**
 * The frontend API of the Clerk instance.
 *
 * Clerk v6 has no frontendApi prop: the SDK loads its script from the host
 * encoded in the publishable key. This value is only used to rebuild the key
 * when the configured one is malformed (see ./clerkKey.ts).
 */
const clerkFrontendApi = (
  import.meta.env.VITE_CLERK_FRONTEND_API || "clerk.auth.videoremix.vip"
).trim();

// The SDK loads its script from the host inside the key, so a malformed key
// (production once shipped one for ".clerk.accounts.dev") is rebuilt from the
// frontend API above. See ./clerkKey.ts.
const resolvedKey = resolvePublishableKey(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "",
  clerkFrontendApi,
);
if (resolvedKey.rebuilt) {
  console.warn(
    `VITE_CLERK_PUBLISHABLE_KEY does not point at a real host; using the key for ${clerkFrontendApi}. Fix the build environment.`,
  );
}
const clerkPubKey = resolvedKey.key;

/**
 * The Clerk provider.
 *
 * WHY THE ROUTER IS WIRED IN
 *   Clerk's sign-in is a multi-step flow: the component navigates to
 *   /signin/continue, /signin/factor-one and so on as the user progresses.
 *   With `routing="path"` Clerk needs to know how to navigate, so the
 *   provider is given the router's push and replace. Without them Clerk
 *   cannot move between its own steps, the component unmounts mid-flow, and
 *   the user is left looking at a spinner that never resolves.
 *
 *   The hosted sign-in paths are declared to Clerk as well, so the "Don't have
 *   an account? Sign up" link and the post-sign-in redirect land on real
 *   routes instead of Clerk's defaults.
 */
const ProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <ClerkProviderBase
      publishableKey={clerkPubKey}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/signin"
      signUpUrl="/signup"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      {children}
    </ClerkProviderBase>
  );
};

export { ProviderInner as ClerkProvider, useUser, useSession, useSignIn, useSignUp, useClerk };
export default ProviderInner;
