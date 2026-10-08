package waitlist

import "astro-backend/domain"

type SubscribeRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type WaitlistSubscriberResponse struct {
	ID         int    `json:"id"`
	Email      string `json:"email"`
	Status     string `json:"status"`
	CreatedAt  string `json:"created_at"`
	NotifiedAt string `json:"notified_at,omitempty"`
	Already    bool   `json:"already,omitempty"`
}

type WaitlistStatsResponse struct {
	Total    int `json:"total"`
	Pending  int `json:"pending"`
	Notified int `json:"notified"`
	Failed   int `json:"failed"`
}

func ToResponse(s *domain.WaitlistSubscriber) WaitlistSubscriberResponse {
	return WaitlistSubscriberResponse{
		ID:         s.ID,
		Email:      s.Email,
		Status:     s.Status,
		CreatedAt:  s.CreatedAt,
		NotifiedAt: s.NotifiedAt,
	}
}

func ToResponseList(list []*domain.WaitlistSubscriber) []WaitlistSubscriberResponse {
	res := make([]WaitlistSubscriberResponse, len(list))
	for i, s := range list {
		res[i] = ToResponse(s)
	}
	return res
}
