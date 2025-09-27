// import * as React from "react";
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { NavLink, Link } from 'react-router'

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

export default function AppHeader({ user }: AppHeaderProps) {
  const userLabel = user?.name || user?.email || 'ゲスト'

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-3 sm:h-16 sm:px-6">
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

            {/* User text only (no avatar) */}
            <span className="text-muted-foreground text-sm">{userLabel}</span>
          </div>
        </TooltipProvider>
      </div>
    </header>
  )
}
