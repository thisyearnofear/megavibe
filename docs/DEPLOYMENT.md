# MegaVibe Production Deployment Guide 🚀

## Overview

MegaVibe uses a modern deployment architecture:

- **Frontend**: Deployed on Vercel (megavibe.vercel.app)
- **Backend**: Deployed on Render (megavibe.onrender.com)
- **Database**: MongoDB Atlas (managed)
- **CI/CD**: GitHub Actions

## Project Structure

```
megavibe/
├── frontend/          # React + Vite frontend
├── backend/           # Node.js + Express backend
├── docs/             # Documentation
├── .github/          # GitHub Actions workflows
├── render.yaml       # Render deployment config
└── package.json      # Root convenience scripts only
```

## Quick Deployment Steps

### 1. Backend Deployment on Render

1. **Connect Repository**:

   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `megavibe` repository

2. **Configure Service**:

   - **Name**: `megavibe-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Starter (free tier)

3. **Set Environment Variables**:

   ```
   NODE_ENV=production
   PORT=10000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_generated_jwt_secret
   CORS_ORIGIN=https://megavibe.vercel.app
   PINATA_API_KEY=your_pinata_api_key
   PINATA_API_SECRET=your_pinata_secret
   PINATA_JWT_TOKEN=your_pinata_jwt_token
   ```

4. **Deploy**: Click "Create Web Service"

### 2. Frontend Deployment on Vercel

1. **Connect Repository**:

   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `frontend` folder as root directory

2. **Configure Build Settings**:

   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Set Environment Variables**:

   ```
   VITE_API_URL=https://megavibe-backend.onrender.com
   VITE_WS_URL=https://megavibe-backend.onrender.com
   VITE_ENVIRONMENT=production
   VITE_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id
   VITE_MANTLE_RPC_URL=https://rpc.mantle.xyz
   VITE_MANTLE_CHAIN_ID=5000
   ```

4. **Deploy**: Click "Deploy"

### 3. Database Setup (MongoDB Atlas)

1. **Create Cluster**:

   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a new cluster (free tier available)
   - Choose your preferred region

2. **Configure Access**:

   - Add your IP address to whitelist (or 0.0.0.0/0 for all IPs)
   - Create a database user with read/write permissions

3. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

## CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **On Pull Request**:

   - Runs tests for both frontend and backend
   - Builds frontend to check for errors
   - Lints code for quality

2. **On Push to Main**:
   - Runs all tests
   - Deploys backend to Render
   - Deploys frontend to Vercel

### Required GitHub Secrets

Add these secrets in your GitHub repository settings:

```
RENDER_SERVICE_ID=your_render_service_id
RENDER_API_KEY=your_render_api_key
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

## Environment Variables Reference

### Backend (.env.production)

```bash
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/megavibe
JWT_SECRET=your_super_secret_jwt_key
CORS_ORIGIN=https://megavibe.vercel.app
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_secret
PINATA_JWT_TOKEN=your_pinata_jwt_token
LOG_LEVEL=info
```

### Frontend (.env.production)

```bash
VITE_API_URL=https://megavibe-backend.onrender.com
VITE_WS_URL=https://megavibe-backend.onrender.com
VITE_ENVIRONMENT=production
VITE_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id
VITE_MANTLE_RPC_URL=https://rpc.mantle.xyz
VITE_MANTLE_CHAIN_ID=5000
```

## Monitoring & Maintenance

### Health Checks

- **Backend**: `https://megavibe-backend.onrender.com/api/health`
- **Frontend**: `https://megavibe.vercel.app`

### Logs

- **Render**: View logs in Render dashboard
- **Vercel**: View function logs in Vercel dashboard

### Database Monitoring

- **MongoDB Atlas**: Monitor performance and usage in Atlas dashboard

## Troubleshooting

### Common Issues

1. **CORS Errors**:

   - Ensure CORS_ORIGIN is set correctly in backend
   - Check that frontend URL matches exactly

2. **Database Connection**:

   - Verify MongoDB connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has correct permissions

3. **Environment Variables**:

   - Double-check all environment variables are set
   - Ensure no trailing spaces or special characters

4. **Build Failures**:
   - Check build logs in respective platforms
   - Ensure all dependencies are listed in package.json

### Support

- **Render**: [Render Documentation](https://render.com/docs)
- **Vercel**: [Vercel Documentation](https://vercel.com/docs)
- **MongoDB Atlas**: [Atlas Documentation](https://docs.atlas.mongodb.com)

---

**Last Updated**: December 14, 2024
**Status**: Ready for Production Deployment
