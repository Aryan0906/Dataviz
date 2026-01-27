import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook for subscribing to Supabase real-time database changes.
 * 
 * @param tableName - Name of the database table to subscribe to
 * @param event - Type of event to listen for ('INSERT', 'UPDATE', 'DELETE', or '*' for all)
 * @param callback - Function to call when an event occurs
 * 
 * @example
 * ```tsx
 * useRealtimeSubscription('visualizations', 'INSERT', (payload) => {
 *   console.log('New visualization:', payload.new);
 *   setVisualizations(prev => [payload.new, ...prev]);
 * });
 * ```
 */
export function useRealtimeSubscription(
    tableName,
    event,
    callback
) {
    const channelRef = useRef(null);

    useEffect(() => {
        // Create a unique channel name to avoid conflicts
        const channelName = `${tableName}_${event}_${Date.now()}`;

        // Subscribe to database changes
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes', // Type assertion for Supabase realtime
                {
                    event: event,
                    schema: 'public',
                    table: tableName,
                },
                (payload) => {
                    callback(payload);
                }
            )
            .subscribe();

        channelRef.current = channel;

        // Cleanup: unsubscribe when component unmounts
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [tableName, event, callback]);
}

/**
 * Hook specifically for visualizations table with optimistic UI support.
 * 
 * @param onInsert - Callback when a new visualization is inserted
 * @param onUpdate - Callback when a visualization is updated
 * 
 * @example
 * ```tsx
 * useVisualizationSubscription(
 *   (newViz) => setVisualizations(prev => [newViz, ...prev]),
 *   (updatedViz) => setVisualizations(prev => 
 *     prev.map(v => v.id === updatedViz.id ? updatedViz : v)
 *   )
 * );
 * ```
 */
export function useVisualizationSubscription(
    onInsert,
    onUpdate
) {
    const channelRef = useRef(null);

    useEffect(() => {
        const channel = supabase
            .channel('visualizations_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'visualizations',
                },
                (payload) => {
                    onInsert?.(payload.new);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'visualizations',
                },
                (payload) => {
                    onUpdate?.(payload.new);
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [onInsert, onUpdate]);
}
