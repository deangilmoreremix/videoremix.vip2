import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PricingSection } from '../components/PricingSection';
import { FinalCTA } from '../components/FinalCTA';
import { FAQSection } from '../components/FAQSection';

const PricingPage: React.FC = () => {
  return (
    <main className="w-full">
      <Helmet>
        <title>Pricing | VideoRemix.vip</title>
        <meta name="description" content="Choose the perfect plan for your marketing personalization needs with VideoRemix.vip. From free to enterprise, we have the right pricing for you." />
      </Helmet>
      
      <section id="pricing-hero" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 gradient-text">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-300 mb-10">
              Choose the perfect plan for your creative needs. No hidden fees, cancel anytime.
            </p>
          </div>
        </div>
      </section>
      
      <PricingSection />
      
      <FAQSection 
        title="Pricing FAQ"
        subtitle="Common questions about our pricing plans"
        faqs={[
          { 
            question: "Can I change plans at any time?", 
            answer: "Yes, you can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the start of your next billing cycle." 
          },
          { 
            question: "Is there a free trial available?", 
            answer: "Yes! We offer a 14-day free trial on all paid plans so you can experience the full power of VideoRemix.vip before committing." 
          },
          { 
            question: "Do you offer refunds?", 
            answer: "We offer a 30-day money-back guarantee if you're not satisfied with our service for any reason." 
          },
          { 
            question: "What payment methods do you accept?", 
            answer: "We accept all major credit cards, PayPal, and Apple Pay. For Enterprise plans, we can also arrange invoicing." 
          },
          { 
            question: "Are there any hidden fees?", 
            answer: "No hidden fees ever! The price you see is the price you pay. Usage limits are clearly stated on each plan." 
          },
          { 
            question: "Do you offer discounts for non-profits or educational institutions?", 
            answer: "Yes, we offer special pricing for qualified non-profits, educational institutions, and student creators. Contact our sales team for details." 
          }
        ]}
      />
      
      <FinalCTA />
    </main>
  );
};

export default PricingPage;