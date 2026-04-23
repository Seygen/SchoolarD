import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { authenticator } from "otplib"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // ── Super Admin ──────────────────────────────────────────────────────────
  const email = process.env.SUPER_ADMIN_EMAIL ?? "admin@schoolard.fr"
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMe123!"

  const existing = await prisma.superAdmin.findUnique({ where: { email } })

  if (existing) {
    console.log(`ℹ️  Super admin already exists: ${email}`)
  } else {
    const passwordHash = await bcrypt.hash(password, 12)
    const totpSecret = authenticator.generateSecret()

    const superAdmin = await prisma.superAdmin.create({
      data: {
        email,
        passwordHash,
        totpSecret,
        fullName: "Super Administrateur",
        isActive: true,
      },
    })

    console.log("✅ Super admin created:")
    console.log(`   Email    : ${superAdmin.email}`)
    console.log(`   Password : ${password}`)
    console.log(`   TOTP     : ${totpSecret}`)
    console.log("")
    console.log("   ⚠️  Scan the TOTP secret in Google Authenticator or Authy:")
    console.log(
      `   otpauth://totp/SchoolarD:${email}?secret=${totpSecret}&issuer=SchoolarD`
    )
  }

  // ── École de démonstration ────────────────────────────────────────────────
  let school = await prisma.school.findUnique({ where: { slug: "ecole-demo" } })

  if (!school) {
    school = await prisma.school.create({
      data: {
        name: "École de démonstration",
        slug: "ecole-demo",
        country: "FR",
        contactEmail: "directrice@ecole-demo.fr",
        status: "ACTIVE",
      },
    })
    console.log(`✅ Demo school created: ${school.name} (id: ${school.id})`)
  } else {
    console.log(`ℹ️  Demo school already exists: ${school.name}`)
  }

  // ── Administratrice de l'école ────────────────────────────────────────────
  const adminEmail = "directrice@ecole-demo.fr"
  const adminPassword = "DemoAdmin123!"

  const existingAdmin = await prisma.user.findFirst({
    where: { schoolId: school.id, email: adminEmail },
  })

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    await prisma.user.create({
      data: {
        schoolId: school.id,
        email: adminEmail,
        passwordHash,
        firstName: "Marie",
        lastName: "Directrice",
        role: "ADMIN",
        isActive: true,
      },
    })

    console.log("✅ Demo admin created:")
    console.log(`   Email    : ${adminEmail}`)
    console.log(`   Password : ${adminPassword}`)
  } else {
    console.log(`ℹ️  Demo admin already exists: ${adminEmail}`)
  }

  // ── Année scolaire courante ───────────────────────────────────────────────
  const yearLabel = "2025-2026"
  let academicYear = await prisma.academicYear.findFirst({
    where: { schoolId: school.id, label: yearLabel },
  })

  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        schoolId: school.id,
        label: yearLabel,
        startDate: new Date("2025-09-01"),
        endDate: new Date("2026-07-04"),
        isCurrent: true,
      },
    })
    console.log(`✅ Academic year created: ${yearLabel}`)
  }

  console.log("\n✨ Seed complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
