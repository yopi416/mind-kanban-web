import { useRef, useState, useLayoutEffect, useEffect } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { RiKanbanView2 } from 'react-icons/ri' //kanbanIcon
// import { MdOutlineCheckBox } from 'react-icons/md' //checkIcon
// import { MdOutlineTextRotationAngleup } from 'react-icons/md' //checkIcon
// import { MdOutlineCheckBoxOutlineBlank} from "react-icons/md"; //checkIcon
import { CiCirclePlus } from 'react-icons/ci' //plusIcon
// import useMindMapStore from '../store'
import { useShallow } from 'zustand/shallow'
import clsx from 'clsx'
import {
  type NodeData,
  // type MindMapStore,
  type EditSnapshot,
  type WholeStoreState,
  type KanbanCardRef,
  type KanbanColumnName,
} from '../../../types.ts'
import { CommentPopover } from './CommentPopover.tsx'
import { Checkbox } from '@/components/ui/checkbox'
// import { set } from 'lodash'
import { MAX_NODE_LABEL_LENGTH, ROOT_NODE_ID } from '../constants.ts'
import { getCurrentPj } from '../utils/projectUtils.ts'
import { getNodeIdxById } from '../utils/nodeTreeUtils.ts'
import { useWholeStore } from '@/state/store.ts'

type HoverZone = 'left-top' | 'left-bottom' | 'right' | null

const selector = (store: WholeStoreState) => ({
  updateNodeLabel: store.updateNodeLabel,
  addHorizontalElement: store.addHorizontalElement,
  addVerticalElement: store.addVerticalElement,
  setFocusedNodeId: store.setFocusedNodeId,
  setEditingNodeId: store.setEditingNodeId,
  setCommentPopupId: store.setCommentPopupId,
  updateIsDone: store.updateIsDone,
  pushPrevGraphToUndo: store.pushPrevGraphToUndo,
  addCard: store.addCard,
})

function CustomNode({ id, data }: NodeProps<Node<NodeData>>) {
  // console.log(`${new Date().toLocaleString()} 再描画:`, id)

  // 本コードの後に、useMindMapStoreではなくsubscribeでしている部分がある
  // subscribe対象：focusedNodeId, editingNodeId, movingNodeId, commentPopupId
  // subscribe理由：ここでfocsudNodeIdを取得しisFocusedの判定に用いると、他ノードFocus時も再レンダリングされるため
  const {
    updateNodeLabel,
    addHorizontalElement,
    addVerticalElement,
    setFocusedNodeId,
    setEditingNodeId,
    setCommentPopupId,
    updateIsDone,
    pushPrevGraphToUndo,
    addCard,
  } = useWholeStore(useShallow(selector))

  /* 自ノードがfocusされている時に枠色を強調 */
  // div側で isFocusedがtrueであれば枠色を青色に
  const [isFocused, setIsFocused] = useState<boolean>(false) //自ノードがフォーカスされているかのフラグ

  useEffect(() => {
    const unsub = useWholeStore.subscribe(
      (state) => state.focusedNodeId,
      (newId) => {
        setIsFocused(newId === id)
      },
      { fireImmediately: true }
    )

    return () => unsub()
  }, [id])

  /* ノードのテキスト入力状態の管理 */

  // true時はtextareaがpointer-events-auto + Focus状態（編集状態）となる
  // pointer-events = none ⇒ クリックできない状態
  // よって、ノードドラッグ時には、textareaを反応させなくする効果もある

  // editingNodeIdが自ノードになる条件は2つある
  // 1. Focus時にショートカット(index.tsxで規定) eを押した時
  // 2. Focus時に、ノードをクリックした時（本ノードのonClickイベントであるenterEditで規定）

  const [isEditing, setIsEditing] = useState(false)

  // undoStack追加用
  // const [snapshotToUndo, setSnapshotToUndo] = useState<EditSnapshot | null>(null)
  const snapshotRef = useRef<EditSnapshot | null>(null)

  const textAreaRef = useRef<HTMLTextAreaElement>(null) //textareaへのref

  useEffect(() => {
    const unsub = useWholeStore.subscribe(
      (state) => state.editingNodeId,
      (newId) => {
        if (newId === id) {
          setIsEditing(true)
          setTimeout(() => textAreaRef.current?.focus(), 0) //ここでtextareaをFocus

          // Undo用: 編集開始直前の状態を保存
          const { projects, currentPjId, focusedNodeId } =
            useWholeStore.getState()
          const { nodes, edges } = getCurrentPj(projects, currentPjId)
          const deepCopy = structuredClone({ nodes, edges, focusedNodeId })
          snapshotRef.current = { pjId: currentPjId, ...deepCopy }
          // setSnapshotToUndo({ pjId: currentPjId, nodes, edges })
        }
      },
      { fireImmediately: true }
    )

    return () => unsub()
  }, [id])

  // textareaに適用
  const textAreaCls = clsx(
    // 'w-60 resize-none overflow-hidden px-3 pt-1 text-center text-2xl',
    'w-60 resize-none overflow-hidden px-3 pt-1 text-center text-2xl',
    'whitespace-pre-wrap break-words',
    isEditing
      ? 'relative z-[2] pointer-events-auto focus:outline-none'
      : 'pointer-events-none select-none opacity-90'
  )

  // 全体ラップするdivのonClickハンドラ
  // Focusされていない時は、Focusを自ノードに当てる
  const enterEdit = () => {
    if (isFocused) {
      setEditingNodeId(id)
    } else {
      setFocusedNodeId(id)
    }
  }

  // textareaのonBlur(focusが外れた時)ハンドラ
  // - 編集状態を終了する
  // - 編集があったならば、編集前状態をundoStackに追加
  const leaveEdit = () => {
    setIsEditing(false)
    setEditingNodeId(null)

    // snapshotがとられていない状態だと、UndoStackには保存しないようにする
    // この場合は起こる可能性はなさそうだが、念のため
    if (!snapshotRef || !snapshotRef.current) return

    // if(!snapshotToUndo){
    //   setSnapshotToUndo(null)
    //   return
    // }

    const { projects } = useWholeStore.getState()
    const currentPjId = snapshotRef.current.pjId
    // const currentPjId = snapshotToUndo.pjId

    const { nodes } = getCurrentPj(projects, currentPjId)
    const currentNodeIdx = getNodeIdxById(id, nodes)

    const prevNodes: Node<NodeData>[] = snapshotRef.current.nodes
    // const prevNodes: Node<NodeData>[] = snapshotToUndo.nodes
    const prevNodeIdx = getNodeIdxById(id, prevNodes)

    if (currentNodeIdx === -1 || prevNodeIdx === -1) {
      snapshotRef.current = null
      // setSnapshotToUndo(null)
      return
    }

    const currentLabel = nodes[currentNodeIdx].data.label
    const prevLabel = prevNodes[prevNodeIdx].data.label

    // テキストエリアが編集前後で同じ状態の場合はundoStackに保存しない
    if (currentLabel === prevLabel) {
      // setSnapshotToUndo(null)
      snapshotRef.current = null
      return
    }

    // 編集前状態をUndoStackに追加し初期化
    pushPrevGraphToUndo(currentPjId, {
      nodes: prevNodes,
      edges: snapshotRef.current.edges,
      focusedNodeId: snapshotRef.current.focusedNodeId,
    })
    snapshotRef.current = null
  }

  /* テキスト入力状態時の処理 */
  // - 編集内容を zustand store に反映する
  // - 入力に応じて textarea の高さを自動調整する（横幅は固定）

  // 高さ調整
  const resizeTextArea = (el: HTMLTextAreaElement) => {
    if (!el) return
    el.style.height = '0px' // or 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  // textareaのonChangeハンドラ
  // 入力テキストをzustand store同期
  // & textareaの高さ調整
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const limitedLengthLabel = e.target.value.slice(0, MAX_NODE_LABEL_LENGTH) // 入力文字数制限

    updateNodeLabel(id, limitedLengthLabel)
    e.currentTarget.value = limitedLengthLabel
    resizeTextArea(e.currentTarget) //高さを変更
  }

  // マウント直後 & ノードのラベル更新時に高さ調整
  // 要検討：handleChangeにも含まれている処理であるが、念のため導入。不要な可能性有。
  useLayoutEffect(() => {
    if (textAreaRef.current) {
      resizeTextArea(textAreaRef.current)
    }
  }, [data.label])

  /* ノードのドラッグ移動時に色を付ける処理 */

  const [hoverPosition, setHoverPosition] = useState<HoverZone>(null)
  const [isHighlight, setIsHighlight] = useState<boolean>(false)

  const nodeRef = useRef<HTMLDivElement>(null) //ノード全体をwrapするdivへのref
  const movingNodeIdRef = useRef<string | null>(null)

  const [isMovingSelf, setIsMovingSelf] = useState(false) //自ノードが移動されているかのフラグ

  useEffect(() => {
    const unsub = useWholeStore.subscribe(
      (state) => state.movingNodeId,
      (newId) => {
        movingNodeIdRef.current = newId
        setIsMovingSelf(newId === id)
      },
      { fireImmediately: true }
    )

    return () => unsub()
  }, [id])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!nodeRef.current) return

    const rect = nodeRef.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    const isRight = offsetX > rect.width * (4 / 5)
    const isTop = offsetY < rect.height / 2

    if (isRight) {
      setHoverPosition('right')
    } else {
      setHoverPosition(isTop ? 'left-top' : 'left-bottom')
    }

    const shouldHighlight =
      movingNodeIdRef.current !== null && movingNodeIdRef.current !== id

    setIsHighlight((prev) =>
      prev !== shouldHighlight ? shouldHighlight : prev
    ) //同じときはprevをセットすることでリレンダリング防止
  }

  const handleMouseLeave = () => {
    setHoverPosition(null)
  }

  /* --- コメントポップアップ用 --- */
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)

  useEffect(() => {
    const unsub = useWholeStore.subscribe(
      (state) => state.commentPopupId,
      (newId) => {
        setIsPopupOpen(newId === id)
      },
      { fireImmediately: true }
    )

    return () => unsub()
  }, [id])

  /* --- カンバンボード関連 ---*/

  // カンバンボード追加時にカンバンアイコンを強調
  const [isKanban, setIsKanban] = useState<boolean>(false) // 強調有無のフラグ

  useEffect(() => {
    const unsub = useWholeStore.subscribe(
      (state) => [state.kanbanIndex, state.currentPjId] as const,
      ([newIndex, currentPjId]) => {
        // kanbanIndexに、自身のnodeIdがあればフラグをtrueに設定
        setIsKanban(newIndex.get(currentPjId)?.has(id) ?? false)
      },
      { fireImmediately: true }
    )

    return () => unsub()
  }, [id])

  // カンバンボード追加ボタンのハンドラ

  const handleKanbanClick = () => {
    if (id === ROOT_NODE_ID) {
      alert('ルートノードはカンバンボードに追加できません')
      return
    }

    const pjId = useWholeStore.getState().currentPjId

    const cardRef: KanbanCardRef = {
      pjId,
      nodeId: id,
    }

    const columnToAddInto: KanbanColumnName = 'backlog'

    addCard(cardRef, columnToAddInto)
  }

  return (
    <div
      tabIndex={0}
      ref={nodeRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={enterEdit}
      className={clsx(
        'relative z-[1] border-2',
        isFocused ? 'ring-2 ring-blue-500' : '',
        isMovingSelf ? 'border-2 border-dashed border-blue-500' : '',
        data.isDone ? 'bg-gray-200' : ''
      )}
    >
      {isHighlight && hoverPosition === 'left-top' && (
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-1/2 w-4/5 rounded-tl-lg bg-blue-200 opacity-40" />
      )}
      {isHighlight && hoverPosition === 'left-bottom' && (
        <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-1/2 w-4/5 rounded-bl-lg bg-green-200 opacity-40" />
      )}
      {isHighlight && hoverPosition === 'right' && (
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-1/5 rounded-r-lg bg-yellow-200 opacity-40" />
      )}

      <div className="flex items-center justify-between">
        {/* 左端に表示 */}
        {isMovingSelf ? (
          <span className="ml-3 animate-pulse text-sm font-semibold text-blue-500">
            {' '}
            移動中...
          </span>
        ) : (
          <span /> // スペース保持のため（isMovingSelfがfalseでも左端に空要素を維持）
        )}

        {/* 右端のボタン群 */}
        <div className="flex items-center gap-2">
          {/* 真下にノード追加 */}
          {data.parentId && (
            <button
              type="button"
              onClick={() => addVerticalElement(id, data.parentId!)}
              className="relative z-[2]"
            >
              <CiCirclePlus size={20} />
            </button>
          )}

          {/* 子ノード追加 */}

          <button
            type="button"
            onClick={() => addHorizontalElement(id)}
            className="relative z-[2]"
          >
            <CiCirclePlus size={20} />
          </button>

          {/* タスクの完了状態を変更 */}
          <Checkbox
            checked={data.isDone}
            onClick={(e) => e.stopPropagation()}
            onCheckedChange={(checked) => updateIsDone(id, !!checked)}
            className={clsx(
              'relative z-[2]',
              !data.isDone && 'border-gray-600'
            )}
          />

          {/* カンバンボード連携 */}
          <button
            type="button"
            onClick={() => handleKanbanClick()}
            className="relative z-[2]"
          >
            <RiKanbanView2
              size={20}
              className={isKanban ? 'text-blue-500' : ''}
            />
          </button>

          {/* コメント画面出力・コメント記載用コンポーネントの呼び出し */}
          <CommentPopover
            id={id}
            data={data}
            open={isPopupOpen} //ポップアップフラグ
            onOpenChange={(open) => setCommentPopupId(open ? id : null)} //コメントボタン開閉
          />
          {/* <FaRegCommentDots size={20} /> */}
        </div>
      </div>

      <textarea
        ref={textAreaRef}
        value={data.label}
        onChange={handleChange}
        maxLength={MAX_NODE_LABEL_LENGTH}
        onBlur={leaveEdit}
        // readOnly={!isEditing}
        tabIndex={isEditing ? 0 : -1} // 編集中以外はフォーカス対象外
        onKeyDown={(e) => {
          //Ctrl + Enterで入力完了
          if (
            ((e.ctrlKey || e.metaKey) && e.key === 'Enter') ||
            e.key === 'Escape'
          ) {
            e.preventDefault()
            textAreaRef.current?.blur()
          }

          e.stopPropagation() // textarea入力中は上位に矢印キーの伝播を止める
        }}
        className={textAreaCls}
      />

      {/* <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
        {data.label.length} / {MAX_NODE_LABEL_LENGTH}
      </div> */}

      <Handle type="target" position={Position.Left} />
      <Handle
        type="source"
        position={Position.Right}
        className={
          isEditing ? 'pointer-events-none' : 'pointer-events-auto z-0'
        }
      />
    </div>
  )
}

export default CustomNode
