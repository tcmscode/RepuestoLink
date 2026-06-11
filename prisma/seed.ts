import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "AppPesados2025!";

function tierPrices(base: number) {
  return {
    priceContado: base,
    price30: Math.round(base * 1.05),
    price60: Math.round(base * 1.1),
    price90: Math.round(base * 1.15),
  };
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const adminCompany = await prisma.company.upsert({
    where: { cuit: "30-00000000-0" },
    update: {},
    create: {
      cuit: "30-00000000-0",
      razonSocial: "AppPesados Admin",
      nombreFantasia: "AppPesados",
      telefono: "1100000000",
      provincia: "Buenos Aires",
      localidad: "CABA",
      kycStatus: "aprobado",
      role: "admin",
      tradeCategory: "A",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@apppesados.com" },
    update: { passwordHash },
    create: {
      email: "admin@apppesados.com",
      name: "Administrador",
      passwordHash,
      companyId: adminCompany.id,
    },
  });

  const seller1 = await prisma.company.upsert({
    where: { cuit: "30-71111111-1" },
    update: { tradeCategory: "B" },
    create: {
      cuit: "30-71111111-1",
      razonSocial: "Repuestos del Sur S.A.",
      nombreFantasia: "Repuestos del Sur",
      telefono: "1144556677",
      provincia: "Buenos Aires",
      localidad: "Avellaneda",
      kycStatus: "aprobado",
      role: "vendedor",
      tradeCategory: "B",
    },
  });

  const seller2 = await prisma.company.upsert({
    where: { cuit: "30-72222222-2" },
    update: { tradeCategory: "B" },
    create: {
      cuit: "30-72222222-2",
      razonSocial: "BusParts Argentina S.R.L.",
      nombreFantasia: "BusParts",
      telefono: "3514445566",
      provincia: "Córdoba",
      localidad: "Córdoba Capital",
      kycStatus: "aprobado",
      role: "vendedor",
      tradeCategory: "B",
    },
  });

  const buyer = await prisma.company.upsert({
    where: { cuit: "30-73333333-3" },
    update: { tradeCategory: "B" },
    create: {
      cuit: "30-73333333-3",
      razonSocial: "Transporte Línea 42 S.A.",
      nombreFantasia: "Línea 42",
      telefono: "1155667788",
      provincia: "Buenos Aires",
      localidad: "La Plata",
      kycStatus: "aprobado",
      role: "comprador",
      tradeCategory: "B",
    },
  });

  await prisma.user.upsert({
    where: { email: "vendedor1@apppesados.com" },
    update: { passwordHash },
    create: {
      email: "vendedor1@apppesados.com",
      name: "Juan Vendedor",
      passwordHash,
      companyId: seller1.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "vendedor2@apppesados.com" },
    update: { passwordHash },
    create: {
      email: "vendedor2@apppesados.com",
      name: "María Vendedora",
      passwordHash,
      companyId: seller2.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "comprador@apppesados.com" },
    update: { passwordHash },
    create: {
      email: "comprador@apppesados.com",
      name: "Carlos Comprador",
      passwordHash,
      companyId: buyer.id,
    },
  });

  const listings = [
    {
      companyId: seller1.id,
      sku: "MB-1114-DIF-01",
      title: "Kit diferencial Mercedes Benz 1114",
      description: "Kit completo para colectivo MB 1114. Incluye coronas y piñones.",
      price: 185000,
      ...tierPrices(185000),
      stock: 4,
      brand: "Mercedes-Benz",
      category: "transmision",
      vehicleCompatibility: "Colectivo MB 1114 / 1314",
      oemCodes: "A3553300220,0023539701",
      replacesOem: "Reemplaza kit OEM Mercedes 1114 serie",
      invoiceDeadlineDays: 30,
    },
    {
      companyId: seller2.id,
      sku: "MB-1114-DIF-01",
      title: "Kit diferencial MB 1114 (alternativo)",
      description: "Kit alternativo certificado. Misma aplicación.",
      price: 172000,
      ...tierPrices(172000),
      stock: 2,
      brand: "Mercedes-Benz",
      category: "transmision",
      vehicleCompatibility: "Colectivo MB 1114 / 1314",
      oemCodes: "A3553300220",
      replacesOem: "Equivalente línea pesada",
      invoiceDeadlineDays: 30,
    },
    {
      companyId: seller1.id,
      sku: "FILT-AIR-IVECO",
      title: "Filtro de aire Iveco Daily 70-16",
      description: "Filtro original equivalente alta eficiencia.",
      price: 12500,
      ...tierPrices(12500),
      stock: 25,
      brand: "Iveco",
      category: "filtros",
      vehicleCompatibility: "Camión Iveco Daily",
      oemCodes: "5801317094",
      invoiceDeadlineDays: 30,
    },
    {
      companyId: seller2.id,
      sku: "SCANIA-PAST-FREN",
      title: "Juego pastillas freno Scania R440",
      description: "Pastillas delanteras cerámicas para Scania R serie.",
      price: 89000,
      ...tierPrices(89000),
      stock: 8,
      brand: "Scania",
      category: "frenos",
      vehicleCompatibility: "Camión Scania R440",
      oemCodes: "2111763,2111764",
      invoiceDeadlineDays: 30,
    },
    {
      companyId: seller2.id,
      sku: "VOLVO-OPT-DEL",
      title: "Óptica delantera Volvo B270F",
      description: "Óptica compatible colectivo urbano Volvo.",
      price: 42000,
      ...tierPrices(42000),
      stock: 6,
      brand: "Volvo",
      category: "carroceria",
      vehicleCompatibility: "Colectivo Volvo B270F",
      oemCodes: "85108324",
      invoiceDeadlineDays: 30,
    },
  ];

  for (const l of listings) {
    const existing = await prisma.listing.findFirst({
      where: { companyId: l.companyId, sku: l.sku },
    });
    if (!existing) {
      await prisma.listing.create({ data: l });
    } else {
      await prisma.listing.update({
        where: { id: existing.id },
        data: {
          priceContado: l.priceContado,
          price30: l.price30,
          price60: l.price60,
          price90: l.price90,
        },
      });
    }
  }

  console.log("Seed completado. Contraseña para todos los usuarios demo:");
  console.log(`  ${DEMO_PASSWORD}`);
  console.log("  admin@apppesados.com");
  console.log("  vendedor1@apppesados.com");
  console.log("  vendedor2@apppesados.com");
  console.log("  comprador@apppesados.com (Cat. B — 30 días)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
