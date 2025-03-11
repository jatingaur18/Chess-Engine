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
    int en_passant = -1;
    usl castling = WK | WQ | BK | BQ;
    usl color_bitboards[2];
    Color side = WHITE;
    int halfmove_clock = 0;
    int fullmove_number = 1;

    usl pawn_attacks_table[2][64];
    usl knight_attacks_table[64];
    usl king_attacks_table[64];

    chessboard();

    void FEN(std::string fen);
    int make_move(int move,int move_flag,chessboard &cb_copy);
    void take_back(int move,int move_flag);
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
    bool is_sq_attacked(int square, Color color);

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

static inline void add_move(int move){
    moves->move_list[moves->count]=move;
    moves->count++;
}

static inline void move_print(int move){

    // uci standard move notation
    cout<<"| ";

    cout<<index_to_square(move_to_src(move));
    cout<<index_to_square(move_to_trg(move));
    cout<<prom_piece_list[move_to_prom(move)];
    cout<<"              | "<<unicode_pieces[move_to_piece(move)];
    cout<<"         | "<<move_to_cap(move);
    cout<<"           | "<<move_to_dpsh(move);
    cout<<"                | "<<move_to_enp(move);
    cout<<"              | "<<move_to_cast(move)<<"        |"<<endl;
}

static inline void print_move_list(){
    cout<<" _____________________________________________________________________________________________"<<endl;
    cout<<"| uci notation       | piece     | capture     | double push      | enpassent      | castling |"<<endl;
    cout<<"|____________________|___________|_____________|__________________|________________|__________|"<<endl;
    for(int i=0;i<moves->count;i++){
        move_print(moves->move_list[i]);
    }
    cout<<"|____________________|___________|_____________|__________________|________________|__________|"<<endl;
    cout<<"\n"<<endl;
    cout<<"Total no of moves : "<<moves->count<<endl;
    cout<<"\n"<<endl;

}

