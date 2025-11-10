import React, { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  // Fetch user data when token changes
  useEffect(() => {
    if (token) {
      apiRequest("/auth/me", "GET", null, token)
        .then(setUser)
        .catch(() => {
          // Token invalid, clear it
          setToken(null);
          setUser(null);
        });
    } else {
      setUser(null);
    }
  }, [token]);

  async function login(email, password) {
    const data = await apiRequest("/auth/login", "POST", { email, password });
    setToken(data.access_token);
    return data;
  }

  async function register(name, email, password) {
    const data = await apiRequest("/auth/register", "POST", { name, email, password });
    setToken(data.access_token);
    return data;
  }

  async function googleLogin(googleToken) {
    const data = await apiRequest("/auth/google", "POST", { token: googleToken });
    setToken(data.access_token);
    return data;
  }

  async function facebookLogin(accessToken, userID) {
    const data = await apiRequest("/auth/facebook", "POST", { accessToken, userID });
    setToken(data.access_token);
    return data;
  }

  async function twitterLogin(access_token, access_token_secret) {
    const data = await apiRequest("/auth/twitter", "POST", { access_token, access_token_secret });
    setToken(data.access_token);
    return data;
  }

  async function telegramLogin(telegramData) {
    const data = await apiRequest("/auth/telegram", "POST", telegramData);
    setToken(data.access_token);
    return data;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{
      token,
      user,
      setUser,
      login,
      register,
      googleLogin,
      facebookLogin,
      twitterLogin,
      telegramLogin,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
