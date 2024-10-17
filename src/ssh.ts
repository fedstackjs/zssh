import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import child_process from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(child_process.execFile)

export interface ISSHKey {
  key: string
  pub: string
}

export async function withSSHTmpDir<T>(cb: (dir: string) => Promise<T>) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'zssh-'))
  try {
    const result = await cb(dir)
    await fs.rm(dir, { recursive: true })
    return result
  } catch (err) {
    await fs.rm(dir, { recursive: true })
    throw err
  }
}

export async function generateKey(alg = 'ed25519', comment = 'zssh'): Promise<ISSHKey> {
  return withSSHTmpDir(async (dir) => {
    await execFileAsync('ssh-keygen', ['-t', alg, '-f', 'key', '-N', '', '-C', comment], {
      cwd: dir
    })
    const key = await fs.readFile(path.join(dir, 'key'), 'utf8')
    const pub = await fs.readFile(path.join(dir, 'key.pub'), 'utf8')
    return { key, pub }
  })
}

export async function signKey(
  ca: ISSHKey,
  key: ISSHKey,
  id: string,
  principal: string,
  valid: string
): Promise<ISSHKey> {
  return withSSHTmpDir(async (dir) => {
    await fs.writeFile(path.join(dir, 'ca'), ca.key, { mode: '0600' })
    await fs.writeFile(path.join(dir, 'key.pub'), key.pub, { mode: '0600' })
    await execFileAsync(
      'ssh-keygen',
      ['-s', 'ca', '-I', id, '-n', principal, '-V', valid, 'key.pub'],
      { cwd: dir }
    )
    const cert = await fs.readFile(path.join(dir, 'key-cert.pub'), 'utf8')
    return { key: key.key, pub: cert }
  })
}
