import { Router } from 'itty-router';

const router = Router();

// 1) Authentification par clé API
async function authenticate(request) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return new Response('Clé API manquante ou invalide', { status: 401 });
  }
  const token = auth.split(' ')[1];
  const plan = await TOKENS_KV.get(token);
  if (!plan) {
    return new Response('Clé API invalide', { status: 403 });
  }
  return token;
}

// 2) Comptage d’usage via Durable Object
async function recordUsage(token) {
  const id = USAGE_DO.idFromName(token);
  const obj = await USAGE_DO.get(id);
  await obj.fetch(new Request('https://usage/increment'));
}

// 3) Endpoint : récupérer un terme
router.get('/v1/terms/:id', async ({ params, request }) => {
  const authResult = await authenticate(request);
  if (authResult instanceof Response) return authResult;
  await recordUsage(authResult);
  const data = await GLOSSAIRE_KV.get(params.id);
  if (!data) return new Response('Terme non trouvé', { status: 404 });
  return new Response(data, { headers: { 'Content-Type': 'application/json' } });
});

// 4) Fallback pour les autres routes
router.all('*', () => new Response('Not found', { status: 404 }));

// Export du handler
export default {
  fetch: router.handle
};

// Durable Object : compteur d’usage
export class UsageCounter {
  constructor(state) {
    this.state = state;
  }
  async fetch() {
    let count = (await this.state.storage.get('count')) || 0;
    count++;
    await this.state.storage.put('count', count);
    return new Response(count.toString());
  }
}

// Exporte explicitement la classe pour Wrangler
export { UsageCounter };

