#ifndef BOARD_H
#define BOARD_H
#include <bits/stdc++.h>
#include <cstdint>
using namespace std;
class chessboard{
  void fillboard(char board[8][8],uint64_t bitboard,char piece);
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
  chessboard();
  void printBoard();
};
#endif
