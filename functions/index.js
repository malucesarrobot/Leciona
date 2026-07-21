/* Leciona — Cloud Functions
   Proxy da API Anthropic: a chave fica só aqui (Secret Manager), nunca no
   navegador. Padrão espelhado do projeto Iuris (chatComAssistente), sem o
   que é específico de lá (anexos, ferramentas de agenda, geração de docx).
*/
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

// E-mails autorizados a usar a IA do Leciona.
const EMAILS_AUTORIZADOS = ['prof.malufc@gmail.com', 'malu.cesar@gmail.com'];

function verificarAcesso(request) {
  if (!request.auth || !request.auth.token.email) {
    throw new HttpsError('unauthenticated', 'Faça login para usar a IA.');
  }
  const email = request.auth.token.email.toLowerCase();
  if (!EMAILS_AUTORIZADOS.map((e) => e.toLowerCase()).includes(email)) {
    throw new HttpsError('permission-denied', 'Este e-mail não tem acesso à IA do Leciona.');
  }
  return email;
}

/* Único endpoint pra todo uso de IA do Leciona (substitui os antigos
   callClaude/callClaudeWeb/callClaudeChat do cliente, que faziam fetch
   direto com a chave exposta no navegador).
   request.data: { system, messages:[{role,content}], maxTokens?, useWeb?, model? }
   retorno: { resposta: string } */
exports.gerarComIA = onCall(
  { secrets: [ANTHROPIC_API_KEY], region: 'southamerica-east1', timeoutSeconds: 120, memory: '256MiB' },
  async (request) => {
    verificarAcesso(request);

    const { system, messages, maxTokens, useWeb, model } = request.data || {};
    if (!system || !Array.isArray(messages) || !messages.length) {
      throw new HttpsError('invalid-argument', 'Requisição incompleta: faltam "system" ou "messages".');
    }

    const body = {
      model: model || 'claude-sonnet-4-6',
      max_tokens: maxTokens || 2500,
      system,
      messages,
    };
    if (useWeb) {
      body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }];
    }

    const key = ANTHROPIC_API_KEY.value();
    let ultimoErro = null;

    for (let tentativa = 0; tentativa <= 2; tentativa++) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(body),
        });

        if (res.status === 429 && tentativa < 2) {
          await new Promise((r) => setTimeout(r, 1500 * (tentativa + 1)));
          continue;
        }
        if (!res.ok) {
          const texto = await res.text();
          throw new Error('API ' + res.status + ': ' + texto.slice(0, 200));
        }

        const data = await res.json();
        const resposta = (data.content || [])
          .map((b) => (b.type === 'text' ? b.text || '' : ''))
          .join('\n')
          .trim();
        return { resposta };
      } catch (e) {
        ultimoErro = e;
        if (tentativa < 2 && /429|rate.limit|timeout/i.test(e.message || '')) {
          await new Promise((r) => setTimeout(r, 1500 * (tentativa + 1)));
          continue;
        }
        throw new HttpsError('internal', 'Erro ao consultar a IA: ' + (e.message || String(e)));
      }
    }

    throw new HttpsError('internal', 'Erro ao consultar a IA: ' + (ultimoErro && ultimoErro.message));
  }
);
