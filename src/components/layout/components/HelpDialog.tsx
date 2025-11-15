// HelpDialogContent.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CheckSquare, Save } from 'lucide-react'
import { FaRegCommentDots } from 'react-icons/fa'
import { FiTrash2 } from 'react-icons/fi'
import { RiKanbanView2 } from 'react-icons/ri'

export function HelpDialogContent() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="mindmap" className="mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mindmap">マインドマップ</TabsTrigger>
          <TabsTrigger value="kanban">カンバンボード</TabsTrigger>
        </TabsList>

        {/* --- マインドマップ --- */}
        <TabsContent value="mindmap" className="mt-4 space-y-6 text-sm">
          {/* 基本操作 */}
          <section>
            <h3 className="mb-2 text-base font-semibold">基本操作</h3>
            <table className="w-full border-collapse text-left text-sm">
              <tbody>
                <tr>
                  <td className="text-muted-foreground w-32 py-1">編集開始</td>
                  <td>タスクをクリック または "e"</td>
                </tr>

                <tr>
                  <td className="text-muted-foreground py-1">改行/編集確定</td>
                  <td>Shift + Enterで改行 / Enter または Esc で確定</td>
                </tr>

                <tr>
                  <td className="text-muted-foreground py-1">タスクの移動</td>
                  <td>ドラッグ ⇒ ドロップ</td>
                </tr>

                <tr>
                  <td className="text-muted-foreground py-1">完了/未完了</td>
                  <td className="flex items-center gap-2">
                    <CheckSquare size={16} className="text-muted-foreground" />
                    クリック か "d"
                  </td>
                </tr>

                <tr>
                  <td className="text-muted-foreground py-1">
                    カンバンボード追加
                  </td>
                  <td className="flex items-center gap-2">
                    <RiKanbanView2
                      size={16}
                      className="text-muted-foreground"
                    />
                    クリック か “k”
                  </td>
                </tr>

                <tr>
                  <td className="text-muted-foreground py-1">メモ</td>
                  <td className="flex items-center gap-2">
                    <FaRegCommentDots
                      size={16}
                      className="text-muted-foreground"
                    />
                    クリック か “m” でメモを追加
                  </td>
                </tr>

                <tr>
                  <td className="text-muted-foreground w-32 py-1">保存</td>
                  <td className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    クリック または "Ctrl + s"
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* ショートカット */}
          <section>
            <h3 className="mb-2 text-base font-semibold">ショートカット</h3>

            <table className="border-border w-full rounded-md border text-left text-sm">
              <tbody>
                <tr className="bg-muted/40 border-border border-b">
                  <th className="w-28 px-2 py-2 font-medium">カテゴリ</th>
                  <th className="w-32 px-2 py-2 font-medium">キー</th>
                  <th className="px-2 py-2 font-medium">動作</th>
                </tr>

                <tr className="border-border border-b">
                  <td className="text-muted-foreground px-2 py-1 font-medium">
                    移動
                  </td>
                  <td className="px-2 py-1">← → ↑ ↓</td>
                  <td className="px-2 py-1">タスク選択を移動</td>
                </tr>

                <tr className="border-border border-b">
                  <td className="text-muted-foreground px-2 py-1 font-medium">
                    追加・編集
                  </td>
                  <td className="px-2 py-1">Enter</td>
                  <td className="px-2 py-1">タスクを追加(同じ階層)</td>
                </tr>

                <tr className="border-border border-b">
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1">Tab</td>
                  <td className="px-2 py-1">タスクを追加(子)</td>
                </tr>

                <tr className="border-border border-b">
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1">e</td>
                  <td className="px-2 py-1">編集開始</td>
                </tr>

                <tr className="border-border border-b">
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1">Ctrl+Enter / Esc</td>
                  <td className="px-2 py-1">編集確定</td>
                </tr>

                <tr className="border-border border-b">
                  <td className="text-muted-foreground px-2 py-1 font-medium">
                    その他
                  </td>
                  <td className="px-2 py-1">Delete</td>
                  <td className="px-2 py-1">削除（配下ごと）</td>
                </tr>

                <tr className="border-border border-b">
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1">d</td>
                  <td className="px-2 py-1">完了 / 未完了</td>
                </tr>

                <tr className="border-border border-b">
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1">k</td>
                  <td className="px-2 py-1">カンバンボードに追加</td>
                </tr>

                <tr className="border-border border-b">
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1">m</td>
                  <td className="px-2 py-1">メモ追加</td>
                </tr>

                <tr className="border-border border-b">
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1">Ctrl+S</td>
                  <td className="px-2 py-1">
                    マインドマップ＋カンバンの状態を保存
                  </td>
                </tr>

                <tr className="border-border border-b">
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1">Ctrl+Z</td>
                  <td className="px-2 py-1">1つ前の状態に戻す</td>
                </tr>

                <tr>
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1">Ctrl+Y / Cmd+Shift+Z</td>
                  <td className="px-2 py-1">1つ先の状態に戻す</td>
                </tr>
              </tbody>
            </table>
          </section>

          <a href="/login" className="text-sm text-blue-600 underline">
            詳細ガイドを見る →（準備中）
          </a>
        </TabsContent>

        {/* --- カンバン --- */}
        <TabsContent value="kanban" className="mt-4 space-y-6 text-sm">
          {/* 基本操作 */}
          <section className="mb-6">
            <h3 className="mb-3 mt-2 text-base font-semibold">基本操作</h3>

            <table className="w-full border-collapse text-left text-sm">
              <tbody>
                <tr>
                  <td className="text-muted-foreground w-32 py-1">
                    カード移動
                  </td>
                  <td>ドラッグ & ドロップで移動</td>
                </tr>

                <tr>
                  <td className="text-muted-foreground w-32 py-1">
                    カード削除
                  </td>
                  <td className="flex items-center gap-2">
                    <FiTrash2 className="h-4 w-4" />
                    クリック ※マインドマップからは削除されません
                  </td>
                </tr>

                <tr>
                  <td className="text-muted-foreground py-1">編集を保存</td>
                  <td className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    クリック または "Ctrl + s"
                  </td>
                </tr>

                <tr>
                  <td className="text-muted-foreground py-1">
                    完了状態を
                    <br />
                    マインドマップに反映
                  </td>
                  <td className="flex items-center gap-2">
                    "DONE" にカードを置いて、
                    <br />
                    「完了状態をマインドマップに反映」ボタン
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* ショートカット */}
          <section>
            <h3 className="mb-3 mt-2 text-base font-semibold">
              ショートカット
            </h3>
            <table className="border-border w-full rounded-md border text-left text-sm">
              <tbody>
                <tr className="bg-muted/40 border-border border-b">
                  <th className="w-28 px-2 py-2 font-medium">カテゴリ</th>
                  <th className="w-32 px-2 py-2 font-medium">キー</th>
                  <th className="px-2 py-2 font-medium">動作</th>
                </tr>

                <tr>
                  <td className="text-muted-foreground px-2 py-1 font-medium">
                    保存
                  </td>
                  <td className="px-2 py-1">Ctrl+S</td>
                  <td className="px-2 py-1">
                    マインドマップ＋カンバンの状態を保存
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <a href="/login" className="text-sm text-blue-600 underline">
            詳細ガイドを見る →（準備中）
          </a>
        </TabsContent>
      </Tabs>
    </div>
  )
}
