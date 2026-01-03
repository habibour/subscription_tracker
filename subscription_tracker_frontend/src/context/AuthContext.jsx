/**
 * =============================================================================
 * AUTHCONTEXT.JSX - Global Authentication State Management
 * =============================================================================
 *
 * This file manages authentication state across the entire React application
 * using React Context API.
 *
 * WHAT IS CONTEXT?
 * ================
 * Context provides a way to pass data through the component tree without
 * having to pass props down manually at every level.
 *
 * Without Context (Prop Drilling):
 *   App → Header → NavBar → UserMenu → user data
 *   App → Main → Dashboard → SubscriptionList → user data
 *   (You'd have to pass 'user' through every component!)
 *
 * With Context:
 *   AuthContext.Provider (holds user data)
 *        ↓
 *   Any component can access user directly with useAuth()
 *
 * WHY WE NEED THIS:
 * =================
 * - Multiple components need to know if user is logged in
 * - Header shows username, Dashboard fetches user's subscriptions
 * - We need to update all components when user logs in/out
 *
 * =============================================================================
 */

import { createContext, useContext, useState, useEffect } from "react";
// Import our API functions to communicate with the backend
import { authAPI } from "../api/auth";

/**
 * Create the Context
 *
 * createContext() creates a "container" that can hold values
 * and make them accessible to all child components.
 *
 * null is the default value (used if no Provider is found)
 */
const AuthContext = createContext(null);

/**
 * Custom Hook: useAuth()
 *
 * This is a shortcut to access the auth context.
 * Instead of: const context = useContext(AuthContext)
 * We can use: const { user, signIn } = useAuth()
 *
 * It also includes error checking to make debugging easier.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * AuthProvider Component
 *
 * This component wraps the entire app (in App.jsx) and provides
 * authentication state and functions to all child components.
 *
 * STRUCTURE:
 * <AuthProvider>        ← Provides auth context
 *   <App>               ← Can use useAuth()
 *     <Header />        ← Can use useAuth()
 *     <Dashboard />     ← Can use useAuth()
 *   </App>
 * </AuthProvider>
 */
export const AuthProvider = ({ children }) => {
  /**
   * STATE MANAGEMENT
   *
   * user: The currently logged-in user object ({ id, username, email }) or null
   * loading: True while checking if user is already logged in (on page refresh)
   */
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * useEffect - Check for existing session on app load
   *
   * When the app loads (or page refreshes), we check if the user
   * was previously logged in by looking at localStorage.
   *
   * WHY LOCALSTORAGE?
   * - localStorage persists even after browser closes
   * - So users don't have to log in every time they visit
   *
   * FLOW:
   * 1. User logs in → We save token and user to localStorage
   * 2. User closes browser
   * 3. User opens app again → This useEffect runs
   * 4. We find saved data → User is automatically logged in!
   */
  useEffect(() => {
    // Check for stored auth on mount (when component first renders)
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    // If both exist, restore the user session
    if (storedUser && storedToken) {
      // Parse the JSON string back into an object
      setUser(JSON.parse(storedUser));
    }

    // Done checking - stop showing loading state
    setLoading(false);
  }, []); // Empty array means this runs once on mount

  /**
   * Sign Up - Create a new account
   *
   * @param {Object} userData - { username, email, password }
   *
   * FLOW:
   * 1. User fills out signup form and clicks "Create Account"
   * 2. Signup.jsx calls: await signUp({ username, email, password })
   * 3. This function calls the backend API
   * 4. If successful, saves the token and user, updates state
   * 5. React re-renders, user is now logged in!
   */
  const signUp = async (userData) => {
    // Call the backend API (POST /api/v1/auth/sign-up)
    const response = await authAPI.signUp(userData);

    // If signup was successful (backend returns success: true)
    if (response.success) {
      // Save to localStorage for persistence across browser sessions
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Update React state - this triggers re-render across the app
      setUser(response.user);
    }

    return response;
  };

  /**
   * Sign In - Log into existing account
   *
   * @param {Object} credentials - { email, password }
   *
   * FLOW:
   * 1. User fills out login form and clicks "Sign In"
   * 2. Login.jsx calls: await signIn({ email, password })
   * 3. Backend verifies credentials, returns JWT token
   * 4. We save token and user, update state
   * 5. App re-renders, ProtectedRoutes now allow access
   */
  const signIn = async (credentials) => {
    // Call the backend API (POST /api/v1/auth/sign-in)
    const response = await authAPI.signIn(credentials);

    // Backend returns token if credentials are correct
    if (response.token) {
      // Save to localStorage
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Update state - user is now logged in
      setUser(response.user);
    }

    return response;
  };

  /**
   * Sign Out - Log out the user
   *
   * FLOW:
   * 1. User clicks "Sign Out" in the navbar
   * 2. Layout.jsx calls: signOut()
   * 3. We call backend (optional, for server-side cleanup)
   * 4. Clear localStorage and state
   * 5. App re-renders, user is redirected to login
   */
  const signOut = async () => {
    try {
      // Notify the backend (optional - useful for invalidating tokens)
      await authAPI.signOut();
    } catch (error) {
      // Even if backend call fails, we still want to log out locally
      console.error("Sign out error:", error);
    } finally {
      // Clear stored credentials
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Clear state - user is now logged out
      setUser(null);
    }
  };

  /**
   * Context Value
   *
   * This object contains everything that child components can access.
   * Any component using useAuth() gets these values/functions:
   *
   * const { user, loading, isAuthenticated, signUp, signIn, signOut } = useAuth();
   */
  const value = {
    user, // The current user object or null
    loading, // True while checking localStorage
    isAuthenticated: !!user, // Boolean: is user logged in? (converts user to true/false)
    signUp, // Function to create account
    signIn, // Function to log in
    signOut, // Function to log out
  };

  /**
   * Provide the context to all children
   *
   * <AuthContext.Provider value={...}> makes the value accessible
   * to any nested component that calls useContext(AuthContext) or useAuth()
   */
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
