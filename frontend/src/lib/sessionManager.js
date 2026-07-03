/**
 * Session Manager - Persist and restore page state across refreshes
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Generate a unique session ID for the current browser session
const getSessionId = (pageType) => {
    const storageKey = `session_id_${pageType}`;
    let sessionId = sessionStorage.getItem(storageKey);
    
    if (!sessionId) {
        sessionId = `${pageType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem(storageKey, sessionId);
    }
    
    return sessionId;
};

// Get user ID from session storage or use anonymous
const getUserId = () => {
    try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        return session?.user?.id || 'anonymous';
    } catch {
        return 'anonymous';
    }
};

/**
 * Save current page state to database
 * @param {string} pageType - Type of page ('categorical', 'regression', 'curve')
 * @param {object} stateData - Complete state object to save
 * @returns {Promise<object>} Response with session_id
 */
export const savePageSession = async (pageType, stateData) => {
    try {
        const sessionId = getSessionId(pageType);
        const userId = getUserId();
        
        console.log(`[SessionManager] Saving session for ${pageType}`, { sessionId, userId });
        
        const response = await fetch(`${API_URL}/session/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                session_id: sessionId,
                page_type: pageType,
                state_data: stateData,
            }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('[SessionManager] Save failed:', errorData);
            throw new Error('Failed to save session');
        }
        
        const result = await response.json();
        console.log('[SessionManager] Save successful:', result);
        return result;
    } catch (error) {
        console.error('[SessionManager] Error saving page session:', error);
        throw error;
    }
};

/**
 * Restore page state from database
 * @param {string} pageType - Type of page
 * @returns {Promise<object|null>} Restored state data or null if not found
 */
export const restorePageSession = async (pageType) => {
    try {
        const sessionId = getSessionId(pageType);
        
        console.log(`[SessionManager] Restoring session for ${pageType}`, { sessionId });
        
        const response = await fetch(`${API_URL}/session/get?session_id=${sessionId}`);
        
        if (response.status === 404) {
            console.log('[SessionManager] No saved session found (404)');
            return null; // No saved session
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('[SessionManager] Restore failed:', errorData);
            throw new Error('Failed to restore session');
        }
        
        const data = await response.json();
        if (data.not_found || data.error === 'Session not found') {
            console.log('[SessionManager] No saved session found');
            return null;
        }
        
        console.log('[SessionManager] Restore successful:', data);
        return data.state_data;
    } catch (error) {
        console.error('[SessionManager] Error restoring page session:', error);
        return null;
    }
};

/**
 * Get all sessions for current user
 * @param {string} pageType - Optional filter by page type
 * @returns {Promise<Array>} List of sessions
 */
export const getUserSessions = async (pageType = null) => {
    try {
        const userId = getUserId();
        let url = `${API_URL}/session/list?user_id=${userId}`;
        
        if (pageType) {
            url += `&page_type=${pageType}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to get sessions');
        }
        
        const data = await response.json();
        return data.sessions || [];
    } catch (error) {
        console.error('Error getting user sessions:', error);
        return [];
    }
};

/**
 * Delete a specific session
 * @param {string} sessionId - Session ID to delete
 * @returns {Promise<object>} Response message
 */
export const deletePageSession = async (sessionId) => {
    try {
        const response = await fetch(`${API_URL}/session/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ session_id: sessionId }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete session');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error deleting session:', error);
        throw error;
    }
};

/**
 * Save action to user history
 * @param {string} pageType - Type of page
 * @param {string} actionType - Type of action ('create', 'update', 'delete', 'view', 'export')
 * @param {string} title - Optional title for the action
 * @param {object} snapshotData - Data snapshot at time of action
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} Response with history_id
 */
export const saveToHistory = async (pageType, actionType, title, snapshotData, metadata = {}) => {
    try {
        const userId = getUserId();
        
        const response = await fetch(`${API_URL}/history/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                page_type: pageType,
                action_type: actionType,
                title,
                snapshot_data: snapshotData,
                metadata,
            }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to save to history');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error saving to history:', error);
        throw error;
    }
};

/**
 * Get user history with optional filters
 * @param {string} pageType - Optional filter by page type
 * @param {string} actionType - Optional filter by action type
 * @param {number} limit - Number of records to retrieve (default: 50)
 * @returns {Promise<Array>} List of history entries
 */
export const getUserHistory = async (pageType = null, actionType = null, limit = 50) => {
    try {
        const userId = getUserId();
        let url = `${API_URL}/history/get?user_id=${userId}&limit=${limit}`;
        
        if (pageType) {
            url += `&page_type=${pageType}`;
        }
        if (actionType) {
            url += `&action_type=${actionType}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to get history');
        }
        
        const data = await response.json();
        return data.history || [];
    } catch (error) {
        console.error('Error getting user history:', error);
        return [];
    }
};

/**
 * Restore a specific history entry
 * @param {number} historyId - History entry ID
 * @returns {Promise<object>} History entry data
 */
export const restoreFromHistory = async (historyId) => {
    try {
        const response = await fetch(`${API_URL}/history/restore?history_id=${historyId}`);
        
        if (!response.ok) {
            throw new Error('Failed to restore from history');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error restoring from history:', error);
        throw error;
    }
};

/**
 * Store a one-time history snapshot that can be restored by a page session hook.
 * @param {string} pageType
 * @param {object} snapshotData
 */
export const queueHistoryRestore = (pageType, snapshotData) => {
    sessionStorage.setItem(
        'pending_history_restore',
        JSON.stringify({ pageType, snapshotData })
    );
};

/**
 * Auto-save hook - Debounced save function
 * @param {Function} callback - Function to call for saving
 * @param {number} delay - Debounce delay in ms (default: 2000)
 * @returns {Function} Debounced save function
 */
export const createAutoSave = (callback, delay = 2000) => {
    let timeoutId;
    
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            callback(...args);
        }, delay);
    };
};
