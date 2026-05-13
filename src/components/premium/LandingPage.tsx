import React from 'react';
import { Helmet } from 'react-helmet-async';
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
import { Sparkles, Award, Clock, Shield, Star, CheckCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * LandingPage component for the premium section of VideoRemix.vip.
 *
 * This is the comprehensive million-dollar landing page implementing the 12-section
 * ConversionWise anatomy with Impeccable design principles.
 *
 * Sections:
 * 1. Above the Fold Hero
 * 2. Transformation Section (Before/After)
 * 3. Deep Benefits (Image+Text blocks)
 * 4. Scannable Features (Icon grid)
 * 5. Mid-Page CTA
 * 6. What's Included
 * 7. Social Proof (Testimonials)
 * 8. UGC Strip
 * 9. Comparison Table
 * 10. FAQ
 * 11. Visuals (Demo)
 * 12. Final CTA
 */
const LandingPage: React.FC = () => {
  const testimonials = [
    {
      quote: "The personalization tools helped us achieve a 215% increase in marketing engagement and 3X more campaign leads.",
      name: "David Chen",
      role: "Marketing Director",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150",
      rating: 5,
      metrics: [
        { label: "Engagement Lift", value: "215%" },
        { label: "Cost Saved", value: "$50K" },
        { label: "Time Saved", value: "80%" },
      ],
    },
    {
      quote: "I create custom marketing content for different audience segments in minutes. My conversion rates have doubled since using VideoRemix.",
      name: "Sarah Wilson",
      role: "Digital Marketing Lead",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150",
      rating: 5,
      metrics: [
        { label: "ROI Increase", value: "150%" },
        { label: "Campaigns", value: "500+" },
        { label: "Satisfaction", value: "100%" },
      ],
    },
  ];

  return (
    <main className="bg-gray-950 text-white min-h-screen">
      {/* SEO Meta */}
      <Helmet>
        <title>VideoRemix.vip - AI-Powered Video Personalization Platform</title>
        <meta name="description" content="Transform your video marketing with AI-powered personalization. Create engaging, personalized videos at scale." />
      </Helmet>

      {/* 1. Above the Fold Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ParticleBackground particleCount={50} className="absolute inset-0" />
        <GradientOrb className="absolute top-20 left-20" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <AnimatedBorderGradient>
            <h1 className="prose-h1 text-white mb-6">
              <TypedText texts={["Impeccable AI Video Personalization", "Transform Your Marketing"]} />
            </h1>
          </AnimatedBorderGradient>
          <p className="prose-body text-gray-300 mb-10 mx-auto">
            Transform generic videos into personalized experiences that drive 5x higher engagement at scale.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="bg-gradient-to-r from-primary-600 to-accent-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-primary-600/25">
              Start Free Trial
            </button>
            <button className="border border-gray-600 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* 2. Transformation Section (Before/After) */}
      <section className="py-20 bg-gray-900">
        <div className="container-max section-padding">
          <TextReveal text="From Generic to Personalized" as="h2" className="prose-h2 text-center mb-16" />
          <ParallaxSection speed={0.3}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl text-gray-400 mb-4">Generic Video</h3>
                <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Generic Content</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary-900/30 to-accent-900/30 rounded-xl p-6">
                <h3 className="text-xl text-primary-400 mb-4">Personalized Video</h3>
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <span className="text-primary-300">AI-Personalized Content</span>
                </div>
              </div>
            </div>
          </ParallaxSection>
        </div>
      </section>

      {/* 2.5 Personalization Simulator */}
      <section className="py-20 bg-gray-950">
        <div className="container-max section-padding">
          <PersonalizationSimulator />
        </div>
      </section>

      {/* 3. Deep Benefits (Alternating blocks) */}
      <section className="py-20 bg-gray-950">
        <div className="container-max section-padding">
          <div className="space-y-20">
            {[
              { title: "90% Faster Marketing Creation", desc: "Create personalized videos in minutes, not hours with AI automation", icon: <Clock className="h-6 w-6 text-primary-400" /> },
              { title: "Enterprise-Grade Security", desc: "Your data is protected with military-grade encryption and compliance", icon: <Shield className="h-6 w-6 text-primary-400" /> },
              { title: "Professional Marketing Results", desc: "Achieve 350% higher conversions with AI personalization", icon: <Star className="h-6 w-6 text-primary-400" /> },
              { title: "350% Higher Conversions", desc: "Personalized content drives dramatically better engagement", icon: <TrendingUp className="h-6 w-6 text-primary-400" /> },
            ].map((benefit, i) => (
              <InteractiveCard key={i} tiltStrength={5}>
                <div className={`grid md:grid-cols-2 gap-8 items-center ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                  <div className={i % 2 === 1 ? 'order-2' : 'order-1'}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-primary-900/40 rounded-lg">{benefit.icon}</div>
                      <h3 className="text-2xl font-bold">{benefit.title}</h3>
                    </div>
                    <p className="text-gray-300">{benefit.desc}</p>
                  </div>
                  <div className={i % 2 === 1 ? 'order-1' : 'order-2'}>
                    <div className="h-48 bg-gray-800 rounded-xl flex items-center justify-center">
                      <span className="text-gray-500">Benefit Visualization</span>
                    </div>
                  </div>
                </div>
              </InteractiveCard>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Scannable Features */}
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
              <FloatingIcon key={i} icon={feature.icon} tooltip={feature.label} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Mid-Page CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-900/30 to-accent-900/30">
        <div className="container-max section-padding text-center">
          <h2 className="prose-h2 mb-4">Ready to Transform Your Marketing?</h2>
          <p className="text-gray-300 mb-8">Join 12,467+ marketers using VideoRemix</p>
          <button className="bg-white text-primary-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
            Get Started Now
          </button>
        </div>
      </section>

      {/* 5.5 ROI Calculator */}
      <section className="py-20 bg-gray-900">
        <div className="container-max section-padding">
          <ROICalculator />
        </div>
      </section>

      {/* 6. What's Included */}
      <section className="py-20 bg-gray-950">
        <div className="container-max section-padding">
          <TextReveal text="What's Included" as="h2" className="prose-h2 text-center mb-16" />
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "AI Video Personalization", desc: "Automatic video customization" },
              { title: "Analytics Dashboard", desc: "Track performance in real-time" },
              { title: "Template Library", desc: "500+ professional templates" },
            ].map((item, i) => (
              <motion.div key={i} className="bg-gray-900 rounded-xl p-6">
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Social Proof (Testimonials) */}
      <section className="py-20 bg-gray-900">
        <div className="container-max section-padding">
          <TextReveal text="What Our Customers Say" as="h2" className="prose-h2 text-center mb-16" />
          <div className="grid md:grid-cols-2 gap-8">
            <AnimatedTestimonialCard testimonials={testimonials} />
            <LiveActivityFeed className="hidden md:block" />
          </div>
        </div>
      </section>

      {/* 8. UGC Strip - Stats */}
      <section className="py-16 bg-gray-900/50">
        <div className="container-max section-padding">
          <LogoWall
            title="Trusted by innovative companies worldwide"
            logos={[
              { name: "TechCorp", url: "https://via.placeholder.com/120x40?text=TechCorp" },
              { name: "StartupX", url: "https://via.placeholder.com/120x40?text=StartupX" },
              { name: "EnterpriseCo", url: "https://via.placeholder.com/120x40?text=EnterpriseCo" },
              { name: "InnovateInc", url: "https://via.placeholder.com/120x40?text=InnovateInc" },
            ]}
          />
        </div>
      </section>

      <section className="py-16 bg-gray-900/50">
        <div className="container-max section-padding">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 12467, label: "Marketing Professionals", prefix: "" },
              { value: 215, label: "Avg Engagement Lift %", prefix: "" },
              { value: 500, label: "Templates Available", prefix: "" },
              { value: 4.9, label: "User Rating", suffix: "/5" },
            ].map((stat, i) => (
              <AnimatedStatsCounter
                key={i}
                from={0}
                to={stat.value}
                label={stat.label}
                prefix={stat.prefix}
                suffix={stat.suffix}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 9. Comparison Table */}
      <section className="py-20 bg-gray-950">
        <div className="container-max section-padding">
          <InteractiveComparisonTable
            title="Generic vs. Personalized Marketing"
            rows={[
              { feature: "Engagement Rate", generic: "2.3%", personalized: "5.3%", lift: "2.3x" },
              { feature: "Conversion Rate", generic: "2.23%", personalized: "6-8%", lift: "80%" },
              { feature: "ROI", generic: "Standard", personalized: true, lift: "5-8x" },
            ]}
          />
        </div>
      </section>

      {/* 10. FAQ */}
      <section className="py-20 bg-gray-900/50">
        <div className="container-max section-padding">
          <TextReveal text="Frequently Asked Questions" as="h2" className="prose-h2 text-center mb-16" />
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: "Is my data secure?", a: "Yes, we use enterprise-grade encryption for all customer data." },
              { q: "How long does it take to create videos?", a: "Most videos are created in under 5 minutes." },
              { q: "Can I customize the AI output?", a: "Absolutely! You have full control over personalization rules." },
            ].map((faq, i) => (
              <div key={i} className="bg-gray-900 rounded-lg p-4">
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-gray-300 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Visuals (Demo) */}
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

      {/* 12. Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-accent-600">
        <div className="container-max section-padding text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to 3x Your Marketing ROI?</h2>
          <p className="text-white/80 mb-8">Start your free trial today. No credit card required.</p>
          <button className="bg-white text-primary-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
            Start Free Trial
          </button>
        </div>
      </section>

      {/* Additional UI Components */}
      <ProgressIndicator />
      <StickyWidget />
      <BackToTop />
      <ExitIntentPopup />
    </main>
  );
};

export default LandingPage;
