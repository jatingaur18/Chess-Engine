
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
- [Task Checklist](#task-checklist)

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
- Pre-computed attack tables for each square  
- Efficient bitboard operations (MSB, LSB) for ray tracing  
- Separate handling of each movement direction  
- Occupancy consideration to handle piece blocking  

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

---

## Task Checklist

### Phase 0: Bitboard & Basic Setup
- [x] Bitboard Design  
- [x] Piece Representation  
- [x] Square Indexing  
- [x] Board Initialization  
- [x] FEN Parsing  

###  Phase 1: Core Move Generation
- [x] Pawn Moves  
- [x] Knight Moves  
- [x] King Moves  
- [x] Rook, Bishop, Queen Sliding Moves  
- [x] Precomputed Attack Tables  
- [x] Castling Logic  
- [x] En Passant Logic  
- [x] Promotion Handling  
- [x] Check Detection  
- [x] Legal Move Filtering  

###  Phase 2: Basic Search Framework
- [x] Minimax Search  
- [x] Alpha-Beta Pruning  
- [x] Evaluation Placeholder  

---

###  Phase 3: Move Ordering & Speed Boosts
- [x] MVV-LVA Ordering  
- [x] Killer Move Heuristic  
- [ ] Transposition Table (Zobrist Hashing)  

###  Phase 4: Tactical Stability
- [x] Quiescence Search  
- [ ] Static Exchange Evaluation (SEE)  
- [ ] Stand Pat Evaluation  

###  Phase 5: Advanced Pruning Techniques
- [ ] Principal Variation Search (PVS)  
- [ ] Late Move Reductions (LMR)  
- [ ] Null Move Pruning  
- [ ] Aspiration Windows  

###  Phase 6: Evaluation Upgrades
- [ ] Material Evaluation  
- [ ] Piece-Square Tables  
- [ ] King Safety Heuristics  
- [ ] Mobility Evaluation  
- [ ] Pawn Structure (Isolated, Passed, Doubled)  

###  Phase 7: Neural Network Integration
- [ ] Integrate Pretrained NNUE  
- [ ] Custom NNUE Model Training  
- [ ] Evaluation Layer Replacement with NNUE  

###  Phase 8: Endgame Perfection
- [ ] Endgame Heuristics  
- [ ] Syzygy Tablebase Support  
- [ ] Tablebase Probing  

###  Phase 9: Engine Optimization
- [ ] Time Management Logic  
- [ ] Multi-Threading (SMP Search)  
- [ ] Move Caching & Reuse  
- [ ] Benchmarking & Profiling  

###  Phase 10: Innovation & Learning
- [ ] Reinforcement Learning Pipeline (Leela Style)  
- [ ] Hybrid MCTS + AlphaBeta  
- [ ] Style Customization (Aggressive, Positional, Defensive)  