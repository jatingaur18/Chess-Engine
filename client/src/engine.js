// This code implements the `-sMODULARIZE` settings by taking the generated
// JS program code (INNER_JS_CODE) and wrapping it in a factory function.

// When targetting node and ES6 we use `await import ..` in the generated code
// so the outer function needs to be marked as async.
async function createEngineModule(moduleArg = {}) {
  var moduleRtn;

// include: shell.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = moduleArg;

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = true;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

var _scriptName = import.meta.url;

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

if (ENVIRONMENT_IS_SHELL) {

  const isNode = typeof process == 'object' && process.versions?.node && process.type != 'renderer';
  if (isNode || typeof window == 'object' || typeof WorkerGlobalScope != 'undefined') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  try {
    scriptDirectory = new URL('.', _scriptName).href; // includes trailing slash
  } catch {
    // Must be a `blob:` or `data:` URL (e.g. `blob:http://site.com/etc/etc`), we cannot
    // infer anything from them.
  }

  if (!(typeof window == 'object' || typeof WorkerGlobalScope != 'undefined')) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  {
// include: web_or_worker_shell_read.js
readAsync = async (url) => {
    assert(!isFileURI(url), "readAsync does not work with file:// URLs");
    var response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
      return response.arrayBuffer();
    }
    throw new Error(response.status + ' : ' + response.url);
  };
// end include: web_or_worker_shell_read.js
  }
} else
{
  throw new Error('environment detection error');
}

var out = console.log.bind(console);
var err = console.error.bind(console);

var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var FETCHFS = 'FETCHFS is no longer included by default; build with -lfetchfs.js';
var ICASEFS = 'ICASEFS is no longer included by default; build with -licasefs.js';
var JSFILEFS = 'JSFILEFS is no longer included by default; build with -ljsfilefs.js';
var OPFS = 'OPFS is no longer included by default; build with -lopfs.js';

var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';

// perform assertions in shell.js after we set up out() and err(), as otherwise
// if an assertion fails it cannot print the message

assert(!ENVIRONMENT_IS_WORKER, 'worker environment detected but not enabled at build time.  Add `worker` to `-sENVIRONMENT` to enable.');

assert(!ENVIRONMENT_IS_NODE, 'node environment detected but not enabled at build time.  Add `node` to `-sENVIRONMENT` to enable.');

assert(!ENVIRONMENT_IS_SHELL, 'shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable.');

// end include: shell.js

// include: preamble.js
// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;

if (typeof WebAssembly != 'object') {
  err('no native wasm support detected');
}

// Wasm globals

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed' + (text ? ': ' + text : ''));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.
function _malloc() {
  abort('malloc() called but not included in the build - add `_malloc` to EXPORTED_FUNCTIONS');
}
function _free() {
  // Show a helpful error since we used to include free by default in the past.
  abort('free() called but not included in the build - add `_free` to EXPORTED_FUNCTIONS');
}

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */
var isFileURI = (filename) => filename.startsWith('file://');

// include: runtime_common.js
// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[((max)>>2)] = 0x02135467;checkInt32(0x02135467);
  HEAPU32[(((max)+(4))>>2)] = 0x89BACDFE;checkInt32(0x89BACDFE);
  // Also test the global address 0 for integrity.
  HEAPU32[((0)>>2)] = 1668509029;checkInt32(1668509029);
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = HEAPU32[((max)>>2)];
  var cookie2 = HEAPU32[(((max)+(4))>>2)];
  if (cookie1 != 0x02135467 || cookie2 != 0x89BACDFE) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[((0)>>2)] != 0x63736d65 /* 'emsc' */) {
    abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
}
// end include: runtime_stack_check.js
// include: runtime_exceptions.js
// end include: runtime_exceptions.js
// include: runtime_debug.js
var runtimeDebug = true; // Switch to false at runtime to disable logging at the right times

// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(...args) {
  if (!runtimeDebug && typeof runtimeDebug != 'undefined') return;
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn(...args);
}

// Endianness check
(() => {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)';
})();

function consumedModuleProp(prop) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      set() {
        abort(`Attempt to set \`Module.${prop}\` after it has already been processed.  This can happen, for example, when code is injected via '--post-js' rather than '--pre-js'`);

      }
    });
  }
}

function makeInvalidEarlyAccess(name) {
  return () => assert(false, `call to '${name}' via reference taken before Wasm module initialization`);

}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === 'FS_createPath' ||
         name === 'FS_createDataFile' ||
         name === 'FS_createPreloadedFile' ||
         name === 'FS_preloadFile' ||
         name === 'FS_unlink' ||
         name === 'addRunDependency' ||
         // The old FS has some functionality that WasmFS lacks.
         name === 'FS_createLazyFile' ||
         name === 'FS_createDevice' ||
         name === 'removeRunDependency';
}

function missingLibrarySymbol(sym) {

  // Any symbol that is not included from the JS library is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        var msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        abort(msg);
      }
    });
  }
}

var MAX_UINT8  = (2 **  8) - 1;
var MAX_UINT16 = (2 ** 16) - 1;
var MAX_UINT32 = (2 ** 32) - 1;
var MAX_UINT53 = (2 ** 53) - 1;
var MAX_UINT64 = (2 ** 64) - 1;

var MIN_INT8  = - (2 ** ( 8 - 1));
var MIN_INT16 = - (2 ** (16 - 1));
var MIN_INT32 = - (2 ** (32 - 1));
var MIN_INT53 = - (2 ** (53 - 1));
var MIN_INT64 = - (2 ** (64 - 1));

function checkInt(value, bits, min, max) {
  assert(Number.isInteger(Number(value)), `attempt to write non-integer (${value}) into integer heap`);
  assert(value <= max, `value (${value}) too large to write as ${bits}-bit value`);
  assert(value >= min, `value (${value}) too small to write as ${bits}-bit value`);
}

var checkInt1 = (value) => checkInt(value, 1, 1);
var checkInt8 = (value) => checkInt(value, 8, MIN_INT8, MAX_UINT8);
var checkInt16 = (value) => checkInt(value, 16, MIN_INT16, MAX_UINT16);
var checkInt32 = (value) => checkInt(value, 32, MIN_INT32, MAX_UINT32);
var checkInt53 = (value) => checkInt(value, 53, MIN_INT53, MAX_UINT53);
var checkInt64 = (value) => checkInt(value, 64, MIN_INT64, MAX_UINT64);

// end include: runtime_debug.js
var readyPromiseResolve, readyPromiseReject;

// Memory management

var wasmMemory;

var
/** @type {!Int8Array} */
  HEAP8,
/** @type {!Uint8Array} */
  HEAPU8,
/** @type {!Int16Array} */
  HEAP16,
/** @type {!Uint16Array} */
  HEAPU16,
/** @type {!Int32Array} */
  HEAP32,
/** @type {!Uint32Array} */
  HEAPU32,
/** @type {!Float32Array} */
  HEAPF32,
/** @type {!Float64Array} */
  HEAPF64;

// BigInt64Array type is not correctly defined in closure
var
/** not-@type {!BigInt64Array} */
  HEAP64,
/* BigUint64Array type is not correctly defined in closure
/** not-@type {!BigUint64Array} */
  HEAPU64;

var runtimeInitialized = false;



function updateMemoryViews() {
  var b = wasmMemory.buffer;
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  HEAP32 = new Int32Array(b);
  HEAPU32 = new Uint32Array(b);
  HEAPF32 = new Float32Array(b);
  HEAPF64 = new Float64Array(b);
  HEAP64 = new BigInt64Array(b);
  HEAPU64 = new BigUint64Array(b);
}

// include: memoryprofiler.js
// end include: memoryprofiler.js
// end include: runtime_common.js
assert(typeof Int32Array != 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined,
       'JS engine does not provide full typed array support');

function preRun() {
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  consumedModuleProp('preRun');
  // Begin ATPRERUNS hooks
  callRuntimeCallbacks(onPreRuns);
  // End ATPRERUNS hooks
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  setStackLimits();

  checkStackCookie();

  // No ATINITS hooks

  wasmExports['__wasm_call_ctors']();

  // No ATPOSTCTORS hooks
}

function postRun() {
  checkStackCookie();
   // PThreads reuse the runtime from the main thread.

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  consumedModuleProp('postRun');

  // Begin ATPOSTRUNS hooks
  callRuntimeCallbacks(onPostRuns);
  // End ATPOSTRUNS hooks
}

/** @param {string|number=} what */
function abort(what) {
  Module['onAbort']?.(what);

  what = 'Aborted(' + what + ')';
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);

  readyPromiseReject?.(e);
  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

// show errors on likely calls to FS when it was not included
var FS = {
  error() {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM');
  },
  init() { FS.error() },
  createDataFile() { FS.error() },
  createPreloadedFile() { FS.error() },
  createLazyFile() { FS.error() },
  open() { FS.error() },
  mkdev() { FS.error() },
  registerDevice() { FS.error() },
  analyzePath() { FS.error() },

  ErrnoError() { FS.error() },
};


function createExportWrapper(name, nargs) {
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    var f = wasmExports[name];
    assert(f, `exported native function \`${name}\` not found`);
    // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return f(...args);
  };
}

var wasmBinaryFile;

function findWasmBinary() {
  return base64Decode('AGFzbQEAAAABmAMyYAF/AX9gAX8AYAJ/fwBgA39/fwF/YAJ/fwF/YAZ/f39/f38Bf2AEf39/fwF/YAV/f39/fwF/YAN/f38AYAR/f39/AGAGf39/f39/AGAFf39/f38AYAh/f39/f39/fwF/YAAAYAd/f39/f39/AX9gAAF/YAV/fn5+fgBgB39/f39/f38AYAV/f39/fgF/YAJ/fgF+YAN/fn8BfmAEf35+fwBgBX9/fn9/AGAKf39/f39/f39/fwF/YAR/f39/AX5gDH9/f39/f39/f39/fwF/YAV/f39/fAF/YAZ/f39/fn4Bf2ALf39/f39/f39/f38Bf2AHf39/f39+fgF/YAp/f39/f39/f39/AGAPf39/f39/f39/f39/f39/AGAIf39/f39/f38AYAR/fn9/AX9gAnx/AXxgAn5+AXxgAn5/AX9gBn98f39/fwF/YAJ/fgBgAn98AGAEfn5+fgF/YAN+fn4Bf2ABfwF8YAR/fn5+AGACf38BfmACfn4BfWADf39+AGAEf39/fgF+YAN/f38BfWADf39/AXwCowIKA2VudgtfX2N4YV90aHJvdwAIA2VudhZlbXNjcmlwdGVuX3Jlc2l6ZV9oZWFwAAADZW52CV9hYm9ydF9qcwANFndhc2lfc25hcHNob3RfcHJldmlldzEIZmRfY2xvc2UAABZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxCGZkX3dyaXRlAAYWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQdmZF9zZWVrACEWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MRFlbnZpcm9uX3NpemVzX2dldAAEFndhc2lfc25hcHNob3RfcHJldmlldzELZW52aXJvbl9nZXQABANlbnYJX3R6c2V0X2pzAAkDZW52F19faGFuZGxlX3N0YWNrX292ZXJmbG93AAED5wPlAw0BBAABAQ0EAQEAAQ0TExMDBAIBAQAGAwIBAgAADQgAAAMUAAEAAAMNDw8PBAQiFRUjAwgDBwgACCQLJQIAAQQCAAABAAECAxYJAwQAAAQDAAABAQEEAAACBAIEAAACAAACCAICAAQEBBYEAAEJAAEAAQ0BAgAABAIAAQIUBgEmAAIQECcoKSorAhAVEBAQCSwtLgMDBAYDAwAEBAMBBC8ABwAGCQEHCQMHCQgDBQEOBAUACBcG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ACgCACIANgKARyABQYDHAGoiAiAAQQxrKAIAakHszwAoAgA2AgAgAUEANgKERyACIAEoAoBHQQxrKAIAaiIAIAFBiMcAaiICEIUBIABBADoAUCAAQoCAgIBwNwJIIAFB3M8ANgK8RyABQcjPADYCgEcgAUGIzAA2AohHIAFBjMcAahDaAiEIIAFBoMcAakIANwIAIAFBmMcAakIANwIAIAFBsMcAakIANwIAIAFCADcCkEcgAUIANwKoRyABQfjMADYCiEcgAUEINgK4RyACIAFB0ABqEG0gASwAW0EASARAIAEoAlgaIAEoAlAQSAsgAUH4xgBqQQA2AgAgAUIANwPwRiABQdAAahAUIQkgAUGAxwBqIgAgAUHwxgBqIgIQDBogACACEAwaAkACQCABKAL0RiABLAD7RiIAIABBAEgbQQNrDgYBBAQEBAAECyABKALwRiABQfDGAGogAEEASBspAABC8+iFk8eO3LfzAFINAyABQcAAEMEDIgA2AkQgAUK4gICAgIiAgIB/NwJIIABBnA8pAAA3ADAgAEGUDykAADcAKCAAQYwPKQAANwAgIABBhA8pAAA3ABggAEH8DikAADcAECAAQfQOKQAANwAIIABB7A4pAAA3AAAgAEEAOgA4IAFBxABqEBUgASwAT0EATg0DIAEoAkwaIAEoAkQQSAwDCyABKALwRiABQfDGAGogAEEASBsiAC8AAEHmygFzIAAtAAJB7gBzcg0CIAFBADoAOCABQQA6AEMDQCABQYDHAGogAUHwxgBqEAwaIAEoAvRGIAEsAPtGIgAgAEEASCIFGyICQQFqIgNB+P///wdPDQECQAJAIANBC08EQCADQQdyIgZBAWoQwQMhACABIAM2AiwgASAANgIoIAEgBkH/////B2s2AjAMAQsgAUEANgIwIAFCADcDKCABIAM6ADMgAUEoaiEAIAJFDQELIAJFDQAgACABKALwRiABQfDGAGogBRsgAvwKAAALIAAgAmpBIDsAACABQThqIAEoAiggAUEoaiABLAAzIgBBAEgiAhsgASgCLCAAIAIbEMoDGiABLAAzQQBIBEAgASgCMBogASgCKBBICyAEQQFqIgRBBkcNAAsMAQtB2AAQR0HQAGoiAEHsvAE2AgAgAEGYvQE2AgBB1gsQJSIBQQ1qEMEDIgJBADYCCCACIAE2AgQgAiAB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oIcCKAIAEEgLC+oCAEG/iAIsAABBAEgEQEG8iAIoAgAaQbSIAigCABBIC0GziAIsAABBAEgEQEGwiAIoAgAaQaiIAigCABBIC0GniAIsAABBAEgEQEGkiAIoAgAaQZyIAigCABBIC0GbiAIsAABBAEgEQEGYiAIoAgAaQZCIAigCABBIC0GPiAIsAABBAEgEQEGMiAIoAgAaQYSIAigCABBIC0GDiAIsAABBAEgEQEGAiAIoAgAaQfiHAigCABBIC0H3hwIsAABBAEgEQEH0hwIoAgAaQeyHAigCABBIC0HrhwIsAABBAEgEQEHohwIoAgAaQeCHAigCABBIC0HfhwIsAABBAEgEQEHchwIoAgAaQdSHAigCABBIC0HThwIsAABBAEgEQEHQhwIoAgAaQciHAigCABBIC0HHhwIsAABBAEgEQEHEhwIoAgAaQbyHAigCABBIC0G7hwIsAABBAEgEQEG4hwIoAgAaQbCHAigCABBICwuOAwIKfgV/IABC//+DgICAQDcDACAAQQhqQcASQeAA/AoAACAAQgA3A5g2IABCATcDiAEgAEL/////DzcDgAEgAEIPNwNoIABBoMIAaiEMIABBoD5qIQ0gAEGgOmohDiAAQaA2aiEPA0AgDyABp0EDdCILakIBIAGGIgJCCYhC//79+/fv3z+DIgMgAkIHiEL+/fv379+//wCDIgSENwMAIAsgDmpCgAEgAYZCgP79+/fv37//AIMiBUKABCABhkKA/Pv379+//36DIgaENwMAIAsgDWogAkL8+fPnz5+//nyDIgdCBoYgAkL+/fv379+//36DIghCD4aEIAJC//79+/fv37//AIMiCUIRhoQgAkK//vz58+fPnz+DIgpCCoaEIApCBoiEIAlCD4iEIAhCEYiEIAdCCoiENwMAIAsgDGogAkIBiEL//v379+/fv/8Ag0ICIAGGQv79+/fv37//foNCgAIgAYYgAkIIiISEhCAGhCAFhCAEhCADhDcDACABQgF8IgFCwABSDQALIAALhw0CCH8CfiMAQfABayIBIgMjA0sgAyMESXIEQCADEAkLIAMkAEHgwQFCADcDAEHowQFCADcDAEHwwAFBAEHoAPwLAEH4wQFCATcDAEHYwQFCADcDAEHwwQFC/////w83AwAgAUHczwA2ApwBIAFBADYCuAEgAUHozwAoAgAi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QCAAQXhBCCAEGyAFaiICQQN0akGQMWopAwAgEoUhEgsgACACNgKAASAOIAAoAmhBA3RqKQMAIhUgEoUhFAJAIAFBgICABHFFDQACQAJAAkACQCAFQQJrDgUCBAQEAQALQoCAgICAgICAICETQv//////////3wAhEkEgIQZB+BAhAkGIESEDAkAgBUE6aw4FAAQEBAMEC0KAgICAgICAgAghE0L//////////3YhEkHoECECQdAQIQMMAgtCICETQt9+IRJB0AAhBkG4JSECQcglIQMMAQtCCCETQnYhEkHQACEGQaglIQJBkCUhAwsgACACaikDACAAIANqKQMAIAAgBmoiAiACKQMAIBKDIBOENwMAIAkgCSkDACASgyAThDcDAIUgFIUhFAsgFCAAKQOQNiITQgAgBBuFIBWFIRQCQCABQYCAgAJxRQRAIARFIQIMAQsgCEEAQQYgBBsiAUEDdGoiAkJ+QXBBACAEQQFGGyIFIAdBCGoiA2qtiSISIAIpAwCDNwMAIA0gBEUiAkEDdGoiByAHKQMAIBKDNwMAIAogAUEJdGogBUEDdGogA0EDdGopAwAgFIUhFAsgACACNgKMASAAIAApA3ggACkDcIQ3AwAgAEEAIAAoAoQBQQFqQQAgDBsgEBs2AoQBAn8gBARAQgAhE0ELDAELIAAgACgCiAFBAWo2AogBQQULIQEgACATIBSFNwOYNiAAQT8gCCABQQN0aikDAHmnayACEBpBAXMLtQEBAX5CASABrYYiAiAAKQMIg0IAUgRADwsgACkDECACg0IAUgRADwsgACkDGCACg0IAUgRADwsgACkDICACg0IAUgRADwsgACkDKCACg0IAUgRADwsgACkDMCACg0IAUgRADwsgACkDOCACg0IAUgRADwsgACkDQCACg0IAUgRADwsgACkDSCACg0IAUgRADwsgACkDUCACg0IAUgRADwsgACkDWCACg0IAUgRADwsgACkDYBoLIABBy4gCLAAAQQBIBEBByIgCKAIAGkHAiAIoAgAQSAsLIwBBzIgCKAIAIgAEQEHQiAIgADYCAEHUiAIoAgAaIAAQSAsL6wICBX8CfiAAQQhqIQQDQCAEIANBA3RqKQMAIgZCAFIEQCADQQJ0KAKgNSEFA0AgASAFaiEBIAZ6IgenIQICQAJAAkACQAJAAkACQAJAAkAC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AkHAACADa62GIAEgA60iBIiEIQEgAiAEiCECCyAAIAE3AwAgACACNwMIC6UEAgJ+BX8jAEEgayIEIwNLIAQjBElyBEAgBBAJCyAEJAAgAUL///////8/gyECAn4gAUIwiEL//wGDIgOnIgVBgfgAa0H9D00EQCACQgSGIABCPIiEIQIgBUGA+ABrrSEDAkAgAEL//////////w+DIgBCgYCAgICAgIAIWgRAIAJCAXwhAgwBCyAAQoCAgICAgICACFINACACQgGDIAJ8IQILQgAgAiACQv////////8HViIFGyEAIAWtIAN8DAELAkAgACAChFANACADQv//AVINACACQgSGIABCPIiEQoCAgICAgIAEhCEAQv8PDAELIAVB/ocBSwRAQgAhAEL/DwwBC0GA+ABBgfgAIANQIgYbIgggBWsiB0HwAEoEQEIAIQBCAAwBCyACIAJCgICAgICAwACEIAYbIQJBACEGIAUgCEcEQCAEQRBqIAAgAkGAASAHaxA5IAQpAxAgBCkDGIRCAFIhBgsgBCAAIAIgBxA6IAQpAwhCBIYgBCkDACICQjyIhCEAAkAgBq0gAkL//////////w+DhCICQoGAgICAgICACFoEQCAAQgF8IQAMAQsgAkKAgICAgICAgAhSDQAgAEIBgyAAfCEACyAAQoCAgICAgIAIhSAAIABC/////////wdWIgUbIQAgBa0LIQIgBEEgaiIEIwNLIAQjBElyBEAgBBAJCyAEJAAgAUKAgICAgICAgIB/gyACQjSGhCAAhL8LwQEBA38CQCACKAIQIgMEfyADBSACEDANASACKAIQCyACKAIUIgRrIAFJBEAgAiAAIAEgAigCJBEDAA8LAkACQCACKAJQQQBIDQAgAUUNACABIQMDQCAAIANqIgVBAWstAABBCkcEQCADQQFrIgMNAQwCCwsgAiAAIAMgAigCJBEDACIEIANJDQIgASADayEBIAIoAhQhBAwBCyAAIQVBACEDCyAEIAUgARAoIAIgAigCFCABajYCFCABIANqIQQLIAQL8AICAn8BfgJAIAJFDQAgACABOgAAIAAgAmoiA0EBayABOgAAIAJBA0kNACAAIAE6AAIgACABOgABIANBA2sgAToAACADQQJrIAE6AAAgAkEHSQ0AIAAgAToAAyADQQRrIAE6AAAgAkEJSQ0AIABB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AXMLDAAgACgCABBhGiAACzEBAX8gACgCDCIBIAAoAhBGBEAgACAAKAIAKAIoEQAADwsgACABQQFqNgIMIAEtAAALDwAgACAAKAIQIAFyEIIBCz8BAX8gACgCGCICIAAoAhxGBEAgACABQf8BcSAAKAIAKAI0EQQADwsgACACQQFqNgIYIAIgAToAACABQf8BcQsjAQF/AkAgACgCACICRQ0AIAIgARBjQX9HDQAgAEEANgIACwsQACAAEIABIAEQgAFzQQFzCwwAIAAoAgAQZxogAAsxAQF/IAAoAgwiASAAKAIQRgRAIAAgACgCACgCKBEAAA8LIAAgAUEEajYCDCABKAIAC1QBAn8CQCAAKAIAIgJFDQACfyACKAIYIgMgAigCHEYEQCACIAEgAigCACgCNBEEAAwBCyACIANBBGo2AhggAyABNgIAIAELQX9HDQAgAEEANgIACwsHACAAKAIICwcAIAAoAgwLyAEBAn8jAEEQayICIwNLIAIjBElyBEAgAhAJCyACJAAgAC0AC0EHdgRAIAAoAggaIAAoAgAQSAsCfyABLQALQQd2BEAgASgCBAwBCyABLQALCxogAS0AC0EHdiEDIAAgASgCCDYCCCAAIAEpAgA3AgAgAUEAOgALIAJBADoADyABIAItAA86AAACQCAAIAFGIgENACADDQALIAAtAAtBB3YhAAJAIAENACAADQALIAJBEGoiACMDSyAAIwRJcgRAIAAQCQsgACQAC/YBAQN/AkAjAEEQayIDIwNLIAMjBElyBEAgAxAJCyADJAAgAiABayIFQff///8HTQRAAkAgBUELSQRAIAAgBUH/AHE6AAsgACEEDAELIANBCGogBUELTwR/IAVBCGpBeHEiBCAEQQFrIgQgBEELRhsFQQoLQQFqEH4gAygCDBogACADKAIIIgQ2AgAgACADKAIMQYCAgIB4cjYCCCAAIAU2AgQLAkAgAiABayIARSICDQAgAg0AIAQgASAA/AoAAAsgA0EAOgAHIAAgBGogAy0ABzoAACADQRBqIgAjA0sgACMESXIEQCAAEAkLIAAkAAwBCxB8AAsLrQYBBX8CQCABIABBIGoiAkYNACACLQALQQd2RQRAIAEtAAtBB3ZFBEAgAiABKQIANwIAIAIgASgCCDYCCCACLQALGgwCCwJ/IAEtAAtBB3YEQCABKAIA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DAELIAAgAUEPakEBIAAoAiQRAwBBAUcNACABLQAPGgsgAUEQaiIAIwNLIAAjBElyBEAgABAJCyAAJAALRwECfyAAIAE3A3AgACAAKAIsIAAoAgQiA2usNwN4IAAoAgghAgJAIAFQDQAgASACIANrrFkNACADIAGnaiECCyAAIAI2AmgLsQICA38CfgJAIAApA3AiBEIAUiAEIAApA3ggACgCBCICIAAoAiwiAWusfCIFV3FFBEAjAEEQayIBIwNLIAEjBElyBEAgARAJCyABJABBfyECAkAgABBMDQAgACABQQ9qQQEgACgCIBEDAEEBRw0AIAEtAA8hAgsgAUEQaiIBIwNLIAEjBElyBEAgARAJCyABJAAgAiIDQQBODQEgACgCBCECIAAoAiwhAQsgAEJ/NwNwIAAgAjYCaCAAIAUgASACa6x8NwN4QX8PCyAFQgF8IQUgACgCBCECIAAoAgghAQJAIAApA3AiBFANACAEIAV9IgQgASACa6xZDQAgAiAEp2ohAQsgACABNgJoIAAgBSAAKAIsIgAgAmusfDcDeCAAIAJPBEAgAkEBayADOgAACyADC6oBAgJ/AX4jAEEQayICIwNLIAIjBElyBEAgAhAJCyACJAAgAAJ+IAFFBEBCAAwBCyACIAEgAUEfdSIDcyADayIDrUIAIANnIgNB0QBqEDkgAikDCEKAgICAgIDAAIVBnoABIANrrUIwhnxCgICAgICAgICAf0IAIAFBAEgbhCEEIAIpAwALNwMAIAAgBDcDCCACQRBqIgAjA0sgACMESXIEQCAAEAkLIAAkAAvzCgIFfwl+IwBB4ABrIgUjA0sgBSMESXIEQCAFEAkLIAUkACAEQv///////z+DIQogAiAEhUKAgICAgICAgIB/gyELIAJC////////P4MiDEIgiCEPIARCMIinQf//AXEhBwJAAkAgAkIwiKdB//8BcSIJQf//AWtBgoB+TwRAIAdB//8Ba0GBgH5LDQELIAFQIAJC////////////AIMiDUKAgICAgIDA//8AVCANQoCAgICAgMD//wBRG0UEQCACQoCAgICAgCCEIQsMAgsgA1AgBEL///////////8AgyICQoCAgICAgMD//wBUIAJCgICAgICAwP//AFEbRQRAIARCgICAgICAIIQhCyADIQEMAgsgASANQoCAgICAgMD//wCFhFAEQCACIAOEUARAQoCAgICAgOD//wAhC0IAIQEMAwsgC0KAgICAgIDA//8AhCELQgAhAQwCCyADIAJCgICAgICAwP//AIWEUARAIAEgDYRCACEBUARAQoCAgICAgOD//wAhCwwDCyALQoCAgICAgMD//wCEIQsMAgsgASANhFAEQEIAIQEMAgsgAiADhFAEQEIAIQEMAgsgDUL///////8/WARAIAVB0ABqIAEgDCABIAwgDFAiBht5QsAAQgAgBht8pyIGQQ9rEDlBECAGayEGIAUpA1giDEIgiCEPIAUpA1AhAQsgAkL///////8/Vg0AIAVBQGsgAyAKIAMgCiAKUCIIG3lCwABCACAIG3ynIghBD2sQOSAGIAhrQRBqIQYgBSkDSCEKIAUpA0AhAwsgByAJaiAGakH//wBrIQYCQCAKQg+GIg5CIIhCgICAgAiEIgIgAUIgiCIEfiIQIANCD4YiEUIgiCIKIA9CgIAEhCINfnwiDyAQVK0gDyADQjGIIA6EQv////8PgyIDIAxC/////w+DIgx+fCIOIA9UrXwgAiANfnwgDiAOIBFCgID+/w+DIg8gDH4iESAEIAp+fCIQIBFUrSAQIBAgAyABQv////8PgyIBfnwiEFatfHwiDlatfCADIA1+IhIgAiAMfnwiESASVK1CIIYgEUIgiIR8IA4gDiARQiCGfCIOVq18IA4gDSAPfiINIAogDH58IgwgASACfnwiAiADIAR+fCIDQiCIIAIgA1atIAwgDVStIAIgDFStfHxCIIaEfCICIA5UrXwgAiAQIAQgD34iDCABIAp+fCIEQiCIIAQgDFStQiCGhHwiCiAQVK0gCiADQiCGfCIDIApUrXx8IgogAlStfCAKIAMgBEIghiICIAEgD358IgEgAlStfCICIANUrXwiBCAKVK18IgNCgICAgICAwACDQgBSBEAgBkEBaiEGDAELIAFCP4ggA0IBhiAEQj+IhCEDIARCAYYgAkI/iIQhBCABQgGGIQEgAkIBhoQhAgsgBkH//wFOBEAgC0KAgICAgIDA//8AhCELQgAhAQwBCwJ+IAZBAEwEQEEBIAZrIgdB/wBNBEAgBUEwaiABIAIgBkH/AGoiBhA5IAVBIGogBCADIAYQOSAFQRBqIAEgAiAHEDogBSAEIAMgBxA6IAUpAzAgBSkDOIRCAFKtIAUpAyAgBSkDEISEIQEgBSkDKCAFKQMYhCECIAUpAwAhBCAFKQMIDAILQgAhAQwCCyADQv///////z+DIAatQjCGhAsgC4QhCyABUCACQgBZIAJCgICAgICAgICAf1EbRQRAIAsgBEIBfCIBUK18IQsMAQsgASACQoCAgICAgICAgH+FhEIAUgRAIAQhAQwBCyALIAQgBEIBg3wiASAEVK18IQsLIAAgATcDACAAIAs3AwggBUHgAGoiACMDSyAAIwRJcgRAIAAQCQsgACQAC/YJAgR/BH4jAEHwAGsiBiIFIwNLIAUjBElyBEAgBRAJCyAFJAAgBEL///////////8AgyEJAkACQCABUCIFIAJC////////////AIMiCkKAgICAgIDA//8AfUKAgICAgIDAgIB/VCAKUBtFBEAgA0IAUiAJQoCAgICAgMD//wB9IgtCgICAgICAwICAf1YgC0KAgICAgIDAgIB/URsNAQsgBSAKQoCAgICAgMD//wBUIApCgICAgICAwP//AFEbRQRAIAJCgICAgICAIIQhBCABIQMMAgsgA1AgCUKAgICAgIDA//8AVCAJQoCAgICAgMD//wBRG0UEQCAEQoCAgICAgCCEIQQMAgsgASAKQoCAgICAgMD//wCFhFAEQEKAgICAgIDg//8AIAIgASADhSACIASFQoCAgICAgICAgH+FhFAiBRshBEIAIAEgBRshAwwCCyADIAlCgICAgICAwP//AIWEUA0BIAEgCoRQBEAgAyAJhEIAUg0CIAEgA4MhAyACIASDIQQMAgsgAyAJhEIAUg0AIAEhAyACIQQMAQsgAyABIAEgA1QgCSAKViAJIApRGyIIGyEKIAQgAiAIGyIMQv///////z+DIQkgAiAEIAgbIgtCMIinQf//AXEhByAMQjCIp0H//wFxIgVFBEAgBkHgAGogCiAJIAogCSAJUCIFG3lCwABCACAFG3ynIgVBD2sQOSAGKQNoIQkgBikDYCEKQRAgBWshBQsgASADIAgbIQMgC0L///////8/gyEBIAcEfiABBSAGQdAAaiADIAEgAyABIAFQIgcbeULAAEIAIAcbfKciB0EPaxA5QRAgB2shByAGKQNQIQMgBikDWAtCA4YgA0I9iIRCgICAgICAgASEIQEgCUIDhiAKQj2IhCACIASFIQQCfiADQgOGIgIgBSAHRg0AGiAFIAdrIgdB/wBLBEBCACEBQgEMAQsgBkFAayACIAFBgAEgB2sQOSAGQTBqIAIgASAHEDogBikDOCEBIAYpAzAgBikDQCAGKQNIhEIAUq2ECyEJQoCAgICAgIAEhCELIApCA4YhCgJAIARCAFMEQEIAIQNCACEEIAkgCoUgASALhYRQDQIgCiAJfSECIAsgAX0gCSAKVq19IgRC/////////wNWDQEgBkEgaiACIAQgAiAEIARQIgcbeULAAEIAIAcbfKdBDGsiBxA5IAUgB2shBSAGKQMoIQQgBikDICECDAELIAkgCnwiAiAJVK0gASALfHwiBEKAgICAgICACINQDQAgCUIBgyAEQj+GIAJCAYiEhCECIAVBAWohBSAEQgGIIQQLIAxCgICAgICAgICAf4MhAyAFQf//AU4EQCADQoCAgICAgMD//wCEIQRCACEDDAELQQAhBwJAIAVBAEoEQCAFIQcMAQsgBkEQaiACIAQgBUH/AGoQOSAGIAIgBEEBIAVrEDogBikDACAGKQMQIAYpAxiEQgBSrYQhAiAGKQMIIQQLIARCPYYgAkIDiIQhASAEQgOIQv///////z+DIAetQjCGhCADhCEEAkACQCACp0EHcSIFQQRHBEAgBCABIAEgBUEES618IgNWrXwhBAwBCyAEIAEgASABQgGDfCIDVq18IQQMAQsgBUUNAQsLIAAgAzcDACAAIAQ3AwggBkHwAGoiACMDSyAAIwRJcgRAIAAQCQsgACQAC/UBAgJ/BH4jAEEQayICIwNLIAIjBElyBEAgAhAJCyACJAAgAb0iB0L/////////B4MhBCAAAn4gB0I0iEL/D4MiBUIAUgRAIAVC/w9SBEAgBEIEiCEGIAVCgPgAfCEFIARCPIYMAgsgBEIEiCEGQv//ASEFIARCPIYMAQsgBFAEQEIAIQVCAAwBCyACIARCACAEeaciA0ExahA5IAIpAwhCgICAgICAwACFIQZBjPgAIANrrSEFIAIpAwALNwMAIAAgB0KAgICAgICAgIB/gyAFQjCGhCAGhDcDCCACQRBqIgAjA0sgACMESXIEQCAAEAkLIAAkAAvbAQIBfwJ+QQEhBAJAIABCAFIgAUL///////////8AgyIFQoCAgICAgMD//wBWIAVCgICAgICAwP//AFEbDQAgAkIAUiADQv///////////wCDIgZCgICAgICAwP//AFYgBkKAgICAgIDA//8AURsNACAAIAKEIAUgBoSEUARAQQAPCyABIAODQgBZBEAgACACVCABIANTIAEgA1EbBEBBfw8LIAAgAoUgASADhYRCAFIPCyAAIAJWIAEgA1UgASADURsEQEF/DwsgACAChSABIAOFhEIAUiEECyAEC8ABAgF/An5BfyEDAkAgAEIAUiABQv///////////wCDIgRCgICAgICAwP//AFYgBEKAgICAgIDA//8AURsNACACQv///////////wCDIgVCgICAgICAwP//AFYgBUKAgICAgIDA//8AUnENACAAIAQgBYSEUARAQQAPCyABIAKDQgBZBEAgASACUiABIAJTcQ0BIAAgASAChYRCAFIPCyAAQgBSIAEgAlUgASACURsNACAAIAEgAoWEQgBSIQMLIAMLqQEBAXxEAAAAAAAA8D8hAQJAIABBgAhOBEBEAAAAAAAA4H8hASAAQf8PSQRAIABB/wdrIQAMAgtEAAAAAAAA8H8hAUH9FyAAIABB/RdPG0H+D2shAAwBCyAAQYF4Sg0ARAAAAAAAAGADIQEgAEG4cEsEQCAAQckHaiEADAELRAAAAAAAAAAAIQFB8GggACAAQfBoTRtBkg9qIQALIAEgAEH/B2qtQjSGv6ILPAAgACABNwMAIAAgAkL///////8/gyACQoCAgICAgMD//wCDQjCIpyADQjCIp0GAgAJxcq1CMIaENwMIC4wBAgF/AX4jAEEQayICIwNLIAIjBElyBEAgAhAJCyACJAAgAAJ+IAFFBEBCAAwBCyACIAGtQgBB8AAgAWciAUEfc2sQOSACKQMIQoCAgICAgMAAhUGegAEgAWutQjCGfCEDIAIpAwALNwMAIAAgAzcDCCACQRBqIgAjA0sgACMESXIEQCAAEAkLIAAkAAtrAQF/IwBBEGsiBSMDSyAFIwRJcgRAIAUQCQsgBSQAIAUgASACIAMgBEKAgICAgICAgIB/hRCNASAFKQMAIQEgACAFKQMINwMIIAAgATcDACAFQRBqIgAjA0sgACMESXIEQCAAEAkLIAAkAAvqAgEBfyMAQdAAayIEIwNLIAQjBElyBEAgBBAJCyAEJAACQCADQYCAAU4EQCAEQSBqIAEgAkIAQoCAgICAgID//wAQjAEgBCkDKCECIAQpAyAhASADQf//AUkEQCADQf//AGshAwwCCyAEQRBqIAEgAkIAQoCAgICAgID//wAQjAFB/f8CIAMgA0H9/wJPG0H+/wFrIQMgBCkDGCECIAQpAxAhAQwBCyADQYGAf0oNACAEQUBrIAEgAkIAQoCAgICAgIA5EIwBIAQpA0ghAiAEKQNAIQEgA0H0gH5LBEAgA0GN/wBqIQMMAQsgBEEwaiABIAJCAEKAgICAgICAORCMAUHogX0gAyADQeiBfU0bQZr+AWohAyAEKQM4IQIgBCkDMCEBCyAEIAEgAkIAIANB//8Aaq1CMIYQjAEgACAEKQMINwMIIAAgBCkDADcDACAEQdAAaiIAIwNLIAAjBElyBEAgABAJCyAAJAALdQEBfiAAIAEgBH4gAiADfnwgA0IgiCICIAFCIIgiBH58IANC/////w+DIgMgAUL/////D4MiAX4iBUIgiCADIAR+fCIDQiCIfCABIAJ+IANC/////w+DfCIBQiCIfDcDCCAAIAVC/////w+DIAFCIIaENwMAC74QAgV/D34jAEHQAmsiBSMDSyAFIwRJcgRAIAUQCQsgBSQAIARC////////P4MhCyACQv///////z+DIQogAiAEhUKAgICAgICAgIB/gyEMIARCMIinQf//AXEhBwJAAkAgAkIwiKdB//8BcSIIQf//AWtBgoB+TwRAIAdB//8Ba0GBgH5LDQELIAFQIAJC////////////AIMiDkKAgICAgIDA//8AVCAOQoCAgICAgMD//wBRG0UEQCACQoCAgICAgCCEIQwMAgsgA1AgBEL///////////8AgyICQoCAgICAgMD//wBUIAJCgICAgICAwP//AFEbRQRAIARCgICAgICAIIQhDCADIQEMAgsgASAOQoCAgICAgMD//wCFhFAEQCADIAJCgICAgICAwP//AIWEUARAQgAhAUKAgICAgIDg//8AIQwMAwsgDEKAgICAgIDA//8AhCEMQgAhAQwCCyADIAJCgICAgICAwP//AIWEUARAQgAhAQwCCyABIA6EUARAQoCAgICAgOD//wAgDCACIAOEUBshDEIAIQEMAgsgAiADhFAEQCAMQoCAgICAgMD//wCEIQxCACEBDAILIA5C////////P1gEQCAFQcACaiABIAogASAKIApQIgYbeULAAEIAIAYbfKciBkEPaxA5QRAgBmshBiAFKQPIAiEKIAUpA8ACIQELIAJC////////P1YNACAFQbACaiADIAsgAyALIAtQIgkbeULAAEIAIAkbfKciCUEPaxA5IAYgCWpBEGshBiAFKQO4AiELIAUpA7ACIQMLIAVBoAJqIAtCgICAgICAwACEIhJCD4YgA0IxiIQiAkIAQoCAgICw5ryC9QAgAn0iBEIAEJYBIAVBkAJqQgAgBSkDqAJ9QgAgBEIAEJYBIAVBgAJqIAUpA5gCQgGGIAUpA5ACQj+IhCIEQgAgAkIAEJYBIAVB8AFqIARCAEIAIAUpA4gCfUIAEJYBIAVB4AFqIAUpA/gBQgGGIAUpA/ABQj+IhCIEQgAgAkIAEJYBIAVB0AFqIARCAEIAIAUpA+gBfUIAEJYBIAVBwAFqIAUpA9gBQgGGIAUpA9ABQj+IhCIEQgAgAkIAEJYBIAVBsAFqIARCAEIAIAUpA8gBfUIAEJYBIAVBoAFqIAJCACAFKQO4AUIBhiAFKQOwAUI/iIRCAX0iAkIAEJYBIAVBkAFqIANCD4ZCACACQgAQlgEgBUHwAGogAkIAQgAgBSkDqAEgBSkDoAEiDiAFKQOYAXwiBCAOVK18IARCAVatfH1CABCWASAFQYABakIBIAR9QgAgAkIAEJYBIAYgCCAHa2oiCEH//wBqIQYCfiAFKQNwIhNCAYYiDSAFKQOIASIPQgGGIAUpA4ABQj+IhHwiEELn7AB9IhRCIIgiAiAKQoCAgICAgMAAhCIVQgGGIhZCIIgiBH4iESABQgGGIg5CIIgiCyAQIBRWrSANIBBWrSAFKQN4QgGGIBNCP4iEIA9CP4h8fHxCAX0iE0IgiCIQfnwiDSARVK0gDSANIBNC/////w+DIhMgAUI/iCIXIApCAYaEQv////8PgyIKfnwiDVatfCAEIBB+fCAEIBN+IhEgCiAQfnwiDyARVK1CIIYgD0IgiIR8IA0gD0IghnwiDyANVK18IA8gDyAUQv////8PgyIUIAp+Ig0gAiALfnwiESANVK0gESARIBMgDkL+////D4MiDX58IhFWrXx8Ig9WrXwgDyAEIBR+IhggDSAQfnwiBCACIAp+fCIKIAsgE358IhBCIIggCiAQVq0gBCAYVK0gBCAKVq18fEIghoR8IgQgD1StfCAEIAQgESACIA1+IgogCyAUfnwiAkIgiCACIApUrUIghoR8IgogEVStIAogCiAQQiCGfCIKVq18fCIEVq18IAQgBCAKIAJCIIYiAiANIBR+fCACVK1Cf4UiAlYgAiAKUnGtfCIEVq18IgJC/////////wBYBEAgFiAXhCEVIAVB0ABqIAQgAkKAgICAgIDAAFQiB60iC4YiCiACIAuGIARCAYggB0E/c62IhCIEIAMgEhCWASAIQf7/AGogBiAHG0EBayEGIAFCMYYgBSkDWH0gBSkDUCIBQgBSrX0hC0IAIAF9DAELIAVB4ABqIAJCP4YgBEIBiIQiCiACQgGIIgQgAyASEJYBIAFCMIYgBSkDaH0gBSkDYCICQgBSrX0hCyABIQ5CACACfQshAiAGQf//AU4EQCAMQoCAgICAgMD//wCEIQxCACEBDAELAn4gBkEASgRAIAtCAYYgAkI/iIQhASAEQv///////z+DIAatQjCGhCELIAJCAYYMAQsgBkGPf0wEQEIAIQEMAgsgBUFAayAKIARBASAGaxA6IAVBMGogDiAVIAZB8ABqEDkgBUEgaiADIBIgBSkDQCIKIAUpA0giCxCWASAFKQM4IAUpAyhCAYYgBSkDICIBQj+IhH0gBSkDMCICIAFCAYYiBFStfSEBIAIgBH0LIQIgBUEQaiADIBJCA0IAEJYBIAUgAyASQgVCABCWASALIAogAyAKQgGDIgMgAnwiAlQgASACIANUrXwiASASViABIBJRG618IgMgClStfCIEIAMgAyAEQoCAgICAgMD//wBUIAIgBSkDEFYgASAFKQMYIgRWIAEgBFEbca18IgNWrXwiBCADIARCgICAgICAwP//AFQgAiAFKQMAViABIAUpAwgiAlYgASACURtxrXwiASADVK18IAyEIQwLIAAgATcDACAAIAw3AwggBUHQAmoiACMDSyAAIwRJcgRAIAAQCQsgACQAC/IGAgR/A34jAEGAAWsiBSIGIwNLIAYjBElyBEAgBhAJCyAGJAACQAJAAkAgAyAEQgBCABCPAUUNAAJ/IARC////////P4MhCgJ/IARCMIinQf//AXEiBkH//wFHBEBBBCAGDQEaQQJBAyADIAqEUBsMAgsgAyAKhFALC0UNACACQjCIpyIIQf//AXEiB0H//wFHDQELIAVBEGogASACIAMgBBCMASAFIAUpAxAiAiAFKQMYIgEgAiABEJcBIAUpAwghAiAFKQMAIQQMAQsgASACQv///////////wCDIgogAyAEQv///////////wCDIgkQjwFBAEwEQCABIAogAyAJEI8BBEAgASEEDAILIAVB8ABqIAEgAkIAQgAQjAEgBSkDeCECIAUpA3AhBAwBCyAEQjCIp0H//wFxIQYgBwR+IAEFIAVB4ABqIAEgCkIAQoCAgICAgMC7wAAQjAEgBSkDaCIKQjCIp0H4AGshByAFKQNgCyEEIAZFBEAgBUHQAGogAyAJQgBCgICAgICAwLvAABCMASAFKQNYIglCMIinQfgAayEGIAUpA1AhAwsgCUL///////8/g0KAgICAgIDAAIQhCyAKQv///////z+DQoCAgICAgMAAhCEKIAYgB0gEQANAAn4gCiALfSADIARWrX0iCUIAWQRAIAkgBCADfSIEhFAEQCAFQSBqIAEgAkIAQgAQjAEgBSkDKCECIAUpAyAhBAwFCyAJQgGGIARCP4iEDAELIApCAYYgBEI/iIQLIQogBEIBhiEEIAdBAWsiByAGSg0ACyAGIQcLAkAgCiALfSADIARWrX0iCUIAUwRAIAohCQwBCyAJIAQgA30iBIRCAFINACAFQTBqIAEgAkIAQgAQjAEgBSkDOCECIAUpAzAhBAwBCyAJQv///////z9YBEADQCAEQj+IIAdBAWshByAEQgGGIQQgCUIBhoQiCUKAgICAgIDAAFQNAAsLIAhBgIACcSEGIAdBAEwEQCAFQUBrIAQgCUL///////8/gyAHQfgAaiAGcq1CMIaEQgBCgICAgICAwMM/EIwBIAUpA0ghAiAFKQNAIQQMAQsgCUL///////8/gyAGIAdyrUIwhoQhAgsgACAENwMAIAAgAjcDCCAFQYABaiIAIwNLIAAjBElyBEAgABAJCyAAJAALrjQDEX8HfgF8IwBBMGsiDiIHIwNLIAcjBElyBEAgBxAJCyAHJAACQAJAIAJBAksNACACQQJ0IgIoApxUIREgAigCkFQhCgNAAn8gASgCBCICIAEoAmhHBEAgASACQQFqNgIEIAItAAAMAQsgARCKAQsiAkEgRiACQQlrQQVJcg0AC0EBIQ0CQAJAIAJBK2sOAwABAAELQX9BASACQS1GGyENIAEoAgQiAiABKAJoRwRAIAEgAkEBajYCBCACLQAAIQIMAQsg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KAIEDAELIAItAAtB/wBxCyABakYEQAJ/IAItAAtBB3YEQCACKAIEDAELIAItAAtB/wBxCyEDIAICfyACLQALQQd2BEAgAigCBAwBCyACLQALQf8AcQtBAXQQbiACIAItAAtBB3YEfyACKAIIQf////8HcUEBawVBCgsQbiAAIAMCfyACLQALQQd2BEAgAigCAAwBCyACCyIBajYCtAELAn8gAEG8AmoiBigCACIDKAIMIgggAygCEEYEQCADIAMoAgAoAiQRAAAMAQsgCCgCAAtBECABIABBtAFqIABBCGpBACAHIABBEGogAEEMaiAAQdABahDaAQ0AIAYQZhoMAQsLIAIgACgCtAEgAWsQbgJ/IAItAAtBB3YEQCACKAIADAELIAILENIBIAAgBTYCBCAAQQRqENMBQQFHBEAgBEEENgIACyAAQbwCaiAAQbgCahBlBEAgBCAEKAIAQQJyNgIACyAAKAK8AiACEMcDGiAHEMcDGiAAQcACaiIAIwNLIAAjBElyBEAgABAJCyAAJAALggEBA38jAEEQayIDIwNLIAMjBElyBEAgAxAJCyADJAAgAigCACEFAn8gASAAIgRrQQJ1IgIEQANAIAAgBSAAKAIARg0CGiAAQQRqIQAgAkEBayICDQALC0EACyIAIAEgABsgBGsgBGogA0EQaiIBIwNLIAEjBElyBEAgARAJCyABJAALpwIBAX8jAEEgayIFIwNLIAUjBElyBEAgBRAJCyAFJAAgBSABNgIcAkAgAigCBEEBcUUEQCAAIAEgAiADIAQgACgCACgCGBEHACECDAELIAVBEGoiASACKAIcIgA2AgAgAEGAuANHBEAgACAAKAIEQQFqNgIECyABQfC5AxC6ASEAIAEQuAECQCAEBEAgASAAIAAoAgAoAhgRAgAMAQsgBUEQaiAAIAAoAgAoAhwRAgALIAUgBUEQahDnATYCDANAIAUgBUEQaiIAEOgBNgIIIAUoAgwgBSgCCEYEQCAFKAIcIQIgABDHAxoFIAVBHGogBSgCDCwAABBkIAUgBSgCDEEBajYCDAwBCwsLIAVBIGoiACMDSyAAIwRJcgRAIAAQCQsgACQAIAILHAACfyAALQALQQd2BEAgACgCAAwBCyAACxDpAQs7AAJ/IAAtAAtBB3YEQCAAKAIADAELIAALAn8gAC0AC0EHdgRAIAAoAgQMAQsgAC0AC0H/AHELahDpAQtLAQJ/IwBBEGsiASMDSyABIwRJcgRAIAEQCQsgASQAIAFBDGoiAiAANgIAIAIoAgAgAUEQaiIAIwNLIAAjBElyBEAgABAJCyAAJAAL5AEBBH8jAEHQAGsiACMDSyAAIwRJcgRAIAAQCQsgACQAIAAgBDYCTCAAQiU3A0AgAEFAayIFQQFyQbQLQQEgAigCBBDrASAAQTNqIgQgBEENENIBIAUgAEHMAGoQ7AEgBGoiByACEO0BIQggAEEEaiIGIAIoAhwiBTYCACAFQYC4A0cEQCAFIAUoAgRBAWo2AgQLIAQgCCAHIABBEGoiBCAAQQxqIABBCGogBhDuASAGELgBIAEgBCAAKAIMIAAoAgggAiADEO8BIABB0ABqIgAjA0sgACMESXIEQCAAEAkLIAAkAAusAQEBfwJAIANBgBBxRQ0AIAJFDQAgA0HKAHEiBEEIRg0AIARBwABGDQAgAEErOgAAIABBAWohAAsgA0GABHEEQCAAQSM6AAAgAEEBaiEACwNAIAEtAAAiBARAIAAgBDoAACAAQQFqIQAgAUEBaiEBDAELCyAAAn9B7wAgA0HKAHEiAUHAAEYNABpB2ABB+AAgA0GAgAFxGyABQQhGDQAaQeQAQfUAIAIbCzoAAAtRAQF/IwBBEGsiBSMDSyAFIwRJcgRAIAUQCQsgBSQAIAUgBCgCADYCACAAIAEgAiADIAUQgQIgBUEQaiIAIwNLIAAjBElyBEAgABAJCyAAJAALZAAgAigCBEGwAXEiAkEgRgRAIAEPCwJAIAJBEEcNAAJAAkAgAC0AACICQStrDgMAAQABCyAAQQFqDwsgASAAa0ECSA0AIAJBMEcNACAALQABQSByQfgARw0AIABBAmohAAsgAAuZBQEIfyMAQRBrIgoiCCMDSyAIIwRJcgRAIAgQCQsgCCQAIAZBuLkDELoBIQkgCkEEaiAGQfC5AxC6ASIGIAYoAgAoAhQRAgACQAJ/IAotAA9BB3YEQCAKKAIIDAELIAotAA9B/wBxC0UEQCAJIAAgAiADIAkoAgAoAiARBgAaIAUgAyACIABraiIGNgIADAELIAUgAzYCAAJAAkAgACIILQAAIgdBK2sOAwABAAELIAkgB8AgCSgCACgCHBEEACEIIAUgBSgCACIHQQFqNgIAIAcgCDoAACAAQQFqIQgLAkAgAiAIa0ECSA0AIAgtAABBMEcNACAILQABQSByQfgARw0AIAlBMCAJKAIAKAIcEQQAIQcgBSAFKAIAIgtBAWo2AgAgCyAHOgAAIAkgCCwAASAJKAIAKAIcEQQAIQcgBSAFKAIAIgtBAWo2AgAgCyAHOgAAIAhBAmohCAsgCCACEJACIAYgBigCACgCEBEAACELIAghBgN/IAIgBk0EfyADIAggAGtqIAUoAgAQkAIgBSgCAAUCQAJ/IApBBGoiBy0AC0EHdgRAIAcoAgAMAQsgBwsgDWotAABFDQAgDAJ/IActAAtBB3YEQCAHKAIADAELIAcLIA1qLAAARw0AIAUgBSgCACIMQQFqNgIAIAwgCzoAACANIA0CfyAHLQALQQd2BEAgBygCBAwBCyAHLQALQf8AcQtBAWtJaiENQQAhDAsgCSAGLAAAIAkoAgAoAhwRBAAhByAFIAUoAgAiDkEBajYCACAOIAc6AAAgBkEBaiEGIAxBAWohDAwBCwshBgsgBCAGIAMgASAAa2ogASACRhs2AgAgCkEEahDHAxogCkEQaiIAIwNLIAAjBElyBEAgABAJCyAAJAAL+wEBBH8jAEEQayIIIgYjA0sgBiMESXIEQCAGEAkLIAYkAEEAIQYCQCAARQ0AIAQoAgwhByACIAFrIglBAEoEQCAAIAEgCSAAKAIAKAIwEQMAIAlHDQELIAMgAWsiASAHSARAIAACfyAIQQRqIAcgAWsiASAFEIICIgUtAAtBB3YEQCAFKAIADAELIAULIAEgACgCACgCMBEDACEHIAUQxwMaIAEgB0cNAQsgAyACayIBQQBKBEAgACACIAEgACgCACgCMBEDACABRw0BCyAEKAIMGiAEQQA2AgwgACEGCyAIQRBqIgAjA0sgACMESXIEQCAAEAkLIAAkACAGC+MBAQV/IwBB8ABrIgAjA0sgACMESXIEQCAAEAkLIAAkACAAIAQ3A2ggAEIlNwNgIABB4ABqIgVBAXJBrQtBASACKAIEEOsBIABBQGsiBiAGENIBIAUgAEHoAGoQ8QEgBmoiCCACEO0BIQkgAEEEaiIHIAIoAhwiBTYCACAFQYC4A0cEQCAFIAUoAgRBAWo2AgQLIAYgCSAIIABBEGoiBiAAQQxqIABBCGogBxDuASAHELgBIAEgBiAAKAIMIAAoAgggAiADEO8BIABB8ABqIgAjA0sgACMESXIEQCAAEAkLIAAkAAtRAQF/IwBBEGsiBCMDSyAEIwRJcgRAIAQQCQsgBCQAIAQgAykDADcDACAAQRggASACIAQQgQIgBEEQaiIAIwNLIAAjBElyBEAgABAJCyAAJAAL5AEBBH8jAEHQAGsiACMDSyAAIwRJcgRAIAAQCQsgACQAIAAgBDYCTCAAQiU3A0AgAEFAayIFQQFyQbQLQQAgAigCBBDrASAAQTNqIgQgBEENENIBIAUgAEHMAGoQ7AEgBGoiByACEO0BIQggAEEEaiIGIAIoAhwiBTYCACAFQYC4A0cEQCAFIAUoAgRBAWo2AgQLIAQgCCAHIABBEGoiBCAAQQxqIABBCGogBhDuASAGELgBIAEgBCAAKAIMIAAoAgggAiADEO8BIABB0ABqIgAjA0sgACMESXIEQCAAEAkLIAAkAAvjAQEFfyMAQfAAayIAIwNLIAAjBElyBEAgABAJCyAAJAAgACAENwNoIABCJTcDYCAAQeAAaiIFQQFyQa0LQQAgAigCBBDrASAAQUBrIgYgBhDSASAFIABB6ABqEPEBIAZqIgggAhDtASEJIABBBGoiByACKAIcIgU2AgAgBUGAuANHBEAgBSAFKAIEQQFqNgIECyAGIAkgCCAAQRBqIgYgAEEMaiAAQQhqIAcQ7gEgBxC4ASABIAYgACgCDCAAKAIIIAIgAxDvASAAQfAAaiIAIwNLIAAjBElyBEAgABAJCyAAJAAL8QQBBn8CfyMAQaABayIFIwNLIAUjBElyBEAgBRAJCyAFJAAgBSAEOQOYASAFQiU3A5ABIAVBkAFqIgZBAXJBvRIgAigCBBD1ASEIIAUgBUHwAGoiBzYCbBDSASEAAn8gCARAIAUgAigCCDYCICAHIAAgBiAFQSBqIAVBmAFqEPYBDAELIAVB8ABqIAAgBUGQAWogBUGYAWoQ9wELIQAgBUExNgIgIAVBADYCZCAFIAVBIGoiBygCADYCaCAFQfAAaiEGAkAgAEEeTgRAENIBIQACfyAIBEAgBSACKAIINgIgIAVB7ABqIAAgBUGQAWogByAFQZgBahD4AQwBCyAFQewAaiAAIAVBkAFqIAVBmAFqEPkBCyIAQX9GDQEgBSgCZCEGIAUgBSgCbDYCZCAGBEAgBiAFKAJoEQEACyAFKAJsIQYLIAYgACAGaiIJIAIQ7QEhCiAFQTE2AiAgBUEANgIYIAUgBUEgaiIGKAIANgIcAkAgBSgCbCIIIAVB8ABqRgRAIAYhAAwBCyAAQQF0EEciAEUNASAFKAIYIQYgBSAANgIYIAYEQCAGIAUoAhwRAQALIAUoAmwhCAsgBUEMaiIHIAIoAhwiBjYCACAGQYC4A0cEQCAGIAYoAgRBAWo2AgQLIAggCiAJIAAgBUEUaiAFQRBqIAcQ+gEgBxC4ASABIAAgBSgCFCAFKAIQIAIgAxDvASAFKAIYIQAgBUEANgIYIAAEQCAAIAUoAhwRAQALIAUoAmQhACAFQQA2AmQgAARAIAAgBSgCaBEBAAsgBUGgAWoiACMDSyAAIwRJcgRAIAAQCQsgACQADAELEMMDAAsL0AEBAn8gAkGAEHEEQCAAQSs6AAAgAEEBaiEACyACQYAIcQRAIABBIzoAACAAQQFqIQALIAJBhAJxIgNBhAJHBEAgAEGu1AA7AAAgAEECaiEACyACQYCAAXEhAgNAIAEtAAAiBARAIAAgBDoAACAAQQFqIQAgAUEBaiEBDAELCyAAAn8CQCADQYACRwRAIANBBEcNAUHGAEHmACACGwwCC0HFAEHlACACGwwBC0HBAEHhACACGyADQYQCRg0AGkHHAEHnACACGws6AAAgA0GEAkcLXwEBfyMAQRBrIgUjA0sgBSMESXIEQCAFEAkLIAUkACADKAIAIQMgBSAEKwMAOQMIIAUgAzYCACAAQR4gASACIAUQgQIgBUEQaiIAIwNLIAAjBElyBEAgABAJCyAAJAALUQEBfyMAQRBrIgQjA0sgBCMESXIEQCAEEAkLIAQkACAEIAMrAwA5AwAgAEEeIAEgAiAEEIECIARBEGoiACMDSyAAIwRJcgRAIAAQCQsgACQAC10BAX8jAEEQayIFIwNLIAUjBElyBEAgBRAJCyAFJAAgAygCACEDIAUgBCsDADkDCCAFIAM2AgAgACABIAIgBRDHAiAFQRBqIgAjA0sgACMESXIEQCAAEAkLIAAkAAtPAQF/IwBBEGsiBCMDSyAEIwRJcgRAIAQQCQsgBCQAIAQgAysDADkDACAAIAEgAiAEEMcCIARBEGoiACMDSyAAIwRJcgRAIAAQCQsgACQAC6QHAQp/IwBBEGsiCyIHIwNLIAcjBElyBEAgBxAJCyAHJAAgBkG4uQMQugEhCSALQQRqIAZB8LkDELoBIg0iBiAGKAIAKAIUEQIAIAUgAzYCAAJAAkAgACIILQAAIgZBK2sOAwABAAELIAkgBsAgCSgCACgCHBEEACEGIAUgBSgCACIHQQFqNgIAIAcgBjoAACAAQQFqIQgLAkACQCACIAgiBmtBAUwNACAGLQAAQTBHDQAgBi0AAUEgckH4AEcNACAJQTAgCSgCACgCHBEEACEHIAUgBSgCACIIQQFqNgIAIAggBzoAACAJIAYsAAEgCSgCACgCHBEEACEHIAUgBSgCACIIQQFqNgIAIAggBzoAACAGQQJqIgghBgNAIAIgBk0NAiAGLAAAIQcQ0gEaIAdBMGtBCkkgB0EgckHhAGtBBklyRQ0CIAZBAWohBgwACwALA0AgAiAGTQ0BIAYsAAAQ0gEaQTBrQQpPDQEgBkEBaiEGDAALAAsCQAJ/IAstAA9BB3YEQCALKAIIDAELIAstAA9B/wBxC0UEQCAJIAggBiAFKAIAIAkoAgAoAiARBgAaIAUgBSgCACAGIAhrajYCAAwBCyAIIAYQkAIgDSANKAIAKAIQEQAAIQ8gCCEHA0AgBiAHTQRAIAMgCCAAa2ogBSgCABCQAgUCQAJ/IAtBBGoiCi0AC0EHdgRAIAooAgAMAQsgCgsgDmosAABBAEwNACAMAn8gCi0AC0EHdgRAIAooAgAMAQsgCgsgDmosAABHDQAgBSAFKAIAIgxBAWo2AgAgDCAPOgAAIA4gDgJ/IAotAAtBB3YEQCAKKAIEDAELIAotAAtB/wBxC0EBa0lqIQ5BACEMCyAJIAcsAAAgCSgCACgCHBEEACEKIAUgBSgCACIQQQFqNgIAIBAgCjoAACAHQQFqIQcgDEEBaiEMDAELCwsDQAJAAkAgAiAGTQRAIAYhBwwBCyAGQQFqIQcgBiwAACIGQS5HDQEgDSANKAIAKAIMEQAAIQYgBSAFKAIAIghBAWo2AgAgCCAGOgAACyAJIAcgAiAFKAIAIAkoAgAoAiARBgAaIAUgBSgCACACIAdraiIFNgIAIAQgBSADIAEgAGtqIAEgAkYbNgIAIAtBBGoQxwMaIAtBEGoiACMDSyAAIwRJcgRAIAAQCQsgACQADwsgCSAGIAkoAgAoAhwRBAAhBiAFIAUoAgAiCEEBajYCACAIIAY6AAAgByEGDAALAAv5BAEGfwJ/IwBBsAFrIgYjA0sgBiMESXIEQCAGEAkLIAYkACAGIAU3A6gBIAYgBDcDoAEgBkIlNwOYASAGQZgBaiIHQQFyQaIOIAIoAgQQ9QEhCSAGIAZB8ABqIgg2AmwQ0gEhAAJ/IAkEQCAGIAIoAgg2AiAgCCAAIAcgBkEgaiAGQaABahD8AQwBCyAGQfAAaiAAIAZBmAFqIAZBoAFqEP0BCyEAIAZBMTYCICAGQQA2AmQgBiAGQSBqIggoAgA2AmggBkHwAGohBwJAIABBHk4EQBDSASEAAn8gCQRAIAYgAigCCDYCICAGQewAaiAAIAZBmAFqIAggBkGgAWoQ/gEMAQsgBkHsAGogACAGQZgBaiAGQaABahD/AQsiAEF/Rg0BIAYoAmQhByAGIAYoAmw2AmQgBwRAIAcgBigCaBEBAAsgBigCbCEHCyAHIAAgB2oiCiACEO0BIQsgBkExNgIgIAZBADYCGCAGIAZBIGoiBygCADYCHAJAIAYoAmwiCSAGQfAAakYEQCAHIQAMAQsgAEEBdBBHIgBFDQEgBigCGCEHIAYgADYCGCAHBEAgByAGKAIcEQEACyAGKAJsIQkLIAZBDGoiCCACKAIcIgc2AgAgB0GAuANHBEAgByAHKAIEQQFqNgIECyAJIAsgCiAAIAZBFGogBkEQaiAIEPoBIAgQuAEgASAAIAYoAhQgBigCECACIAMQ7wEgBigCGCEAIAZBADYCGCAABEAgACAGKAIcEQEACyAGKAJkIQAgBkEANgJkIAAEQCAAIAYoAmgRAQALIAZBsAFqIgAjA0sgACMESXIEQCAAEAkLIAAkAAwBCxDDAwALC28CAX8BfiMAQSBrIgUjA0sgBSMESXIEQCAFEAkLIAUkACADKAIAIQMgBCkDACEGIAUgBCkDCDcDECAFIAY3AwggBSADNgIAIABBHiABIAIgBRCBAiAFQSBqIgAjA0sgACMESXIEQCAAEAkLIAAkAAthAgF/AX4jAEEQayIEIwNLIAQjBElyBEAgBBAJCyAEJAAgAykDACEFIAQgAykDCDcDCCAEIAU3AwAgAEEeIAEgAiAEEIECIARBEGoiACMDSyAAIwRJcgRAIAAQCQsgACQAC20CAX8BfiMAQSBrIgUjA0sgBSMESXIEQCAFEAkLIAUkACADKAIAIQMgBCkDACEGIAUgBCkDCDcDECAFIAY3AwggBSADNgIAIAAgASACIAUQxwIgBUEgaiIAIwNLIAAjBElyBEAgABAJCyAAJAALXwIBfwF+IwBBEGsiBCMDSyAEIwRJcgRAIAQQCQsgBCQAIAMpAwAhBSAEIAMpAwg3AwggBCAFNwMAIAAgASACIAQQxwIgBEEQaiIAIwNLIAAjBElyBEAgABAJCyAAJAAL1AEBBH8jAEHQAGsiACMDSyAAIwRJcgRAIAAQCQsgACQAIAAgBDYCTCAAQTBqIgQgBCAEQRQQ0gFB8wogAEHMAGoQ7AEiCGoiBiACEO0BIQcgACACKAIcIgU2AgAgBUGAuANHBEAgBSAFKAIEQQFqNgIECyAAQbi5AxC6ASEFIAAQuAEgBSAEIAYgACAFKAIAKAIgEQYAGiABIAAgACAIaiIBIAAgByAEa2ogBiAHRhsgASACIAMQ7wEgAEHQAGoiACMDSyAAIwRJcgRAIAAQCQsgACQAC48BAQF/IwBBEGsiBSMDSyAFIwRJcgRAIAUQCQsgBSQAIAUgAjYCDCAFIAQ2AgggBUEEaiAFQQxqEL4DIAAgASADIAUoAggQoAEhASgCACIABEBBtKgDKAIAGiAABEBBtKgDQbynAyAAIABBf0YbNgIACwsgBUEQaiIAIwNLIAAjBElyBEAgABAJCyAAJAAgAQvfAQECfyMAQRBrIgMjA0sgAyMESXIEQCADEAkLIAMkAAJAIAFB9////wdNBEACQCABQQtJBEAgACABQf8AcToACyAAIQQMAQsgA0EIaiABQQtPBH8gAUEIakF4cSIEIARBAWsiBCAEQQtGGwVBCgtBAWoQfiADKAIMGiAAIAMoAggiBDYCACAAIAMoAgxBgICAgHhyNgIIIAAgATYCBAsgBCABIAIQyAMgA0EAOgAHIAEgBGogAy0ABzoAACADQRBqIgEjA0sgASMESXIEQCABEAkLIAEkAAwBCxB8AAsgAAunAgEBfyMAQSBrIgUjA0sgBSMESXIEQCAFEAkLIAUkACAFIAE2AhwCQCACKAIEQQFxRQRAIAAgASACIAMgBCAAKAIAKAIYEQcAIQIMAQsgBUEQaiIBIAIoAhwiADYCACAAQYC4A0cEQCAAIAAoAgRBAWo2AgQLIAFB+LkDELoBIQAgARC4AQJAIAQEQCABIAAgACgCACgCGBECAAwBCyAFQRBqIAAgACgCACgCHBECAAsgBSAFQRBqEOcBNgIMA0AgBSAFQRBqIgAQhAI2AgggBSgCDCAFKAIIRgRAIAUoAhwhAiAAEMcDGgUgBUEcaiAFKAIMKAIAEGggBSAFKAIMQQRqNgIMDAELCwsgBUEgaiIAIwNLIAAjBElyBEAgABAJCyAAJAAgAgs+AAJ/IAAtAAtBB3YEQCAAKAIADAELIAALAn8gAC0AC0EHdgRAIAAoAgQMAQsgAC0AC0H/AHELQQJ0ahDpAQvoAQEEfyMAQZABayIAIwNLIAAjBElyBEAgABAJCyAAJAAgACAENgKMASAAQiU3A4ABIABBgAFqIgVBAXJBtAtBASACKAIEEOsBIABB8wBqIgQgBEENENIBIAUgAEGMAWoQ7AEgBGoiByACEO0BIQggAEEEaiIGIAIoAhwiBTYCACAFQYC4A0cEQCAFIAUoAgRBAWo2AgQLIAQgCCAHIABBEGoiBCAAQQxqIABBCGogBhCGAiAGELgBIAEgBCAAKAIMIAAoAgggAiADEIcCIABBkAFqIgAjA0sgACMESXIEQCAAEAkLIAAkAAuiBQEIfyMAQRBrIgoiCCMDSyAIIwRJcgRAIAgQCQsgCCQAIAZBsLkDELoBIQkgCkEEaiAGQfi5AxC6ASIGIAYoAgAoAhQRAgACQAJ/IAotAA9BB3YEQCAKKAIIDAELIAotAA9B/wBxC0UEQCAJIAAgAiADIAkoAgAoAjARBgAaIAUgAyACIABrQQJ0aiIGNgIADAELIAUgAzYCAAJAAkAgACIILQAAIgdBK2sOAwABAAELIAkgB8AgCSgCACgCLBEEACEIIAUgBSgCACIHQQRqNgIAIAcgCDYCACAAQQFqIQgLAkAgAiAIa0ECSA0AIAgtAABBMEcNACAILQABQSByQfgARw0AIAlBMCAJKAIAKAIsEQQAIQcgBSAFKAIAIgtBBGo2AgAgCyAHNgIAIAkgCCwAASAJKAIAKAIsEQQAIQcgBSAFKAIAIgtBBGo2AgAgCyAHNgIAIAhBAmohCAsgCCACEJACIAYgBigCACgCEBEAACELIAghBgN/IAIgBk0EfyADIAggAGtBAnRqIAUoAgAQkQIgBSgCAAUCQAJ/IApBBGoiBy0AC0EHdgRAIAcoAgAMAQsgBwsgDWotAABFDQAgDAJ/IActAAtBB3YEQCAHKAIADAELIAcLIA1qLAAARw0AIAUgBSgCACIMQQRqNgIAIAwgCzYCACANIA0CfyAHLQALQQd2BEAgBygCBAwBCyAHLQALQf8AcQtBAWtJaiENQQAhDAsgCSAGLAAAIAkoAgAoAiwRBAAhByAFIAUoAgAiDkEEajYCACAOIAc2AgAgBkEBaiEGIAxBAWohDAwBCwshBgsgBCAGIAMgASAAa0ECdGogASACRhs2AgAgCkEEahDHAxogCkEQaiIAIwNLIAAjBElyBEAgABAJCyAAJAALhAIBBH8jAEEQayIIIgYjA0sgBiMESXIEQCAGEAkLIAYkAEEAIQYCQCAARQ0AIAQoAgwhByACIAFrQQJ1IglBAEoEQCAAIAEgCSAAKAIAKAIwEQMAIAlHDQELIAMgAWtBAnUiASAHSARAIAACfyAIQQRqIAcgAWsiASAFEI8CIgUtAAtBB3YEQCAFKAIADAELIAULIAEgACgCACgCMBEDACEHIAUQxwMaIAEgB0cNAQsgAyACa0ECdSIBQQBKBEAgACACIAEgACgCACgCMBEDACABRw0BCyAEKAIMGiAEQQA2AgwgACEGCyAIQRBqIgAjA0sgACMESXIEQCAAEAkLIAAkACAGC+YBAQV/IwBBgAJrIgAjA0sgACMESXIEQCAAEAkLIAAkACAAIAQ3A/gBIABCJTcD8AEgAEHwAWoiBUEBckGtC0EBIAIoAgQQ6wEgAEHQAWoiBiAGENIBIAUgAEH4AWoQ8QEgBmoiCCACEO0BIQkgAEEEaiIHIAIoAhwiBTYCACAFQYC4A0cEQCAFIAUoAgRBAWo2AgQLIAYgCSAIIABBEGoiBiAAQQxqIABBCGogBxCGAiAHELgBIAEgBiAAKAIMIAAoAgggAiADEIcCIABBgAJqIgAjA0sgACMESXIEQCAAEAkLIAAkAAvoAQEEfyMAQZABayIAIwNLIAAjBElyBEAgABAJCyAAJAAgACAENgKMASAAQiU3A4ABIABBgAFqIgVBAXJBtAtBACACKAIEEOsBIABB8wBqIgQgBEENENIBIAUgAEGMAWoQ7AEgBGoiByACEO0BIQggAEEEaiIGIAIoAhwiBTYCACAFQYC4A0cEQCAFIAUoAgRBAWo2AgQLIAQgCCAHIABBEGoiBCAAQQxqIABBCGogBhCGAiAGELgBIAEgBCAAKAIMIAAoAgggAiADEIcCIABBkAFqIgAjA0sgACMESXIEQCAAEAkLIAAkAAvmAQEFfyMAQYACayIAIwNLIAAjBElyBEAgABAJCyAAJAAgACAENwP4ASAAQiU3A/ABIABB8AFqIgVBAXJBrQtBACACKAIEEOsBIABB0AFqIgYgBhDSASAFIABB+AFqEPEBIAZqIgggAhDtASEJIABBBGoiByACKAIcIgU2AgAgBUGAuANHBEAgBSAFKAIEQQFqNgIECyAGIAkgCCAAQRBqIgYgAEEMaiAAQQhqIAcQhgIgBxC4ASABIAYgACgCDCAAKAIIIAIgAxCHAiAAQYACaiIAIwNLIAAjBElyBEAgABAJCyAAJAAL/gQBBn8CfyMAQcACayIFIwNLIAUjBElyBEAgBRAJCyAFJAAgBSAEOQO4AiAFQiU3A7ACIAVBsAJqIgZBAXJBvRIgAigCBBD1ASEIIAUgBUGQAmoiBzYCjAIQ0gEhAAJ/IAgEQCAFIAIoAgg2AiAgByAAIAYgBUEgaiAFQbgCahD2AQwBCyAFQZACaiAAIAVBsAJqIAVBuAJqEPcBCyEAIAVBMTYCICAFQQA2AoQCIAUgBUEgaiIHKAIANgKIAiAFQZACaiEGAkAgAEEeTgRAENIBIQACfyAIBEAgBSACKAIINgIgIAVBjAJqIAAgBUGwAmogByAFQbgCahD4AQwBCyAFQYwCaiAAIAVBsAJqIAVBuAJqEPkBCyIAQX9GDQEgBSgChAIhBiAFIAUoAowCNgKEAiAGBEAgBiAFKAKIAhEBAAsgBSgCjAIhBgsgBiAAIAZqIgkgAhDtASEKIAVBMTYCICAFQQA2AhggBSAFQSBqIgYoAgA2AhwCQCAFKAKMAiIIIAVBkAJqRgRAIAYhAAwBCyAAQQN0EEciAEUNASAFKAIYIQYgBSAANgIYIAYEQCAGIAUoAhwRAQALIAUoAowCIQgLIAVBDGoiByACKAIcIgY2AgAgBkGAuANHBEAgBiAGKAIEQQFqNgIECyAIIAogCSAAIAVBFGogBUEQaiAHEIwCIAcQuAEgASAAIAUoAhQgBSgCECACIAMQhwIgBSgCGCEAIAVBADYCGCAABEAgACAFKAIcEQEACyAFKAKEAiEAIAVBADYChAIgAARAIAAgBSgCiAIRAQALIAVBwAJqIgAjA0sgACMESXIEQCAAEAkLIAAkAAwBCxDDAwALC7QHAQp/IwBBEGsiDCIHIwNLIAcjBElyBEAgBxAJCyAHJAAgBkGwuQMQugEhCSAMQQRqIAZB+LkDELoBIg0iBiAGKAIAKAIUEQIAIAUgAzYCAAJAAkAgACIILQAAIgZBK2sOAwABAAELIAkgBsAgCSgCACgCLBEEACEGIAUgBSgCACIHQQRqNgIAIAcgBjYCACAAQQFqIQgLAkACQCACIAgiBmtBAUwNACAGLQAAQTBHDQAgBi0AAUEgckH4AEcNACAJQTAgCSgCACgCLBEEACEHIAUgBSgCACIIQQRqNgIAIAggBzYCACAJIAYsAAEgCSgCACgCLBEEACEHIAUgBSgCACIIQQRqNgIAIAggBzYCACAGQQJqIgghBgNAIAIgBk0NAiAGLAAAIQcQ0gEaIAdBMGtBCkkgB0EgckHhAGtBBklyRQ0CIAZBAWohBgwACwALA0AgAiAGTQ0BIAYsAAAQ0gEaQTBrQQpPDQEgBkEBaiEGDAALAAsCQAJ/IAwtAA9BB3YEQCAMKAIIDAELIAwtAA9B/wBxC0UEQCAJIAggBiAFKAIAIAkoAgAoAjARBgAaIAUgBSgCACAGIAhrQQJ0ajYCAAwBCyAIIAYQkAIgDSANKAIAKAIQEQAAIQ8gCCEHA0AgBiAHTQRAIAMgCCAAa0ECdGogBSgCABCRAgUCQAJ/IAxBBGoiCi0AC0EHdgRAIAooAgAMAQsgCgsgDmosAABBAEwNACALAn8gCi0AC0EHdgRAIAooAgAMAQsgCgsgDmosAABHDQAgBSAFKAIAIgtBBGo2AgAgCyAPNgIAIA4gDgJ/IAotAAtBB3YEQCAKKAIEDAELIAotAAtB/wBxC0EBa0lqIQ5BACELCyAJIAcsAAAgCSgCACgCLBEEACEKIAUgBSgCACIQQQRqNgIAIBAgCjYCACAHQQFqIQcgC0EBaiELDAELCwsCQAJAA0AgAiAGTQ0BIAZBAWohByAGLAAAIgZBLkcEQCAJIAYgCSgCACgCLBEEACEGIAUgBSgCACIIQQRqNgIAIAggBjYCACAHIQYMAQsLIA0gDSgCACgCDBEAACEGIAUgBSgCACIIQQRqIgs2AgAgCCAGNgIADAELIAUoAgAhCyAGIQcLIAkgByACIAsgCSgCACgCMBEGABogBSAFKAIAIAIgB2tBAnRqIgU2AgAgBCAFIAMgASAAa0ECdGogASACRhs2AgAgDEEEahDHAxogDEEQaiIAIwNLIAAjBElyBEAgABAJCyAAJAALhgUBBn8CfyMAQdACayIGIwNLIAYjBElyBEAgBhAJCyAGJAAgBiAFNwPIAiAGIAQ3A8ACIAZCJTcDuAIgBkG4AmoiB0EBckGiDiACKAIEEPUBIQkgBiAGQZACaiIINgKMAhDSASEAAn8gCQRAIAYgAigCCDYCICAIIAAgByAGQSBqIAZBwAJqEPwBDAELIAZBkAJqIAAgBkG4AmogBkHAAmoQ/QELIQAgBkExNgIgIAZBADYChAIgBiAGQSBqIggoAgA2AogCIAZBkAJqIQcCQCAAQR5OBEAQ0gEhAAJ/IAkEQCAGIAIoAgg2AiAgBkGMAmogACAGQbgCaiAIIAZBwAJqEP4BDAELIAZBjAJqIAAgBkG4AmogBkHAAmoQ/wELIgBBf0YNASAGKAKEAiEHIAYgBigCjAI2AoQCIAcEQCAHIAYoAogCEQEACyAGKAKMAiEHCyAHIAAgB2oiCiACEO0BIQsgBkExNgIgIAZBADYCGCAGIAZBIGoiBygCADYCHAJAIAYoAowCIgkgBkGQAmpGBEAgByEADAELIABBA3QQRyIARQ0BIAYoAhghByAGIAA2AhggBwRAIAcgBigCHBEBAAsgBigCjAIhCQsgBkEMaiIIIAIoAhwiBzYCACAHQYC4A0cEQCAHIAcoAgRBAWo2AgQLIAkgCyAKIAAgBkEUaiAGQRBqIAgQjAIgCBC4ASABIAAgBigCFCAGKAIQIAIgAxCHAiAGKAIYIQAgBkEANgIYIAAEQCAAIAYoAhwRAQALIAYoAoQCIQAgBkEANgKEAiAABEAgACAGKAKIAhEBAAsgBkHQAmoiACMDSyAAIwRJcgRAIAAQCQsgACQADAELEMMDAAsL3AEBBH8jAEHAAWsiACMDSyAAIwRJcgRAIAAQCQsgACQAIAAgBDYCvAEgAEGgAWoiBCAEIARBFBDSAUHzCiAAQbwBahDsASIIaiIGIAIQ7QEhByAAIAIoAhwiBTYCACAFQYC4A0cEQCAFIAUoAgRBAWo2AgQLIABBsLkDELoBIQUgABC4ASAFIAQgBiAAIAUoAgAoAjARBgAaIAEgACAAIAhBAnRqIgEgACAHIARrQQJ0aiAGIAdGGyABIAIgAxCHAiAAQcABaiIAIwNLIAAjBElyBEAgABAJCyAAJAALwQIBBH8jAEEQayIDIwNLIAMjBElyBEAgAxAJCyADJAACQCABQff///8DTQRAAkAgAUECSQRAIAAgAUH/AHE6AAsgACEEDAELIANBCGogAUECTwR/IAFBAmpBfnEiBCAEQQFrIgQgBEECRhsFQQELQQFqELIDIAMoAgwaIAAgAygCCCIENgIAIAAgAygCDEGAgICAeHI2AgggACABNgIECyMAQRBrIgUjA0sgBSMESXIEQCAFEAkLIAUkACAFIAI2AgwgBCECIAEhBgNAIAYEQCACIAUoAgw2AgAgBkEBayEGIAJBBGohAgwBCwsgBUEQaiICIwNLIAIjBElyBEAgAhAJCyACJAAgA0EANgIEIAQgAUECdGogAygCBDYCACADQRBqIgEjA0sgASMESXIEQCABEAkLIAEkAAwBCxB8AAsgAAucAQEBfyMAQRBrIgIjA0sgAiMESXIEQCACEAkLIAIkACACIAA2AgwCQCAAIAFGDQADQCACIAFBAWsiATYCCCAAIAFPDQEgAigCDCIALQAAIQEgACACKAIIIgAtAAA6AAAgACABOgAAIAIgAigCDEEBaiIANgIMIAIoAgghAQwACwALIAJBEGoiACMDSyAAIwRJcgRAIAAQCQsgACQAC5wBAQF/IwBBEGsiAiMDSyACIwRJcgRAIAIQCQsgAiQAIAIgADYCDAJAIAAgAUYNAANAIAIgAUEEayIBNgIIIAAgAU8NASACKAIMIgAoAgAhASAAIAIoAggiACgCADYCACAAIAE2AgAgAiACKAIMQQRqIgA2AgwgAigCCCEBDAALAAsgAkEQaiIAIwNLIAAjBElyBEAgABAJCyAAJAALwwUBA38jAEEQayIIIwNLIAgjBElyBEAgCBAJCyAIJAAgCCACNgIIIAggATYCDCAIQQRqIgIgAygCHCIBNgIAIAFBgLgDRwRAIAEgASgCBEEBajYCBAsgAkG4uQMQugEhCSACELgBIARBADYCAEEAIQECQANAIAYgB0YNASABDQECQCAIQQxqIAhBCGoQXw0AAkAgCSAGLAAAQQAgCSgCACgCJBEDAEElRgRAIAZBAWogB0YNAkEAIQICfwJAIAkgBiwAAUEAIAkoAgAoAiQRAwAiAUHFAEYNAEEBIQogAUH/AXFBMEYNACABDAELIAZB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IActAL8BQQFGBEAgBEEtOgAAIARBAWohBAsgASgCACECA0AgBygCxAEgAk0EQAJAIARBADoAACAHIAY2AgAgB0EQaiAHEJ8BQQFHDQAgBygCCCEAIAdBADYCCCAABEAgACAHKAIMEQEACwwECwUgBCAHQbABaiAHQYABaiIAIABBKGogAhDlASAAa0ECdWotAAA6AAAgBEEBaiEEIAJBBGohAgwBCwtB3gkQxAMACxDDAwALIAdB7ARqIAdB6ARqEGUEQCAFIAUoAgBBAnI2AgALIAcoAuwEIAdBwAFqELgBIAEoAgAhACABQQA2AgAgAARAIAAgASgCBBEBAAsgB0HwBGoiACMDSyAAIwRJcgRAIAAQCQsgACQAC6IXAQl/IwBBkARrIgsjA0sgCyMESXIEQCALEAkLIAskACALIAo2AogEIAsgATYCjAQCQCAAIAtBjARqEGUEQCAFIAUoAgBBBHI2AgBBACEADAELIAtBMjYCSCALQegAaiIOIAtB8ABqNgIAIA4gC0HIAGoiESgCADYCBCALIA4oAgAiATYCZCALIAFBkANqNgJgIBFCADcCACARQQA2AgggC0E8aiIPQgA3AgAgD0EANgIIIAtBMGoiDUIANwIAIA1BADYCCCALQSRqIgxCADcCACAMQQA2AgggC0EYaiIQQgA3AgAgEEEANgIIIwBBEGsiASMDSyABIwRJcgRAIAEQCQsgASQAAkAgAgRAIAFBBGoiCiADQcC3AxC6ASICIAIoAgAoAiwRAgAMAQsgAUEEaiIKIANBuLcDELoBIgIgAigCACgCLBECAAsgCyABKAIENgBcIAogAiACKAIAKAIgEQIAIAwgChDCAiAKEMcDGiAKIAIgAigCACgCHBECACANIAoQwgIgChDHAxogCyACIAIoAgAoAgwRAAA2AlggCyACIAIoAgAoAhARAAA2AlQgCiACIAIoAgAoAhQRAgAgESAKEGsgChDHAxogCiACIAIoAgAoAhgRAgAgDyAKEMICIAoQxwMaIAsgAiACKAIAKAIkEQAANgIUIAFBEGoiASMDSyABIwRJcgRAIAEQCQsgASQAIAkgCCgCADYCACAEQYAEcSESQQAhA0EAIQEDQCABIQICQAJAAkACQCADQQRGDQAgACALQYwEahBlDQBBACEKAkACQAJAAkACQAJAIAtB3ABqIANq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AABFBEBBgLsDQcj/ABCQA0GMuwNBAToAAAtBgLsDCwoAQYC7AxDHAxoLCQAgABCxAxBICxgAIAAoAggQ0gFHBEAgACgCCBCnAQsgAAsZAQF/IAEQswMhAiAAIAE2AgQgACACNgIACx8AIABB/////wNLBEBBwAxBABDUAwALIABBAnQQwQMLiwEBAX8jAEEQayIDIwNLIAMjBElyBEAgAxAJCyADJAACfyAALQALQQd2BEAgACgCBAwBCyAALQALCxoCQCAALQALQQd2BEAgACACNgIEDAELIAAgAkH/AHE6AAsLIANBADoADyABIAJqIAMtAA86AAAgA0EQaiIAIwNLIAAjBElyBEAgABAJCyAAJAALXAEBfyMAQRBrIgMjA0sgAyMESXIEQCADEAkLIAMkACADIAE2AgwgAyACNgIIIAAgAygCDDYCACAAIAMoAgg2AgQgA0EQaiIAIwNLIAAjBElyBEAgABAJCyAAJAALdQEBfyMAQRBrIgMjA0sgAyMESXIEQCADEAkLIAMkACADIAE2AgggAyAANgIMIAMgAjYCBEEAIQEgA0EEaiIAKAIAIAMoAgxPBEAgACgCACADKAIISSEBCyADQRBqIgAjA0sgACMESXIEQCAAEAkLIAAkACABC0kBAX8jAEEQayIBIwNLIAEjBElyBEAgARAJCyABJAAgASAANgIMIAFBDGoQuAMgAUEQaiIBIwNLIAEjBElyBEAgARAJCyABJAALTQEBfyAAKAIAIQEjAEEQayIAIwNLIAAjBElyBEAgABAJCyAAJAAgACABNgIMIAAoAgwgAEEQaiIAIwNLIAAjBElyBEAgABAJCyAAJAALYgEBfyMAQRBrIgMjA0sgAyMESXIEQCADEAkLIAMkACADIAEQtwM2AgwgAyACELcDNgIIIAAgAygCDDYCACAAIAMoAgg2AgQgA0EQaiIAIwNLIAAjBElyBEAgABAJCyAAJAALXwECfyMAQRBrIgAjA0sgACMESXIEQCAAEAkLIAAkACAAQf////8DNgIMIABB/////wc2AgggAEEMaiAAQQhqEHQoAgAgAEEQaiIAIwNLIAAjBElyBEAgABAJCyAAJAALCABB1wkQfQALbwEBfyMAQRBrIgMjA0sgAyMESXIEQCADEAkLIAMkAAJAAkAgAkEeSw0AIAEtAHhBAXENACABQQE6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fyAALQALQQd2BEAgACgCAAwBC0EACxogBA0AIAAiASADQQFqQf8AcToACwwBCyAAKAIAIQEgACADQQFqNgIECyABIANBAnRqIgAgAigCDDYCACACQQA2AgggACACKAIINgIEIAJBEGoiACMDSyAAIwRJcgRAIAAQCQsgACQAC4QBAQJ/IAFB9////wdNBEACQCABQQtJBEAgAEIANwIAIABBADYCCCAAIAFB/wBxOgALDAELIAFBC08EfyABQQhqQXhxIgIgAkEBayICIAJBC0YbBUEKC0EBaiICEMEDIQMgACACQYCAgIB4cjYCCCAAIAM2AgAgACABNgIECyAADwsQfAALkQMBBX8jAEEQayICIwNLIAIjBElyBEAgAhAJCyACJAACfyACQQRqQccLEIEBIQMjAEEQayIBIwNLIAEjBElyBEAgARAJCyABJAAgAUEANgIMAn8gAC0AC0EHdgRAIAAoAgAMAQsgAAshACABQYinAygCADYCCEGIpwNBADYCACAAIAFBDGpBCkKAgICACBCpAachBEGIpwMoAgAhBUGIpwMgASgCCDYCACABIAU2AggCQCABKAIIQcQARwRAIAEoAgwgAEYNASABQRBqIgAjA0sgACMESXIEQCAAEAkLIAAkACAEDAILIAMQ0QMACyMAQRBrIgAjA0sgACMESXIEQCAAEAkLIAAkACAAQQRqIgAgA0GNCxDSAwJ/IAAtAAtBB3YEQCAAKAIADAELIAALIQEjAEEQayIAIwNLIAAjBElyBEAgABAJCyAAJAAgACABNgIAQbIPIAAQ1AMACyIBQYCAgIB4SARAIAMQ0QMACyADEMcDGiACQRBqIgAjA0sgACMESXIEQCAAEAkLIAAkACABC3IBAX8jAEEQayIBIwNLIAEjBElyBEAgARAJCyABJAAgAUEEaiIBIABBhQwQ0gMCfyABLQALQQd2BEAgASgCAAwBCyABCyEAIwBBEGsiASMDSyABIwRJcgRAIAEQCQsgASQAIAEgADYCAEHEESABENQDAAvbAQEEfyMAQRBrIgQjA0sgBCMESXIEQCAEEAkLIAQkAAJ/IAACfyABLQALQQd2BEAgASgCBAwBCyABLQALQf8AcQsiACACECUiBWoQzwMiAy0AC0EHdgRAIAMoAgAMAQsgAwshAwJ/IAEtAAtBB3YEQCABKAIADAEL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QZMyCwSAQCAQAEGjMgsEAQIECABBtDILA4BAIABBwjILBQECBAgQAEHVMgsCgEAAQeEyCwYBAgQIECAAQfYyCwGAAEGAMwsHAQIECBAgQABBoDMLtAIHAAAADwAAAA8AAAAPAAAAAwAAAA8AAAAPAAAACwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA0AAAAPAAAADwAAAA8AAAAMAAAADwAAAA8AAAAOAAAAZAAAACwBAABeAQAA9AEAAOgDAAAQJwAAnP///9T+//+i/v//DP7//xj8///w2P//+////wBB7DULFfv////7////AAAAAAAAAAAKAAAACgBBjDYLiAH7////+////wUAAAAUAAAAFAAAABQAAAAUAAAABQAAAPv////7////CgAAABQAAAAeAAAAHgAAABQAAAAKAAAA+/////v///8KAAAAFAAAAB4AAAAeAAAAFAAAAAoAAAD7////+////wUAAAAUAAAACgAAAAoAAAAUAAAABQAAAPv////7////AEGsNwsM+/////v////2////AEHINwsI9v////v///8AQZw4CwUKAAAACgBBuDgLDQoAAAAUAAAAFAAAAAoAQdg4Cw0KAAAAFAAAABQAAAAKAEH0OAsBCgBBiDkLAQoAQZQ5CwEeAEGoOQsBHgBBuDkLVfb///8AAAAAAAAAAPb///8AAAAAAAAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAQZg6Cw0KAAAAFAAAABQAAAAKAEG4OgsNCgAAABQAAAAUAAAACgBB2DoLDQoAAAAUAAAAFAAAAAoAQfg6Cw0KAAAAFAAAABQAAAAKAEGYOwsNCgAAABQAAAAUAAAACgBBvDsLBRQAAAAUAEH4OwsNBQAAAAUAAAAFAAAABQBBlDwLFQUAAAAF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RUVFRQAAAAAQXgAAPCcAAAAAAAABAAAAsCYAAAP0//9OU3QzX18yMTNiYXNpY19pc3RyZWFtSWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFAAC0XQAAeCcAAOgmAABOU3QzX18yMTViYXNpY19zdHJpbmdidWZJY05TXzExY2hhcl90cmFpdHNJY0VFTlNfOWFsbG9jYXRvckljRUVFRQAAADwAAAAAAAAAHCgAACcAAAAoAAAAxP///8T///8cKAAAKQAAACoAAADIJwAAACgAABQoAADcJwAAPAAAAAAAAAAkJwAAHAAAAB0AAADE////xP///yQnAAAeAAAAHwAAALRdAAAoKAAAJCcAAE5TdDNfXzIxOWJhc2ljX2lzdHJpbmdzdHJlYW1JY05TXzExY2hhcl90cmFpdHNJY0VFTlNfOWFsbG9jYXRvckljRUVFRQAAAAAAAACAKAAAKwAAACwAAACMXQAAiCgAAE5TdDNfXzI4aW9zX2Jhc2VFAAAAAAAAAN4SBJUAAAAA////////////////oCgAABQAAABDLlVURi04AEHw0QALArQoAEGQ0gAL+gQCAADAAwAAwAQAAMAFAADABgAAwAcAAMAIAADACQAAwAoAAMALAADADAAAwA0AAMAOAADADwAAwBAAAMARAADAEgAAwBMAAMAUAADAFQAAwBYAAMAXAADAGAAAwBkAAMAaAADAGwAAwBwAAMAdAADAHgAAwB8AAMAAAACzAQAAwwIAAMMDAADDBAAAwwUAAMMGAADDBwAAwwgAAMMJAADDCgAAwwsAAMMMAADDDQAA0w4AAMMPAADDAAAMuwEADMMCAAzDAwAMwwQADNsAAAAA0XSeAFedvSqAcFIP//8+JwoAAABkAAAA6AMAABAnAACghgEAQEIPAICWmAAA4fUFGAAAADUAAABxAAAAa////877//+Sv///AAAAAAAAAAD/////////////////////////////////////////////////////////////////AAECAwQFBgcICf////////8KCwwNDg8QERITFBUWFxgZGhscHR4fICEiI////////woLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIj/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wABAgQHAwYFAAAAAAAAAExDX0NUWVBFAAAAAExDX05VTUVSSUMAAExDX1RJTUUAAAAAAExDX0NPTExBVEUAAExDX01PTkVUQVJZAExDX01FU1NBR0VTAJAtAEGU2wAL+QMBAAAAAgAAAAMAAAAEAAAABQAAAAYAAAAHAAAACAAAAAkAAAAKAAAACwAAAAwAAAANAAAADgAAAA8AAAAQAAAAEQAAABIAAAATAAAAFAAAABUAAAAWAAAAFwAAABgAAAAZAAAAGgAAABsAAAAcAAAAHQAAAB4AAAAfAAAAIAAAACEAAAAiAAAAIwAAACQAAAAlAAAAJgAAACcAAAAoAAAAKQAAACoAAAArAAAALAAAAC0AAAAuAAAALwAAADAAAAAxAAAAMgAAADMAAAA0AAAANQAAADYAAAA3AAAAOAAAADkAAAA6AAAAOwAAADwAAAA9AAAAPgAAAD8AAABAAAAAQQAAAEIAAABDAAAARAAAAEUAAABGAAAARwAAAEgAAABJAAAASgAAAEsAAABMAAAATQAAAE4AAABPAAAAUAAAAFEAAABSAAAAUwAAAFQAAABVAAAAVgAAAFcAAABYAAAAWQAAAFoAAABbAAAAXAAAAF0AAABeAAAAXwAAAGAAAABBAAAAQgAAAEMAAABEAAAARQAAAEYAAABHAAAASAAAAEkAAABKAAAASwAAAEwAAABNAAAATgAAAE8AAABQAAAAUQAAAFIAAABTAAAAVAAAAFUAAABWAAAAVwAAAFgAAABZAAAAWgAAAHsAAAB8AAAAfQAAAH4AAAB/AEGQ4wALAqAzAEGk5wAL+QMBAAAAAgAAAAMAAAAEAAAABQAAAAYAAAAHAAAACAAAAAkAAAAKAAAACwAAAAwAAAANAAAADgAAAA8AAAAQAAAAEQAAABIAAAATAAAAFAAAABUAAAAWAAAAFwAAABgAAAAZAAAAGgAAABsAAAAcAAAAHQAAAB4AAAAfAAAAIAAAACEAAAAiAAAAIwAAACQAAAAlAAAAJgAAACcAAAAoAAAAKQAAACoAAAArAAAALAAAAC0AAAAuAAAALwAAADAAAAAxAAAA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dCBub3QgcmVwcmVzZW50YWJsZQBOb3QgYSB0dHkAUGVybWlzc2lvbiBkZW5pZWQAT3BlcmF0aW9uIG5vdCBwZXJtaXR0ZWQATm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeQBObyBzdWNoIHByb2Nlc3MARmlsZSBleGlzdHMAVmFsdWUgdG9vIGxhcmdlIGZvciBkZWZpbmVkIGRhdGEgdHlwZQBObyBzcGFjZSBsZWZ0IG9uIGRldmljZQBPdXQgb2YgbWVtb3J5AFJlc291cmNlIGJ1c3kASW50ZXJydXB0ZWQgc3lzdGVtIGNhbGwAUmVzb3VyY2UgdGVtcG9yYXJpbHkgdW5hdmFpbGFibGUASW52YWxpZCBzZWVrAENyb3NzLWRldmljZSBsaW5rAFJlYWQtb25seSBmaWxlIHN5c3RlbQBEaXJlY3Rvcnkgbm90IGVtcHR5AENvbm5lY3Rpb24gcmVzZXQgYnkgcGVlcgBPcGVyYXRpb24gdGltZWQgb3V0AENvbm5lY3Rpb24gcmVmdXNlZABIb3N0IGlzIGRvd24ASG9zdCBpcyB1bnJlYWNoYWJsZQBBZGRyZXNzIGluIHVzZQBCcm9rZW4gcGlwZQBJL08gZXJyb3IATm8gc3VjaCBkZXZpY2Ugb3IgYWRkcmVzcwBCbG9jayBkZXZpY2UgcmVxdWlyZWQATm8gc3VjaCBkZXZpY2UATm90IGEgZGlyZWN0b3J5AElzIGEgZGlyZWN0b3J5AFRleHQgZmlsZSBidXN5AEV4ZWMgZm9ybWF0IGVycm9yAEludmFsaWQgYXJndW1lbnQAQXJndW1lbnQgbGlzdCB0b28gbG9uZwBTeW1ib2xpYyBsaW5rIGxvb3AARmlsZW5hbWUgdG9vIGxvbmcAVG9vIG1hbnkgb3BlbiBmaWxlcyBpbiBzeXN0ZW0ATm8gZmlsZSBkZXNjcmlwdG9ycyBhdmFpbGFibGUAQmFkIGZpbGUgZGVzY3JpcHRvcgBObyBjaGlsZCBwcm9jZXNzAEJhZCBhZGRyZXNzAEZpbGUgdG9vIGxhcmdlAFRvbyBtYW55IGxpbmtzAE5vIGxvY2tzIGF2YWlsYWJsZQBSZXNvdXJjZSBkZWFkbG9jayB3b3VsZCBvY2N1cgBTdGF0ZSBub3QgcmVjb3ZlcmFibGUAT3duZXIgZGllZABPcGVyYXRpb24gY2FuY2VsZWQARnVuY3Rpb24gbm90IGltcGxlbWVudGVkAE5vIG1lc3NhZ2Ugb2YgZGVzaXJlZCB0eXBlAElkZW50aWZpZXIgcmVtb3ZlZABEZXZpY2Ugbm90IGEgc3RyZWFtAE5vIGRhdGEgYXZhaWxhYmxlAERldmljZSB0aW1lb3V0AE91dCBvZiBzdHJlYW1zIHJlc291cmNlcwBMaW5rIGhhcyBiZWVuIHNldmVyZWQAUHJvdG9jb2wgZXJyb3IAQmFkIG1lc3NhZ2UARmlsZSBkZXNjcmlwdG9yIGluIGJhZCBzdGF0ZQBOb3QgYSBzb2NrZXQARGVzdGluYXRpb24gYWRkcmVzcyByZXF1aXJlZABNZXNzYWdlIHRvbyBsYXJnZQBQcm90b2NvbCB3cm9uZyB0eXBlIGZvciBzb2NrZXQAUHJvdG9jb2wgbm90IGF2YWlsYWJsZQBQcm90b2NvbCBub3Qgc3VwcG9ydGVkAFNvY2tldCB0eXBlIG5vdCBzdXBwb3J0ZWQATm90IHN1cHBvcnRlZABQcm90b2NvbCBmYW1pbHkgbm90IHN1cHBvcnRlZABBZGRyZXNzIGZhbWlseSBub3Qgc3VwcG9ydGVkIGJ5IHByb3RvY29sAEFkZHJlc3Mgbm90IGF2YWlsYWJsZQBOZXR3b3JrIGlzIGRvd24ATmV0d29yayB1bnJlYWNoYWJsZQBDb25uZWN0aW9uIHJlc2V0IGJ5IG5ldHdvcmsAQ29ubmVjdGlvbiBhYm9ydGVkAE5vIGJ1ZmZlciBzcGFjZSBhdmFpbGFibGUAU29ja2V0IGlzIGNvbm5lY3RlZABTb2NrZXQgbm90IGNvbm5lY3RlZABDYW5ub3Qgc2VuZCBhZnRlciBzb2NrZXQgc2h1dGRvd24AT3BlcmF0aW9uIGFscmVhZHkgaW4gcHJvZ3Jlc3MAT3BlcmF0aW9uIGluIHByb2dyZXNzAFN0YWxlIGZpbGUgaGFuZGxlAFJlbW90ZSBJL08gZXJyb3IAUXVvdGEgZXhjZWVkZWQATm8gbWVkaXVtIGZvdW5kAFdyb25nIG1lZGl1bSB0eXBlAE11bHRpaG9wIGF0dGVtcHRlZABSZXF1aXJlZCBrZXkgbm90IGF2YWlsYWJsZQBLZXkgaGFzIGV4cGlyZWQAS2V5IGhhcyBiZWVuIHJldm9rZWQAS2V5IHdhcyByZWplY3RlZCBieSBzZXJ2aWNlAEHytwELlgGgAk4A6wGnBX4FIAF1BhgDhgT6ALkDLAP9BbcBigF6A7wEHgDMBqIAPQNJA9cBAAQIAJMGCAGPAgYCKgZfArcC+gJYA9kE/QbKAr0F4QXNBdwCEAZAAngAfQJnA2EE7ADlAwoF1ADMAz4GTwJ2AZgDrwQAAEQAEAKuAK4DYAD6AXcEIQXrBCsAYAFBAZIAqQajAW4CTgEAQbi5AQsMEwQAAAAAAAAAACoCAEHYuQELBicEOQRIBABB7rkBCwKSBABBgroBC4YEOAVSBWAFUwYAAMoBAAAAAAAAAAC7BtsG6wYQBysHOwdQB7RdAAAwXQAA9F4AAE4xMF9fY3h4YWJpdjExNl9fc2hpbV90eXBlX2luZm9FAAAAALRdAABgXQAAJF0AAE4xMF9fY3h4YWJpdjExN19fY2xhc3NfdHlwZV9pbmZvRQAAAAAAAABUXQAANgEAADcBAAA4AQAAOQEAADoBAAA7AQAAPAEAAD0BAAAAAAAA1F0AADYBAAA+AQAAOAEAADkBAAA6AQAAPwEAAEABAABBAQAAtF0AAOBdAABUXQAATjEwX19jeHhhYml2MTIwX19zaV9jbGFzc190eXBlX2luZm9FAAAAAAAAAAAwXgAANgEAAEIBAAA4AQAAOQEAADoBAABDAQAARAEAAEUBAAC0XQAAPF4AAFRdAABOMTBfX2N4eGFiaXYxMjFfX3ZtaV9jbGFzc190eXBlX2luZm9FAAAAAAAAAHheAABGAQAARwEAAEgBAACMXQAAgF4AAFN0OWV4Y2VwdGlvbgAAAAAAAAAApF4AAAIAAABJAQAASgEAALRdAACwXgAAeF4AAFN0MTFsb2dpY19lcnJvcgAAAAAA1F4AAAIAAABLAQAASgEAALRdAADgXgAApF4AAFN0MTJsZW5ndGhfZXJyb3IAAAAAjF0AAPxeAABTdDl0eXBlX2luZm8AQZC+AQsJZ0WLa8DiAAEFAEGkvgELAQkAQby+AQsKCgAAAAsAAACU0wBB1L4BCwECAEHkvgELCP//////////AEGovwELCRhfAAAAIAAABQBBvL8BCwEtAEHUvwELDgoAAAAuAAAAWNYAAAAEAEHsvwELAQEAQfy/AQsF/////woAQcDAAQscsF8AACVtLyVkLyV5AAAACCVIOiVNOiVTAAAACAClygMEbmFtZQAMC2VuZ2luZS53YXNtAbOuA+0DAAtfX2N4YV90aHJvdwEWZW1zY3JpcHRlbl9yZXNpemVfaGVhcAIJX2Fib3J0X2pzAw9fX3dhc2lfZmRfY2xvc2UED19fd2FzaV9mZF93cml0ZQUOX193YXNpX2ZkX3NlZWsGGF9fd2FzaV9lbnZpcm9uX3NpemVzX2dldAcSX193YXNpX2Vudmlyb25fZ2V0CAlfdHpzZXRfanMKEV9fd2FzbV9jYWxsX2N0b3JzCxdfX2N4eF9nbG9iYWxfYXJyYXlfZHRvcgywAnN0ZDo6X18yOjpiYXNpY19pc3RyZWFtPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4mIHN0ZDo6X18yOjpvcGVyYXRvcj4+W2FiaTpuZTIwMDEwMF08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+PihzdGQ6Ol9fMjo6YmFzaWNfaXN0cmVhbTxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Jiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+JikNDXdhc21fcGFyc2VfZ28OGV9fY3h4X2dsb2JhbF9hcnJheV9kdG9yLjkPE3dhc21fcGFyc2VfcG9zaXRpb24QEWNyZWF0ZV9jaGVzc2JvYXJkEQRtYWluEhpfX2N4eF9nbG9iYWxfYXJyYXlfZHRvcl8yNBMaX19jeHhfZ2xvYmFsX2FycmF5X2R0b3IuMTQUGGNoZXNzYm9hcmQ6OmNoZXNzYm9hcmQoKRVlY2hlc3Nib2FyZDo6RkVOKHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+PikWF2NoZXNzYm9hcmQ6OmluaXRfaGFzaCgpFzdjaGVzc2JvYXJkOjpyb29rX2F0dGFja3MoaW50LCB1bnNpZ25lZCBsb25nIGxvbmcpIGNvbnN0GDljaGVzc2JvYXJkOjpiaXNob3BfYXR0YWNrcyhpbnQsIHVuc2lnbmVkIGxvbmcgbG9uZykgY29uc3QZOGNoZXNzYm9hcmQ6OnF1ZWVuX2F0dGFja3MoaW50LCB1bnNpZ25lZCBsb25nIGxvbmcpIGNvbnN0GiZjaGVzc2JvYXJkOjppc19zcV9hdHRhY2tlZChpbnQsIENvbG9yKRssY2hlc3Nib2FyZDo6bWFrZV9tb3ZlKGludCwgaW50LCBjaGVzc2JvYXJkJikcI2NoZXNzYm9hcmQ6OmdldF9waWVjZV9hdChpbnQpIGNvbnN0HRpfX2N4eF9nbG9iYWxfYXJyYXlfZHRvcl8zNx4ZX19jeHhfZ2xvYmFsX2FycmF5X2R0b3IuMh8XYm9hcmRfZXZhbChjaGVzc2JvYXJkJikgI25lZ2FtYXgoY2hlc3Nib2FyZCYsIGludCwgaW50LCBpbnQpISFxdWllc2NlbmNlKGludCwgaW50LCBjaGVzc2JvYXJkJikiI3NvcnRfbW92ZXMobW92ZXNfbHN0JiwgY2hlc3Nib2FyZCYpIxpfX2N4eF9nbG9iYWxfYXJyYXlfZHRvcl80NSQmY2hlc3Nib2FyZDo6Z2VuZXJhdGVfbW92ZXMobW92ZXNfbHN0JiklBnN0cmxlbiYEc2JyaycFYWJvcnQoCF9fbWVtY3B5KQVkdW1teSoNX19zdGRpb19jbG9zZSsNX19zdGRpb193cml0ZSwMX19zdGRpb19zZWVrLQpfX2xvY2tmaWxlLgxfX3VubG9ja2ZpbGUvFF9fcHRocmVhZF9tdXRleF9sb2NrMAlfX3Rvd3JpdGUxBm1lbWNocjIVZW1zY3JpcHRlbl9zdGFja19pbml0MxllbXNjcmlwdGVuX3N0YWNrX2dldF9mcmVlNBllbXNjcmlwdGVuX3N0YWNrX2dldF9iYXNlNRhlbXNjcmlwdGVuX3N0YWNrX2dldF9lbmQ2B3djcnRvbWI3BndjdG9tYjgFZnJleHA5CV9fYXNobHRpMzoJX19sc2hydGkzOwxfX3RydW5jdGZkZjI8CV9fZndyaXRleD0IX19tZW1zZXQ+E19fdmZwcmludGZfaW50ZXJuYWw/C3ByaW50Zl9jb3JlQANvdXRBBmdldGludEIHcG9wX2FyZ0MFZm10X3VEA3BhZEUGZm10X2ZwRhNwb3BfYXJnX2xvbmdfZG91YmxlRxllbXNjcmlwdGVuX2J1aWx0aW5fbWFsbG9jSBdlbXNjcmlwdGVuX2J1aWx0aW5fZnJlZUkaZW1zY3JpcHRlbl9idWlsdGluX3JlYWxsb2NKDWRpc3Bvc2VfY2h1bmtLBmZmbHVzaEwIX190b3JlYWRNRHN0ZDo6X18yOjpiYXNpY19pb3M8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pjo6fmJhc2ljX2lvcygpTlBzdGQ6Ol9fMjo6YmFzaWNfc3RyZWFtYnVmPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj46On5iYXNpY19zdHJlYW1idWYoKU9Uc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1ZjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Ojp+YmFzaWNfc3RyZWFtYnVmKClfMTIyUFxzdGQ6Ol9fMjo6YmFzaWNfc3RyZWFtYnVmPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj46OmltYnVlKHN0ZDo6X18yOjpsb2NhbGUgY29uc3QmKVFRc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1ZjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+OjpzZXRidWYoY2hhciosIGxvbmcpUntzdGQ6Ol9fMjo6YmFzaWNfc3RyZWFtYnVmPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj46OnNlZWtvZmYobG9uZyBsb25nLCBzdGQ6Ol9fMjo6aW9zX2Jhc2U6OnNlZWtkaXIsIHVuc2lnbmVkIGludClTcHN0ZDo6X18yOjpiYXNpY19zdHJlYW1idWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pjo6c2Vla3BvcyhzdGQ6Ol9fMjo6ZnBvczxfX21ic3RhdGVfdD4sIHVuc2lnbmVkIGludClUUXN0ZDo6X18yOjpiYXNpY19zdHJlYW1idWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pjo6eHNnZXRuKGNoYXIqLCBsb25nKVWDAWxvbmcgY29uc3QmIHN0ZDo6X18yOjptaW5bYWJpOm5uMjAwMTAwXTxsb25nLCBzdGQ6Ol9fMjo6X19sZXNzPHZvaWQsIHZvaWQ+Pihsb25nIGNvbnN0JiwgbG9uZyBjb25zdCYsIHN0ZDo6X18yOjpfX2xlc3M8dm9pZCwgdm9pZD4pVklzdGQ6Ol9fMjo6YmFzaWNfc3RyZWFtYnVmPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj46OnVuZGVyZmxvdygpV0VzdGQ6Ol9fMjo6YmFzaWNfc3RyZWFtYnVmPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj46OnVmbG93KClYTHN0ZDo6X18yOjpiYXNpY19zdHJlYW1idWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pjo6cGJhY2tmYWlsKGludClZV3N0ZDo6X18yOjpiYXNpY19zdHJlYW1idWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pjo6eHNwdXRuKGNoYXIgY29uc3QqLCBsb25nKVpQc3RkOjpfXzI6OmJhc2ljX2lzdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pjo6fmJhc2ljX2lzdHJlYW0oKV8xNDVbXXZpcnR1YWwgdGh1bmsgdG8gc3RkOjpfXzI6OmJhc2ljX2lzdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pjo6fmJhc2ljX2lzdHJlYW0oKVxQc3RkOjpfXzI6OmJhc2ljX2lzdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pjo6fmJhc2ljX2lzdHJlYW0oKV8xNDddYXZpcnR1YWwgdGh1bmsgdG8gc3RkOjpfXzI6OmJhc2ljX2lzdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pjo6fmJhc2ljX2lzdHJlYW0oKV8xNDheQ3N0ZDo6X18yOjpiYXNpY19vc3RyZWFtPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj46OmZsdXNoKClf3AFib29sIHN0ZDo6X18yOjpvcGVyYXRvcj09W2FiaTpubjIwMDEwMF08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+PihzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+IGNvbnN0Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+PiBjb25zdCYpYFxzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+OjpvcGVyYXRvcisrW2FiaTpubjIwMDEwMF0oKWFUc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1ZjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+OjpzYnVtcGNbYWJpOm5uMjAwMTAwXSgpYjhzdGQ6Ol9fMjo6aW9zX2Jhc2U6OnNldHN0YXRlW2FiaTpubjIwMDEwMF0odW5zaWduZWQgaW50KWNXc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1ZjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+OjpzcHV0Y1thYmk6bm4yMDAxMDBdKGNoYXIpZF9zdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+OjpvcGVyYXRvcj1bYWJpOm5uMjAwMTAwXShjaGFyKWXuAWJvb2wgc3RkOjpfXzI6Om9wZXJhdG9yPT1bYWJpOm5uMjAwMTAwXTx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4gY29uc3QmLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+IGNvbnN0JilmYnN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj46Om9wZXJhdG9yKytbYWJpOm5uMjAwMTAwXSgpZ1pzdGQ6Ol9fMjo6YmFzaWNfc3RyZWFtYnVmPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj46OnNidW1wY1thYmk6bm4yMDAxMDBdKCloaHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj46Om9wZXJhdG9yPVthYmk6bm4yMDAxMDBdKHdjaGFyX3QpaVlzdGQ6Ol9fMjo6YmFzaWNfc3RyZWFtYnVmPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj46OmViYWNrW2FiaTpubjIwMDEwMF0oKSBjb25zdGpYc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1ZjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+OjpncHRyW2FiaTpubjIwMDEwMF0oKSBjb25zdGvFAXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6b3BlcmF0b3I9W2FiaTpubjIwMDEwMF0oc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+JiYpbHl2b2lkIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6X19pbml0PGNoYXIqLCAwPihjaGFyKiwgY2hhciopbbkBc3RkOjpfXzI6OmJhc2ljX3N0cmluZ2J1ZjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+OjpzdHIoc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+IGNvbnN0JilueXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6cmVzaXplW2FiaTpubjIwMDEwMF0odW5zaWduZWQgbG9uZylvZHN0ZDo6X18yOjpiYXNpY19zdHJpbmdidWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6dW5kZXJmbG93KClwZ3N0ZDo6X18yOjpiYXNpY19zdHJpbmdidWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6cGJhY2tmYWlsKGludClxZnN0ZDo6X18yOjpiYXNpY19zdHJpbmdidWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6b3ZlcmZsb3coaW50KXKHAWNoYXIqIGNvbnN0JiBzdGQ6Ol9fMjo6bWF4W2FiaTpubjIwMDEwMF08Y2hhciosIHN0ZDo6X18yOjpfX2xlc3M8dm9pZCwgdm9pZD4+KGNoYXIqIGNvbnN0JiwgY2hhciogY29uc3QmLCBzdGQ6Ol9fMjo6X19sZXNzPHZvaWQsIHZvaWQ+KXOWAXN0ZDo6X18yOjpiYXNpY19zdHJpbmdidWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6c2Vla29mZihsb25nIGxvbmcsIHN0ZDo6X18yOjppb3NfYmFzZTo6c2Vla2RpciwgdW5zaWduZWQgaW50KXRrdW5zaWduZWQgbG9uZyBjb25zdCYgc3RkOjpfXzI6Om1pblthYmk6bm4yMDAxMDBdPHVuc2lnbmVkIGxvbmc+KHVuc2lnbmVkIGxvbmcgY29uc3QmLCB1bnNpZ25lZCBsb25nIGNvbnN0Jil1a3N0ZDo6X18yOjpiYXNpY19zdHJpbmdidWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6fmJhc2ljX3N0cmluZ2J1Zigpdm9zdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nYnVmPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj46On5iYXNpY19zdHJpbmdidWYoKV8yNTN3iwFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nYnVmPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj46OnNlZWtwb3Moc3RkOjpfXzI6OmZwb3M8X19tYnN0YXRlX3Q+LCB1bnNpZ25lZCBpbnQpeHNzdGQ6Ol9fMjo6YmFzaWNfaXN0cmluZ3N0cmVhbTxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+Ojp+YmFzaWNfaXN0cmluZ3N0cmVhbSgpeXdzdGQ6Ol9fMjo6YmFzaWNfaXN0cmluZ3N0cmVhbTxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+Ojp+YmFzaWNfaXN0cmluZ3N0cmVhbSgpXzI1N3qEAXZpcnR1YWwgdGh1bmsgdG8gc3RkOjpfXzI6OmJhc2ljX2lzdHJpbmdzdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6fmJhc2ljX2lzdHJpbmdzdHJlYW0oKXuIAXZpcnR1YWwgdGh1bmsgdG8gc3RkOjpfXzI6OmJhc2ljX2lzdHJpbmdzdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6fmJhc2ljX2lzdHJpbmdzdHJlYW0oKV8yNTl8enN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6X190aHJvd19sZW5ndGhfZXJyb3JbYWJpOm5uMjAwMTAwXSgpfTlzdGQ6Ol9fMjo6X190aHJvd19sZW5ndGhfZXJyb3JbYWJpOm5uMjAwMTAwXShjaGFyIGNvbnN0Kil+SXN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj46OmFsbG9jYXRlX2F0X2xlYXN0W2FiaTpubjIwMDEwMF0odW5zaWduZWQgbG9uZyl/ZnN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj46Ol9fdGVzdF9mb3JfZW9mW2FiaTpubjIwMDEwMF0oKSBjb25zdIABbHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj46Ol9fdGVzdF9mb3JfZW9mW2FiaTpubjIwMDEwMF0oKSBjb25zdIEBgAFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj46OmJhc2ljX3N0cmluZ1thYmk6bm4yMDAxMDBdPDA+KGNoYXIgY29uc3QqKYIBJ3N0ZDo6X18yOjppb3NfYmFzZTo6Y2xlYXIodW5zaWduZWQgaW50KYMBH3N0ZDo6X18yOjppb3NfYmFzZTo6fmlvc19iYXNlKCmEASNzdGQ6Ol9fMjo6aW9zX2Jhc2U6On5pb3NfYmFzZSgpXzMyMoUBH3N0ZDo6X18yOjppb3NfYmFzZTo6aW5pdCh2b2lkKimGARhfX2Vtc2NyaXB0ZW5fc3Rkb3V0X3NlZWuHAQdtYnJ0b3djiAEKX19vdmVyZmxvd4kBB19fc2hsaW2KAQhfX3NoZ2V0Y4sBC19fZmxvYXRzaXRmjAEIX19tdWx0ZjONAQhfX2FkZHRmM44BDV9fZXh0ZW5kZGZ0ZjKPAQdfX2xldGYykAEHX19nZXRmMpEBBnNjYWxibpIBCWNvcHlzaWdubJMBDV9fZmxvYXR1bnNpdGaUAQhfX3N1YnRmM5UBB3NjYWxibmyWAQhfX211bHRpM5cBCF9fZGl2dGYzmAEFZm1vZGyZAQtfX2Zsb2F0c2NhbpoBB3NjYW5leHCbAQxfX3RydW5jdGZzZjKcAQlzdG9yZV9pbnSdAQd2c3NjYW5mngELc3RyaW5nX3JlYWSfAQZzc2NhbmagAQl2c25wcmludGahAQhzbl93cml0ZaIBCHNucHJpbnRmowEGZ2V0ZW52pAEGc3RyY21wpQEMX19nZXRfbG9jYWxlpgEGbWVtY21wpwEKZnJlZWxvY2FsZagBD19fbmxfbGFuZ2luZm9fbKkBBnN0cnRveKoBCHdlZWtfbnVtqwEMX19zdHJmdGltZV9srAEHaXNfbGVhcK0BCW1ic3J0b3djc64BCnN0cnRveF80MjSvASdzdGQ6Ol9fMjo6Y29sbGF0ZTxjaGFyPjo6fmNvbGxhdGUoKV80MzOwAV1zdGQ6Ol9fMjo6Y29sbGF0ZTxjaGFyPjo6ZG9fY29tcGFyZShjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KikgY29uc3SxAUVzdGQ6Ol9fMjo6Y29sbGF0ZTxjaGFyPjo6ZG9fdHJhbnNmb3JtKGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KikgY29uc3SyAUBzdGQ6Ol9fMjo6Y29sbGF0ZTxjaGFyPjo6ZG9faGFzaChjaGFyIGNvbnN0KiwgY2hhciBjb25zdCopIGNvbnN0swFsc3RkOjpfXzI6OmNvbGxhdGU8d2NoYXJfdD46OmRvX2NvbXBhcmUod2NoYXJfdCBjb25zdCosIHdjaGFyX3QgY29uc3QqLCB3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCopIGNvbnN0tAFOc3RkOjpfXzI6OmNvbGxhdGU8d2NoYXJfdD46OmRvX3RyYW5zZm9ybSh3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCopIGNvbnN0tQGdAXZvaWQgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4+OjpfX2luaXQ8d2NoYXJfdCBjb25zdCosIDA+KHdjaGFyX3QgY29uc3QqLCB3Y2hhcl90IGNvbnN0Kim2AUlzdGQ6Ol9fMjo6Y29sbGF0ZTx3Y2hhcl90Pjo6ZG9faGFzaCh3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCopIGNvbnN0twGWAnN0ZDo6X18yOjpudW1fZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgYm9vbCYpIGNvbnN0uAEbc3RkOjpfXzI6OmxvY2FsZTo6fmxvY2FsZSgpuQGqBXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+PiBjb25zdCogc3RkOjpfXzI6Ol9fc2Nhbl9rZXl3b3JkW2FiaTpubjIwMDEwMF08c3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+IGNvbnN0Kiwgc3RkOjpfXzI6OmN0eXBlPGNoYXI+PihzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+IGNvbnN0Kiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+IGNvbnN0Kiwgc3RkOjpfXzI6OmN0eXBlPGNoYXI+IGNvbnN0JiwgdW5zaWduZWQgaW50JiwgYm9vbCm6AThzdGQ6Ol9fMjo6bG9jYWxlOjp1c2VfZmFjZXQoc3RkOjpfXzI6OmxvY2FsZTo6aWQmKSBjb25zdLsBlgJzdGQ6Ol9fMjo6bnVtX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Pjo6ZG9fZ2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIGxvbmcmKSBjb25zdLwBOXN0ZDo6X18yOjpfX251bV9nZXRfYmFzZTo6X19nZXRfYmFzZShzdGQ6Ol9fMjo6aW9zX2Jhc2UmKb0BSHN0ZDo6X18yOjpfX251bV9nZXQ8Y2hhcj46Ol9fc3RhZ2UyX2ludF9wcmVwKHN0ZDo6X18yOjppb3NfYmFzZSYsIGNoYXImKb4B5AFzdGQ6Ol9fMjo6X19udW1fZ2V0PGNoYXI+OjpfX3N0YWdlMl9pbnRfbG9vcChjaGFyLCBpbnQsIGNoYXIqLCBjaGFyKiYsIHVuc2lnbmVkIGludCYsIGNoYXIsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+PiBjb25zdCYsIHVuc2lnbmVkIGludCosIHVuc2lnbmVkIGludComLCBjaGFyIGNvbnN0Kim/AWpsb25nIHN0ZDo6X18yOjpfX251bV9nZXRfc2lnbmVkX2ludGVncmFsW2FiaTpubjIwMDEwMF08bG9uZz4oY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCB1bnNpZ25lZCBpbnQmLCBpbnQpwAGkAXN0ZDo6X18yOjpfX2NoZWNrX2dyb3VwaW5nKHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+PiBjb25zdCYsIHVuc2lnbmVkIGludCosIHVuc2lnbmVkIGludCosIHVuc2lnbmVkIGludCYpwQGbAnN0ZDo6X18yOjpudW1fZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgbG9uZyBsb25nJikgY29uc3TCAXRsb25nIGxvbmcgc3RkOjpfXzI6Ol9fbnVtX2dldF9zaWduZWRfaW50ZWdyYWxbYWJpOm5uMjAwMTAwXTxsb25nIGxvbmc+KGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KiwgdW5zaWduZWQgaW50JiwgaW50KcMBoAJzdGQ6Ol9fMjo6bnVtX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Pjo6ZG9fZ2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHVuc2lnbmVkIHNob3J0JikgY29uc3TEAYABdW5zaWduZWQgc2hvcnQgc3RkOjpfXzI6Ol9fbnVtX2dldF91bnNpZ25lZF9pbnRlZ3JhbFthYmk6bm4yMDAxMDBdPHVuc2lnbmVkIHNob3J0PihjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIHVuc2lnbmVkIGludCYsIGludCnFAZ4Cc3RkOjpfXzI6Om51bV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pj46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB1bnNpZ25lZCBpbnQmKSBjb25zdMYBfHVuc2lnbmVkIGludCBzdGQ6Ol9fMjo6X19udW1fZ2V0X3Vuc2lnbmVkX2ludGVncmFsW2FiaTpubjIwMDEwMF08dW5zaWduZWQgaW50PihjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIHVuc2lnbmVkIGludCYsIGludCnHAaQCc3RkOjpfXzI6Om51bV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pj46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB1bnNpZ25lZCBsb25nIGxvbmcmKSBjb25zdMgBiAF1bnNpZ25lZCBsb25nIGxvbmcgc3RkOjpfXzI6Ol9fbnVtX2dldF91bnNpZ25lZF9pbnRlZ3JhbFthYmk6bm4yMDAxMDBdPHVuc2lnbmVkIGxvbmcgbG9uZz4oY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCB1bnNpZ25lZCBpbnQmLCBpbnQpyQGXAnN0ZDo6X18yOjpudW1fZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgZmxvYXQmKSBjb25zdMoBWHN0ZDo6X18yOjpfX251bV9nZXQ8Y2hhcj46Ol9fc3RhZ2UyX2Zsb2F0X3ByZXAoc3RkOjpfXzI6Omlvc19iYXNlJiwgY2hhciosIGNoYXImLCBjaGFyJinLAe8Bc3RkOjpfXzI6Ol9fbnVtX2dldDxjaGFyPjo6X19zdGFnZTJfZmxvYXRfbG9vcChjaGFyLCBib29sJiwgY2hhciYsIGNoYXIqLCBjaGFyKiYsIGNoYXIsIGNoYXIsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+PiBjb25zdCYsIHVuc2lnbmVkIGludCosIHVuc2lnbmVkIGludComLCB1bnNpZ25lZCBpbnQmLCBjaGFyKinMAV1mbG9hdCBzdGQ6Ol9fMjo6X19udW1fZ2V0X2Zsb2F0W2FiaTpubjIwMDEwMF08ZmxvYXQ+KGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KiwgdW5zaWduZWQgaW50JinNAZgCc3RkOjpfXzI6Om51bV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pj46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCBkb3VibGUmKSBjb25zdM4BX2RvdWJsZSBzdGQ6Ol9fMjo6X19udW1fZ2V0X2Zsb2F0W2FiaTpubjIwMDEwMF08ZG91YmxlPihjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIHVuc2lnbmVkIGludCYpzwGdAnN0ZDo6X18yOjpudW1fZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgbG9uZyBkb3VibGUmKSBjb25zdNABaWxvbmcgZG91YmxlIHN0ZDo6X18yOjpfX251bV9nZXRfZmxvYXRbYWJpOm5uMjAwMTAwXTxsb25nIGRvdWJsZT4oY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCB1bnNpZ25lZCBpbnQmKdEBlwJzdGQ6Ol9fMjo6bnVtX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Pjo6ZG9fZ2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHZvaWQqJikgY29uc3TSARJzdGQ6Ol9fMjo6X19jbG9jKCnTAWxpbnQgc3RkOjpfXzI6Ol9fbG9jYWxlOjpfX3NzY2FuZlthYmk6bm4yMDAxMDBdPHZvaWQqKj4oY2hhciBjb25zdCosIF9fbG9jYWxlX3N0cnVjdCosIGNoYXIgY29uc3QqLCB2b2lkKiomJinUAWJjaGFyIGNvbnN0KiBzdGQ6Ol9fMjo6ZmluZFthYmk6bm4yMDAxMDBdPGNoYXIgY29uc3QqLCBjaGFyPihjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QmKdUBqwJzdGQ6Ol9fMjo6bnVtX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+Pjo6ZG9fZ2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIGJvb2wmKSBjb25zdNYB5gVzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90Pj4gY29uc3QqIHN0ZDo6X18yOjpfX3NjYW5fa2V5d29yZFthYmk6bm4yMDAxMDBdPHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+PiBjb25zdCosIHN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90Pj4oc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+PiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+PiBjb25zdCosIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+PiBjb25zdCosIHN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90PiBjb25zdCYsIHVuc2lnbmVkIGludCYsIGJvb2wp1wGrAnN0ZDo6X18yOjpudW1fZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgbG9uZyYpIGNvbnN02AFNc3RkOjpfXzI6Ol9fbnVtX2dldDx3Y2hhcl90Pjo6X19kb193aWRlbihzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB3Y2hhcl90KikgY29uc3TZAU5zdGQ6Ol9fMjo6X19udW1fZ2V0PHdjaGFyX3Q+OjpfX3N0YWdlMl9pbnRfcHJlcChzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB3Y2hhcl90JinaAfABc3RkOjpfXzI6Ol9fbnVtX2dldDx3Y2hhcl90Pjo6X19zdGFnZTJfaW50X2xvb3Aod2NoYXJfdCwgaW50LCBjaGFyKiwgY2hhciomLCB1bnNpZ25lZCBpbnQmLCB3Y2hhcl90LCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj4gY29uc3QmLCB1bnNpZ25lZCBpbnQqLCB1bnNpZ25lZCBpbnQqJiwgd2NoYXJfdCBjb25zdCop2wGwAnN0ZDo6X18yOjpudW1fZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgbG9uZyBsb25nJikgY29uc3TcAbUCc3RkOjpfXzI6Om51bV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Pj46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB1bnNpZ25lZCBzaG9ydCYpIGNvbnN03QGzAnN0ZDo6X18yOjpudW1fZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgdW5zaWduZWQgaW50JikgY29uc3TeAbkCc3RkOjpfXzI6Om51bV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Pj46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB1bnNpZ25lZCBsb25nIGxvbmcmKSBjb25zdN8BrAJzdGQ6Ol9fMjo6bnVtX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+Pjo6ZG9fZ2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIGZsb2F0JikgY29uc3TgAWRzdGQ6Ol9fMjo6X19udW1fZ2V0PHdjaGFyX3Q+OjpfX3N0YWdlMl9mbG9hdF9wcmVwKHN0ZDo6X18yOjppb3NfYmFzZSYsIHdjaGFyX3QqLCB3Y2hhcl90Jiwgd2NoYXJfdCYp4QH+AXN0ZDo6X18yOjpfX251bV9nZXQ8d2NoYXJfdD46Ol9fc3RhZ2UyX2Zsb2F0X2xvb3Aod2NoYXJfdCwgYm9vbCYsIGNoYXImLCBjaGFyKiwgY2hhciomLCB3Y2hhcl90LCB3Y2hhcl90LCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj4gY29uc3QmLCB1bnNpZ25lZCBpbnQqLCB1bnNpZ25lZCBpbnQqJiwgdW5zaWduZWQgaW50Jiwgd2NoYXJfdCop4gGtAnN0ZDo6X18yOjpudW1fZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgZG91YmxlJikgY29uc3TjAbICc3RkOjpfXzI6Om51bV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Pj46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCBsb25nIGRvdWJsZSYpIGNvbnN05AGsAnN0ZDo6X18yOjpudW1fZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50Jiwgdm9pZComKSBjb25zdOUBdHdjaGFyX3QgY29uc3QqIHN0ZDo6X18yOjpmaW5kW2FiaTpubjIwMDEwMF08d2NoYXJfdCBjb25zdCosIHdjaGFyX3Q+KHdjaGFyX3QgY29uc3QqLCB3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCYp5gHKAXN0ZDo6X18yOjpudW1fcHV0PGNoYXIsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4+Ojpkb19wdXQoc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgY2hhciwgYm9vbCkgY29uc3TnAWtzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj46OmJlZ2luW2FiaTpubjIwMDEwMF0oKegBaXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6ZW5kW2FiaTpubjIwMDEwMF0oKekBenN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6X19tYWtlX2l0ZXJhdG9yW2FiaTpubjIwMDEwMF0oY2hhciop6gHKAXN0ZDo6X18yOjpudW1fcHV0PGNoYXIsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4+Ojpkb19wdXQoc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgY2hhciwgbG9uZykgY29uc3TrAU5zdGQ6Ol9fMjo6X19udW1fcHV0X2Jhc2U6Ol9fZm9ybWF0X2ludChjaGFyKiwgY2hhciBjb25zdCosIGJvb2wsIHVuc2lnbmVkIGludCnsAXNpbnQgc3RkOjpfXzI6Ol9fbG9jYWxlOjpfX3NucHJpbnRmW2FiaTpubjIwMDEwMF08bG9uZyY+KGNoYXIqLCB1bnNpZ25lZCBsb25nLCBfX2xvY2FsZV9zdHJ1Y3QqLCBjaGFyIGNvbnN0KiwgbG9uZyYp7QFVc3RkOjpfXzI6Ol9fbnVtX3B1dF9iYXNlOjpfX2lkZW50aWZ5X3BhZGRpbmcoY2hhciosIGNoYXIqLCBzdGQ6Ol9fMjo6aW9zX2Jhc2UgY29uc3QmKe4BdXN0ZDo6X18yOjpfX251bV9wdXQ8Y2hhcj46Ol9fd2lkZW5fYW5kX2dyb3VwX2ludChjaGFyKiwgY2hhciosIGNoYXIqLCBjaGFyKiwgY2hhciomLCBjaGFyKiYsIHN0ZDo6X18yOjpsb2NhbGUgY29uc3QmKe8BkAJzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+IHN0ZDo6X18yOjpfX3BhZF9hbmRfb3V0cHV0W2FiaTpubjIwMDEwMF08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+PihzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+LCBjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCBjaGFyKfABzwFzdGQ6Ol9fMjo6bnVtX3B1dDxjaGFyLCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Pjo6ZG9fcHV0KHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIGNoYXIsIGxvbmcgbG9uZykgY29uc3TxAX1pbnQgc3RkOjpfXzI6Ol9fbG9jYWxlOjpfX3NucHJpbnRmW2FiaTpubjIwMDEwMF08bG9uZyBsb25nJj4oY2hhciosIHVuc2lnbmVkIGxvbmcsIF9fbG9jYWxlX3N0cnVjdCosIGNoYXIgY29uc3QqLCBsb25nIGxvbmcmKfIB0wFzdGQ6Ol9fMjo6bnVtX3B1dDxjaGFyLCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Pjo6ZG9fcHV0KHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIGNoYXIsIHVuc2lnbmVkIGxvbmcpIGNvbnN08wHYAXN0ZDo6X18yOjpudW1fcHV0PGNoYXIsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4+Ojpkb19wdXQoc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgY2hhciwgdW5zaWduZWQgbG9uZyBsb25nKSBjb25zdPQBzAFzdGQ6Ol9fMjo6bnVtX3B1dDxjaGFyLCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Pjo6ZG9fcHV0KHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIGNoYXIsIGRvdWJsZSkgY29uc3T1AUpzdGQ6Ol9fMjo6X19udW1fcHV0X2Jhc2U6Ol9fZm9ybWF0X2Zsb2F0KGNoYXIqLCBjaGFyIGNvbnN0KiwgdW5zaWduZWQgaW50KfYBgwFpbnQgc3RkOjpfXzI6Ol9fbG9jYWxlOjpfX3NucHJpbnRmW2FiaTpubjIwMDEwMF08aW50LCBkb3VibGUmPihjaGFyKiwgdW5zaWduZWQgbG9uZywgX19sb2NhbGVfc3RydWN0KiwgY2hhciBjb25zdCosIGludCYmLCBkb3VibGUmKfcBd2ludCBzdGQ6Ol9fMjo6X19sb2NhbGU6Ol9fc25wcmludGZbYWJpOm5uMjAwMTAwXTxkb3VibGUmPihjaGFyKiwgdW5zaWduZWQgbG9uZywgX19sb2NhbGVfc3RydWN0KiwgY2hhciBjb25zdCosIGRvdWJsZSYp+AF1aW50IHN0ZDo6X18yOjpfX2xvY2FsZTo6X19hc3ByaW50ZlthYmk6bm4yMDAxMDBdPGludCwgZG91YmxlJj4oY2hhcioqLCBfX2xvY2FsZV9zdHJ1Y3QqLCBjaGFyIGNvbnN0KiwgaW50JiYsIGRvdWJsZSYp+QFpaW50IHN0ZDo6X18yOjpfX2xvY2FsZTo6X19hc3ByaW50ZlthYmk6bm4yMDAxMDBdPGRvdWJsZSY+KGNoYXIqKiwgX19sb2NhbGVfc3RydWN0KiwgY2hhciBjb25zdCosIGRvdWJsZSYp+gF3c3RkOjpfXzI6Ol9fbnVtX3B1dDxjaGFyPjo6X193aWRlbl9hbmRfZ3JvdXBfZmxvYXQoY2hhciosIGNoYXIqLCBjaGFyKiwgY2hhciosIGNoYXIqJiwgY2hhciomLCBzdGQ6Ol9fMjo6bG9jYWxlIGNvbnN0Jin7AdEBc3RkOjpfXzI6Om51bV9wdXQ8Y2hhciwgc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pj46OmRvX3B1dChzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCBjaGFyLCBsb25nIGRvdWJsZSkgY29uc3T8AY0BaW50IHN0ZDo6X18yOjpfX2xvY2FsZTo6X19zbnByaW50ZlthYmk6bm4yMDAxMDBdPGludCwgbG9uZyBkb3VibGUmPihjaGFyKiwgdW5zaWduZWQgbG9uZywgX19sb2NhbGVfc3RydWN0KiwgY2hhciBjb25zdCosIGludCYmLCBsb25nIGRvdWJsZSYp/QGBAWludCBzdGQ6Ol9fMjo6X19sb2NhbGU6Ol9fc25wcmludGZbYWJpOm5uMjAwMTAwXTxsb25nIGRvdWJsZSY+KGNoYXIqLCB1bnNpZ25lZCBsb25nLCBfX2xvY2FsZV9zdHJ1Y3QqLCBjaGFyIGNvbnN0KiwgbG9uZyBkb3VibGUmKf4Bf2ludCBzdGQ6Ol9fMjo6X19sb2NhbGU6Ol9fYXNwcmludGZbYWJpOm5uMjAwMTAwXTxpbnQsIGxvbmcgZG91YmxlJj4oY2hhcioqLCBfX2xvY2FsZV9zdHJ1Y3QqLCBjaGFyIGNvbnN0KiwgaW50JiYsIGxvbmcgZG91YmxlJin/AXNpbnQgc3RkOjpfXzI6Ol9fbG9jYWxlOjpfX2FzcHJpbnRmW2FiaTpubjIwMDEwMF08bG9uZyBkb3VibGUmPihjaGFyKiosIF9fbG9jYWxlX3N0cnVjdCosIGNoYXIgY29uc3QqLCBsb25nIGRvdWJsZSYpgALRAXN0ZDo6X18yOjpudW1fcHV0PGNoYXIsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4+Ojpkb19wdXQoc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgY2hhciwgdm9pZCBjb25zdCopIGNvbnN0gQJXc3RkOjpfXzI6Ol9fbGliY3BwX3NucHJpbnRmX2woY2hhciosIHVuc2lnbmVkIGxvbmcsIF9fbG9jYWxlX3N0cnVjdCosIGNoYXIgY29uc3QqLCAuLi4pggKFAXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6YmFzaWNfc3RyaW5nW2FiaTpubjIwMDEwMF0odW5zaWduZWQgbG9uZywgY2hhcimDAtwBc3RkOjpfXzI6Om51bV9wdXQ8d2NoYXJfdCwgc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Pj46OmRvX3B1dChzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB3Y2hhcl90LCBib29sKSBjb25zdIQCcnN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+Pjo6ZW5kW2FiaTpubjIwMDEwMF0oKYUC3AFzdGQ6Ol9fMjo6bnVtX3B1dDx3Y2hhcl90LCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+Pjo6ZG9fcHV0KHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHdjaGFyX3QsIGxvbmcpIGNvbnN0hgKBAXN0ZDo6X18yOjpfX251bV9wdXQ8d2NoYXJfdD46Ol9fd2lkZW5fYW5kX2dyb3VwX2ludChjaGFyKiwgY2hhciosIGNoYXIqLCB3Y2hhcl90Kiwgd2NoYXJfdComLCB3Y2hhcl90KiYsIHN0ZDo6X18yOjpsb2NhbGUgY29uc3QmKYcCrgJzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+IHN0ZDo6X18yOjpfX3BhZF9hbmRfb3V0cHV0W2FiaTpubjIwMDEwMF08d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+PihzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCB3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCosIHdjaGFyX3QgY29uc3QqLCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB3Y2hhcl90KYgC4QFzdGQ6Ol9fMjo6bnVtX3B1dDx3Y2hhcl90LCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+Pjo6ZG9fcHV0KHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHdjaGFyX3QsIGxvbmcgbG9uZykgY29uc3SJAuUBc3RkOjpfXzI6Om51bV9wdXQ8d2NoYXJfdCwgc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Pj46OmRvX3B1dChzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB3Y2hhcl90LCB1bnNpZ25lZCBsb25nKSBjb25zdIoC6gFzdGQ6Ol9fMjo6bnVtX3B1dDx3Y2hhcl90LCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+Pjo6ZG9fcHV0KHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHdjaGFyX3QsIHVuc2lnbmVkIGxvbmcgbG9uZykgY29uc3SLAt4Bc3RkOjpfXzI6Om51bV9wdXQ8d2NoYXJfdCwgc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Pj46OmRvX3B1dChzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB3Y2hhcl90LCBkb3VibGUpIGNvbnN0jAKDAXN0ZDo6X18yOjpfX251bV9wdXQ8d2NoYXJfdD46Ol9fd2lkZW5fYW5kX2dyb3VwX2Zsb2F0KGNoYXIqLCBjaGFyKiwgY2hhciosIHdjaGFyX3QqLCB3Y2hhcl90KiYsIHdjaGFyX3QqJiwgc3RkOjpfXzI6OmxvY2FsZSBjb25zdCYpjQLjAXN0ZDo6X18yOjpudW1fcHV0PHdjaGFyX3QsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4+Ojpkb19wdXQoc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgd2NoYXJfdCwgbG9uZyBkb3VibGUpIGNvbnN0jgLjAXN0ZDo6X18yOjpudW1fcHV0PHdjaGFyX3QsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4+Ojpkb19wdXQoc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgd2NoYXJfdCwgdm9pZCBjb25zdCopIGNvbnN0jwKRAXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+Pjo6YmFzaWNfc3RyaW5nW2FiaTpubjIwMDEwMF0odW5zaWduZWQgbG9uZywgd2NoYXJfdCmQAl92b2lkIHN0ZDo6X18yOjpfX3JldmVyc2VbYWJpOm5uMjAwMTAwXTxzdGQ6Ol9fMjo6X0NsYXNzaWNBbGdQb2xpY3ksIGNoYXIqLCBjaGFyKj4oY2hhciosIGNoYXIqKZECa3ZvaWQgc3RkOjpfXzI6Ol9fcmV2ZXJzZVthYmk6bm4yMDAxMDBdPHN0ZDo6X18yOjpfQ2xhc3NpY0FsZ1BvbGljeSwgd2NoYXJfdCosIHdjaGFyX3QqPih3Y2hhcl90Kiwgd2NoYXJfdCopkgKsAnN0ZDo6X18yOjp0aW1lX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Pjo6Z2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHRtKiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqKSBjb25zdJMCcXN0ZDo6X18yOjp0aW1lX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Pjo6ZG9fZGF0ZV9vcmRlcigpIGNvbnN0lAKaAnN0ZDo6X18yOjp0aW1lX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Pjo6ZG9fZ2V0X3RpbWUoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgdG0qKSBjb25zdJUCmgJzdGQ6Ol9fMjo6dGltZV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pj46OmRvX2dldF9kYXRlKHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHRtKikgY29uc3SWAp0Cc3RkOjpfXzI6OnRpbWVfZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4+Ojpkb19nZXRfd2Vla2RheShzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB0bSopIGNvbnN0lwKrAnN0ZDo6X18yOjp0aW1lX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Pjo6X19nZXRfd2Vla2RheW5hbWUoaW50Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+PiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpjdHlwZTxjaGFyPiBjb25zdCYpIGNvbnN0mAKfAnN0ZDo6X18yOjp0aW1lX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Pjo6ZG9fZ2V0X21vbnRobmFtZShzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB0bSopIGNvbnN0mQKpAnN0ZDo6X18yOjp0aW1lX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Pjo6X19nZXRfbW9udGhuYW1lKGludCYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+LCB1bnNpZ25lZCBpbnQmLCBzdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj4gY29uc3QmKSBjb25zdJoCmgJzdGQ6Ol9fMjo6dGltZV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pj46OmRvX2dldF95ZWFyKHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHRtKikgY29uc3SbAqQCc3RkOjpfXzI6OnRpbWVfZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4+OjpfX2dldF95ZWFyKGludCYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+LCB1bnNpZ25lZCBpbnQmLCBzdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj4gY29uc3QmKSBjb25zdJwCrwJpbnQgc3RkOjpfXzI6Ol9fZ2V0X3VwX3RvX25fZGlnaXRzW2FiaTpubjIwMDEwMF08Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pj4oc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+PiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpjdHlwZTxjaGFyPiBjb25zdCYsIGludCmdAqECc3RkOjpfXzI6OnRpbWVfZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgdG0qLCBjaGFyLCBjaGFyKSBjb25zdJ4CxwJzdGQ6Ol9fMjo6dGltZV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Pj46OmdldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB0bSosIHdjaGFyX3QgY29uc3QqLCB3Y2hhcl90IGNvbnN0KikgY29uc3SfAq8Cc3RkOjpfXzI6OnRpbWVfZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4+Ojpkb19nZXRfdGltZShzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB0bSopIGNvbnN0oAKvAnN0ZDo6X18yOjp0aW1lX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+Pjo6ZG9fZ2V0X2RhdGUoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgdG0qKSBjb25zdKECsgJzdGQ6Ol9fMjo6dGltZV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Pj46OmRvX2dldF93ZWVrZGF5KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHRtKikgY29uc3SiAsMCc3RkOjpfXzI6OnRpbWVfZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4+OjpfX2dldF93ZWVrZGF5bmFtZShpbnQmLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+PiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+IGNvbnN0JikgY29uc3SjArQCc3RkOjpfXzI6OnRpbWVfZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4+Ojpkb19nZXRfbW9udGhuYW1lKHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHRtKikgY29uc3SkAsECc3RkOjpfXzI6OnRpbWVfZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4+OjpfX2dldF9tb250aG5hbWUoaW50Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+PiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90PiBjb25zdCYpIGNvbnN0pQKvAnN0ZDo6X18yOjp0aW1lX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+Pjo6ZG9fZ2V0X3llYXIoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgdG0qKSBjb25zdKYCvAJzdGQ6Ol9fMjo6dGltZV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Pj46Ol9fZ2V0X3llYXIoaW50Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+PiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90PiBjb25zdCYpIGNvbnN0pwLHAmludCBzdGQ6Ol9fMjo6X19nZXRfdXBfdG9fbl9kaWdpdHNbYWJpOm5uMjAwMTAwXTx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+PihzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+PiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+IGNvbnN0JiwgaW50KagCtgJzdGQ6Ol9fMjo6dGltZV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Pj46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB0bSosIGNoYXIsIGNoYXIpIGNvbnN0qQLcAXN0ZDo6X18yOjp0aW1lX3B1dDxjaGFyLCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Pjo6ZG9fcHV0KHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIGNoYXIsIHRtIGNvbnN0KiwgY2hhciwgY2hhcikgY29uc3SqAkpzdGQ6Ol9fMjo6X190aW1lX3B1dDo6X19kb19wdXQoY2hhciosIGNoYXIqJiwgdG0gY29uc3QqLCBjaGFyLCBjaGFyKSBjb25zdKsC7gFzdGQ6Ol9fMjo6dGltZV9wdXQ8d2NoYXJfdCwgc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Pj46OmRvX3B1dChzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB3Y2hhcl90LCB0bSBjb25zdCosIGNoYXIsIGNoYXIpIGNvbnN0rAI7c3RkOjpfXzI6Om1vbmV5cHVuY3Q8Y2hhciwgZmFsc2U+Ojpkb19kZWNpbWFsX3BvaW50KCkgY29uc3StAjZzdGQ6Ol9fMjo6bW9uZXlwdW5jdDxjaGFyLCBmYWxzZT46OmRvX2dyb3VwaW5nKCkgY29uc3SuAjtzdGQ6Ol9fMjo6bW9uZXlwdW5jdDxjaGFyLCBmYWxzZT46OmRvX25lZ2F0aXZlX3NpZ24oKSBjb25zdK8COHN0ZDo6X18yOjptb25leXB1bmN0PGNoYXIsIGZhbHNlPjo6ZG9fcG9zX2Zvcm1hdCgpIGNvbnN0sAI+c3RkOjpfXzI6Om1vbmV5cHVuY3Q8d2NoYXJfdCwgZmFsc2U+Ojpkb19kZWNpbWFsX3BvaW50KCkgY29uc3SxAj5zdGQ6Ol9fMjo6bW9uZXlwdW5jdDx3Y2hhcl90LCBmYWxzZT46OmRvX25lZ2F0aXZlX3NpZ24oKSBjb25zdLICvwFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj46OmJhc2ljX3N0cmluZyhzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj4gY29uc3QmKbMCpQJzdGQ6Ol9fMjo6bW9uZXlfZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+PiwgYm9vbCwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgbG9uZyBkb3VibGUmKSBjb25zdLQCiANzdGQ6Ol9fMjo6bW9uZXlfZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4+OjpfX2RvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+PiwgYm9vbCwgc3RkOjpfXzI6OmxvY2FsZSBjb25zdCYsIHVuc2lnbmVkIGludCwgdW5zaWduZWQgaW50JiwgYm9vbCYsIHN0ZDo6X18yOjpjdHlwZTxjaGFyPiBjb25zdCYsIHN0ZDo6X18yOjp1bmlxdWVfcHRyPGNoYXIsIHZvaWQgKCopKHZvaWQqKT4mLCBjaGFyKiYsIGNoYXIqKbUCX3N0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj46Om9wZXJhdG9yKytbYWJpOm5uMjAwMTAwXShpbnQptgJ0dm9pZCBzdGQ6Ol9fMjo6X19kb3VibGVfb3Jfbm90aGluZ1thYmk6bm4yMDAxMDBdPGNoYXI+KHN0ZDo6X18yOjp1bmlxdWVfcHRyPGNoYXIsIHZvaWQgKCopKHZvaWQqKT4mLCBjaGFyKiYsIGNoYXIqJim3ApQBdm9pZCBzdGQ6Ol9fMjo6X19kb3VibGVfb3Jfbm90aGluZ1thYmk6bm4yMDAxMDBdPHVuc2lnbmVkIGludD4oc3RkOjpfXzI6OnVuaXF1ZV9wdHI8dW5zaWduZWQgaW50LCB2b2lkICgqKSh2b2lkKik+JiwgdW5zaWduZWQgaW50KiYsIHVuc2lnbmVkIGludComKbgC7gJzdGQ6Ol9fMjo6bW9uZXlfZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+PiwgYm9vbCwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+JikgY29uc3S5AtcBc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+OjpfX2dyb3dfYnlfd2l0aG91dF9yZXBsYWNlW2FiaTpubjIwMDEwMF0odW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZym6AkFzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8Y2hhcio+OjpvcGVyYXRvcitbYWJpOm5uMjAwMTAwXShsb25nKSBjb25zdLsCc3N0ZDo6X18yOjp1bmlxdWVfcHRyPGNoYXIsIHZvaWQgKCopKHZvaWQqKT46Om9wZXJhdG9yPVthYmk6bm4yMDAxMDBdKHN0ZDo6X18yOjp1bmlxdWVfcHRyPGNoYXIsIHZvaWQgKCopKHZvaWQqKT4mJim8AroCc3RkOjpfXzI6Om1vbmV5X2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+Pjo6ZG9fZ2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIGJvb2wsIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIGxvbmcgZG91YmxlJikgY29uc3S9AqkDc3RkOjpfXzI6Om1vbmV5X2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+Pjo6X19kb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+PiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIGJvb2wsIHN0ZDo6X18yOjpsb2NhbGUgY29uc3QmLCB1bnNpZ25lZCBpbnQsIHVuc2lnbmVkIGludCYsIGJvb2wmLCBzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD4gY29uc3QmLCBzdGQ6Ol9fMjo6dW5pcXVlX3B0cjx3Y2hhcl90LCB2b2lkICgqKSh2b2lkKik+Jiwgd2NoYXJfdComLCB3Y2hhcl90Kim+AmVzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+OjpvcGVyYXRvcisrW2FiaTpubjIwMDEwMF0oaW50Kb8CjANzdGQ6Ol9fMjo6bW9uZXlfZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Piwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+PiwgYm9vbCwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4+JikgY29uc3TAAuABc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4+OjpfX2dyb3dfYnlfd2l0aG91dF9yZXBsYWNlW2FiaTpubjIwMDEwMF0odW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZynBAsQBd2NoYXJfdCogc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4+OjpfX2NvcHlfbm9uX292ZXJsYXBwaW5nX3JhbmdlW2FiaTpubjIwMDEwMF08d2NoYXJfdCosIHdjaGFyX3QqPih3Y2hhcl90Kiwgd2NoYXJfdCosIHdjaGFyX3QqKcIC1wFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90Pj46Om9wZXJhdG9yPVthYmk6bm4yMDAxMDBdKHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+PiYmKcMCRHN0ZDo6X18yOjpfX3dyYXBfaXRlcjx3Y2hhcl90Kj46Om9wZXJhdG9yK1thYmk6bm4yMDAxMDBdKGxvbmcpIGNvbnN0xALZAXN0ZDo6X18yOjptb25leV9wdXQ8Y2hhciwgc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pj46OmRvX3B1dChzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+LCBib29sLCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCBjaGFyLCBsb25nIGRvdWJsZSkgY29uc3TFAogDc3RkOjpfXzI6Ol9fbW9uZXlfcHV0PGNoYXI+OjpfX2dhdGhlcl9pbmZvKGJvb2wsIGJvb2wsIHN0ZDo6X18yOjpsb2NhbGUgY29uc3QmLCBzdGQ6Ol9fMjo6bW9uZXlfYmFzZTo6cGF0dGVybiYsIGNoYXImLCBjaGFyJiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+Jiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+Jiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+JiwgaW50JinGAtYDc3RkOjpfXzI6Ol9fbW9uZXlfcHV0PGNoYXI+OjpfX2Zvcm1hdChjaGFyKiwgY2hhciomLCBjaGFyKiYsIHVuc2lnbmVkIGludCwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCBzdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj4gY29uc3QmLCBib29sLCBzdGQ6Ol9fMjo6bW9uZXlfYmFzZTo6cGF0dGVybiBjb25zdCYsIGNoYXIsIGNoYXIsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+PiBjb25zdCYsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+PiBjb25zdCYsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+PiBjb25zdCYsIGludCnHAklzdGQ6Ol9fMjo6X19saWJjcHBfYXNwcmludGZfbChjaGFyKiosIF9fbG9jYWxlX3N0cnVjdCosIGNoYXIgY29uc3QqLCAuLi4pyAKcAWNoYXIqIHN0ZDo6X18yOjpjb3B5W2FiaTpubjIwMDEwMF08c3RkOjpfXzI6Ol9fd3JhcF9pdGVyPGNoYXIgY29uc3QqPiwgY2hhcio+KHN0ZDo6X18yOjpfX3dyYXBfaXRlcjxjaGFyIGNvbnN0Kj4sIHN0ZDo6X18yOjpfX3dyYXBfaXRlcjxjaGFyIGNvbnN0Kj4sIGNoYXIqKckCqQJzdGQ6Ol9fMjo6bW9uZXlfcHV0PGNoYXIsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPj4+Ojpkb19wdXQoc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+PiwgYm9vbCwgc3RkOjpfXzI6Omlvc19iYXNlJiwgY2hhciwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+IGNvbnN0JikgY29uc3TKAusBc3RkOjpfXzI6Om1vbmV5X3B1dDx3Y2hhcl90LCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+Pjo6ZG9fcHV0KHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIGJvb2wsIHN0ZDo6X18yOjppb3NfYmFzZSYsIHdjaGFyX3QsIGxvbmcgZG91YmxlKSBjb25zdMsCowNzdGQ6Ol9fMjo6X19tb25leV9wdXQ8d2NoYXJfdD46Ol9fZ2F0aGVyX2luZm8oYm9vbCwgYm9vbCwgc3RkOjpfXzI6OmxvY2FsZSBjb25zdCYsIHN0ZDo6X18yOjptb25leV9iYXNlOjpwYXR0ZXJuJiwgd2NoYXJfdCYsIHdjaGFyX3QmLCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj4mLCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90Pj4mLCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90Pj4mLCBpbnQmKcwCgwRzdGQ6Ol9fMjo6X19tb25leV9wdXQ8d2NoYXJfdD46Ol9fZm9ybWF0KHdjaGFyX3QqLCB3Y2hhcl90KiYsIHdjaGFyX3QqJiwgdW5zaWduZWQgaW50LCB3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCosIHN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90PiBjb25zdCYsIGJvb2wsIHN0ZDo6X18yOjptb25leV9iYXNlOjpwYXR0ZXJuIGNvbnN0Jiwgd2NoYXJfdCwgd2NoYXJfdCwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+IGNvbnN0Jiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4+IGNvbnN0Jiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4+IGNvbnN0JiwgaW50Kc0CrgF3Y2hhcl90KiBzdGQ6Ol9fMjo6Y29weVthYmk6bm4yMDAxMDBdPHN0ZDo6X18yOjpfX3dyYXBfaXRlcjx3Y2hhcl90IGNvbnN0Kj4sIHdjaGFyX3QqPihzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8d2NoYXJfdCBjb25zdCo+LCBzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8d2NoYXJfdCBjb25zdCo+LCB3Y2hhcl90KinOAsQCc3RkOjpfXzI6Om1vbmV5X3B1dDx3Y2hhcl90LCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4+Pjo6ZG9fcHV0KHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pj4sIGJvb2wsIHN0ZDo6X18yOjppb3NfYmFzZSYsIHdjaGFyX3QsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+PiBjb25zdCYpIGNvbnN0zwKdAXN0ZDo6X18yOjptZXNzYWdlczxjaGFyPjo6ZG9fb3BlbihzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj4gY29uc3QmLCBzdGQ6Ol9fMjo6bG9jYWxlIGNvbnN0JikgY29uc3TQApMBc3RkOjpfXzI6Om1lc3NhZ2VzPGNoYXI+Ojpkb19nZXQobG9uZywgaW50LCBpbnQsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+PiBjb25zdCYpIGNvbnN00QKfAXN0ZDo6X18yOjptZXNzYWdlczx3Y2hhcl90Pjo6ZG9fZ2V0KGxvbmcsIGludCwgaW50LCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90Pj4gY29uc3QmKSBjb25zdNICOXN0ZDo6X18yOjpjb2RlY3Z0PHdjaGFyX3QsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6fmNvZGVjdnQoKdMCfHN0ZDo6X18yOjp2ZWN0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCBzdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMzB1bD4+OjpjbGVhclthYmk6bm4yMDAxMDBdKCnUAogBc3RkOjpfXzI6OnZlY3RvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAzMHVsPj46Ol9fY29uc3RydWN0X2F0X2VuZCh1bnNpZ25lZCBsb25nKdUCpgFzdGQ6Ol9fMjo6dmVjdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0Kiwgc3RkOjpfXzI6Ol9fc3NvX2FsbG9jYXRvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIDMwdWw+Pjo6X19iYXNlX2Rlc3RydWN0X2F0X2VuZFthYmk6bm4yMDAxMDBdKHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0Kiop1gIdc3RkOjpfXzI6OmxvY2FsZTo6aWQ6Ol9fZ2V0KCnXAkBzdGQ6Ol9fMjo6bG9jYWxlOjpfX2ltcDo6aW5zdGFsbChzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIGxvbmcp2AIhc3RkOjpfXzI6OmxvY2FsZTo6X19pbXA6On5fX2ltcCgp2QImc3RkOjpfXzI6OmxvY2FsZTo6X19pbXA6On5fX2ltcCgpXzEwNDLaAhpzdGQ6Ol9fMjo6bG9jYWxlOjpsb2NhbGUoKdsCK3N0ZDo6X18yOjpsb2NhbGU6OmZhY2V0OjpfX29uX3plcm9fc2hhcmVkKCncAmx2b2lkIHN0ZDo6X18yOjpfX2NhbGxfb25jZV9wcm94eVthYmk6bm4yMDAxMDBdPHN0ZDo6X18yOjp0dXBsZTxzdGQ6Ol9fMjo6bG9jYWxlOjppZDo6X19nZXQoKTo6JF8wJiY+Pih2b2lkKindAj1zdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD46OmRvX2lzKHVuc2lnbmVkIGxvbmcsIHdjaGFyX3QpIGNvbnN03gJVc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+Ojpkb19pcyh3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCosIHVuc2lnbmVkIGxvbmcqKSBjb25zdN8CWXN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90Pjo6ZG9fc2Nhbl9pcyh1bnNpZ25lZCBsb25nLCB3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCopIGNvbnN04AJac3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+Ojpkb19zY2FuX25vdCh1bnNpZ25lZCBsb25nLCB3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCopIGNvbnN04QIzc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+Ojpkb190b3VwcGVyKHdjaGFyX3QpIGNvbnN04gJEc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+Ojpkb190b3VwcGVyKHdjaGFyX3QqLCB3Y2hhcl90IGNvbnN0KikgY29uc3TjAjNzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD46OmRvX3RvbG93ZXIod2NoYXJfdCkgY29uc3TkAkRzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD46OmRvX3RvbG93ZXIod2NoYXJfdCosIHdjaGFyX3QgY29uc3QqKSBjb25zdOUCLnN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90Pjo6ZG9fd2lkZW4oY2hhcikgY29uc3TmAkxzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD46OmRvX3dpZGVuKGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0Kiwgd2NoYXJfdCopIGNvbnN05wI4c3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+Ojpkb19uYXJyb3cod2NoYXJfdCwgY2hhcikgY29uc3ToAlZzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD46OmRvX25hcnJvdyh3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCosIGNoYXIsIGNoYXIqKSBjb25zdOkCH3N0ZDo6X18yOjpjdHlwZTxjaGFyPjo6fmN0eXBlKCnqAiRzdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj46On5jdHlwZSgpXzEwODLrAi1zdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj46OmRvX3RvdXBwZXIoY2hhcikgY29uc3TsAjtzdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj46OmRvX3RvdXBwZXIoY2hhciosIGNoYXIgY29uc3QqKSBjb25zdO0CLXN0ZDo6X18yOjpjdHlwZTxjaGFyPjo6ZG9fdG9sb3dlcihjaGFyKSBjb25zdO4CO3N0ZDo6X18yOjpjdHlwZTxjaGFyPjo6ZG9fdG9sb3dlcihjaGFyKiwgY2hhciBjb25zdCopIGNvbnN07wJGc3RkOjpfXzI6OmN0eXBlPGNoYXI+Ojpkb193aWRlbihjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIGNoYXIqKSBjb25zdPACMnN0ZDo6X18yOjpjdHlwZTxjaGFyPjo6ZG9fbmFycm93KGNoYXIsIGNoYXIpIGNvbnN08QJNc3RkOjpfXzI6OmN0eXBlPGNoYXI+Ojpkb19uYXJyb3coY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCBjaGFyLCBjaGFyKikgY29uc3TyAoQBc3RkOjpfXzI6OmNvZGVjdnQ8Y2hhciwgY2hhciwgX19tYnN0YXRlX3Q+Ojpkb19vdXQoX19tYnN0YXRlX3QmLCBjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqJiwgY2hhciosIGNoYXIqLCBjaGFyKiYpIGNvbnN08wJgc3RkOjpfXzI6OmNvZGVjdnQ8Y2hhciwgY2hhciwgX19tYnN0YXRlX3Q+Ojpkb191bnNoaWZ0KF9fbWJzdGF0ZV90JiwgY2hhciosIGNoYXIqLCBjaGFyKiYpIGNvbnN09AJyc3RkOjpfXzI6OmNvZGVjdnQ8Y2hhciwgY2hhciwgX19tYnN0YXRlX3Q+Ojpkb19sZW5ndGgoX19tYnN0YXRlX3QmLCBjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIHVuc2lnbmVkIGxvbmcpIGNvbnN09QI+c3RkOjpfXzI6OmNvZGVjdnQ8d2NoYXJfdCwgY2hhciwgX19tYnN0YXRlX3Q+Ojp+Y29kZWN2dCgpXzExMDD2ApABc3RkOjpfXzI6OmNvZGVjdnQ8d2NoYXJfdCwgY2hhciwgX19tYnN0YXRlX3Q+Ojpkb19vdXQoX19tYnN0YXRlX3QmLCB3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCosIHdjaGFyX3QgY29uc3QqJiwgY2hhciosIGNoYXIqLCBjaGFyKiYpIGNvbnN09wJac3RkOjpfXzI6Ol9fbGliY3BwX3djcnRvbWJfbFthYmk6bm4yMDAxMDBdKGNoYXIqLCB3Y2hhcl90LCBfX21ic3RhdGVfdCosIF9fbG9jYWxlX3N0cnVjdCop+AKPAXN0ZDo6X18yOjpjb2RlY3Z0PHdjaGFyX3QsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6ZG9faW4oX19tYnN0YXRlX3QmLCBjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqJiwgd2NoYXJfdCosIHdjaGFyX3QqLCB3Y2hhcl90KiYpIGNvbnN0+QJwc3RkOjpfXzI6Ol9fbGliY3BwX21icnRvd2NfbFthYmk6bm4yMDAxMDBdKHdjaGFyX3QqLCBjaGFyIGNvbnN0KiwgdW5zaWduZWQgbG9uZywgX19tYnN0YXRlX3QqLCBfX2xvY2FsZV9zdHJ1Y3QqKfoCY3N0ZDo6X18yOjpjb2RlY3Z0PHdjaGFyX3QsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6ZG9fdW5zaGlmdChfX21ic3RhdGVfdCYsIGNoYXIqLCBjaGFyKiwgY2hhciomKSBjb25zdPsCQnN0ZDo6X18yOjpjb2RlY3Z0PHdjaGFyX3QsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6ZG9fZW5jb2RpbmcoKSBjb25zdPwCP3N0ZDo6X18yOjpfX2xpYmNwcF9tYl9jdXJfbWF4X2xbYWJpOm5uMjAwMTAwXShfX2xvY2FsZV9zdHJ1Y3QqKf0CdXN0ZDo6X18yOjpjb2RlY3Z0PHdjaGFyX3QsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6ZG9fbGVuZ3RoKF9fbWJzdGF0ZV90JiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCB1bnNpZ25lZCBsb25nKSBjb25zdP4CRHN0ZDo6X18yOjpjb2RlY3Z0PHdjaGFyX3QsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6ZG9fbWF4X2xlbmd0aCgpIGNvbnN0/wKUAXN0ZDo6X18yOjpjb2RlY3Z0PGNoYXIxNl90LCBjaGFyLCBfX21ic3RhdGVfdD46OmRvX291dChfX21ic3RhdGVfdCYsIGNoYXIxNl90IGNvbnN0KiwgY2hhcjE2X3QgY29uc3QqLCBjaGFyMTZfdCBjb25zdComLCBjaGFyKiwgY2hhciosIGNoYXIqJikgY29uc3SAA5MBc3RkOjpfXzI6OmNvZGVjdnQ8Y2hhcjE2X3QsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6ZG9faW4oX19tYnN0YXRlX3QmLCBjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqJiwgY2hhcjE2X3QqLCBjaGFyMTZfdCosIGNoYXIxNl90KiYpIGNvbnN0gQN2c3RkOjpfXzI6OmNvZGVjdnQ8Y2hhcjE2X3QsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6ZG9fbGVuZ3RoKF9fbWJzdGF0ZV90JiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCB1bnNpZ25lZCBsb25nKSBjb25zdIIDRXN0ZDo6X18yOjpjb2RlY3Z0PGNoYXIxNl90LCBjaGFyLCBfX21ic3RhdGVfdD46OmRvX21heF9sZW5ndGgoKSBjb25zdIMDlAFzdGQ6Ol9fMjo6Y29kZWN2dDxjaGFyMzJfdCwgY2hhciwgX19tYnN0YXRlX3Q+Ojpkb19vdXQoX19tYnN0YXRlX3QmLCBjaGFyMzJfdCBjb25zdCosIGNoYXIzMl90IGNvbnN0KiwgY2hhcjMyX3QgY29uc3QqJiwgY2hhciosIGNoYXIqLCBjaGFyKiYpIGNvbnN0hAOTAXN0ZDo6X18yOjpjb2RlY3Z0PGNoYXIzMl90LCBjaGFyLCBfX21ic3RhdGVfdD46OmRvX2luKF9fbWJzdGF0ZV90JiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KiYsIGNoYXIzMl90KiwgY2hhcjMyX3QqLCBjaGFyMzJfdComKSBjb25zdIUDdnN0ZDo6X18yOjpjb2RlY3Z0PGNoYXIzMl90LCBjaGFyLCBfX21ic3RhdGVfdD46OmRvX2xlbmd0aChfX21ic3RhdGVfdCYsIGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KiwgdW5zaWduZWQgbG9uZykgY29uc3SGAyVzdGQ6Ol9fMjo6bnVtcHVuY3Q8Y2hhcj46On5udW1wdW5jdCgphwMqc3RkOjpfXzI6Om51bXB1bmN0PGNoYXI+Ojp+bnVtcHVuY3QoKV8xMTYxiAMoc3RkOjpfXzI6Om51bXB1bmN0PHdjaGFyX3Q+Ojp+bnVtcHVuY3QoKYkDLXN0ZDo6X18yOjpudW1wdW5jdDx3Y2hhcl90Pjo6fm51bXB1bmN0KClfMTE2M4oDMnN0ZDo6X18yOjpudW1wdW5jdDxjaGFyPjo6ZG9fZGVjaW1hbF9wb2ludCgpIGNvbnN0iwMyc3RkOjpfXzI6Om51bXB1bmN0PGNoYXI+Ojpkb190aG91c2FuZHNfc2VwKCkgY29uc3SMAy1zdGQ6Ol9fMjo6bnVtcHVuY3Q8Y2hhcj46OmRvX2dyb3VwaW5nKCkgY29uc3SNAzBzdGQ6Ol9fMjo6bnVtcHVuY3Q8d2NoYXJfdD46OmRvX2dyb3VwaW5nKCkgY29uc3SOAy1zdGQ6Ol9fMjo6bnVtcHVuY3Q8Y2hhcj46OmRvX3RydWVuYW1lKCkgY29uc3SPAzBzdGQ6Ol9fMjo6bnVtcHVuY3Q8d2NoYXJfdD46OmRvX3RydWVuYW1lKCkgY29uc3SQA4wBc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4+OjpiYXNpY19zdHJpbmdbYWJpOm5uMjAwMTAwXTwwPih3Y2hhcl90IGNvbnN0KimRAy5zdGQ6Ol9fMjo6bnVtcHVuY3Q8Y2hhcj46OmRvX2ZhbHNlbmFtZSgpIGNvbnN0kgMxc3RkOjpfXzI6Om51bXB1bmN0PHdjaGFyX3Q+Ojpkb19mYWxzZW5hbWUoKSBjb25zdJMDenN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6b3BlcmF0b3I9W2FiaTpubjIwMDEwMF0oY2hhciBjb25zdCoplAM1c3RkOjpfXzI6Ol9fdGltZV9nZXRfY19zdG9yYWdlPGNoYXI+OjpfX3dlZWtzKCkgY29uc3SVAxpfX2N4eF9nbG9iYWxfYXJyYXlfZHRvci41OZYDOHN0ZDo6X18yOjpfX3RpbWVfZ2V0X2Nfc3RvcmFnZTx3Y2hhcl90Pjo6X193ZWVrcygpIGNvbnN0lwMaX19jeHhfZ2xvYmFsX2FycmF5X2R0b3IuNzSYAzZzdGQ6Ol9fMjo6X190aW1lX2dldF9jX3N0b3JhZ2U8Y2hhcj46Ol9fbW9udGhzKCkgY29uc3SZAxpfX2N4eF9nbG9iYWxfYXJyYXlfZHRvci44OZoDOXN0ZDo6X18yOjpfX3RpbWVfZ2V0X2Nfc3RvcmFnZTx3Y2hhcl90Pjo6X19tb250aHMoKSBjb25zdJsDG19fY3h4X2dsb2JhbF9hcnJheV9kdG9yLjExM5wDNXN0ZDo6X18yOjpfX3RpbWVfZ2V0X2Nfc3RvcmFnZTxjaGFyPjo6X19hbV9wbSgpIGNvbnN0nQMbX19jeHhfZ2xvYmFsX2FycmF5X2R0b3IuMTM3ngM4c3RkOjpfXzI6Ol9fdGltZV9nZXRfY19zdG9yYWdlPHdjaGFyX3Q+OjpfX2FtX3BtKCkgY29uc3SfAxtfX2N4eF9nbG9iYWxfYXJyYXlfZHRvci4xNDCgAzFzdGQ6Ol9fMjo6X190aW1lX2dldF9jX3N0b3JhZ2U8Y2hhcj46Ol9feCgpIGNvbnN0oQMcX19jeHhfZ2xvYmFsX2FycmF5X2R0b3JfMTE5OaIDNHN0ZDo6X18yOjpfX3RpbWVfZ2V0X2Nfc3RvcmFnZTx3Y2hhcl90Pjo6X194KCkgY29uc3SjAxpfX2N4eF9nbG9iYWxfYXJyYXlfZHRvci4zMaQDMXN0ZDo6X18yOjpfX3RpbWVfZ2V0X2Nfc3RvcmFnZTxjaGFyPjo6X19YKCkgY29uc3SlAxpfX2N4eF9nbG9iYWxfYXJyYXlfZHRvci4zMqYDNHN0ZDo6X18yOjpfX3RpbWVfZ2V0X2Nfc3RvcmFnZTx3Y2hhcl90Pjo6X19YKCkgY29uc3SnAxpfX2N4eF9nbG9iYWxfYXJyYXlfZHRvci4zNKgDMXN0ZDo6X18yOjpfX3RpbWVfZ2V0X2Nfc3RvcmFnZTxjaGFyPjo6X19jKCkgY29uc3SpAxpfX2N4eF9nbG9iYWxfYXJyYXlfZHRvci4zNqoDNHN0ZDo6X18yOjpfX3RpbWVfZ2V0X2Nfc3RvcmFnZTx3Y2hhcl90Pjo6X19jKCkgY29uc3SrAxpfX2N4eF9nbG9iYWxfYXJyYXlfZHRvci4zOKwDMXN0ZDo6X18yOjpfX3RpbWVfZ2V0X2Nfc3RvcmFnZTxjaGFyPjo6X19yKCkgY29uc3StAxpfX2N4eF9nbG9iYWxfYXJyYXlfZHRvci40MK4DNHN0ZDo6X18yOjpfX3RpbWVfZ2V0X2Nfc3RvcmFnZTx3Y2hhcl90Pjo6X19yKCkgY29uc3SvAxpfX2N4eF9nbG9iYWxfYXJyYXlfZHRvci40MrADZ3N0ZDo6X18yOjp0aW1lX3B1dDxjaGFyLCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4+Pjo6fnRpbWVfcHV0KCmxA2xzdGQ6Ol9fMjo6dGltZV9wdXQ8Y2hhciwgc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+Pj46On50aW1lX3B1dCgpXzEyMjiyA0xzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+OjphbGxvY2F0ZV9hdF9sZWFzdFthYmk6bm4yMDAxMDBdKHVuc2lnbmVkIGxvbmcpswNDc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90Pjo6YWxsb2NhdGVbYWJpOm5uMjAwMTAwXSh1bnNpZ25lZCBsb25nKbQDjQFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj46Ol9fbnVsbF90ZXJtaW5hdGVfYXRbYWJpOm5uMjAwMTAwXShjaGFyKiwgdW5zaWduZWQgbG9uZym1A0dhdXRvIHN0ZDo6X18yOjpfX3Vud3JhcF9yYW5nZVthYmk6bm4yMDAxMDBdPGNoYXIqLCBjaGFyKj4oY2hhciosIGNoYXIqKbYDaGJvb2wgc3RkOjpfXzI6Ol9faXNfcG9pbnRlcl9pbl9yYW5nZVthYmk6bm4yMDAxMDBdPGNoYXIsIGNoYXIsIDA+KGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KiwgY2hhciBjb25zdCoptwN2c3RkOjpfXzI6Ol9fdW53cmFwX2l0ZXJfaW1wbDxzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8Y2hhcio+LCB0cnVlPjo6X191bndyYXBbYWJpOm5uMjAwMTAwXShzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8Y2hhcio+KbgDfHN0ZDo6X18yOjpfX3RvX2FkZHJlc3NfaGVscGVyPHN0ZDo6X18yOjpfX3dyYXBfaXRlcjxjaGFyKj4sIHZvaWQ+OjpfX2NhbGxbYWJpOm5uMjAwMTAwXShzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8Y2hhcio+IGNvbnN0Jim5A8UBc3RkOjpfXzI6Ol9fdW53cmFwX3JhbmdlX2ltcGw8c3RkOjpfXzI6Ol9fd3JhcF9pdGVyPGNoYXIgY29uc3QqPiwgc3RkOjpfXzI6Ol9fd3JhcF9pdGVyPGNoYXIgY29uc3QqPj46Ol9fdW53cmFwW2FiaTpubjIwMDEwMF0oc3RkOjpfXzI6Ol9fd3JhcF9pdGVyPGNoYXIgY29uc3QqPiwgc3RkOjpfXzI6Ol9fd3JhcF9pdGVyPGNoYXIgY29uc3QqPim6A4UBc3RkOjpfXzI6OnZlY3RvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAzMHVsPj46Om1heF9zaXplW2FiaTpubjIwMDEwMF0oKSBjb25zdLsDiwFzdGQ6Ol9fMjo6dmVjdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0Kiwgc3RkOjpfXzI6Ol9fc3NvX2FsbG9jYXRvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIDMwdWw+Pjo6X190aHJvd19sZW5ndGhfZXJyb3JbYWJpOm5uMjAwMTAwXSgpvAPCAnN0ZDo6X18yOjphbGxvY2F0aW9uX3Jlc3VsdDxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCoqLCB1bnNpZ25lZCBsb25nPiBzdGQ6Ol9fMjo6YWxsb2NhdG9yX3RyYWl0czxzdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMzB1bD4+OjphbGxvY2F0ZV9hdF9sZWFzdFthYmk6bm4yMDAxMDBdPHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAzMHVsPj4oc3RkOjpfXzI6Ol9fc3NvX2FsbG9jYXRvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIDMwdWw+JiwgdW5zaWduZWQgbG9uZym9A31zdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMzB1bD46OmRlYWxsb2NhdGVbYWJpOm5uMjAwMTAwXShzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCoqLCB1bnNpZ25lZCBsb25nKb4DSXN0ZDo6X18yOjpfX2xvY2FsZV9ndWFyZDo6X19sb2NhbGVfZ3VhcmRbYWJpOm5uMjAwMTAwXShfX2xvY2FsZV9zdHJ1Y3QqJim/AzpzdGQ6Ol9fMjo6X19jb25zdGV4cHJfd2NzbGVuW2FiaTpubjIwMDEwMF0od2NoYXJfdCBjb25zdCopwAMwc3RkOjpfXzI6Ol9fc2hhcmVkX2NvdW50Ojp+X19zaGFyZWRfY291bnQoKV8xNDkxwQMbb3BlcmF0b3IgbmV3KHVuc2lnbmVkIGxvbmcpwgMYX190aHJvd19iYWRfYWxsb2Nfc2hpbSgpwwMYc3RkOjpfX3Rocm93X2JhZF9hbGxvYygpxAMsc3RkOjpfXzI6Ol9fdGhyb3dfcnVudGltZV9lcnJvcihjaGFyIGNvbnN0KinFAwhzdHJlcnJvcsYD0gFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj46Ol9fZ3Jvd19ieV9hbmRfcmVwbGFjZSh1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCBjaGFyIGNvbnN0KinHA2VzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj46On5iYXNpY19zdHJpbmcoKcgDTXN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPjo6YXNzaWduW2FiaTpubjIwMDEwMF0oY2hhciosIHVuc2lnbmVkIGxvbmcsIGNoYXIpyQOLAXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+Pjo6X19pbml0X2NvcHlfY3Rvcl9leHRlcm5hbChjaGFyIGNvbnN0KiwgdW5zaWduZWQgbG9uZynKA3hzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj46OmFwcGVuZChjaGFyIGNvbnN0KiwgdW5zaWduZWQgbG9uZynLA2VzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj46OnB1c2hfYmFjayhjaGFyKcwD3gFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90Pj46Ol9fZ3Jvd19ieV9hbmRfcmVwbGFjZSh1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB3Y2hhcl90IGNvbnN0KinNA4ABc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4+OjpfX2Fzc2lnbl9leHRlcm5hbCh3Y2hhcl90IGNvbnN0KinOA3FzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90Pj46OnB1c2hfYmFjayh3Y2hhcl90Kc8DxQFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj46OmJhc2ljX3N0cmluZ1thYmk6bm4yMDAxMDBdKHN0ZDo6X18yOjpfX3VuaW5pdGlhbGl6ZWRfc2l6ZV90YWcsIHVuc2lnbmVkIGxvbmcsIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gY29uc3QmKdADgAFzdGQ6Ol9fMjo6c3RvaShzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPj4gY29uc3QmLCB1bnNpZ25lZCBsb25nKiwgaW50KdEDnAFzdGQ6Ol9fMjo6KGFub255bW91cyBuYW1lc3BhY2UpOjp0aHJvd19mcm9tX3N0cmluZ19vdXRfb2ZfcmFuZ2Uoc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+IGNvbnN0JinSA54Cc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+IHN0ZDo6X18yOjpvcGVyYXRvcitbYWJpOm5uMjAwMTAwXTxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4+KHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+PiBjb25zdCYsIGNoYXIgY29uc3QqKdMDBWZwdXRj1AMyc3RkOjpfXzI6Ol9fbGliY3BwX3ZlcmJvc2VfYWJvcnQoY2hhciBjb25zdCosIC4uLinVAw9fX2Fib3J0X21lc3NhZ2XWAxJfX2N4YV9wdXJlX3ZpcnR1YWzXAzxpc19lcXVhbChzdGQ6OnR5cGVfaW5mbyBjb25zdCosIHN0ZDo6dHlwZV9pbmZvIGNvbnN0KiwgYm9vbCnYA1tfX2N4eGFiaXYxOjpfX2NsYXNzX3R5cGVfaW5mbzo6Y2FuX2NhdGNoKF9fY3h4YWJpdjE6Ol9fc2hpbV90eXBlX2luZm8gY29uc3QqLCB2b2lkKiYpIGNvbnN02QNrX19jeHhhYml2MTo6X19jbGFzc190eXBlX2luZm86OnByb2Nlc3NfZm91bmRfYmFzZV9jbGFzcyhfX2N4eGFiaXYxOjpfX2R5bmFtaWNfY2FzdF9pbmZvKiwgdm9pZCosIGludCkgY29uc3TaA25fX2N4eGFiaXYxOjpfX2NsYXNzX3R5cGVfaW5mbzo6aGFzX3VuYW1iaWd1b3VzX3B1YmxpY19iYXNlKF9fY3h4YWJpdjE6Ol9fZHluYW1pY19jYXN0X2luZm8qLCB2b2lkKiwgaW50KSBjb25zdNsDcV9fY3h4YWJpdjE6Ol9fc2lfY2xhc3NfdHlwZV9pbmZvOjpoYXNfdW5hbWJpZ3VvdXNfcHVibGljX2Jhc2UoX19jeHhhYml2MTo6X19keW5hbWljX2Nhc3RfaW5mbyosIHZvaWQqLCBpbnQpIGNvbnN03ANzX19jeHhhYml2MTo6X19iYXNlX2NsYXNzX3R5cGVfaW5mbzo6aGFzX3VuYW1iaWd1b3VzX3B1YmxpY19iYXNlKF9fY3h4YWJpdjE6Ol9fZHluYW1pY19jYXN0X2luZm8qLCB2b2lkKiwgaW50KSBjb25zdN0Dcl9fY3h4YWJpdjE6Ol9fdm1pX2NsYXNzX3R5cGVfaW5mbzo6aGFzX3VuYW1iaWd1b3VzX3B1YmxpY19iYXNlKF9fY3h4YWJpdjE6Ol9fZHluYW1pY19jYXN0X2luZm8qLCB2b2lkKiwgaW50KSBjb25zdN4DgwFfX2N4eGFiaXYxOjpfX2NsYXNzX3R5cGVfaW5mbzo6cHJvY2Vzc19zdGF0aWNfdHlwZV9hYm92ZV9kc3QoX19jeHhhYml2MTo6X19keW5hbWljX2Nhc3RfaW5mbyosIHZvaWQgY29uc3QqLCB2b2lkIGNvbnN0KiwgaW50KSBjb25zdN8Dc19fY3h4YWJpdjE6Ol9fdm1pX2NsYXNzX3R5cGVfaW5mbzo6c2VhcmNoX2JlbG93X2RzdChfX2N4eGFiaXYxOjpfX2R5bmFtaWNfY2FzdF9pbmZvKiwgdm9pZCBjb25zdCosIGludCwgYm9vbCkgY29uc3TgA4EBX19jeHhhYml2MTo6X19iYXNlX2NsYXNzX3R5cGVfaW5mbzo6c2VhcmNoX2Fib3ZlX2RzdChfX2N4eGFiaXYxOjpfX2R5bmFtaWNfY2FzdF9pbmZvKiwgdm9pZCBjb25zdCosIHZvaWQgY29uc3QqLCBpbnQsIGJvb2wpIGNvbnN04QN0X19jeHhhYml2MTo6X19iYXNlX2NsYXNzX3R5cGVfaW5mbzo6c2VhcmNoX2JlbG93X2RzdChfX2N4eGFiaXYxOjpfX2R5bmFtaWNfY2FzdF9pbmZvKiwgdm9pZCBjb25zdCosIGludCwgYm9vbCkgY29uc3TiA3JfX2N4eGFiaXYxOjpfX3NpX2NsYXNzX3R5cGVfaW5mbzo6c2VhcmNoX2JlbG93X2RzdChfX2N4eGFiaXYxOjpfX2R5bmFtaWNfY2FzdF9pbmZvKiwgdm9pZCBjb25zdCosIGludCwgYm9vbCkgY29uc3TjA29fX2N4eGFiaXYxOjpfX2NsYXNzX3R5cGVfaW5mbzo6c2VhcmNoX2JlbG93X2RzdChfX2N4eGFiaXYxOjpfX2R5bmFtaWNfY2FzdF9pbmZvKiwgdm9pZCBjb25zdCosIGludCwgYm9vbCkgY29uc3TkA4ABX19jeHhhYml2MTo6X192bWlfY2xhc3NfdHlwZV9pbmZvOjpzZWFyY2hfYWJvdmVfZHN0KF9fY3h4YWJpdjE6Ol9fZHluYW1pY19jYXN0X2luZm8qLCB2b2lkIGNvbnN0Kiwgdm9pZCBjb25zdCosIGludCwgYm9vbCkgY29uc3TlA39fX2N4eGFiaXYxOjpfX3NpX2NsYXNzX3R5cGVfaW5mbzo6c2VhcmNoX2Fib3ZlX2RzdChfX2N4eGFiaXYxOjpfX2R5bmFtaWNfY2FzdF9pbmZvKiwgdm9pZCBjb25zdCosIHZvaWQgY29uc3QqLCBpbnQsIGJvb2wpIGNvbnN05gN8X19jeHhhYml2MTo6X19jbGFzc190eXBlX2luZm86OnNlYXJjaF9hYm92ZV9kc3QoX19jeHhhYml2MTo6X19keW5hbWljX2Nhc3RfaW5mbyosIHZvaWQgY29uc3QqLCB2b2lkIGNvbnN0KiwgaW50LCBib29sKSBjb25zdOcDHHN0ZDo6ZXhjZXB0aW9uOjp3aGF0KCkgY29uc3ToAyBzdGQ6OmxvZ2ljX2Vycm9yOjp+bG9naWNfZXJyb3IoKekDJXN0ZDo6bG9naWNfZXJyb3I6On5sb2dpY19lcnJvcigpXzE2MDbqAx5zdGQ6OmxvZ2ljX2Vycm9yOjp3aGF0KCkgY29uc3TrAxlfZW1zY3JpcHRlbl9zdGFja19yZXN0b3Jl7AMXX2Vtc2NyaXB0ZW5fc3RhY2tfYWxsb2PtAxxlbXNjcmlwdGVuX3N0YWNrX2dldF9jdXJyZW50By0DAA9fX3N0YWNrX3BvaW50ZXIBC19fc3RhY2tfZW5kAgxfX3N0YWNrX2Jhc2UJqRuOAgAHLnJvZGF0YQEJLnJvZGF0YS4xAgkucm9kYXRhLjIDCS5yb2RhdGEuMwQJLnJvZGF0YS40BQkucm9kYXRhLjUGCS5yb2RhdGEuNgcJLnJvZGF0YS43CAkucm9kYXRhLjgJCS5yb2RhdGEuOQoKLnJvZGF0YS4xMAsKLnJvZGF0YS4xMQwKLnJvZGF0YS4xMg0KLnJvZGF0YS4xMw4KLnJvZGF0YS4xNA8KLnJvZGF0YS4xNRAKLnJvZGF0YS4xNhEKLnJvZGF0YS4xNxIKLnJvZGF0YS4xOBMKLnJvZGF0YS4xORQKLnJvZGF0YS4yMBUKLnJvZGF0YS4yMRYKLnJvZGF0YS4yMhcKLnJvZGF0YS4yMxgKLnJvZGF0YS4yNBkKLnJvZGF0YS4yNRoKLnJvZGF0YS4yNhsKLnJvZGF0YS4yNxwKLnJvZGF0YS4yOB0KLnJvZGF0YS4yOR4KLnJvZGF0YS4zMB8KLnJvZGF0YS4zMSAKLnJvZGF0YS4zMiEKLnJvZGF0YS4zMyIKLnJvZGF0YS4zNCMKLnJvZGF0YS4zNSQKLnJvZGF0YS4zNiUKLnJvZGF0YS4zNyYKLnJvZGF0YS4zOCcKLnJvZGF0YS4zOSgKLnJvZGF0YS40MCkKLnJvZGF0YS40MSoKLnJvZGF0YS40MisKLnJvZGF0YS40MywKLnJvZGF0YS40NC0KLnJvZGF0YS40NS4KLnJvZGF0YS40Ni8KLnJvZGF0YS40NzAKLnJvZGF0YS40ODEKLnJvZGF0YS40OTIKLnJvZGF0YS41MDMKLnJvZGF0YS41MTQKLnJvZGF0YS41MjUKLnJvZGF0YS41MzYKLnJvZGF0YS41NDcKLnJvZGF0YS41NTgKLnJvZGF0YS41NjkKLnJvZGF0YS41NzoKLnJvZGF0YS41ODsKLnJvZGF0YS41OTwKLnJvZGF0YS42MD0KLnJvZGF0YS42MT4KLnJvZGF0YS42Mj8KLnJvZGF0YS42M0AKLnJvZGF0YS42NEEKLnJvZGF0YS42NUIKLnJvZGF0YS42NkMKLnJvZGF0YS42N0QKLnJvZGF0YS42OEUKLnJvZGF0YS42OUYKLnJvZGF0YS43MEcKLnJvZGF0YS43MUgKLnJvZGF0YS43MkkKLnJvZGF0YS43M0oKLnJvZGF0YS43NEsKLnJvZGF0YS43NUwKLnJvZGF0YS43Nk0KLnJvZGF0YS43N04KLnJvZGF0YS43OE8KLnJvZGF0YS43OVAKLnJvZGF0YS44MFEKLnJvZGF0YS44MVIKLnJvZGF0YS44MlMKLnJvZGF0YS44M1QKLnJvZGF0YS44NFUKLnJvZGF0YS44NVYKLnJvZGF0YS44NlcKLnJvZGF0YS44N1gKLnJvZGF0YS44OFkKLnJvZGF0YS44OVoKLnJvZGF0YS45MFsKLnJvZGF0YS45MVwKLnJvZGF0YS45Ml0KLnJvZGF0YS45M14KLnJvZGF0YS45NF8KLnJvZGF0YS45NWAKLnJvZGF0YS45NmEKLnJvZGF0YS45N2IKLnJvZGF0YS45OGMKLnJvZGF0YS45OWQLLnJvZGF0YS4xMDBlCy5yb2RhdGEuMTAxZgsucm9kYXRhLjEwMmcLLnJvZGF0YS4xMDNoCy5yb2RhdGEuMTA0aQsucm9kYXRhLjEwNWoLLnJvZGF0YS4xMDZrCy5yb2RhdGEuMTA3bAsucm9kYXRhLjEwOG0LLnJvZGF0YS4xMDluCy5yb2RhdGEuMTEwbwsucm9kYXRhLjExMXALLnJvZGF0YS4xMTJxCy5yb2RhdGEuMTEzcgsucm9kYXRhLjExNHMLLnJvZGF0YS4xMTV0Cy5yb2RhdGEuMTE2dQsucm9kYXRhLjExN3YLLnJvZGF0YS4xMTh3Cy5yb2RhdGEuMTE5eAsucm9kYXRhLjEyMHkLLnJvZGF0YS4xMjF6Cy5yb2RhdGEuMTIyewsucm9kYXRhLjEyM3wLLnJvZGF0YS4xMjR9Cy5yb2RhdGEuMTI1fgsucm9kYXRhLjEyNn8LLnJvZGF0YS4xMjeAAQsucm9kYXRhLjEyOIEBCy5yb2RhdGEuMTI5ggELLnJvZGF0YS4xMzCDAQsucm9kYXRhLjEzMYQBCy5yb2RhdGEuMTMyhQELLnJvZGF0YS4xMzOGAQsucm9kYXRhLjEzNIcBCy5yb2RhdGEuMTM1iAELLnJvZGF0YS4xMzaJAQsucm9kYXRhLjEzN4oBCy5yb2RhdGEuMTM4iwELLnJvZGF0YS4xMzmMAQsucm9kYXRhLjE0MI0BCy5yb2RhdGEuMTQxjgELLnJvZGF0YS4xNDKPAQsucm9kYXRhLjE0M5ABCy5yb2RhdGEuMTQ0kQELLnJvZGF0YS4xNDWSAQsucm9kYXRhLjE0NpMBCy5yb2RhdGEuMTQ3lAELLnJvZGF0YS4xNDiVAQsucm9kYXRhLjE0OZYBCy5yb2RhdGEuMTUwlwELLnJvZGF0YS4xNTGYAQsucm9kYXRhLjE1MpkBCy5yb2RhdGEuMTUzmgELLnJvZGF0YS4xNTSbAQsucm9kYXRhLjE1NZwBCy5yb2RhdGEuMTU2nQELLnJvZGF0YS4xNTeeAQsucm9kYXRhLjE1OJ8BCy5yb2RhdGEuMTU5oAELLnJvZGF0YS4xNjChAQsucm9kYXRhLjE2MaIBCy5yb2RhdGEuMTYyowELLnJvZGF0YS4xNjOkAQsucm9kYXRhLjE2NKUBCy5yb2RhdGEuMTY1pgELLnJvZGF0YS4xNjanAQsucm9kYXRhLjE2N6gBCy5yb2RhdGEuMTY4qQELLnJvZGF0YS4xNjmqAQsucm9kYXRhLjE3MKsBCy5yb2RhdGEuMTcxrAELLnJvZGF0YS4xNzKtAQsucm9kYXRhLjE3M64BCy5yb2RhdGEuMTc0rwELLnJvZGF0YS4xNzWwAQsucm9kYXRhLjE3NrEBCy5yb2RhdGEuMTc3sgELLnJvZGF0YS4xNzizAQsucm9kYXRhLjE3ObQBCy5yb2RhdGEuMTgwtQELLnJvZGF0YS4xODG2AQsucm9kYXRhLjE4MrcBCy5yb2RhdGEuMTgzuAELLnJvZGF0YS4xODS5AQsucm9kYXRhLjE4NboBCy5yb2RhdGEuMTg2uwELLnJvZGF0YS4xODe8AQsucm9kYXRhLjE4OL0BCy5yb2RhdGEuMTg5vgELLnJvZGF0YS4xOTC/AQsucm9kYXRhLjE5McABCy5yb2RhdGEuMTkywQELLnJvZGF0YS4xOTPCAQsucm9kYXRhLjE5NMMBCy5yb2RhdGEuMTk1xAELLnJvZGF0YS4xOTbFAQsucm9kYXRhLjE5N8YBCy5yb2RhdGEuMTk4xwELLnJvZGF0YS4xOTnIAQsucm9kYXRhLjIwMMkBCy5yb2RhdGEuMjAxygELLnJvZGF0YS4yMDLLAQsucm9kYXRhLjIwM8wBCy5yb2RhdGEuMjA0zQELLnJvZGF0YS4yMDXOAQsucm9kYXRhLjIwNs8BCy5yb2RhdGEuMjA30AELLnJvZGF0YS4yMDjRAQsucm9kYXRhLjIwOdIBCy5yb2RhdGEuMjEw0wELLnJvZGF0YS4yMTHUAQsucm9kYXRhLjIxMtUBCy5yb2RhdGEuMjEz1gELLnJvZGF0YS4yMTTXAQsucm9kYXRhLjIxNdgBCy5yb2RhdGEuMjE22QELLnJvZGF0YS4yMTfaAQsucm9kYXRhLjIxONsBCy5yb2RhdGEuMjE53AELLnJvZGF0YS4yMjDdAQsucm9kYXRhLjIyMd4BCy5yb2RhdGEuMjIy3wELLnJvZGF0YS4yMjPgAQsucm9kYXRhLjIyNOEBCy5yb2RhdGEuMjI14gELLnJvZGF0YS4yMjbjAQsucm9kYXRhLjIyN+QBCy5yb2RhdGEuMjI45QELLnJvZGF0YS4yMjnmAQsucm9kYXRhLjIzMOcBCy5yb2RhdGEuMjMx6AELLnJvZGF0YS4yMzLpAQsucm9kYXRhLjIzM+oBCy5yb2RhdGEuMjM06wELLnJvZGF0YS4yMzXsAQsucm9kYXRhLjIzNu0BCy5yb2RhdGEuMjM37gELLnJvZGF0YS4yMzjvAQsucm9kYXRhLjIzOfABCy5yb2RhdGEuMjQw8QELLnJvZGF0YS4yNDHyAQsucm9kYXRhLjI0MvMBCy5yb2RhdGEuMjQz9AELLnJvZGF0YS4yNDT1AQsucm9kYXRhLjI0NfYBCy5yb2RhdGEuMjQ29wELLnJvZGF0YS4yNDf4AQsucm9kYXRhLjI0OPkBCy5yb2RhdGEuMjQ5+gELLnJvZGF0YS4yNTD7AQsucm9kYXRhLjI1MfwBCy5yb2RhdGEuMjUy/QELLnJvZGF0YS4yNTP+AQsucm9kYXRhLjI1NP8BCy5yb2RhdGEuMjU1gAILLnJvZGF0YS4yNTaBAgsucm9kYXRhLjI1N4ICCy5yb2RhdGEuMjU4gwIFLmRhdGGEAgcuZGF0YS4xhQIHLmRhdGEuMoYCBy5kYXRhLjOHAgcuZGF0YS40iAIHLmRhdGEuNYkCBy5kYXRhLjaKAgcuZGF0YS43iwIHLmRhdGEuOIwCBy5kYXRhLjmNAgguZGF0YS4xMA==');
}

function getBinarySync(file) {
  if (ArrayBuffer.isView(file)) {
    return file;
  }
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
    return readBinary(file);
  }
  throw 'both async and sync fetching of the wasm failed';
}

async function getWasmBinary(binaryFile) {

  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}

async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);

    // Warn on some common problems.
    if (isFileURI(wasmBinaryFile)) {
      err(`warning: Loading from a file URI (${wasmBinaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  }
}

async function instantiateAsync(binary, binaryFile, imports) {
  return instantiateArrayBuffer(binaryFile, imports);
}

function getWasmImports() {
  // prepare imports
  return {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  }
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    wasmExports = instance.exports;

    

    wasmMemory = wasmExports['memory'];
    
    assert(wasmMemory, 'memory not found in wasm exports');
    updateMemoryViews();

    assignWasmExports(wasmExports);
    return wasmExports;
  }

  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    return receiveInstance(result['instance']);
  }

  var info = getWasmImports();

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  if (Module['instantiateWasm']) {
    return new Promise((resolve, reject) => {
      try {
        Module['instantiateWasm'](info, (mod, inst) => {
          resolve(receiveInstance(mod, inst));
        });
      } catch(e) {
        err(`Module.instantiateWasm callback failed with error: ${e}`);
        reject(e);
      }
    });
  }

  wasmBinaryFile ??= findWasmBinary();
  var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
  var exports = receiveInstantiationResult(result);
  return exports;
}

// end include: preamble.js

// Begin JS library code


  class ExitStatus {
      name = 'ExitStatus';
      constructor(status) {
        this.message = `Program terminated with exit(${status})`;
        this.status = status;
      }
    }

  var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    };
  var onPostRuns = [];
  var addOnPostRun = (cb) => onPostRuns.push(cb);

  var onPreRuns = [];
  var addOnPreRun = (cb) => onPreRuns.push(cb);

  /** @noinline */
  var base64Decode = (b64) => {
  
      assert(b64.length % 4 == 0);
      var b1, b2, i = 0, j = 0, bLength = b64.length;
      var output = new Uint8Array((bLength*3>>2) - (b64[bLength-2] == '=') - (b64[bLength-1] == '='));
      for (; i < bLength; i += 4, j += 3) {
        b1 = base64ReverseLookup[b64.charCodeAt(i+1)];
        b2 = base64ReverseLookup[b64.charCodeAt(i+2)];
        output[j] = base64ReverseLookup[b64.charCodeAt(i)] << 2 | b1 >> 4;
        output[j+1] = b1 << 4 | b2 >> 2;
        output[j+2] = b2 << 6 | base64ReverseLookup[b64.charCodeAt(i+3)];
      }
      return output;
    };


  
    /**
     * @param {number} ptr
     * @param {string} type
     */
  function getValue(ptr, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': return HEAP8[ptr];
      case 'i8': return HEAP8[ptr];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP64[((ptr)>>3)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      case '*': return HEAPU32[((ptr)>>2)];
      default: abort(`invalid type for getValue: ${type}`);
    }
  }

  var noExitRuntime = true;

  var ptrToString = (ptr) => {
      assert(typeof ptr === 'number');
      // Convert to 32-bit unsigned value
      ptr >>>= 0;
      return '0x' + ptr.toString(16).padStart(8, '0');
    };

  var setStackLimits = () => {
      var stackLow = _emscripten_stack_get_base();
      var stackHigh = _emscripten_stack_get_end();
      ___set_stack_limits(stackLow, stackHigh);
    };

  
    /**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */
  function setValue(ptr, value, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': HEAP8[ptr] = value;checkInt8(value); break;
      case 'i8': HEAP8[ptr] = value;checkInt8(value); break;
      case 'i16': HEAP16[((ptr)>>1)] = value;checkInt16(value); break;
      case 'i32': HEAP32[((ptr)>>2)] = value;checkInt32(value); break;
      case 'i64': HEAP64[((ptr)>>3)] = BigInt(value);checkInt64(value); break;
      case 'float': HEAPF32[((ptr)>>2)] = value; break;
      case 'double': HEAPF64[((ptr)>>3)] = value; break;
      case '*': HEAPU32[((ptr)>>2)] = value; break;
      default: abort(`invalid type for setValue: ${type}`);
    }
  }

  var stackRestore = (val) => __emscripten_stack_restore(val);

  var stackSave = () => _emscripten_stack_get_current();

  var warnOnce = (text) => {
      warnOnce.shown ||= {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
      }
    };

  class ExceptionInfo {
      // excPtr - Thrown object pointer to wrap. Metadata pointer is calculated from it.
      constructor(excPtr) {
        this.excPtr = excPtr;
        this.ptr = excPtr - 24;
      }
  
      set_type(type) {
        HEAPU32[(((this.ptr)+(4))>>2)] = type;
      }
  
      get_type() {
        return HEAPU32[(((this.ptr)+(4))>>2)];
      }
  
      set_destructor(destructor) {
        HEAPU32[(((this.ptr)+(8))>>2)] = destructor;
      }
  
      get_destructor() {
        return HEAPU32[(((this.ptr)+(8))>>2)];
      }
  
      set_caught(caught) {
        caught = caught ? 1 : 0;
        HEAP8[(this.ptr)+(12)] = caught;checkInt8(caught);
      }
  
      get_caught() {
        return HEAP8[(this.ptr)+(12)] != 0;
      }
  
      set_rethrown(rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[(this.ptr)+(13)] = rethrown;checkInt8(rethrown);
      }
  
      get_rethrown() {
        return HEAP8[(this.ptr)+(13)] != 0;
      }
  
      // Initialize native structure fields. Should be called once after allocated.
      init(type, destructor) {
        this.set_adjusted_ptr(0);
        this.set_type(type);
        this.set_destructor(destructor);
      }
  
      set_adjusted_ptr(adjustedPtr) {
        HEAPU32[(((this.ptr)+(16))>>2)] = adjustedPtr;
      }
  
      get_adjusted_ptr() {
        return HEAPU32[(((this.ptr)+(16))>>2)];
      }
    }
  
  var exceptionLast = 0;
  
  var uncaughtExceptionCount = 0;
  var ___cxa_throw = (ptr, type, destructor) => {
      var info = new ExceptionInfo(ptr);
      // Initialize ExceptionInfo content after it was allocated in __cxa_allocate_exception.
      info.init(type, destructor);
      exceptionLast = ptr;
      uncaughtExceptionCount++;
      assert(false, 'Exception thrown, but exception catching is not enabled. Compile with -sNO_DISABLE_EXCEPTION_CATCHING or -sEXCEPTION_CATCHING_ALLOWED=[..] to catch.');
    };

  
  
  var ___handle_stack_overflow = (requested) => {
      var base = _emscripten_stack_get_base();
      var end = _emscripten_stack_get_end();
      abort(`stack overflow (Attempt to set SP to ${ptrToString(requested)}` +
            `, with stack limits [${ptrToString(end)} - ${ptrToString(base)}` +
            ']). If you require more stack space build with -sSTACK_SIZE=<bytes>');
    };

  var __abort_js = () =>
      abort('native code called abort()');

  var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
      assert(typeof str === 'string', `stringToUTF8Array expects a string (got ${typeof str})`);
      // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
      // undefined and false each don't write out any bytes.
      if (!(maxBytesToWrite > 0))
        return 0;
  
      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
      for (var i = 0; i < str.length; ++i) {
        // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
        // and https://www.ietf.org/rfc/rfc2279.txt
        // and https://tools.ietf.org/html/rfc3629
        var u = str.codePointAt(i);
        if (u <= 0x7F) {
          if (outIdx >= endIdx) break;
          heap[outIdx++] = u;
        } else if (u <= 0x7FF) {
          if (outIdx + 1 >= endIdx) break;
          heap[outIdx++] = 0xC0 | (u >> 6);
          heap[outIdx++] = 0x80 | (u & 63);
        } else if (u <= 0xFFFF) {
          if (outIdx + 2 >= endIdx) break;
          heap[outIdx++] = 0xE0 | (u >> 12);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        } else {
          if (outIdx + 3 >= endIdx) break;
          if (u > 0x10FFFF) warnOnce('Invalid Unicode code point ' + ptrToString(u) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).');
          heap[outIdx++] = 0xF0 | (u >> 18);
          heap[outIdx++] = 0x80 | ((u >> 12) & 63);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
          // Gotcha: if codePoint is over 0xFFFF, it is represented as a surrogate pair in UTF-16.
          // We need to manually skip over the second code unit for correct iteration.
          i++;
        }
      }
      // Null-terminate the pointer to the buffer.
      heap[outIdx] = 0;
      return outIdx - startIdx;
    };
  var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    };
  
  var lengthBytesUTF8 = (str) => {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
        // unit, not a Unicode code point of the character! So decode
        // UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var c = str.charCodeAt(i); // possibly a lead surrogate
        if (c <= 0x7F) {
          len++;
        } else if (c <= 0x7FF) {
          len += 2;
        } else if (c >= 0xD800 && c <= 0xDFFF) {
          len += 4; ++i;
        } else {
          len += 3;
        }
      }
      return len;
    };
  var __tzset_js = (timezone, daylight, std_name, dst_name) => {
      // TODO: Use (malleable) environment variables instead of system settings.
      var currentYear = new Date().getFullYear();
      var winter = new Date(currentYear, 0, 1);
      var summer = new Date(currentYear, 6, 1);
      var winterOffset = winter.getTimezoneOffset();
      var summerOffset = summer.getTimezoneOffset();
  
      // Local standard timezone offset. Local standard time is not adjusted for
      // daylight savings.  This code uses the fact that getTimezoneOffset returns
      // a greater value during Standard Time versus Daylight Saving Time (DST).
      // Thus it determines the expected output during Standard Time, and it
      // compares whether the output of the given date the same (Standard) or less
      // (DST).
      var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  
      // timezone is specified as seconds west of UTC ("The external variable
      // `timezone` shall be set to the difference, in seconds, between
      // Coordinated Universal Time (UTC) and local standard time."), the same
      // as returned by stdTimezoneOffset.
      // See http://pubs.opengroup.org/onlinepubs/009695399/functions/tzset.html
      HEAPU32[((timezone)>>2)] = stdTimezoneOffset * 60;
  
      HEAP32[((daylight)>>2)] = Number(winterOffset != summerOffset);checkInt32(Number(winterOffset != summerOffset));
  
      var extractZone = (timezoneOffset) => {
        // Why inverse sign?
        // Read here https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
        var sign = timezoneOffset >= 0 ? "-" : "+";
  
        var absOffset = Math.abs(timezoneOffset)
        var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
        var minutes = String(absOffset % 60).padStart(2, "0");
  
        return `UTC${sign}${hours}${minutes}`;
      }
  
      var winterName = extractZone(winterOffset);
      var summerName = extractZone(summerOffset);
      assert(winterName);
      assert(summerName);
      assert(lengthBytesUTF8(winterName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${winterName})`);
      assert(lengthBytesUTF8(summerName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${summerName})`);
      if (summerOffset < winterOffset) {
        // Northern hemisphere
        stringToUTF8(winterName, std_name, 17);
        stringToUTF8(summerName, dst_name, 17);
      } else {
        stringToUTF8(winterName, dst_name, 17);
        stringToUTF8(summerName, std_name, 17);
      }
    };

  var _emscripten_get_now = () => performance.now();
  
  var getHeapMax = () =>
      // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
      // full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
      // for any code that deals with heap sizes, which would require special
      // casing all heap size related code to treat 0 specially.
      2147483648;
  
  var alignMemory = (size, alignment) => {
      assert(alignment, "alignment argument is required");
      return Math.ceil(size / alignment) * alignment;
    };
  
  var growMemory = (size) => {
      var oldHeapSize = wasmMemory.buffer.byteLength;
      var pages = ((size - oldHeapSize + 65535) / 65536) | 0;
      try {
        // round size grow request up to wasm page size (fixed 64KB per spec)
        wasmMemory.grow(pages); // .grow() takes a delta compared to the previous size
        updateMemoryViews();
        return 1 /*success*/;
      } catch(e) {
        err(`growMemory: Attempted to grow heap from ${oldHeapSize} bytes to ${size} bytes, but got error: ${e}`);
      }
      // implicit 0 return to save code size (caller will cast "undefined" into 0
      // anyhow)
    };
  var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length;
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      requestedSize >>>= 0;
      // With multithreaded builds, races can happen (another thread might increase the size
      // in between), so return a failure, and let the caller retry.
      assert(requestedSize > oldSize);
  
      // Memory resize rules:
      // 1.  Always increase heap size to at least the requested size, rounded up
      //     to next page multiple.
      // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
      //     geometrically: increase the heap size according to
      //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
      //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
      // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
      //     linearly: increase the heap size by at least
      //     MEMORY_GROWTH_LINEAR_STEP bytes.
      // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
      //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
      // 4.  If we were unable to allocate as much memory, it may be due to
      //     over-eager decision to excessively reserve due to (3) above.
      //     Hence if an allocation fails, cut down on the amount of excess
      //     growth, in an attempt to succeed to perform a smaller allocation.
  
      // A limit is set for how much we can grow. We should not exceed that
      // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
      var maxHeapSize = getHeapMax();
      if (requestedSize > maxHeapSize) {
        err(`Cannot enlarge memory, requested ${requestedSize} bytes, but the limit is ${maxHeapSize} bytes!`);
        return false;
      }
  
      // Loop through potential heap size increases. If we attempt a too eager
      // reservation that fails, cut down on the attempted size and reserve a
      // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown); // ensure geometric growth
        // but limit overreserving (default to capping at +96MB overgrowth at most)
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296 );
  
        var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
  
        var t0 = _emscripten_get_now();
        var replacement = growMemory(newSize);
        var t1 = _emscripten_get_now();
        dbg(`Heap resize call from ${oldSize} to ${newSize} took ${(t1 - t0)} msecs. Success: ${!!replacement}`);
        if (replacement) {
  
          return true;
        }
      }
      err(`Failed to grow the heap from ${oldSize} bytes to ${newSize} bytes, not enough memory!`);
      return false;
    };

  var ENV = {
  };
  
  var getExecutableName = () => thisProgram || './this.program';
  var getEnvStrings = () => {
      if (!getEnvStrings.strings) {
        // Default values.
        // Browser language detection #8751
        var lang = ((typeof navigator == 'object' && navigator.language) || 'C').replace('-', '_') + '.UTF-8';
        var env = {
          'USER': 'web_user',
          'LOGNAME': 'web_user',
          'PATH': '/',
          'PWD': '/',
          'HOME': '/home/web_user',
          'LANG': lang,
          '_': getExecutableName()
        };
        // Apply the user-provided values, if any.
        for (var x in ENV) {
          // x is a key in ENV; if ENV[x] is undefined, that means it was
          // explicitly set to be so. We allow user code to do that to
          // force variables with default values to remain unset.
          if (ENV[x] === undefined) delete env[x];
          else env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
          strings.push(`${x}=${env[x]}`);
        }
        getEnvStrings.strings = strings;
      }
      return getEnvStrings.strings;
    };
  
  var _environ_get = (__environ, environ_buf) => {
      var bufSize = 0;
      var envp = 0;
      for (var string of getEnvStrings()) {
        var ptr = environ_buf + bufSize;
        HEAPU32[(((__environ)+(envp))>>2)] = ptr;
        bufSize += stringToUTF8(string, ptr, Infinity) + 1;
        envp += 4;
      }
      return 0;
    };

  
  var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
      var strings = getEnvStrings();
      HEAPU32[((penviron_count)>>2)] = strings.length;checkInt32(strings.length);
      var bufSize = 0;
      for (var string of strings) {
        bufSize += lengthBytesUTF8(string) + 1;
      }
      HEAPU32[((penviron_buf_size)>>2)] = bufSize;checkInt32(bufSize);
      return 0;
    };

  var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder() : undefined;
  
  var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
      var maxIdx = idx + maxBytesToRead;
      if (ignoreNul) return maxIdx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.
      // As a tiny code save trick, compare idx against maxIdx using a negation,
      // so that maxBytesToRead=undefined/NaN means Infinity.
      while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
      return idx;
    };
  
  
    /**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number=} idx
     * @param {number=} maxBytesToRead
     * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
     * @return {string}
     */
  var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
  
      var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
  
      // When using conditional TextDecoder, skip it for short strings as the overhead of the native call is not worth it.
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = '';
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = heapOrArray[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte ' + ptrToString(u0) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
      return str;
    };
  
    /**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index.
     * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
     * @return {string}
     */
  var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => {
      assert(typeof ptr == 'number', `UTF8ToString expects a number (got ${typeof ptr})`);
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : '';
    };
  var SYSCALLS = {
  varargs:undefined,
  getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
  };
  var _fd_close = (fd) => {
      abort('fd_close called without SYSCALLS_REQUIRE_FILESYSTEM');
    };

  var INT53_MAX = 9007199254740992;
  
  var INT53_MIN = -9007199254740992;
  var bigintToI53Checked = (num) => (num < INT53_MIN || num > INT53_MAX) ? NaN : Number(num);
  function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
  
  
      return 70;
    ;
  }

  var printCharBuffers = [null,[],[]];
  
  var printChar = (stream, curr) => {
      var buffer = printCharBuffers[stream];
      assert(buffer);
      if (curr === 0 || curr === 10) {
        (stream === 1 ? out : err)(UTF8ArrayToString(buffer));
        buffer.length = 0;
      } else {
        buffer.push(curr);
      }
    };
  
  var flush_NO_FILESYSTEM = () => {
      // flush anything remaining in the buffers during shutdown
      _fflush(0);
      if (printCharBuffers[1].length) printChar(1, 10);
      if (printCharBuffers[2].length) printChar(2, 10);
    };
  
  
  var _fd_write = (fd, iov, iovcnt, pnum) => {
      // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
      var num = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        for (var j = 0; j < len; j++) {
          printChar(fd, HEAPU8[ptr+j]);
        }
        num += len;
      }
      HEAPU32[((pnum)>>2)] = num;checkInt32(num);
      return 0;
    };

  var getCFunc = (ident) => {
      var func = Module['_' + ident]; // closure exported function
      assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
      return func;
    };
  
  var writeArrayToMemory = (array, buffer) => {
      assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
      HEAP8.set(array, buffer);
    };
  
  
  
  var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
  var stringToUTF8OnStack = (str) => {
      var size = lengthBytesUTF8(str) + 1;
      var ret = stackAlloc(size);
      stringToUTF8(str, ret, size);
      return ret;
    };
  
  
  
  
  
    /**
     * @param {string|null=} returnType
     * @param {Array=} argTypes
     * @param {Array=} args
     * @param {Object=} opts
     */
  var ccall = (ident, returnType, argTypes, args, opts) => {
      // For fast lookup of conversion functions
      var toC = {
        'string': (str) => {
          var ret = 0;
          if (str !== null && str !== undefined && str !== 0) { // null string
            ret = stringToUTF8OnStack(str);
          }
          return ret;
        },
        'array': (arr) => {
          var ret = stackAlloc(arr.length);
          writeArrayToMemory(arr, ret);
          return ret;
        }
      };
  
      function convertReturnValue(ret) {
        if (returnType === 'string') {
          return UTF8ToString(ret);
        }
        if (returnType === 'boolean') return Boolean(ret);
        return ret;
      }
  
      var func = getCFunc(ident);
      var cArgs = [];
      var stack = 0;
      assert(returnType !== 'array', 'Return type should not be "array".');
      if (args) {
        for (var i = 0; i < args.length; i++) {
          var converter = toC[argTypes[i]];
          if (converter) {
            if (stack === 0) stack = stackSave();
            cArgs[i] = converter(args[i]);
          } else {
            cArgs[i] = args[i];
          }
        }
      }
      var ret = func(...cArgs);
      function onDone(ret) {
        if (stack !== 0) stackRestore(stack);
        return convertReturnValue(ret);
      }
  
      ret = onDone(ret);
      return ret;
    };
  
    /**
     * @param {string=} returnType
     * @param {Array=} argTypes
     * @param {Object=} opts
     */
  var cwrap = (ident, returnType, argTypes, opts) => {
      return (...args) => ccall(ident, returnType, argTypes, args, opts);
    };


    // Precreate a reverse lookup table from chars
    // "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/" back to
    // bytes to make decoding fast.
    for (var base64ReverseLookup = new Uint8Array(123/*'z'+1*/), i = 25; i >= 0; --i) {
      base64ReverseLookup[48+i] = 52+i; // '0-9'
      base64ReverseLookup[65+i] = i; // 'A-Z'
      base64ReverseLookup[97+i] = 26+i; // 'a-z'
    }
    base64ReverseLookup[43] = 62; // '+'
    base64ReverseLookup[47] = 63; // '/'
  ;
// End JS library code

// include: postlibrary.js
// This file is included after the automatically-generated JS library code
// but before the wasm module is created.

{

  // Begin ATMODULES hooks
  if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime'];
if (Module['print']) out = Module['print'];
if (Module['printErr']) err = Module['printErr'];
if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];

Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;

  // End ATMODULES hooks

  checkIncomingModuleAPI();

  if (Module['arguments']) arguments_ = Module['arguments'];
  if (Module['thisProgram']) thisProgram = Module['thisProgram'];

  // Assertions on removed incoming Module JS APIs.
  assert(typeof Module['memoryInitializerPrefixURL'] == 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['pthreadMainPrefixURL'] == 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['cdInitializerPrefixURL'] == 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['filePackagePrefixURL'] == 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['read'] == 'undefined', 'Module.read option was removed');
  assert(typeof Module['readAsync'] == 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
  assert(typeof Module['readBinary'] == 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
  assert(typeof Module['setWindowTitle'] == 'undefined', 'Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)');
  assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
  assert(typeof Module['ENVIRONMENT'] == 'undefined', 'Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
  assert(typeof Module['STACK_SIZE'] == 'undefined', 'STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time')
  // If memory is defined in wasm, the user can't provide it, or set INITIAL_MEMORY
  assert(typeof Module['wasmMemory'] == 'undefined', 'Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally');
  assert(typeof Module['INITIAL_MEMORY'] == 'undefined', 'Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically');

  if (Module['preInit']) {
    if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
    while (Module['preInit'].length > 0) {
      Module['preInit'].shift()();
    }
  }
  consumedModuleProp('preInit');
}

// Begin runtime exports
  Module['ccall'] = ccall;
  Module['cwrap'] = cwrap;
  var missingLibrarySymbols = [
  'writeI53ToI64',
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'readI53FromI64',
  'readI53FromU64',
  'convertI32PairToI53',
  'convertI32PairToI53Checked',
  'convertU32PairToI53',
  'getTempRet0',
  'setTempRet0',
  'zeroMemory',
  'exitJS',
  'withStackSave',
  'strError',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'readEmAsmArgs',
  'jstoi_q',
  'autoResumeAudioContext',
  'getDynCaller',
  'dynCall',
  'handleException',
  'keepRuntimeAlive',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'callUserCallback',
  'maybeExit',
  'asyncLoad',
  'asmjsMangle',
  'mmapAlloc',
  'HandleAllocator',
  'getNativeTypeSize',
  'getUniqueRunDependency',
  'addRunDependency',
  'removeRunDependency',
  'addOnInit',
  'addOnPostCtor',
  'addOnPreMain',
  'addOnExit',
  'STACK_SIZE',
  'STACK_ALIGN',
  'POINTER_SIZE',
  'ASSERTIONS',
  'convertJsFunctionToWasm',
  'getEmptyTableSlot',
  'updateTableMap',
  'getFunctionAddress',
  'addFunction',
  'removeFunction',
  'intArrayFromString',
  'intArrayToString',
  'AsciiToString',
  'stringToAscii',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'stringToNewUTF8',
  'registerKeyEventCallback',
  'maybeCStringToJsString',
  'findEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerMouseEventCallback',
  'registerWheelEventCallback',
  'registerUiEventCallback',
  'registerFocusEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'setLetterbox',
  'softFullscreenResizeWebGLRenderTarget',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'registerPointerlockErrorEventCallback',
  'requestPointerLock',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'registerTouchEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'registerBeforeUnloadEventCallback',
  'fillBatteryEventData',
  'registerBatteryEventCallback',
  'setCanvasElementSize',
  'getCanvasElementSize',
  'jsStackTrace',
  'getCallstack',
  'convertPCtoSourceLocation',
  'checkWasiClock',
  'wasiRightsToMuslOFlags',
  'wasiOFlagsToMuslOFlags',
  'initRandomFill',
  'randomFill',
  'safeSetTimeout',
  'setImmediateWrapped',
  'safeRequestAnimationFrame',
  'clearImmediateWrapped',
  'registerPostMainLoop',
  'registerPreMainLoop',
  'getPromise',
  'makePromise',
  'idsToPromises',
  'makePromiseCallback',
  'findMatchingCatch',
  'Browser_asyncPrepareDataCounter',
  'isLeapYear',
  'ydayFromDate',
  'arraySum',
  'addDays',
  'getSocketFromFD',
  'getSocketAddress',
  'FS_createPreloadedFile',
  'FS_preloadFile',
  'FS_modeStringToFlags',
  'FS_getMode',
  'FS_stdin_getChar',
  'FS_mkdirTree',
  '_setNetworkCallback',
  'heapObjectForWebGLType',
  'toTypedArrayIndex',
  'webgl_enable_ANGLE_instanced_arrays',
  'webgl_enable_OES_vertex_array_object',
  'webgl_enable_WEBGL_draw_buffers',
  'webgl_enable_WEBGL_multi_draw',
  'webgl_enable_EXT_polygon_offset_clamp',
  'webgl_enable_EXT_clip_control',
  'webgl_enable_WEBGL_polygon_mode',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'colorChannelsInGlTextureFormat',
  'emscriptenWebGLGetTexPixelData',
  'emscriptenWebGLGetUniform',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  '__glGetActiveAttribOrUniform',
  'writeGLArray',
  'registerWebGlEventCallback',
  'runAndAbortIfError',
  'ALLOC_NORMAL',
  'ALLOC_STACK',
  'allocate',
  'writeStringToMemory',
  'writeAsciiToMemory',
  'demangle',
  'stackTrace',
];
missingLibrarySymbols.forEach(missingLibrarySymbol)

  var unexportedSymbols = [
  'run',
  'out',
  'err',
  'callMain',
  'abort',
  'wasmMemory',
  'wasmExports',
  'HEAPF32',
  'HEAPF64',
  'HEAP8',
  'HEAPU8',
  'HEAP16',
  'HEAPU16',
  'HEAP32',
  'HEAPU32',
  'HEAP64',
  'HEAPU64',
  'writeStackCookie',
  'checkStackCookie',
  'INT53_MAX',
  'INT53_MIN',
  'bigintToI53Checked',
  'stackSave',
  'stackRestore',
  'stackAlloc',
  'ptrToString',
  'getHeapMax',
  'growMemory',
  'ENV',
  'setStackLimits',
  'ERRNO_CODES',
  'DNS',
  'Protocols',
  'Sockets',
  'timers',
  'warnOnce',
  'readEmAsmArgsArray',
  'getExecutableName',
  'alignMemory',
  'wasmTable',
  'noExitRuntime',
  'addOnPreRun',
  'addOnPostRun',
  'freeTableIndexes',
  'functionsInTableMap',
  'setValue',
  'getValue',
  'PATH',
  'PATH_FS',
  'UTF8Decoder',
  'UTF8ArrayToString',
  'UTF8ToString',
  'stringToUTF8Array',
  'stringToUTF8',
  'lengthBytesUTF8',
  'UTF16Decoder',
  'stringToUTF8OnStack',
  'writeArrayToMemory',
  'JSEvents',
  'specialHTMLTargets',
  'findCanvasEventTarget',
  'currentFullscreenStrategy',
  'restoreOldWindowedStyle',
  'UNWIND_CACHE',
  'ExitStatus',
  'getEnvStrings',
  'flush_NO_FILESYSTEM',
  'emSetImmediate',
  'emClearImmediate_deps',
  'emClearImmediate',
  'promiseMap',
  'uncaughtExceptionCount',
  'exceptionLast',
  'exceptionCaught',
  'ExceptionInfo',
  'Browser',
  'requestFullscreen',
  'requestFullScreen',
  'setCanvasSize',
  'getUserMedia',
  'createContext',
  'getPreloadedImageData__data',
  'wget',
  'MONTH_DAYS_REGULAR',
  'MONTH_DAYS_LEAP',
  'MONTH_DAYS_REGULAR_CUMULATIVE',
  'MONTH_DAYS_LEAP_CUMULATIVE',
  'base64Decode',
  'SYSCALLS',
  'preloadPlugins',
  'FS_stdin_getChar_buffer',
  'FS_unlink',
  'FS_createPath',
  'FS_createDevice',
  'FS_readFile',
  'FS',
  'FS_root',
  'FS_mounts',
  'FS_devices',
  'FS_streams',
  'FS_nextInode',
  'FS_nameTable',
  'FS_currentPath',
  'FS_initialized',
  'FS_ignorePermissions',
  'FS_filesystems',
  'FS_syncFSRequests',
  'FS_readFiles',
  'FS_lookupPath',
  'FS_getPath',
  'FS_hashName',
  'FS_hashAddNode',
  'FS_hashRemoveNode',
  'FS_lookupNode',
  'FS_createNode',
  'FS_destroyNode',
  'FS_isRoot',
  'FS_isMountpoint',
  'FS_isFile',
  'FS_isDir',
  'FS_isLink',
  'FS_isChrdev',
  'FS_isBlkdev',
  'FS_isFIFO',
  'FS_isSocket',
  'FS_flagsToPermissionString',
  'FS_nodePermissions',
  'FS_mayLookup',
  'FS_mayCreate',
  'FS_mayDelete',
  'FS_mayOpen',
  'FS_checkOpExists',
  'FS_nextfd',
  'FS_getStreamChecked',
  'FS_getStream',
  'FS_createStream',
  'FS_closeStream',
  'FS_dupStream',
  'FS_doSetAttr',
  'FS_chrdev_stream_ops',
  'FS_major',
  'FS_minor',
  'FS_makedev',
  'FS_registerDevice',
  'FS_getDevice',
  'FS_getMounts',
  'FS_syncfs',
  'FS_mount',
  'FS_unmount',
  'FS_lookup',
  'FS_mknod',
  'FS_statfs',
  'FS_statfsStream',
  'FS_statfsNode',
  'FS_create',
  'FS_mkdir',
  'FS_mkdev',
  'FS_symlink',
  'FS_rename',
  'FS_rmdir',
  'FS_readdir',
  'FS_readlink',
  'FS_stat',
  'FS_fstat',
  'FS_lstat',
  'FS_doChmod',
  'FS_chmod',
  'FS_lchmod',
  'FS_fchmod',
  'FS_doChown',
  'FS_chown',
  'FS_lchown',
  'FS_fchown',
  'FS_doTruncate',
  'FS_truncate',
  'FS_ftruncate',
  'FS_utime',
  'FS_open',
  'FS_close',
  'FS_isClosed',
  'FS_llseek',
  'FS_read',
  'FS_write',
  'FS_mmap',
  'FS_msync',
  'FS_ioctl',
  'FS_writeFile',
  'FS_cwd',
  'FS_chdir',
  'FS_createDefaultDirectories',
  'FS_createDefaultDevices',
  'FS_createSpecialDirectories',
  'FS_createStandardStreams',
  'FS_staticInit',
  'FS_init',
  'FS_quit',
  'FS_findObject',
  'FS_analyzePath',
  'FS_createFile',
  'FS_createDataFile',
  'FS_forceLoadFile',
  'FS_createLazyFile',
  'FS_absolutePath',
  'FS_createFolder',
  'FS_createLink',
  'FS_joinPath',
  'FS_mmapAlloc',
  'FS_standardizePath',
  'MEMFS',
  'TTY',
  'PIPEFS',
  'SOCKFS',
  'tempFixedLengthArray',
  'miniTempWebGLFloatBuffers',
  'miniTempWebGLIntBuffers',
  'GL',
  'AL',
  'GLUT',
  'EGL',
  'GLEW',
  'IDBStore',
  'SDL',
  'SDL_gfx',
  'allocateUTF8',
  'allocateUTF8OnStack',
  'print',
  'printErr',
  'jstoi_s',
];
unexportedSymbols.forEach(unexportedRuntimeSymbol);

  // End runtime exports
  // Begin JS library exports
  // End JS library exports

// end include: postlibrary.js

function checkIncomingModuleAPI() {
  ignoredModuleProp('fetchSettings');
}

// Imports from the Wasm binary.
var _wasm_parse_go = Module['_wasm_parse_go'] = makeInvalidEarlyAccess('_wasm_parse_go');
var _wasm_parse_position = Module['_wasm_parse_position'] = makeInvalidEarlyAccess('_wasm_parse_position');
var _create_chessboard = Module['_create_chessboard'] = makeInvalidEarlyAccess('_create_chessboard');
var _main = makeInvalidEarlyAccess('_main');
var _fflush = makeInvalidEarlyAccess('_fflush');
var _strerror = makeInvalidEarlyAccess('_strerror');
var _emscripten_stack_init = makeInvalidEarlyAccess('_emscripten_stack_init');
var _emscripten_stack_get_free = makeInvalidEarlyAccess('_emscripten_stack_get_free');
var _emscripten_stack_get_base = makeInvalidEarlyAccess('_emscripten_stack_get_base');
var _emscripten_stack_get_end = makeInvalidEarlyAccess('_emscripten_stack_get_end');
var __emscripten_stack_restore = makeInvalidEarlyAccess('__emscripten_stack_restore');
var __emscripten_stack_alloc = makeInvalidEarlyAccess('__emscripten_stack_alloc');
var _emscripten_stack_get_current = makeInvalidEarlyAccess('_emscripten_stack_get_current');
var ___set_stack_limits = Module['___set_stack_limits'] = makeInvalidEarlyAccess('___set_stack_limits');

function assignWasmExports(wasmExports) {
  Module['_wasm_parse_go'] = _wasm_parse_go = createExportWrapper('wasm_parse_go', 1);
  Module['_wasm_parse_position'] = _wasm_parse_position = createExportWrapper('wasm_parse_position', 1);
  Module['_create_chessboard'] = _create_chessboard = createExportWrapper('create_chessboard', 0);
  _main = createExportWrapper('main', 2);
  _fflush = createExportWrapper('fflush', 1);
  _strerror = createExportWrapper('strerror', 1);
  _emscripten_stack_init = wasmExports['emscripten_stack_init'];
  _emscripten_stack_get_free = wasmExports['emscripten_stack_get_free'];
  _emscripten_stack_get_base = wasmExports['emscripten_stack_get_base'];
  _emscripten_stack_get_end = wasmExports['emscripten_stack_get_end'];
  __emscripten_stack_restore = wasmExports['_emscripten_stack_restore'];
  __emscripten_stack_alloc = wasmExports['_emscripten_stack_alloc'];
  _emscripten_stack_get_current = wasmExports['emscripten_stack_get_current'];
  Module['___set_stack_limits'] = ___set_stack_limits = createExportWrapper('__set_stack_limits', 2);
}
var wasmImports = {
  /** @export */
  __cxa_throw: ___cxa_throw,
  /** @export */
  __handle_stack_overflow: ___handle_stack_overflow,
  /** @export */
  _abort_js: __abort_js,
  /** @export */
  _tzset_js: __tzset_js,
  /** @export */
  emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */
  environ_get: _environ_get,
  /** @export */
  environ_sizes_get: _environ_sizes_get,
  /** @export */
  fd_close: _fd_close,
  /** @export */
  fd_seek: _fd_seek,
  /** @export */
  fd_write: _fd_write
};


// include: postamble.js
// === Auto-generated postamble setup entry stuff ===

var calledRun;

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

function run() {

  stackCheckInit();

  preRun();

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    assert(!calledRun);
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    readyPromiseResolve?.(Module);
    Module['onRuntimeInitialized']?.();
    consumedModuleProp('onRuntimeInitialized');

    assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(() => {
      setTimeout(() => Module['setStatus'](''), 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
  checkStackCookie();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    flush_NO_FILESYSTEM();
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.');
    warnOnce('(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)');
  }
}

var wasmExports;

// In modularize mode the generated code is within a factory function so we
// can use await here (since it's not top-level-await).
wasmExports = await (createWasm());

run();

// end include: postamble.js

// include: postamble_modularize.js
// In MODULARIZE mode we wrap the generated code in a factory function
// and return either the Module itself, or a promise of the module.
//
// We assign to the `moduleRtn` global here and configure closure to see
// this as and extern so it won't get minified.

if (runtimeInitialized)  {
  moduleRtn = Module;
} else {
  // Set up the promise that indicates the Module is initialized
  moduleRtn = new Promise((resolve, reject) => {
    readyPromiseResolve = resolve;
    readyPromiseReject = reject;
  });
}

// Assertion for attempting to access module properties on the incoming
// moduleArg.  In the past we used this object as the prototype of the module
// and assigned properties to it, but now we return a distinct object.  This
// keeps the instance private until it is ready (i.e the promise has been
// resolved).
for (const prop of Object.keys(Module)) {
  if (!(prop in moduleArg)) {
    Object.defineProperty(moduleArg, prop, {
      configurable: true,
      get() {
        abort(`Access to module property ('${prop}') is no longer possible via the module constructor argument; Instead, use the result of the module constructor.`)
      }
    });
  }
}
// end include: postamble_modularize.js



  return moduleRtn;
}

// Export using a UMD style export, or ES6 exports if selected
export default createEngineModule;

