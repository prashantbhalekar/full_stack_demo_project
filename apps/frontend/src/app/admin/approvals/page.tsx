"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type Approval = {
  id: string;
  status: string;
  organization: {
    displayName: string;
    legalName: string;
    createdByUser: {
      email: string;
    };
  };
};

export default function ApprovalsPage() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const me = await apiRequest<{ portal: string; status: string }>("/auth/me", { auth: true });
      if (me.status === "PENDING") return router.replace("/pending-approval");
      if (me.status === "REJECTED") return router.replace("/rejected");
      if (me.portal !== "ADMIN") return router.replace("/auth/login");

      const data = await apiRequest<Approval[]>("/admin/approvals?status=pending", { auth: true });
      setApprovals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function approve(id: string) {
    await apiRequest(`/admin/approvals/${id}/approve`, { method: "POST", auth: true });
    await load();
  }

  async function reject(id: string) {
    await apiRequest(`/admin/approvals/${id}/reject`, {
      method: "POST",
      auth: true,
      body: { reason: "Rejected in MVP flow" },
    });
    await load();
  }

  return (
    <div className="card">
      <h1>Pending Approvals</h1>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {approvals.length === 0 ? <p>No pending approvals.</p> : null}
      {approvals.map((item) => (
        <div key={item.id} className="card" style={{ marginBottom: 12 }}>
          <p><strong>{item.organization.displayName}</strong> ({item.organization.legalName})</p>
          <p>Owner: {item.organization.createdByUser.email}</p>
          <div className="row">
            <button onClick={() => approve(item.id)}>Approve</button>
            <button className="danger" onClick={() => reject(item.id)}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
