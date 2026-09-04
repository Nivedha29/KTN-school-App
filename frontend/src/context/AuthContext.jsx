import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  async function loadCurrentUser() {
    try {
      const response = await fetch(
        `${API_URL}/auth/me`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();

      setUser(data.user || null);
    } catch (error) {
      console.error(
        "Unable to load user:",
        error
      );

      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const response = await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to login"
      );
    }

    setUser(data.user || null);

    return data.user;
  }

  async function registerParent(
    name,
    email,
    password,
    phone
  ) {
    const response = await fetch(
      `${API_URL}/auth/register/parent`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          name,
          email,
          password,
          phone,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to create parent account"
      );
    }

    setUser(data.user || null);

    return data.user;
  }

  async function logout() {
    try {
      await fetch(
        `${API_URL}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,

        login,
        registerParent,
        logout,

        isAuthenticated:
          Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}