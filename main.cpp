#include <iostream>
#include <string>
#include <chrono>
#include <math.h>
#include "board.h"
using namespace std;



/*
move representation 

0000 0000 0000 0000 0011 1111       source square          0x3f
0000 0000 0000 1111 1100 0000       target square          0xfc0  
0000 0000 1111 0000 0000 0000       piece                  0xf000
0000 1111 0000 0000 0000 0000       promotion piece        0xf0000
0001 0000 0000 0000 0000 0000       capture flag           0x100000
0010 0000 0000 0000 0000 0000       double push flag       0x200000
0100 0000 0000 0000 0000 0000       enpassant flag         0x400000
1000 0000 0000 0000 0000 0000       castling flag          0x800000
*/


void run(chessboard &cb) {
  cb.printBoard();
}

int main() {
    ios::sync_with_stdio(false);
    std::string unicode_pieces[12] = {"♟︎", "♞", "♝", "♜", "♛", "♚","♙", "♘", "♗", "♖", "♕", "♔"};

    chessboard cb;
    string fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P1Pp/2N2Q2/PPPBBP1P/R3K2R w KQkq g3 0 1";
    const long long iterations = 10000;
    cb.FEN(fen);
    cb.printPisces();
    int move=0;
    move =(move| e2);
    cout<<move<<endl;
    // int sq= (move & 0xfc0);
    // cout<<index_to_square(sq)<<endl;
    auto start = chrono::high_resolution_clock::now();
    
    
    for (int i = 0; i < iterations; ++i) {
      // cout<<".";
    }
    
    
    auto end = chrono::high_resolution_clock::now();
    auto duration = chrono::duration_cast<chrono::nanoseconds>(end - start);
    cout << "Execution time: " << (duration.count())/iterations << " nanoseconds" << endl;
    cout<<"\n"<<endl;
    
    cout<<"Generate Moves"<<endl;
    cb.generate_moves();
    cout<<"encoded move"<<endl;
    move = move_encoding(e2,e4,R,0,0,0,0,0);

    cout<<index_to_square(move_to_src(move))<<endl;
    cout<<index_to_square(move_to_trg(move))<<endl;
    cout<<unicode_pieces[move_to_piece(move)]<<endl;
    cout<<move_to_prom(move)<<endl;
    cout<<move_to_cap(move)<<endl;
    cout<<move_to_dpsh(move)<<endl;
    cout<<move_to_enp(move)<<endl;
    cout<<move_to_cast(move)<<endl;

    return 0;
}