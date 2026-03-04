# Docker Deployment

Deploy Roon Dashboard using Docker for maximum portability.

## Prerequisites

- Docker installed on your server
- Docker Compose installed
- Roon Core IP address (default: `100.90.5.35`)

## Quick Start

### 1. Copy project to your server
```bash
scp -r . user@your-server:/opt/roon-dashboard/
```

### 2. Configure environment (optional)

Edit `.env` file if needed:
```bash
ssh user@your-server
cd /opt/roon-dashboard
cp .env.example .env
nano .env  # Update ROON_CORE_IP if needed
```

### 3. Build and run with Docker Compose

```bash
# Build the Docker image
docker-compose build

# Start the container
docker-compose up -d

# Check logs
docker-compose logs -f roon-dashboard
```

### 4. Access the dashboard

Open your browser to:
```
http://your-server-ip/
```

### 5. Approve in Roon

1. Open **Roon**
2. **Settings → Extensions**
3. Find **"Roon Dashboard"**
4. Click **Approve**

---

## Configuration

### Change Roon Core IP

Edit `docker-compose.yml`:
```yaml
environment:
  - ROON_CORE_IP=192.168.1.100
  - ROON_CORE_PORT=9100
  - PORT=3001
```

Then restart:
```bash
docker-compose restart roon-dashboard
```

### Persistent Database

The database is automatically persisted in volumes:
```yaml
volumes:
  - ./roon-dashboard.sqlite:/app/roon-dashboard.sqlite
  - ./roon-dashboard.sqlite-shm:/app/roon-dashboard.sqlite-shm
  - ./roon-dashboard.sqlite-wal:/app/roon-dashboard.sqlite-wal
```

---

## Common Commands

```bash
# Start the services
docker-compose up -d

# Stop the services
docker-compose down

# View logs
docker-compose logs -f roon-dashboard
docker-compose logs -f nginx

# Restart the dashboard
docker-compose restart roon-dashboard

# Shell into the container
docker-compose exec roon-dashboard sh

# Reset database
docker-compose exec roon-dashboard rm -f roon-dashboard.sqlite*
docker-compose restart roon-dashboard
```

---

## Troubleshooting

### Dashboard shows "Disconnected"

Check the logs:
```bash
docker-compose logs roon-dashboard
```

Verify Roon Core IP is correct in `docker-compose.yml`.

### Nginx returns 502 Bad Gateway

```bash
# Check if backend is running
docker-compose ps

# Check backend logs
docker-compose logs roon-dashboard

# Restart all services
docker-compose restart
```

### Port already in use

If port 80 is already in use, change it in `docker-compose.yml`:
```yaml
nginx:
  ports:
    - "8080:80"  # Access at http://server-ip:8080
```

---

## Build Custom Image

For your own registry:

```bash
docker build -t your-registry/roon-dashboard:latest .
docker push your-registry/roon-dashboard:latest

# Then update docker-compose.yml to use your image
```

---

## Production Notes

- Database is persisted via volumes
- Health checks are enabled
- Services auto-restart on failure
- Logs available via `docker-compose logs`

For HTTPS in production, add a reverse proxy (nginx-proxy/letsencrypt-nginx-proxy-companion or similar).

---

**Deployment complete! 🎵**

