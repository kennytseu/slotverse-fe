import { NextRequest, NextResponse } from "next/server";
import { handleScrapeUrl } from "@/lib/agent/tool-functions";
import { writeFile } from "@/lib/agent/git";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, targetGame, extractType } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Scrape the URL
    const scrapeResult = await handleScrapeUrl({ url, targetGame, extractType });
    
    if (!scrapeResult.success) {
      return NextResponse.json(
        { error: scrapeResult.error },
        { status: 500 }
      );
    }

    // Process the scraped data and create game entries
    const games = scrapeResult.data?.games || [];
    const providers = scrapeResult.data?.providers || [];
    
    if (games.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No games found on the page",
        data: scrapeResult.data
      });
    }

    // Create a simple data file with the scraped content
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `data/scraped-games-${timestamp}.json`;
    
    const gameData = {
      sourceUrl: url,
      scrapedAt: new Date().toISOString(),
      games: games.map(game => ({
        name: game.name,
        provider: game.provider || providers[0] || "Unknown",
        rtp: game.rtp || "N/A",
        volatility: game.volatility || "Unknown",
        maxWin: game.maxWin || "N/A",
        features: extractFeatures(game.name),
        description: `${game.name} is a slot game${game.provider ? ` by ${game.provider}` : ''}.`,
        sourceUrl: url,
        addedAt: new Date().toISOString()
      }))
    };

    // Write the data file
    await writeFile({
      path: fileName,
      content: JSON.stringify(gameData, null, 2)
    });

    // Also update the featured games component if we found good data
    if (games.length > 0 && games[0].name && games[0].name.length > 3) {
      await updateFeaturedGamesComponent(games, providers);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully scraped and added ${games.length} games`,
      games: gameData.games,
      dataFile: fileName
    });

  } catch (error: any) {
    console.error("Scrape API error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function extractFeatures(gameName: string): string[] {
  const features = [];
  const name = gameName.toLowerCase();
  
  if (name.includes('free') || name.includes('spin')) features.push('Free Spins');
  if (name.includes('bonus') || name.includes('bonanza')) features.push('Bonus Features');
  if (name.includes('wild')) features.push('Wild Symbols');
  if (name.includes('mega') || name.includes('ways')) features.push('Megaways');
  if (name.includes('multiplier') || name.includes('multi')) features.push('Multipliers');
  if (name.includes('scatter')) features.push('Scatter Symbols');
  if (name.includes('jackpot')) features.push('Jackpot');
  if (name.includes('cascade') || name.includes('tumble')) features.push('Cascading Reels');
  
  return features.length > 0 ? features : ['Standard Features'];
}

async function updateFeaturedGamesComponent(games: any[], providers: string[]) {
  try {
    // Read the current featured games component
    const { handleReadFile } = await import("@/lib/agent/tool-functions");
    const currentFile = await handleReadFile({ path: "components/slots/FeaturedGames.tsx" });
    
    if (currentFile.success && currentFile.content) {
      // Add the new games to the featured games array
      const newGames = games.slice(0, 3).map((game, index) => {
        const gameId = Date.now() + index;
        return `  {
    id: ${gameId},
    name: "${game.name}",
    provider: "${game.provider || providers[0] || 'Unknown'}",
    image: "/api/placeholder/300/200",
    rtp: "${game.rtp || '96.00%'}",
    volatility: "${game.volatility || 'Medium'}",
    maxWin: "${game.maxWin || '1,000x'}",
    features: ${JSON.stringify(extractFeatures(game.name))},
    isNew: true,
    isFeatured: true
  }`;
      });

      // Insert new games into the featuredGames array
      const updatedContent = currentFile.content.replace(
        /const featuredGames = \[([\s\S]*?)\];/,
        (match, gamesContent) => {
          return `const featuredGames = [
${newGames.join(',\n')},${gamesContent}
];`;
        }
      );

      // Write the updated component
      await writeFile({
        path: "components/slots/FeaturedGames.tsx",
        content: updatedContent
      });
    }
  } catch (error) {
    console.error("Error updating featured games:", error);
    // Don't fail the whole operation if this fails
  }
}
