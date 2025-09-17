# 🚀 Deployment Guide

This guide covers various deployment options for the Brolostack Task Manager application.

## 📋 Table of Contents

- [Quick Deploy](#quick-deploy)
- [Vercel Deployment](#vercel-deployment)
- [Netlify Deployment](#netlify-deployment)
- [GitHub Pages](#github-pages)
- [Self-Hosted Deployment](#self-hosted-deployment)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [Performance Optimization](#performance-optimization)

## 🚀 Quick Deploy

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Git

### Build for Production
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Preview the build locally (optional)
npm run preview
```

## ▲ Vercel Deployment

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Beunec/brolostack_task_manager)

### Manual Deployment
1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configuration**
   - The `vercel.json` file is already configured
   - No additional setup required
   - Automatic deployments on git push

### Vercel Features
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero-config deployment
- ✅ Preview deployments for PRs
- ✅ Custom domains

## 🌐 Netlify Deployment

### Deploy from Git
1. Connect your GitHub repository to Netlify
2. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Deploy

### Manual Deploy
```bash
# Build the app
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Netlify Features
- ✅ Continuous deployment
- ✅ Form handling
- ✅ Serverless functions
- ✅ Custom headers and redirects

## 📄 GitHub Pages

### Automated Deployment
1. Enable GitHub Actions in your repository
2. The workflow file is already configured in `.github/workflows/deploy.yml`
3. Push to main branch to trigger deployment

### Manual Setup
```bash
# Build the app
npm run build

# Deploy to gh-pages branch
npm run deploy
```

## 🏠 Self-Hosted Deployment

### Using a Static Server
```bash
# Build the application
npm run build

# Serve using any static server
npx serve -s dist
# or
python3 -m http.server 3000 --directory dist
# or
nginx configuration pointing to dist folder
```

### Apache Configuration
Create `.htaccess` in your web root:
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QR,L]
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Commands
```bash
# Build image
docker build -t brolostack-task-manager .

# Run container
docker run -p 3000:80 brolostack-task-manager
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:80"
    restart: unless-stopped
```

## 🔧 Environment Variables

The application works entirely client-side with no environment variables required. However, you can customize:

```env
# Optional: App configuration
VITE_APP_NAME="Brolostack Task Manager"
VITE_APP_VERSION="1.0.0"
VITE_DEBUG=false

# Optional: Analytics
VITE_GOOGLE_ANALYTICS_ID="GA_TRACKING_ID"
```

## ⚡ Performance Optimization

### Build Optimization
The application is already optimized with:
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Asset optimization
- ✅ Gzip compression
- ✅ Modern JS bundles

### CDN Configuration
Configure your CDN to cache static assets:
- **JS/CSS files**: Cache for 1 year
- **Images**: Cache for 6 months
- **HTML**: Cache for 1 hour

### Performance Tips
1. **Enable compression** (gzip/brotli) on your server
2. **Set proper cache headers** for static assets
3. **Use a CDN** for global distribution
4. **Enable HTTP/2** for better performance
5. **Implement service worker** for offline functionality

## 🔍 Monitoring

### Performance Monitoring
- Use Lighthouse for performance audits
- Monitor Core Web Vitals
- Set up real user monitoring (RUM)

### Error Tracking
Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for usage analytics

## 🚨 Troubleshooting

### Common Issues

**Build Fails**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Routing Issues (404 on refresh)**
- Ensure your server is configured for SPA routing
- Check that `index.html` is served for all routes

**Assets Not Loading**
- Verify the `base` URL in `vite.config.ts`
- Check asset paths in deployment

## 📞 Support

For deployment issues:
1. Check the [GitHub Issues](https://github.com/Beunec/brolostack_task_manager/issues)
2. Review the [Brolostack Documentation](https://github.com/Beunec/brolostack)
3. Contact support at [support@beunec.co](mailto:support@beunec.co)

---

**Built with ❤️ using [Brolostack Framework](https://github.com/Beunec/brolostack)**
