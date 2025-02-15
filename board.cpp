#include <bits/stdc++.h>
#include <cstdint>
#include "board.h"
using namespace std;

// initialize the bitboard to 0
chessboard::chessboard(){
  bitboard = 0ULL;
}

// print the board
void chessboard::printBoard(){
  cout<<endl;
  for(int i = 0;i<8;i++){
    for(int j = 0;j<8;j++){
      if(j==0)cout<< 8-i <<"  ";
      cout<<" "<<getBit(i*8+j);
    }
    cout<<endl;
  }
  cout<<endl;
  cout<<"    a b c d e f g h"<<endl;

  cout<<"\n Bitboard: "<< bitboard<<"\n"<<endl;
}
// set a bit in the bitboard
void chessboard::setBit(int square){
  bitboard|= (1ULL<<square);
}

// get a bit from the bitboard
int chessboard::getBit(int square){
  return (bitboard & (1ULL << square))?1:0;
}

// remove a bit from the bitboard
void chessboard::remBit(int square){
  bitboard &= ~(1ULL<<square);
}