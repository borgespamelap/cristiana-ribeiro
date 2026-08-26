# Envio de e-mail do formulário — passos de configuração

O site já faz `POST /api/contato` com JSON e só mostra "Mensagem enviada" quando a resposta é `200 { ok: true }`. Qualquer falha exibe erro e mantém os dados no formulário.

## 1. Provedor de e-mail

Criar conta no **Resend** (resend.com), verificar o domínio de envio e gerar uma API key.
Sem domínio próprio ainda: usar o remetente de teste do Resend (`onboarding@resend.dev`) — funciona, mas cai em spam com mais facilidade.

## 2. Hospedagem

Subir o projeto na **Vercel** (ou Netlify). O arquivo `api/contato.js` é reconhecido automaticamente como função serverless na Vercel — nada a configurar em rotas.

Na Netlify, mover o arquivo para `netlify/functions/contato.js` e apontar `ENVIO.endpoint` para `/.netlify/functions/contato`.

## 3. Variáveis de ambiente

No painel do host (Vercel: Settings → Environment Variables):

| Variável | Valor |
|---|---|
| `RESEND_API_KEY` | a chave gerada no passo 1 |
| `MAIL_TO` | cr.ribeirorodrigues@gmail.com |
| `MAIL_FROM` | site@seudominio.com.br (domínio verificado) |
| `ALLOWED_ORIGIN` | https://seudominio.com.br (opcional, restringe quem pode postar) |

Definir para Production e Preview. Nunca colocar a chave no código.

## 4. Teste

Publicar e enviar um formulário de verdade. Se o e-mail não chegar, ver os logs da função no painel do host — as falhas do Resend são registradas com status e detalhe.

## Notas

- O campo `reply_to` recebe o e-mail do visitante, então basta responder ao e-mail.
- Há um honeypot (`armadilha`) já aceito pela função, caso queira adicionar spam-trap ao formulário depois.
- Trocar de provedor (SendGrid, Postmark, SMTP) exige mudar apenas o bloco `fetch` dentro de `api/contato.js`.
