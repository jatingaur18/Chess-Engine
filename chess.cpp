#include <bits/stdc++.h>
#include <cstdint>
using namespace std;
class chessBoard{
void fillboard(char board [8][8] ,uint64_t bitboard,char piece){
    for(int i = 0;i<64;i++){
      if(bitboard & (1ULL<<i)){
        int row = i/8;
        int col = i%8;
        board[row][col] = piece;
        // cout<<"row:"<<row<<" "<<"col:"<<col<<endl;
      }
    }
  }
  public:
  uint64_t whitePawns;
  uint64_t whiteRooks;
  uint64_t whiteKnights;
  uint64_t whiteBishops;
  uint64_t whiteQueen;
  uint64_t whiteKing;

  uint64_t blackPawns;
  uint64_t blackRooks;
  uint64_t blackKnights;
  uint64_t blackBishops;
  uint64_t blackQueen;
  uint64_t blackKing;
  enum Piece{
    nWhite,
    nBlack,
    nPawn,
    nKnight,
    nBishop,
    nRook,
    nQueen,
    nKing
  };
  chessBoard(){
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
  

  void printBoard(){
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
  
};
// a-file             0x0101010101010101
// h-file             0x8080808080808080
// 1st rank           0x00000000000000FF
// 8th rank           0xFF00000000000000
// a1-h8 diagonal     0x8040201008040201
// h1-a8 antidiagonal 0x0102040810204080
// light squares      0x55AA55AA55AA55AA
// dark squares       0xAA55AA55AA55AA55
int main (int argc, char *argv[]) {
  chessBoard cb;
  cb.printBoard();
   
  return 0;
}
