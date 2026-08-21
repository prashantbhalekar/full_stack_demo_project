"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [legalName, setLegalName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await apiRequest("/auth/register/customer", {
        method: "POST",
        body: { email, password, legalName, displayName },
      });
      router.push("/pending-approval");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    }
  }

  return (
    <div className="card">
      <h1>Customer Registration</h1>
      <form onSubmit={submit}>
        <p><input placeholder="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></p>
        <p><input placeholder="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></p>
        <p><input placeholder="Legal Name" required value={legalName} onChange={(e) => setLegalName(e.target.value)} /></p>
        <p><input placeholder="Display Name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></p>
        <button type="submit">Submit for approval</button>
      </form>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
    </div>
  );
}
