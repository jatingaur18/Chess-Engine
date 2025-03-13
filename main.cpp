#include "board.h"
#include "globals.h"
#include <chrono>
#include <iostream>
#include <string.h>

using namespace std;
using namespace std::chrono;

void run(chessboard &cb) {
    cb.printBoard();
}

long long get_time() {
    auto now = high_resolution_clock::now();
    auto duration = now.time_since_epoch();
    return duration_cast<nanoseconds>(duration).count();
}

int main() {
    ios::sync_with_stdio(false);
    // initalizing board
    chessboard cb;
    chessboard cb_copy;

    // std fens
    string pos = "8/8/8/8/8/8/8/8 w - - 0 0";
    string fen = "r3k2r/p1ppqpb1/bn2pnp1/2pPN3/1p2P1Pp/2N1rQ2/PPPBBP1P/R3K2R w KQkq c6 0 1";

    //setting up the board 
    cb.FEN(fen);
    cb.printPisces();
    cb_copy.FEN(fen);

    moves_lst moves;

    //rest of the code    
    cout << "\n" << endl;
    cb.generate_moves(moves);
    print_move_list(moves);
    long long start_time = get_time();
    for (int i = 0; i < moves.count; i++) {
        // move_print(moves.move_list[i]);
        // cout<<cb.make_move(moves.move_list[i], 1, cb_copy)<<endl;
        if (!cb.make_move(moves.move_list[i], 1, cb_copy)) {
            preserve(cb,cb_copy);
            continue;
        }
        cb.printPisces();
        preserve(cb,cb_copy);
        // getchar();
    }
    
    cout<<"Time: "<<(get_time()-start_time)<<" ns"<<endl;


    
    // cout << "Generate Moves" << endl;
    
    
    // preserving and restoring

    // cb.FEN(pos);
    // preserve(cb_copy,cb);
    // cb.printPisces();

    // preserve(cb,cb_copy);
    // cb.printPisces();

    return 0;
}