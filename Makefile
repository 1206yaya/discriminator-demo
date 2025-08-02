PRETTIER_VERSION=@3.5.3

# Development commands
dev-backend: ## Start Go backend server
	@pkill -f "go run main.go" 2>/dev/null || true
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@sleep 1
	cd app && go run main.go

dev-frontend: ## Start frontend development server
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	@sleep 1
	cd front && npm run dev

dev: stop-dev ## Start both backend and frontend (in parallel)
	@sleep 2
	make -j2 dev-backend dev-frontend

# Build commands
build-backend: ## Build Go backend
	cd app && go build -o bin/server main.go

build-frontend: ## Build frontend for production
	cd front && npm run build

build: build-backend build-frontend ## Build both backend and frontend
	@echo ""
	@echo "🎉 Build completed successfully!"
	@echo ""
	@echo "📁 Build artifacts:"
	@echo "   Backend: app/bin/server"
	@echo "   Frontend: front/dist/"
	@echo ""
	@echo "🚀 To run the built application:"
	@echo "   make run-prod"
	@echo ""
	@echo "📊 To check build info:"
	@echo "   make build-info"

# Production run commands
run-prod: stop-all ## Run production build (backend + serve frontend)
	@echo "🚀 Starting production server..."
	@echo "Backend API: http://localhost:3000"
	@echo "Frontend: http://localhost:3001"
	@echo ""
	@sleep 2
	make -j2 run-prod-backend run-prod-frontend

run-prod-backend: ## Run production backend server
	@pkill -f "./bin/server" 2>/dev/null || true
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@sleep 1
	cd app && ./bin/server

run-prod-frontend: ## Serve production frontend
	@pkill -f "http-server" 2>/dev/null || true
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	@sleep 1
	cd front && npx http-server dist -p 3001 -c-1

# Build info
build-info: ## Show information about built artifacts
	@echo "📊 Build Information:"
	@echo ""
	@echo "Backend (app/bin/server):"
	@ls -lh app/bin/server 2>/dev/null || echo "  ❌ Not found - run 'make build-backend'"
	@echo ""
	@echo "Frontend (front/dist/):"
	@ls -lh front/dist/ 2>/dev/null || echo "  ❌ Not found - run 'make build-frontend'"
	@echo ""
	@echo "🌐 URLs when running:"
	@echo "  Development:"
	@echo "    Backend API: http://localhost:3000"
	@echo "    Frontend: http://localhost:3001"
	@echo "  Production:"
	@echo "    Backend API: http://localhost:3000"
	@echo "    Frontend: http://localhost:3001"

# Setup commands
setup: ## Install dependencies for both backend and frontend
	cd app && go mod tidy
	cd front && npm install

# Code generation
gen gen-cli: ## Generate files from schema
	cd schema && docker run --rm -v "${PWD}/schema/..:/local" openapitools/openapi-generator-cli:v5.4.0 generate -g typescript-axios -i /local/schema/openapi.yaml -o /local/front/src/adapters/gen --global-property skipFormModel=false && \
	cd ../app && \
	oapi-codegen --config ../schema/oapi-codegen/api.yml ../schema/openapi.yaml && \
	oapi-codegen --config ../schema/oapi-codegen/embeded-spec.yml ../schema/openapi.yaml && \
	cd ../front && \
	yarn format:gen

# Documentation
doc: ## Generate OpenAPI Document(HTML)
	cd schema && rm -rf ./documentation.html && \
	docker run --env REDOCLY_TELEMETRY=off --rm -v ${PWD}/schema:/spec redocly/cli build-docs openapi.yaml -o documentation.html

# Linting and formatting
lint: lint-cli lint-format ## Run all linting

lint-cli: ## Lint OpenAPI schema with redocly
	cd schema && docker run --env REDOCLY_TELEMETRY=off --rm -v ${PWD}:/spec redocly/cli lint --max-problems 65536 ./openapi.yaml

lint-format: ## Check OpenAPI schema formatting
	cd schema && npx prettier${PRETTIER_VERSION} --check openapi.yaml

format: ## Format OpenAPI schema
	cd schema && npx prettier${PRETTIER_VERSION} --write openapi.yaml

# Testing
test-api: ## Test API endpoints
	@echo "Testing Hello World endpoint..."
	curl -s http://localhost:3000/api/examples/hello | jq .
	@echo "\nTesting Users endpoint..."
	curl -s http://localhost:3000/api/users | jq .

# Process management
stop-dev: ## Stop development servers
	@echo "🛑 Stopping development servers..."
	@pkill -f "go run main.go" 2>/dev/null || true
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	@echo "✅ Development servers stopped"

stop-prod: ## Stop production servers
	@echo "🛑 Stopping production servers..."
	@pkill -f "./bin/server" 2>/dev/null || true
	@pkill -f "http-server" 2>/dev/null || true
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	@echo "✅ Production servers stopped"

stop-all: stop-dev stop-prod ## Stop all servers
	@echo "🛑 All servers stopped"

# Cleanup
clean: ## Clean build artifacts
	cd app && rm -rf bin/
	cd front && rm -rf dist/
	cd front && rm -rf src/adapters/gen/

# Help
help: ## Show help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

.PHONY: dev-backend dev-frontend dev build-backend build-frontend build run-prod run-prod-backend run-prod-frontend build-info setup gen gen-cli doc lint lint-cli lint-format format test-api clean stop-dev stop-prod stop-all help
