import { Button } from '@/components/ui/button'
import { useCallback, useState } from 'react'
import { TestSomething2 } from './TestSomething2'

// const DisplayCurrentNum = () => {
//   const [state, setState] = useState<number>(0)
//   const clickHandler = () => {
//     setState((prev) => prev + 1)
//   }

//   console.log("I am DisplaycurrentNum")

//   return (
//     <div>
//       <Button onClick={clickHandler}>
//         Button
//       </Button>
//       <p>current number is {state}</p>
//     </div>
//   )

// }

export const TestSomething = () => {
  console.log('I am Something1')
  const [state, setState] = useState<number>(0)
  const onClick = () => setState(state + 1)

  const hello = useCallback(() => {
    console.log('Hello!!!')
  }, [])

  function sleepSync(ms: number): number {
    const end = Date.now() + ms
    while (Date.now() < end) {
      // ブロッキング
    }
    return 1000
  }

  const aug: number = 3000

  const sleepResult = sleepSync(aug)

  return (
    <div>
      {/* <DisplayCurrentNum /> */}
      <Button onClick={onClick}>Button</Button>
      <p>current Number is {state}</p>
      <p>current Number is {sleepResult}</p>

      <TestSomething2 hello={hello} />
    </div>
  )
}
