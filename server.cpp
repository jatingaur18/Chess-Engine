#include "crow.h"
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <chrono>
#include <functional>
#include <string>
#include <memory>

using connection_ptr = crow::websocket::connection*;

struct Task {
    int number;
    connection_ptr conn;
};

int compute_half(int number) {
    std::this_thread::sleep_for(std::chrono::seconds(5));
    return number / 2;
}

std::queue<Task> task_queue;
std::mutex queue_mutex;
std::condition_variable queue_cv;

void worker() {
    while (true) {
        Task task;
        {
            std::unique_lock<std::mutex> lock(queue_mutex);
            queue_cv.wait(lock, [] { return !task_queue.empty(); });
            task = task_queue.front();
            task_queue.pop();
        }

        int result = compute_half(task.number);
        if (task.conn) {
            try {
                task.conn->send_text("Result: " + std::to_string(result));
            } catch (...) {
                // Connection might be closed; ignore
            }
        }
    }
}

int main() {
    crow::SimpleApp app;

    CROW_ROUTE(app, "/ws").websocket(&app) 
    .onopen([](crow::websocket::connection& conn){
        std::cout << "Client connected.\n";
    })
    .onmessage([](crow::websocket::connection& conn, const std::string& data, bool is_binary){
        try {
            int num = std::stoi(data);
            {
                std::lock_guard<std::mutex> lock(queue_mutex);
                task_queue.push({num, &conn});
            }
            queue_cv.notify_one();
        } catch (...) {
            conn.send_text("Invalid number.");
        }
    })
    .onclose([](crow::websocket::connection& conn, const std::string& reason, uint16_t code){
        std::cout << "Client disconnected: " << reason << " (" << code << ")\n";
    });

    
    const int NUM_WORKERS = 4;
    for (int i = 0; i < NUM_WORKERS; ++i) {
        std::thread(worker).detach();
    }

    app.port(8080).multithreaded().run();
}
