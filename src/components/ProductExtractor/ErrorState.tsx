import React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Error Loading Products",
  message = "We couldn't load the product data. This might be due to a network issue or the service being temporarily unavailable.",
  onRetry = () => console.log("Retry button clicked"),
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px] p-6 bg-background">
      <Alert variant="destructive" className="max-w-md mb-4">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>

      <div className="mt-4">
        <Button
          variant="outline"
          onClick={onRetry}
          className="flex items-center gap-2"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
};

export default ErrorState;
