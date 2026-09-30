import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AppWindow,
  ExternalLink,
  LockKeyhole,
  Play,
  Search,
} from "lucide-react";
import { APP_REGISTRY, type AppMeta } from "../config/appRegistry";
import { useAuth } from "../context/AuthContext";
import { useUserAccess } from "../hooks/useUserAccess";
import PurchaseModal from "../components/PurchaseModal";
import { getAppLaunchTarget } from "../utils/appLaunch";

const ApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const { hasAccessToApp, loading: accessLoading } = useUserAccess();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedAppForPurchase, setSelectedAppForPurchase] = useState<AppMeta | null>(null);

  const filteredApps = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return APP_REGISTRY;

    return APP_REGISTRY.filter((app) =>
      [app.name, app.description, app.category, app.group]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [query]);

  const handleAppClick = (app: AppMeta) => {
    const isOwned = Boolean(user && hasAccessToApp(app.slug));

    if (!isOwned) {
      setSelectedAppForPurchase(app);
      return;
    }

    const target = getAppLaunchTarget(app);

    if (target.kind === "external") {
      window.open(target.destination, "_blank", "noopener,noreferrer");
      return;
    }

    navigate(target.destination);
  };

  return (
    <div className="min-h-screen bg-gray-950 pt-24 text-white">
      <section className="border-b border-white/10 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="container mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-xs uppercase tracking-[0.25em] text-primary-400 mb-3">
              VideoRemix App Library
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              One canonical application catalog.
            </h1>
            <p className="mt-4 text-gray-400 max-w-3xl mx-auto">
              Browse the {APP_REGISTRY.length} VideoRemix applications in the platform registry.
              AI agents are organized separately inside the authenticated command center.
            </p>

            {!user && (
              <Link
                to="/signin"
                className="inline-flex mt-7 rounded-xl bg-primary-600 hover:bg-primary-500 px-6 py-3 font-medium"
              >
                Sign in to access your apps
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-semibold">Applications</h2>
            <p className="text-sm text-gray-400 mt-2">
              {filteredApps.length} shown · ownership is checked against your account
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search applications..."
              className="w-full md:w-80 rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary-500/60"
            />
          </div>
        </div>

        {accessLoading && user && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-400">
            Syncing your app ownership…
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredApps.map((app, index) => {
            const isOwned = Boolean(user && hasAccessToApp(app.slug));

            return (
              <motion.button
                key={app.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.015, 0.25) }}
                onClick={() => handleAppClick(app)}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left hover:bg-white/[0.06] hover:border-primary-500/30 transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="h-11 w-11 rounded-xl border border-primary-400/15 bg-primary-500/10 flex items-center justify-center">
                    {app.family === "external" ? (
                      <ExternalLink className="h-5 w-5 text-primary-400" />
                    ) : (
                      <AppWindow className="h-5 w-5 text-primary-400" />
                    )}
                  </div>

                  <span
                    className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-1 ${
                      isOwned
                        ? "text-emerald-400 bg-emerald-400/10"
                        : "text-gray-400 bg-white/5"
                    }`}
                  >
                    {isOwned ? "Owned" : "Locked"}
                  </span>
                </div>

                <h3 className="font-semibold mt-5">{app.name}</h3>
                <p className="text-sm leading-6 text-gray-400 mt-2 line-clamp-3">
                  {app.description}
                </p>

                <div className="flex items-center justify-between mt-5 text-xs text-gray-500">
                  <span>{app.category}</span>
                  {isOwned ? (
                    <Play className="h-4 w-4 group-hover:text-white" />
                  ) : (
                    <LockKeyhole className="h-4 w-4" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {selectedAppForPurchase && (
        <PurchaseModal
          isOpen={Boolean(selectedAppForPurchase)}
          onClose={() => setSelectedAppForPurchase(null)}
          app={{
            id: selectedAppForPurchase.slug,
            name: selectedAppForPurchase.name,
            description: selectedAppForPurchase.description,
            image: selectedAppForPurchase.thumbnail || "",
            icon: null,
            price: 97,
          }}
        />
      )}
    </div>
  );
};

export default ApplicationsPage;
