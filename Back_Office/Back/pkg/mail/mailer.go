package mail

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"io"
	"strings"
	"time"

	gomail "gopkg.in/gomail.v2"
)

type Mailer struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	FromName string
}

type Email struct {
	To          []string
	Subject     string
	Body        string
	Attachments []Attachment
}

// Attachment is a file attached to an outgoing email.
type Attachment struct {
	Filename    string
	ContentType string
	Data        []byte
}

func NewMailer(host string, port int, username, password, from, fromName string) *Mailer {
	return &Mailer{
		Host:     host,
		Port:     port,
		Username: username,
		Password: password,
		From:     from,
		FromName: fromName,
	}
}

func (m *Mailer) dialer() *gomail.Dialer {
	host := strings.TrimSpace(m.Host)
	username := strings.TrimSpace(m.Username)
	dialer := gomail.NewDialer(host, m.Port, username, m.Password)
	// Keep previous behaviour (self-signed / private CA compat) but set
	// ServerName so STARTTLS / implicit-TLS handshakes succeed.
	dialer.TLSConfig = &tls.Config{InsecureSkipVerify: true, ServerName: host}
	return dialer
}

func (m *Mailer) validate(e Email) error {
	if strings.TrimSpace(m.Host) == "" {
		return fmt.Errorf("smtp host is empty")
	}
	if m.Port <= 0 || m.Port > 65535 {
		return fmt.Errorf("smtp port %d is invalid", m.Port)
	}
	if strings.TrimSpace(m.From) == "" {
		return fmt.Errorf("smtp from address is empty")
	}
	if len(e.To) == 0 || strings.TrimSpace(e.To[0]) == "" {
		return fmt.Errorf("recipient address is empty")
	}
	for _, to := range e.To {
		if strings.TrimSpace(to) == "" || !strings.Contains(to, "@") {
			return fmt.Errorf("recipient address %q is invalid", to)
		}
	}
	return nil
}

func (m *Mailer) Send(e Email) error {
	if err := m.validate(e); err != nil {
		return err
	}

	raw, err := m.buildMessage(e)
	if err != nil {
		return fmt.Errorf("build email message: %w", err)
	}

	dialer := m.dialer()
	sender, err := dialer.Dial()
	if err != nil {
		return fmt.Errorf("smtp dial %s:%d: %w", strings.TrimSpace(m.Host), m.Port, err)
	}
	defer sender.Close()
	if err := sender.Send(strings.TrimSpace(m.From), e.To, raw); err != nil {
		return fmt.Errorf("smtp send from %q to %q: %w", strings.TrimSpace(m.From), strings.Join(e.To, ","), err)
	}
	return nil
}

type rawMessage struct {
	content []byte
}

func (r rawMessage) WriteTo(w io.Writer) (int64, error) {
	n, err := w.Write(r.content)
	return int64(n), err
}

func (m *Mailer) buildMessage(e Email) (rawMessage, error) {
	var buf bytes.Buffer

	from := strings.TrimSpace(m.From)
	buf.WriteString(fmt.Sprintf("From: %s\r\n", m.FormatAddress(from, strings.TrimSpace(m.FromName))))
	to := make([]string, 0, len(e.To))
	for _, t := range e.To {
		to = append(to, strings.TrimSpace(t))
	}
	buf.WriteString(fmt.Sprintf("To: %s\r\n", strings.Join(to, ", ")))
	buf.WriteString(fmt.Sprintf("Subject: %s\r\n", encodeSubject(strings.TrimSpace(e.Subject))))
	buf.WriteString(fmt.Sprintf("Date: %s\r\n", time.Now().Format(time.RFC1123Z)))
	buf.WriteString("MIME-Version: 1.0\r\n")

	htmlContent := strings.ReplaceAll(e.Body, "\n", "<br>")
	html := buildHTML(htmlContent)

	if len(e.Attachments) == 0 {
		buf.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
		buf.WriteString("Content-Transfer-Encoding: 8bit\r\n\r\n")
		buf.WriteString(html)
		return rawMessage{content: buf.Bytes()}, nil
	}

	// multipart/mixed so the plain body ships alongside file attachments.
	boundary := fmt.Sprintf("astro-%d", time.Now().UnixNano())
	buf.WriteString(fmt.Sprintf("Content-Type: multipart/mixed; boundary=\"%s\"\r\n\r\n", boundary))

	buf.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	buf.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	buf.WriteString("Content-Transfer-Encoding: 8bit\r\n\r\n")
	buf.WriteString(html)
	buf.WriteString("\r\n")

	for _, a := range e.Attachments {
		filename := strings.TrimSpace(a.Filename)
		if filename == "" {
			filename = "attachment"
		}
		contentType := strings.TrimSpace(a.ContentType)
		if contentType == "" {
			contentType = "application/octet-stream"
		}
		buf.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		buf.WriteString(fmt.Sprintf("Content-Type: %s; name=\"%s\"\r\n", contentType, filename))
		buf.WriteString("Content-Transfer-Encoding: base64\r\n")
		buf.WriteString(fmt.Sprintf("Content-Disposition: attachment; filename=\"%s\"\r\n\r\n", filename))
		encoded := base64.StdEncoding.EncodeToString(a.Data)
		for i := 0; i < len(encoded); i += 76 {
			end := i + 76
			if end > len(encoded) {
				end = len(encoded)
			}
			buf.WriteString(encoded[i:end] + "\r\n")
		}
	}
	buf.WriteString(fmt.Sprintf("--%s--\r\n", boundary))

	return rawMessage{content: buf.Bytes()}, nil
}

func (m *Mailer) FormatAddress(email, name string) string {
	email = strings.TrimSpace(email)
	name = strings.TrimSpace(name)
	if name == "" {
		return email
	}
	// Quote the display name when it contains specials (comma, semicolon,
	// angle brackets, quotes, non-ASCII) so the From header stays valid.
	needsQuote := false
	for _, r := range name {
		if r < 32 || r >= 127 || strings.ContainsRune(",;:<>@\"()[]", r) {
			needsQuote = true
			break
		}
	}
	if needsQuote {
		escaped := strings.ReplaceAll(name, "\\", "\\\\")
		escaped = strings.ReplaceAll(escaped, "\"", "\\\"")
		return fmt.Sprintf("\"%s\" <%s>", encodeSubject(escaped), email)
	}
	return fmt.Sprintf("%s <%s>", name, email)
}

// encodeSubject RFC2047-encodes non-ASCII subjects (French accents, ...).
// Pure-ASCII subjects are returned untouched.
func encodeSubject(s string) string {
	isASCII := true
	for i := 0; i < len(s); i++ {
		if s[i] >= 128 {
			isASCII = false
			break
		}
	}
	if isASCII {
		return s
	}
	var buf bytes.Buffer
	maxLen := 40
	for len(s) > 0 {
		n := len(s)
		if n > maxLen {
			n = maxLen
			for n > 0 && s[n-1] >= 0x80 && s[n-1] < 0xC0 {
				n--
			}
			if n == 0 {
				n = len(s)
				if n > maxLen {
					n = maxLen
				}
			}
		}
		chunk := s[:n]
		s = s[n:]
		if buf.Len() > 0 {
			buf.WriteString("\r\n ")
		}
		buf.WriteString("=?UTF-8?B?")
		buf.WriteString(base64.StdEncoding.EncodeToString([]byte(chunk)))
		buf.WriteString("?=")
	}
	return buf.String()
}

func buildHTML(body string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%" style="background-color:#F3F4F6;">
<tr>
<td align="center" style="padding:30px 10px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%%;background-color:#FFFFFF;border-radius:12px;border:1px solid #E5E7EB;box-shadow:0 4px 12px rgba(0,0,0,0.08);overflow:hidden;">

<!-- BODY -->
<tr>
<td style="padding:40px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#4B5563;">
%s
</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="padding:0 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%">
<tr>
<td style="border-top:1px solid #E5E7EB;padding:25px 0 20px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%">
<tr>
<td align="center" style="padding-bottom:15px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>

<!-- Location -->
<td style="padding:0 10px;">
<a href="https://www.google.com/maps/place/Asteroidea/@36.7683782,10.2420193,909m/data=!3m2!1e3!4b1!4m6!3m5!1s0x12fd370003d7b35b:0xba18eae5e43a8557!8m2!3d36.7683739!4d10.2445942!16s%%2Fg%%2F11vy5k2_b2?entry=ttu&amp;g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%%3D%%3D" target="_blank" style="text-decoration:none;">
<img src="https://raw.githubusercontent.com/AbdouKnz/Images/main/location.png" width="24" height="24" alt="Location" style="display:block;border:0;outline:none;text-decoration:none;vertical-align:middle;">
</a>
</td>

<!-- Phone -->
<td style="padding:0 10px;">
<a href="tel:+21626342040" target="_blank" style="text-decoration:none;">
<img src="https://raw.githubusercontent.com/AbdouKnz/Images/main/phone.png" width="24" height="24" alt="Phone" style="display:block;border:0;outline:none;text-decoration:none;vertical-align:middle;">
</a>
</td>

<!-- Email -->
<td style="padding:0 10px;">
<a href="mailto:info@parkandcharge.io" target="_blank" style="text-decoration:none;">
<img src="https://raw.githubusercontent.com/AbdouKnz/Images/main/email.png" width="24" height="24" alt="Email" style="display:block;border:0;outline:none;text-decoration:none;vertical-align:middle;">
</a>
</td>

<!-- LinkedIn -->
<td style="padding:0 10px;">
<a href="https://www.linkedin.com/company/park-and-charge-tn/" target="_blank" style="text-decoration:none;">
<img src="https://raw.githubusercontent.com/AbdouKnz/Images/main/linkedin.png" width="24" height="24" alt="LinkedIn" style="display:block;border:0;outline:none;text-decoration:none;vertical-align:middle;">
</a>
</td>

<!-- Website -->
<td style="padding:0 10px;">
<a href="https://parkandcharge.io/" target="_blank" style="text-decoration:none;">
<img src="https://raw.githubusercontent.com/AbdouKnz/Images/main/WhiteBlueCircle.png" width="24" height="24" alt="Website" style="display:block;border:0;outline:none;text-decoration:none;vertical-align:middle;">
</a>
</td>

</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9CA3AF;line-height:1.5;">
&copy; 2026 Park & Charge. All rights reserved.
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`, body)
}
