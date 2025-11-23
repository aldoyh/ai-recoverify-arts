# Installation Guide

Detailed installation instructions for AI Recoverify Arts.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Installation](#local-installation)
- [Docker Installation](#docker-installation)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Python**: Version 3.8 or higher
  - Download from [python.org](https://www.python.org/downloads/)
  - Verify: `python --version`

- **Node.js**: Version 16 or higher
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify: `node --version`

- **npm**: Usually comes with Node.js
  - Verify: `npm --version`

### Optional Software

- **Docker**: For containerized deployment
- **Git**: For version control

## Local Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/ai-recoverify-arts.git
cd ai-recoverify-arts
```

### Step 2: Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file as needed.

6. **Run the backend:**
   ```bash
   python -m app.main
   ```

   Backend will be available at `http://localhost:5000`

### Step 3: Frontend Setup

1. **Open a new terminal and navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

   Frontend will open at `http://localhost:3000`

## Docker Installation

### Using Docker Compose (Recommended)

1. **Ensure Docker and Docker Compose are installed:**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Build and start services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

4. **Stop services:**
   ```bash
   docker-compose down
   ```

### Manual Docker Build

**Backend:**
```bash
cd backend
docker build -t ai-recoverify-backend .
docker run -p 5000:5000 ai-recoverify-backend
```

**Frontend:**
```bash
cd frontend
docker build -t ai-recoverify-frontend .
docker run -p 3000:3000 ai-recoverify-frontend
```

## Production Deployment

### Backend (Flask)

1. **Use Gunicorn for production:**
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app.main:app
   ```

2. **Configure nginx as reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Frontend (React)

1. **Build for production:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Serve with nginx:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /path/to/frontend/build;

       location / {
           try_files $uri /index.html;
       }
   }
   ```

### Environment Variables

**Production Backend (.env):**
```env
FLASK_ENV=production
FLASK_DEBUG=False
MAX_CONTENT_LENGTH=16777216
```

**Production Frontend (.env):**
```env
REACT_APP_API_URL=https://api.yourdomain.com
```

## Troubleshooting

### Common Issues

#### Backend won't start

**Issue:** `ModuleNotFoundError: No module named 'flask'`
- **Solution:** Ensure virtual environment is activated and dependencies are installed
  ```bash
  source venv/bin/activate  # or venv\Scripts\activate on Windows
  pip install -r requirements.txt
  ```

#### OpenCV errors

**Issue:** `ImportError: libGL.so.1: cannot open shared object file`
- **Solution (Ubuntu/Debian):**
  ```bash
  sudo apt-get update
  sudo apt-get install libgl1-mesa-glx
  ```

#### Frontend connection errors

**Issue:** `Network Error` or `CORS Error`
- **Solution:** Check that backend is running and REACT_APP_API_URL is correct
- Verify CORS is properly configured in backend

#### Port already in use

**Issue:** `Address already in use`
- **Solution:** Kill the process using the port or use a different port
  ```bash
  # Find process on port 5000
  lsof -ti:5000 | xargs kill -9  # macOS/Linux
  netstat -ano | findstr :5000   # Windows
  ```

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 2 GB free space

**Recommended:**
- CPU: 4+ cores
- RAM: 8+ GB
- Storage: 10+ GB free space
- GPU: Optional, but improves performance

### Getting Help

If you encounter issues:

1. Check the [troubleshooting section](../README.md#troubleshooting) in README
2. Search existing [GitHub issues](https://github.com/yourusername/ai-recoverify-arts/issues)
3. Open a new issue with:
   - Error messages
   - System information
   - Steps to reproduce

## Next Steps

After installation:

1. Read the [Usage Guide](USAGE.md)
2. Review [API Documentation](API.md)
3. Check out [Examples](EXAMPLES.md)
