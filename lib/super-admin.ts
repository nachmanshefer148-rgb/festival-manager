export function isConfiguredSuperAdmin(email: string): boolean {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}
