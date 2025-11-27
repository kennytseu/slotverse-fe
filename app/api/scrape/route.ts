import { NextRequest, NextResponse } from "next/server";
import { handleScrapeUrl } from "@/lib/agent/tool-functions";
import { writeFile } from "@/lib/agent/git";
import { 
  createGame, 
  createProvider, 
  getGameBySlug, 
  getProviderBySlug, 
  createSlug, 
  updateProviderGameCount,
  testConnection 
} from "@/lib/database/mysql";
import { downloadImage } from "@/lib/utils/image-downloader";

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

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('Database connection failed, falling back to file storage');
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

    const savedGames = [];
    const savedProviders = [];

    // Process each game
    for (const game of games) {
      const gameName = game.name;
      const providerName = game.provider || providers[0] || "Unknown";
      const gameSlug = createSlug(gameName);
      
      try {
        // Save to database if connected
        if (dbConnected) {
          // Check if provider exists, create if not
          const existingProvider = await getProviderBySlug(createSlug(providerName));
          if (!existingProvider && providerName !== "Unknown") {
            const providerId = await createProvider({
              name: providerName,
              slug: createSlug(providerName),
              description: `Games by ${providerName}`,
              is_featured: false
            });
            savedProviders.push({ id: providerId, name: providerName });
          }

          // Check if game exists
          const existingGame = await getGameBySlug(gameSlug);
        if (!existingGame) {
          // Download image if available
          let localImagePath = undefined;
          if (game.image) {
            console.log(`Downloading image for ${gameName}: ${game.image}`);
            const downloadResult = await downloadImage(game.image, gameSlug);
            if (downloadResult.success) {
              localImagePath = downloadResult.localPath;
              console.log(`Image downloaded successfully: ${localImagePath}`);
            } else {
              console.warn(`Failed to download image for ${gameName}: ${downloadResult.error}`);
              localImagePath = game.image; // Fallback to original URL
            }
          }

          const gameId = await createGame({
            name: gameName,
            slug: gameSlug,
            provider: providerName,
            rtp: game.rtp || undefined,
            volatility: game.volatility || undefined,
            max_win: game.maxWin || undefined,
            features: JSON.stringify(extractFeatures(gameName)),
            description: `${gameName} is a slot game${providerName !== "Unknown" ? ` by ${providerName}` : ''}.`,
            image_url: localImagePath,
            demo_url: game.demoUrl || undefined,
            source_url: url,
            is_featured: true,
            is_new: true
          });

            // Update provider game count
            if (providerName !== "Unknown") {
              await updateProviderGameCount(providerName);
            }

            savedGames.push({ id: gameId, name: gameName, provider: providerName });
          } else {
            console.log(`Game ${gameName} already exists in database`);
          }
        }
      } catch (dbError) {
        console.error('Database error for game:', gameName, dbError);
      }
    }

    // Also save to JSON file as backup
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
        image: game.image || null,
        demoUrl: game.demoUrl || null,
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
      message: `Successfully scraped and added ${savedGames.length} games to database (${games.length} total found)`,
      games: gameData.games,
      savedToDatabase: savedGames,
      savedProviders: savedProviders,
      dataFile: fileName,
      databaseConnected: dbConnected
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
