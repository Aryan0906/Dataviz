// API configuration and utility functions
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api';

export interface AnalysisResult {
  type: string;
  equation: string;
  r2: number;
  predictions: [number, number][];
}

export interface SavedAnalysis {
  id: number;
  title: string;
  regression_type: string;
  equation: string;
  r_squared: number;
  created_at: string;
}

// Session cache to avoid repeated getSession() calls
let cachedSession: Session | null = null;
let sessionExpiry: number = 0;

// Helper to get auth headers with Supabase access token
const getAuthHeaders = async () => {
  const now = Date.now();

  // Return cached session if still valid (cached for 1 minute)
  if (cachedSession && now < sessionExpiry) {
    return {
      'Authorization': `Bearer ${cachedSession.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  // Fetch new session and cache it
  const { data: { session } } = await supabase.auth.getSession();
  cachedSession = session;
  sessionExpiry = now + 60000; // Cache for 1 minute

  return {
    'Authorization': `Bearer ${session?.access_token || ''}`,
    'Content-Type': 'application/json',
  };
};

// Data API calls
export const dataAPI = {
  analyze: async (dataPoints: { x: number; y: number }[]): Promise<AnalysisResult> => {
    const response = await fetch(`${API_BASE_URL}/data/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataPoints })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }
    return response.json();
  },

  save: async (title: string, dataPoints: any, regressionType: string, equation: string, rSquared: number): Promise<{ id: number; message: string }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/data/save`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, dataPoints, regressionType, equation, rSquared })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save analysis');
    }
    return response.json();
  },

  getAnalyses: async (): Promise<SavedAnalysis[]> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/data/analyses`, {
      headers
    });
    if (!response.ok) {
      throw new Error('Failed to fetch analyses');
    }
    const data = await response.json();
    return data.analyses;
  },

  getAnalysis: async (id: number): Promise<SavedAnalysis & { data_points: any[] }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/data/analyses/${id}`, {
      headers
    });
    if (!response.ok) {
      throw new Error('Failed to fetch analysis');
    }
    return response.json();
  },

  deleteAnalysis: async (id: number): Promise<{ message: string }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/data/analyses/${id}/delete`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) {
      throw new Error('Failed to delete analysis');
    }
    return response.json();
  },

  // Draft analysis operations
  async saveDraft(draftData: {
    title?: string;
    dataPoints: any[];
    categories: any[];
    tabType: string;
    regressionType?: string;
    polynomialDegree?: number;
  }): Promise<{ id: number; message: string; updated_at: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/data/draft/save`, {
      method: 'POST',
      headers,
      body: JSON.stringify(draftData),
    });
    if (!res.ok) throw new Error(`Failed to save draft: ${res.statusText}`);
    return res.json();
  },

  async getDraft(): Promise<{ draft: any | null }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/data/draft/get`, { headers });
    if (!res.ok) throw new Error(`Failed to get draft: ${res.statusText}`);
    return res.json();
  },

  async deleteDraft(): Promise<{ message: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/data/draft/delete`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error(`Failed to delete draft: ${res.statusText}`);
    return res.json();
  },

  async finalizeDraft(data: {
    title: string;
    equation?: string;
    r2?: number;
  }): Promise<{ id: number; message: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/data/draft/finalize`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to finalize draft: ${res.statusText}`);
    return res.json();
  },

  // AI-powered analysis endpoints
  async uploadCSV(file: File): Promise<{
    message: string;
    visualization_id: number;
    metadata: any;
    cleaning_analysis: {
      issues: string[];
      suggested_actions: string[];
      summary: string;
    };
  }> {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);

    // Remove Content-Type header to let browser set multipart boundary
    const headersWithoutContentType: Record<string, string> = { ...headers };
    delete (headersWithoutContentType as any)['Content-Type'];

    const res = await fetch(`${API_BASE_URL}/ai/upload-csv`, {
      method: 'POST',
      headers: headersWithoutContentType,
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      if (error.code === 'ERR_AI_TIMEOUT') {
        throw new AITimeoutError(error.error);
      }
      throw new Error(error.error || 'Upload failed');
    }

    return res.json();
  },

  async queryAI(visualizationId: number, query: string): Promise<{
    message: string;
    chart_config: {
      chartType: 'bar' | 'line' | 'scatter' | 'pie';
      xAxisKey: string;
      dataKeys: string[];
      title: string;
      summary: string;
    };
    chart_data: any[];
  }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/ai/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        visualization_id: visualizationId,
        query,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      if (error.code === 'ERR_AI_TIMEOUT') {
        throw new AITimeoutError(error.error);
      }
      throw new Error(error.error || 'Query failed');
    }

    return res.json();
  },

  async getLatestVisualization(): Promise<{ visualization: any | null }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/ai/latest`, { headers });
    if (!res.ok) throw new Error('Failed to fetch latest visualization');
    return res.json();
  },

  async saveVisualizationToHistory(visualizationId: number, title?: string): Promise<{ id: number; message: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/ai/save`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ visualization_id: visualizationId, title }),
    });
    if (!res.ok) throw new Error('Failed to save visualization to history');
    return res.json();
  },
};

// Custom error class for AI timeout errors
export class AITimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AITimeoutError';
  }
}

