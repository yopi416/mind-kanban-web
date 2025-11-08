// import { useNavigate } from 'react-router'
// import { useWholeStore } from '@/state/store'
// import { dummyBootstrap } from '@/dummy/bootstrap'
// import { useState } from 'react'
import type {} from // Projects,
// WholeStoreState,
// KanbanColumns,
// KanbanIndex,
'@/types'
// import { useWholeStore } from '@/state/store'
// import { useShallow } from 'zustand/shallow'
// import { initialPjs } from '../mindmap/mockInitialElements'
import { OIDC_GOOGLE_LOGIN_ENDPOINT } from '@/constants/api'

// const selector = (store: WholeStoreState) => {
//   return {
//     isLogin: store.isLogin,
//     setIsLogin: store.setIsLogin,
//     setProjects: store.setProjects,
//     setCurrentPjId: store.setCurrentPjId,
//     setKanbanIndex: store.setKanbanIndex,
//     setKanbanColumns: store.setKanbanColumns,
//   }
// }

export function Login() {
  const onGoogleLogin = () => {
    window.location.href = OIDC_GOOGLE_LOGIN_ENDPOINT
  }

  // 案1：https://takazoom.hatenablog.com/entry/2015/10/03/101611
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-100 via-sky-100 to-sky-200 px-4 text-sky-900">
      <div className="w-full max-w-md">
        {/* Logo + タイトル（サイズUP） */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center">
            {/* ロゴ */}
            <img
              src="/src/assets/minkan-logo.png"
              alt="MinKan Logo"
              width={170}
              height={170}
              className="drop-shadow-sm"
            />
            {/* タイトル */}
            <img
              src="/src/assets/title-logo.png"
              alt="MinKan Logo"
              width={250}
              height={150}
              className="drop-shadow-sm"
            />
          </div>
          {/* サブタイトル（かわいい文言を維持） */}
          <p className="mt-3 text-xl font-medium text-slate-600">
            マインドマップ × カンバンボード
          </p>
          <p className="mt-6 text-center text-xs text-sky-900/60">
            本アプリは、試作段階であり、完成版ではございません。
            <br />
            利用によるトラブルについて、開発者は一切責任を負いません。自己の判断にてご使用ください。
          </p>
        </div>

        {/* カード本体（Googleログインのみ） */}
        <div className="rounded-2xl bg-white/95 p-6 shadow-xl ring-1 ring-sky-100 backdrop-blur">
          <p className="mb-4 text-center text-sky-700">
            Googleアカウントでログイン
          </p>

          <button
            type="button"
            // onClick={onDummyGoogleLogin}
            onClick={onGoogleLogin}
            // disabled={loading}
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
            <span>Continue with Google</span>
            {/* <span>{loading ? 'Redirecting…' : 'Continue with Google'}</span> */}
          </button>
        </div>

        {/* フッター */}
        {/* <p className="mt-6 text-center text-xs text-sky-900/60"> */}
        {/* 本アプリは、試作段階であり、完成版ではございません。<br/> */}
        {/* 利用によるトラブルについて開発者は一切責任を負いません。自己の判断にてご使用ください。 */}
        {/* © {new Date().getFullYear()} MinKan */}
        {/* </p> */}
      </div>
    </div>
  )
}
