import { NextRequest, NextResponse } from "next/server";
import { initializeTables, testConnection } from "@/lib/database/mysql";

export async function POST(req: NextRequest) {
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      return NextResponse.json({
        success: false,
        error: "Cannot connect to MySQL database. Please check your connection settings."
      }, { status: 500 });
    }

    // Initialize tables
    await initializeTables();

    return NextResponse.json({
      success: true,
      message: "Database tables initialized successfully",
      tables: ["games", "providers"]
    });

  } catch (error: any) {
    console.error("Database initialization error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const connected = await testConnection();
    
    return NextResponse.json({
      success: true,
      connected,
      message: connected ? "Database connection successful" : "Database connection failed"
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      connected: false,
      error: error.message
    }, { status: 500 });
  }
}
