CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2 -Wno-parentheses
TARGET = a

SRCS = main.cpp board.cpp gen_moves.cpp

all: $(TARGET)

$(TARGET): $(SRCS)
	$(CXX) $(CXXFLAGS) $(SRCS) -o $(TARGET)

run: $(TARGET)
	./$(TARGET)

clean:
	rm -f $(TARGET)

.PHONY: all run clean