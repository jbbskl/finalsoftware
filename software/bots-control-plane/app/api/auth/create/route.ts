import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  console.log("[AUTH] Create account API called");
  
  try {
    const body = await req.json();
    console.log("[AUTH] Request body:", body);
    
    const { email, password, role } = body;
    
    if (!email || !password) {
      console.log("[AUTH] Missing email or password");
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    
    console.log("[AUTH] Hashing password...");
    const hashedPassword = await hash(password, 10);
    
    console.log("[AUTH] Creating user in database...");
    const user = await prisma.user.create({
      data: { 
        email: String(email).toLowerCase(), 
        passwordHash: hashedPassword, 
        role: role === "agency" ? "agency" : "creator" 
      }
    });
    
    console.log("[AUTH] User created successfully:", { id: user.id, email: user.email, role: user.role });
    return NextResponse.json({ id: user.id, email: user.email });
  } catch (e: any) {
    console.error("[AUTH] Create account error:", e);
    
    if (e.code === "P2002") {
      console.log("[AUTH] Email already exists");
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
    
    console.log("[AUTH] Generic create account failure");
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
