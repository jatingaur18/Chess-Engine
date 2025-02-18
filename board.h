#pragma once
#include <cstdint>
#include <iostream>

#define usl unsigned long long

// const files
constexpr usl FILE_A = 18374403900871474942ULL;
constexpr usl FILE_H = 9187201950435737471ULL;
constexpr usl FILE_GH = 4557430888798830399ULL;
constexpr usl FILE_AB = 18229723555195321596ULL;

enum Square {
    a8, b8, c8, d8, e8, f8, g8, h8,
    a7, b7, c7, d7, e7, f7, g7, h7,
    a6, b6, c6, d6, e6, f6, g6, h6,
    a5, b5, c5, d5, e5, f5, g5, h5,
    a4, b4, c4, d4, e4, f4, g4, h4,
    a3, b3, c3, d3, e3, f3, g3, h3,
    a2, b2, c2, d2, e2, f2, g2, h2,
    a1, b1, c1, d1, e1, f1, g1, h1
};

enum Color { WHITE, BLACK };

class chessboard {
public:
    usl bitboard;
    usl pawn_attacks_table[2][64];
    usl knight_attacks_table[64];

    chessboard();

    inline void setBit(int square, usl &board) {
        board |= (1ULL << square);
    }
    inline int getBit(int square, const usl &board) const {
        return (board & (1ULL << square)) ? 1 : 0;
    }
    inline void remBit(int square, usl &board) {
        board &= ~(1ULL << square);
    }
    inline void setBit(int square) { setBit(square, bitboard); }
    inline int getBit(int square) const { return getBit(square, bitboard); }
    inline void remBit(int square) { remBit(square, bitboard); }

    void printBoard(const usl &board) const;
    void printBoard() const { printBoard(bitboard); }

    usl pawn_attacks(Color color, int square) const;
    usl knight_attacks(int square) const;
    usl king_attacks(int square) const;
    usl rook_attacks(int square, usl occupancy) const;

    void init_attack_tables();
};

inline usl LSB(usl x) { return x & -x; }
inline usl MSB(usl x) { return 1ULL << (63 - __builtin_clzll(x)); }