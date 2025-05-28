# Stage 1: Build the application
FROM alpine:latest AS build

# Install required packages (no pthread-dev, pthread is part of libc/musl)
RUN apk add --no-cache g++ make boost-dev

# Set working directory
WORKDIR /app

# Copy source files
COPY . .

# Compile the chess engine (adjust this as per your actual Makefile or source setup)
RUN make

# Stage 2: Create a minimal runtime image
FROM alpine:latest

# Install runtime dependencies for boost (you may need libstdc++ too)
RUN apk add --no-cache boost-system libstdc++

# Set working directory
WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=build /app/chess_engine .

# Run the chess engine by default (change 'chess_engine' to your binary name)
CMD ["./chess_engine"]
