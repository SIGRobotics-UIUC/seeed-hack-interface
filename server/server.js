// using express due to easy node.js setup
const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();

// Create recordings directory if it doesn't exist
const recordingsDir = path.join(__dirname, 'recordings');
if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
    console.log('Created recordings directory:', recordingsDir);
}

// Configure multer for file uploads with custom filename
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, recordingsDir);
    },
    filename: function (req, file, cb) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `recording_${timestamp}.webm`;
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        console.log('🔍 File filter - MIME type:', file.mimetype);
        console.log('🔍 File filter - Field name:', file.fieldname);
        
        // Accept audio files
        if (file.mimetype.startsWith('audio/') || file.mimetype === 'audio/webm') {
            cb(null, true);
        } else {
            console.log('❌ Invalid file type:', file.mimetype);
            cb(new Error('Only audio files are allowed'), false);
        }
    }
});

// Serve the frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Error handling middleware for multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.error('❌ Multer error:', error);
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 10MB.'
            });
        }
        return res.status(400).json({
            success: false,
            error: 'File upload error: ' + error.message
        });
    } else if (error) {
        console.error('❌ Upload error:', error);
        return res.status(400).json({
            success: false,
            error: 'Upload error: ' + error.message
        });
    }
    next();
});



// Endpoint to trigger the simulation
app.post('/run-sim', (req, res) => {
  const scriptPath = path.join(__dirname, '../backend/simulate.py');
  const process = spawn('python3', [scriptPath]);

  process.stdout.on('data', data => {
    console.log(`Robot: ${data.toString().trim()}`);
  });

  process.stderr.on('data', data => {
    console.error(`Error: ${data.toString().trim()}`);
  });

  process.on('close', code => {
    console.log(`Simulation ended with code ${code}`);
    res.json({ status: 'Simulation complete', code });
  });
});

app.post('/upload', upload.single('audio-file'), (req, res) => {
    try {
        console.log('📤 Upload request received');
        console.log('📋 Request body:', req.body);
        console.log('📁 Request file:', req.file);
        
        if (!req.file) {
            console.log('❌ No file in request');
            return res.status(400).json({ 
                success: false, 
                error: 'No audio file provided' 
            });
        }

        const fileInfo = {
            originalName: req.file.originalname,
            savedName: req.file.filename,
            size: req.file.size,
            path: req.file.path,
            timestamp: new Date().toISOString()
        };

        console.log('🎙️ Audio recording saved:');
        console.log('   📁 File:', fileInfo.savedName);
        console.log('   📊 Size:', (fileInfo.size / 1024).toFixed(2), 'KB');
        console.log('   📍 Path:', fileInfo.path);
        console.log('   ⏰ Time:', fileInfo.timestamp);
        
        res.json({ 
            success: true, 
            message: 'Audio recording saved successfully!',
            file: fileInfo
        });
        
    } catch (error) {
        console.error('❌ Error processing upload:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process audio file' 
        });
    }
});

// Endpoint to list all recordings
app.get('/recordings', (req, res) => {
    try {
        const files = fs.readdirSync(recordingsDir)
            .filter(file => file.endsWith('.webm'))
            .map(file => {
                const filePath = path.join(recordingsDir, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    created: stats.birthtime,
                    path: filePath
                };
            })
            .sort((a, b) => b.created - a.created); // Sort by newest first

        res.json({
            success: true,
            recordings: files,
            count: files.length
        });
    } catch (error) {
        console.error('Error listing recordings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list recordings'
        });
    }
});

app.listen(3000, () => {
    console.log('🚀 Server running on http://localhost:3000');
    console.log('📁 Recordings will be saved to:', recordingsDir);
});