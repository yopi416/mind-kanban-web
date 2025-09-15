import type { ComponentPropsWithoutRef } from 'react'
import { forwardRef } from 'react'

type CardViewProps = ComponentPropsWithoutRef<'div'>

export const CardView = forwardRef<HTMLDivElement, CardViewProps>(
  ({ children, ...props }, ref) => {
    console.log('CardView:', children, ' render')

    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  }
)

CardView.displayName = 'CardView'
