import { useNavigate } from 'react-router'
// import { useWholeStore } from '@/state/store'
// import { dummyBootstrap } from '@/dummy/bootstrap'
import { useState } from 'react'
import type { Projects, WholeStoreState, KanbanColumns } from '@/types'
import { useWholeStore } from '@/state/store'
import { useShallow } from 'zustand/shallow'
import { initialPjs } from '../mindmap/mockInitialElements'

const selector = (store: WholeStoreState) => {
  return {
    isLogin: store.isLogin,
    setIsLogin: store.setIsLogin,
    setProjects: store.setProjects,
    setCurrentPjId: store.setCurrentPjId,
    setKanbanColumns: store.setKanbanColumns,
  }
}

export function Login() {
  const navigate = useNavigate()
  // const setAuth = useWholeStore((s) => s.setAuth)
  const setAuth = () => {
    console.log('dummy Auth')
  }

  const { isLogin, setIsLogin, setProjects, setCurrentPjId, setKanbanColumns } =
    useWholeStore(useShallow(selector))
  const [loading, setLoading] = useState(false)

  //   const initFromServer = useWholeStore((s) => s.initFromServer)
  // DBからとってきたデータで、zustand storeのマインドマップとカンバンデータを初期化
  const initStore = () => {
    console.log('dummy init')

    // マインドマップデータの初期化
    const IntitialProjects: Projects = initialPjs
    setProjects(IntitialProjects)

    // CurrentPjIdの初期化
    const InitialCurrentPjId: string = 'pj1'
    setCurrentPjId(InitialCurrentPjId)

    // カンバンデータの初期化
    const InitialKanbanColumns: KanbanColumns = {
      backlog: [
        { pjId: 'pj1', nodeId: '2' },
        { pjId: 'pj2', nodeId: '2-2a' },
      ],
      todo: [{ pjId: 'pj2', nodeId: '2-2b' }],
      doing: [{ pjId: 'pj2', nodeId: '2-3a' }],
      done: [{ pjId: 'pj2', nodeId: '2-3b' }],
    }
    setKanbanColumns(InitialKanbanColumns)

    console.log('init has been done!!')
  }

  const onDummyGoogleLogin = () => {
    if (loading || isLogin) return
    setLoading(true) //navigate後にLoginPageはアンマウントされるのでtrueは維持されない

    // ← 実装ができたらここを window.location.href = '/auth/login' に差し替え
    setAuth()
    initStore()
    setIsLogin(true)

    // setAuth('dummy-token', dummyBootstrap.userId)
    // initFromServer({
    //   userId: dummyBootstrap.userId,
    //   currentPjId: dummyBootstrap.currentPjId,
    //   projects: dummyBootstrap.projects,
    //   kanban: dummyBootstrap.kanban,
    // })
    navigate('/app/mindmap', { replace: true })
  }

  // 案1：https://takazoom.hatenablog.com/entry/2015/10/03/101611
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-100 via-sky-100 to-sky-200 px-4 text-sky-900">
      <div className="w-full max-w-md">
        {/* Logo + タイトル（サイズUP） */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-3">
            {/* パチモン風(?) ミンカンくん（※公式Gopherではなくオリジナルです） */}
            <svg
              width="72"
              height="72"
              viewBox="0 0 120 120"
              role="img"
              aria-label="MinKan mascot"
              className="drop-shadow-sm"
            >
              <defs>
                <linearGradient id="mkGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7dd3fc" /> {/* sky-300 */}
                  <stop offset="100%" stopColor="#60a5fa" /> {/* blue-400 */}
                </linearGradient>
                <linearGradient id="mkBelly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e0f2fe" />
                  <stop offset="100%" stopColor="#bae6fd" />
                </linearGradient>
              </defs>
              {/* 耳っぽい出っ張り（丸くてポップ） */}
              <ellipse cx="36" cy="28" rx="12" ry="10" fill="url(#mkGrad)" />
              <ellipse cx="84" cy="28" rx="12" ry="10" fill="url(#mkGrad)" />
              {/* 本体 */}
              <ellipse
                cx="60"
                cy="68"
                rx="44"
                ry="46"
                fill="url(#mkGrad)"
                stroke="#2563eb"
                strokeWidth="2"
              />
              {/* お腹（明るめ） */}
              <ellipse cx="60" cy="80" rx="30" ry="26" fill="url(#mkBelly)" />
              {/* 目 */}
              <circle cx="45" cy="56" r="11" fill="#fff" />
              <circle cx="75" cy="56" r="11" fill="#fff" />
              <circle cx="47" cy="58" r="5.5" fill="#0f172a" /> {/* pupil */}
              <circle cx="73" cy="58" r="5.5" fill="#0f172a" />
              {/* きらり */}
              <circle cx="49.5" cy="55.5" r="1.6" fill="#fff" opacity="0.9" />
              <circle cx="75.5" cy="55.5" r="1.6" fill="#fff" opacity="0.9" />
              {/* 鼻 */}
              <rect x="55" y="64" width="10" height="6" rx="3" fill="#1e3a8a" />
              {/* 前歯（ゆるい感じ） */}
              <rect x="54" y="70" width="8" height="10" rx="2" fill="#fff" />
              <rect x="62" y="70" width="8" height="10" rx="2" fill="#fff" />
              <line
                x1="62"
                y1="70"
                x2="62"
                y2="80"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              {/* ほっぺ */}
              <circle cx="33" cy="72" r="4.5" fill="#fb7185" opacity="0.45" />
              <circle cx="87" cy="72" r="4.5" fill="#fb7185" opacity="0.45" />
              {/* ひげ（控えめ） */}
              <g
                stroke="#1e3a8a"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.7"
              >
                <line x1="22" y1="66" x2="34" y2="68" />
                <line x1="22" y1="72" x2="34" y2="72" />
                <line x1="22" y1="78" x2="34" y2="76" />
                <line x1="98" y1="68" x2="86" y2="70" />
                <line x1="98" y1="72" x2="86" y2="72" />
                <line x1="98" y1="76" x2="86" y2="74" />
              </g>
              {/* 影で少し立体感 */}
              <ellipse
                cx="60"
                cy="110"
                rx="26"
                ry="5"
                fill="#0f172a"
                opacity="0.15"
              />
            </svg>
            <span className="text-5xl font-extrabold tracking-tight sm:text-4xl">
              ミンカン！
            </span>
          </div>
          <p className="md:text2xl mt-3 text-xl font-medium text-sky-800/80 sm:text-2xl">
            マインドマップ × カンバンボード
          </p>
        </div>

        {/* カード本体（Googleログインのみ） */}
        <div className="rounded-2xl bg-white/95 p-6 shadow-xl ring-1 ring-sky-100 backdrop-blur">
          <p className="mb-4 text-center text-sky-700">
            Googleアカウントでログイン
          </p>

          <button
            type="button"
            onClick={onDummyGoogleLogin}
            disabled={loading}
            aria-label="Continue with Google"
            className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-5 py-3 text-[15px] font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-70"
          >
            {/* Google “G” */}
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.6 31.9 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.7 5.1 29.1 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.4-7.6 21-18v-6.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 16.6 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.7 5.1 29.1 3 24 3 16.1 3 9.2 7.4 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.1 40.5 16 45 24 45z"
              />
              <path
                fill="#1976D2"
                d="M45 24c0-1.4-.1-2.8-.4-4H24v8h11.3c-.6 3-2.3 5.6-4.9 7.5l6.2 5.2C40.8 37.9 45 31.5 45 24z"
              />
            </svg>
            <span>{loading ? 'Redirecting…' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* フッター */}
        <p className="mt-6 text-center text-xs text-sky-900/60">
          © {new Date().getFullYear()} MinKan
        </p>
      </div>
    </div>
  )

  // 案②↓

  //   return (
  //     <div className="flex h-screen overflow-hidden bg-white text-gray-900">
  //       {/* Left brand rail */}
  //       <aside className="hidden md:flex md:w-[380px] lg:w-[420px] h-full bg-[#1F3A66] text-white">
  //         <div className="mx-auto flex w-full max-w-[280px] flex-col items-start justify-center">
  //           <div className="text-5xl font-semibold tracking-wide">Logo</div>
  //           <div className="mt-8 flex items-center gap-3 opacity-80">
  //             <span className="block h-3 w-3 rounded-full bg-white/90" />
  //             <span className="block h-3 w-3 rounded-full bg-white/60" />
  //             <span className="block h-3 w-3 rounded-full bg-white/60" />
  //           </div>
  //         </div>
  //       </aside>

  //       {/* Right content */}
  //       <main className="flex-1">
  //         <div className="mx-auto flex h-full max-w-[880px] items-center px-6 sm:px-10 lg:px-20">
  //           <div className="w-full">
  //             <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Login</h1>
  //             <p className="mt-4 text-lg text-gray-500">
  //               Googleアカウントでログインしましょう！
  //             </p>

  //             {/* Google button */}
  //             <button
  //               type="button"
  //               onClick={onDummyGoogleLogin}
  //               disabled={loading}
  //               aria-label="Continue with Google"
  //               className="mt-10 inline-flex w-full max-w-[520px] items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-5 py-3 text-[15px] font-medium shadow-sm transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-70"
  //             >
  //               {/* Google G icon */}
  //               <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
  //                 <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 31.9 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.7 5.1 29.1 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.4-7.6 21-18v-6.5z"/>
  //                 <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.6 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.7 5.1 29.1 3 24 3 16.1 3 9.2 7.4 6.3 14.7z"/>
  //                 <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.1 40.5 16 45 24 45z"/>
  //                 <path fill="#1976D2" d="M45 24c0-1.4-.1-2.8-.4-4H24v8h11.3c-.6 3-2.3 5.6-4.9 7.5l6.2 5.2C40.8 37.9 45 31.5 45 24z"/>
  //               </svg>
  //               <span>{loading ? 'Redirecting…' : 'Continue with Google'}</span>
  //             </button>
  //           </div>
  //         </div>
  //       </main>
  //     </div>
  //   )
}
