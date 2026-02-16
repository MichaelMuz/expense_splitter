/*
 * Exhaustiveness check helper
 */
export function assertUnreachable(value: never): never {
  throw new Error(`Unreachable case: ${JSON.stringify(value)}`);
}

/*
 * Explicit tuple constructor
 */
export function tuple<T extends unknown[]>(...args: T) {
  return args;
}

export function assert(value: boolean, msg: string): asserts value {
  if (!value) throw Error(msg)
}
