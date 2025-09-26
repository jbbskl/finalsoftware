import "server-only";
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  ["uid","email","role"].forEach(name => res.cookies.set(name, "", { path: "/", maxAge: 0 }));
  return res;
}