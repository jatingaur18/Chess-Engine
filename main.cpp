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
    return duration_cast<milliseconds>(duration).count();
}

//-------- PERFT CODE---------- //

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

void perft_test(chessboard &cb,int depth){
    cout<<"-----------Perft Test----------"<<endl;
    cout<<" Move           |        Nodes "<<endl;
    cout<<"----------------|--------------"<<endl;
    moves_lst moves;
    cb.generate_moves(moves);
    
    chessboard cb_copy;
    for (int i = 0; i < moves.count; i++) {
        // move_print(moves.move_list[i]); 
        cb_copy.deep_copy(cb);
        // cb.printPisces();
        // cb_copy.printPisces();
        long old_nodes = global_nodes;

        if (cb.make_move(moves.move_list[i], 1, cb_copy)) {
            perft(cb, depth - 1);
            cout <<" "<<index_to_square(move_to_src(moves.move_list[i]));
            cout << index_to_square(move_to_trg(moves.move_list[i]));
            cout<<"           ";
            cout<<"|         "<<global_nodes-old_nodes<<endl;
        }
        cb.deep_copy(cb_copy);
    }
}
//e7e8q
//    square += 'a' + (index % 8);
//    square += '8' - (index / 8);
int uci_parse(chessboard &cb,string mov){
    moves_lst moves;
    cb.generate_moves(moves);
    int src = (mov[0]-'a') + (8-(mov[1]-'0'))*8 ;
    int trg = (mov[2]-'a') + (8-(mov[3]-'0'))*8 ;
    char prom = 0;
    if(mov.length()==5){
        prom = mov[4];
    }
    for (int i = 0; i < moves.count; i++) {
        if(move_to_src(moves.move_list[i])==(src) && move_to_trg(moves.move_list[i])==(trg)){
            if(prom){
                if(prom == prom_piece_list[move_to_prom(moves.move_list[i])]){
                    return moves.move_list[i];
                }
                // if(prom=='q'){
                //     if(move_to_prom(moves.move_list[i])==Q){
                //         return moves.move_list[i];
                //     }
                // }
                // else if(prom=='r'){
                //     if(move_to_prom(moves.move_list[i])==R){
                //         return moves.move_list[i];
                //     }
                // }
                // else if(prom=='b'){
                //     if(move_to_prom(moves.move_list[i])==B){
                //         return moves.move_list[i];
                //     }
                // }
                // else if(prom=='n'){
                //     if(move_to_prom(moves.move_list[i])==N){
                //         return moves.move_list[i];
                //     }
                // }
            }
            else{
                return moves.move_list[i];
            }
        }
    }
    return 0;
}

int main() {
    ios::sync_with_stdio(false);
    // initalizing board
    chessboard cb;
    chessboard cb_copy;

    // std fens
    // string fen = "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"; // tricky
    // string fen = "k7/8/8/8/1p6/8/P7/K7 w - - 0 0";
    string fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    // string fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"; // tricky

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

    // int depth = 6; // Set the desired depth here
    // cin>>depth;
    // long long start_time = get_time();
    // perft_test(cb, depth);
    // long long end_time = get_time();
    // cout<<"-----------------------------"<<endl;
    // cout << "Depth: " << depth << endl;
    // cout << "Nodes: " << global_nodes << endl;
    // cout << "Time: " << (end_time - start_time) << " ms" << endl;
    // //print node per second
    // if (end_time - start_time){cout << "NPS: " << (usl)(global_nodes / ((end_time - start_time)))/1000<< " Million" << endl;}
    // else{
    //     cout << "NPS: " << "Infinite" << endl;
    // }

    int move = uci_parse(cb,"e1c1");
    if(move){
        cb.make_move(move,1,cb_copy);
        cb.printPisces();
    }
    return 0;
}