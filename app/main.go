package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/1206yaya/discriminator-demo/app/handlers/http/oapi"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// Server implements the generated OpenAPI interface
type Server struct {
	users  []oapi.User
	nextID int64
}

// NewServer creates a new server with sample data
func NewServer() *Server {
	now := time.Now()

	// ProfileField examples using discriminator
	// 田中太郎のプロフィール項目
	hobbyField := oapi.ProfileField{}
	hobbyField.FromTextProfileField(oapi.TextProfileField{
		FieldType: oapi.TextProfileFieldFieldTypeText,
		Name:      "趣味",
		Value:     "読書",
	})

	ageField := oapi.ProfileField{}
	ageField.FromNumberProfileField(oapi.NumberProfileField{
		FieldType: oapi.NumberProfileFieldFieldTypeNumber,
		Name:      "年齢",
		Value:     30,
	})

	tanakaProfileFields := []oapi.ProfileField{hobbyField, ageField}

	// 三井花子のプロフィール項目
	jobField := oapi.ProfileField{}
	jobField.FromTextProfileField(oapi.TextProfileField{
		FieldType: oapi.TextProfileFieldFieldTypeText,
		Name:      "職業",
		Value:     "エンジニア",
	})

	genderField := oapi.ProfileField{}
	genderField.FromGenderProfileField(oapi.GenderProfileField{
		FieldType: oapi.GenderProfileFieldFieldTypeGender,
		Name:      "性別",
		Value:     oapi.GenderProfileFieldValueFemale,
	})

	mitsuiProfileFields := []oapi.ProfileField{jobField, genderField}

	users := []oapi.User{
		{
			Id:            1,
			Name:          "田中太郎",
			Email:         "tanaka@example.com",
			CreatedAt:     &now,
			UpdatedAt:     &now,
			ProfileFields: &tanakaProfileFields,
		},
		{
			Id:            2,
			Name:          "三井花子",
			Email:         "mitsui@example.com",
			CreatedAt:     &now,
			UpdatedAt:     &now,
			ProfileFields: &mitsuiProfileFields,
		},
	}

	return &Server{
		users:  users,
		nextID: 3,
	}
}

// GetUsers implements the GetUsers operation
func (s *Server) GetUsers(w http.ResponseWriter, r *http.Request) {
	fieldNameStats := make(map[string]int)

	for _, user := range s.users {
		if user.ProfileFields != nil {
			for _, field := range *user.ProfileFields {
				_, name, err := GetBaseInfo(field)
				if err == nil {
					fieldNameStats[name]++
				}
			}
		}
	}

	if len(fieldNameStats) > 0 {
		log.Printf("プロフィールフィールド名の統計: %+v", fieldNameStats)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s.users)
}

// CreateUser implements the CreateUser operation
func (s *Server) CreateUser(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("CreateUser called - Content-Type: %s\n", r.Header.Get("Content-Type"))

	var req oapi.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Printf("JSON decode error: %v\n", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	fmt.Printf("Parsed request: %+v\n", req)
	if req.ProfileFields != nil {
		fmt.Printf("ProfileFields count: %d\n", len(*req.ProfileFields))

		LogProfileFieldNames(*req.ProfileFields)

		// バリデーション例
		if errors := ValidateProfileFieldNames(*req.ProfileFields); len(errors) > 0 {
			fmt.Printf("Validation errors: %v\n", errors)
			errorResponse := oapi.Error{
				Message: "プロフィールフィールドにエラーがあります",
				Code:    strToPtr("VALIDATION_ERROR"),
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(errorResponse)
			return
		}
	} else {
		fmt.Printf("ProfileFields is nil\n")
	}

	now := time.Now()
	user := oapi.User{
		Id:            s.nextID, // Use the next available ID
		Name:          req.Name,
		Email:         req.Email,
		CreatedAt:     &now,
		UpdatedAt:     &now,
		ProfileFields: req.ProfileFields,
	}

	// Add the user to the in-memory store
	s.users = append(s.users, user)
	s.nextID++

	fmt.Printf("User added to store. Total users: %d\n", len(s.users))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

// GetUserByID implements the GetUserByID operation
func (s *Server) GetUserByID(w http.ResponseWriter, r *http.Request, id int64) {
	// Find user by ID
	for _, user := range s.users {
		if user.Id == id {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(user)
			return
		}
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

	// Find user by ID and update
	for i, user := range s.users {
		if user.Id == id {
			now := time.Now()

			// Update fields if provided in request
			if req.Name != nil {
				user.Name = *req.Name
			}
			if req.Email != nil {
				user.Email = *req.Email
			}
			if req.ProfileFields != nil {
				user.ProfileFields = req.ProfileFields
			}

			// Update timestamp
			user.UpdatedAt = &now

			// Update the user in the slice
			s.users[i] = user

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(user)
			return
		}
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
	// Find and remove user by ID
	for i, user := range s.users {
		if user.Id == id {
			s.users = append(s.users[:i], s.users[i+1:]...)
			fmt.Printf("User %d deleted. Total users: %d\n", id, len(s.users))
			w.WriteHeader(http.StatusNoContent)
			return
		}
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
	server := NewServer()

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
