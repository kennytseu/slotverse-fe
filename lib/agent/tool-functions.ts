import { writeFile } from "./git";
import { saveMemory, getMemory } from "./memory";
import { github } from "./git";
import { checkFileSafety, performSafetyCheck } from "./safety";

export async function handleReadFile({ path }: { path: string }) {
  const repo = process.env.GITHUB_REPO;
  if (!repo) {
    throw new Error("Missing env GITHUB_REPO");
  }

  const [owner, repoName] = repo.split("/");

  try {
    const { data } = await github.rest.repos.getContent({
      owner,
      repo: repoName,
      path,
    });

    if ('content' in data && data.content) {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return {
        success: true,
        path,
        content,
        size: data.size
      };
    }

    return {
      success: false,
      error: "File not found or is a directory"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function handleWriteFile({ path, content }: { path: string; content: string }) {
  // Safety check
  const safetyCheck = checkFileSafety(path, content);
  if (!safetyCheck.allowed) {
    return {
      success: false,
      error: safetyCheck.reason,
      suggestion: safetyCheck.suggestion
    };
  }

  return await writeFile({ path, content });
}

export async function handleCreatePage({ 
  pageName, 
  pageType, 
  content 
}: { 
  pageName: string; 
  pageType: "app-router" | "api-route"; 
  content?: string 
}) {
  let filePath: string;
  let defaultContent: string;

  if (pageType === "app-router") {
    filePath = `app/${pageName}/page.tsx`;
    defaultContent = content || `export default function ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">${pageName.charAt(0).toUpperCase() + pageName.slice(1)}</h1>
      <p>Welcome to the ${pageName} page!</p>
    </div>
  );
}`;
  } else {
    filePath = `app/api/${pageName}/route.ts`;
    defaultContent = content || `import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Hello from ${pageName} API" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}`;
  }

  return await handleWriteFile({ path: filePath, content: defaultContent });
}

export async function handleCreateComponent({ 
  componentName, 
  componentType, 
  props = [] 
}: { 
  componentName: string; 
  componentType: "client" | "server"; 
  props?: Array<{ name: string; type: string; optional?: boolean }> 
}) {
  const filePath = `components/${componentName}.tsx`;
  
  // Generate props interface
  const propsInterface = props.length > 0 ? `
interface ${componentName}Props {
${props.map(prop => `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type};`).join('\n')}
}` : '';

  const propsParam = props.length > 0 ? `{ ${props.map(p => p.name).join(', ')} }: ${componentName}Props` : '';
  const clientDirective = componentType === "client" ? `"use client";\n\n` : '';

  const content = `${clientDirective}${propsInterface}

export default function ${componentName}(${propsParam}) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">${componentName}</h2>
      {/* Add your component content here */}
    </div>
  );
}`;

  return await handleWriteFile({ path: filePath, content });
}

export async function handleSaveMemory({ key, value }: { key: string; value: string }) {
  try {
    await saveMemory(key, value);
    return {
      success: true,
      key,
      message: "Memory saved successfully"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function handleGetMemory({ key }: { key: string }) {
  try {
    const value = await getMemory(key);
    return {
      success: true,
      key,
      value
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function handleListFiles({ path = "" }: { path?: string }) {
  const repo = process.env.GITHUB_REPO;
  if (!repo) {
    throw new Error("Missing env GITHUB_REPO");
  }

  const [owner, repoName] = repo.split("/");

  try {
    const { data } = await github.rest.repos.getContent({
      owner,
      repo: repoName,
      path,
    });

    if (Array.isArray(data)) {
      return {
        success: true,
        path,
        files: data.map(item => ({
          name: item.name,
          type: item.type,
          size: item.size,
          path: item.path
        }))
      };
    }

    return {
      success: false,
      error: "Path is not a directory"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function handleScrapeUrl({ 
  url, 
  targetGame, 
  extractType = "auto" 
}: { 
  url: string; 
  targetGame?: string; 
  extractType?: "game" | "provider" | "games-list" | "auto" 
}) {
  try {
    // Fetch the webpage content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`
      };
    }

    const html = await response.text();
    
    // Extract structured data using common patterns
    const extractedData = extractSlotGameData(html, url, targetGame, extractType);
    
    return {
      success: true,
      url,
      extractType,
      targetGame,
      data: extractedData,
      message: `Successfully extracted ${extractedData.games?.length || 0} games and ${extractedData.providers?.length || 0} providers from ${url}`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

interface GameData {
  name: string;
  provider?: string;
  rtp?: string;
  volatility?: string;
  maxWin?: string;
  description?: string;
  image?: string;
  demoUrl?: string;
  source: string;
}

interface ExtractedData {
  games: GameData[];
  providers: string[];
  metadata: {
    sourceUrl: string;
    extractedAt: string;
    extractType?: string;
  };
}

function extractSlotGameData(html: string, url: string, targetGame?: string, extractType?: string): ExtractedData {
  const data: ExtractedData = {
    games: [],
    providers: [],
    metadata: {
      sourceUrl: url,
      extractedAt: new Date().toISOString(),
      extractType
    }
  };

  // Try to extract the main game from URL first (most reliable)
  const gameFromUrl = extractGameNameFromUrl('', url);
  if (gameFromUrl) {
    const mainGame: GameData = {
      name: gameFromUrl,
      source: 'url'
    };
    
    // Extract additional data for this specific game
    extractGameDetails(html, url, mainGame);
    data.games.push(mainGame);
    
    // Only return this one game
    return data;
  }

  // Fallback: Look for the most prominent game title (usually H1 or page title)
  const titlePatterns = [
    /<h1[^>]*>([^<]+)<\/h1>/i, // Single H1 (most important)
    /<title>([^<|]+)/i, // Page title
    /<h2[^>]*class="[^"]*(?:game|slot|title)[^"]*"[^>]*>([^<]+)<\/h2>/i, // Game-specific H2
  ];

  for (const pattern of titlePatterns) {
    const match = pattern.exec(html);
    if (match) {
      let gameName = match[1].trim();
      
      // Clean up the game name
      gameName = cleanGameName(gameName);
      
      if (isValidGameName(gameName)) {
        const mainGame: GameData = {
          name: gameName,
          source: 'title'
        };
        
        // Extract additional data for this game
        extractGameDetails(html, url, mainGame);
        data.games.push(mainGame);
        
        // Return just this one game
        return data;
      }
    }
  }

  // If still no game found, return empty
  return data;
}

// Helper function to clean game names
function cleanGameName(name: string): string {
  return name
    .replace(/\s*-\s*.*$/, '') // Remove everything after dash
    .replace(/\s*\|.*$/, '') // Remove everything after pipe
    .replace(/\s*\(.*?\)/g, '') // Remove parentheses content
    .replace(/Demo\s*/gi, '') // Remove "Demo"
    .replace(/Slot\s*/gi, '') // Remove "Slot" 
    .replace(/Game\s*/gi, '') // Remove "Game"
    .replace(/Free\s*/gi, '') // Remove "Free"
    .replace(/Play\s*/gi, '') // Remove "Play"
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Helper function to validate game names
function isValidGameName(name: string): boolean {
  const nameLower = name.toLowerCase();
  
  // Must be reasonable length
  if (name.length < 3 || name.length > 50) return false;
  
  // Filter out obvious non-games
  const invalidTerms = [
    'logo', 'home', 'spin', 'casino', 'joey', 'phoebe', 'rachel', 
    'ross', 'monica', 'chandler', 'bovada', 'betus', 'vegas', 
    'jackpot capital', 'grande', 'launch', 'paradise', 'aces',
    'basketball', 'football', 'hockey', 'christmas', 'thanksgiving',
    'friday', 'comedian', 'singer', 'witch', 'superhuman', 'damian',
    'marc', '001x', 'cc_silver', 'sunnyspins', 'kudos', 'click',
    'askme', 'you likey', 's launch', 's paradise', 'looking up',
    'welcome', 'about', 'contact', 'terms', 'privacy', 'help',
    'support', 'login', 'register', 'sign up', 'sign in'
  ];
  
  return !invalidTerms.some(term => nameLower.includes(term));
}

// Helper function to extract additional game details
function extractGameDetails(html: string, url: string, game: GameData): void {
  // Extract RTP (first match only)
  const rtpPatterns = [
    /rtp[^>]*>([0-9]{2,3}\.[0-9]{1,2}%)/i,
    /return[^>]*>([0-9]{2,3}\.[0-9]{1,2}%)/i,
    /([0-9]{2,3}\.[0-9]{1,2}%)/,
    /"rtp"\s*:\s*"?([0-9]{2,3}\.[0-9]{1,2})%?"?/i
  ];
  
  for (const pattern of rtpPatterns) {
    const match = pattern.exec(html);
    if (match) {
      game.rtp = match[1];
      break;
    }
  }

  // Extract provider (first match only)
  const providerPatterns = [
    /provider[^>]*>([^<]+)</i,
    /developer[^>]*>([^<]+)</i,
    /by\s+([A-Za-z\s&']+)(?:\s|<|$)/i
  ];
  
  for (const pattern of providerPatterns) {
    const match = pattern.exec(html);
    if (match) {
      const provider = match[1].trim();
      if (provider.length > 2 && provider.length < 50) {
        game.provider = provider;
        break;
      }
    }
  }

  // Extract volatility (first match only)
  const volatilityPatterns = [
    /volatility[^>]*>(high|medium|low)/i,
    /variance[^>]*>(high|medium|low)/i
  ];
  
  for (const pattern of volatilityPatterns) {
    const match = pattern.exec(html);
    if (match) {
      game.volatility = match[1];
      break;
    }
  }

  // Extract max win (first match only)
  const maxWinPatterns = [
    /max[^>]*win[^>]*>([0-9,]+x?)/i,
    /maximum[^>]*>([0-9,]+x?)/i
  ];
  
  for (const pattern of maxWinPatterns) {
    const match = pattern.exec(html);
    if (match) {
      game.maxWin = match[1];
      break;
    }
  }

  // Extract demo URL (first match only)
  const demoUrlPatterns = [
    /<a[^>]*href="([^"]*(?:play|demo|openGame)[^"]*)"[^>]*(?:play|demo|free)/i,
    /<iframe[^>]*src="([^"]*(?:game|demo|openGame)[^"]*)"[^>]*>/i,
    /href="([^"]*openGame\.do[^"]*)"[^>]*/i,
    /data-game-url="([^"]+)"/i,
    /"gameUrl"\s*:\s*"([^"]+)"/i
  ];
  
  for (const pattern of demoUrlPatterns) {
    const match = pattern.exec(html);
    if (match) {
      let demoUrl = match[1].trim();
      
      // Convert relative URLs to absolute
      if (demoUrl.startsWith('/')) {
        const urlObj = new URL(url);
        demoUrl = `${urlObj.protocol}//${urlObj.host}${demoUrl}`;
      } else if (demoUrl.startsWith('./')) {
        const urlObj = new URL(url);
        demoUrl = `${urlObj.protocol}//${urlObj.host}${demoUrl.substring(1)}`;
      }
      
      // Validate URL
      if (demoUrl.startsWith('http') && demoUrl.length > 10) {
        game.demoUrl = demoUrl;
        break;
      }
    }
  }

  // Extract image (first match only)
  const imagePatterns = [
    /<img[^>]*src="([^"]*(?:slot|game|demo|thumb|preview|cover)[^"]*\.[^"]*)"[^>]*>/i,
    /<img[^>]*class="[^"]*(?:game|slot|demo|thumb|preview|cover)[^"]*"[^>]*src="([^"]+)"/i,
    /"image"\s*:\s*"([^"]+)"/i,
    /"thumbnail"\s*:\s*"([^"]+)"/i,
    /"cover"\s*:\s*"([^"]+)"/i
  ];
  
  for (const pattern of imagePatterns) {
    const match = pattern.exec(html);
    if (match) {
      let imageUrl = match[1].trim();
      
      // Convert relative URLs to absolute
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      } else if (imageUrl.startsWith('./')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl.substring(1)}`;
      }
      
      // Validate image URL
      if (imageUrl.startsWith('http') && imageUrl.length > 10) {
        game.image = imageUrl;
        break;
      }
    }
  }
}

  // Extract game names
  for (const pattern of gamePatterns.name) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let gameName = match[1].trim();
      
      // Clean up common unwanted text
      gameName = gameName
        .replace(/\s*-\s*.*$/, '') // Remove everything after dash
        .replace(/\s*\|.*$/, '') // Remove everything after pipe
        .replace(/\s*\(.*?\)/g, '') // Remove parentheses content
        .replace(/Demo\s*/gi, '') // Remove "Demo"
        .replace(/Slot\s*/gi, '') // Remove "Slot" 
        .replace(/Game\s*/gi, '') // Remove "Game"
        .replace(/Free\s*/gi, '') // Remove "Free"
        .replace(/Play\s*/gi, '') // Remove "Play"
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      if (gameName.length > 3 && gameName.length < 50 && !gameName.includes('looking up')) {
        if (!targetGame || gameName.toLowerCase().includes(targetGame.toLowerCase())) {
          data.games.push({
            name: gameName,
            source: 'title/heading'
          });
        }
      }
    }
  }

  // Extract RTP values
  for (const pattern of gamePatterns.rtp) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const rtp = match[1];
      if (data.games.length > 0) {
        data.games[data.games.length - 1].rtp = rtp;
      }
    }
  }

  // Extract providers
  for (const pattern of gamePatterns.provider) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const provider = match[1].trim();
      if (provider.length > 2 && provider.length < 50) {
        data.providers.push(provider);
        if (data.games.length > 0) {
          data.games[data.games.length - 1].provider = provider;
        }
      }
    }
  }

  // Extract demo URLs
  for (const pattern of gamePatterns.demoUrl) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let demoUrl = match[1].trim();
      
      // Convert relative URLs to absolute
      if (demoUrl.startsWith('/')) {
        const urlObj = new URL(url);
        demoUrl = `${urlObj.protocol}//${urlObj.host}${demoUrl}`;
      } else if (demoUrl.startsWith('./')) {
        const urlObj = new URL(url);
        demoUrl = `${urlObj.protocol}//${urlObj.host}${demoUrl.substring(1)}`;
      }
      
      // Validate URL
      if (demoUrl.startsWith('http') && demoUrl.length > 10) {
        if (data.games.length > 0) {
          data.games[data.games.length - 1].demoUrl = demoUrl;
        } else {
          // If no games found yet, create a game entry for this demo URL
          const gameName = extractGameNameFromUrl(demoUrl, url);
          if (gameName) {
            data.games.push({
              name: gameName,
              demoUrl: demoUrl,
              source: 'demo-url'
            });
          }
        }
        break; // Use first valid demo URL found
      }
    }
  }

  // Extract JSON-LD structured data if available
  const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches) {
    for (const jsonLdMatch of jsonLdMatches) {
      try {
        const jsonContent = jsonLdMatch.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        const structured = JSON.parse(jsonContent);
        if (structured.name || structured.title) {
          data.games.push({
            name: structured.name || structured.title,
            description: structured.description,
            provider: structured.author?.name || structured.brand?.name,
            source: 'json-ld'
          });
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }
  }

  // Extract images
  const images: string[] = [];
  for (const pattern of gamePatterns.images) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let imageUrl = match[1].trim();
      
      // Convert relative URLs to absolute
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      } else if (imageUrl.startsWith('./')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl.substring(1)}`;
      }
      
      // Filter out small icons and invalid images
      if (imageUrl.length > 10 && 
          !imageUrl.includes('icon') && 
          !imageUrl.includes('logo') &&
          !imageUrl.includes('favicon') &&
          (imageUrl.includes('.jpg') || imageUrl.includes('.png') || imageUrl.includes('.webp') || imageUrl.includes('.jpeg'))) {
        images.push(imageUrl);
      }
    }
  }

  // Assign images to games
  data.games.forEach((game: GameData, index: number) => {
    if (images[index]) {
      game.image = images[index];
    } else if (images[0]) {
      game.image = images[0]; // Use first image as fallback
    }
  });

  // Remove duplicates and filter out non-games
  data.games = data.games.filter((game: GameData, index: number, self: GameData[]) => {
    const name = game.name.toLowerCase();
    
    // Remove duplicates
    const isUnique = index === self.findIndex((g: GameData) => g.name.toLowerCase() === name);
    
    // Filter out obvious non-games
    const isValidGame = name.length > 2 && 
                       !name.includes('logo') && 
                       !name.includes('home') && 
                       !name.includes('spin') && 
                       !name.includes('casino') && 
                       !name.includes('joey') && 
                       !name.includes('phoebe') && 
                       !name.includes('rachel') && 
                       !name.includes('ross') && 
                       !name.includes('monica') && 
                       !name.includes('chandler') && 
                       !name.includes('bovada') && 
                       !name.includes('betus') && 
                       !name.includes('vegas') && 
                       !name.includes('jackpot capital') && 
                       !name.includes('grande') && 
                       !name.includes('launch') && 
                       !name.includes('paradise') && 
                       !name.includes('aces') && 
                       !name.includes('basketball') && 
                       !name.includes('football') && 
                       !name.includes('hockey') && 
                       !name.includes('christmas') && 
                       !name.includes('thanksgiving') && 
                       !name.includes('friday') && 
                       !name.includes('comedian') && 
                       !name.includes('singer') && 
                       !name.includes('witch') && 
                       !name.includes('superhuman') && 
                       !name.includes('damian') && 
                       !name.includes('marc') && 
                       !name.includes('001x') && 
                       !name.includes('cc_silver') && 
                       !name.includes('sunnyspins') && 
                       !name.includes('kudos') && 
                       !name.match(/^[a-z]$/) && 
                       !name.includes('click') &&
                       !name.includes('minion') &&
                       name !== 'askme' &&
                       name !== 'you likey?' &&
                       name !== 's launch' &&
                       name !== 's paradise';
    
    return isUnique && isValidGame;
  });
  
  data.providers = [...new Set(data.providers)];

  return data;
}

// Helper function to extract game name from demo URL or page URL
function extractGameNameFromUrl(demoUrl: string, pageUrl: string): string | null {
  // Try to extract from page URL first (more reliable)
  const pageUrlParts = pageUrl.split('/');
  const lastPart = pageUrlParts[pageUrlParts.length - 1];
  if (lastPart && lastPart !== '' && !lastPart.includes('.')) {
    return lastPart
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }
  
  // Fallback to demo URL
  const urlParts = demoUrl.split('/');
  for (let i = urlParts.length - 1; i >= 0; i--) {
    const part = urlParts[i];
    if (part && part.length > 3 && !part.includes('.') && !part.includes('=')) {
      return part
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
    }
  }
  
  return null;
}
