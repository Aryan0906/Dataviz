import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext({
    session: null,
    user: null,
    loading: true,
    isAuthenticated: false,
    signOut: async () => { }
});

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }

        // Check active sessions and subscribe to auth changes
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error('Failed to retrieve session:', error.message);
                setSession(null);
                setUser(null);
                setLoading(false);
                return;
            }
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        }).catch((err) => {
            console.error('Failed to connect to authentication service:', err.message);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, isAuthenticated: !!session, signOut }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
