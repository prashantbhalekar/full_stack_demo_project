"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureAuthorizedUser } from "@/lib/guards";

export default function VendorDashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    ensureAuthorizedUser(router, "VENDOR").then((me) => {
      if (me) {
        setEmail(me.email);
      }
    });
  }, [router]);

  return (
    <div className="card">
      <h1>Vendor Dashboard</h1>
      <p>Welcome {email || "vendor"}.</p>
    </div>
  );
}
