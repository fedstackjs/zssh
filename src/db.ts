import Database from 'better-sqlite3'
import { fastifyPlugin } from 'fastify-plugin'
import { type ISSHKey, generateKey } from './ssh.js'

declare module 'fastify' {
  interface FastifyInstance {
    db: Database.Database
    getCA(userId: string): Promise<ISSHKey>
  }
}

export const dbPlugin = fastifyPlugin<{
  filename: string
}>(async (server, { filename }) => {
  const db = new Database(filename)

  db.exec(`
    CREATE TABLE IF NOT EXISTS CA (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId VARCHAR(255) UNIQUE NOT NULL,
      key TEXT NOT NULL,
      pub TEXT NOT NULL
    )`)

  server.decorate('db', db)
  server.decorate('getCA', async (userId: string) => {
    const row = server.db
      .prepare<[string], { key: string; pub: string }>('SELECT key, pub FROM CA WHERE userId = ?')
      .get(userId)
    if (row) return row
    const ca = await generateKey()
    server.db
      .prepare('INSERT INTO CA (userId, key, pub) VALUES (?, ?, ?)')
      .run(userId, ca.key, ca.pub)
    return ca
  })
})
