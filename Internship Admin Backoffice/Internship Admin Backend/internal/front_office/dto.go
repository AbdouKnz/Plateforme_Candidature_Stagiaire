package front_office

type ToggleFrontOfficeRequest struct {
	IsEnabled       bool   `json:"is_enabled"`
	ReopeningDate   string `json:"reopening_date,omitempty"`
	Year            string `json:"year,omitempty"`
	InternshipTitle string `json:"internship_title,omitempty"`
}

type FrontOfficeStatusResponse struct {
	IsEnabled       bool   `json:"is_enabled"`
	ReopeningDate   string `json:"reopening_date,omitempty"`
	Year            string `json:"year,omitempty"`
	InternshipTitle string `json:"internship_title,omitempty"`
	FooterPhone     string `json:"footer_phone,omitempty"`
	FooterEmail     string `json:"footer_email,omitempty"`
	FooterLinkedin  string `json:"footer_linkedin,omitempty"`
	FooterWebsite   string `json:"footer_website,omitempty"`
	FooterPrivacyURL string `json:"footer_privacy_url,omitempty"`
	FooterTermsURL  string `json:"footer_terms_url,omitempty"`
}

type UpdateFrontOfficeFooterRequest struct {
	FooterPhone     string `json:"footer_phone,omitempty"`
	FooterEmail     string `json:"footer_email,omitempty"`
	FooterLinkedin  string `json:"footer_linkedin,omitempty"`
	FooterWebsite   string `json:"footer_website,omitempty"`
	FooterPrivacyURL string `json:"footer_privacy_url,omitempty"`
	FooterTermsURL  string `json:"footer_terms_url,omitempty"`
}

