// import { Button } from '@/components/ui/button'
// import { useCallback, useState } from 'react'
// import { TestSomething2 } from './TestSomething2'

import { Outlet } from 'react-router'

export const TestSomething = () => {
  return (
    <>
      <h1>This is TestSomething!!</h1>
      <Outlet />
    </>
  )
}
