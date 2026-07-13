package middleware

import (
	"astro-backend/domain"
	"context"
	"fmt"

	"github.com/rs/zerolog/log"
)

type contextKey string

const (
	ActorIDKey   contextKey = "actorID"
	ActorNameKey contextKey = "actorName"
	ActorRoleID  contextKey = "actorRoleID"
)

func GetActorFromContext(ctx context.Context) (domain.Claims, error) {
	actorID, ok := ctx.Value(ActorIDKey).(int)
	if !ok {
		log.Error().Msg("actorID not found in context")
		return domain.Claims{}, fmt.Errorf("actorID not found in context")
	}
	actorRoleID, ok := ctx.Value(ActorRoleID).(int)
	if !ok {
		log.Error().Msg("actorRoleID not found in context")
		return domain.Claims{}, fmt.Errorf("actorRoleID not found in context")
	}
	actorName, ok := ctx.Value(ActorNameKey).(string)
	if !ok {
		log.Error().Msg("actorName not found in context")
		return domain.Claims{}, fmt.Errorf("actorName not found in context")
	}

	/* log.Info().
	Int64("actor_id", actorID).
	Str("actor_name", actorName).
	Int64("actor_role_id", actorRoleID).
	Msg("Successfully retrieved actor from context") */

	return domain.Claims{
		UserID:    actorID,
		RoleID:    actorRoleID,
		FirstName: actorName,
	}, nil
}

func SetActorToContext(ctx context.Context, claims *domain.Claims) context.Context {
	FullName := claims.FirstName + " " + claims.LastName
	ctx = context.WithValue(ctx, ActorIDKey, claims.UserID)
	ctx = context.WithValue(ctx, ActorNameKey, FullName)
	ctx = context.WithValue(ctx, ActorRoleID, claims.RoleID)
	return ctx
}
