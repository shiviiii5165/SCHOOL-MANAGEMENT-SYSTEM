import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 bg-status-danger-bg rounded-full flex items-center justify-center mx-auto mb-8">
          <ShieldAlert className="w-12 h-12 text-status-danger" />
        </div>
        <h1 className="text-4xl font-display font-bold text-text-primary">403</h1>
        <h2 className="text-2xl font-semibold text-text-secondary">Access Denied</h2>
        <p className="text-text-muted">
          You do not have permission to view this page. This incident has been logged.
        </p>
        <Link 
          href="/login" 
          className="inline-block mt-8 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
