
export interface Note {
  id: string;
  type: 'pdf' | 'voice' | 'image' | 'url' | 'text';
  title: string;
  original_file: {
    url: string;      // Data URL or storage path
    name: string;
    mime_type: string;
  };
  extracted_text: string; // Used for RAG/Embeddings
  summary: string;        // AI-generated summary for UI
  timestamp: number;
  tags: string[];
  entities: string[];
  isDeleted: boolean;
  deletedAt?: number;
}

// Added GraphNode export to resolve import error in BrainView.tsx
export interface GraphNode {
  id: string;
  name: string;
  type: 'concept' | 'entity' | 'note';
  val: number;
}

// Added GraphLink export to resolve import error in BrainView.tsx
export interface GraphLink {
  source: string;
  target: string;
  relationship: string;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'pattern' | 'suggestion' | 'recap';
}