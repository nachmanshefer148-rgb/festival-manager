import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { createBudgetItem, deleteBudgetItem, updateBudgetItem, toggleBudgetItemPaid } from "@/app/actions";
import BudgetClient from "./BudgetClient";
import { getRole } from "@/lib/auth";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [festival, role, settings] = await Promise.all([
    prisma.festival.findUnique({ where: { id } }),
    getRole(),
    prisma.appSettings.findUnique({ where: { id: "global" } }),
  ]);
  if (!festival) notFound();

  if (role === "limited" && !(settings?.showBudget ?? true)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-lg font-medium text-gray-500">אין גישה לתקציב</p>
        <p className="text-sm mt-1">יש להיכנס למערכת כדי לצפות בתקציב</p>
      </div>
    );
  }

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
      isAdmin={role === "admin"}
      createBudgetItem={createBudgetItem}
      deleteBudgetItem={deleteBudgetItem}
      updateBudgetItem={updateBudgetItem}
      toggleBudgetItemPaid={toggleBudgetItemPaid}
    />
  );
}
