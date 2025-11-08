import type {
  KanbanIndex,
  KanbanIndexJSON,
  MinkanData,
  MinkanPutRequest,
  MinkanPutResponse,
} from '@/types'
import type {} from '@/types'
import { getCookie } from './cookieUtils'
import { useWholeStore } from '@/state/store'
import { MINKAN_ENDPOINT } from '@/constants/api'
import { toast } from 'sonner'

// /////////////
// kanbanIndexをFE-BE側で扱える形に相互変換
// - kanbanIndexはFEでは、setを使用しているが、JSON形式時にsetが表現できない
// /////////////

// FE ⇒ BE
// Map<string, Set<string>> ⇒  Record<string, string[]>に変換
export function serializeKanbanIndex(
  kanbanIndex: KanbanIndex
): KanbanIndexJSON {
  const result: KanbanIndexJSON = {}

  // 各キーに対して、Setをstring[]に変換し保存
  for (const [pjId, nodeIdSet] of kanbanIndex) {
    const arr = Array.from(nodeIdSet)
    result[pjId] = arr
  }

  return result
}

// BE ⇒ FE
// Record<string, string[]> ⇒ Map<string, Set<string>>に変換
export function deserializeKanbanIndex(
  kanbanIndexJson: KanbanIndexJSON
): KanbanIndex {
  const result: KanbanIndex = new Map()

  for (const [pjId, nodeIdArr] of Object.entries(kanbanIndexJson)) {
    const set = new Set(nodeIdArr)
    result.set(pjId, set)
  }

  return result
}

// /////////////
// BEから受信したMinkanDataのバリデーション
// /////////////

export function validateMinkanData(data: unknown): data is MinkanData {
  if (!data || typeof data !== 'object') return false

  const obj = data as Record<string, unknown>

  if (typeof obj.currentPjId !== 'string') return false
  if (!obj.projects || typeof obj.projects !== 'object') return false
  if (!obj.kanbanColumns || typeof obj.kanbanColumns !== 'object') return false
  if (!obj.kanbanIndex || typeof obj.kanbanIndex !== 'object') return false

  return true
}

// /////////////
// MinkanデータをBEに保存
// /////////////

export async function saveMinkanData() {
  try {
    // csrfTokenの取得
    const csrfToken = getCookie('csrf_token')
    if (!csrfToken) {
      throw new Error('csrf_token not found')
    }

    // reqボディのデータをstoreから取得
    const {
      projects,
      currentPjId,
      kanbanIndex,
      kanbanColumns,
      lockVersion,
      setLockVersion, // reqBodyには含まれない
    } = useWholeStore.getState()

    // reqボディのオブジェクト作成
    const minkanData: MinkanData = {
      projects: structuredClone(projects), //ネストが深いので一応deepCopy
      currentPjId,
      kanbanIndex: serializeKanbanIndex(kanbanIndex),
      kanbanColumns: structuredClone(kanbanColumns),
    }

    const reqBodyObj: MinkanPutRequest = {
      minkan: minkanData,
      version: lockVersion,
    }

    // /minkanエンドポイントにPUT
    const resMinkan = await fetch(`${MINKAN_ENDPOINT}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify(reqBodyObj),
    })

    if (resMinkan.status === 409) {
      toast.error('他の環境(端末・ブラウザなど)で内容が更新されています', {
        description: 'ブラウザを更新して、最新の状態を読み込み直してください。',
        duration: 3000,
      })

      const errorBody = await resMinkan.text()
      throw new Error(`failed to save data: ${resMinkan.status}, ${errorBody}`)
    }

    if (resMinkan.status !== 200) {
      toast.error('保存に失敗しました', {
        description: '',
        duration: 2300,
      })
      const errorBody = await resMinkan.text()
      throw new Error(`failed to save data: ${resMinkan.status}, ${errorBody}`)
    }

    const { version: nextLockVersion }: MinkanPutResponse =
      await resMinkan.json()

    // 楽観ロック用versionをset
    setLockVersion(nextLockVersion)

    toast.success('保存しました', {
      description: '最新の内容がサーバーに保存されました。',
      duration: 2000, // 2s
    })
  } catch (err) {
    console.warn('保存に失敗しました', err)
  }
}
