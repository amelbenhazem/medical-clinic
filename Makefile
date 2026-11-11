.PHONY: help build run stop logs clean deploy k8s-deploy k8s-status k8s-logs

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker image
	docker-compose build

run: ## Run with Docker Compose
	docker-compose up -d

stop: ## Stop Docker Compose services
	docker-compose down

logs: ## View Docker Compose logs
	docker-compose logs -f

clean: ## Clean Docker resources
	docker-compose down -v
	docker system prune -f

deploy: ## Deploy to Kubernetes
	./deploy.sh

k8s-deploy: ## Deploy Kubernetes manifests (skips placeholder secrets)
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/configmap.yaml
	kubectl apply -f k8s/deployment.yaml
	kubectl apply -f k8s/service.yaml
	kubectl apply -f k8s/ingress.yaml

k8s-status: ## Check Kubernetes deployment status
	kubectl get all -n nextjs-app
	kubectl get ingress -n nextjs-app

k8s-logs: ## View Kubernetes logs
	kubectl logs -f deployment/nextjs-app -n nextjs-app

k8s-restart: ## Restart Kubernetes deployment
	kubectl rollout restart deployment/nextjs-app -n nextjs-app

k8s-delete: ## Delete Kubernetes deployment
	kubectl delete -f k8s/

scale-up: ## Scale to 3 replicas
	kubectl scale deployment nextjs-app --replicas=3 -n nextjs-app

scale-down: ## Scale to 1 replica
	kubectl scale deployment nextjs-app --replicas=1 -n nextjs-app
