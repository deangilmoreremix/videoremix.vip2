// src/components/ClerkUnavailableNotice.tsx
//
// A sign-in form that never appears is the worst possible failure: the user
// is told nothing and waits. This shows up when Clerk cannot initialise —
// which happens when the origin is not one of the instance's allowed origins
// (a deploy preview, a different port) or when an extension or a network
// filter blocks `clerk.auth.videoremix.vip`.
//
// It renders nothing while Clerk is healthy, and an explanation with a way out
// when it is not.

import { useEffect, useState } from "react";
import { useClerk } from "@clerk/react";

const WAIT_MS = 8000;

export const ClerkUnavailableNotice: React.FC = () => {
  const clerk = useClerk();
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    if (clerk.loaded) return;
    const timer = setTimeout(() => setStalled(true), WAIT_MS);
    return () => clearTimeout(timer);
  }, [clerk.loaded]);

  if (!stalled || clerk.loaded) return null;

  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"
    >
      <p className="font-medium">The sign-in form could not be loaded.</p>
      <p className="mt-1 text-amber-100/80">
        Clerk could not initialise on this address. That happens when the address is
        not one of this site&apos;s allowed origins, or when an extension is blocking{" "}
        <code className="rounded bg-black/30 px-1">clerk.auth.videoremix.vip</code>.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-3 rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-amber-300"
      >
        Reload and try again
      </button>
    </div>
  );
};

export default ClerkUnavailableNotice;
