import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT',
  messagingSenderId: 'SENDER_ID',
  appId: 'APP_ID',
}

export const firebaseApp =
  initializeApp(firebaseConfig)

export const messaging = getMessaging(firebaseApp)
