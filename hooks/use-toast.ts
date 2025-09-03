import * as React from "react"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

type ToastType = ToastProps & {
  id: string
}

type ToastState = {
  toasts: ToastType[]
}

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 3000

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type Action =
  | { type: "ADD_TOAST"; toast: ToastType }
  | { type: "REMOVE_TOAST"; toastId: string }

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: ToastState, action: Action): ToastState => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function toast(props: ToastProps) {
  const id = genId()

  const toastData: ToastType = {
    ...props,
    id,
  }

  dispatch({
    type: "ADD_TOAST",
    toast: toastData,
  })

  // Auto remove after delay
  const timeout = setTimeout(() => {
    dispatch({ type: "REMOVE_TOAST", toastId: id })
    toastTimeouts.delete(id)
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(id, timeout)

  return {
    id,
    dismiss: () => {
      if (toastTimeouts.has(id)) {
        clearTimeout(toastTimeouts.get(id))
        toastTimeouts.delete(id)
      }
      dispatch({ type: "REMOVE_TOAST", toastId: id })
    },
  }
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
  }
}

export { useToast, toast }
