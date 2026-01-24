// API configuration and utility functions
import { supabase } from './supabase';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

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

// Helper to get auth headers with Supabase access token
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
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
    const response = await fetch(`${API_BASE_URL}/data/analyses/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) {
      throw new Error('Failed to delete analysis');
    }
    return response.json();
  }
};
