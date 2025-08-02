package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/1206yaya/openapi-golang-typescript/app/handlers/http/oapi"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

// Server implements the generated OpenAPI interface
type Server struct{}

// GetUsers implements the GetUsers operation
func (s *Server) GetUsers(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	users := []oapi.User{
		{
			Id:        1,
			Name:      "田中太郎",
			Email:     "tanaka@example.com",
			CreatedAt: &now,
			UpdatedAt: &now,
		},
		{
			Id:        2,
			Name:      "佐藤花子",
			Email:     "sato@example.com",
			CreatedAt: &now,
			UpdatedAt: &now,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// CreateUser implements the CreateUser operation
func (s *Server) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req oapi.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	now := time.Now()
	user := oapi.User{
		Id:        3, // In real app, this would be auto-generated
		Name:      req.Name,
		Email:     req.Email,
		CreatedAt: &now,
		UpdatedAt: &now,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

// GetUserByID implements the GetUserByID operation
func (s *Server) GetUserByID(w http.ResponseWriter, r *http.Request, id int64) {
	if id == 1 {
		now := time.Now()
		user := oapi.User{
			Id:        id,
			Name:      "田中太郎",
			Email:     "tanaka@example.com",
			CreatedAt: &now,
			UpdatedAt: &now,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
		return
	}

	errorResponse := oapi.Error{
		Message: "ユーザーが見つかりません",
		Code:    strToPtr("USER_NOT_FOUND"),
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(errorResponse)
}

// UpdateUser implements the UpdateUser operation
func (s *Server) UpdateUser(w http.ResponseWriter, r *http.Request, id int64) {
	var req oapi.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if id == 1 {
		now := time.Now()
		createdAt := now.Add(-24 * time.Hour) // 1日前に作成されたと仮定

		// Default values if not provided
		name := "田中太郎"
		if req.Name != nil {
			name = *req.Name
		}
		var email openapi_types.Email = "tanaka@example.com"
		if req.Email != nil {
			email = *req.Email
		}

		user := oapi.User{
			Id:        id,
			Name:      name,
			Email:     email,
			CreatedAt: &createdAt,
			UpdatedAt: &now,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
		return
	}

	errorResponse := oapi.Error{
		Message: "ユーザーが見つかりません",
		Code:    strToPtr("USER_NOT_FOUND"),
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(errorResponse)
}

// DeleteUser implements the DeleteUser operation
func (s *Server) DeleteUser(w http.ResponseWriter, r *http.Request, id int64) {
	if id == 1 {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	errorResponse := oapi.Error{
		Message: "ユーザーが見つかりません",
		Code:    strToPtr("USER_NOT_FOUND"),
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(errorResponse)
}

// GetHello implements the GetHello operation
func (s *Server) GetHello(w http.ResponseWriter, r *http.Request) {
	response := oapi.HelloResponse{
		Message: "Hello, World! OpenAPI Golang TypeScript Demo is working!",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func strToPtr(s string) *string {
	return &s
}

func main() {
	server := &Server{}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS middleware
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	// Mount the OpenAPI generated handlers
	r.Mount("/api", oapi.HandlerFromMux(server, r))

	fmt.Println("Server starting on :3000")
	log.Fatal(http.ListenAndServe(":3000", r))
}
