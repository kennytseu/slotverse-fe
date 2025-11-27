import fs from 'fs';
import path from 'path';

export interface ImageDownloadResult {
  success: boolean;
  localPath?: string;
  error?: string;
}

export async function downloadImage(imageUrl: string, gameSlug: string): Promise<ImageDownloadResult> {
  try {
    console.log(`Downloading image for ${gameSlug}: ${imageUrl}`);
    
    // Create games images directory if it doesn't exist
    const imagesDir = path.join(process.cwd(), 'public', 'images', 'games');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    
    // Get file extension from URL or default to jpg
    const urlParts = imageUrl.split('.');
    const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].split('?')[0] : 'jpg';
    const fileName = `${gameSlug}.${extension}`;
    const localPath = path.join(imagesDir, fileName);
    const publicPath = `/images/games/${fileName}`;
    
    // Download the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Check if it's actually an image
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`URL does not point to an image. Content-Type: ${contentType}`);
    }
    
    // Get the image buffer
    const imageBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);
    
    // Save to local file system
    fs.writeFileSync(localPath, buffer);
    
    console.log(`Image saved successfully: ${publicPath}`);
    
    return {
      success: true,
      localPath: publicPath
    };
    
  } catch (error: any) {
    console.error(`Failed to download image for ${gameSlug}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function downloadGameImages(games: any[]): Promise<any[]> {
  const updatedGames = [];
  
  for (const game of games) {
    if (game.image && game.slug) {
      console.log(`Processing image for game: ${game.name}`);
      
      const downloadResult = await downloadImage(game.image, game.slug);
      
      if (downloadResult.success) {
        // Update the game with local image path
        updatedGames.push({
          ...game,
          image: downloadResult.localPath,
          originalImageUrl: game.image // Keep original for reference
        });
      } else {
        // Keep original image URL if download failed
        console.warn(`Using original image URL for ${game.name}: ${downloadResult.error}`);
        updatedGames.push(game);
      }
    } else {
      updatedGames.push(game);
    }
  }
  
  return updatedGames;
}
