// import * as React from "react";
import { HelpCircle, LogOut, Trash2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { NavLink, Link } from 'react-router'
import {
  OIDC_GOOGLE_LOGOUT_ENDPOINT,
  USER_PROFILE_ENDPOINT,
} from '@/constants/api'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import type { UserInfo } from '@/types'
import { getCookie } from '@/features/auth/utils/cookieUtils'

// Props for the header
export type AppHeaderProps = {
  userInfo: UserInfo | null
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

export default function AppHeader({ userInfo }: AppHeaderProps) {
  const userName = userInfo ? userInfo.displayName : 'guest'
  const userEmail = userInfo ? userInfo.email : ''
  // const userLabel = user?.name || user?.email || 'ゲスト'

  // ログアウト用ハンドラ
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
      alert('ログアウトに失敗しました。再度お試しください。')
      // window.location.replace("/login")
    }
  }

  // ユーザー削除用ハンドラ
  const handleDeleteUser = async () => {
    try {
      if (
        !confirm('本当にアカウントを削除しますか？この操作は取り消せません。')
      )
        return

      const csrfToken = getCookie('csrf_token')
      if (!csrfToken) throw new Error('csrf_token not found')

      const res = await fetch(`${USER_PROFILE_ENDPOINT}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken },
      })

      if (res.status !== 204) {
        throw new Error(
          `User delete failed: ${res.status}, ${await res.text()}`
        )
      }

      window.location.href = '/login'
    } catch (err) {
      console.error(err)
      alert('ユーザー削除に失敗しました。再度お試しください。')
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
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="ユーザーメニュー"
                >
                  {userName}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col items-start px-3 py-2">
                  <span className="text-foreground truncate font-medium">
                    {userName}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {userEmail}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteUser}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  アカウント削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipProvider>
      </div>
    </header>
  )
}
