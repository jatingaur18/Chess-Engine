#include "board.h"
#include "globals.h"
#include "engine.h"
#include <iostream>
#include <string>
#include <sstream>
// Note: emscripten/bind.h is not needed when using the extern "C" export method.

using namespace std;

// Global variables to hold engine state.
extern long long global_nodes;
long long global_nodes = 0;
chessboard cb;

// Parses a move in UCI format (e.g., "e2e4", "g1f3", "e7e8q")
// and finds the corresponding internal move representation.
int uci_parse(string mov){
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
    return 0; // Return 0 if the move is not found/illegal.
}

// Parses the UCI "position" command to set up the board.
// Handles "position startpos" and "position fen <fen> moves <moves...>"
void parse_position(const char* input) {
    std::istringstream iss(input);
    std::string token;
    chessboard cb_copy;

    iss >> token; // Skip "position"

    iss >> token; // Get mode ("startpos" or "fen")
    
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

    // Check for "moves" and apply them sequentially.
    iss >> token;
    if (token == "moves") {
        while (iss >> token) {
            int move = uci_parse(token);
            if (move) {
                cb_copy.deep_copy(cb);
                cb.make_move(move, 1, cb_copy);
            }
        }
    }
}

// Initiates a search for the best move from the current position.
string parse_go(int depth) {
    std::string best_move = search_position(cb, depth);
    // Return the full UCI-compliant response.
    return "bestmove " + best_move;
}

// Main function is not needed for a WASM library module.
int main() {
    return 0;
}


// This block exports C-style functions that can be easily called from JavaScript.
// Emscripten automatically adds a '_' prefix to these function names in the final JS module.
extern "C" {
  // Wrapper for parse_go. Returns a pointer to a C-style string.
  const char* wasm_parse_go(int depth) {
    // A static string is used to hold the result. Its memory persists between calls.
    // The returned char* pointer is valid until the next time this function is called.
    static std::string result;
    result = parse_go(depth);
    return result.c_str();
  }

  // Wrapper for parse_position.
  void wasm_parse_position(const char* input) {
    parse_position(input);
  }

  // Initializes the chessboard and other necessary engine components.
  // This should be called once when the WASM module is loaded.
  void create_chessboard() {
    cb.FEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    cb.init_zobrist_keys();
    cb.init_hash();
  }
}
