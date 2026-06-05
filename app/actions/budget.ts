"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireOwnedFestival, requireOwnedBudgetItem } from "@/lib/authorize";
import { assertFestivalMatch } from "@/lib/action-utils";

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
      category: (formData.get("category") as string) || null,
      vendor: (formData.get("vendor") as string) || null,
      notes: (formData.get("notes") as string) || null,
      isPaid: formData.get("isPaid") === "true",
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
      category: (formData.get("category") as string) || null,
      vendor: (formData.get("vendor") as string) || null,
      notes: (formData.get("notes") as string) || null,
      isPaid: formData.get("isPaid") === "true",
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
