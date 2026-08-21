"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function VendorDashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    apiRequest<{ portal: string; status: string; email: string }>("/auth/me", { auth: true })
      .then((me) => {
        if (me.status === "PENDING") return router.replace("/pending-approval");
        if (me.status === "REJECTED") return router.replace("/rejected");
        if (me.portal !== "VENDOR") return router.replace("/auth/login");
        setEmail(me.email);
      })
      .catch(() => router.replace("/auth/login"));
  }, [router]);

  return (
    <div className="card">
      <h1>Vendor Dashboard</h1>
      <p>Welcome {email || "vendor"}.</p>
    </div>
  );
}
