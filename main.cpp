#include <iostream>
#include <chrono>
#include "board.h"
using namespace std;

int main() {
    ios::sync_with_stdio(false);

    chessboard cb;

    const long long iterations = 1000;
    
    auto start = chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
      cb.setBit(e7);
      cb.setBit(e8);
      cb.setBit(a8);
      cb.setBit(h4);
      cb.setBit(b4);
      cb.setBit(b6);
      cb.setBit(a5);
      cb.king_attacks(e5);
    }
    auto end = chrono::high_resolution_clock::now();
    auto duration = chrono::duration_cast<chrono::nanoseconds>(end - start);
    cout << "Execution time: " << (duration.count())/iterations << "nanoseconds" << endl;

    return 0;
}