
import { GoogleGenAI, Type } from "@google/genai";
import { Note, KnowledgeGraphData, Insight } from '../types';

// Always use named parameter for apiKey and rely on process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert File or Blob to Base64
const toBase64 = (file: File | Blob): Promise<string> => 
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

export const extractKnowledge = async (
  text: string, 
  mode: 'text' | 'pdf' | 'url' | 'voice' | 'image' = 'text',
  attachment?: File | Blob
): Promise<{ tags: string[], entities: string[], summary: string }> => {
  
  const parts: any[] = [{ text: `Analyze this content (${mode} source) and extract key metadata: \n\n ${text}` }];
  
  if (attachment) {
    const base64Data = await toBase64(attachment);
    const mimeType = attachment.type || (mode === 'image' ? 'image/jpeg' : 'audio/webm');
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          entities: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING }
        },
        required: ["tags", "entities", "summary"]
      }
    }
  });
  
  // Use .text property as per guidelines
  return JSON.parse(response.text);
};

export const discoverRelationships = async (notes: Note[]): Promise<KnowledgeGraphData> => {
  // Fix: Note.content does not exist. Use extracted_text.
  const context = notes.map(n => `ID:${n.id}|Title:${n.title}|Content:${n.extracted_text.substring(0, 100)}...`).join('\n');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on these notes, identify semantic relationships between them and key entities. 
    Notes:
    ${context}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['concept', 'entity', 'note'] },
                val: { type: Type.NUMBER }
              },
              required: ["id", "name", "type", "val"]
            }
          },
          links: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                target: { type: Type.STRING },
                relationship: { type: Type.STRING }
              },
              required: ["source", "target", "relationship"]
            }
          }
        },
        required: ["nodes", "links"]
      }
    }
  });
  
  // Use .text property as per guidelines
  return JSON.parse(response.text);
};

export const chatWithKnowledge = async (query: string, notes: Note[], history: any[]): Promise<string> => {
  // Fix: Note.content does not exist. Use extracted_text.
  const context = notes.map(n => `[Source: ${n.title}] ${n.extracted_text}`).join('\n\n');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `System: You are an AI Second Brain Assistant. Use the provided context from the user's personal notes to answer questions. If you don't know based on the notes, say so.
    
    Context:
    ${context}
    
    Question: ${query}`,
    config: {
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 2000 }
    }
  });
  
  // Use .text property as per guidelines
  return response.text || "I couldn't find relevant information in your notes.";
};

export const generateInsights = async (notes: Note[]): Promise<Insight[]> => {
  if (notes.length < 2) return [];
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    // Fix: Note.content does not exist. Use extracted_text.
    contents: `Analyze these notes and generate 3 "Second Brain" insights. 
    Look for patterns, forgotten ideas, or potential connections the user might have missed.
    
    Notes:
    ${notes.map(n => n.extracted_text).join('\n---\n')}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['pattern', 'suggestion', 'recap'] }
          },
          required: ["id", "title", "description", "type"]
        }
      }
    }
  });
  
  // Use .text property as per guidelines
  return JSON.parse(response.text);
};