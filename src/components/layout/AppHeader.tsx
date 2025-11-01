// import * as React from "react";
import { HelpCircle, LogOut } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { NavLink, Link } from 'react-router'
import { OIDC_GOOGLE_LOGOUT_ENDPOINT } from '@/constants/api'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

// Props for the header
export type AppHeaderProps = {
  user?: {
    name?: string
    email?: string
  }
}

// Simple inline SVG logo (placeholder)
const Logo: React.FC = () => (
  <div className="flex items-center gap-2">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className="h-6 w-6"
      aria-hidden
    >
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <rect x="4" y="8" width="56" height="48" rx="10" fill="url(#g)" />
      <path
        d="M18 24h28M18 32h18M18 40h10"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
    <span className="hidden font-semibold tracking-tight sm:inline">
      MindKanban
    </span>
  </div>
)

const NavItem: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
        'text-muted-foreground hover:text-blue-600',
        isActive ? 'border-blue-400 text-blue-400' : 'border-transparent',
      ].join(' ')
    }
  >
    {label}
  </NavLink>
)

const getCookie = (cookieName: string): string | undefined => {
  const cookieArray = document.cookie.split(';')
  for (const raw of cookieArray) {
    const cookie = raw.trim()
    if (cookie.startsWith(`${cookieName}=`)) {
      // 最初の '=' 以降をすべて値として扱う
      // - =が含まれるケースをケアするため、cookieNameの文字数で区切る
      const targetCookieValue = cookie.slice(cookieName.length + 1)
      try {
        // URIエンコードされている場合をケア
        return decodeURIComponent(targetCookieValue)
      } catch {
        return targetCookieValue
      }
    }
  }
  return undefined
}
// const selector = (store: WholeStoreState) => {
//   return {
//     setIsLogin: store.setIsLogin,
//     setAuthStatus: store.setAuthStatus,
//     setProjects: store.setProjects,
//     setCurrentPjId: store.setCurrentPjId,
//     setKanbanIndex: store.setKanbanIndex,
//     setKanbanColumns: store.setKanbanColumns,
//   }
// }

export default function AppHeader({ user }: AppHeaderProps) {
  // const {
  //   setIsLogin,
  //   setAuthStatus,
  //   setProjects,
  //   setCurrentPjId,
  //   setKanbanColumns,
  //   setKanbanIndex,
  // } = useWholeStore(useShallow(selector))

  const userLabel = user?.name || user?.email || 'ゲスト'

  const handleLogout = async () => {
    try {
      const csrfToken = getCookie('csrf_token')
      if (!csrfToken) {
        throw new Error('csrf_token not found')
      }

      const res = await fetch(`${OIDC_GOOGLE_LOGOUT_ENDPOINT}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      })

      if (res.status !== 200) {
        throw new Error(`Logout failed: ${res.status}, ${await res.text()}`)
      }

      // const csrfToken2 = getCookie("csrf_token")
      // console.log(csrfToken2)

      // 更新してzustand storeを空にしたいので,navigationは使わない
      window.location.href = '/login'
    } catch (err) {
      console.error(err)
      // alert("ログアウトに失敗しました。再度お試しください。")
      // window.location.replace("/login")
    }
  }

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="flex h-14 w-full items-center justify-between gap-3 px-3 sm:h-16 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {/* Left: Logo */}
        <Link to="/" className="shrink-0" aria-label="Home">
          <Logo />
        </Link>

        {/* Middle: nav links (React Router) */}
        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          <NavItem to="/app/mindmap" label="マインドマップ" />
          <NavItem to="/app/kanban" label="カンバンボード" />
          {/* <NavItem to="/guide" label="使い方" /> */}
        </nav>

        {/* Fill space */}
        <div className="flex-1" />

        {/* Right: help + user text */}
        <TooltipProvider>
          <div className="flex items-center gap-3">
            {/* Help icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  //   to="/help"
                  to="/"
                  aria-label="ヘルプ"
                  className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-full p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <HelpCircle className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>ヘルプ</TooltipContent>
            </Tooltip>

            {/* User dropdown (click the name) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* span だとフォーカスしづらいので button に */}
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground rounded-md px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="ユーザーメニュー"
                >
                  {userLabel}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate">
                  {userLabel}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* ▼ 将来用の「設定」：いったんコメントアウトだけ残す */}
                {/*
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    設定
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                */}

                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipProvider>
      </div>
    </header>
  )
}
