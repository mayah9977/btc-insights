// lib/firebase-config.ts

import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app'
import type { Messaging } from 'firebase/messaging'

let firebaseApp: FirebaseApp | null = null
let messagingInstance: Messaging | null = null

const FIREBASE_APP_NAME = '[DEFAULT]'

function isValidString(value: unknown): value is string {
  if (!value) return false
  if (typeof value !== 'string') return false

  const v = value.trim()

  if (!v) return false
  if (v === 'undefined') return false
  if (v === 'null') return false

  return true
}

function isValidSenderId(value: unknown): value is string {
  if (!value) return false
  if (typeof value !== 'string') return false

  const v = value.trim()

  if (!v) return false
  if (v === 'undefined') return false
  if (v === 'null') return false
  if (!/^\d+$/.test(v)) return false

  return true
}

function getSafeSenderId(): string | undefined {
  const raw =
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID

  return isValidSenderId(raw) ? raw.trim() : undefined
}

function buildFirebaseConfig(): FirebaseOptions {
  const config: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: getSafeSenderId(),
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  }

  console.log('[FIREBASE CONFIG BUILD]', {
    apiKeyExists: isValidString(config.apiKey),
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  })

  return config
}

function hasSameFirebaseConfig(
  app: FirebaseApp,
  config: FirebaseOptions,
) {
  return (
    app.options.apiKey === config.apiKey &&
    app.options.authDomain === config.authDomain &&
    app.options.projectId === config.projectId &&
    app.options.storageBucket ===
      config.storageBucket &&
    app.options.messagingSenderId ===
      config.messagingSenderId &&
    app.options.appId === config.appId
  )
}

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) {
    console.log('[FIREBASE APP] cached app', {
      name: firebaseApp.name,
      projectId: firebaseApp.options.projectId,
      storageBucket: firebaseApp.options.storageBucket,
      messagingSenderId:
        firebaseApp.options.messagingSenderId,
      appId: firebaseApp.options.appId,
    })

    return firebaseApp
  }

  const config = buildFirebaseConfig()
  const apps = getApps()

  console.log('[FIREBASE APP] existing apps', {
    count: apps.length,
    apps: apps.map((app) => ({
      name: app.name,
      projectId: app.options.projectId,
      storageBucket: app.options.storageBucket,
      messagingSenderId:
        app.options.messagingSenderId,
      appId: app.options.appId,
    })),
  })

  const existingDefaultApp = apps.find(
    (app) => app.name === FIREBASE_APP_NAME,
  )

  if (existingDefaultApp) {
    if (
      !hasSameFirebaseConfig(
        existingDefaultApp,
        config,
      )
    ) {
      console.error('[FIREBASE CONFIG MISMATCH]', {
        existing: {
          name: existingDefaultApp.name,
          apiKeyExists: isValidString(
            existingDefaultApp.options.apiKey,
          ),
          authDomain:
            existingDefaultApp.options.authDomain,
          projectId:
            existingDefaultApp.options.projectId,
          storageBucket:
            existingDefaultApp.options.storageBucket,
          messagingSenderId:
            existingDefaultApp.options
              .messagingSenderId,
          appId: existingDefaultApp.options.appId,
        },
        expected: {
          apiKeyExists: isValidString(config.apiKey),
          authDomain: config.authDomain,
          projectId: config.projectId,
          storageBucket: config.storageBucket,
          messagingSenderId:
            config.messagingSenderId,
          appId: config.appId,
        },
      })
    }

    firebaseApp = getApp()

    console.log(
      '[FIREBASE APP] using existing default app',
      {
        name: firebaseApp.name,
        projectId: firebaseApp.options.projectId,
        storageBucket:
          firebaseApp.options.storageBucket,
        messagingSenderId:
          firebaseApp.options.messagingSenderId,
        appId: firebaseApp.options.appId,
      },
    )

    return firebaseApp
  }

  firebaseApp = initializeApp(config)

  console.log('[FIREBASE APP] initialized new app', {
    name: firebaseApp.name,
    projectId: firebaseApp.options.projectId,
    storageBucket: firebaseApp.options.storageBucket,
    messagingSenderId:
      firebaseApp.options.messagingSenderId,
    appId: firebaseApp.options.appId,
  })

  return firebaseApp
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') {
    console.warn('[FCM] window undefined')
    return null
  }

  const senderId = getSafeSenderId()

  console.log('[FCM] getFirebaseMessaging start', {
    senderId,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
  })

  if (!senderId) {
    console.warn('[FCM] invalid senderId')
    return null
  }

  if (messagingInstance) {
    console.log(
      '[FCM] using cached messaging instance',
    )
    return messagingInstance
  }

  try {
    const { getMessaging, isSupported } =
      await import('firebase/messaging')

    const supported = await isSupported()

    console.log('[FCM] isSupported result', {
      supported,
    })

    if (!supported) {
      console.warn('[FCM] messaging not supported')
      return null
    }

    const app = getFirebaseApp()

    console.log('[FCM] firebase app options check', {
      appName: app.name,
      appProjectId: app.options.projectId,
      appStorageBucket:
        app.options.storageBucket,
      appSenderId:
        app.options.messagingSenderId,
      envSenderId: senderId,
      appId: app.options.appId,
    })

    if (app.options.messagingSenderId !== senderId) {
      console.error('[FCM SENDER_ID MISMATCH]', {
        appSenderId:
          app.options.messagingSenderId,
        envSenderId: senderId,
      })

      return null
    }

    messagingInstance = getMessaging(app)

    console.log('[FCM] messaging initialized', {
      projectId: app.options.projectId,
      storageBucket: app.options.storageBucket,
      messagingSenderId:
        app.options.messagingSenderId,
      appId: app.options.appId,
    })

    return messagingInstance
  } catch (error) {
    console.error(
      '[FCM] getFirebaseMessaging fatal',
      error,
    )

    return null
  }
}
