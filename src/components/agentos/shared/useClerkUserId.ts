// src/components/agentos/shared/useClerkUserId.ts
//
// The single identity accessor for the AgentOS port.
//
// The customer IdP is Clerk, and `useAuth().user.id` IS the Clerk user id
// (see src/context/AuthContext.tsx: toAppUser() maps clerkUser.id -> id, and
// upsertSupabaseProfileFromClerkUser() confirms the mapping). Every AgentOS row
// is owned by that value; the database also stamps it from the verified JWT, so
// this hook is used for scoping reads and for optimistic UI, never as the
// authority on who owns a row.

import { useAuth } from "../../../context/AuthContext";

export interface ClerkIdentity {
  clerkUserId: string;
  ready: boolean;
}

export const useClerkUserId = (): ClerkIdentity => {
  const { user } = useAuth();
  const clerkUserId = user?.id ?? "";
  return { clerkUserId, ready: Boolean(clerkUserId) };
};

export default useClerkUserId;
