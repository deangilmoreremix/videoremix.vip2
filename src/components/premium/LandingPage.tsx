import React, { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import ErrorBoundary from '../ErrorBoundary';
import ROICalculator from './ROICalculator';
import PersonalizationSimulator from './PersonalizationSimulator';
import InteractiveComparisonTable from './InteractiveComparisonTable';
import LiveActivityFeed from './LiveActivityFeed';
import LogoWall from './LogoWall';
import ParticleBackground from './ParticleBackground';
import ParallaxSection from './ParallaxSection';
import ProgressIndicator from './ProgressIndicator';
import StickyWidget from './StickyWidget';
import BackToTop from './BackToTop';
import ExitIntentPopup from './ExitIntentPopup';
import AnimatedBorderGradient from './AnimatedBorderGradient';
import GradientOrb from './GradientOrb';
import AnimatedStatsCounter from './AnimatedStatsCounter';
import AnimatedTestimonialCard from './AnimatedTestimonialCard';
import InteractiveCard from './InteractiveCard';
import TypedText from './TypedText';
import TextReveal from './TextReveal';
import FloatingIcon from './FloatingIcon';
import SEO from '../SEO';
import BundleShowcaseSection from './BundleShowcaseSection';
import ConversionNudge from './ConversionNudge';
import { Sparkles, Award, Clock, Shield, Star, CheckCircle, TrendingUp, BarChart3, Users, DollarSign, Mail, Send, FileText, Users2, Globe, BookOpen, Code, Palette, GraduationCap, Brain, ExternalLink, HelpCircle, Target, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import SpecialHero from '../SpecialHero';
import ProblemSection from '../ProblemSection';
import SolutionSection from '../SolutionSection';
import FeatureMap from '../FeatureMap';
import SectionReveal from './SectionReveal';
const PersonalizationWorkflowSection = lazy(() => import('../PersonalizationWorkflowSection'));
const ToolsCarouselSection = lazy(() => import('../ToolsCarouselSection'));
const BenefitsSection = lazy(() => import('../BenefitsSection'));
const AppGallerySection = lazy(() => import('../AppGallerySection'));
const DemoSection = lazy(() => import('../DemoSection'));
const CaseStudiesSection = lazy(() => import('../CaseStudiesSection'));
const TestimonialsSection = lazy(() => import('../TestimonialsSection'));
const PricingSection = lazy(() => import('../PricingSection'));
const GuaranteeSection = lazy(() => import('../GuaranteeSection'));
const FAQSection = lazy(() => import('../FAQSection'));
const FinalCTA = lazy(() => import('../FinalCTA'));

const SectionLoader = () => (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="relative w-20 h-20 mb-4">
        <div className="absolute inset-0 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-b-4 border-accent-500 border-solid rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <span className="text-sm text-primary-400 font-medium">Loading section...</span>
    </div>
  );

const LandingPage: React.FC = () => {
  // Tree-shaking guard: force bundler to include all lucide icons used in this chunk.
  // Icons passed as React.ReactNode to FloatingIcon can't be traced by the bundler.
  void (window.__videoremixIcons = {
    AlertCircle, HelpCircle, Target, Brain, GraduationCap, ExternalLink,
    CheckCircle, BarChart3, Sparkles, Award, Clock, Shield, Star,
    TrendingUp, Users, DollarSign, Mail,
  });
  return (
    <main className="bg-[#050510] text-white min-h-screen">
      <SEO
        title="VideoRemix.vip - AI Marketing Platform + 100+ Business Apps"
        description="Create personalized marketing campaigns, explore 100+ AI-powered business apps across 12 categories, and turn AI outputs into sellable services."
        keywords={["AI marketing", "VideoRemix", "personalization", "business apps", "AI tools"]}
        image="https://videoremix.vip/og-image.jpg"
        url="https://videoremix.vip"
      />

      <Helmet>
        <title>VideoRemix.vip - AI Marketing Platform + 100+ Business Apps</title>
        <meta name="description" content="Create personalized marketing campaigns with AI. 100+ business apps across 12 categories. Turn AI into revenue." />
      </Helmet>

      {/* 1. Special Hero (from original) */}
      <Suspense fallback={<SectionLoader />}>
        <SpecialHero />
      </Suspense>

      {/* 2. Problem Section (from original) */}
      <Suspense fallback={<SectionLoader />}>
        <ProblemSection />
      </Suspense>

      {/* 3. Solution Section (from original) */}
      <Suspense fallback={<SectionLoader />}>
        <SolutionSection />
      </Suspense>

      {/* 4. Feature Map (from original) */}
      <Suspense fallback={<SectionLoader />}>
        <FeatureMap
          title="Comprehensive Marketing Personalization Features"
          subtitle="Explore the powerful personalization capabilities of VideoRemix.vip's marketing platform"
        />
      </Suspense>

      {/* 5. Transformation Section (Before/After) - premium */}
      <SectionReveal delay={0.2}>
        <section className="py-20 bg-gray-900">
          <div className="container-max section-padding">
            <TextReveal text="From Generic to Personalized" as="h2" className="prose-h2 text-center mb-16" />
            <ParallaxSection speed={0.3}>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }} className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-xl text-gray-400 mb-4">Generic Video</h3>
                  <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Generic Content</span>
                  </div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }} className="bg-gradient-to-br from-primary-900/30 to-accent-900/30 rounded-xl p-6">
                  <h3 className="text-xl text-primary-400 mb-4">Personalized Video</h3>
                  <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                    <span className="text-primary-300">AI-Personalized Content</span>
                  </div>
                </motion.div>
              </div>
            </ParallaxSection>
          </div>
        </section>
      </SectionReveal>

      {/* 6. Personalization Simulator - premium */}
      <section className="py-20 bg-gray-950">
        <div className="container-max section-padding">
          <PersonalizationSimulator />
        </div>
      </section>

      {/* 7. Personalization Workflow (from original) */}
      <Suspense fallback={<SectionLoader />}>
        <PersonalizationWorkflowSection />
      </Suspense>

      {/* 8. Tools Carousel (from original) */}
      <Suspense fallback={<SectionLoader />}>
        <ToolsCarouselSection />
      </Suspense>

      {/* 6. Personalization Simulator - premium */}
      <SectionReveal delay={0.05}>
        <section className="py-20 bg-gray-950">
          <div className="container-max section-padding">
            <PersonalizationSimulator />
          </div>
        </section>
      </SectionReveal>

      {/* 7. Personalization Workflow (from original) */}
      <SectionReveal delay={0.1}>
        <Suspense fallback={<SectionLoader />}>
          <PersonalizationWorkflowSection />
        </Suspense>
      </SectionReveal>

      {/* 8. Tools Carousel (from original) */}
      <SectionReveal delay={0.15}>
        <Suspense fallback={<SectionLoader />}>
          <ToolsCarouselSection />
        </Suspense>
      </SectionReveal>

      {/* 9. Deep Benefits (Alternating blocks) - premium */}
      <SectionReveal delay={0.2}>
        <section className="py-20 bg-gray-950">
          <div className="container-max section-padding">
            <div className="space-y-20">
              {[
                { title: "90% Faster Marketing Creation", desc: "Create personalized videos in minutes, not hours with AI automation", icon: <Clock className="h-6 w-6 text-primary-400" /> },
                { title: "Enterprise-Grade Security", desc: "Your data is protected with military-grade encryption and compliance", icon: <Shield className="h-6 w-6 text-primary-400" /> },
                { title: "Professional Marketing Results", desc: "Achieve 350% higher conversions with AI personalization", icon: <Star className="h-6 w-6 text-primary-400" /> },
                { title: "350% Higher Conversions", desc: "Personalized content drives dramatically better engagement", icon: <TrendingUp className="h-6 w-6 text-primary-400" /> },
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                >
                  <InteractiveCard tiltStrength={5}>
                    <div className={`grid md:grid-cols-2 gap-8 items-center ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                      <div className={i % 2 === 1 ? 'order-2' : 'order-1'}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-primary-900/40 rounded-lg">{benefit.icon}</div>
                          <h3 className="text-2xl font-bold">{benefit.title}</h3>
                        </div>
                        <p className="text-gray-300">{benefit.desc}</p>
                      </div>
                      <div className={i % 2 === 1 ? 'order-1' : 'order-2'}>
                        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }} className="h-48 bg-gray-800 rounded-xl flex items-center justify-center">
                          <span className="text-gray-500">Benefit Visualization</span>
                        </motion.div>
                      </div>
                    </div>
                  </InteractiveCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* 10. Benefits Section (from original) */}
      <SectionReveal delay={0.1}>
        <Suspense fallback={<SectionLoader />}>
          <ErrorBoundary fallback={<div className="py-12 text-center text-gray-400">Benefits section temporarily unavailable.</div>}>
            <BenefitsSection />
          </ErrorBoundary>
        </Suspense>
      </SectionReveal>

      {/* 11. App Gallery (from original) */}
      <SectionReveal delay={0.15}>
        <Suspense fallback={<SectionLoader />}>
          <AppGallerySection />
        </Suspense>
      </SectionReveal>

      {/* 12. Bundle Showcase - NEW SECTION */}
      <SectionReveal delay={0.1}>
        <BundleShowcaseSection />
      </SectionReveal>

      {/* 13. Integrations Section - NEW SECTION */}
      <SectionReveal delay={0.2}>
        <section className="py-20 bg-gray-900">
          <div className="container-max section-padding">
            <TextReveal text="Seamless Integrations" as="h2" className="prose-h2 text-center mb-16" />
            <p className="text-gray-300 text-center max-w-2xl mx-auto mb-12">
              Connect VideoRemix.vip with your favorite tools and platforms for a streamlined workflow
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { name: "Salesforce", color: "text-blue-400" },
                { name: "HubSpot", color: "text-orange-400" },
                { name: "Shopify", color: "text-green-400" },
                { name: "Mailchimp", color: "text-purple-400" },
                { name: "Google Analytics", color: "text-blue-300" },
                { name: "Mixpanel", color: "text-yellow-400" },
                { name: "BigQuery", color: "text-indigo-400" },
                { name: "Slack", color: "text-lime-400" },
                { name: "Zapier", color: "text-red-400" },
                { name: "API", color: "text-cyan-400" },
              ].map((integration, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="bg-gray-800/50 rounded-lg p-4 text-center hover:bg-gray-700/50 transition-colors cursor-default"
                >
                  <div className={`text-2xl font-bold ${integration.color}`}>{integration.name}</div>
                </motion.div>
              ))}
            </div>
            <motion.div className="text-center mt-8" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <button className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                View all 20+ integrations →
              </button>
            </motion.div>
          </div>
        </section>
      </SectionReveal>

      {/* 14. Resources/Blog Section - NEW SECTION */}
      <SectionReveal delay={0.2}>
        <section className="py-20 bg-gray-950">
          <div className="container-max section-padding">
            <TextReveal text="Resources & Insights" as="h2" className="prose-h2 text-center mb-16" />
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "AI Personalization Trends 2026",
                  desc: "Industry insights and predictions",
                  date: "May 10, 2026",
                  tag: "Report"
                },
                {
                  title: "ROI Calculator Guide",
                  desc: "How to measure personalization impact",
                  date: "May 5, 2026",
                  tag: "Guide"
                },
                {
                  title: "Case Study: 300% Engagement Lift",
                  desc: "How Company X transformed their marketing",
                  date: "Apr 28, 2026",
                  tag: "Case Study"
                },
              ].map((article, i) => (
                <InteractiveCard key={i}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    whileHover={{ y: -6 }}
                    className="bg-gray-900/50 backdrop-blur rounded-xl p-6 h-full"
                  >
                    <span className="px-2 py-1 bg-primary-600/20 text-primary-300 text-xs rounded-full font-medium">
                      {article.tag}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-3 mb-2">{article.title}</h3>
                    <p className="text-gray-400 text-sm mb-4">{article.desc}</p>
                    <div className="text-xs text-gray-500">{article.date}</div>
                  </motion.div>
                </InteractiveCard>
              ))}
            </div>
            <div className="text-center mt-8">
              <button className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Visit Resource Center →
              </button>
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* 12. Scannable Features - premium */}
      <SectionReveal delay={0.2}>
        <section className="py-20 bg-gray-900">
          <div className="container-max section-padding">
            <TextReveal text="Key Features" as="h2" className="prose-h2 text-center mb-16" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: <Sparkles className="h-8 w-8 text-primary-400" />, label: "AI-Powered" },
                { icon: <Award className="h-8 w-8 text-primary-400" />, label: "Award Winning" },
                { icon: <CheckCircle className="h-8 w-6 text-primary-400" />, label: "Easy to Use" },
                { icon: <TrendingUp className="h-8 w-8 text-primary-400" />, label: "Proven Results" },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ scale: 1.1, rotate: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <FloatingIcon icon={feature.icon} tooltip={feature.label} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* 13. Mid-Page CTA - premium */}
      <SectionReveal delay={0.2}>
        <section className="py-20 bg-gradient-to-br from-primary-900/30 to-accent-900/30">
          <div className="container-max section-padding text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="prose-h2 mb-4"
            >
              Ready to Transform Your Marketing?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-gray-300 mb-8"
            >
              Join 12,467+ marketers using VideoRemix
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button className="bg-white text-primary-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 shadow-lg transition-colors">
                Get Started Now
              </button>
            </motion.div>
          </div>
        </section>
      </SectionReveal>

      {/* 14. ROI Calculator - premium */}
      <SectionReveal delay={0.2}>
        <section className="py-20 bg-[#0f0d2b] relative overflow-hidden">
          <GradientOrb className="absolute top-20 right-20 w-64 h-64 opacity-20" />
          <ParticleBackground particleCount={30} className="opacity-30" />
          <div className="container-max section-padding relative z-10">
            <TextReveal text="ROI Calculator" className="text-2xl font-bold text-white mb-2" />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-gray-400 mb-6"
            >
              Calculate your personalization ROI
            </motion.p>
            <ROICalculator />
          </div>
        </section>
      </SectionReveal>

      {/* 15. What's Included - premium */}
      <SectionReveal delay={0.2}>
        <section className="py-20 bg-gray-950">
          <div className="container-max section-padding">
            <TextReveal text="What's Included" as="h2" className="prose-h2 text-center mb-16" />
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "AI Video Personalization", desc: "Automatic video customization" },
                { title: "Analytics Dashboard", desc: "Track performance in real-time" },
                { title: "Template Library", desc: "500+ professional templates" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-gray-900 rounded-xl p-6 transition-shadow hover:shadow-xl hover:shadow-primary-500/10"
                >
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* 16. Demo Section (from original) */}
      <SectionReveal delay={0.1}>
        <Suspense fallback={<SectionLoader />}>
          <DemoSection />
        </Suspense>
      </SectionReveal>

      {/* 17. Case Studies (from original) */}
      <SectionReveal delay={0.1}>
        <Suspense fallback={<SectionLoader />}>
          <CaseStudiesSection />
        </Suspense>
      </SectionReveal>

      {/* 18. Testimonials (from original) */}
      <SectionReveal delay={0.15}>
        <Suspense fallback={<SectionLoader />}>
          <ErrorBoundary fallback={<div className="py-12 text-center text-gray-400">Testimonials temporarily unavailable.</div>}>
            <TestimonialsSection />
          </ErrorBoundary>
        </Suspense>
      </SectionReveal>

      {/* 19. Hero Stats Section (from original) */}
      <SectionReveal delay={0.2}>
        <section className="py-16 bg-gradient-to-b from-[#0f0d2b] to-[#1e1b4a]">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Trusted by Marketing Teams Worldwide
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary-600 to-violet-500 mx-auto rounded-full"></div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <InteractiveCard>
                <AnimatedStatsCounter
                  from={0}
                  to={12467}
                  suffix="+"
                  label="Marketing Professionals"
                  icon={<Users className="h-8 w-8 text-primary-400" />}
                  className="bg-[#1e1b4a] p-6 rounded-xl border border-gray-700"
                />
              </InteractiveCard>
              <InteractiveCard>
                <AnimatedStatsCounter
                  from={0}
                  to={490}
                  suffix="%"
                  label="Average ROI Increase"
                  icon={<DollarSign className="h-8 w-8 text-green-400" />}
                  className="bg-[#1e1b4a] p-6 rounded-xl border border-gray-700"
                />
              </InteractiveCard>
              <InteractiveCard>
                <AnimatedStatsCounter
                  from={0}
                  to={215}
                  suffix="%"
                  label="Engagement Improvement"
                  icon={<TrendingUp className="h-8 w-8 text-yellow-400" />}
                  className="bg-[#1e1b4a] p-6 rounded-xl border border-gray-700"
                />
              </InteractiveCard>
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* 20. Marketing Impact Statistics (from original) */}
      <SectionReveal delay={0.2}>
        <section className="py-20 bg-[#0f0d2b]">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center mb-16"
            >
              <TextReveal
                text="Marketing Impact By The Numbers"
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
              />
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Personalized marketing delivers measurable results across all key metrics
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { to: 215, suffix: "%", label: "Higher Engagement Rate", icon: <BarChart3 className="h-8 w-8 text-primary-400" /> },
                { to: 183, suffix: "%", label: "Better Conversion Rate", icon: <TrendingUp className="h-8 w-8 text-green-400" /> },
                { to: 300, suffix: "%", label: "ROI Improvement", icon: <DollarSign className="h-8 w-8 text-yellow-400" /> },
                { to: 500, suffix: "%", label: "More Time Watching Videos", icon: <Users className="h-8 w-8 text-purple-400" /> },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -6, scale: 1.03 }}
                >
                  <InteractiveCard>
                    <AnimatedStatsCounter
                      from={0}
                      to={stat.to}
                      suffix={stat.suffix}
                      label={stat.label}
                      icon={stat.icon}
                      className="bg-[#1e1b4a] p-6 rounded-xl border border-gray-700"
                    />
                  </InteractiveCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* 21. Logo Wall (from original with real logos) */}
      <SectionReveal delay={0.1}>
        <section className="py-20 bg-[#1e1b4a]">
          <div className="container mx-auto px-4">
            <LogoWall
              logos={[
                { name: "Netflix", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/2560px-Netflix_2015_logo.svg.png" },
                { name: "Adobe", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Adobe_Acrobat_DC_logo_2023.svg/512px-Adobe_Acrobat_DC_logo_2023.svg.png" },
                { name: "Spotify", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/512px-Spotify_logo_without_text.svg.png" },
                { name: "Airbnb", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Airbnb_Logo_B%C3%A9lo.svg/512px-Airbnb_Logo_B%C3%A9lo.svg.png" },
                { name: "Meta", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platform_logo.svg/512px-Meta_Platform_logo.svg.png" },
                { name: "Stripe", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/512px-Stripe_Logo%2C_revised_2016.svg.png" },
              ]}
            />
          </div>
        </section>
      </SectionReveal>

      {/* 22. Interactive Comparison Table (enhanced with original's 5-row data) */}
      <SectionReveal delay={0.2}>
        <section className="py-20 bg-[#0f0d2b]">
          <div className="container mx-auto px-4">
            <InteractiveComparisonTable
              title="Generic vs. Personalized Marketing"
              rows={[
                { feature: "Engagement Rate", generic: "2.3%", personalized: "5.3%", lift: "2.3x" },
                { feature: "Conversion Rate", generic: "2.23%", personalized: "6-8%", lift: "80%" },
                { feature: "ROI", generic: "Standard", personalized: true, lift: "5-8x" },
                { feature: "Customer Retention", generic: "38%", personalized: "64%", lift: "68%" },
                { feature: "Time to Convert", generic: "14 days", personalized: "5 days", lift: "64%" },
              ]}
            />
          </div>
        </section>
      </SectionReveal>

      {/* 23. FAQ Section (from original - uses LandingPageContext) */}
      <SectionReveal delay={0.1}>
        <Suspense fallback={<SectionLoader />}>
          <ErrorBoundary fallback={<div className="py-12 text-center text-gray-400">FAQ section temporarily unavailable.</div>}>
            <FAQSection />
          </ErrorBoundary>
        </Suspense>
      </SectionReveal>

      {/* 24. Visuals (Demo) - premium */}
      <SectionReveal delay={0.2}>
        <section className="py-20 bg-gray-950">
          <div className="container-max section-padding">
            <TextReveal text="See It In Action" as="h2" className="prose-h2 text-center mb-16" />
            <div className="max-w-4xl mx-auto">
              <InteractiveCard>
                <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1556155092-490a1ba16284?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80"
                       alt="Video Demo" className="w-full h-full object-cover" />
                </div>
              </InteractiveCard>
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* 25. Pricing Section (from original) */}
      <SectionReveal delay={0.1}>
        <Suspense fallback={<SectionLoader />}>
          <ErrorBoundary fallback={<div className="py-12 text-center text-gray-400">Pricing section temporarily unavailable.</div>}>
            <PricingSection />
          </ErrorBoundary>
        </Suspense>
      </SectionReveal>

      {/* 26. Guarantee Section (from original) */}
      <SectionReveal delay={0.1}>
        <Suspense fallback={<SectionLoader />}>
          <GuaranteeSection />
        </Suspense>
      </SectionReveal>

      {/* 27. Final CTA (from original) */}
      <SectionReveal delay={0.1}>
        <Suspense fallback={<SectionLoader />}>
          <FinalCTA />
        </Suspense>
      </SectionReveal>

      {/* 28. Final CTA - premium */}
      <SectionReveal delay={0.2}>
        <section className="py-20 bg-gradient-to-br from-primary-600 to-accent-600">
          <div className="container-max section-padding text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Ready to 3x Your Marketing ROI?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-white/80 mb-8"
            >
              Start your free trial today. No credit card required.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button className="bg-white text-primary-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
                Start Free Trial
              </button>
            </motion.div>
          </div>
        </section>
      </SectionReveal>

      {/* Floating Icons - Strategic positioning for each key section */}
      {/* Hero Section - Sparkles */}
      <FloatingIcon
        icon={<Sparkles className="h-6 w-6 text-primary-400" />}
        delay={0}
        tooltip="AI Marketing Platform"
        containerClassName="fixed top-20 right-20 hidden xl:block"
      />
      {/* Problem Section - AlertCircle */}
      <FloatingIcon
        icon={<AlertCircle className="h-6 w-6 text-accent-400" />}
        delay={0.5}
        tooltip="Problem Solver"
        containerClassName="fixed bottom-40 left-16 hidden md:block"
      />
      {/* Big Promise Section - Target */}
      <FloatingIcon
        icon={<Target className="h-6 w-6 text-success-400" />}
        delay={1}
        tooltip="Business Value"
        containerClassName="fixed top-40 left-20 hidden lg:block"
      />
      {/* Personalization System - Brain */}
      <FloatingIcon
        icon={<Brain className="h-6 w-6 text-accent-400" />}
        delay={1.5}
        tooltip="AI Personalization"
        containerClassName="fixed top-1/3 right-16 hidden md:block"
      />
      {/* App Ecosystem - Grid icon */}
      <FloatingIcon
        icon={<div className="grid grid-cols-2 gap-0.5 w-4 h-4"><div className="bg-primary-400 rounded-sm"></div><div className="bg-primary-400 rounded-sm"></div><div className="bg-primary-400 rounded-sm"></div><div className="bg-primary-400 rounded-sm"></div></div>}
        delay={2}
        tooltip="12 App Categories"
        containerClassName="fixed top-1/2 right-24 hidden lg:block"
      />
      {/* Pricing Section - DollarSign */}
      <FloatingIcon
        icon={<DollarSign className="h-6 w-6 text-success-400" />}
        delay={2.5}
        tooltip="Pricing Options"
        containerClassName="fixed bottom-40 right-20 hidden md:block"
      />
      {/* ROI Section - TrendingUp */}
      <FloatingIcon
        icon={<TrendingUp className="h-6 w-6 text-success-400" />}
        delay={3}
        tooltip="ROI Impact"
        containerClassName="fixed top-1/4 left-16 hidden lg:block"
      />
      {/* Training Section - GraduationCap */}
      <FloatingIcon
        icon={<GraduationCap className="h-6 w-6 text-accent-400" />}
        delay={3.5}
        tooltip="Training & Support"
        containerClassName="fixed bottom-1/3 left-20 hidden md:block"
      />
      {/* FAQ Section - HelpCircle */}
      <FloatingIcon
        icon={<HelpCircle className="h-6 w-6 text-primary-400" />}
        delay={4}
        tooltip="FAQ Help"
        containerClassName="fixed bottom-20 left-1/4 hidden md:block"
      />
      {/* Footer CTA - ArrowRight */}
      <FloatingIcon
        icon={<ExternalLink className="h-6 w-6 text-secondary-400" />}
        delay={4.5}
        tooltip="Get Started"
        containerClassName="fixed bottom-20 right-1/4 hidden md:block"
      />
      {/* Original icons - kept for continuity */}
      <FloatingIcon
        icon={<Users className="h-6 w-6 text-violet-400" />}
        delay={1}
        tooltip="Audience Engagement"
        containerClassName="fixed bottom-20 right-20 hidden md:block"
      />
      <FloatingIcon
        icon={<Mail className="h-6 w-6 text-green-400" />}
        delay={2}
        tooltip="ROI Impact"
        containerClassName="fixed top-20 right-20 hidden md:block"
      />

      {/* Live Activity Feed - Fixed position (from original) */}
      <div className="fixed bottom-4 left-4 z-40 w-64 hidden md:block">
        <LiveActivityFeed />
      </div>

      {/* UI Components */}
      <ProgressIndicator />
      <StickyWidget />
      <BackToTop />
      <ExitIntentPopup />

      {/* Conversion Nudges - timed popups for marketing conversions */}
      <ConversionNudge
        headline="See it live in 60 seconds"
        message="Watch a personalized demo tailored to your industry."
        cta="Book Demo"
        delaySeconds={25}
      />
      <ConversionNudge
        headline="Join 12,467+ marketers"
        message="Start your free trial. No credit card required."
        cta="Start Free Trial"
        delaySeconds={45}
      />
    </main>
  );
};

export default LandingPage;
// Cache bust: 1778881602
// Deploy: 20260515214845
// Fix: 1778916542
// Final deploy: 1778916893
// final: 1778919573
