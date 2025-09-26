import { handlers } from "@/lib/auth";

// Prevent static optimization attempts and ensure Node runtime
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Re-export GET and POST from NextAuth handlers
export const GET = handlers.GET;
export const POST = handlers.POST;
