import assert from 'node:assert'
import { Level } from 'level'

const DB = process.env.ZSSH_DB || assert.fail('ZSSH_DB is required')
export const db = new Level(DB)

export async function getUserE(userId: string, key: string) {
  return db.get(`user:${userId}:${key}`)
}

export async function getUser(userId: string, key: string) {
  try {
    return await getUserE(userId, key)
  } catch (err) {
    if (err && (err as any).notFound) return null
    throw err
  }
}

export async function setUser(userId: string, key: string, value: string) {
  return db.put(`user:${userId}:${key}`, value)
}
