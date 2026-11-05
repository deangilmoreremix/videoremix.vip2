// src/pages/landing/AgentLandingPage.tsx
//
// Route: / — the public landing page. Its layout follows the
// agentos.sapienx.app landing page, with VideoRemix VIP branding, and it
// showcases the app catalog. It renders its own nav and footer,
// so App.tsx hides the global site chrome on this route.

import React from "react";
import SEO from "../../components/SEO";
import LandingNav from "../../components/landing/LandingNav";
import LandingHero from "../../components/landing/LandingHero";
import WorkspaceSection from "../../components/landing/WorkspaceSection";
import FeatureMockups from "../../components/landing/FeatureMockups";
import HowItWorks from "../../components/landing/HowItWorks";
import TeamSection from "../../components/landing/TeamSection";
import AppCatalogSection from "../../components/landing/AppCatalogSection";
import ShowcaseSection from "../../components/landing/ShowcaseSection";
import UseCases from "../../components/landing/UseCases";
import LandingPricing from "../../components/landing/LandingPricing";
import LandingFAQ from "../../components/landing/LandingFAQ";
import ExploreWithAI from "../../components/landing/ExploreWithAI";
import ClosingCTA from "../../components/landing/ClosingCTA";
import LandingFooter from "../../components/landing/LandingFooter";
import { LANDING_APP_COUNT } from "../../components/landing/landingData";
import "../../styles/landing.css";

const AgentLandingPage: React.FC = () => (
  <div className="vr-landing">
    <SEO
      title={`VideoRemix VIP — ${LANDING_APP_COUNT} ready-to-run AI apps and agents`}
      description={`Run ${LANDING_APP_COUNT} AI agents, multi-agent teams, RAG pipelines, voice and MCP agents in your browser with VideoRemix VIP. No setup.`}
      url="https://videoremix.vip/"
    />
    <LandingNav />
    <main>
      <LandingHero />
      <WorkspaceSection />
      <ExploreWithAI />
      <FeatureMockups />
      <HowItWorks />
      <TeamSection />
      <ShowcaseSection />
      <AppCatalogSection />
      <UseCases />
      <LandingPricing />
      <LandingFAQ />
      <ClosingCTA />
    </main>
    <LandingFooter />
  </div>
);

export default AgentLandingPage;
