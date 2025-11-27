# SlotVerse Image Upload Server

Deploy this on your private server (same server as MySQL) to handle image uploads from your SlotVerse platform.

## Option 1: PHP Version (Recommended)

### Installation:
1. Copy `upload-image.php` to your web server root:
   ```bash
   # On your server (103.47.255.108)
   sudo cp upload-image.php /var/www/html/
   sudo chmod 644 /var/www/html/upload-image.php
   sudo chown www-data:www-data /var/www/html/upload-image.php
   ```

2. Create images directory:
   ```bash
   sudo mkdir -p /var/www/html/images/games
   sudo chmod 755 /var/www/html/images/games
   sudo chown www-data:www-data /var/www/html/images/games
   ```

3. Test the endpoint:
   ```bash
   curl http://103.47.255.108/upload-image.php
   ```

### Usage:
- **Upload URL**: `http://103.47.255.108/upload-image`
- **Image URL**: `http://103.47.255.108/images/games/{filename}`

## Option 2: Node.js Version

### Installation:
1. Copy files to your server:
   ```bash
   scp upload-server.js root@103.47.255.108:/opt/slotverse-images/
   ```

2. Install dependencies:
   ```bash
   ssh root@103.47.255.108
   cd /opt/slotverse-images
   npm install express multer cors
   ```

3. Run the server:
   ```bash
   node upload-server.js
   # Or with PM2 for production:
   pm2 start upload-server.js --name "slotverse-images"
   ```

### Usage:
- **Upload URL**: `http://103.47.255.108:3001/upload-image`
- **Image URL**: `http://103.47.255.108:3001/images/games/{filename}`

## Environment Variables

Add to your Vercel environment variables:

```bash
# If using PHP version
IMAGE_UPLOAD_URL=http://103.47.255.108/upload-image
IMAGE_CDN_URL=http://103.47.255.108/images/games

# If using Node.js version  
IMAGE_UPLOAD_URL=http://103.47.255.108:3001/upload-image
IMAGE_CDN_URL=http://103.47.255.108:3001/images/games
```

## Security Notes

1. **Firewall**: Ensure your server allows HTTP traffic on port 80 (PHP) or 3001 (Node.js)
2. **HTTPS**: Consider setting up SSL certificates for production
3. **File limits**: Both versions limit uploads to 5MB
4. **File types**: Only allows image files (jpeg, png, gif, webp)

## Testing

After setup, test with:
```bash
curl -X POST -F "image=@test-image.jpg" http://103.47.255.108/upload-image
```

Expected response:
```json
{
  "success": true,
  "filename": "test-image.jpg", 
  "url": "http://103.47.255.108/images/games/test-image.jpg",
  "size": 12345
}
```
