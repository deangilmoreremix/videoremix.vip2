import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import AgentApiConfigPanel from "../components/AgentApiConfigPanel";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Key, ArrowLeft } from "lucide-react";

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [showConfig, setShowConfig] = useState(false);

  return (
    <>
      <Helmet>
        <title>API Settings - VideoRemix.vip</title>
        <meta name="description" content="Configure API keys for AI agents" />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Button variant="ghost" className="mb-4" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h1 className="text-4xl font-bold mb-4">Settings</h1>
            <p className="text-xl text-gray-400">Manage your API keys and preferences</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>API Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-6">
                Configure the API keys required by various AI agents. Keys are stored securely and only used when you run the corresponding agents.
              </p>
              <Button onClick={() => setShowConfig(true)} className="w-full">
                Configure API Keys
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <AgentApiConfigPanel isOpen={showConfig} onClose={() => setShowConfig(false)} />
    </>
  );
};

export default SettingsPage;
