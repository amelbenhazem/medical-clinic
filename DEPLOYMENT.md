# Déploiement

Guide Docker, GitHub Actions et Kubernetes pour Medical Clinic.

## Local avec Docker

```bash
cp .env.example .env
# Remplir .env avec vos clés (jamais commitée)
docker compose up --build
```

L’application est servie par nginx sur [http://localhost](http://localhost).

## GitHub Actions

Le workflow `.github/workflows/deploy.yml` :

- **Pull request** : build l’image, sans push ni deploy
- **Push sur `main`** : push l’image vers GHCR puis déploie sur Kubernetes

Secrets GitHub à configurer (`Settings → Secrets and variables → Actions`) :

| Secret | Rôle |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (serveur uniquement) |
| `GOOGLE_GEMINI_API_KEY` | Clé Gemini (optionnel) |
| `KUBE_CONFIG` | kubeconfig encodé en base64 |

Le nom d’image GHCR est dérivé du dépôt : `ghcr.io/<owner>/<repo>`.

### kubeconfig

```bash
cat ~/.kube/config | base64 -w 0
```

Coller le résultat dans le secret `KUBE_CONFIG`.

## Kubernetes

Les manifests sont dans `k8s/`. Les valeurs de `k8s/secret.yaml` sont des **placeholders**. En production, créez le secret à partir des variables d’environnement (le workflow GitHub Actions le fait déjà).

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

Adaptez l’hôte dans `k8s/ingress.yaml` (`clinic.example.com`) à votre domaine.

```bash
kubectl get pods,svc,ingress -n nextjs-app
kubectl logs -f deployment/nextjs-app -n nextjs-app
```

## TLS (optionnel)

Décommenter les annotations cert-manager et le bloc `tls` dans `k8s/ingress.yaml`, puis installer [cert-manager](https://cert-manager.io/).
