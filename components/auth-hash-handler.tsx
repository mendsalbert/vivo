"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

export function AuthHashHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Handle Supabase auth tokens in URL hash (client-side only)
    if (typeof window === "undefined" || !supabase) return;

    // Check if there's an access_token in the hash
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      // Supabase client will automatically detect and process this
      // Clean up the URL by removing the hash
      const url = new URL(window.location.href);
      url.hash = "";
      window.history.replaceState({}, "", url.toString());

      // Refresh to let Supabase process the session
      router.refresh();
    }
  }, [router, pathname]);

  return null;
}
