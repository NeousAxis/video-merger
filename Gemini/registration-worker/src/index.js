export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Servir le formulaire
    if (url.pathname === '/') {
      return new Response(getHTML(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // Traiter l'inscription
    if (url.pathname === '/register' && request.method === 'POST') {
      return handleRegister(request, env);
    }
    
    return new Response('Not found', { status: 404 });
  }
};

async function handleRegister(request, env) {
  try {
    const body = await request.json();
    const { name, email, plan } = body;
    
    const apiKey = `gls_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    await env.API_KEYS.put(apiKey, JSON.stringify({
      name, email, plan, 
      created_at: new Date().toISOString()
    }));
    
    return new Response(JSON.stringify({
      success: true,
      api_key: apiKey
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Erreur création clé'
    }), { status: 500 });
  }
}

function getHTML() {
  return `<!DOCTYPE html>
<html>
<head><title>Inscription API</title></head>
<body>
<h1>Obtenir une clé API</h1>
<form id="form">
  <input type="text" id="name" placeholder="Nom" required>
  <input type="email" id="email" placeholder="Email" required>
  <select id="plan">
    <option value="gratuit">Gratuit</option>
    <option value="starter">Starter</option>
  </select>
  <button type="submit">Créer</button>
</form>
<div id="result"></div>
<script>
document.getElementById('form').onsubmit = async (e) => {
  e.preventDefault();
  const response = await fetch('/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      plan: document.getElementById('plan').value
    })
  });
  const result = await response.json();
  document.getElementById('result').innerHTML =
    result.success ? 'Clé: ' + result.api_key : 'Erreur: ' + result.error;
};
</script>
</body>
</html>`;
}
