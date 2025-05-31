"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import LoadingScreen from "@/components/layout/LoadingScreen";

export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function ProtectedRoute(props: P) {
    console.log('🔥 withAuth: Component is rendering!');
    const { user, loading } = useUser();
    console.log('🔥 withAuth: useUser result:', { user: !!user, loading });
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    // Check if we're on the client side
    useEffect(() => {
      setIsClient(true);
    }, []);

    // Debug: Log the current state every time it changes
    useEffect(() => {
      console.log('withAuth: State update', {
        isClient,
        loading,
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email
      });
    }, [isClient, loading, user]);

    // Handle authentication state
    useEffect(() => {
      if (!isClient || loading) {
        console.log('withAuth: Still loading...', { isClient, loading });
        return;
      }

      console.log('withAuth: Auth check complete', {
        hasUser: !!user,
        userId: user?.id,
        loading
      });

      if (!user) {
        console.log('withAuth: No user found, redirecting to login');
        window.location.href = '/login';
        return;
      }

      console.log('withAuth: User authenticated:', user.email);
    }, [isClient, user, loading, router]);

    console.log('withAuth: Render decision', {
      isClient,
      loading,
      hasUser: !!user,
      willShowLoading: !isClient || loading || !user
    });

    // Show loading screen while checking authentication
    if (!isClient || loading) {
      console.log('withAuth: Showing loading screen - reason:', !isClient ? 'not client' : 'loading');
      return <LoadingScreen />;
    }

    // If not authenticated, show loading screen (will redirect in useEffect)
    if (!user) {
      console.log('withAuth: No user, showing loading screen');
      return <LoadingScreen />;
    }

    // If authenticated, render the protected component
    console.log('withAuth: Rendering protected component');
    return <Component {...props} />;
  };
}
