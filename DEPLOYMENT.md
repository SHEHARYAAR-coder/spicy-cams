# Deployment Guide - AWS EC2 with PM2

## Prerequisites

- AWS EC2 instance (Ubuntu recommended)
- Node.js 18+ installed
- PM2 installed globally: `npm install -g pm2`
- Nginx installed (for reverse proxy)

## Initial Setup on EC2

### 1. Clone Repository

```bash
cd /home/ubuntu
git clone <your-repo-url> spicy-cams
cd spicy-cams
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Environment Variables

Create a `.env` file:

```bash
nano .env
```

Add your environment variables:

```env
DATABASE_URL="your_database_url"
STRIPE_SECRET_KEY="your_stripe_secret"
STRIPE_PUBLISHABLE_KEY="your_stripe_public_key"
LIVEKIT_API_KEY="your_livekit_key"
LIVEKIT_API_SECRET="your_livekit_secret"
NEXT_PUBLIC_LIVEKIT_URL="your_livekit_url"
NEXTAUTH_SECRET="generate_a_secret_key"
NEXTAUTH_URL="https://spaicy.duckdns.org"
```

### 4. Generate Prisma Client and Build

```bash
npx prisma generate
npm run build
```

### 5. Create Required Directories

```bash
mkdir -p public/uploads/avatars
mkdir -p public/uploads/covers
mkdir -p public/uploads/profile-media/images
mkdir -p public/uploads/profile-media/videos
mkdir -p public/uploads/verification
mkdir -p logs
```

### 6. Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Follow the instructions from `pm2 startup` command to enable PM2 on system boot.

## Nginx Configuration

### Install Nginx (if not installed)

```bash
sudo apt update
sudo apt install nginx -y
```

### Configure Nginx

Create a new site configuration:

```bash
sudo nano /etc/nginx/sites-available/spicy-cams
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name spaicy.duckdns.org;

    # Increase max upload size for videos
    client_max_body_size 50M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Serve static uploaded files directly from Nginx (IMPORTANT!)
    location /uploads/ {
        alias /home/ubuntu/spicy-cams/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Next.js image optimization
    location /_next/image {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # All other requests go to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/spicy-cams /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Setup SSL with Certbot (Optional but Recommended)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d spaicy.duckdns.org
```

## Deployment Commands

### Deploy Updates

```bash
cd /home/ubuntu/spicy-cams

# Pull latest changes
git pull

# Install any new dependencies
npm install

# Regenerate Prisma client
npx prisma generate

# Run database migrations if any
npx prisma migrate deploy

# Rebuild the application
npm run build

# Restart PM2
pm2 restart spicy-cams
```

### Quick Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
cd /home/ubuntu/spicy-cams
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart spicy-cams
echo "Deployment complete!"
```

Make it executable:

```bash
chmod +x deploy.sh
```

## PM2 Management

### View Logs

```bash
# View all logs
pm2 logs spicy-cams

# View error logs only
pm2 logs spicy-cams --err

# View last 100 lines
pm2 logs spicy-cams --lines 100
```

### Monitor Application

```bash
pm2 monit
```

### Check Status

```bash
pm2 status
pm2 info spicy-cams
```

### Restart/Stop

```bash
pm2 restart spicy-cams
pm2 stop spicy-cams
pm2 delete spicy-cams
```

## Troubleshooting

### Images Not Showing

1. **Check if files are being uploaded:**

```bash
ls -la /home/ubuntu/spicy-cams/public/uploads/profile-media/images/
```

2. **Check file permissions:**

```bash
# Fix permissions if needed
chmod -R 755 /home/ubuntu/spicy-cams/public/uploads
```

3. **Check Nginx is serving static files:**

```bash
curl -I https://spaicy.duckdns.org/uploads/profile-media/images/test.jpg
```

4. **Check Nginx logs:**

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

5. **Check Next.js logs:**

```bash
pm2 logs spicy-cams --lines 100
```

### Next.js Image Optimization Issues

If images show 404 but files exist, the issue is likely with Next.js image optimization. The URL pattern `/_next/image?url=/uploads/...` means Next.js is trying to optimize the image.

**Solution 1**: Nginx serves `/uploads/` directly (already configured above)

**Solution 2**: Use unoptimized images in your code:

```tsx
<Image src={url} alt="..." unoptimized />
```

### PM2 Not Starting

```bash
# Check Node.js version
node --version  # Should be 18+

# Check if port 3000 is available
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>

# Start PM2 with verbose logging
pm2 start ecosystem.config.js --log-date-format="YYYY-MM-DD HH:mm:ss"
```

### Database Connection Issues

```bash
# Test database connection
npx prisma db push
npx prisma studio  # Opens Prisma Studio on port 5555
```

## Important Notes

1. **File Uploads**: Files are stored in `/home/ubuntu/spicy-cams/public/uploads/`
2. **Backups**: Regularly backup your uploads directory and database
3. **Nginx**: Serves static files directly for better performance
4. **PM2**: Automatically restarts the app if it crashes
5. **Logs**: Check both PM2 logs and Nginx logs for issues
6. **Permissions**: Ensure the uploads directory has correct permissions (755)

## Security Recommendations

1. **Firewall**: Only allow ports 80, 443, and 22 (SSH)

```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

2. **Keep packages updated:**

```bash
sudo apt update && sudo apt upgrade -y
```

3. **Use SSL**: Always use HTTPS with Let's Encrypt (free)

4. **Environment variables**: Never commit `.env` file to git

5. **Database**: Use connection pooling and secure credentials
