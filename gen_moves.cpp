#include "board.h"
#include "utils.h"
#include <algorithm>
using namespace std;

const int piece_values[] = {
    100, 300, 300, 500, 1000, 10000,  // White: P, N, B, R, Q, K
    100, 300, 300, 500, 1000, 10000   // Black: p, n, b, r, q, k
};

int calculate_capture_score(int attacker, int victim, Color side) {
    if (victim == -1) return 0; 
    return piece_values[victim] - piece_values[attacker] + 10000;
}

static inline int lsb_ind(usl bitboard) {
    if (bitboard) {
        return __builtin_ctzll(bitboard);
    }
    else {
        return -1;
    }
}

void chessboard::generate_pawn_moves(usl board, Color side, moves_lst &moves) {
    int source, target;
    while (board) {
        source = lsb_ind(board);
        target = side == WHITE ? source - 8 : source + 8;
        if (target >= 0 && target < 64 && !getBit(target, bitboard)) {
            if ((side == WHITE && target <= h8) || (side == BLACK && target >= a1)) {
                add_move(move_encoding(source, target, P + 6 * (side == BLACK), N + 6 * (side == BLACK), 0, 0, 0, 0), moves);
                add_move(move_encoding(source, target, P + 6 * (side == BLACK), B + 6 * (side == BLACK), 0, 0, 0, 0), moves);
                add_move(move_encoding(source, target, P + 6 * (side == BLACK), R + 6 * (side == BLACK), 0, 0, 0, 0), moves);
                add_move(move_encoding(source, target, P + 6 * (side == BLACK), Q + 6 * (side == BLACK), 0, 0, 0, 0), moves);
            } else {
                add_move(move_encoding(source, target, P + 6 * (side == BLACK), 0, 0, 0, 0, 0), moves);
                if ((side == WHITE && source >= a2 && source <= h2 && target - 8 >= 0 && !getBit(target - 8, bitboard)) ||
                    (side == BLACK && source >= a7 && source <= h7 && target + 8 < 64 && !getBit(target + 8, bitboard))) {
                    add_move(move_encoding(source, target - 8 + side * 16, P + 6 * (side == BLACK), 0, 0, 1, 0, 0), moves);
                }
            }
        }

        // Pawn captures
        usl attack = pawn_attacks_table[side][source] & color_bitboards[!side];
        while (attack) {
            target = lsb_ind(attack);
            int victim = get_piece_at(target);
            int attacker = P + 6 * (side == BLACK);
            int score = (victim != -1) ? (piece_values[victim] - piece_values[attacker]) : 0;
            if ((side == WHITE && target <= h8) || (side == BLACK && target >= a1)) {
                add_move(move_encoding(source, target, attacker, N + 6 * (side == BLACK), 1, 0, 0, 0), moves, score);
                add_move(move_encoding(source, target, attacker, B + 6 * (side == BLACK), 1, 0, 0, 0), moves, score);
                add_move(move_encoding(source, target, attacker, R + 6 * (side == BLACK), 1, 0, 0, 0), moves, score);
                add_move(move_encoding(source, target, attacker, Q + 6 * (side == BLACK), 1, 0, 0, 0), moves, score);
            } else {
                add_move(move_encoding(source, target, attacker, 0, 1, 0, 0, 0), moves, score);
            }
            remBit(target, attack);
        }

        // En passant
        if (en_passant != -1) {
            attack = pawn_attacks_table[side][source] & (1ULL << en_passant);
            if (attack) {
                int attacker = P + 6 * (side == BLACK);
                int score =0;
                add_move(move_encoding(source, en_passant, attacker, 0, 1, 0, 1, 0), moves, score);
            }
        }

        remBit(source, board);
    }
}

void chessboard::generate_castling_moves(Color side, moves_lst &moves) {
    if (side == WHITE) {
        if (castling & WK) {
            if (!getBit(61, bitboard) && !getBit(62, bitboard) && !is_sq_attacked(61, BLACK) && !is_sq_attacked(62, BLACK)&& !is_sq_attacked(60, BLACK)) {
                add_move(move_encoding(60, 62, K, 0, 0, 0, 0, 1), moves);
            }
        }
        if (castling & WQ) {
            if (!getBit(57, bitboard) && !getBit(58, bitboard) && !getBit(59, bitboard) && !is_sq_attacked(60, BLACK) && !is_sq_attacked(59, BLACK) && !is_sq_attacked(58, BLACK)) {
                add_move(move_encoding(60, 58, K, 0, 0, 0, 0, 1), moves);
            }
        }
    } else {
        if (castling & BK) {
            if (!getBit(5, bitboard) && !getBit(6, bitboard) && !is_sq_attacked(5, WHITE) && !is_sq_attacked(6, WHITE)&& !is_sq_attacked(4, WHITE)) {
                add_move(move_encoding(4, 6, k, 0, 0, 0, 0, 1), moves);
            }
        }
        if (castling & BQ) {
            if (!getBit(1, bitboard) && !getBit(2, bitboard) && !getBit(3, bitboard) && !is_sq_attacked(2, WHITE) && !is_sq_attacked(3, WHITE)&& !is_sq_attacked(4, WHITE)) {
                add_move(move_encoding(4, 2, k, 0, 0, 0, 0, 1), moves);
            }
        }
    }
}

void chessboard::generate_knight_moves(usl board, Color side, moves_lst &moves) {
    int source, target;
    usl attack;
    int piece = (side == WHITE) ? N : n; // N = 1, n = 7
    while (board) {
        source = lsb_ind(board);
        attack = knight_attacks_table[source] & ~color_bitboards[side];
        while (attack) {
            target = lsb_ind(attack);
            int score = 0;
            if (getBit(target, bitboard)) {
                int victim = get_piece_at(target);
                score = calculate_capture_score(piece, victim, side);
            }
            add_move(move_encoding(source, target, piece, 0, getBit(target, bitboard), 0, 0, 0), moves, score);
            remBit(target, attack);
        }
        remBit(source, board);
    }
}

void chessboard::generate_bishop_moves(usl board, Color side, moves_lst &moves) {
    int source, target;
    usl attack;
    int piece = (side == WHITE) ? B : b; // B = 2, b = 8
    while (board) {
        source = lsb_ind(board);
        attack = bishop_attacks(source, bitboard) & ~color_bitboards[side];
        while (attack) {
            target = lsb_ind(attack);
            int score = 0;
            if (getBit(target, bitboard)) {
                int victim = get_piece_at(target);
                score = calculate_capture_score(piece, victim, side);
            }
            add_move(move_encoding(source, target, piece, 0, getBit(target, bitboard), 0, 0, 0), moves, score);
            remBit(target, attack);
        }
        remBit(source, board);
    }
}

void chessboard::generate_rook_moves(usl board, Color side, moves_lst &moves) {
    int source, target;
    usl attack;
    int piece = (side == WHITE) ? R : r; // R = 3, r = 9
    while (board) {
        source = lsb_ind(board);
        attack = rook_attacks(source, bitboard) & ~color_bitboards[side];
        while (attack) {
            target = lsb_ind(attack);
            int score = 0;
            if (getBit(target, bitboard)) {
                int victim = get_piece_at(target);
                score = calculate_capture_score(piece, victim, side);
            }
            add_move(move_encoding(source, target, piece, 0, getBit(target, bitboard), 0, 0, 0), moves, score);
            remBit(target, attack);
        }
        remBit(source, board);
    }
}

void chessboard::generate_queen_moves(usl board, Color side, moves_lst &moves) {
    int source, target;
    usl attack;
    while (board) {
        source = lsb_ind(board);
        attack = queen_attacks(source, bitboard) & ~color_bitboards[side];
        while (attack) {
            target = lsb_ind(attack);
            if (getBit(target, bitboard)) {
                add_move(move_encoding(source, target, Q + 6 * (side == BLACK), 0, 1, 0, 0, 0), moves);
            } else {
                add_move(move_encoding(source, target, Q + 6 * (side == BLACK), 0, 0, 0, 0, 0), moves);
            }
            remBit(target, attack);
        }
        remBit(source, board);
    }
}

void chessboard::generate_king_moves(usl board, Color side, moves_lst &moves) {
    int source, target;
    usl attack;
    int piece = (side == WHITE) ? K : k; // K = 5, k = 11
    while (board) {
        source = lsb_ind(board);
        attack = king_attacks_table[source] & ~color_bitboards[side];
        while (attack) {
            target = lsb_ind(attack);
            int score = 0;
            if (getBit(target, bitboard)) {
                int victim = get_piece_at(target);
                score = calculate_capture_score(piece, victim, side);
            }
            add_move(move_encoding(source, target, piece, 0, getBit(target, bitboard), 0, 0, 0), moves, score);
            remBit(target, attack);
        }
        remBit(source, board);
    }
}

void chessboard::generate_moves(moves_lst &moves) {
    moves.count = 0;
    if (!side) generate_pawn_moves(pisces[P], WHITE, moves);
    else generate_pawn_moves(pisces[p], BLACK, moves);
    generate_castling_moves(side, moves);

    if (!side) generate_knight_moves(pisces[N], WHITE, moves);
    else generate_knight_moves(pisces[n], BLACK, moves);

    if (!side) generate_bishop_moves(pisces[B], WHITE, moves);
    else generate_bishop_moves(pisces[b], BLACK, moves);

    if (!side) generate_rook_moves(pisces[R], WHITE, moves);
    else generate_rook_moves(pisces[r], BLACK, moves);

    if (!side) generate_queen_moves(pisces[Q], WHITE, moves);
    else generate_queen_moves(pisces[q], BLACK, moves);

    if (!side) generate_king_moves(pisces[K], WHITE, moves);
    else generate_king_moves(pisces[k], BLACK, moves);

}