# Process Intelligence Hub - Backend API

Express.js backend server for the Process Intelligence Hub dashboard with Supabase integration.

## Setup

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure Supabase credentials:

Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Then edit `.env` and add your Supabase credentials:
```
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Where to find your Supabase credentials:**
- Go to https://supabase.com/dashboard
- Select your project
- Go to Settings > API
- Copy the "Project URL" and "anon/public" key

4. Start the server:

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## API Endpoints

### Health Check
- **GET** `/api/health` - Server health status (includes Supabase connection status)
- **GET** `/api/supabase/test` - Test Supabase connection

### Process Data
- **GET** `/api/processes` - Get warehouse process data (to be implemented)

### Bottleneck Analysis
- **GET** `/api/bottlenecks` - Get bottleneck analysis (to be implemented)

## Configuration

The server runs on port `5000` by default. You can change this in the `.env` file:

```
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

## CORS

CORS is enabled by default to allow the frontend (running on port 3000/3001/3002) to communicate with the backend.

## Supabase Integration

The backend uses Supabase as the database. The `supabaseClient.js` module provides:
- Initialized Supabase client
- Connection testing functionality
- Auto-refresh token management

Example usage in routes:
```javascript
const { supabase } = require('./supabaseClient');

app.get('/api/data', async (req, res) => {
  const { data, error } = await supabase
    .from('your_table')
    .select('*');
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});
```

## Project Structure

```
backend/
├── server.js          # Main Express server
├── supabaseClient.js  # Supabase client configuration
├── package.json       # Dependencies and scripts
├── .env              # Environment variables (not in git)
├── .env.example      # Example environment variables
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## Running Both Frontend and Backend

**Terminal 1 (Frontend):**
```bash
npm run dev
```

**Terminal 2 (Backend):**
```bash
cd backend
npm run dev
```

The frontend will run on `http://localhost:3000` (or 3001/3002) and the backend on `http://localhost:5000`.
