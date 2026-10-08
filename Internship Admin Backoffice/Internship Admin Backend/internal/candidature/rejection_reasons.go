package candidature

// RejectionReason is a selectable reason used when sending a rejection email.
// The label rendered in the UI and injected into the mail depends on the
// current application language (fr / en).
type RejectionReason struct {
	Key string `json:"key"`
	Fr  string `json:"fr"`
	En  string `json:"en"`
}

// rejectionReasonsByStep maps every pipeline step to the list of rejection
// reasons an HR user can pick from when sending the "disapproval" email.
var rejectionReasonsByStep = map[string][]RejectionReason{
	"cv_screening": {
		{Key: "cv_applied_multiple_subjects", Fr: "Candidature soumise pour plusieurs sujets", En: "Applied for Multiple Subjects"},
		{Key: "cv_profile_mismatch", Fr: "Le profil ne correspond pas au sujet choisi", En: "Profile Does Not Match the Selected Subject"},
		{Key: "cv_missing_documents", Fr: "CV ou documents requis manquants", En: "Missing CV or Required Documents"},
		{Key: "cv_incomplete_application", Fr: "Candidature incomplète", En: "Incomplete Application"},
		{Key: "cv_submitted_after_deadline", Fr: "Candidature soumise après la date limite", En: "Application Submitted After Deadline"},
		{Key: "cv_skills_not_demonstrated", Fr: "Compétences requises non démontrées", En: "Required Skills Not Demonstrated"},
		{Key: "cv_insufficient_academic_background", Fr: "Formation académique insuffisante", En: "Insufficient Academic Background"},
		{Key: "cv_insufficient_experience", Fr: "Expérience pertinente insuffisante", En: "Insufficient Relevant Experience"},
		{Key: "cv_screening_rejected", Fr: "Candidature refusée lors du tri des CV", En: "CV Screening Rejected"},
	},
	"online_quiz": {
		{Key: "quiz_not_started", Fr: "N'a pas commencé le quiz en ligne", En: "Did Not Start the Online Quiz"},
		{Key: "quiz_not_completed", Fr: "N'a pas terminé le quiz en ligne", En: "Did Not Complete the Online Quiz"},
		{Key: "quiz_failed", Fr: "A échoué au quiz en ligne", En: "Failed the Online Quiz"},
		{Key: "quiz_ai_cheating", Fr: "Tricherie assistée par IA suspectée", En: "Suspected AI-Assisted Cheating"},
	},
	"online_meeting": {
		{Key: "interview_slot_not_selected", Fr: "N'a pas sélectionné de créneau pour l'entretien en ligne", En: "Did Not Select a Slot for the Online Interview"},
		{Key: "interview_not_attended", Fr: "Ne s'est pas présenté(e) à l'entretien en ligne", En: "Did Not Attend the Online Interview"},
		{Key: "interview_failed", Fr: "A échoué à l'entretien en ligne", En: "Failed the Online Interview"},
		{Key: "interview_communication_skills", Fr: "Compétences en communication en dessous des attentes", En: "Communication Skills Below Expectations"},
		{Key: "interview_technical_skills", Fr: "Compétences techniques en dessous des attentes", En: "Technical Skills Below Expectations"},
		{Key: "interview_motivation_insufficient", Fr: "Motivation et intérêt pour le projet insuffisants", En: "Motivation and Project Interest Insufficient"},
	},
	"f2f_meeting": {
		{Key: "f2f_slot_not_selected", Fr: "N'a pas sélectionné de créneau pour l'entretien en présentiel", En: "Did Not Select a Slot for the F2F Interview"},
		{Key: "f2f_not_attended", Fr: "Ne s'est pas présenté(e) à l'entretien en présentiel", En: "Did Not Attend the F2F Interview"},
		{Key: "f2f_failed", Fr: "A échoué à l'entretien en présentiel", En: "Failed the F2F Interview"},
		{Key: "f2f_communication_skills", Fr: "Compétences en communication en dessous des attentes", En: "Communication Skills Below Expectations"},
		{Key: "f2f_technical_skills", Fr: "Compétences techniques en dessous des attentes", En: "Technical Skills Below Expectations"},
		{Key: "f2f_motivation_insufficient", Fr: "Motivation et intérêt pour le projet insuffisants", En: "Motivation and Project Interest Insufficient"},
	},
	"final_decision": {
		{Key: "fd_position_filled", Fr: "Poste déjà pourvu", En: "Position Already Filled"},
		{Key: "fd_better_candidate", Fr: "Un meilleur candidat a été sélectionné", En: "Better Candidate Selected"},
		{Key: "fd_committee_decision", Fr: "Décision du comité", En: "Committee Decision"},
		{Key: "fd_candidate_withdrew", Fr: "Le candidat a retiré sa candidature", En: "Candidate Withdrew Application"},
		{Key: "fd_candidate_accepted_other", Fr: "Le candidat a accepté une autre offre", En: "Candidate Accepted Another Offer"},
		{Key: "fd_internship_cancelled", Fr: "Stage annulé", En: "Internship Cancelled"},
	},
}

// GetRejectionReasons returns the rejection reasons grouped by pipeline step.
func GetRejectionReasons() map[string][]RejectionReason {
	result := make(map[string][]RejectionReason, len(rejectionReasonsByStep))
	for step, reasons := range rejectionReasonsByStep {
		result[step] = append([]RejectionReason(nil), reasons...)
	}
	return result
}
