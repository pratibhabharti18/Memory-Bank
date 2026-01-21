
export interface User {
  id: string;
  name: string;
  email: string;
  authProvider: 'google' | 'local';
  profilePic?: string;
  isVerified: boolean;
  createdAt: number;
}

export interface Note {
  id: string;
  userId: string; // Critical for data isolation
  type: 'pdf' | 'voice' | 'image' | 'url' | 'text';
  title: string;
  original_file: {
    url: string;
    name: string;
    mime_type: string;
  };
  extracted_text: string;
  summary: string;
  timestamp: number;
  tags: string[];
  entities: string[];
  isDeleted: boolean;
  deletedAt?: number;
}

export interface GraphNode {
  id: string;
  name: string;
  type: 'concept' | 'entity' | 'note';
  val: number;
}

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
