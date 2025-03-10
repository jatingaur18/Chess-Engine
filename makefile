CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2 -Wno-parentheses
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



# for ui 

# CC = g++
# CFLAGS = -std=c++17 -Wall -Wextra -O2 -Wno-parentheses
# LIBS = -lsfml-graphics -lsfml-window -lsfml-system
# SRCS = main.cpp board.cpp gen_moves.cpp ui.cpp
# TARGET = a

# all: $(TARGET)

# $(TARGET): $(SRCS)
# 	$(CC) $(CFLAGS) $(SRCS) -o $(TARGET) $(LIBS)

# run: $(TARGET)
# 	./$(TARGET)

# clean:
# 	rm -f $(TARGET)

# .PHONY: all run clean