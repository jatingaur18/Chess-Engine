FROM alpine:latest
WORKDIR /app
COPY server ./server
RUN chmod +x ./server
EXPOSE 8080
CMD ["./server"]
