"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 bg-surface border border-border rounded-xl">
      <div className="w-16 h-16 bg-status-danger-bg rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-status-danger" />
      </div>
      <h2 className="text-xl font-bold text-text-primary mb-2">Something went wrong!</h2>
      <p className="text-sm text-text-secondary mb-6 max-w-md text-center">
        {error.message || "An unexpected error occurred while loading assignments."}
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
      >
        <RefreshCcw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}
