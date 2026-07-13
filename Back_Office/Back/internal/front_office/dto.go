package front_office

type ToggleFrontOfficeRequest struct {
	IsEnabled     bool   `json:"is_enabled"`
	ReopeningDate string `json:"reopening_date,omitempty"`
}

type FrontOfficeStatusResponse struct {
	IsEnabled     bool   `json:"is_enabled"`
	ReopeningDate string `json:"reopening_date,omitempty"`
}

