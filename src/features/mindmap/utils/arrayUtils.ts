export function insertAfter<T>(
  array: T[],
  insertedElement: T,
  index: number
): T[] {
  return [
    ...array.slice(0, index + 1),
    insertedElement,
    ...array.slice(index + 1),
  ]
}
