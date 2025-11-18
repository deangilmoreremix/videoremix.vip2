import React from 'react';
import { 
  Wand2, 
  Clock, 
  LayoutTemplate, 
  PencilRuler, 
  Globe, 
  Database, 
  MessageSquare, 
  Video, 
  Zap,
  Mic, 
  Bot, 
  Users,
  Sparkles,
  FileText,
  Layers
} from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  videoUrl?: string;
  keyPoints: string[];
  benefits: {
    title: string;
    description: string;
  }[];
  useCases: {
    title: string;
    description: string;
    points: string[];
  }[];
  stats: {
    value: string;
    label: string;
  }[];
  testimonials: {
    quote: string;
    name: string;
    title: string;
    image: string;
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
  relatedFeatures: string[];
}

export const featuresData: Feature[] = [
  {
    id: 'ai-video-creator',
    title: 'AI Video Creator',
    shortDescription: 'Transform text into professional videos in minutes',
    description: 'Our advanced AI Video Creator transforms your text, keywords, and basic ideas into fully-produced, professional-quality videos in just minutes. Skip the learning curve of complex video editing software and let our AI handle the technical aspects while you maintain creative control.',
    icon: React.createElement(Video),
    image: 'https://images.unsplash.com/photo-1626544827763-d516dce335e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
    videoUrl: 'https://example.com/video/ai-creator-demo.mp4',
    keyPoints: [
      'Turn text and keywords into complete videos',
      'Access thousands of premium stock videos and images',
      'Professional transitions and effects applied automatically',
      'AI-generated voice narration in multiple languages',
      'Automatically optimize for multiple platforms and aspect ratios'
    ],
    benefits: [
      {
        title: 'Save 80% of Your Production Time',
        description: 'What used to take days now takes minutes. Focus on your content and strategy, not technical details.'
      },
      {
        title: 'No Video Editing Skills Required',
        description: 'Our intuitive interface eliminates the learning curve of professional editing software.'
      },
      {
        title: 'Professional-Quality Output',
        description: 'Get results that look like they were created by a professional video production team.'
      },
      {
        title: 'Consistent Brand Identity',
        description: 'Maintain your visual identity and brand elements across all videos.'
      }
    ],
    useCases: [
      {
        title: 'Social Media Content',
        description: 'Create engaging content for multiple platforms efficiently',
        points: [
          'Platform-specific formatting and optimization',
          'Trending style adaptation',
          'Multiple length variants from the same content'
        ]
      },
      {
        title: 'Marketing & Sales',
        description: 'Generate product demos and promotional videos',
        points: [
          'Showcase product features and benefits',
          'Create compelling call-to-actions',
          'A/B test different messaging approaches'
        ]
      },
      {
        title: 'Training & Education',
        description: 'Develop instructional and educational content',
        points: [
          'Step-by-step visual guides',
          'Concept explanation videos',
          'Interactive learning elements'
        ]
      }
    ],
    stats: [
      { value: '80%', label: 'Time Saved' },
      { value: '3x', label: 'Content Output' },
      { value: '65%', label: 'Higher Engagement' },
      { value: '10K+', label: 'Active Users' }
    ],
    testimonials: [
      {
        quote: "I've tried every video creation tool out there, and this is by far the most powerful yet intuitive. It's like having a video production team in my pocket.",
        name: "Sarah Johnson",
        title: "Marketing Director, TechGrowth Inc.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      },
      {
        quote: "We've increased our video output by 400% while maintaining the same team size. The ROI has been incredible for our content strategy.",
        name: "Michael Chen",
        title: "Content Manager, Digital First",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      }
    ],
    faq: [
      {
        question: "Do I need any video editing experience?",
        answer: "Not at all! Our AI Video Creator is designed to be used by anyone, regardless of technical experience. The intuitive interface guides you through the process, and our AI handles all the complex editing decisions."
      },
      {
        question: "What kind of videos can I create?",
        answer: "You can create virtually any type of video, including product demos, social media content, educational videos, marketing materials, presentations, explainer videos, and more. Our templates cover dozens of use cases across all major industries."
      },
      {
        question: "How long does it take to create a video?",
        answer: "Most videos can be created in 5-15 minutes, depending on length and complexity. This is a fraction of the time it would take with traditional video editing software, which can require hours or even days."
      },
      {
        question: "Can I customize the AI-generated videos?",
        answer: "Absolutely! While our AI creates an excellent first draft, you maintain full creative control. You can adjust any element, add your own footage, change text, modify transitions, and fine-tune your video until it's exactly what you want."
      }
    ],
    relatedFeatures: ['ai-editing', 'smart-templates', 'content-repurposing']
  },
  {
    id: 'ai-editing',
    title: 'AI-Powered Editing',
    shortDescription: 'Intelligent video editing that saves hours of work',
    description: 'Our advanced AI video editing technology analyzes your footage and automatically enhances colors, adjusts lighting, crops frames, and suggests optimal cuts for professional results. The system identifies the best moments, removes mistakes, and applies Hollywood-quality editing techniques automatically.',
    icon: React.createElement(Wand2),
    image: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
    videoUrl: 'https://example.com/video/ai-editing-demo.mp4',
    keyPoints: [
      'Smart scene detection and auto-editing',
      'Automatic color correction and enhancement',
      'AI-powered transitions between clips',
      'Voice recognition for automatic captions',
      'Content-aware cropping for different platforms'
    ],
    benefits: [
      {
        title: 'Cut Editing Time by 90%',
        description: 'What used to take days now takes minutes, freeing you to focus on creativity and content strategy.'
      },
      {
        title: 'Professional Results Every Time',
        description: 'Get consistent, high-quality edits that look like they were done by a professional editor.'
      },
      {
        title: 'Eliminate Technical Headaches',
        description: 'No need to learn complex editing software or worry about technical details.'
      },
      {
        title: 'Scale Your Video Production',
        description: 'Produce more high-quality videos in less time, expanding your content strategy.'
      }
    ],
    useCases: [
      {
        title: 'Content Creators',
        description: 'Streamline your production workflow and increase output',
        points: [
          'Batch process multiple videos simultaneously',
          'Maintain consistent style across all content',
          'Quickly adapt existing content for different platforms'
        ]
      },
      {
        title: 'Marketing Teams',
        description: 'Create more video content with limited resources',
        points: [
          'Turn raw footage into polished marketing videos',
          'Create multiple versions for A/B testing',
          'Quickly update existing videos with new information'
        ]
      },
      {
        title: 'Event Documentation',
        description: 'Transform event recordings into engaging highlight reels',
        points: [
          'Automatically identify key moments',
          'Create different cuts for different audiences',
          'Produce shareable clips for social media'
        ]
      }
    ],
    stats: [
      { value: '90%', label: 'Time Saved' },
      { value: '5x', label: 'Output Increase' },
      { value: '97%', label: 'User Satisfaction' },
      { value: '8M+', label: 'Videos Edited' }
    ],
    testimonials: [
      {
        quote: "I used to spend 8+ hours editing each YouTube video. Now it takes me less than an hour, and the quality is even better.",
        name: "David Rodriguez",
        title: "YouTube Creator (1.2M subscribers)",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      },
      {
        quote: "Our marketing team can now produce 3x more video content with the same resources. The ROI has been incredible.",
        name: "Jennifer Park",
        title: "Head of Digital Marketing, Novus Brands",
        image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      }
    ],
    faq: [
      {
        question: "How accurate is the AI editing?",
        answer: "Our AI has been trained on thousands of professionally edited videos across various styles and industries. It can identify optimal cut points, enhance visual quality, and apply appropriate transitions with approximately 95% accuracy compared to professional human editors."
      },
      {
        question: "Can I override the AI's editing decisions?",
        answer: "Absolutely! While our AI provides an excellent first cut, you maintain complete creative control. You can adjust any edit, modify transitions, change timing, or completely rearrange scenes as needed."
      },
      {
        question: "Does the AI work with any type of footage?",
        answer: "Yes, our AI can work with virtually any video footage, including smartphone recordings, professional camera footage, screen recordings, animations, and more. It automatically adapts its approach based on the content type."
      },
      {
        question: "How does AI editing compare to professional human editing?",
        answer: "In blind tests, viewers were unable to distinguish between our AI-edited videos and professionally edited ones in 87% of cases. The AI excels at technical aspects like pacing, continuity, and color correction, while still allowing you to add your creative touch."
      }
    ],
    relatedFeatures: ['ai-video-creator', 'content-repurposing', 'auto-captions']
  },
  {
    id: 'smart-templates',
    title: 'Smart Templates',
    shortDescription: 'Professional video templates for any industry or purpose',
    description: 'Access our extensive library of customizable video templates designed for every industry and purpose. Our smart templates adapt to your content, automatically adjusting to maintain perfect timing, transitions, and visual coherence regardless of what assets you add.',
    icon: React.createElement(LayoutTemplate),
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
    videoUrl: 'https://example.com/video/templates-demo.mp4',
    keyPoints: [
      '500+ professionally designed templates',
      'Industry-specific designs for any business',
      'Smart adaptation to your content length and style',
      'Customizable branding and visual elements',
      'Regular updates with new template designs'
    ],
    benefits: [
      {
        title: 'Start With a Professional Foundation',
        description: 'Begin every project with a professionally designed structure that ensures quality results.'
      },
      {
        title: 'Maintain Brand Consistency',
        description: 'Create a consistent look and feel across all your video content for stronger brand recognition.'
      },
      {
        title: 'Reduce Decision Fatigue',
        description: 'Eliminate the blank-page syndrome by starting with proven design patterns and structures.'
      },
      {
        title: 'Speed Up Your Workflow',
        description: 'Start with 80% of the work done, allowing you to focus on your unique content and messaging.'
      }
    ],
    useCases: [
      {
        title: 'Social Media Content',
        description: 'Platform-optimized templates for every social channel',
        points: [
          'Format-specific designs (Stories, Reels, TikTok, etc.)',
          'Engagement-optimized layouts',
          'Trend-aligned visual styles'
        ]
      },
      {
        title: 'Business & Marketing',
        description: 'Professional templates for business communication',
        points: [
          'Product demonstrations and explainers',
          'Company announcements and updates',
          'Customer testimonials and case studies'
        ]
      },
      {
        title: 'Education & Training',
        description: 'Structured templates for learning content',
        points: [
          'Course module templates',
          'Tutorial and how-to formats',
          'Information presentation structures'
        ]
      }
    ],
    stats: [
      { value: '500+', label: 'Templates' },
      { value: '40+', label: 'Industries' },
      { value: '75%', label: 'Time Saved' },
      { value: '12+', label: 'Format Types' }
    ],
    testimonials: [
      {
        quote: "The templates have completely transformed our social media presence. We now have a consistent, professional look that's instantly recognizable.",
        name: "Amanda Lee",
        title: "Social Media Manager, Urban Outfitters",
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      },
      {
        quote: "As someone with zero design skills, these templates have been a lifesaver. My videos now look like they were created by a professional studio.",
        name: "James Wilson",
        title: "Small Business Owner",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      }
    ],
    faq: [
      {
        question: "How customizable are the templates?",
        answer: "Our templates are fully customizable. You can change colors, fonts, layouts, transitions, timing, and replace any media elements with your own. The smart templates will automatically adapt to maintain visual coherence despite your changes."
      },
      {
        question: "Are new templates added regularly?",
        answer: "Yes! We add 15-20 new templates each month, including designs that follow current trends and new format requirements from social platforms. Pro subscribers get early access to all new templates."
      },
      {
        question: "Can I save my own customized templates?",
        answer: "Absolutely! Once you've customized a template to match your brand and needs, you can save it as a custom template for future use. This helps maintain consistency across all your videos."
      },
      {
        question: "Do the templates work with all types of content?",
        answer: "Yes, our templates are designed to work with all content types including live action footage, screen recordings, text animations, product photos, and more. The smart adaptation ensures your content fits perfectly regardless of what you're showcasing."
      }
    ],
    relatedFeatures: ['ai-video-creator', 'content-repurposing', 'collaboration']
  },
  {
    id: 'content-repurposing',
    title: 'Content Repurposing',
    shortDescription: 'Turn long videos into short clips perfect for social media',
    description: 'Our intelligent content repurposing system automatically identifies the most engaging parts of your long-form videos and transforms them into perfectly formatted short-form content for every platform. Multiply your content output without additional creation time.',
    icon: React.createElement(PencilRuler),
    image: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
    videoUrl: 'https://example.com/video/repurposing-demo.mp4',
    keyPoints: [
      'AI-powered highlight detection',
      'Automatic reformatting for each platform',
      'Engagement-optimized clip selection',
      'Caption and text overlay generation',
      'Batch processing for multiple clips'
    ],
    benefits: [
      {
        title: '10x Your Content Output',
        description: 'Create multiple pieces of content from a single source video, maximizing your creation efficiency.'
      },
      {
        title: 'Optimize for Each Platform',
        description: 'Automatically reformat content for the specific requirements and best practices of each platform.'
      },
      {
        title: 'Identify the Most Engaging Moments',
        description: 'Our AI identifies the segments most likely to capture attention and drive engagement.'
      },
      {
        title: 'Maintain Consistent Branding',
        description: 'Ensure your brand identity remains consistent across all repurposed content.'
      }
    ],
    useCases: [
      {
        title: 'Podcast to Social Media',
        description: 'Transform long podcast episodes into shareable clips',
        points: [
          'Highlight key insights and memorable moments',
          'Add visual elements to audio content',
          'Create audiogram-style promotional assets'
        ]
      },
      {
        title: 'Long-form Video to Short-form',
        description: 'Turn YouTube videos into TikTok, Reels, and Shorts',
        points: [
          'Identify viral-potential moments',
          'Reformat for vertical viewing',
          'Add platform-specific elements'
        ]
      },
      {
        title: 'Webinars to Educational Content',
        description: 'Transform webinar recordings into educational series',
        points: [
          'Extract key learning moments',
          'Create structured lesson segments',
          'Develop promotional teasers'
        ]
      }
    ],
    stats: [
      { value: '5-12', label: 'Clips Per Video' },
      { value: '87%', label: 'Time Saved' },
      { value: '3.2x', label: 'Engagement Increase' },
      { value: '7+', label: 'Platform Formats' }
    ],
    testimonials: [
      {
        quote: "We turned one 2-hour webinar into 23 short clips that generated more leads than the original event. The ROI is incredible.",
        name: "Mark Reynolds",
        title: "CMO, LeadGentech",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      },
      {
        quote: "As a podcaster, I struggled to promote episodes effectively. Now each episode automatically becomes 8-10 shareable clips that drive new listeners to my show.",
        name: "Elena Gonzalez",
        title: "Podcast Host, Future Forward",
        image: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      }
    ],
    faq: [
      {
        question: "How does the AI know which moments to select?",
        answer: "Our AI analyzes multiple factors including speech patterns, emotional intensity, key phrases, visual interest, and audience retention patterns from similar content. It identifies segments that are most likely to generate engagement based on platform-specific algorithms."
      },
      {
        question: "Can I customize which clips are selected?",
        answer: "Absolutely! While our AI makes smart suggestions, you maintain full control. You can approve, reject, or modify any clip selection, and even manually select specific segments you want to repurpose."
      },
      {
        question: "How many clips can I get from one video?",
        answer: "This depends on the length and content of your original video, but typically a 30-minute video yields 5-15 high-quality clips suitable for social media. The AI optimizes for quality over quantity, ensuring each clip has standalone value."
      },
      {
        question: "What platforms are supported for repurposing?",
        answer: "We support all major platforms including TikTok, Instagram Reels, YouTube Shorts, Facebook, Twitter/X, LinkedIn, and Pinterest. Each clip is automatically formatted according to the specific requirements and best practices of each platform."
      }
    ],
    relatedFeatures: ['ai-video-creator', 'ai-editing', 'auto-captions']
  },
  {
    id: 'auto-captions',
    title: 'Automatic Captions',
    shortDescription: 'Generate accurate captions and subtitles in multiple languages',
    description: 'Our powerful speech recognition technology automatically converts spoken words into accurate text captions. With support for 40+ languages and dialect recognition, your videos become accessible to global audiences and optimized for sound-off viewing.',
    icon: React.createElement(Globe),
    image: 'https://images.unsplash.com/photo-1590599145458-366e731e0b6b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
    videoUrl: 'https://example.com/video/captions-demo.mp4',
    keyPoints: [
      '98% accuracy in speech recognition',
      'Support for 40+ languages and dialects',
      'Automatic translation capabilities',
      'Style customization for brand consistency',
      'Burned-in or SRT/VTT caption options'
    ],
    benefits: [
      {
        title: 'Expand Your Global Reach',
        description: 'Make your content accessible to international audiences with multilingual caption support.'
      },
      {
        title: 'Boost Engagement in Silent-Viewing Environments',
        description: '85% of social media videos are watched without sound. Captions ensure your message gets across.'
      },
      {
        title: 'Improve Accessibility',
        description: 'Make your content accessible to deaf and hard-of-hearing viewers, expanding your audience.'
      },
      {
        title: 'Enhance SEO and Discoverability',
        description: 'Captions improve search engine indexing and help your content get discovered.'
      }
    ],
    useCases: [
      {
        title: 'Social Media Content',
        description: 'Optimize videos for sound-off environments',
        points: [
          'Automatic captions for all platforms',
          'Eye-catching animation styles',
          'Brand-aligned typography'
        ]
      },
      {
        title: 'Global Marketing Campaigns',
        description: 'Reach international audiences with localized captions',
        points: [
          'Multi-language support for global campaigns',
          'Cultural context adaptation',
          'Regional dialect recognition'
        ]
      },
      {
        title: 'Educational Content',
        description: 'Enhance learning experiences with accurate transcription',
        points: [
          'Precise technical terminology recognition',
          'Searchable video content',
          'Improved information retention for viewers'
        ]
      }
    ],
    stats: [
      { value: '98%', label: 'Accuracy Rate' },
      { value: '40+', label: 'Languages' },
      { value: '60%', label: 'Engagement Boost' },
      { value: '7M+', label: 'Videos Captioned' }
    ],
    testimonials: [
      {
        quote: "The automatic caption feature has doubled our international audience in just three months. The accuracy is incredible, even with technical terminology.",
        name: "Thomas Weber",
        title: "Head of Content, TechInsider",
        image: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      },
      {
        quote: "As a creator focusing on educational content, accurate captions are essential. This system gets it right 99% of the time, saving me countless hours of transcription work.",
        name: "Priya Sharma",
        title: "Educational Content Creator",
        image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      }
    ],
    faq: [
      {
        question: "How accurate are the automatic captions?",
        answer: "Our speech recognition system achieves 98% accuracy for clear audio in supported languages. For specialized terminology or challenging audio conditions, you can easily edit any mistakes in our caption editor."
      },
      {
        question: "Which languages are supported?",
        answer: "We currently support 40+ languages including English, Spanish, French, German, Italian, Portuguese, Japanese, Chinese (Mandarin), Russian, Arabic, Hindi, and many more. We regularly add new language support."
      },
      {
        question: "Can I customize the caption style?",
        answer: "Yes! You can customize font, size, color, background, position, and animation style. You can also save your preferred styles as templates for consistent branding across all your videos."
      },
      {
        question: "Do the captions export with the video or separately?",
        answer: "You have both options. You can burn the captions directly into your video, or export them as SRT/VTT files for more flexibility. This allows you to upload separate caption files to platforms that support them."
      }
    ],
    relatedFeatures: ['ai-video-creator', 'content-repurposing', 'collaboration']
  },
  {
    id: 'collaboration',
    title: 'Team Collaboration',
    shortDescription: 'Work together seamlessly with team members on video projects',
    description: 'Our powerful collaboration features enable teams to work together effectively on video projects, regardless of location. With real-time editing, commenting, version control, and approval workflows, you can streamline your video production process and improve team efficiency.',
    icon: React.createElement(Users),
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
    videoUrl: 'https://example.com/video/collaboration-demo.mp4',
    keyPoints: [
      'Real-time collaborative editing',
      'Comment and feedback system',
      'Version history and comparison',
      'Role-based permissions',
      'Approval workflows and task assignment'
    ],
    benefits: [
      {
        title: 'Streamline Your Workflow',
        description: 'Eliminate back-and-forth emails and file sharing with a centralized collaboration system.'
      },
      {
        title: 'Work From Anywhere',
        description: 'Enable remote and distributed teams to work together effectively on video projects.'
      },
      {
        title: 'Maintain Creative Control',
        description: 'Structured approval processes ensure quality while allowing multiple contributors.'
      },
      {
        title: 'Reduce Project Turnaround Time',
        description: 'Parallel workflows and efficient feedback cycles significantly reduce project completion times.'
      }
    ],
    useCases: [
      {
        title: 'Marketing Teams',
        description: 'Streamline collaboration between marketers, designers, and stakeholders',
        points: [
          'Efficient approval processes for brand compliance',
          'Asset sharing across campaigns',
          'Performance tracking and analytics sharing'
        ]
      },
      {
        title: 'Creative Agencies',
        description: 'Manage client projects and feedback efficiently',
        points: [
          'Client review and approval portal',
          'Collaborative revisions and versions',
          'Project milestone tracking'
        ]
      },
      {
        title: 'Educational Institutions',
        description: 'Facilitate collaboration on educational content',
        points: [
          'Faculty and student collaborative projects',
          'Curriculum development workflows',
          'Teaching resource creation and sharing'
        ]
      }
    ],
    stats: [
      { value: '32%', label: 'Faster Completion' },
      { value: '75%', label: 'Fewer Revisions' },
      { value: '93%', label: 'Team Satisfaction' },
      { value: '5x', label: 'Project Capacity' }
    ],
    testimonials: [
      {
        quote: "We've cut our video production time in half since our team started using the collaboration features. The approval workflow has eliminated bottlenecks we didn't even know we had.",
        name: "Alex Mercer",
        title: "Creative Director, Innovate Agency",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      },
      {
        quote: "Managing video projects across our global marketing team used to be a nightmare. Now everyone works in sync, regardless of time zone. It's transformed our workflow.",
        name: "Sophia Chen",
        title: "Global Marketing Lead, Nexus Technologies",
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      }
    ],
    faq: [
      {
        question: "How many team members can collaborate on a project?",
        answer: "Our Professional plan supports up to 10 team members per project, while our Enterprise plan allows unlimited team members. Each collaborator can have customized permission levels."
      },
      {
        question: "Is version history maintained for all changes?",
        answer: "Yes, we maintain a complete version history for all projects. You can view previous versions, compare changes, and restore any past version if needed. This ensures you never lose work and can always track the evolution of your projects."
      },
      {
        question: "How does the approval workflow function?",
        answer: "You can set up customized approval workflows with multiple stages. For example, you might have an initial review by the creative team, followed by marketing approval, and final client sign-off. Each stage can have designated approvers and automated notifications."
      },
      {
        question: "Can external stakeholders participate without a full account?",
        answer: "Yes! You can invite external reviewers like clients or stakeholders via secure review links. They can view videos, leave timestamped comments, and approve content without needing a full account or access to other projects."
      }
    ],
    relatedFeatures: ['auto-captions', 'smart-templates', 'ai-video-creator']
  }
];