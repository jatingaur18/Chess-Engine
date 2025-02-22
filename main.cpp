#include <iostream>
#include <string>
#include <chrono>
#include <math.h>
#include "board.h"
using namespace std;

void run(chessboard &cb) {
  cb.printBoard();
}

int main() {
    ios::sync_with_stdio(false);

    chessboard cb;
    string fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P1Pp/2N2Q2/PPPBBP1P/R3K2R w KQkq g3 0 1";
    const long long iterations = 1000;
    cb.FEN(fen);
    cb.printPisces();
    auto start = chrono::high_resolution_clock::now();
    
    
    for (int i = 0; i < iterations; ++i) {
      // cout<<".";
    }
    
    
    auto end = chrono::high_resolution_clock::now();
    auto duration = chrono::duration_cast<chrono::nanoseconds>(end - start);
    cout << "Execution time: " << (duration.count())/iterations << " nanoseconds" << endl;
    cout<<"\n"<<endl;
    
    cout<<"Generate pawn moves"<<endl;
    cb.generate_moves();
    
    
    return 0;
}