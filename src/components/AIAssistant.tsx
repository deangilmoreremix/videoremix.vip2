import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  ChevronDown,
  Sparkles,
  Loader,
  Zap,
  Bot,
  FileSearch,
  Link as LinkIcon,
  ArrowRight,
  Video,
  Wand2,
  PanelTop,
  Users,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";

// Types for our chat
interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  links?: {
    text: string;
    url: string;
  }[];
}

// Quick action buttons for common tasks
interface QuickAction {
  icon: React.ReactNode;
  text: string;
  url: string;
}

const quickActions: QuickAction[] = [
  {
    icon: <Video className="h-4 w-4" />,
    text: "Create your first video",
    url: "/help/create-first-video",
  },
  {
    icon: <Wand2 className="h-4 w-4" />,
    text: "Try AI video creator",
    url: "/features/ai-video-creator",
  },
  {
    icon: <PanelTop className="h-4 w-4" />,
    text: "Browse templates",
    url: "/features/smart-templates",
  },
  {
    icon: <Clock className="h-4 w-4" />,
    text: "Repurpose content",
    url: "/features/content-repurposing",
  },
  {
    icon: <Users className="h-4 w-4" />,
    text: "Set up team workspace",
    url: "/features/collaboration",
  },
];

// Knowledge base created from landing page content
const knowledgeBase = [
  {
    question: "What is VideoRemix.vip?",
    answer:
      "VideoRemix.vip is an AI-powered video creation and editing platform designed to make professional video production accessible to everyone. Whether you're a content creator, marketer, educator, or business owner, our platform provides the tools you need to create stunning videos without technical expertise.",
    links: [
      {
        text: "Read more about VideoRemix.vip",
        url: "/help/what-is-videoremix",
      },
      { text: "Create your first video", url: "/help/create-first-video" },
    ],
  },
  {
    question: "How does AI video creation work?",
    answer:
      "Our AI video creator transforms your text, keywords, and prompts into fully-produced professional videos. The AI analyzes your content, selects appropriate visuals, applies professional editing techniques, and creates a complete video automatically. You can then customize this video as needed before exporting.",
    links: [
      { text: "AI Video Creator guide", url: "/features/ai-video-creator" },
      { text: "AI Editing Complete Guide", url: "/help/ai-editing-guide" },
    ],
  },
  {
    question: "What are the pricing plans?",
    answer:
      "VideoRemix.vip offers three plans: Free, Pro ($29/month), and Business ($79/month). The Free plan allows 5 video exports per month at 720p quality. The Pro plan includes unlimited video exports, 4K quality, all editing features, 50GB storage, and more. The Business plan adds 500GB storage, all AI features, advanced analytics, and team collaboration features.",
    links: [{ text: "View all pricing details", url: "/pricing" }],
  },
  {
    question: "Do you offer a free trial?",
    answer:
      "Yes! We offer a 14-day free trial on our Pro plan with no credit card required. This gives you full access to all our premium features so you can experience the full power of VideoRemix.vip before committing.",
    links: [{ text: "Start your free trial", url: "#pricing" }],
  },
  {
    question: "How does the content repurposing feature work?",
    answer:
      "Our content repurposing system automatically identifies the most engaging parts of your long-form videos and transforms them into perfectly formatted short-form content for every platform. The AI detects highlight moments, creates clips of appropriate length, and reformats them for different aspect ratios required by various social platforms.",
    links: [
      {
        text: "Content Repurposing feature guide",
        url: "/features/content-repurposing",
      },
    ],
  },
  {
    question: "What are Smart Templates?",
    answer:
      "Smart Templates are professionally designed video templates that adapt to your content. They automatically adjust to maintain perfect timing, transitions, and visual coherence regardless of what assets you add. We offer 500+ templates designed for every industry and purpose, regularly updated with new designs.",
    links: [
      {
        text: "Smart Templates feature guide",
        url: "/features/smart-templates",
      },
      { text: "Using Video Templates tutorial", url: "/help/templates-usage" },
    ],
  },
  {
    question: "How do automatic captions work?",
    answer:
      "Our automatic caption feature uses advanced speech recognition to convert spoken words into accurate text captions with 98% accuracy. It supports 40+ languages and dialects, and includes automatic translation capabilities. You can customize caption styles for brand consistency and export them as burned-in captions or as SRT/VTT files.",
    links: [
      {
        text: "Automatic Captions feature guide",
        url: "/features/auto-captions",
      },
    ],
  },
  {
    question: "What collaboration features are available?",
    answer:
      "VideoRemix.vip offers robust collaboration features including real-time collaborative editing, comment and feedback systems, version history and comparison, role-based permissions, and approval workflows. Team members can work together on projects regardless of their location, streamlining the video production process.",
    links: [
      {
        text: "Team Collaboration feature guide",
        url: "/features/collaboration",
      },
      { text: "Working with Team Projects", url: "/help/team-projects" },
    ],
  },
  {
    question: "How much time can I save using VideoRemix.vip?",
    answer:
      "Users typically save 80-90% of their video production time using VideoRemix.vip. What used to take days can be accomplished in minutes or hours, allowing you to create more content with less effort. Our AI tools handle the technical aspects of video creation so you can focus on creativity and strategy.",
    links: [{ text: "See success stories", url: "#testimonials" }],
  },
  {
    question: "What types of videos can I create?",
    answer:
      "You can create virtually any type of video with VideoRemix.vip, including social media content, marketing videos, product demonstrations, educational content, YouTube videos, testimonials, webinar recordings, and much more. Our template library covers dozens of use cases across all major industries.",
    links: [{ text: "Explore our templates", url: "#features" }],
  },
  {
    question: "Is there a mobile app available?",
    answer:
      "Yes! VideoRemix.vip works on any modern browser, including mobile browsers. We also offer dedicated apps for iOS and Android for an optimized mobile editing experience, allowing you to create and edit videos on the go.",
    links: [{ text: "Get the mobile app", url: "#download" }],
  },
  {
    question: "What export options are available?",
    answer:
      "You can export videos in multiple formats (MP4, MOV, etc.) and resolutions (up to 4K with Pro/Business plans). We offer direct publishing to social media platforms, and our system automatically optimizes your videos for each platform's specific requirements.",
    links: [
      { text: "Export Options & Settings guide", url: "/help/export-options" },
    ],
  },
  {
    question: "How secure is my content?",
    answer:
      "We use bank-level encryption for all content uploaded to our platform. Your videos are only accessible to you and anyone you explicitly grant access to. Our servers are SOC 2 Type II compliant, ensuring enterprise-grade security for all your content.",
    links: [{ text: "Learn about our security", url: "/privacy-policy" }],
  },
  {
    question: "How do I create my first video?",
    answer:
      "Creating your first video with VideoRemix.vip is easy! Start by selecting a template or AI-generation method, then customize with your content, branding, and preferred style. Our step-by-step wizard guides you through the entire process, and you can have a professional video ready in minutes.",
    links: [
      { text: "Step-by-step tutorial", url: "/help/create-first-video" },
      { text: "Try the AI video creator", url: "/features/ai-video-creator" },
    ],
  },
];

// Default greeting messages
const greetings = [
  "👋 Hi there! I'm VideoRemix AI Assistant. How can I help you create amazing videos today?",
  "Hello! I'm here to answer your questions about VideoRemix.vip. What would you like to know?",
  "Welcome to VideoRemix.vip! I'm your AI assistant, ready to help with any questions about our platform.",
];

// Function to generate a random greeting
const getRandomGreeting = () => {
  const randomIndex = Math.floor(Math.random() * greetings.length);
  return greetings[randomIndex];
};

// Function to search the knowledge base and find relevant answers
const searchKnowledgeBase = (query: string) => {
  query = query.toLowerCase();

  // Look for exact matches first
  for (const item of knowledgeBase) {
    if (item.question.toLowerCase().includes(query)) {
      return item;
    }
  }

  // Look for partial matches in questions
  let bestMatch = null;
  let highestScore = 0;

  for (const item of knowledgeBase) {
    const questionWords = item.question.toLowerCase().split(" ");
    const answerWords = item.answer.toLowerCase().split(" ");
    const queryWords = query.split(" ");

    let score = 0;

    // Check how many query words appear in the question and answer
    queryWords.forEach((word) => {
      if (word.length <= 2) return; // Skip very short words

      if (questionWords.some((qWord) => qWord.includes(word))) {
        score += 2; // Higher weight for question matches
      }

      if (answerWords.some((aWord) => aWord.includes(word))) {
        score += 1; // Lower weight for answer matches
      }
    });

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  // Return the best match if it's good enough, otherwise return a default response
  if (highestScore > 1) {
    return bestMatch;
  }

  return {
    question: "",
    answer:
      "I don't have specific information about that. Could you try rephrasing your question or ask about one of our features like AI video creation, smart templates, content repurposing, or team collaboration?",
    links: [
      { text: "Browse the Help Center", url: "/help" },
      { text: "Contact Support", url: "/contact" },
    ],
  };
};

// Text that appears one character at a time
const TypewriterText: React.FC<{ text: string; onComplete?: () => void }> = ({
  text,
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(
        () => {
          setDisplayedText((prev) => prev + text[currentIndex]);
          setCurrentIndex((prev) => prev + 1);
        },
        15 + Math.random() * 10,
      ); // Slightly randomized typing speed

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  // Ensure proper paragraph formatting
  const formattedText = displayedText.split("\n").map((paragraph, i) => (
    <React.Fragment key={i}>
      {paragraph}
      {i < displayedText.split("\n").length - 1 && <br />}
    </React.Fragment>
  ));

  return <>{formattedText}</>;
};

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: getRandomGreeting(),
      role: "assistant",
      timestamp: new Date(),
      links: [
        { text: "Create your first video", url: "/help/create-first-video" },
        { text: "Explore features", url: "/features" },
      ],
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Adjust textarea height based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 100)}px`;
    }
  }, [inputValue]);

  // Handle sending message
  const handleSendMessage = () => {
    if (!inputValue.trim() || isTyping) return;

    // Hide quick actions after user sends first message
    setShowQuickActions(false);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setIsTypingComplete(false);

    // Simulate AI thinking and then responding
    setTimeout(
      () => {
        const response = searchKnowledgeBase(inputValue);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.answer,
          role: "assistant",
          timestamp: new Date(),
          links: response.links,
        };

        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      },
      800 + Math.random() * 800,
    ); // Random delay between 0.8-1.6 seconds
  };

  // Handle quick action selection
  const handleQuickAction = (action: QuickAction) => {
    // Hide quick actions
    setShowQuickActions(false);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: `I want to ${action.text.toLowerCase()}`,
      role: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setIsTyping(true);
    setIsTypingComplete(false);

    // Simulate AI thinking and then responding
    setTimeout(
      () => {
        // Construct different responses based on action
        const response = {
          answer: "",
          links: [{ text: action.text, url: action.url }],
        };

        switch (action.text) {
          case "Create your first video":
            response.answer =
              "Great choice! Creating your first video with VideoRemix.vip is easy and straightforward. I'll guide you through the process step by step. Our intuitive interface and AI assistance make video creation simple even if you have no prior experience.";
            response.links = [
              {
                text: "Step-by-step tutorial",
                url: "/help/create-first-video",
              },
              {
                text: "Watch video walkthrough",
                url: "/tutorials/getting-started",
              },
            ];
            break;

          case "Try AI video creator":
            response.answer =
              "You'll love our AI video creator! This powerful feature lets you transform text prompts into complete videos in minutes. Just describe what you want, and our AI handles the technical work of video production for you.";
            response.links = [
              {
                text: "Start AI video creation",
                url: "/features/ai-video-creator",
              },
              { text: "AI editing tutorial", url: "/help/ai-editing-guide" },
            ];
            break;

          case "Browse templates":
            response.answer =
              "Our template library offers 500+ professionally designed templates for any industry or purpose. Templates make video creation even faster by giving you a professional foundation that you can easily customize with your content.";
            response.links = [
              {
                text: "Browse template library",
                url: "/features/smart-templates",
              },
              {
                text: "Template customization guide",
                url: "/help/templates-usage",
              },
            ];
            break;

          case "Repurpose content":
            response.answer =
              "Content repurposing is one of our most popular features! It automatically transforms your long-form videos into optimized clips for social media and other platforms. This can multiply your content output without additional creation time.";
            response.links = [
              {
                text: "Content repurposing guide",
                url: "/features/content-repurposing",
              },
              {
                text: "Social media optimization tips",
                url: "/help/social-media-optimization",
              },
            ];
            break;

          case "Set up team workspace":
            response.answer =
              "Setting up your team workspace allows for seamless collaboration on video projects. You can invite team members, set permission levels, and work together in real-time regardless of location.";
            response.links = [
              {
                text: "Team collaboration guide",
                url: "/features/collaboration",
              },
              {
                text: "Managing team permissions",
                url: "/help/team-permissions",
              },
            ];
            break;

          default:
            response.answer =
              "I'd be happy to help you with that! Here's a link to get you started:";
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.answer,
          role: "assistant",
          timestamp: new Date(),
          links: response.links,
        };

        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      },
      800 + Math.random() * 800,
    ); // Random delay between 0.8-1.6 seconds
  };

  // Handle input submit with Enter key (with Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTypingComplete = () => {
    setIsTyping(false);
    setIsTypingComplete(true);
  };

  // Prompt for first video creation in initial greeting
  const firstVideoPrompt = (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className="mt-4 mb-2"
    >
      <div className="text-sm font-medium text-white mb-3">
        Get started quickly:
      </div>
      <div className="grid grid-cols-1 gap-2">
        {quickActions.map((action, index) => (
          <motion.button
            key={index}
            whileHover={{
              scale: 1.02,
              backgroundColor: "rgba(99, 102, 241, 0.2)",
            }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center text-left text-primary-300 hover:text-primary-200 transition-colors bg-primary-900/30 rounded-md p-2.5 hover:bg-primary-900/40 border border-transparent hover:border-primary-500/30"
            onClick={() => handleQuickAction(action)}
          >
            <div className="bg-primary-800/50 p-1.5 rounded mr-3 flex-shrink-0">
              {action.icon}
            </div>
            <span>{action.text}</span>
            <ArrowRight className="ml-auto h-4 w-4 text-primary-400" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Chat toggle button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 400, damping: 20 }}
        onClick={() => setIsOpen(true)}
        className={`fixed z-50 bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors ${
          isOpen ? "hidden" : "flex"
        }`}
        aria-label="Open AI Assistant"
      >
        <Bot className="w-6 h-6" />
      </motion.button>

      {/* Animation for pulse around button */}
      {!isOpen && (
        <motion.div
          className="fixed z-40 bottom-6 right-6 w-16 h-16 bg-primary-500 rounded-full"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{
            repeat: Infinity,
            duration: 2.5,
            delay: 2,
            repeatDelay: 8,
          }}
        />
      )}

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed z-50 bottom-6 right-6 w-full sm:w-96 bg-gray-900 rounded-xl border border-gray-700 shadow-2xl overflow-hidden ${
              isMinimized ? "h-auto" : "h-[550px] sm:max-h-[calc(100vh-100px)]"
            }`}
          >
            {/* Chat header */}
            <div className="flex items-center justify-between bg-primary-600 px-4 py-3">
              <div className="flex items-center">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 5,
                  }}
                >
                  <Sparkles className="h-5 w-5 text-white mr-2" />
                </motion.div>
                <h3 className="text-white font-semibold">
                  VideoRemix AI Assistant
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                  aria-label={isMinimized ? "Expand" : "Minimize"}
                >
                  <ChevronDown
                    className={`h-5 w-5 transform transition-transform ${
                      isMinimized ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chat content */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex flex-col h-[calc(100%-120px)]"
                >
                  {/* Messages container */}
                  <div className="flex-grow p-4 overflow-y-auto">
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.role === "user"
                                ? "bg-primary-600 text-white"
                                : "bg-gray-800 text-gray-200"
                            }`}
                          >
                            {message.role === "assistant" &&
                            index === messages.length - 1 &&
                            isTyping ? (
                              <>
                                <TypewriterText
                                  text={message.content}
                                  onComplete={handleTypingComplete}
                                />

                                {/* Show links after typing is complete */}
                                {isTypingComplete &&
                                  message.links &&
                                  message.links.length > 0 && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="mt-3 pt-3 border-t border-gray-700 space-y-2"
                                    >
                                      {message.links.map((link, i) => (
                                        <Link
                                          key={i}
                                          to={link.url}
                                          className="flex items-center text-xs text-primary-300 hover:text-primary-200 transition-colors bg-primary-900/30 rounded-md p-1.5 hover:bg-primary-900/50"
                                        >
                                          <LinkIcon className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                          <span className="flex-grow">
                                            {link.text}
                                          </span>
                                          <ArrowRight className="h-3 w-3 flex-shrink-0" />
                                        </Link>
                                      ))}
                                    </motion.div>
                                  )}
                              </>
                            ) : (
                              <>
                                <p className="text-sm whitespace-pre-line break-words">
                                  {message.content}
                                </p>

                                {/* Relevant links */}
                                {message.links && message.links.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                                    {message.links.map((link, i) => (
                                      <Link
                                        key={i}
                                        to={link.url}
                                        className="flex items-center text-xs text-primary-300 hover:text-primary-200 transition-colors bg-primary-900/30 rounded-md p-1.5 hover:bg-primary-900/50"
                                      >
                                        <LinkIcon className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                        <span className="flex-grow">
                                          {link.text}
                                        </span>
                                        <ArrowRight className="h-3 w-3 flex-shrink-0" />
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      ))}

                      {/* Show first video creation prompt after initial greeting */}
                      {messages.length === 1 &&
                        showQuickActions &&
                        firstVideoPrompt}

                      {/* Typing indicator (only shown when AI is processing but hasn't started typing yet) */}
                      {isTyping &&
                        messages[messages.length - 1]?.role !== "assistant" && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                          >
                            <div className="max-w-[80%] p-3 rounded-lg bg-gray-800 text-white">
                              <div className="flex items-center space-x-1.5">
                                <motion.div
                                  className="w-2 h-2 bg-gray-500 rounded-full"
                                  animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 1, 0.5],
                                  }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1.2,
                                    ease: "easeInOut",
                                  }}
                                />
                                <motion.div
                                  className="w-2 h-2 bg-gray-500 rounded-full"
                                  animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 1, 0.5],
                                  }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1.2,
                                    delay: 0.2,
                                    ease: "easeInOut",
                                  }}
                                />
                                <motion.div
                                  className="w-2 h-2 bg-gray-500 rounded-full"
                                  animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 1, 0.5],
                                  }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1.2,
                                    delay: 0.4,
                                    ease: "easeInOut",
                                  }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}

                      {/* Invisible element to scroll to */}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Input area */}
                  <div className="p-3 border-t border-gray-800 bg-gray-850">
                    <div className="relative">
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything about VideoRemix.vip..."
                        className="w-full px-4 py-2 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        rows={1}
                        style={{
                          minHeight: "44px",
                          maxHeight: "100px",
                          height: "auto",
                        }}
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSendMessage}
                        disabled={isTyping || !inputValue.trim()}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
                          isTyping || !inputValue.trim()
                            ? "text-gray-500 cursor-not-allowed"
                            : "text-primary-500 hover:text-primary-400 hover:bg-gray-700"
                        } transition-colors`}
                        aria-label="Send message"
                      >
                        {isTyping ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              repeat: Infinity,
                              duration: 1,
                              ease: "linear",
                            }}
                          >
                            <Loader className="h-5 w-5" />
                          </motion.div>
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </motion.button>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <div className="flex items-center">
                        <Zap className="h-3 w-3 mr-1" />
                        <span>AI Assistant</span>
                      </div>
                      <div className="flex items-center">
                        <FileSearch className="h-3 w-3 mr-1" />
                        <span>Trained on VideoRemix.vip content</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
