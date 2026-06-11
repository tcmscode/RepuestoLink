import { auth } from "@/lib/auth";
import { getPendingRatingsForCompany } from "@/lib/services/ratings";
import { PendingRatingsBanner } from "@/components/orders/PendingRatingsBanner";

export async function PendingRatingsNotice({
  role,
}: {
  role: "comprador" | "vendedor";
}) {
  const session = await auth();
  if (!session) return null;

  const pending = await getPendingRatingsForCompany(session.user.companyId);
  const asBuyer = role === "comprador" ? pending.asBuyer : [];
  const asSeller = role === "vendedor" ? pending.asSeller : [];

  return (
    <PendingRatingsBanner asBuyer={asBuyer} asSeller={asSeller} role={role} />
  );
}
