import React from 'react';
import { Video, ChevronRight, Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin, Shield, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { featuresData } from '../data/featuresData';
import { appsData } from '../data/appsData';

const SpecialFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  // Get popular apps for footer links
  const popularApps = appsData.filter(app => app.popular).slice(0, 5);

  // Main section groups
  const footerSections = {
    product: [
      { name: 'Features', url: '/features' },
      { name: 'Pricing', url: '/pricing' },
      { name: 'Apps', url: '/apps' },
      { name: 'Templates', url: '/templates' },
      { name: 'Integrations', url: '/integrations' },
      { name: 'Changelog', url: '/changelog' },
      { name: 'Roadmap', url: '/roadmap' }
    ],
    resources: [
      { name: 'Blog', url: '/blog' },
      { name: 'Help Center', url: '/help' },
      { name: 'Tutorials', url: '/tutorials' },
      { name: 'Documentation', url: '/docs' },
      { name: 'Guides', url: '/guides' },
      { name: 'API Reference', url: '/api' }
    ],
    solutions: [
      { name: 'For Content Creators', url: '/solutions/creators' },
      { name: 'For Marketers', url: '/solutions/marketers' },
      { name: 'For Small Businesses', url: '/solutions/small-business' },
      { name: 'For Enterprise', url: '/solutions/enterprise' },
      { name: 'For Education', url: '/solutions/education' },
      { name: 'For Non-Profits', url: '/solutions/non-profits' }
    ],
    company: [
      { name: 'About Us', url: '/about' },
      { name: 'Careers', url: '/careers' },
      { name: 'Contact Us', url: '/contact' },
      { name: 'Partners', url: '/partners' },
      { name: 'Affiliate Program', url: '/affiliates' }
    ],
    legal: [
      { name: 'Terms of Service', url: '/terms' },
      { name: 'Privacy Policy', url: '/privacy' },
      { name: 'Cookie Policy', url: '/cookies' },
      { name: 'GDPR Compliance', url: '/gdpr' },
      { name: 'Security', url: '/security' }
    ]
  };

  return (
    <footer className="py-12 bg-gray-900 text-gray-400 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Top section with logo, description and newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          {/* Company Info */}
          <div className="md:col-span-5">
            <div className="flex items-center mb-4">
              <Video className="h-6 w-6 text-primary-500 mr-2" />
              <span className="text-xl font-bold text-white">VideoRemix.vip</span>
            </div>
            <p className="mb-4">
              Create personalized content in minutes with our AI-powered platform. Perfect for marketers, content creators, and businesses of all sizes.
            </p>
            
            {/* Social Media */}
            <div className="flex space-x-4 mb-6">
              <a href="#facebook" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#twitter" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#instagram" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#linkedin" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="#youtube" className="text-gray-400 hover:text-white transition-colors">
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </a>
            </div>
            
            {/* Contact Details */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-primary-400" />
                <a href="mailto:hello@videoremix.vip" className="hover:text-white transition-colors">hello@videoremix.vip</a>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-primary-400" />
                <a href="tel:+1-555-123-4567" className="hover:text-white transition-colors">+1 (555) 123-4567</a>
              </div>
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-1 text-primary-400" />
                <address className="not-italic">
                  123 Innovation Way<br />
                  San Francisco, CA 94107<br />
                  United States
                </address>
              </div>
            </div>
          </div>
          
          {/* Newsletter and Download Links */}
          <div className="md:col-span-7 md:pl-8 md:border-l md:border-gray-700">
            <h3 className="text-white font-semibold text-lg mb-4">Stay up to date</h3>
            <p className="mb-4">Get the latest news, updates, and tips straight to your inbox.</p>
            
            <div className="flex mb-6">
              <input 
                type="email" 
                placeholder="Your email" 
                className="bg-gray-800 border border-gray-700 text-white px-4 py-2 w-full max-w-xs rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-r-lg font-medium transition-colors">
                Subscribe
              </button>
            </div>
            
            {/* App downloads */}
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">Get our mobile app</h3>
              <div className="flex flex-wrap gap-4">
                <a href="#app-store">
                  <img 
                    src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
                    alt="Download on the App Store" 
                    className="h-10" 
                  />
                </a>
                <a href="#google-play">
                  <img 
                    src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                    alt="Get it on Google Play" 
                    className="h-10" 
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Footer Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Product */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerSections.product.map((link, i) => (
                <li key={i}>
                  <Link to={link.url} className="hover:text-white transition-colors inline-flex items-center">
                    <ChevronRight className="h-3 w-3 mr-1" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Resources */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerSections.resources.map((link, i) => (
                <li key={i}>
                  <Link to={link.url} className="hover:text-white transition-colors inline-flex items-center">
                    <ChevronRight className="h-3 w-3 mr-1" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Solutions */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold mb-4">Solutions</h3>
            <ul className="space-y-2">
              {footerSections.solutions.map((link, i) => (
                <li key={i}>
                  <Link to={link.url} className="hover:text-white transition-colors inline-flex items-center">
                    <ChevronRight className="h-3 w-3 mr-1" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Company */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerSections.company.map((link, i) => (
                <li key={i}>
                  <Link to={link.url} className="hover:text-white transition-colors inline-flex items-center">
                    <ChevronRight className="h-3 w-3 mr-1" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Popular Features */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold mb-4">Top Features</h3>
            <ul className="space-y-2">
              {/* Key features */}
              {featuresData.slice(0, 4).map((feature) => (
                <li key={feature.id}>
                  <Link to={`/features/${feature.id}`} className="hover:text-white transition-colors inline-flex items-center">
                    <ChevronRight className="h-3 w-3 mr-1" />
                    {feature.title}
                  </Link>
                </li>
              ))}
              
              {/* Popular apps */}
              {popularApps.slice(0, 3).map((app) => (
                <li key={app.id}>
                  <Link to={`/app/${app.id}`} className="hover:text-white transition-colors inline-flex items-center">
                    <ChevronRight className="h-3 w-3 mr-1" />
                    {app.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 items-center py-6 border-t border-b border-gray-800 mb-8">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-primary-400 mr-2" />
            <span className="text-sm">SOC 2 Compliant</span>
          </div>
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-primary-400 mr-2" />
            <span className="text-sm">GDPR Compliant</span>
          </div>
          <div className="flex items-center">
            <Globe className="h-5 w-5 text-primary-400 mr-2" />
            <span className="text-sm">Global CDN</span>
          </div>
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-primary-400 mr-2" />
            <span className="text-sm">99.9% Uptime</span>
          </div>
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-primary-400 mr-2" />
            <span className="text-sm">Bank-Level Encryption</span>
          </div>
        </div>
        
        {/* Bottom section - Copyright and Legal */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 text-sm">
            &copy; {currentYear} VideoRemix.vip. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            {footerSections.legal.map((link, i) => (
              <Link 
                key={i}
                to={link.url} 
                className="hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
        
        {/* Cookie notice */}
        <div className="mt-6 text-xs text-center text-gray-500">
          <p>
            VideoRemix.vip uses cookies to ensure you get the best experience on our website.
            By continuing to browse, you agree to our <Link to="/privacy" className="text-primary-400 hover:text-primary-300">privacy policy</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SpecialFooter;