import { useState } from "react";
import { Chess } from "chess.js";
import type {  Square} from "chess.js";
import { Chessboard } from "react-chessboard";

export default function App() {
  const [game, setGame] = useState(new Chess());
  const checkPromotion = (sourceSquare: Square, targetSquare: Square, piece: string): boolean => {
    const isWhitePawn = piece === "wP" && sourceSquare[1] === "7" && targetSquare[1] === "8";
    const isBlackPawn = piece === "bP" && sourceSquare[1] === "2" && targetSquare[1] === "1";
    return isWhitePawn || isBlackPawn;
  };

  const handlePromotion = (piece: string, from: Square, to: Square): boolean => {
    const promotion = piece[1].toLowerCase();
    console.log("Promotion piece:", promotion);
    return makeMove(from, to, promotion);
  };


  const makeMove = (from: Square, to: Square, promotion: string = " ",piece:string = " "): boolean => {
    if(checkPromotion(from,to,piece) && promotion === " ") {
      return true;
    }
    // console.log("Move from:", from, "to:", to, "promotion:", promotion);
    const newGame = new Chess(game.fen());
    const result = newGame.move({ from, to, promotion });
    if (result) {
      setGame(newGame);
      return true;
    }
    return true;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">♟️ Chess Game</h1>
      <p className="mb-4 text-lg">Turn: {game.turn() === "w" ? "White" : "Black"}</p>
      <div className="border-4 border-purple-600 rounded-xl p-2 bg-white shadow-lg">
        <Chessboard
          position={game.fen()}
          onPromotionCheck={checkPromotion}
          onPromotionPieceSelect={(piece,sourceSquare, targetSquare) =>
            handlePromotion(piece as string, sourceSquare as Square, targetSquare as Square)
          }
          onPieceDrop={(sourceSquare, targetSquare, piece) =>
            makeMove(sourceSquare, targetSquare," ",piece as string)
          }
          boardWidth={400}
        />
      </div>
    </div>
  );
}
