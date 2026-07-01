import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const NetworkStatus = () => {
    const [status, setStatus] = useState({ online: true, database: 'checking', pending_sync: 0 });
    const [syncing, setSyncing] = useState(false);
    const [visible, setVisible] = useState(false);

    const checkStatus = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/db/sync-status`);
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
                // Show indicator when offline or has pending sync
                setVisible(!data.online || data.pending_sync > 0);
            }
        } catch {
            setStatus({ online: false, database: 'sqlite', pending_sync: 0 });
            setVisible(true);
        }
    }, []);

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, [checkStatus]);

    // Auto-sync when coming back online
    useEffect(() => {
        if (status.online && status.pending_sync > 0) {
            triggerSync();
        }
    }, [status.online]);

    const triggerSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch(`${API_BASE}/db/sync`, { method: 'POST' });
            if (res.ok) {
                await checkStatus();
            }
        } catch {
            // Ignore
        } finally {
            setSyncing(false);
        }
    };

    if (!visible) return null;

    return (
        <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                status.online
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
            }`}
        >
            {status.online ? (
                <Cloud className="h-3.5 w-3.5" />
            ) : (
                <CloudOff className="h-3.5 w-3.5" />
            )}

            <span>
                {status.online ? 'Supabase' : 'Offline (SQLite)'}
            </span>

            {status.pending_sync > 0 && (
                <>
                    <span className="opacity-50">•</span>
                    <span className="tabular-nums">{status.pending_sync} pending</span>
                    {status.online && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={triggerSync}
                            disabled={syncing}
                            className="h-5 w-5 p-0 ml-0.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                        >
                            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                        </Button>
                    )}
                </>
            )}
        </div>
    );
};

export default NetworkStatus;
