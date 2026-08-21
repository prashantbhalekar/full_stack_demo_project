import { apiRequest } from "@/lib/api";

type RouterLike = {
  replace: (href: string) => void;
};

export type MeResponse = {
  portal: "ADMIN" | "CUSTOMER" | "VENDOR";
  status: "PENDING" | "ACTIVE" | "REJECTED";
  email: string;
};

export async function ensureAuthorizedUser(
  router: RouterLike,
  requiredPortal?: MeResponse["portal"],
): Promise<MeResponse | null> {
  try {
    const me = await apiRequest<MeResponse>("/auth/me", { auth: true });

    if (me.status === "PENDING") {
      router.replace("/pending-approval");
      return null;
    }

    if (me.status === "REJECTED") {
      router.replace("/rejected");
      return null;
    }

    if (requiredPortal && me.portal !== requiredPortal) {
      router.replace("/auth/login");
      return null;
    }

    return me;
  } catch {
    router.replace("/auth/login");
    return null;
  }
}
