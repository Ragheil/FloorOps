# FloorOps Map

FloorOps Map is a full-stack station and bay assignment board for office and call center floor operations. It gives supervisors a polished visual map of bays and seats, quick assignment editing, searchable station records, and CSV export for reporting.

## Tech Stack

- Frontend: React, Vite, React Router, Axios, Tailwind CSS, Lucide React
- Backend: Node.js, Express, Supabase JS client, dotenv, cors, morgan
- Database: Supabase PostgreSQL

## Project Structure

```text
floorops-map/
  backend/
  frontend/
  database/
  README.md
```

## Supabase Setup

1. Create a new Supabase project.
2. Open the SQL editor in Supabase.
3. Run [`database/schema.sql`](./database/schema.sql).
4. Run [`database/seed.sql`](./database/seed.sql) to load sample bays and stations.
5. Copy your project URL and service role key from Supabase project settings.

Important:

- Use the service role key in the backend only.
- Do not expose the service role key in the frontend.

## Environment Variables

### Backend

Copy [`backend/.env.example`](./backend/.env.example) to `backend/.env` and fill in:

```env
PORT=4000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Frontend

Copy [`frontend/.env.example`](./frontend/.env.example) to `frontend/.env` and fill in:

```env
VITE_API_URL=http://localhost:4000/api
```

## Install Dependencies

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Run the Backend

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:4000/api`.

## Run the Frontend

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal, typically `http://localhost:5173`.

## API Overview

### Bay Routes

- `GET /api/bays`
- `POST /api/bays`
- `PUT /api/bays/:id`
- `DELETE /api/bays/:id`

### Station Routes

- `GET /api/stations`
- `GET /api/stations/:id`
- `POST /api/stations`
- `PUT /api/stations/:id`
- `DELETE /api/stations/:id`

### Dashboard Route

- `GET /api/dashboard/summary`

### Export Route

- `GET /api/export/stations`

## MVP Features

- Visual dashboard grouped by bay
- Image-inspired 65-PC floor plan page
- Bay CRUD management
- Station CRUD and assignment editing
- Status badges for Active, Vacant, Issue, and Reserved
- Search and filters by bay, status, agent, PC, IP, and seat label
- CSV export of the current seating list
- Loading states, empty states, friendly error handling, and delete confirmation dialogs

## Sample Data

The seed script includes:

- 8 bays
- 65 stations from `PC-01` through `PC-65`
- A floor arrangement aligned to the image-style floor plan view
- Mixed statuses across Active, Vacant, Issue, and Reserved
- Blank agent fields by default so assignments remain optional
- Example notes such as headset issues, PC checks, and trainee reservations

## Notes for Development

- The frontend talks only to the Express API.
- Supabase service role access is isolated to the backend.
- CSV export is generated in the frontend from backend JSON export data.
- Bay deletion is blocked when stations still exist inside the bay.

## Future Improvements

- Authentication
- Role-based access
- Real-time updates
- Floorplan image upload
- PC health check integration
- Veyon integration
- Audit logs
- PDF export
