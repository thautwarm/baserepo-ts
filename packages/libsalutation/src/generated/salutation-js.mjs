class IdrisError extends Error { }

function __prim_js2idris_array(x){
  let acc = { h:0 };

  for (let i = x.length-1; i>=0; i--) {
      acc = { a1:x[i], a2:acc };
  }
  return acc;
}

function __prim_idris2js_array(x){
  const result = Array();
  while (x.h === undefined) {
    result.push(x.a1); x = x.a2;
  }
  return result;
}

function __lazy(thunk) {
  let res;
  return function () {
    if (thunk === undefined) return res;
    res = thunk();
    thunk = undefined;
    return res;
  };
};

function __prim_stringIteratorNew(_str) {
  return 0
}

function __prim_stringIteratorToString(_, str, it, f) {
  return f(str.slice(it))
}

function __prim_stringIteratorNext(str, it) {
  if (it >= str.length)
    return {h: 0};
  else
    return {a1: str.charAt(it), a2: it + 1};
}

function __tailRec(f,ini) {
  let obj = ini;
  while(true){
    switch(obj.h){
      case 0: return obj.a1;
      default: obj = f(obj);
    }
  }
}

const _idrisworld = Symbol('idrisworld')

const _crashExp = x=>{throw new IdrisError(x)}

const _bigIntOfString = s=> {
  try {
    const idx = s.indexOf('.')
    return idx === -1 ? BigInt(s) : BigInt(s.slice(0, idx))
  } catch (e) { return 0n }
}

const _numberOfString = s=> {
  try {
    const res = Number(s);
    return isNaN(res) ? 0 : res;
  } catch (e) { return 0 }
}

const _intOfString = s=> Math.trunc(_numberOfString(s))

const _truncToChar = x=> String.fromCodePoint(
  (x >= 0 && x <= 55295) || (x >= 57344 && x <= 1114111) ? x : 0
)

// Int8
const _truncInt8 = x => {
  const res = x & 0xff;
  return res >= 0x80 ? res - 0x100 : res;
}

const _truncBigInt8 = x => Number(BigInt.asIntN(8, x))

// Euclidian Division
const _div = (a,b) => {
  const q = Math.trunc(a / b)
  const r = a % b
  return r < 0 ? (b > 0 ? q - 1 : q + 1) : q
}

const _divBigInt = (a,b) => {
  const q = a / b
  const r = a % b
  return r < 0n ? (b > 0n ? q - 1n : q + 1n) : q
}

// Euclidian Modulo
const _mod = (a,b) => {
  const r = a % b
  return r < 0 ? (b > 0 ? r + b : r - b) : r
}

const _modBigInt = (a,b) => {
  const r = a % b
  return r < 0n ? (b > 0n ? r + b : r - b) : r
}

const _add8s = (a,b) => _truncInt8(a + b)
const _sub8s = (a,b) => _truncInt8(a - b)
const _mul8s = (a,b) => _truncInt8(a * b)
const _div8s = (a,b) => _truncInt8(_div(a,b))
const _shl8s = (a,b) => _truncInt8(a << b)
const _shr8s = (a,b) => _truncInt8(a >> b)

// Int16
const _truncInt16 = x => {
  const res = x & 0xffff;
  return res >= 0x8000 ? res - 0x10000 : res;
}

const _truncBigInt16 = x => Number(BigInt.asIntN(16, x))

const _add16s = (a,b) => _truncInt16(a + b)
const _sub16s = (a,b) => _truncInt16(a - b)
const _mul16s = (a,b) => _truncInt16(a * b)
const _div16s = (a,b) => _truncInt16(_div(a,b))
const _shl16s = (a,b) => _truncInt16(a << b)
const _shr16s = (a,b) => _truncInt16(a >> b)

//Int32
const _truncInt32 = x => x & 0xffffffff

const _truncBigInt32 = x => Number(BigInt.asIntN(32, x))

const _add32s = (a,b) => _truncInt32(a + b)
const _sub32s = (a,b) => _truncInt32(a - b)
const _div32s = (a,b) => _truncInt32(_div(a,b))

const _mul32s = (a,b) => {
  const res = a * b;
  if (res <= Number.MIN_SAFE_INTEGER || res >= Number.MAX_SAFE_INTEGER) {
    return _truncInt32((a & 0xffff) * b + (b & 0xffff) * (a & 0xffff0000))
  } else {
    return _truncInt32(res)
  }
}

//Int64
const _truncBigInt64 = x => BigInt.asIntN(64, x)

const _add64s = (a,b) => _truncBigInt64(a + b)
const _sub64s = (a,b) => _truncBigInt64(a - b)
const _mul64s = (a,b) => _truncBigInt64(a * b)
const _shl64s = (a,b) => _truncBigInt64(a << b)
const _div64s = (a,b) => _truncBigInt64(_divBigInt(a,b))
const _shr64s = (a,b) => _truncBigInt64(a >> b)

//Bits8
const _truncUInt8 = x => x & 0xff

const _truncUBigInt8 = x => Number(BigInt.asUintN(8, x))

const _add8u = (a,b) => (a + b) & 0xff
const _sub8u = (a,b) => (a - b) & 0xff
const _mul8u = (a,b) => (a * b) & 0xff
const _div8u = (a,b) => Math.trunc(a / b)
const _shl8u = (a,b) => (a << b) & 0xff
const _shr8u = (a,b) => (a >> b) & 0xff

//Bits16
const _truncUInt16 = x => x & 0xffff

const _truncUBigInt16 = x => Number(BigInt.asUintN(16, x))

const _add16u = (a,b) => (a + b) & 0xffff
const _sub16u = (a,b) => (a - b) & 0xffff
const _mul16u = (a,b) => (a * b) & 0xffff
const _div16u = (a,b) => Math.trunc(a / b)
const _shl16u = (a,b) => (a << b) & 0xffff
const _shr16u = (a,b) => (a >> b) & 0xffff

//Bits32
const _truncUBigInt32 = x => Number(BigInt.asUintN(32, x))

const _truncUInt32 = x => {
  const res = x & -1;
  return res < 0 ? res + 0x100000000 : res;
}

const _add32u = (a,b) => _truncUInt32(a + b)
const _sub32u = (a,b) => _truncUInt32(a - b)
const _mul32u = (a,b) => _truncUInt32(_mul32s(a,b))
const _div32u = (a,b) => Math.trunc(a / b)

const _shl32u = (a,b) => _truncUInt32(a << b)
const _shr32u = (a,b) => _truncUInt32(a <= 0x7fffffff ? a >> b : (b == 0 ? a : (a >> b) ^ ((-0x80000000) >> (b-1))))
const _and32u = (a,b) => _truncUInt32(a & b)
const _or32u = (a,b)  => _truncUInt32(a | b)
const _xor32u = (a,b) => _truncUInt32(a ^ b)

//Bits64
const _truncUBigInt64 = x => BigInt.asUintN(64, x)

const _add64u = (a,b) => BigInt.asUintN(64, a + b)
const _mul64u = (a,b) => BigInt.asUintN(64, a * b)
const _div64u = (a,b) => a / b
const _shl64u = (a,b) => BigInt.asUintN(64, a << b)
const _shr64u = (a,b) => BigInt.asUintN(64, a >> b)
const _sub64u = (a,b) => BigInt.asUintN(64, a - b)

//String
const _strReverse = x => x.split('').reverse().join('')

const _substr = (o,l,x) => x.slice(o, o + l)

const Main_register = ( exchange => { globalThis[Symbol.for('monorepo.salutation')] = { exchange }; });
const Main_raise = ( message => { throw new Error(message); });
const Prelude_Types_fastUnpack = ((str)=>__prim_js2idris_array(Array.from(str)));
const Prelude_Types_fastPack = ((xs)=>__prim_idris2js_array(xs).join(''));
const Prelude_Types_fastConcat = ((xs)=>__prim_idris2js_array(xs).join(''));
const JSON_Parser_jdouble = ((s) => Number(s));
const JSON_Parser_codeUnit = ( n => String.fromCharCode(n));
const Data_Buffer_Core_prim__newBuf = ((s,w)=>new Uint8Array(Number(s)));
const Data_Buffer_Core_prim__getString = ((buf,offset,len)=> new TextDecoder().decode(buf.subarray(Number(offset), Number(offset+len))));
const Data_Buffer_Core_prim__getByteOffset = ((buf,at,offset)=>buf[Number(offset) + Number(at)]);
const Data_Buffer_Core_prim__getByte = ((buf,offset)=>buf[Number(offset)]);
const Data_Buffer_Core_prim__fromString = ((v)=> new TextEncoder().encode(v));
const Data_Buffer_Core_prim__copy = ((b1,bo1,blen,b2,bo2,t)=> {const o1 = Number(bo1); const len = Number(blen); const o2 = Number(bo2); for (let i = 0; i < len; i++) {b2[o2+i] = b1[o1+i];}; return t});
const Data_Buffer_stringByteLength = ((string)=>new TextEncoder().encode(string).length);
const Data_Array_Core_prim__newArray = ((bi,x,w) => Array(Number(bi)).fill(x));
const Data_Array_Core_prim__copyArray = ((b1,bo1,blen,b2,bo2,t)=> {const o1 = Number(bo1); const len = Number(blen); const o2 = Number(bo2); for (let i = 0; i < len; i++) {b2[o2+i] = b1[o1+i];}; return t});
const Data_Array_Core_prim__arraySet = ((x,bi,w) => {const i = Number(bi); x[i] = w});
const Data_Array_Core_prim__arrayGet = ((x,bi) => x[Number(bi)]);
const Text_ILex_Parser_prim__newMachine = ((i,x,w) => Array(i).fill(x));
const Text_ILex_Parser_prim__machineSet = ((x,i,w) => {x[i] = w});
const Text_ILex_Parser_prim__machineGet = ((x,bi) => x[bi]);
/* {$tcOpt:1} */
function x24tcOpt_1($0) {
 switch($0.a3.h) {
  case undefined: /* cons */ {
   switch($0.a3.a2.h) {
    case undefined: /* cons */ {
     switch($0.a4.h) {
      case undefined: /* cons */ return {h: 1 /* {TcContinue1:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3.a2.a2, a4: $0.a4.a2, a5: $a => $0.a5({a1: $0.a4.a1, a2: $a})};
      default: return {h: 0 /* {TcDone:1} */, a1: {a1: $0.a4, a2: $0.a5({h: 0})}};
     }
    }
    default: return {h: 0 /* {TcDone:1} */, a1: {a1: $0.a4, a2: $0.a5({h: 0})}};
   }
  }
  default: return {h: 0 /* {TcDone:1} */, a1: {a1: $0.a4, a2: $0.a5({h: 0})}};
 }
}

/* Data.List.7787:8509:splitRec */
function Data_List_n__7787_8509_splitRec($0, $1, $2, $3, $4) {
 return __tailRec(x24tcOpt_1, {h: 1 /* {TcContinue1:1} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4});
}

/* {$tcOpt:2} */
function x24tcOpt_2($0) {
 switch($0.a4.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:2} */, a1: $0.a3};
  case undefined: /* cons */ {
   switch($0.a4.a2.h) {
    case 0: /* nil */ return {h: 0 /* {TcDone:2} */, a1: ($0.a3+$0.a1.a1($0.a4.a1))};
    default: return {h: 1 /* {TcContinue2:1} */, a1: $0.a1, a2: $0.a2, a3: ($0.a3+($0.a1.a1($0.a4.a1)+', ')), a4: $0.a4.a2};
   }
  }
 }
}

/* Prelude.Show.3215:12599:show' */
function Prelude_Show_n__3215_12599_showx27($0, $1, $2, $3) {
 return __tailRec(x24tcOpt_2, {h: 1 /* {TcContinue2:1} */, a1: $0, a2: $1, a3: $2, a4: $3});
}

/* {$tcOpt:3} */
function x24tcOpt_3($0) {
 switch($0.a5.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:3} */, a1: $0.a4};
  default: {
   switch($0.a3) {
    case 1: {
     switch($0.a5.h) {
      case undefined: /* cons */ return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: {a1: $0.a4, a2: $0.a5.a1}, a5: $0.a5.a2};
      default: {
       switch($0.a2) {
        case 1: {
         switch($0.a3) {
          case 0: {
           switch($0.a5.h) {
            case undefined: /* cons */ {
             switch($0.a5.a1) {
              case '\u{5c}': return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: 1, a3: 1, a4: {a1: $0.a4, a2: '\u{5c}'}, a5: $0.a5.a2};
              default: {
               switch($0.a5.a1) {
                case '\"': {
                 let $1b;
                 switch($0.a2) {
                  case 1: {
                   $1b = 0;
                   break;
                  }
                  case 0: {
                   $1b = 1;
                   break;
                  }
                 }
                 return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $1b, a3: 0, a4: {a1: $0.a4, a2: '\"'}, a5: $0.a5.a2};
                }
                default: {
                 const $22 = BigInt($0.a5.a1.codePointAt(0));
                 let $24;
                 switch($0.a2) {
                  case 1: {
                   switch(Prelude_EqOrd_x3ex3d_Ord_Integer($22, 55296n)) {
                    case 1: {
                     $24 = Prelude_EqOrd_x3cx3d_Ord_Integer($22, 57343n);
                     break;
                    }
                    case 0: {
                     $24 = 0;
                     break;
                    }
                   }
                   break;
                  }
                  case 0: {
                   $24 = 0;
                   break;
                  }
                 }
                 switch($24) {
                  case 1: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: JSON_Parser_escape($0.a4, $0.a5.a1), a5: $0.a5.a2};
                  case 0: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: {a1: $0.a4, a2: $0.a5.a1}, a5: $0.a5.a2};
                 }
                }
               }
              }
             }
            }
            default: {
             switch($0.a5.a1) {
              case '\"': {
               let $3f;
               switch($0.a2) {
                case 1: {
                 $3f = 0;
                 break;
                }
                case 0: {
                 $3f = 1;
                 break;
                }
               }
               return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $3f, a3: 0, a4: {a1: $0.a4, a2: '\"'}, a5: $0.a5.a2};
              }
              default: {
               const $46 = BigInt($0.a5.a1.codePointAt(0));
               let $48;
               switch($0.a2) {
                case 1: {
                 switch(Prelude_EqOrd_x3ex3d_Ord_Integer($46, 55296n)) {
                  case 1: {
                   $48 = Prelude_EqOrd_x3cx3d_Ord_Integer($46, 57343n);
                   break;
                  }
                  case 0: {
                   $48 = 0;
                   break;
                  }
                 }
                 break;
                }
                case 0: {
                 $48 = 0;
                 break;
                }
               }
               switch($48) {
                case 1: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: JSON_Parser_escape($0.a4, $0.a5.a1), a5: $0.a5.a2};
                case 0: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: {a1: $0.a4, a2: $0.a5.a1}, a5: $0.a5.a2};
               }
              }
             }
            }
           }
          }
          default: {
           switch($0.a5.a1) {
            case '\"': {
             let $63;
             switch($0.a2) {
              case 1: {
               $63 = 0;
               break;
              }
              case 0: {
               $63 = 1;
               break;
              }
             }
             return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $63, a3: 0, a4: {a1: $0.a4, a2: '\"'}, a5: $0.a5.a2};
            }
            default: {
             const $6a = BigInt($0.a5.a1.codePointAt(0));
             let $6c;
             switch($0.a2) {
              case 1: {
               switch(Prelude_EqOrd_x3ex3d_Ord_Integer($6a, 55296n)) {
                case 1: {
                 $6c = Prelude_EqOrd_x3cx3d_Ord_Integer($6a, 57343n);
                 break;
                }
                case 0: {
                 $6c = 0;
                 break;
                }
               }
               break;
              }
              case 0: {
               $6c = 0;
               break;
              }
             }
             switch($6c) {
              case 1: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: JSON_Parser_escape($0.a4, $0.a5.a1), a5: $0.a5.a2};
              case 0: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: {a1: $0.a4, a2: $0.a5.a1}, a5: $0.a5.a2};
             }
            }
           }
          }
         }
        }
        default: {
         switch($0.a5.a1) {
          case '\"': {
           let $87;
           switch($0.a2) {
            case 1: {
             $87 = 0;
             break;
            }
            case 0: {
             $87 = 1;
             break;
            }
           }
           return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $87, a3: 0, a4: {a1: $0.a4, a2: '\"'}, a5: $0.a5.a2};
          }
          default: {
           const $8e = BigInt($0.a5.a1.codePointAt(0));
           let $90;
           switch($0.a2) {
            case 1: {
             switch(Prelude_EqOrd_x3ex3d_Ord_Integer($8e, 55296n)) {
              case 1: {
               $90 = Prelude_EqOrd_x3cx3d_Ord_Integer($8e, 57343n);
               break;
              }
              case 0: {
               $90 = 0;
               break;
              }
             }
             break;
            }
            case 0: {
             $90 = 0;
             break;
            }
           }
           switch($90) {
            case 1: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: JSON_Parser_escape($0.a4, $0.a5.a1), a5: $0.a5.a2};
            case 0: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: {a1: $0.a4, a2: $0.a5.a1}, a5: $0.a5.a2};
           }
          }
         }
        }
       }
      }
     }
    }
    default: {
     switch($0.a2) {
      case 1: {
       switch($0.a3) {
        case 0: {
         switch($0.a5.h) {
          case undefined: /* cons */ {
           switch($0.a5.a1) {
            case '\u{5c}': return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: 1, a3: 1, a4: {a1: $0.a4, a2: '\u{5c}'}, a5: $0.a5.a2};
            default: {
             switch($0.a5.a1) {
              case '\"': {
               let $b6;
               switch($0.a2) {
                case 1: {
                 $b6 = 0;
                 break;
                }
                case 0: {
                 $b6 = 1;
                 break;
                }
               }
               return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $b6, a3: 0, a4: {a1: $0.a4, a2: '\"'}, a5: $0.a5.a2};
              }
              default: {
               const $bd = BigInt($0.a5.a1.codePointAt(0));
               let $bf;
               switch($0.a2) {
                case 1: {
                 switch(Prelude_EqOrd_x3ex3d_Ord_Integer($bd, 55296n)) {
                  case 1: {
                   $bf = Prelude_EqOrd_x3cx3d_Ord_Integer($bd, 57343n);
                   break;
                  }
                  case 0: {
                   $bf = 0;
                   break;
                  }
                 }
                 break;
                }
                case 0: {
                 $bf = 0;
                 break;
                }
               }
               switch($bf) {
                case 1: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: JSON_Parser_escape($0.a4, $0.a5.a1), a5: $0.a5.a2};
                case 0: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: {a1: $0.a4, a2: $0.a5.a1}, a5: $0.a5.a2};
               }
              }
             }
            }
           }
          }
          default: {
           switch($0.a5.a1) {
            case '\"': {
             let $da;
             switch($0.a2) {
              case 1: {
               $da = 0;
               break;
              }
              case 0: {
               $da = 1;
               break;
              }
             }
             return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $da, a3: 0, a4: {a1: $0.a4, a2: '\"'}, a5: $0.a5.a2};
            }
            default: {
             const $e1 = BigInt($0.a5.a1.codePointAt(0));
             let $e3;
             switch($0.a2) {
              case 1: {
               switch(Prelude_EqOrd_x3ex3d_Ord_Integer($e1, 55296n)) {
                case 1: {
                 $e3 = Prelude_EqOrd_x3cx3d_Ord_Integer($e1, 57343n);
                 break;
                }
                case 0: {
                 $e3 = 0;
                 break;
                }
               }
               break;
              }
              case 0: {
               $e3 = 0;
               break;
              }
             }
             switch($e3) {
              case 1: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: JSON_Parser_escape($0.a4, $0.a5.a1), a5: $0.a5.a2};
              case 0: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: {a1: $0.a4, a2: $0.a5.a1}, a5: $0.a5.a2};
             }
            }
           }
          }
         }
        }
        default: {
         switch($0.a5.a1) {
          case '\"': {
           let $fe;
           switch($0.a2) {
            case 1: {
             $fe = 0;
             break;
            }
            case 0: {
             $fe = 1;
             break;
            }
           }
           return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $fe, a3: 0, a4: {a1: $0.a4, a2: '\"'}, a5: $0.a5.a2};
          }
          default: {
           const $105 = BigInt($0.a5.a1.codePointAt(0));
           let $107;
           switch($0.a2) {
            case 1: {
             switch(Prelude_EqOrd_x3ex3d_Ord_Integer($105, 55296n)) {
              case 1: {
               $107 = Prelude_EqOrd_x3cx3d_Ord_Integer($105, 57343n);
               break;
              }
              case 0: {
               $107 = 0;
               break;
              }
             }
             break;
            }
            case 0: {
             $107 = 0;
             break;
            }
           }
           switch($107) {
            case 1: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: JSON_Parser_escape($0.a4, $0.a5.a1), a5: $0.a5.a2};
            case 0: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: {a1: $0.a4, a2: $0.a5.a1}, a5: $0.a5.a2};
           }
          }
         }
        }
       }
      }
      default: {
       switch($0.a5.a1) {
        case '\"': {
         let $122;
         switch($0.a2) {
          case 1: {
           $122 = 0;
           break;
          }
          case 0: {
           $122 = 1;
           break;
          }
         }
         return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $122, a3: 0, a4: {a1: $0.a4, a2: '\"'}, a5: $0.a5.a2};
        }
        default: {
         const $129 = BigInt($0.a5.a1.codePointAt(0));
         let $12b;
         switch($0.a2) {
          case 1: {
           switch(Prelude_EqOrd_x3ex3d_Ord_Integer($129, 55296n)) {
            case 1: {
             $12b = Prelude_EqOrd_x3cx3d_Ord_Integer($129, 57343n);
             break;
            }
            case 0: {
             $12b = 0;
             break;
            }
           }
           break;
          }
          case 0: {
           $12b = 0;
           break;
          }
         }
         switch($12b) {
          case 1: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: JSON_Parser_escape($0.a4, $0.a5.a1), a5: $0.a5.a2};
          case 0: return {h: 1 /* {TcContinue3:1} */, a1: $0.a1, a2: $0.a2, a3: 0, a4: {a1: $0.a4, a2: $0.a5.a1}, a5: $0.a5.a2};
         }
        }
       }
      }
     }
    }
   }
  }
 }
}

/* JSON.Parser.15796:9018:go */
function JSON_Parser_n__15796_9018_go($0, $1, $2, $3, $4) {
 return __tailRec(x24tcOpt_3, {h: 1 /* {TcContinue3:1} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4});
}

/* {$tcOpt:4} */
function x24tcOpt_4($0) {
 switch($0.a4.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:4} */, a1: $4 => $0.a5};
  case undefined: /* cons */ {
   const $6 = Data_Array_Index_tryNatToFin($0.a3, $0.a4.a1.a1);
   switch($6.h) {
    case undefined: /* just */ {
     const $a = $b => {
      const $c = Data_Array_Core_prim__arraySet($0.a5, $6.a1, $0.a4.a1.a2, $b);
      return Data_Array_Indexed_n__5823_9221_go($0.a1, $0.a2, $0.a3, $0.a4.a2, $0.a5)(undefined);
     };
     return {h: 0 /* {TcDone:4} */, a1: $a};
    }
    case 0: /* nothing */ return {h: 1 /* {TcContinue4:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4.a2, a5: $0.a5};
   }
  }
 }
}

/* Data.Array.Indexed.5823:9221:go */
function Data_Array_Indexed_n__5823_9221_go($0, $1, $2, $3, $4) {
 return __tailRec(x24tcOpt_4, {h: 1 /* {TcContinue4:1} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4});
}

/* {$tcOpt:5} */
function x24tcOpt_5($0) {
 switch($0.a4.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:5} */, a1: $0.a5};
  case undefined: /* cons */ {
   const $5 = Text_ILex_Parser_prim__machineSet($0.a5, $0.a4.a1.a1, $0.a4.a1.a2, $0.a6);
   return {h: 1 /* {TcContinue5:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4.a2, a5: $0.a5, a6: undefined};
  }
 }
}

/* Text.ILex.Parser.11339:11339:fill */
function Text_ILex_Parser_n__11339_11339_fill($0, $1, $2, $3, $4, $5) {
 return __tailRec(x24tcOpt_5, {h: 1 /* {TcContinue5:1} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5});
}

/* {$tcOpt:6} */
function x24tcOpt_6($0) {
 switch($0.h) {
  case 1: /* {TcContinue6:1} */ {
   switch($0.a2.h) {
    case 0: /* nil */ {
     switch($0.a3.h) {
      case 0: /* nil */ return {h: 0 /* {TcDone:6} */, a1: 1};
      case undefined: /* cons */ return {h: 0 /* {TcDone:6} */, a1: 0};
     }
    }
    case undefined: /* cons */ {
     switch($0.a3.h) {
      case 0: /* nil */ return {h: 0 /* {TcDone:6} */, a1: 2};
      case undefined: /* cons */ return {h: 2 /* {TcContinue6:2} */, a1: $0.a1, a2: $0.a2.a1, a3: $0.a2.a2, a4: $0.a3.a1, a5: $0.a3.a2, a6: $0.a1.a2($0.a2.a1)($0.a3.a1)};
     }
    }
   }
  }
  case 2: /* {TcContinue6:2} */ {
   switch($0.a6) {
    case 1: return {h: 1 /* {TcContinue6:1} */, a1: $0.a1, a2: $0.a3, a3: $0.a5};
    default: return {h: 0 /* {TcDone:6} */, a1: $0.a6};
   }
  }
 }
}

/* Prelude.Types.compare */
function Prelude_Types_compare_Ord_x28Listx20x24ax29($0, $1, $2) {
 return __tailRec(x24tcOpt_6, {h: 1 /* {TcContinue6:1} */, a1: $0, a2: $1, a3: $2});
}

/* Prelude.Types.case block in compare */
function Prelude_Types_case__compare_6801($0, $1, $2, $3, $4, $5) {
 return __tailRec(x24tcOpt_6, {h: 2 /* {TcContinue6:2} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5});
}

/* {$tcOpt:7} */
function x24tcOpt_7($0) {
 switch($0.a2.h) {
  case 0: /* nil */ {
   switch($0.a3.h) {
    case 0: /* nil */ return {h: 0 /* {TcDone:7} */, a1: 1};
    default: return {h: 0 /* {TcDone:7} */, a1: 0};
   }
  }
  case undefined: /* cons */ {
   switch($0.a3.h) {
    case undefined: /* cons */ {
     switch($0.a1.a1($0.a2.a1)($0.a3.a1)) {
      case 1: return {h: 1 /* {TcContinue7:1} */, a1: $0.a1, a2: $0.a2.a2, a3: $0.a3.a2};
      case 0: return {h: 0 /* {TcDone:7} */, a1: 0};
     }
    }
    default: return {h: 0 /* {TcDone:7} */, a1: 0};
   }
  }
  default: return {h: 0 /* {TcDone:7} */, a1: 0};
 }
}

/* Prelude.Types.== */
function Prelude_Types_x3dx3d_Eq_x28Listx20x24ax29($0, $1, $2) {
 return __tailRec(x24tcOpt_7, {h: 1 /* {TcContinue7:1} */, a1: $0, a2: $1, a3: $2});
}

/* {$tcOpt:8} */
function x24tcOpt_8($0) {
 switch($0.h) {
  case 1: /* {TcContinue8:1} */ {
   switch($0.a6.h) {
    case 0: /* nil */ return {h: 0 /* {TcDone:8} */, a1: undefined};
    case undefined: /* cons */ return {h: 2 /* {TcContinue8:2} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a6.a1, a7: $0.a6.a2, a8: $0.a7, a9: Data_Array_Index_tryNatToFin($0.a1, $0.a6.a1)};
   }
  }
  case 2: /* {TcContinue8:2} */ {
   switch($0.a9.h) {
    case 0: /* nothing */ return {h: 1 /* {TcContinue8:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a7, a7: $0.a8};
    case undefined: /* just */ {
     const $18 = Data_Array_Core_prim__arrayGet($0.a3, $0.a9.a1);
     switch($18) {
      case 1: return {h: 1 /* {TcContinue8:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a7, a7: undefined};
      case 0: {
       const $24 = Data_Array_Core_prim__arraySet($0.a3, $0.a9.a1, 1, undefined);
       return {h: 3 /* {TcContinue8:3} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a6, a7: $0.a7, a8: $0.a9.a1, a9: $24, a10: Data_Array_Core_prim__arrayGet($0.a4, $0.a9.a1)};
      }
     }
    }
   }
  }
  case 3: /* {TcContinue8:3} */ {
   switch($0.a10.h) {
    case 0: /* nothing */ return {h: 1 /* {TcContinue8:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a7, a7: undefined};
    case undefined: /* just */ {
     const $3f = Data_Array_Core_prim__arraySet($0.a5, $0.a8, {a1: $0.a10.a1}, undefined);
     return {h: 1 /* {TcContinue8:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: Prelude_Types_List_tailRecAppend($0.a2($0.a10.a1), $0.a7), a7: undefined};
    }
   }
  }
 }
}

/* Text.ILex.Internal.Types.visit : (a -> List Nat) -> MArray s sz Bool -> MArray s sz (Maybe a) -> MArray s sz (Maybe a) -> List Nat -> F1' s */
function Text_ILex_Internal_Types_visit($0, $1, $2, $3, $4, $5, $6) {
 return __tailRec(x24tcOpt_8, {h: 1 /* {TcContinue8:1} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5, a7: $6});
}

/* Text.ILex.Internal.Types.case block in visit */
function Text_ILex_Internal_Types_case__visit_9902($0, $1, $2, $3, $4, $5, $6, $7, $8) {
 return __tailRec(x24tcOpt_8, {h: 2 /* {TcContinue8:2} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5, a7: $6, a8: $7, a9: $8});
}

/* Text.ILex.Internal.Types.case block in case block in case block in case block in visit */
function Text_ILex_Internal_Types_case__casex20blockx20inx20casex20blockx20inx20casex20blockx20inx20visit_10061($0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
 return __tailRec(x24tcOpt_8, {h: 3 /* {TcContinue8:3} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5, a7: $6, a8: $7, a9: $8, a10: $9});
}

/* {$tcOpt:9} */
function x24tcOpt_9($0) {
 switch($0.a2.h) {
  case undefined: /* cons */ {
   switch($0.a3.h) {
    case undefined: /* cons */ {
     const $4 = {a1: $0.a2.a1, a2: $0.a2.a2};
     const $7 = {a1: $0.a3.a1, a2: $0.a3.a2};
     switch(Prelude_EqOrd_compare_Ord_Integer($0.a2.a1, $0.a3.a1)) {
      case 0: return {h: 1 /* {TcContinue9:1} */, a1: {a1: $0.a1, a2: $0.a2.a1}, a2: $0.a2.a2, a3: $7};
      case 2: return {h: 1 /* {TcContinue9:1} */, a1: {a1: $0.a1, a2: $0.a3.a1}, a2: $4, a3: $0.a3.a2};
      case 1: return {h: 1 /* {TcContinue9:1} */, a1: {a1: $0.a1, a2: $0.a2.a1}, a2: $0.a2.a2, a3: $0.a3.a2};
     }
    }
    default: return {h: 0 /* {TcDone:9} */, a1: Prelude_Types_SnocList_x3cx3ex3e($0.a1, $0.a2)};
   }
  }
  case 0: /* nil */ return {h: 0 /* {TcDone:9} */, a1: Prelude_Types_SnocList_x3cx3ex3e($0.a1, $0.a3)};
  default: return {h: 0 /* {TcDone:9} */, a1: Prelude_Types_SnocList_x3cx3ex3e($0.a1, $0.a2)};
 }
}

/* Text.ILex.Internal.Types.union_ : SnocList Nat -> NSet -> NSet -> NSet */
function Text_ILex_Internal_Types_union_($0, $1, $2) {
 return __tailRec(x24tcOpt_9, {h: 1 /* {TcContinue9:1} */, a1: $0, a2: $1, a3: $2});
}

/* {$tcOpt:10} */
function x24tcOpt_10($0) {
 switch($0.a3.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:10} */, a1: Prelude_Types_SnocList_x3cx3ex3e($0.a1, {h: 0})};
  case undefined: /* cons */ {
   const $7 = $0.a2($0.a3.a1)($0.a4);
   return {h: 1 /* {TcContinue10:1} */, a1: {a1: $0.a1, a2: $7}, a2: $0.a2, a3: $0.a3.a2, a4: undefined};
  }
 }
}

/* Data.Linear.Traverse1.traverse1List : SnocList b -> (a -> F1 s b) -> List a -> F1 s (List b) */
function Data_Linear_Traverse1_traverse1List($0, $1, $2, $3) {
 return __tailRec(x24tcOpt_10, {h: 1 /* {TcContinue10:1} */, a1: $0, a2: $1, a3: $2, a4: $3});
}

/* {$tcOpt:11} */
function x24tcOpt_11($0) {
 switch($0.a2.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:11} */, a1: {a1: $0.a1, a2: '}'}};
  case undefined: /* cons */ {
   const $6 = JSON_Parser_showPair({a1: $0.a1, a2: ','}, $0.a2.a1);
   return {h: 1 /* {TcContinue11:1} */, a1: $6, a2: $0.a2.a2};
  }
 }
}

/* JSON.Parser.showObject : SnocList String -> List (Binding JSON) -> SnocList String */
function JSON_Parser_showObject($0, $1) {
 return __tailRec(x24tcOpt_11, {h: 1 /* {TcContinue11:1} */, a1: $0, a2: $1});
}

/* {$tcOpt:12} */
function x24tcOpt_12($0) {
 switch($0.a2.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:12} */, a1: {a1: $0.a1, a2: ']'}};
  case undefined: /* cons */ {
   const $6 = JSON_Parser_showValue({a1: $0.a1, a2: ','}, $0.a2.a1);
   return {h: 1 /* {TcContinue12:1} */, a1: $6, a2: $0.a2.a2};
  }
 }
}

/* JSON.Parser.showArray : SnocList String -> List JSON -> SnocList String */
function JSON_Parser_showArray($0, $1) {
 return __tailRec(x24tcOpt_12, {h: 1 /* {TcContinue12:1} */, a1: $0, a2: $1});
}

/* {$tcOpt:13} */
function x24tcOpt_13($0) {
 switch($0.a2) {
  case 0n: return {h: 0 /* {TcDone:13} */, a1: $0.a1};
  default: {
   const $4 = ($0.a2-1n);
   return {h: 1 /* {TcContinue13:1} */, a1: {a1: $0.a3, a2: $0.a1}, a2: $4, a3: $0.a3};
  }
 }
}

/* Data.List.replicateTR : List a -> Nat -> a -> List a */
function Data_List_replicateTR($0, $1, $2) {
 return __tailRec(x24tcOpt_13, {h: 1 /* {TcContinue13:1} */, a1: $0, a2: $1, a3: $2});
}

/* {$tcOpt:14} */
function x24tcOpt_14($0) {
 switch($0.a3.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:14} */, a1: $4 => Prelude_Types_SnocList_x3cx3ex3e($0.a2, {h: 0})};
  case undefined: /* cons */ {
   switch($0.a3.a1.a2.h) {
    case 0: /* nil */ return {h: 1 /* {TcContinue14:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3.a2};
    case undefined: /* cons */ {
     switch($0.a3.a1.a2.a2.h) {
      case 0: /* nil */ return {h: 1 /* {TcContinue14:1} */, a1: $0.a1, a2: {a1: $0.a2, a2: {a1: $0.a3.a1.a1, a2: $0.a3.a1.a2.a1}}, a3: $0.a3.a2};
      default: {
       const $15 = $16 => {
        const $17 = Text_ILex_Internal_Types_lookupSet($0.a1, $0.a3.a1.a2, $16);
        switch($17.h) {
         case undefined: /* just */ return Text_ILex_Internal_DFA_process($0.a1, {a1: $0.a2, a2: {a1: $0.a3.a1.a1, a2: $17.a1}}, $0.a3.a2)(undefined);
         case 0: /* nothing */ {
          const $27 = Text_ILex_Internal_Types_addSet($0.a1, $0.a3.a1.a2, undefined);
          const $2c = Data_Linear_Traverse1_traverse1List({h: 0}, $30 => $31 => Text_ILex_Internal_Types_lookupDflt1($30, () => ({a1: $30, a2: {h: 0}, a3: {h: 0}}), $0.a1.a4, $31), $0.a3.a1.a2, undefined);
          const $3d = Text_ILex_Internal_Types_insert1($27, Prelude_Types_foldl_Foldable_List(csegen_442(), {a1: $27, a2: {h: 0}, a3: {h: 0}}, $2c), $0.a1.a4, undefined);
          const $4c = Text_ILex_Internal_DFA_discrete($0.a1, $27, undefined);
          return Text_ILex_Internal_DFA_process($0.a1, {a1: $0.a2, a2: {a1: $0.a3.a1.a1, a2: $27}}, $0.a3.a2)(undefined);
         }
        }
       };
       return {h: 0 /* {TcDone:14} */, a1: $15};
      }
     }
    }
    default: {
     const $5b = $5c => {
      const $5d = Text_ILex_Internal_Types_lookupSet($0.a1, $0.a3.a1.a2, $5c);
      switch($5d.h) {
       case undefined: /* just */ return Text_ILex_Internal_DFA_process($0.a1, {a1: $0.a2, a2: {a1: $0.a3.a1.a1, a2: $5d.a1}}, $0.a3.a2)(undefined);
       case 0: /* nothing */ {
        const $6d = Text_ILex_Internal_Types_addSet($0.a1, $0.a3.a1.a2, undefined);
        const $72 = Data_Linear_Traverse1_traverse1List({h: 0}, $76 => $77 => Text_ILex_Internal_Types_lookupDflt1($76, () => ({a1: $76, a2: {h: 0}, a3: {h: 0}}), $0.a1.a4, $77), $0.a3.a1.a2, undefined);
        const $83 = Text_ILex_Internal_Types_insert1($6d, Prelude_Types_foldl_Foldable_List(csegen_442(), {a1: $6d, a2: {h: 0}, a3: {h: 0}}, $72), $0.a1.a4, undefined);
        const $92 = Text_ILex_Internal_DFA_discrete($0.a1, $6d, undefined);
        return Text_ILex_Internal_DFA_process($0.a1, {a1: $0.a2, a2: {a1: $0.a3.a1.a1, a2: $6d}}, $0.a3.a2)(undefined);
       }
      }
     };
     return {h: 0 /* {TcDone:14} */, a1: $5b};
    }
   }
  }
 }
}

/* Text.ILex.Internal.DFA.process : DFAState s a => SnocList Edge -> NEdges -> F1 s Edges */
function Text_ILex_Internal_DFA_process($0, $1, $2) {
 return __tailRec(x24tcOpt_14, {h: 1 /* {TcContinue14:1} */, a1: $0, a2: $1, a3: $2});
}

/* {$tcOpt:15} */
function x24tcOpt_15($0) {
 switch($0.a4) {
  case 0n: return {h: 0 /* {TcDone:15} */, a1: Prelude_Types_SnocList_x3cx3ex3e($0.a3, {h: 0})};
  default: {
   const $7 = ($0.a4-1n);
   const $a = Data_Array_Core_prim__arrayGet($0.a2, $7);
   switch($a.h) {
    case undefined: /* just */ return {h: 1 /* {TcContinue15:1} */, a1: $0.a1, a2: $0.a2, a3: {a1: $0.a3, a2: {a1: $7, a2: $a.a1}}, a4: $7, a5: undefined};
    case 0: /* nothing */ return {h: 1 /* {TcContinue15:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $7, a5: undefined};
   }
  }
 }
}

/* Text.ILex.Internal.Types.9807:9656:go */
function Text_ILex_Internal_Types_n__9807_9656_go($0, $1, $2, $3, $4) {
 return __tailRec(x24tcOpt_15, {h: 1 /* {TcContinue15:1} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4});
}

/* {$tcOpt:16} */
function x24tcOpt_16($0) {
 switch($0.a3.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:16} */, a1: $0.a2};
  case undefined: /* cons */ return {h: 1 /* {TcContinue16:1} */, a1: $0.a1, a2: $0.a1($0.a2)($0.a3.a1), a3: $0.a3.a2};
 }
}

/* Prelude.Types.foldl */
function Prelude_Types_foldl_Foldable_List($0, $1, $2) {
 return __tailRec(x24tcOpt_16, {h: 1 /* {TcContinue16:1} */, a1: $0, a2: $1, a3: $2});
}

/* {$tcOpt:17} */
function x24tcOpt_17($0) {
 switch($0.h) {
  case 1: /* {TcContinue17:1} */ {
   switch($0.a4.h) {
    case 0: /* nil */ return {h: 0 /* {TcDone:17} */, a1: Prelude_Types_SnocList_x3cx3ex3e($0.a3, {h: 0})};
    case undefined: /* cons */ {
     switch($0.a4.a2.h) {
      case 0: /* nil */ {
       let $8;
       switch($0.a4.a1.h) {
        case 0: /* nil */ {
         $8 = 1;
         break;
        }
        default: $8 = 0;
       }
       switch($8) {
        case 1: return {h: 0 /* {TcDone:17} */, a1: {h: 0}};
        case 0: return {h: 0 /* {TcDone:17} */, a1: Prelude_Types_SnocList_x3cx3ex3e($0.a3, {a1: $0.a4.a1, a2: {h: 0}})};
       }
      }
      case undefined: /* cons */ return {h: 2 /* {TcContinue17:2} */, a1: $0.a1, a2: $0.a2, a3: $0.a4.a1, a4: $0.a4.a2.a1, a5: $0.a4.a2.a2, a6: $0.a3, a7: Text_ILex_Char_Range_union($0.a1.a1, $0.a2, $0.a4.a1, $0.a4.a2.a1)};
     }
    }
   }
  }
  case 2: /* {TcContinue17:2} */ {
   switch($0.a7.h) {
    case 0: /* Left */ {
     let $1f;
     switch($0.a7.a1.h) {
      case 0: /* nil */ {
       $1f = 1;
       break;
      }
      default: $1f = 0;
     }
     switch($1f) {
      case 1: return {h: 1 /* {TcContinue17:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a6, a4: $0.a5};
      case 0: return {h: 1 /* {TcContinue17:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a6, a4: {a1: $0.a7.a1, a2: $0.a5}};
     }
    }
    case 1: /* Right */ return {h: 1 /* {TcContinue17:1} */, a1: $0.a1, a2: $0.a2, a3: {a1: $0.a6, a2: $0.a7.a1.a1}, a4: {a1: $0.a7.a1.a2, a2: $0.a5}};
   }
  }
 }
}

/* Text.ILex.Char.Set.normalise : WithBounds t => Neg t =>
SnocList (RangeOf t) -> Vect n (RangeOf t) -> List (RangeOf t) */
function Text_ILex_Char_Set_normalise($0, $1, $2, $3) {
 return __tailRec(x24tcOpt_17, {h: 1 /* {TcContinue17:1} */, a1: $0, a2: $1, a3: $2, a4: $3});
}

/* Text.ILex.Char.Set.case block in normalise */
function Text_ILex_Char_Set_case__normalise_14085($0, $1, $2, $3, $4, $5, $6) {
 return __tailRec(x24tcOpt_17, {h: 2 /* {TcContinue17:2} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5, a7: $6});
}

/* {$tcOpt:18} */
function x24tcOpt_18($0) {
 switch($0.a6.h) {
  case 0: /* nil */ {
   let $7;
   switch($0.a1.a1.a5($0.a5)($0.a1.a3)) {
    case 1: {
     $7 = {a1: $0.a5, a2: $0.a1.a3};
     break;
    }
    case 0: {
     $7 = {h: 0};
     break;
    }
   }
   const $6 = {a1: $7, a2: {h: 0}};
   const $3 = Prelude_Types_SnocList_x3cx3ex3e($0.a4, $6);
   return {h: 0 /* {TcDone:18} */, a1: $3};
  }
  case undefined: /* cons */ {
   let $14;
   switch($0.a6.a1.h) {
    case 0: /* nil */ {
     $14 = 1;
     break;
    }
    default: $14 = 0;
   }
   switch($14) {
    case 1: return {h: 1 /* {TcContinue18:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a6.a2};
    case 0: {
     const $1c = Text_ILex_Char_Range_lowerBound($0.a1, $0.a6.a1);
     const $20 = Text_ILex_Char_Range_upperBound($0.a1, $0.a6.a1);
     let $24;
     switch($0.a1.a1.a4($1c)($0.a5)) {
      case 1: {
       let $2d;
       switch($0.a1.a1.a5($0.a5)($0.a2.a3($1c)($0.a2.a1.a3(1n)))) {
        case 1: {
         $2d = {a1: $0.a5, a2: $0.a2.a3($1c)($0.a2.a1.a3(1n))};
         break;
        }
        case 0: {
         $2d = {h: 0};
         break;
        }
       }
       $24 = {a1: $0.a4, a2: $2d};
       break;
      }
      case 0: {
       $24 = $0.a4;
       break;
      }
     }
     switch($0.a1.a1.a1.a1($20)($0.a1.a3)) {
      case 1: return {h: 0 /* {TcDone:18} */, a1: Prelude_Types_SnocList_x3cx3ex3e($24, {h: 0})};
      case 0: return {h: 1 /* {TcContinue18:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $24, a5: $0.a2.a1.a1($20)($0.a2.a1.a3(1n)), a6: $0.a6.a2};
     }
    }
   }
  }
 }
}

/* Text.ILex.Char.Set.7645:14384:go */
function Text_ILex_Char_Set_n__7645_14384_go($0, $1, $2, $3, $4, $5) {
 return __tailRec(x24tcOpt_18, {h: 1 /* {TcContinue18:1} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5});
}

/* {$tcOpt:19} */
function x24tcOpt_19($0) {
 switch($0.a3.h) {
  case undefined: /* cons */ {
   const $3 = $0.a2($0.a3.a1);
   switch($3.h) {
    case undefined: /* just */ return {h: 1 /* {TcContinue19:1} */, a1: {a1: $0.a1, a2: $3.a1}, a2: $0.a2, a3: $0.a3.a2};
    case 0: /* nothing */ return {h: 1 /* {TcContinue19:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3.a2};
   }
  }
  case 0: /* nil */ return {h: 0 /* {TcDone:19} */, a1: Prelude_Types_SnocList_x3cx3ex3e($0.a1, {h: 0})};
 }
}

/* Prelude.Types.List.mapMaybeAppend : SnocList b -> (a -> Maybe b) -> List a -> List b */
function Prelude_Types_List_mapMaybeAppend($0, $1, $2) {
 return __tailRec(x24tcOpt_19, {h: 1 /* {TcContinue19:1} */, a1: $0, a2: $1, a3: $2});
}

/* {$tcOpt:20} */
function x24tcOpt_20($0) {
 switch($0.a2.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:20} */, a1: {h: 0}};
  case undefined: /* cons */ {
   switch(Value_Unicode_Order_compareKeys($0.a1, $0.a2.a1.a1)) {
    case 0: return {h: 0 /* {TcDone:20} */, a1: {h: 0}};
    case 1: return {h: 0 /* {TcDone:20} */, a1: {a1: $0.a2.a1.a2}};
    case 2: return {h: 1 /* {TcContinue20:1} */, a1: $0.a1, a2: $0.a2.a2};
   }
  }
 }
}

/* Value.StringKeySortedAssoc.lookupEntries : ScalarString -> List (Binding a) -> Maybe a */
function Value_StringKeySortedAssoc_lookupEntries($0, $1) {
 return __tailRec(x24tcOpt_20, {h: 1 /* {TcContinue20:1} */, a1: $0, a2: $1});
}

/* {$tcOpt:21} */
function x24tcOpt_21($0) {
 switch($0.a3.h) {
  case 0: /* Leaf */ {
   switch($0.a1.a1.a1($0.a2)($0.a3.a1)) {
    case 1: return {h: 0 /* {TcDone:21} */, a1: {a1: {a1: $0.a3.a1, a2: $0.a3.a2}}};
    case 0: return {h: 0 /* {TcDone:21} */, a1: {h: 0}};
   }
  }
  case 1: /* Branch2 */ {
   switch($0.a1.a5($0.a2)($0.a3.a2)) {
    case 1: return {h: 1 /* {TcContinue21:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3.a1};
    case 0: return {h: 1 /* {TcContinue21:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3.a3};
   }
  }
  case 2: /* Branch3 */ {
   switch($0.a1.a5($0.a2)($0.a3.a2)) {
    case 1: return {h: 1 /* {TcContinue21:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3.a1};
    case 0: {
     switch($0.a1.a5($0.a2)($0.a3.a4)) {
      case 1: return {h: 1 /* {TcContinue21:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3.a3};
      case 0: return {h: 1 /* {TcContinue21:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3.a5};
     }
    }
   }
  }
 }
}

/* Data.SortedMap.Dependent.treeLookup : Ord k => k -> Tree n k v o -> Maybe (y : k ** v y) */
function Data_SortedMap_Dependent_treeLookup($0, $1, $2) {
 return __tailRec(x24tcOpt_21, {h: 1 /* {TcContinue21:1} */, a1: $0, a2: $1, a3: $2});
}

/* {$tcOpt:22} */
function x24tcOpt_22($0) {
 switch($0.a3.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:22} */, a1: Prelude_Types_List_reverse($0.a2)};
  case undefined: /* cons */ return {h: 1 /* {TcContinue22:1} */, a1: $0.a1, a2: Prelude_Types_List_reverseOnto($0.a2, $0.a1($0.a3.a1)), a3: $0.a3.a2};
 }
}

/* Prelude.Types.listBindOnto : (a -> List b) -> List b -> List a -> List b */
function Prelude_Types_listBindOnto($0, $1, $2) {
 return __tailRec(x24tcOpt_22, {h: 1 /* {TcContinue22:1} */, a1: $0, a2: $1, a3: $2});
}

/* {$tcOpt:23} */
function x24tcOpt_23($0) {
 switch($0.a2.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:23} */, a1: $0.a1};
  case undefined: /* cons */ return {h: 1 /* {TcContinue23:1} */, a1: {a1: $0.a2.a1, a2: $0.a1}, a2: $0.a2.a2};
 }
}

/* Prelude.Types.List.reverseOnto : List a -> List a -> List a */
function Prelude_Types_List_reverseOnto($0, $1) {
 return __tailRec(x24tcOpt_23, {h: 1 /* {TcContinue23:1} */, a1: $0, a2: $1});
}

/* {$tcOpt:24} */
function x24tcOpt_24($0) {
 switch($0.a2.h) {
  case 0: /* nil */ {
   switch($0.a3.h) {
    case 0: /* nil */ return {h: 0 /* {TcDone:24} */, a1: {h: 0}};
    default: {
     switch($0.a3.h) {
      case 0: /* nil */ return {h: 0 /* {TcDone:24} */, a1: {a1: Prelude_Types_List_reverse($0.a2), a2: {h: 0}}};
      case undefined: /* cons */ {
       switch($0.a3.a1) {
        case '\n': return {h: 0 /* {TcDone:24} */, a1: {a1: Prelude_Types_List_reverse($0.a2), a2: Data_String_n__3990_9729_linesHelp($0.a1, {h: 0}, $0.a3.a2)}};
        case '\r': {
         switch($0.a3.a2.h) {
          case undefined: /* cons */ {
           switch($0.a3.a2.a1) {
            case '\n': return {h: 0 /* {TcDone:24} */, a1: {a1: Prelude_Types_List_reverse($0.a2), a2: Data_String_n__3990_9729_linesHelp($0.a1, {h: 0}, $0.a3.a2.a2)}};
            default: return {h: 0 /* {TcDone:24} */, a1: {a1: Prelude_Types_List_reverse($0.a2), a2: Data_String_n__3990_9729_linesHelp($0.a1, {h: 0}, $0.a3.a2)}};
           }
          }
          default: return {h: 0 /* {TcDone:24} */, a1: {a1: Prelude_Types_List_reverse($0.a2), a2: Data_String_n__3990_9729_linesHelp($0.a1, {h: 0}, $0.a3.a2)}};
         }
        }
        default: return {h: 1 /* {TcContinue24:1} */, a1: $0.a1, a2: {a1: $0.a3.a1, a2: $0.a2}, a3: $0.a3.a2};
       }
      }
     }
    }
   }
  }
  default: {
   switch($0.a3.h) {
    case 0: /* nil */ return {h: 0 /* {TcDone:24} */, a1: {a1: Prelude_Types_List_reverse($0.a2), a2: {h: 0}}};
    case undefined: /* cons */ {
     switch($0.a3.a1) {
      case '\n': return {h: 0 /* {TcDone:24} */, a1: {a1: Prelude_Types_List_reverse($0.a2), a2: Data_String_n__3990_9729_linesHelp($0.a1, {h: 0}, $0.a3.a2)}};
      case '\r': {
       switch($0.a3.a2.h) {
        case undefined: /* cons */ {
         switch($0.a3.a2.a1) {
          case '\n': return {h: 0 /* {TcDone:24} */, a1: {a1: Prelude_Types_List_reverse($0.a2), a2: Data_String_n__3990_9729_linesHelp($0.a1, {h: 0}, $0.a3.a2.a2)}};
          default: return {h: 0 /* {TcDone:24} */, a1: {a1: Prelude_Types_List_reverse($0.a2), a2: Data_String_n__3990_9729_linesHelp($0.a1, {h: 0}, $0.a3.a2)}};
         }
        }
        default: return {h: 0 /* {TcDone:24} */, a1: {a1: Prelude_Types_List_reverse($0.a2), a2: Data_String_n__3990_9729_linesHelp($0.a1, {h: 0}, $0.a3.a2)}};
       }
      }
      default: return {h: 1 /* {TcContinue24:1} */, a1: $0.a1, a2: {a1: $0.a3.a1, a2: $0.a2}, a3: $0.a3.a2};
     }
    }
   }
  }
 }
}

/* Data.String.3990:9729:linesHelp */
function Data_String_n__3990_9729_linesHelp($0, $1, $2) {
 return __tailRec(x24tcOpt_24, {h: 1 /* {TcContinue24:1} */, a1: $0, a2: $1, a3: $2});
}

/* {$tcOpt:25} */
function x24tcOpt_25($0) {
 switch($0.a4.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:25} */, a1: $0.a1};
  case undefined: /* cons */ {
   const $4 = ($0.a3+1n);
   const $7 = Data_String_padLeft($0.a2, '0', Prelude_Show_show_Show_Nat($4));
   return {h: 1 /* {TcContinue25:1} */, a1: {a1: $0.a1, a2: Prelude_Types_foldMap_Foldable_List(csegen_453(), $15 => $15, {a1: ' ', a2: {a1: $7, a2: {a1: ' | ', a2: {a1: $0.a4.a1, a2: {h: 0}}}}})}, a2: $0.a2, a3: $4, a4: $0.a4.a2};
  }
 }
}

/* Text.FC.lineNumbers : SnocList String -> Nat -> Nat -> List String -> SnocList String */
function Text_FC_lineNumbers($0, $1, $2, $3) {
 return __tailRec(x24tcOpt_25, {h: 1 /* {TcContinue25:1} */, a1: $0, a2: $1, a3: $2, a4: $3});
}

/* {$tcOpt:26} */
function x24tcOpt_26($0) {
 switch($0.a2.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:26} */, a1: $0.a1};
  case undefined: /* cons */ return {h: 1 /* {TcContinue26:1} */, a1: ($0.a1+1n), a2: $0.a2.a2};
 }
}

/* Prelude.Types.List.lengthPlus : Nat -> List a -> Nat */
function Prelude_Types_List_lengthPlus($0, $1) {
 return __tailRec(x24tcOpt_26, {h: 1 /* {TcContinue26:1} */, a1: $0, a2: $1});
}

/* {$tcOpt:27} */
function x24tcOpt_27($0) {
 switch($0.a1.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:27} */, a1: 1};
  case undefined: /* cons */ {
   switch(Value_Unicode_scalarCharacter($0.a1.a1)) {
    case 1: return {h: 1 /* {TcContinue27:1} */, a1: $0.a1.a2};
    case 0: return {h: 0 /* {TcDone:27} */, a1: 0};
   }
  }
 }
}

/* Value.Unicode.scalarCharacters : List Char -> Bool */
function Value_Unicode_scalarCharacters($0) {
 return __tailRec(x24tcOpt_27, {h: 1 /* {TcContinue27:1} */, a1: $0});
}

/* {$tcOpt:28} */
function x24tcOpt_28($0) {
 switch($0.h) {
  case 1: /* {TcContinue28:1} */ {
   switch($0.a9) {
    case 0n: {
     const $3 = ($0.a5.value=$0.a10);
     return {h: 0 /* {TcDone:28} */, a1: {h: 1 /* Right */, a1: {a1: $0.a6, a2: $0.a2, a3: $0.a7, a4: $0.a8, a5: {h: 1 /* Ign */}}}};
    }
    default: {
     const $f = ($0.a9-1n);
     const $12 = Data_Buffer_Core_prim__getByte($0.a3, $0.a10);
     return {h: 2 /* {TcContinue28:2} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $f, a7: $0.a11, a8: $0.a10, a9: $0.a8, a10: $0.a7, a11: $0.a6, a12: $12, a13: Data_Array_Core_prim__arrayGet($0.a8, BigInt($12))};
    }
   }
  }
  case 2: /* {TcContinue28:2} */ {
   switch($0.a13.h) {
    case 0: /* Keep */ return {h: 1 /* {TcContinue28:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a11, a7: $0.a10, a8: $0.a9, a9: $0.a6, a10: ($0.a8+1n), a11: $0.a7};
    case 1: /* Done */ {
     const $36 = ($0.a5.value=($0.a8+1n));
     const $35 = $0.a13.a1({a1: $0.a2, a2: undefined});
     return {h: 3 /* {TcContinue28:3} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $35, a7: $0.a6, a8: ($0.a8+1n), a9: undefined};
    }
    case 2: /* Ignore */ return {h: 3 /* {TcContinue28:3} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a11, a7: $0.a6, a8: ($0.a8+1n), a9: $0.a7};
    case 3: /* Move */ return {h: 8 /* {TcContinue28:8} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a11, a7: $0.a10, a8: Data_Array_Core_prim__arrayGet($0.a10, $0.a13.a1), a9: $0.a13.a2, a10: $0.a6, a11: ($0.a8+1n), a12: $0.a7};
    case 4: /* MoveI */ return {h: 1 /* {TcContinue28:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a11, a7: $0.a10, a8: Data_Array_Core_prim__arrayGet($0.a10, $0.a13.a1), a9: $0.a6, a10: ($0.a8+1n), a11: $0.a7};
    case 5: /* MoveE */ return {h: 6 /* {TcContinue28:6} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a11, a7: $0.a10, a8: Data_Array_Core_prim__arrayGet($0.a10, $0.a13.a1), a9: $0.a6, a10: ($0.a8+1n), a11: $0.a7};
    case 6: /* Bottom */ return {h: 3 /* {TcContinue28:3} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a11, a7: ($0.a6+1n), a8: $0.a8, a9: $0.a7};
   }
  }
  case 3: /* {TcContinue28:3} */ {
   switch($0.a7) {
    case 0n: {
     const $94 = ($0.a4.value=$0.a8);
     const $99 = ($0.a5.value=$0.a8);
     return {h: 0 /* {TcDone:28} */, a1: Text_ILex_Runner_case__casex20blockx20inx20casex20blockx20inx20loop_22196($0.a1, $0.a2, $0.a3, $0.a4, $0.a5, $0.a8, $0.a6, $94, $99, undefined, Text_ILex_Parser_prim__machineGet($0.a1.a4, $0.a6))};
    }
    default: {
     const $af = ($0.a7-1n);
     const $b2 = ($0.a4.value=$0.a8);
     return {h: 4 /* {TcContinue28:4} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $af, a7: $0.a8, a8: $0.a6, a9: $b2, a10: undefined, a11: Text_ILex_Parser_prim__machineGet($0.a1.a4, $0.a6)};
    }
   }
  }
  case 4: /* {TcContinue28:4} */ {
   const $c7 = Data_Array_Core_prim__arrayGet($0.a11.a2, 0n);
   return {h: 5 /* {TcContinue28:5} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a6, a7: $0.a7, a8: $0.a8, a9: $0.a9, a10: $0.a10, a11: $0.a11.a1, a12: $0.a11.a2, a13: $c7, a14: Data_Array_Core_prim__arrayGet($c7, BigInt(Data_Buffer_Core_prim__getByte($0.a3, $0.a7)))};
  }
  case 5: /* {TcContinue28:5} */ {
   switch($0.a14.h) {
    case 1: /* Done */ {
     const $e2 = ($0.a5.value=($0.a7+1n));
     const $e1 = $0.a14.a1({a1: $0.a2, a2: undefined});
     return {h: 3 /* {TcContinue28:3} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $e1, a7: $0.a6, a8: ($0.a7+1n), a9: undefined};
    }
    case 2: /* Ignore */ return {h: 3 /* {TcContinue28:3} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a8, a7: $0.a6, a8: ($0.a7+1n), a9: $0.a10};
    case 3: /* Move */ return {h: 8 /* {TcContinue28:8} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a8, a7: $0.a12, a8: Data_Array_Core_prim__arrayGet($0.a12, $0.a14.a1), a9: $0.a14.a2, a10: $0.a6, a11: ($0.a7+1n), a12: $0.a10};
    case 4: /* MoveI */ return {h: 1 /* {TcContinue28:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a8, a7: $0.a12, a8: Data_Array_Core_prim__arrayGet($0.a12, $0.a14.a1), a9: $0.a6, a10: ($0.a7+1n), a11: $0.a10};
    case 5: /* MoveE */ return {h: 6 /* {TcContinue28:6} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a8, a7: $0.a12, a8: Data_Array_Core_prim__arrayGet($0.a12, $0.a14.a1), a9: $0.a6, a10: ($0.a7+1n), a11: $0.a10};
    default: {
     const $134 = ($0.a5.value=($0.a7+1n));
     return {h: 0 /* {TcDone:28} */, a1: Text_ILex_Parser_arrFail($0.a1.a6, $0.a8, $0.a2, undefined)};
    }
   }
  }
  case 6: /* {TcContinue28:6} */ {
   switch($0.a9) {
    case 0n: {
     const $143 = ($0.a5.value=$0.a10);
     return {h: 0 /* {TcDone:28} */, a1: {h: 1 /* Right */, a1: {a1: $0.a6, a2: $0.a2, a3: $0.a7, a4: $0.a8, a5: {h: 2 /* Err */}}}};
    }
    default: {
     const $14f = ($0.a9-1n);
     const $152 = Data_Buffer_Core_prim__getByte($0.a3, $0.a10);
     return {h: 7 /* {TcContinue28:7} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $14f, a7: $0.a11, a8: $0.a10, a9: $0.a8, a10: $0.a7, a11: $0.a6, a12: $152, a13: Data_Array_Core_prim__arrayGet($0.a8, BigInt($152))};
    }
   }
  }
  case 7: /* {TcContinue28:7} */ {
   switch($0.a13.h) {
    case 0: /* Keep */ return {h: 6 /* {TcContinue28:6} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a11, a7: $0.a10, a8: $0.a9, a9: $0.a6, a10: ($0.a8+1n), a11: $0.a7};
    case 1: /* Done */ {
     const $176 = ($0.a5.value=($0.a8+1n));
     const $175 = $0.a13.a1({a1: $0.a2, a2: undefined});
     return {h: 3 /* {TcContinue28:3} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $175, a7: $0.a6, a8: ($0.a8+1n), a9: undefined};
    }
    case 2: /* Ignore */ return {h: 3 /* {TcContinue28:3} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a11, a7: $0.a6, a8: ($0.a8+1n), a9: $0.a7};
    case 3: /* Move */ return {h: 8 /* {TcContinue28:8} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a11, a7: $0.a10, a8: Data_Array_Core_prim__arrayGet($0.a10, $0.a13.a1), a9: $0.a13.a2, a10: $0.a6, a11: ($0.a8+1n), a12: $0.a7};
    case 4: /* MoveI */ return {h: 1 /* {TcContinue28:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a11, a7: $0.a10, a8: Data_Array_Core_prim__arrayGet($0.a10, $0.a13.a1), a9: $0.a6, a10: ($0.a8+1n), a11: $0.a7};
    case 5: /* MoveE */ return {h: 6 /* {TcContinue28:6} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a11, a7: $0.a10, a8: Data_Array_Core_prim__arrayGet($0.a10, $0.a13.a1), a9: $0.a6, a10: ($0.a8+1n), a11: $0.a7};
    case 6: /* Bottom */ {
     const $1c8 = ($0.a5.value=($0.a8+1n));
     return {h: 0 /* {TcDone:28} */, a1: Text_ILex_Parser_arrFail($0.a1.a6, $0.a11, $0.a2, undefined)};
    }
   }
  }
  case 8: /* {TcContinue28:8} */ {
   switch($0.a10) {
    case 0n: {
     const $1d7 = ($0.a5.value=$0.a11);
     return {h: 0 /* {TcDone:28} */, a1: {h: 1 /* Right */, a1: {a1: $0.a6, a2: $0.a2, a3: $0.a7, a4: $0.a8, a5: {h: 0 /* Run */, a1: $0.a9}}}};
    }
    default: {
     const $1e4 = ($0.a10-1n);
     const $1e7 = Data_Buffer_Core_prim__getByte($0.a3, $0.a11);
     return {h: 9 /* {TcContinue28:9} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $1e4, a7: $0.a12, a8: $0.a11, a9: $0.a9, a10: $0.a8, a11: $0.a7, a12: $0.a6, a13: $1e7, a14: Data_Array_Core_prim__arrayGet($0.a8, BigInt($1e7))};
    }
   }
  }
  case 9: /* {TcContinue28:9} */ {
   switch($0.a14.h) {
    case 0: /* Keep */ return {h: 8 /* {TcContinue28:8} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a12, a7: $0.a11, a8: $0.a10, a9: $0.a9, a10: $0.a6, a11: ($0.a8+1n), a12: $0.a7};
    case 1: /* Done */ {
     const $20d = ($0.a5.value=($0.a8+1n));
     const $20c = $0.a14.a1({a1: $0.a2, a2: undefined});
     return {h: 3 /* {TcContinue28:3} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $20c, a7: $0.a6, a8: ($0.a8+1n), a9: undefined};
    }
    case 2: /* Ignore */ return {h: 3 /* {TcContinue28:3} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a12, a7: $0.a6, a8: ($0.a8+1n), a9: $0.a7};
    case 3: /* Move */ return {h: 8 /* {TcContinue28:8} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a12, a7: $0.a11, a8: Data_Array_Core_prim__arrayGet($0.a11, $0.a14.a1), a9: $0.a14.a2, a10: $0.a6, a11: ($0.a8+1n), a12: $0.a7};
    case 4: /* MoveI */ return {h: 1 /* {TcContinue28:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a12, a7: $0.a11, a8: Data_Array_Core_prim__arrayGet($0.a11, $0.a14.a1), a9: $0.a6, a10: ($0.a8+1n), a11: $0.a7};
    case 5: /* MoveE */ return {h: 6 /* {TcContinue28:6} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $0.a12, a7: $0.a11, a8: Data_Array_Core_prim__arrayGet($0.a11, $0.a14.a1), a9: $0.a6, a10: ($0.a8+1n), a11: $0.a7};
    case 6: /* Bottom */ {
     const $260 = ($0.a5.value=$0.a8);
     const $25f = $0.a9({a1: $0.a2, a2: undefined});
     return {h: 3 /* {TcContinue28:3} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a5, a6: $25f, a7: ($0.a6+1n), a8: $0.a8, a9: undefined};
    }
   }
  }
 }
}

/* Text.ILex.Runner.igno : (parser : P1 q e a) ->
PST parser -> IBuffer n -> Ref q (LTENat n) -> Ref q (LTENat n) -> PIx parser -> PStepper k parser -> PByteStep k parser -> (pos : Nat) ->
Ix pos n => LoopRes parser */
function Text_ILex_Runner_igno($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $a) {
 return __tailRec(x24tcOpt_28, {h: 1 /* {TcContinue28:1} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5, a7: $6, a8: $7, a9: $8, a10: $9, a11: $a});
}

/* Text.ILex.Runner.case block in igno */
function Text_ILex_Runner_case__igno_23351($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $a, $b, $c) {
 return __tailRec(x24tcOpt_28, {h: 2 /* {TcContinue28:2} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5, a7: $6, a8: $7, a9: $8, a10: $9, a11: $a, a12: $b, a13: $c});
}

/* Text.ILex.Runner.loop : (parser : P1 q e a) ->
PST parser -> IBuffer n -> Ref q (LTENat n) -> Ref q (LTENat n) -> PIx parser -> (pos : Nat) ->
Ix pos n => LoopRes parser */
function Text_ILex_Runner_loop($0, $1, $2, $3, $4, $5, $6, $7, $8) {
 return __tailRec(x24tcOpt_28, {h: 3 /* {TcContinue28:3} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5, a7: $6, a8: $7, a9: $8});
}

/* Text.ILex.Runner.case block in case block in loop */
function Text_ILex_Runner_case__casex20blockx20inx20loop_22313($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $a) {
 return __tailRec(x24tcOpt_28, {h: 4 /* {TcContinue28:4} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5, a7: $6, a8: $7, a9: $8, a10: $9, a11: $a});
}

/* Text.ILex.Runner.case block in case block in case block in loop */
function Text_ILex_Runner_case__casex20blockx20inx20casex20blockx20inx20loop_22369($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $a, $b, $c, $d) {
 return __tailRec(x24tcOpt_28, {h: 5 /* {TcContinue28:5} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5, a7: $6, a8: $7, a9: $8, a10: $9, a11: $a, a12: $b, a13: $c, a14: $d});
}

/* Text.ILex.Runner.step : (parser : P1 q e a) ->
PST parser -> IBuffer n -> Ref q (LTENat n) -> Ref q (LTENat n) -> PIx parser -> PStepper k parser -> PByteStep k parser -> (pos : Nat) ->
Ix pos n => LoopRes parser */
function Text_ILex_Runner_step($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $a) {
 return __tailRec(x24tcOpt_28, {h: 6 /* {TcContinue28:6} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5, a7: $6, a8: $7, a9: $8, a10: $9, a11: $a});
}

/* Text.ILex.Runner.case block in step */
function Text_ILex_Runner_case__step_23814($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $a, $b, $c) {
 return __tailRec(x24tcOpt_28, {h: 7 /* {TcContinue28:7} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5, a7: $6, a8: $7, a9: $8, a10: $9, a11: $a, a12: $b, a13: $c});
}

/* Text.ILex.Runner.succ : (parser : P1 q e a) ->
PST parser -> IBuffer n -> Ref q (LTENat n) -> Ref q (LTENat n) -> PIx parser -> PStepper k parser -> PByteStep k parser -> PRun parser -> (pos : Nat) ->
Ix pos n => LoopRes parser */
function Text_ILex_Runner_succ($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $a, $b) {
 return __tailRec(x24tcOpt_28, {h: 8 /* {TcContinue28:8} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5, a7: $6, a8: $7, a9: $8, a10: $9, a11: $a, a12: $b});
}

/* Text.ILex.Runner.case block in succ */
function Text_ILex_Runner_case__succ_22812($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $a, $b, $c, $d) {
 return __tailRec(x24tcOpt_28, {h: 9 /* {TcContinue28:9} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5, a7: $6, a8: $7, a9: $8, a10: $9, a11: $a, a12: $b, a13: $c, a14: $d});
}

/* {$tcOpt:29} */
function x24tcOpt_29($0) {
 switch($0.a1) {
  case 0n: {
   switch($0.a2.h) {
    case undefined: /* cons */ return {h: 0 /* {TcDone:29} */, a1: {a1: $0.a2.a1}};
    default: return {h: 0 /* {TcDone:29} */, a1: {h: 0}};
   }
  }
  default: {
   const $8 = ($0.a1-1n);
   switch($0.a2.h) {
    case undefined: /* cons */ return {h: 1 /* {TcContinue29:1} */, a1: $8, a2: $0.a2.a2};
    default: return {h: 0 /* {TcDone:29} */, a1: {h: 0}};
   }
  }
 }
}

/* Prelude.Types.getAt : Nat -> List a -> Maybe a */
function Prelude_Types_getAt($0, $1) {
 return __tailRec(x24tcOpt_29, {h: 1 /* {TcContinue29:1} */, a1: $0, a2: $1});
}

/* {$tcOpt:30} */
function x24tcOpt_30($0) {
 switch($0.a2.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:30} */, a1: $0.a1};
  case undefined: /* cons */ return {h: 1 /* {TcContinue30:1} */, a1: {a1: $0.a2.a1, a2: $0.a1}, a2: $0.a2.a2};
 }
}

/* Data.Vect.fromList' : Vect len elem -> (l : List elem) -> Vect (length l + len) elem */
function Data_Vect_fromListx27($0, $1) {
 return __tailRec(x24tcOpt_30, {h: 1 /* {TcContinue30:1} */, a1: $0, a2: $1});
}

/* {$tcOpt:31} */
function x24tcOpt_31($0) {
 switch($0.a2.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:31} */, a1: $0.a1};
  case undefined: /* cons */ return {h: 1 /* {TcContinue31:1} */, a1: {a1: $0.a2.a1, a2: $0.a1}, a2: $0.a2.a2};
 }
}

/* Data.Vect.reverseOnto : Vect n elem -> Vect m elem -> Vect (n + m) elem */
function Data_Vect_reverseOnto($0, $1) {
 return __tailRec(x24tcOpt_31, {h: 1 /* {TcContinue31:1} */, a1: $0, a2: $1});
}

/* {$tcOpt:32} */
function x24tcOpt_32($0) {
 switch($0.a3.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:32} */, a1: $0.a2};
  case undefined: /* cons */ {
   switch($0.a3.a1.h) {
    case 1: /* Index */ return {h: 1 /* {TcContinue32:1} */, a1: $0.a1, a2: ($0.a2+('['+(Prelude_Show_show_Show_Nat($0.a3.a1.a1)+']'))), a3: $0.a3.a2};
    case 0: /* Key */ return {h: 1 /* {TcContinue32:1} */, a1: $0.a1, a2: ($0.a2+JSON_FromJSON_n__13397_7283_formatKey($0.a1, $0.a3.a1.a1)), a3: $0.a3.a2};
   }
  }
 }
}

/* JSON.FromJSON.13397:7282:format */
function JSON_FromJSON_n__13397_7282_format($0, $1, $2) {
 return __tailRec(x24tcOpt_32, {h: 1 /* {TcContinue32:1} */, a1: $0, a2: $1, a3: $2});
}

/* {$tcOpt:33} */
function x24tcOpt_33($0) {
 switch($0.a3.h) {
  case undefined: /* cons */ {
   switch($0.a2($0.a3.a1)) {
    case 1: return {h: 1 /* {TcContinue33:1} */, a1: {a1: $0.a1, a2: $0.a3.a1}, a2: $0.a2, a3: $0.a3.a2};
    case 0: return {h: 1 /* {TcContinue33:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3.a2};
   }
  }
  case 0: /* nil */ return {h: 0 /* {TcDone:33} */, a1: Prelude_Types_SnocList_x3cx3ex3e($0.a1, {h: 0})};
 }
}

/* Prelude.Types.List.filterAppend : SnocList a -> (a -> Bool) -> List a -> List a */
function Prelude_Types_List_filterAppend($0, $1, $2) {
 return __tailRec(x24tcOpt_33, {h: 1 /* {TcContinue33:1} */, a1: $0, a2: $1, a3: $2});
}

/* {$tcOpt:34} */
function x24tcOpt_34($0) {
 switch($0.h) {
  case 1: /* {TcContinue34:1} */ {
   switch($0.a3) {
    case 0n: return {h: 0 /* {TcDone:34} */, a1: undefined};
    default: {
     const $4 = ($0.a3-1n);
     const $7 = Data_Array_Core_prim__arraySet($0.a2, $0.a4, $0.a5, $0.a6);
     return {h: 2 /* {TcContinue34:2} */, a1: $0.a1, a2: $0.a2, a3: $4, a4: $0.a5, a5: $0.a4, a6: $7, a7: undefined, a8: Data_Buffer_Core_prim__getByteOffset($0.a1.a1, $0.a4, $0.a1.a2)};
    }
   }
  }
  case 2: /* {TcContinue34:2} */ {
   switch($0.a8) {
    case 10: return {h: 1 /* {TcContinue34:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: ($0.a5+1n), a5: {a1: ($0.a4.a1+1n), a2: 0n}, a6: $0.a7};
    default: {
     switch(Prelude_EqOrd_x3c_Ord_Bits8($0.a8, 128)) {
      case 1: return {h: 1 /* {TcContinue34:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: ($0.a5+1n), a5: {a1: $0.a4.a1, a2: ($0.a4.a2+1n)}, a6: $0.a7};
      case 0: return {h: 3 /* {TcContinue34:3} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: ($0.a5+1n), a5: $0.a4, a6: $0.a7};
     }
    }
   }
  }
  case 3: /* {TcContinue34:3} */ {
   switch($0.a3) {
    case 0n: return {h: 0 /* {TcDone:34} */, a1: undefined};
    default: {
     const $43 = ($0.a3-1n);
     const $46 = Data_Array_Core_prim__arraySet($0.a2, $0.a4, $0.a5, $0.a6);
     let $4c;
     switch(Prelude_EqOrd_x3dx3d_Eq_Bits8((Data_Buffer_Core_prim__getByteOffset($0.a1.a1, $0.a4, $0.a1.a2)&128), 0)) {
      case 1: {
       $4c = 1;
       break;
      }
      case 0: {
       $4c = Prelude_EqOrd_x3dx3d_Eq_Bits8((Data_Buffer_Core_prim__getByteOffset($0.a1.a1, $0.a4, $0.a1.a2)&192), 192);
       break;
      }
     }
     switch($4c) {
      case 1: return {h: 1 /* {TcContinue34:1} */, a1: $0.a1, a2: $0.a2, a3: ($43+1n), a4: $0.a4, a5: {a1: $0.a5.a1, a2: ($0.a5.a2+1n)}, a6: undefined};
      case 0: return {h: 3 /* {TcContinue34:3} */, a1: $0.a1, a2: $0.a2, a3: $43, a4: ($0.a4+1n), a5: $0.a5, a6: undefined};
     }
    }
   }
  }
 }
}

/* Text.Bounds.fillMap : ByteVect n -> MArray s (S n) Position -> (k : Nat) -> Ix k n =>
Position -> F1' s */
function Text_Bounds_fillMap($0, $1, $2, $3, $4, $5) {
 return __tailRec(x24tcOpt_34, {h: 1 /* {TcContinue34:1} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5});
}

/* Text.Bounds.case block in case block in fillMap */
function Text_Bounds_case__casex20blockx20inx20fillMap_12910($0, $1, $2, $3, $4, $5, $6, $7) {
 return __tailRec(x24tcOpt_34, {h: 2 /* {TcContinue34:2} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5, a7: $6, a8: $7});
}

/* Text.Bounds.skip : ByteVect n -> MArray s (S n) Position -> (k : Nat) -> Ix k n =>
Position -> F1' s */
function Text_Bounds_skip($0, $1, $2, $3, $4, $5) {
 return __tailRec(x24tcOpt_34, {h: 3 /* {TcContinue34:3} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5});
}

/* {$tcOpt:35} */
function x24tcOpt_35($0) {
 switch($0.a2.h) {
  case 0: /* Eps */ return {h: 0 /* {TcDone:35} */, a1: $0.a3};
  case 2: /* And */ {
   const $4 = Text_ILex_Internal_ENFA_enfa($0.a1, $0.a2.a2, $0.a3, $0.a4);
   return {h: 1 /* {TcContinue35:1} */, a1: $0.a1, a2: $0.a2.a1, a3: $4, a4: undefined};
  }
  case 1: /* Ch */ {
   const $e = Text_ILex_Internal_Types_inc($0.a1, $0.a4);
   const $12 = Text_ILex_Internal_Types_insert1($e, {a1: {h: 0}, a2: {h: 0}, a3: Prelude_Types_List_mapAppend({h: 0}, $1c => ({a1: $1c, a2: $0.a3}), $0.a2.a1)}, $0.a1.a3, undefined);
   return {h: 0 /* {TcDone:35} */, a1: $e};
  }
  case 3: /* Or */ {
   const $24 = Text_ILex_Internal_ENFA_enfa($0.a1, $0.a2.a1, $0.a3, $0.a4);
   const $2a = Text_ILex_Internal_ENFA_enfa($0.a1, $0.a2.a2, $0.a3, undefined);
   const $30 = Text_ILex_Internal_Types_inc($0.a1, undefined);
   const $34 = Text_ILex_Internal_Types_insert1($30, {a1: {h: 0}, a2: {a1: $24, a2: {a1: $2a, a2: {h: 0}}}, a3: {h: 0}}, $0.a1.a3, undefined);
   return {h: 0 /* {TcDone:35} */, a1: $30};
  }
  case 4: /* Star */ {
   const $43 = Text_ILex_Internal_Types_inc($0.a1, $0.a4);
   const $47 = Text_ILex_Internal_ENFA_enfa($0.a1, $0.a2.a1, $43, undefined);
   const $4d = Text_ILex_Internal_Types_insert1($43, {a1: {h: 0}, a2: {a1: $47, a2: {a1: $0.a3, a2: {h: 0}}}, a3: {h: 0}}, $0.a1.a3, undefined);
   return {h: 0 /* {TcDone:35} */, a1: $43};
  }
 }
}

/* Text.ILex.Internal.ENFA.enfa : DFAState s a => RExp8 b -> Nat -> F1 s Nat */
function Text_ILex_Internal_ENFA_enfa($0, $1, $2, $3) {
 return __tailRec(x24tcOpt_35, {h: 1 /* {TcContinue35:1} */, a1: $0, a2: $1, a3: $2, a4: $3});
}

/* {$tcOpt:36} */
function x24tcOpt_36($0) {
 switch($0.a1) {
  case 0n: return {h: 0 /* {TcDone:36} */, a1: $0.a2};
  default: {
   const $4 = ($0.a1-1n);
   switch($0.a2.h) {
    case 0: /* nil */ return {h: 0 /* {TcDone:36} */, a1: {h: 0}};
    case undefined: /* cons */ return {h: 1 /* {TcContinue36:1} */, a1: $4, a2: $0.a2.a2};
   }
  }
 }
}

/* Data.List.drop : Nat -> List a -> List a */
function Data_List_drop($0, $1) {
 return __tailRec(x24tcOpt_36, {h: 1 /* {TcContinue36:1} */, a1: $0, a2: $1});
}

/* {$tcOpt:37} */
function x24tcOpt_37($0) {
 switch($0.h) {
  case 1: /* {TcContinue37:1} */ return {h: 2 /* {TcContinue37:2} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $0.a4, a5: $0.a6, a6: $0.a5, a7: Data_Array_Index_tryNatToFin($0.a4, $0.a3)};
  case 2: /* {TcContinue37:2} */ {
   switch($0.a7.h) {
    case undefined: /* just */ {
     const $d = Data_Array_Core_prim__arraySet($0.a6, $0.a7.a1, {a1: $0.a1}, $0.a5);
     return {h: 0 /* {TcDone:37} */, a1: ($0.a2.value={a1: $0.a4, a2: $0.a6})};
    }
    case 0: /* nothing */ {
     const $1b = Data_Array_Mutable_mgrow($0.a4, $0.a6, $0.a4, {h: 0}, $0.a5);
     return {h: 1 /* {TcContinue37:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: ($0.a4+$0.a4), a5: $1b, a6: undefined};
    }
   }
  }
 }
}

/* Text.ILex.Internal.Types.9500:9393:go */
function Text_ILex_Internal_Types_n__9500_9393_go($0, $1, $2, $3, $4, $5) {
 return __tailRec(x24tcOpt_37, {h: 1 /* {TcContinue37:1} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5});
}

/* Text.ILex.Internal.Types.case block in insert1,go */
function Text_ILex_Internal_Types_case__insert1x2cgo_9410($0, $1, $2, $3, $4, $5, $6) {
 return __tailRec(x24tcOpt_37, {h: 2 /* {TcContinue37:2} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4, a6: $5, a7: $6});
}

/* {$tcOpt:38} */
function x24tcOpt_38($0) {
 switch($0.a4.h) {
  case undefined: /* cons */ {
   switch($0.a5.h) {
    case undefined: /* cons */ {
     const $4 = Text_ILex_Char_Set_appendNonEmpty($0.a1, $0.a2, $0.a3, Text_ILex_Char_Range_intersection($0.a1.a1, $0.a4.a1, $0.a5.a1));
     const $f = {a1: $0.a4.a1, a2: $0.a4.a2};
     const $12 = {a1: $0.a5.a1, a2: $0.a5.a2};
     switch($0.a1.a1.a3(Text_ILex_Char_Range_upperBound($0.a1, $0.a4.a1))(Text_ILex_Char_Range_upperBound($0.a1, $0.a5.a1))) {
      case 1: return {h: 1 /* {TcContinue38:1} */, a1: $0.a1, a2: $0.a2, a3: $4, a4: $0.a4.a2, a5: $12};
      case 0: return {h: 1 /* {TcContinue38:1} */, a1: $0.a1, a2: $0.a2, a3: $4, a4: $f, a5: $0.a5.a2};
     }
    }
    default: return {h: 0 /* {TcDone:38} */, a1: Prelude_Types_SnocList_x3cx3ex3e($0.a3, {h: 0})};
   }
  }
  default: return {h: 0 /* {TcDone:38} */, a1: Prelude_Types_SnocList_x3cx3ex3e($0.a3, {h: 0})};
 }
}

/* Text.ILex.Char.Set.inters : WithBounds t => Neg t =>
SnocList (RangeOf t) -> List (RangeOf t) -> List (RangeOf t) -> List (RangeOf t) */
function Text_ILex_Char_Set_inters($0, $1, $2, $3, $4) {
 return __tailRec(x24tcOpt_38, {h: 1 /* {TcContinue38:1} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4});
}

/* {$tcOpt:39} */
function x24tcOpt_39($0) {
 switch($0.a3) {
  case 0n: return {h: 0 /* {TcDone:39} */, a1: $0.a2};
  default: {
   const $4 = ($0.a3-1n);
   return {h: 1 /* {TcContinue39:1} */, a1: $0.a1, a2: (($0.a2*10n)+(BigInt(Data_Buffer_Core_prim__getByte($0.a1, $0.a4))-48n)), a3: $4, a4: ($0.a4+1n)};
  }
 }
}

/* Text.ILex.Util.decimalBV : IBuffer n -> Integer -> (k : Nat) -> Ix k n => Integer */
function Text_ILex_Util_decimalBV($0, $1, $2, $3) {
 return __tailRec(x24tcOpt_39, {h: 1 /* {TcContinue39:1} */, a1: $0, a2: $1, a3: $2, a4: $3});
}

/* {$tcOpt:40} */
function x24tcOpt_40($0) {
 switch($0.a1.h) {
  case 0: /* nil */ {
   switch($0.a2.h) {
    case 0: /* nil */ return {h: 0 /* {TcDone:40} */, a1: 1};
    case undefined: /* cons */ return {h: 0 /* {TcDone:40} */, a1: 0};
   }
  }
  case undefined: /* cons */ {
   switch($0.a2.h) {
    case 0: /* nil */ return {h: 0 /* {TcDone:40} */, a1: 2};
    case undefined: /* cons */ {
     switch(Prelude_EqOrd_compare_Ord_Integer($0.a1.a1, $0.a2.a1)) {
      case 0: return {h: 0 /* {TcDone:40} */, a1: 0};
      case 2: return {h: 0 /* {TcDone:40} */, a1: 2};
      case 1: return {h: 1 /* {TcContinue40:1} */, a1: $0.a1.a2, a2: $0.a2.a2};
     }
    }
   }
  }
 }
}

/* Value.Unicode.Order.compareCodesWorker : (left : List Nat) -> (right : List Nat) ->
(0 _ : (CodesBefore left right -> CodesBefore originalLeft originalRight)) ->
(0 _ : (left = right -> originalLeft = originalRight)) ->
(0 _ : (CodesBefore right left -> CodesBefore originalRight originalLeft)) ->
CodesComparison originalLeft originalRight */
function Value_Unicode_Order_compareCodesWorker($0, $1) {
 return __tailRec(x24tcOpt_40, {h: 1 /* {TcContinue40:1} */, a1: $0, a2: $1});
}

/* {$tcOpt:41} */
function x24tcOpt_41($0) {
 switch($0.a2.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:41} */, a1: undefined};
  case undefined: /* cons */ {
   const $4 = $0.a1($0.a2.a1)($0.a3);
   return {h: 1 /* {TcContinue41:1} */, a1: $0.a1, a2: $0.a2.a2, a3: undefined};
  }
 }
}

/* Data.Linear.Traverse1.traverse1_List : (a -> F1' s) -> List a -> F1' s */
function Data_Linear_Traverse1_traverse1_List($0, $1, $2) {
 return __tailRec(x24tcOpt_41, {h: 1 /* {TcContinue41:1} */, a1: $0, a2: $1, a3: $2});
}

/* {$tcOpt:42} */
function x24tcOpt_42($0) {
 switch($0.a3.h) {
  case undefined: /* cons */ return {h: 1 /* {TcContinue42:1} */, a1: {a1: $0.a1, a2: $0.a2($0.a3.a1)}, a2: $0.a2, a3: $0.a3.a2};
  case 0: /* nil */ return {h: 0 /* {TcDone:42} */, a1: Prelude_Types_SnocList_x3cx3ex3e($0.a1, {h: 0})};
 }
}

/* Prelude.Types.List.mapAppend : SnocList b -> (a -> b) -> List a -> List b */
function Prelude_Types_List_mapAppend($0, $1, $2) {
 return __tailRec(x24tcOpt_42, {h: 1 /* {TcContinue42:1} */, a1: $0, a2: $1, a3: $2});
}

/* {$tcOpt:43} */
function x24tcOpt_43($0) {
 switch($0.a4) {
  case 0n: return {h: 0 /* {TcDone:43} */, a1: 0};
  default: {
   const $4 = ($0.a4-1n);
   switch($0.a3(Data_Buffer_Core_prim__getByteOffset($0.a2.a1, $0.a5, $0.a2.a2))) {
    case 1: return {h: 0 /* {TcDone:43} */, a1: 1};
    case 0: return {h: 1 /* {TcContinue43:1} */, a1: $0.a1, a2: $0.a2, a3: $0.a3, a4: $4, a5: ($0.a5+1n)};
   }
  }
 }
}

/* Data.ByteVect.6697:3023:go */
function Data_ByteVect_n__6697_3023_go($0, $1, $2, $3, $4) {
 return __tailRec(x24tcOpt_43, {h: 1 /* {TcContinue43:1} */, a1: $0, a2: $1, a3: $2, a4: $3, a5: $4});
}

/* {$tcOpt:44} */
function x24tcOpt_44($0) {
 switch($0.a1.h) {
  case 0: /* nil */ return {h: 0 /* {TcDone:44} */, a1: $0.a2};
  case undefined: /* cons */ return {h: 1 /* {TcContinue44:1} */, a1: $0.a1.a1, a2: {a1: $0.a1.a2, a2: $0.a2}};
 }
}

/* Prelude.Types.SnocList.(<>>) : SnocList a -> List a -> List a */
function Prelude_Types_SnocList_x3cx3ex3e($0, $1) {
 return __tailRec(x24tcOpt_44, {h: 1 /* {TcContinue44:1} */, a1: $0, a2: $1});
}

/* {__mainExpression:0} */
function __mainExpression_0() {
 return PrimIO_unsafePerformIO($2 => Main_main($2));
}

/* {csegen:6} */
const csegen_6 = __lazy(function () {
 const $0 = b => a => func => $1 => {
  switch($1.h) {
   case 0: /* Left */ return {h: 0 /* Left */, a1: $1.a1};
   case 1: /* Right */ return {h: 1 /* Right */, a1: func($1.a1)};
  }
 };
 const $a = b => a => $b => $c => {
  switch($b.h) {
   case 0: /* Left */ return {h: 0 /* Left */, a1: $b.a1};
   case 1: /* Right */ {
    switch($c.h) {
     case 1: /* Right */ return {h: 1 /* Right */, a1: $b.a1($c.a1)};
     case 0: /* Left */ return {h: 0 /* Left */, a1: $c.a1};
    }
   }
  }
 };
 return {a1: $0, a2: a => $8 => ({h: 1 /* Right */, a1: $8}), a3: $a};
});

/* {csegen:24} */
const csegen_24 = __lazy(function () {
 return {a1: acc => elem => func => init => input => Prelude_Types_foldr_Foldable_List(func, init, input), a2: elem => acc => func => init => input => Prelude_Types_foldl_Foldable_List(func, init, input), a3: elem => $b => Prelude_Types_null_Foldable_List($b), a4: elem => acc => m => $f => funcM => init => input => Prelude_Types_foldlM_Foldable_List($f, funcM, init, input), a5: elem => $16 => $16, a6: a => m => $18 => f => $19 => Prelude_Types_foldMap_Foldable_List($18, f, $19)};
});

/* {csegen:30} */
const csegen_30 = __lazy(function () {
 return Prelude_Interfaces_sequence(csegen_6(), {a1: b => a => func => $5 => Prelude_Types_List_mapAppend({h: 0}, func, $5), a2: csegen_24(), a3: b => a => f => $d => $e => $f => Prelude_Types_traverse_Traversable_List($d, $e, $f)});
});

/* {csegen:97} */
const csegen_97 = __lazy(function () {
 return {a1: {h: 2 /* And */, a1: Text_ILex_Interfaces_jsonSpace(), a2: {h: 4 /* Star */, a1: Text_ILex_Interfaces_jsonSpace()}}, a2: {h: 1 /* Ign */}};
});

/* {csegen:98} */
const csegen_98 = __lazy(function () {
 return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('n'.codePointAt(0)))};
});

/* {csegen:99} */
const csegen_99 = __lazy(function () {
 return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('u'.codePointAt(0)))};
});

/* {csegen:100} */
const csegen_100 = __lazy(function () {
 return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('l'.codePointAt(0)))};
});

/* {csegen:107} */
const csegen_107 = __lazy(function () {
 return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('t'.codePointAt(0)))};
});

/* {csegen:108} */
const csegen_108 = __lazy(function () {
 return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('r'.codePointAt(0)))};
});

/* {csegen:109} */
const csegen_109 = __lazy(function () {
 return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('e'.codePointAt(0)))};
});

/* {csegen:116} */
const csegen_116 = __lazy(function () {
 return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('f'.codePointAt(0)))};
});

/* {csegen:128} */
const csegen_128 = __lazy(function () {
 const $d = $e => {
  const $10 = ($e.a1.a9.value);
  switch($10.h) {
   case 0: /* PA */ {
    const $16 = ($e.a1.a9.value={h: 0 /* PA */, a1: $10.a1, a2: {a1: $10.a2, a2: {h: 0 /* JNull */}}});
    return JSON_Parser_AVal();
   }
   case 2: /* PL */ {
    const $21 = ($e.a1.a9.value={h: 1 /* PO */, a1: $10.a1, a2: {a1: $10.a2, a2: {a1: $10.a3, a2: {h: 0 /* JNull */}}}});
    return JSON_Parser_OVal();
   }
   case 4: /* PV */ {
    const $2e = ($e.a1.a9.value={h: 4 /* PV */, a1: {a1: $10.a1, a2: {h: 0 /* JNull */}}});
    return JSON_Parser_JIni();
   }
   default: {
    const $38 = ($e.a1.a9.value={h: 5 /* PF */, a1: {h: 0 /* JNull */}});
    return JSON_Parser_JDone();
   }
  }
 };
 const $c = {h: 0 /* Run */, a1: $d};
 const $0 = {a1: {h: 2 /* And */, a1: csegen_98(), a2: {h: 2 /* And */, a1: csegen_99(), a2: {h: 2 /* And */, a1: csegen_100(), a2: csegen_100()}}}, a2: $c};
 const $4e = $4f => {
  const $51 = ($4f.a1.a9.value);
  switch($51.h) {
   case 0: /* PA */ {
    const $57 = ($4f.a1.a9.value={h: 0 /* PA */, a1: $51.a1, a2: {a1: $51.a2, a2: {h: 4 /* JBool */, a1: 1}}});
    return JSON_Parser_AVal();
   }
   case 2: /* PL */ {
    const $63 = ($4f.a1.a9.value={h: 1 /* PO */, a1: $51.a1, a2: {a1: $51.a2, a2: {a1: $51.a3, a2: {h: 4 /* JBool */, a1: 1}}}});
    return JSON_Parser_OVal();
   }
   case 4: /* PV */ {
    const $71 = ($4f.a1.a9.value={h: 4 /* PV */, a1: {a1: $51.a1, a2: {h: 4 /* JBool */, a1: 1}}});
    return JSON_Parser_JIni();
   }
   default: {
    const $7c = ($4f.a1.a9.value={h: 5 /* PF */, a1: {h: 4 /* JBool */, a1: 1}});
    return JSON_Parser_JDone();
   }
  }
 };
 const $4d = {h: 0 /* Run */, a1: $4e};
 const $41 = {a1: {h: 2 /* And */, a1: csegen_107(), a2: {h: 2 /* And */, a1: csegen_108(), a2: {h: 2 /* And */, a1: csegen_99(), a2: csegen_109()}}}, a2: $4d};
 const $9c = $9d => {
  const $9f = ($9d.a1.a9.value);
  switch($9f.h) {
   case 0: /* PA */ {
    const $a5 = ($9d.a1.a9.value={h: 0 /* PA */, a1: $9f.a1, a2: {a1: $9f.a2, a2: {h: 4 /* JBool */, a1: 0}}});
    return JSON_Parser_AVal();
   }
   case 2: /* PL */ {
    const $b1 = ($9d.a1.a9.value={h: 1 /* PO */, a1: $9f.a1, a2: {a1: $9f.a2, a2: {a1: $9f.a3, a2: {h: 4 /* JBool */, a1: 0}}}});
    return JSON_Parser_OVal();
   }
   case 4: /* PV */ {
    const $bf = ($9d.a1.a9.value={h: 4 /* PV */, a1: {a1: $9f.a1, a2: {h: 4 /* JBool */, a1: 0}}});
    return JSON_Parser_JIni();
   }
   default: {
    const $ca = ($9d.a1.a9.value={h: 5 /* PF */, a1: {h: 4 /* JBool */, a1: 0}});
    return JSON_Parser_JDone();
   }
  }
 };
 const $9b = {h: 0 /* Run */, a1: $9c};
 const $86 = {a1: {h: 2 /* And */, a1: csegen_116(), a2: {h: 2 /* And */, a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('a'.codePointAt(0)))}, a2: {h: 2 /* And */, a1: csegen_100(), a2: {h: 2 /* And */, a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('s'.codePointAt(0)))}, a2: csegen_109()}}}}, a2: $9b};
 const $85 = {a1: $86, a2: {h: 0}};
 const $40 = {a1: $41, a2: $85};
 return {a1: $0, a2: $40};
});

/* {csegen:132} */
const csegen_132 = __lazy(function () {
 const $4 = $5 => {
  const $8 = ($5.a1.a6.value);
  const $d = ($5.a1.a7.value);
  let $7;
  switch($8) {
   case 0n: {
    $7 = Data_ByteString_toString(Data_ByteString_append($5.a1.a2, {a1: Prelude_Types_prim__integerToNat(($d-$8)), a2: {a1: $5.a1.a3, a2: $8}}));
    break;
   }
   default: $7 = Data_Buffer_Core_toString($5.a1.a3, $8, Prelude_Types_prim__integerToNat(($d-$8)));
  }
  const $2b = ($5.a1.a9.value);
  switch($2b.h) {
   case 0: /* PA */ {
    const $31 = ($5.a1.a9.value={h: 0 /* PA */, a1: $2b.a1, a2: {a1: $2b.a2, a2: {h: 3 /* JDecimal */, a1: $7}}});
    return JSON_Parser_AVal();
   }
   case 2: /* PL */ {
    const $3d = ($5.a1.a9.value={h: 1 /* PO */, a1: $2b.a1, a2: {a1: $2b.a2, a2: {a1: $2b.a3, a2: {h: 3 /* JDecimal */, a1: $7}}}});
    return JSON_Parser_OVal();
   }
   case 4: /* PV */ {
    const $4b = ($5.a1.a9.value={h: 4 /* PV */, a1: {a1: $2b.a1, a2: {h: 3 /* JDecimal */, a1: $7}}});
    return JSON_Parser_JIni();
   }
   default: {
    const $56 = ($5.a1.a9.value={h: 5 /* PF */, a1: {h: 3 /* JDecimal */, a1: $7}});
    return JSON_Parser_JDone();
   }
  }
 };
 const $3 = {h: 0 /* Run */, a1: $4};
 const $0 = {a1: JSON_Parser_jsonDouble(), a2: $3};
 return {a1: $0, a2: {h: 0}};
});

/* {csegen:133} */
const csegen_133 = __lazy(function () {
 return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('-'.codePointAt(0)))};
});

/* {csegen:135} */
const csegen_135 = __lazy(function () {
 return {h: 2 /* And */, a1: {h: 3 /* Or */, a1: csegen_133(), a2: {h: 0 /* Eps */}}, a2: Text_ILex_RExp_decimal()};
});

/* {csegen:139} */
const csegen_139 = __lazy(function () {
 const $4 = $5 => {
  const $8 = ($5.a1.a6.value);
  const $d = ($5.a1.a7.value);
  let $7;
  switch($8) {
   case 0n: {
    $7 = Data_ByteString_append($5.a1.a2, {a1: Prelude_Types_prim__integerToNat(($d-$8)), a2: {a1: $5.a1.a3, a2: $8}});
    break;
   }
   default: $7 = {a1: Prelude_Types_prim__integerToNat(($d-$8)), a2: {a1: $5.a1.a3, a2: $8}};
  }
  const $29 = ($5.a1.a9.value);
  switch($29.h) {
   case 0: /* PA */ {
    const $2f = ($5.a1.a9.value={h: 0 /* PA */, a1: $29.a1, a2: {a1: $29.a2, a2: {h: 1 /* JInteger */, a1: Text_ILex_Util_integerBV($7.a2.a1, $7.a1, $7.a2.a2)}}});
    return JSON_Parser_AVal();
   }
   case 2: /* PL */ {
    const $41 = ($5.a1.a9.value={h: 1 /* PO */, a1: $29.a1, a2: {a1: $29.a2, a2: {a1: $29.a3, a2: {h: 1 /* JInteger */, a1: Text_ILex_Util_integerBV($7.a2.a1, $7.a1, $7.a2.a2)}}}});
    return JSON_Parser_OVal();
   }
   case 4: /* PV */ {
    const $55 = ($5.a1.a9.value={h: 4 /* PV */, a1: {a1: $29.a1, a2: {h: 1 /* JInteger */, a1: Text_ILex_Util_integerBV($7.a2.a1, $7.a1, $7.a2.a2)}}});
    return JSON_Parser_JIni();
   }
   default: {
    const $66 = ($5.a1.a9.value={h: 5 /* PF */, a1: {h: 1 /* JInteger */, a1: Text_ILex_Util_integerBV($7.a2.a1, $7.a1, $7.a2.a2)}});
    return JSON_Parser_JDone();
   }
  }
 };
 const $3 = {h: 0 /* Run */, a1: $4};
 const $0 = {a1: csegen_135(), a2: $3};
 return {a1: $0, a2: csegen_132()};
});

/* {csegen:148} */
const csegen_148 = __lazy(function () {
 return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('\"'.codePointAt(0)))};
});

/* {csegen:152} */
const csegen_152 = __lazy(function () {
 const $4 = $5 => {
  const $9 = ($5.a1.a6.value);
  let $8;
  switch($9) {
   case 0n: {
    $8 = $5.a1.a4;
    break;
   }
   default: $8 = ($5.a1.a5+$9);
  }
  const $13 = ($5.a1.a8.value);
  const $7 = ($5.a1.a8.value={a1: $13, a2: $8});
  return JSON_Parser_JStr();
 };
 const $3 = {h: 0 /* Run */, a1: $4};
 const $0 = {a1: csegen_148(), a2: $3};
 return {a1: $0, a2: {h: 0}};
});

/* {csegen:154} */
const csegen_154 = __lazy(function () {
 const $7 = $8 => {
  const $c = ($8.a1.a6.value);
  let $b;
  switch($c) {
   case 0n: {
    $b = $8.a1.a4;
    break;
   }
   default: $b = ($8.a1.a5+$c);
  }
  const $16 = ($8.a1.a8.value);
  const $a = ($8.a1.a8.value={a1: $16, a2: $b});
  const $22 = ($8.a1.a9.value);
  const $27 = ($8.a1.a9.value={h: 1 /* PO */, a1: $22, a2: {h: 0}});
  return JSON_Parser_ONew();
 };
 const $6 = {h: 0 /* Run */, a1: $7};
 const $0 = {a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('{'.codePointAt(0)))}, a2: $6};
 const $38 = $39 => {
  const $3d = ($39.a1.a6.value);
  let $3c;
  switch($3d) {
   case 0n: {
    $3c = $39.a1.a4;
    break;
   }
   default: $3c = ($39.a1.a5+$3d);
  }
  const $47 = ($39.a1.a8.value);
  const $3b = ($39.a1.a8.value={a1: $47, a2: $3c});
  const $53 = ($39.a1.a9.value);
  const $58 = ($39.a1.a9.value={h: 0 /* PA */, a1: $53, a2: {h: 0}});
  return JSON_Parser_ANew();
 };
 const $37 = {h: 0 /* Run */, a1: $38};
 const $31 = {a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('['.codePointAt(0)))}, a2: $37};
 const $30 = {a1: $31, a2: csegen_152()};
 return {a1: $0, a2: $30};
});

/* {csegen:155} */
const csegen_155 = __lazy(function () {
 return Prelude_Types_List_tailRecAppend(csegen_154(), {h: 0});
});

/* {csegen:178} */
const csegen_178 = __lazy(function () {
 return () => ({a1: $1 => s => o => bs => buf => rf => rt => sk => ({a1: s, a2: bs, a3: buf, a4: o, a5: (o+bs.a1), a6: rf, a7: rt, a8: sk.a8, a9: sk.a9, a10: sk.a10, a11: sk.a11, a12: sk.a12}), a2: $13 => $14 => $14.a1, a3: $17 => $18 => $18.a2, a4: $1b => $1c => $1c.a3, a5: $1f => $20 => $20.a4, a6: $23 => $24 => $24.a5, a7: $27 => $28 => $28.a6, a8: $2b => $2c => $2c.a7, a9: $2f => $30 => $30.a8});
});

/* {csegen:180} */
const csegen_180 = __lazy(function () {
 const $0 = $1 => {
  const $4 = ($1.a1.a8.value);
  let $3;
  switch($4.h) {
   case undefined: /* cons */ {
    $3 = ($1.a1.a8.value=$4.a1);
    break;
   }
   default: $3 = undefined;
  }
  const $f = ($1.a1.a9.value);
  switch($f.h) {
   case 1: /* PO */ {
    const $15 = JSON_Object_checkedAssoc(Prelude_Types_SnocList_x3cx3ex3e($f.a2, {h: 0}));
    switch($15.h) {
     case 1: /* Right */ {
      switch($f.a1.h) {
       case 0: /* PA */ {
        const $1c = ($1.a1.a9.value={h: 0 /* PA */, a1: $f.a1.a1, a2: {a1: $f.a1.a2, a2: {h: 7 /* JsonObject */, a1: $15.a1}}});
        return JSON_Parser_AVal();
       }
       case 2: /* PL */ {
        const $28 = ($1.a1.a9.value={h: 1 /* PO */, a1: $f.a1.a1, a2: {a1: $f.a1.a2, a2: {a1: $f.a1.a3, a2: {h: 7 /* JsonObject */, a1: $15.a1}}}});
        return JSON_Parser_OVal();
       }
       case 4: /* PV */ {
        const $36 = ($1.a1.a9.value={h: 4 /* PV */, a1: {a1: $f.a1.a1, a2: {h: 7 /* JsonObject */, a1: $15.a1}}});
        return JSON_Parser_JIni();
       }
       default: {
        const $41 = ($1.a1.a9.value={h: 5 /* PF */, a1: {h: 7 /* JsonObject */, a1: $15.a1}});
        return JSON_Parser_JDone();
       }
      }
     }
     case 0: /* Left */ {
      const $4b = ($1.a1.a6.value);
      const $4a = Text_ILex_Interfaces_case__casex20blockx20inx20bounds_17943(csegen_178()(), $1.a1, $4b, ($1.a1.a7.value));
      const $5b = ($1.a1.a12.value);
      switch($5b.h) {
       case undefined: /* just */ return JSON_Parser_JDone();
       case 0: /* nothing */ {
        const $62 = ($1.a1.a12.value={a1: {a1: {h: 0 /* Custom */, a1: $15.a1}, a2: $4a}});
        return JSON_Parser_JDone();
       }
      }
     }
    }
   }
   case 0: /* PA */ {
    switch($f.a1.h) {
     case 0: /* PA */ {
      const $6e = ($1.a1.a9.value={h: 0 /* PA */, a1: $f.a1.a1, a2: {a1: $f.a1.a2, a2: {h: 6 /* JArray */, a1: Prelude_Types_SnocList_x3cx3ex3e($f.a2, {h: 0})}}});
      return JSON_Parser_AVal();
     }
     case 2: /* PL */ {
      const $7d = ($1.a1.a9.value={h: 1 /* PO */, a1: $f.a1.a1, a2: {a1: $f.a1.a2, a2: {a1: $f.a1.a3, a2: {h: 6 /* JArray */, a1: Prelude_Types_SnocList_x3cx3ex3e($f.a2, {h: 0})}}}});
      return JSON_Parser_OVal();
     }
     case 4: /* PV */ {
      const $8e = ($1.a1.a9.value={h: 4 /* PV */, a1: {a1: $f.a1.a1, a2: {h: 6 /* JArray */, a1: Prelude_Types_SnocList_x3cx3ex3e($f.a2, {h: 0})}}});
      return JSON_Parser_JIni();
     }
     default: {
      const $9c = ($1.a1.a9.value={h: 5 /* PF */, a1: {h: 6 /* JArray */, a1: Prelude_Types_SnocList_x3cx3ex3e($f.a2, {h: 0})}});
      return JSON_Parser_JDone();
     }
    }
   }
   default: return JSON_Parser_JDone();
  }
 };
 return {h: 0 /* Run */, a1: $0};
});

/* {csegen:182} */
const csegen_182 = __lazy(function () {
 return {a1: {a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32(']'.codePointAt(0)))}, a2: csegen_180()}, a2: {h: 0}};
});

/* {csegen:184} */
const csegen_184 = __lazy(function () {
 return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32(','.codePointAt(0)))};
});

/* {csegen:193} */
const csegen_193 = __lazy(function () {
 return {a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('}'.codePointAt(0)))}, a2: csegen_180()};
});

/* {csegen:224} */
const csegen_224 = __lazy(function () {
 return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('\u{5c}'.codePointAt(0)))};
});

/* {csegen:277} */
const csegen_277 = __lazy(function () {
 return () => $0 => $1 => $1.a12;
});

/* {csegen:279} */
const csegen_279 = __lazy(function () {
 return $0 => $1 => {
  const $2 = ($0.a12.value);
  return Prelude_Types_maybe(() => $a => Text_ILex_Interfaces_unclosedIfEOIErr(csegen_277()(), $0, csegen_178()(), '[', {h: 0}, $a), () => $17 => $18 => $17, $2)(undefined);
 };
});

/* {csegen:310} */
const csegen_310 = __lazy(function () {
 return {h: 2 /* And */, a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_digit()}, a2: {h: 4 /* Star */, a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_digit()}}};
});

/* {csegen:323} */
const csegen_323 = __lazy(function () {
 return {a1: {a1: {a1: $3 => $4 => Prelude_EqOrd_x3dx3d_Eq_Bits32($3, $4), a2: $9 => $a => Prelude_EqOrd_x2fx3d_Eq_Bits32($9, $a)}, a2: $f => $10 => Prelude_EqOrd_compare_Ord_Bits32($f, $10), a3: $15 => $16 => Prelude_EqOrd_x3c_Ord_Bits32($15, $16), a4: $1b => $1c => Prelude_EqOrd_x3e_Ord_Bits32($1b, $1c), a5: $21 => $22 => Prelude_EqOrd_x3cx3d_Ord_Bits32($21, $22), a6: $27 => $28 => Prelude_EqOrd_x3ex3d_Ord_Bits32($27, $28), a7: $2d => $2e => Prelude_EqOrd_max_Ord_Bits32($2d, $2e), a8: $33 => $34 => Prelude_EqOrd_min_Ord_Bits32($33, $34)}, a2: 0, a3: 4294967295};
});

/* {csegen:328} */
const csegen_328 = __lazy(function () {
 return {a1: {a1: $2 => $3 => _add32u($2, $3), a2: $7 => $8 => _mul32u($7, $8), a3: $c => Number(_truncUBigInt32($c))}, a2: $f => _sub32u(0, $f), a3: $13 => $14 => _sub32u($13, $14)};
});

/* {csegen:341} */
const csegen_341 = __lazy(function () {
 return $0 => $1 => $2 => Text_ILex_Stack_init({h: 3 /* PI */}, $0, $1, $2);
});

/* {csegen:342} */
const csegen_342 = __lazy(function () {
 return $0 => $1 => $2 => JSON_Parser_jsonEOI($0, $1, $2);
});

/* {csegen:365} */
const csegen_365 = __lazy(function () {
 let $1;
 switch(Prelude_EqOrd_x3cx3d_Ord_Bits32(_truncUInt32('0'.codePointAt(0)), _truncUInt32('9'.codePointAt(0)))) {
  case 1: {
   $1 = {a1: _truncUInt32('0'.codePointAt(0)), a2: _truncUInt32('9'.codePointAt(0))};
   break;
  }
  case 0: {
   $1 = {h: 0};
   break;
  }
 }
 return Text_ILex_Char_Set_range($1);
});

/* {csegen:390} */
const csegen_390 = __lazy(function () {
 return {a1: $1 => $2 => (($1===$2)?1:0), a2: $6 => $7 => Prelude_Types_x2fx3d_Eq_Nat($6, $7)};
});

/* {csegen:398} */
const csegen_398 = __lazy(function () {
 return {a1: csegen_390(), a2: $3 => $4 => Prelude_EqOrd_compare_Ord_Integer($3, $4), a3: $9 => $a => Prelude_Types_x3c_Ord_Nat($9, $a), a4: $f => $10 => Prelude_Types_x3e_Ord_Nat($f, $10), a5: $15 => $16 => Prelude_Types_x3cx3d_Ord_Nat($15, $16), a6: $1b => $1c => Prelude_Types_x3ex3d_Ord_Nat($1b, $1c), a7: $21 => $22 => Prelude_Types_max_Ord_Nat($21, $22), a8: $27 => $28 => Prelude_Types_min_Ord_Nat($27, $28)};
});

/* {csegen:404} */
const csegen_404 = __lazy(function () {
 return {a1: $1 => $2 => Prelude_EqOrd_x3dx3d_Eq_Bits8($1, $2), a2: $7 => $8 => Prelude_EqOrd_x2fx3d_Eq_Bits8($7, $8)};
});

/* {csegen:412} */
const csegen_412 = __lazy(function () {
 return {a1: csegen_404(), a2: $3 => $4 => Prelude_EqOrd_compare_Ord_Bits8($3, $4), a3: $9 => $a => Prelude_EqOrd_x3c_Ord_Bits8($9, $a), a4: $f => $10 => Prelude_EqOrd_x3e_Ord_Bits8($f, $10), a5: $15 => $16 => Prelude_EqOrd_x3cx3d_Ord_Bits8($15, $16), a6: $1b => $1c => Prelude_EqOrd_x3ex3d_Ord_Bits8($1b, $1c), a7: $21 => $22 => Prelude_EqOrd_max_Ord_Bits8($21, $22), a8: $27 => $28 => Prelude_EqOrd_min_Ord_Bits8($27, $28)};
});

/* {csegen:413} */
const csegen_413 = __lazy(function () {
 return {a1: csegen_412(), a2: 0, a3: 255};
});

/* {csegen:416} */
const csegen_416 = __lazy(function () {
 return {a1: $1 => $2 => _add8u($1, $2), a2: $6 => $7 => _mul8u($6, $7), a3: $b => Number(_truncUBigInt8($b))};
});

/* {csegen:421} */
const csegen_421 = __lazy(function () {
 return {a1: csegen_416(), a2: $3 => _sub8u(0, $3), a3: $7 => $8 => _sub8u($7, $8)};
});

/* {csegen:424} */
const csegen_424 = __lazy(function () {
 return $0 => $0.a2;
});

/* {csegen:442} */
const csegen_442 = __lazy(function () {
 return $0 => $1 => Text_ILex_Internal_NFA_joinNNode($0, $1);
});

/* {csegen:447} */
const csegen_447 = __lazy(function () {
 const $a = a => b => {
  switch(Text_ILex_Char_Range_eqRangeOf(csegen_404(), a, b)) {
   case 1: return 0;
   case 0: return 1;
  }
 };
 const $1 = {a1: $3 => $4 => Text_ILex_Char_Range_eqRangeOf(csegen_404(), $3, $4), a2: $a};
 return Language_Reflection_Derive_mkOrd($1, $12 => $13 => Text_ILex_Char_Range_ordRangeOf(csegen_412(), $12, $13));
});

/* {csegen:451} */
const csegen_451 = __lazy(function () {
 return Text_ILex_Char_UTF8_bytes(Text_ILex_Char_UTF8_MinAddByte(), Text_ILex_Char_UTF8_MaxAddByte());
});

/* {csegen:453} */
const csegen_453 = __lazy(function () {
 return {a1: $1 => $2 => ($1+$2), a2: ''};
});

/* {csegen:455} */
const csegen_455 = __lazy(function () {
 return $0 => Prelude_EqOrd_x3dx3d_Eq_Bits8(10, $0);
});

/* prim__sub_Integer : Integer -> Integer -> Integer */
function prim__sub_Integer($0, $1) {
 return ($0-$1);
}

/* Main.main : IO () */
function Main_main($0) {
 return Main_register($3 => Main_exchange($3), $0);
}

/* Main.exchange : String -> String */
function Main_exchange($0) {
 return Prelude_Types_either(() => $3 => Main_raise($3), () => $7 => $7, Salutation_JSON_greetJSON($0));
}

/* Salutation.JSON.toJsonGreeting : Encoder v => Greeting -> Either String v */
function Salutation_JSON_toJsonGreeting($0, $1) {
 const $a = Value_Unicode_scalarString('message');
 let $9;
 switch($a.h) {
  case 0: /* Left */ {
   $9 = {h: 0 /* Left */, a1: 'JSON: isolated surrogate object key'};
   break;
  }
  case 1: /* Right */ {
   $9 = {h: 1 /* Right */, a1: $a.a1};
   break;
  }
 }
 const $7 = Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29($9, _ => Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29(JSON_ToJSON_toJSON_ToJSON_String($0, $1), value => ({h: 1 /* Right */, a1: {a1: 'message', a2: value}})));
 const $6 = {a1: $7, a2: {h: 0}};
 const $3 = csegen_30()($6);
 return Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29($3, $1b => JSON_Encoder_objectChecked($0, $1b));
}

/* Salutation.JSON.toJsonGreetResponse : Encoder v => GreetResponse -> Either String v */
function Salutation_JSON_toJsonGreetResponse($0, $1) {
 const $a = Value_Unicode_scalarString('greetings');
 let $9;
 switch($a.h) {
  case 0: /* Left */ {
   $9 = {h: 0 /* Left */, a1: 'JSON: isolated surrogate object key'};
   break;
  }
  case 1: /* Right */ {
   $9 = {h: 1 /* Right */, a1: $a.a1};
   break;
  }
 }
 const $7 = Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29($9, _ => Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29(JSON_ToJSON_toJSON_ToJSON_x28Listx20x24ax29($14 => $15 => $16 => Salutation_JSON_toJsonGreeting($15, $16), $0, $1), value => ({h: 1 /* Right */, a1: {a1: 'greetings', a2: value}})));
 const $6 = {a1: $7, a2: {h: 0}};
 const $3 = csegen_30()($6);
 return Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29($3, $22 => JSON_Encoder_objectChecked($0, $22));
}

/* Salutation.JSON.greetJSON : String -> Either String String */
function Salutation_JSON_greetJSON($0) {
 const $7 = $8 => $9 => {
  const $a = Value_Unicode_scalarString($8);
  switch($a.h) {
   case 0: /* Left */ return {h: 0};
   case 1: /* Right */ return Value_StringKeySortedAssoc_lookupValue($a.a1, $9);
  }
 };
 const $6 = {a1: $7, a2: $11 => Prelude_Types_List_mapAppend({h: 0}, $15 => Value_StringKeySortedAssoc_bindingContent($15), $11)};
 const $19 = $1a => {
  switch($1a.h) {
   case 0: /* JNull */ return 'Null';
   case 4: /* JBool */ return 'Boolean';
   case 2: /* JDouble */ return 'Double';
   case 3: /* JDecimal */ return 'Decimal';
   case 1: /* JInteger */ return 'Integer';
   case 5: /* JString */ return 'String';
   case 6: /* JArray */ return 'Array';
   case 7: /* JsonObject */ return 'Object';
  }
 };
 const $1c = $1d => $1e => {
  const $1f = Text_ILex_Runner_run(Prelude_Types_prim__integerToNat(BigInt(Data_Buffer_stringByteLength(JSON_Parser_prepareText($1e)))), $2a => JSON_Parser_json(), Data_Buffer_Core_fromString(JSON_Parser_prepareText($1e)));
  switch($1f.h) {
   case 0: /* Left */ return {h: 0 /* Left */, a1: Text_ByteBounds_toParseError($1d, Data_Buffer_Core_toString(Data_Buffer_Core_fromString(JSON_Parser_prepareText($1e)), 0n, Prelude_Types_prim__integerToNat(BigInt(Data_Buffer_stringByteLength(JSON_Parser_prepareText($1e))))), $1f.a1)};
   case 1: /* Right */ return {h: 1 /* Right */, a1: $1f.a1};
  }
 };
 const $46 = $47 => {
  switch($47.h) {
   case 7: /* JsonObject */ return {a1: $47.a1};
   default: return {h: 0};
  }
 };
 const $4a = $4b => {
  switch($4b.h) {
   case 6: /* JArray */ return {a1: $4b.a1};
   default: return {h: 0};
  }
 };
 const $4e = $4f => {
  switch($4f.h) {
   case 4: /* JBool */ return {a1: $4f.a1};
   default: return {h: 0};
  }
 };
 const $52 = $53 => {
  switch($53.h) {
   case 2: /* JDouble */ return {a1: $53.a1};
   case 3: /* JDecimal */ return {a1: JSON_Parser_jdouble($53.a1)};
   case 1: /* JInteger */ return {a1: Number($53.a1)};
   default: return {h: 0};
  }
 };
 const $5b = $5c => {
  switch($5c.h) {
   case 1: /* JInteger */ return {a1: $5c.a1};
   default: return {h: 0};
  }
 };
 const $5f = $60 => {
  switch($60.h) {
   case 5: /* JString */ return {a1: $60.a1};
   default: return {h: 0};
  }
 };
 const $63 = $64 => {
  switch($64.h) {
   case 0: /* JNull */ return 1;
   default: return 0;
  }
 };
 const $5 = {a1: $6, a2: $19, a3: $1c, a4: $46, a5: $4a, a6: $4e, a7: $52, a8: $5b, a9: $5f, a10: $63};
 const $70 = Text_ILex_Runner_run(Prelude_Types_prim__integerToNat(BigInt(Data_Buffer_stringByteLength(JSON_Parser_prepareText($0)))), $7b => JSON_Parser_json(), Data_Buffer_Core_fromString(JSON_Parser_prepareText($0)));
 let $6f;
 switch($70.h) {
  case 0: /* Left */ {
   $6f = {h: 0 /* Left */, a1: Text_ByteBounds_toParseError({h: 0}, Data_Buffer_Core_toString(Data_Buffer_Core_fromString(JSON_Parser_prepareText($0)), 0n, Prelude_Types_prim__integerToNat(BigInt(Data_Buffer_stringByteLength(JSON_Parser_prepareText($0))))), $70.a1)};
   break;
  }
  case 1: /* Right */ {
   $6f = {h: 1 /* Right */, a1: $70.a1};
   break;
  }
 }
 const $3 = JSON_FromJSON_case__decodeVia_7563($5, $67 => $68 => $69 => $6a => Salutation_JSON_fromJsonGreetRequest($69, $6a), $0, $6f);
 let $2;
 switch($3.h) {
  case 0: /* Left */ {
   $2 = {h: 0 /* Left */, a1: JSON_FromJSON_interpolate_Interpolation_DecodingErr($3.a1)};
   break;
  }
  case 1: /* Right */ {
   $2 = {h: 1 /* Right */, a1: $3.a1};
   break;
  }
 }
 return Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29($2, request => JSON_ToJSON_encode($9e => $9f => $a0 => Salutation_JSON_toJsonGreetResponse($9f, $a0), Salutation_greet(request)));
}

/* Salutation.JSON.fromJsonRecipient : Value v obj => Parser v Recipient */
function Salutation_JSON_fromJsonRecipient($0, $1) {
 const $8 = $9 => {
  const $a = JSON_FromJSON_explicitParseField($0.a1, $0, $10 => JSON_FromJSON_fromJSON_FromJSON_String($0, $10), $9, 'name');
  switch($a.h) {
   case 1: /* Right */ return {h: 1 /* Right */, a1: $a.a1};
   case 0: /* Left */ return {h: 0 /* Left */, a1: $a.a1};
  }
 };
 return JSON_FromJSON_withValue($0, 'Object', $0.a4, () => 'Recipient', $8, $1);
}

/* Salutation.JSON.fromJsonGreetRequest : Value v obj => Parser v GreetRequest */
function Salutation_JSON_fromJsonGreetRequest($0, $1) {
 const $8 = $9 => {
  const $a = JSON_FromJSON_explicitParseField($0.a1, $0, $10 => JSON_FromJSON_fromJSON_FromJSON_x28Listx20x24ax29($13 => $14 => $15 => $16 => Salutation_JSON_fromJsonRecipient($15, $16), $0, $10), $9, 'recipients');
  switch($a.h) {
   case 1: /* Right */ return {h: 1 /* Right */, a1: $a.a1};
   case 0: /* Left */ return {h: 0 /* Left */, a1: $a.a1};
  }
 };
 return JSON_FromJSON_withValue($0, 'Object', $0.a4, () => 'GreetRequest', $8, $1);
}

/* Salutation.2645:876:greeting */
function Salutation_n__2645_876_greeting($0, $1) {
 return ('Hello, '+($1+'!'));
}

/* Salutation.greet : GreetRequest -> GreetResponse */
function Salutation_greet($0) {
 return Prelude_Types_List_mapAppend({h: 0}, $4 => Salutation_n__2645_876_greeting($0, $4), $0);
}

/* Prelude.Basics.uncurry : (a -> b -> c) -> (a, b) -> c */
function Prelude_Basics_uncurry($0, $1) {
 return $0($1.a1)($1.a2);
}

/* Prelude.Basics.flip : (a -> b -> c) -> b -> a -> c */
function Prelude_Basics_flip($0, $1, $2) {
 return $0($2)($1);
}

/* Builtin.swap : (a, b) -> (b, a) */
function Builtin_swap($0) {
 return {a1: $0.a2, a2: $0.a1};
}

/* Builtin.snd : (a, b) -> b */
function Builtin_snd($0) {
 return $0.a2;
}

/* Builtin.fst : (a, b) -> a */
function Builtin_fst($0) {
 return $0.a1;
}

/* Prelude.Types.traverse */
function Prelude_Types_traverse_Traversable_List($0, $1, $2) {
 switch($2.h) {
  case 0: /* nil */ return $0.a2(undefined)({h: 0});
  case undefined: /* cons */ return $0.a3(undefined)(undefined)($0.a3(undefined)(undefined)($0.a2(undefined)($1e => $1f => ({a1: $1e, a2: $1f})))($1($2.a1)))(Prelude_Types_traverse_Traversable_List($0, $1, $2.a2));
 }
}

/* Prelude.Types.rangeFromTo */
function Prelude_Types_rangeFromTo_Range_x24a($0, $1, $2) {
 const $4 = Builtin_fst(Builtin_snd($0));
 const $3 = $4.a2($1)($2);
 switch($3) {
  case 0: {
   const $e = $f => {
    const $10 = Builtin_fst(Builtin_snd($0));
    return $10.a6($f)($2);
   };
   const $1c = $1d => {
    const $1e = Builtin_snd(Builtin_snd($0));
    const $28 = Builtin_snd(Builtin_snd($0));
    const $27 = $28.a1.a3(1n);
    return $1e.a1.a1($1d)($27);
   };
   const $19 = Prelude_Types_countFrom($1, $1c);
   return Prelude_Types_takeUntil($e, $19);
  }
  case 1: return Prelude_Types_pure_Applicative_List($1);
  case 2: {
   const $33 = $34 => {
    const $35 = Builtin_fst(Builtin_snd($0));
    return $35.a5($34)($2);
   };
   const $41 = x => {
    const $42 = Builtin_snd(Builtin_snd($0));
    const $4b = Builtin_snd(Builtin_snd($0));
    const $4a = $4b.a1.a3(1n);
    return $42.a3(x)($4a);
   };
   const $3e = Prelude_Types_countFrom($1, $41);
   return Prelude_Types_takeUntil($33, $3e);
  }
 }
}

/* Prelude.Types.pure */
function Prelude_Types_pure_Applicative_List($0) {
 return {a1: $0, a2: {h: 0}};
}

/* Prelude.Types.null */
function Prelude_Types_null_Foldable_List($0) {
 switch($0.h) {
  case 0: /* nil */ return 1;
  case undefined: /* cons */ return 0;
 }
}

/* Prelude.Types.min */
function Prelude_Types_min_Ord_Nat($0, $1) {
 switch(Prelude_Types_x3c_Ord_Nat($0, $1)) {
  case 1: return $0;
  case 0: return $1;
 }
}

/* Prelude.Types.min */
function Prelude_Types_min_Ord_x28Listx20x24ax29($0, $1, $2) {
 switch(Prelude_Types_x3c_Ord_x28Listx20x24ax29($0, $1, $2)) {
  case 1: return $1;
  case 0: return $2;
 }
}

/* Prelude.Types.max */
function Prelude_Types_max_Ord_Nat($0, $1) {
 switch(Prelude_Types_x3e_Ord_Nat($0, $1)) {
  case 1: return $0;
  case 0: return $1;
 }
}

/* Prelude.Types.max */
function Prelude_Types_max_Ord_x28Listx20x24ax29($0, $1, $2) {
 switch(Prelude_Types_x3e_Ord_x28Listx20x24ax29($0, $1, $2)) {
  case 1: return $1;
  case 0: return $2;
 }
}

/* Prelude.Types.map */
function Prelude_Types_map_Functor_Maybe($0, $1) {
 switch($1.h) {
  case undefined: /* just */ return {a1: $0($1.a1)};
  case 0: /* nothing */ return {h: 0};
 }
}

/* Prelude.Types.foldr */
function Prelude_Types_foldr_Foldable_List($0, $1, $2) {
 switch($2.h) {
  case 0: /* nil */ return $1;
  case undefined: /* cons */ return $0($2.a1)(Prelude_Types_foldr_Foldable_List($0, $1, $2.a2));
 }
}

/* Prelude.Types.foldlM */
function Prelude_Types_foldlM_Foldable_List($0, $1, $2, $3) {
 return Prelude_Types_foldl_Foldable_List(ma => b => $0.a2(undefined)(undefined)(ma)($f => Prelude_Basics_flip($1, b, $f)), $0.a1.a2(undefined)($2), $3);
}

/* Prelude.Types.foldMap */
function Prelude_Types_foldMap_Foldable_List($0, $1, $2) {
 return Prelude_Types_foldl_Foldable_List(acc => elem => $0.a1(acc)($1(elem)), $0.a2, $2);
}

/* Prelude.Types.> */
function Prelude_Types_x3e_Ord_Nat($0, $1) {
 return Prelude_EqOrd_x3dx3d_Eq_Ordering(Prelude_EqOrd_compare_Ord_Integer($0, $1), 2);
}

/* Prelude.Types.> */
function Prelude_Types_x3e_Ord_x28Listx20x24ax29($0, $1, $2) {
 return Prelude_EqOrd_x3dx3d_Eq_Ordering(Prelude_Types_compare_Ord_x28Listx20x24ax29($0, $1, $2), 2);
}

/* Prelude.Types.>>= */
function Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29($0, $1) {
 switch($0.h) {
  case 0: /* Left */ return {h: 0 /* Left */, a1: $0.a1};
  case 1: /* Right */ return $1($0.a1);
 }
}

/* Prelude.Types.>= */
function Prelude_Types_x3ex3d_Ord_Nat($0, $1) {
 return Prelude_EqOrd_x2fx3d_Eq_Ordering(Prelude_EqOrd_compare_Ord_Integer($0, $1), 0);
}

/* Prelude.Types.>= */
function Prelude_Types_x3ex3d_Ord_x28Listx20x24ax29($0, $1, $2) {
 return Prelude_EqOrd_x2fx3d_Eq_Ordering(Prelude_Types_compare_Ord_x28Listx20x24ax29($0, $1, $2), 0);
}

/* Prelude.Types.< */
function Prelude_Types_x3c_Ord_Nat($0, $1) {
 return Prelude_EqOrd_x3dx3d_Eq_Ordering(Prelude_EqOrd_compare_Ord_Integer($0, $1), 0);
}

/* Prelude.Types.< */
function Prelude_Types_x3c_Ord_x28Listx20x24ax29($0, $1, $2) {
 return Prelude_EqOrd_x3dx3d_Eq_Ordering(Prelude_Types_compare_Ord_x28Listx20x24ax29($0, $1, $2), 0);
}

/* Prelude.Types.<= */
function Prelude_Types_x3cx3d_Ord_Nat($0, $1) {
 return Prelude_EqOrd_x2fx3d_Eq_Ordering(Prelude_EqOrd_compare_Ord_Integer($0, $1), 2);
}

/* Prelude.Types.<= */
function Prelude_Types_x3cx3d_Ord_x28Listx20x24ax29($0, $1, $2) {
 return Prelude_EqOrd_x2fx3d_Eq_Ordering(Prelude_Types_compare_Ord_x28Listx20x24ax29($0, $1, $2), 2);
}

/* Prelude.Types./= */
function Prelude_Types_x2fx3d_Eq_Nat($0, $1) {
 switch((($0===$1)?1:0)) {
  case 1: return 0;
  case 0: return 1;
 }
}

/* Prelude.Types./= */
function Prelude_Types_x2fx3d_Eq_x28Listx20x24ax29($0, $1, $2) {
 switch(Prelude_Types_x3dx3d_Eq_x28Listx20x24ax29($0, $1, $2)) {
  case 1: return 0;
  case 0: return 1;
 }
}

/* Prelude.Types.takeUntil : (n -> Bool) -> Stream n -> List n */
function Prelude_Types_takeUntil($0, $1) {
 switch($0($1.a1)) {
  case 1: return {a1: $1.a1, a2: {h: 0}};
  case 0: return {a1: $1.a1, a2: Prelude_Types_takeUntil($0, $1.a2())};
 }
}

/* Prelude.Types.List.tailRecAppend : List a -> List a -> List a */
function Prelude_Types_List_tailRecAppend($0, $1) {
 return Prelude_Types_List_reverseOnto($1, Prelude_Types_List_reverse($0));
}

/* Prelude.Types.List.reverse : List a -> List a */
function Prelude_Types_List_reverse($0) {
 return Prelude_Types_List_reverseOnto({h: 0}, $0);
}

/* Prelude.Types.prim__integerToNat : Integer -> Nat */
function Prelude_Types_prim__integerToNat($0) {
 switch(((0n<=$0)?1:0)) {
  case 0: return 0n;
  default: return $0;
 }
}

/* Prelude.Types.maybe : Lazy b -> Lazy (a -> b) -> Maybe a -> b */
function Prelude_Types_maybe($0, $1, $2) {
 switch($2.h) {
  case 0: /* nothing */ return $0();
  case undefined: /* just */ return $1()($2.a1);
 }
}

/* Prelude.Types.listBind : List a -> (a -> List b) -> List b */
function Prelude_Types_listBind($0, $1) {
 return Prelude_Types_listBindOnto($1, {h: 0}, $0);
}

/* Prelude.Types.List.lengthTR : List a -> Nat */
function Prelude_Types_List_lengthTR($0) {
 return Prelude_Types_List_lengthPlus(0n, $0);
}

/* Prelude.Types.String.length : String -> Nat */
function Prelude_Types_String_length($0) {
 return Prelude_Types_prim__integerToNat(BigInt($0.length));
}

/* Prelude.Types.isUpper : Char -> Bool */
function Prelude_Types_isUpper($0) {
 switch(Prelude_EqOrd_x3ex3d_Ord_Char($0, 'A')) {
  case 1: return Prelude_EqOrd_x3cx3d_Ord_Char($0, 'Z');
  case 0: return 0;
 }
}

/* Prelude.Types.isLower : Char -> Bool */
function Prelude_Types_isLower($0) {
 switch(Prelude_EqOrd_x3ex3d_Ord_Char($0, 'a')) {
  case 1: return Prelude_EqOrd_x3cx3d_Ord_Char($0, 'z');
  case 0: return 0;
 }
}

/* Prelude.Types.isDigit : Char -> Bool */
function Prelude_Types_isDigit($0) {
 switch(Prelude_EqOrd_x3ex3d_Ord_Char($0, '0')) {
  case 1: return Prelude_EqOrd_x3cx3d_Ord_Char($0, '9');
  case 0: return 0;
 }
}

/* Prelude.Types.isControl : Char -> Bool */
function Prelude_Types_isControl($0) {
 let $1;
 switch(Prelude_EqOrd_x3ex3d_Ord_Char($0, '\0')) {
  case 1: {
   $1 = Prelude_EqOrd_x3cx3d_Ord_Char($0, '\u{1f}');
   break;
  }
  case 0: {
   $1 = 0;
   break;
  }
 }
 switch($1) {
  case 1: return 1;
  case 0: {
   switch(Prelude_EqOrd_x3ex3d_Ord_Char($0, '\u{7f}')) {
    case 1: return Prelude_EqOrd_x3cx3d_Ord_Char($0, '\u{9f}');
    case 0: return 0;
   }
  }
 }
}

/* Prelude.Types.isAlphaNum : Char -> Bool */
function Prelude_Types_isAlphaNum($0) {
 switch(Prelude_Types_isDigit($0)) {
  case 1: return 1;
  case 0: return Prelude_Types_isAlpha($0);
 }
}

/* Prelude.Types.isAlpha : Char -> Bool */
function Prelude_Types_isAlpha($0) {
 switch(Prelude_Types_isUpper($0)) {
  case 1: return 1;
  case 0: return Prelude_Types_isLower($0);
 }
}

/* Prelude.Types.either : Lazy (a -> c) -> Lazy (b -> c) -> Either a b -> c */
function Prelude_Types_either($0, $1, $2) {
 switch($2.h) {
  case 0: /* Left */ return $0()($2.a1);
  case 1: /* Right */ return $1()($2.a1);
 }
}

/* Prelude.Types.countFrom : n -> (n -> n) -> Stream n */
function Prelude_Types_countFrom($0, $1) {
 return {a1: $0, a2: () => Prelude_Types_countFrom($1($0), $1)};
}

/* Prelude.Num.mod */
function Prelude_Num_mod_Integral_Bits8($0, $1) {
 switch(Prelude_EqOrd_x3dx3d_Eq_Bits8($1, 0)) {
  case 0: return ($0%$1);
  default: return _crashExp('Unhandled input for Prelude.Num.case block in mod at Prelude.Num:271:3--273:42');
 }
}

/* Prelude.Num.div */
function Prelude_Num_div_Integral_Bits8($0, $1) {
 switch(Prelude_EqOrd_x3dx3d_Eq_Bits8($1, 0)) {
  case 0: return _div8u($0, $1);
  default: return _crashExp('Unhandled input for Prelude.Num.case block in div at Prelude.Num:268:3--270:42');
 }
}

/* Prelude.Num.abs */
function Prelude_Num_abs_Abs_Double($0) {
 switch(Prelude_EqOrd_x3c_Ord_Double($0, Number(0n))) {
  case 1: return (-($0));
  case 0: return $0;
 }
}

/* Prelude.EqOrd.min */
function Prelude_EqOrd_min_Ord_Bits8($0, $1) {
 switch(Prelude_EqOrd_x3c_Ord_Bits8($0, $1)) {
  case 1: return $0;
  case 0: return $1;
 }
}

/* Prelude.EqOrd.min */
function Prelude_EqOrd_min_Ord_Bits32($0, $1) {
 switch(Prelude_EqOrd_x3c_Ord_Bits32($0, $1)) {
  case 1: return $0;
  case 0: return $1;
 }
}

/* Prelude.EqOrd.max */
function Prelude_EqOrd_max_Ord_Bits8($0, $1) {
 switch(Prelude_EqOrd_x3e_Ord_Bits8($0, $1)) {
  case 1: return $0;
  case 0: return $1;
 }
}

/* Prelude.EqOrd.max */
function Prelude_EqOrd_max_Ord_Bits32($0, $1) {
 switch(Prelude_EqOrd_x3e_Ord_Bits32($0, $1)) {
  case 1: return $0;
  case 0: return $1;
 }
}

/* Prelude.EqOrd.compare */
function Prelude_EqOrd_compare_Ord_Integer($0, $1) {
 switch(Prelude_EqOrd_x3c_Ord_Integer($0, $1)) {
  case 1: return 0;
  case 0: {
   switch(Prelude_EqOrd_x3dx3d_Eq_Integer($0, $1)) {
    case 1: return 1;
    case 0: return 2;
   }
  }
 }
}

/* Prelude.EqOrd.compare */
function Prelude_EqOrd_compare_Ord_Bits8($0, $1) {
 switch(Prelude_EqOrd_x3c_Ord_Bits8($0, $1)) {
  case 1: return 0;
  case 0: {
   switch(Prelude_EqOrd_x3dx3d_Eq_Bits8($0, $1)) {
    case 1: return 1;
    case 0: return 2;
   }
  }
 }
}

/* Prelude.EqOrd.compare */
function Prelude_EqOrd_compare_Ord_Bits32($0, $1) {
 switch(Prelude_EqOrd_x3c_Ord_Bits32($0, $1)) {
  case 1: return 0;
  case 0: {
   switch(Prelude_EqOrd_x3dx3d_Eq_Bits32($0, $1)) {
    case 1: return 1;
    case 0: return 2;
   }
  }
 }
}

/* Prelude.EqOrd.> */
function Prelude_EqOrd_x3e_Ord_Int($0, $1) {
 switch((($0>$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.> */
function Prelude_EqOrd_x3e_Ord_Char($0, $1) {
 switch((($0>$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.> */
function Prelude_EqOrd_x3e_Ord_Bits8($0, $1) {
 switch((($0>$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.> */
function Prelude_EqOrd_x3e_Ord_Bits32($0, $1) {
 switch((($0>$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.>= */
function Prelude_EqOrd_x3ex3d_Ord_Integer($0, $1) {
 switch((($0>=$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.>= */
function Prelude_EqOrd_x3ex3d_Ord_Int($0, $1) {
 switch((($0>=$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.>= */
function Prelude_EqOrd_x3ex3d_Ord_Char($0, $1) {
 switch((($0>=$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.>= */
function Prelude_EqOrd_x3ex3d_Ord_Bits8($0, $1) {
 switch((($0>=$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.>= */
function Prelude_EqOrd_x3ex3d_Ord_Bits32($0, $1) {
 switch((($0>=$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.== */
function Prelude_EqOrd_x3dx3d_Eq_String($0, $1) {
 switch((($0===$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.== */
function Prelude_EqOrd_x3dx3d_Eq_Ordering($0, $1) {
 switch($0) {
  case 0: {
   switch($1) {
    case 0: return 1;
    default: return 0;
   }
  }
  case 1: {
   switch($1) {
    case 1: return 1;
    default: return 0;
   }
  }
  case 2: {
   switch($1) {
    case 2: return 1;
    default: return 0;
   }
  }
  default: return 0;
 }
}

/* Prelude.EqOrd.== */
function Prelude_EqOrd_x3dx3d_Eq_Integer($0, $1) {
 switch((($0===$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.== */
function Prelude_EqOrd_x3dx3d_Eq_Double($0, $1) {
 switch((($0===$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.== */
function Prelude_EqOrd_x3dx3d_Eq_Char($0, $1) {
 switch((($0===$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.== */
function Prelude_EqOrd_x3dx3d_Eq_Bits8($0, $1) {
 switch((($0===$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.== */
function Prelude_EqOrd_x3dx3d_Eq_Bits32($0, $1) {
 switch((($0===$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.< */
function Prelude_EqOrd_x3c_Ord_Integer($0, $1) {
 switch((($0<$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.< */
function Prelude_EqOrd_x3c_Ord_Int($0, $1) {
 switch((($0<$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.< */
function Prelude_EqOrd_x3c_Ord_Double($0, $1) {
 switch((($0<$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.< */
function Prelude_EqOrd_x3c_Ord_Bits8($0, $1) {
 switch((($0<$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.< */
function Prelude_EqOrd_x3c_Ord_Bits32($0, $1) {
 switch((($0<$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.<= */
function Prelude_EqOrd_x3cx3d_Ord_Integer($0, $1) {
 switch((($0<=$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.<= */
function Prelude_EqOrd_x3cx3d_Ord_Int($0, $1) {
 switch((($0<=$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.<= */
function Prelude_EqOrd_x3cx3d_Ord_Double($0, $1) {
 switch((($0<=$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.<= */
function Prelude_EqOrd_x3cx3d_Ord_Char($0, $1) {
 switch((($0<=$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.<= */
function Prelude_EqOrd_x3cx3d_Ord_Bits8($0, $1) {
 switch((($0<=$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd.<= */
function Prelude_EqOrd_x3cx3d_Ord_Bits32($0, $1) {
 switch((($0<=$1)?1:0)) {
  case 0: return 0;
  default: return 1;
 }
}

/* Prelude.EqOrd./= */
function Prelude_EqOrd_x2fx3d_Eq_Ordering($0, $1) {
 switch(Prelude_EqOrd_x3dx3d_Eq_Ordering($0, $1)) {
  case 1: return 0;
  case 0: return 1;
 }
}

/* Prelude.EqOrd./= */
function Prelude_EqOrd_x2fx3d_Eq_Char($0, $1) {
 switch(Prelude_EqOrd_x3dx3d_Eq_Char($0, $1)) {
  case 1: return 0;
  case 0: return 1;
 }
}

/* Prelude.EqOrd./= */
function Prelude_EqOrd_x2fx3d_Eq_Bits8($0, $1) {
 switch(Prelude_EqOrd_x3dx3d_Eq_Bits8($0, $1)) {
  case 1: return 0;
  case 0: return 1;
 }
}

/* Prelude.EqOrd./= */
function Prelude_EqOrd_x2fx3d_Eq_Bits32($0, $1) {
 switch(Prelude_EqOrd_x3dx3d_Eq_Bits32($0, $1)) {
  case 1: return 0;
  case 0: return 1;
 }
}

/* Prelude.EqOrd.compareInteger : Integer -> Integer -> Ordering */
function Prelude_EqOrd_compareInteger($0, $1) {
 return Prelude_EqOrd_compare_Ord_Integer($0, $1);
}

/* Prelude.Interfaces.Bool.Semigroup.<+> */
function Prelude_Interfaces_Bool_Semigroup_x3cx2bx3e_Semigroup_AllBool($0, $1) {
 switch($0) {
  case 1: return $1;
  case 0: return 0;
 }
}

/* Prelude.Interfaces.sequence : Applicative f => Traversable t => t (f a) -> f (t a) */
function Prelude_Interfaces_sequence($0, $1) {
 return $1.a3(undefined)(undefined)(undefined)($0)($d => $d);
}

/* Prelude.Show.2434:11878:asciiTab */
function Prelude_Show_n__2434_11878_asciiTab($0) {
 return {a1: 'NUL', a2: {a1: 'SOH', a2: {a1: 'STX', a2: {a1: 'ETX', a2: {a1: 'EOT', a2: {a1: 'ENQ', a2: {a1: 'ACK', a2: {a1: 'BEL', a2: {a1: 'BS', a2: {a1: 'HT', a2: {a1: 'LF', a2: {a1: 'VT', a2: {a1: 'FF', a2: {a1: 'CR', a2: {a1: 'SO', a2: {a1: 'SI', a2: {a1: 'DLE', a2: {a1: 'DC1', a2: {a1: 'DC2', a2: {a1: 'DC3', a2: {a1: 'DC4', a2: {a1: 'NAK', a2: {a1: 'SYN', a2: {a1: 'ETB', a2: {a1: 'CAN', a2: {a1: 'EM', a2: {a1: 'SUB', a2: {a1: 'ESC', a2: {a1: 'FS', a2: {a1: 'GS', a2: {a1: 'RS', a2: {a1: 'US', a2: {h: 0}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}};
}

/* Prelude.Show.show */
function Prelude_Show_show_Show_String($0) {
 return ('\"'+Prelude_Show_showLitString(Prelude_Types_fastUnpack($0))('\"'));
}

/* Prelude.Show.show */
function Prelude_Show_show_Show_Nat($0) {
 return Prelude_Show_show_Show_Integer($0);
}

/* Prelude.Show.show */
function Prelude_Show_show_Show_Integer($0) {
 return Prelude_Show_showPrec_Show_Integer({h: 0 /* Open */}, $0);
}

/* Prelude.Show.show */
function Prelude_Show_show_Show_Int($0) {
 return Prelude_Show_showPrec_Show_Int({h: 0 /* Open */}, $0);
}

/* Prelude.Show.show */
function Prelude_Show_show_Show_Double($0) {
 return Prelude_Show_showPrec_Show_Double({h: 0 /* Open */}, $0);
}

/* Prelude.Show.show */
function Prelude_Show_show_Show_Char($0) {
 switch($0) {
  case '\'': return '\'\u{5c}\'\'';
  default: return ('\''+Prelude_Show_showLitChar($0)('\''));
 }
}

/* Prelude.Show.show */
function Prelude_Show_show_Show_x28Listx20x24ax29($0, $1) {
 return ('['+(Prelude_Show_n__3215_12599_showx27($0, $1, '', $1)+']'));
}

/* Prelude.Show.showPrec */
function Prelude_Show_showPrec_Show_Nat($0, $1) {
 return Prelude_Show_show_Show_Nat($1);
}

/* Prelude.Show.showPrec */
function Prelude_Show_showPrec_Show_Integer($0, $1) {
 return Prelude_Show_primNumShow($4 => (''+$4), $0, $1);
}

/* Prelude.Show.showPrec */
function Prelude_Show_showPrec_Show_Int($0, $1) {
 return Prelude_Show_primNumShow($4 => (''+$4), $0, $1);
}

/* Prelude.Show.showPrec */
function Prelude_Show_showPrec_Show_Double($0, $1) {
 return Prelude_Show_primNumShow($4 => (''+$4), $0, $1);
}

/* Prelude.Show.compare */
function Prelude_Show_compare_Ord_Prec($0, $1) {
 switch($0.h) {
  case 4: /* User */ {
   switch($1.h) {
    case 4: /* User */ return Prelude_EqOrd_compare_Ord_Integer($0.a1, $1.a1);
    default: return Prelude_EqOrd_compare_Ord_Integer(Prelude_Show_precCon($0), Prelude_Show_precCon($1));
   }
  }
  default: return Prelude_EqOrd_compare_Ord_Integer(Prelude_Show_precCon($0), Prelude_Show_precCon($1));
 }
}

/* Prelude.Show.>= */
function Prelude_Show_x3ex3d_Ord_Prec($0, $1) {
 return Prelude_EqOrd_x2fx3d_Eq_Ordering(Prelude_Show_compare_Ord_Prec($0, $1), 0);
}

/* Prelude.Show.showParens : Bool -> String -> String */
function Prelude_Show_showParens($0, $1) {
 switch($0) {
  case 0: return $1;
  case 1: return ('('+($1+')'));
 }
}

/* Prelude.Show.showLitString : List Char -> String -> String */
function Prelude_Show_showLitString($0) {
 return $1 => {
  switch($0.h) {
   case 0: /* nil */ return $1;
   case undefined: /* cons */ {
    switch($0.a1) {
     case '\"': return ('\u{5c}\"'+Prelude_Show_showLitString($0.a2)($1));
     default: return Prelude_Show_showLitChar($0.a1)(Prelude_Show_showLitString($0.a2)($1));
    }
   }
  }
 };
}

/* Prelude.Show.showLitChar : Char -> String -> String */
function Prelude_Show_showLitChar($0) {
 switch($0) {
  case '\u{7}': return $2 => ('\u{5c}a'+$2);
  case '\u{8}': return $5 => ('\u{5c}b'+$5);
  case '\u{c}': return $8 => ('\u{5c}f'+$8);
  case '\n': return $b => ('\u{5c}n'+$b);
  case '\r': return $e => ('\u{5c}r'+$e);
  case '\u{9}': return $11 => ('\u{5c}t'+$11);
  case '\u{b}': return $14 => ('\u{5c}v'+$14);
  case '\u{e}': return $17 => Prelude_Show_protectEsc($1a => Prelude_EqOrd_x3dx3d_Eq_Char($1a, 'H'), '\u{5c}SO', $17);
  case '\u{7f}': return $20 => ('\u{5c}DEL'+$20);
  case '\u{5c}': return $23 => ('\u{5c}\u{5c}'+$23);
  default: {
   return $26 => {
    const $27 = Prelude_Types_getAt(Prelude_Types_prim__integerToNat(BigInt($0.codePointAt(0))), Prelude_Show_n__2434_11878_asciiTab($0));
    switch($27.h) {
     case undefined: /* just */ return ('\u{5c}'+($27.a1+$26));
     case 0: /* nothing */ {
      switch(Prelude_EqOrd_x3e_Ord_Char($0, '\u{7f}')) {
       case 1: return ('\u{5c}'+Prelude_Show_protectEsc($3c => Prelude_Types_isDigit($3c), Prelude_Show_show_Show_Int(_truncInt32($0.codePointAt(0))), $26));
       case 0: return ($0+$26);
      }
     }
    }
   };
  }
 }
}

/* Prelude.Show.protectEsc : (Char -> Bool) -> String -> String -> String */
function Prelude_Show_protectEsc($0, $1, $2) {
 let $5;
 switch(Prelude_Show_firstCharIs($0, $2)) {
  case 1: {
   $5 = '\u{5c}&';
   break;
  }
  case 0: {
   $5 = '';
   break;
  }
 }
 const $4 = ($5+$2);
 return ($1+$4);
}

/* Prelude.Show.primNumShow : (a -> String) -> Prec -> a -> String */
function Prelude_Show_primNumShow($0, $1, $2) {
 const $3 = $0($2);
 let $7;
 switch(Prelude_Show_x3ex3d_Ord_Prec($1, {h: 5 /* PrefixMinus */})) {
  case 1: {
   $7 = Prelude_Show_firstCharIs($e => Prelude_EqOrd_x3dx3d_Eq_Char($e, '-'), $3);
   break;
  }
  case 0: {
   $7 = 0;
   break;
  }
 }
 return Prelude_Show_showParens($7, $3);
}

/* Prelude.Show.precCon : Prec -> Integer */
function Prelude_Show_precCon($0) {
 switch($0.h) {
  case 0: /* Open */ return 0n;
  case 1: /* Equal */ return 1n;
  case 2: /* Dollar */ return 2n;
  case 3: /* Backtick */ return 3n;
  case 4: /* User */ return 4n;
  case 5: /* PrefixMinus */ return 5n;
  case 6: /* App */ return 6n;
 }
}

/* Prelude.Show.firstCharIs : (Char -> Bool) -> String -> Bool */
function Prelude_Show_firstCharIs($0, $1) {
 switch($1) {
  case '': return 0;
  default: return $0(($1.charAt(0)));
 }
}

/* PrimIO.unsafePerformIO : IO a -> a */
function PrimIO_unsafePerformIO($0) {
 return PrimIO_unsafeCreateWorld(w => $0(w));
}

/* PrimIO.unsafeCreateWorld : (1 _ : ((1 _ : %World) -> a)) -> a */
function PrimIO_unsafeCreateWorld($0) {
 return $0(_idrisworld);
}

/* JSON.ToJSON.toJSON */
function JSON_ToJSON_toJSON_ToJSON_String($0, $1) {
 return {h: 1 /* Right */, a1: $0.a2($1)};
}

/* JSON.ToJSON.toJSON */
function JSON_ToJSON_toJSON_ToJSON_x28Listx20x24ax29($0, $1, $2) {
 const $3 = Prelude_Types_traverse_Traversable_List(csegen_6(), $0(undefined)($1), $2);
 switch($3.h) {
  case 0: /* Left */ return {h: 0 /* Left */, a1: $3.a1};
  case 1: /* Right */ return {h: 1 /* Right */, a1: $1.a6($3.a1)};
 }
}

/* JSON.ToJSON.encodeVia : (0 v : Type) -> Encoder v => ToJSON a => a -> Either String String */
function JSON_ToJSON_encodeVia($0, $1, $2) {
 return Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29($1(undefined)($0)($2), $0.a1);
}

/* JSON.ToJSON.encode : ToJSON a => a -> Either String String */
function JSON_ToJSON_encode($0, $1) {
 const $b = $c => {
  switch(JSON_Parser_finiteDouble($c)) {
   case 1: return {h: 1 /* Right */, a1: {h: 2 /* JDouble */, a1: $c}};
   case 0: return {h: 0 /* Left */, a1: 'JSON: non-finite Double'};
  }
 };
 const $3 = {a1: $5 => JSON_Parser_encodeJSONValue($5), a2: $9 => ({h: 5 /* JString */, a1: $9}), a3: $b, a4: $14 => ({h: 1 /* JInteger */, a1: $14}), a5: $17 => ({h: 4 /* JBool */, a1: $17}), a6: $1a => ({h: 6 /* JArray */, a1: $1a}), a7: $1d => ({h: 7 /* JsonObject */, a1: $1d}), a8: {h: 0 /* JNull */}};
 return JSON_ToJSON_encodeVia($3, $0, $1);
}

/* JSON.Encoder.objectChecked : Encoder v => List (String, v) -> Either String v */
function JSON_Encoder_objectChecked($0, $1) {
 const $2 = JSON_Object_checkedAssoc($1);
 switch($2.h) {
  case 0: /* Left */ return {h: 0 /* Left */, a1: JSON_Object_show_Show_ObjectError($2.a1)};
  case 1: /* Right */ return {h: 1 /* Right */, a1: $0.a7($2.a1)};
 }
}

/* JSON.Parser.case block in checkedNumberToken */
function JSON_Parser_case__checkedNumberToken_9688($0, $1) {
 switch($1.h) {
  case 1: /* Right */ {
   switch($1.a1.h) {
    case 3: /* JDecimal */ {
     switch(Prelude_EqOrd_x3dx3d_Eq_String($1.a1.a1, $0)) {
      case 1: return {h: 1 /* Right */, a1: $0};
      case 0: return {h: 0 /* Left */, a1: 'JSON: expected a complete number token without whitespace'};
     }
    }
    default: return {h: 0 /* Left */, a1: 'JSON: invalid number token'};
   }
  }
  default: return {h: 0 /* Left */, a1: 'JSON: invalid number token'};
 }
}

/* JSON.Parser.validateJSONValues : List JSON -> Either String () */
function JSON_Parser_validateJSONValues($0) {
 switch($0.h) {
  case 0: /* nil */ return {h: 1 /* Right */, a1: undefined};
  case undefined: /* cons */ return Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29(JSON_Parser_validateJSONValue($0.a1), $8 => JSON_Parser_validateJSONValues($0.a2));
 }
}

/* JSON.Parser.validateJSONValue : JSON -> Either String () */
function JSON_Parser_validateJSONValue($0) {
 switch($0.h) {
  case 2: /* JDouble */ {
   switch(JSON_Parser_finiteDouble($0.a1)) {
    case 1: {
     const $5 = JSON_Parser_checkedNumberToken(Prelude_Show_show_Show_Double($0.a1));
     switch($5.h) {
      case 0: /* Left */ return {h: 0 /* Left */, a1: $5.a1};
      case 1: /* Right */ return {h: 1 /* Right */, a1: undefined};
     }
    }
    case 0: return {h: 0 /* Left */, a1: 'JSON: non-finite Double'};
   }
  }
  case 3: /* JDecimal */ {
   const $d = JSON_Parser_checkedNumberToken($0.a1);
   switch($d.h) {
    case 0: /* Left */ return {h: 0 /* Left */, a1: $d.a1};
    case 1: /* Right */ return {h: 1 /* Right */, a1: undefined};
   }
  }
  case 6: /* JArray */ return JSON_Parser_validateJSONValues($0.a1);
  case 7: /* JsonObject */ return JSON_Parser_validateJSONBindings($0.a1);
  default: return {h: 1 /* Right */, a1: undefined};
 }
}

/* JSON.Parser.validateJSONBindings : List (Binding JSON) -> Either String () */
function JSON_Parser_validateJSONBindings($0) {
 switch($0.h) {
  case 0: /* nil */ return {h: 1 /* Right */, a1: undefined};
  case undefined: /* cons */ return Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29(JSON_Parser_validateJSONValue($0.a1.a2), $9 => JSON_Parser_validateJSONBindings($0.a2));
 }
}

/* JSON.Parser.showValue : SnocList String -> JSON -> SnocList String */
function JSON_Parser_showValue($0, $1) {
 switch($1.h) {
  case 0: /* JNull */ return {a1: $0, a2: 'null'};
  case 1: /* JInteger */ return {a1: $0, a2: Prelude_Show_show_Show_Integer($1.a1)};
  case 2: /* JDouble */ return {a1: $0, a2: Prelude_Show_show_Show_Double($1.a1)};
  case 3: /* JDecimal */ return {a1: $0, a2: $1.a1};
  case 4: /* JBool */ {
   switch($1.a1) {
    case 1: return {a1: $0, a2: 'true'};
    case 0: return {a1: $0, a2: 'false'};
   }
  }
  case 5: /* JString */ return {a1: $0, a2: JSON_Parser_encode($1.a1)};
  case 6: /* JArray */ {
   switch($1.a1.h) {
    case 0: /* nil */ return {a1: $0, a2: '[]'};
    case undefined: /* cons */ {
     const $1b = JSON_Parser_showValue({a1: $0, a2: '['}, $1.a1.a1);
     return JSON_Parser_showArray($1b, $1.a1.a2);
    }
   }
  }
  case 7: /* JsonObject */ return JSON_Parser_showObjectStart($0, $1.a1);
 }
}

/* JSON.Parser.showPair : SnocList String -> Binding JSON -> SnocList String */
function JSON_Parser_showPair($0, $1) {
 return JSON_Parser_showValue({a1: {a1: $0, a2: JSON_Parser_encode($1.a1)}, a2: ':'}, $1.a2);
}

/* JSON.Parser.showObjectStart : SnocList String -> List (Binding JSON) -> SnocList String */
function JSON_Parser_showObjectStart($0, $1) {
 switch($1.h) {
  case 0: /* nil */ return {a1: $0, a2: '{}'};
  case undefined: /* cons */ return JSON_Parser_showObject(JSON_Parser_showPair({a1: $0, a2: '{'}, $1.a1), $1.a2);
 }
}

/* JSON.Parser.showImpl : JSON -> String */
function JSON_Parser_showImpl($0) {
 return Prelude_Types_fastConcat(Prelude_Types_SnocList_x3cx3ex3e(JSON_Parser_showValue({h: 0}, $0), {h: 0}));
}

/* JSON.Parser.prepareText : String -> String */
function JSON_Parser_prepareText($0) {
 return Prelude_Types_fastPack(Prelude_Types_SnocList_x3cx3ex3e(JSON_Parser_n__15796_9018_go($0, 0, 0, {h: 0}, Prelude_Types_fastUnpack($0)), {h: 0}));
}

/* JSON.Parser.jsonTransFor : Bool -> Lex1 q JSz SK */
function JSON_Parser_jsonTransFor($0) {
 let $15;
 switch($0) {
  case 1: {
   $15 = csegen_132();
   break;
  }
  case 0: {
   $15 = csegen_139();
   break;
  }
 }
 const $13 = Prelude_Types_List_tailRecAppend($15, csegen_155());
 const $f = Prelude_Types_List_tailRecAppend(csegen_128(), $13);
 const $c = {a1: csegen_97(), a2: $f};
 const $a = Text_ILex_Lexer_dfa($c);
 const $7 = {a1: JSON_Parser_JIni(), a2: $a};
 let $34;
 switch($0) {
  case 1: {
   $34 = csegen_132();
   break;
  }
  case 0: {
   $34 = csegen_139();
   break;
  }
 }
 const $32 = Prelude_Types_List_tailRecAppend($34, Prelude_Types_List_tailRecAppend(csegen_154(), csegen_182()));
 const $2e = Prelude_Types_List_tailRecAppend(csegen_128(), $32);
 const $2b = {a1: csegen_97(), a2: $2e};
 const $29 = Text_ILex_Lexer_dfa($2b);
 const $26 = {a1: JSON_Parser_ANew(), a2: $29};
 let $4d;
 switch($0) {
  case 1: {
   $4d = csegen_132();
   break;
  }
  case 0: {
   $4d = csegen_139();
   break;
  }
 }
 const $4b = Prelude_Types_List_tailRecAppend($4d, csegen_155());
 const $47 = Prelude_Types_List_tailRecAppend(csegen_128(), $4b);
 const $44 = {a1: csegen_97(), a2: $47};
 const $42 = Text_ILex_Lexer_dfa($44);
 const $3f = {a1: JSON_Parser_ACom(), a2: $42};
 let $bb;
 switch($0) {
  case 1: {
   $bb = csegen_132();
   break;
  }
  case 0: {
   $bb = csegen_139();
   break;
  }
 }
 const $b9 = Prelude_Types_List_tailRecAppend($bb, csegen_155());
 const $b5 = Prelude_Types_List_tailRecAppend(csegen_128(), $b9);
 const $b2 = {a1: csegen_97(), a2: $b5};
 const $b0 = Text_ILex_Lexer_dfa($b2);
 const $ad = {a1: JSON_Parser_OCol(), a2: $b0};
 const $cc = $cd => {
  const $d0 = ($cd.a1.a8.value);
  let $cf;
  switch($d0.h) {
   case undefined: /* cons */ {
    $cf = ($cd.a1.a8.value=$d0.a1);
    break;
   }
   default: $cf = undefined;
  }
  const $dd = ($cd.a1.a11.value);
  const $e2 = ($cd.a1.a11.value={h: 0});
  const $dc = $dd;
  const $db = Text_ILex_Util_snocPack($dc);
  const $ea = ($cd.a1.a9.value);
  switch($ea.h) {
   case 1: /* PO */ {
    const $f0 = ($cd.a1.a9.value={h: 2 /* PL */, a1: $ea.a1, a2: $ea.a2, a3: $db});
    return JSON_Parser_OLbl();
   }
   default: {
    switch($ea.h) {
     case 0: /* PA */ {
      const $fb = ($cd.a1.a9.value={h: 0 /* PA */, a1: $ea.a1, a2: {a1: $ea.a2, a2: {h: 5 /* JString */, a1: $db}}});
      return JSON_Parser_AVal();
     }
     case 2: /* PL */ {
      const $107 = ($cd.a1.a9.value={h: 1 /* PO */, a1: $ea.a1, a2: {a1: $ea.a2, a2: {a1: $ea.a3, a2: {h: 5 /* JString */, a1: $db}}}});
      return JSON_Parser_OVal();
     }
     case 4: /* PV */ {
      const $115 = ($cd.a1.a9.value={h: 4 /* PV */, a1: {a1: $ea.a1, a2: {h: 5 /* JString */, a1: $db}}});
      return JSON_Parser_JIni();
     }
     default: {
      const $120 = ($cd.a1.a9.value={h: 5 /* PF */, a1: {h: 5 /* JString */, a1: $db}});
      return JSON_Parser_JDone();
     }
    }
   }
  }
 };
 const $cb = {h: 0 /* Run */, a1: $cc};
 const $c8 = {a1: csegen_148(), a2: $cb};
 const $132 = $133 => {
  const $136 = ($133.a1.a6.value);
  const $13b = ($133.a1.a7.value);
  let $135;
  switch($136) {
   case 0n: {
    $135 = Data_ByteString_toString(Data_ByteString_append($133.a1.a2, {a1: Prelude_Types_prim__integerToNat(($13b-$136)), a2: {a1: $133.a1.a3, a2: $136}}));
    break;
   }
   default: $135 = Data_Buffer_Core_toString($133.a1.a3, $136, Prelude_Types_prim__integerToNat(($13b-$136)));
  }
  const $15a = ($133.a1.a11.value);
  const $159 = ($133.a1.a11.value={a1: $15a, a2: $135});
  return JSON_Parser_JStr();
 };
 const $131 = {h: 0 /* Run */, a1: $132};
 const $12a = {a1: {h: 2 /* And */, a1: JSON_Parser_jchar(), a2: {h: 4 /* Star */, a1: JSON_Parser_jchar()}}, a2: $131};
 const $16f = $170 => {
  const $173 = ($170.a1.a11.value);
  const $172 = ($170.a1.a11.value={a1: $173, a2: '\"'});
  return JSON_Parser_JStr();
 };
 const $16e = {h: 0 /* Run */, a1: $16f};
 const $168 = {a1: {h: 2 /* And */, a1: csegen_224(), a2: csegen_148()}, a2: $16e};
 const $188 = $189 => {
  const $18c = ($189.a1.a11.value);
  const $18b = ($189.a1.a11.value={a1: $18c, a2: '\n'});
  return JSON_Parser_JStr();
 };
 const $187 = {h: 0 /* Run */, a1: $188};
 const $181 = {a1: {h: 2 /* And */, a1: csegen_224(), a2: csegen_98()}, a2: $187};
 const $1a1 = $1a2 => {
  const $1a5 = ($1a2.a1.a11.value);
  const $1a4 = ($1a2.a1.a11.value={a1: $1a5, a2: '\u{c}'});
  return JSON_Parser_JStr();
 };
 const $1a0 = {h: 0 /* Run */, a1: $1a1};
 const $19a = {a1: {h: 2 /* And */, a1: csegen_224(), a2: csegen_116()}, a2: $1a0};
 const $1bd = $1be => {
  const $1c1 = ($1be.a1.a11.value);
  const $1c0 = ($1be.a1.a11.value={a1: $1c1, a2: '\u{8}'});
  return JSON_Parser_JStr();
 };
 const $1bc = {h: 0 /* Run */, a1: $1bd};
 const $1b3 = {a1: {h: 2 /* And */, a1: csegen_224(), a2: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('b'.codePointAt(0)))}}, a2: $1bc};
 const $1d6 = $1d7 => {
  const $1da = ($1d7.a1.a11.value);
  const $1d9 = ($1d7.a1.a11.value={a1: $1da, a2: '\r'});
  return JSON_Parser_JStr();
 };
 const $1d5 = {h: 0 /* Run */, a1: $1d6};
 const $1cf = {a1: {h: 2 /* And */, a1: csegen_224(), a2: csegen_108()}, a2: $1d5};
 const $1ef = $1f0 => {
  const $1f3 = ($1f0.a1.a11.value);
  const $1f2 = ($1f0.a1.a11.value={a1: $1f3, a2: '\u{9}'});
  return JSON_Parser_JStr();
 };
 const $1ee = {h: 0 /* Run */, a1: $1ef};
 const $1e8 = {a1: {h: 2 /* And */, a1: csegen_224(), a2: csegen_107()}, a2: $1ee};
 const $208 = $209 => {
  const $20c = ($209.a1.a11.value);
  const $20b = ($209.a1.a11.value={a1: $20c, a2: '\u{5c}'});
  return JSON_Parser_JStr();
 };
 const $207 = {h: 0 /* Run */, a1: $208};
 const $201 = {a1: {h: 2 /* And */, a1: csegen_224(), a2: csegen_224()}, a2: $207};
 const $224 = $225 => {
  const $228 = ($225.a1.a11.value);
  const $227 = ($225.a1.a11.value={a1: $228, a2: '/'});
  return JSON_Parser_JStr();
 };
 const $223 = {h: 0 /* Run */, a1: $224};
 const $21a = {a1: {h: 2 /* And */, a1: csegen_224(), a2: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('/'.codePointAt(0)))}}, a2: $223};
 const $23a = $23b => {
  const $23e = ($23b.a1.a6.value);
  const $243 = ($23b.a1.a7.value);
  let $23d;
  switch($23e) {
   case 0n: {
    $23d = Data_ByteString_append($23b.a1.a2, {a1: Prelude_Types_prim__integerToNat(($243-$23e)), a2: {a1: $23b.a1.a3, a2: $23e}});
    break;
   }
   default: $23d = {a1: Prelude_Types_prim__integerToNat(($243-$23e)), a2: {a1: $23b.a1.a3, a2: $23e}};
  }
  const $260 = ($23b.a1.a11.value);
  const $25f = ($23b.a1.a11.value={a1: $260, a2: JSON_Parser_decode($23d)});
  return JSON_Parser_JStr();
 };
 const $239 = {h: 0 /* Run */, a1: $23a};
 const $236 = {a1: JSON_Parser_codepoint(), a2: $239};
 const $235 = {a1: $236, a2: {h: 0}};
 const $219 = {a1: $21a, a2: $235};
 const $200 = {a1: $201, a2: $219};
 const $1e7 = {a1: $1e8, a2: $200};
 const $1ce = {a1: $1cf, a2: $1e7};
 const $1b2 = {a1: $1b3, a2: $1ce};
 const $199 = {a1: $19a, a2: $1b2};
 const $180 = {a1: $181, a2: $199};
 const $167 = {a1: $168, a2: $180};
 const $129 = {a1: $12a, a2: $167};
 const $c7 = {a1: $c8, a2: $129};
 const $c5 = Text_ILex_Lexer_dfa($c7);
 const $c2 = {a1: JSON_Parser_JStr(), a2: $c5};
 const $c1 = {a1: $c2, a2: {h: 0}};
 const $ac = {a1: $ad, a2: $c1};
 const $96 = {a1: {a1: JSON_Parser_OLbl(), a2: Text_ILex_Lexer_dfa({a1: csegen_97(), a2: {a1: {a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32(':'.codePointAt(0)))}, a2: {h: 0 /* Run */, a1: $a8 => JSON_Parser_OCol()}}, a2: {h: 0}}})}, a2: $ac};
 const $8b = {a1: {a1: JSON_Parser_OCom(), a2: Text_ILex_Lexer_dfa({a1: csegen_97(), a2: csegen_152()})}, a2: $96};
 const $75 = {a1: {a1: JSON_Parser_OVal(), a2: Text_ILex_Lexer_dfa({a1: csegen_97(), a2: {a1: csegen_193(), a2: {a1: {a1: csegen_184(), a2: {h: 0 /* Run */, a1: $87 => JSON_Parser_OCom()}}, a2: {h: 0}}}})}, a2: $8b};
 const $67 = {a1: {a1: JSON_Parser_ONew(), a2: Text_ILex_Lexer_dfa({a1: csegen_97(), a2: {a1: csegen_193(), a2: csegen_152()}})}, a2: $75};
 const $53 = {a1: {a1: JSON_Parser_AVal(), a2: Text_ILex_Lexer_dfa({a1: csegen_97(), a2: {a1: {a1: csegen_184(), a2: {h: 0 /* Run */, a1: $62 => JSON_Parser_ACom()}}, a2: csegen_182()}})}, a2: $67};
 const $3e = {a1: $3f, a2: $53};
 const $25 = {a1: $26, a2: $3e};
 const $1b = {a1: {a1: JSON_Parser_JDone(), a2: Text_ILex_Lexer_dfa({a1: csegen_97(), a2: {h: 0}})}, a2: $25};
 const $6 = {a1: $7, a2: $1b};
 return Text_ILex_Parser_arr32(11, Text_ILex_Lexer_dfa({h: 0}), $6);
}

/* JSON.Parser.jsonTrans : Lex1 q JSz SK */
const JSON_Parser_jsonTrans = __lazy(function () {
 return JSON_Parser_jsonTransFor(0);
});

/* JSON.Parser.jsonErr : Arr32 JSz (SK q -> F1 q (BBErr ObjectError)) */
const JSON_Parser_jsonErr = __lazy(function () {
 const $2 = $3 => $4 => {
  const $5 = ($3.a12.value);
  return Prelude_Types_maybe(() => $d => {
   const $f = ($3.a6.value);
   const $e = Text_ILex_Interfaces_case__casex20blockx20inx20bounds_17943(csegen_178()(), $3, $f, ($3.a7.value));
   const $1f = Text_ILex_Interfaces_unexpectedErr(csegen_277()(), $3, csegen_178()(), {h: 0}, undefined);
   return {a1: $1f, a2: $e};
  }, () => $2d => $2e => $2d, $5)(undefined);
 };
 const $3b = $3c => $3d => {
  const $3e = ($3c.a12.value);
  return Prelude_Types_maybe(() => $46 => Text_ILex_Interfaces_unclosedIfEOIErr(csegen_277()(), $3c, csegen_178()(), '[', {a1: ',', a2: {a1: ']', a2: {h: 0}}}, $46), () => $57 => $58 => $57, $3e)(undefined);
 };
 const $38 = {a1: JSON_Parser_AVal(), a2: $3b};
 const $65 = $66 => $67 => {
  const $68 = ($66.a12.value);
  return Prelude_Types_maybe(() => $70 => Text_ILex_Interfaces_unclosedIfEOIErr(csegen_277()(), $66, csegen_178()(), '{', {a1: '\"', a2: {a1: '}', a2: {h: 0}}}, $70), () => $81 => $82 => $81, $68)(undefined);
 };
 const $62 = {a1: JSON_Parser_ONew(), a2: $65};
 const $89 = $8a => $8b => {
  const $8c = ($8a.a12.value);
  return Prelude_Types_maybe(() => $94 => Text_ILex_Interfaces_unclosedIfEOIErr(csegen_277()(), $8a, csegen_178()(), '{', {a1: ',', a2: {a1: '}', a2: {h: 0}}}, $94), () => $a5 => $a6 => $a5, $8c)(undefined);
 };
 const $86 = {a1: JSON_Parser_OVal(), a2: $89};
 const $ad = $ae => $af => {
  const $b0 = ($ae.a12.value);
  return Prelude_Types_maybe(() => $b8 => Text_ILex_Interfaces_unclosedIfEOIErr(csegen_277()(), $ae, csegen_178()(), '{', {a1: '\"', a2: {h: 0}}, $b8), () => $c7 => $c8 => $c7, $b0)(undefined);
 };
 const $aa = {a1: JSON_Parser_OCom(), a2: $ad};
 const $cf = $d0 => $d1 => {
  const $d2 = ($d0.a12.value);
  return Prelude_Types_maybe(() => $da => Text_ILex_Interfaces_unclosedIfEOIErr(csegen_277()(), $d0, csegen_178()(), '{', {a1: ':', a2: {h: 0}}, $da), () => $e9 => $ea => $e9, $d2)(undefined);
 };
 const $cc = {a1: JSON_Parser_OLbl(), a2: $cf};
 const $f1 = $f2 => $f3 => {
  const $f4 = ($f2.a12.value);
  return Prelude_Types_maybe(() => $fc => Text_ILex_Interfaces_unclosedIfEOIErr(csegen_277()(), $f2, csegen_178()(), '{', {h: 0}, $fc), () => $109 => $10a => $109, $f4)(undefined);
 };
 const $ee = {a1: JSON_Parser_OCol(), a2: $f1};
 const $111 = $112 => $113 => {
  const $114 = ($112.a12.value);
  return Prelude_Types_maybe(() => $11c => Text_ILex_Interfaces_unclosedIfNLorEOIErr(csegen_277()(), $112, csegen_178()(), '\"', {h: 0}, $11c), () => $129 => $12a => $129, $114)(undefined);
 };
 const $10e = {a1: JSON_Parser_JStr(), a2: $111};
 const $10d = {a1: $10e, a2: {h: 0}};
 const $ed = {a1: $ee, a2: $10d};
 const $cb = {a1: $cc, a2: $ed};
 const $a9 = {a1: $aa, a2: $cb};
 const $85 = {a1: $86, a2: $a9};
 const $61 = {a1: $62, a2: $85};
 const $5b = {a1: {a1: JSON_Parser_ACom(), a2: csegen_279()}, a2: $61};
 const $37 = {a1: $38, a2: $5b};
 const $31 = {a1: {a1: JSON_Parser_ANew(), a2: csegen_279()}, a2: $37};
 return Text_ILex_Parser_arr32(11, $2, $31);
});

/* JSON.Parser.jsonEOI : JST -> SK q -> F1 q (Either (BBErr ObjectError) JSON) */
function JSON_Parser_jsonEOI($0, $1, $2) {
 const $3 = ($1.a12.value);
 switch($3.h) {
  case undefined: /* just */ return {h: 0 /* Left */, a1: $3.a1};
  case 0: /* nothing */ {
   switch(Prelude_EqOrd_x3dx3d_Eq_Bits32($0, JSON_Parser_JDone())) {
    case 0: return Text_ILex_Parser_arrFail(JSON_Parser_jsonErr(), $0, $1, undefined);
    case 1: {
     const $15 = ($1.a9.value);
     switch($15.h) {
      case 5: /* PF */ return {h: 1 /* Right */, a1: $15.a1};
      default: return {h: 1 /* Right */, a1: {h: 0 /* JNull */}};
     }
    }
   }
  }
 }
}

/* JSON.Parser.jsonDouble : RExp True */
const JSON_Parser_jsonDouble = __lazy(function () {
 const $0 = {h: 2 /* And */, a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('.'.codePointAt(0)))}, a2: csegen_310()};
 const $8 = {h: 2 /* And */, a1: {h: 2 /* And */, a1: Text_ILex_RExp_oneof(csegen_323(), csegen_328(), {a1: csegen_109(), a2: {a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('E'.codePointAt(0)))}, a2: {h: 0}}}), a2: {h: 3 /* Or */, a1: Text_ILex_RExp_oneof(csegen_323(), csegen_328(), {a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('+'.codePointAt(0)))}, a2: {a1: csegen_133(), a2: {h: 0}}}), a2: {h: 0 /* Eps */}}}, a2: csegen_310()};
 return {h: 2 /* And */, a1: {h: 2 /* And */, a1: csegen_135(), a2: {h: 3 /* Or */, a1: $0, a2: {h: 0 /* Eps */}}}, a2: {h: 3 /* Or */, a1: $8, a2: {h: 0 /* Eps */}}};
});

/* JSON.Parser.json : P1 q (BBErr ObjectError) JSON */
const JSON_Parser_json = __lazy(function () {
 return {a1: 11, a2: JSON_Parser_JIni(), a3: csegen_341(), a4: JSON_Parser_jsonTrans(), a5: x => $8 => ({h: 0}), a6: JSON_Parser_jsonErr(), a7: csegen_342(), a8: csegen_178()()};
});

/* JSON.Parser.jchar : RExp True */
const JSON_Parser_jchar = __lazy(function () {
 let $9;
 switch(Prelude_EqOrd_x3cx3d_Ord_Bits32(32, 1114111)) {
  case 1: {
   $9 = {a1: 32, a2: 1114111};
   break;
  }
  case 0: {
   $9 = {h: 0};
   break;
  }
 }
 const $7 = Text_ILex_Char_Set_range($9);
 const $0 = Text_ILex_Char_Set_inters(csegen_323(), csegen_328(), {h: 0}, $7, Text_ILex_Char_Set_inters(csegen_323(), csegen_328(), {h: 0}, Text_ILex_Char_Set_negation(csegen_323(), csegen_328(), Text_ILex_Char_Set_singleton(_truncUInt32('\"'.codePointAt(0)))), Text_ILex_Char_Set_negation(csegen_323(), csegen_328(), Text_ILex_Char_Set_singleton(_truncUInt32('\u{5c}'.codePointAt(0))))));
 return {h: 1 /* Ch */, a1: $0};
});

/* JSON.Parser.finiteDouble : Double -> Bool */
function JSON_Parser_finiteDouble($0) {
 switch(Prelude_EqOrd_x3dx3d_Eq_Double($0, $0)) {
  case 1: return Prelude_EqOrd_x3cx3d_Ord_Double(Prelude_Num_abs_Abs_Double($0), 1.7976931348623157e308);
  case 0: return 0;
 }
}

/* JSON.Parser.escape : SnocList Char -> Char -> SnocList Char */
function JSON_Parser_escape($0, $1) {
 switch($1) {
  case '\"': return {a1: {a1: $0, a2: '\u{5c}'}, a2: '\"'};
  case '\n': return {a1: {a1: $0, a2: '\u{5c}'}, a2: 'n'};
  case '\u{c}': return {a1: {a1: $0, a2: '\u{5c}'}, a2: 'f'};
  case '\u{8}': return {a1: {a1: $0, a2: '\u{5c}'}, a2: 'b'};
  case '\r': return {a1: {a1: $0, a2: '\u{5c}'}, a2: 'r'};
  case '\u{9}': return {a1: {a1: $0, a2: '\u{5c}'}, a2: 't'};
  case '\u{5c}': return {a1: {a1: $0, a2: '\u{5c}'}, a2: '\u{5c}'};
  case '/': return {a1: {a1: $0, a2: '\u{5c}'}, a2: '/'};
  default: {
   let $23;
   switch(Prelude_Types_isControl($1)) {
    case 1: {
     $23 = 1;
     break;
    }
    case 0: {
     switch(Prelude_EqOrd_x3ex3d_Ord_Integer(BigInt($1.codePointAt(0)), 55296n)) {
      case 1: {
       $23 = Prelude_EqOrd_x3cx3d_Ord_Integer(BigInt($1.codePointAt(0)), 57343n);
       break;
      }
      case 0: {
       $23 = 0;
       break;
      }
     }
     break;
    }
   }
   switch($23) {
    case 1: {
     const $30 = BigInt($1.codePointAt(0));
     const $32 = Text_ParseError_hexChar(Number(_truncUBigInt8((($30>>12n)&15n))));
     const $3a = Text_ParseError_hexChar(Number(_truncUBigInt8((($30>>8n)&15n))));
     const $42 = Text_ParseError_hexChar(Number(_truncUBigInt8((($30>>4n)&15n))));
     const $4a = Text_ParseError_hexChar(Number(_truncUBigInt8(($30&15n))));
     return {a1: {a1: {a1: {a1: {a1: {a1: $0, a2: '\u{5c}'}, a2: 'u'}, a2: $32}, a2: $3a}, a2: $42}, a2: $4a};
    }
    case 0: return {a1: $0, a2: $1};
   }
  }
 }
}

/* JSON.Parser.encodeJSONValue : JSON -> Either String String */
function JSON_Parser_encodeJSONValue($0) {
 return Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29(JSON_Parser_validateJSONValue($0), $6 => ({h: 1 /* Right */, a1: JSON_Parser_showImpl($0)}));
}

/* JSON.Parser.encode : String -> String */
function JSON_Parser_encode($0) {
 return Prelude_Types_fastPack(Prelude_Types_SnocList_x3cx3ex3e(Prelude_Types_foldl_Foldable_List($7 => $8 => JSON_Parser_escape($7, $8), {a1: {h: 0}, a2: '\"'}, Prelude_Types_fastUnpack($0)), {a1: '\"', a2: {h: 0}}));
}

/* JSON.Parser.decode : ByteString -> String */
function JSON_Parser_decode($0) {
 switch($0.h) {
  case undefined: /* cons */ {
   switch($0.a1) {
    case 0n: return '';
    default: {
     const $3 = ($0.a1-1n);
     switch($3) {
      case 0n: return '';
      default: {
       const $7 = ($3-1n);
       switch($7) {
        case 0n: return '';
        default: {
         const $b = ($7-1n);
         switch($b) {
          case 0n: return '';
          default: {
           const $f = ($b-1n);
           switch($f) {
            case 0n: return '';
            default: {
             const $13 = ($f-1n);
             switch($13) {
              case 0n: return '';
              default: {
               const $17 = ($13-1n);
               switch($17) {
                case 0n: return JSON_Parser_codeUnit(Number(_truncBigInt32(((((Text_ILex_Util_hexdigit(Data_Buffer_Core_prim__getByteOffset($0.a2.a1, 2n, $0.a2.a2))*4096n)+(Text_ILex_Util_hexdigit(Data_Buffer_Core_prim__getByteOffset($0.a2.a1, 3n, $0.a2.a2))*256n))+(Text_ILex_Util_hexdigit(Data_Buffer_Core_prim__getByteOffset($0.a2.a1, 4n, $0.a2.a2))*16n))+Text_ILex_Util_hexdigit(Data_Buffer_Core_prim__getByteOffset($0.a2.a1, 5n, $0.a2.a2))))));
                default: return '';
               }
              }
             }
            }
           }
          }
         }
        }
       }
      }
     }
    }
   }
  }
  default: return '';
 }
}

/* JSON.Parser.codepoint : RExp True */
const JSON_Parser_codepoint = __lazy(function () {
 return {h: 2 /* And */, a1: {h: 2 /* And */, a1: {h: 2 /* And */, a1: {h: 2 /* And */, a1: {h: 2 /* And */, a1: csegen_224(), a2: csegen_99()}, a2: Text_ILex_RExp_hexdigit()}, a2: Text_ILex_RExp_hexdigit()}, a2: Text_ILex_RExp_hexdigit()}, a2: Text_ILex_RExp_hexdigit()};
});

/* JSON.Parser.checkedNumberToken : String -> Either String String */
function JSON_Parser_checkedNumberToken($0) {
 const $4 = Text_ILex_Runner_run(Prelude_Types_prim__integerToNat(BigInt(Data_Buffer_stringByteLength(JSON_Parser_prepareText($0)))), $f => ({a1: 11, a2: JSON_Parser_JIni(), a3: csegen_341(), a4: JSON_Parser_jsonTransFor(1), a5: x => $19 => ({h: 0}), a6: JSON_Parser_jsonErr(), a7: csegen_342(), a8: csegen_178()()}), Data_Buffer_Core_fromString(JSON_Parser_prepareText($0)));
 let $3;
 switch($4.h) {
  case 0: /* Left */ {
   $3 = {h: 0 /* Left */, a1: Text_ByteBounds_toParseError({h: 0}, Data_Buffer_Core_toString(Data_Buffer_Core_fromString(JSON_Parser_prepareText($0)), 0n, Prelude_Types_prim__integerToNat(BigInt(Data_Buffer_stringByteLength(JSON_Parser_prepareText($0))))), $4.a1)};
   break;
  }
  case 1: /* Right */ {
   $3 = {h: 1 /* Right */, a1: $4.a1};
   break;
  }
 }
 return JSON_Parser_case__checkedNumberToken_9688($0, $3);
}

/* JSON.Parser.OVal : JST */
const JSON_Parser_OVal = __lazy(function () {
 return 5;
});

/* JSON.Parser.ONew : JST */
const JSON_Parser_ONew = __lazy(function () {
 return 4;
});

/* JSON.Parser.OLbl : JST */
const JSON_Parser_OLbl = __lazy(function () {
 return 7;
});

/* JSON.Parser.OCom : JST */
const JSON_Parser_OCom = __lazy(function () {
 return 6;
});

/* JSON.Parser.OCol : JST */
const JSON_Parser_OCol = __lazy(function () {
 return 8;
});

/* JSON.Parser.JStr : JST */
const JSON_Parser_JStr = __lazy(function () {
 return 9;
});

/* JSON.Parser.JIni : JST */
const JSON_Parser_JIni = __lazy(function () {
 return 0;
});

/* JSON.Parser.JDone : JST */
const JSON_Parser_JDone = __lazy(function () {
 return 10;
});

/* JSON.Parser.AVal : JST */
const JSON_Parser_AVal = __lazy(function () {
 return 2;
});

/* JSON.Parser.ANew : JST */
const JSON_Parser_ANew = __lazy(function () {
 return 1;
});

/* JSON.Parser.ACom : JST */
const JSON_Parser_ACom = __lazy(function () {
 return 3;
});

/* JSON.Object.case block in checkedAssoc */
function JSON_Object_case__checkedAssoc_6231($0, $1, $2) {
 switch($2.h) {
  case 0: /* Left */ return {h: 0 /* Left */, a1: {h: 1 /* DuplicateObjectKey */, a1: $2.a1, a2: JSON_Object_occurrences($2.a1, 0n, $1)}};
  case 1: /* Right */ return {h: 1 /* Right */, a1: $2.a1};
 }
}

/* JSON.Object.show */
function JSON_Object_show_Show_ObjectError($0) {
 switch($0.h) {
  case 0: /* InvalidScalarKey */ return ('Invalid scalar object key at pair '+(Prelude_Show_show_Show_Nat($0.a1)+(': '+Prelude_Show_show_Show_String($0.a2))));
  case 1: /* DuplicateObjectKey */ return ('Duplicate object key '+(Prelude_Show_show_Show_String($0.a1)+(' at pair positions '+Prelude_Show_show_Show_x28Listx20x24ax29({a1: x => Prelude_Show_show_Show_Nat(x), a2: d => x => Prelude_Show_showPrec_Show_Nat(d, x)}, $0.a2))));
 }
}

/* JSON.Object.interpolate */
function JSON_Object_interpolate_Interpolation_ObjectError($0) {
 return JSON_Object_show_Show_ObjectError($0);
}

/* JSON.Object.occurrences : ScalarString -> Nat -> List (Binding a) -> List Nat */
function JSON_Object_occurrences($0, $1, $2) {
 switch($2.h) {
  case 0: /* nil */ return {h: 0};
  case undefined: /* cons */ {
   const $5 = JSON_Object_occurrences($0, ($1+1n), $2.a2);
   switch(Value_Unicode_Order_compareKeys($0, $2.a1.a1)) {
    case 1: return {a1: $1, a2: $5};
    default: return $5;
   }
  }
 }
}

/* JSON.Object.checkedBindings : Nat -> List (String, a) -> Either ObjectError (List (Binding a)) */
function JSON_Object_checkedBindings($0, $1) {
 switch($1.h) {
  case 0: /* nil */ return {h: 1 /* Right */, a1: {h: 0}};
  case undefined: /* cons */ {
   const $7 = Value_Unicode_scalarString($1.a1.a1);
   let $6;
   switch($7.h) {
    case 0: /* Left */ {
     $6 = {h: 0 /* Left */, a1: {h: 0 /* InvalidScalarKey */, a1: $0, a2: $1.a1.a1, a3: $7.a1}};
     break;
    }
    case 1: /* Right */ {
     $6 = {h: 1 /* Right */, a1: $7.a1};
     break;
    }
   }
   return Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29($6, key => Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29(JSON_Object_checkedBindings(($0+1n), $1.a2), remaining => ({h: 1 /* Right */, a1: {a1: {a1: key, a2: $1.a1.a2}, a2: remaining}})));
  }
 }
}

/* JSON.Object.checkedAssoc : List (String, a) -> Either ObjectError (StringKeySortedAssoc a) */
function JSON_Object_checkedAssoc($0) {
 return Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29(JSON_Object_checkedBindings(0n, $0), bindings => JSON_Object_case__checkedAssoc_6231($0, bindings, Value_StringKeySortedAssoc_fromList(bindings)));
}

/* Value.StringKeySortedAssoc.normalizeEntries : (source : List (Binding a)) -> Either AssocError (Normalized source) */
function Value_StringKeySortedAssoc_normalizeEntries($0) {
 switch($0.h) {
  case 0: /* nil */ return {h: 1 /* Right */, a1: {h: 0}};
  case undefined: /* cons */ return Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29(Value_StringKeySortedAssoc_normalizeEntries($0.a2), normalized => Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29(Value_StringKeySortedAssoc_insertBinding($0.a1, normalized), inserted => ({h: 1 /* Right */, a1: inserted})));
 }
}

/* Value.StringKeySortedAssoc.lookupValue : ScalarString -> StringKeySortedAssoc a -> Maybe a */
function Value_StringKeySortedAssoc_lookupValue($0, $1) {
 return Value_StringKeySortedAssoc_lookupEntries($0, $1);
}

/* Value.StringKeySortedAssoc.insertBinding : (incoming : Binding a) -> (previous : List (Binding a)) ->
(0 _ : CanonicalEntries previous) ->
Either AssocError (Inserted incoming previous) */
function Value_StringKeySortedAssoc_insertBinding($0, $1) {
 switch($1.h) {
  case 0: /* nil */ return {h: 1 /* Right */, a1: {a1: $0, a2: {h: 0}}};
  case undefined: /* cons */ {
   switch(Value_Unicode_Order_compareCodesWorker(Value_StringKeySortedAssoc_bindingCodes($0), Value_StringKeySortedAssoc_bindingCodes($1.a1))) {
    case 0: return {h: 1 /* Right */, a1: {a1: $0, a2: {a1: $1.a1, a2: $1.a2}}};
    case 1: return {h: 0 /* Left */, a1: Builtin_fst($0)};
    case 2: return Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29(Value_StringKeySortedAssoc_insertBinding($0, $1.a2), inserted => ({h: 1 /* Right */, a1: {a1: $1.a1, a2: inserted}}));
   }
  }
 }
}

/* Value.StringKeySortedAssoc.fromList : List (Binding a) -> Either AssocError (StringKeySortedAssoc a) */
function Value_StringKeySortedAssoc_fromList($0) {
 const $1 = Value_StringKeySortedAssoc_normalizeEntries($0);
 switch($1.h) {
  case 0: /* Left */ return {h: 0 /* Left */, a1: $1.a1};
  case 1: /* Right */ return {h: 1 /* Right */, a1: $1.a1};
 }
}

/* Value.StringKeySortedAssoc.bindingContent : Binding a -> (String, a) */
function Value_StringKeySortedAssoc_bindingContent($0) {
 return {a1: Builtin_fst($0), a2: Builtin_snd($0)};
}

/* Value.StringKeySortedAssoc.bindingCodes : Binding a -> List Nat */
function Value_StringKeySortedAssoc_bindingCodes($0) {
 return Value_Unicode_Order_keyCodes(Builtin_fst($0));
}

/* Data.Maybe.fromMaybe : Lazy a -> Maybe a -> a */
function Data_Maybe_fromMaybe($0, $1) {
 switch($1.h) {
  case 0: /* nothing */ return $0();
  case undefined: /* just */ return $1.a1;
 }
}

/* Data.Nat.pred : Nat -> Nat */
function Data_Nat_pred($0) {
 switch($0) {
  case 0n: return 0n;
  default: return ($0-1n);
 }
}

/* Data.List.7787:8508:split */
function Data_List_n__7787_8508_split($0, $1, $2) {
 return Data_List_n__7787_8509_splitRec($0, $1, $2, $2, $9 => $9);
}

/* Data.List.take : Nat -> List a -> List a */
function Data_List_take($0, $1) {
 switch($0) {
  case 0n: return {h: 0};
  default: {
   const $3 = ($0-1n);
   switch($1.h) {
    case undefined: /* cons */ return {a1: $1.a1, a2: Data_List_take($3, $1.a2)};
    default: return {h: 0};
   }
  }
 }
}

/* Data.List.sortBy : (a -> a -> Ordering) -> List a -> List a */
function Data_List_sortBy($0, $1) {
 switch($1.h) {
  case 0: /* nil */ return {h: 0};
  case undefined: /* cons */ {
   switch($1.a2.h) {
    case 0: /* nil */ return {a1: $1.a1, a2: {h: 0}};
    default: {
     const $6 = Data_List_n__7787_8508_split($1, $0, $1);
     return Data_List_mergeBy($0, Data_List_sortBy($0, $6.a1), Data_List_sortBy($0, $6.a2));
    }
   }
  }
  default: {
   const $15 = Data_List_n__7787_8508_split($1, $0, $1);
   return Data_List_mergeBy($0, Data_List_sortBy($0, $15.a1), Data_List_sortBy($0, $15.a2));
  }
 }
}

/* Data.List.sort : Ord a => List a -> List a */
function Data_List_sort($0, $1) {
 return Data_List_sortBy($0.a2, $1);
}

/* Data.List.mergeBy : (a -> a -> Ordering) -> List a -> List a -> List a */
function Data_List_mergeBy($0, $1, $2) {
 switch($1.h) {
  case 0: /* nil */ return $2;
  default: {
   switch($2.h) {
    case 0: /* nil */ return $1;
    default: {
     switch($0($1.a1)($2.a1)) {
      case 0: return {a1: $1.a1, a2: Data_List_mergeBy($0, $1.a2, {a1: $2.a1, a2: $2.a2})};
      default: return {a1: $2.a1, a2: Data_List_mergeBy($0, {a1: $1.a1, a2: $1.a2}, $2.a2)};
     }
    }
   }
  }
 }
}

/* Value.Unicode.Order.keyCodes : ScalarString -> List Nat */
function Value_Unicode_Order_keyCodes($0) {
 return Prelude_Types_List_mapAppend({h: 0}, character => Prelude_Types_prim__integerToNat(BigInt(_truncInt32(character.codePointAt(0)))), Prelude_Types_fastUnpack($0));
}

/* Value.Unicode.Order.compareKeys : (left : ScalarString) -> (right : ScalarString) ->
CodesComparison (keyCodes left) (keyCodes right) */
function Value_Unicode_Order_compareKeys($0, $1) {
 return Value_Unicode_Order_compareCodesWorker(Value_Unicode_Order_keyCodes($0), Value_Unicode_Order_keyCodes($1));
}

/* Value.Unicode.with block in scalarString */
function Value_Unicode_with__scalarString_5417($0, $1, $2) {
 switch($1) {
  case 1: return {h: 1 /* Right */, a1: $0};
  case 0: return {h: 0 /* Left */, a1: undefined};
 }
}

/* Value.Unicode.scalarString : String -> Either UnicodeError ScalarString */
function Value_Unicode_scalarString($0) {
 return Value_Unicode_with__scalarString_5417($0, Value_Unicode_isScalarString($0), undefined);
}

/* Value.Unicode.scalarCharacter : Char -> Bool */
function Value_Unicode_scalarCharacter($0) {
 const $1 = _truncInt32($0.codePointAt(0));
 switch(Prelude_EqOrd_x3ex3d_Ord_Int($1, Number(_truncBigInt32(0n)))) {
  case 1: {
   switch(Prelude_EqOrd_x3cx3d_Ord_Int($1, Number(_truncBigInt32(1114111n)))) {
    case 1: {
     switch(Prelude_EqOrd_x3c_Ord_Int($1, Number(_truncBigInt32(55296n)))) {
      case 1: return 1;
      case 0: return Prelude_EqOrd_x3e_Ord_Int($1, Number(_truncBigInt32(57343n)));
     }
    }
    case 0: return 0;
   }
  }
  case 0: return 0;
 }
}

/* Value.Unicode.isScalarString : String -> Bool */
function Value_Unicode_isScalarString($0) {
 return Value_Unicode_scalarCharacters(Prelude_Types_fastUnpack($0));
}

/* Text.ILex.Util.case block in integerBV */
function Text_ILex_Util_case__integerBV_15858($0, $1, $2, $3) {
 switch($3) {
  case 45: return (0n-Text_ILex_Util_decimalBV($0, 0n, $1, ($2+1n)));
  case 43: return Text_ILex_Util_decimalBV($0, 0n, $1, ($2+1n));
  default: return Text_ILex_Util_decimalBV($0, (BigInt($3)-48n), $1, ($2+1n));
 }
}

/* Text.ILex.Util.snocPack : SnocList String -> String */
function Text_ILex_Util_snocPack($0) {
 switch($0.h) {
  case 0: /* nil */ return '';
  case undefined: /* cons */ {
   switch($0.a1.h) {
    case 0: /* nil */ return $0.a2;
    default: return Prelude_Types_fastConcat(Prelude_Types_SnocList_x3cx3ex3e($0, {h: 0}));
   }
  }
  default: return Prelude_Types_fastConcat(Prelude_Types_SnocList_x3cx3ex3e($0, {h: 0}));
 }
}

/* Text.ILex.Util.integerBV : IBuffer n -> (k : Nat) -> Ix k n => Integer */
function Text_ILex_Util_integerBV($0, $1, $2) {
 switch($1) {
  case 0n: return 0n;
  default: {
   const $4 = ($1-1n);
   return Text_ILex_Util_case__integerBV_15858($0, $4, $2, Data_Buffer_Core_prim__getByte($0, $2));
  }
 }
}

/* Text.ILex.Util.hexdigit : Bits8 -> Integer */
function Text_ILex_Util_hexdigit($0) {
 switch(Prelude_EqOrd_x3cx3d_Ord_Bits8($0, 57)) {
  case 1: return (BigInt($0)-48n);
  case 0: {
   switch(Prelude_EqOrd_x3cx3d_Ord_Bits8($0, 70)) {
    case 1: return ((BigInt($0)+10n)-65n);
    case 0: return ((BigInt($0)+10n)-97n);
   }
  }
 }
}

/* Text.ILex.RExp.posdigit : RExp True */
const Text_ILex_RExp_posdigit = __lazy(function () {
 return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_posdigit()};
});

/* Text.ILex.RExp.oneof : WithBounds t => Neg t => (rs : List (RExpOf True t)) ->
{auto 0 _ : NonEmpty rs} -> RExpOf True t */
function Text_ILex_RExp_oneof($0, $1, $2) {
 switch($2.a2.h) {
  case 0: /* nil */ return $2.a1;
  case undefined: /* cons */ return Text_ILex_RExp_x3cx7cx3e($0, $1, $2.a1, Text_ILex_RExp_oneof($0, $1, $2.a2));
 }
}

/* Text.ILex.RExp.hexdigit : RExp True */
const Text_ILex_RExp_hexdigit = __lazy(function () {
 let $11;
 switch(Prelude_EqOrd_x3cx3d_Ord_Bits32(_truncUInt32('a'.codePointAt(0)), _truncUInt32('f'.codePointAt(0)))) {
  case 1: {
   $11 = {a1: _truncUInt32('a'.codePointAt(0)), a2: _truncUInt32('f'.codePointAt(0))};
   break;
  }
  case 0: {
   $11 = {h: 0};
   break;
  }
 }
 const $f = Text_ILex_Char_Set_range($11);
 const $e = {h: 1 /* Ch */, a1: $f};
 let $1f;
 switch(Prelude_EqOrd_x3cx3d_Ord_Bits32(_truncUInt32('A'.codePointAt(0)), _truncUInt32('F'.codePointAt(0)))) {
  case 1: {
   $1f = {a1: _truncUInt32('A'.codePointAt(0)), a2: _truncUInt32('F'.codePointAt(0))};
   break;
  }
  case 0: {
   $1f = {h: 0};
   break;
  }
 }
 const $1d = Text_ILex_Char_Set_range($1f);
 const $1c = {h: 1 /* Ch */, a1: $1d};
 const $8 = Text_ILex_RExp_x3cx7cx3e(csegen_323(), csegen_328(), $e, $1c);
 return Text_ILex_RExp_x3cx7cx3e(csegen_323(), csegen_328(), {h: 1 /* Ch */, a1: csegen_365()}, $8);
});

/* Text.ILex.RExp.decimal : RExp True */
const Text_ILex_RExp_decimal = __lazy(function () {
 return Text_ILex_RExp_x3cx7cx3e(csegen_323(), csegen_328(), {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('0'.codePointAt(0)))}, {h: 2 /* And */, a1: Text_ILex_RExp_posdigit(), a2: {h: 4 /* Star */, a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_digit()}}});
});

/* Text.ILex.RExp.adjRanges : (SetOf t -> RExpOf True s) -> RExpOf b t -> RExpOf b s */
function Text_ILex_RExp_adjRanges($0, $1) {
 switch($1.h) {
  case 0: /* Eps */ return {h: 0 /* Eps */};
  case 1: /* Ch */ return $0($1.a1);
  case 2: /* And */ return {h: 2 /* And */, a1: Text_ILex_RExp_adjRanges($0, $1.a1), a2: Text_ILex_RExp_adjRanges($0, $1.a2)};
  case 3: /* Or */ return {h: 3 /* Or */, a1: Text_ILex_RExp_adjRanges($0, $1.a1), a2: Text_ILex_RExp_adjRanges($0, $1.a2)};
  case 4: /* Star */ return {h: 4 /* Star */, a1: Text_ILex_RExp_adjRanges($0, $1.a1)};
 }
}

/* Text.ILex.RExp.(<|>) : WithBounds t => Neg t => RExpOf b1 t -> RExpOf b2 t -> RExpOf (b1 && Delay b2) t */
function Text_ILex_RExp_x3cx7cx3e($0, $1, $2, $3) {
 switch($2.h) {
  case 1: /* Ch */ {
   switch($3.h) {
    case 1: /* Ch */ return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_union($0, $1, $2.a1, $3.a1)};
    default: return {h: 3 /* Or */, a1: $2, a2: $3};
   }
  }
  default: return {h: 3 /* Or */, a1: $2, a2: $3};
 }
}

/* Data.String.3857:9599:unlines' */
function Data_String_n__3857_9599_unlinesx27($0) {
 switch($0.h) {
  case 0: /* nil */ return {h: 0};
  case undefined: /* cons */ return {a1: $0.a1, a2: {a1: '\n', a2: Data_String_n__3857_9599_unlinesx27($0.a2)}};
 }
}

/* Data.String.singleton : Char -> String */
function Data_String_singleton($0) {
 return ($0+'');
}

/* Data.String.replicate : Nat -> Char -> String */
function Data_String_replicate($0, $1) {
 return Prelude_Types_fastPack(Data_List_replicateTR({h: 0}, $0, $1));
}

/* Data.String.padLeft : Nat -> Char -> String -> String */
function Data_String_padLeft($0, $1, $2) {
 return (Data_String_replicate(Prelude_Types_prim__integerToNat(($0-Prelude_Types_String_length($2))), $1)+$2);
}

/* Data.String.lines' : List Char -> List (List Char) */
function Data_String_linesx27($0) {
 return Data_String_n__3990_9729_linesHelp($0, {h: 0}, $0);
}

/* Data.String.lines : String -> List String */
function Data_String_lines($0) {
 return Prelude_Types_List_mapAppend({h: 0}, $4 => Prelude_Types_fastPack($4), Data_String_linesx27(Prelude_Types_fastUnpack($0)));
}

/* Data.String.indent : Nat -> String -> String */
function Data_String_indent($0, $1) {
 return (Data_String_replicate($0, ' ')+$1);
}

/* Data.String.fastUnlines : List String -> String */
function Data_String_fastUnlines($0) {
 return Prelude_Types_fastConcat(Data_String_n__3857_9599_unlinesx27($0));
}

/* Data.Vect.map */
function Data_Vect_map_Functor_x28Vectx20x24nx29($0, $1) {
 switch($1.h) {
  case 0: /* nil */ return {h: 0};
  case undefined: /* cons */ return {a1: $0($1.a1), a2: Data_Vect_map_Functor_x28Vectx20x24nx29($0, $1.a2)};
 }
}

/* Data.Vect.reverse : Vect len elem -> Vect len elem */
function Data_Vect_reverse($0) {
 return Data_Vect_reverseOnto({h: 0}, $0);
}

/* Data.Vect.fromList : (xs : List elem) -> Vect (length xs) elem */
function Data_Vect_fromList($0) {
 return Data_Vect_reverse(Data_Vect_fromListx27({h: 0}, $0));
}

/* Language.Reflection.Derive.mkOrd : Eq a => (a -> a -> Ordering) -> Ord a */
function Language_Reflection_Derive_mkOrd($0, $1) {
 const $24 = a => b => {
  switch(Prelude_EqOrd_x3dx3d_Eq_Ordering($1(a)(b), 2)) {
   case 1: return a;
   case 0: return b;
  }
 };
 const $2d = a => b => {
  switch(Prelude_EqOrd_x3dx3d_Eq_Ordering($1(a)(b), 0)) {
   case 1: return a;
   case 0: return b;
  }
 };
 return {a1: $0, a2: $1, a3: a => b => Prelude_EqOrd_x3dx3d_Eq_Ordering($1(a)(b), 0), a4: a => b => Prelude_EqOrd_x3dx3d_Eq_Ordering($1(a)(b), 2), a5: a => b => Prelude_EqOrd_x2fx3d_Eq_Ordering($1(a)(b), 2), a6: a => b => Prelude_EqOrd_x2fx3d_Eq_Ordering($1(a)(b), 0), a7: $24, a8: $2d};
}

/* Text.ILex.Char.Set.union : WithBounds t => Neg t => SetOf t -> SetOf t -> SetOf t */
function Text_ILex_Char_Set_union($0, $1, $2, $3) {
 return Text_ILex_Char_Set_rangeSet($0, $1, Prelude_Types_List_tailRecAppend($2, $3));
}

/* Text.ILex.Char.Set.unicode : Set32 */
const Text_ILex_Char_Set_unicode = __lazy(function () {
 return Text_ILex_Char_Set_difference(csegen_323(), csegen_328(), Text_ILex_Char_Set_range(Text_ILex_Char_Range_codepoint()), Text_ILex_Char_Set_range(Text_ILex_Char_Range_surrogate()));
});

/* Text.ILex.Char.Set.singleton : t -> SetOf t */
function Text_ILex_Char_Set_singleton($0) {
 return {a1: {a1: $0, a2: $0}, a2: {h: 0}};
}

/* Text.ILex.Char.Set.rangeSet : WithBounds t => Neg t => List (RangeOf t) -> SetOf t */
function Text_ILex_Char_Set_rangeSet($0, $1, $2) {
 const $17 = a => b => {
  switch(Text_ILex_Char_Range_eqRangeOf($0.a1.a1, a, b)) {
   case 1: return 0;
   case 0: return 1;
  }
 };
 const $d = {a1: $f => $10 => Text_ILex_Char_Range_eqRangeOf($0.a1.a1, $f, $10), a2: $17};
 const $b = Language_Reflection_Derive_mkOrd($d, $20 => $21 => Text_ILex_Char_Range_ordRangeOf($0.a1, $20, $21));
 const $9 = Data_List_sort($b, $2);
 const $7 = Data_Vect_fromList($9);
 return Text_ILex_Char_Set_normalise($0, $1, {h: 0}, $7);
}

/* Text.ILex.Char.Set.range : RangeOf t -> SetOf t */
function Text_ILex_Char_Set_range($0) {
 let $1;
 switch($0.h) {
  case 0: /* nil */ {
   $1 = 1;
   break;
  }
  default: $1 = 0;
 }
 switch($1) {
  case 1: return Text_ILex_Char_Set_empty();
  case 0: return {a1: $0, a2: {h: 0}};
 }
}

/* Text.ILex.Char.Set.posdigit : Set32 */
const Text_ILex_Char_Set_posdigit = __lazy(function () {
 let $1;
 switch(Prelude_EqOrd_x3cx3d_Ord_Bits32(_truncUInt32('1'.codePointAt(0)), _truncUInt32('9'.codePointAt(0)))) {
  case 1: {
   $1 = {a1: _truncUInt32('1'.codePointAt(0)), a2: _truncUInt32('9'.codePointAt(0))};
   break;
  }
  case 0: {
   $1 = {h: 0};
   break;
  }
 }
 return Text_ILex_Char_Set_range($1);
});

/* Text.ILex.Char.Set.negation : WithBounds t => Neg t => SetOf t -> SetOf t */
function Text_ILex_Char_Set_negation($0, $1, $2) {
 return Text_ILex_Char_Set_n__7645_14384_go($0, $1, $2, {h: 0}, $1.a1.a3(0n), $2);
}

/* Text.ILex.Char.Set.empty : SetOf t */
const Text_ILex_Char_Set_empty = __lazy(function () {
 return {h: 0};
});

/* Text.ILex.Char.Set.digit : Set32 */
const Text_ILex_Char_Set_digit = __lazy(function () {
 return csegen_365();
});

/* Text.ILex.Char.Set.difference : WithBounds t => Neg t => SetOf t -> SetOf t -> SetOf t */
function Text_ILex_Char_Set_difference($0, $1, $2, $3) {
 const $4 = Text_ILex_Char_Set_negation($0, $1, $3);
 return Text_ILex_Char_Set_inters($0, $1, {h: 0}, $2, $4);
}

/* Text.ILex.Char.Set.appendNonEmpty : WithBounds t => Neg t =>
SnocList (RangeOf t) -> RangeOf t -> SnocList (RangeOf t) */
function Text_ILex_Char_Set_appendNonEmpty($0, $1, $2, $3) {
 let $4;
 switch($3.h) {
  case 0: /* nil */ {
   $4 = 1;
   break;
  }
  default: $4 = 0;
 }
 switch($4) {
  case 1: return $2;
  case 0: return {a1: $2, a2: $3};
 }
}

/* Text.ILex.Char.Range.case block in case block in case block in difference */
function Text_ILex_Char_Range_case__casex20blockx20inx20casex20blockx20inx20difference_13378($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $a, $b) {
 switch($b.h) {
  case undefined: /* cons */ {
   const $1a = a => b => {
    switch(Text_ILex_Char_Range_eqRangeOf($0.a1, a, b)) {
     case 1: return 0;
     case 0: return 1;
    }
   };
   const $11 = {a1: $13 => $14 => Text_ILex_Char_Range_eqRangeOf($0.a1, $13, $14), a2: $1a};
   const $f = Language_Reflection_Derive_mkOrd($11, $22 => $23 => Text_ILex_Char_Range_ordRangeOf($0, $22, $23));
   const $e = $f.a8($a)($b);
   const $38 = a => b => {
    switch(Text_ILex_Char_Range_eqRangeOf($0.a1, a, b)) {
     case 1: return 0;
     case 0: return 1;
    }
   };
   const $2f = {a1: $31 => $32 => Text_ILex_Char_Range_eqRangeOf($0.a1, $31, $32), a2: $38};
   const $2d = Language_Reflection_Derive_mkOrd($2f, $40 => $41 => Text_ILex_Char_Range_ordRangeOf($0, $40, $41));
   const $2c = $2d.a7($a)($b);
   const $d = {a1: $e, a2: $2c};
   return {h: 1 /* Right */, a1: $d};
  }
  case 0: /* nil */ return {h: 0 /* Left */, a1: $a};
 }
}

/* Text.ILex.Char.Range.case block in case block in difference */
function Text_ILex_Char_Range_case__casex20blockx20inx20difference_13342($0, $1, $2, $3, $4, $5, $6, $7, $8) {
 switch($8.h) {
  case undefined: /* cons */ {
   const $a = {a1: $8.a1, a2: $8.a2};
   return Text_ILex_Char_Range_case__casex20blockx20inx20casex20blockx20inx20difference_13378($0, $1, $2, $3, $8.a2, $8.a1, $7, $6, $5, $4, $a, Text_ILex_Char_Range_afterTo($0, $1, $4, $6));
  }
  case 0: /* nil */ return {h: 0 /* Left */, a1: Text_ILex_Char_Range_afterTo($0, $1, $4, $6)};
 }
}

/* Text.ILex.Char.Range.case block in ordRangeOf */
function Text_ILex_Char_Range_case__ordRangeOf_12656($0, $1, $2, $3, $4, $5) {
 switch($5) {
  case 1: return $0.a2($2)($4);
  default: return $5;
 }
}

/* Text.ILex.Char.Range.upperBound : WithBounds t => RangeOf t -> t */
function Text_ILex_Char_Range_upperBound($0, $1) {
 switch($1.h) {
  case undefined: /* cons */ return $1.a2;
  case 0: /* nil */ return $0.a2;
 }
}

/* Text.ILex.Char.Range.union : Ord t => Neg t => RangeOf t -> RangeOf t -> Either (RangeOf t) (RangeOf t,
RangeOf t) */
function Text_ILex_Char_Range_union($0, $1, $2, $3) {
 switch($2.h) {
  case undefined: /* cons */ {
   switch($3.h) {
    case undefined: /* cons */ {
     const $6 = {a1: $2.a1, a2: $2.a2};
     const $9 = {a1: $3.a1, a2: $3.a2};
     let $c;
     switch(Text_ILex_Char_Range_overlap($0, $6, $9)) {
      case 1: {
       $c = 1;
       break;
      }
      case 0: {
       $c = Text_ILex_Char_Range_adjacent($0, $1, $6, $9);
       break;
      }
     }
     switch($c) {
      case 1: return {h: 0 /* Left */, a1: Text_ILex_Char_Range_span($0, $6, $9)};
      case 0: {
       const $29 = a => b => {
        switch(Text_ILex_Char_Range_eqRangeOf($0.a1, a, b)) {
         case 1: return 0;
         case 0: return 1;
        }
       };
       const $20 = {a1: $22 => $23 => Text_ILex_Char_Range_eqRangeOf($0.a1, $22, $23), a2: $29};
       const $1e = Language_Reflection_Derive_mkOrd($20, $31 => $32 => Text_ILex_Char_Range_ordRangeOf($0, $31, $32));
       const $1d = $1e.a8($6)($9);
       const $47 = a => b => {
        switch(Text_ILex_Char_Range_eqRangeOf($0.a1, a, b)) {
         case 1: return 0;
         case 0: return 1;
        }
       };
       const $3e = {a1: $40 => $41 => Text_ILex_Char_Range_eqRangeOf($0.a1, $40, $41), a2: $47};
       const $3c = Language_Reflection_Derive_mkOrd($3e, $4f => $50 => Text_ILex_Char_Range_ordRangeOf($0, $4f, $50));
       const $3b = $3c.a7($6)($9);
       const $1c = {a1: $1d, a2: $3b};
       return {h: 1 /* Right */, a1: $1c};
      }
     }
    }
    default: return {h: 0 /* Left */, a1: $2};
   }
  }
  case 0: /* nil */ return {h: 0 /* Left */, a1: $3};
  default: return {h: 0 /* Left */, a1: $2};
 }
}

/* Text.ILex.Char.Range.surrogate : Range32 */
const Text_ILex_Char_Range_surrogate = __lazy(function () {
 return {a1: 55296, a2: 57343};
});

/* Text.ILex.Char.Range.span : Ord t => RangeOf t -> RangeOf t -> RangeOf t */
function Text_ILex_Char_Range_span($0, $1, $2) {
 switch($1.h) {
  case undefined: /* cons */ {
   switch($2.h) {
    case undefined: /* cons */ return {a1: $0.a8($1.a1)($2.a1), a2: $0.a7($1.a2)($2.a2)};
    default: return $1;
   }
  }
  case 0: /* nil */ return $2;
  default: return $1;
 }
}

/* Text.ILex.Char.Range.overlap : Ord t => RangeOf t -> RangeOf t -> Bool */
function Text_ILex_Char_Range_overlap($0, $1, $2) {
 switch($1.h) {
  case undefined: /* cons */ {
   switch($2.h) {
    case undefined: /* cons */ {
     switch(Text_ILex_Char_Range_has($0, $1, $2.a1)) {
      case 1: return 1;
      case 0: return Text_ILex_Char_Range_has($0, $2, $1.a1);
     }
    }
    default: return 0;
   }
  }
  default: return 0;
 }
}

/* Text.ILex.Char.Range.ordRangeOf : Ord t => RangeOf t -> RangeOf t -> Ordering */
function Text_ILex_Char_Range_ordRangeOf($0, $1, $2) {
 switch($1.h) {
  case 0: /* nil */ {
   switch($2.h) {
    case 0: /* nil */ return 1;
    default: return Prelude_EqOrd_compare_Ord_Bits8(Text_ILex_Char_Range_conIndexRangeOf($1), Text_ILex_Char_Range_conIndexRangeOf($2));
   }
  }
  case undefined: /* cons */ {
   switch($2.h) {
    case undefined: /* cons */ return Text_ILex_Char_Range_case__ordRangeOf_12656($0, $1.a1, $1.a2, $2.a1, $2.a2, $0.a2($1.a1)($2.a1));
    default: return Prelude_EqOrd_compare_Ord_Bits8(Text_ILex_Char_Range_conIndexRangeOf($1), Text_ILex_Char_Range_conIndexRangeOf($2));
   }
  }
  default: return Prelude_EqOrd_compare_Ord_Bits8(Text_ILex_Char_Range_conIndexRangeOf($1), Text_ILex_Char_Range_conIndexRangeOf($2));
 }
}

/* Text.ILex.Char.Range.lowerBound : WithBounds t => RangeOf t -> t */
function Text_ILex_Char_Range_lowerBound($0, $1) {
 switch($1.h) {
  case undefined: /* cons */ return $1.a1;
  case 0: /* nil */ return $0.a3;
 }
}

/* Text.ILex.Char.Range.intersection : Ord t => RangeOf t -> RangeOf t -> RangeOf t */
function Text_ILex_Char_Range_intersection($0, $1, $2) {
 switch($1.h) {
  case undefined: /* cons */ {
   switch($2.h) {
    case undefined: /* cons */ {
     switch($0.a5($1.a1)($2.a1)) {
      case 1: {
       switch($0.a5($2.a1)($0.a8($1.a2)($2.a2))) {
        case 1: return {a1: $2.a1, a2: $0.a8($1.a2)($2.a2)};
        case 0: return {h: 0};
       }
      }
      case 0: {
       switch($0.a5($1.a1)($0.a8($2.a2)($1.a2))) {
        case 1: return {a1: $1.a1, a2: $0.a8($2.a2)($1.a2)};
        case 0: return {h: 0};
       }
      }
     }
    }
    default: return {h: 0};
   }
  }
  default: return {h: 0};
 }
}

/* Text.ILex.Char.Range.has : Ord t => RangeOf t -> t -> Bool */
function Text_ILex_Char_Range_has($0, $1, $2) {
 switch($1.h) {
  case 0: /* nil */ return 0;
  case undefined: /* cons */ {
   switch($0.a5($1.a1)($2)) {
    case 1: return $0.a5($2)($1.a2);
    case 0: return 0;
   }
  }
 }
}

/* Text.ILex.Char.Range.fromTill : Ord t => Neg t => t -> t -> RangeOf t */
function Text_ILex_Char_Range_fromTill($0, $1, $2, $3) {
 switch($0.a3($2)($3)) {
  case 1: {
   switch($0.a5($2)($1.a3($3)($1.a1.a3(1n)))) {
    case 1: return {a1: $2, a2: $1.a3($3)($1.a1.a3(1n))};
    case 0: return {h: 0};
   }
  }
  case 0: return {h: 0};
 }
}

/* Text.ILex.Char.Range.eqRangeOf : Eq t => RangeOf t -> RangeOf t -> Bool */
function Text_ILex_Char_Range_eqRangeOf($0, $1, $2) {
 switch($1.h) {
  case 0: /* nil */ {
   switch($2.h) {
    case 0: /* nil */ return 1;
    default: return 0;
   }
  }
  case undefined: /* cons */ {
   switch($2.h) {
    case undefined: /* cons */ {
     switch($0.a1($1.a1)($2.a1)) {
      case 1: return $0.a1($1.a2)($2.a2);
      case 0: return 0;
     }
    }
    default: return 0;
   }
  }
  default: return 0;
 }
}

/* Text.ILex.Char.Range.difference : Ord t => Neg t => RangeOf t -> RangeOf t -> Either (RangeOf t) (RangeOf t,
RangeOf t) */
function Text_ILex_Char_Range_difference($0, $1, $2, $3) {
 switch($2.h) {
  case undefined: /* cons */ {
   switch($3.h) {
    case undefined: /* cons */ {
     const $6 = {a1: $2.a1, a2: $2.a2};
     const $9 = {a1: $3.a1, a2: $3.a2};
     switch(Text_ILex_Char_Range_overlap($0, $6, $9)) {
      case 1: return Text_ILex_Char_Range_case__casex20blockx20inx20difference_13342($0, $1, $6, $9, $3.a2, $3.a1, $2.a2, $2.a1, Text_ILex_Char_Range_fromTill($0, $1, $2.a1, $3.a1));
      case 0: return {h: 0 /* Left */, a1: $6};
     }
    }
    default: return {h: 0 /* Left */, a1: $2};
   }
  }
  case 0: /* nil */ return {h: 0 /* Left */, a1: {h: 0}};
  default: return {h: 0 /* Left */, a1: $2};
 }
}

/* Text.ILex.Char.Range.conIndexRangeOf : RangeOf t -> Bits8 */
function Text_ILex_Char_Range_conIndexRangeOf($0) {
 switch($0.h) {
  case 0: /* nil */ return 0;
  case undefined: /* cons */ return 1;
 }
}

/* Text.ILex.Char.Range.codepoint : Range32 */
const Text_ILex_Char_Range_codepoint = __lazy(function () {
 return {a1: 0, a2: 1114111};
});

/* Text.ILex.Char.Range.afterTo : Ord t => Neg t => t -> t -> RangeOf t */
function Text_ILex_Char_Range_afterTo($0, $1, $2, $3) {
 switch($0.a3($2)($3)) {
  case 1: {
   switch($0.a5($1.a1.a1($2)($1.a1.a3(1n)))($3)) {
    case 1: return {a1: $1.a1.a1($2)($1.a1.a3(1n)), a2: $3};
    case 0: return {h: 0};
   }
  }
  case 0: return {h: 0};
 }
}

/* Text.ILex.Char.Range.adjacent : Ord t => Neg t => RangeOf t -> RangeOf t -> Bool */
function Text_ILex_Char_Range_adjacent($0, $1, $2, $3) {
 switch($2.h) {
  case undefined: /* cons */ {
   switch($3.h) {
    case undefined: /* cons */ {
     let $6;
     switch($0.a3($2.a2)($3.a1)) {
      case 1: {
       $6 = $0.a1.a1($1.a1.a1($2.a2)($1.a1.a3(1n)))($3.a1);
       break;
      }
      case 0: {
       $6 = 0;
       break;
      }
     }
     switch($6) {
      case 1: return 1;
      case 0: {
       switch($0.a3($3.a2)($2.a1)) {
        case 1: return $0.a1.a1($1.a1.a1($3.a2)($1.a1.a3(1n)))($2.a1);
        case 0: return 0;
       }
      }
     }
    }
    default: return 0;
   }
  }
  default: return 0;
 }
}

/* Data.ByteString.fromString */
function Data_ByteString_fromString_FromString_ByteString($0) {
 return {a1: Prelude_Types_prim__integerToNat(BigInt(Data_Buffer_stringByteLength($0))), a2: Data_ByteVect_fromString($0)};
}

/* Data.ByteString.toString : ByteString -> String */
function Data_ByteString_toString($0) {
 return Data_ByteVect_toString($0.a1, $0.a2);
}

/* Data.ByteString.append : ByteString -> ByteString -> ByteString */
function Data_ByteString_append($0, $1) {
 switch($0.h) {
  case undefined: /* cons */ {
   switch($0.a1) {
    case 0n: return $1;
    default: {
     switch($1.h) {
      case undefined: /* cons */ {
       switch($1.a1) {
        case 0n: return $0;
        default: return {a1: ($0.a1+$1.a1), a2: Data_ByteVect_append($0.a1, $1.a1, $0.a2, $1.a2)};
       }
      }
      default: return {a1: ($0.a1+$1.a1), a2: Data_ByteVect_append($0.a1, $1.a1, $0.a2, $1.a2)};
     }
    }
   }
  }
  default: {
   switch($1.h) {
    case undefined: /* cons */ {
     switch($1.a1) {
      case 0n: return $0;
      default: return {a1: ($0.a1+$1.a1), a2: Data_ByteVect_append($0.a1, $1.a1, $0.a2, $1.a2)};
     }
    }
    default: return {a1: ($0.a1+$1.a1), a2: Data_ByteVect_append($0.a1, $1.a1, $0.a2, $1.a2)};
   }
  }
 }
}

/* Data.ByteVect.toString : ByteVect n -> String */
function Data_ByteVect_toString($0, $1) {
 return Data_Buffer_Core_toString($1.a1, $1.a2, $0);
}

/* Data.ByteVect.fromString : (s : String) -> ByteVect (cast (stringByteLength s)) */
function Data_ByteVect_fromString($0) {
 return {a1: Data_Buffer_Core_fromString($0), a2: 0n};
}

/* Data.ByteVect.empty : ByteVect 0 */
const Data_ByteVect_empty = __lazy(function () {
 return {a1: Data_Buffer_Indexed_empty(), a2: 0n};
});

/* Data.ByteVect.append : ByteVect m -> ByteVect n -> ByteVect (m + n) */
function Data_ByteVect_append($0, $1, $2, $3) {
 const $b = $c => r => t => {
  const $d = Data_Buffer_Core_copy($2.a1, $2.a2, 0n, $0, r, t);
  const $15 = Data_Buffer_Core_copy($3.a1, $3.a2, $0, $1, r, undefined);
  return r;
 };
 const $6 = Data_Buffer_Core_alloc(($0+$1), $b);
 return {a1: $6, a2: 0n};
}

/* Data.ByteVect.any : (Bits8 -> Bool) -> ByteVect n -> Bool */
function Data_ByteVect_any($0, $1, $2) {
 return Data_ByteVect_n__6697_3023_go($0, $2, $1, $0, 0n);
}

/* Data.Buffer.Indexed.empty : IBuffer 0 */
const Data_Buffer_Indexed_empty = __lazy(function () {
 return Data_Buffer_Core_alloc(0n, $3 => $4 => $5 => $4);
});

/* Data.Linear.Token.run1 : F1 s a -> a */
function Data_Linear_Token_run1($0) {
 return $0(undefined)(_idrisworld);
}

/* Data.Buffer.Core.toString : IBuffer n -> (off : Nat) -> (len : Nat) -> {auto 0 _ : LTE (off + len) n} ->
String */
function Data_Buffer_Core_toString($0, $1, $2) {
 return Data_Buffer_Core_prim__getString($0, $1, $2);
}

/* Data.Buffer.Core.fromString : (s : String) -> IBuffer (cast (stringByteLength s)) */
function Data_Buffer_Core_fromString($0) {
 return Data_Buffer_Core_prim__fromString($0);
}

/* Data.Buffer.Core.copy : MBuffer s m -> (srcOffset : Nat) -> (dstOffset : Nat) -> (len : Nat) ->
{auto 0 _ : LTE (srcOffset + len) m} -> {auto 0 _ : LTE (dstOffset + len) n} ->
MBuffer s n -> F1' s */
function Data_Buffer_Core_copy($0, $1, $2, $3, $4, $5) {
 return Data_Buffer_Core_prim__copy($0, $1, $3, $4, $2, $5);
}

/* Data.Buffer.Core.alloc : (n : Nat) -> WithMBuffer n a -> a */
function Data_Buffer_Core_alloc($0, $1) {
 const $3 = $4 => t => {
  const $5 = Data_Buffer_Core_prim__newBuf($0, _idrisworld);
  return $1(undefined)($5)(undefined);
 };
 return Data_Linear_Token_run1($3);
}

/* Data.Array.Index.with block in tryNatToFin */
function Data_Array_Index_with__tryNatToFin_2020($0, $1, $2, $3) {
 switch($2) {
  case 1: return {a1: $1};
  case 0: return {h: 0};
 }
}

/* Data.Array.Index.tryNatToFin : Nat -> Maybe (Fin k) */
function Data_Array_Index_tryNatToFin($0, $1) {
 return Data_Array_Index_with__tryNatToFin_2020($0, $1, Prelude_Types_x3c_Ord_Nat($1, $0), undefined);
}

/* Data.Array.Index.tryLT : (k : Nat) -> Maybe0 (LT k n) */
function Data_Array_Index_tryLT($0, $1) {
 return Prelude_Types_x3c_Ord_Nat($1, $0);
}

/* Data.Array.Indexed.fromPairs : (n : Nat) -> a -> List (Nat, a) -> IArray n a */
function Data_Array_Indexed_fromPairs($0, $1, $2) {
 return Data_Array_Core_alloc($0, $1, $7 => $8 => Data_Array_Indexed_n__5823_9221_go($1, $2, $0, $2, $8));
}

/* Data.Linear.Traverse1.pairIx : Ref s Nat -> a -> F1 s (Nat, a) */
function Data_Linear_Traverse1_pairIx($0, $1, $2) {
 return {a1: Data_Linear_Ref1_readAndMod1($0, $7 => ($7+1n), $2), a2: $1};
}

/* Data.Linear.Ref1.case block in readAndMod1 */
function Data_Linear_Ref1_case__readAndMod1_1732($0, $1, $2) {
 const $3 = ($1.value=$0($2));
 return $2;
}

/* Data.Linear.Ref1.withRef1 : a -> WithRef1 a b -> b */
function Data_Linear_Ref1_withRef1($0, $1) {
 const $3 = $4 => t => {
  const $5 = ({value:$0});
  return $1(undefined)($5)(undefined);
 };
 return Data_Linear_Token_run1($3);
}

/* Data.Linear.Ref1.readAndMod1 : Ref s a -> (a -> a) -> F1 s a */
function Data_Linear_Ref1_readAndMod1($0, $1, $2) {
 return Data_Linear_Ref1_case__readAndMod1_1732($1, $0, ($0.value));
}

/* Data.Array.Mutable.case block in mgrow */
function Data_Array_Mutable_case__mgrow_10079($0, $1, $2, $3, $4) {
 const $5 = Data_Array_Core_copy($1, 0n, 0n, $0, $4, undefined);
 return $4;
}

/* Data.Array.Mutable.mgrow : MArray s n a -> (m : Nat) -> a -> F1 s (MArray s (m + n) a) */
function Data_Array_Mutable_mgrow($0, $1, $2, $3, $4) {
 return Data_Array_Mutable_case__mgrow_10079($0, $1, $3, $2, Data_Array_Core_prim__newArray(($2+$0), $3, $4));
}

/* Data.Array.Core.copy : MArray s m a -> (srcOffset : Nat) -> (dstOffset : Nat) -> (len : Nat) ->
{auto 0 _ : LTE (srcOffset + len) m} -> {auto 0 _ : LTE (dstOffset + len) n} ->
MArray s n a -> F1' s */
function Data_Array_Core_copy($0, $1, $2, $3, $4, $5) {
 return Data_Array_Core_prim__copyArray($0, $1, $3, $4, $2, $5);
}

/* Data.Array.Core.alloc : (n : Nat) -> a -> WithMArray n a b -> b */
function Data_Array_Core_alloc($0, $1, $2) {
 const $4 = $5 => t => {
  const $6 = Data_Array_Core_prim__newArray($0, $1, t);
  return $2(undefined)($6)(undefined);
 };
 return Data_Linear_Token_run1($4);
}

/* Text.ILex.Parser.arrFail : (0 s : (Type -> Type)) ->
Arr32 r (s q -> F1 q e) -> Index r -> s q -> F1 q (Either e x) */
function Text_ILex_Parser_arrFail($0, $1, $2, $3) {
 const $4 = Text_ILex_Parser_prim__machineGet($0, $1);
 const $8 = $4($2)($3);
 return {h: 0 /* Left */, a1: $8};
}

/* Text.ILex.Parser.arr32 : (n : Bits32) -> a -> List (Entry n a) -> Arr32 n a */
function Text_ILex_Parser_arr32($0, $1, $2) {
 const $4 = $5 => t => {
  const $6 = Text_ILex_Parser_prim__newMachine($0, $1, t);
  return Text_ILex_Parser_n__11339_11339_fill($1, $0, $2, $2, $6, undefined);
 };
 return Data_Linear_Token_run1($4);
}

/* Text.ILex.Lexer.case block in case block in byteDFA */
function Text_ILex_Lexer_case__casex20blockx20inx20byteDFA_3921($0, $1, $2, $3, $4, $5) {
 switch($5) {
  case 0n: return Text_ILex_Lexer_emptyDFA();
  default: {
   const $8 = ($5-1n);
   const $b = Text_ILex_Lexer_index($8, $4);
   const $f = Data_Array_Indexed_fromPairs(($8+1n), Text_ILex_Lexer_emptyRow(), Prelude_Types_List_mapAppend({h: 0}, $1a => Text_ILex_Lexer_node($3, $b, $1a), $4));
   return {a1: $8, a2: $f};
  }
 }
}

/* Text.ILex.Lexer.case block in byteDFA */
function Text_ILex_Lexer_case__byteDFA_3861($0, $1) {
 const $3 = Data_SortedMap_fromList(csegen_398(), Prelude_Types_List_mapMaybeAppend({h: 0}, $b => Text_ILex_Lexer_terminals($1.a1, Builtin_snd($b)), $1.a2));
 const $12 = Data_Linear_Ref1_withRef1(0n, $16 => r => $17 => Data_Linear_Traverse1_traverse1List({h: 0}, $1b => $1c => Data_Linear_Traverse1_pairIx(r, $1b, $1c), Prelude_Types_List_mapMaybeAppend({h: 0}, $25 => Text_ILex_Lexer_nonFinal($3, Builtin_snd($25)), $1.a2), $17));
 return Text_ILex_Lexer_case__casex20blockx20inx20byteDFA_3921($0, $1.a2, $1.a1, $3, $12, Prelude_Types_List_lengthTR($12));
}

/* Text.ILex.Lexer.12430:3474:pair */
function Text_ILex_Lexer_n__12430_3474_pair($0, $1, $2, $3, $4, $5, $6) {
 const $8 = Data_SortedMap_lookup($6.a2, $5);
 switch($8.h) {
  case 0: /* nothing */ {
   switch((($6.a2===$3)?1:0)) {
    case 1: return {a1: {a1: Prelude_Types_prim__integerToNat(BigInt($6.a1)), a2: {h: 0 /* Keep */}}};
    case 0: return Prelude_Types_map_Functor_Maybe($17 => ({a1: Prelude_Types_prim__integerToNat(BigInt($6.a1)), a2: {h: 5 /* MoveE */, a1: $17}}), Data_SortedMap_lookup($6.a2, $4));
   }
  }
  case undefined: /* just */ {
   switch($8.a1.h) {
    case 0: /* Left */ return {a1: {a1: Prelude_Types_prim__integerToNat(BigInt($6.a1)), a2: Text_ILex_Lexer_done($8.a1.a1)}};
    case 1: /* Right */ {
     switch((($6.a2===$3)?1:0)) {
      case 1: return {a1: {a1: Prelude_Types_prim__integerToNat(BigInt($6.a1)), a2: {h: 0 /* Keep */}}};
      case 0: return Prelude_Types_map_Functor_Maybe($36 => ({a1: Prelude_Types_prim__integerToNat(BigInt($6.a1)), a2: Text_ILex_Lexer_move($8.a1.a1, $36)}), Data_SortedMap_lookup($6.a2, $4));
     }
    }
   }
  }
 }
}

/* Text.ILex.Lexer.terminals : SortedMap Nat a -> Node -> Maybe (Nat, Either a a) */
function Text_ILex_Lexer_terminals($0, $1) {
 switch($1.h) {
  case undefined: /* record */ {
   switch($1.a2.h) {
    case undefined: /* cons */ {
     switch($1.a3.h) {
      case 0: /* nil */ return Prelude_Types_map_Functor_Maybe($7 => ({a1: $1.a1, a2: {h: 0 /* Left */, a1: $7}}), Data_SortedMap_lookup($1.a2.a1, $0));
      default: return Prelude_Types_map_Functor_Maybe($11 => ({a1: $1.a1, a2: {h: 1 /* Right */, a1: $11}}), Data_SortedMap_lookup($1.a2.a1, $0));
     }
    }
    default: return {h: 0};
   }
  }
  default: return {h: 0};
 }
}

/* Text.ILex.Lexer.nonFinal : SortedMap Nat (Either a a) -> Node -> Maybe Node */
function Text_ILex_Lexer_nonFinal($0, $1) {
 const $2 = Data_SortedMap_lookup($1.a1, $0);
 switch($2.h) {
  case undefined: /* just */ {
   switch($2.a1.h) {
    case 0: /* Left */ return {h: 0};
    default: return {a1: $1};
   }
  }
  default: return {a1: $1};
 }
}

/* Text.ILex.Lexer.node : SortedMap Nat (Either (Step q r s) (Step q r s)) -> SortedMap Nat (Fin (S n)) -> (Nat,
Node) -> (Nat, ByteStep n q r s) */
function Text_ILex_Lexer_node($0, $1, $2) {
 return {a1: $2.a1, a2: Data_Array_Indexed_fromPairs(256n, {h: 6 /* Bottom */}, Prelude_Types_List_mapMaybeAppend({h: 0}, $e => Text_ILex_Lexer_n__12430_3474_pair($2.a2.a2, $2.a1, $2.a2.a3, $2.a2.a1, $1, $0, $e), Prelude_Types_listBind($2.a2.a3, $1b => Text_ILex_Internal_Types_transitions($1b))))};
}

/* Text.ILex.Lexer.move : Step q r s -> Fin (S n) -> Transition n q r s */
function Text_ILex_Lexer_move($0, $1) {
 switch($0.h) {
  case 0: /* Run */ return {h: 3 /* Move */, a1: $1, a2: $0.a1};
  case 1: /* Ign */ return {h: 4 /* MoveI */, a1: $1};
  case 2: /* Err */ return {h: 6 /* Bottom */};
 }
}

/* Text.ILex.Lexer.index : List (Nat, Node) -> SortedMap Nat (Fin (S n)) */
function Text_ILex_Lexer_index($0, $1) {
 return Data_SortedMap_fromList(csegen_398(), Prelude_Types_List_mapMaybeAppend({h: 0}, $9 => Prelude_Types_map_Functor_Maybe($d => ({a1: $9.a2.a1, a2: $d}), Data_Array_Index_tryNatToFin(($0+1n), $9.a1)), $1));
}

/* Text.ILex.Lexer.emptyRow : ByteStep n q r s */
const Text_ILex_Lexer_emptyRow = __lazy(function () {
 return Data_Array_Core_alloc(256n, {h: 6 /* Bottom */}, $4 => $5 => $6 => $5);
});

/* Text.ILex.Lexer.emptyDFA : DFA q r s */
const Text_ILex_Lexer_emptyDFA = __lazy(function () {
 return {a1: 0n, a2: Data_Array_Core_alloc(1n, Text_ILex_Lexer_emptyRow(), $7 => $8 => $9 => $8)};
});

/* Text.ILex.Lexer.done : Step q r s -> Transition n q r s */
function Text_ILex_Lexer_done($0) {
 switch($0.h) {
  case 0: /* Run */ return {h: 1 /* Done */, a1: $0.a1};
  case 1: /* Ign */ return {h: 2 /* Ignore */};
  case 2: /* Err */ return {h: 6 /* Bottom */};
 }
}

/* Text.ILex.Lexer.dfa : Steps q r s -> DFA q r s */
function Text_ILex_Lexer_dfa($0) {
 return Text_ILex_Lexer_byteDFA(Prelude_Types_List_mapAppend({h: 0}, $6 => Text_ILex_Char_UTF8_toUTF8($6), $0));
}

/* Text.ILex.Lexer.byteDFA : TokenMap8 (Step q r s) -> DFA q r s */
function Text_ILex_Lexer_byteDFA($0) {
 return Text_ILex_Lexer_case__byteDFA_3861($0, Text_ILex_Internal_Types_machine($6 => $7 => $8 => Text_ILex_Internal_DFA_toDFA($7, $0, $8)));
}

/* Text.ILex.Internal.Types.11879:11880:translate */
function Text_ILex_Internal_Types_n__11879_11880_translate($0, $1, $2, $3) {
 const $6 = Text_ILex_Internal_Types_lookupDflt1($2.a1, () => 0n, $1, $3);
 const $f = $10 => $11 => {
  const $13 = Text_ILex_Internal_Types_lookupDflt1($10.a2, () => 0n, $1, $11);
  return {a1: $10.a1, a2: $13};
 };
 const $c = Data_Linear_Traverse1_traverse1List({h: 0}, $f, $2.a2.a3, undefined);
 return {a1: $6, a2: {a1: $6, a2: $2.a2.a2, a3: $c}};
}

/* Text.ILex.Internal.Types.transitions : Edge -> List (Bits8, Nat) */
function Text_ILex_Internal_Types_transitions($0) {
 const $2 = Text_ILex_Char_Range_lowerBound(csegen_413(), $0.a1);
 const $7 = Text_ILex_Char_Range_upperBound(csegen_413(), $0.a1);
 switch(Prelude_EqOrd_compare_Ord_Bits8($2, $7)) {
  case 0: return Prelude_Types_List_mapAppend({h: 0}, $13 => ({a1: $13, a2: $0.a2}), Prelude_Types_rangeFromTo_Range_x24a({a1: {a1: csegen_416(), a2: $1d => $1e => Prelude_Num_div_Integral_Bits8($1d, $1e), a3: $23 => $24 => Prelude_Num_mod_Integral_Bits8($23, $24)}, a2: {a1: csegen_412(), a2: csegen_421()}}, $2, $7));
  case 1: return {a1: {a1: $2, a2: $0.a2}, a2: {h: 0}};
  case 2: return {h: 0};
 }
}

/* Text.ILex.Internal.Types.pairs1 : NatMap1 s a -> F1 s (List (Nat, a)) */
function Text_ILex_Internal_Types_pairs1($0, $1) {
 const $2 = ($0.value);
 return Text_ILex_Internal_Types_n__9807_9656_go($0, $2.a2, {h: 0}, $2.a1, undefined);
}

/* Text.ILex.Internal.Types.normalizeGraph : DFAState s a => F1' s */
function Text_ILex_Internal_Types_normalizeGraph($0, $1) {
 const $2 = Text_ILex_Internal_Types_pairs1($0.a5, $1);
 const $7 = Text_ILex_Internal_Types_fromList1(Prelude_Types_List_mapAppend({h: 0}, $d => Builtin_swap($d), Data_Linear_Ref1_withRef1(0n, $14 => r => $15 => Data_Linear_Traverse1_traverse1List({h: 0}, $19 => $1a => Data_Linear_Traverse1_pairIx(r, $19, $1a), Prelude_Types_List_mapAppend({h: 0}, $23 => Builtin_fst($23), $2), $15))), undefined);
 const $29 = Data_Linear_Traverse1_traverse1List({h: 0}, $2d => $2e => Text_ILex_Internal_Types_n__11879_11880_translate($0, $7, $2d, $2e), $2, undefined);
 const $36 = Text_ILex_Internal_Types_fromList1($29, undefined);
 const $3a = ($36.value);
 return ($0.a5.value=$3a);
}

/* Text.ILex.Internal.Types.nchildren : NNode -> List Nat */
function Text_ILex_Internal_Types_nchildren($0) {
 return Prelude_Types_listBind($0.a3, csegen_424());
}

/* Text.ILex.Internal.Types.machine : (DFAState s a => F1 s b) -> Machine a b */
function Text_ILex_Internal_Types_machine($0) {
 const $2 = $3 => $4 => {
  const $5 = Text_ILex_Internal_Types_init($4);
  const $8 = $0(undefined)($5)(undefined);
  const $f = Text_ILex_Internal_Types_pairs1($5.a1, undefined);
  return {a1: Data_SortedMap_fromList(csegen_398(), $f), a2: $8};
 };
 return Data_Linear_Token_run1($2);
}

/* Text.ILex.Internal.Types.lookupSet : DFAState s a => NSet -> F1 s (Maybe Nat) */
function Text_ILex_Internal_Types_lookupSet($0, $1, $2) {
 const $3 = ($0.a2.value);
 return Data_SortedMap_lookup($1, $3);
}

/* Text.ILex.Internal.Types.lookupDflt1 : Nat -> Lazy a -> NatMap1 s a -> F1 s a */
function Text_ILex_Internal_Types_lookupDflt1($0, $1, $2, $3) {
 const $4 = ($2.value);
 const $9 = Data_Array_Index_tryNatToFin($4.a1, $0);
 switch($9.h) {
  case undefined: /* just */ {
   const $d = Data_Array_Core_prim__arrayGet($4.a2, $9.a1);
   return Data_Maybe_fromMaybe($1, $d);
  }
  case 0: /* nothing */ return $1();
 }
}

/* Text.ILex.Internal.Types.lookup1 : Nat -> NatMap1 s a -> F1 s (Maybe a) */
function Text_ILex_Internal_Types_lookup1($0, $1, $2) {
 const $3 = ($1.value);
 const $8 = Data_Array_Index_tryNatToFin($3.a1, $0);
 switch($8.h) {
  case undefined: /* just */ return Data_Array_Core_prim__arrayGet($3.a2, $8.a1);
  case 0: /* nothing */ return {h: 0};
 }
}

/* Text.ILex.Internal.Types.insertTerminal : DFAState s a => (Nat, (t, a)) -> F1' s */
function Text_ILex_Internal_Types_insertTerminal($0, $1, $2) {
 const $6 = Text_ILex_Internal_Types_insert1($1.a1, {a1: {a1: $1.a1, a2: {h: 0}}, a2: {h: 0}, a3: {h: 0}}, $0.a3, $2);
 const $5 = $1.a1;
 return Text_ILex_Internal_Types_insert1($1.a1, $1.a2.a2, $0.a1, undefined);
}

/* Text.ILex.Internal.Types.insert1 : Nat -> a -> NatMap1 s a -> F1' s */
function Text_ILex_Internal_Types_insert1($0, $1, $2, $3) {
 const $4 = ($2.value);
 return Text_ILex_Internal_Types_n__9500_9393_go($1, $2, $0, $4.a1, $4.a2, undefined);
}

/* Text.ILex.Internal.Types.init : F1 s (DFAState s a) */
function Text_ILex_Internal_Types_init($0) {
 const $1 = Text_ILex_Internal_Types_empty(256n, $0);
 const $5 = ({value:Data_SortedMap_empty({a1: {a1: $c => $d => Prelude_Types_x3dx3d_Eq_x28Listx20x24ax29(csegen_390(), $c, $d), a2: $14 => $15 => Prelude_Types_x2fx3d_Eq_x28Listx20x24ax29(csegen_390(), $14, $15)}, a2: $1c => $1d => Prelude_Types_compare_Ord_x28Listx20x24ax29(csegen_398(), $1c, $1d), a3: $24 => $25 => Prelude_Types_x3c_Ord_x28Listx20x24ax29(csegen_398(), $24, $25), a4: $2c => $2d => Prelude_Types_x3e_Ord_x28Listx20x24ax29(csegen_398(), $2c, $2d), a5: $34 => $35 => Prelude_Types_x3cx3d_Ord_x28Listx20x24ax29(csegen_398(), $34, $35), a6: $3c => $3d => Prelude_Types_x3ex3d_Ord_x28Listx20x24ax29(csegen_398(), $3c, $3d), a7: $44 => $45 => Prelude_Types_max_Ord_x28Listx20x24ax29(csegen_398(), $44, $45), a8: $4c => $4d => Prelude_Types_min_Ord_x28Listx20x24ax29(csegen_398(), $4c, $4d)})});
 const $54 = Text_ILex_Internal_Types_empty(256n, undefined);
 const $58 = Text_ILex_Internal_Types_empty(256n, undefined);
 const $5c = Text_ILex_Internal_Types_empty(256n, undefined);
 const $60 = ({value:1n});
 return {a1: $1, a2: $5, a3: $54, a4: $58, a5: $5c, a6: $60};
}

/* Text.ILex.Internal.Types.inc : DFAState s a => F1 s Nat */
function Text_ILex_Internal_Types_inc($0, $1) {
 const $2 = ($0.a6.value);
 const $7 = ($0.a6.value=($2+1n));
 return $2;
}

/* Text.ILex.Internal.Types.fromList1 : List (Nat, a) -> F1 s (NatMap1 s a) */
function Text_ILex_Internal_Types_fromList1($0, $1) {
 const $2 = Text_ILex_Internal_Types_empty(256n, $1);
 const $6 = Data_Linear_Traverse1_traverse1_List($9 => $a => Text_ILex_Internal_Types_insert1($9.a1, $9.a2, $2, $a), $0, undefined);
 return $2;
}

/* Text.ILex.Internal.Types.empty : {default 256 size : Nat} -> {auto 0 _ : IsSucc size} -> F1 s (NatMap1 s a) */
function Text_ILex_Internal_Types_empty($0, $1) {
 const $2 = Data_Array_Core_prim__newArray($0, {h: 0}, $1);
 return ({value:{a1: $0, a2: $2}});
}

/* Text.ILex.Internal.Types.connectedComponent : (a -> List Nat) -> Nat -> NatMap1 s a -> F1' s */
function Text_ILex_Internal_Types_connectedComponent($0, $1, $2, $3) {
 const $4 = ($2.value);
 const $9 = Data_Array_Core_prim__newArray($4.a1, 0, undefined);
 const $e = Data_Array_Core_prim__newArray($4.a1, {h: 0}, undefined);
 const $13 = Text_ILex_Internal_Types_visit($4.a1, $0, $9, $4.a2, $e, {a1: $1, a2: {h: 0}}, undefined);
 return ($2.value={a1: $4.a1, a2: $e});
}

/* Text.ILex.Internal.Types.children : Node -> List Nat */
function Text_ILex_Internal_Types_children($0) {
 return Prelude_Types_List_mapAppend({h: 0}, csegen_424(), $0.a3);
}

/* Text.ILex.Internal.Types.addSet : DFAState s a => NSet -> F1 s Nat */
function Text_ILex_Internal_Types_addSet($0, $1, $2) {
 const $3 = Text_ILex_Internal_Types_inc($0, $2);
 const $8 = ($0.a2.value);
 const $7 = ($0.a2.value=Data_SortedMap_insert($1, $3, $8));
 return $3;
}

/* Data.SortedMap.lookup : k -> SortedMap k v -> Maybe v */
function Data_SortedMap_lookup($0, $1) {
 return Prelude_Types_map_Functor_Maybe($4 => $4.a2, Data_SortedMap_Dependent_lookup($0, $1));
}

/* Data.SortedMap.insertFrom : Foldable f => f (k, v) -> SortedMap k v -> SortedMap k v */
function Data_SortedMap_insertFrom($0, $1, $2) {
 return Prelude_Basics_flip($0.a2(undefined)(undefined)($c => $d => Prelude_Basics_flip($10 => Prelude_Basics_uncurry($13 => $14 => $15 => Data_SortedMap_insert($13, $14, $15), $10), $c, $d)), $1, $2);
}

/* Data.SortedMap.insert : k -> v -> SortedMap k v -> SortedMap k v */
function Data_SortedMap_insert($0, $1, $2) {
 return Data_SortedMap_Dependent_insert($0, $1, $2);
}

/* Data.SortedMap.fromList : Ord k => List (k, v) -> SortedMap k v */
function Data_SortedMap_fromList($0, $1) {
 return Prelude_Basics_flip($4 => $5 => Data_SortedMap_insertFrom(csegen_24(), $4, $5), Data_SortedMap_empty($0), $1);
}

/* Data.SortedMap.empty : Ord k => SortedMap k v */
function Data_SortedMap_empty($0) {
 return Data_SortedMap_Dependent_empty($0);
}

/* Data.SortedMap.Dependent.treeInsert' : Ord k => (x : k) -> v x -> Tree n k v o -> Either (Tree n k v o) (Tree n k v o,
(k, Tree n k v o)) */
function Data_SortedMap_Dependent_treeInsertx27($0, $1, $2, $3) {
 switch($3.h) {
  case 0: /* Leaf */ {
   switch($0.a2($1)($3.a1)) {
    case 0: return {h: 1 /* Right */, a1: {a1: {h: 0 /* Leaf */, a1: $1, a2: $2}, a2: {a1: $1, a2: {h: 0 /* Leaf */, a1: $3.a1, a2: $3.a2}}}};
    case 1: return {h: 0 /* Left */, a1: {h: 0 /* Leaf */, a1: $1, a2: $2}};
    case 2: return {h: 1 /* Right */, a1: {a1: {h: 0 /* Leaf */, a1: $3.a1, a2: $3.a2}, a2: {a1: $3.a1, a2: {h: 0 /* Leaf */, a1: $1, a2: $2}}}};
   }
  }
  case 1: /* Branch2 */ {
   switch($0.a5($1)($3.a2)) {
    case 1: {
     const $26 = Data_SortedMap_Dependent_treeInsertx27($0, $1, $2, $3.a1);
     switch($26.h) {
      case 0: /* Left */ return {h: 0 /* Left */, a1: {h: 1 /* Branch2 */, a1: $26.a1, a2: $3.a2, a3: $3.a3}};
      case 1: /* Right */ return {h: 0 /* Left */, a1: {h: 2 /* Branch3 */, a1: $26.a1.a1, a2: $26.a1.a2.a1, a3: $26.a1.a2.a2, a4: $3.a2, a5: $3.a3}};
     }
    }
    case 0: {
     const $38 = Data_SortedMap_Dependent_treeInsertx27($0, $1, $2, $3.a3);
     switch($38.h) {
      case 0: /* Left */ return {h: 0 /* Left */, a1: {h: 1 /* Branch2 */, a1: $3.a1, a2: $3.a2, a3: $38.a1}};
      case 1: /* Right */ return {h: 0 /* Left */, a1: {h: 2 /* Branch3 */, a1: $3.a1, a2: $3.a2, a3: $38.a1.a1, a4: $38.a1.a2.a1, a5: $38.a1.a2.a2}};
     }
    }
   }
  }
  case 2: /* Branch3 */ {
   switch($0.a5($1)($3.a2)) {
    case 1: {
     const $50 = Data_SortedMap_Dependent_treeInsertx27($0, $1, $2, $3.a1);
     switch($50.h) {
      case 0: /* Left */ return {h: 0 /* Left */, a1: {h: 2 /* Branch3 */, a1: $50.a1, a2: $3.a2, a3: $3.a3, a4: $3.a4, a5: $3.a5}};
      case 1: /* Right */ return {h: 1 /* Right */, a1: {a1: {h: 1 /* Branch2 */, a1: $50.a1.a1, a2: $50.a1.a2.a1, a3: $50.a1.a2.a2}, a2: {a1: $3.a2, a2: {h: 1 /* Branch2 */, a1: $3.a3, a2: $3.a4, a3: $3.a5}}}};
     }
    }
    case 0: {
     switch($0.a5($1)($3.a4)) {
      case 1: {
       const $6f = Data_SortedMap_Dependent_treeInsertx27($0, $1, $2, $3.a3);
       switch($6f.h) {
        case 0: /* Left */ return {h: 0 /* Left */, a1: {h: 2 /* Branch3 */, a1: $3.a1, a2: $3.a2, a3: $6f.a1, a4: $3.a4, a5: $3.a5}};
        case 1: /* Right */ return {h: 1 /* Right */, a1: {a1: {h: 1 /* Branch2 */, a1: $3.a1, a2: $3.a2, a3: $6f.a1.a1}, a2: {a1: $6f.a1.a2.a1, a2: {h: 1 /* Branch2 */, a1: $6f.a1.a2.a2, a2: $3.a4, a3: $3.a5}}}};
       }
      }
      case 0: {
       const $88 = Data_SortedMap_Dependent_treeInsertx27($0, $1, $2, $3.a5);
       switch($88.h) {
        case 0: /* Left */ return {h: 0 /* Left */, a1: {h: 2 /* Branch3 */, a1: $3.a1, a2: $3.a2, a3: $3.a3, a4: $3.a4, a5: $88.a1}};
        case 1: /* Right */ return {h: 1 /* Right */, a1: {a1: {h: 1 /* Branch2 */, a1: $3.a1, a2: $3.a2, a3: $3.a3}, a2: {a1: $3.a4, a2: {h: 1 /* Branch2 */, a1: $88.a1.a1, a2: $88.a1.a2.a1, a3: $88.a1.a2.a2}}}};
       }
      }
     }
    }
   }
  }
 }
}

/* Data.SortedMap.Dependent.treeInsert : Ord k => (x : k) ->
v x -> Tree n k v o -> Either (Tree n k v o) (Tree (S n) k v o) */
function Data_SortedMap_Dependent_treeInsert($0, $1, $2, $3) {
 const $4 = Data_SortedMap_Dependent_treeInsertx27($0, $1, $2, $3);
 switch($4.h) {
  case 0: /* Left */ return {h: 0 /* Left */, a1: $4.a1};
  case 1: /* Right */ return {h: 1 /* Right */, a1: {h: 1 /* Branch2 */, a1: $4.a1.a1, a2: $4.a1.a2.a1, a3: $4.a1.a2.a2}};
 }
}

/* Data.SortedMap.Dependent.lookup : k -> SortedDMap k v -> Maybe (y : k ** v y) */
function Data_SortedMap_Dependent_lookup($0, $1) {
 switch($1.h) {
  case 0: /* Empty */ return {h: 0};
  case 1: /* M */ return Data_SortedMap_Dependent_treeLookup($1.a1, $0, $1.a3);
 }
}

/* Data.SortedMap.Dependent.insert : (x : k) -> v x -> SortedDMap k v -> SortedDMap k v */
function Data_SortedMap_Dependent_insert($0, $1, $2) {
 switch($2.h) {
  case 0: /* Empty */ return {h: 1 /* M */, a1: $2.a1, a2: 0n, a3: {h: 0 /* Leaf */, a1: $0, a2: $1}};
  case 1: /* M */ {
   const $9 = Data_SortedMap_Dependent_treeInsert($2.a1, $0, $1, $2.a3);
   switch($9.h) {
    case 0: /* Left */ return {h: 1 /* M */, a1: $2.a1, a2: $2.a2, a3: $9.a1};
    case 1: /* Right */ return {h: 1 /* M */, a1: $2.a1, a2: ($2.a2+1n), a3: $9.a1};
   }
  }
 }
}

/* Data.SortedMap.Dependent.empty : Ord k => SortedDMap k v */
function Data_SortedMap_Dependent_empty($0) {
 return {h: 0 /* Empty */, a1: $0};
}

/* Text.ILex.Internal.DFA.toDFA : DFAState s a => TokenMap8 a -> F1 s (List (Nat, Node)) */
function Text_ILex_Internal_DFA_toDFA($0, $1, $2) {
 const $3 = Text_ILex_Internal_NFA_toNFA($0, $1, $2);
 const $8 = Text_ILex_Internal_DFA_nodes($0, undefined);
 const $c = Text_ILex_Internal_Types_connectedComponent($f => Text_ILex_Internal_Types_children($f), 0n, $0.a5, undefined);
 const $16 = Text_ILex_Internal_Types_normalizeGraph($0, undefined);
 return Text_ILex_Internal_Types_pairs1($0.a5, undefined);
}

/* Text.ILex.Internal.DFA.nodes : DFAState s a => F1' s */
function Text_ILex_Internal_DFA_nodes($0, $1) {
 const $3 = Text_ILex_Internal_Types_pairs1($0.a4, $1);
 const $2 = Prelude_Types_List_mapAppend({h: 0}, $b => Builtin_fst($b), $3);
 return Data_Linear_Traverse1_traverse1_List($11 => $12 => Text_ILex_Internal_DFA_discrete($0, $11, $12), $2, undefined);
}

/* Text.ILex.Internal.DFA.discrete : DFAState s a => Nat -> F1' s */
function Text_ILex_Internal_DFA_discrete($0, $1, $2) {
 const $3 = Text_ILex_Internal_Types_lookup1($1, $0.a5, $2);
 switch($3.h) {
  case 0: /* nothing */ {
   const $a = Text_ILex_Internal_Types_lookupDflt1($1, () => ({a1: $1, a2: {h: 0}, a3: {h: 0}}), $0.a4, undefined);
   const $14 = Text_ILex_Internal_DFA_process($0, {h: 0}, $a.a3)(undefined);
   const $1c = {a1: $a.a1, a2: $a.a2, a3: $14};
   return Text_ILex_Internal_Types_insert1($1, $1c, $0.a5, undefined);
  }
  case undefined: /* just */ return undefined;
 }
}

/* Text.ILex.Internal.NFA.case block in case block in split */
function Text_ILex_Internal_NFA_case__casex20blockx20inx20split_13738($0, $1, $2, $3, $4, $5) {
 switch($5.h) {
  case 0: /* Left */ {
   const $8 = csegen_447();
   const $7 = $8.a3($4)($5.a1);
   switch($7) {
    case 1: return {a1: {a1: $4, a2: $1.a2}, a2: {a1: $3, a2: {a1: $5.a1, a2: $0.a2}}};
    case 0: return {a1: {a1: $5.a1, a2: $0.a2}, a2: {a1: $3, a2: {a1: $4, a2: $1.a2}}};
   }
  }
  case 1: /* Right */ return {a1: {a1: $5.a1.a1, a2: $0.a2}, a2: {a1: $3, a2: {a1: $5.a1.a2, a2: $0.a2}}};
 }
}

/* Text.ILex.Internal.NFA.toNFA : DFAState s a => TokenMap8 a -> F1' s */
function Text_ILex_Internal_NFA_toNFA($0, $1, $2) {
 const $3 = Text_ILex_Internal_ENFA_toENFA($0, $1, $2);
 const $8 = Text_ILex_Internal_NFA_closures($0, undefined);
 return Text_ILex_Internal_Types_connectedComponent($e => Text_ILex_Internal_Types_nchildren($e), 0n, $0.a4, undefined);
}

/* Text.ILex.Internal.NFA.split : NEdge -> NEdge -> (NEdge, (NEdge, NEdge)) */
function Text_ILex_Internal_NFA_split($0, $1) {
 const $2 = Text_ILex_Char_Range_intersection(csegen_412(), $0.a1, $1.a1);
 const $a = {a1: $2, a2: Text_ILex_Internal_Types_union_({h: 0}, $0.a2, $1.a2)};
 const $13 = Text_ILex_Char_Range_difference(csegen_412(), csegen_421(), $0.a1, $2);
 switch($13.h) {
  case 0: /* Left */ return Text_ILex_Internal_NFA_case__casex20blockx20inx20split_13738($1, $0, $2, $a, $13.a1, Text_ILex_Char_Range_difference(csegen_412(), csegen_421(), $1.a1, $2));
  case 1: /* Right */ return {a1: {a1: $13.a1.a1, a2: $0.a2}, a2: {a1: $a, a2: {a1: $13.a1.a2, a2: $0.a2}}};
 }
}

/* Text.ILex.Internal.NFA.prep : NEdge -> NEdges -> NEdges */
function Text_ILex_Internal_NFA_prep($0, $1) {
 let $2;
 switch($0.a1.h) {
  case 0: /* nil */ {
   $2 = 1;
   break;
  }
  default: $2 = 0;
 }
 switch($2) {
  case 1: return $1;
  case 0: return {a1: $0, a2: $1};
 }
}

/* Text.ILex.Internal.NFA.outUnion : NEdges -> NEdges -> NEdges */
function Text_ILex_Internal_NFA_outUnion($0, $1) {
 return Prelude_Types_foldl_Foldable_List($4 => $5 => Text_ILex_Internal_NFA_insertEdge($4, $5), $1, $0);
}

/* Text.ILex.Internal.NFA.joinNNode : NNode -> NNode -> NNode */
function Text_ILex_Internal_NFA_joinNNode($0, $1) {
 return {a1: $0.a1, a2: Text_ILex_Internal_Types_union_({h: 0}, $0.a2, $1.a2), a3: Text_ILex_Internal_NFA_outUnion($0.a3, $1.a3)};
}

/* Text.ILex.Internal.NFA.insertEdge : NEdges -> NEdge -> NEdges */
function Text_ILex_Internal_NFA_insertEdge($0, $1) {
 switch($0.h) {
  case 0: /* nil */ {
   let $3;
   switch($1.a1.h) {
    case 0: /* nil */ {
     $3 = 1;
     break;
    }
    default: $3 = 0;
   }
   switch($3) {
    case 1: return {h: 0};
    case 0: return {a1: $1, a2: {h: 0}};
   }
  }
  case undefined: /* cons */ {
   const $8 = {a1: $0.a1, a2: $0.a2};
   let $b;
   switch($1.a1.h) {
    case 0: /* nil */ {
     $b = 1;
     break;
    }
    default: $b = 0;
   }
   switch($b) {
    case 1: return $8;
    case 0: {
     switch(Prelude_Types_x3dx3d_Eq_x28Listx20x24ax29(csegen_390(), $1.a2, $0.a1.a2)) {
      case 0: {
       switch(Text_ILex_Char_Range_overlap(csegen_412(), $1.a1, $0.a1.a1)) {
        case 0: {
         const $1f = csegen_447();
         const $1e = $1f.a3($1.a1)($0.a1.a1);
         switch($1e) {
          case 1: return Text_ILex_Internal_NFA_prep($1, $8);
          case 0: return {a1: $0.a1, a2: Text_ILex_Internal_NFA_insertEdge($0.a2, $1)};
         }
        }
        case 1: {
         const $2f = Text_ILex_Internal_NFA_split($1, $0.a1);
         return Text_ILex_Internal_NFA_prep($2f.a1, Text_ILex_Internal_NFA_prep($2f.a2.a1, Text_ILex_Internal_NFA_insertEdge($0.a2, $2f.a2.a2)));
        }
       }
      }
      case 1: {
       let $3d;
       switch(Text_ILex_Char_Range_overlap(csegen_412(), $1.a1, $0.a1.a1)) {
        case 1: {
         $3d = 1;
         break;
        }
        case 0: {
         $3d = Text_ILex_Char_Range_adjacent(csegen_412(), csegen_421(), $1.a1, $0.a1.a1);
         break;
        }
       }
       switch($3d) {
        case 0: {
         const $50 = csegen_447();
         const $4f = $50.a3($1.a1)($0.a1.a1);
         switch($4f) {
          case 1: return Text_ILex_Internal_NFA_prep($1, $8);
          case 0: return {a1: $0.a1, a2: Text_ILex_Internal_NFA_insertEdge($0.a2, $1)};
         }
        }
        case 1: return {a1: {a1: Text_ILex_Char_Range_span(csegen_412(), $1.a1, $0.a1.a1), a2: $1.a2}, a2: $0.a2};
       }
      }
     }
    }
   }
  }
 }
}

/* Text.ILex.Internal.NFA.fromEdge : Edge -> NEdge */
function Text_ILex_Internal_NFA_fromEdge($0) {
 return {a1: $0.a1, a2: {a1: $0.a2, a2: {h: 0}}};
}

/* Text.ILex.Internal.NFA.fromENode : Nat -> ENode -> NNode */
function Text_ILex_Internal_NFA_fromENode($0, $1) {
 return {a1: $0, a2: $1.a1, a3: Prelude_Types_List_mapAppend({h: 0}, $9 => Text_ILex_Internal_NFA_fromEdge($9), $1.a3)};
}

/* Text.ILex.Internal.NFA.eclosure : DFAState s a => Nat -> F1 s NNode */
function Text_ILex_Internal_NFA_eclosure($0, $1, $2) {
 const $3 = Text_ILex_Internal_Types_lookup1($1, $0.a4, $2);
 switch($3.h) {
  case 0: /* nothing */ {
   const $a = Text_ILex_Internal_Types_lookupDflt1($1, () => ({a1: {h: 0}, a2: {h: 0}, a3: {h: 0}}), $0.a3, undefined);
   const $14 = Data_Linear_Traverse1_traverse1List({h: 0}, $18 => $19 => Text_ILex_Internal_NFA_eclosure($0, $18, $19), $a.a2, undefined);
   const $21 = Prelude_Types_foldl_Foldable_List(csegen_442(), Text_ILex_Internal_NFA_fromENode($1, $a), $14);
   const $2a = Text_ILex_Internal_Types_insert1($1, $21, $0.a4, undefined);
   return $21;
  }
  case undefined: /* just */ return $3.a1;
 }
}

/* Text.ILex.Internal.NFA.closures : DFAState s a => F1' s */
function Text_ILex_Internal_NFA_closures($0, $1) {
 const $3 = Text_ILex_Internal_Types_pairs1($0.a3, $1);
 const $2 = Prelude_Types_List_mapAppend({h: 0}, $b => Builtin_fst($b), $3);
 const $10 = $11 => $12 => {
  const $13 = Text_ILex_Internal_NFA_eclosure($0, $11, $12);
  return undefined;
 };
 return Data_Linear_Traverse1_traverse1_List($10, $2, undefined);
}

/* Text.ILex.Internal.ENFA.toENFA : DFAState s a => TokenMap8 a -> F1' s */
function Text_ILex_Internal_ENFA_toENFA($0, $1, $2) {
 const $6 = x => $7 => {
  const $8 = Text_ILex_Internal_Types_inc($0, $7);
  return {a1: $8, a2: x};
 };
 const $3 = Data_Linear_Traverse1_traverse1List({h: 0}, $6, $1, $2);
 const $10 = Data_Linear_Traverse1_traverse1_List($13 => $14 => Text_ILex_Internal_Types_insertTerminal($0, $13, $14), $3, undefined);
 const $1b = Data_Linear_Traverse1_traverse1List({h: 0}, $1f => $22 => Text_ILex_Internal_ENFA_enfa($0, $1f.a2.a1, $1f.a1, $22), $3, undefined);
 const $2b = Text_ILex_Internal_Types_insert1(0n, {a1: {h: 0}, a2: $1b, a3: {h: 0}}, $0.a3, undefined);
 const $2a = 0n;
 return undefined;
}

/* Text.ILex.Char.UTF8.8584:18432:go */
function Text_ILex_Char_UTF8_n__8584_18432_go($0, $1, $2, $3) {
 switch($2.a2.h) {
  case 0: /* nil */ return Text_ILex_Char_UTF8_bytes($2.a1, $3.a1);
  case undefined: /* cons */ {
   const $d = {a1: $2.a2.a1, a2: $2.a2.a2};
   const $10 = {a1: $3.a2.a1, a2: $3.a2.a2};
   switch(Prelude_EqOrd_x3dx3d_Eq_Bits8($2.a1, $3.a1)) {
    case 1: return {h: 2 /* And */, a1: Text_ILex_Char_UTF8_bytes($2.a1, $2.a1), a2: Text_ILex_Char_UTF8_n__8584_18432_go($0, $1, $d, $10)};
    case 0: {
     const $21 = {h: 2 /* And */, a1: Text_ILex_Char_UTF8_bytes($2.a1, $2.a1), a2: Text_ILex_Char_UTF8_n__8584_18432_go($0, $1, $d, Data_Vect_map_Functor_x28Vectx20x24nx29($2e => Text_ILex_Char_UTF8_MaxAddByte(), $10))};
     const $31 = {h: 2 /* And */, a1: Text_ILex_Char_UTF8_bytes($3.a1, $3.a1), a2: Text_ILex_Char_UTF8_n__8584_18432_go($0, $1, Data_Vect_map_Functor_x28Vectx20x24nx29($3d => Text_ILex_Char_UTF8_MinAddByte(), $d), $10)};
     switch(Prelude_EqOrd_x3c_Ord_Bits8(_add8u($2.a1, 1), $3.a1)) {
      case 0: return Text_ILex_RExp_x3cx7cx3e(csegen_413(), csegen_421(), $21, $31);
      case 1: return Text_ILex_RExp_x3cx7cx3e(csegen_413(), csegen_421(), $21, Text_ILex_RExp_x3cx7cx3e(csegen_413(), csegen_421(), $31, {h: 2 /* And */, a1: Text_ILex_Char_UTF8_bytes(_add8u($2.a1, 1), _sub8u($3.a1, 1)), a2: Text_ILex_Char_UTF8_anyBytes($d)}));
     }
    }
   }
  }
 }
}

/* Text.ILex.Char.UTF8.toUTF8 : (RExp b, a) -> (RExp8 b, a) */
function Text_ILex_Char_UTF8_toUTF8($0) {
 return {a1: Text_ILex_RExp_adjRanges($5 => Text_ILex_Char_UTF8_toByteRanges($5), $0.a1), a2: $0.a2};
}

/* Text.ILex.Char.UTF8.toByteRanges : Set32 -> RExp8 True */
function Text_ILex_Char_UTF8_toByteRanges($0) {
 return Text_ILex_Char_UTF8_convert(Text_ILex_Char_Set_inters(csegen_323(), csegen_328(), {h: 0}, Text_ILex_Char_Set_unicode(), $0));
}

/* Text.ILex.Char.UTF8.spans : Vect m Bits8 -> Vect n Bits8 -> List Span */
function Text_ILex_Char_UTF8_spans($0, $1) {
 switch($0.h) {
  case undefined: /* cons */ {
   switch($0.a2.h) {
    case 0: /* nil */ {
     switch($1.h) {
      case undefined: /* cons */ {
       switch($1.a2.h) {
        case 0: /* nil */ return {a1: {a1: $0, a2: $1}, a2: {h: 0}};
        default: return {a1: {a1: $0, a2: Text_ILex_Char_UTF8_encodeSP(127)}, a2: Text_ILex_Char_UTF8_spans(Text_ILex_Char_UTF8_encodeSP(128), $1)};
       }
      }
      default: return {a1: {a1: $0, a2: Text_ILex_Char_UTF8_encodeSP(127)}, a2: Text_ILex_Char_UTF8_spans(Text_ILex_Char_UTF8_encodeSP(128), $1)};
     }
    }
    case undefined: /* cons */ {
     switch($0.a2.a2.h) {
      case 0: /* nil */ {
       switch($1.h) {
        case undefined: /* cons */ {
         switch($1.a2.h) {
          case undefined: /* cons */ {
           switch($1.a2.a2.h) {
            case 0: /* nil */ return {a1: {a1: $0, a2: $1}, a2: {h: 0}};
            default: return {a1: {a1: $0, a2: Text_ILex_Char_UTF8_encodeSP(2047)}, a2: Text_ILex_Char_UTF8_spans(Text_ILex_Char_UTF8_encodeSP(2048), $1)};
           }
          }
          default: return {a1: {a1: $0, a2: Text_ILex_Char_UTF8_encodeSP(2047)}, a2: Text_ILex_Char_UTF8_spans(Text_ILex_Char_UTF8_encodeSP(2048), $1)};
         }
        }
        default: return {a1: {a1: $0, a2: Text_ILex_Char_UTF8_encodeSP(2047)}, a2: Text_ILex_Char_UTF8_spans(Text_ILex_Char_UTF8_encodeSP(2048), $1)};
       }
      }
      case undefined: /* cons */ {
       switch($0.a2.a2.a2.h) {
        case 0: /* nil */ {
         switch($1.h) {
          case undefined: /* cons */ {
           switch($1.a2.h) {
            case undefined: /* cons */ {
             switch($1.a2.a2.h) {
              case undefined: /* cons */ {
               switch($1.a2.a2.a2.h) {
                case 0: /* nil */ return {a1: {a1: $0, a2: $1}, a2: {h: 0}};
                default: return {a1: {a1: $0, a2: Text_ILex_Char_UTF8_encodeSP(65535)}, a2: Text_ILex_Char_UTF8_spans(Text_ILex_Char_UTF8_encodeSP(65536), $1)};
               }
              }
              default: return {a1: {a1: $0, a2: Text_ILex_Char_UTF8_encodeSP(65535)}, a2: Text_ILex_Char_UTF8_spans(Text_ILex_Char_UTF8_encodeSP(65536), $1)};
             }
            }
            default: return {a1: {a1: $0, a2: Text_ILex_Char_UTF8_encodeSP(65535)}, a2: Text_ILex_Char_UTF8_spans(Text_ILex_Char_UTF8_encodeSP(65536), $1)};
           }
          }
          default: return {a1: {a1: $0, a2: Text_ILex_Char_UTF8_encodeSP(65535)}, a2: Text_ILex_Char_UTF8_spans(Text_ILex_Char_UTF8_encodeSP(65536), $1)};
         }
        }
        case undefined: /* cons */ {
         switch($0.a2.a2.a2.a2.h) {
          case 0: /* nil */ {
           switch($1.h) {
            case undefined: /* cons */ {
             switch($1.a2.h) {
              case undefined: /* cons */ {
               switch($1.a2.a2.h) {
                case undefined: /* cons */ {
                 switch($1.a2.a2.a2.h) {
                  case undefined: /* cons */ {
                   switch($1.a2.a2.a2.a2.h) {
                    case 0: /* nil */ return {a1: {a1: $0, a2: $1}, a2: {h: 0}};
                    default: return _crashExp('Unhandled input for Text.ILex.Char.UTF8.spans at Text.ILex.Char.UTF8:56:1--56:41');
                   }
                  }
                  default: return _crashExp('Unhandled input for Text.ILex.Char.UTF8.spans at Text.ILex.Char.UTF8:56:1--56:41');
                 }
                }
                default: return _crashExp('Unhandled input for Text.ILex.Char.UTF8.spans at Text.ILex.Char.UTF8:56:1--56:41');
               }
              }
              default: return _crashExp('Unhandled input for Text.ILex.Char.UTF8.spans at Text.ILex.Char.UTF8:56:1--56:41');
             }
            }
            default: return _crashExp('Unhandled input for Text.ILex.Char.UTF8.spans at Text.ILex.Char.UTF8:56:1--56:41');
           }
          }
          default: return _crashExp('Unhandled input for Text.ILex.Char.UTF8.spans at Text.ILex.Char.UTF8:56:1--56:41');
         }
        }
        default: return _crashExp('Unhandled input for Text.ILex.Char.UTF8.spans at Text.ILex.Char.UTF8:56:1--56:41');
       }
      }
      default: return _crashExp('Unhandled input for Text.ILex.Char.UTF8.spans at Text.ILex.Char.UTF8:56:1--56:41');
     }
    }
    default: return _crashExp('Unhandled input for Text.ILex.Char.UTF8.spans at Text.ILex.Char.UTF8:56:1--56:41');
   }
  }
  default: return _crashExp('Unhandled input for Text.ILex.Char.UTF8.spans at Text.ILex.Char.UTF8:56:1--56:41');
 }
}

/* Text.ILex.Char.UTF8.go : Bits8 -> (n : Nat) -> Bits32 -> Vect n Bits8 */
function Text_ILex_Char_UTF8_go($0, $1, $2) {
 switch($1) {
  case 0n: return {h: 0};
  default: {
   const $4 = ($1-1n);
   return {a1: _add8u($0, _truncUInt8(_and32u(_shr32u($2, _mul32u(Number(_truncUBigInt32($4)), 6)), 63))), a2: Text_ILex_Char_UTF8_go(128, $4, $2)};
  }
 }
}

/* Text.ILex.Char.UTF8.fromSpan : Span -> RExp8 True */
function Text_ILex_Char_UTF8_fromSpan($0) {
 return Text_ILex_Char_UTF8_n__8584_18432_go($0.a2, $0.a1, $0.a1, $0.a2);
}

/* Text.ILex.Char.UTF8.fromRange : Range32 -> RExp8 True */
function Text_ILex_Char_UTF8_fromRange($0) {
 let $1;
 switch($0.h) {
  case 0: /* nil */ {
   $1 = 1;
   break;
  }
  default: $1 = 0;
 }
 switch($1) {
  case 1: return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_empty()};
  case 0: {
   const $5 = Text_ILex_Char_UTF8_spans(Text_ILex_Char_UTF8_encodeSP(Text_ILex_Char_Range_lowerBound(csegen_323(), $0)), Text_ILex_Char_UTF8_encodeSP(Text_ILex_Char_Range_upperBound(csegen_323(), $0)));
   switch($5.h) {
    case 0: /* nil */ return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_empty()};
    case undefined: /* cons */ return Prelude_Types_foldr_Foldable_List(x => y => Text_ILex_RExp_x3cx7cx3e(csegen_413(), csegen_421(), Text_ILex_Char_UTF8_fromSpan(x), y), Text_ILex_Char_UTF8_fromSpan($5.a1), $5.a2);
   }
  }
 }
}

/* Text.ILex.Char.UTF8.encodeSP : (n : Bits32) -> Vect (S (len (encode n))) Bits8 */
function Text_ILex_Char_UTF8_encodeSP($0) {
 return Text_ILex_Char_UTF8_encode($0);
}

/* Text.ILex.Char.UTF8.encode : Bits32 -> Codepoint */
function Text_ILex_Char_UTF8_encode($0) {
 switch(Prelude_EqOrd_x3c_Ord_Bits32($0, 128)) {
  case 1: return {a1: _truncUInt8($0), a2: {h: 0}};
  case 0: {
   switch(Prelude_EqOrd_x3c_Ord_Bits32($0, 2048)) {
    case 1: return Text_ILex_Char_UTF8_go(192, 2n, $0);
    case 0: {
     switch(Prelude_EqOrd_x3c_Ord_Bits32($0, 65536)) {
      case 1: return Text_ILex_Char_UTF8_go(224, 3n, $0);
      case 0: return Text_ILex_Char_UTF8_go(240, 4n, $0);
     }
    }
   }
  }
 }
}

/* Text.ILex.Char.UTF8.convert : List Range32 -> RExp8 True */
function Text_ILex_Char_UTF8_convert($0) {
 switch($0.h) {
  case 0: /* nil */ return {h: 1 /* Ch */, a1: Text_ILex_Char_Set_empty()};
  case undefined: /* cons */ return Prelude_Types_foldr_Foldable_List(r => y => Text_ILex_RExp_x3cx7cx3e(csegen_413(), csegen_421(), Text_ILex_Char_UTF8_fromRange(r), y), Text_ILex_Char_UTF8_fromRange($0.a1), $0.a2);
 }
}

/* Text.ILex.Char.UTF8.bytes : Bits8 -> Bits8 -> RExp8 True */
function Text_ILex_Char_UTF8_bytes($0, $1) {
 let $4;
 switch(Prelude_EqOrd_x3cx3d_Ord_Bits8($0, $1)) {
  case 1: {
   $4 = {a1: $0, a2: $1};
   break;
  }
  case 0: {
   $4 = {h: 0};
   break;
  }
 }
 const $2 = Text_ILex_Char_Set_range($4);
 return {h: 1 /* Ch */, a1: $2};
}

/* Text.ILex.Char.UTF8.anyBytes : Vect (S n) Bits8 -> RExp8 True */
function Text_ILex_Char_UTF8_anyBytes($0) {
 switch($0.a2.h) {
  case 0: /* nil */ return csegen_451();
  case undefined: /* cons */ return {h: 2 /* And */, a1: csegen_451(), a2: Text_ILex_Char_UTF8_anyBytes($0.a2)};
 }
}

/* Text.ILex.Char.UTF8.MinAddByte : Bits8 */
const Text_ILex_Char_UTF8_MinAddByte = __lazy(function () {
 return 128;
});

/* Text.ILex.Char.UTF8.MaxAddByte : Bits8 */
const Text_ILex_Char_UTF8_MaxAddByte = __lazy(function () {
 return 191;
});

/* Text.ParseError.case block in quote */
function Text_ParseError_case__quote_16142($0, $1) {
 switch($1.h) {
  case undefined: /* cons */ {
   switch($1.a2.h) {
    case 0: /* nil */ return Prelude_Types_foldMap_Foldable_List(csegen_453(), $8 => $8, {a1: '\'', a2: {a1: $1.a1, a2: {a1: '\'', a2: {h: 0}}}});
    default: return Prelude_Types_foldMap_Foldable_List(csegen_453(), $14 => $14, {a1: '\"', a2: {a1: Prelude_Types_foldMap_Foldable_List(csegen_453(), $1d => $1d, $1), a2: {a1: '\"', a2: {h: 0}}}});
   }
  }
  default: return Prelude_Types_foldMap_Foldable_List(csegen_453(), $26 => $26, {a1: '\"', a2: {a1: Prelude_Types_foldMap_Foldable_List(csegen_453(), $2f => $2f, $1), a2: {a1: '\"', a2: {h: 0}}}});
 }
}

/* Text.ParseError.8642:16236:go */
function Text_ParseError_n__8642_16236_go($0, $1, $2, $3) {
 switch($3.h) {
  case 0: /* nil */ return Prelude_Types_foldMap_Foldable_List(csegen_453(), $9 => $9, {a1: 'or ', a2: {a1: Text_ParseError_quote($2), a2: {h: 0}}});
  case undefined: /* cons */ return (Prelude_Types_foldMap_Foldable_List(csegen_453(), $16 => $16, {a1: Text_ParseError_quote($2), a2: {a1: ', ', a2: {h: 0}}})+Text_ParseError_n__8642_16236_go($0, $1, $3.a1, $3.a2));
 }
}

/* Text.ParseError.8533:16091:adj */
function Text_ParseError_n__8533_16091_adj($0, $1) {
 return Prelude_Types_fastPack(Prelude_Types_List_filterAppend({h: 0}, $7 => Prelude_EqOrd_x2fx3d_Eq_Char('\'', $7), $1));
}

/* Text.ParseError.interpolate */
function Text_ParseError_interpolate_Interpolation_DigitType($0) {
 switch($0) {
  case 0: return 'a binary digit (\'0\' or \'1\')';
  case 1: return 'an octal digit (\'0\' to \'7\')';
  case 2: return 'a decimal digit (\'0\' to \'9\')';
  case 3: return 'a hexadecimal digit (\'0\' to \'9\' or \'a\' to \'f\')';
 }
}

/* Text.ParseError.interpolate */
function Text_ParseError_interpolate_Interpolation_CharClass($0) {
 switch($0.h) {
  case 0: /* Space */ return 'a space character';
  case 1: /* Digit */ return Text_ParseError_interpolate_Interpolation_DigitType($0.a1);
  case 2: /* Upper */ return 'an upper-case letter';
  case 3: /* Lower */ return 'a lower-case letter';
  case 4: /* Alpha */ return 'a letter (\'a\' to \'z\' or \'A\' to \'Z\')';
  case 5: /* AlphaNum */ return 'a letter or a digit';
 }
}

/* Text.ParseError.interpolate */
function Text_ParseError_interpolate_Interpolation_x28InnerErrorx20x24ex29($0, $1) {
 switch($1.h) {
  case 1: /* EOI */ return 'Unexpected end of input';
  case 2: /* Expected */ {
   switch($1.a1.h) {
    case 0: /* nil */ return Prelude_Types_foldMap_Foldable_List(csegen_453(), $8 => $8, {a1: 'Unexpected ', a2: {a1: Text_ParseError_quote($1.a2), a2: {h: 0}}});
    case undefined: /* cons */ return Prelude_Types_foldMap_Foldable_List(csegen_453(), $14 => $14, {a1: 'Expected ', a2: {a1: Text_ParseError_quotes($1.a1.a1, $1.a1.a2), a2: {a1: ', but got ', a2: {a1: Text_ParseError_quote($1.a2), a2: {h: 0}}}}});
   }
  }
  case 3: /* ExpectedChar */ return Prelude_Types_foldMap_Foldable_List(csegen_453(), $27 => $27, {a1: 'Expected ', a2: {a1: Text_ParseError_interpolate_Interpolation_CharClass($1.a1), a2: {h: 0}}});
  case 4: /* ExpectedEOI */ return 'Expected end of input';
  case 5: /* InvalidControl */ return Prelude_Types_foldMap_Foldable_List(csegen_453(), $33 => $33, {a1: 'Invalid control character: \'', a2: {a1: Text_ParseError_uncontrol($1.a1), a2: {a1: '\'', a2: {h: 0}}}});
  case 6: /* InvalidEscape */ return 'Invalid escape sequence';
  case 7: /* OutOfBounds */ return Prelude_Types_foldMap_Foldable_List(csegen_453(), $41 => $41, {a1: 'Value out of bounds: ', a2: {a1: $1.a1, a2: {h: 0}}});
  case 8: /* Unclosed */ return Prelude_Types_foldMap_Foldable_List(csegen_453(), $4b => $4b, {a1: 'Unclosed ', a2: {a1: Text_ParseError_quote($1.a1), a2: {h: 0}}});
  case 9: /* Unknown */ return Prelude_Types_foldMap_Foldable_List(csegen_453(), $57 => $57, {a1: 'Unknown or invalid token: ', a2: {a1: $1.a1, a2: {h: 0}}});
  case 0: /* Custom */ return $0($1.a1);
  case 10: /* InvalidByte */ return Prelude_Types_foldMap_Foldable_List(csegen_453(), $63 => $63, {a1: 'Unexpected or invalid byte: 0x', a2: {a1: Text_ParseError_toHex($1.a1), a2: {h: 0}}});
 }
}

/* Text.ParseError.interpolate */
function Text_ParseError_interpolate_Interpolation_x28FCErrx20x24ex29($0, $1) {
 const $3 = {a1: $1.a1, a2: $1.a2};
 switch($1.a4.h) {
  case undefined: /* just */ return Data_String_fastUnlines({a1: Prelude_Types_foldMap_Foldable_List(csegen_453(), $e => $e, {a1: $0($1.a5), a2: {h: 0}}), a2: Text_FC_printFC($3, $1.a3, Data_String_lines($1.a4.a1))});
  case 0: /* nothing */ return Data_String_fastUnlines({a1: Prelude_Types_foldMap_Foldable_List(csegen_453(), $22 => $22, {a1: $0($1.a5), a2: {h: 0}}), a2: {a1: Text_FC_interpolate_Interpolation_FileContext($3), a2: {h: 0}}});
 }
}

/* Text.ParseError.uncontrol : Char -> String */
function Text_ParseError_uncontrol($0) {
 switch(Prelude_Types_isControl($0)) {
  case 1: return Text_ParseError_n__8533_16091_adj($0, Prelude_Types_fastUnpack(Prelude_Show_show_Show_Char($0)));
  case 0: return Data_String_singleton($0);
 }
}

/* Text.ParseError.toParseError : Origin -> String -> Bounded e -> FCErr e */
function Text_ParseError_toParseError($0, $1, $2) {
 return {a1: $0, a2: $2.a2, a3: $2.a2, a4: {a1: $1}, a5: $2.a1};
}

/* Text.ParseError.toHex : Bits8 -> String */
function Text_ParseError_toHex($0) {
 return Prelude_Types_fastPack({a1: Text_ParseError_hexChar(_shr8u($0, 4)), a2: {a1: Text_ParseError_hexChar(($0&15)), a2: {h: 0}}});
}

/* Text.ParseError.quotes : String -> List String -> String */
function Text_ParseError_quotes($0, $1) {
 switch($1.h) {
  case 0: /* nil */ return Text_ParseError_quote($0);
  case undefined: /* cons */ {
   switch($1.a2.h) {
    case 0: /* nil */ return Prelude_Types_foldMap_Foldable_List(csegen_453(), $a => $a, {a1: Text_ParseError_quote($0), a2: {a1: ' or ', a2: {a1: Text_ParseError_quote($1.a1), a2: {h: 0}}}});
    default: return Text_ParseError_n__8642_16236_go($1, $0, $0, $1);
   }
  }
  default: return Text_ParseError_n__8642_16236_go($1, $0, $0, $1);
 }
}

/* Text.ParseError.quote : String -> String */
function Text_ParseError_quote($0) {
 return Text_ParseError_case__quote_16142($0, Prelude_Types_List_mapAppend({h: 0}, $7 => Text_ParseError_uncontrol($7), Prelude_Types_fastUnpack($0)));
}

/* Text.ParseError.hexChar : Bits8 -> Char */
function Text_ParseError_hexChar($0) {
 switch($0) {
  case 0: return '0';
  case 1: return '1';
  case 2: return '2';
  case 3: return '3';
  case 4: return '4';
  case 5: return '5';
  case 6: return '6';
  case 7: return '7';
  case 8: return '8';
  case 9: return '9';
  case 10: return 'a';
  case 11: return 'b';
  case 12: return 'c';
  case 13: return 'd';
  case 14: return 'e';
  default: return 'f';
 }
}

/* Text.FC.interpolate */
function Text_FC_interpolate_Interpolation_Origin($0) {
 switch($0.h) {
  case undefined: /* just */ return $0.a1;
  case 0: /* nothing */ return 'virtual';
 }
}

/* Text.FC.interpolate */
function Text_FC_interpolate_Interpolation_FileContext($0) {
 switch($0.a2.h) {
  case 0: /* nil */ return Text_FC_interpolate_Interpolation_Origin($0.a1);
  default: return Prelude_Types_foldMap_Foldable_List(csegen_453(), $9 => $9, {a1: Text_FC_interpolate_Interpolation_Origin($0.a1), a2: {a1: ': ', a2: {a1: Text_Bounds_interpolate_Interpolation_Bounds($0.a2), a2: {h: 0}}}});
 }
}

/* Text.FC.range : Nat -> Nat -> List a -> List a */
function Text_FC_range($0, $1, $2) {
 return Data_List_take((Prelude_Types_prim__integerToNat(($1-$0))+1n), Data_List_drop($0, $2));
}

/* Text.FC.printFC : FileContext -> Bounds -> List String -> List String */
function Text_FC_printFC($0, $1, $2) {
 switch($0.h) {
  case undefined: /* cons */ {
   switch($0.a2.h) {
    case undefined: /* cons */ {
     switch($0.a2.a1.h) {
      case undefined: /* cons */ {
       switch($0.a2.a2.h) {
        case undefined: /* cons */ {
         switch($1.h) {
          case undefined: /* cons */ {
           switch($1.a1.h) {
            case undefined: /* cons */ {
             switch($1.a2.h) {
              case undefined: /* cons */ {
               const $a = Prelude_Types_String_length(Prelude_Show_show_Show_Nat(($0.a2.a2.a1+1n)));
               const $11 = Prelude_Types_foldMap_Foldable_List(csegen_453(), $16 => $16, {a1: Text_FC_interpolate_Interpolation_FileContext($0), a2: {h: 0}});
               switch((($1.a1.a1===$1.a2.a1)?1:0)) {
                case 0: return Prelude_Types_SnocList_x3cx3ex3e(Text_FC_lineNumbers({a1: {a1: {h: 0}, a2: ''}, a2: $11}, $a, $0.a2.a1.a1, Text_FC_range($1.a1.a1, Prelude_Types_min_Ord_Nat($1.a2.a1, ($1.a1.a1+5n)), $2)), {h: 0});
                case 1: {
                 const $34 = (Prelude_Types_prim__integerToNat(($1.a2.a2-$1.a1.a2))+1n);
                 const $3b = Data_String_indent((($a+$1.a1.a2)+4n), Data_String_replicate($34, '^'));
                 const $46 = Prelude_Types_prim__integerToNat(($1.a2.a1-4n));
                 const $4b = Prelude_Types_prim__integerToNat(($0.a2.a1.a1-Prelude_Types_prim__integerToNat(($1.a2.a1-$46))));
                 return Prelude_Types_SnocList_x3cx3ex3e(Text_FC_lineNumbers({a1: {a1: {h: 0}, a2: ''}, a2: $11}, $a, $4b, Text_FC_range($46, $1.a2.a1, $2)), {a1: $3b, a2: {h: 0}});
                }
               }
              }
              default: return {a1: Text_FC_interpolate_Interpolation_FileContext($0), a2: {h: 0}};
             }
            }
            default: return {a1: Text_FC_interpolate_Interpolation_FileContext($0), a2: {h: 0}};
           }
          }
          default: return {a1: Text_FC_interpolate_Interpolation_FileContext($0), a2: {h: 0}};
         }
        }
        default: return {a1: Text_FC_interpolate_Interpolation_FileContext($0), a2: {h: 0}};
       }
      }
      default: return {a1: Text_FC_interpolate_Interpolation_FileContext($0), a2: {h: 0}};
     }
    }
    default: return {a1: Text_FC_interpolate_Interpolation_FileContext($0), a2: {h: 0}};
   }
  }
  default: return {a1: Text_FC_interpolate_Interpolation_FileContext($0), a2: {h: 0}};
 }
}

/* Text.Bounds.case block in positionMapFrom */
function Text_Bounds_case__positionMapFrom_13202($0, $1, $2, $3) {
 const $4 = Text_Bounds_fillMap($1, $3, $0, 0n, $2, undefined);
 const $c = Text_Bounds_setLast($0, $3, undefined);
 return $3;
}

/* Text.Bounds.interpolate */
function Text_Bounds_interpolate_Interpolation_Position($0) {
 return (Prelude_Show_show_Show_Nat(($0.a1+1n))+(':'+Prelude_Show_show_Show_Nat(($0.a2+1n))));
}

/* Text.Bounds.interpolate */
function Text_Bounds_interpolate_Interpolation_Bounds($0) {
 switch($0.h) {
  case undefined: /* cons */ {
   switch(Text_Bounds_eqPosition($0.a1, $0.a2)) {
    case 1: return Prelude_Types_foldMap_Foldable_List(csegen_453(), $a => $a, {a1: Text_Bounds_interpolate_Interpolation_Position($0.a1), a2: {h: 0}});
    case 0: return Prelude_Types_foldMap_Foldable_List(csegen_453(), $14 => $14, {a1: Text_Bounds_interpolate_Interpolation_Position($0.a1), a2: {a1: '--', a2: {a1: Text_Bounds_interpolate_Interpolation_Position($0.a2), a2: {h: 0}}}});
   }
  }
  case 0: /* nil */ return '';
 }
}

/* Text.Bounds.setLast : MArray s (S n) Position -> F1' s */
function Text_Bounds_setLast($0, $1, $2) {
 switch($0) {
  case 0n: return undefined;
  default: {
   const $4 = ($0-1n);
   const $7 = Data_Array_Core_prim__arrayGet($1, $4);
   return Data_Array_Core_prim__arraySet($1, ($4+1n), {a1: $7.a1, a2: ($7.a2+1n)}, undefined);
  }
 }
}

/* Text.Bounds.positionMapFrom : Position -> ByteVect n -> IArray (S n) Position */
function Text_Bounds_positionMapFrom($0, $1, $2) {
 return Data_Linear_Token_run1($5 => t => Text_Bounds_case__positionMapFrom_13202($0, $2, $1, Data_Array_Core_prim__newArray(($0+1n), $1, t)));
}

/* Text.Bounds.eqPosition : Position -> Position -> Bool */
function Text_Bounds_eqPosition($0, $1) {
 switch((($0.a1===$1.a1)?1:0)) {
  case 1: return (($0.a2===$1.a2)?1:0);
  case 0: return 0;
 }
}

/* Text.ByteBounds.toParseError : Origin -> String -> BBErr e -> ParseError e */
function Text_ByteBounds_toParseError($0, $1, $2) {
 const $4 = Data_ByteString_fromString_FromString_ByteString($1);
 const $3 = {a1: ($4.a1+1n), a2: Text_Bounds_positionMapFrom($4.a1, {a1: 0n, a2: 0n}, $4.a2)};
 return Text_ParseError_toParseError($0, $1, Text_ByteBounds_toBounded($3, $2));
}

/* Text.ByteBounds.toBounds : PositionMap => ByteBounds -> Bounds */
function Text_ByteBounds_toBounds($0, $1) {
 switch($1.h) {
  case 0: /* nil */ return {h: 0};
  case undefined: /* cons */ {
   let $3;
   switch(Data_Array_Index_tryLT($0.a1, $1.a1)) {
    case 1: {
     $3 = {a1: Data_Array_Core_prim__arrayGet($0.a2, $1.a1)};
     break;
    }
    case 0: {
     $3 = {h: 0};
     break;
    }
   }
   switch($3.h) {
    case undefined: /* just */ {
     let $e;
     switch(Data_Array_Index_tryLT($0.a1, $1.a2)) {
      case 1: {
       $e = {a1: Data_Array_Core_prim__arrayGet($0.a2, $1.a2)};
       break;
      }
      case 0: {
       $e = {h: 0};
       break;
      }
     }
     switch($e.h) {
      case undefined: /* just */ return {a1: $3.a1, a2: $e.a1};
      default: return {h: 0};
     }
    }
    default: return {h: 0};
   }
  }
 }
}

/* Text.ByteBounds.toBounded : PositionMap => ByteBounded a -> Bounded a */
function Text_ByteBounds_toBounded($0, $1) {
 return {a1: $1.a1, a2: Text_ByteBounds_toBounds($0, $1.a2)};
}

/* Text.ByteBounds.incLen : Nat -> BytePos -> BytePos */
function Text_ByteBounds_incLen($0, $1) {
 switch($0) {
  case 0n: return $1;
  default: {
   const $3 = ($0-1n);
   return ($3+$1);
  }
 }
}

/* Text.ByteBounds.endPos : Nat -> Nat -> BytePos */
function Text_ByteBounds_endPos($0, $1) {
 switch((($0<$1)?1:0)) {
  case 0: return $1;
  default: return Data_Nat_pred($1);
 }
}

/* Text.ILex.Stack.init : {auto 0 _ : 0 < r} -> a -> (n : Nat) -> IBuffer n -> F1 q (Stack e a r q) */
function Text_ILex_Stack_init($0, $1, $2, $3) {
 const $4 = ({value:0n});
 const $8 = ({value:0n});
 const $c = ({value:{h: 0}});
 const $10 = ({value:$0});
 const $14 = ({value:0});
 const $18 = ({value:{h: 0}});
 const $1c = ({value:{h: 0}});
 return {a1: $1, a2: {a1: 0n, a2: Data_ByteVect_empty()}, a3: $2, a4: 0n, a5: 0n, a6: $4, a7: $8, a8: $c, a9: $10, a10: $14, a11: $18, a12: $1c};
}

/* Text.ILex.Interfaces.case block in case block in bounds */
function Text_ILex_Interfaces_case__casex20blockx20inx20bounds_17943($0, $1, $2, $3) {
 const $4 = $0.a6(undefined)($1);
 const $a = ($4+$3);
 switch($2) {
  case 0n: {
   const $e = $0.a5(undefined)($1);
   return {a1: $e, a2: Text_ByteBounds_endPos($e, $a)};
  }
  default: {
   const $19 = ($4+$2);
   return {a1: $19, a2: Text_ByteBounds_endPos($19, $a)};
  }
 }
}

/* Text.ILex.Interfaces.unexpectedErr : HasBBErr s e => s q => HasBytes s => List String -> F1 q (InnerError e) */
function Text_ILex_Interfaces_unexpectedErr($0, $1, $2, $3, $4) {
 const $6 = ($2.a7(undefined)($1).value);
 const $f = ($2.a8(undefined)($1).value);
 let $5;
 switch($6) {
  case 0n: {
   $5 = Data_ByteString_append($2.a3(undefined)($1), {a1: Prelude_Types_prim__integerToNat(($f-$6)), a2: {a1: $2.a4(undefined)($1), a2: $6}});
   break;
  }
  default: $5 = {a1: Prelude_Types_prim__integerToNat(($f-$6)), a2: {a1: $2.a4(undefined)($1), a2: $6}};
 }
 switch($5.h) {
  case undefined: /* cons */ {
   switch($5.a1) {
    case 0n: return {h: 1 /* EOI */};
    default: {
     const $3d = ($5.a1-1n);
     switch($3d) {
      case 0n: {
       const $41 = Data_Buffer_Core_prim__getByteOffset($5.a2.a1, 0n, $5.a2.a2);
       const $47 = Data_String_singleton(_truncToChar($41));
       switch(Prelude_EqOrd_x3c_Ord_Bits8($41, 128)) {
        case 1: return {h: 2 /* Expected */, a1: $3, a2: $47};
        case 0: return {h: 10 /* InvalidByte */, a1: $41};
       }
      }
      default: return {h: 2 /* Expected */, a1: $3, a2: Data_ByteString_toString($5)};
     }
    }
   }
  }
  default: return {h: 2 /* Expected */, a1: $3, a2: Data_ByteString_toString($5)};
 }
}

/* Text.ILex.Interfaces.unclosedIfNLorEOIErr : HasBBErr s e => s q => HasBytes s => String -> List String -> F1 q (BBErr e) */
function Text_ILex_Interfaces_unclosedIfNLorEOIErr($0, $1, $2, $3, $4, $5) {
 const $7 = ($2.a7(undefined)($1).value);
 const $10 = ($2.a8(undefined)($1).value);
 let $6;
 switch($7) {
  case 0n: {
   $6 = Data_ByteString_append($2.a3(undefined)($1), {a1: Prelude_Types_prim__integerToNat(($10-$7)), a2: {a1: $2.a4(undefined)($1), a2: $7}});
   break;
  }
  default: $6 = {a1: Prelude_Types_prim__integerToNat(($10-$7)), a2: {a1: $2.a4(undefined)($1), a2: $7}};
 }
 switch($6.h) {
  case undefined: /* cons */ {
   switch($6.a1) {
    case 0n: return Text_ILex_Interfaces_unclosedErr($0, $1, $2, $3, undefined);
    default: {
     switch(Data_ByteVect_any($6.a1, csegen_455(), $6.a2)) {
      case 1: return Text_ILex_Interfaces_unclosedErr($0, $1, $2, $3, undefined);
      case 0: {
       const $52 = ($2.a7(undefined)($1).value);
       const $51 = Text_ILex_Interfaces_case__casex20blockx20inx20bounds_17943($2, $1, $52, ($2.a8(undefined)($1).value));
       const $68 = Text_ILex_Interfaces_unexpectedErr($0, $1, $2, $4, undefined);
       return {a1: $68, a2: $51};
      }
     }
    }
   }
  }
  default: {
   switch(Data_ByteVect_any($6.a1, csegen_455(), $6.a2)) {
    case 1: return Text_ILex_Interfaces_unclosedErr($0, $1, $2, $3, undefined);
    case 0: {
     const $7f = ($2.a7(undefined)($1).value);
     const $7e = Text_ILex_Interfaces_case__casex20blockx20inx20bounds_17943($2, $1, $7f, ($2.a8(undefined)($1).value));
     const $95 = Text_ILex_Interfaces_unexpectedErr($0, $1, $2, $4, undefined);
     return {a1: $95, a2: $7e};
    }
   }
  }
 }
}

/* Text.ILex.Interfaces.unclosedIfEOIErr : HasBBErr s e => s q => HasBytes s => String -> List String -> F1 q (BBErr e) */
function Text_ILex_Interfaces_unclosedIfEOIErr($0, $1, $2, $3, $4, $5) {
 const $7 = ($2.a7(undefined)($1).value);
 const $10 = ($2.a8(undefined)($1).value);
 let $6;
 switch($7) {
  case 0n: {
   $6 = Data_ByteString_append($2.a3(undefined)($1), {a1: Prelude_Types_prim__integerToNat(($10-$7)), a2: {a1: $2.a4(undefined)($1), a2: $7}});
   break;
  }
  default: $6 = {a1: Prelude_Types_prim__integerToNat(($10-$7)), a2: {a1: $2.a4(undefined)($1), a2: $7}};
 }
 switch($6.h) {
  case undefined: /* cons */ {
   switch($6.a1) {
    case 0n: return Text_ILex_Interfaces_unclosedErr($0, $1, $2, $3, undefined);
    default: {
     const $45 = ($2.a7(undefined)($1).value);
     const $44 = Text_ILex_Interfaces_case__casex20blockx20inx20bounds_17943($2, $1, $45, ($2.a8(undefined)($1).value));
     const $5b = Text_ILex_Interfaces_unexpectedErr($0, $1, $2, $4, undefined);
     return {a1: $5b, a2: $44};
    }
   }
  }
  default: {
   const $65 = ($2.a7(undefined)($1).value);
   const $64 = Text_ILex_Interfaces_case__casex20blockx20inx20bounds_17943($2, $1, $65, ($2.a8(undefined)($1).value));
   const $7b = Text_ILex_Interfaces_unexpectedErr($0, $1, $2, $4, undefined);
   return {a1: $7b, a2: $64};
  }
 }
}

/* Text.ILex.Interfaces.unclosedErr : HasBBErr s e => s q => HasBytes s => String -> F1 q (BBErr e) */
function Text_ILex_Interfaces_unclosedErr($0, $1, $2, $3, $4) {
 const $5 = Text_ILex_Interfaces_popAndGetBounds($1, $2, Prelude_Types_String_length($3), $4);
 return {a1: {h: 8 /* Unclosed */, a1: $3}, a2: $5};
}

/* Text.ILex.Interfaces.popAndGetBounds : s q => HasBytes s => Nat -> F1 q ByteBounds */
function Text_ILex_Interfaces_popAndGetBounds($0, $1, $2, $3) {
 const $4 = ($1.a9(undefined)($0).value);
 switch($4.h) {
  case undefined: /* cons */ {
   const $e = ($1.a9(undefined)($0).value=$4.a1);
   return {a1: $4.a2, a2: Text_ByteBounds_incLen($2, $4.a2)};
  }
  case 0: /* nil */ return {h: 0};
 }
}

/* Text.ILex.Interfaces.jsonSpace : RExp True */
const Text_ILex_Interfaces_jsonSpace = __lazy(function () {
 return Text_ILex_RExp_oneof(csegen_323(), csegen_328(), {a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32(' '.codePointAt(0)))}, a2: {a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('\u{9}'.codePointAt(0)))}, a2: {a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('\n'.codePointAt(0)))}, a2: {a1: {h: 1 /* Ch */, a1: Text_ILex_Char_Set_singleton(_truncUInt32('\r'.codePointAt(0)))}, a2: {h: 0}}}}});
});

/* Text.ILex.Runner.case block in run */
function Text_ILex_Runner_case__run_25448($0, $1, $2, $3) {
 const $4 = Text_ILex_Runner_stepState($0, $1, $2(undefined), $3, undefined);
 switch($4.h) {
  case 1: /* Right */ return Text_ILex_Runner_lastStep($2(undefined), $4.a1, undefined);
  case 0: /* Left */ return {h: 0 /* Left */, a1: $4.a1};
 }
}

/* Text.ILex.Runner.case block in case block in case block in case block in case block in stepState */
function Text_ILex_Runner_case__casex20blockx20inx20casex20blockx20inx20casex20blockx20inx20casex20blockx20inx20stepState_24463($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $a, $b, $c, $d, $e, $f) {
 switch($f.h) {
  case 0: /* Keep */ {
   switch($2.h) {
    case 0: /* Run */ return Text_ILex_Runner_succ($1, $d, $7, $a, $b, $6, $4, $3, $2.a1, $0, 1n, $c);
    case 1: /* Ign */ return Text_ILex_Runner_igno($1, $d, $7, $a, $b, $6, $4, $3, $0, 1n, $c);
    case 2: /* Err */ return Text_ILex_Runner_step($1, $d, $7, $a, $b, $6, $4, $3, $0, 1n, $c);
   }
  }
  case 1: /* Done */ {
   const $38 = ($b.value=1n);
   const $37 = $f.a1({a1: $d, a2: undefined});
   return Text_ILex_Runner_loop($1, $d, $7, $a, $b, $37, $0, 1n, undefined);
  }
  case 2: /* Ignore */ return Text_ILex_Runner_loop($1, $d, $7, $a, $b, $6, $0, 1n, $c);
  case 3: /* Move */ return Text_ILex_Runner_succ($1, $d, $7, $a, $b, $6, $4, Data_Array_Core_prim__arrayGet($4, $f.a1), $f.a2, $0, 1n, $c);
  case 4: /* MoveI */ return Text_ILex_Runner_igno($1, $d, $7, $a, $b, $6, $4, Data_Array_Core_prim__arrayGet($4, $f.a1), $0, 1n, $c);
  case 5: /* MoveE */ return Text_ILex_Runner_step($1, $d, $7, $a, $b, $6, $4, Data_Array_Core_prim__arrayGet($4, $f.a1), $0, 1n, $c);
  case 6: /* Bottom */ {
   switch($2.h) {
    case 0: /* Run */ {
     const $85 = ($b.value=0n);
     const $84 = $2.a1({a1: $d, a2: undefined});
     const $8e = $1.a8.a1(undefined)(($0+1n))(($9+$8.a1))({a1: 0n, a2: Data_ByteVect_empty()})($7)($a)($b)($d);
     return Text_ILex_Runner_loop($1, $8e, $7, $a, $b, $84, ($0+1n), 0n, undefined);
    }
    case 1: /* Ign */ {
     const $b5 = $1.a8.a1(undefined)(($0+1n))(($9+$8.a1))({a1: 0n, a2: Data_ByteVect_empty()})($7)($a)($b)($d);
     return Text_ILex_Runner_loop($1, $b5, $7, $a, $b, $6, ($0+1n), 0n, $c);
    }
    case 2: /* Err */ {
     const $dc = ($b.value=1n);
     return Text_ILex_Parser_arrFail($1.a6, $6, $d, undefined);
    }
   }
  }
 }
}

/* Text.ILex.Runner.case block in case block in case block in case block in stepState */
function Text_ILex_Runner_case__casex20blockx20inx20casex20blockx20inx20casex20blockx20inx20stepState_24397($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $a, $b) {
 const $c = $1.a8.a1(undefined)(($0+1n))($9)($8)($7)($a)($b)($5);
 const $21 = Data_Buffer_Core_prim__getByte($7, 0n);
 return Text_ILex_Runner_case__casex20blockx20inx20casex20blockx20inx20casex20blockx20inx20casex20blockx20inx20stepState_24463($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $a, $b, undefined, $c, $21, Data_Array_Core_prim__arrayGet($3, BigInt($21)));
}

/* Text.ILex.Runner.case block in case block in case block in loop */
function Text_ILex_Runner_case__casex20blockx20inx20casex20blockx20inx20loop_22196($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $a) {
 return {h: 1 /* Right */, a1: {a1: $6, a2: $1, a3: $a.a2, a4: Data_Array_Core_prim__arrayGet($a.a2, 0n), a5: {h: 2 /* Err */}}};
}

/* Text.ILex.Runner.case block in case block in init */
function Text_ILex_Runner_case__casex20blockx20inx20init_21491($0, $1, $2, $3, $4, $5) {
 return {a1: $0.a2, a2: $3, a3: $5.a2, a4: Data_Array_Core_prim__arrayGet($5.a2, 0n), a5: {h: 2 /* Err */}};
}

/* Text.ILex.Runner.stepState : IBuffer n -> (p : P1 q e a) -> LexState p -> LoopRes p */
function Text_ILex_Runner_stepState($0, $1, $2, $3, $4) {
 switch($0) {
  case 0n: return {h: 1 /* Right */, a1: $3};
  default: {
   const $7 = ($0-1n);
   const $c = ($2.a8.a7(undefined)($3.a2).value);
   const $16 = ($2.a8.a8(undefined)($3.a2).value);
   let $b;
   switch($c) {
    case 0n: {
     $b = Data_ByteString_append($2.a8.a3(undefined)($3.a2), {a1: Prelude_Types_prim__integerToNat(($16-$c)), a2: {a1: $2.a8.a4(undefined)($3.a2), a2: $c}});
     break;
    }
    default: $b = {a1: Prelude_Types_prim__integerToNat(($16-$c)), a2: {a1: $2.a8.a4(undefined)($3.a2), a2: $c}};
   }
   const $47 = ($2.a8.a7(undefined)($3.a2).value);
   let $46;
   switch($47) {
    case 0n: {
     $46 = $2.a8.a5(undefined)($3.a2);
     break;
    }
    default: $46 = ($2.a8.a6(undefined)($3.a2)+$47);
   }
   const $60 = ({value:0n});
   return Text_ILex_Runner_case__casex20blockx20inx20casex20blockx20inx20casex20blockx20inx20stepState_24397($7, $2, $3.a5, $3.a4, $3.a3, $3.a2, $3.a1, $1, $b, $46, $60, ({value:0n}));
  }
 }
}

/* Text.ILex.Runner.run : Parser1 e a -> IBuffer n -> Either e a */
function Text_ILex_Runner_run($0, $1, $2) {
 return Data_Linear_Token_run1($5 => t => Text_ILex_Runner_case__run_25448($0, $2, $1, Text_ILex_Runner_init($0, $2, $1(undefined), t)));
}

/* Text.ILex.Runner.lastStep : (p : P1 q e a) -> LexState p -> F1 q (Either e a) */
function Text_ILex_Runner_lastStep($0, $1, $2) {
 switch($1.a5.h) {
  case 2: /* Err */ {
   const $6 = ($0.a8.a7(undefined)($1.a2).value);
   const $10 = ($0.a8.a8(undefined)($1.a2).value);
   let $5;
   switch($6) {
    case 0n: {
     $5 = Data_ByteString_append($0.a8.a3(undefined)($1.a2), {a1: Prelude_Types_prim__integerToNat(($10-$6)), a2: {a1: $0.a8.a4(undefined)($1.a2), a2: $6}});
     break;
    }
    default: $5 = {a1: Prelude_Types_prim__integerToNat(($10-$6)), a2: {a1: $0.a8.a4(undefined)($1.a2), a2: $6}};
   }
   switch($5.h) {
    case undefined: /* cons */ {
     switch($5.a1) {
      case 0n: return $0.a7($1.a1)($1.a2)(undefined);
      default: return Text_ILex_Parser_arrFail($0.a6, $1.a1, $1.a2, undefined);
     }
    }
    default: return Text_ILex_Parser_arrFail($0.a6, $1.a1, $1.a2, undefined);
   }
  }
  case 0: /* Run */ {
   const $55 = $1.a5.a1({a1: $1.a2, a2: $2});
   const $5b = ($0.a8.a7(undefined)($1.a2).value=$0.a8.a2(undefined)($1.a2));
   const $5a = ($0.a8.a8(undefined)($1.a2).value=$0.a8.a2(undefined)($1.a2));
   return $0.a7($55)($1.a2)(undefined);
  }
  case 1: /* Ign */ {
   const $84 = ($0.a8.a7(undefined)($1.a2).value=$0.a8.a2(undefined)($1.a2));
   const $83 = ($0.a8.a8(undefined)($1.a2).value=$0.a8.a2(undefined)($1.a2));
   return $0.a7($1.a1)($1.a2)(undefined);
  }
 }
}

/* Text.ILex.Runner.init : (n : Nat) -> IBuffer n -> (p : P1 q e a) -> F1 q (LexState p) */
function Text_ILex_Runner_init($0, $1, $2, $3) {
 const $4 = $2.a3($0)($1)($3);
 return Text_ILex_Runner_case__casex20blockx20inx20init_21491($2, $0, $1, $4, undefined, Text_ILex_Parser_prim__machineGet($2.a4, $2.a2));
}

/* JSON.FromJSON.case block in decodeVia */
function JSON_FromJSON_case__decodeVia_7563($0, $1, $2, $3) {
 switch($3.h) {
  case 1: /* Right */ {
   const $5 = $1(undefined)(undefined)($0)($3.a1);
   switch($5.h) {
    case 1: /* Right */ return {h: 1 /* Right */, a1: $5.a1};
    case 0: /* Left */ return {h: 0 /* Left */, a1: {h: 0 /* JErr */, a1: $5.a1}};
   }
  }
  case 0: /* Left */ return {h: 0 /* Left */, a1: {h: 1 /* JParseErr */, a1: $3.a1}};
 }
}

/* JSON.FromJSON.16874:10708:readElements */
function JSON_FromJSON_n__16874_10708_readElements($0, $1, $2, $3) {
 switch($3.h) {
  case 0: /* nil */ return {h: 1 /* Right */, a1: {h: 0}};
  case undefined: /* cons */ {
   const $8 = $0(undefined)(undefined)($1)($3.a1);
   let $7;
   switch($8.h) {
    case 0: /* Left */ {
     $7 = {h: 0 /* Left */, a1: {a1: {a1: {h: 1 /* Index */, a1: $2}, a2: $8.a1.a1}, a2: $8.a1.a2}};
     break;
    }
    case 1: /* Right */ {
     $7 = {h: 1 /* Right */, a1: $8.a1};
     break;
    }
   }
   return Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29($7, decoded => Prelude_Types_x3ex3ex3d_Monad_x28Eitherx20x24ex29(JSON_FromJSON_n__16874_10708_readElements($0, $1, ($2+1n), $3.a2), remaining => ({h: 1 /* Right */, a1: {a1: decoded, a2: remaining}})));
  }
 }
}

/* JSON.FromJSON.13397:7284:isIdentifierKey */
function JSON_FromJSON_n__13397_7284_isIdentifierKey($0, $1) {
 switch($1.h) {
  case 0: /* nil */ return 0;
  case undefined: /* cons */ {
   switch(Prelude_Types_isAlpha($1.a1)) {
    case 1: return Prelude_Types_foldMap_Foldable_List({a1: $9 => $a => Prelude_Interfaces_Bool_Semigroup_x3cx2bx3e_Semigroup_AllBool($9, $a), a2: 1}, $10 => Prelude_Types_isAlphaNum($10), $1.a2);
    case 0: return 0;
   }
  }
 }
}

/* JSON.FromJSON.13397:7283:formatKey */
function JSON_FromJSON_n__13397_7283_formatKey($0, $1) {
 const $2 = Prelude_Types_fastUnpack($1);
 switch(JSON_FromJSON_n__13397_7284_isIdentifierKey($0, $2)) {
  case 1: return Prelude_Types_fastPack({a1: '.', a2: $2});
  case 0: return ('[\''+(JSON_FromJSON_n__13397_7281_escapeKey($0, $2)+'\']'));
 }
}

/* JSON.FromJSON.13397:7281:escapeKey */
function JSON_FromJSON_n__13397_7281_escapeKey($0, $1) {
 return Prelude_Types_fastConcat(Prelude_Types_List_mapAppend({h: 0}, $7 => JSON_FromJSON_n__13397_7280_escapeChar($0, $7), $1));
}

/* JSON.FromJSON.13397:7280:escapeChar */
function JSON_FromJSON_n__13397_7280_escapeChar($0, $1) {
 switch($1) {
  case '\'': return '\u{5c}\'';
  case '\u{5c}': return '\u{5c}\u{5c}';
  default: return Data_String_singleton($1);
 }
}

/* JSON.FromJSON.interpolate */
function JSON_FromJSON_interpolate_Interpolation_DecodingErr($0) {
 switch($0.h) {
  case 0: /* JErr */ return JSON_FromJSON_formatError($0.a1.a1, $0.a1.a2);
  case 1: /* JParseErr */ return Text_ParseError_interpolate_Interpolation_x28FCErrx20x24ex29($8 => Text_ParseError_interpolate_Interpolation_x28InnerErrorx20x24ex29($b => JSON_Object_interpolate_Interpolation_ObjectError($b), $8), $0.a1);
 }
}

/* JSON.FromJSON.fromJSON */
function JSON_FromJSON_fromJSON_FromJSON_String($0, $1) {
 return JSON_FromJSON_withValue($0, 'String', $0.a9, () => 'String', $9 => ({h: 1 /* Right */, a1: $9}), $1);
}

/* JSON.FromJSON.fromJSON */
function JSON_FromJSON_fromJSON_FromJSON_x28Listx20x24ax29($0, $1, $2) {
 return JSON_FromJSON_withValue($1, 'Array', $1.a5, () => 'List', $a => JSON_FromJSON_n__16874_10708_readElements($0, $1, 0n, $a), $2);
}

/* JSON.FromJSON.withValue : Value v obj =>
String -> (v -> Maybe t) -> Lazy String -> Parser t a -> Parser v a */
function JSON_FromJSON_withValue($0, $1, $2, $3, $4, $5) {
 const $6 = $2($5);
 switch($6.h) {
  case undefined: /* just */ return $4($6.a1);
  case 0: /* nothing */ {
   const $b = JSON_FromJSON_typeMismatch($0, $1, $5);
   switch($b.h) {
    case 0: /* Left */ return {h: 0 /* Left */, a1: {a1: $b.a1.a1, a2: (Prelude_Types_foldMap_Foldable_List(csegen_453(), $19 => $19, {a1: 'parsing ', a2: {a1: $3(), a2: {a1: ' failed, ', a2: {h: 0}}}})+$b.a1.a2)}};
    case 1: /* Right */ return {h: 1 /* Right */, a1: $b.a1};
   }
  }
 }
}

/* JSON.FromJSON.typeMismatch : Value v obj => String -> Parser v a */
function JSON_FromJSON_typeMismatch($0, $1, $2) {
 return {h: 0 /* Left */, a1: {a1: {h: 0}, a2: Prelude_Types_foldMap_Foldable_List(csegen_453(), $a => $a, {a1: 'expected ', a2: {a1: $1, a2: {a1: ', but encountered ', a2: {a1: $0.a2($2), a2: {h: 0}}}}})}};
}

/* JSON.FromJSON.formatRelativePath : JSONPath -> String */
function JSON_FromJSON_formatRelativePath($0) {
 return JSON_FromJSON_n__13397_7282_format($0, '', $0);
}

/* JSON.FromJSON.formatPath : JSONPath -> String */
function JSON_FromJSON_formatPath($0) {
 return ('$'+JSON_FromJSON_formatRelativePath($0));
}

/* JSON.FromJSON.formatError : JSONPath -> String -> String */
function JSON_FromJSON_formatError($0, $1) {
 return ('Error in '+(JSON_FromJSON_formatPath($0)+(': '+$1)));
}

/* JSON.FromJSON.explicitParseField : Object obj v => Value v obj => Parser v a -> obj -> Parser String a */
function JSON_FromJSON_explicitParseField($0, $1, $2, $3, $4) {
 const $6 = $0.a1($4)($3);
 switch($6.h) {
  case 0: /* nothing */ return {h: 0 /* Left */, a1: {a1: {h: 0}, a2: Prelude_Types_foldMap_Foldable_List(csegen_453(), $12 => $12, {a1: 'key ', a2: {a1: Prelude_Show_show_Show_String($4), a2: {a1: ' not found', a2: {h: 0}}}})}};
  case undefined: /* just */ {
   const $1c = $2($6.a1);
   switch($1c.h) {
    case 0: /* Left */ return {h: 0 /* Left */, a1: {a1: {a1: {h: 0 /* Key */, a1: $4}, a2: $1c.a1.a1}, a2: $1c.a1.a2}};
    case 1: /* Right */ return {h: 1 /* Right */, a1: $1c.a1};
   }
  }
 }
}


try{__mainExpression_0()}catch(e){if(e instanceof IdrisError){console.log('ERROR: ' + e.message)}else{throw e} }
