#include "crow.h"
#include <iostream>
#include <memory>
#include <unordered_map>
#include <thread>
#include <mutex>
#include <sstream>
#include <unistd.h>
#include <fcntl.h>
#include <sys/types.h>
#include <sys/wait.h>

using connection_ptr = crow::websocket::connection*;

struct EngineSession {
    int to_engine_fd;
    int from_engine_fd;
    pid_t pid;

    EngineSession(const std::string& engine_path) {
        int stdin_pipe[2];
        int stdout_pipe[2];

        if (pipe(stdin_pipe) == -1 || pipe(stdout_pipe) == -1) {
            throw std::runtime_error("Failed to create pipes");
        }

        pid = fork();
        if (pid == -1) {
            throw std::runtime_error("Fork failed");
        }

        if (pid == 0) {
            dup2(stdin_pipe[0], STDIN_FILENO);
            dup2(stdout_pipe[1], STDOUT_FILENO);
            close(stdin_pipe[1]);
            close(stdout_pipe[0]);

            execl(engine_path.c_str(), engine_path.c_str(), (char*)nullptr);
            perror("execl failed");
            exit(1);
        }

        close(stdin_pipe[0]);
        close(stdout_pipe[1]);

        to_engine_fd = stdin_pipe[1];
        from_engine_fd = stdout_pipe[0];

        fcntl(from_engine_fd, F_SETFL, O_NONBLOCK);
    }

    void send_command(const std::string& cmd) {
        std::string full_cmd = cmd + "\n";
        write(to_engine_fd, full_cmd.c_str(), full_cmd.size());
    }

    std::string read_response() {
        char buffer[1024];
        std::string output;
        ssize_t bytes;
        int wait_count = 10;

        while (wait_count--) {
            bytes = read(from_engine_fd, buffer, sizeof(buffer) - 1);
            if (bytes > 0) {
                buffer[bytes] = '\0';
                output += buffer;
            } else {
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
            }
        }

        return output.empty() ? "No response" : output;
    }

    ~EngineSession() {
        close(to_engine_fd);
        close(from_engine_fd);
        kill(pid, SIGTERM);
        waitpid(pid, nullptr, 0);
    }
};

std::unordered_map<connection_ptr, std::shared_ptr<EngineSession>> sessions;
std::mutex session_mutex;

int main() {
    crow::SimpleApp app;

    CROW_ROUTE(app, "/")([]{
        return "Chess WebSocket Server Running!";
    });

    CROW_WEBSOCKET_ROUTE(app, "/ws")
    .onopen([](crow::websocket::connection& conn){
        std::cout << "Client connected.\n";
        try {
            auto session = std::make_shared<EngineSession>("./a");
            {
                std::lock_guard<std::mutex> lock(session_mutex);
                sessions[&conn] = session;
            }

            session->send_command("uci");
            std::string init_response = session->read_response();
            conn.send_text(init_response);
        } catch (const std::exception& e) {
            std::cerr << "Error starting engine: " << e.what() << "\n";
            conn.send_text("Failed to start engine.");
            conn.close("Engine error");
        }
    })
    .onclose([](crow::websocket::connection& conn, const std::string& reason, uint16_t){
        std::cout << "Client disconnected: " << reason << "\n";
        std::lock_guard<std::mutex> lock(session_mutex);
        sessions.erase(&conn);
    })
    .onmessage([](crow::websocket::connection& conn, const std::string& data, bool){
        std::cout << "Received message: " << data << "\n";
        std::shared_ptr<EngineSession> session;
        size_t active_sessions;

        {
            std::lock_guard<std::mutex> lock(session_mutex);
            auto it = sessions.find(&conn);
            if (it == sessions.end()) {
                conn.send_text("Session not found.");
                return;
            }
            session = it->second;
            active_sessions = sessions.size();
        }

        try {
            session->send_command(data);
            std::string response = session->read_response();

            std::ostringstream wrapped_response;
            wrapped_response << "pid: " << session->pid << "\n" << response;

            conn.send_text(wrapped_response.str());

            std::cout << "[LOG] Sent response to client.\n";
            std::cout << "[LOG] Active connections: " << active_sessions << "\n";
            std::cout << "[LOG] Active engine processes: " << active_sessions << "\n";

        } catch (const std::exception& e) {
            std::cerr << "Error processing message: " << e.what() << "\n";
            conn.send_text("Error communicating with engine.");
        }
    });


    app.port(8080).multithreaded().run();
}
