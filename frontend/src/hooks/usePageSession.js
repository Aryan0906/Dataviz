/**
 * Custom React Hook for Page Session Management
 * Auto-saves state and restores on mount
 */

import { useEffect, useRef, useCallback } from 'react';
import { savePageSession, restorePageSession, saveToHistory, createAutoSave } from '@/lib/sessionManager';
import { toast } from 'sonner';

/**
 * Hook to persist page state across refreshes
 * @param {string} pageType - Type of page ('categorical', 'regression', 'curve')
 * @param {object} currentState - Current state object to persist
 * @param {Function} setStateCallback - Function to restore state
 * @param {number} autoSaveDelay - Auto-save delay in ms (default: 2000)
 * @returns {object} - { saveNow, isRestoring }
 */
export const usePageSession = (pageType, currentState, setStateCallback, autoSaveDelay = 2000) => {
    const isRestoringRef = useRef(false);
    const isMountedRef = useRef(false);
    const hasRestoredRef = useRef(false);
    const autoSaveRef = useRef(null);

    // Restore session on mount
    useEffect(() => {
        const restoreSession = async () => {
            try {
                isRestoringRef.current = true;
                console.log(`[PageSession] Attempting to restore ${pageType} session...`);
                const savedState = await restorePageSession(pageType);
                
                if (savedState && setStateCallback) {
                    console.log(`[PageSession] Restoring state for ${pageType}:`, savedState);
                    setStateCallback(savedState);
                    hasRestoredRef.current = true;
                    toast.success('Previous session restored!', {
                        description: 'Your work has been recovered.',
                        duration: 3000,
                    });
                } else {
                    console.log(`[PageSession] No saved state found for ${pageType}`);
                    hasRestoredRef.current = true;
                }
            } catch (error) {
                console.error('[PageSession] Failed to restore session:', error);
                hasRestoredRef.current = true;
            } finally {
                isRestoringRef.current = false;
                isMountedRef.current = true;
            }
        };

        restoreSession();
    }, [pageType, setStateCallback]);

    // Auto-save functionality
    useEffect(() => {
        // Don't auto-save until restoration is complete
        if (!hasRestoredRef.current || !isMountedRef.current) {
            console.log(`[PageSession] Skipping auto-save - not ready yet`);
            return;
        }

        // Create debounced save function
        if (!autoSaveRef.current) {
            autoSaveRef.current = createAutoSave(async (state) => {
                try {
                    console.log(`[PageSession] Auto-saving ${pageType}...`);
                    await savePageSession(pageType, state);
                    console.log(`[PageSession] Auto-saved ${pageType} successfully`);
                } catch (error) {
                    console.error('[PageSession] Auto-save failed:', error);
                }
            }, autoSaveDelay);
        }

        // Trigger auto-save when state changes
        autoSaveRef.current(currentState);
    }, [currentState, pageType, autoSaveDelay]);

    // Manual save function
    const saveNow = useCallback(async () => {
        try {
            await savePageSession(pageType, currentState);
            toast.success('Session saved successfully!');
            return true;
        } catch (error) {
            console.error('Failed to save session:', error);
            toast.error('Failed to save session');
            return false;
        }
    }, [pageType, currentState]);

    return {
        saveNow,
        isRestoring: isRestoringRef.current,
    };
};

/**
 * Hook to track user actions in history
 * @param {string} pageType - Type of page
 * @returns {Function} - Function to log actions
 */
export const useHistoryTracking = (pageType) => {
    const logAction = useCallback(async (actionType, title, snapshotData, metadata = {}) => {
        try {
            await saveToHistory(pageType, actionType, title, snapshotData, metadata);
            console.log('Action logged:', actionType, title);
        } catch (error) {
            console.error('Failed to log action:', error);
        }
    }, [pageType]);

    return logAction;
};

/**
 * Hook to track data changes and log to history
 * @param {string} pageType - Type of page
 * @param {object} dataToTrack - Data object to track
 * @param {string} title - Title for the history entry
 * @param {number} debounceDelay - Delay before logging (default: 3000ms)
 */
export const useDataChangeTracking = (pageType, dataToTrack, title, debounceDelay = 3000) => {
    const logAction = useHistoryTracking(pageType);
    const timeoutRef = useRef(null);
    const previousDataRef = useRef(null);

    useEffect(() => {
        // Skip initial render
        if (previousDataRef.current === null) {
            previousDataRef.current = dataToTrack;
            return;
        }

        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout to log change
        timeoutRef.current = setTimeout(() => {
            const dataChanged = JSON.stringify(previousDataRef.current) !== JSON.stringify(dataToTrack);
            
            if (dataChanged) {
                logAction('update', title, dataToTrack, {
                    timestamp: new Date().toISOString(),
                    changeType: 'auto',
                });
                previousDataRef.current = dataToTrack;
            }
        }, debounceDelay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [dataToTrack, logAction, title, debounceDelay]);
};

/**
 * Hook for manual history logging with common actions
 * @param {string} pageType - Type of page
 * @returns {object} - Object with logging functions
 */
export const useHistoryLogger = (pageType) => {
    const logAction = useHistoryTracking(pageType);

    return {
        logCreate: useCallback((title, data, metadata) => {
            return logAction('create', title, data, { ...metadata, action: 'create' });
        }, [logAction]),
        
        logUpdate: useCallback((title, data, metadata) => {
            return logAction('update', title, data, { ...metadata, action: 'update' });
        }, [logAction]),
        
        logDelete: useCallback((title, data, metadata) => {
            return logAction('delete', title, data, { ...metadata, action: 'delete' });
        }, [logAction]),
        
        logView: useCallback((title, data, metadata) => {
            return logAction('view', title, data, { ...metadata, action: 'view' });
        }, [logAction]),
        
        logExport: useCallback((title, data, metadata) => {
            return logAction('export', title, data, { ...metadata, action: 'export' });
        }, [logAction]),
    };
};
