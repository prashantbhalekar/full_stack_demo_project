"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureAuthorizedUser } from "@/lib/guards";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    ensureAuthorizedUser(router, "CUSTOMER").then((me) => {
      if (me) {
        setEmail(me.email);
      }
    });
  }, [router]);

  return (
    <div className="card">
      <h1>Customer Dashboard</h1>
      <p>Welcome {email || "customer"}.</p>
    </div>
  );
}
