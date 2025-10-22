import { useState, useEffect } from 'react'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
            is_premium?: boolean
          }
          auth_date: number
          hash: string
        }
        version: string
        platform: string
        colorScheme: 'light' | 'dark'
        themeParams: {
          bg_color?: string
          text_color?: string
          hint_color?: string
          link_color?: string
          button_color?: string
          button_text_color?: string
          secondary_bg_color?: string
        }
        isExpanded: boolean
        viewportHeight: number
        viewportStableHeight: number
        headerColor: string
        backgroundColor: string
        isClosingConfirmationEnabled: boolean
        BackButton: {
          isVisible: boolean
          onClick: (callback: () => void) => void
          offClick: (callback: () => void) => void
          show: () => void
          hide: () => void
        }
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          isProgressVisible: boolean
          setText: (text: string) => void
          onClick: (callback: () => void) => void
          offClick: (callback: () => void) => void
          show: () => void
          hide: () => void
          enable: () => void
          disable: () => void
          showProgress: (leaveActive?: boolean) => void
          hideProgress: () => void
          setParams: (params: {
            text?: string
            color?: string
            text_color?: string
            is_active?: boolean
            is_visible?: boolean
          }) => void
        }
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
          selectionChanged: () => void
        }
        ready: () => void
        expand: () => void
        close: () => void
        sendData: (data: string) => void
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void
        openTelegramLink: (url: string) => void
        openInvoice: (url: string, callback?: (status: string) => void) => void
        showPopup: (params: {
          title?: string
          message: string
          buttons?: Array<{
            id?: string
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
            text?: string
          }>
        }, callback?: (buttonId: string) => void) => void
        showAlert: (message: string, callback?: () => void) => void
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void
        showScanQrPopup: (params: {
          text?: string
        }, callback?: (text: string) => void) => void
        closeScanQrPopup: () => void
        readTextFromClipboard: (callback?: (text: string) => void) => void
        requestWriteAccess: (callback?: (granted: boolean) => void) => void
        requestContact: (callback?: (granted: boolean) => void) => void
        onEvent: (eventType: string, eventHandler: () => void) => void
        offEvent: (eventType: string, eventHandler: () => void) => void
      }
    }
  }
}

export const useTelegram = () => {
  const [isReady, setIsReady] = useState(false)
  const [webApp, setWebApp] = useState<any>(null)

  useEffect(() => {
    // Initialize Telegram WebApp
    const initWebApp = () => {
      try {
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp
          
          // Initialize WebApp
          tg.ready()
          tg.expand()
          
          // Set theme colors
          if (tg.themeParams?.bg_color) {
            document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color)
          }
          if (tg.themeParams?.text_color) {
            document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color)
          }
          if (tg.themeParams?.button_color) {
            document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color)
          }
          if (tg.themeParams?.button_text_color) {
            document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color)
          }
          
          // Set state
          setWebApp(tg)
          setIsReady(true)
        } else {
          // Fallback for development
          console.warn('Telegram WebApp not available, using fallback')
          
          // Create a mock WebApp for development
          const mockWebApp = {
            ready: () => {},
            expand: () => {},
            close: () => {},
            sendData: (data: any) => console.log('Mock sendData:', data),
            showAlert: (message: string) => console.log('Mock showAlert:', message),
            showConfirm: (message: string) => console.log('Mock showConfirm:', message),
            hapticFeedback: () => {},
            themeParams: {},
            initData: '',
            initDataUnsafe: { user: null }
          }
          
          // Set state
          setWebApp(mockWebApp)
          setIsReady(true)
        }
      } catch (error) {
        console.error('Error initializing Telegram WebApp:', error)
        // Set fallback state
        setWebApp(null)
        setIsReady(true)
      }
    }

    // Use setTimeout to ensure DOM is ready
    setTimeout(initWebApp, 0)
  }, [])

  const getUser = () => {
    return webApp?.initDataUnsafe?.user || null
  }

  const sendData = (data: any) => {
    if (webApp) {
      webApp.sendData(JSON.stringify(data))
    }
  }

  const showAlert = (message: string) => {
    if (webApp) {
      webApp.showAlert(message)
    } else {
      alert(message)
    }
  }

  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred(type)
    }
  }

  const notificationFeedback = (type: 'error' | 'success' | 'warning') => {
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.notificationOccurred(type)
    }
  }

  return {
    isReady,
    webApp,
    getUser,
    sendData,
    showAlert,
    hapticFeedback,
    notificationFeedback,
  }
}
