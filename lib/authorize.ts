import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

type AdminUser = Awaited<ReturnType<typeof requireCurrentUser>>;

export async function requireAdmin() {
  return requireCurrentUser();
}

function festivalFilter(user: AdminUser) {
  if (user.role === "SUPER_ADMIN") return {};
  return {
    OR: [
      { ownerId: user.id },
      { members: { some: { userId: user.id } } },
    ],
  };
}

export async function requireOwnedFestival(festivalId: string) {
  const user = await requireAdmin();
  const festival = await prisma.festival.findFirst({
    where: { id: festivalId, ...festivalFilter(user) },
    select: {
      id: true,
      ownerId: true,
      inviteToken: true,
      viewerToken: true,
      viewerAccessEnabled: true,
      viewerShowBudget: true,
      viewerShowDocuments: true,
    },
  });
  if (!festival) throw new Error("אין הרשאה לפסטיבל הזה");
  return festival;
}

export async function requireFestivalOwner(festivalId: string) {
  const user = await requireAdmin();
  const festival = await prisma.festival.findFirst({
    where: { id: festivalId, ...(user.role === "SUPER_ADMIN" ? {} : { ownerId: user.id }) },
    select: { id: true, ownerId: true },
  });
  if (!festival) throw new Error("רק בעל הפסטיבל יכול לבצע פעולה זו");
  return { festival, user };
}

export async function requireOwnedArtist(artistId: string) {
  const user = await requireAdmin();
  const artist = await prisma.artist.findFirst({
    where: { id: artistId, festival: festivalFilter(user) },
    select: { id: true, festivalId: true, name: true },
  });
  if (!artist) throw new Error("אין הרשאה לאמן הזה");
  return artist;
}

export async function requireOwnedStage(stageId: string) {
  const user = await requireAdmin();
  const stage = await prisma.stage.findFirst({
    where: { id: stageId, festival: festivalFilter(user) },
    select: { id: true, festivalId: true },
  });
  if (!stage) throw new Error("אין הרשאה לבמה הזו");
  return stage;
}

export async function requireOwnedTimeSlot(timeSlotId: string) {
  const user = await requireAdmin();
  const timeSlot = await prisma.timeSlot.findFirst({
    where: { id: timeSlotId, stage: { festival: festivalFilter(user) } },
    select: { id: true, stageId: true, stage: { select: { festivalId: true } } },
  });
  if (!timeSlot) throw new Error("אין הרשאה לחריץ הזמן הזה");
  return timeSlot;
}

export async function requireOwnedTeamRole(roleId: string) {
  const user = await requireAdmin();
  const role = await prisma.teamMemberRole.findFirst({
    where: { id: roleId, festival: festivalFilter(user) },
    select: { id: true, festivalId: true },
  });
  if (!role) throw new Error("אין הרשאה לתפקיד הזה");
  return role;
}

export async function requireOwnedTeamMember(memberId: string) {
  const user = await requireAdmin();
  const member = await prisma.teamMember.findFirst({
    where: { id: memberId, festival: festivalFilter(user) },
    select: { id: true, festivalId: true },
  });
  if (!member) throw new Error("אין הרשאה לאיש הצוות הזה");
  return member;
}

export async function requireOwnedBudgetItem(itemId: string) {
  const user = await requireAdmin();
  const item = await prisma.budgetItem.findFirst({
    where: { id: itemId, festival: festivalFilter(user) },
    select: { id: true, festivalId: true },
  });
  if (!item) throw new Error("אין הרשאה לפריט התקציב הזה");
  return item;
}

export async function requireOwnedTeamApplication(applicationId: string) {
  const user = await requireAdmin();
  const application = await prisma.teamApplication.findFirst({
    where: { id: applicationId, festival: festivalFilter(user) },
    select: {
      id: true,
      festivalId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      carNumber: true,
      notes: true,
    },
  });
  if (!application) throw new Error("אין הרשאה לבקשה הזו");
  return application;
}

export async function requireOwnedVendor(vendorId: string) {
  const user = await requireAdmin();
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, festival: festivalFilter(user) },
    select: { id: true, festivalId: true, name: true, vendorToken: true },
  });
  if (!vendor) throw new Error("אין הרשאה לספק הזה");
  return vendor;
}

export async function requireOwnedArtistPayment(paymentId: string) {
  const user = await requireAdmin();
  const payment = await prisma.artistPayment.findFirst({
    where: { id: paymentId, artist: { festival: festivalFilter(user) } },
    select: {
      id: true,
      artistId: true,
      budgetItemId: true,
      isPaid: true,
      artist: { select: { festivalId: true } },
    },
  });
  if (!payment) throw new Error("אין הרשאה לתשלום הזה");
  return payment;
}

export async function requireOwnedVendorPayment(paymentId: string) {
  const user = await requireAdmin();
  const payment = await prisma.vendorPayment.findFirst({
    where: { id: paymentId, vendor: { festival: festivalFilter(user) } },
    select: {
      id: true,
      vendorId: true,
      budgetItemId: true,
      isPaid: true,
      vendor: { select: { festivalId: true } },
    },
  });
  if (!payment) throw new Error("אין הרשאה לתשלום הזה");
  return payment;
}

export async function requireOwnedSetupTask(taskId: string) {
  const user = await requireAdmin();
  const task = await prisma.festivalSetupTask.findFirst({
    where: { id: taskId, festival: festivalFilter(user) },
    select: { id: true, festivalId: true },
  });
  if (!task) throw new Error("אין הרשאה למשימה הזו");
  return task;
}

export async function requireOwnedCommunityContact(contactId: string) {
  const user = await requireAdmin();
  const contact = await prisma.festivalCommunityContact.findFirst({
    where: { id: contactId, festival: festivalFilter(user) },
    select: { id: true, festivalId: true },
  });
  if (!contact) throw new Error("אין הרשאה לאיש הקשר הזה");
  return contact;
}

export async function requireOwnedArtistContact(contactId: string) {
  const user = await requireAdmin();
  const contact = await prisma.artistContact.findFirst({
    where: { id: contactId, artist: { festival: festivalFilter(user) } },
    select: { id: true, artistId: true, artist: { select: { festivalId: true } } },
  });
  if (!contact) throw new Error("אין הרשאה לאיש הקשר הזה");
  return contact;
}

export async function requireOwnedArtistVehicle(vehicleId: string) {
  const user = await requireAdmin();
  const vehicle = await prisma.artistVehicle.findFirst({
    where: { id: vehicleId, artist: { festival: festivalFilter(user) } },
    select: { id: true, artistId: true, artist: { select: { festivalId: true } } },
  });
  if (!vehicle) throw new Error("אין הרשאה לרכב הזה");
  return vehicle;
}

export async function requireOwnedArtistFile(fileId: string) {
  const user = await requireAdmin();
  const file = await prisma.artistFile.findFirst({
    where: { id: fileId, artist: { festival: festivalFilter(user) } },
    select: { id: true, artistId: true, artist: { select: { festivalId: true } } },
  });
  if (!file) throw new Error("אין הרשאה לקובץ הזה");
  return file;
}

export async function requireOwnedStageFile(fileId: string) {
  const user = await requireAdmin();
  const file = await prisma.stageFile.findFirst({
    where: { id: fileId, stage: { festival: festivalFilter(user) } },
    select: { id: true, stageId: true, stage: { select: { festivalId: true } } },
  });
  if (!file) throw new Error("אין הרשאה לקובץ הזה");
  return file;
}

export async function requireOwnedFestivalFile(fileId: string) {
  const user = await requireAdmin();
  const file = await prisma.festivalFile.findFirst({
    where: { id: fileId, festival: festivalFilter(user) },
    select: { id: true, festivalId: true },
  });
  if (!file) throw new Error("אין הרשאה לקובץ הזה");
  return file;
}

export async function requireOwnedVendorContact(contactId: string) {
  const user = await requireAdmin();
  const contact = await prisma.vendorContact.findFirst({
    where: { id: contactId, vendor: { festival: festivalFilter(user) } },
    select: { id: true, vendor: { select: { festivalId: true, id: true } } },
  });
  if (!contact) throw new Error("אין הרשאה לאיש הקשר הזה");
  return contact;
}

export async function requireOwnedVendorVehicle(vehicleId: string) {
  const user = await requireAdmin();
  const vehicle = await prisma.vendorVehicle.findFirst({
    where: { id: vehicleId, vendor: { festival: festivalFilter(user) } },
    select: { id: true, vendor: { select: { festivalId: true, id: true } } },
  });
  if (!vehicle) throw new Error("אין הרשאה לרכב הזה");
  return vehicle;
}

export async function requireOwnedVendorFile(fileId: string) {
  const user = await requireAdmin();
  const file = await prisma.vendorFile.findFirst({
    where: { id: fileId, vendor: { festival: festivalFilter(user) } },
    select: { id: true, vendor: { select: { festivalId: true, id: true } } },
  });
  if (!file) throw new Error("אין הרשאה לקובץ הזה");
  return file;
}

export async function requireOwnedBooth(boothId: string) {
  const user = await requireAdmin();
  const booth = await prisma.booth.findFirst({
    where: { id: boothId, festival: festivalFilter(user) },
    select: { id: true, festivalId: true, name: true, boothToken: true },
  });
  if (!booth) throw new Error("אין הרשאה לדוכן הזה");
  return booth;
}

export async function requireOwnedBoothPayment(paymentId: string) {
  const user = await requireAdmin();
  const payment = await prisma.boothPayment.findFirst({
    where: { id: paymentId, booth: { festival: festivalFilter(user) } },
    select: { id: true, boothId: true, budgetItemId: true, isPaid: true, booth: { select: { festivalId: true } } },
  });
  if (!payment) throw new Error("אין הרשאה לתשלום הזה");
  return payment;
}

export async function requireOwnedBoothContact(contactId: string) {
  const user = await requireAdmin();
  const contact = await prisma.boothContact.findFirst({
    where: { id: contactId, booth: { festival: festivalFilter(user) } },
    select: { id: true, booth: { select: { festivalId: true, id: true } } },
  });
  if (!contact) throw new Error("אין הרשאה לאיש הקשר הזה");
  return contact;
}

export async function requireOwnedBoothVehicle(vehicleId: string) {
  const user = await requireAdmin();
  const vehicle = await prisma.boothVehicle.findFirst({
    where: { id: vehicleId, booth: { festival: festivalFilter(user) } },
    select: { id: true, booth: { select: { festivalId: true, id: true } } },
  });
  if (!vehicle) throw new Error("אין הרשאה לרכב הזה");
  return vehicle;
}

export async function requireOwnedBoothFile(fileId: string) {
  const user = await requireAdmin();
  const file = await prisma.boothFile.findFirst({
    where: { id: fileId, booth: { festival: festivalFilter(user) } },
    select: { id: true, booth: { select: { festivalId: true, id: true } } },
  });
  if (!file) throw new Error("אין הרשאה לקובץ הזה");
  return file;
}
