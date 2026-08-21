# 🚀 Zamglam Development Quick Reference

## ⚡ Start All Services (Quick Commands)

### Open 3 Terminals and Run:

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Courier Service (Optional)**
```bash
cd courier-service
python app.py
```

**Access Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Courier Service: http://localhost:5001

---

## 📋 Common Commands

### Backend Commands
```bash
npm install              # Install dependencies
npm run dev              # Start dev server with hot reload
npm run start            # Start production server
npm run seed             # Seed database with sample data
npm test                 # Run tests (if configured)
```

### Frontend Commands
```bash
npm install              # Install dependencies
npm run dev              # Start dev server on port 3000
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint (if configured)
```

### Courier Service Commands
```bash
python -m venv venv      # Create virtual environment
source venv/bin/activate # Activate (Mac/Linux)
venv\Scripts\activate    # Activate (Windows)
pip install -r requirements.txt  # Install dependencies
python app.py            # Run Flask server
python -m pip install flask python-dotenv  # Add packages
```

### Database Commands
```bash
# Create database
mysql -u root -p < database/schema.sql

# Reset database (delete all data)
mysql -u root -p zamglam_db < database/schema.sql

# Backup database
mysqldump -u root -p zamglam_db > backup.sql

# Restore database
mysql -u root -p zamglam_db < backup.sql

# Connect to database
mysql -u root -p zamglam_db
```

---

## 🔑 Login Credentials for Testing

### Sellers
| Email | Password | Store |
|-------|----------|-------|
| pep@zamglam.local | PEP123456 | PEP Zambia |
| jet@zamglam.local | JET123456 | JET Stores |
| mud@zamglam.local | MUD123456 | MUD Zambia |

### Customer
| Email | Password |
|-------|----------|
| customer@zamglam.local | CUSTOMER123456 |

---

## 🧪 Test API Endpoints

### Health Check
```bash
curl http://localhost:5000/health
```

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@test.com",
    "password": "password123",
    "role": "customer"
  }'
```

### Login & Get Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pep@zamglam.local",
    "password": "PEP123456"
  }'
```

### Get All Stores
```bash
curl http://localhost:5000/api/stores
```

### Get Products with Filter
```bash
curl "http://localhost:5000/api/products?audience=women&category_id=2"
```

### Get Delivery Quote
```bash
curl -X POST http://localhost:5001/api/courier/quote \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_lat": -15.3875,
    "pickup_lon": 28.3228,
    "delivery_lat": -15.4167,
    "delivery_lon": 28.2833
  }'
```

---

## 🛠️ Troubleshooting

### Backend Won't Start

**Error: "Port 5000 already in use"**
```bash
# Find process on port 5000
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Change PORT in backend/.env
PORT=5001
```

**Error: "Database connection failed"**
```bash
# Check MySQL is running
sudo systemctl status mysql  # Linux
brew services list  # Mac
# Run database schema
mysql -u root -p < database/schema.sql
```

### Frontend Won't Start

**Error: "Port 3000 already in use"**
- Vite will auto-select next available port
- Or change in vite.config.js

**Error: "Cannot find module"**
```bash
npm install
npm run dev
```

### CORS Errors

**Browser shows: "Access to XMLHttpRequest blocked by CORS policy"**
- Check backend is running on http://localhost:5000
- Check vite.config.js proxy configuration
- Verify environment variables in .env files

---

## 📁 File Locations

### Configuration Files
- Backend: `backend/.env`
- Frontend: `.env` (in frontend root if needed)
- Courier: `courier-service/.env`

### Database
- Schema: `database/schema.sql`
- Seed: `backend/src/seed.js`

### Frontend Pages (To Implement)
- `frontend/src/pages/` - Add page components here
- Home, Login, Register, Store, Product, Cart, Dashboard

### Backend Routes (Already Set Up)
- `backend/src/routes/authRoutes.js`
- `backend/src/routes/storeRoutes.js`
- `backend/src/routes/productRoutes.js`

### Uploads
- File uploads go to: `backend/uploads/`

---

## ✅ Development Checklist

### Initial Setup
- [ ] Install Node.js, MySQL, Python
- [ ] Clone/download project
- [ ] Update backend/.env with MySQL password
- [ ] Run database schema
- [ ] Run `npm install` in backend and frontend
- [ ] Test all services start successfully

### Frontend Development
- [ ] Create LoginPage component
- [ ] Create RegisterPage component
- [ ] Create HomePage with store listings
- [ ] Create StorePage with product filtering
- [ ] Create ProductPage with details
- [ ] Create CartPage with checkout
- [ ] Create SellerDashboard
- [ ] Add form validation

### Backend Development
- [ ] Create additional models as needed
- [ ] Add order management endpoints
- [ ] Implement payment integration
- [ ] Add email notifications
- [ ] Create admin endpoints
- [ ] Add API rate limiting

### Testing
- [ ] Test all API endpoints with Postman/cURL
- [ ] Test authentication flow
- [ ] Test product filtering
- [ ] Test cart operations
- [ ] Test file uploads
- [ ] Test error handling

### Deployment
- [ ] Build frontend: `npm run build`
- [ ] Test production build locally
- [ ] Deploy backend to cloud
- [ ] Deploy frontend to CDN
- [ ] Set up environment variables on servers
- [ ] Test all APIs in production

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| README.md | Project overview & features |
| SETUP.md | Complete installation guide |
| docs/API.md | API endpoints documentation |
| COMPLETION_SUMMARY.md | What was created (this project) |
| QUICK_REFERENCE.md | This file |

---

## 🎯 Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make Changes**
   - Edit components or APIs
   - Test locally with `npm run dev`

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: describe your feature"
   git push origin feature/new-feature
   ```

4. **Create Pull Request**
   - Review changes
   - Merge to main

5. **Deploy**
   - Build: `npm run build`
   - Deploy to production

---

## 🔐 Environment Variables Reference

### Backend (.env)
```
DB_HOST=localhost           # MySQL host
DB_USER=root                # MySQL user
DB_PASSWORD=root123         # MySQL password
DB_NAME=zamglam_db          # Database name
JWT_SECRET=your_secret      # JWT signing key
PORT=5000                   # Server port
NODE_ENV=development        # Environment
```

### Frontend (.env.local - optional)
```
VITE_API_URL=http://localhost:5000  # Backend API URL
```

### Courier Service (.env)
```
FLASK_ENV=development  # Environment
PORT=5001             # Server port
DEBUG=True            # Debug mode
```

---

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module mysql2" | Run `npm install` in backend |
| "Database connection refused" | Start MySQL, check credentials |
| CORS errors | Verify port numbers, check proxy in vite.config.js |
| 404 on API endpoint | Check route spelling, verify endpoint exists |
| Token expiring too fast | Increase JWT expiration in authController.js |
| File upload fails | Check uploads/ directory exists, file size limits |
| Hot reload not working | Clear .vite cache, restart dev server |

---

## 📈 Performance Tips

1. **Frontend**
   - Use React.memo() for expensive components
   - Implement code splitting with React.lazy()
   - Optimize images (use WebP format)
   - Minimize bundle size

2. **Backend**
   - Use database connection pooling (already set up)
   - Add caching for frequently accessed data
   - Implement pagination for large queries
   - Use indexes on frequently searched columns

3. **Database**
   - Analyze slow queries with EXPLAIN
   - Add indexes to frequently filtered columns
   - Use LIMIT in SELECT queries
   - Archive old orders periodically

---

## 🔗 Useful Resources

- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [MySQL Docs](https://dev.mysql.com/doc/)
- [Vite Docs](https://vitejs.dev/)
- [TailwindCSS Docs](https://tailwindcss.com/)
- [JWT Info](https://jwt.io/)
- [REST API Best Practices](https://restfulapi.net/)

---

## 💬 Need Help?

1. Check SETUP.md for detailed setup instructions
2. Check docs/API.md for endpoint documentation
3. Check README.md for feature overview
4. Review error messages in terminal
5. Search the codebase for similar implementations

---

*Last Updated: January 2025*
*Zamglam v1.0 - Ready for Development* 🔥
