#include "board.h"
#include "utils.h"
#include <iostream>
using namespace std;

chessboard::chessboard() : bitboard(0ULL) {
    init_attack_tables();
}

void chessboard::printBoard(const usl &board) const {
    std::cout << "\n";
    for (int rank = 0; rank < 8; rank++) {
        std::cout << 8 - rank << "  ";
        for (int file = 0; file < 8; file++) {
            int square = rank * 8 + file;
            std::cout << " " << getBit(square, board);
        }
        std::cout << "\n";
    }
    std::cout << "\n    a b c d e f g h\n\n";
    std::cout << "Bitboard: " << board << "\n";
}

usl chessboard::pawn_attacks(Color color, int square) const {
    usl pawn = 1ULL << square;
    if (color) {
        return ((pawn << 7) & FILE_H) | ((pawn << 9) & FILE_A);
    } else {
        return ((pawn >> 9) & FILE_H) | ((pawn >> 7) & FILE_A);
    }
}

usl chessboard::knight_attacks(int square) const {
    usl knight = 1ULL << square;
    usl attacks = ((knight & FILE_AB) << 6) | ((knight & FILE_A) << 15) |
                  ((knight & FILE_H) << 17) | ((knight & FILE_GH) << 10) |
                  ((knight & FILE_GH) >> 6) | ((knight & FILE_H) >> 15) |
                  ((knight & FILE_A) >> 17) | ((knight & FILE_AB) >> 10);
    return attacks;
}

usl chessboard::king_attacks(int square) const {
  usl king = 1ULL << square;
    return ((king << 8)|(king >> 8)|((king << 1) & FILE_A)|((king >> 1) & FILE_H)
            |((king << 9) & FILE_A)|((king << 7) & FILE_H)|((king >> 7) & FILE_A)
            |((king >> 9) & FILE_H));
}

usl chessboard::rook_attacks(int square, usl occupancy) const {
    return (~(MSB(occupancy & rook_map[square][0])-1)& rook_map[square][0]
    | ((LSB(occupancy & rook_map[square][1])<<1)-1)& rook_map[square][1]
    | ~(MSB(occupancy & rook_map[square][2])-1)& rook_map[square][2]
    | ((LSB(occupancy & rook_map[square][3])<<1)-1)& rook_map[square][3]);
}

void chessboard::init_attack_tables() {
    for (int sq = 0; sq < 64; sq++) {
        pawn_attacks_table[WHITE][sq] = pawn_attacks(WHITE, sq);
        pawn_attacks_table[BLACK][sq] = pawn_attacks(BLACK, sq);
        knight_attacks_table[sq] = knight_attacks(sq);
        // king_attacks_table[sq] = king_attacks(sq); // if needed
    }
}