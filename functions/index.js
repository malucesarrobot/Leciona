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
   request.data: { system, messages:[{role,content}], maxTokens?, useWeb?, model?, tools? }
   retorno: { resposta: string, content: Block[], stop_reason: string }

   O parâmetro `tools` é opcional e passa direto pra API da Anthropic sem
   nenhum conhecimento do que cada ferramenta faz — de propósito: assim
   como o resto do Leciona, TODA a lógica de negócio (o que uma ferramenta
   faz de fato: criar compromisso, consultar agenda etc.) mora no cliente,
   nunca aqui. Esta função continua sendo só um proxy burro da API, agora
   também pra respostas com tool_use — quem decide o que fazer com uma
   chamada de ferramenta e quem chama esta função de novo pra continuar o
   loop é o index.html (ver assistenteLoop() / FERRAMENTAS_ASSISTENTE). */
exports.gerarComIA = onCall(
  { secrets: [ANTHROPIC_API_KEY], region: 'southamerica-east1', timeoutSeconds: 120, memory: '256MiB' },
  async (request) => {
    verificarAcesso(request);

    const { system, messages, maxTokens, useWeb, model, tools } = request.data || {};
    if (!system || !Array.isArray(messages) || !messages.length) {
      throw new HttpsError('invalid-argument', 'Requisição incompleta: faltam "system" ou "messages".');
    }

    const body = {
      model: model || 'claude-sonnet-4-6',
      max_tokens: maxTokens || 2500,
      system,
      messages,
    };
    const toolList = Array.isArray(tools) ? tools.slice() : [];
    if (useWeb) {
      toolList.push({ type: 'web_search_20250305', name: 'web_search', max_uses: 3 });
    }
    if (toolList.length) {
      body.tools = toolList;
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
        return { resposta, content: data.content || [], stop_reason: data.stop_reason || null };
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
