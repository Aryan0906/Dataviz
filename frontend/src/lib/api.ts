// API configuration and utility functions
const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  message: string;
}

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

// Auth API calls
export const authAPI = {
  signup: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }
    return response.json();
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  },

  verify: async (token: string): Promise<{ valid: boolean; userId: number; email: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Token verification failed');
    }
    return response.json();
  }
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

  save: async (token: string, title: string, dataPoints: any, regressionType: string, equation: string, rSquared: number): Promise<{ id: number; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/data/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, dataPoints, regressionType, equation, rSquared })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save analysis');
    }
    return response.json();
  },

  getAnalyses: async (token: string): Promise<SavedAnalysis[]> => {
    const response = await fetch(`${API_BASE_URL}/data/analyses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch analyses');
    }
    const data = await response.json();
    return data.analyses;
  },

  getAnalysis: async (token: string, id: number): Promise<SavedAnalysis & { data_points: any[] }> => {
    const response = await fetch(`${API_BASE_URL}/data/analyses/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch analysis');
    }
    return response.json();
  },

  deleteAnalysis: async (token: string, id: number): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/data/analyses/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to delete analysis');
    }
    return response.json();
  }
};
