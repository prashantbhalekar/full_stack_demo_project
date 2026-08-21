"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type MeResponse = {
  portal: "ADMIN" | "CUSTOMER" | "VENDOR";
  status: "PENDING" | "ACTIVE" | "REJECTED";
  email: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    apiRequest<MeResponse>("/auth/me", { auth: true })
      .then((me) => {
        if (me.status === "PENDING") return router.replace("/pending-approval");
        if (me.status === "REJECTED") return router.replace("/rejected");
        if (me.portal !== "ADMIN") return router.replace("/auth/login");
        setEmail(me.email);
      })
      .catch(() => router.replace("/auth/login"));
  }, [router]);

  return (
    <div className="card">
      <h1>Admin Dashboard</h1>
      <p>Welcome {email || "admin"}.</p>
      <p><a href="/admin/approvals">Go to approvals</a></p>
    </div>
  );
}
