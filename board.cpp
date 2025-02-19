#include <bits/stdc++.h>
#include <iostream>
#include "board.h"
#include "utils.h"
using namespace std;

chessboard::chessboard() : bitboard(18446462598732906495ULL) {
    init_attack_tables();
}
void chessboard::printPisces() {
    vector<vector<string>> board(8, vector<string>(8, "."));
    for (int i = 0; i < 12; i++) {
        for (int j = 0; j < 64; j++) {
            if (getBit(j, pisces[i])) {
                board[j/8][j%8] = unicode_pieces[i];
            }
        }
    }

    std::cout << "\n";
    for (int rank = 0; rank < 8; rank++) {
        std::cout << 8 - rank << "  ";
        for (int file = 0; file < 8; file++) {
            std::cout << " " << board[rank][file];
        }
        std::cout << "\n";
    }
    std::cout << "\n    a b c d e f g h\n\n";

    std::cout << "Side to move: " << (side_to_move == WHITE ? "White" : "Black") << "\n";
    std::cout << "Castling rights: " << (castling & WK ? "K" : "") << (castling & WQ ? "Q" : "") << (castling & BK ? "k" : "") << (castling & BQ ? "q" : "") << "\n";
    std::cout << "En passant square: " << (LSB(en_passant))<< "\n";
    std::cout << "Halfmove clock: " << halfmove_clock << "\n";
    std::cout << "Fullmove number: " << fullmove_number << "\n";
    std::cout << "\n";
}

void chessboard::FEN(std::string fen) {
    // Reset the board
    for(auto &i : pisces) i = 0ULL;
    bitboard = 0ULL;
    en_passant = 0ULL;
    castling = 0;
    halfmove_clock = 0;
    fullmove_number = 1;
    side_to_move = WHITE;

    std::istringstream iss(fen);
    std::string piece_placement, active_color, castling_rights, en_passant_target, halfmove_clock_str, fullmove_number_str;

    // Read FEN fields
    iss >> piece_placement >> active_color >> castling_rights >> en_passant_target >> halfmove_clock_str >> fullmove_number_str;

    // Parse piece placement
    int rank = 0;
    int file = 0;
    for (char c : piece_placement) {
        if (c == '/') {
            rank++;
            file = 0;
        } else if (isdigit(c)) {
            file += c - '0';
        } else {
            int piece = -1;
            switch (c) {
                case 'P': piece = 0; break;
                case 'N': piece = 1; break;
                case 'B': piece = 2; break;
                case 'R': piece = 3; break;
                case 'Q': piece = 4; break;
                case 'K': piece = 5; break;
                case 'p': piece = 6; break;
                case 'n': piece = 7; break;
                case 'b': piece = 8; break;
                case 'r': piece = 9; break;
                case 'q': piece = 10; break;
                case 'k': piece = 11; break;
            }
            setBit(rank * 8 + file, pisces[piece]);
            file++;
        }
    }

    // Parse active color
    side_to_move = (active_color == "w") ? WHITE : BLACK;

    // Parse castling rights
    for (char c : castling_rights) {
        switch (c) {
            case 'K': castling |= WK; break;
            case 'Q': castling |= WQ; break;
            case 'k': castling |= BK; break;
            case 'q': castling |= BQ; break;
        }
    }

    // Parse en passant target square
    if (en_passant_target != "-") {
        int file = en_passant_target[0] - 'a';
        int rank = en_passant_target[1] - '1';
        en_passant = 1ULL << (rank * 8 + file);
    }

    // Parse halfmove clock
    halfmove_clock = std::stoi(halfmove_clock_str);

    // Parse fullmove number
    fullmove_number = std::stoi(fullmove_number_str);
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

usl chessboard::bishop_attacks(int square, usl occupancy) const {
  return (~(MSB(occupancy & bishop_map[square][0])-1)& bishop_map[square][0]
  | ((LSB(occupancy & bishop_map[square][1])<<1)-1)& bishop_map[square][1]
  | ~(MSB(occupancy & bishop_map[square][2])-1)& bishop_map[square][2]
  | ((LSB(occupancy & bishop_map[square][3])<<1)-1)& bishop_map[square][3]);
}

void chessboard::init_attack_tables() {
    for (int sq = 0; sq < 64; sq++) {
        pawn_attacks_table[WHITE][sq] = pawn_attacks(WHITE, sq);
        pawn_attacks_table[BLACK][sq] = pawn_attacks(BLACK, sq);
        knight_attacks_table[sq] = knight_attacks(sq);
        // king_attacks_table[sq] = king_attacks(sq); // if needed
    }
}