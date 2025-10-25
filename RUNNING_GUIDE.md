# Running the Process Intelligence Hub

## Quick Start

You have two parts to run:

### 1. Frontend (Next.js Dashboard)
```powershell
npm run dev
```
- Runs on: http://localhost:3000 (or 3001/3002 if port is in use)
- This is your main dashboard UI

### 2. Backend (Express API Server)
```powershell
cd backend
npm run dev
```
- Runs on: http://localhost:5000
- This is your API server

## Running Both Simultaneously

**Option 1: Two Terminal Windows**

Terminal 1 (Frontend):
```powershell
npm run dev
```

Terminal 2 (Backend):
```powershell
cd backend
npm run dev
```

**Option 2: Using VS Code Split Terminal**
1. Open terminal in VS Code
2. Click the split terminal icon
3. Run frontend in one, backend in the other

## Verifying Everything Works

### Frontend Check:
- Open: http://localhost:3000
- You should see the Process Intelligence Hub homepage

### Backend Check:
- Open: http://localhost:5000/api/health
- You should see: `{"status":"OK","timestamp":"...","uptime":...}`

## Stopping the Servers

- Press `Ctrl+C` in each terminal window

## Available API Endpoints

Once backend is running:
- `GET /` - API info
- `GET /api/health` - Health check
- `GET /api/processes` - Process data (to be implemented)
- `GET /api/bottlenecks` - Bottleneck analysis (to be implemented)

## Project Structure

```
aiprocessbottleneckdetector1/
├── src/                    # Frontend (Next.js)
│   ├── app/
│   ├── components/
│   └── data/
├── backend/                # Backend (Express)
│   ├── server.js
│   ├── package.json
│   └── .env
├── package.json           # Frontend dependencies
└── README.md             # Main project README
```

## Next Steps

The backend is ready to be extended with:
- Database connection
- Process data API endpoints
- Bottleneck analysis algorithms
- Real-time data streaming
- Authentication

See `backend/README.md` for more details.
