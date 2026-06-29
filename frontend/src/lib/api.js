// API configuration and utility functions
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
    analyze: async (dataPoints) => {
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

    save: async (title, dataPoints, regressionType, equation, rSquared) => {
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

    getAnalyses: async () => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/data/analyses`, {
            headers
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 404) return [];
            throw new Error('Failed to fetch analyses');
        }
        const data = await response.json();
        return data.analyses || [];
    },

    getAnalysis: async (id) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/data/analyses/${id}`, {
            headers
        });
        if (!response.ok) {
            throw new Error('Failed to fetch analysis');
        }
        return response.json();
    },

    deleteAnalysis: async (id) => {
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
    async saveDraft(draftData) {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/data/draft/save`, {
            method: 'POST',
            headers,
            body: JSON.stringify(draftData),
        });
        if (!res.ok) throw new Error(`Failed to save draft: ${res.statusText}`);
        return res.json();
    },

    async getDraft() {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/data/draft/get`, { headers });
        if (!res.ok) {
           if (res.status === 401 || res.status === 404) return { draft: null };
           throw new Error(`Failed to get draft: ${res.statusText}`);
        }
        return res.json();
    },

    async deleteDraft() {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/data/draft/delete`, {
            method: 'DELETE',
            headers,
        });
        if (!res.ok) throw new Error(`Failed to delete draft: ${res.statusText}`);
        return res.json();
    },

    async finalizeDraft(data) {
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
    async uploadCSV(file) {
        const headers = await getAuthHeaders();
        const formData = new FormData();
        formData.append('file', file);

        // Remove Content-Type header to let browser set multipart boundary
        const headersWithoutContentType = { ...headers };
        delete headersWithoutContentType['Content-Type'];

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

    async queryAI(visualizationId, query) {
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

    async getLatestVisualization() {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/ai/latest`, { headers });
        if (!res.ok) {
            if (res.status === 401 || res.status === 404) return { visualization: null };
            throw new Error('Failed to fetch latest visualization');
        }
        return res.json();
    },

    async saveVisualizationToHistory(visualizationId, title) {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/ai/save`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ visualization_id: visualizationId, title }),
        });
        if (!res.ok) throw new Error('Failed to save visualization to history');
        return res.json();
    },

    // Data health and cleaning endpoints
    async checkDataHealth(filePath) {
        const res = await fetch(`${API_BASE_URL}/data/check-health`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_path: filePath }),
        });
        if (!res.ok) throw new Error('Failed to check data health');
        return res.json();
    },

    async cleanData(filePath, operations) {
        const res = await fetch(`${API_BASE_URL}/data/clean`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_path: filePath, operations }),
        });
        if (!res.ok) throw new Error('Failed to clean data');
        return res.json();
    },

    async getCorrelationMatrix(filePath) {
        const res = await fetch(`${API_BASE_URL}/data/correlation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_path: filePath }),
        });
        if (!res.ok) throw new Error('Failed to get correlation matrix');
        return res.json();
    },

    async generateCode(dataPoints, codeType, options = {}) {
        const res = await fetch(`${API_BASE_URL}/data/generate-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data_points: dataPoints, code_type: codeType, ...options }),
        });
        if (!res.ok) throw new Error('Failed to generate code');
        return res.json();
    },
};

// Custom error class for AI timeout errors
export class AITimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AITimeoutError';
    }
}
