const toString: Function = Object.prototype.toString
const OBJECT_STRING: string = '[object Object]'
export function isPlainObject(obj: any): boolean {
  return toString.call(obj) === OBJECT_STRING
}
