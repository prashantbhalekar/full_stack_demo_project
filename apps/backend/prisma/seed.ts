import { PrismaClient, PortalRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (existing) {
    if (
      existing.portal !== PortalRole.ADMIN ||
      existing.status !== UserStatus.ACTIVE
    ) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { portal: PortalRole.ADMIN, status: UserStatus.ACTIVE },
      });
    }
    return;
  }

  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      portal: PortalRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
