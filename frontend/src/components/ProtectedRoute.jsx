import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Bypass redirect for development
        // if (!isLoading && !isAuthenticated) {
        //     navigate("/");
        // }
    }, [isAuthenticated, isLoading, navigate]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    // if (!isAuthenticated) {
    //     return null;
    // }

    return <>{children}</>;
};
