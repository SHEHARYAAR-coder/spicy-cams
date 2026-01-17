#!/bin/bash

echo "🚀 Deploying image fix to EC2..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Committing changes locally...${NC}"
git add .
git commit -m "Fix image display issues - use regular img tags instead of Next.js Image"
git push origin build

echo -e "${GREEN}✓ Changes pushed to GitHub${NC}"

echo ""
echo -e "${YELLOW}Now SSH into your EC2 server and run these commands:${NC}"
echo ""
echo "cd ~/spicy-cams"
echo "git pull origin build"
echo "npm install"
echo ""
echo -e "${YELLOW}Update nginx config:${NC}"
echo "sudo nano /etc/nginx/conf.d/spicycams.conf"
echo ""
echo -e "${YELLOW}Replace the /uploads/ location block with:${NC}"
echo ""
cat << 'NGINX'
    # Serve static uploaded files directly
    location /uploads/ {
        alias /home/ec2-user/spicy-cams/public/uploads/;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        
        # No caching during testing
        add_header Cache-Control "no-cache, must-revalidate" always;
        
        # Ensure proper MIME types
        types {
            image/jpeg jpg jpeg;
            image/png png;
            image/gif gif;
            image/webp webp;
            image/svg+xml svg;
            video/mp4 mp4;
            video/webm webm;
        }
        
        try_files $uri =404;
    }
NGINX
echo ""
echo -e "${YELLOW}Then run:${NC}"
echo "sudo nginx -t"
echo "sudo systemctl reload nginx"
echo ""
echo -e "${YELLOW}Fix file permissions:${NC}"
echo "sudo chmod -R 755 ~/spicy-cams/public/uploads"
echo "sudo find ~/spicy-cams/public/uploads -type f -exec chmod 644 {} \;"
echo ""
echo -e "${YELLOW}Restart app:${NC}"
echo "pm2 restart all"
echo ""
echo -e "${GREEN}✓ After running these commands, clear browser cache (Ctrl+Shift+R) and refresh!${NC}"
