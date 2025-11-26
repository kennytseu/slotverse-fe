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

  // Common slot game data patterns
  const gamePatterns = {
    name: [
      /<h1[^>]*>([^<]*(?:slot|game|bonanza|book|gates|sweet|big|mega|fire|gold|diamond|lucky|magic|wild|dragon|treasure|fortune|power|royal|super|ultra|extreme)[^<]*)<\/h1>/gi,
      /<title>([^<]*(?:slot|game|bonanza|book|gates|sweet|big|mega|fire|gold|diamond|lucky|magic|wild|dragon|treasure|fortune|power|royal|super|ultra|extreme)[^<]*)<\/title>/gi,
      /class="[^"]*game[^"]*"[^>]*>([^<]+)</gi
    ],
    rtp: [
      /rtp[^>]*>([0-9.]+%?)/gi,
      /return[^>]*>([0-9.]+%?)/gi,
      /([0-9]{2}\.[0-9]{1,2}%)/g
    ],
    provider: [
      /provider[^>]*>([^<]+)</gi,
      /developer[^>]*>([^<]+)</gi,
      /by\s+([A-Za-z\s&']+)(?:\s|<|$)/gi
    ],
    volatility: [
      /volatility[^>]*>(high|medium|low)/gi,
      /variance[^>]*>(high|medium|low)/gi
    ],
    maxWin: [
      /max[^>]*win[^>]*>([0-9,]+x?)/gi,
      /maximum[^>]*>([0-9,]+x?)/gi
    ]
  };

  // Extract game names
  for (const pattern of gamePatterns.name) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const gameName = match[1].trim();
      if (gameName.length > 3 && gameName.length < 100) {
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

  // Remove duplicates and clean data
  data.games = data.games.filter((game: GameData, index: number, self: GameData[]) => 
    index === self.findIndex((g: GameData) => g.name.toLowerCase() === game.name.toLowerCase())
  );
  
  data.providers = [...new Set(data.providers)];

  return data;
}
