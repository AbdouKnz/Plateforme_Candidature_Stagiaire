# -------- Stage 1: Build --------
FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

RUN apk add --no-cache tzdata

COPY . .

# Verify font exists
RUN test -f /app/pkg/export/font/DejaVuSans.ttf || \
    (echo "ERROR: DejaVuSans.ttf missing from build context" && exit 1)

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/app .

# -------- Stage 2: Runtime --------
FROM alpine:latest

RUN apk add --no-cache tzdata

ENV TZ=UTC

WORKDIR /app

# Copy timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy uploads
COPY --from=builder /app/uploads ./uploads

# Copy entire font directory
RUN mkdir -p /app/pkg/export/font
COPY --from=builder /app/pkg/export/font ./pkg/export/font

# Copy binary
COPY --from=builder /app/bin/app ./app

# Verify font exists in final image
RUN test -f /app/pkg/export/font/DejaVuSans.ttf || \
    (echo "ERROR: DejaVuSans.ttf missing in final image" && exit 1)

RUN chmod +x /app/app

ENTRYPOINT ["./app"]