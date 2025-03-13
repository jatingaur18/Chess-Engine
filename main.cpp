#include "board.h"
#include "globals.h"
#include <chrono>
#include <iostream>
#include <string.h>

using namespace std;
using namespace std::chrono;

extern long long global_nodes;
long long global_nodes = 0;


void run(chessboard &cb) {
    cb.printBoard();
}

long long get_time() {
    auto now = high_resolution_clock::now();
    auto duration = now.time_since_epoch();
    return duration_cast<nanoseconds>(duration).count();
}

static inline void perft(chessboard &cb, int depth) {
    // cout<<"123123123123123"<<endl;
    if (depth == 0) {
        global_nodes++;
        return;
    }
    
    moves_lst moves;
    cb.generate_moves(moves);
    
    chessboard cb_copy;
    for (int i = 0; i < moves.count; i++) {
        // move_print(moves.move_list[i]); 
        cb_copy.deep_copy(cb);
        // cb.printPisces();
        // cb_copy.printPisces();
        if (cb.make_move(moves.move_list[i], 1, cb_copy)) {
            perft(cb, depth - 1);
        }
        cb.deep_copy(cb_copy);
    }
}

int main() {
    ios::sync_with_stdio(false);
    // initalizing board
    chessboard cb;
    chessboard cb_copy;

    // std fens
    // string fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    // string fen = "k7/8/8/8/1p6/8/P7/R3K3 w Q - 0 0";
    string fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    // string fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";

    //setting up the board 
    try {
        cb.FEN(fen);
        cb.printPisces();
        cb_copy.FEN(fen);
    } catch (const std::invalid_argument &e) {
        cerr << "Invalid argument: " << e.what() << endl;
        return 1;
    } catch (const std::exception &e) {
        cerr << "Exception: " << e.what() << endl;
        return 1;
    }

    global_nodes = 0;
    int depth = 1; // Set the desired depth here
    cin>>depth;
    long long start_time = get_time();
    perft(cb, depth);
    long long end_time = get_time();

    cout << "Nodes: " << global_nodes << endl;
    cout << "Time: " << (end_time - start_time) << " ns" << endl;

    return 0;
}