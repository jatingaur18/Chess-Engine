#include "board.h"
#include "utils.h"
#include "engine.h"
#include <sstream>
#include "vector"
#include <algorithm>
using namespace std;


#define MAX_PLY 64
int killer_moves[MAX_PLY][2] = {0};  // Stores two killer moves per ply


int lsb_ind(usl bitboard) {
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
            source = lsb_ind(board); 
            int extra = piece_scores[i][source];
            // cout<< i<<" "<<source<<" "<<extra<<endl;
            eval += weight[i]  + extra;

            // Remove the bit from the board
            cb.remBit(source, board);
        }
    }
    return (cb.side == WHITE) ? eval : -eval;
}

int ply = 0; 
int best; 

static inline int negamax(chessboard &cb, int depth, int alpha, int beta) {
    if (depth == 0) {
        return board_eval(cb);
    }
    int best_now = 0;
    int alpha_o = alpha;

    int legal_mov=0;

    int check = cb.is_sq_attacked(lsb_ind(cb.pisces[5+6*(cb.side==BLACK)]),cb.side==WHITE ? BLACK : WHITE);
    
    moves_lst moves;
    cb.generate_moves(moves);

    for (int i = 0; i < moves.count; i++) {
        int move = moves.move_list[i].move;
        if (move == killer_moves[ply][0]) {
            moves.move_list[i].score = 9000;  // First killer
        } else if (move == killer_moves[ply][1]) {
            moves.move_list[i].score = 8000;  // Second killer
        }
    }
    std::sort(moves.move_list, moves.move_list + moves.count,
        [](const moves_lst::move &a, const moves_lst::move &b) {
            return a.score > b.score;
        });



    for (int i = 0; i < moves.count; i++) {
        chessboard cb_after_move;
        cb_after_move.deep_copy(cb);
        if (cb_after_move.make_move(moves.move_list[i].move, 1, cb_after_move)) {
            legal_mov++;
            ply++;
            int score = -negamax(cb_after_move, depth - 1, -beta, -alpha);
            ply--;
            if (score >= beta) {
                if (moves.move_list[i].score == 0) {  // Adjust threshold based on your capture scores
                    // Shift killers: second becomes first, new move becomes first
                    killer_moves[ply][1] = killer_moves[ply][0];
                    killer_moves[ply][0] = moves.move_list[i].move;
                }
                return beta;
            }
            if (score > alpha) {
                alpha = score;
                if (ply == 0) {
                    best_now = moves.move_list[i].move;
                }
            }
        }
    }
    if(legal_mov == 0) {
        if (check) {
            return -49000 + ply;
        } else {
            return 0;
        }
    }
    if (alpha_o != alpha && ply == 0) {
        best = best_now;
    }
    return alpha;
}

void search_position(chessboard& cb, int depth) {
    ply = 0;
    best=0;
    for (int p = 0; p < MAX_PLY; p++) {
        killer_moves[p][0] = 0;
        killer_moves[p][1] = 0;
    }
    int score = negamax(cb, depth, -50000, 50000);
    if(best){
        string best_move = index_to_square(move_to_src(best)) + index_to_square(move_to_trg(best));
        if (move_to_prom(best)) {
            best_move += prom_piece_list[move_to_prom(best)];
        }
        cout << "bestmove " << best_move << endl;
    }
}