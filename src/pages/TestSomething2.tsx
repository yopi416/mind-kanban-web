import { Button } from '@/components/ui/button'
import { memo } from 'react'

type Props = {
  // setState: (value: React.SetStateAction<number>) => void
  hello: () => void
}

export const TestSomething2 = memo(({ hello }: Props) => {
  console.log('I am Something2')
  // console.log('typeof setState:', typeof setState)
  return (
    <>
      <div>TestSomething2</div>
      <Button onClick={() => hello()}>Initialize number</Button>
    </>
  )
})
