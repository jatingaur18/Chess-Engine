#pragma once
#include <string>
#include <cstdint>
#include <iostream>

#define usl unsigned long long

#include "globals.h"

extern std::string unicode_pieces[12];



class chessboard {
public:
    usl bitboard;
    usl pisces[12] = {
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
    usl castling = WK | WQ | BK | BQ;
    usl color_bitboards[2];
    
    int en_passant = -1;
    int halfmove_clock = 0;
    int fullmove_number = 1;
    int get_piece_at(int square) const;
    
    Color side = WHITE;
    
    
    usl piece_keys[12][64];
    usl enp_keys[64];
    usl cst_keys[16];
    usl side_key;
    
    usl hash_board = 0ULL;
    usl pawn_attacks_table[2][64];
    usl knight_attacks_table[64];
    usl king_attacks_table[64];

    chessboard();

    void FEN(std::string fen);
    int make_move(int move, int move_flag, chessboard &cb_copy);
    void take_back(int move, int move_flag);
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
    inline void deep_copy(const chessboard& source) {
        std::memcpy(this, &source, offsetof(chessboard, pawn_attacks_table));
    }

    void printPisces();

    usl pawn_attacks(Color color, int square) const;
    usl knight_attacks(int square) const;
    usl king_attacks(int square) const;
    usl rook_attacks(int square, usl occupancy) const;
    usl bishop_attacks(int square, usl occupancy) const;
    usl queen_attacks(int square, usl occupancy) const;
    
    usl sqs_attacked(Color color);
    bool is_sq_attacked(int square, Color color);
    
    void init_attack_tables();
    
    void generate_moves(moves_lst &moves);
    
    void generate_pawn_moves(usl board, Color side, moves_lst &moves);
    void generate_castling_moves(Color side, moves_lst &moves);
    void generate_knight_moves(usl board, Color side, moves_lst &moves);
    void generate_bishop_moves(usl board, Color side, moves_lst &moves);
    void generate_rook_moves(usl board, Color side, moves_lst &moves);
    void generate_queen_moves(usl board, Color side, moves_lst &moves);
    void generate_king_moves(usl board, Color side, moves_lst &moves);
    
    void init_zobrist_keys();
    void init_hash();
    bool hash_test();
};

inline usl LSB(usl x) { return x & -x; }
inline usl MSB(usl x) { return 1ULL << (63 - __builtin_clzll(x)); }
inline std::string index_to_square(int index) {
    std::string square = "";
    square += 'a' + (index % 8);
    square += '8' - (index / 8);
    return square;
}

static inline void add_move(int move, moves_lst &moves, int score = 0) {
    moves.move_list[moves.count].move = move;
    moves.move_list[moves.count].score = score;
    moves.count++;
}

static inline void move_print(int move) {
    cout << "| ";
    cout << index_to_square(move_to_src(move));
    cout << index_to_square(move_to_trg(move));
    cout << prom_piece_list[move_to_prom(move)];
    cout << "              | " << unicode_pieces[move_to_piece(move)];
    cout << "         | " << move_to_cap(move);
    cout << "           | " << move_to_dpsh(move);
    cout << "                | " << move_to_enp(move);
    cout << "              | " << move_to_cast(move) << "        |";
}

static inline void print_move_list(moves_lst &moves) {
    cout << " ________________________________________________________________________________________________________" << endl;
    cout << "| uci notation       | piece     | capture     | double push      | enpassent      | castling |  score   |" << endl;
    cout << "|____________________|___________|_____________|__________________|________________|__________|__________|" << endl;
    for (int i = 0; i < moves.count; i++) {
        move_print(moves.move_list[i].move);
        cout<<"      "<<moves.move_list[i].score<<endl;
    }
    cout << "|____________________|___________|_____________|__________________|________________|__________|__________|" << endl;
    cout << "\n" << endl;
    cout << "Total no of moves : " << moves.count << endl;
    cout << "\n" << endl;
}
