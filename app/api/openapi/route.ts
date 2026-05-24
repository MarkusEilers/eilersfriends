import { NextResponse } from 'next/server'

export const runtime = 'edge'

const OPENAPI = {
  openapi: '3.1.0',
  info: {
    title: 'Eilers+Friends Public API',
    version: '1.0.0',
    description:
      'Public REST + MCP-Endpoints für CRM/Newsletter/Community-Integrationen sowie AI-Tools (Claude, Cowork, Zapier, Make, n8n).\n\n' +
      'Auth: Bearer-Token mit Scopes. Tokens werden im Admin-Panel unter `/admin/integrations` erstellt.',
    contact: { email: 'markus@eilers.at' },
  },
  servers: [{ url: 'https://eilersfriends.com' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'EF-API-Key' },
    },
    schemas: {
      Event: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          category: { type: 'string', enum: ['subscriber','framework','offer','member','community','system'] },
          type: { type: 'string', example: 'subscriber.confirmed' },
          payload: { type: 'object' },
          source: { type: 'string' },
          occurred_at: { type: 'string', format: 'date-time' },
        },
      },
      Subscriber: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          first_name: { type: 'string' },
          source: { type: 'string' },
          confirmed: { type: 'boolean' },
          confirmed_at: { type: 'string', format: 'date-time' },
        },
      },
      Framework: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string' },
          title: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] },
          locale: { type: 'string' },
          accent_color: { type: 'string' },
          card_meta: { type: 'object' },
        },
      },
      Offer: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          offer_number: { type: 'string' },
          customer_name: { type: 'string' },
          customer_company: { type: 'string' },
          customer_email: { type: 'string', format: 'email' },
          title: { type: 'string' },
          status: { type: 'string', enum: ['draft','sent','viewed','signed','paid','expired','cancelled'] },
          valid_until: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/v1/events': {
      get: {
        summary: 'List events',
        description: 'Liste der Domain-Events. Filter nach Category, Type (mit `prefix.*` möglich), Since (ISO-Timestamp).',
        parameters: [
          { name: 'since', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'type', in: 'query', schema: { type: 'string' }, example: 'offer.*' },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 100, maximum: 500 } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, events: { type: 'array', items: { $ref: '#/components/schemas/Event' } } } } } },
          },
        },
        security: [{ bearerAuth: ['events:read'] }],
      },
      post: {
        summary: 'Emit event',
        description: 'Erzeugt ein neues Domain-Event. Idempotent via `idempotencyKey`.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['category', 'type'],
                properties: {
                  category: { type: 'string', enum: ['subscriber','framework','offer','member','community','system'] },
                  type: { type: 'string' },
                  payload: { type: 'object' },
                  source: { type: 'string' },
                  idempotencyKey: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'OK' } },
        security: [{ bearerAuth: ['events:write'] }],
      },
    },
    '/api/v1/subscribers': {
      get: {
        summary: 'List subscribers',
        parameters: [
          { name: 'email', in: 'query', schema: { type: 'string', format: 'email' } },
          { name: 'source', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 200 } },
        ],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { subscribers: { type: 'array', items: { $ref: '#/components/schemas/Subscriber' } } } } } } } },
        security: [{ bearerAuth: ['subscribers:read'] }],
      },
    },
    '/api/v1/frameworks': {
      get: {
        summary: 'List frameworks',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'published', 'archived'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: { '200': { description: 'OK' } },
        security: [{ bearerAuth: ['frameworks:read'] }],
      },
    },
    '/api/v1/offers': {
      get: {
        summary: 'List offers',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft','sent','viewed','signed','paid','expired','cancelled'] } },
          { name: 'customer_email', in: 'query', schema: { type: 'string', format: 'email' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: { '200': { description: 'OK' } },
        security: [{ bearerAuth: ['offers:read'] }],
      },
    },
    '/api/mcp': {
      post: {
        summary: 'Model Context Protocol Endpoint',
        description: 'JSON-RPC 2.0. Methoden: `initialize`, `tools/list`, `tools/call`. Für Claude, Cowork, andere AI-Tools.',
        responses: { '200': { description: 'OK' } },
        security: [{ bearerAuth: ['mcp:read'] }],
      },
    },
    '/api/webhooks/in/{provider}': {
      post: {
        summary: 'Inbound webhook',
        description: 'Empfangt Events von externen Providern (beehiiv, resend, hubspot, custom).',
        parameters: [
          { name: 'provider', in: 'path', required: true, schema: { type: 'string', enum: ['beehiiv', 'resend', 'hubspot', 'custom'] } },
        ],
        responses: { '200': { description: 'OK' } },
      },
    },
  },
}

export function GET() {
  return NextResponse.json(OPENAPI, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
