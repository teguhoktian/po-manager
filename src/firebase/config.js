import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

const env = import.meta.env

// Public web config only. Admin credentials must never appear in client code.
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

/** False when required VITE_FIREBASE_* variables are missing; the app then shows a setup notice instead of crashing. */
export const isFirebaseConfigured = ['apiKey', 'authDomain', 'projectId', 'appId'].every((key) => Boolean(firebaseConfig[key]))

let app = null
let auth = null
let appCheck = null

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig)

  const siteKey = env.VITE_FIREBASE_APPCHECK_SITE_KEY
  if (siteKey) {
    // In development, App Check prints a debug token to the console; register it in the Firebase console.
    if (env.DEV) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    })
  }

  auth = getAuth(app)
}

export { app, auth, appCheck }
