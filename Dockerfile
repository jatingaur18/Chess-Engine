FROM debian:bullseye-slim

# Install basic runtime dependencies (adjust as needed)
RUN apt-get update && apt-get install -y \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only the binary
COPY server ./server

# Make it executable
RUN chmod +x ./server

EXPOSE 8080

# Run the server binary
CMD ["./server"]
