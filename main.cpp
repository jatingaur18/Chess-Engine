#include <iostream>
#include <chrono>
#include "board.h"
using namespace std;

void run(chessboard &cb) {
  cb.printBoard();
}

int main() {
    ios::sync_with_stdio(false);

    chessboard cb;
    
    const long long iterations = 1000;
    auto start = chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
      cb.FEN("5R2/pp6/7p/3pk1p1/4n3/4P3/PPP3PP/2K5 w - g6 0 24");
      // run(cb);
    }
    auto end = chrono::high_resolution_clock::now();
    
    auto duration = chrono::duration_cast<chrono::nanoseconds>(end - start);
    cout << "Execution time: " << (duration.count())/iterations << " nanoseconds" << endl;
    cb.printPisces();

    return 0;
}