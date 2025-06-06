import * as React from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  type?: "success" | "error" | "warning" | "info";
  title?: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ type = "info", title, description, onClose, className }, ref) => {
    const icons = {
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertTriangle,
      info: Info,
    };

    const colors = {
      success: "border-green-200 bg-green-50 text-green-800",
      error: "border-red-200 bg-red-50 text-red-800",
      warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
      info: "border-blue-200 bg-blue-50 text-blue-800",
    };

    const Icon = icons[type];

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-start gap-3 rounded-lg border p-4 shadow-sm",
          colors[type],
          className
        )}
      >
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-1">
          {title && <div className="font-medium text-sm">{title}</div>}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
Toast.displayName = "Toast";

export const useToast = () => {
  const [toasts, setToasts] = React.useState<
    Array<{
      id: string;
      type: "success" | "error" | "warning" | "info";
      title?: string;
      description?: string;
    }>
  >([]);

  const addToast = React.useCallback(
    (toast: Omit<(typeof toasts)[0], "id">) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { ...toast, id }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};
