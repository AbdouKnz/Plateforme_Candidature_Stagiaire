package email_footer

type UpdateEmailFooterRequest struct {
	Phone      string `json:"phone,omitempty"`
	Email      string `json:"email,omitempty"`
	Linkedin   string `json:"linkedin,omitempty"`
	Website    string `json:"website,omitempty"`
	AddressURL string `json:"address_url,omitempty"`
}

type EmailFooterResponse struct {
	Phone      string `json:"phone,omitempty"`
	Email      string `json:"email,omitempty"`
	Linkedin   string `json:"linkedin,omitempty"`
	Website    string `json:"website,omitempty"`
	AddressURL string `json:"address_url,omitempty"`
}
