import React, { type ReactNode } from "react";
import { ClerkProvider as ClerkProviderBase, useUser, useSession, useSignIn, useSignUp, useClerk } from "@clerk/react";

const clerkPubKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "").trim();

const ProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ClerkProviderBase publishableKey={clerkPubKey}>
      {children}
    </ClerkProviderBase>
  );
};

export { ProviderInner as ClerkProvider, useUser, useSession, useSignIn, useSignUp, useClerk };
export default ProviderInner;
