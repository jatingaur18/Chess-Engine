FROM alpine:latest AS build
RUN apk add --no-cache g++ make
WORKDIR /app
COPY . .
RUN g++ -o server server.cpp  # change this based on your actual source file
FROM alpine:latest
WORKDIR /app
COPY --from=build /app/server ./server
RUN chmod +x ./server
EXPOSE 8080
CMD ["./server"]
