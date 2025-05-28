import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import type { Square } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function App() {
  const [game, setGame] = useState(new Chess());
  const [gameOn, setGameOn] = useState(false);
  const [side, setSide] = useState<"white" | "black">("white");
  const ws = useRef<WebSocket | null>(null);



  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080/ws");
    ws.current.onopen = () => console.log("WebSocket connected");
    ws.current.onmessage = (event) => {
      const msg = event.data as string;
      console.log("Received:", msg);

      if(msg.includes("bestmove")){
        const text = (msg).trim();
        const tokens = text.split(/\s+/);            
        const bmIdx = tokens.indexOf("bestmove");
        if (bmIdx !== -1 && tokens[bmIdx + 1]) {
          const uci = tokens[bmIdx + 1];         
          const from = uci.slice(0, 2) as Square;
          const to   = uci.slice(2, 4) as Square;
          const prom = uci.length === 5 ? uci[4] : "";
          console.log(`Engine bestmove → from ${from} to ${to}` + (prom ? ` promote to ${prom}` : ""));
          
          setGame(currentGame => {
            const newGame = new Chess(currentGame.fen());
            console.log(`Attempting engine move on position: ${currentGame.fen()}`);
            const result = newGame.move({ from, to, promotion: prom });
            if (result) {
              console.log(`Engine move successful: ${result.san}`);
              return newGame;
            } else {
              console.log(`Engine move failed: ${from} to ${to}`);
              return currentGame;
            }
          });
        }
      }
      else if (msg.startsWith("pid:")) {
        console.log("Sending go depth 4 command");
        ws.current?.send("go depth 8");
      }
      else {
        console.log("Engine response:", msg);
      }
    };
    ws.current.onclose = () => console.log("WebSocket closed");
    return () => {
      ws.current?.close();
    };
  }, []);

  const startGame = () => {
    if (gameOn) {
      setGame(new Chess());
      setGameOn(false);
    } else {
      setGameOn(true);
      if(side === "black") {
        const initialFen = game.fen();
        console.log(`Sending position to engine: ${initialFen}`);
        ws.current?.send(`position fen ${initialFen}`);
      }
    }
  };

  const checkPromotion = (from: Square, to: Square, piece: string): boolean => {
    const isWhitePawn = piece === "wP" && from[1] === "7" && to[1] === "8";
    const isBlackPawn = piece === "bP" && from[1] === "2" && to[1] === "1";
    return isWhitePawn || isBlackPawn;
  };

  const handlePromotion = (piece: string, from: Square, to: Square): boolean => {
    const promotion = piece[1].toLowerCase();
    return makeMove(from, to, promotion);
  };

  const makeMove = (
    from: Square,
    to: Square,
    promotion: string = ""
  ): boolean => {
    if (!gameOn) return false;

    console.log(`Making move from ${from} to ${to} with promotion ${promotion}`);
    const newGame = new Chess(game.fen());
    const result = newGame.move({ from, to, promotion });
    if (result) {
      setGame(newGame);
      if (ws.current) {
        const userTurn = side.charAt(0); // "w" or "b" 
        const currentTurn = newGame.turn(); // "w" or "b"
        
        if (userTurn !== currentTurn) {
          const fen = newGame.fen();
          console.log(`Sending position to engine: ${fen}`);
          ws.current.send(`position fen ${fen}`);
        }
      }
      return true;
    }
    return false;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex items-center gap-8">
        {/* Chess Board */}
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-4 text-white">♟️ Chess Game</h1>
          <p className="mb-4 text-lg text-white">
            Turn: {game.turn() === "w" ? "White" : "Black"}
          </p>
          <div className="border-4 border-purple-600 rounded-xl p-2 bg-white shadow-lg">
            <Chessboard
              position={game.fen()}
              onPromotionCheck={checkPromotion}
              onPromotionPieceSelect={(piece, src, dest) =>
                handlePromotion(piece as string, src as Square, dest as Square)
              }
              onPieceDrop={(src, dest) =>
                makeMove(src, dest, "")
              }
              boardWidth={400}
              boardOrientation={side}
            />
          </div>
        </div>

        {/* Side & Controls */}
        <div className="flex flex-col gap-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-white text-lg font-semibold mb-3">Select Side</h3>
            <div className="flex flex-col gap-2">
              <button
                className={`px-4 py-2 rounded-lg transition-colors ${
                  side === "white"
                    ? "bg-white text-black"
                    : "bg-gray-600 text-white hover:bg-gray-500"
                }`}
                onClick={() => !gameOn && setSide("white")}
              >
                White
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition-colors ${
                  side === "black"
                    ? "bg-gray-900 text-white border-2 border-white"
                    : "bg-gray-600 text-white hover:bg-gray-500"
                }`}
                onClick={() => !gameOn && setSide("black")}
              >
                Black
              </button>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-white text-lg font-semibold mb-3">Game Control</h3>
            <button
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              onClick={startGame}
            >
              {gameOn ? "Quit" : "Start Game"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}