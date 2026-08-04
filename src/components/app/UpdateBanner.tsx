import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Snackbar, Stack } from '@mui/material'
import { useRegisterSW } from 'virtual:pwa-register/react'

interface UpdateBannerProps {
  isSaving: boolean
}

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000

const UpdateBanner = ({ isSaving }: UpdateBannerProps) => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>()
  const [dismissed, setDismissed] = useState(false)
  const [restartPending, setRestartPending] = useState(false)
  const updateStarted = useRef(false)
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW: (_swUrl, nextRegistration) => setRegistration(nextRegistration),
  })

  useEffect(() => {
    if (!registration) return

    const checkForUpdate = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void registration.update().catch(() => undefined)
      }
    }

    const interval = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL)
    window.addEventListener('focus', checkForUpdate)
    document.addEventListener('visibilitychange', checkForUpdate)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', checkForUpdate)
      document.removeEventListener('visibilitychange', checkForUpdate)
    }
  }, [registration])

  const installUpdate = useCallback(() => {
    if (updateStarted.current) return
    updateStarted.current = true
    void updateServiceWorker(true).catch(() => {
      updateStarted.current = false
      setRestartPending(false)
    })
  }, [updateServiceWorker])

  useEffect(() => {
    if (restartPending && !isSaving) installUpdate()
  }, [installUpdate, isSaving, restartPending])

  const handleRestart = () => {
    if (isSaving) {
      setRestartPending(true)
      return
    }
    installUpdate()
  }

  const handleDismiss = () => {
    setRestartPending(false)
    setDismissed(true)
  }

  return (
    <Snackbar
      open={needRefresh && !dismissed}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ top: { xs: 8, sm: 16 }, width: { xs: 'calc(100% - 24px)', sm: 'auto' } }}
    >
      <Alert
        severity="info"
        variant="filled"
        sx={{ width: '100%', alignItems: 'center' }}
        action={
          <Stack direction="row" spacing={0.5}>
            <Button color="inherit" size="small" onClick={handleDismiss}>
              Później
            </Button>
            <Button color="inherit" size="small" onClick={handleRestart}>
              {restartPending ? 'Po zapisaniu' : 'Uruchom ponownie'}
            </Button>
          </Stack>
        }
      >
        {restartPending
          ? 'Trwa zapisywanie. Aktualizacja uruchomi się automatycznie.'
          : 'Nowa wersja aplikacji jest dostępna.'}
      </Alert>
    </Snackbar>
  )
}

export default UpdateBanner
