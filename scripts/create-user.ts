import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "vskrypchuk@syzygy-log.com";
  const password = "Vika23102001!";
  const name = "Admin";
  const role: UserRole = "ADMIN";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
      isActive: true,
    },
  });

  console.log("✅ User created successfully");
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("Role:", role);
}

main()
  .catch((e) => {
    console.error("❌ Error creating user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
