const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limit for POST endpoints
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 submissions per 15 minutes
  message: 'Too many submissions, please try again later.'
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.connect((err, client, done) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('✓ Database connected successfully');
    done();
  }
});

// Create tables with enhanced schema
const initializeDatabase = async () => {
  const createSitesTable = `
    CREATE TABLE IF NOT EXISTS sites (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category VARCHAR(50),
      button_url TEXT,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'pending',
      UNIQUE(url)
    )`;

  try {
    await pool.query(createSitesTable);
    console.log('✓ Database tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initializeDatabase();

// Validation middleware for site submission
const validateSiteSubmission = [
  body('url')
    .trim()
    .notEmpty().withMessage('URL is required')
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Valid URL with http:// or https:// is required')
    .isLength({ max: 500 }).withMessage('URL must be less than 500 characters'),

  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 2, max: 100 }).withMessage('Title must be between 2 and 100 characters')
    .escape(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
    .escape(),

  body('category')
    .optional()
    .trim()
    .isIn(['art', 'web', 'nostalgia', 'code', 'gaming', 'other'])
    .withMessage('Invalid category'),

  body('buttonUrl')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Button URL too long')
];

// API Routes

/**
 * POST /api/sites
 * Submit a new site to the directory
 */
app.post('/api/sites', postLimiter, validateSiteSubmission, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { url, title, description, category, buttonUrl } = req.body;

  try {
    // Check if URL already exists
    const existingCheck = await pool.query(
      'SELECT id FROM sites WHERE url = $1',
      [url]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({
        message: 'This URL has already been submitted.'
      });
    }

    // Insert new site
    const result = await pool.query(
      'INSERT INTO sites (url, title, description, category, button_url) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [url, title, description || null, category || 'other', buttonUrl || null]
    );

    console.log(`✓ New site submitted: ${title} (${url})`);

    res.status(201).json({
      message: 'Site submitted successfully.',
      id: result.rows[0].id
    });

  } catch (error) {
    console.error('Error submitting site:', error);
    res.status(500).json({
      message: 'An error occurred while submitting your site. Please try again later.'
    });
  }
});

/**
 * GET /api/sites
 * Get all submitted sites
 */
app.get('/api/sites', async (req, res) => {
  const { category, status, limit = 100, offset = 0 } = req.query;

  try {
    let query = 'SELECT id, url, title, description, category, button_url, submitted_at, status FROM sites';
    const params = [];
    const conditions = [];

    // Filter by category if provided
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    // Filter by status if provided (default: approved or pending)
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY submitted_at DESC';

    // Add pagination
    params.push(parseInt(limit), parseInt(offset));
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    res.json({
      sites: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({
      message: 'An error occurred while fetching sites.'
    });
  }
});

/**
 * GET /api/sites/:id
 * Get a specific site by ID
 */
app.get('/api/sites/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, url, title, description, category, button_url, submitted_at, status FROM sites WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Site not found.' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({
      message: 'An error occurred while fetching the site.'
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    message: 'An unexpected error occurred.',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   The Underweb Server                         ║
║   🌐 Server: http://localhost:${PORT}        ║
║   📡 API: http://localhost:${PORT}/api       ║
║   ✓ Environment: ${process.env.NODE_ENV || 'development'}              ║
╚═══════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

module.exports = app;
