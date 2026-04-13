export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { createBudgetItem, deleteBudgetItem, toggleBudgetItemPaid, updateBudgetItem } from "@/app/actions";
import { requireFestivalAccessPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import BudgetClient from "./BudgetClient";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireFestivalAccessPage(id);
  if (!access.canViewBudget) notFound();

  const items = await prisma.budgetItem.findMany({
    where: { festivalId: id },
    orderBy: { date: "desc" },
  });

  const serialized = items.map((item) => ({
    ...item,
    date: item.date.toISOString(),
  }));

  return (
    <BudgetClient
      festivalId={id}
      items={serialized}
      isAdmin={access.isAdmin}
      createBudgetItem={createBudgetItem}
      deleteBudgetItem={deleteBudgetItem}
      updateBudgetItem={updateBudgetItem}
      toggleBudgetItemPaid={toggleBudgetItemPaid}
    />
  );
}
