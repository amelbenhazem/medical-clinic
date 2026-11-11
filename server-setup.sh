#!/bin/bash
# Bootstrap k3s and the nginx ingress controller on a Linux server.
set -euo pipefail

apt-get update -y
apt-get install -y curl wget git

curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644
sleep 20
systemctl status k3s --no-pager
k3s kubectl get nodes

k3s kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.5/deploy/static/provider/cloud/deploy.yaml
k3s kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=240s || echo "Ingress controller may still be starting."

echo "kubeconfig: /etc/rancher/k3s/k3s.yaml"
echo "Replace 127.0.0.1 with your server IP before using it from another machine."
