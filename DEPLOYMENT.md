# DevOps Pipeline - Deployment Guide

This guide explains how to deploy the Next.js application using Docker, GitHub Actions, and Kubernetes to your server at 207.154.210.210.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development with Docker](#local-development-with-docker)
3. [Setting up GitHub Actions](#setting-up-github-actions)
4. [Kubernetes Cluster Setup](#kubernetes-cluster-setup)
5. [Deploying to Kubernetes](#deploying-to-kubernetes)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

### On Your Local Machine
- Docker and Docker Compose installed
- kubectl CLI installed
- Git configured
- Access to your GitHub repository
- Docker Hub account (or other container registry)

### On Your Server (207.154.210.210)
- Kubernetes cluster installed (k3s, microk8s, or kubeadm)
- kubectl configured
- Nginx Ingress Controller installed
- SSH access to the server

## Local Development with Docker

### 1. Build and run locally with Docker Compose

```bash
# Create a .env file with your environment variables
cp .env.example .env
# Edit .env with your actual values

# Build and start the containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

The application will be available at `http://localhost`

### 2. Build Docker image manually

```bash
# Build the image
docker build -t nextjs-app:local .

# Run the container
docker run -p 3000:3000 --env-file .env nextjs-app:local
```

## Setting up GitHub Actions

### 1. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password or access token
- `KUBE_CONFIG`: Base64 encoded kubeconfig file (see below)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### 2. Get kubeconfig for GitHub Actions

On your server:

```bash
# Get the kubeconfig and encode it
cat ~/.kube/config | base64 -w 0
# Copy the output and add it as KUBE_CONFIG secret in GitHub
```

### 3. Update deployment.yaml

Edit `k8s/deployment.yaml` and replace `YOUR_DOCKER_USERNAME` with your actual Docker Hub username:

```yaml
image: your-docker-username/nextjs-app:latest
```

### 4. Workflow Triggers

The GitHub Actions workflow will trigger on:
- Push to `main` branch (builds and deploys)
- Pull requests to `main` (builds only)
- Manual trigger via workflow_dispatch

## Kubernetes Cluster Setup

### 1. Install Kubernetes on your server

SSH into your server (207.154.210.210):

```bash
ssh root@207.154.210.210
```

#### Option A: Install k3s (Recommended for single server)

```bash
curl -sfL https://get.k3s.io | sh -

# Check status
sudo systemctl status k3s

# Get kubeconfig
sudo cat /etc/rancher/k3s/k3s.yaml

# Copy this config to your local machine's ~/.kube/config
# Replace 127.0.0.1 with 207.154.210.210 in the server URL
```

#### Option B: Install microk8s

```bash
sudo snap install microk8s --classic
sudo microk8s enable dns storage ingress
sudo microk8s kubectl get nodes
```

### 2. Install Nginx Ingress Controller

For k3s (already includes Traefik, but you can use Nginx):

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.5/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress controller to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

For microk8s:

```bash
microk8s enable ingress
```

### 3. Configure kubectl on your local machine

```bash
# Copy kubeconfig from server
scp root@207.154.210.210:/etc/rancher/k3s/k3s.yaml ~/.kube/config

# Edit the config and replace 127.0.0.1 with 207.154.210.210
sed -i 's/127.0.0.1/207.154.210.210/g' ~/.kube/config

# Test connection
kubectl get nodes
```

## Deploying to Kubernetes

### 1. Prepare secrets

Edit `k8s/secret.yaml` and add your actual Supabase credentials, or create secrets via kubectl:

```bash
kubectl create namespace nextjs-app

kubectl create secret generic nextjs-secrets \
  --from-literal=NEXT_PUBLIC_SUPABASE_URL=your-actual-url \
  --from-literal=NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-key \
  -n nextjs-app
```

### 2. Deploy manually (first time)

```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check deployment status
kubectl get all -n nextjs-app
kubectl get ingress -n nextjs-app
```

### 3. Verify deployment

```bash
# Check pods
kubectl get pods -n nextjs-app

# Check logs
kubectl logs -f deployment/nextjs-app -n nextjs-app

# Check service
kubectl get svc -n nextjs-app

# Check ingress
kubectl get ingress -n nextjs-app
```

Access your application at: `http://207.154.210.210.nip.io`

### 4. Deploy via GitHub Actions

After configuring secrets in GitHub:

```bash
# Push to main branch
git add .
git commit -m "Setup DevOps pipeline"
git push origin main

# Or trigger manually from GitHub Actions tab
```

## Monitoring and Maintenance

### Scaling

```bash
# Scale up/down
kubectl scale deployment nextjs-app --replicas=3 -n nextjs-app

# Auto-scaling (HPA)
kubectl autoscale deployment nextjs-app \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n nextjs-app
```

### Updates

```bash
# Rolling update
kubectl set image deployment/nextjs-app \
  nextjs=your-docker-username/nextjs-app:new-tag \
  -n nextjs-app

# Check rollout status
kubectl rollout status deployment/nextjs-app -n nextjs-app

# Rollback if needed
kubectl rollout undo deployment/nextjs-app -n nextjs-app
```

### Logs

```bash
# View logs
kubectl logs -f deployment/nextjs-app -n nextjs-app

# Logs from specific pod
kubectl logs -f <pod-name> -n nextjs-app

# Previous logs (if pod restarted)
kubectl logs --previous <pod-name> -n nextjs-app
```

### Debugging

```bash
# Describe pod
kubectl describe pod <pod-name> -n nextjs-app

# Execute commands in pod
kubectl exec -it <pod-name> -n nextjs-app -- /bin/sh

# Port forward for debugging
kubectl port-forward deployment/nextjs-app 3000:3000 -n nextjs-app
```

### Health Checks

```bash
# Check pod health
kubectl get pods -n nextjs-app

# Check events
kubectl get events -n nextjs-app --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n nextjs-app
kubectl top nodes
```

## SSL/TLS Setup (Optional)

### Install cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### Update Ingress for SSL

Edit `k8s/ingress.yaml` and uncomment the SSL/TLS sections, then:

```bash
kubectl apply -f k8s/ingress.yaml
```

## Troubleshooting

### Common Issues

1. **Pods not starting**
   ```bash
   kubectl describe pod <pod-name> -n nextjs-app
   kubectl logs <pod-name> -n nextjs-app
   ```

2. **Image pull errors**
   - Verify Docker Hub credentials
   - Check image name in deployment.yaml
   - Ensure image exists in registry

3. **Ingress not working**
   ```bash
   kubectl get ingress -n nextjs-app
   kubectl describe ingress nextjs-ingress -n nextjs-app
   ```

4. **Environment variables not set**
   ```bash
   kubectl get configmap nextjs-config -n nextjs-app -o yaml
   kubectl get secret nextjs-secrets -n nextjs-app -o yaml
   ```

## Architecture Overview

```
[GitHub] → [GitHub Actions] → [Docker Hub]
                                    ↓
                            [Kubernetes Cluster]
                                    ↓
                     [Nginx Ingress Controller]
                                    ↓
                          [Next.js Service]
                                    ↓
                    [Next.js Pods (2 replicas)]
```

## Files Structure

```
.
├── Dockerfile                    # Multi-stage Docker build
├── docker-compose.yml           # Local development with Docker
├── nginx.conf                   # Nginx reverse proxy config
├── .dockerignore               # Docker build exclusions
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
└── k8s/
    ├── namespace.yaml          # Kubernetes namespace
    ├── configmap.yaml          # Configuration data
    ├── secret.yaml             # Sensitive data
    ├── deployment.yaml         # Application deployment
    ├── service.yaml            # Service definition
    └── ingress.yaml            # Ingress rules
```

## Support

For issues or questions:
- Check Kubernetes logs: `kubectl logs -n nextjs-app`
- Review GitHub Actions logs in the Actions tab
- Verify all secrets are properly configured
