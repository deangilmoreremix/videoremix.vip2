import React from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { BookOpen, Settings, ExternalLink } from "lucide-react";
import { coursesData, Course } from "../data/coursesData";

const CoursesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Helmet>
        <title>Courses | VideoRemix.vip</title>
        <meta name="description" content="Learn AI agent development with crash courses and tutorials." />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-4 flex items-center">
            <BookOpen className="h-8 w-8 mr-3 text-primary-400" />
            AI Agent Courses
          </h1>
          <p className="text-gray-400 mb-12 text-lg">
            Free crash courses and tutorials to master AI agent frameworks. Original content by {' '}
            <a 
              href="https://www.theunwindai.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300"
            >
              Unwind AI
            </a>.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coursesData.map((course: Course, index: number) => (
            <motion.a
              key={course.id}
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/50 transition-colors p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-start mb-4">
                <div className="p-3 bg-gray-700 rounded-lg mr-4 group-hover:bg-primary-600/20 transition-colors">
                  {course.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors mb-2">
                    {course.title}
                  </h3>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary-600/30 text-primary-300">
                    {course.category === "crash-course" ? "Crash Course" : "Tutorial"}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-400 mb-4 line-clamp-3">
                {course.description}
              </p>
              
              <div className="flex items-center text-primary-400 text-sm font-medium">
                <span>View on Unwind AI</span>
                <ExternalLink className="h-4 w-4 ml-2" />
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-500">
                  Original course by Unwind AI
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
