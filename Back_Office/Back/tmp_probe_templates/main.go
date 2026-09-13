package main

import (
	"context"
	"fmt"
	"os"
	"regexp"

	"astro-backend/config"
	"astro-backend/db"
	"astro-backend/domain"
)

var tokRe = regexp.MustCompile(`\[[A-Za-zÀ-ÿ\s+]+\]`)

func main() {
	config.LoadConfig()
	ctx := context.Background()
	dbInstance, err := db.DatabaseManager()
	if err != nil {
		fmt.Println("connect err:", err)
		os.Exit(1)
	}
	defer dbInstance.Close()

	var templates []domain.EmailTemplate
	if err := dbInstance.NewSelect().Model(&templates).Order("id ASC").Scan(ctx); err != nil {
		fmt.Println("select err:", err)
		os.Exit(1)
	}

	allowed := map[string]bool{"[Reason]": true, "[Date]": true, "[Time]": true, "[Maps]": true, "[Link]": true}

	clean := true
	for _, t := range templates {
		for _, src := range []string{t.Subject, t.Body} {
			for _, tok := range tokRe.FindAllString(src, -1) {
				if !allowed[tok] {
					fmt.Printf("id=%d type=%q FOREIGN-TOKEN %q\n", t.ID, t.Type, tok)
					clean = false
				}
			}
		}
	}
	if clean {
		fmt.Println("ALL templates contain only the 5 allowed tokens")
	}
}