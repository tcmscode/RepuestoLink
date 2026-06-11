import { prisma } from "@/lib/db";
import { BUSINESS_RULES } from "@/lib/config/business";

function periodBounds(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

export async function generateMonthlyCommissionBills(
  year: number,
  month: number
) {
  const { start, end } = periodBounds(year, month);

  const commissions = await prisma.commission.findMany({
    where: {
      status: "pendiente",
      monthlyBillId: null,
      order: {
        status: "cerrado",
        closedAt: { gte: start, lt: end },
      },
    },
    include: {
      order: { select: { sellerCompanyId: true } },
    },
  });

  const bySeller = new Map<string, typeof commissions>();
  for (const c of commissions) {
    const sid = c.order.sellerCompanyId;
    if (!bySeller.has(sid)) bySeller.set(sid, []);
    bySeller.get(sid)!.push(c);
  }

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + BUSINESS_RULES.commissionInvoiceDueDays);

  let created = 0;
  for (const [sellerCompanyId, items] of bySeller) {
    const totalAmount = items.reduce((s, i) => s + i.amount, 0);
    const existing = await prisma.monthlyCommissionBill.findUnique({
      where: {
        sellerCompanyId_periodYear_periodMonth: {
          sellerCompanyId,
          periodYear: year,
          periodMonth: month,
        },
      },
    });
    if (existing) continue;

    const bill = await prisma.monthlyCommissionBill.create({
      data: {
        sellerCompanyId,
        periodYear: year,
        periodMonth: month,
        totalAmount,
        orderCount: items.length,
        dueAt,
      },
    });

    await prisma.commission.updateMany({
      where: { id: { in: items.map((i) => i.id) } },
      data: { monthlyBillId: bill.id },
    });

    const users = await prisma.user.findMany({
      where: { companyId: sellerCompanyId },
      select: { id: true },
    });
    for (const u of users) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          type: "commission_bill",
          title: "Factura mensual de comisiones",
          body: `Período ${month}/${year}: ${totalAmount.toLocaleString("es-AR", { style: "currency", currency: "ARS" })} (${items.length} operaciones). Vence ${dueAt.toLocaleDateString("es-AR")}.`,
          link: "/vendedor/comisiones",
        },
      });
    }

    created++;
  }

  return { created, sellers: bySeller.size };
}

export async function suspendOverdueCommissionBills() {
  const now = new Date();
  const overdue = await prisma.monthlyCommissionBill.findMany({
    where: {
      status: "pendiente",
      dueAt: { lt: now },
    },
  });

  let suspended = 0;
  for (const bill of overdue) {
    await prisma.$transaction(async (tx) => {
      await tx.monthlyCommissionBill.update({
        where: { id: bill.id },
        data: { status: "vencido" },
      });
      await tx.company.update({
        where: { id: bill.sellerCompanyId },
        data: { listingsSuspended: true },
      });
      await tx.listing.updateMany({
        where: { companyId: bill.sellerCompanyId },
        data: { isActive: false },
      });
      await tx.abuseEvent.create({
        data: {
          companyId: bill.sellerCompanyId,
          signal: "comision_mensual_impaga",
          weight: "critico",
          action: "bloqueo_temporal",
          metadata: JSON.stringify({
            billId: bill.id,
            period: `${bill.periodMonth}/${bill.periodYear}`,
            amount: bill.totalAmount,
          }),
        },
      });
    });
    suspended++;
  }

  return { suspended, checked: overdue.length };
}

export async function markMonthlyBillPaid(billId: string, adminEmail?: string) {
  const bill = await prisma.monthlyCommissionBill.findUnique({
    where: { id: billId },
  });
  if (!bill) throw new Error("Factura mensual no encontrada");

  await prisma.$transaction(async (tx) => {
    await tx.monthlyCommissionBill.update({
      where: { id: billId },
      data: { status: "pagado", paidAt: new Date() },
    });
    await tx.commission.updateMany({
      where: { monthlyBillId: billId },
      data: { status: "pagado" },
    });
    await tx.company.update({
      where: { id: bill.sellerCompanyId },
      data: { listingsSuspended: false },
    });
    await tx.listing.updateMany({
      where: { companyId: bill.sellerCompanyId },
      data: { isActive: true },
    });
    await tx.auditLog.create({
      data: {
        actorEmail: adminEmail,
        action: "MONTHLY_COMMISSION_PAID",
        entityType: "MonthlyCommissionBill",
        entityId: billId,
      },
    });
  });

  return bill;
}

export async function getMonthlyBillsForSeller(sellerCompanyId: string) {
  return prisma.monthlyCommissionBill.findMany({
    where: { sellerCompanyId },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
  });
}
