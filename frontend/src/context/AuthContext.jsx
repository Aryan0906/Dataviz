import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({
    session: null,
    user: null,
    loading: true,
    isAuthenticated: false,
    isGuest: false,
    loginAsGuest: () => {},
    signOut: async () => { }
});

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(sessionStorage.getItem('isGuest') === 'true');

    useEffect(() => {
        // Check for local Django auth first
        const localUser = localStorage.getItem('local_auth_user');
        const localToken = localStorage.getItem('local_auth_token');
        if (localUser && localToken) {
            try {
                const parsedUser = JSON.parse(localUser);
                setUser(parsedUser);
                setSession({ access_token: localToken, user: parsedUser });
                setLoading(false);
                return;
            } catch {
                // Invalid stored data, clear and fall through
                localStorage.removeItem('local_auth_user');
                localStorage.removeItem('local_auth_token');
            }
        }

        // Check Supabase sessions
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        }).catch(() => {
            // Supabase unreachable
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

    const loginAsGuest = () => {
        sessionStorage.setItem('isGuest', 'true');
        setIsGuest(true);
    };

    // Called by Login.jsx after successful local Django auth
    const setLocalAuth = (userData, token) => {
        localStorage.setItem('local_auth_user', JSON.stringify(userData));
        localStorage.setItem('local_auth_token', token);
        setUser(userData);
        setSession({ access_token: token, user: userData });
    };

    const signOut = async () => {
        if (isGuest) {
            sessionStorage.removeItem('isGuest');
            setIsGuest(false);
        } else {
            // Clear local auth
            localStorage.removeItem('local_auth_user');
            localStorage.removeItem('local_auth_token');
            try {
                await supabase.auth.signOut();
            } catch {
                // Supabase offline, just clear local state
            }
        }
        setSession(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            session, user, loading,
            isAuthenticated: !!session || isGuest,
            isGuest, loginAsGuest, setLocalAuth, signOut
        }}>
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
