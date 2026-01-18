
import React, { useEffect, useRef, useState } from 'react';
import { KnowledgeGraphData, GraphNode, GraphLink } from '../types';

interface BrainViewProps {
  data: KnowledgeGraphData;
}

const BrainView: React.FC<BrainViewProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simple Force Layout Simulation (Pseudo-physics for static SVG)
  // In a real production app, we would use d3-force or react-force-graph.
  // For this standalone React app, we calculate simple positions based on connections.
  const nodesWithPositions = data.nodes.map((node, i) => {
    const angle = (i / data.nodes.length) * 2 * Math.PI;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35;
    return {
      ...node,
      x: dimensions.width / 2 + Math.cos(angle) * radius,
      y: dimensions.height / 2 + Math.sin(angle) * radius,
    };
  });

  const linksWithCoords = data.links.map(link => {
    const source = nodesWithPositions.find(n => n.id === link.source);
    const target = nodesWithPositions.find(n => n.id === link.target);
    return { ...link, sourceNode: source, targetNode: target };
  }).filter(l => l.sourceNode && l.targetNode);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-700">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Semantic Brain</h2>
          <p className="text-slate-500">Visualization of connections between your ideas.</p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> Note</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Concept</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Entity</div>
        </div>
      </header>

      <div 
        ref={containerRef}
        className="flex-1 bg-white border border-slate-100 rounded-3xl relative overflow-hidden shadow-inner"
      >
        {data.nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-20"><path d="M12 2a5 5 0 0 0-5 5v1a5 5 0 0 0 5 5h0a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5Z"/><path d="M7 13a3 3 0 0 1 3 3v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a3 3 0 0 1 3-3Z"/><path d="M14 13a3 3 0 0 0-3 3v4a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-4a3 3 0 0 0-3-3Z"/></svg>
            <p>Your Second Brain is currently empty.</p>
            <p className="text-sm">Add notes to see connections form.</p>
          </div>
        ) : (
          <svg width="100%" height="100%" className="cursor-move">
            <g>
              {linksWithCoords.map((link, i) => (
                <line
                  key={`link-${i}`}
                  x1={link.sourceNode!.x}
                  y1={link.sourceNode!.y}
                  x2={link.targetNode!.x}
                  y2={link.targetNode!.y}
                  stroke="#E2E8F0"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              ))}
              {nodesWithPositions.map((node) => (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer group"
                  onClick={() => setSelectedNode(node)}
                >
                  <circle
                    r={8 + node.val}
                    fill={
                      node.type === 'note' ? '#6366f1' : 
                      node.type === 'concept' ? '#10b981' : '#f59e0b'
                    }
                    className="transition-transform group-hover:scale-125 duration-300"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <text
                    y={18 + node.val}
                    textAnchor="middle"
                    className="text-[10px] font-medium fill-slate-600 pointer-events-none group-hover:fill-slate-900"
                  >
                    {node.name}
                  </text>
                </g>
              ))}
            </g>
          </svg>
        )}

        {selectedNode && (
          <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-indigo-100 shadow-2xl animate-in slide-in-from-bottom-2 max-w-lg">
            <button 
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                selectedNode.type === 'note' ? 'bg-indigo-100 text-indigo-700' :
                selectedNode.type === 'concept' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {selectedNode.type}
              </span>
              <span className="text-slate-400 text-xs font-mono">ID: {selectedNode.id}</span>
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">{selectedNode.name}</h4>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              This node represents {selectedNode.type === 'note' ? 'an ingested thought' : 'a recurring semantic theme'} extracted from your knowledge base.
            </p>
            <div className="flex gap-2">
              <button className="bg-indigo-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                Open in Assistant
              </button>
              <button className="bg-slate-100 text-slate-600 text-xs px-4 py-2 rounded-lg font-bold hover:bg-slate-200 transition-colors">
                View Neighbors
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrainView;
