import { AlertEnum, AlertType } from '@/models/alert-model'
import { create } from 'zustand'

interface AlertState {
  isOpen: boolean
  message: string
  type: AlertType
  onConfirm?: () => void
  onCancel?: () => void
  showAlert: (config: {
    message: string
    type: AlertType
    onConfirm?: () => void
    onCancel?: () => void
  }) => void
  hideAlert: () => void
}

export const useAlertStore = create<AlertState>((set) => ({
  isOpen: false,
  message: '',
  type: AlertEnum.INFO,
  onConfirm: undefined,
  onCancel: undefined,
  showAlert: (config) => set({ 
    isOpen: true, 
    ...config 
  }),
  hideAlert: () => set({ 
    isOpen: false, 
    onConfirm: undefined, 
    onCancel: undefined 
  }),
}))