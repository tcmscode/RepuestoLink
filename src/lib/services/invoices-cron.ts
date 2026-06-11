import { prisma } from "@/lib/db";

export async function processOverdueInvoices() {
  const now = new Date();
  const overdueOrders = await prisma.order.findMany({
    where: {
      status: "factura_pendiente",
      invoiceDeadlineAt: { lt: now },
      invoice: null,
    },
    include: { sellerCompany: true },
  });

  const results: { orderId: string; sellerBlocked: string }[] = [];

  for (const order of overdueOrders) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "disputado" },
    });

    await prisma.company.update({
      where: { id: order.sellerCompanyId },
      data: { kycStatus: "bloqueado" },
    });

    await prisma.auditLog.create({
      data: {
        companyId: order.sellerCompanyId,
        action: "AUTO_BLOCK_INVOICE_OVERDUE",
        entityType: "Order",
        entityId: order.id,
        metadata: JSON.stringify({
          orderNumber: order.orderNumber,
          deadline: order.invoiceDeadlineAt,
        }),
      },
    });

    results.push({
      orderId: order.id,
      sellerBlocked: order.sellerCompany.razonSocial,
    });
  }

  return results;
}
