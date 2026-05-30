import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import { motion } from 'framer-motion';
import { IdentityGraphNode, IdentityGraphEdge } from '../../types/personalization';
import { GitBranch, Globe, Building2, User, Share2 } from 'lucide-react';

interface IdentityGraphViewProps {
  nodes: IdentityGraphNode[];
  edges: IdentityGraphEdge[];
  profileId?: string;
}

const nodeIcons: Record<string, React.ReactNode> = {
  username: <User className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
  company: <Building2 className="h-4 w-4" />,
  domain: <GitBranch className="h-4 w-4" />,
  social: <Share2 className="h-4 w-4" />,
};

const IdentityGraphView: React.FC<IdentityGraphViewProps> = ({ nodes, edges }) => {
  const flowNodes = React.useMemo<Node[]>(() => 
    nodes.map((node, index) => ({
      id: node.id,
      type: 'default',
      position: { 
        x: (index % 3) * 250 + 50, 
        y: Math.floor(index / 3) * 150 + 50 
      },
      data: {
        label: (
          <div className="flex items-center gap-2 min-w-[120px]">
            {nodeIcons[node.nodeType]}
            <span className="text-sm capitalize">{node.nodeValue.split('.')[0]}</span>
          </div>
        ),
      },
      style: {
        background: '#1a1a1a',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '8px',
      },
    })), [nodes]
  );

  const flowEdges = React.useMemo<Edge[]>(() =>
    edges.map(edge => ({
      id: edge.id,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: '#6366f1',
      },
      label: edge.relationshipType.replace('_', ' '),
      labelStyle: {
        fill: '#9ca3af',
        fontSize: '10px',
      },
    })), [edges]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-[400px] bg-gray-900/50 rounded-xl border border-gray-700"
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        attribution={false}
      >
        <Background color="#374151" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const colors: Record<string, string> = {
              github: '#6366f1',
              linkedin: '#3b82f6',
              twitter: '#0ea5e9',
              company: '#10b981',
              default: '#8b5cf6',
            };
            return colors['default'];
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
        />
      </ReactFlow>
      
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          No identity graph data available
        </div>
      )}
    </motion.div>
  );
};

export default IdentityGraphView;