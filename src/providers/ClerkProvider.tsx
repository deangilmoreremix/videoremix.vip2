import React, { type ReactNode } from "react";
import { ClerkProvider as ClerkProviderBase, useUser, useSession, useSignIn, useSignUp, useClerk } from "@clerk/clerk-react";

const clerkPubKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "").trim();

const ProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  if (!clerkPubKey) {
    if (!(ProviderInner as any)._warnedMissing) {
      (ProviderInner as any)._warnedMissing = true;
      console.warn("[ClerkProvider] Missing VITE_CLERK_PUBLISHABLE_KEY; running without Clerk runtime.");
    }
    return <>{children}</>;
  }
  return (
    <ClerkProviderBase publishableKey={clerkPubKey}>
      {children}
    </ClerkProviderBase>
  );
};

export { ProviderInner as ClerkProvider, useUser, useSession, useSignIn, useSignUp, useClerk };
export default ProviderInner;
