#!/bin/bash

# Server Setup Script for Kubernetes (k3s)
# Run this script on your server (207.154.210.210)

set -e

echo "🚀 Starting Kubernetes (k3s) installation..."

# Update system
echo "📦 Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt-get install -y curl wget git

# Install k3s
echo "☸️  Installing k3s..."
curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644

# Wait for k3s to be ready
echo "⏳ Waiting for k3s to be ready..."
sleep 20

# Check k3s status
echo "✅ Checking k3s status..."
systemctl status k3s --no-pager

# Verify k3s is running
echo "🔍 Verifying k3s installation..."
k3s kubectl get nodes

# Install Nginx Ingress Controller
echo "🌐 Installing Nginx Ingress Controller..."
k3s kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.5/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress controller to be ready
echo "⏳ Waiting for Nginx Ingress Controller..."
sleep 30

# Check ingress controller status
k3s kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=240s || echo "Ingress controller may need more time..."

# Display kubeconfig
echo ""
echo "✅ k3s installation completed!"
echo ""
echo "📋 Your kubeconfig is located at: /etc/rancher/k3s/k3s.yaml"
echo ""
echo "🔑 To use kubectl from your local machine, copy the kubeconfig:"
echo "   cat /etc/rancher/k3s/k3s.yaml"
echo ""
echo "⚠️  Remember to replace '127.0.0.1' with '207.154.210.210' in the server URL"
echo ""

# Display kubeconfig for easy copying
echo "================================"
echo "KUBECONFIG CONTENT (copy this):"
echo "================================"
cat /etc/rancher/k3s/k3s.yaml
echo "================================"
