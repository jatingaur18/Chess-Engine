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
int cunt=0;
typedef struct {
    usl hash_key;
    int depth;
    int flag;
    int score;
} tt;

vector<tt> transposition_table(4 << 16);
#define TableSize() transposition_table.size()

const int full_depth = 4;
const int reduced_depth = 3;
const int null_depth = 1;

int ply_length[MAX_PLY] = {0}; // Stores the length of the move list at each ply
int ply_move[MAX_PLY][MAX_PLY] = {0}; // Stores the move at each ply
int ply = 0; 
int killer_moves[2][MAX_PLY] = {0};  // Stores two killer moves per ply
int history_moves[12][MAX_PLY] = {0};  // Stores two killer moves per ply
int nodes_searched;

bool followup = false;
int scorepv = 0;


static inline int score(int move,chessboard &cb){
    if(scorepv){
        if(ply_move[0][ply] == move){
            scorepv = 0;

            return 20000;
        }
    }
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

static inline void sort_moves(moves_lst &moves,chessboard &cb){
    int move_scores[moves.count];
    
    for (int count = 0; count < moves.count; count++)
        // score move
        move_scores[count] = score(moves.move_list[count],cb);
    
    // loop over current move within a move list
    for (int current_move = 0; current_move < moves.count; current_move++){
        for (int next_move = current_move + 1; next_move < moves.count; next_move++){
            if (move_scores[current_move] < move_scores[next_move]){
                int temp_score = move_scores[current_move];
                move_scores[current_move] = move_scores[next_move];
                move_scores[next_move] = temp_score;
                
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

    if(ply>MAX_PLY-1){
        return evaluation;
    }

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
            
            if(score > alpha){
                alpha = score;
                if(score >= beta){
                    return beta;
                }
            }
        }
    }
    
    return alpha;
}





void empty_tt(){
    for(auto &i : transposition_table){
        i.hash_key = 0;
        i.depth = 0;
        i.flag = 0;
        i.score = 0;
    }
}


int ProbeHash(int depth, int alpha, int beta,usl key){

    tt * phashe = &transposition_table[key % TableSize()];

    if(phashe->hash_key == key) {
        if(phashe->depth >= depth) {
            if(phashe->flag == hash_exact)
                return phashe->score;
            if((phashe->flag == hash_alpha) && (phashe->score <= alpha))
                return alpha;
            if((phashe->flag == hash_beta) && (phashe->score >= beta))
                return beta;
        }
        // RememberBestMove();

    }

    return valUNKNOWN;

}

void RecordHash(int depth, int val, int hashf,usl key){
    cunt++;
    tt * phashe = &transposition_table[key % TableSize()];
    phashe->hash_key = key;
    phashe->score = val;
    phashe->flag = hashf;
    phashe->depth = depth;
}




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

static inline void enable_pv_score(moves_lst &moves){
    followup = false;
    for(int cnt=0; cnt < moves.count; cnt++){
        if(moves.move_list[cnt] == ply_move[0][ply]){
            followup = true;
            scorepv = 1;
        }
    }
}



static inline int negamax(chessboard &cb, int depth, int alpha, int beta) {

    
    ply_length[ply] = ply;
    
    if (depth == 0) {
        return quiescence(alpha,beta,cb);
    }

    if(ply>MAX_PLY-1){
        return board_eval(cb);
    }
    
    int flg = hash_alpha;
    int score;
    if(ply && (score = ProbeHash(depth, alpha, beta, cb.hash_board)) != valUNKNOWN){
        return score;
    }

    nodes_searched++;
    
    Color opp = cb.side==WHITE ? BLACK : WHITE;
    int in_check = cb.is_sq_attacked((cb.side == WHITE) ? lsb_ind(cb.pisces[K]) : lsb_ind(cb.pisces[k]),opp);
    if(in_check){
        depth++;
    }
    
    int legal_mov = 0;
    chessboard null_move_board;
    if(depth>=3 && !in_check && ply){
        null_move_board.deep_copy(cb);
        ply++;
        null_move_board.side = opp;

        if(cb.en_passant != -1){
            null_move_board.hash_board ^= cb.enp_keys[cb.en_passant];
        }

        null_move_board.en_passant = -1;
        null_move_board.hash_board ^= cb.side_key;
        
        int null_score = -negamax(null_move_board, depth-1-2, -beta, -beta+1);
        
        ply--;

        if(null_score >= beta){
            return beta;
        }

    }

    int check = cb.is_sq_attacked(lsb_ind(cb.pisces[5 + 6 * (cb.side == BLACK)]), cb.side == WHITE ? BLACK : WHITE);
    
    moves_lst moves;
    cb.generate_moves(moves);
    if(followup){
        enable_pv_score(moves);
    }
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
    
    int mov_srch = 0;
    
    for (int i = 0; i < moves.count; i++) {
        chessboard cb_after_move;
        cb_after_move.deep_copy(cb);
        if (cb_after_move.make_move(moves.move_list[i], 1, cb_after_move)) {
            legal_mov++;
            ply++;
            if(mov_srch == 0){
                score = -negamax(cb_after_move, depth - 1, -beta, -alpha);
            }
            else{
                if(mov_srch>=full_depth && depth >= reduced_depth && !in_check){
                    score = -negamax(cb_after_move, depth - 2, -alpha-1, -alpha);
                }
                else{
                    score=alpha+1;
                }
                if(score > alpha){
                    score = -negamax(cb_after_move, depth - 1, -alpha-1, -alpha);
                    if(score > alpha && score < beta){
                        score = -negamax(cb_after_move, depth - 1, -beta, -alpha);
                    }
                }
            }
            
            ply--;
            mov_srch++;

            
            if (score > alpha) {
                flg = hash_exact;
                ply_move[ply][ply] = moves.move_list[i];
                for(int ply_n = ply+1; ply_n < ply_length[ply+1]; ply_n++){
                    ply_move[ply][ply_n] = ply_move[ply+1][ply_n];
                }
                ply_length[ply] = ply_length[ply+1];
                history_moves[move_to_piece(moves.move_list[i])][move_to_trg(moves.move_list[i])] += depth * depth;

                alpha = score;

                if (score >= beta) {
                    RecordHash(depth, beta, hash_beta, cb.hash_board);
                    if(!move_to_cap(moves.move_list[i])){
                        killer_moves[1][ply] = killer_moves[0][ply];
                        killer_moves[0][ply] = moves.move_list[i];
                    }
                    return beta;
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
    RecordHash(depth, alpha, flg, cb.hash_board);

    return alpha;
}

static inline string parse_move(int best){
    string best_move = index_to_square(move_to_src(best)) + index_to_square(move_to_trg(best));
    if (move_to_prom(best)) {
        best_move += prom_piece_list[move_to_prom(best)];
    }
    return best_move;
}

string search_position(chessboard& cb, int depth) {
    // cout<<sizeof(tt)<<endl;
    ply = 0;
    nodes_searched = 0;

    memset(ply_length, 0, sizeof(ply_length));
    memset(ply_move, 0, sizeof(ply_move));
    memset(killer_moves, 0, sizeof(killer_moves));
    memset(history_moves, 0, sizeof(history_moves));
    // empty_tt();

    int alpha = -50000;
    int beta = 50000; 
    for(int c_depth=1;c_depth<=depth;c_depth++){
        scorepv = 0;
        followup=true;
        ply = 0;
        int score = negamax(cb, c_depth, alpha, beta);

        if(score<=alpha || score>=beta){
            alpha = -50000;
            beta = 50000;
            continue;
        }

        alpha = score - 50;
        beta = score + 50;






        // for(int c=0;c<ply_length[0];c++){
        //     string mov = parse_move(ply_move[0][c]);
        //     cout << mov << " "; 
        // }
        // cout<<nodes_searched<<" ";
        // cout << endl;
    }

    string best_move = parse_move(ply_move[0][0]);
    // cout << "bestmove " << best_move ;
    // // cout<< " nodes searched " << nodes_searched;
    // cout << endl;
    // cout<<"tt push -> "<<cunt<<endl;
    return best_move;




    // memset(ply_length, 0, sizeof(ply_length));
    // memset(ply_move, 0, sizeof(ply_move));
    // memset(killer_moves, 0, sizeof(killer_moves));
    // memset(history_moves, 0, sizeof(history_moves));

    // followup = false;
    // scorepv = 0;
    // nodes_searched = 0;
    // ply = 0;
    
    // int score = negamax(cb, depth, -50000, 50000);
    
    // for(int c=0;c<ply_length[0];c++){
    //     string mov = parse_move(ply_move[0][c]);
    //     cout << mov << " "; 
    // }
    // cout << endl;

}