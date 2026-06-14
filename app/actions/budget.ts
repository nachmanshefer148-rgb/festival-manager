"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireOwnedFestival, requireOwnedBudgetItem } from "@/lib/authorize";
import { assertFestivalMatch } from "@/lib/action-utils";

export interface BulkBudgetItem {
  description: string;
  type: "INCOME" | "EXPENSE";
  categoryId?: string;
  vendor?: string;
  amount: number;
  vatMode?: string;
  isPaid?: boolean;
  date?: string;
  notes?: string;
}

export async function createBudgetItem(formData: FormData) {
  await requireAdmin();
  const festivalId = formData.get("festivalId") as string;
  await requireOwnedFestival(festivalId);
  await prisma.budgetItem.create({
    data: {
      festivalId,
      description: formData.get("description") as string,
      amount: parseInt(formData.get("amount") as string),
      type: formData.get("type") as "INCOME" | "EXPENSE",
      categoryId: (formData.get("categoryId") as string) || null,
      vendor: (formData.get("vendor") as string) || null,
      notes: (formData.get("notes") as string) || null,
      isPaid: formData.get("isPaid") === "true",
      vatMode: (formData.get("vatMode") as string) || "NONE",
      date: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
    },
  });
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function updateBudgetItem(id: string, formData: FormData) {
  const item = await requireOwnedBudgetItem(id);
  await prisma.budgetItem.update({
    where: { id },
    data: {
      description: formData.get("description") as string,
      amount: parseInt(formData.get("amount") as string),
      type: formData.get("type") as "INCOME" | "EXPENSE",
      categoryId: (formData.get("categoryId") as string) || null,
      vendor: (formData.get("vendor") as string) || null,
      notes: (formData.get("notes") as string) || null,
      isPaid: formData.get("isPaid") === "true",
      vatMode: (formData.get("vatMode") as string) || "NONE",
      date: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
    },
  });
  revalidatePath(`/festivals/${item.festivalId}/budget`);
}

export async function deleteBudgetItem(id: string, festivalId: string) {
  const item = await requireOwnedBudgetItem(id);
  assertFestivalMatch(item.festivalId, festivalId);
  await prisma.budgetItem.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function toggleBudgetItemPaid(id: string, isPaid: boolean, festivalId: string) {
  const item = await requireOwnedBudgetItem(id);
  assertFestivalMatch(item.festivalId, festivalId);
  await prisma.budgetItem.update({ where: { id }, data: { isPaid } });
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function createBudgetCategory(festivalId: string, name: string, type: "INCOME" | "EXPENSE") {
  await requireAdmin();
  await requireOwnedFestival(festivalId);
  await prisma.budgetCategory.create({ data: { festivalId, name, type } });
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function updateBudgetCategory(id: string, festivalId: string, name: string) {
  await requireAdmin();
  await requireOwnedFestival(festivalId);
  await prisma.budgetCategory.update({ where: { id }, data: { name } });
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function deleteBudgetCategory(id: string, festivalId: string) {
  await requireAdmin();
  await requireOwnedFestival(festivalId);
  await prisma.budgetCategory.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function bulkCreateBudgetItems(
  festivalId: string,
  items: BulkBudgetItem[]
): Promise<{ created: number; skipped: number }> {
  await requireAdmin();
  await requireOwnedFestival(festivalId);

  let created = 0;
  let skipped = 0;

  for (const item of items) {
    if (!item.description?.trim() || !item.amount || item.amount <= 0) {
      skipped++;
      continue;
    }
    try {
      await prisma.budgetItem.create({
        data: {
          festivalId,
          description: item.description.trim(),
          amount: Math.round(item.amount),
          type: item.type ?? "EXPENSE",
          categoryId: item.categoryId ?? null,
          vendor: item.vendor?.trim() || null,
          notes: item.notes?.trim() || null,
          isPaid: item.isPaid ?? false,
          vatMode: item.vatMode ?? "NONE",
          date: item.date ? new Date(item.date) : new Date(),
        },
      });
      created++;
    } catch {
      skipped++;
    }
  }

  revalidatePath(`/festivals/${festivalId}/budget`);
  return { created, skipped };
}
