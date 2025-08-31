import type { Node, Edge } from '@xyflow/react'
import type { NodeData, Project, Projects } from '../../../types'

// Project全体からcurrentPjのデータのみを取得
export function getCurrentPj(pjs: Projects, currentPjId: string): Project {
  const currentPj = pjs[currentPjId]

  // 存在しないcurrentPjIdが入力されることはないので、エラーを投げる
  if (!currentPj) {
    throw new Error(`Project not found: ${currentPjId}`)
  }

  return currentPj
}

export function updateGraphInPj(
  pj: Project,
  newNodes: Node<NodeData>[],
  newEdges: Edge[]
): Project {
  return {
    ...pj,
    nodes: newNodes,
    edges: newEdges,
    updatedAt: new Date().toISOString(),
  }
}

export function updatePjInPjs(
  pjs: Projects,
  currenPjId: string,
  newPj: Project
): Projects {
  return { ...pjs, [currenPjId]: newPj }
}
