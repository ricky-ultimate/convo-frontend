import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner = React.forwardRef<
  HTMLDivElement,
  LoadingSpinnerProps
>(({ size = "md", className }, ref) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizeClasses[size],
        className
      )}
    />
  );
});
LoadingSpinner.displayName = "LoadingSpinner";

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export const LoadingCard = React.forwardRef<HTMLDivElement, LoadingCardProps>(
  ({ title = "Loading...", description, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center p-8 space-y-4 rounded-lg border bg-card text-card-foreground",
          className
        )}
      >
        <LoadingSpinner size="lg" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
      </div>
    );
  }
);
LoadingCard.displayName = "LoadingCard";

interface LoadingPageProps {
  title?: string;
  description?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  title = "Loading...",
  description,
}) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoadingCard title={title} description={description} />
      </div>
    </div>
  );
};
