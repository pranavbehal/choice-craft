/**
 * Authentication Context
 *
 * Manages global authentication state and provides auth-related functionality.
 * Handles user sessions, Google OAuth integration, and auth state persistence.
 *
 * @context
 * @requires Supabase
 */

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/** Authentication context type definition */
type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);

      // Debug session storage
      console.log("Auth Context - Cookies:", document.cookie);
      console.log("Auth Context - Local Storage:", {
        accessToken: localStorage.getItem("supabase.auth.token"),
        refreshToken: localStorage.getItem("supabase.auth.refreshToken"),
      });

      // Log initial session state
      if (initialSession?.user) {
        console.log("Initial User Session:", {
          id: initialSession.user.id,
          email: initialSession.user.email,
          name: initialSession.user.user_metadata.full_name,
          avatar: initialSession.user.user_metadata.avatar_url,
        });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth State Change:", event);

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Log user info on sign in
      if (event === "SIGNED_IN" && session?.user) {
        console.log("User Signed In:", {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata.full_name,
          avatar: session.user.user_metadata.avatar_url,
          metadata: session.user.user_metadata,
        });
      }

      // Log when user signs out
      if (event === "SIGNED_OUT") {
        console.log("User Signed Out");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const returnTo = searchParams.get("return_to") || "/";
    console.log("Initiating Google Sign In...");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?return_to=${returnTo}`,
      },
    });

    if (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const signOut = async () => {
    console.log("Signing out...");

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    } else {
      setUser(null);
      setSession(null);
      router.push("/");
      toast.success("Signed out successfully");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
