CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2 -Wno-parentheses
TARGET = a

# Generate object file names from source files
SRCS = main.cpp board.cpp gen_moves.cpp
OBJS = $(SRCS:.cpp=.o)
DEPS = $(SRCS:.cpp=.d)

# Add dependency generation to CXXFLAGS
CXXFLAGS += -MMD -MP

all: $(TARGET)

# Link object files to create executable
$(TARGET): $(OBJS)
	$(CXX) $(CXXFLAGS) $(OBJS) -o $(TARGET)

# Compile source files to object files
%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Include dependency files
-include $(DEPS)

run: $(TARGET)
	./$(TARGET)

clean:
	rm -f $(TARGET) $(OBJS) $(DEPS)

.PHONY: all run clean