'use client'

import React from "react";
import { useSession } from "next-auth/react";
import EarningsPage from "@/components/pricing/earning-page";
import ViewerTokenPage from "@/components/pricing/viewer-token-page";

export default function Page() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;

  return (
    <div>
      {userRole === "CREATOR" && <EarningsPage />}
      {userRole === "VIEWER" && <ViewerTokenPage />}
      {userRole === "ADMIN" && <ViewerTokenPage />}
    </div>
  );
}
