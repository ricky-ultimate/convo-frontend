import * as React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorCardProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
  showRetry?: boolean;
  showGoHome?: boolean;
}

export const ErrorCard = React.forwardRef<HTMLDivElement, ErrorCardProps>(
  (
    {
      title = "Something went wrong",
      description,
      onRetry,
      onGoHome,
      className,
      showRetry = true,
      showGoHome = true,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center p-8 space-y-4 rounded-lg border bg-card text-card-foreground",
          className
        )}
      >
        <div className="p-3 rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-muted-foreground text-sm max-w-sm">
              {description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {showRetry && onRetry && (
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          {showGoHome && onGoHome && (
            <Button onClick={onGoHome}>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>
      </div>
    );
  }
);
ErrorCard.displayName = "ErrorCard";

interface ErrorPageProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  showGoHome?: boolean;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  title = "Something went wrong",
  description,
  onRetry,
  onGoHome,
  showRetry = true,
  showGoHome = true,
}) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ErrorCard
          title={title}
          description={description}
          onRetry={onRetry}
          onGoHome={onGoHome}
          showRetry={showRetry}
          showGoHome={showGoHome}
        />
      </div>
    </div>
  );
};
