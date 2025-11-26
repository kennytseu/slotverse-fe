import { NextRequest, NextResponse } from "next/server";
import { 
  getAllGames, 
  getFeaturedGames, 
  searchGames, 
  testConnection 
} from "@/lib/database/mysql";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        fallback: "Using static data"
      }, { status: 500 });
    }

    let games;

    switch (type) {
      case 'featured':
        games = await getFeaturedGames(limit);
        break;
      case 'search':
        if (!query) {
          return NextResponse.json({
            success: false,
            error: "Search query required"
          }, { status: 400 });
        }
        games = await searchGames(query, limit);
        break;
      default:
        games = await getAllGames(limit, offset);
    }

    return NextResponse.json({
      success: true,
      games,
      count: games.length,
      type,
      query: query || null
    });

  } catch (error: any) {
    console.error("Games API error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
