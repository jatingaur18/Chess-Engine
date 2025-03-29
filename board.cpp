#include "board.h"
#include "utils.h"
#include <sstream>
#include "vector"
using namespace std;

// #define preserve(cb_copy,cb) memcpy(&cb_copy,&cb,2200);
// void preserve(chessboard &cb,chessboard &cb_copy);

std::string unicode_pieces[12] = {"♙", "♞", "♝", "♜", "♛", "♚","♟", "♘", "♗", "♖", "♕", "♔"};


chessboard::chessboard() : bitboard(18446462598732906495ULL) {
    init_attack_tables();
}
void chessboard::printPisces() {
    vector<vector<string>> board(8, vector<string>(8, "."));
    for (int i = 0; i < 12; i++) {
        for (int j = 0; j < 64; j++) {
            if (getBit(j, pisces[i])) {
                board[j/8][j%8] = unicode_pieces[i];
            }
        }
    }

    std::cout << "\n";
    for (int rank = 0; rank < 8; rank++) {
        std::cout << 8 - rank << "  ";
        for (int file = 0; file < 8; file++) {
            std::cout << " " << board[rank][file];
        }
        std::cout << "\n";
    }
    std::cout << "\n    a b c d e f g h\n\n";

    std::cout << "Side to move: " << (side == WHITE ? "White" : "Black") << "\n";
    std::cout << "Castling rights: " << (castling & WK ? "K" : "") << (castling & WQ ? "Q" : "") << (castling & BK ? "k" : "") << (castling & BQ ? "q" : "") << "\n";
    std::cout << "En passant square: " << (en_passant!= -1 ? (index_to_square(en_passant)):"-")<< "\n";
    std::cout << "Halfmove clock: " << halfmove_clock << "\n";
    std::cout << "Fullmove number: " << fullmove_number << "\n";
    std::cout << "\n";
}

void chessboard::FEN(std::string fen) {
    // Reset the board
    for(auto &i : pisces) i = 0ULL;
    for(auto &i : color_bitboards) i = 0ULL;
    bitboard = 0ULL;
    en_passant = -1;
    castling = 0;
    halfmove_clock = 0;
    fullmove_number = 1;
    side = WHITE;

    std::istringstream iss(fen);
    std::string piece_placement, active_color, castling_rights, en_passant_target, halfmove_clock_str, fullmove_number_str;

    iss >> piece_placement >> active_color >> castling_rights >> en_passant_target >> halfmove_clock_str >> fullmove_number_str;

    int rank = 0;
    int file = 0;
    for (char c : piece_placement) {
        if (c == '/') {
            rank++;
            file = 0;
        } else if (isdigit(c)) {
            file += c - '0';
        } else {
            int piece = -1;
            switch (c) {
                case 'P': piece = 0; break;
                case 'N': piece = 1; break;
                case 'B': piece = 2; break;
                case 'R': piece = 3; break;
                case 'Q': piece = 4; break;
                case 'K': piece = 5; break;
                case 'p': piece = 6; break;
                case 'n': piece = 7; break;
                case 'b': piece = 8; break;
                case 'r': piece = 9; break;
                case 'q': piece = 10; break;
                case 'k': piece = 11; break;
            }
            setBit(rank * 8 + file, pisces[piece]);
            setBit(rank * 8 + file, bitboard);
            if(piece <= 5) {
                setBit(rank * 8 + file, color_bitboards[WHITE]);
            } else {
                setBit(rank * 8 + file, color_bitboards[BLACK]);
            }
            file++;
        }
    }

    side = (active_color == "w") ? WHITE : BLACK;

    for (char c : castling_rights) {
        switch (c) {
            case 'K': castling |= WK; break;
            case 'Q': castling |= WQ; break;
            case 'k': castling |= BK; break;
            case 'q': castling |= BQ; break;
        }
    }
    
    if (en_passant_target != "-") {
        int file = en_passant_target[0] - 'a';
        int rank = 8-(en_passant_target[1] - '0');
        en_passant = (rank * 8 + file);
    }

    halfmove_clock = std::stoi(halfmove_clock_str);
    fullmove_number = std::stoi(fullmove_number_str);
}

void chessboard::printBoard(const usl &board) const {
    std::cout << "\n";
    for (int rank = 0; rank < 8; rank++) {
        std::cout << 8 - rank << "  ";
        for (int file = 0; file < 8; file++) {
            int square = rank * 8 + file;
            std::cout << " " << getBit(square, board);
        }
        std::cout << "\n";
    }
    std::cout << "\n    a b c d e f g h\n\n";
    std::cout << "Bitboard: " << board << "\n";
}

usl chessboard::pawn_attacks(Color color, int square) const {
    usl pawn = 1ULL << square;
    if (color) {
        return ((pawn << 7) & FILE_H) | ((pawn << 9) & FILE_A);
    } else {
        return ((pawn >> 9) & FILE_H) | ((pawn >> 7) & FILE_A);
    }
}

usl chessboard::knight_attacks(int square) const {
    usl knight = 1ULL << square;
    usl attacks = ((knight & FILE_AB) << 6) | ((knight & FILE_A) << 15) |
                  ((knight & FILE_H) << 17) | ((knight & FILE_GH) << 10) |
                  ((knight & FILE_GH) >> 6) | ((knight & FILE_H) >> 15) |
                  ((knight & FILE_A) >> 17) | ((knight & FILE_AB) >> 10);
    return attacks;
}

usl chessboard::king_attacks(int square) const {
  usl king = 1ULL << square;
    return ((king << 8)|(king >> 8)|((king << 1) & FILE_A)|((king >> 1) & FILE_H)
            |((king << 9) & FILE_A)|((king << 7) & FILE_H)|((king >> 7) & FILE_A)
            |((king >> 9) & FILE_H));
}

usl chessboard::rook_attacks(int square, usl occupancy) const {
    return (~(MSB(occupancy & rook_map[square][0])-1)& rook_map[square][0]
    | ((LSB(occupancy & rook_map[square][1])<<1)-1)& rook_map[square][1]
    | ~(MSB(occupancy & rook_map[square][2])-1)& rook_map[square][2]
    | ((LSB(occupancy & rook_map[square][3])<<1)-1)& rook_map[square][3]);
}

usl chessboard::bishop_attacks(int square, usl occupancy) const {
  return (~(MSB(occupancy & bishop_map[square][0])-1)& bishop_map[square][0]
  | ((LSB(occupancy & bishop_map[square][1])<<1)-1)& bishop_map[square][1]
  | ~(MSB(occupancy & bishop_map[square][2])-1)& bishop_map[square][2]
  | ((LSB(occupancy & bishop_map[square][3])<<1)-1)& bishop_map[square][3]);
}

usl chessboard::queen_attacks(int square, usl occupancy) const {
    return rook_attacks(square, occupancy) | bishop_attacks(square, occupancy);
}

void chessboard::init_attack_tables() {
    for (int sq = 0; sq < 64; sq++) {
        pawn_attacks_table[WHITE][sq] = pawn_attacks(WHITE, sq);
        pawn_attacks_table[BLACK][sq] = pawn_attacks(BLACK, sq);
        knight_attacks_table[sq] = knight_attacks(sq);
        king_attacks_table[sq] = king_attacks(sq); 
    }
}


bool chessboard::is_sq_attacked(int square, Color color) {
    return pawn_attacks_table[!color][square] & pisces[P+ 6*(color)] |
           knight_attacks_table[square] & pisces[N+ 6*(color)] |
           king_attacks_table[square] & pisces[K+ 6*(color)] |
           rook_attacks(square, bitboard) & (pisces[R+ 6*(color)] | pisces[Q+ 6*(color)]) |
           bishop_attacks(square, bitboard) & (pisces[B+ 6*(color)] | pisces[Q+ 6*(color)]);
}

usl chessboard::sqs_attacked(Color color) {
    usl attacks = 0ULL;
    for (int i = 0; i < 64; i++) {
            if(is_sq_attacked(i,color)){setBit(i,attacks);};
    }
    return attacks;
}

int chessboard::make_move(int move,int move_flag,chessboard &cb_copy) {

    int src  = move_to_src(move); 
    int trg = move_to_trg(move);
    int piece = move_to_piece(move);
    //flags
    int prom = move_to_prom(move);//done
    int cap = move_to_cap(move); //done
    int dpsh = move_to_dpsh(move); //done
    int enp = move_to_enp(move);//done
    int cast = move_to_cast(move);

    int enp_sq= en_passant;
    
    remBit(src, pisces[piece]);
    setBit(trg, pisces[piece]);
    setBit(trg,color_bitboards[(side==BLACK)]);
    remBit(src,color_bitboards[(side==BLACK)]);
    //updating castling rights
    castling &= castling_rights[src]&castling_rights[trg];

    if(cap){
        usl cap_piece = 1ULL << trg;
        for(int i = 6*(side==WHITE); i < 6 + 6*(side==WHITE); i++){
            if (getBit(trg,pisces[i])){

                remBit(trg,pisces[i]); 
                remBit(trg,color_bitboards[!side]);
                remBit(trg,color_bitboards[(side==WHITE)]);
                break; // Only one piece can be captured, so exit early
            }
        // (getBit(trg,pisces[i]) && (remBit(trg,pisces[i]) , remBit(trg,color_bitboards[!side]),remBit(trg,color_bitboards[(side==WHITE)]) ,true )) || false;
        }  
    }
    
    if(prom){
        remBit(trg,pisces[piece]);
        setBit(trg,pisces[prom]);
    }
     
    if(dpsh){
        en_passant = (side == WHITE) ? trg + 8 : trg - 8;
    }
    else{
        en_passant = -1;
    }
    if(cast){
        switch(trg){
            case g1:
                remBit(h1,pisces[R]);
                setBit(f1,pisces[R]);
                remBit(h1,color_bitboards[(side==BLACK)]);
                setBit(f1,color_bitboards[(side==BLACK)]);
                break;
            case c1:
                remBit(a1,pisces[R]);
                setBit(d1,pisces[R]);
                remBit(a1,color_bitboards[(side==BLACK)]);
                setBit(d1,color_bitboards[(side==BLACK)]);
                break;
            case g8:
                remBit(h8,pisces[r]);
                setBit(f8,pisces[r]);
                remBit(h8,color_bitboards[(side==BLACK)]);
                setBit(f8,color_bitboards[(side==BLACK)]);
                break;
            case c8:
                remBit(a8,pisces[r]);
                setBit(d8,pisces[r]);
                remBit(a8,color_bitboards[(side==BLACK)]);
                setBit(d8,color_bitboards[(side==BLACK)]);
                break;
        }
    }

    if(enp){
        remBit(enp_sq + 8 -16*(side==BLACK),pisces[P + 6 * (side == WHITE)]);
        remBit(enp_sq + 8 -16*(side==BLACK),color_bitboards[(side==WHITE)]);
    }
    bitboard= color_bitboards[WHITE] | color_bitboards[BLACK];
    side = side == WHITE ? BLACK : WHITE;
    if(cap || piece == P){
        halfmove_clock = 0;
    }else{
        halfmove_clock++;
    }
    if(side == BLACK){
        fullmove_number++;
    }
    if (is_sq_attacked(63 - __builtin_clzll(pisces[K + 6 * (side == WHITE ? 1 : 0)]), (side == BLACK ? BLACK : WHITE))) {
        return 0;
    } else {
        return 1;
    }
}




// inline void chessboard::deep_copy(const chessboard& source) {
//     std::memcpy(this, &source, offsetof(chessboard, pawn_attacks_table));
// }
