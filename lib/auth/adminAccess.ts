//lib/auth/adminAccess.ts  

import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export type AdminRole = 'ADMIN' | 'SUPER_ADMIN'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)

export async function isAdminUser(userId: string, email?: string | null) {
  if (!userId) return false

  if (ADMIN_USER_IDS.includes(userId)) {
    return true
  }

  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) {
    return true
  }

  return false
}

export async function getCurrentAdminUser() {
  const user = await getCurrentUser()

  if (!user) return null

  const admin = await isAdminUser(user.id, user.email)

  if (!admin) return null

  return {
    ...user,
    role: 'ADMIN' as AdminRole,
  }
}

export async function requireAdminUser() {
  const admin = await getCurrentAdminUser()

  if (!admin) {
    throw new Error('ADMIN_REQUIRED')
  }

  return admin
}
