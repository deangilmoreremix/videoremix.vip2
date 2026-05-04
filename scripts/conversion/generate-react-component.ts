#!/usr/bin/env node

/**
 * Simplified React Component Generator (v2)
 * 
 * Uses string concatenation instead of nested template literals to avoid escaping issues.
 * Generates simple, functional pages with minimal dynamic class names.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toPascalCase(str: string): string {
  return str.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

function capitalizeWords(str: string): string {
  return str.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// ============ Simple Template ============

function generateSimpleFormComponent(config: any): string {
  const fields = config.inputFields.map((f, idx) => `
              <div className="space-y-2">
                <Label htmlFor="${f.name}">${f.label}${f.required ? ' *' : ''}</Label>
                ${f.type === 'textarea' ? `
                <Textarea
                  id="${f.name}"
                  value={${`formData.${f.name}`}}
                  onChange={(e) => setFormData({ ...formData, ${f.name}: e.target.value })}
                  placeholder="${f.placeholder || ''}"
                  className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"
                />
                ` : f.type === 'select' ? `
                <select
                  id="${f.name}"
                  value={${`formData.${f.name}`}}
                  onChange={(e) => setFormData({ ...formData, ${f.name}: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  ${(f.options || ['']).map(opt => `<option value="${opt}">${opt}</option>`).join('\n                  ')}
                </select>
                ` : `
                <Input
                  id="${f.name}"
                  type="${f.type === 'file' ? 'text' : f.type}"
                  value={${`formData.${f.name}`}}
                  onChange={(e) => setFormData({ ...formData, ${f.name}: e.target.value })}
                  placeholder="${f.placeholder || ''}"
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                `}
              </div>
`).join('');

  return `import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

const ${config.componentName}: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ ${config.inputFields.map(f => `${f.name}: ""`).join(', ')} });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/${config.functionSlug}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>${config.pageTitle}</title>
        <meta name="description" content="${config.pageDescription}" />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">${capitalizeWords(config.appName)}</h1>
            <p className="text-xl text-gray-400">${config.appDescription}</p>
          </motion.div>

          {error && <Card className="mb-6 border-red-500/50 bg-red-500/10"><CardContent className="pt-6"><p className="text-red-300">{error}</p></CardContent></Card>}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Input</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
${fields}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Processing...' : 'Generate Results'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-gray-400">Processing...</p>
              </CardContent>
            </Card>
          )}

           {result && result.status === 'completed' && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
               <Card className="bg-gray-800/50 border-gray-700">
                 <CardHeader><CardTitle>Results</CardTitle></CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     ${config.outputFormat === 'audio' ? `
                     <div className="space-y-2">
                       <Label>Audio Response</Label>
                       <audio controls src={result.audioUrl} className="w-full" />
                     </div>
                     ` : ''}
                     <div className="space-y-2">
                       <Label>Transcript</Label>
                       <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans">{result.result}</pre>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
           )}
        </div>
      </main>
    </>
  );
};

export default ${config.componentName};
`;
}

// ============ Chat Template ============

function generateChatComponent(config: any): string {
  return `import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Bot, User, Trash2, Send } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ${config.componentName}: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/${config.functionSlug}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          userId: user?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.result || '' }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <>
      <Helmet>
        <title>${config.pageTitle}</title>
        <meta name="description" content="${config.pageDescription}" />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 h-[calc(100vh-8rem)] flex flex-col max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">${capitalizeWords(config.appName)}</h1>
            <p className="text-gray-400">${config.appDescription}</p>
          </motion.div>

          <Card className="flex-1 bg-gray-800/50 border-gray-700 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-20">
                  <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation...</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={"flex " + (msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div className={"flex items-start space-x-2 max-w-[80%] " + (msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : '')}>
                    <div className={"w-8 h-8 rounded-full flex items-center justify-center " + (msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600')}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <Card className={"p-3 " + (msg.role === 'user' ? 'bg-blue-600/20 border-blue-500/30' : 'bg-gray-700/50 border-gray-600')}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </Card>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-700 p-4 bg-gray-900/50">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..."
                  className="flex-1 bg-gray-800 border-gray-600 text-white" disabled={loading} />
                <Button type="submit" disabled={loading || !input.trim()}><Send className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={clearChat}><Trash2 className="h-4 w-4" /></Button>
              </form>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default ${config.componentName};
`;
}

// ============ File Upload Template ============

function generateFileUploadComponent(config: any): string {
  return `import React, { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Upload, FileText } from "lucide-react";

const ${config.componentName}: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
${config.inputFields.map(f => `      formData.append('${f.name}', textValues.${f.name} || '');`).join('\n')}
      const res = await fetch('/.netlify/functions/${config.functionSlug}', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>${config.pageTitle}</title>
        <meta name="description" content="${config.pageDescription}" />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">${capitalizeWords(config.appName)}</h1>
            <p className="text-xl text-gray-400">${config.appDescription}</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Upload & Configure</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="file">Upload File *</Label>
                  <div
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-300">Click to select a file</p>
                    {file && <p className="text-sm text-blue-400 mt-2">{file.name}</p>}
                  </div>
                  <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
                </div>

${config.inputFields.map(f => `
                <div className="space-y-2">
                  <Label htmlFor="${f.name}">${f.label}${f.required ? ' *' : ''}</Label>
                  <Input
                    id="${f.name}"
                    value={textValues.${f.name} || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, ${f.name}: e.target.value }))}
                    placeholder="${f.placeholder || ''}"
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>
`).join('')}

                <Button type="submit" disabled={loading || !file} className="w-full">
                  {loading ? 'Processing...' : 'Process File'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {error && <Card className="border-red-500/50 bg-red-500/10 mb-8"><CardContent className="pt-6"><p className="text-red-300">{error}</p></CardContent></Card>}

           {result && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
               <Card className="bg-gray-800/50 border-gray-700">
                 <CardHeader><CardTitle>Result</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      ${config.outputFormat === 'audio' && `
                      <div className="space-y-2">
                        <Label>Audio Response</Label>
                        <audio controls src={result.audioUrl} className="w-full" />
                      </div>
                      ` : ''}
                      {result.result && (
                        <div className="space-y-2">
                          <Label>Transcript</Label>
                          <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans">{JSON.stringify(result, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
               </Card>
             </motion.div>
           )}
        </div>
      </main>
    </>
  );
};

export default ${config.componentName};
`;
}

// ============ Multi-Tab Template ============

function generateMultiTabComponent(config: any): string {
  const tabs = config.tabs || ['main', 'advanced'];
  return `import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2 } from "lucide-react";

const ${config.componentName}: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("main");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (tabKey: string, data: any) => {
    setLoading(tabKey);
    try {
      const res = await fetch('/.netlify/functions/${config.functionSlug}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, mode: tabKey, userId: user?.id })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      setResults(prev => ({ ...prev, [tabKey]: result }));
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [tabKey]: err.message }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>${config.pageTitle}</title>
        <meta name="description" content="${config.pageDescription}" />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">${capitalizeWords(config.appName)}</h1>
            <p className="text-xl text-gray-400">${config.appDescription}</p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
            <TabsList className="grid grid-cols-${tabs.length} mb-8">
              ${tabs.map(tab => `
              <TabsTrigger value="${tab}">${capitalizeWords(tab)}</TabsTrigger>
              `).join('              ')}
            </TabsList>

            ${tabs.map(tab => `
            <TabsContent value="${tab}">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>${capitalizeWords(tab)}</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit('${tab}', { ${config.inputFields.map(f => f.name).join(', ')} }); }} className="space-y-6">
${config.inputFields.map(f => `
                    <div className="space-y-2">
                      <Label htmlFor="${f.name}">${f.label}</Label>
                      <Textarea
                        id="${f.name}"
                        rows={3}
                        placeholder="${f.placeholder || ''}"
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>
`).join('')}
                    <Button type="submit" disabled={loading === '${tab}'}>
                      {loading === '${tab}' ? 'Processing...' : 'Run'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {results['${tab}'] && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader><CardTitle>Results</CardTitle></CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans">{JSON.stringify(results['${tab}'], null, 2)}</pre>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>
            `).join('')}
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default ${config.componentName};
`;
}

// ============ Main Exports ============

export async function generateReactComponent(analyzerJsonPath, outputDir) {
  const analyzer = JSON.parse(fs.readFileSync(analyzerJsonPath, 'utf-8'));
  
  const componentName = toPascalCase(analyzer.appName) + 'Page';
  const slug = analyzer.appName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const uiType = analyzer.uiType;
  
  // Determine template
  let templateFn;
  if (uiType === 'chat') {
    templateFn = generateChatComponent;
  } else if (uiType === 'file-upload') {
    templateFn = generateFileUploadComponent;
  } else if (uiType === 'multi-tab') {
    templateFn = generateMultiTabComponent;
  } else {
    templateFn = generateSimpleFormComponent; // default
  }

  const config = {
    appName: analyzer.appName,
    appDescription: `AI-powered ${analyzer.appName.replace(/-/g, ' ')}.`,
    functionSlug: slug,
    componentName,
    pageTitle: `${toPascalCase(analyzer.appName)} - VideoRemix.vip`,
    pageDescription: `Use ${analyzer.appName} to automate tasks with AI.`,
    inputFields: analyzer.inputFields || [],
    outputFormat: analyzer.outputFormat || 'markdown',
    uiType,
    complexity: analyzer.complexity,
    template: uiType
  };

  const content = templateFn(config);
  const outputPath = path.join(outputDir, `${componentName}.tsx`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content);

  console.log(`✅ Generated: ${outputPath}`);
  return { componentName, outputPath, uiType };
}

// CLI entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: ts-node generate-react-component.ts <analysis-json> <output-dir>');
    process.exit(1);
  }
  const [analysisJson, outputDir] = args;
  generateReactComponent(analysisJson, outputDir).catch(err => {
    console.error('Generation failed:', err);
    process.exit(1);
  });
}
