#include "board.h"
#include "utils.h"
#include "engine.h"
#include <sstream>
#include "vector"
using namespace std;

static inline int lsb_ind(usl bitboard) {
    if (bitboard) {
        return __builtin_ctzll(bitboard);
    }
    else {
        return -1;
    }
}

int weight[] = {100,300,300,500,1000,10000,-100,-300,-300,-500,-1000,-10000};

int board_eval(chessboard &cb) {
    int eval = 0;
    int source;

    for (int i = 0; i < 12; i++) {
        usl board = cb.pisces[i];
        while (board) {
            source = lsb_ind(board); // Get the least significant bit index
            int extra = piece_scores[i][source];
            // cout<< i<<" "<<source<<" "<<extra<<endl;
            eval += weight[i]  + extra;

            // Remove the bit from the board
            cb.remBit(source, board);
        }
    }
    return eval;
}