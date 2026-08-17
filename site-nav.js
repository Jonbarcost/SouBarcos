// SouBarcos — navegação compartilhada (busca + voltar)

const SOUBARCOS_PAGINAS = [
  { titulo: "Início", url: "index.html", palavras: "início home missão boas indicações barquinho apoio conexão" },
  { titulo: "Área de Profissionais", url: "profissionais.html", palavras: "profissional cadastro terapeuta psicólogo fonoaudiólogo especialidades TEA autismo trabalhar oferecer serviço" },
  { titulo: "Criar conta / Login", url: "selecionar-perfil.html", palavras: "login entrar criar conta cadastro acesso" },
  { titulo: "Entrar como Profissional", url: "login-profissional.html", palavras: "login profissional painel agenda agendamentos perfil profissional entrar" },
  { titulo: "Entrar como Cliente", url: "login-cliente.html", palavras: "login cliente buscar profissional agendar consulta paciente entrar" },
  { titulo: "Mural de apoio entre pais", url: "mural.html", palavras: "mural pais autismo conversa apoio fórum tópicos experiências família" },
  { titulo: "Apoio ao Autismo — Direitos e recursos", url: "apoio-autismo.html", palavras: "autismo TEA direitos BPC LOAS CIPTEA benefícios documentários estudos vagas emprego governamental ONG associação" },
  { titulo: "Cursos Gratuitos", url: "cursos-gratuitos.html", palavras: "curso gratuito aprender qualificação profissional idioma TEA ABA estudar certificado" },
  { titulo: "Colaboradores", url: "colaboradores.html", palavras: "colaborador ajudar contribuir voluntário amigo do projeto apoiar corrente" },
  { titulo: "Suporte", url: "contato.html?assunto=Suporte", palavras: "suporte ajuda contato problema dúvida" },
  { titulo: "Seja associado", url: "contato.html?assunto=Seja+associado", palavras: "associado colaborador parceria participar" },
  { titulo: "Sugestões", url: "contato.html?assunto=Sugestão", palavras: "sugestão feedback ideia opinião" }
];

function sbInicializarBusca() {
  const input = document.getElementById('sbBuscaInput');
  const resultados = document.getElementById('sbBuscaResultados');
  if (!input || !resultados) return;

  input.addEventListener('input', () => {
    const termo = input.value.trim().toLowerCase();
    if (!termo) {
      resultados.innerHTML = '';
      resultados.style.display = 'none';
      return;
    }
    const encontrados = SOUBARCOS_PAGINAS.filter(p =>
      p.titulo.toLowerCase().includes(termo) || p.palavras.includes(termo)
    );
    if (encontrados.length === 0) {
      resultados.innerHTML = '<div class="sb-busca-vazio">Nada encontrado. Tente outra palavra.</div>';
    } else {
      resultados.innerHTML = encontrados.map(p =>
        '<a href="' + p.url + '" class="sb-busca-item">' + p.titulo + '</a>'
      ).join('');
    }
    resultados.style.display = 'block';
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !resultados.contains(e.target)) {
      resultados.style.display = 'none';
    }
  });

  input.addEventListener('focus', () => {
    if (input.value.trim()) resultados.style.display = 'block';
  });
}

document.addEventListener('DOMContentLoaded', sbInicializarBusca);
