// Using direct fetch for provider scraping instead of robust-scraper

export interface ProviderData {
  name: string;
  slug: string;
  gameCount: number;
  url: string;
  featured?: boolean;
}

export interface ProviderScrapeResult {
  success: boolean;
  providers: ProviderData[];
  totalPages?: number;
  currentPage?: number;
  error?: string;
}

class ProviderScraper {
  
  /**
   * Fetch HTML from a page
   */
  private async fetchPageHtml(url: string): Promise<string | null> {
    try {
      console.log(`[ProviderScraper] Fetching: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`[ProviderScraper] HTTP ${response.status}: ${response.statusText}`);
        return null;
      }
      
      const html = await response.text();
      console.log(`[ProviderScraper] Fetched ${html.length} characters`);
      return html;
      
    } catch (error: any) {
      console.error(`[ProviderScraper] Fetch error:`, error.message);
      return null;
    }
  }
  
  /**
   * Scrape provider directory pages (like slotslaunch.com/providers)
   */
  async scrapeProviderDirectory(baseUrl: string, maxPages: number = 1): Promise<ProviderScrapeResult> {
    console.log(`[ProviderScraper] Starting scrape of ${baseUrl} for ${maxPages} pages`);
    
    const allProviders: ProviderData[] = [];
    let currentPage = 1;
    
    try {
      while (currentPage <= maxPages) {
        console.log(`[ProviderScraper] Scraping page ${currentPage}/${maxPages}`);
        
        // Construct URL for current page
        const pageUrl = this.buildPageUrl(baseUrl, currentPage);
        console.log(`[ProviderScraper] Page URL: ${pageUrl}`);
        
        // Fetch the page HTML directly
        const html = await this.fetchPageHtml(pageUrl);
        
        if (!html) {
          console.error(`[ProviderScraper] Failed to fetch page ${currentPage}: ${pageUrl}`);
          break;
        }
        
        // Extract providers from HTML
        const pageProviders = this.extractProvidersFromHtml(html, baseUrl);
        console.log(`[ProviderScraper] Found ${pageProviders.length} providers on page ${currentPage}`);
        
        allProviders.push(...pageProviders);
        
        // Check if there are more pages (look for pagination)
        const hasNextPage = this.hasNextPage(scrapeResult.html, currentPage, maxPages);
        if (!hasNextPage) {
          console.log(`[ProviderScraper] No more pages found, stopping at page ${currentPage}`);
          break;
        }
        
        currentPage++;
        
        // Add delay between pages to be respectful
        if (currentPage <= maxPages) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log(`[ProviderScraper] Completed scraping. Total providers found: ${allProviders.length}`);
      
      return {
        success: true,
        providers: allProviders,
        totalPages: maxPages,
        currentPage: currentPage - 1
      };
      
    } catch (error: any) {
      console.error('[ProviderScraper] Error during scraping:', error);
      return {
        success: false,
        providers: allProviders,
        error: error.message
      };
    }
  }
  
  /**
   * Build URL for specific page
   */
  private buildPageUrl(baseUrl: string, page: number): string {
    if (page === 1) {
      return baseUrl;
    }
    
    // Handle different pagination patterns
    if (baseUrl.includes('slotslaunch.com')) {
      // SlotsLaunch uses query parameters for pagination
      const url = new URL(baseUrl);
      url.searchParams.set('page', page.toString());
      return url.toString();
    }
    
    // Default: append page number
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}page=${page}`;
  }
  
  /**
   * Extract provider data from HTML
   */
  private extractProvidersFromHtml(html: string, baseUrl: string): ProviderData[] {
    const providers: ProviderData[] = [];
    
    try {
      // Pattern 1: SlotsLaunch provider cards
      const providerCardRegex = /<div[^>]*class="[^"]*provider[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
      const providerCards = html.match(providerCardRegex) || [];
      
      for (const card of providerCards) {
        const provider = this.extractProviderFromCard(card, baseUrl);
        if (provider) {
          providers.push(provider);
        }
      }
      
      // Pattern 2: Simple list items
      if (providers.length === 0) {
        const listItemRegex = /<li[^>]*>[\s\S]*?<\/li>/gi;
        const listItems = html.match(listItemRegex) || [];
        
        for (const item of listItems) {
          const provider = this.extractProviderFromListItem(item, baseUrl);
          if (provider) {
            providers.push(provider);
          }
        }
      }
      
      // Pattern 3: Direct provider links
      if (providers.length === 0) {
        const linkRegex = /<a[^>]*href="[^"]*\/([^\/]+)"[^>]*>([^<]+)<\/a>/gi;
        let match;
        
        while ((match = linkRegex.exec(html)) !== null) {
          const [, slug, name] = match;
          if (this.isValidProviderName(name) && this.isValidProviderSlug(slug)) {
            providers.push({
              name: this.cleanProviderName(name),
              slug: slug,
              gameCount: 0,
              url: this.resolveUrl(match[0].match(/href="([^"]+)"/)?.[1] || '', baseUrl),
              featured: false
            });
          }
        }
      }
      
    } catch (error) {
      console.error('[ProviderScraper] Error extracting providers from HTML:', error);
    }
    
    return providers;
  }
  
  /**
   * Extract provider from card element (SlotsLaunch style)
   */
  private extractProviderFromCard(cardHtml: string, baseUrl: string): ProviderData | null {
    try {
      // Extract name
      const nameMatch = cardHtml.match(/<h3[^>]*>([^<]+)<\/h3>/i) || 
                       cardHtml.match(/###\s*([^\n]+)/i) ||
                       cardHtml.match(/<[^>]*>([^<]+)<\/[^>]*>/i);
      
      if (!nameMatch) return null;
      
      const name = this.cleanProviderName(nameMatch[1]);
      if (!this.isValidProviderName(name)) return null;
      
      // Extract game count
      const gameCountMatch = cardHtml.match(/(\d+)\s*Slots?/i);
      const gameCount = gameCountMatch ? parseInt(gameCountMatch[1]) : 0;
      
      // Extract URL/slug
      const urlMatch = cardHtml.match(/href="([^"]+)"/i);
      const url = urlMatch ? this.resolveUrl(urlMatch[1], baseUrl) : '';
      
      // Extract slug from URL
      const slugMatch = url.match(/\/([^\/]+)\/?$/);
      const slug = slugMatch ? slugMatch[1] : this.nameToSlug(name);
      
      // Check if featured
      const featured = /featured/i.test(cardHtml);
      
      return {
        name,
        slug,
        gameCount,
        url,
        featured
      };
      
    } catch (error) {
      console.error('[ProviderScraper] Error extracting provider from card:', error);
      return null;
    }
  }
  
  /**
   * Extract provider from list item
   */
  private extractProviderFromListItem(itemHtml: string, baseUrl: string): ProviderData | null {
    try {
      const linkMatch = itemHtml.match(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/i);
      if (!linkMatch) return null;
      
      const [, href, name] = linkMatch;
      const cleanName = this.cleanProviderName(name);
      
      if (!this.isValidProviderName(cleanName)) return null;
      
      const url = this.resolveUrl(href, baseUrl);
      const slugMatch = url.match(/\/([^\/]+)\/?$/);
      const slug = slugMatch ? slugMatch[1] : this.nameToSlug(cleanName);
      
      return {
        name: cleanName,
        slug,
        gameCount: 0,
        url,
        featured: false
      };
      
    } catch (error) {
      console.error('[ProviderScraper] Error extracting provider from list item:', error);
      return null;
    }
  }
  
  /**
   * Check if there are more pages
   */
  private hasNextPage(html: string, currentPage: number, maxPages: number): boolean {
    if (currentPage >= maxPages) return false;
    
    // Look for pagination indicators
    const nextPagePatterns = [
      /next/i,
      new RegExp(`${currentPage + 1}`),
      /›/,
      />/,
      /more/i
    ];
    
    return nextPagePatterns.some(pattern => pattern.test(html));
  }
  
  /**
   * Clean provider name
   */
  private cleanProviderName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s&.-]/g, '')
      .trim();
  }
  
  /**
   * Convert name to slug
   */
  private nameToSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  /**
   * Check if provider name is valid
   */
  private isValidProviderName(name: string): boolean {
    if (!name || name.length < 2) return false;
    if (name.length > 100) return false;
    
    // Skip common non-provider text
    const skipPatterns = [
      /^see slots$/i,
      /^slots$/i,
      /^games$/i,
      /^provider$/i,
      /^featured$/i,
      /^\d+$/,
      /^page \d+$/i
    ];
    
    return !skipPatterns.some(pattern => pattern.test(name));
  }
  
  /**
   * Check if provider slug is valid
   */
  private isValidProviderSlug(slug: string): boolean {
    if (!slug || slug.length < 2) return false;
    if (slug.length > 100) return false;
    
    // Skip common non-provider slugs
    const skipPatterns = [
      /^page$/i,
      /^next$/i,
      /^prev$/i,
      /^home$/i,
      /^index$/i
    ];
    
    return !skipPatterns.some(pattern => pattern.test(slug));
  }
  
  /**
   * Resolve relative URLs
   */
  private resolveUrl(url: string, baseUrl: string): string {
    try {
      if (url.startsWith('http')) return url;
      if (url.startsWith('//')) return `https:${url}`;
      if (url.startsWith('/')) {
        const base = new URL(baseUrl);
        return `${base.protocol}//${base.host}${url}`;
      }
      return new URL(url, baseUrl).toString();
    } catch {
      return url;
    }
  }
}

export const providerScraper = new ProviderScraper();

// Export the main function for use in Discord handler
export async function scrapeProviderDirectory(url: string, pages: number = 1): Promise<ProviderScrapeResult> {
  return await providerScraper.scrapeProviderDirectory(url, pages);
}
