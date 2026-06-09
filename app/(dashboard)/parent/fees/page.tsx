import { Suspense } from 'react';
import AntiGravityFeesDashboard from '@/components/fees/AntiGravityFeesDashboard';
import { Loader2 } from 'lucide-react';

export default function ParentFeesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <AntiGravityFeesDashboard />
    </Suspense>
  );
}
