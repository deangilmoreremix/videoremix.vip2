import React from "react"; // eslint-disable-line @typescript-eslint/no-unused-vars

// Testimonial types
interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  company?: string;
  image: string;
  rating: number;
  videoUrl?: string;
  category?: string;
  featured?: boolean;
}

// Main testimonials data
export const testimonialsData: Testimonial[] = [
  {
    id: "testimonial-1",
    quote:
      "VideoRemix.vip transformed our social media strategy. We're creating 3x more content in half the time, and our engagement has increased by 200%.",
    name: "Sarah Johnson",
    role: "Social Media Manager",
    company: "Global Marketing Inc.",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "marketing",
    featured: true,
  },
  {
    id: "testimonial-2",
    quote:
      "As a YouTuber, editing used to take me days. With VideoRemix.vip, I can edit an entire video in just hours, and the quality is even better. Total game-changer!",
    name: "Marcus Chen",
    role: "Content Creator",
    company: "TechReviews Channel",
    rating: 5,
    image:
      "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "content-creation",
    featured: true,
  },
  {
    id: "testimonial-3",
    quote:
      "The AI features in VideoRemix.vip are truly next level. It automatically extracted the best clips from our 2-hour webinar for social media. This tool is worth every penny.",
    name: "Emma Rodriguez",
    role: "Director of Content",
    company: "E-Learning Solutions",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "education",
    featured: true,
  },
  {
    id: "testimonial-4",
    quote:
      "Our agency has saved over 200 hours per month since switching to VideoRemix.vip. The client approval process is also smoother with their collaboration features.",
    name: "David Park",
    role: "Creative Director",
    company: "Visionary Agency",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "agency",
    featured: false,
  },
  {
    id: "testimonial-5",
    quote:
      "The automated caption generation is spot on! As someone creating content for international audiences, this feature alone has saved me countless hours.",
    name: "Sophia Wong",
    role: "International Marketing Lead",
    company: "Global Brands Inc.",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "marketing",
    featured: false,
  },
  {
    id: "testimonial-6",
    quote:
      "I went from creating 1-2 videos a month to 2-3 videos per WEEK! My channel growth has exploded since I started using VideoRemix.vip.",
    name: "James Wilson",
    role: "YouTube Creator",
    company: "1.2M Subscribers",
    rating: 5,
    image:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "content-creation",
    featured: true,
  },
  {
    id: "testimonial-7",
    quote:
      "The text-to-speech feature is incredibly natural sounding. My students can't tell it's AI-generated, which has allowed me to create more educational content with consistent narration.",
    name: "Michael Brown",
    role: "Online Course Creator",
    company: "LearnFast Academy",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "education",
    featured: false,
  },
  {
    id: "testimonial-8",
    quote:
      "As a small business owner with zero video editing experience, I was amazed at how quickly I could create professional-looking product demos that actually convert.",
    name: "Jennifer Martinez",
    role: "Founder",
    company: "Artisan Crafts Co.",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "small-business",
    featured: false,
  },
  {
    id: "testimonial-9",
    quote:
      "We've reduced our video production costs by 70% while actually increasing our output. The ROI on VideoRemix.vip has been incredible for our marketing department.",
    name: "Robert Thompson",
    role: "Marketing Director",
    company: "Enterprise Solutions Inc.",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "enterprise",
    featured: true,
  },
  {
    id: "testimonial-10",
    quote:
      "The ability to instantly repurpose our webinar content into short social clips has completely transformed our content strategy. We're reaching audiences we never reached before.",
    name: "Lisa Zhang",
    role: "Digital Marketing Specialist",
    company: "Tech Innovations Ltd.",
    rating: 5,
    image:
      "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "marketing",
    featured: false,
  },
  {
    id: "testimonial-11",
    quote:
      "I've tried every video editing tool on the market, and nothing comes close to the ease and power of VideoRemix.vip. The AI features are truly revolutionary.",
    name: "Carlos Sanchez",
    role: "Videographer",
    company: "Visual Story Studios",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "professional",
    featured: true,
  },
  {
    id: "testimonial-12",
    quote:
      "The collaboration features have made working with our remote team seamless. We can all contribute to projects in real-time regardless of where we're located.",
    name: "Michelle Johnson",
    role: "Project Manager",
    company: "Global Creative Team",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "agency",
    featured: false,
  },
  {
    id: "testimonial-13",
    quote:
      "The lower thirds generator and title templates alone are worth the subscription. They've elevated the professional look of all our corporate communications.",
    name: "Richard Williams",
    role: "Corporate Communications Director",
    company: "Enterprise Corp.",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "enterprise",
    featured: false,
  },
  {
    id: "testimonial-14",
    quote:
      "The ability to generate personalized content at scale has transformed our sales outreach. Our response rates have increased by 347% since implementing this strategy.",
    name: "Amanda Peterson",
    role: "Sales Director",
    company: "SaaS Solutions Inc.",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1181695/pexels-photo-1181695.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "sales",
    featured: false,
  },
  {
    id: "testimonial-15",
    quote:
      "I use VideoRemix.vip daily for my TikTok and Instagram content. The vertical video templates and quick export options are perfect for social media creators.",
    name: "Tyler Evans",
    role: "Social Media Influencer",
    company: "2.5M Followers",
    rating: 5,
    image:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "content-creation",
    featured: true,
  },
  {
    id: "testimonial-16",
    quote:
      "The Text Transparent Masking element has completely changed how I create my intro videos. My audience is constantly asking how I achieve these effects.",
    name: "Samantha Lee",
    role: "Motion Graphics Artist",
    company: "Creative Visuals",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "design",
    featured: false,
  },
  {
    id: "testimonial-17",
    quote:
      "Our real estate listings with VideoRemix.vip created property videos sell 35% faster. The AI automatically highlights the best features of each property.",
    name: "Daniel Morgan",
    role: "Real Estate Agent",
    company: "Premium Properties",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "real-estate",
    featured: true,
  },
  {
    id: "testimonial-18",
    quote:
      "The Storyboard AI feature has revolutionized our pre-production process. We can visualize complex scenes before shooting, saving countless hours on set.",
    name: "Victoria Adams",
    role: "Film Director",
    company: "Creative Films Productions",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "professional",
    featured: false,
  },
  {
    id: "testimonial-19",
    quote:
      "As a non-profit with limited resources, VideoRemix.vip has been invaluable. We now create professional fundraising videos at a fraction of what we used to spend.",
    name: "Mark Thompson",
    role: "Executive Director",
    company: "Global Relief Initiative",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "non-profit",
    featured: false,
  },
  {
    id: "testimonial-20",
    quote:
      "I use the personalization features to create custom intro videos for each of my coaching clients. It's added incredible value to my premium packages.",
    name: "Jessica Reynolds",
    role: "Business Coach",
    company: "Success Strategies",
    rating: 5,
    image:
      "https://images.pexels.com/photos/1181577/pexels-photo-1181577.jpeg?auto=compress&cs=tinysrgb&w=150",
    category: "coaching",
    featured: false,
  },
];

// Note: Helper functions for testimonials are available but currently unused
// const getTestimonialsByCategory = (category: string) => { ... };
// const getFeaturedTestimonials = () => { ... };
// const getRandomTestimonials = (count: number) => { ... };
