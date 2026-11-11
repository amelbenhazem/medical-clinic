#!/bin/bash
# Deploy Kubernetes manifests. Create real secrets separately — k8s/secret.yaml is a placeholder.
set -euo pipefail

NAMESPACE="nextjs-app"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl not found. Install kubectl first."
  exit 1
fi

if ! kubectl cluster-info >/dev/null 2>&1; then
  echo "Cannot reach the Kubernetes cluster. Check kubeconfig."
  exit 1
fi

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

kubectl rollout status deployment/nextjs-app -n "$NAMESPACE" --timeout=5m
kubectl get pods,svc,ingress -n "$NAMESPACE"
