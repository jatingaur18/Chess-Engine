#pragma once
#include <string>
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

enum Piece {
    P, N, B, R, Q, K, p, n, b, r, q, k
};


enum Castling {
    WK = 1, WQ = 2, BK = 4, BQ = 8
};

class chessboard {
public:
    usl bitboard;
    usl pisces[12]={
        71776119061217280ULL, 
        4755801206503243776ULL,
        2594073385365405696ULL,
        9295429630892703744ULL,
        576460752303423488ULL,
        1152921504606846976ULL,
        65280ULL,
        66ULL,
        36ULL,
        129ULL,
        8ULL,
        16ULL
    };

    std::string unicode_pieces[12] = {"♟︎", "♞", "♝", "♜", "♛", "♚","♙", "♘", "♗", "♖", "♕", "♔"};

    int en_passant = -1;
    usl castling = WK | WQ | BK | BQ;
    usl color_bitboards[2];
    bool side= WHITE;
    int halfmove_clock = 0;
    int fullmove_number = 1;

    usl pawn_attacks_table[2][64];
    usl knight_attacks_table[64];
    usl king_attacks_table[64];

    chessboard();

    void FEN(std::string fen);



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

    void printPisces();


    usl pawn_attacks(Color color, int square) const;
    usl knight_attacks(int square) const;
    usl king_attacks(int square) const;
    usl rook_attacks(int square, usl occupancy) const;
    usl bishop_attacks(int square, usl occupancy) const;
    usl queen_attacks(int square, usl occupancy) const;

    usl sqs_attacked(Color color);
    bool is_sq_attacked(int square,Color color);

    void init_attack_tables();

    void generate_moves();

    void generate_pawn_moves(usl board, Color side);
    void generate_castling_moves(Color side);
    void generate_knight_moves(usl board, Color side);
    void generate_bishop_moves(usl board, Color side);
    void generate_rook_moves(usl board, Color side);
    void generate_queen_moves(usl board, Color side);
    void generate_king_moves(usl board, Color side);
};

inline usl LSB(usl x) { return x & -x; }
inline usl MSB(usl x) { return 1ULL << (63 - __builtin_clzll(x)); }
inline std::string index_to_square(int index) {
    std::string square = "";
    square += 'a' + (index % 8);
    square += '8' - (index / 8);
    return square;
} 