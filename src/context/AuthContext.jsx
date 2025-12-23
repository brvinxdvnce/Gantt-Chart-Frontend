import { createContext, useState, useEffect, useCallback } from "react";
import { AUTH_EVENTS } from "../services/apiService.js";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = useCallback((userData, token) => {
    if (!userData) return;

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    if (token) {
      localStorage.setItem("jwt_token", token);
    } else {
      localStorage.removeItem("jwt_token");
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCurrentProject(null);
    localStorage.removeItem("user");
    localStorage.removeItem("jwt_token");
  }, []);

  const setProject = (project, role) => {
  if (!project) {
    setCurrentProject(null);
    return;
  }

  setCurrentProject({
    id: project.id,
    name: project.name,
    role: role
  });
};

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener(AUTH_EVENTS.unauthorized, handleUnauthorized);
    return () =>
      window.removeEventListener(
        AUTH_EVENTS.unauthorized,
        handleUnauthorized
      );
  }, [logout]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout,
      currentProject,
      setProject
    }}>
      {children}
    </AuthContext.Provider>
  );
}
