# Quick Start Guide

## 1. Local Development

```bash
# Copy environment variables
cp .env.example .env
# Edit .env with your actual values

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

Access at: `http://localhost`

## 2. Deploy to Kubernetes

### First Time Setup

```bash
# 1. Update k8s/deployment.yaml with your Docker username
# 2. Create secrets on your cluster
kubectl create namespace nextjs-app
kubectl create secret generic nextjs-secrets \
  --from-literal=NEXT_PUBLIC_SUPABASE_URL=your-url \
  --from-literal=NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -n nextjs-app

# 3. Deploy
./deploy.sh
```

### Configure GitHub Actions

Add these secrets in GitHub Settings → Secrets:
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `KUBE_CONFIG` (base64 encoded)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Then push to main branch:
```bash
git push origin main
```

## 3. Access Your Application

- Local: `http://localhost`
- Production: `http://207.154.210.210.nip.io`

## Common Commands

```bash
# View pods
kubectl get pods -n nextjs-app

# View logs
kubectl logs -f deployment/nextjs-app -n nextjs-app

# Scale deployment
kubectl scale deployment nextjs-app --replicas=3 -n nextjs-app

# Update deployment
kubectl set image deployment/nextjs-app nextjs=user/nextjs-app:new-tag -n nextjs-app

# Restart deployment
kubectl rollout restart deployment/nextjs-app -n nextjs-app
```

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
