// #include "board.h"
#include "board.cpp"
using namespace std;
int main (int argc, char *argv[]) {
  chessboard cb;
  cb.setBit(f3);
  cb.setBit(f2);
  cb.setBit(h8);
  cb.setBit(c4);
  cb.printBoard();
  return 0;
}
