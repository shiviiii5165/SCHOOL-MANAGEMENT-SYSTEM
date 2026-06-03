"use client";

import { useSession } from "next-auth/react";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode; // Optional component to show instead of redirecting or returning null
}

export default function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !session?.user) {
      router.push("/login");
      return;
    }

    const userRole = session.user.role as string;
    
    if (allowedRoles.includes(userRole)) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      // Optional: automatically redirect unauthorized attempts if no fallback is provided
      if (!fallback) {
        router.push("/403");
      }
    }
  }, [status, session, allowedRoles, router, fallback]);

  if (isAuthorized === null || status === "loading") {
    // You could render a tiny loading spinner here, or just null to prevent flash
    return null; 
  }

  return isAuthorized ? <>{children}</> : <>{fallback}</>;
}
