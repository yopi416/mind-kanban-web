/* ノードの移動・追加に合わせて、nodesやedgesの順番を変更する際に使用 */

export function insertBefore<T>(
  array: T[],
  insertedElement: T[],
  index: number
): T[] {
  return [...array.slice(0, index), ...insertedElement, ...array.slice(index)]
}

export function insertAfter<T>(
  array: T[],
  insertedElement: T[],
  index: number
): T[] {
  return [
    ...array.slice(0, index + 1),
    ...insertedElement,
    ...array.slice(index + 1),
  ]
}
