#include <bits/stdc++.h>
#include <cstdint>
#include "board.h"
using namespace std;
chessboard::chessboard(){
  whitePawns = 0x000000000000FF00;
  whiteRooks = 0x0000000000000081;
  whiteKnights = 0x0000000000000042;
  whiteBishops = 0x0000000000000024;
  whiteQueen = 0x0000000000000008;
  whiteKing = 0x0000000000000010;
  blackPawns = 0x00FF000000000000;
  blackRooks = 0x8100000000000000;
  blackKnights = 0x4200000000000000;
  blackBishops = 0x2400000000000000;
  blackQueen = 0x0800000000000000;
  blackKing = 0x1000000000000000;
}
void chessboard::fillboard(char board[8][8],uint64_t bitboard,char piece){
  for(int i = 0;i<64;i++){
    if(bitboard&(1ULL<<i)){
      int rank = i/8;
      int file = i%8;
      board[rank][file] = piece;
    }
  }
}
void chessboard::printBoard(){
  char board[8][8];
  for(int i = 0;i<8;i++){
    for(int j = 0;j<8;j++){
      board[i][j] = '.';
    }
  }
  fillboard(board, whitePawns, 'P');
  fillboard(board, blackPawns, 'p');
  fillboard(board, whiteRooks, 'R');
  fillboard(board, blackRooks, 'r');
  fillboard(board, whiteKnights,'N');
  fillboard(board, blackKnights, 'n');
  fillboard(board, whiteBishops, 'B');
  fillboard(board, blackBishops, 'b');
  fillboard(board, whiteQueen, 'Q');
  fillboard(board, blackQueen, 'q');
  fillboard(board, whiteKing, 'K');
  fillboard(board, blackKing, 'k');
  for(int i = 0;i<8;i++){
    for(int j = 0;j<8;j++){
      cout<<board[i][j]<<" ";
    }
    cout<<endl;
  }
} 
