'use client'

/* =========================================================
   Event Batcher (Frame Aggregation)
   SSE → 1 frame → single store update
========================================================= */

type UpdateHandler<T> = (data: Partial<T>) => void

interface BatcherOptions<T> {
  handler: UpdateHandler<T>
}

export function createEventBatcher<T>(
  options: BatcherOptions<T>
) {

  let pending: Partial<T> | null = null
  let scheduled = false

  const { handler } = options

  function flush() {

    if (!pending) {
      scheduled = false
      return
    }

    handler(pending)

    pending = null
    scheduled = false
  }

  function push(data: Partial<T>) {

    pending = {
      ...(pending || {}),
      ...data,
    }

    if (scheduled) return

    scheduled = true

    requestAnimationFrame(flush)
  }

  return {
    push,
  }
}
