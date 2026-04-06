# MediBot (Medical Chatbot)

This repository contains a full-stack medical AI assistant:
- **Backend**: FastAPI + Uvicorn + MongoDB + LangChain + transformers
- **Frontend**: React (Create React App)
- **Uploads**: OCR + report / prescription analyzer

---
## 🔍 Important network config details
- Frontend default host: `http://localhost:3000` (from Create React App)
- Backend default host: `http://localhost:8000` (FastAPI)
- CORS and OAuth use `FRONTEND_URL` from `.env`
- Your repository currently has:
  - `FRONTEND_URL=http://10.0.4.128:3001` in `backend/.env` and `.env.example`
  - Allow origins in `backend/app/main.py`: `http://10.0.4.128:3000`, `http://10.0.4.128:3001`

> Note: There is no direct hardcoded literal `localhost:3001` in source code; the running configuration uses 10.0.4.128:3001.

---
## ✅ Prerequisites
- Node.js 18+ (recommended) and npm
- Python 3.11
- MongoDB instance reachable at `MONGODB_URI` (default `mongodb://localhost:27017` from `.env.example`)
- Optional: ngrok for publicly exposing backend
- GPU optional for transformers, else CPU mode

---
## 🛠️ Backend setup (`backend/`)

1. `cd backend`
2. Create Python venv (optional but recommended):
   - `python3 -m venv .venv`
   - `source .venv/bin/activate`
3. Install dependencies:
   - `pip install -r requirements.txt`
4. Create environment file from example:
   - `cp .env.example .env`
5. Update `.env` values:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `SECRET_KEY` (random)
   - `FRONTEND_URL` (set to your frontend origin, e.g. `http://localhost:3000` or `http://10.0.4.128:3001`)
   - `MONGODB_URI` (if different from default)
6. Start backend server:
   - `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
7. Verify API: `GET http://localhost:8000/docs` (Swagger UI)

---
## 🖥️ Frontend setup (`frontend/`)

1. `cd frontend`
2. Install dependencies:
   - `npm install`
3. Start frontend:
   - `npm start`
4. Open: `http://localhost:3000`

> REST API proxy is configured in `frontend/package.json` as `"proxy": "http://localhost:8000"`.

---
## 🔁 Full local flow
1. Backend started on 8000
2. Frontend started on 3000
3. Browser requests from React (`3000`) are proxied to backend (`8000`)
4. Backend accepts CORS from frontend origins configured in `backend/app/main.py`

---
## 🛂 Authentication + API tokens
- Google OAuth is configured in backend `app/main.py` with `oauth.register(...)`
- API key endpoints and user state are in `app/repositories/medibot.py`, `app/services/chat.py`, `app/dependencies/auth.py`
- `app/api` includes route definitions under `APIRouter(prefix="/api")`

---
## 🧰 Deploy / prod notes
- In production, set `PRODUCTION_API_BASE` at environment level if needed.
- Check CORS origins in backend if your frontend URL changes.
- If using `10.0.4.128`, make sure your host network and firewall permit access.

---
## 📝 Notes
- The naming in this repo has `REAMDE.md`; this file (`READ.md`) is added for the requested update. You can optionally rename or copy to `README.md` for GitHub standard.
- If you want explicit `localhost:3001`, set `FRONTEND_URL=http://localhost:3001` in `.env` and update `allow_origins` in `app/main.py`.
