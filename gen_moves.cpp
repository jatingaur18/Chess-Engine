#include <bits/stdc++.h>
#include <iostream>
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
        target = side == WHITE ? source - 8 : source + 8;
        string s = index_to_square(source);
        if (target >= 0 && target < 64 && !getBit(target)) {
            if ((side == WHITE && target <= h8) || (side == BLACK && target >= a1)) {
                cout << s << index_to_square(target) << "N promotion" << endl;
                cout << s << index_to_square(target) << "B promotion" << endl;
                cout << s << index_to_square(target) << "R promotion" << endl;
                cout << s << index_to_square(target) << "Q promotion" << endl;
            } else {
                cout << s << index_to_square(target) << endl;
                if ((side == WHITE && source >= a2 && source <= h2 && target - 8 >= 0 && !getBit(target - 8)) ||
                    (side == BLACK && source >= a7 && source <= h7 && target + 8 < 64 && !getBit(target + 8))) {
                    cout << s << index_to_square(target + (side == WHITE ? -8 : 8)) << endl;
                }
            }
        }

        usl attack = pawn_attacks_table[side][source] & color_bitboards[!side];
        while (attack) {
            target = lsb_ind(attack);
            if ((side == WHITE && target <= h8) || (side == BLACK && target >= a1)) {
                cout << s << "x" << index_to_square(target) << "N promotion" << endl;
                cout << s << "x" << index_to_square(target) << "B promotion" << endl;
                cout << s << "x" << index_to_square(target) << "R promotion" << endl;
                cout << s << "x" << index_to_square(target) << "Q promotion" << endl;
            } else {
                cout << s << "x" << index_to_square(target) << endl;
            }
            remBit(target, attack);
        }

        if (en_passant != -1) {
            attack = pawn_attacks_table[side][source] & (1ULL << en_passant);
            if (attack) {
                cout << s << "x" << index_to_square(en_passant) << " " << index_to_square(en_passant + (side == WHITE ? 8 : -8)) << endl;
            }
        }

        remBit(source, board);
    }
}

void chessboard::generate_castling_moves(Color side) {
    if (side == WHITE) {
        if (castling & WK) {
            if (!getBit(61) && !getBit(62) && !is_sq_attacked(61, BLACK) && !is_sq_attacked(62, BLACK)) {
                cout << "O-O" << endl;
            }
        }
        if (castling & WQ) {
            if (!getBit(57) && !getBit(58) && !getBit(59) && !is_sq_attacked(60, BLACK) && !is_sq_attacked(59, BLACK) && !is_sq_attacked(58, BLACK)) {
                cout << "O-O-O" << endl;
            }
        }
    } else {
        if (castling & BK) {
            if (!getBit(5) && !getBit(6) && !is_sq_attacked(5, WHITE) && !is_sq_attacked(6, WHITE)) {
                cout << "O-O" << endl;
            }
        }
        if (castling & BQ) {
            if (!getBit(1) && !getBit(2) && !getBit(3) && !is_sq_attacked(2, WHITE) && !is_sq_attacked(3, WHITE)) {
                cout << "O-O-O" << endl;
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
                cout << s << "x" << index_to_square(target) << endl;
            } else {
                cout << s << index_to_square(target) << endl;
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
                cout << s << "x" << index_to_square(target) << endl;
            } else {
                cout << s << index_to_square(target) << endl;
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
                cout << s << "x" << index_to_square(target) << endl;
            } else {
                cout << s << index_to_square(target) << endl;
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
                cout << s << "x" << index_to_square(target) << endl;
            } else {
                cout << s << index_to_square(target) << endl;
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
                cout << s << "x" << index_to_square(target) << endl;
            } else {
                cout << s << index_to_square(target) << endl;
            }
            remBit(target, attack);
        }
        remBit(source, board);
    }
}

void chessboard::generate_moves() {
    
    cout<<endl;
    cout<<"--------------- Generate Pawn Moves -----------------"<<endl;

    if(!side) generate_pawn_moves(pisces[P], (side ? BLACK : WHITE));
    else generate_pawn_moves(pisces[p], (side ? BLACK : WHITE));
    
    cout<<endl;
    cout<<"--------------- Generate Castling Moves -----------------"<<endl;
    
    generate_castling_moves((side ? BLACK : WHITE));
    
    cout<<endl;
    cout<<"--------------- Generate Knight Moves -----------------"<<endl;
    
    if(!side) generate_knight_moves(pisces[N], (side ? BLACK : WHITE));
    else generate_knight_moves(pisces[n], (side ? BLACK : WHITE));
    
    cout<<endl;
    cout<<"--------------- Generate Bishop Moves -----------------"<<endl;
    
    if(!side) generate_bishop_moves(pisces[B], (side ? BLACK : WHITE));
    else generate_bishop_moves(pisces[b], (side ? BLACK : WHITE));
    
    cout<<endl;
    cout<<"--------------- Generate Rook Moves -----------------"<<endl;
    
    if(!side) generate_rook_moves(pisces[R], (side ? BLACK : WHITE));
    else generate_rook_moves(pisces[r], (side ? BLACK : WHITE));
    
    cout<<endl;
    cout<<"--------------- Generate Queen Moves -----------------"<<endl;
    
    if(!side) generate_queen_moves(pisces[Q], (side ? BLACK : WHITE));
    else generate_queen_moves(pisces[q], (side ? BLACK : WHITE));

    cout<<endl;
    cout<<"--------------- Generate King Moves -----------------"<<endl;

    if(!side) generate_king_moves(pisces[K], (side ? BLACK : WHITE));
    else generate_king_moves(pisces[k], (side ? BLACK : WHITE));
}