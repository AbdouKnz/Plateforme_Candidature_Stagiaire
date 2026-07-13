# -------- Stage 1: Build --------
FROM golang:1.25-alpine AS builder

# Set working directory
WORKDIR /app

# Copy go mod files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Install timezone data for correct datetime handling
RUN apk add --no-cache tzdata

# Copy the entire project
COPY . .

# Build the Go binary as a static executable, without CGO enabled
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/app .

# -------- Stage 2: Runtime --------
FROM alpine:latest

# Install timezone data
RUN apk add --no-cache tzdata

ENV TZ=UTC

WORKDIR /app

# Copy timezone info
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
RUN mkdir -p /app/utils/export/font
COPY --from=builder /app/utils/export/font ./utils/export/font

# Copy binary
COPY --from=builder /app/bin/app /app/app

# Set executable permissions
RUN chmod +x /app/app

ENTRYPOINT ["./app"]