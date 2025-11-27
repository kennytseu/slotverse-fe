// upload-server.js - Node.js image upload server for your private server
// Run with: node upload-server.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Create images directory
const imagesDir = path.join(__dirname, 'images', 'games');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        // Clean filename
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '');
        cb(null, cleanName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Upload endpoint
app.post('/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file provided'
            });
        }

        const serverHost = req.get('host');
        const imageUrl = `http://${serverHost}/images/games/${req.file.filename}`;

        res.json({
            success: true,
            filename: req.file.filename,
            url: imageUrl,
            size: req.file.size
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'SlotVerse Image Upload Server' });
});

app.listen(PORT, () => {
    console.log(`🖼️  SlotVerse Image Upload Server running on port ${PORT}`);
    console.log(`📁 Images stored in: ${imagesDir}`);
    console.log(`🌐 Upload endpoint: http://localhost:${PORT}/upload-image`);
});

// Package.json dependencies needed:
// npm install express multer cors
