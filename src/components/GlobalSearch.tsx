import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Command,
  ArrowRight,
  Clock,
  Hash,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApps } from "../hooks/useApps";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: "app" | "page" | "feature";
  path: string;
  icon?: string;
  isExternal?: boolean;
}

const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();
  const { apps } = useApps();
  const inputRef = useRef<HTMLInputElement>(null);

  const pages: SearchResult[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Your personal dashboard",
      category: "page",
      path: "/dashboard",
    },
    {
      id: "profile",
      title: "Profile",
      description: "Manage your account",
      category: "page",
      path: "/profile",
    },
    {
      id: "pricing",
      title: "Pricing",
      description: "View pricing plans",
      category: "page",
      path: "/pricing",
    },
    {
      id: "help",
      title: "Help Center",
      description: "Get help and support",
      category: "page",
      path: "/help",
    },
    {
      id: "blog",
      title: "Blog",
      description: "Read our latest articles",
      category: "page",
      path: "/blog",
    },
    {
      id: "contact",
      title: "Contact",
      description: "Get in touch with us",
      category: "page",
      path: "/contact",
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchQuery = query.toLowerCase();
    const appResults: SearchResult[] = apps
      .filter(
        (app) =>
          app.name.toLowerCase().includes(searchQuery) ||
          app.description?.toLowerCase().includes(searchQuery) ||
          app.category?.toLowerCase().includes(searchQuery),
      )
      .slice(0, 5)
      .map((app) => ({
        id: app.id,
        title: app.name,
        description: app.description || "",
        category: "app" as const,
        path: `/app/${app.id}`,
        icon: app.icon,
        isExternal: app.url ? true : false,
      }));

    const pageResults: SearchResult[] = pages
      .filter(
        (page) =>
          page.title.toLowerCase().includes(searchQuery) ||
          page.description.toLowerCase().includes(searchQuery),
      )
      .slice(0, 3);

    setResults([...appResults, ...pageResults]);
    setSelectedIndex(0);
  }, [query, apps]);

  const handleSelect = (result: SearchResult) => {
    saveToRecent(result.title);
    setIsOpen(false);
    setQuery("");
    navigate(result.path);
  };

  const saveToRecent = (search: string) => {
    const updated = [
      search,
      ...recentSearches.filter((s) => s !== search),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "app":
        return <Hash className="h-4 w-4" />;
      case "page":
        return <ArrowRight className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 px-4 py-2 rounded-lg border border-gray-700 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="text-sm">Search...</span>
        <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
          <Command className="h-3 w-3" />
          <span>K</span>
        </div>
      </button>

      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden bg-gray-800/50 hover:bg-gray-800 text-gray-300 p-2 rounded-lg border border-gray-700 transition-colors"
      >
        <Search className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
            >
              <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-gray-700">
                  <Search className="h-5 w-5 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search apps, pages, and features..."
                    className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
                  />
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">
                      ESC
                    </kbd>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {!query && recentSearches.length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Recent Searches
                      </div>
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => setQuery(search)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 rounded-lg transition-colors text-left"
                        >
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-300">{search}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.length > 0 ? (
                    <div className="p-2">
                      {results.map((result, index) => (
                        <motion.button
                          key={result.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSelect(result)}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
                            index === selectedIndex
                              ? "bg-primary-500/20 border border-primary-500/50"
                              : "hover:bg-gray-800"
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg ${
                              result.category === "app"
                                ? "bg-primary-500/20"
                                : "bg-gray-700"
                            }`}
                          >
                            {result.icon ? (
                              <span className="text-xl">{result.icon}</span>
                            ) : (
                              getCategoryIcon(result.category)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white truncate">
                                {result.title}
                              </span>
                              {result.isExternal && (
                                <ExternalLink className="h-3 w-3 text-gray-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 truncate">
                              {result.description}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        </motion.button>
                      ))}
                    </div>
                  ) : query ? (
                    <div className="p-8 text-center text-gray-400">
                      <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No results found for "{query}"</p>
                    </div>
                  ) : null}
                </div>

                <div className="p-3 border-t border-gray-700 bg-gray-800/50">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">
                          ↑↓
                        </kbd>
                        Navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">
                          ↵
                        </kbd>
                        Select
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">
                          ESC
                        </kbd>
                        Close
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalSearch;
