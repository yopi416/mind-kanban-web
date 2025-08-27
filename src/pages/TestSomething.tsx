import { Button } from '@/components/ui/button'
import { useState } from 'react'

export const TestSomething = () => {
  type obj = {
    id: number
    name: string
  }

  const [state, setState] = useState<obj>({ id: 1, name: 'Tanaka' })

  const updateName = (newName: string) => {
    setState((prev: obj) => {
      console.log(prev === state)
      prev.name = 'sameRef'
      console.log(prev === state)

      const newState = { ...prev, name: newName }
      console.log(newState === state)
      return newState
    })
  }

  return (
    <div>
      <Button
        onClick={() => {
          updateName('newName')
        }}
      >
        {state.name}
      </Button>
    </div>
  )
}
