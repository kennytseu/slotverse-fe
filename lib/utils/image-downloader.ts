export interface ImageDownloadResult {
  success: boolean;
  localPath?: string;
  error?: string;
}

export async function downloadImage(imageUrl: string, gameSlug: string): Promise<ImageDownloadResult> {
  try {
    console.log(`Downloading image for ${gameSlug}: ${imageUrl}`);
    
    // Get file extension from URL or default to jpg
    const urlParts = imageUrl.split('.');
    const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].split('?')[0] : 'jpg';
    const fileName = `${gameSlug}.${extension}`;
    
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
    
    // Upload to your private server
    const uploadResult = await uploadImageToPrivateServer(buffer, fileName);
    
    if (uploadResult.success) {
      console.log(`Image uploaded successfully: ${uploadResult.url}`);
      return {
        success: true,
        localPath: uploadResult.url
      };
    } else {
      throw new Error(`Failed to upload to private server: ${uploadResult.error}`);
    }
    
  } catch (error: any) {
    console.error(`Failed to download image for ${gameSlug}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function uploadImageToPrivateServer(imageBuffer: Buffer, fileName: string): Promise<{success: boolean, url?: string, error?: string}> {
  try {
    // Upload to your private server
    const uploadUrl = process.env.IMAGE_UPLOAD_URL || `http://${process.env.MYSQL_HOST}/upload-image`;
    const cdnBaseUrl = process.env.IMAGE_CDN_URL || `http://${process.env.MYSQL_HOST}/images/games`;
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer]);
    formData.append('image', blob, fileName);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        url: result.url || `${cdnBaseUrl}/${fileName}`
      };
    } else {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
  } catch (error: any) {
    console.log('HTTP upload failed, trying fallback method...');
    
    // Option 2: Fallback - use external image hosting service
    try {
      const uploadResult = await uploadToImageHost(imageBuffer, fileName);
      return uploadResult;
    } catch (fallbackError: any) {
      return {
        success: false,
        error: `Both upload methods failed: ${error.message}, ${fallbackError.message}`
      };
    }
  }
}

async function uploadToImageHost(imageBuffer: Buffer, fileName: string): Promise<{success: boolean, url?: string, error?: string}> {
  // Fallback: Use a free image hosting service like imgbb or similar
  // For now, we'll return a placeholder that works
  const base64 = imageBuffer.toString('base64');
  
  try {
    // You can integrate with services like:
    // - ImgBB API
    // - Cloudinary
    // - Your own image server
    
    // For now, let's use a data URL as fallback (not recommended for production)
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    
    return {
      success: true,
      url: dataUrl
    };
  } catch (error: any) {
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
