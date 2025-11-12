# The Underweb 🌐

A nostalgic Web 2.0 social directory service with a retro aesthetic inspired by the golden age of the internet (2000s). Browse, search, and submit websites in a delightfully vintage interface complete with visitor counters, rotating buttons, and glitch effects.

## 🎨 Features

### Current Features
- **Retro Web 2.0 Design**: Nostalgic UI inspired by GeoCities, Wiby, and early web directories
- **Site Directory**: Browse websites organized by categories (Art, Web Dev, Gaming, etc.)
- **Search Engine**: Terminal-style search functionality with real-time results
- **Site Submission**: Submit your own websites to the directory with form validation
- **Button Rotator**: Classic 88x31 button carousel widget
- **Visitor Counter**: Retro hit counter with glitch animation effects
- **Popup Ads**: Parody retro advertisements (non-intrusive)
- **Loading Screen**: Classic progress bar loading animation
- **Easter Eggs**: Hidden features like Konami code admin console
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile devices
- **RESTful API**: Full backend API for site management

### Security Features
- Helmet.js security headers
- Rate limiting (100 requests/15min, 10 submissions/15min)
- Input validation and sanitization
- SQL injection protection
- CORS configuration
- XSS prevention

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database (Neon recommended)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/the-underweb.git
cd the-underweb
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your database credentials:
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

4. **Start the server**
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Development Mode
```bash
npm run dev
```

This uses nodemon for auto-restart on file changes.

## 📁 Project Structure

```
the-underweb/
├── backend/
│   ├── server.js          # Express server with API routes
│   ├── .env               # Environment variables (not in git)
│   └── .env.example       # Environment template
├── public/
│   ├── index.html         # Main HTML file
│   ├── css/
│   │   └── style.css      # Responsive styles
│   └── js/
│       ├── script.js      # Main application logic
│       ├── search.js      # Search functionality
│       ├── submit.js      # Form submission handler
│       ├── counter.js     # Visitor counter
│       └── rotator.js     # Button rotator widget
├── .github/
│   └── workflows/
│       └── neon.yaml      # GitHub Actions for Neon DB
├── .gitignore
├── package.json
└── README.md
```

## 🗄️ Database Schema

### Sites Table
```sql
CREATE TABLE IF NOT EXISTS sites (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50),
  button_url TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending'
);
```

### Categories
- `art` - Pixel Art & Graphics
- `web` - Web Development
- `nostalgia` - Web Nostalgia
- `code` - Code & Programming
- `gaming` - Retro Gaming
- `other` - Miscellaneous

## 🔌 API Endpoints

### POST /api/sites
Submit a new site to the directory.

**Request Body:**
```json
{
  "url": "https://example.com",
  "title": "Example Site",
  "description": "A cool retro website",
  "category": "web",
  "buttonUrl": "https://example.com/button.gif"
}
```

**Response:** `201 Created`
```json
{
  "message": "Site submitted successfully.",
  "id": 123
}
```

### GET /api/sites
Get all submitted sites with optional filtering and pagination.

**Query Parameters:**
- `category` - Filter by category (optional)
- `status` - Filter by status (optional)
- `limit` - Number of results (default: 100)
- `offset` - Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "sites": [
    {
      "id": 1,
      "url": "https://example.com",
      "title": "Example Site",
      "description": "A cool retro website",
      "category": "web",
      "button_url": "https://example.com/button.gif",
      "submitted_at": "2025-01-15T10:30:00Z",
      "status": "pending"
    }
  ],
  "count": 1
}
```

### GET /api/sites/:id
Get a specific site by ID.

**Response:** `200 OK`
```json
{
  "id": 1,
  "url": "https://example.com",
  "title": "Example Site",
  ...
}
```

### GET /api/health
Health check endpoint for monitoring.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | (required) |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `CORS_ORIGIN` | Allowed CORS origins | http://localhost:3000 |
| `DEBUG` | Enable debug logging | false |

### CORS Configuration
To allow multiple origins, use a comma-separated list:
```env
CORS_ORIGIN=http://localhost:3000,https://yoursite.com
```

## 🎯 Deployment

### Deploying to Production

1. **Set environment variables**
```bash
export NODE_ENV=production
export DATABASE_URL=your_production_database_url
export PORT=3000
```

2. **Build and start**
```bash
npm start
```

### Deploying to Vercel/Netlify
- Set environment variables in your platform's dashboard
- Configure build command: `npm install`
- Configure start command: `npm start`
- Set publish directory: `public`

### Deploying with Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

### Manual Testing
1. Start the server: `npm start`
2. Open http://localhost:3000 in your browser
3. Test the following features:
   - Browse directory listings
   - Search for sites
   - Submit a new site
   - Check visitor counter
   - Try the button rotator
   - Test on mobile devices

### API Testing
```bash
# Health check
curl http://localhost:3000/api/health

# Submit a site
curl -X POST http://localhost:3000/api/sites \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","title":"Test Site","category":"web"}'

# Get all sites
curl http://localhost:3000/api/sites
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct in `.env`
- Check network connectivity to database
- Ensure SSL mode is properly configured

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

### CORS Errors
- Update `CORS_ORIGIN` in `.env` to match your frontend URL
- Check browser console for specific CORS error messages
- Ensure protocol (http/https) matches

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use 2 spaces for indentation
- Follow existing code patterns
- Add comments for complex logic
- Test your changes before committing

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by early web directories like Wiby, Peelopaalu, and GeoCities
- Nostalgic design elements from the Web 2.0 era
- Community contributors and testers

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section

## 🗺️ Roadmap

### Planned Features
- [ ] User authentication and profiles
- [ ] User-submitted ratings and reviews
- [ ] RSS feed support
- [ ] WebRing functionality
- [ ] Admin moderation dashboard
- [ ] Email notifications
- [ ] API key system for developers
- [ ] Site uptime monitoring
- [ ] Advanced search with filters
- [ ] Tagging system
- [ ] Social sharing features
- [ ] Dark mode toggle
- [ ] Internationalization (i18n)

## 📊 Status

**Current Version:** 1.0.0
**Status:** Production Ready ✅
**Last Updated:** January 2025

---

Built with ❤️ and nostalgia for the early web.
