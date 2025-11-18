import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, Twitter, Facebook, Linkedin, Copy, ArrowRight, MessageSquare } from 'lucide-react';
import MagicSparkles from '../components/MagicSparkles';

// Sample blog post data
// In a real application, this would likely be fetched from an API
const blogPosts = [
  {
    id: 'ai-video-revolution',
    title: 'How AI is Revolutionizing Video Creation in 2025',
    excerpt: 'Discover how artificial intelligence is transforming the video production landscape and making professional video creation accessible to everyone.',
    content: `
      <p>The landscape of video production has undergone a dramatic transformation in recent years, with artificial intelligence emerging as the driving force behind this revolution. As we move through 2025, the impact of AI on video creation continues to accelerate, democratizing what was once an exclusive domain requiring specialized skills, expensive equipment, and years of expertise.</p>
      
      <h2>The Evolution of Video Creation</h2>
      
      <p>Traditionally, creating professional-quality videos required a formidable combination of resources:</p>
      
      <ul>
        <li>Expensive cameras and equipment</li>
        <li>Technical expertise in filming and lighting</li>
        <li>Proficiency in complex editing software</li>
        <li>Significant time investment for post-production</li>
      </ul>
      
      <p>This high barrier to entry meant that high-quality video production was largely limited to established media companies, advertising agencies, and individuals with specialized training. The average business owner, marketer, or content creator was effectively excluded from leveraging video to its full potential.</p>
      
      <h2>Enter AI-Powered Video Creation</h2>
      
      <p>The integration of AI into video production workflows has fundamentally altered this dynamic. Today's AI-powered platforms can:</p>
      
      <ul>
        <li>Generate complete videos from text prompts or basic outlines</li>
        <li>Automatically enhance footage quality, adjust lighting, and stabilize shaky shots</li>
        <li>Identify and compile the most engaging segments from longer recordings</li>
        <li>Create seamless transitions and professional effects without manual editing</li>
        <li>Generate natural-sounding voiceovers in multiple languages and accents</li>
        <li>Optimize video formatting for multiple platforms simultaneously</li>
      </ul>
      
      <p>These capabilities have reduced what once took days or weeks to mere minutes, while simultaneously improving the quality of the end product.</p>
      
      <h2>The Democratization of Video Production</h2>
      
      <p>The most profound impact of AI on video creation has been its democratizing effect. Today, with minimal technical knowledge and modest equipment, creators can produce content that rivals professionally produced videos from just a few years ago.</p>
      
      <p>This democratization is evident across multiple domains:</p>
      
      <h3>For Small Businesses and Entrepreneurs</h3>
      
      <p>Small business owners can now create compelling product demonstrations, customer testimonials, and marketing videos without outsourcing to expensive agencies. This levels the playing field, allowing them to compete with larger brands in the visual content space.</p>
      
      <h3>For Content Creators</h3>
      
      <p>Independent content creators can increase their production volume and quality without expanding their team or equipment. What once required a full production crew can now be accomplished by a single creator with AI assistance.</p>
      
      <h3>For Educators</h3>
      
      <p>Teachers and instructional designers can create engaging educational content with professional polish, enhancing learning experiences without specialized media training.</p>
      
      <h2>The Technical Innovations Driving Change</h2>
      
      <p>Several key technological advancements are powering this revolution:</p>
      
      <h3>Generative AI Models</h3>
      
      <p>Large language models and diffusion models can now generate visual content based on text descriptions, creating scenes that don't exist in reality or would be prohibitively expensive to film.</p>
      
      <h3>Computer Vision</h3>
      
      <p>Advanced computer vision algorithms can analyze video content to identify optimal cut points, recognize objects and people, and understand the visual flow of a scene.</p>
      
      <h3>Natural Language Processing</h3>
      
      <p>NLP enables the analysis of scripts and spoken content to automatically generate appropriate visuals, captions, and B-roll footage that aligns with the narrative.</p>
      
      <h3>Audio Intelligence</h3>
      
      <p>AI can now generate realistic voiceovers, reduce background noise, enhance audio quality, and even create custom music that matches the emotional tone of a video.</p>
      
      <h2>Looking to the Future</h2>
      
      <p>As we continue through 2025 and beyond, several trends are emerging that will further transform video creation:</p>
      
      <h3>Hyper-Personalization</h3>

      <p>AI is enabling the creation of dynamically personalized content that adapt their content based on the viewer's preferences, behavior, or demographic information.</p>
      
      <h3>Real-Time Collaboration</h3>
      
      <p>Cloud-based AI tools are facilitating simultaneous editing and feedback from team members around the world, further streamlining the production process.</p>
      
      <h3>Ethical Considerations</h3>
      
      <p>As AI-generated content becomes increasingly realistic, the industry is developing frameworks to ensure transparency and prevent misuse, such as clear labeling of AI-created elements.</p>
      
      <h2>Conclusion</h2>
      
      <p>The AI revolution in video creation represents a fundamental shift in how visual content is produced and consumed. By removing technical barriers and dramatically reducing time and resource requirements, AI has placed powerful video creation capabilities in the hands of everyday creators.</p>
      
      <p>This democratization doesn't signal the end of professional video production—rather, it elevates the baseline quality of all video content while allowing professionals to push the boundaries of what's possible even further.</p>
      
      <p>As we look ahead, one thing is clear: the ability to create compelling video content is no longer limited by technical skill or resource constraints. It's limited only by creativity and vision—a truly revolutionary development for creators everywhere.</p>
    `,
    category: 'Technology',
    author: 'Sarah Johnson',
    authorImage: 'https://randomuser.me/api/portraits/women/44.jpg',
    authorBio: 'Sarah is the Head of Content at VideoRemix.vip with over 10 years of experience in digital media and video production.',
    date: 'May 15, 2025',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    tags: ['AI', 'Video Production', 'Content Creation', 'Technology Trends']
  },
  // Other blog posts would be defined here
];

// Related posts component
const RelatedPosts = () => {
  // In a real app, you would filter these based on category, tags, etc.
  const relatedPosts = [
    {
      id: 'video-marketing-tips',
      title: '10 Video Marketing Tips to Boost Engagement and Conversions',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      date: 'May 8, 2025'
    },
    {
      id: 'content-repurposing',
      title: 'Content Repurposing: Turn One Video into Multiple Content Pieces',
      image: 'https://images.unsplash.com/photo-1592859600972-1b0834d83747?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      date: 'April 29, 2025'
    },
    {
      id: 'video-seo-guide',
      title: 'The Ultimate Guide to Video SEO in 2025',
      image: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      date: 'April 22, 2025'
    }
  ];
  
  return (
    <div>
      <h3 className="text-2xl font-bold text-white mb-6">Related Articles</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedPosts.map(post => (
          <motion.div 
            key={post.id}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <Link to={`/blog/${post.id}`} className="block bg-gray-800 rounded-lg overflow-hidden h-full border border-gray-700 hover:border-primary-500/50 transition-colors">
              <div className="aspect-video">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h4 className="text-lg font-semibold text-white mb-2 line-clamp-2">{post.title}</h4>
                <p className="text-gray-400 text-sm">{post.date}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const BlogPostPage: React.FC = () => {
  const { postId } = useParams<{postId: string}>();
  const post = blogPosts.find(post => post.id === postId);
  
  // Helper function to copy current page URL
  const copyPageUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    // In a real app, you would show a toast notification
    alert('Link copied to clipboard!');
  };
  
  if (!post) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-6">Post Not Found</h1>
        <p className="text-gray-300 mb-8">The article you're looking for doesn't exist or has been moved.</p>
        <Link 
          to="/blog" 
          className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Back to All Articles
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title} | VideoRemix.vip Blog</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={`${post.title} | VideoRemix.vip Blog`} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.image} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={new Date(post.date).toISOString()} />
        <meta property="article:author" content={post.author} />
        {post.tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
      </Helmet>

      <main className="pt-32 pb-20">
        <article>
          {/* Hero Section */}
          <section className="relative mb-16">
            {/* Back button */}
            <div className="container mx-auto px-4 mb-8">
              <Link 
                to="/blog" 
                className="inline-flex items-center text-primary-400 hover:text-primary-300"
              >
                <ChevronLeft className="mr-2 h-5 w-5" />
                Back to all articles
              </Link>
            </div>
            
            {/* Featured image */}
            <div className="relative h-[40vh] md:h-[50vh] mb-10">
              <div className="absolute inset-0">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-gray-900/20"></div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-primary-600/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                      {post.category}
                    </span>
                    {post.tags.map(tag => (
                      <span key={tag} className="bg-gray-800/80 backdrop-blur-sm text-gray-300 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <MagicSparkles minSparkles={3} maxSparkles={6}>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                      {post.title}
                    </h1>
                  </MagicSparkles>
                  
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center">
                      <img 
                        src={post.authorImage} 
                        alt={post.author} 
                        className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-primary-500/30"
                      />
                      <span className="text-white">{post.author}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{post.date}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-400">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Article Content */}
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <motion.div 
                  className="lg:col-span-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Social Sharing */}
                  <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-700">
                    <div className="text-gray-300">
                      Share this article:
                    </div>
                    <div className="flex space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.1, y: -3 }}
                        whileTap={{ scale: 0.9 }}
                        className="bg-gray-800 p-2 rounded-full text-primary-400 hover:bg-gray-700 transition-colors"
                        aria-label="Share on Twitter"
                      >
                        <Twitter className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1, y: -3 }}
                        whileTap={{ scale: 0.9 }}
                        className="bg-gray-800 p-2 rounded-full text-primary-400 hover:bg-gray-700 transition-colors"
                        aria-label="Share on Facebook"
                      >
                        <Facebook className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1, y: -3 }}
                        whileTap={{ scale: 0.9 }}
                        className="bg-gray-800 p-2 rounded-full text-primary-400 hover:bg-gray-700 transition-colors"
                        aria-label="Share on LinkedIn"
                      >
                        <Linkedin className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1, y: -3 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={copyPageUrl}
                        className="bg-gray-800 p-2 rounded-full text-primary-400 hover:bg-gray-700 transition-colors"
                        aria-label="Copy link"
                      >
                        <Copy className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Article content */}
                  <div className="prose prose-lg max-w-none prose-invert prose-headings:text-white prose-a:text-primary-400 prose-a:no-underline hover:prose-a:text-primary-300">
                    <div dangerouslySetInnerHTML={{ __html: post.content }} />
                  </div>
                  
                  {/* Tags */}
                  <div className="mt-12 pt-6 border-t border-gray-700">
                    <h3 className="text-white font-medium mb-3">Tagged with:</h3>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map(tag => (
                        <Link key={tag} to={`/blog?tag=${tag}`} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-primary-900/50 hover:text-primary-300 transition-colors">
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                  
                  {/* Author Bio */}
                  <div className="mt-12 p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      <img 
                        src={post.authorImage} 
                        alt={post.author} 
                        className="w-24 h-24 rounded-full object-cover border-2 border-primary-500/30"
                      />
                      <div>
                        <h4 className="text-xl font-bold text-white mb-2">{post.author}</h4>
                        <p className="text-gray-300 mb-4">{post.authorBio}</p>
                        <div className="flex space-x-3">
                          <a href="#twitter" className="text-primary-400 hover:text-primary-300">
                            <Twitter className="h-5 w-5" />
                          </a>
                          <a href="#linkedin" className="text-primary-400 hover:text-primary-300">
                            <Linkedin className="h-5 w-5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Comments Section */}
                  <div className="mt-12">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" /> Comments (5)
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Comment Form */}
                      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h4 className="text-white font-bold mb-4">Leave a comment</h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="name" className="block text-gray-300 mb-1">Name</label>
                              <input 
                                type="text" 
                                id="name" 
                                className="bg-gray-700 border border-gray-600 text-white rounded-lg w-full p-3 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                placeholder="Your name"
                              />
                            </div>
                            <div>
                              <label htmlFor="email" className="block text-gray-300 mb-1">Email</label>
                              <input 
                                type="email" 
                                id="email" 
                                className="bg-gray-700 border border-gray-600 text-white rounded-lg w-full p-3 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                placeholder="Your email"
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="comment" className="block text-gray-300 mb-1">Comment</label>
                            <textarea 
                              id="comment" 
                              rows={4}
                              className="bg-gray-700 border border-gray-600 text-white rounded-lg w-full p-3 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                              placeholder="Share your thoughts..."
                            ></textarea>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg"
                          >
                            Post Comment
                          </motion.button>
                        </div>
                      </div>
                      
                      {/* Sample Comments */}
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                          <div className="flex items-center mb-4">
                            <img 
                              src={`https://randomuser.me/api/portraits/${index % 2 ? 'women' : 'men'}/${20 + index}.jpg`} 
                              alt="Commenter" 
                              className="w-10 h-10 rounded-full mr-3 object-cover"
                            />
                            <div>
                              <h5 className="text-white font-medium">John Doe</h5>
                              <p className="text-gray-400 text-sm">May 18, 2025</p>
                            </div>
                          </div>
                          <p className="text-gray-300">
                            This article was incredibly insightful! I've been struggling with traditional video editing software for years, and AI-powered tools are definitely the future. Can't wait to see how this technology evolves in the coming years.
                          </p>
                          <button className="mt-3 text-primary-400 text-sm hover:text-primary-300">Reply</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
                
                {/* Sidebar */}
                <motion.div 
                  className="lg:col-span-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {/* Author Card */}
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
                    <div className="text-center mb-4">
                      <img 
                        src={post.authorImage} 
                        alt={post.author} 
                        className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-primary-500/30"
                      />
                      <h4 className="text-xl font-bold text-white">{post.author}</h4>
                      <p className="text-gray-400 text-sm">Content Strategist</p>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">
                      {post.authorBio}
                    </p>
                    <Link 
                      to="#author-profile" 
                      className="block text-center text-primary-400 hover:text-primary-300 font-medium"
                    >
                      View Profile
                    </Link>
                  </div>
                  
                  {/* Table of Contents */}
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8 sticky top-24">
                    <h4 className="text-white font-bold mb-4">Table of Contents</h4>
                    <nav className="space-y-2">
                      {[
                        "The Evolution of Video Creation",
                        "Enter AI-Powered Video Creation",
                        "The Democratization of Video Production",
                        "The Technical Innovations Driving Change",
                        "Looking to the Future",
                        "Conclusion"
                      ].map((heading, index) => (
                        <a 
                          key={index} 
                          href={`#${heading.toLowerCase().replace(/\s+/g, '-')}`} 
                          className="block text-gray-300 hover:text-primary-400 transition-colors text-sm py-1 border-l-2 border-gray-700 hover:border-primary-400 pl-3"
                        >
                          {heading}
                        </a>
                      ))}
                    </nav>
                  </div>
                  
                  {/* Newsletter */}
                  <div className="bg-gradient-to-br from-primary-900/40 to-primary-700/40 rounded-lg p-6 border border-primary-500/30 mb-8">
                    <h4 className="text-white font-bold mb-4">Subscribe to our Newsletter</h4>
                    <p className="text-gray-300 text-sm mb-4">
                      Get weekly insights and tips on video creation and AI technology.
                    </p>
                    <div className="space-y-3">
                      <input 
                        type="email" 
                        placeholder="Your email address" 
                        className="bg-gray-700/80 border border-gray-600 text-white rounded-lg w-full p-3 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 rounded-lg"
                      >
                        Subscribe
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
          
          {/* Related Posts */}
          <section className="py-16 bg-gradient-to-b from-transparent to-gray-900/50">
            <div className="container mx-auto px-4">
              <RelatedPosts />
            </div>
          </section>
          
          {/* CTA Section */}
          <section className="py-16 bg-gradient-to-r from-primary-900/40 to-primary-700/40">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="max-w-4xl mx-auto text-center"
              >
                <MagicSparkles minSparkles={3} maxSparkles={6}>
                  <h2 className="text-3xl font-bold text-white mb-6">
                    Ready to Transform Your Video Creation?
                  </h2>
                </MagicSparkles>
                
                <p className="text-xl text-gray-300 mb-8">
                  Experience the power of AI-driven video tools and create professional-quality content in minutes.
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-4 px-8 rounded-lg inline-flex items-center"
                >
                  Try VideoRemix.vip Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </motion.button>
              </motion.div>
            </div>
          </section>
        </article>
      </main>
    </>
  );
};

export default BlogPostPage;