package main

import (
	"fmt"
	"log"
	"strings"

	"github.com/1206yaya/discriminator-demo/app/handlers/http/oapi"
)

// ProfileFieldType は ProfileField の種類を表すenum型
type ProfileFieldType string

const (
	ProfileFieldTypeText   ProfileFieldType = "text"
	ProfileFieldTypeNumber ProfileFieldType = "number"
	ProfileFieldTypeGender ProfileFieldType = "gender"
)

// GetBaseInfo は ProfileField から共通の基本情報を取得する (type switch版)
func GetBaseInfo(field oapi.ProfileField) (ProfileFieldType, string, error) {
	v, err := field.ValueByDiscriminator()
	if err != nil {
		return "", "", err
	}
	switch f := v.(type) {
	case oapi.TextProfileField:
		return ProfileFieldTypeText, f.Name, nil
	case oapi.NumberProfileField:
		return ProfileFieldTypeNumber, f.Name, nil
	case oapi.GenderProfileField:
		return ProfileFieldTypeGender, f.Name, nil
	default:
		return "", "", fmt.Errorf("unknown profile field type")
	}
}

// LogProfileFieldNames は ProfileField のスライスから名前をログ出力する
func LogProfileFieldNames(fields []oapi.ProfileField) {
	for i, field := range fields {
		fieldType, name, err := GetBaseInfo(field)
		if err != nil {
			log.Printf("フィールド[%d]: エラー - %v", i, err)
			continue
		}
		log.Printf("フィールド[%d]: タイプ=%s, 名前=%s", i, string(fieldType), name)
	}
}

// ValidateProfileFieldNames は ProfileField の名前をバリデーションする
func normalizeName(s string) string { return strings.TrimSpace(strings.ToLower(s)) }

func ValidateProfileFieldNames(fields []oapi.ProfileField) []string {
	var errs []string
	used := map[string]bool{}
	for i, f := range fields {
		_, name, err := GetBaseInfo(f)
		if err != nil {
			errs = append(errs, fmt.Sprintf("フィールド[%d]: %v", i, err))
			continue
		}
		n := normalizeName(name)
		if n == "" {
			errs = append(errs, fmt.Sprintf("フィールド[%d]: 名前が空です", i))
			continue
		}
		if used[n] {
			errs = append(errs, fmt.Sprintf("フィールド[%d]: 名前 '%s' が重複しています", i, name))
			continue
		}
		used[n] = true
	}
	return errs
}

// FilterProfileFieldsByName は名前でプロフィールフィールドをフィルタリング
func FilterProfileFieldsByName(fields []oapi.ProfileField, targetName string) []oapi.ProfileField {
	var filtered []oapi.ProfileField

	for _, field := range fields {
		_, name, err := GetBaseInfo(field)
		if err != nil {
			continue
		}

		if name == targetName {
			filtered = append(filtered, field)
		}
	}

	return filtered
}
