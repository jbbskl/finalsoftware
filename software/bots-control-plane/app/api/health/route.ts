import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return Response.json({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      database: "connected"
    });
  } catch (error) {
    console.error("[DB] Health check failed:", error);
    
    return Response.json(
      { 
        ok: false, 
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: "Database connection failed"
      },
      { status: 500 }
    );
  }
}
