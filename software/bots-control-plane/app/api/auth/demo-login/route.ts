import "server-only";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, role } = await req.json();
  const res = NextResponse.json({ ok: true });
  const opts = { httpOnly: true, sameSite: "lax", path: "/", secure: false } as const; // secure:false for http://localhost
  res.cookies.set("uid",   crypto.randomUUID(), opts);
  res.cookies.set("email", email || "creator@example.com", opts);
  res.cookies.set("role",  (role || "creator") as "creator"|"agency"|"admin", opts);
  return res;
}