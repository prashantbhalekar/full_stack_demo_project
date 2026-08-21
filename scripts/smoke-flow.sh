#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5433/full_stack_demo}"
REDIS_URL="${REDIS_URL:-redis://localhost:6380}"
JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-dev-access-secret}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-dev-refresh-secret}"
JWT_ACCESS_TTL="${JWT_ACCESS_TTL:-15m}"
JWT_REFRESH_TTL="${JWT_REFRESH_TTL:-7d}"
PORT="${PORT:-3001}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-ChangeMe123!}"

export DATABASE_URL REDIS_URL JWT_ACCESS_SECRET JWT_REFRESH_SECRET JWT_ACCESS_TTL JWT_REFRESH_TTL PORT ADMIN_EMAIL ADMIN_PASSWORD

pnpm dev:infra
pnpm --filter backend prisma:migrate:deploy
pnpm --filter backend prisma:seed
pnpm --filter backend build
pnpm --filter worker build

cleanup() {
  if [[ -n "${backend_pid:-}" ]]; then kill "$backend_pid" 2>/dev/null || true; fi
  if [[ -n "${worker_pid:-}" ]]; then kill "$worker_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM

pnpm --filter backend start > "$TMPDIR/full-stack-demo-backend.log" 2>&1 &
backend_pid=$!
pnpm --filter worker start > "$TMPDIR/full-stack-demo-worker.log" 2>&1 &
worker_pid=$!

for _ in {1..30}; do
  if curl -sf "http://localhost:${PORT}/api/health" >/dev/null; then
    break
  fi
  sleep 1
 done

node - <<'EOF'
const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || '3001'}/api`;

const req = async (path, method = 'GET', body, token) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
};

const main = async () => {
  const ts = Date.now();
  const customerEmail = `smoke.customer.${ts}@example.com`;
  const vendorEmail = `smoke.vendor.${ts}@example.com`;
  const password = 'ChangeMe123!';

  const customerReg = await req('/auth/register/customer', 'POST', {
    email: customerEmail,
    password,
    legalName: 'Smoke Customer Legal',
    displayName: 'Smoke Customer Display',
  });
  if (customerReg.status !== 201 || customerReg.json.status !== 'PENDING') {
    throw new Error(`Customer registration failed: ${JSON.stringify(customerReg)}`);
  }

  const vendorReg = await req('/auth/register/vendor', 'POST', {
    email: vendorEmail,
    password,
    legalName: 'Smoke Vendor Legal',
    displayName: 'Smoke Vendor Display',
  });
  if (vendorReg.status !== 201 || vendorReg.json.status !== 'PENDING') {
    throw new Error(`Vendor registration failed: ${JSON.stringify(vendorReg)}`);
  }

  const pendingLogin = await req('/auth/login', 'POST', { email: customerEmail, password });
  if (pendingLogin.status !== 403) {
    throw new Error(`Pending user login should fail: ${JSON.stringify(pendingLogin)}`);
  }

  const adminLogin = await req('/auth/login', 'POST', {
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
  });
  if (adminLogin.status !== 201) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLogin)}`);
  }
  const adminToken = adminLogin.json.accessToken;

  const pendingApprovals = await req('/admin/approvals?status=pending', 'GET', undefined, adminToken);
  if (pendingApprovals.status !== 200) {
    throw new Error(`Pending approvals fetch failed: ${JSON.stringify(pendingApprovals)}`);
  }

  const customerApproval = pendingApprovals.json.find((a) => a.organization.createdByUser.email === customerEmail);
  const vendorApproval = pendingApprovals.json.find((a) => a.organization.createdByUser.email === vendorEmail);
  if (!customerApproval || !vendorApproval) {
    throw new Error('Could not find newly created approvals in pending list');
  }

  const approveCustomer = await req(`/admin/approvals/${customerApproval.id}/approve`, 'POST', {}, adminToken);
  if (approveCustomer.status !== 201) {
    throw new Error(`Approve customer failed: ${JSON.stringify(approveCustomer)}`);
  }

  const rejectVendor = await req(`/admin/approvals/${vendorApproval.id}/reject`, 'POST', { reason: 'Smoke rejection' }, adminToken);
  if (rejectVendor.status !== 201) {
    throw new Error(`Reject vendor failed: ${JSON.stringify(rejectVendor)}`);
  }

  const activeLogin = await req('/auth/login', 'POST', { email: customerEmail, password });
  if (activeLogin.status !== 201) {
    throw new Error(`Approved user login failed: ${JSON.stringify(activeLogin)}`);
  }

  const dashboard = await req('/dashboard', 'GET', undefined, activeLogin.json.accessToken);
  if (dashboard.status !== 200 || dashboard.json.dashboardPath !== '/dashboard/customer') {
    throw new Error(`Dashboard path invalid: ${JSON.stringify(dashboard)}`);
  }

  const rejectedLogin = await req('/auth/login', 'POST', { email: vendorEmail, password });
  if (rejectedLogin.status !== 403) {
    throw new Error(`Rejected user login should fail: ${JSON.stringify(rejectedLogin)}`);
  }

  console.log('Smoke flow passed');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
EOF
