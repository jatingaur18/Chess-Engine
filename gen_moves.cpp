#include "board.h"
#include "utils.h"

using namespace std;



static inline int lsb_ind(usl bitboard) {
    if (bitboard) {
        return __builtin_ctzll(bitboard);
    }
    else {
        return -1;
    }
}

void chessboard::generate_pawn_moves(usl board, Color side) {
    int source, target;
    while (board) {
        source = lsb_ind(board);
        //#define move_encoding(source,target,piece,promotion_piece,capture,double_push,en_passant,castling) 
        target = side == WHITE ? source - 8 : source + 8;
        string s = index_to_square(source);
        if (target >= 0 && target < 64 && !getBit(target)) {
            if ((side == WHITE && target <= h8) || (side == BLACK && target >= a1)) {
                add_move(move_encoding(source,target,P+6*(side==BLACK),N+6*(side==BLACK),0,0,0,0));
                add_move(move_encoding(source,target,P+6*(side==BLACK),B+6*(side==BLACK),0,0,0,0));
                add_move(move_encoding(source,target,P+6*(side==BLACK),R+6*(side==BLACK),0,0,0,0));
                add_move(move_encoding(source,target,P+6*(side==BLACK),Q+6*(side==BLACK),0,0,0,0));
            } else {
                add_move(move_encoding(source,target,P,0,0,0,0,0));
                if ((side == WHITE && source >= a2 && source <= h2 && target - 8 >= 0 && !getBit(target - 8)) ||
                    (side == BLACK && source >= a7 && source <= h7 && target + 8 < 64 && !getBit(target + 8))) {
                    add_move(move_encoding(source,target - 8 + side*(16),P,0,0,1,0,0));
                }
            }
        }

        usl attack = pawn_attacks_table[side][source] & color_bitboards[!side];
        while (attack) {
            target = lsb_ind(attack);
            if ((side == WHITE && target <= h8) || (side == BLACK && target >= a1)) {
                add_move(move_encoding(source,target,P+6*(side==BLACK),N+6*(side==BLACK),1,0,0,0));
                add_move(move_encoding(source,target,P+6*(side==BLACK),B+6*(side==BLACK),1,0,0,0));
                add_move(move_encoding(source,target,P+6*(side==BLACK),R+6*(side==BLACK),1,0,0,0));
                add_move(move_encoding(source,target,P+6*(side==BLACK),Q+6*(side==BLACK),1,0,0,0));
            } else {
                add_move(move_encoding(source,target,P+6*(side==BLACK),0,1,0,0,0));
            }
            remBit(target, attack);
        }

        if (en_passant != -1) {
            attack = pawn_attacks_table[(side==BLACK)][source] & (1ULL << en_passant);
            // printBoard(attack);
            if (attack) {
                add_move(move_encoding(source,en_passant,P+6*(side==BLACK),0,1,0,1,0));
            }
        }

        remBit(source, board);
    }
}

void chessboard::generate_castling_moves(Color side) {
    if (side == WHITE) {
        if (castling & WK) {
            if (!getBit(61) && !getBit(62) && !is_sq_attacked(61, BLACK) && !is_sq_attacked(62, BLACK)) {
                add_move(move_encoding(60,62,K,0,0,0,0,1));
            }
        }
        if (castling & WQ) {
            if (!getBit(57) && !getBit(58) && !getBit(59) && !is_sq_attacked(60, BLACK) && !is_sq_attacked(59, BLACK) && !is_sq_attacked(58, BLACK)) {
                add_move(move_encoding(60,58,K,0,0,0,0,1));
            }
        }
    } else {
        if (castling & BK) {
            if (!getBit(5) && !getBit(6) && !is_sq_attacked(5, WHITE) && !is_sq_attacked(6, WHITE)) {
                add_move(move_encoding(4,6,k,0,0,0,0,1));
                
            }
        }
        if (castling & BQ) {
            if (!getBit(1) && !getBit(2) && !getBit(3) && !is_sq_attacked(2, WHITE) && !is_sq_attacked(3, WHITE)) {
                add_move(move_encoding(4,2,k,0,0,0,0,1));
            }
        }
    }
}

void chessboard::generate_knight_moves(usl board, Color side) {
    int source, target;
    usl attack;
    while (board) {
        source = lsb_ind(board);
        attack = knight_attacks_table[source] & ~color_bitboards[side];
        string s = index_to_square(source);
        while (attack) {
            target = lsb_ind(attack);
            if (getBit(target)) {
                add_move(move_encoding(source,target,N+6*(side==BLACK),0,1,0,0,0));
            } else {
                add_move(move_encoding(source,target,N+6*(side==BLACK),0,0,0,0,0));
            }
            remBit(target, attack);
        }
        remBit(source, board);
    }
}

void chessboard::generate_bishop_moves(usl board, Color side) {
    int source, target;
    usl attack;
    while (board) {
        source = lsb_ind(board);
        attack = bishop_attacks(source, bitboard) & ~color_bitboards[side];
        string s = index_to_square(source);
        while (attack) {
            target = lsb_ind(attack);
            if (getBit(target)) {
                add_move(move_encoding(source,target,B+6*(side==BLACK),0,1,0,0,0));
            } else {
                add_move(move_encoding(source,target,B+6*(side==BLACK),0,0,0,0,0));
            }
            remBit(target, attack);
        }
        remBit(source, board);
    }
}

void chessboard::generate_rook_moves(usl board, Color side) {
    int source, target;
    usl attack;
    while (board) {
        source = lsb_ind(board);
        attack = rook_attacks(source, bitboard) & ~color_bitboards[side];
        string s = index_to_square(source);
        while (attack) {
            target = lsb_ind(attack);
            if (getBit(target)) {
                add_move(move_encoding(source,target,R+6*(side==BLACK),0,1,0,0,0));
            } else {
                add_move(move_encoding(source,target,R+6*(side==BLACK),0,0,0,0,0));
            }
            remBit(target, attack);
        }
        remBit(source, board);
    }
}

void chessboard::generate_queen_moves(usl board, Color side) {
    int source, target;
    usl attack;
    while (board) {
        source = lsb_ind(board);
        attack = queen_attacks(source, bitboard) & ~color_bitboards[side];
        string s = index_to_square(source);
        while (attack) {
            target = lsb_ind(attack);
            if (getBit(target)) {
                add_move(move_encoding(source,target,Q+6*(side==BLACK),0,1,0,0,0));
            } else {
                add_move(move_encoding(source,target,Q+6*(side==BLACK),0,0,0,0,0));
            }
            remBit(target, attack);
        }
        remBit(source, board);
    }
}

void chessboard::generate_king_moves(usl board, Color side) {
    int source, target;
    usl attack;
    while (board) {
        source = lsb_ind(board);
        attack = king_attacks_table[source] & ~color_bitboards[side];
        string s = index_to_square(source);
        while (attack) {
            target = lsb_ind(attack);
            if (getBit(target)) {
                add_move(move_encoding(source,target,K+6*(side==BLACK),0,1,0,0,0));
            } else {
                add_move(move_encoding(source,target,K+6*(side==BLACK),0,0,0,0,0));
            }
            remBit(target, attack);
        }
        remBit(source, board);
    }
}

void chessboard::generate_moves() {
    
    moves->count = 0;

    if(!side) generate_pawn_moves(pisces[P], (side ? BLACK : WHITE));
    else generate_pawn_moves(pisces[p], (side ? BLACK : WHITE));
    
    generate_castling_moves((side ? BLACK : WHITE));
    
    if(!side) generate_knight_moves(pisces[N], (side ? BLACK : WHITE));
    else generate_knight_moves(pisces[n], (side ? BLACK : WHITE));
    
    if(!side) generate_bishop_moves(pisces[B], (side ? BLACK : WHITE));
    else generate_bishop_moves(pisces[b], (side ? BLACK : WHITE));
    
    if(!side) generate_rook_moves(pisces[R], (side ? BLACK : WHITE));
    else generate_rook_moves(pisces[r], (side ? BLACK : WHITE));
    
    if(!side) generate_queen_moves(pisces[Q], (side ? BLACK : WHITE));
    else generate_queen_moves(pisces[q], (side ? BLACK : WHITE));

    if(!side) generate_king_moves(pisces[K], (side ? BLACK : WHITE));
    else generate_king_moves(pisces[k], (side ? BLACK : WHITE));

}