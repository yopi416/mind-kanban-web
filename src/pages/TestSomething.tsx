// import { Button } from '@/components/ui/button'
// import { useCallback, useState } from 'react'
// import { TestSomething2 } from './TestSomething2'

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
  const visilble: boolean = false
  const htmlTag = visilble ? <div></div> : <div>invisible</div>

  return htmlTag
}
