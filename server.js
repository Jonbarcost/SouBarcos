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

// Adiciona um novo produto — usado pela página /admin.html
app.post('/api/products', checkAdmin, async (req, res) => {
  const { titulo, preco, link, imagem, loja, descricao } = req.body;

  if (!titulo || !preco || !link) {
    return res.status(400).json({ error: 'Título, preço e link são obrigatórios.' });
  }

  const { data, error } = await supabase
    .from('products')
    .insert([{ titulo, preco, link, imagem: imagem || null, loja: loja || 'Amazon', descricao: descricao || null }])
    .select();

  if (error) {
    console.error('Erro ao salvar produto:', error.message);
    return res.status(500).json({ error: 'Não foi possível salvar o produto.' });
  }

  res.status(201).json({ produto: data[0] });
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
