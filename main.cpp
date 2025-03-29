#include "board.h"
#include "globals.h"
#include <chrono>
#include <iostream>
#include <string.h>
#include <sstream>
#include "engine.h"
using namespace std;
using namespace std::chrono;

extern long long global_nodes;
long long global_nodes = 0;


// std fens
string tricky_2 = "8/2p5/3p4/KP5r/1R3p1k/q7/4P1P1/8 w - - 0 1"; // tricky
string debug = "k7/8/8/8/1p6/8/P7/K6R w - - 0 0";
string start_pos = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
string tricky_1 = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"; // tricky

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
            }
            else{
                return moves.move_list[i];
            }
        }
    }
    return 0;
}
// "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"
void parse_position(chessboard& cb, const char* input) {
    std::istringstream iss(input);
    std::string token;
    chessboard cb_copy; // For move-making safety

    iss >> token; // Skip "position"

    iss >> token; // Get mode ("startpos" or "fen")
    cout<<token<<endl;
    if (token == "startpos") {
        cb.FEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    }
    else if (token == "fen") {
        std::string fen="";
        // Collect the 6 FEN fields
        for (int i = 0; i < 6; ++i) {
            iss >> token;
            fen += token + " ";
        }
        cb.FEN(fen);
    }

    // Check for "moves" and apply them
    iss >> token;
    if (token == "moves") {
        while (iss >> token) {
            int move = uci_parse(cb, token);
            if (move) {
                cb_copy.deep_copy(cb);
                cb.make_move(move, 1, cb_copy);
            }
        }
    }
    cb.printBoard();
}

void parse_go(chessboard& cb, const char* input) {
    std::istringstream iss(input);
    std::string token;

    iss >> token; // Skip "go"

    int depth = -1;
    // Parse optional parameters
    while (iss >> token) {
        if (token == "depth") {
            iss >> depth;
        }
        // Add more parameters (e.g., "movetime", "wtime", "btime") as needed
    }

    // Default depth if none specified
    if (depth == -1) {
        depth = 5; // Reasonable default
    }
    cout<<"bestmove d2d4"<<endl;
    // search_position(cb, depth);
}



// void search_position(chessboard& cb, int depth) {
//     moves_lst moves;
//     cb.generate_moves(moves);

//     if (moves.count == 0) {
//         printf("bestmove (none)\n");
//         return;
//     }

//     // Placeholder: Select the first legal move
//     // Replace with your search algorithm (e.g., alpha-beta)
//     int best_move = moves.move_list[0];
//     chessboard cb_copy;
//     cb_copy.deep_copy(cb);
//     if (!cb.make_move(best_move, 1, cb_copy)) {
//         // Ensure the move is legal; if not, try another
//         for (int i = 1; i < moves.count; ++i) {
//             cb_copy.deep_copy(cb);
//             if (cb.make_move(moves.move_list[i], 1, cb_copy)) {
//                 best_move = moves.move_list[i];
//                 break;
//             }
//         }
//     }

//     // Convert move to UCI format
//     std::string uci_move = index_to_square(move_to_src(best_move)) +
//                           index_to_square(move_to_trg(best_move));
//     if (move_to_prom(best_move)) {
//         uci_move += prom_piece_list[move_to_prom(best_move)];
//     }

//     printf("bestmove %s\n", uci_move.c_str());
// }


void uci_loop(chessboard& cb) {
    // Reset stdin and stdout buffers for immediate I/O
    setbuf(stdin, NULL);
    setbuf(stdout, NULL);

    char input[2000];

    // Print engine identification
    printf("id name MyChessEngine\n");
    printf("id author YourName\n");
    printf("uciok\n");

    while (true) {
        // Clear input buffer
        memset(input, 0, sizeof(input));
        

        // Read input from GUI
        if (!fgets(input, 2000, stdin)) {
            continue; // Skip if no input is read
        }

        // Skip empty lines
        if (input[0] == '\n') {
            continue;
        }

        // Parse UCI commands
        if (strncmp(input, "isready", 7) == 0) {
            cout<<"readyok"<<endl;
        }
        else if (strncmp(input, "position", 8) == 0) {
            parse_position(cb, input);
        }
        else if (strncmp(input, "ucinewgame", 10) == 0) {
            parse_position(cb, "position startpos");
        }
        else if (strncmp(input, "go", 2) == 0) {
            parse_go(cb, input);
        }
        else if (strncmp(input, "quit", 4) == 0) {
            break; // Exit the loop and terminate
        }
        else if (strncmp(input, "uci", 3) == 0) {
            printf("id name MyChessEngine\n");
            printf("id author Jughead\n");
            printf("uciok\n");
        }
        fflush(stdout);
    }
}

int main() {
    ios::sync_with_stdio(false);
    // initalizing board
    chessboard cb;
    chessboard cb_copy;
    // cb.FEN(tricky_1);
    // cb.printPisces();
    // cb_copy.FEN(start_pos);
    
    

    //setting up the board 
    // try {
    //     cb.FEN(start_pos);
    //     cb.printPisces();
    //     cb_copy.FEN(start_pos);
    // } catch (const std::invalid_argument &e) {
    //     cerr << "Invalid argument: " << e.what() << endl;
    //     return 1;
    // } catch (const std::exception &e) {
    //     cerr << "Exception: " << e.what() << endl;
    //     return 1;
    // }

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

    // int move = uci_parse(cb,"g1f3");
    // if(move){
    //     cb.make_move(move,1,cb_copy);
    //     cb.printPisces();
    // }

    // cb.printPisces();
    // parse_pos(cb,"position startpos moves a2a3 b4a3",cb_copy); 
    // cb.printPisces();
    // parse_go(cb,"go depth 5",cb_copy);

    uci_loop(cb);
    cb.printPisces();
    // cb.board_eval();
    cout<<board_eval(cb)<<endl;
    // cout<<sizeof(cb.pisces)/sizeof(cb.pisces[0])<<endl;
    return 0;
}