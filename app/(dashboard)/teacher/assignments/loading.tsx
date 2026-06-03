import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-text-secondary font-medium">Loading assignments...</p>
    </div>
  );
}
