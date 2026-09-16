package main

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
)

func main() {
	ctx := context.Background()
	dsn := "postgres://postgres:postgres@127.0.0.1:5432/internship?sslmode=disable"
	sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(dsn)))
	db := bun.NewDB(sqldb, pgdialect.New())
	defer db.Close()

	q := func(title, query string, dest interface{}) {
		fmt.Println("=== " + title + " ===")
		if err := db.NewRaw(query).Scan(ctx, dest); err != nil {
			fmt.Println("ERR:", err)
			return
		}
		for _, r := range *(dest.(*[]map[string]interface{})) {
			fmt.Printf("%v\n", r)
		}
	}

	var a []map[string]interface{}
	q("A. SUBJECT NAME BYTES",
		`SELECT id, '[' || name || ']' AS quoted_name, length(name) AS len, '[' || code || ']' AS quoted_code, status FROM subject`,
		&a)

	var b []map[string]interface{}
	q("B. TODAY CANDIDATURE SUBJECTS",
		`SELECT id, '[' || subject_name || ']' AS quoted_sname, length(subject_name) AS len, '[' || subject_code || ']' AS quoted_scode, email1, email2, created_at FROM candidature WHERE created_at >= '2026-09-16' ORDER BY id DESC LIMIT 12`,
		&b)

	var c []map[string]interface{}
	q("C. EMAIL LOGS TODAY BY STATUS",
		`SELECT template_type, status, count(*) AS n FROM email_logs WHERE sent_at >= '2026-09-16' GROUP BY template_type, status ORDER BY template_type, status`,
		&c)

	var d []map[string]interface{}
	q("D. TODAY CONFIRMATION LOGS DETAIL",
		`SELECT id, candidature_id, '[' || recipient || ']' AS recip, status, sent_at FROM email_logs WHERE sent_at >= '2026-09-16' AND template_type = 'confirmation' ORDER BY id DESC LIMIT 12`,
		&d)
}
