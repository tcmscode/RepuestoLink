import { prisma } from "@/lib/db";

export async function notifyCompanyUsers(
  companyId: string,
  data: {
    type: string;
    title: string;
    body: string;
    orderId?: string;
    link?: string;
  }
) {
  const users = await prisma.user.findMany({
    where: { companyId, isActive: true },
    select: { id: true },
  });

  if (users.length === 0) return;

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      ...data,
    })),
  });
}

export async function notifyOrderBuyersAndSellers(
  orderId: string,
  buyerCompanyId: string,
  sellerCompanyId: string,
  buyer: { title: string; body: string; link?: string },
  seller: { title: string; body: string; link?: string }
) {
  await Promise.all([
    notifyCompanyUsers(buyerCompanyId, {
      type: "order",
      orderId,
      link: buyer.link ?? `/comprador/pedidos/${orderId}`,
      ...buyer,
    }),
    notifyCompanyUsers(sellerCompanyId, {
      type: "order",
      orderId,
      link: seller.link ?? `/vendedor/pedidos`,
      ...seller,
    }),
  ]);
}
