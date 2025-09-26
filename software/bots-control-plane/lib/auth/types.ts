export type UserRole = "creator" | "agency" | "admin";
export type SessionLite = { id: string; email: string; role: UserRole };