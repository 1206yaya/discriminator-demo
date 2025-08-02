PRETTIER_VERSION=@3.5.3

gen gen-cli: ## Generate files from schema
	docker run --rm -v "${PWD}/..:/local" openapitools/openapi-generator-cli:v5.4.0 generate -g typescript-axios -i /local/schema/openapi.yaml -o /local/front/src/adapters/gen --global-property skipFormModel=false && \
	cd ../app && \
	oapi-codegen --config ../schema/oapi-codegen/api.yml ../schema/openapi.yaml && \
	oapi-codegen --config ../schema/oapi-codegen/embeded-spec.yml ../schema/openapi.yaml && \
	cd ../front && \
	yarn format:gen

doc: ## Generate OpenAPI Document(HTML)
	rm -rf ./documentation.html && \
	docker run --env REDOCLY_TELEMETRY=off --rm -v ${PWD}:/spec redocly/cli build-docs openapi.yaml -o documentation.html

help: ## Show help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

lint: lint-cli lint-path lint-format

lint-cli:
	docker run --env REDOCLY_TELEMETRY=off --rm -v ${PWD}:/spec redocly/cli lint --max-problems 65536 ./openapi.yaml

# クォーテーションで囲んでいるPathを検知した時のseverity
QUOTED_PATH_SEVERITY ?= warn
lint-path:
	node no-quoted-paths.js openapi.yaml --severity "$(QUOTED_PATH_SEVERITY)"

lint-format:
	npx prettier${PRETTIER_VERSION} --check openapi.yaml

format:
	npx prettier${PRETTIER_VERSION} --write openapi.yaml
