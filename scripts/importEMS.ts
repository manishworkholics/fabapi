import * as fs from "fs";
const csv = require("csv-parser");
import * as bcrypt from "bcryptjs"; // ✅ FIXED
import * as argon2 from "argon2";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const rows: any[] = [];

  fs.createReadStream(__dirname + "/EMS_List.csv")
    .pipe(csv())
    .on("data", (row: any) => rows.push(row))
    .on("end", async () => {
      console.log(`Found ${rows.length} rows`);

      let inserted = 0;

      for (const r of rows) {
        try {
          const email = r.email?.trim();
          const companyName = r.companyName?.trim();

          if (!email || !companyName) continue;

          // ===== Company =====
          const company = await prisma.company.upsert({
            where: { name: companyName },
            update: {},
            create: {
              name: companyName,
              state: r.state || null,
              country: r.country || null,
            },
          });

          // ===== User =====
          // const hashedPassword = await bcrypt.hash("Password@123", 10);
          const hashedPassword = await argon2.hash("Password@123");

          const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
              email,
              hashedPassword,
              role: UserRole.EMS,
              phone: r.phone || null,
              companyId: company.id,
            },
          });

          // ===== Profile =====
          await prisma.profile.upsert({
            where: { userId: user.id },
            update: {},
            create: {
              userId: user.id,
              companyName,
              location: r.city || null,
              manufacturingCapabilities: r.services
                ? r.services.split(",").map((s: string) => s.trim())
                : [],
              projectsCompleted: 0,
              EMSAvailabilityStatus: "ACTIVE",
            },
          });

          inserted++;
          console.log("✅ Imported:", companyName);
        } catch (err: any) {
          console.log("❌ Error:", err.message);
        }
      }

      console.log(`\n🎉 Inserted ${inserted} EMS successfully`);
      process.exit(0);
    });
}

run();
