emcc wasmMain.cpp board.cpp engine.cpp gen_moves.cpp \
  -o ./client/src/engine.js \
    -Iinclude \
  -O3 \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="createEngineModule" \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
  -s EXPORTED_RUNTIME_METHODS=['cwrap','ccall'] \
  -s EXPORT_ES6=1 \
  -s ENVIRONMENT=web \
  -s SINGLE_FILE=1 \
  -s ASSERTIONS=2 -g4 \
  -s INITIAL_MEMORY=128MB \
  -s STACK_SIZE=16MB \
  -s EXPORTED_FUNCTIONS='["_create_chessboard","_wasm_parse_position","_wasm_parse_go"]'

