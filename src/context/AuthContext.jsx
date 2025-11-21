import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("jwt_token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData, jwtToken) => {
    const userWithId = { ...userData, id: Date.now() };
    setUser(userWithId);
    localStorage.setItem("user", JSON.stringify(userWithId));
    localStorage.setItem("jwt_token", jwtToken); 
  };

  const logout = () => {
    setUser(null);
    setCurrentProject(null);
    localStorage.removeItem("user");
    localStorage.removeItem("jwt_token");
  };

  const setProject = (project, userRole) => {
    setCurrentProject({ ...project, userRole });
  };

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