import assert from 'assert'
import { fastify } from 'fastify'
import { fastifyJwtJwks } from 'fastify-jwt-jwks'
import { dbPlugin } from './db.js'
import { generateKey, signKey } from './ssh.js'
import { Permission } from '@uaaa/core'

const JWKS_URL = process.env.ZSSH_JWKS_URL || assert.fail('ZSSH_JWKS_URL is required')
const AUDIENCE = process.env.ZSSH_AUDIENCE || assert.fail('ZSSH_AUDIENCE is required')
const ISSUER = process.env.ZSSH_ISSUER || assert.fail('ZSSH_ISSUER is required')
const DB = process.env.ZSSH_DB || assert.fail('ZSSH_DB is required')

export const server = fastify({ logger: true })

server.register(fastifyJwtJwks, {
  jwksUrl: JWKS_URL,
  audience: AUDIENCE,
  issuer: ISSUER
})
server.register(dbPlugin, { filename: DB })

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: { sub: string; level: number; perm: string[] }
  }
}

const hasPermission = (perm: string[], required: string) =>
  perm.some((p) => Permission.fromScopedString(p, AUDIENCE).test(required))

server.get(
  '/api/whoami',
  { preValidation: (req, rep) => server.authenticate(req, rep) },
  async (req) => {
    return req.user
  }
)

server.get(
  '/api/pub',
  { preValidation: (req, rep) => server.authenticate(req, rep) },
  async (req, rep) => {
    const { sub, perm } = req.user
    if (!hasPermission(perm, '/pub')) {
      return rep.code(403).send({ message: 'Permission denied' })
    }
    const { pub } = await server.getCA(sub)
    return { pub }
  }
)

server.get(
  '/api/authorized_keys',
  { preValidation: (req, rep) => server.authenticate(req, rep) },
  async (req, rep) => {
    const { sub, perm } = req.user
    if (!hasPermission(perm, '/pub')) {
      return rep.code(403).send({ message: 'Permission denied' })
    }
    const { pub } = await server.getCA(sub)
    return `cert-authority,principals="${sub}" ${pub.trim()}`
  }
)

server.post(
  '/api/sign',
  { preValidation: (req, rep) => server.authenticate(req, rep) },
  async (req, rep) => {
    const { sub, perm } = req.user
    if (!hasPermission(perm, '/sign')) {
      return rep.code(403).send({ message: 'Permission denied' })
    }
    const ca = await server.getCA(sub)
    const key = await generateKey()
    const signed = await signKey(ca, key, sub, sub, '-30s:+5m')
    return signed
  }
)
