import React from 'react';
import { motion } from 'framer-motion';
import { IdentityGraphNode, IdentityGraphEdge } from '../../types/personalization';

interface IdentityGraphViewProps {
  nodes: IdentityGraphNode[];
  edges: IdentityGraphEdge[];
}

export default function IdentityGraphView({ nodes, edges }: IdentityGraphViewProps) {
  const centerX = 300;
  const centerY = 200;

  return (
    <div className="w-full h-96 relative bg-gray-900/50 rounded-lg border border-white/10 overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 600 400">
        {/* Edges */}
        {edges.map((edge, index) => {
          const source = nodes.find(n => n.id === edge.source_node_id);
          const target = nodes.find(n => n.id === edge.target_node_id);
          if (!source || !target) return null;

          return (
            <motion.line
              key={edge.id}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ delay: index * 0.1 }}
              x1={centerX + (source.platform.charCodeAt(0) % 10) * 40}
              y1={centerY + (source.platform.charCodeAt(0) % 5) * 30}
              x2={centerX + (target.platform.charCodeAt(0) % 10) * 40}
              y2={centerY + (target.platform.charCodeAt(0) % 5) * 30}
              stroke="#6366f1"
              strokeWidth={2 * edge.confidence}
              strokeOpacity={0.6}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, index) => (
          <motion.g
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <circle
              cx={centerX + (node.platform.charCodeAt(0) % 10) * 40}
              cy={centerY + (node.platform.charCodeAt(0) % 5) * 30}
              r={20 + node.confidence * 15}
              fill={`url(#gradient-${index})`}
              stroke="#fff"
              strokeWidth={1}
            />
            <text
              x={centerX + (node.platform.charCodeAt(0) % 10) * 40}
              y={centerY + (node.platform.charCodeAt(0) % 5) * 30 + 5}
              textAnchor="middle"
              className="text-xs fill-white font-body"
            >
              {node.platform.charAt(0).toUpperCase()}
            </text>
          </motion.g>
        ))}

        <defs>
          {nodes.map((_, index) => (
            <linearGradient key={index} id={`gradient-${index}`}>
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          ))}
        </defs>
      </svg>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-400 font-body">No identity graph data available</p>
        </div>
      )}
    </div>
  );
}