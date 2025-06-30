import { SavingsAdvisor } from "@/components/dashboard/SavingsAdvisor";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AiAdvisorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Savings Advisor</h1>
        <p className="text-muted-foreground">
          Let our AI analyze your spending and find ways to save.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <div className="max-w-3xl mx-auto">
          <SavingsAdvisor />
        </div>
      </Suspense>
    </div>
  );
}
