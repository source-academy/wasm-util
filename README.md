# wasm-util
wasm-util is a TypeScript library which provides a fluent, programmatic API for generating WebAssembly Text (WAT) code. 

It is designed to make building, manipulating, and emitting WAT strings more intuitive and type-safe as compared to concatenating and building WAT strings by hand. Using the API will produce a WAT IR, which can then be transformed into the final WAT string with a visitor generator which comes with wasm-util.

Originally developed for the Source Academy `py-slang` WebAssembly compiler, wasm-util is repurposed as a separate package.

## Installation
```
npm install
```

## Architecture

wasm-util follows a two-phase architecture:

1. **Builder API → IR**: The fluent API constructs a typed WebAssembly Intermediate Representation (IR).

2. **IR → WAT**: The `WatGenerator` visitor traverses the IR and emits a valid WAT string.

## API Overview
| Category               | Methods / Properties                                                                            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Numeric Types**      | `i32`, `i64`, `f32`, `f64`                                                                      | Builders for numeric instructions and constants.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Memory**             | `memory.copy()`, `i32.load()`, `f64.store()`, `i32.load8_u()`, and other narrow load operations | Memory operations for load, store, and copy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Variables**          | `local.get()`, `local.set()`, `local.tee()`, `global.get()`, `global.set()`                     | Access and mutate local/global variables.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Control (Direct)**   | `unreachable`, `drop`, `nop`, `br`, `br_table`, `return`, `select`, `call`                      | These control instructions can be used directly with the API with the `wasm` prefix. For example: `wasm.unreachable()` generates the WebAssembly instruction `unreachable`.                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Control (Indirect)** | `call`, `block`, `loop`, `if`                                                                   | These control instructions must be followed with futher method calls for additional details. <br/> `wasm.block()` and `wasm.loop()` must be followed with `body()`. <br/>  `wasm.if()` must be followed by `then()`, and optionally by `else()`. <br/> All three of the above instrctions can be followed by `params()`, `results()`, or `locals()` to add a block type to the generated WebAssembly. <br/><br/> `wasm.call()` appears in both categories. If used by itself, it generates a call instruction with no arguments. If arguments are to be provided, follow it with `args()`. |
| **Module**             | `module`, `import`, `global`, `data`, `func`, `export`, `start`                                 | `wasm.module()` should be followed by any number of `import()`, `global()`, `data()`, `func()`, `export()`, and `start()` calls to add the respective components to the module. To finalise the module, call `build()`. Mutable globals can be typed with `mut.i32`, for example.                                                                                                                                                                                                                                                                                                                                                                    |
| **Function**           | `func`, `params`, `result`, `local`, `body`                                                     | `wasm.func()` should be followed by any number of `params()`, `result()`, and `local()` calls to add the respective components to the function. To add the function body, call `body()`.                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Utility**            | `wasm.buildBrTableBlocks()`                                                                     | Helper for constructing `br_table` instruction trees.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |


There is also a `wasm.raw()` method which can be used to insert raw WAT strings into the IR. This is useful for instructions or features which are not yet supported by the builder API, but should be used with caution as it bypasses type safety.

## Example Usage
```typescript
i32.add(i32.const(0), i32.const(3));
// Compiles to (i32.add (i32.const 0) (i32.const 3))

i32.add(i32.const(0), f64.const(3));
// Will give a TypeScript error

i32.add(i32.reinterpret_f32(f32.const(0)), i32.const(3))
// Handles type transformations correctly

wasm.raw`
  (i32.add
    (i32.const 0)
    (i32.const 3)
  )
`;
// Used to insert raw WAT strings directly into the IR, bypassing type safety. Can be used with map as well:
wasm.raw`
  ${[0, 1, 2].map((n) => wasm.raw`(i32.const ${n})`)}
`
```

### A more complex example
Input:
```typescript
wasm
  .func("$func")
  .params({ $x: i32, $y: i32 })
  .result(i32)
  .body(
    wasm.return(
      i32.add(
        local.get("$x"),
        local.get("$y")
      )
    )
  );
```

Output:
```webassembly
(func $func (param $x i32) (param $y i32) (result i32)
  (return
    (i32.add
      (local.get $x)
      (local.get $y)
    )
  )
)
```

### Generating WAT string
```typescript
import { i32, local, wasm, WatGenerator } from "wasm-util";

const fx = wasm
  .func("$func")
  .params({ $x: i32, $y: i32 })
  .result(i32)
  .body(
    wasm.return(
      i32.add(
        local.get("$x"),
        local.get("$y")
      )
    )
  );

const generator = new WatGenerator();
const wat = generator.visit(fx);
```

### Full Wasm Module
```typescript
const module = wasm
  .module()
  .funcs(
    wasm
      .func("$add")
      .params({ $x: i32, $y: i32 })
      .results(i32)
      .body(
        wasm.return(
          i32.add(
            local.get("$x"),
            local.get("$y")
          )
        )
      )
  )
  .exports(
    wasm.export("add").func("$add")
  )
  .build();

const generator = new WatGenerator();
console.log(generator.visit(module));
```
