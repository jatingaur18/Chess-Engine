#include "board.h"
#include <chrono>
#include <iostream>
#include <string.h>

using namespace std;

void run(chessboard &cb) {
    cb.printBoard();
}

int main() {
    ios::sync_with_stdio(false);
    // initalizing board
    chessboard cb;
    chessboard cb_copy;

    // std fens
    string pos = "8/8/8/8/8/8/8/8 w - - 0 0";
    string fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P1Pp/2N2Q2/PPPBBP1P/R3K2R b KQkq g3 0 1";

    //setting up the board
    cb.FEN(fen);
    cb.printPisces();
    
    //calculating the time
    const long long iterations = 1000;
    auto start = chrono::high_resolution_clock::now();
    cb.generate_moves();
    for (int i = 0; i < iterations; ++i) {
    }
    auto end = chrono::high_resolution_clock::now();
    auto duration = chrono::duration_cast<chrono::nanoseconds>(end - start);
    cout << "Execution time: " << (duration.count()) / iterations << " nanoseconds" << endl;
    
    //rest of the code    
    cout << "\n" << endl;
    
    cout << "Generate Moves" << endl;
    print_move_list();
    
    
    // preserving and restoring

    // cb.FEN(pos);
    // preserve(cb_copy,cb);
    // cb.printPisces();

    // preserve(cb,cb_copy);
    // cb.printPisces();

    return 0;
}