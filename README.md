# 🚀 Process Intelligence Hub

An intelligent dashboard that helps operations managers monitor processes, detect bottlenecks, and implement AI-powered optimization strategies in real-time.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=for-the-badge&logo=tailwindcss)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)
![Production](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)

## 🎯 Problem Statement

Warehouse operations face daily challenges with process bottlenecks that cost thousands of dollars per hour in lost productivity. Traditional monitoring tools show data but don't provide actionable insights or financial impact analysis.

## ✨ Solution

This AI-powered dashboard transforms raw process data into actionable intelligence by:

- **🔍 Real-time Bottleneck Detection** - Automatically identifies critical delays across 6 warehouse processes
- **💰 Financial Impact Analysis** - Calculates cost per hour for each bottleneck
- **🎯 AI Recommendations** - Generates specific, actionable fixes with ROI projections
- **📊 Scenario Planning** - Test "what-if" scenarios before implementation
- **📈 Period Comparison** - Track trends and improvements over time
- **🔐 Secure Authentication** - Protected routes with Supabase Auth
- **📤 Data Export** - CSV export for processes, insights, and statistics
- **🐳 Docker Deployment** - Production-ready containerization
- **📝 Structured Logging** - Winston-based logging with rotation

## 🏭 Warehouse Processes Monitored

1. **Receiving** - Unloading and initial intake
2. **Quality Check** - Inspection and verification
3. **Storing** - Putaway and inventory placement
4. **Material Picking** - Order fulfillment picking
5. **Packaging** - Order preparation
6. **Dispatch** - Final shipping

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Charts:** Recharts
- **Architecture:** React Server Components + Client Components

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenRouter API (GLM-4.5-air:free)
- **Logging:** Winston
- **Rate Limiting:** express-rate-limit

### DevOps
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Deployment:** Multi-stage Docker builds
- **Monitoring:** Structured logging with file rotation

## 📊 Key Features

### 🔐 Security & Authentication
- **Protected Routes** - AuthGuard middleware prevents unauthorized access
- **API Rate Limiting** - 100 req/15min (general), 5 req/15min (auth)
- **Password Hashing** - bcrypt encryption
- **Error Boundaries** - Graceful error handling

### 📤 Data Management
- **CSV Export** - Download processes, insights, and statistics
- **Structured Logging** - Winston with JSON format, log rotation
- **Real-time Updates** - Live data synchronization
- **Historical Data** - Time-range based queries

### 📊 Dashboard Features
- **Active Bottlenecks Panel** - Unified view with risk scoring
- **Interactive Visualization** - Recharts with filtering
- **Scenario Planner** - What-if analysis with ROI
- **Period Comparison** - Trend analysis
- **Resizable Panels** - Custom layout preferences

### 🐳 Deployment
- **Docker Ready** - Multi-stage optimized builds
- **CI/CD Pipeline** - Automated testing and deployment
- **Health Checks** - Built-in monitoring endpoints
- **Production Optimized** - Standalone Next.js output

## 🚀 Getting Started

### Quick Start (Docker - Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-warehouse-bottleneck-detector.git
cd ai-warehouse-bottleneck-detector

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase and OpenRouter credentials

# Start with Docker Compose
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### Development Setup

```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Configure environment
# Create backend/.env with:
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_supabase_key
# OPENROUTER_API_KEY=your_openrouter_key

# Start backend
cd backend
npm start
# Backend runs on http://localhost:5000

# In another terminal, start frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### Production Build

```bash
# Build frontend
npm run build
npm start

# Build and run with Docker
docker-compose up -d --build
```

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing/redirect page
│   │   ├── login/page.tsx        # Authentication page
│   │   ├── dashboard/page.tsx    # Main dashboard
│   │   └── layout.tsx            # Root layout with ErrorBoundary
│   ├── components/
│   │   ├── DashboardLayout.tsx   # Main layout with CSV export
│   │   ├── ProcessTimelineChart.tsx # Recharts visualization
│   │   ├── InsightPanel.tsx      # AI insights with sorting
│   │   ├── AuthGuard.tsx         # Protected route middleware
│   │   └── ErrorBoundary.tsx     # Error handling component
│   ├── services/
│   │   └── api.ts                # Backend API integration
│   ├── utils/
│   │   └── exportData.ts         # CSV export utilities
│   └── data/
│       └── processData.ts        # Type definitions
├── backend/
│   ├── server.js                 # Express server with logging & rate limiting
│   ├── routes/
│   │   ├── auth.js               # Authentication endpoints
│   │   ├── processes.js          # Process data endpoints
│   │   └── insights.js           # AI insights endpoints
│   ├── utils/
│   │   └── logger.js             # Winston logging configuration
│   └── database/
│       └── schema.sql            # Database schema
├── Dockerfile                    # Frontend container
├── backend/Dockerfile            # Backend container
├── docker-compose.yml            # Orchestration
└── .github/workflows/ci.yml      # CI/CD pipeline
```

## 🧠 AI Logic

The system analyzes process performance using:

1. **Statistical Analysis** - Compares actual vs. expected performance
2. **Risk Scoring** - Weighted algorithm: Delay% (0-50pts) + Status (0-40pts) + Duration (0-10pts)
3. **Priority Sorting** - Critical → High → Medium → Low
4. **Bottleneck Detection** - Identifies constraint points using Theory of Constraints
5. **Recommendation Engine** - OpenRouter AI generates contextual suggestions
6. **Financial Modeling** - Calculates operational cost impact

**Universal Color Scheme**:
- 🔴 Red = Critical (Risk ≥80)
- 🟡 Yellow = High/Medium (Risk 40-79)
- 🟢 Green = Low (Risk <40)

## 💡 Use Cases

- **Operations Managers** - Daily monitoring and quick decision-making
- **Process Engineers** - Root cause analysis and continuous improvement
- **Warehouse Supervisors** - Shift performance tracking
- **Executive Teams** - High-level metrics and cost analysis with CSV exports

## 📚 Documentation

- **[FEATURES_IMPLEMENTED.md](./FEATURES_IMPLEMENTED.md)** - Complete feature documentation
- **[DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)** - Deployment guide
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Pre-launch checklist

## � Production Features

### Implemented ✅
- [x] Protected Routes (AuthGuard)
- [x] Error Boundaries (React error handling)
- [x] CSV Export (processes, insights, statistics)
- [x] Structured Logging (Winston with rotation)
- [x] Docker Deployment (multi-stage builds)
- [x] CI/CD Pipeline (GitHub Actions)
- [x] API Rate Limiting (100/15min general, 5/15min auth)

### Planned 📋
- [ ] JWT Refresh Token Rotation
- [ ] User Profile Management
- [ ] Historical Data Analytics
- [ ] Email Notifications
- [ ] Role-Based Access Control
- [ ] Unit & E2E Testing
- [ ] APM Integration (Sentry/Datadog)

**Production Readiness**: 72.5/100 - ✅ Ready for Beta/Staging

## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# View backend logs
docker exec -it process-intelligence-backend cat /app/logs/combined.log

# Health check
curl http://localhost:5000/api/health
```

## 🔮 Future Enhancements

- [ ] Machine learning for predictive bottlenecks
- [ ] Mobile-responsive design improvements
- [ ] PDF report generation
- [ ] Alert notifications system (Email/SMS)
- [ ] Multi-warehouse support
- [ ] Shift performance comparison
- [ ] Advanced analytics dashboard

## 📝 License

MIT License - feel free to use this project for learning or portfolio purposes.

---

⭐ If you find this project useful, please consider giving it a star!
