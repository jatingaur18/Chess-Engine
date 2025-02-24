# Sliding Pieces Move Generation Optimization

## Overview

The chess engine implements a highly optimized system for calculating sliding piece moves (rooks, bishops, and queens) using pre-computed attack tables and efficient bitboard operations.

## Key Components

### 1. Pre-computed Attack Tables

The engine uses two major pre-computed lookup tables:
- `rook_map[64][4]`: Contains attack rays for rooks from each square
- `bishop_map[64][4]`: Contains attack rays for bishops from each square

These tables are defined as constant arrays to avoid runtime computation:

```cpp
constexpr usl rook_map[64][4];   // Pre-computed rook attack rays
constexpr usl bishop_map[64][4]; // Pre-computed bishop attack rays
```

### 2. Ray Direction Encoding

Each sliding piece's movement is broken down into four directions:
- For Rooks: North, East, South, West
- For Bishops: Northeast, Southeast, Southwest, Northwest

This is reflected in the [4] dimension of the lookup tables.

## Implementation Details

### 1. Rook Movement Optimization

```cpp
usl rook_attacks(int square, usl occupancy) {
    return (~(MSB(occupancy & rook_map[square][0])-1) & rook_map[square][0]
    | ((LSB(occupancy & rook_map[square][1])<<1)-1) & rook_map[square][1]
    | ~(MSB(occupancy & rook_map[square][2])-1) & rook_map[square][2]
    | ((LSB(occupancy & rook_map[square][3])<<1)-1) & rook_map[square][3]);
}
```

Key optimizations:
1. **Ray Masking**: Uses pre-computed rays (`rook_map`) to limit move generation to valid directions
2. **Blocker Detection**: Uses bitwise AND (`&`) with occupancy to find blocking pieces
3. **Move Generation**: Combines MSB/LSB operations to efficiently generate moves up to the first blocker

### 2. Bishop Movement Optimization

```cpp
usl bishop_attacks(int square, usl occupancy) {
    return (~(MSB(occupancy & bishop_map[square][0])-1) & bishop_map[square][0]
    | ((LSB(occupancy & bishop_map[square][1])<<1)-1) & bishop_map[square][1]
    | ~(MSB(occupancy & bishop_map[square][2])-1) & bishop_map[square][2]
    | ((LSB(occupancy & bishop_map[square][3])<<1)-1) & bishop_map[square][3]);
}
```

Similar optimizations as rooks, but along diagonal paths.

### 3. Queen Movement Optimization

Queens combine both rook and bishop movements:
```cpp
usl queen_attacks(int square, usl occupancy) {
    return rook_attacks(square, occupancy) | bishop_attacks(square, occupancy);
}
```

## Optimization Techniques

1. **Bitboard Operations**
   - MSB (Most Significant Bit) for finding blocking pieces in positive directions
   - LSB (Least Significant Bit) for finding blocking pieces in negative directions
   - Bitwise operations for efficient move generation

2. **Pre-computation Benefits**
   - Attack rays are computed once at compile-time
   - No runtime ray calculation needed
   - Constant-time lookup for base move patterns

3. **Memory-Speed Tradeoff**
   - Uses more memory (two 64×4 lookup tables)
   - Significantly faster than calculating rays at runtime
   - Efficient cache usage due to sequential memory access

## Performance Characteristics

1. **Time Complexity**
   - Move generation: O(1) per piece
   - No iteration over squares needed
   - Constant-time lookup regardless of board position

2. **Space Complexity**
   - Rook table: 64 * 4 * 8 bytes = 2KB
   - Bishop table: 64 * 4 * 8 bytes = 2KB
   - Total pre-computed data: 4KB

## Implementation Benefits

1. **Maintainability**
   - Clear separation of movement patterns
   - Easy to debug with separate functions for each piece type
   - Modular design allows for easy modifications

2. **Reliability**
   - Pre-computed tables eliminate runtime calculation errors
   - Consistent behavior across all board positions
   - Easy to verify correctness through testing

3. **Efficiency**
   - Minimal CPU operations per move generation
   - Efficient use of CPU cache
   - No complex calculations at runtime

## Usage Example

```cpp
// Generate all legal moves for a queen at square e4
int square = e4;
usl occupancy = current_board_state;
usl queen_moves = queen_attacks(square, occupancy);

// Filter moves that don't put own king in check
queen_moves &= ~own_pieces;
```