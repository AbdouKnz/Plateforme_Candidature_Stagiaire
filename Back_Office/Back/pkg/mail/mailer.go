package mail

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"io"
	"strings"

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
	To      []string
	Subject string
	Body    string
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

func (m *Mailer) Send(e Email) error {
	raw, err := m.buildMessage(e)
	if err != nil {
		return err
	}

	dialer := gomail.NewDialer(m.Host, m.Port, m.Username, m.Password)
	dialer.TLSConfig = &tls.Config{InsecureSkipVerify: true}
	sender, err := dialer.Dial()
	if err != nil {
		return err
	}
	return sender.Send(m.From, e.To, raw)
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

	buf.WriteString(fmt.Sprintf("From: %s\r\n", m.FormatAddress(m.From, m.FromName)))
	buf.WriteString(fmt.Sprintf("To: %s\r\n", strings.Join(e.To, ", ")))
	buf.WriteString(fmt.Sprintf("Subject: %s\r\n", e.Subject))
	buf.WriteString("MIME-Version: 1.0\r\n")
	buf.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n\r\n")

	htmlContent := strings.ReplaceAll(e.Body, "\n", "<br>")
	buf.WriteString(buildHTML(htmlContent))

	return rawMessage{content: buf.Bytes()}, nil
}

func (m *Mailer) FormatAddress(email, name string) string {
	if name == "" {
		return email
	}
	return fmt.Sprintf("%s <%s>", name, email)
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
<a href="mailto:info@asteroidea.co" target="_blank" style="text-decoration:none;">
			<img src="https://raw.githubusercontent.com/AbdouKnz/Images/main/email.png" width="24" height="24" alt="Email" style="display:block;border:0;outline:none;text-decoration:none;vertical-align:middle;">
</a>
</td>

<!-- LinkedIn -->
<td style="padding:0 10px;">
<a href="https://www.linkedin.com/company/asteroidea-co/posts/?feedView=all" target="_blank" style="text-decoration:none;">
			<img src="https://raw.githubusercontent.com/AbdouKnz/Images/main/linkedin.png" width="24" height="24" alt="LinkedIn" style="display:block;border:0;outline:none;text-decoration:none;vertical-align:middle;">
</a>
</td>

<!-- Website -->
<td style="padding:0 10px;">
<a href="https://asteroidea.co/" target="_blank" style="text-decoration:none;">
			<img src="https://raw.githubusercontent.com/AbdouKnz/Images/main/website.png" width="24" height="24" alt="Website" style="display:block;border:0;outline:none;text-decoration:none;vertical-align:middle;">
</a>
</td>

</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9CA3AF;line-height:1.5;">
&copy; 2026 Asteroidea. All rights reserved.
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
