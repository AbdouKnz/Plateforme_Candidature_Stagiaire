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

# Fail the build early if the font isn't present in the build context
RUN test -f /app/pkg/export/font/DejaVuSans.ttf || \
    (echo "ERROR: DejaVuSans.ttf missing from build context" && exit 1)

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
RUN mkdir -p /app/pkg/export/font
RUN mkdir -p /app/uploads

COPY --from=builder /app/uploads ./uploads

# Explicitly copy the font file (not just the directory)
COPY --from=builder /app/pkg/export/font/DejaVuSans.ttf ./pkg/export/font/DejaVuSans.ttf

# Copy binary
COPY --from=builder /app/bin/app /app/app

# Verify the font actually landed in the final image
RUN test -f /app/pkg/export/font/DejaVuSans.ttf || \
    (echo "ERROR: DejaVuSans.ttf missing in final image" && exit 1)

# Set executable permissions
RUN chmod +x /app/app

ENTRYPOINT ["./app"]