export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LayoutClientWrapper from "@/components/layout/LayoutClientWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.user.name || "User",
    role: session.user.role as string,
    avatar: session.user.image || undefined,
  };

  return (
    <LayoutClientWrapper user={user}>
      {children}
    </LayoutClientWrapper>
  );
}
