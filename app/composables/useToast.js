import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

export const useToast = () => {
  const addToast = (message, type = 'error', duration = 4000) => {
    const id = nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => removeToast(id), duration)
  }

  const removeToast = (id) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const toast = {
    error: (msg) => addToast(msg, 'error'),
    success: (msg) => addToast(msg, 'success'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info'),
  }

  return { toasts, toast, removeToast }
}