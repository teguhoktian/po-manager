import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { app } from './config'

// Kept separate from config.js so public pages (landing, ordering) don't download these SDKs.
export const db = app ? getFirestore(app) : null
export const storage = app ? getStorage(app) : null
