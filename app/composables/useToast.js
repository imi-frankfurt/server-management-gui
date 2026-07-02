import { ref } from 'vue'

const toastState = {
  toasts: ref([]),
  nextId: 0
}

export const useToast = () => {
  const addToast = (message, type = 'error', duration = 4000) => {
    const id = toastState.nextId++
    toastState.toasts.value.push({ id, message, type })
    setTimeout(() => removeToast(id), duration)
  }

  const removeToast = (id) => {
    toastState.toasts.value = toastState.toasts.value.filter((t) => t.id !== id)
  }

  const toast = {
    error: (msg) => addToast(msg, 'error'),
    success: (msg) => addToast(msg, 'success'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info'),
  }

  return { toasts: toastState.toasts, toast, removeToast }
}