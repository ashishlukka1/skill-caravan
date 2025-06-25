import React, { createContext, useState, useEffect } from "react";
import axios from "../utils/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await axios.get("/api/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data);
          sessionStorage.setItem("user", JSON.stringify(res.data)); 
        } catch (err) {
          console.error("Auth check failed:", err);
          localStorage.removeItem("token");
          setUser(null);
          sessionStorage.removeItem("user");
        }
      } else {
        setUser(null);
        sessionStorage.removeItem("user");
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};