/**
 * Robust Web Scraper with Multiple Strategies
 * Handles anti-bot protection, dynamic content, and various site structures
 */

interface ScrapingResult {
  success: boolean;
  data?: {
    games: GameData[];
    providers: string[];
    metadata: {
      sourceUrl: string;
      extractedAt: string;
      strategy: string;
      responseTime: number;
    };
  };
  error?: string;
}

interface GameData {
  name: string;
  provider?: string;
  rtp?: string;
  volatility?: string;
  maxWin?: string;
  demoUrl?: string;
  imageUrl?: string;
  source: string;
}

export class RobustScraper {
  private strategies = [
    this.strategyDirectFetch,
    this.strategyWithRetries,
    this.strategyMobileUserAgent,
    this.strategyWithCookies,
    this.strategySlowRequest
  ];

  async scrapeUrl(url: string, targetGame?: string): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    // Try each strategy until one works
    for (let i = 0; i < this.strategies.length; i++) {
      const strategy = this.strategies[i];
      const strategyName = strategy.name.replace('strategy', '');
      
      console.log(`[RobustScraper] Trying strategy ${i + 1}/${this.strategies.length}: ${strategyName}`);
      
      try {
        const result = await strategy.call(this, url, targetGame);
        if (result.success && result.data && result.data.games.length > 0) {
          result.data.metadata.strategy = strategyName;
          result.data.metadata.responseTime = Date.now() - startTime;
          console.log(`[RobustScraper] ✅ Success with ${strategyName} - found ${result.data.games.length} games`);
          return result;
        }
      } catch (error: any) {
        console.log(`[RobustScraper] ❌ ${strategyName} failed: ${error.message}`);
        continue;
      }
    }

    return {
      success: false,
      error: `All ${this.strategies.length} scraping strategies failed. Site may have strong anti-bot protection.`
    };
  }

  private async strategyDirectFetch(url: string, targetGame?: string): Promise<ScrapingResult> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    return this.extractGameData(html, url, 'DirectFetch');
  }

  private async strategyWithRetries(url: string, targetGame?: string): Promise<ScrapingResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000)); // Progressive delay
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          signal: AbortSignal.timeout(45000)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        return this.extractGameData(html, url, `WithRetries-${attempt}`);
      } catch (error: any) {
        lastError = error;
        console.log(`[RobustScraper] Retry ${attempt}/3 failed: ${error.message}`);
      }
    }

    throw lastError || new Error('All retries failed');
  }

  private async strategyMobileUserAgent(url: string, targetGame?: string): Promise<ScrapingResult> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    return this.extractGameData(html, url, 'MobileUserAgent');
  }

  private async strategyWithCookies(url: string, targetGame?: string): Promise<ScrapingResult> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cookie': 'session=visitor; preferences=accepted; region=US',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    return this.extractGameData(html, url, 'WithCookies');
  }

  private async strategySlowRequest(url: string, targetGame?: string): Promise<ScrapingResult> {
    // Simulate human-like browsing with delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': new URL(url).origin,
      },
      signal: AbortSignal.timeout(60000) // Longer timeout for slow strategy
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    return this.extractGameData(html, url, 'SlowRequest');
  }

  private extractGameData(html: string, url: string, strategy: string): ScrapingResult {
    const games: GameData[] = [];
    
    // Strategy 1: Extract from URL path (most reliable)
    const gameFromUrl = this.extractGameFromUrl(url);
    if (gameFromUrl) {
      const game = { ...gameFromUrl, source: 'url' };
      this.enhanceGameData(game, html, url);
      games.push(game);
    }

    // Strategy 2: Extract from page title and headers
    const gameFromTitle = this.extractGameFromTitle(html);
    if (gameFromTitle && !games.find(g => g.name === gameFromTitle.name)) {
      const game = { ...gameFromTitle, source: 'title' };
      this.enhanceGameData(game, html, url);
      games.push(game);
    }

    // Strategy 3: Extract from structured data (JSON-LD, meta tags)
    const gameFromStructured = this.extractGameFromStructuredData(html);
    if (gameFromStructured && !games.find(g => g.name === gameFromStructured.name)) {
      const game = { ...gameFromStructured, source: 'structured' };
      this.enhanceGameData(game, html, url);
      games.push(game);
    }

    // Strategy 4: Extract from common game containers
    const gamesFromContainers = this.extractGamesFromContainers(html);
    for (const containerGame of gamesFromContainers) {
      if (!games.find(g => g.name === containerGame.name)) {
        const game = { ...containerGame, source: 'container' };
        this.enhanceGameData(game, html, url);
        games.push(game);
      }
    }

    return {
      success: games.length > 0,
      data: {
        games,
        providers: [...new Set(games.map(g => g.provider).filter(Boolean) as string[])],
        metadata: {
          sourceUrl: url,
          extractedAt: new Date().toISOString(),
          strategy,
          responseTime: 0 // Will be set by caller
        }
      }
    };
  }

  private extractGameFromUrl(url: string): GameData | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      // Look for game names in URL segments
      const gamePatterns = [
        /\/games?\/([^\/]+)/i,
        /\/slots?\/([^\/]+)/i,
        /\/play\/([^\/]+)/i,
        /\/game\/([^\/]+)/i,
        /\/([^\/]+)(?:\/play|\/demo|\/free)?$/i
      ];

      for (const pattern of gamePatterns) {
        const match = pattern.exec(urlObj.pathname);
        if (match && match[1]) {
          const gameName = this.cleanGameName(match[1]);
          if (this.isValidGameName(gameName)) {
            return { name: gameName, source: 'url' };
          }
        }
      }

      // Fallback: use last path segment
      const lastSegment = pathParts[pathParts.length - 1];
      if (lastSegment && !lastSegment.includes('.')) {
        const gameName = this.cleanGameName(lastSegment);
        if (this.isValidGameName(gameName)) {
          return { name: gameName, source: 'url' };
        }
      }
    } catch (error) {
      console.log('[RobustScraper] URL parsing failed:', error);
    }

    return null;
  }

  private extractGameFromTitle(html: string): GameData | null {
    const titlePatterns = [
      /<h1[^>]*>([^<]+)<\/h1>/i,
      /<title>([^<|]+)/i,
      /<h2[^>]*class="[^"]*(?:game|slot|title)[^"]*"[^>]*>([^<]+)<\/h2>/i,
      /<h3[^>]*class="[^"]*(?:game|slot|title)[^"]*"[^>]*>([^<]+)<\/h3>/i,
    ];

    for (const pattern of titlePatterns) {
      const match = pattern.exec(html);
      if (match && match[1]) {
        const gameName = this.cleanGameName(match[1]);
        if (this.isValidGameName(gameName)) {
          return { name: gameName, source: 'title' };
        }
      }
    }

    return null;
  }

  private extractGameFromStructuredData(html: string): GameData | null {
    // JSON-LD structured data
    const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi;
    let match;
    
    while ((match = jsonLdPattern.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        if (data.name || data.title) {
          const gameName = this.cleanGameName(data.name || data.title);
          if (this.isValidGameName(gameName)) {
            return {
              name: gameName,
              provider: data.author?.name || data.brand?.name,
              source: 'json-ld'
            };
          }
        }
      } catch (error) {
        // Invalid JSON, continue
      }
    }

    // Meta tags
    const metaPatterns = [
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*name=["']title["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*property=["']game:name["'][^>]*content=["']([^"']+)["']/i,
    ];

    for (const pattern of metaPatterns) {
      const match = pattern.exec(html);
      if (match && match[1]) {
        const gameName = this.cleanGameName(match[1]);
        if (this.isValidGameName(gameName)) {
          return { name: gameName, source: 'meta' };
        }
      }
    }

    return null;
  }

  private extractGamesFromContainers(html: string): GameData[] {
    const games: GameData[] = [];
    
    // Look for game containers with common class names
    const containerPatterns = [
      /<div[^>]*class="[^"]*(?:game|slot)[^"]*"[^>]*>[\s\S]*?<[^>]*>([^<]+)<[\s\S]*?<\/div>/gi,
      /<article[^>]*class="[^"]*(?:game|slot)[^"]*"[^>]*>[\s\S]*?<h[1-6][^>]*>([^<]+)<[\s\S]*?<\/article>/gi,
      /<li[^>]*class="[^"]*(?:game|slot)[^"]*"[^>]*>[\s\S]*?<[^>]*>([^<]+)<[\s\S]*?<\/li>/gi,
    ];

    for (const pattern of containerPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && games.length < 5) {
        const gameName = this.cleanGameName(match[1]);
        if (this.isValidGameName(gameName) && !games.find(g => g.name === gameName)) {
          games.push({ name: gameName, source: 'container' });
        }
      }
    }

    return games;
  }

  private enhanceGameData(game: GameData, html: string, url: string): void {
    // Extract RTP
    const rtpPatterns = [
      /rtp[^>]*>([0-9]{2,3}\.[0-9]{1,2}%)/i,
      /return[^>]*>([0-9]{2,3}\.[0-9]{1,2}%)/i,
      /([0-9]{2,3}\.[0-9]{1,2}%)/,
      /"rtp"\s*:\s*"?([0-9]{2,3}\.[0-9]{1,2})%?"?/i
    ];
    
    for (const pattern of rtpPatterns) {
      const match = pattern.exec(html);
      if (match) {
        game.rtp = match[1].includes('%') ? match[1] : `${match[1]}%`;
        break;
      }
    }

    // Extract provider
    const providerPatterns = [
      /provider[^>]*>([^<]+)</i,
      /developer[^>]*>([^<]+)</i,
      /by\s+([A-Za-z\s&']+)(?:\s|<|$)/i,
      /"provider"\s*:\s*"([^"]+)"/i
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

    // Extract image URL
    const imagePatterns = [
      /<img[^>]*src="([^"]*(?:game|slot|logo)[^"]*)"[^>]*>/i,
      /<img[^>]*alt="[^"]*(?:game|slot)[^"]*"[^>]*src="([^"]+)"/i,
      /"image"\s*:\s*"([^"]+)"/i
    ];
    
    for (const pattern of imagePatterns) {
      const match = pattern.exec(html);
      if (match && match[1]) {
        game.imageUrl = this.resolveUrl(match[1], url);
        break;
      }
    }
  }

  private cleanGameName(name: string): string {
    return name
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/\s*\|\s*.*$/, '') // Remove " | Site Name" suffix
      .replace(/\s*-\s*.*$/, '') // Remove " - Site Name" suffix
      .trim();
  }

  private isValidGameName(name: string): boolean {
    if (!name || name.length < 3 || name.length > 100) return false;
    
    const invalidTerms = [
      'home', 'casino', 'slots', 'games', 'play', 'free', 'demo', 'online',
      'welcome', 'bonus', 'login', 'register', 'contact', 'about', 'terms',
      'privacy', 'support', 'help', 'faq', 'news', 'blog', 'promotions'
    ];
    
    const nameLower = name.toLowerCase();
    return !invalidTerms.some(term => nameLower === term || nameLower.includes(` ${term} `));
  }

  private resolveUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }
}

// Export singleton instance
export const robustScraper = new RobustScraper();
