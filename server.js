// SouBarcos API — busca e comparativo de preços
//
// Como a PA-API da Amazon exige 10 vendas/mês para liberar o acesso,
// por enquanto os produtos são cadastrados manualmente (via /admin.html)
// e guardados no banco (Supabase). Quando a API da Amazon liberar,
// dá pra automatizar a busca sem mudar a estrutura do site.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Envia um e-mail de aviso via API do Resend (HTTPS, não usa portas SMTP —
// funciona normalmente no plano gratuito do Render, que bloqueia SMTP direto).
// Nunca derruba a rota que chamou — só loga o erro, porque uma falha no
// e-mail não deve impedir a ação principal (salvar mensagem, etc).
async function enviarAviso({ para, assunto, texto }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('E-mail não enviado: RESEND_API_KEY não configurada.');
    return;
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SouBarcos <avisos@send.soubarcos.com>',
        to: [para],
        subject: assunto,
        text: texto,
      }),
    });
    if (!response.ok) {
      const erro = await response.text();
      console.error('Erro ao enviar e-mail (Resend):', erro);
    }
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error?.message || error);
  }
}

// Protege as rotas de escrita (adicionar/remover produto) com uma senha simples.
function checkAdmin(req, res, next) {
  const senha = req.headers['x-admin-password'];
  if (!ADMIN_PASSWORD || senha !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha de administrador inválida.' });
  }
  next();
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'soubarcos-api' });
});

// Busca uma prévia (título, imagem, preço) a partir do link do produto,
// para agilizar o cadastro no admin.html. Usa apenas informações públicas
// de "prévia de link" (mesmo mecanismo que gera preview no WhatsApp/Telegram).
// IMPORTANTE: isso não é a API oficial da Amazon — é uma tentativa best-effort,
// pode falhar ou vir incompleta, e por isso o admin.html sempre deixa
// os campos editáveis antes de salvar.
app.get('/api/preview', checkAdmin, async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'Informe o link do produto no parâmetro "url".' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      },
    });
    const html = await response.text();

    const getMeta = (property) => {
      const regex = new RegExp(
        `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
        'i'
      );
      const match = html.match(regex);
      return match ? match[1] : null;
    };

    const titulo = getMeta('og:title');
    const imagem = getMeta('og:image');
    const descricao = getMeta('og:description');

    // Preço é best-effort: a Amazon não expõe isso de forma padronizada
    // via meta tags, então tentamos alguns padrões comuns da página.
    let preco = null;
    const precoMatch =
      html.match(/class="a-price-whole">([\d.,]+)/) ||
      html.match(/"priceAmount":"([\d.,]+)"/);
    if (precoMatch) {
      preco = 'R$ ' + precoMatch[1].replace(/\.$/, '');
    }

    res.json({ titulo, imagem, preco, descricao });
  } catch (error) {
    console.error('Erro ao buscar prévia:', error?.message || error);
    res.status(502).json({
      error: 'Não foi possível buscar as informações desse link. Preencha manualmente.',
    });
  }
});

// Lista todos os produtos cadastrados — usado pela página pública do site
app.get('/api/products', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar produtos:', error.message);
    return res.status(500).json({ error: 'Não foi possível carregar os produtos.' });
  }

  res.json({ resultados: data });
});

// Lista as categorias já usadas, para preencher o dropdown do admin.html
app.get('/api/categorias', async (req, res) => {
  const { data, error } = await supabase.from('products').select('categoria');

  if (error) {
    return res.status(500).json({ error: 'Não foi possível carregar as categorias.' });
  }

  const categorias = [...new Set(data.map((p) => p.categoria).filter(Boolean))];
  res.json({ categorias });
});

// Recebe mensagens do formulário público (contato, seja associado, sugestão)
app.post('/api/messages', async (req, res) => {
  const { nome, email, categoria, mensagem } = req.body;

  if (!mensagem) {
    return res.status(400).json({ error: 'Escreva uma mensagem.' });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert([{ nome: nome || null, email: email || null, categoria: categoria || 'Suporte', mensagem }])
    .select();

  if (error) {
    console.error('Erro ao salvar mensagem:', error.message);
    return res.status(500).json({ error: 'Não foi possível enviar sua mensagem agora.' });
  }

  // Aviso por e-mail é best-effort — não bloqueia a resposta ao usuário
  enviarAviso({
    para: 'contato@soubarcos.com',
    assunto: `Nova mensagem (${categoria || 'Suporte'}) — SouBarcos`,
    texto: `Nome: ${nome || 'não informado'}\nE-mail: ${email || 'não informado'}\nCategoria: ${categoria || 'Suporte'}\n\nMensagem:\n${mensagem}`,
  });

  res.status(201).json({ ok: true });
});

// Lista as mensagens recebidas — usado no admin.html
app.get('/api/messages', checkAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Não foi possível carregar as mensagens.' });
  }

  res.json({ resultados: data });
});

// Marca uma mensagem como atendida
app.patch('/api/messages/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { atendida } = req.body;

  const { error } = await supabase.from('messages').update({ atendida }).eq('id', id);

  if (error) {
    return res.status(500).json({ error: 'Não foi possível atualizar a mensagem.' });
  }

  res.json({ ok: true });
});

// Adiciona um novo produto — usado pela página /admin.html
app.post('/api/products', checkAdmin, async (req, res) => {
  const { titulo, preco, link, imagem, loja, descricao, categoria } = req.body;

  if (!titulo || !preco || !link) {
    return res.status(400).json({ error: 'Título, preço e link são obrigatórios.' });
  }

  const { data, error } = await supabase
    .from('products')
    .insert([{ titulo, preco, link, imagem: imagem || null, loja: loja || 'Amazon', descricao: descricao || null, categoria: categoria || 'Geral' }])
    .select();

  if (error) {
    console.error('Erro ao salvar produto:', error.message);
    return res.status(500).json({ error: 'Não foi possível salvar o produto.' });
  }

  res.status(201).json({ produto: data[0] });
});

// Adiciona vários produtos de uma vez — usado pelo bookmarklet de categoria
app.post('/api/products/bulk', checkAdmin, async (req, res) => {
  const { categoria, produtos } = req.body;

  if (!Array.isArray(produtos) || produtos.length === 0) {
    return res.status(400).json({ error: 'Nenhum produto recebido.' });
  }

  const linhas = produtos
    .filter((p) => p.titulo && p.link)
    .map((p) => ({
      titulo: p.titulo,
      preco: p.preco || 'Preço não encontrado',
      link: p.link,
      imagem: p.imagem || null,
      loja: 'Amazon',
      categoria: categoria || 'Geral',
    }));

  if (linhas.length === 0) {
    return res.status(400).json({ error: 'Nenhum produto válido para salvar.' });
  }

  const { data, error } = await supabase.from('products').insert(linhas).select();

  if (error) {
    console.error('Erro ao salvar produtos em lote:', error.message);
    return res.status(500).json({ error: 'Não foi possível salvar os produtos.' });
  }

  res.status(201).json({ adicionados: data.length });
});

// Remove um produto — usado pela página /admin.html
app.delete('/api/products/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    console.error('Erro ao remover produto:', error.message);
    return res.status(500).json({ error: 'Não foi possível remover o produto.' });
  }

  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`SouBarcos API rodando na porta ${PORT}`);
});
