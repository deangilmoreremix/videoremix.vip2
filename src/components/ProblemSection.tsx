import React from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, AlertTriangle, BarChart, Zap, Target, UserRoundX, MessageSquareOff, TrendingDown, Coins, EyeOff, Share2, LineChart, HandCoins, Presentation as PresentationChart, Megaphone, CircleDollarSign as CurrencyCircleDollar } from 'lucide-react';

const ProblemSection: React.FC = () => {
  return (
    <section id="problem" className="py-20 bg-gray-900">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Are You Still Creating <span className="text-primary-400">Generic, One-Size-Fits-All</span> Marketing Content?
          </h2>
          
          <p className="text-xl text-gray-300">
            In today's hyper-competitive marketing landscape, generic campaigns get ignored. Personalized marketing videos deliver up to 3x higher engagement, 5x better retention, and dramatically improved conversion rates across all your marketing channels.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: <UserRoundX className="h-10 w-10 text-red-500" />,
              title: "Generic Marketing Gets Ignored",
              description: "73% of prospects skip generic marketing videos within seconds, while personalized marketing videos have 5x longer watch times and 3x higher completion rates.",
              tag: "Engagement Crisis"
            },
            {
              icon: <Target className="h-10 w-10 text-red-500" />,
              title: "Different Market Segments Have Different Needs",
              description: "Your prospects at different buyer journey stages all need different messaging, yet most marketers serve identical content to everyone.",
              tag: "Audience Mismatch"
            },
            {
              icon: <MessageSquareOff className="h-10 w-10 text-red-500" />,
              title: "Generic Marketing Fails to Connect",
              description: "86% of consumers say personalization impacts their purchasing decisions, but only 12% of marketing videos contain any personalized elements.",
              tag: "Connection Gap"
            },
            {
              icon: <DollarSign className="h-10 w-10 text-red-500" />,
              title: "Lower Marketing Conversion Rates",
              description: "Non-personalized marketing videos convert 3X worse than personalized campaigns, with personalized marketing achieving conversion rates of up to 19% versus 6% for generic videos.",
              tag: "Revenue Loss"
            },
            {
              icon: <BarChart className="h-10 w-10 text-red-500" />,
              title: "Declining Marketing Performance Over Time",
              description: "The effectiveness gap between personalized and generic marketing is widening every year, with generic marketing performance dropping 18% annually.",
              tag: "Diminishing Returns"
            },
            {
              icon: <AlertTriangle className="h-10 w-10 text-red-500" />,
              title: "Competitive Disadvantage in Marketing",
              description: "67% of your competitors are already using personalized marketing to connect with your potential customers, creating a widening advantage gap.",
              tag: "Market Threat"
            }
          ].map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-red-500/50 transition-colors relative overflow-hidden"
            >
              {/* Tag in top right corner */}
              <div className="absolute top-2 right-2 bg-red-900/70 text-red-300 text-xs px-2 py-1 rounded-full">
                {problem.tag}
              </div>
              
              <div className="flex items-start">
                <div className="bg-red-500/10 p-3 rounded-lg mr-4">
                  {problem.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{problem.title}</h3>
                  <p className="text-gray-400">{problem.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center bg-gradient-to-r from-red-900/30 to-red-600/30 p-8 rounded-xl border border-red-500/20"
        >
          <h3 className="text-2xl font-bold text-white mb-6">
            The True Cost of Missing Marketing Personalization
          </h3>
          
          {/* Enhanced metrics visualization */}
          <div className="space-y-5 text-left mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { 
                  label: "Higher engagement with personalized marketing", 
                  cost: "Lost Audience Attention",
                  stat: "215%",
                  icon: <EyeOff className="h-5 w-5" />,
                  detail: "Prospects spend 3.2x longer watching personalized marketing videos"
                },
                { 
                  label: "Higher conversion rates with personalized marketing", 
                  cost: "Lost Conversions",
                  stat: "183%",
                  icon: <Coins className="h-5 w-5" />,
                  detail: "Average ROI increases 2.8x with personalized marketing campaigns"
                },
                { 
                  label: "Longer view time with personalized marketing videos", 
                  cost: "Lost Message Delivery",
                  stat: "157%",
                  icon: <Clock className="h-5 w-5" />,
                  detail: "Marketing messages are 2.4x more likely to be remembered"
                },
                { 
                  label: "More shares and social amplification of marketing", 
                  cost: "Lost Organic Reach",
                  stat: "287%",
                  icon: <Share2 className="h-5 w-5" />,
                  detail: "Free distribution through increased audience sharing of personalized marketing"
                }
              ].map((item, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="bg-red-900/20 p-4 rounded-lg border border-red-700/20 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-900/40 rounded-lg mr-3">
                        {item.icon}
                      </div>
                      <div className="text-3xl font-bold text-red-400">{item.stat}</div>
                    </div>
                    <div className="px-2 py-1 bg-red-950/50 rounded-md text-xs text-red-300 font-semibold">
                      {item.cost}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-300">{item.label}</div>
                  <div className="mt-1 text-xs text-gray-400 italic">{item.detail}</div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Industry-specific costs */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center justify-center">
              <LineChart className="h-5 w-5 mr-2 text-red-400" />
              Industry-Specific Marketing Impact of Generic Content
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {[
                {
                  industry: "E-commerce Marketing",
                  stat: "-42%",
                  impact: "Product video conversion rate"
                },
                {
                  industry: "B2B Marketing",
                  stat: "-67%",
                  impact: "Lead qualification rate"
                },
                {
                  industry: "Social Media Marketing",
                  stat: "-53%",
                  impact: "Audience engagement metrics"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  className="bg-gray-800/40 border border-red-900/20 p-3 rounded-lg"
                >
                  <div className="text-white font-medium mb-1">{item.industry}</div>
                  <div className="text-2xl font-bold text-red-500 mb-1">{item.stat}</div>
                  <div className="text-xs text-gray-400">{item.impact}</div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Marketing ROI impact */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center justify-center">
              <PresentationChart className="h-5 w-5 mr-2 text-red-400" />
              Marketing ROI Impact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-gray-800/30 rounded-lg">
              <div className="flex flex-col items-center">
                <div className="text-red-500 text-sm mb-1">Generic Marketing</div>
                <div className="flex items-center">
                  <CurrencyCircleDollar className="h-6 w-6 text-red-500 mr-2" />
                  <span className="text-3xl font-bold text-white">6%</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Average Conversion Rate</div>
                
                <div className="mt-3 bg-red-900/30 w-full p-2 rounded">
                  <div className="flex justify-between text-xs">
                    <span>$10,000 Spent</span>
                    <span>$36,000 Revenue</span>
                  </div>
                  <div className="mt-1 text-xs text-center text-red-400">
                    3.6x ROI
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="text-green-500 text-sm mb-1">Personalized Marketing</div>
                <div className="flex items-center">
                  <CurrencyCircleDollar className="h-6 w-6 text-green-500 mr-2" />
                  <span className="text-3xl font-bold text-white">19%</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Average Conversion Rate</div>
                
                <div className="mt-3 bg-green-900/30 w-full p-2 rounded">
                  <div className="flex justify-between text-xs">
                    <span>$10,000 Spent</span>
                    <span>$114,000 Revenue</span>
                  </div>
                  <div className="mt-1 text-xs text-center text-green-400">
                    11.4x ROI
                  </div>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Based on average campaign metrics across 1,000+ marketing campaigns
            </div>
          </div>
          
          {/* Long-term cost visualization */}
          <div className="mb-8 bg-black/30 rounded-lg p-5 border border-red-800/20">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 mr-2 text-red-400" />
              The Compounding Cost of Marketing Without Personalization
            </h4>
            <div className="flex flex-col space-y-3">
              <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-red-600/50 w-1/4 flex items-center justify-end px-2">
                  <span className="text-xs text-white">Today</span>
                </div>
              </div>
              <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-red-600/70 w-2/5 flex items-center justify-end px-2">
                  <span className="text-xs text-white">3 months</span>
                </div>
              </div>
              <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-red-600/90 w-3/5 flex items-center justify-end px-2">
                  <span className="text-xs text-white">6 months</span>
                </div>
              </div>
              <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-red-600 w-4/5 flex items-center justify-end px-2">
                  <span className="text-xs text-white">1 year</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-400 mt-3 italic">
              The marketing performance gap between personalized and generic content widens exponentially over time
            </div>
          </div>
          
          {/* Financial impact */}
          <div className="bg-red-950/30 p-4 rounded-lg mb-8 border border-red-800/30">
            <div className="flex items-center justify-center text-white mb-2">
              <HandCoins className="h-5 w-5 text-red-400 mr-2" />
              <h4 className="font-semibold">Annual Marketing Financial Impact</h4>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-black/30 p-2 rounded">
                <div className="text-gray-300">10,000 marketing video views</div>
                <div className="text-red-400 font-medium">$42,000 lost revenue</div>
              </div>
              <div className="bg-black/30 p-2 rounded">
                <div className="text-gray-300">100,000 marketing video views</div>
                <div className="text-red-400 font-medium">$420,000 lost revenue</div>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2 italic">Based on average 13% conversion gap and $250 customer value</div>
          </div>
          
          {/* Market share impact */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center justify-center">
              <Megaphone className="h-5 w-5 mr-2 text-red-400" />
              Market Dominance Impact
            </h4>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="grid grid-cols-5 gap-1">
                <div className="col-span-2">
                  <div className="bg-gray-700 h-8 rounded-l-xl"></div>
                  <div className="text-xs text-center mt-1">Your Business<br/>(Generic Marketing)</div>
                </div>
                <div className="col-span-3">
                  <div className="bg-primary-600/70 h-8 rounded-r-xl"></div>
                  <div className="text-xs text-center mt-1">Competitors<br/>(Personalized Marketing)</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-3 text-center">
                Companies using personalized marketing capture 60% more market share on average
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg text-gray-300 mb-6">
              The longer you delay implementing marketing personalization, <span className="font-bold text-red-400">the wider the performance gap grows</span> between your campaigns and your competitors' personalized marketing videos.
            </p>
            
            <motion.div
              initial={{ scale: 1 }}
              whileInView={{ scale: [1, 1.05, 1] }}
              viewport={{ once: false }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block"
            >
              <a 
                href="#solution" 
                className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-6 py-3 rounded-lg"
              >
                <span>Discover How VideoRemix.vip Personalizes Your Marketing</span>
                <Zap className="ml-2 h-5 w-5" />
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;