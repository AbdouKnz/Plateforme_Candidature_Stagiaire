package setting

type CreateSettingRequest struct {
	GroupOrder     int      `json:"group_order" binding:"required"`
	Group          string   `json:"group" binding:"required"`
	Key            string   `json:"key" binding:"required"`
	Value          string   `json:"value"`
	Description    string   `json:"description"`
	Type           string   `json:"type"`
	PossibleValues []string `json:"possible_values"`
	Icon           string   `json:"icon"`
}

type UpdateSettingRequest struct {
	GroupOrder     int      `json:"group_order,omitempty"`
	Value          string   `json:"value,omitempty"`
	Type           string   `json:"type,omitempty"`
	PossibleValues []string `json:"possible_values,omitempty"`
	Description    string   `json:"description,omitempty"`
	Icon           string   `json:"icon,omitempty"`
}
