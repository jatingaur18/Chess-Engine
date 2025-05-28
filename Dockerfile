FROM gcc:12

WORKDIR /app

COPY . .

RUN apt-get update && apt-get install -y dpkg sudo && apt-get install -f -y

RUN dpkg -i Crow-1.2.1-Linux.deb || true && apt-get install -f -y


RUN make

# Compile the server
RUN g++ -std=c++17 -o server server.cpp -pthread

EXPOSE 8080

CMD ["./server"]
