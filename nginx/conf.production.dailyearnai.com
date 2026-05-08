# Production Nginx Configuration
# This configuration is for dailyearnai.com

upstream backend {
    server backend:3001 max_fails=3 fail_timeout=30s;
}

upstream frontend {
    server http://frontend:80 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name dailyearnai.com www.dailyearnai.com;
    
    # Let's Encrypt webroot challenge
    location ^~ /.well-known/acme-challenge/ {
        default_type text/plain;
        root /var/www/html;
    }
    
    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name dailyearnai.com www.dailyearnai.com;
    
    # SSL Configuration
    include /etc/nginx/snippets/ssl.conf;
    include /etc/nginx/snippets/letsencrypt.conf;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https://dailyearnai.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://dailyearnai.com https://*.sentry.io;" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # Hide nginx version
    server_tokens off;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=1000r/m;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
    
    # API routes
    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;
        
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
    
    # Admin routes (Bull Board) - Extra security
    location /admin/ {
        # IP restriction - configure your admin IPs
        # allow 1.2.3.4;
        # deny all;
        
        # Basic auth (optional, replace with proper auth)
        # auth_basic "Admin Area";
        # auth_basic_user_file /etc/nginx/.htpasswd;
        
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend (SPA) - Serve static files
    location / {
        # Security for static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://frontend;
            proxy_set_header Host $host;
        }
        
        # Main SPA route
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://backend/health;
        proxy_set_header Host $host;
    }
    
    # Robots.txt
    location = /robots.txt {
        add_header Content-Type text/plain;
        return 200 "User-agent: *\nDisallow: /admin/\n";
    }
    
    # Sitemap.xml
    location = /sitemap.xml {
        proxy_pass http://frontend/sitemap.xml;
        proxy_set_header Host $host;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # Brotli compression (if available)
    # brotli on;
    # brotli_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    # Logging with custom format
    log_format main '$remote_addr - $remote_user [$time_local] " $request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/production-access.log main;
    error_log /var/log/nginx/production-error.log warn;
    
    # Connection limits
    client_max_body_size 10M;
    client_body_timeout 30s;
    client_header_timeout 30s;
    keepalive_timeout 30s;
    keepalive_requests 100;
    reset_timedout_connection on;
    send_timeout 30s;
}
