# Chess Engine

A powerful chess engine implemented in C++, featuring efficient bitboard operations and comprehensive move generation for all pieces.

## Table of Contents
- [Features](#features)
- [Technical Implementation](#technical-implementation)
  - [Board Representation](#board-representation)
  - [Sliding Pieces Calculation](#sliding-pieces-calculation)
  - [Move Generation](#move-generation)
- [Setup](#setup)
- [Usage](#usage)
- [Project Structure](#project-structure)

## Features

- Bitboard-based chess board representation
- FEN string parsing and position setup
- Comprehensive move generation for all pieces
- Attack table pre-computation for faster move generation
- Unicode chess piece visualization
- Support for special moves (castling, en passant)

## Technical Implementation

### Board Representation

The chess engine uses bitboards (64-bit integers) for efficient board representation:
- Each piece type has its own bitboard
- Additional bitboards for white and black pieces
- Position tracking using bit manipulation operations
- Support for complete chess state including castling rights and en passant squares

### Sliding Pieces Calculation

The engine implements an efficient method for calculating sliding piece moves (rooks, bishops, queens):

1. **Rook Movement Calculation**:
```cpp
usl rook_attacks(int square, usl occupancy) {
    return (~(MSB(occupancy & rook_map[square][0])-1) & rook_map[square][0]
    | ((LSB(occupancy & rook_map[square][1])<<1)-1) & rook_map[square][1]
    | ~(MSB(occupancy & rook_map[square][2])-1) & rook_map[square][2]
    | ((LSB(occupancy & rook_map[square][3])<<1)-1) & rook_map[square][3]);
}
```

2. **Bishop Movement Calculation**:
```cpp
usl bishop_attacks(int square, usl occupancy) {
    return (~(MSB(occupancy & bishop_map[square][0])-1) & bishop_map[square][0]
    | ((LSB(occupancy & bishop_map[square][1])<<1)-1) & bishop_map[square][1]
    | ~(MSB(occupancy & bishop_map[square][2])-1) & bishop_map[square][2]
    | ((LSB(occupancy & bishop_map[square][3])<<1)-1) & bishop_map[square][3]);
}
```

The sliding piece calculation uses the following techniques:
- Pre-computed attack tables for each square
- Efficient bitboard operations (MSB, LSB) for ray tracing
- Separate handling of each movement direction
- Occupancy consideration to handle piece blocking

3. **Queen Movement**:
Queens combine both rook and bishop movements:
```cpp
usl queen_attacks(int square, usl occupancy) {
    return rook_attacks(square, occupancy) | bishop_attacks(square, occupancy);
}
```

### Move Generation

The engine generates legal moves using:
- Pre-computed attack tables for non-sliding pieces (pawns, knights, kings)
- Dynamic calculation for sliding pieces based on current board occupation
- Special move handling (castling, en passant, promotions)
- Legal move filtering based on check detection

## Setup

1. Clone the repository:
```bash
git clone https://github.com/jatingaur18/Chess-Engine.git
```

2. Build the project:
```bash
make
```

## Usage

Run the chess engine:
```bash
./a
```
or
```bash
make run
```
to build and run 


The engine supports:
- FEN string input for position setup
- Move generation visualization
- Unicode piece display
- Performance metrics

## Project Structure

- `main.cpp` - Entry point and testing framework
- `board.cpp` - Core chess board implementation and move generation
- `utils.h` - Utility functions and constants
- `board.h` - Class declarations and bitboard definitions

