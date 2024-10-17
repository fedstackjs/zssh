#!/usr/bin/env node
import assert from 'assert'
import 'dotenv/config'

const PORT = +(process.env.ZSSH_PORT || 3000) || assert.fail('ZSSH_PORT must be a number')
const HOST = process.env.ZSSH_HOST || '0.0.0.0'
const { server } = await import('../index.js')
await server.listen({ port: PORT, host: HOST })
