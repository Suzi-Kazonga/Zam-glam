# 🚀 Zamglam - Getting Started Guide

Welcome to Zamglam! This guide will get you up and running in 5 minutes.

## ⚡ Quick Start (3 Commands)

### Option 1: All Services in One Go

```bash
# Terminal 1: Backend
cd backend && npm install && npm run seed && npm run dev

# Terminal 2: Frontend  
cd frontend && npm install && npm run dev

# Terminal 3: Courier Service (optional)
cd courier-service && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python app.py
```

### Option 2: Windows PowerShell

```powershell
# Terminal 1
cd backend; npm install; npm run seed; npm run dev

# Terminal 2
cd frontend; npm install; npm run dev

# Terminal 3 (Optional)
cd courier-service; python -m venv venv; .\venv\Scripts\activate; pip install -r requirements.txt; python app.py
```

---

## 🗂️ Project Folders

| Folder | Purpose | Command |
|--------|---------|---------|
| **frontend/** | React app (UI/UX) | `npm run dev` → http://localhost:3000 |
| **backend/** | Express API (server) | `npm run dev` → http://localhost:5000 |
| **courier-service/** | Flask microservice | `python app.py` → http://localhost:5001 |
| **database/** | MySQL schema | Run: `mysql -u root -p < database/schema.sql` |
| **docs/** | Documentation | See API.md for endpoints |

---

## 🗄️ Database Setup (Required First!)

### Windows
```bash
mysql -u root -p zamglam_db < database/schema.sql
```

### Mac/Linux
```bash
mysql -u root -p < database/schema.sql
```

**Or manually:**
1. Open MySQL Workbench
2. Run contents of `database/schema.sql`

---

## 🔑 Test Credentials

### Login as Seller
```
Email: pep@zamglam.local
Password: PEP123456
```

### Login as Customer
```
Email: customer@zamglam.local
Password: CUSTOMER123456
```

---

## 📍 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | User interface |
| Backend API | http://localhost:5000 | REST API |
| Courier | http://localhost:5001 | Delivery pricing |

---

## ✅ Verify Installation

### Backend
```bash
curl http://localhost:5000/health
# Expected: {"status":"ok"}
```

### Frontend
Open http://localhost:3000 in browser

### Courier
```bash
curl http://localhost:5001/health
# Expected: {"status":"ok","service":"Zamglam Courier Service"}
```

---

## 📚 Learn More

- **API Docs:** Read [docs/API.md](docs/API.md)
- **Setup Guide:** Read [SETUP.md](SETUP.md)
- **Quick Ref:** Read [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- **Features:** Read [COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md)

---

## 🐛 Troubleshooting

### "Port 5000 already in use"
```bash
# Change in backend/.env
PORT=5001
```

### "Cannot connect to database"
```bash
# Verify MySQL is running:
mysql -u root -p -e "SHOW DATABASES;"
```

### "npm: command not found"
- Install Node.js from https://nodejs.org/

### CORS errors?
- Restart both backend and frontend servers

---

## 🎯 What to Do Next

1. ✅ Get all services running (follow Quick Start above)
2. 📖 Read [SETUP.md](SETUP.md) for detailed installation
3. 🔌 Review [docs/API.md](docs/API.md) for API endpoints
4. 💻 Start building pages in `frontend/src/pages/`
5. 🎨 Customize styling in `frontend/src/styles/`

---

## 📂 Folder Organization

```
Zamglam-main/
├── frontend/              ← Start here for UI
│   ├── src/pages/         ← Add your pages
│   ├── src/components/    ← Reusable components
│   └── src/styles/        ← CSS & Tailwind
│
├── backend/               ← API & database
│   ├── src/routes/        ← API endpoints
│   ├── src/models/        ← Database queries
│   └── src/controllers/   ← Business logic
│
├── courier-service/       ← Delivery pricing
│   └── app.py
│
└── database/
    └── schema.sql         ← Tables & structure
```

---

## 🚀 Development Workflow

```bash
# 1. Start all services in separate terminals
npm run dev        # frontend
npm run dev        # backend
python app.py      # courier

# 2. Make changes to code
# 3. Files auto-reload (hot reload enabled)

# 4. Test with Postman or curl
curl -X GET http://localhost:5000/api/stores

# 5. Access UI at http://localhost:3000
```

---

## 📋 Commands Reference

### Backend
```bash
cd backend
npm install              # Install packages
npm run dev              # Start dev server
npm run seed             # Load sample data
npm start                # Production mode
```

### Frontend
```bash
cd frontend
npm install              # Install packages
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview build
```

### Courier
```bash
cd courier-service
pip install -r requirements.txt  # Install packages
python app.py                    # Run server
```

---

## 🎓 Architecture

```
Client (React)
     ↓
Frontend Server (Vite)
     ↓ HTTP
Backend API (Express) → MySQL Database
     ↓ RPC
Courier Service (Flask)
```

---

## 💡 Tips

- **Hot Reload:** Edit files and see changes instantly (no restart needed)
- **Console Logs:** Check terminal output for debug info
- **Network Requests:** Use browser DevTools → Network tab
- **API Testing:** Use Postman or VS Code REST Client

---

## ❓ Need Help?

1. Check console for error messages
2. Read [SETUP.md](SETUP.md) for detailed setup
3. See [docs/API.md](docs/API.md) for API info
4. Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for commands

---

**Happy coding! 🔥**

*Last Updated: January 2025 | Zamglam v1.0*
