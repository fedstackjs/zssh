import assert from 'assert'
import { fastify } from 'fastify'
import { fastifyJwtJwks } from 'fastify-jwt-jwks'

const JWKS_URL = process.env.ZSSH_JWKS_URL || assert.fail('ZSSH_JWKS_URL is required')
const AUDIENCE = process.env.ZSSH_AUDIENCE || assert.fail('ZSSH_AUDIENCE is required')

export const server = fastify()

server.register(fastifyJwtJwks, {
  jwksUrl: JWKS_URL,
  audience: AUDIENCE
})

server.get('/api/whoami', { preValidation: server.authenticate }, async (req) => {
  return req.user
})

server.get('/api/pub', { preValidation: server.authenticate }, async (req) => {
  //
})

server.post('/api/sign', { preValidation: server.authenticate }, async (req) => {
  //
})
