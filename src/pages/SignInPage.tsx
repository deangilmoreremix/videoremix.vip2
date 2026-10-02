import React from "react";
import { Helmet } from "react-helmet-async";

import {
  Megaphone,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { SignIn } from "@clerk/react";
import MagicSparkles from "../components/MagicSparkles";
import SparkleEffect from "../components/SparkleEffect";
import ParticleBackground from "../components/premium/ParticleBackground";
import GradientOrb from "../components/premium/GradientOrb";

const SignInPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Sign In | VideoRemix.vip</title>
        <meta
          name="description"
          content="Sign in to your VideoRemix.vip account to access your personalized marketing campaigns and tools."
        />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden flex items-center justify-center py-20">
        <ParticleBackground className="z-0" particleCount={40} />
        <GradientOrb size={600} colorFrom="primary-600" colorTo="accent-500" blur={100} mouseFollow={true} />
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px]"></div>
        </div>

        <SparkleEffect
          count={30}
          colors={["#ffffff", "#c7d2fe", "#a5b4fc", "#818cf8"]}
          minSize={2}
          maxSize={5}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-md mx-auto">
            {/* Back to home link */}
            <div className="mb-8">
              <a
                href="/"
                className="inline-flex items-center text-gray-400 hover:text-white transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to home
              </a>
            </div>

            {/* Logo section */}
            <div className="text-center mb-8">
              <a
                href="/"
                className="inline-flex items-center justify-center space-x-2 group mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-400 rounded-full blur-lg opacity-30 group-hover:opacity-60 transition-opacity"></div>
                  <Megaphone className="h-10 w-10 text-white relative z-10" />
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold text-white leading-none block">
                    VideoRemix.vip
                  </span>
                  <div className="text-xs text-primary-300">
                    Marketing Personalization Platform
                  </div>
                 </div>
               </a>

               <MagicSparkles minSparkles={3} maxSparkles={6}>
                 <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                   Welcome Back
                 </h1>
               </MagicSparkles>
               <p className="text-gray-300 text-lg">
                 Sign in to continue your personalized marketing journey
               </p>
             </div>

             <SignIn
               routing="path"
               path="/signin"
               redirectUrl="/dashboard"
               appearance={{
                 variables: {
                   colorPrimary: "#6c47ff",
                   colorBackground: "#1f2937",
                   colorText: "#ffffff",
                   colorTextSecondary: "#9ca3af",
                   borderRadius: "0.5rem",
                   fontFamily: "Source Sans Pro, sans-serif",
                 },
                 elements: {
                   root: "flex items-center justify-center",
                   card: "bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-2xl",
                   headerTitle: "text-white text-2xl font-bold",
                   headerSubtitle: "text-gray-300",
                   formFieldInput: "w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                   formButtonPrimary: "w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white py-4 px-6 rounded-lg font-semibold transition-all shadow-lg shadow-primary-600/20",
                   footerActionLink: "text-primary-400 hover:text-primary-300",
                   identityPreview: "text-white",
                   formFieldLabel: "text-gray-300",
                 },
               }}
             />

             {/* Benefits section */}
             <div className="mt-8 bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
               <h3 className="text-white font-semibold mb-4 flex items-center">
                 <CheckCircle className="h-5 w-5 text-primary-400 mr-2" />
                 What you'll get with VideoRemix.vip
               </h3>
               <ul className="space-y-3 text-gray-300 text-sm">
                 <li className="flex items-start">
                   <span className="text-primary-400 mr-2">✓</span>
                   <span>Access to 37+ marketing personalization tools</span>
                 </li>
                 <li className="flex items-start">
                   <span className="text-primary-400 mr-2">✓</span>
                   <span>Unlimited audience segmentation</span>
                 </li>
                 <li className="flex items-start">
                   <span className="text-primary-400 mr-2">✓</span>
                   <span>AI-powered campaign personalization</span>
                 </li>
                 <li className="flex items-start">
                   <span className="text-primary-400 mr-2">✓</span>
                   <span>Multi-channel marketing automation</span>
                 </li>
               </ul>
             </div>
           </div>
         </div>
       </main>
     </>
   );
 };

export default SignInPage;
