const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// const cookieParser = require('cookie-parser'); // Temporarily disabled due to installation issues
const { v4: uuidv4 } = require('uuid');

// Configuration pour la production
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

// Middleware
// Configuration CORS
const corsOptions = {
  origin: isProduction 
    ? [process.env.BASE_URL, 'https://your-domain.vercel.app']
    : 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
// app.use(cookieParser()); // Temporarily disabled
app.use(express.static('dist'));

// Session middleware (simplified without cookies)
app.use((req, res, next) => {
  // Simple session handling using headers or generating new session
  const sessionId = req.headers['x-session-id'] || 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  req.sessionId = sessionId;
  res.setHeader('X-Session-Id', sessionId);
  next();
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// API Routes

// Session info endpoint
app.get('/api/session', (req, res) => {
  res.json({
    sessionId: req.sessionId,
    timestamp: new Date().toISOString()
  });
});

// Whop license validation endpoint
app.post('/api/validate-license', async (req, res) => {
  try {
    const { licenseKey } = req.body;
    
    if (!licenseKey) {
      return res.status(400).json({ error: 'License key required' });
    }

    // For now, simulate license validation
    // In production, this would call the Whop API
    const isValid = licenseKey.startsWith('whop_') && licenseKey.length > 10;
    
    if (isValid) {
      res.json({
        valid: true,
        plan: 'premium',
        features: ['ai_cover_generation', 'advanced_formatting', 'priority_support'],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      });
    } else {
      res.json({ valid: false });
    }
  } catch (error) {
    console.error('License validation error:', error);
    res.status(500).json({ error: 'License validation failed' });
  }
});

// Upload PDF endpoint
app.post('/api/upload-pdf', upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.oasis.opendocument.text'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid file type. Only PDF, DOCX, and ODT files are allowed.' });
    }

    // Store file info in session (simplified)
    const fileInfo = {
      id: 'file_' + Date.now(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
      sessionId: req.sessionId,
      uploadDate: new Date().toISOString()
    };

    // Return file information
    res.json({
      success: true,
      file: fileInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload cover image endpoint
app.post('/api/upload-cover', upload.single('cover'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' });
    }

    const coverInfo = {
      id: 'cover_' + Date.now(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
      sessionId: req.sessionId,
      uploadDate: new Date().toISOString()
    };
    
    res.json({
      success: true,
      cover: coverInfo
    });
  } catch (error) {
    console.error('Cover upload error:', error);
    res.status(500).json({ error: 'Cover upload failed' });
  }
});

// AI Cover generation endpoint
app.post('/api/generate-cover', async (req, res) => {
  try {
    const { prompt, style, dimensions } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Simulate AI cover generation
    // In production, this would call OpenAI DALL-E API
    const coverData = {
      id: 'ai_cover_' + Date.now(),
      prompt,
      style: style || 'realistic',
      dimensions: dimensions || '1024x1024',
      url: `https://picsum.photos/1024/1024?random=${Date.now()}`, // Placeholder
      sessionId: req.sessionId,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      cover: coverData
    });
  } catch (error) {
    console.error('AI cover generation error:', error);
    res.status(500).json({ error: 'Cover generation failed' });
  }
});

// Project management endpoints
app.get('/api/projects', (req, res) => {
  try {
    // In production, this would query the database
    // For now, return mock data
    const projects = [
      {
        id: 'proj_' + Date.now(),
        title: 'Mon Premier Livre',
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        fileCount: 1,
        sessionId: req.sessionId
      }
    ];
    
    res.json({ projects });
  } catch (error) {
    console.error('Projects fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const { title, description, files } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Project title is required' });
    }

    const project = {
      id: 'proj_' + Date.now(),
      title,
      description: description || '',
      status: 'draft',
      files: files || [],
      sessionId: req.sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.post('/api/lulu-order', async (req, res) => {
  try {
    // Lulu API integration will be implemented here
    res.json({ message: 'Lulu order endpoint ready' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: ['whop_integration', 'ai_covers', 'session_management']
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
