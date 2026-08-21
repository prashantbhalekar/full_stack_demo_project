"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { clearTokens, saveTokens } from "@/lib/auth";
import { resolveUserRoute } from "@/lib/route-guard";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    portal: "ADMIN" | "CUSTOMER" | "VENDOR";
    status: "PENDING" | "ACTIVE" | "REJECTED";
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    clearTokens();

    try {
      const data = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      saveTokens(data.accessToken, data.refreshToken);
      router.push(resolveUserRoute(data.user.status as never, data.user.portal as never));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      if (msg.includes("PENDING_APPROVAL")) {
        router.push("/pending-approval");
        return;
      }
      if (msg.includes("REJECTED")) {
        router.push("/rejected");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1>Login</h1>
      <form onSubmit={submit}>
        <p>
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </p>
        <p>
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </p>
        <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
      </form>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      <p><Link href="/auth/register/customer">Register as customer</Link></p>
      <p><Link href="/auth/register/vendor">Register as vendor</Link></p>
    </div>
  );
}
