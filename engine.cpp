#include "board.h"
#include "utils.h"
#include "engine.h"
#include <sstream>
#include <algorithm>
#include <vector>
#include <algorithm>
#include <utility>  
using namespace std;


#define MAX_PLY 64

// vector<tt> transposition_table(4 << 20); // 4MB
// #define TableSize() transposition_table.size()

int ply = 0; 
int best; 
int killer_moves[2][MAX_PLY] = {0};  // Stores two killer moves per ply
int history_moves[12][MAX_PLY] = {0};  // Stores two killer moves per ply
int nodes_searched;


static inline int score(int move,chessboard &cb){
    if(move_to_cap(move)){
        int target=P;
        int ts= move_to_trg(move);
        int s = P;
        int e = K;
        if(cb.side == WHITE){
            s=p;
            e=k;
        }
        for(int i=s;i<=e;i++){
            if(cb.getBit(ts,cb.pisces[i])){
                target=i;
                break;
            }
        }
        
        return mvv_lva[move_to_piece(move)][target]+10000;
    }
    else{
        if(killer_moves[0][ply] == move){
            return 9000;
        }
        else if(killer_moves[1][ply]==move){
            return 8000;
        }
        else{
            return history_moves[move_to_piece(move)][move_to_trg(move)];
        }

    }
    return 0;
}


// static inline void sort_moves(moves_lst &moves, chessboard &cb) {
//     // 1) Build a vector of (score, move) pairs
//     std::vector<std::pair<int,int>> scored;
//     scored.reserve(moves.count);
//     for (int i = 0; i < moves.count; ++i) {
//         scored.emplace_back(
//             score(moves.move_list[i], cb),  // compute score once
//             moves.move_list[i]              // store move
//         );
//     }

//     // 2) Sort descending by score (Introsort: O(n log n) on average)
//     std::stable_sort(
//         scored.begin(), scored.end(),
//         [](auto &a, auto &b) { return a.first > b.first; }
//     );

//     // 3) Unpack back into moves.move_list
//     for (int i = 0; i < moves.count; ++i) {
//         moves.move_list[i] = scored[i].second;
//     }
// }

static inline void sort_moves(moves_lst &moves,chessboard &cb)
{
    // move scores
    int move_scores[moves.count];
    
    // score all the moves within a move list
    for (int count = 0; count < moves.count; count++)
        // score move
        move_scores[count] = score(moves.move_list[count],cb);
    
    // loop over current move within a move list
    for (int current_move = 0; current_move < moves.count; current_move++)
    {
        // loop over next move within a move list
        for (int next_move = current_move + 1; next_move < moves.count; next_move++)
        {
            // compare current and next move scores
            if (move_scores[current_move] < move_scores[next_move])
            {
                // swap scores
                int temp_score = move_scores[current_move];
                move_scores[current_move] = move_scores[next_move];
                move_scores[next_move] = temp_score;
                
                // swap moves
                int temp_move = moves.move_list[current_move];
                moves.move_list[current_move] = moves.move_list[next_move];
                moves.move_list[next_move] = temp_move;
            }
        }
    }
}


static inline int quiescence(int alpha, int beta,chessboard &cb){
    int evaluation = board_eval(cb);
    nodes_searched++;
    if(evaluation >= beta){
        return beta;
    }
    if(evaluation > alpha){
        alpha = evaluation;
    }
    
    moves_lst moves;
    
    cb.generate_moves(moves);
    sort_moves(moves,cb);

    
    chessboard cb_after_move;
    for(int count = 0; count < moves.count; count++){        
        if(!move_to_cap(moves.move_list[count])){
            continue;
        }
        cb_after_move.deep_copy(cb);
        if(cb_after_move.make_move(moves.move_list[count], 1, cb_after_move)){
            ply++;
            int score = -quiescence(-beta, -alpha, cb_after_move);
            ply--;
            if(score >= beta){
                return beta;
            }
            if(score > alpha){
                alpha = score;
            }
        }
    }
    
    return alpha;
}





// void empty_tt(){
//     for(auto &i : transposition_table){
//         i.hash_key = 0;
//         i.depth = 0;
//         i.flag = 0;
//         i.score = 0;
//     }
// }


// int ProbeHash(int depth, int alpha, int beta,usl key){

//     tt * phashe = &transposition_table[key % TableSize()];

//     if (phashe->hash_key == key) {
//         if (phashe->depth >= depth) {
//             if (phashe->flag == hash_exact)
//                 return phashe->score;
//             if ((phashe->flag == hash_alpha) &&
//                 (phashe->score <= alpha))
//                 return alpha;
//             if ((phashe->flag == hash_beta) && (phashe->score >= beta))
//                 return beta;
//         }
//         // RememberBestMove();

//     }

//     return valUNKNOWN;

// }

// void RecordHash(int depth, int val, int hashf,usl key){

//     tt * phashe = &transposition_table[key % TableSize()];
//     phashe->hash_key = key;
//     phashe->score = val;
//     phashe->flag = hashf;
//     phashe->depth = depth;
// }




int lsb_ind(usl bitboard) {
    if (bitboard) {
        return __builtin_ctzll(bitboard);
    }
    else {
        return -1;
    }
}

int weight[] = {100,300,300,500,1000,10000,-100,-300,-300,-500,-1000,-10000};


//------------NOT MINE------------//
// WILL BE REPLACED BY NNUE LATER //
int board_eval(chessboard &cb){
    int score = 0;
    usl bitboard;
    int piece, square;
    
    for(int bb_piece = P; bb_piece <= k; bb_piece++){
        bitboard = cb.pisces[bb_piece];
        
        while(bitboard){
            piece = bb_piece;
            square = lsb_ind(bitboard);
            score += material_score[piece];
            switch (piece){
                case P: score += pawn_score[square]; break;
                case N: score += knight_score[square]; break;
                case B: score += bishop_score[square]; break;
                case R: score += rook_score[square]; break;
                case K: score += king_score[square]; break;

                case p: score -= pawn_score[mirror_score[square]]; break;
                case n: score -= knight_score[mirror_score[square]]; break;
                case b: score -= bishop_score[mirror_score[square]]; break;
                case r: score -= rook_score[mirror_score[square]]; break;
                case k: score -= king_score[mirror_score[square]]; break;
            }
            
            
            cb.remBit(square,bitboard);
        }
    }
    return (cb.side == WHITE) ? score : -score;
}



static inline int negamax(chessboard &cb, int depth, int alpha, int beta) {

    // bool found_pv=false;
    bool found = false;

    int flg = hash_alpha;
    int score;

    if (depth == 0) {
        return quiescence(alpha,beta,cb);
    }

    nodes_searched++;
    
    Color opp = cb.side==WHITE ? BLACK : WHITE;
    int in_check = cb.is_sq_attacked((cb.side == WHITE) ? lsb_ind(cb.pisces[K]) : lsb_ind(cb.pisces[k]),opp);
    if(in_check){
        depth++;
    }
    
    int best_now = 0;
    int alpha_o = alpha;
    int legal_mov = 0;

    int check = cb.is_sq_attacked(lsb_ind(cb.pisces[5 + 6 * (cb.side == BLACK)]), cb.side == WHITE ? BLACK : WHITE);
    
    moves_lst moves;
    cb.generate_moves(moves);
    sort_moves(moves,cb);

    // Assign scores to killer moves
    // for (int i = 0; i < moves.count; i++) {
    //     int move = moves.move_list[i];
    //     if (move == killer_moves[ply][0]) {
    //         moves.move_list[i] = 9000;  // First killer
    //     } else if (move == killer_moves[ply][1]) {
    //         moves.move_list[i] = 8000;  // Second killer
    //     }
    // }


    for (int i = 0; i < moves.count; i++) {
        chessboard cb_after_move;
        cb_after_move.deep_copy(cb);
        if (cb_after_move.make_move(moves.move_list[i], 1, cb_after_move)) {
            legal_mov++;
            ply++;
            if (found) {
                // Search subsequent moves with null window
                score = -negamax(cb_after_move, depth - 1, -alpha - 1, -alpha);
                if (score > alpha && score < beta) {
                    // Re-search with full window if the null window score indicates a potential better move
                    score = -negamax(cb_after_move, depth - 1, -beta, -alpha);
                }
            } 
            else {
                // Search the first move with full window
                score = -negamax(cb_after_move, depth - 1, -beta, -alpha);
                // found = false;
            }
            ply--;
            if (score >= beta) {
                killer_moves[1][ply] = killer_moves[0][ply];
                killer_moves[0][ply] = moves.move_list[i];
                return beta;
            }
            if (score > alpha) {
                // found=true;
                flg = hash_exact;

                history_moves[move_to_piece(moves.move_list[i])][move_to_trg(moves.move_list[i])] += depth * depth;

                alpha = score;
                if (ply == 0) {
                    best_now = moves.move_list[i];
                }
            }
        }
    }
    //218,244   157656
    if (legal_mov == 0) {
        if (check) {
            return -49000 + ply;
        } else {
            return 0;
        }
    }
    if (alpha_o != alpha) {
        best = best_now;
    }
    return alpha;
}

void search_position(chessboard& cb, int depth) {
    ply = 0;
    best = 0;
    nodes_searched = 0;
    for (int p = 0; p < MAX_PLY; p++) {
        killer_moves[0][p] = 0;
        killer_moves[1][p] = 0;
    }
    int score = negamax(cb, depth, -50000, 50000);
    if (best) {
        string best_move = index_to_square(move_to_src(best)) + index_to_square(move_to_trg(best));
        if (move_to_prom(best)) {
            best_move += prom_piece_list[move_to_prom(best)];
        }
        cout << "bestmove " << best_move << " nodes searched " << nodes_searched << endl;
    }
}