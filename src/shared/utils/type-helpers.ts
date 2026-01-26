/*
 * Exhaustiveness check helper
 */
export function assertUnreachable(value: never): never {
  throw new Error(`Unreachable case: ${JSON.stringify(value)}`);
}
