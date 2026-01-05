"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Analytics Route Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl border border-red-100 shadow-sm max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} />
        </div>
        
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Something went wrong!
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          We couldn't load the analytics dashboard due to a technical issue. 
          Please try again or contact support if the problem persists.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2"
          >
            <RefreshCcw size={16} />
            Try Again
          </button>
          
          <div className="text-xs text-slate-400 font-mono bg-slate-50 p-2 rounded">
            Error Digest: {error.digest || "Unknown_Error"}
          </div>
        </div>
      </div>
    </div>
  );
}