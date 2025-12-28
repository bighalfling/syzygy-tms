import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@syzygy.sk" },
    update: {},
    create: {
      email: "admin@syzygy.sk",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("Seed done: admin@syzygy.sk / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
