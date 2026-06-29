import { PrismaClient } from "@prisma/client";
import { DEMO_USERS } from "./constants";

export const testPrisma = new PrismaClient();

export async function disconnectTestDb() {
  await testPrisma.$disconnect();
}

export type DemoContext = {
  buyerUserId: string;
  buyerCompanyId: string;
  seller1CompanyId: string;
  seller2CompanyId: string;
  adminUserId: string;
  listingScaniaId: string;
  listingDifId: string;
};

export async function loadDemoContext(): Promise<DemoContext> {
  const buyerUser = await testPrisma.user.findUniqueOrThrow({
    where: { email: DEMO_USERS.comprador },
    include: { company: true },
  });
  const seller1 = await testPrisma.company.findUniqueOrThrow({
    where: { cuit: "30-71111111-1" },
  });
  const seller2 = await testPrisma.company.findUniqueOrThrow({
    where: { cuit: "30-72222222-2" },
  });
  const adminUser = await testPrisma.user.findUniqueOrThrow({
    where: { email: DEMO_USERS.admin },
  });
  const scaniaListing = await testPrisma.listing.findFirstOrThrow({
    where: { sku: "SCANIA-PAST-FREN", isActive: true },
  });
  const difListing = await testPrisma.listing.findFirstOrThrow({
    where: { sku: "MB-1114-DIF-01", companyId: seller2.id },
  });

  return {
    buyerUserId: buyerUser.id,
    buyerCompanyId: buyerUser.companyId,
    seller1CompanyId: seller1.id,
    seller2CompanyId: seller2.id,
    adminUserId: adminUser.id,
    listingScaniaId: scaniaListing.id,
    listingDifId: difListing.id,
  };
}

export async function clearBuyerCart(userId: string) {
  await testPrisma.cartItem.deleteMany({ where: { userId } });
}

export async function deleteOrderCascade(orderId: string) {
  await testPrisma.transactionRating.deleteMany({ where: { orderId } });
  await testPrisma.commission.deleteMany({ where: { orderId } });
  await testPrisma.invoice.deleteMany({ where: { orderId } });
  await testPrisma.orderItem.deleteMany({ where: { orderId } });
  await testPrisma.notification.deleteMany({ where: { orderId } });
  await testPrisma.order.deleteMany({ where: { id: orderId } });
}
