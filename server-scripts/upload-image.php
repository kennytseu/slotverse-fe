<?php
// upload-image.php - Deploy this on your private server
// Place this file in your web root (e.g., /var/www/html/upload-image.php)

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    // Create images directory if it doesn't exist
    $uploadDir = __DIR__ . '/images/games/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Check if file was uploaded
    if (!isset($_FILES['image'])) {
        throw new Exception('No image file provided');
    }
    
    $file = $_FILES['image'];
    
    // Validate file
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Upload error: ' . $file['error']);
    }
    
    // Check file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    $fileType = mime_content_type($file['tmp_name']);
    
    if (!in_array($fileType, $allowedTypes)) {
        throw new Exception('Invalid file type: ' . $fileType);
    }
    
    // Generate safe filename
    $fileName = basename($file['name']);
    $fileName = preg_replace('/[^a-zA-Z0-9._-]/', '', $fileName);
    
    // Move uploaded file
    $targetPath = $uploadDir . $fileName;
    
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new Exception('Failed to save file');
    }
    
    // Return success response
    $serverHost = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'];
    $imageUrl = "http://{$serverHost}/images/games/{$fileName}";
    
    echo json_encode([
        'success' => true,
        'filename' => $fileName,
        'url' => $imageUrl,
        'size' => filesize($targetPath)
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
