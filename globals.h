#pragma once
using namespace std;
#ifdef WIN64
    #include <windows.h>
#else
    #include <sys/time.h>
#endif
#include <cstring>

struct moves_lst {
    struct move {
        int move;
        int score;
    };
    move move_list[256];
    int count = 0;
};

// Define the global variable with inline to allow multiple inclusion
// inline moves_lst moves[1];



#define move_encoding(source,target,piece,promotion_piece,capture,double_push,en_passant,castling) \
((source) | (target<<6) | (piece << 12) | (promotion_piece <<16 ) | (capture << 20) |  \
(double_push << 21) | (en_passant << 22) | (castling << 23))

#define move_to_src(move) (move & 0x3f)
#define move_to_trg(move) ((move & 0xfc0)>>6)
#define move_to_piece(move) ((move & 0xf000)>>12)
#define move_to_prom(move) ((move & 0xf0000)>>16)
#define move_to_cap(move) ((move & 0x100000)>>20)
#define move_to_dpsh(move) ((move & 0x200000)>>21) 
#define move_to_enp(move) ((move & 0x400000)>>22)
#define move_to_cast(move) ((move & 0x800000)>>23)

// copy a board state
// #define preserve(cb_copy,cb) memcpy(&cb_copy,&cb,2200);


// const files
constexpr usl FILE_A = 18374403900871474942ULL;
constexpr usl FILE_H = 9187201950435737471ULL;
constexpr usl FILE_GH = 4557430888798830399ULL;
constexpr usl FILE_AB = 18229723555195321596ULL;

constexpr int castling_rights[64] = {
    7,  15, 15, 15, 3, 15, 15,  11,
    15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15,
    13, 15, 15, 15, 12, 15, 15, 14
};


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


const string prom_piece_list= " nbrqk nbrqk";// for uci 

enum Castling {
    WK = 1, WQ = 2, BK = 4, BQ = 8
};

// extern moves_lst moves[1];