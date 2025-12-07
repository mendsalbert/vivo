"use client";

import { usePathname } from "next/navigation";
import { MainLayout } from "@/components/main-layout";
import { AuthHashHandler } from "@/components/auth-hash-handler";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  return (
    <>
      <AuthHashHandler />
      {isAuthPage ? <>{children}</> : <MainLayout>{children}</MainLayout>}
    </>
  );
}
