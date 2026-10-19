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

  const beginGesture = (clientX: number, clientY: number) => {
    if (clientX > EDGE_SIZE) return
    startX.current = clientX
    startY.current = clientY
  }

  const finishGesture = (clientX: number, clientY: number) => {
    if (startX.current === null || startY.current === null) {
      resetGesture()
      return
    }
    const deltaX = clientX - startX.current
    const deltaY = clientY - startY.current
    if (
      deltaX >= SWIPE_DISTANCE &&
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaY) <= MAX_VERTICAL_MOVE
    ) {
      if (action) action()
      else window.history.back()
    }
    resetGesture()
  }

  const resetGesture = () => {
    startX.current = null
    startY.current = null
    pointerId.current = null
  }

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    beginGesture(event.clientX, event.clientY)
    if (startX.current === null) return
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

    finishGesture(event.clientX, event.clientY)
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    if (touch) beginGesture(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0]
    if (touch) finishGesture(touch.clientX, touch.clientY)
  }

  return (
    <Box
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={resetGesture}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={resetGesture}
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
