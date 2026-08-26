// Função serverless de contato — Vercel / Netlify (formato Vercel Node.js).
// Recebe o POST do formulário do site e envia o e-mail para a Cristiana via Resend.
//
// Variáveis de ambiente necessárias (painel do host, NUNCA no código):
//   RESEND_API_KEY  chave da API do Resend
//   MAIL_TO         cr.ribeirorodrigues@gmail.com
//   MAIL_FROM       remetente de domínio verificado, ex: site@cristianaribeiro.com.br
//   ALLOWED_ORIGIN  (opcional) domínio do site, ex: https://cristianaribeiro.com.br

export default async function handler(req, res) {
  const origem = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origem);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const { RESEND_API_KEY, MAIL_TO, MAIL_FROM } = process.env;
  if (!RESEND_API_KEY || !MAIL_TO || !MAIL_FROM) {
    return res.status(500).json({ erro: 'Serviço de e-mail não configurado' });
  }

  let d = req.body;
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = {}; } }
  d = d || {};

  const nome = String(d.nome || '').trim();
  const telefone = String(d.telefone || '').trim();
  const email = String(d.email || '').trim();
  if (!nome) return res.status(400).json({ erro: 'Nome obrigatório' });
  if (!telefone && !email) return res.status(400).json({ erro: 'Informe telefone ou e-mail' });
  if (String(d.mensagem || '').length > 4000) return res.status(400).json({ erro: 'Mensagem muito longa' });
  if (String(d.armadilha || '').trim()) return res.status(200).json({ ok: true }); // honeypot

  const interesse = String(d.interesse || '—').trim();
  const imovel = String(d.imovel || '').trim();
  const mensagem = String(d.mensagem || '').trim();
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const linhas = [
    ['Nome', nome],
    ['WhatsApp', telefone],
    ['E-mail', email],
    ['Interesse', interesse],
    ['Imóvel', imovel],
    ['Origem', String(d.origem || '').trim()]
  ].filter(([, v]) => v);

  const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#241E19;line-height:1.6">
<p style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#6E6157;margin:0 0 14px">Contato pelo site</p>
<table style="border-collapse:collapse;margin-bottom:18px">
${linhas.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#6E6157">${esc(k)}</td><td style="padding:4px 0"><strong>${esc(v)}</strong></td></tr>`).join('')}
</table>
${mensagem ? `<p style="white-space:pre-wrap;margin:0;padding-top:14px;border-top:1px solid #EAE1D4">${esc(mensagem)}</p>` : ''}
</div>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [MAIL_TO],
        reply_to: email || undefined,
        subject: `Contato pelo site — ${nome}${imovel ? ` · ${imovel}` : ''}`,
        html
      })
    });
    if (!r.ok) {
      const detalhe = await r.text();
      console.error('Resend falhou:', r.status, detalhe);
      return res.status(502).json({ erro: 'Falha no envio' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Erro ao enviar:', e);
    return res.status(502).json({ erro: 'Falha no envio' });
  }
}
