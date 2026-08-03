import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useRef,
} from 'react'
import { Box } from '@mui/material'

type SwipeBackProps = {
  children: ReactNode
  action?: () => void
}

const EDGE_SIZE = 50
const SWIPE_DISTANCE = 80
const MAX_VERTICAL_MOVE = 60

export function SwipeBack({ children, action }: SwipeBackProps) {
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const pointerId = useRef<number | null>(null)

  const resetGesture = () => {
    startX.current = null
    startY.current = null
    pointerId.current = null
  }

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.clientX > EDGE_SIZE) return
    startX.current = event.clientX
    startY.current = event.clientY
    pointerId.current = event.pointerId

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerUp = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (
      startX.current === null ||
      startY.current === null ||
      pointerId.current !== event.pointerId
    ) {
      resetGesture()
      return
    }

    const deltaX = event.clientX - startX.current
    const deltaY = event.clientY - startY.current

    const movedRight = deltaX >= SWIPE_DISTANCE

    const mostlyHorizontal =
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaY) <= MAX_VERTICAL_MOVE

    if (movedRight && mostlyHorizontal) {
      if (action) {
        action()
      } else {
        window.history.back()
      }
    }

    resetGesture()
  }

  return (
    <Box
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={resetGesture}
      sx={{
        position: 'relative',
        minHeight: '100dvh',
        touchAction: 'pan-y',
      }}
    >
      {children}
    </Box>
  )
}
