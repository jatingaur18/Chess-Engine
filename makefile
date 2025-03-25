# Safe and fast Makefile
CXX = g++
CXXFLAGS = -std=c++17 -Ofast -Wall -Wextra -Wno-parentheses
TARGET = a
SRCS = main.cpp board.cpp gen_moves.cpp

all: $(TARGET)

$(TARGET): $(SRCS)
	$(CXX) $(CXXFLAGS) $(SRCS) -o $(TARGET)

run: $(TARGET)
	clear
	./$(TARGET)

clean:
	rm -f $(TARGET)

.PHONY: all run clean