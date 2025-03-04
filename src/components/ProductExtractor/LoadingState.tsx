import React from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  message?: string;
}

const LoadingState = ({
  message = "Loading phone and GPS outlet data...",
}: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[400px] bg-white p-8 rounded-lg shadow-sm">
      <div className="flex flex-col items-center space-y-6">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-lg font-medium text-gray-700">{message}</p>

        {/* Skeleton loading for table rows */}
        <div className="w-full max-w-3xl space-y-4">
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
