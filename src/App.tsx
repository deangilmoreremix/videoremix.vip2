import React, { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route, useLocation, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import SparkleBackground from "./components/SparkleBackground";
import SpecialHeader from "./components/SpecialHeader";
import ScrollProgressBar from "./components/ScrollProgressBar";
import CustomCursor from "./components/CustomCursor";
import LiveActivityIndicator from "./components/LiveActivityIndicator";
import AudioPlayer from "./components/AudioPlayer";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import MobileBottomNav from "./components/MobileBottomNav";
import { AdminProvider } from "./context/AdminContext";
import { useAuth } from "./context/AuthContext";
import { Toaster } from "./components/ui/toast";
import { NetworkStatusIndicator } from "./components/AsyncStates";
import { Analytics } from "./utils/analytics";

// Eager-loaded enhanced landing page (no lazy loading → fast initial render with all sections)
// Toggle by visiting `/?variant=enhanced` to compare against the premium version.
import EnhancedLandingPage from "./pages/EnhancedLandingPage";

// Lazy loaded components for better performance
const LandingPage = lazy(() => import("./components/premium/LandingPage"));
const AppPage = lazy(() => import("./pages/AppPage"));

// Generic pages
const PricingPage = lazy(() => import("./pages/PricingPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const AboutUsPage = lazy(() => import("./pages/AboutUsPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLogin = lazy(() => import("./components/admin/AdminLogin"));
const AdminSignUp = lazy(() => import("./components/admin/AdminSignUp"));
const SpecialFooter = lazy(() => import("./components/SpecialFooter"));
const GlobalPersonalizerButton = lazy(() => import("./components/personalizer/GlobalPersonalizerButton"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const AnalyticsDashboard = lazy(() => import("./components/AnalyticsDashboard"));

const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const EmailGTMPage = lazy(() => import("./pages/agents/EmailGTMPage"));
const FinancialCoachPage = lazy(() => import("./pages/agents/FinancialCoachPage"));
const ProductLaunchIntelligencePage = lazy(() => import("./pages/agents/ProductLaunchIntelligencePage"));
const LocalAiReasoningAgentPyPage = lazy(() => import("./pages/agents/LocalAiReasoningAgentPyPage"));
const LocalAiScrapperPyPage = lazy(() => import("./pages/agents/LocalAiScrapperPyPage"));
const LocalTravelAgentPage = lazy(() => import("./pages/agents/LocalTravelAgentPage"));
const QwenLocalRagPage = lazy(() => import("./pages/agents/QwenLocalRagPage"));
const RagAgentCoherePage = lazy(() => import("./pages/agents/RagAgentCoherePage"));

// Additional agent pages lazy imports
const Ai3dpygameR1Page = lazy(() => import("./pages/agents/Ai3dpygameR1Page"));
const AiAqiAnalysisAgentPage = lazy(() => import("./pages/agents/AiAqiAnalysisAgentPage"));
const AiArxivAgentMemoryPage = lazy(() => import("./pages/agents/AiArxivAgentMemoryPage"));
const AiAudioTourAgentPage = lazy(() => import("./pages/agents/AiAudioTourAgentPage"));
const AiBlogSearchPage = lazy(() => import("./pages/agents/AiBlogSearchPage"));
const AiBlogToPodcastAgentPage = lazy(() => import("./pages/agents/AiBlogToPodcastAgentPage"));
const AiBreakupRecoveryAgentPage = lazy(() => import("./pages/agents/AiBreakupRecoveryAgentPage"));
const AiChessAgentPage = lazy(() => import("./pages/agents/AiChessAgentPage"));
const AiCompetitorIntelligenceAgentTeamPage = lazy(() => import("./pages/agents/AiCompetitorIntelligenceAgentTeamPage"));
const AiCustomerSupportAgentPage = lazy(() => import("./pages/agents/AiCustomerSupportAgentPage"));
const AiDataAnalysisAgentPage = lazy(() => import("./pages/agents/AiDataAnalysisAgentPage"));
const AiDataVisualisationAgentPage = lazy(() => import("./pages/agents/AiDataVisualisationAgentPage"));
const AiDeepResearchAgentPage = lazy(() => import("./pages/agents/AiDeepResearchAgentPage"));
const AiDomainDeepResearchAgentPage = lazy(() => import("./pages/agents/AiDomainDeepResearchAgentPage"));
const AiEmailGtmOutreachAgentPage = lazy(() => import("./pages/agents/AiEmailGtmOutreachAgentPage"));
const AiEmailGtmReachoutAgentPage = lazy(() => import("./pages/agents/AiEmailGtmReachoutAgentPage"));
const AiFinancialCoachAgentPage = lazy(() => import("./pages/agents/AiFinancialCoachAgentPage"));
const AiFraudInvestigationAgentPage = lazy(() => import("./pages/agents/AiFraudInvestigationAgentPage"));
const AiGameDesignAgentTeamPage = lazy(() => import("./pages/agents/AiGameDesignAgentTeamPage"));
const AiHealthFitnessAgentPage = lazy(() => import("./pages/agents/AiHealthFitnessAgentPage"));
const AiJournalistAgentPage = lazy(() => import("./pages/agents/AiJournalistAgentPage"));
const AiLegalAgentTeamPage = lazy(() => import("./pages/agents/AiLegalAgentTeamPage"));
const AiLifeInsuranceAdvisorAgentPage = lazy(() => import("./pages/agents/AiLifeInsuranceAdvisorAgentPage"));
const AiMedicalImagingAgentPage = lazy(() => import("./pages/agents/AiMedicalImagingAgentPage"));
const AiMeetingAgentPage = lazy(() => import("./pages/agents/AiMeetingAgentPage"));
const AiMemeGeneratorAgentBrowserusePage = lazy(() => import("./pages/agents/AiMemeGeneratorAgentBrowserusePage"));
const AiMentalWellbeingAgentPage = lazy(() => import("./pages/agents/AiMentalWellbeingAgentPage"));
const AiMovieProductionAgentPage = lazy(() => import("./pages/agents/AiMovieProductionAgentPage"));
const AiMusicGeneratorAgentPage = lazy(() => import("./pages/agents/AiMusicGeneratorAgentPage"));
const AiPersonalFinanceAgentPage = lazy(() => import("./pages/agents/AiPersonalFinanceAgentPage"));
const ProductLaunchIntelligenceAgentPage = lazy(() => import("./pages/agents/ProductLaunchIntelligenceAgentPage"));
const AiRealEstateAgentTeamPage = lazy(() => import("./pages/agents/AiRealEstateAgentTeamPage"));
const AiReasoningAgentPage = lazy(() => import("./pages/agents/AiReasoningAgentPage"));
const AiRecipeMealPlanningAgentPage = lazy(() => import("./pages/agents/AiRecipeMealPlanningAgentPage"));
const AiRecruitmentAgentTeamPage = lazy(() => import("./pages/agents/AiRecruitmentAgentTeamPage"));
const AiServicesAgencyPage = lazy(() => import("./pages/agents/AiServicesAgencyPage"));
const AiStartupInsightFire1AgentPage = lazy(() => import("./pages/agents/AiStartupInsightFire1AgentPage"));
const AiStartupTrendAnalysisAgentPage = lazy(() => import("./pages/agents/AiStartupTrendAnalysisAgentPage"));
const AiSystemArchitectR1Page = lazy(() => import("./pages/agents/AiSystemArchitectR1Page"));
const AiTeachingAgentTeamPage = lazy(() => import("./pages/agents/AiTeachingAgentTeamPage"));
const AiTicTacToeAgentPage = lazy(() => import("./pages/agents/AiTicTacToeAgentPage"));
const AiTravelAgentMemoryPage = lazy(() => import("./pages/agents/AiTravelAgentMemoryPage"));
const AiTravelAgentPage = lazy(() => import("./pages/agents/AiTravelAgentPage"));
const AiTravelPlannerMcpAgentTeamPage = lazy(() => import("./pages/agents/AiTravelPlannerMcpAgentTeamPage"));
  const AgentAppPage = lazy(() => import("./pages/agents/AppPage"));
const AutonomousRagPage = lazy(() => import("./pages/agents/AutonomousRagPage"));
const PersonalizerPage = lazy(() => import("./pages/PersonalizerPage"));
const BlogToPodcastAgentPage = lazy(() => import("./pages/agents/BlogToPodcastAgentPage"));
const BrowserMcpAgentPage = lazy(() => import("./pages/agents/BrowserMcpAgentPage"));
const ChatWithGithubPage = lazy(() => import("./pages/agents/ChatWithGithubPage"));
const ChatWithGmailPage = lazy(() => import("./pages/agents/ChatWithGmailPage"));
const ChatWithPdfPage = lazy(() => import("./pages/agents/ChatWithPdfPage"));
const ChatWithResearchPapersPage = lazy(() => import("./pages/agents/ChatWithResearchPapersPage"));
const ChatWithSubstackPage = lazy(() => import("./pages/agents/ChatWithSubstackPage"));
const ChatWithTarotsPage = lazy(() => import("./pages/agents/ChatWithTarotsPage"));
const ChatWithYoutubeVideosPage = lazy(() => import("./pages/agents/ChatWithYoutubeVideosPage"));
const ContextualaiRagAgentPage = lazy(() => import("./pages/agents/ContextualaiRagAgentPage"));
const CorrectiveRagPage = lazy(() => import("./pages/agents/CorrectiveRagPage"));
const CursorAiExperimentsPage = lazy(() => import("./pages/agents/CursorAiExperimentsPage"));
const CustomerSupportVoiceAgentPage = lazy(() => import("./pages/agents/CustomerSupportVoiceAgentPage"));
const DeepseekLocalRagAgentPage = lazy(() => import("./pages/agents/DeepseekLocalRagAgentPage"));
const DevpulseAiPage = lazy(() => import("./pages/agents/DevpulseAiPage"));
const FinanceAgentPage = lazy(() => import("./pages/agents/FinanceAgentPage"));
const FrontendPage = lazy(() => import("./pages/agents/FrontendPage"));
const GeminiAgenticRagPage = lazy(() => import("./pages/agents/GeminiAgenticRagPage"));
const GithubMcpAgentPage = lazy(() => import("./pages/agents/GithubMcpAgentPage"));
const GptOssCritiqueImprovementLoopPage = lazy(() => import("./pages/agents/GptOssCritiqueImprovementLoopPage"));
const HybridSearchRagPage = lazy(() => import("./pages/agents/HybridSearchRagPage"));
const KnowledgeGraphRagCitationsPage = lazy(() => import("./pages/agents/KnowledgeGraphRagCitationsPage"));
const Llama31LocalRagPage = lazy(() => import("./pages/agents/Llama31LocalRagPage"));
const Llama3StatefulChatPage = lazy(() => import("./pages/agents/Llama3StatefulChatPage"));
const AiPersonalizedMemoryPage = lazy(() => import("./pages/agents/AiPersonalizedMemoryPage"));
const AiRouterAppPage = lazy(() => import("./pages/agents/AiRouterAppPage"));
const LocalAiLegalAgentTeamPage = lazy(() => import("./pages/agents/LocalAiLegalAgentTeamPage"));
const LocalChatgptClonePage = lazy(() => import("./pages/agents/LocalChatgptClonePage"));
const LocalChatgptWithMemoryPage = lazy(() => import("./pages/agents/LocalChatgptWithMemoryPage"));
const LocalHybridSearchRagPage = lazy(() => import("./pages/agents/LocalHybridSearchRagPage"));
const MixtureOfAgentsPage = lazy(() => import("./pages/agents/MixtureOfAgentsPage"));
const MultiAgentResearcherPage = lazy(() => import("./pages/agents/MultiAgentResearcherPage"));
const MultiAiMemoryPage = lazy(() => import("./pages/agents/MultiAiMemoryPage"));
const MultiMcpAgentRouterPage = lazy(() => import("./pages/agents/MultiMcpAgentRouterPage"));
const MultimodalAiAgentPage = lazy(() => import("./pages/agents/MultimodalAiAgentPage"));
const MultimodalCodingAgentTeamPage = lazy(() => import("./pages/agents/MultimodalCodingAgentTeamPage"));
const MultimodalDesignAgentTeamPage = lazy(() => import("./pages/agents/MultimodalDesignAgentTeamPage"));
const MusicGeneratorAgentPyPage = lazy(() => import("./pages/agents/MusicGeneratorAgentPyPage"));
const OpenaiResearchAgentPage = lazy(() => import("./pages/agents/OpenaiResearchAgentPage"));
const PodcastifyAIPage = lazy(() => import("./pages/agents/PodcastifyAIPage"));
const RagAsAServicePage = lazy(() => import("./pages/agents/RagAsAServicePage"));
const RagChainPage = lazy(() => import("./pages/agents/RagChainPage"));
const RagDatabaseRoutingPage = lazy(() => import("./pages/agents/RagDatabaseRoutingPage"));
const ReasoningAgentPage = lazy(() => import("./pages/agents/ReasoningAgentPage"));
const ResearchAgentGeminiInteractionApiPage = lazy(() => import("./pages/agents/ResearchAgentGeminiInteractionApiPage"));
const ResumeJobMatcherPage = lazy(() => import("./pages/agents/ResumeJobMatcherPage"));
const SalesForceAIPage = lazy(() => import("./pages/agents/SalesForceAIPage"));
const SocialBuzzAIPage = lazy(() => import("./pages/agents/SocialBuzzAIPage"));
const StartupTrendsAgentPage = lazy(() => import("./pages/agents/StartupTrendsAgentPage"));
const ToonifyTokenOptimizationPage = lazy(() => import("./pages/agents/ToonifyTokenOptimizationPage"));
const TrustGatedAgentTeamPage = lazy(() => import("./pages/agents/TrustGatedAgentTeamPage"));
const VisionRagPage = lazy(() => import("./pages/agents/VisionRagPage"));
const VoiceRagOpenaisdkPage = lazy(() => import("./pages/agents/VoiceRagOpenaisdkPage"));
const WebScrapingAgentPage = lazy(() => import("./pages/agents/WebScrapingAgentPage"));
const WebScrapingAiAgentPage = lazy(() => import("./pages/agents/WebScrapingAiAgentPage"));
const XaiFinanceAgentPage = lazy(() => import("./pages/agents/XaiFinanceAgentPage"));
  const StarterAgentPage = lazy(() => import("./pages/agents/1StarterAgentPage"));
const RunningAgentsPage = lazy(() => import("./pages/agents/4RunningAgentsPage"));
const InMemoryConversationAgentPage = lazy(() => import("./pages/agents/51InMemoryConversationAgentPage"));
const PersistentConversationAgentPage = lazy(() => import("./pages/agents/52PersistentConversationAgentPage"));
const AgentLifecycleCallbacksPage = lazy(() => import("./pages/agents/61AgentLifecycleCallbacksPage"));
const AiInteractionCallbacksPage = lazy(() => import("./pages/agents/62AiInteractionCallbacksPage"));
const ToolExecutionCallbacksPage = lazy(() => import("./pages/agents/63ToolExecutionCallbacksPage"));
const PluginsPage = lazy(() => import("./pages/agents/7PluginsPage"));
const SessionsPage = lazy(() => import("./pages/agents/7SessionsPage"));
const SequentialAgentPage = lazy(() => import("./pages/agents/91SequentialAgentPage"));
const LoopAgentPage = lazy(() => import("./pages/agents/92LoopAgentPage"));
const ParallelAgentPage = lazy(() => import("./pages/agents/93ParallelAgentPage"));
const Ag2AdaptiveResearchTeamPage = lazy(() => import("./pages/agents/Ag2AdaptiveResearchTeamPage"));
const AgenticRagEmbeddingGemmaPage = lazy(() => import("./pages/agents/AgenticRagEmbeddingGemmaPage"));
const AgenticRagGpt5Page = lazy(() => import("./pages/agents/AgenticRagGpt5Page"));
const AgenticRagWithReasoningPage = lazy(() => import("./pages/agents/AgenticRagWithReasoningPage"));
const ConsultProAIPage = lazy(() => import("./pages/agents/ConsultProAIPage"));
const LaunchRocketAIPage = lazy(() => import("./pages/agents/LaunchRocketAIPage"));

// Auth pages
const SignInPage = lazy(() => import("./pages/SignInPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EmailConfirmPage = lazy(() => import("./pages/EmailConfirmPage"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const MagicLinkPage = lazy(() => import("./pages/MagicLinkPage"));

// Agent components map for dynamic routing
const agentComponents = {
  '1-starter-agent': StarterAgentPage,
  '4-running-agents': RunningAgentsPage,
  '5-1-in-memory-conversation-agent': InMemoryConversationAgentPage,
  '5-2-persistent-conversation-agent': PersistentConversationAgentPage,
  '6-1-agent-lifecycle-callbacks': AgentLifecycleCallbacksPage,
   '6-2-ai-interaction-callbacks': AiInteractionCallbacksPage,
  '6-3-tool-execution-callbacks': ToolExecutionCallbacksPage,
  '7-plugins': PluginsPage,
  '7-sessions': SessionsPage,
  '9-1-sequential-agent': SequentialAgentPage,
  '9-2-loop-agent': LoopAgentPage,
  '9-3-parallel-agent': ParallelAgentPage,
  'ag2-adaptive-research-team': Ag2AdaptiveResearchTeamPage,
  'agentic-rag-embedding-gemma': AgenticRagEmbeddingGemmaPage,
  'agentic-rag-gpt5': AgenticRagGpt5Page,
  'agentic-rag-with-reasoning': AgenticRagWithReasoningPage,
  'ai-3dpygame-r1': Ai3dpygameR1Page,
  'ai-aqi-analysis-agent': AiAqiAnalysisAgentPage,
  'ai-arxiv-agent-memory': AiArxivAgentMemoryPage,
  'ai-audio-tour-agent': AiAudioTourAgentPage,
  'ai-blog-search': AiBlogSearchPage,
  'ai-blog-to-podcast-agent': AiBlogToPodcastAgentPage,
  'ai-breakup-recovery-agent': AiBreakupRecoveryAgentPage,
  'ai-chess-agent': AiChessAgentPage,
  'ai-competitor-intelligence-agent-team': AiCompetitorIntelligenceAgentTeamPage,
  'ai-customer-support-agent': AiCustomerSupportAgentPage,
  'ai-data-analysis-agent': AiDataAnalysisAgentPage,
  'ai-data-visualisation-agent': AiDataVisualisationAgentPage,
  'ai-deep-research-agent': AiDeepResearchAgentPage,
  'ai-domain-deep-research-agent': AiDomainDeepResearchAgentPage,
  'ai-email-gtm-outreach-agent': AiEmailGtmOutreachAgentPage,
  'ai-email-gtm-reachout-agent': EmailGTMPage,
  'ai-financial-coach-agent': FinancialCoachPage,
  'ai-fraud-investigation-agent': AiFraudInvestigationAgentPage,
  'ai-game-design-agent-team': AiGameDesignAgentTeamPage,
  'ai-health-fitness-agent': AiHealthFitnessAgentPage,
  'ai-journalist-agent': AiJournalistAgentPage,
  'ai-legal-agent-team': AiLegalAgentTeamPage,
  'ai-life-insurance-advisor-agent': AiLifeInsuranceAdvisorAgentPage,
  'ai-medical-imaging-agent': AiMedicalImagingAgentPage,
  'ai-meeting-agent': AiMeetingAgentPage,
  'ai-meme-generator-agent-browseruse': AiMemeGeneratorAgentBrowserusePage,
  'ai-mental-wellbeing-agent': AiMentalWellbeingAgentPage,
  'ai-movie-production-agent': AiMovieProductionAgentPage,
  'ai-music-generator-agent': AiMusicGeneratorAgentPage,
  'ai-personal-finance-agent': AiPersonalFinanceAgentPage,
  'ai-product-launch-intelligence-agent': ProductLaunchIntelligencePage,
  'ai-real-estate-agent-team': AiRealEstateAgentTeamPage,
  'ai-reasoning-agent': AiReasoningAgentPage,
  'ai-recipe-meal-planning-agent': AiRecipeMealPlanningAgentPage,
  'ai-recruitment-agent-team': AiRecruitmentAgentTeamPage,
  'ai-services-agency': AiServicesAgencyPage,
  'ai-startup-insight-fire1-agent': AiStartupInsightFire1AgentPage,
  'ai-startup-trend-analysis-agent': AiStartupTrendAnalysisAgentPage,
  'ai-system-architect-r1': AiSystemArchitectR1Page,
  'ai-teaching-agent-team': AiTeachingAgentTeamPage,
  'ai-tic-tac-toe-agent': AiTicTacToeAgentPage,
  'ai-travel-agent': AiTravelAgentPage,
  'ai-travel-agent-memory': AiTravelAgentMemoryPage,
  'ai-travel-planner-mcp-agent-team': AiTravelPlannerMcpAgentTeamPage,
  'app': AgentAppPage,
  'autonomous-rag': AutonomousRagPage,
  'blog-to-podcast-agent': BlogToPodcastAgentPage,
  'browser-mcp-agent': BrowserMcpAgentPage,
  'chat-with-github': ChatWithGithubPage,
  'chat-with-gmail': ChatWithGmailPage,
  'chat-with-pdf': ChatWithPdfPage,
  'chat-with-research-papers': ChatWithResearchPapersPage,
  'chat-with-substack': ChatWithSubstackPage,
  'chat-with-tarots': ChatWithTarotsPage,
  'chat-with-youtube-videos': ChatWithYoutubeVideosPage,
  'contextualai-rag-agent': ContextualaiRagAgentPage,
  'corrective-rag': CorrectiveRagPage,
  'cursor-ai-experiments': CursorAiExperimentsPage,
  'customer-support-voice-agent': CustomerSupportVoiceAgentPage,
  'deepseek-local-rag-agent': DeepseekLocalRagAgentPage,
  'devpulse-ai': DevpulseAiPage,
  'frontend': FrontendPage,
  'gemini-agentic-rag': GeminiAgenticRagPage,
  'github-mcp-agent': GithubMcpAgentPage,
  'gpt-oss-critique-improvement-loop': GptOssCritiqueImprovementLoopPage,
  'hybrid-search-rag': HybridSearchRagPage,
  'knowledge-graph-rag-citations': KnowledgeGraphRagCitationsPage,
  'llama3-1-local-rag': Llama31LocalRagPage,
  'llama3-stateful-chat': Llama3StatefulChatPage,
   'ai-personalized-memory': AiPersonalizedMemoryPage,
   'ai-router-app': AiRouterAppPage,
  'local-ai-legal-agent-team': LocalAiLegalAgentTeamPage,
  'local-ai-reasoning-agent-py': LocalAiReasoningAgentPyPage,
  'local-ai-scrapper-py': LocalAiScrapperPyPage,
  'local-chatgpt-clone': LocalChatgptClonePage,
  'local-chatgpt-with-memory': LocalChatgptWithMemoryPage,
  'local-hybrid-search-rag': LocalHybridSearchRagPage,
  'local-travel-agent': LocalTravelAgentPage,
  'mixture-of-agents': MixtureOfAgentsPage,
  'multi-agent-researcher': MultiAgentResearcherPage,
   'multi-ai-memory': MultiAiMemoryPage,
  'multi-mcp-agent-router': MultiMcpAgentRouterPage,
  'multimodal-ai-agent': MultimodalAiAgentPage,
  'multimodal-coding-agent-team': MultimodalCodingAgentTeamPage,
  'multimodal-design-agent-team': MultimodalDesignAgentTeamPage,
  'music-generator-agent-py': MusicGeneratorAgentPyPage,
  'openai-research-agent': OpenaiResearchAgentPage,
  'podcastify-ai': PodcastifyAIPage,
  'qwen-local-rag': QwenLocalRagPage,
  'rag-agent-cohere': RagAgentCoherePage,
  'rag-as-a-service': RagAsAServicePage,
  'rag-chain': RagChainPage,
  'rag-database-routing': RagDatabaseRoutingPage,
  'reasoning-agent': ReasoningAgentPage,
  'research-agent-gemini-interaction-api': ResearchAgentGeminiInteractionApiPage,
  'resume-job-matcher': ResumeJobMatcherPage,
  'startup-trends-agent': StartupTrendsAgentPage,
  'toonify-token-optimization': ToonifyTokenOptimizationPage,
  'trust-gated-agent-team': TrustGatedAgentTeamPage,
  'vision-rag': VisionRagPage,
  'voice-rag-openaisdk': VoiceRagOpenaisdkPage,
  'web-scraping-ai-agent': WebScrapingAiAgentPage,
  'xai-finance-agent': XaiFinanceAgentPage,
};

// Agent page component for dynamic routing
const AgentPage = () => {
  const { id } = useParams();
  const Component = agentComponents[id];
  if (!Component) {
    return <div>Agent page not found</div>;
  }
  return <Component />;
};

// Loading fallback component
const SectionLoader = () => (
  <div className="flex justify-center items-center py-20 text-white">
    <div className="relative">
      <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs text-primary-500 font-medium">Loading</span>
      </div>
    </div>
  </div>
);

function App() {
  const location = useLocation();
  const { user } = useAuth();

  // Detect mobile/tablet
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

// Check if we're on an admin page
   const isAdminPage = location.pathname.startsWith("/admin");

   // Check if we should show the global personalizer button
   // Only show for authenticated users, NOT on landing page, admin pages, or auth pages
   const isAuthPage = location.pathname.startsWith("/signin") ||
                      location.pathname.startsWith("/signup") ||
                      location.pathname.startsWith("/forgot-password") ||
                      location.pathname.startsWith("/reset-password") ||
                      location.pathname.startsWith("/email-confirm") ||
                      location.pathname.startsWith("/auth-callback") ||
                      location.pathname.startsWith("/magic-link");
   const isLandingPage = location.pathname === "/";
   const showGlobalPersonalizer = user && !isAdminPage && !isAuthPage && !isLandingPage;

   useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Initialize analytics with user ID
  useEffect(() => {
    Analytics.setUserId(user?.id || null);
  }, [user]);
  // Update document title with page section
  useEffect(() => {
    const updateTitle = () => {
      const sections = document.querySelectorAll("section[id]");
      let currentSection = "home";

      for (const section of sections as NodeListOf<HTMLElement>) {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (
          window.scrollY >= sectionTop - 200 &&
          window.scrollY < sectionTop + sectionHeight - 200
        ) {
          currentSection = section.id;
          break;
        }
      }

      document.title = `VideoRemix.vip | ${currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}`;
    };

    window.addEventListener("scroll", updateTitle);
    return () => window.removeEventListener("scroll", updateTitle);
  }, []);

  // Handle errors from error boundaries
  const handleError = () => {
    // In a production app, you might send this to an error tracking service
  };

return (
    <>
      <Helmet>
        <title>VideoRemix.vip - AI-Powered Marketing Personalization Platform</title>
        <meta name="description" content="Create personalized marketing content that converts with AI-powered tools. Transform your campaigns with VideoRemix.vip's marketing personalization platform." />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">

        {!isAdminPage && <SpecialHeader topOffset={0} />}

        {!isAdminPage && <ScrollProgressBar topOffset={0} />}

        {!isMobile && !isTablet && !isAdminPage && <CustomCursor />}

        {!isAdminPage && <AudioPlayer />}

{!isAdminPage && <LiveActivityIndicator />}

        {/* Global Personalizer Button - only for authenticated users, not on landing/auth pages */}
        {!isAdminPage && showGlobalPersonalizer && (
          <Suspense fallback={null}>
            <GlobalPersonalizerButton />
          </Suspense>
        )}

        <Routes>
           {/* Landing Page Route */}
          <Route
            path="/"
            element={
              <ErrorBoundary onError={handleError}>
                {(() => {
                  // ?variant=enhanced  → use the eager-loaded enhanced page (fast, all animations, no Suspense chunks)
                  // ?variant=premium   → use the current lazy-loaded premium page
                  // default            → premium
                  const params = new URLSearchParams(window.location.search);
                  const variant = params.get('variant');
                  if (variant === 'enhanced') {
                    return <EnhancedLandingPage />;
                  }
                  return (
                    <Suspense fallback={<SectionLoader />}>
                      <LandingPage />
                    </Suspense>
                  );
                })()}
              </ErrorBoundary>
            }
          />
          
          {/* Auth Pages */}
           <Route path="/signin" element={<ErrorBoundary onError={handleError}><Suspense fallback={<SectionLoader />}><SignInPage /></Suspense></ErrorBoundary>></Route>
           <Route path="/signup" element={<ErrorBoundary onError={handleError}><Suspense fallback={<SectionLoader />}> <SignUpPage /></Suspense></ErrorBoundary>></Route>
           <Route path="/forgot-password" element={<ErrorBoundary onError={handleError}><Suspense fallback={<SectionLoader />}><ForgotPasswordPage /></Suspense></ErrorBoundary>></Route>
           <Route path="/reset-password" element={<ErrorBoundary onError={handleError}><Suspense fallback={<SectionLoader />}><ResetPassword /></Suspense></ErrorBoundary>></Route>
           <Route path="/email-confirm" element={<ErrorBoundary onError={handleError}><Suspense fallback={<SectionLoader />}><EmailConfirmPage /></Suspense></ErrorBoundary>></Route>
           <Route path="/auth-callback" element={<ErrorBoundary onError={handleError}><Suspense fallback={<SectionLoader />}><AuthCallback /></Suspense></ErrorBoundary>></Route>
           <Route path="/magic-link" element={<ErrorBoundary onError={handleError}><Suspense fallback={<SectionLoader />}><MagicLinkPage /></Suspense></ErrorBoundary>></Route>
          
          {/* Courses Page */}
          <Route
            path="/courses"
            element={
              <ErrorBoundary onError={handleError}>
                <SparkleBackground>
                  <Suspense fallback={<SectionLoader />}>
                    <CoursesPage />
                    <SpecialFooter />
                  </Suspense>
                </SparkleBackground>
              </ErrorBoundary>
            }
          />
          </Routes>
        <Toaster />
        <MobileBottomNav />
        <NetworkStatusIndicator />
      </div>
    </>
  );
}

export default App;
