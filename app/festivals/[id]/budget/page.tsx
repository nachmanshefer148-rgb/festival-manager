export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import {
  createBudgetItem,
  deleteBudgetItem,
  toggleBudgetItemPaid,
  updateBudgetItem,
  createBudgetCategory,
  updateBudgetCategory,
  deleteBudgetCategory,
  bulkCreateBudgetItems,
} from "@/app/actions";
import { requireFestivalAccessPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import BudgetClient from "./BudgetClient";

const DEFAULT_EXPENSE_CATEGORIES = ["הפקה", "ציוד קולי ואור", "שכר אמנים", "כוח אדם", "שיווק", "ביטוח ואישורים", "אחר"];
const DEFAULT_INCOME_CATEGORIES = ["כרטיסי כניסה", "חסויות", "מזון ומשקאות", "מרצ'נדייז", "אחר"];

export default async function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireFestivalAccessPage(id);
  if (!access.canViewBudget) notFound();

  let [expenseCategories, incomeCategories] = await Promise.all([
    prisma.budgetCategory.findMany({ where: { festivalId: id, type: "EXPENSE" }, orderBy: { name: "asc" } }),
    prisma.budgetCategory.findMany({ where: { festivalId: id, type: "INCOME" }, orderBy: { name: "asc" } }),
  ]);

  if (expenseCategories.length === 0) {
    await prisma.budgetCategory.createMany({
      data: DEFAULT_EXPENSE_CATEGORIES.map((name) => ({ name, type: "EXPENSE" as const, festivalId: id })),
    });
    expenseCategories = await prisma.budgetCategory.findMany({ where: { festivalId: id, type: "EXPENSE" }, orderBy: { name: "asc" } });
  }

  if (incomeCategories.length === 0) {
    await prisma.budgetCategory.createMany({
      data: DEFAULT_INCOME_CATEGORIES.map((name) => ({ name, type: "INCOME" as const, festivalId: id })),
    });
    incomeCategories = await prisma.budgetCategory.findMany({ where: { festivalId: id, type: "INCOME" }, orderBy: { name: "asc" } });
  }

  const [items, vendors] = await Promise.all([
    prisma.budgetItem.findMany({
      where: { festivalId: id },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.vendor.findMany({ where: { festivalId: id }, select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  const serialized = items.map((item) => ({
    id: item.id,
    description: item.description,
    amount: item.amount,
    type: item.type,
    categoryId: item.categoryId ?? null,
    categoryName: item.category?.name ?? null,
    hasVat: item.hasVat,
    date: item.date.toISOString(),
    isPaid: item.isPaid,
    vendor: item.vendor ?? null,
    notes: item.notes ?? null,
  }));

  return (
    <BudgetClient
      festivalId={id}
      items={serialized}
      expenseCategories={expenseCategories}
      incomeCategories={incomeCategories}
      vendorNames={vendors.map((v) => v.name)}
      isAdmin={access.isAdmin}
      createBudgetItem={createBudgetItem}
      deleteBudgetItem={deleteBudgetItem}
      updateBudgetItem={updateBudgetItem}
      toggleBudgetItemPaid={toggleBudgetItemPaid}
      createCategory={createBudgetCategory}
      updateCategory={updateBudgetCategory}
      deleteCategory={deleteBudgetCategory}
      bulkCreateBudgetItems={bulkCreateBudgetItems}
    />
  );
}
