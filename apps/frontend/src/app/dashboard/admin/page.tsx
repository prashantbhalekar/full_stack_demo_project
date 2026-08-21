"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureAuthorizedUser } from "@/lib/guards";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    ensureAuthorizedUser(router, "ADMIN").then((me) => {
      if (me) {
        setEmail(me.email);
      }
    });
  }, [router]);

  return (
    <div className="card">
      <h1>Admin Dashboard</h1>
      <p>Welcome {email || "admin"}.</p>
      <p>
        <a href="/admin/approvals">Go to approvals</a>
      </p>
    </div>
  );
}
