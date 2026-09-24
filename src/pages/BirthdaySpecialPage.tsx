import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  ArrowRight,
  BadgeDollarSign,
  Cake,
  Check,
  ExternalLink,
  Gift,
  Layers3,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { deanBirthdayImage } from "../assets/deanBirthdayImage";
import "../styles/birthday-special.css";

type AppCategory =
  | "Marketing"
  | "Sales"
  | "Content"
  | "Video"
  | "Career"
  | "Professional"
  | "CRM & Growth";

type BirthdayApp = {
  name: string;
  category: AppCategory;
  description: string;
  exploreUrl: string;
  purchaseUrl?: string;
};

const APPS: BirthdayApp[] = [
  {
    name: "AI Personalized Content Hub",
    category: "Marketing",
    description:
      "Create more relevant business content by organizing personalization around the brand, audience, and offer.",
    exploreUrl: "https://ai-personalizedcontent.videoremix.vip",
  },
  {
    name: "FunnelCraft AI",
    category: "Marketing",
    description:
      "Shape funnel messaging and campaign content around the path from first click to next action.",
    exploreUrl: "https://ai-funnelcraft.videoremix.vip",
  },
  {
    name: "AI Skills & Resume / AI Skills Monetizer",
    category: "Career",
    description:
      "Turn skills and experience into stronger professional positioning, resume content, and monetization ideas.",
    exploreUrl: "https://ai-skills.videoremix.vip",
  },
  {
    name: "Sales Page Builder",
    category: "Sales",
    description:
      "Build focused sales-page messaging that presents the offer, benefits, and next step with clarity.",
    exploreUrl: "https://ai-salespage.videoremix.vip",
  },
  {
    name: "Sales Assistant Pro",
    category: "Sales",
    description:
      "Support day-to-day sales conversations, follow-up, and offer communication from one focused workspace.",
    exploreUrl: "https://ai-salesassistant.videoremix.vip",
  },
  {
    name: "AI Personalization Studio",
    category: "Content",
    description:
      "Create personalized marketing and content variations for different businesses, audiences, and campaigns.",
    exploreUrl: "https://ai-personalizationstudio.videoremix.vip",
  },
  {
    name: "AI Screen Recorder",
    category: "Video",
    description:
      "Capture screen-based demos, walkthroughs, training, and communication content for your business.",
    exploreUrl: "https://ai-screenrecorder.videoremix.vip",
  },
  {
    name: "AI Signature",
    category: "Professional",
    description:
      "Create a polished signature presence for professional communication and personal branding.",
    exploreUrl: "https://ai-signature.videoremix.vip",
  },
  {
    name: "Profile Gen",
    category: "Professional",
    description:
      "Build stronger profile content for personal branding, professional visibility, and online positioning.",
    exploreUrl: "https://ai-profilegen.videoremix.vip",
  },
  {
    name: "Smart CRM Closer Pro",
    category: "CRM & Growth",
    description:
      "Organize customer relationships and support the sales-closing workflow from lead to next action.",
    exploreUrl: "https://smartcrmcloser.netlify.app",
  },
  {
    name: "AI Referral Maximizer Pro",
    category: "CRM & Growth",
    description:
      "Create referral-focused outreach and growth workflows around the relationships you already have.",
    exploreUrl: "https://referrals.smartcrm.vip",
  },
  {
    name: "AI Sales Maximizer",
    category: "Sales",
    description:
      "Support sales messaging, follow-up, and offer communication across your revenue workflow.",
    exploreUrl: "https://salesmax.smartcrm.vip",
  },
  {
    name: "AI Video Editor",
    category: "Video",
    description:
      "Edit and prepare video content for marketing, social media, demos, and business communication.",
    exploreUrl: "https://ai-videoeditor.videoremix.vip",
  },
];

const CATEGORIES = [
  "All",
  "Marketing",
  "Sales",
  "Content",
  "Video",
  "Career",
  "Professional",
  "CRM & Growth",
] as const;

const BirthdaySpecialPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");

  const filteredApps = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return APPS.filter((app) => {
      const categoryMatches =
        activeCategory === "All" || app.category === activeCategory;
      const queryMatches =
        !normalized ||
        app.name.toLowerCase().includes(normalized) ||
        app.description.toLowerCase().includes(normalized) ||
        app.category.toLowerCase().includes(normalized);
      return categoryMatches && queryMatches;
    });
  }, [activeCategory, query]);

  const goToPurchase = (app: BirthdayApp) => {
    window.open(app.purchaseUrl || app.exploreUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Helmet>
        <title>Dean’s 46th Birthday Software Special | VideoRemix.vip</title>
        <meta
          name="description"
          content="Dean is turning 46, so every featured software app in the VideoRemix.vip birthday special is $46."
        />
        <meta property="og:title" content="Dean’s 46th Birthday Software Special" />
        <meta property="og:description" content="13 featured apps. $46 each." />
      </Helmet>

      <div className="birthday-page">
        <div className="birthday-noise" aria-hidden="true" />

        <div className="birthday-announcement">
          <span><Cake size={15} /> Dean’s 46th Birthday Software Special</span>
          <strong>Every Featured App — $46</strong>
        </div>

        <header className="birthday-nav birthday-shell">
          <a className="birthday-brand" href="#birthday-top" aria-label="VideoRemix.vip home">
            VideoRemix<span>.vip</span>
          </a>

          <nav className="birthday-nav-links" aria-label="Birthday special navigation">
            <a href="#birthday-apps">Apps</a>
            <a href="#birthday-stack">Build Your Stack</a>
            <a href="#birthday-faq">FAQ</a>
          </nav>

          <a className="birthday-nav-cta" href="#birthday-apps">
            Choose Your $46 App <ArrowRight size={15} />
          </a>
        </header>

        <main id="birthday-top">
          <section className="birthday-hero birthday-shell">
            <div className="birthday-hero-copy">
              <div className="birthday-kicker">
                <Sparkles size={15} />
                DEAN’S 46TH BIRTHDAY SOFTWARE SPECIAL
              </div>

              <h1>
                I’m Turning <em>46</em> — So Every App Is Just <em>$46.</em>
              </h1>

              <p className="birthday-hero-subtitle">
                Pick the AI tools you want. Every featured app below is available
                for a birthday-special price of <strong>$46 each.</strong>
              </p>

              <div className="birthday-hero-actions">
                <a className="birthday-btn birthday-btn-gold" href="#birthday-apps">
                  See The $46 Apps <ArrowRight size={17} />
                </a>
                <a className="birthday-btn birthday-btn-ghost" href="#birthday-apps">
                  Explore All 13 Apps
                </a>
              </div>

              <div className="birthday-proof-row">
                <span><Check size={14} /> 13 featured apps</span>
                <span><Check size={14} /> $46 each</span>
                <span><Check size={14} /> Choose one or several</span>
              </div>
            </div>

            <div className="birthday-portrait-zone">
              <div className="birthday-portrait-glow" aria-hidden="true" />
              <div className="birthday-price-seal" aria-label="$46 birthday price">
                <small>BIRTHDAY</small>
                <strong>$46</strong>
                <span>EACH</span>
              </div>

              <div className="birthday-portrait-card">
                <img src={deanBirthdayImage} alt="Dean wearing a burgundy suit" />
                <div className="birthday-portrait-shade" />
              </div>

              <div className="birthday-founder-chip">
                <span>46TH BIRTHDAY EDITION</span>
                <strong>Built for the creators, builders & closers.</strong>
              </div>
            </div>
          </section>

          <section className="birthday-value-strip">
            <div className="birthday-shell birthday-value-grid">
              <div><strong>13</strong><span>Featured Apps</span></div>
              <div><strong>$46</strong><span>Per App</span></div>
              <div><strong>7</strong><span>Business Categories</span></div>
              <div><strong>You Choose</strong><span>One App or Several</span></div>
            </div>
          </section>

          <section id="birthday-apps" className="birthday-section birthday-shell">
            <div className="birthday-section-heading">
              <div>
                <div className="birthday-kicker">
                  <Gift size={15} />
                  THE BIRTHDAY SOFTWARE VAULT
                </div>
                <h2>Choose Your <em>$46</em> App</h2>
                <p>
                  Explore the full collection, filter by category, and pick the
                  software that fits what you want to build next.
                </p>
              </div>
            </div>

            <div className="birthday-controls">
              <div className="birthday-filters" role="group" aria-label="Filter apps by category">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={activeCategory === category ? "is-active" : ""}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <label className="birthday-search">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="search"
                  placeholder="Search the 13 apps..."
                  aria-label="Search apps"
                />
              </label>
            </div>

            <div className="birthday-app-grid">
              {filteredApps.map((app, index) => (
                <article className="birthday-app-card" key={app.name}>
                  <div className="birthday-app-card-top">
                    <span className="birthday-app-number">
                      {String(APPS.indexOf(app) + 1).padStart(2, "0")}
                    </span>
                    <span className="birthday-category-pill">{app.category}</span>
                  </div>

                  <div className="birthday-app-icon">
                    {index % 3 === 0 ? <Zap size={20} /> : index % 3 === 1 ? <Layers3 size={20} /> : <BadgeDollarSign size={20} />}
                  </div>

                  <h3>{app.name}</h3>
                  <p>{app.description}</p>

                  <div className="birthday-card-bottom">
                    <div className="birthday-price-row">
                      <div>
                        <small>BIRTHDAY PRICE</small>
                        <strong>$46</strong>
                      </div>
                      <span>per app</span>
                    </div>

                    <div className="birthday-card-actions">
                      <a
                        className="birthday-btn birthday-btn-card-ghost"
                        href={app.exploreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Explore App <ExternalLink size={14} />
                      </a>
                      <button
                        className="birthday-btn birthday-btn-card-gold"
                        type="button"
                        onClick={() => goToPurchase(app)}
                      >
                        Get It For $46 <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredApps.length === 0 && (
              <div className="birthday-empty-state">
                No apps match that search. Try another keyword or choose “All.”
              </div>
            )}
          </section>

          <section id="birthday-stack" className="birthday-stack-section">
            <div className="birthday-shell birthday-stack-card">
              <div className="birthday-stack-copy">
                <div className="birthday-kicker">
                  <Layers3 size={15} />
                  BUILD YOUR OWN SOFTWARE STACK
                </div>
                <h2>One birthday price. <em>Your choice.</em></h2>
                <p>
                  Choose one app for $46, or combine several apps and build the
                  software stack that matches how you market, sell, create, and grow.
                </p>
                <a className="birthday-btn birthday-btn-gold" href="#birthday-apps">
                  Build My $46 Stack <ArrowRight size={17} />
                </a>
              </div>

              <div className="birthday-stack-visual" aria-hidden="true">
                <div className="birthday-stack-tile tile-one"><span>MARKETING</span><b>$46</b></div>
                <div className="birthday-stack-tile tile-two"><span>SALES</span><b>$46</b></div>
                <div className="birthday-stack-tile tile-three"><span>VIDEO</span><b>$46</b></div>
                <div className="birthday-stack-tile tile-four"><span>CRM + GROWTH</span><b>$46</b></div>
              </div>
            </div>
          </section>

          <section className="birthday-section birthday-shell">
            <div className="birthday-section-heading">
              <div>
                <div className="birthday-kicker">
                  <Sparkles size={15} />
                  BUILT FOR HOW YOU WORK
                </div>
                <h2>From first idea to <em>next sale.</em></h2>
              </div>
            </div>

            <div className="birthday-audience-grid">
              {[
                ["01", "Creators", "Build content, video, profiles, and promotional assets with a sharper workflow."],
                ["02", "Freelancers", "Choose tools that help package, present, and deliver stronger client-facing work."],
                ["03", "Agencies", "Support personalization, funnels, sales, and content workflows from one ecosystem."],
                ["04", "Sales Teams", "Strengthen pages, follow-up, CRM workflows, referrals, and offer communication."],
              ].map(([number, title, description]) => (
                <article key={title}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="birthday-founder birthday-shell">
            <div className="birthday-founder-image">
              <img src={deanBirthdayImage} alt="Dean, founder of VideoRemix.vip" />
            </div>

            <div className="birthday-founder-copy">
              <div className="birthday-kicker">
                <Cake size={15} />
                A BIRTHDAY NOTE FROM DEAN
              </div>
              <h2>Why <em>$46?</em></h2>
              <p>
                For my 46th birthday, I wanted to do something simple: make the
                software we’ve built easier to grab.
              </p>
              <p>
                So for this birthday special, every featured app on this page is
                <strong> $46.</strong>
              </p>
              <div className="birthday-signature">— Dean</div>
            </div>
          </section>

          <section id="birthday-faq" className="birthday-section birthday-shell birthday-faq">
            <div className="birthday-section-heading">
              <div>
                <div className="birthday-kicker">QUICK ANSWERS</div>
                <h2>Birthday Special FAQ</h2>
              </div>
            </div>

            <details open>
              <summary>Why $46?</summary>
              <p>Dean is turning 46, so each featured app is priced at $46 for the birthday special.</p>
            </details>
            <details>
              <summary>Can I buy more than one app?</summary>
              <p>Yes. Choose any of the featured apps individually at $46 each during the special.</p>
            </details>
            <details>
              <summary>Where can I see each app before buying?</summary>
              <p>Every app card includes an Explore App button that opens the live application in a new tab.</p>
            </details>
            <details>
              <summary>Is every app the same price?</summary>
              <p>Yes. Every app shown on this birthday-special page is $46.</p>
            </details>
          </section>

          <section className="birthday-final-cta">
            <div className="birthday-shell">
              <div className="birthday-kicker">46 YEARS. 13 APPS. ONE BIRTHDAY SPECIAL.</div>
              <h2>Your next software tool is <em>$46.</em></h2>
              <p>Choose the app that fits your next move.</p>
              <a className="birthday-btn birthday-btn-gold birthday-btn-large" href="#birthday-apps">
                Choose Your $46 App <ArrowRight size={18} />
              </a>
            </div>
          </section>
        </main>

        <footer className="birthday-footer">
          <div className="birthday-shell">
            <a className="birthday-brand" href="#birthday-top">
              VideoRemix<span>.vip</span>
            </a>
            <p>Dean’s 46th Birthday Software Special</p>
          </div>
        </footer>

        <a className="birthday-mobile-cta" href="#birthday-apps">
          <span>13 Apps</span>
          <strong>Choose Yours for $46</strong>
          <ArrowRight size={16} />
        </a>
      </div>
    </>
  );
};

export default BirthdaySpecialPage;
