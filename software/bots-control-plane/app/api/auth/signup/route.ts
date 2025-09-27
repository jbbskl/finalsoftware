import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  console.log("[AUTH] Signup API called");
  
  try {
    const body = await req.json();
    console.log("[AUTH] Request body:", body);
    
    const { email, password, role = "creator" } = body;
    
    if (!email || !password) {
      console.log("[AUTH] Missing email or password");
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    
    // Validate role
    if (!["creator", "agency", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    
    console.log("[AUTH] Hashing password...");
    const hashedPassword = await hash(password, 10);
    
    console.log("[AUTH] Creating user in database...");
    const user = await prisma.user.create({
      data: { 
        email: String(email).toLowerCase(), 
        passwordHash: hashedPassword, 
        role: role as "creator" | "agency" | "admin"
      }
    });
    
    console.log("[AUTH] User created successfully:", { id: user.id, email: user.email, role: user.role });
    
    // Set session cookies for immediate login
    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, role: user.role }
    });
    
    // Set session cookies
    response.cookies.set('uid', user.id, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    response.cookies.set('email', user.email, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    response.cookies.set('role', user.role, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    return response;
  } catch (e: any) {
    console.error("[AUTH] Signup error:", e);
    
    if (e.code === "P2002") {
      console.log("[AUTH] Email already exists");
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
    
    console.log("[AUTH] Generic signup failure");
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}