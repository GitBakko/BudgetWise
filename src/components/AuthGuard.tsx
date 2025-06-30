"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Wallet } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Wallet className="h-8 w-8 animate-pulse text-primary" />
          <h1 className="text-2xl font-semibold text-primary">BudgetWise</h1>
        </div>
        <p className="mt-2 text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return <>{children}</>;
}
