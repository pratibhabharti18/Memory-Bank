
export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  tags: string[];
  source?: string;
  entities: string[];
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
