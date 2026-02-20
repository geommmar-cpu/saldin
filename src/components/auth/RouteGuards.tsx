import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useProfile } from "@/hooks/useProfile";
import { BiometricLockScreen } from "./BiometricLockScreen";

// Session storage key to track if user unlocked with biometric this session
const BIOMETRIC_UNLOCKED_KEY = "biometric_unlocked";

// Loading component to avoid repetition
export const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center animate-in fade-in duration-500">
    <div className="relative mb-8">
      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
      <div className="relative w-20 h-20 bg-gradient-to-tr from-primary to-accent rounded-3xl rotate-12 flex items-center justify-center shadow-lg animate-bounce-slow">
        <span className="text-white text-3xl font-bold -rotate-12">S</span>
      </div>
    </div>
    <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Saldin</h2>
    <div className="flex items-center gap-1 justify-center">
      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
    </div>
    <p className="text-muted-foreground text-sm mt-4 font-medium">Preparando seu ambiente financeiro...</p>
  </div>
);

// localStorage key for persisting onboarding status across sessions
const getOnboardingLocalKey = (userId: string) => `onboarding_done_${userId}`;

// Hook to check onboarding status - only runs when user exists
const useOnboardingStatus = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["onboarding-status", userId],
    queryFn: async (): Promise<boolean> => {
      if (!userId) return false;

      // 1. Check localStorage first — if already marked done, never redirect to onboarding again
      const localKey = getOnboardingLocalKey(userId);
      if (localStorage.getItem(localKey) === "true") {
        return true;
      }

      // 2. Check sessionStorage override (set during onboarding import flow)
      if (sessionStorage.getItem(`onboarding_override_${userId}`) === "true") {
        localStorage.setItem(localKey, "true"); // Persist to localStorage too
        return true;
      }

      const fetchPromise = supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", userId)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout checking onboarding status")), 10000);
      });

      try {
        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

        if (error) {
          console.error("Error checking onboarding:", error);
          // If DB is unreachable, don't force onboarding on existing users
          // Check if there's any localStorage data suggesting this user has logged in before
          return false;
        }

        // If no profile yet, return false (trigger should have created it)
        if (!data) return false;

        const isDone = data.onboarding_completed === true;

        // If completed, persist to localStorage so future session restores don't re-check
        if (isDone) {
          localStorage.setItem(localKey, "true");
        }

        return isDone;
      } catch (err) {
        console.error("Onboarding check failed by exception/timeout:", err);
        return false;
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours — onboarding never changes after completion
    gcTime: 1000 * 60 * 60 * 24,
    retry: 2,
  });
};

/**
 * AuthRoute - Protects routes that require authentication only (not onboarding)
 * Used for: /onboarding route
 */
export const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  // Wait for auth to initialize
  if (loading) {
    return <LoadingScreen />;
  }

  // No authenticated user → redirect to login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // User is authenticated → render children
  return <>{children}</>;
};

/**
 * OnboardingRoute - Protects routes that require auth + completed onboarding
 * Also handles biometric lock screen for returning users
 * Used for: All main app routes (/, /history, /settings, etc.)
 */
export const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isEnabled: isBiometricEnabled, isEnabledForUser, isLoading: biometricLoading } = useWebAuthn();
  const { data: profile } = useProfile();

  // Track if user has unlocked with biometric this session
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem(BIOMETRIC_UNLOCKED_KEY) === "true";
  });

  // IMPORTANT: Only fetch onboarding status when user.id is available
  const { data: onboardingCompleted, isLoading: onboardingLoading } = useOnboardingStatus(
    user?.id
  );

  // Check if biometric is enabled for this specific user
  const userHasBiometric = user?.id ? isEnabledForUser(user.id) : false;

  // Step 1: Wait for auth to initialize first
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Step 2: No authenticated user → redirect to login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Step 3: User exists, but still checking onboarding status → show loading
  if (onboardingLoading || biometricLoading) {
    return <LoadingScreen />;
  }

  // Step 4: Onboarding not completed → redirect to onboarding
  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  // Step 5: User has biometric enabled but hasn't unlocked this session → show lock screen
  if (userHasBiometric && !isUnlocked) {
    return (
      <BiometricLockScreen
        userEmail={user.email || ""}
        userName={profile?.full_name || user.user_metadata?.name || user.user_metadata?.full_name || ""}
        onUnlock={() => {
          sessionStorage.setItem(BIOMETRIC_UNLOCKED_KEY, "true");
          setIsUnlocked(true);
        }}
        onUsePassword={() => {
          // Sign out and redirect to login page for password entry
          supabase.auth.signOut();
        }}
      />
    );
  }

  // Step 6: All checks passed → render children
  return <>{children}</>;
};

/**
 * PublicRoute - For public pages that should redirect authenticated users
 * Used for: /auth route
 */
export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();

  // IMPORTANT: Only fetch onboarding status when user.id is available
  const { data: onboardingCompleted, isLoading: onboardingLoading } = useOnboardingStatus(
    user?.id
  );

  // Step 1: Wait for auth to initialize first - prevents premature render of login page
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Step 2: No user → show auth page
  if (!user) {
    return <>{children}</>;
  }

  // Step 3: User exists but still checking onboarding → show loading
  if (onboardingLoading) {
    return <LoadingScreen />;
  }

  // Step 4: User exists, onboarding not done → redirect to onboarding
  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  // Step 5: User exists and onboarding done → redirect to home
  return <Navigate to="/app" replace />;
};
