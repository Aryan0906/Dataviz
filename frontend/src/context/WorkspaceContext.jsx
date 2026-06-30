import React, { createContext, useContext, useState, useEffect } from 'react';
import { dataAPI as api } from '@/lib/api';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [workspaces, setWorkspaces] = useState([]);
    const [activeWorkspace, setActiveWorkspace] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            fetchWorkspaces();
        } else {
            setWorkspaces([]);
            setActiveWorkspace(null);
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    const fetchWorkspaces = async () => {
        try {
            setIsLoading(true);
            const data = await api.getWorkspaces();
            setWorkspaces(data);
            
            // Auto-select first workspace if none active, or if current active is no longer in list
            if (data.length > 0) {
                if (!activeWorkspace || !data.find(w => w.id === activeWorkspace.id)) {
                    setActiveWorkspace(data[0]);
                }
            } else {
                setActiveWorkspace(null);
            }
        } catch (error) {
            console.error('Error fetching workspaces:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createWorkspace = async (name) => {
        try {
            const newWorkspace = await api.createWorkspace(name);
            setWorkspaces([...workspaces, newWorkspace]);
            setActiveWorkspace(newWorkspace);
            return newWorkspace;
        } catch (error) {
            console.error('Error creating workspace:', error);
            throw error;
        }
    };

    const inviteUser = async (workspaceId, email) => {
        try {
            await api.inviteToWorkspace(workspaceId, email);
        } catch (error) {
            console.error('Error inviting user:', error);
            throw error;
        }
    };

    return (
        <WorkspaceContext.Provider value={{
            workspaces,
            activeWorkspace,
            setActiveWorkspace,
            isLoading,
            fetchWorkspaces,
            createWorkspace,
            inviteUser
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};
