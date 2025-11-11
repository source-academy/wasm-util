// ------------------------ WASM Builder API ----------------------------

import {
  f32ConversionOp,
  f64ConversionOp,
  floatBinaryOp,
  floatComparisonOp,
  floatConversionOp,
  floatUnaryOp,
  i32ConversionOp,
  i64ConversionOp,
  intBinaryOp,
  intComparisonOp,
  intConversionOp,
  intTestOp,
  type WasmBinaryOp,
  type WasmBlock,
  type WasmBlockType,
  type WasmBr,
  type WasmBrTable,
  type WasmCall,
  type WasmComparisonOpFor,
  type WasmConversionOp,
  type WasmData,
  type WasmDrop,
  type WasmExport,
  type WasmFloatNumericType,
  type WasmFunction,
  type WasmFuncType,
  type WasmGlobal,
  type WasmGlobalFor,
  type WasmGlobalGet,
  type WasmGlobalSet,
  type WasmIf,
  type WasmImport,
  type WasmInstruction,
  type WasmIntNumericType,
  type WasmIntTestOp,
  type WasmLabel,
  type WasmLoadOpFor,
  type WasmLocalGet,
  type WasmLocals,
  type WasmLocalSet,
  type WasmLocalTee,
  type WasmLoop,
  type WasmMemoryCopy,
  type WasmModule,
  type WasmNumeric,
  type WasmNumericConst,
  type WasmNumericFor,
  type WasmNumericType,
  type WasmReturn,
  type WasmSelect,
  type WasmStoreOpFor,
  type WasmUnaryOp,
  type WasmUnreachable,
} from "./types.js";
import { typedFromEntries } from "./util.js";

const binaryOp = <
  T extends WasmNumericType,
  const Op extends ((
    | WasmBinaryOp<T>
    | WasmComparisonOpFor<T>
  )["op"] extends `${T}.${infer S}`
    ? S
    : never)[]
>(
  type: T,
  ops: Op
) =>
  typedFromEntries(
    ops.map((op) => {
      const fn = (left: WasmNumericFor<T>, right: WasmNumericFor<T>) => ({
        op: `${type}.${op}`,
        left,
        right,
      });
      return [op, fn];
    }) as {
      [K in keyof Op]: [
        Op[K],
        (
          ...args: Extract<WasmNumericFor<T>, { op: `${T}.${Op[K]}` }> extends {
            left: infer L;
            right: infer R;
          }
            ? [left: L, right: R]
            : never
        ) => Extract<WasmNumericFor<T>, { op: `${T}.${Op[K]}` }>
      ];
    }
  );

const unaryOp = <
  T extends WasmNumericType,
  const Op extends ((
    | WasmConversionOp<T>
    | (T extends WasmIntNumericType
        ? WasmIntTestOp<T>
        : T extends WasmFloatNumericType
        ? WasmUnaryOp<T>
        : never)
  )["op"] extends `${T}.${infer S}`
    ? S
    : never)[]
>(
  type: T,
  ops: Op
) =>
  typedFromEntries(
    ops.map((op) => {
      const fn = (right: WasmNumericFor<T>) => ({
        op: `${type}.${op}`,
        right,
      });
      return [op, fn];
    }) as {
      [K in keyof Op]: [
        Op[K],
        (
          ...args: Extract<WasmNumericFor<T>, { op: `${T}.${Op[K]}` }> extends {
            right: infer R;
          }
            ? [right: R]
            : never
        ) => Extract<WasmNumericFor<T>, { op: `${T}.${Op[K]}` }>
      ];
    }
  );

const i32Load = (address: WasmNumericFor<"i32">): WasmLoadOpFor<"i32"> => ({
  op: "i32.load",
  address,
});
const i32 = {
  const: (value: number | bigint): WasmNumericConst<"i32"> => ({
    op: "i32.const",
    value: BigInt(value),
  }),
  ...binaryOp("i32", [...intBinaryOp, ...intComparisonOp]),
  ...unaryOp("i32", [...i32ConversionOp, ...intConversionOp, ...intTestOp]),
  load: i32Load,
  load8_s: i32Load,
  load8_u: i32Load,
  load16_s: i32Load,
  load16_u: i32Load,
  store: (
    address: WasmNumericFor<"i32">,
    value: WasmNumericFor<"i32">
  ): WasmStoreOpFor<"i32"> => ({ op: "i32.store", address, value }),
};

const i64Load = (address: WasmNumericFor<"i32">): WasmLoadOpFor<"i64"> => ({
  op: "i64.load",
  address,
});
const i64 = {
  const: (value: number | bigint): WasmNumericConst<"i64"> => ({
    op: "i64.const",
    value: BigInt(value),
  }),
  ...binaryOp("i64", [...intBinaryOp, ...intComparisonOp]),
  ...unaryOp("i64", [...i64ConversionOp, ...intConversionOp, ...intTestOp]),
  load: i64Load,
  load8_s: i64Load,
  load8_u: i64Load,
  load16_s: i64Load,
  load16_u: i64Load,
  load32_s: i64Load,
  load32_u: i64Load,
  store: (
    address: WasmNumericFor<"i32">,
    value: WasmNumericFor<"i64">
  ): WasmStoreOpFor<"i64"> => ({ op: "i64.store", address, value }),
};

const f32 = {
  const: (value: number): WasmNumericConst<"f32"> => ({
    op: "f32.const",
    value,
  }),
  ...binaryOp("f32", [...floatBinaryOp, ...floatComparisonOp]),
  ...unaryOp("f32", [
    ...f32ConversionOp,
    ...floatConversionOp,
    ...floatUnaryOp,
  ]),
  load: (address: WasmNumericFor<"i32">): WasmLoadOpFor<"f32"> => ({
    op: "f32.load",
    address,
  }),
  store: (
    address: WasmNumericFor<"i32">,
    value: WasmNumericFor<"f32">
  ): WasmStoreOpFor<"f32"> => ({ op: "f32.store", address, value }),
};

const f64 = {
  const: (value: number): WasmNumericConst<"f64"> => ({
    op: "f64.const",
    value,
  }),
  ...binaryOp("f64", [...floatBinaryOp, ...floatComparisonOp]),
  ...unaryOp("f64", [
    ...f64ConversionOp,
    ...floatConversionOp,
    ...floatUnaryOp,
  ]),
  load: (address: WasmNumericFor<"i32">): WasmLoadOpFor<"f64"> => ({
    op: "f64.load",
    address,
  }),
  store: (
    address: WasmNumericFor<"i32">,
    value: WasmNumericFor<"f64">
  ): WasmStoreOpFor<"f64"> => ({ op: "f64.store", address, value }),
};

const local = {
  get: (label: WasmLabel): WasmLocalGet => ({ op: "local.get", label }),
  set: (label: WasmLabel, right: WasmNumeric): WasmLocalSet => ({
    op: "local.set",
    label,
    right,
  }),
  tee: (label: WasmLabel, right: WasmNumeric): WasmLocalTee => ({
    op: "local.tee",
    label,
    right,
  }),
};

const global = {
  get: (label: WasmLabel): WasmGlobalGet => ({ op: "global.get", label }),
  set: (label: WasmLabel, right: WasmNumeric): WasmGlobalSet => ({
    op: "global.set",
    label,
    right,
  }),
};

const memory = {
  copy: (
    destination: WasmNumericFor<"i32">,
    source: WasmNumericFor<"i32">,
    size: WasmNumericFor<"i32">
  ): WasmMemoryCopy => ({ op: "memory.copy", destination, source, size }),
};

type WasmBlockTypeHelper<T extends WasmBlock | WasmLoop> = {
  params(...params: WasmNumericType[]): WasmBlockTypeHelper<T>;
  results(...results: WasmNumericType[]): WasmBlockTypeHelper<T>;
  locals(...locals: WasmNumericType[]): WasmBlockTypeHelper<T>;

  body: (...instrs: WasmInstruction[]) => T;
};

type WasmIfBlockTypeHelper = {
  params(...params: WasmNumericType[]): WasmIfBlockTypeHelper;
  results(...results: WasmNumericType[]): WasmIfBlockTypeHelper;
  locals(...locals: WasmNumericType[]): WasmIfBlockTypeHelper;

  then: (...thenInstrs: WasmInstruction[]) => WasmIf & {
    else: (...elseInstrs: WasmInstruction[]) => WasmIf;
  };
};

type WasmFuncTypeHelper = {
  params: (params: WasmLocals) => WasmFuncTypeHelper;
  locals: (locals: WasmLocals) => WasmFuncTypeHelper;
  results: (...results: WasmNumericType[]) => WasmFuncTypeHelper;

  body: (...instrs: WasmInstruction[]) => WasmFunction;
};

type WasmModuleHelper = {
  imports: (...imports: WasmImport[]) => WasmModuleHelper;
  globals: (...globals: WasmGlobal[]) => WasmModuleHelper;
  datas: (...datas: WasmData[]) => WasmModuleHelper;
  funcs: (...funcs: WasmFunction[]) => WasmModuleHelper;
  startFunc: (startFunc: WasmLabel) => Omit<WasmModuleHelper, "startFunc">;
  exports: (...exports: WasmExport[]) => WasmModuleHelper;

  build: () => WasmModule;
};

const wasm = {
  block: (
    label?: WasmLabel,
    blockType: WasmBlockType = {
      paramTypes: [],
      resultTypes: [],
      localTypes: [],
    }
  ): WasmBlockTypeHelper<WasmBlock> => ({
    params: (...params) =>
      wasm.block(label, {
        ...blockType,
        paramTypes: [...blockType.paramTypes, ...params],
      }),
    locals: (...locals) =>
      wasm.block(label, {
        ...blockType,
        localTypes: [...(blockType.localTypes ?? []), ...locals],
      }),
    results: (...results) =>
      wasm.block(label, {
        ...blockType,
        resultTypes: [...blockType.resultTypes, ...results],
      }),

    body: (...instrs) => ({
      op: "block",
      label,
      blockType,
      body: instrs,
    }),
  }),
  loop: (
    label?: WasmLabel,
    blockType: WasmBlockType = {
      paramTypes: [],
      resultTypes: [],
      localTypes: [],
    }
  ): WasmBlockTypeHelper<WasmLoop> => ({
    params: (...params) =>
      wasm.loop(label, {
        ...blockType,
        paramTypes: [...blockType.paramTypes, ...params],
      }),
    locals: (...locals) =>
      wasm.loop(label, {
        ...blockType,
        localTypes: [...(blockType.localTypes ?? []), ...locals],
      }),
    results: (...results) =>
      wasm.loop(label, {
        ...blockType,
        resultTypes: [...blockType.resultTypes, ...results],
      }),

    body: (...instrs) => ({
      op: "loop",
      label,
      blockType,
      body: instrs,
    }),
  }),
  if: (
    predicate: WasmNumeric,
    label?: WasmLabel,
    blockType: WasmBlockType = {
      paramTypes: [],
      resultTypes: [],
      localTypes: [],
    }
  ): WasmIfBlockTypeHelper => ({
    params: (...params) =>
      wasm.if(predicate, label, {
        ...blockType,
        paramTypes: [...blockType.paramTypes, ...params],
      }),
    locals: (...locals) =>
      wasm.if(predicate, label, {
        ...blockType,
        localTypes: [...(blockType.localTypes ?? []), ...locals],
      }),
    results: (...results) =>
      wasm.if(predicate, label, {
        ...blockType,
        resultTypes: [...blockType.resultTypes, ...results],
      }),

    then: (...thenInstrs) => ({
      op: "if",
      predicate,
      label,
      blockType,
      thenBody: thenInstrs,

      else(...elseInstrs) {
        return { ...this, elseBody: elseInstrs };
      },
    }),
  }),
  drop: (value?: WasmInstruction): WasmDrop => ({ op: "drop", value }),
  unreachable: (): WasmUnreachable => ({ op: "unreachable" }),
  br: (label: WasmLabel): WasmBr => ({ op: "br", label }),
  br_table: (
    value: WasmNumeric,
    ...labels: (WasmLabel | number)[]
  ): WasmBrTable => ({
    op: "br_table",
    labels,
    value,
  }),
  call: (
    functionName: WasmLabel
  ): WasmCall & {
    args: (...args: WasmNumeric[]) => WasmCall;
  } => ({
    op: "call",
    function: functionName,
    arguments: [],
    args: (...args: WasmNumeric[]): WasmCall => ({
      op: "call",
      function: functionName,
      arguments: args,
    }),
  }),
  return: (...values: WasmNumeric[]): WasmReturn => ({ op: "return", values }),
  select: (
    first: WasmNumeric,
    second: WasmNumeric,
    condition: WasmNumeric
  ): WasmSelect => ({ op: "select", first, second, condition }),

  import: (moduleName: string, itemName: string) => ({
    memory: (initial: number, maximum?: number): WasmImport => ({
      op: "import",
      moduleName,
      itemName,
      externType: { type: "memory", limits: { initial, maximum } },
    }),

    func(
      name: WasmLabel,
      funcType: WasmBlockType = {
        paramTypes: [],
        resultTypes: [],
        localTypes: [],
      }
    ) {
      const importInstr: WasmImport = {
        op: "import",
        moduleName,
        itemName,
        externType: { type: "func", name, funcType },
      };

      return {
        ...importInstr,

        params: (...params: WasmNumericType[]) => ({
          ...importInstr,
          ...this.func(name, {
            ...funcType,
            paramTypes: [...funcType.paramTypes, ...params],
          }),
        }),

        locals: (...locals: WasmNumericType[]) => ({
          ...importInstr,
          ...this.func(name, {
            ...funcType,
            localTypes: [...(funcType.localTypes ?? []), ...locals],
          }),
        }),

        results: (...results: WasmNumericType[]) => ({
          ...importInstr,
          ...this.func(name, {
            ...funcType,
            resultTypes: [...funcType.resultTypes, ...results],
          }),
        }),
      };
    },
  }),

  global: <T extends WasmNumericType>(
    name: WasmLabel,
    valueType: T | `mut ${T}`
  ) => ({
    init: (initialValue: WasmNumericFor<T>): WasmGlobalFor<T> => ({
      op: "global",
      name,
      valueType,
      initialValue,
    }),
  }),

  func(
    name: WasmLabel,
    funcType: WasmFuncType = {
      paramTypes: {},
      resultTypes: [],
      localTypes: {},
    }
  ): WasmFuncTypeHelper {
    return {
      params: (params) =>
        this.func(name, {
          ...funcType,
          paramTypes: { ...funcType.paramTypes, ...params },
        }),
      locals: (locals) =>
        this.func(name, {
          ...funcType,
          localTypes: { ...funcType.localTypes, ...locals },
        }),
      results: (...results) =>
        this.func(name, {
          ...funcType,
          resultTypes: [...funcType.resultTypes, ...results],
        }),

      body: (...instrs) => ({ op: "func", name, funcType, body: instrs }),
    };
  },

  module(
    definitions: Omit<WasmModule, "op"> = {
      imports: [],
      globals: [],
      datas: [],
      funcs: [],
      startFunc: undefined,
      exports: [],
    }
  ): WasmModuleHelper {
    return {
      imports: (...imports) =>
        this.module({
          ...definitions,
          imports: [...definitions.imports, ...imports],
        }),
      globals: (...globals) =>
        this.module({
          ...definitions,
          globals: [...definitions.globals, ...globals],
        }),
      datas: (...datas) =>
        this.module({
          ...definitions,
          datas: [...definitions.datas, ...datas],
        }),
      funcs: (...funcs) =>
        this.module({
          ...definitions,
          funcs: [...definitions.funcs, ...funcs],
        }),
      startFunc: (startFunc) =>
        this.module({
          ...definitions,
          startFunc: {
            op: "start",
            functionName: startFunc,
          },
        }),
      exports: (...exports) =>
        this.module({
          ...definitions,
          exports: [...definitions.exports, ...exports],
        }),

      build: () => ({ op: "module", ...definitions }),
    };
  },

  // not a WASM instruction, but a helper to build br_table with blocks
  buildBrTableBlocks: (
    { labels, value }: WasmBrTable,
    ...bodies: WasmInstruction[][]
  ) => {
    if (labels.length !== bodies.length) {
      throw new Error(
        `Number of labels in br_table (${labels.length}) does not match number of blocks (${bodies.length})`
      );
    }

    const buildBlock = (index: number): [WasmBlock, ...WasmInstruction[]] => [
      wasm
        .block(typeof labels[index] === "string" ? labels[index] : undefined)
        .body(
          ...(index === labels.length - 1
            ? [wasm.br_table(value, ...labels)]
            : buildBlock(index + 1))
        ),
      ...(bodies[index] ?? []),
    ];

    return buildBlock(0);
  },
};

// This maps all WASM instructions to a visitor method name that will
// be used in the interface for the watGenerator

const instrToMethodMap = {
  // numerics
  "i64.const": "visitConstOp",
  "f32.const": "visitConstOp",
  "i32.const": "visitConstOp",
  "f64.const": "visitConstOp",

  // numerics: binary ops and comparisons
  ...typedFromEntries(
    [...intBinaryOp, ...intComparisonOp].map(
      (op) => [`i32.${op}`, "visitBinaryOp"] as const
    )
  ),
  ...typedFromEntries(
    [...intBinaryOp, ...intComparisonOp].map(
      (op) => [`i64.${op}`, "visitBinaryOp"] as const
    )
  ),
  ...typedFromEntries(
    [...floatBinaryOp, ...floatComparisonOp].map(
      (op) => [`f32.${op}`, "visitBinaryOp"] as const
    )
  ),
  ...typedFromEntries(
    [...floatBinaryOp, ...floatComparisonOp].map(
      (op) => [`f64.${op}`, "visitBinaryOp"] as const
    )
  ),

  ...typedFromEntries(
    [...i32ConversionOp, ...intConversionOp, ...intTestOp].map(
      (op) => [`i32.${op}`, "visitUnaryOp"] as const
    )
  ),
  ...typedFromEntries(
    [...i64ConversionOp, ...intConversionOp, ...intTestOp].map(
      (op) => [`i64.${op}`, "visitUnaryOp"] as const
    )
  ),
  ...typedFromEntries(
    [...f32ConversionOp, ...floatConversionOp, ...floatUnaryOp].map(
      (op) => [`f32.${op}`, "visitUnaryOp"] as const
    )
  ),
  ...typedFromEntries(
    [...f64ConversionOp, ...floatConversionOp, ...floatUnaryOp].map(
      (op) => [`f64.${op}`, "visitUnaryOp"] as const
    )
  ),

  // memory
  "i32.load": "visitLoadOp",
  "i64.load": "visitLoadOp",
  "f32.load": "visitLoadOp",
  "f64.load": "visitLoadOp",
  "i32.load8_s": "visitLoadOp",
  "i32.load8_u": "visitLoadOp",
  "i32.load16_s": "visitLoadOp",
  "i32.load16_u": "visitLoadOp",
  "i64.load8_s": "visitLoadOp",
  "i64.load8_u": "visitLoadOp",
  "i64.load16_s": "visitLoadOp",
  "i64.load16_u": "visitLoadOp",
  "i64.load32_s": "visitLoadOp",
  "i64.load32_u": "visitLoadOp",

  "i32.store": "visitStoreOp",
  "i64.store": "visitStoreOp",
  "f32.store": "visitStoreOp",
  "f64.store": "visitStoreOp",

  "memory.copy": "visitMemoryCopyOp",

  // control
  block: "visitBlockOp",
  loop: "visitLoopOp",
  if: "visitIfOp",
  unreachable: "visitUnreachableOp",
  drop: "visitDropOp",
  br: "visitBrOp",
  br_table: "visitBrTableOp",
  call: "visitCallOp",
  return: "visitReturnOp",
  select: "visitSelectOp",

  // variables
  "local.get": "visitVariableGetOp",
  "global.get": "visitVariableGetOp",
  "local.set": "visitVariableSetOp",
  "global.set": "visitVariableSetOp",
  "local.tee": "visitVariableSetOp",

  // module
  import: "visitImportOp",
  global: "visitGlobalOp",
  data: "visitDataOp",
  func: "visitFuncOp",
  export: "visitExportOp",
  start: "visitStartOp",
  module: "visitModuleOp",
} as const satisfies Record<WasmInstruction["op"], string>;

// ------------------------ WASM Visitor Interface ----------------------------

// This collects all the visitor method names (the values in the above object)
// and maps it to an actual method which takes as argument the specific
// WasmInstruction type corresponding to the instructino string, and returns
// the WAT string.
// Expection: For WasmNumeric unary and binary operations, since there are
// so many specific WasmInstruction types, we generalise them.

type WatVisitor = {
  [K in keyof typeof instrToMethodMap as (typeof instrToMethodMap)[K]]: (
    instruction: (typeof instrToMethodMap)[K] extends "visitUnaryOp"
      ? { op: string; right: WasmInstruction }
      : (typeof instrToMethodMap)[K] extends "visitBinaryOp"
      ? { op: string; left: WasmInstruction; right: WasmInstruction }
      : Extract<WasmInstruction, { op: K }>
  ) => string;
};

export {
  f32,
  f64,
  global,
  i32,
  i64,
  instrToMethodMap,
  local,
  memory,
  wasm,
  type WatVisitor,
};
