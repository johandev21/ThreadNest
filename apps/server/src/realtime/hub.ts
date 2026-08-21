import { Elysia } from 'elysia'

type Client = { ws: any; topics: Set<string> }

const clients = new Set<Client>()

function findClient(id: string): Client | undefined {
  for (const client of clients) if (client.ws.id === id) return client
  return undefined
}

export function publish(topic: string, event: string, payload: unknown): void {
  const message = JSON.stringify({ event, topic, payload })
  for (const client of clients) {
    if (!client.topics.has(topic)) continue
    try {
      if (client.ws.readyState === 1) client.ws.send(message)
    } catch {
      clients.delete(client)
    }
  }
}

export const realtimeRoutes = new Elysia({ name: 'realtime' }).ws('/realtime', {
  open(ws) {
    const raw = new URL(ws.data.request.url).searchParams.get('topics') ?? ''
    clients.add({ ws, topics: new Set(raw.split(',').filter(Boolean)) })
  },
  message(ws, raw) {
    const client = findClient(ws.id)
    if (!client) return
    let parsed: unknown = raw
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw)
      } catch {
        return
      }
    }
    if (!parsed || typeof parsed !== 'object') return
    const { action, topics } = parsed as { action?: unknown; topics?: unknown }
    if (!Array.isArray(topics)) return
    const names = topics.filter((topic): topic is string => typeof topic === 'string')
    if (action === 'subscribe') for (const topic of names) client.topics.add(topic)
    else if (action === 'unsubscribe') for (const topic of names) client.topics.delete(topic)
  },
  close(ws) {
    for (const client of clients) if (client.ws.id === ws.id) clients.delete(client)
  },
})
