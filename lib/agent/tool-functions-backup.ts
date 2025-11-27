// Clean version of the scraper - extracts only ONE game per URL

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

export function extractSlotGameData(html: string, url: string, targetGame?: string, extractType?: string): ExtractedData {
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
  if (gameFromUrl && isValidGameName(gameFromUrl)) {
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
