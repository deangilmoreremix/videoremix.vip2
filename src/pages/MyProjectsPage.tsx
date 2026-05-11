import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { AiImageService } from "../services/aiImageService";
import { BrandingService } from "../services/brandingService";
import { CreativeService } from "../services/creativeService";
import { LeadGenService } from "../services/leadGenService";
import { VideoService } from "../services/videoService";
import { PersonalizerService } from "../services/personalizerService";

interface Project {
  id: string;
  app_slug: string;
  project_name: string;
  status: string;
  created_at: string;
  type: "video" | "ai-image" | "branding" | "creative" | "leadgen" | "personalizer";
  thumbnail_url?: string;
}

const MyProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadAllProjects();
  }, []);

  const loadAllProjects = async () => {
    try {
      const [videos, aiImages, branding, creative, leadgen, personalizer] = await Promise.all([
        VideoService.getUserVideos().catch(() => []),
        AiImageService.getUserImages().catch(() => []),
        BrandingService.getUserProjects().catch(() => []),
        CreativeService.getUserProjects().catch(() => []),
        LeadGenService.getUserProjects().catch(() => []),
        PersonalizerService.getUserProjects().catch(() => []),
      ]);

      const allProjects: Project[] = [
        ...videos.map((v: any) => ({
          id: v.id,
          app_slug: v.app_id || "video",
          project_name: v.title || "Untitled Video",
          status: v.status,
          created_at: v.created_at,
          type: "video" as const,
          thumbnail_url: v.thumbnail_path,
        })),
        ...aiImages.map((p: any) => ({
          id: p.id,
          app_slug: p.app_slug,
          project_name: p.project_name,
          status: p.status,
          created_at: p.created_at,
          type: "ai-image" as const,
          thumbnail_url: p.output_image_url,
        })),
        ...branding.map((p: any) => ({
          id: p.id,
          app_slug: p.app_slug,
          project_name: p.project_name,
          status: p.status,
          created_at: p.created_at,
          type: "branding" as const,
        })),
        ...creative.map((p: any) => ({
          id: p.id,
          app_slug: p.app_slug,
          project_name: p.project_name,
          status: p.status,
          created_at: p.created_at,
          type: "creative" as const,
        })),
        ...leadgen.map((p: any) => ({
          id: p.id,
          app_slug: p.app_slug,
          project_name: p.project_name,
          status: p.status,
          created_at: p.created_at,
          type: "leadgen" as const,
        })),
      ];

      allProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setProjects(allProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = filter === "all" 
    ? projects 
    : projects.filter(p => p.type === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="mt-2 text-gray-600">View and manage all your generated content</p>
        </div>

        <div className="mb-6 flex gap-2">
          {["all", "video", "ai-image", "branding", "creative", "leadgen", "personalizer"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === type
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No projects found. Start creating with our apps!</p>
            <Link to="/apps" className="mt-4 inline-block text-blue-600 hover:underline">
              Browse Apps
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <Link
                key={`${project.type}-${project.id}`}
                to={`/app/${project.app_slug}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  {project.thumbnail_url ? (
                    <img src={project.thumbnail_url} alt={project.project_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400">No preview</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">{project.type}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">{project.project_name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProjectsPage;
