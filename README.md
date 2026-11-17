# Bahama Flix (catálogo estático)

Catálogo de filmes e séries em HTML estático.

**Stack:** HTML · CSS · JavaScript · Netlify

**Documentação:**
- [Issue de organização](https://github.com/ClavioBahama/Bahamaflix/issues/2) — revisão e sugestões
- [PR #1 — sitemap](https://github.com/ClavioBahama/Bahamaflix/pull/1) — em aberto

---

## 0. Pré-requisitos

Navegador moderno (Chrome, Edge ou Firefox).
Opcional: Node.js (`npx serve`) ou Python para servir a pasta localmente.

## 1. Instalação e Execução

```powershell
npx serve .   # servir a pasta em `http://localhost:3000`
python -m http.server 8000   # alternativa sem Node.js — abrir `http://localhost:8000`
```

## 2. Estrutura do Projeto

```text
Bahamaflix/
├── index.html              # catálogo inicial
├── Filmes.html / Series.html / categorias...
├── <Título>.html           # centenas de páginas por filme/série
├── css/ · js/ · javascript/
├── movies/ · resenhas/     # conteúdo adicional
├── netlify.toml            # deploy
└── .htaccess               # configuração do Apache
```

## 3. Funcionalidades

- Catálogo com páginas HTML por título de filme/série.
- Páginas de categorias (Ação, Comédia, Drama, Terror etc.).
- Páginas institucionais: sobre, contato, FAQ, privacidade, termos e Cookies.
- Scripts auxiliares em `.ps1`, `.py` e `.js` para manutenção em massa.
- Deploy na Netlify.

## 4. Arquivos e pontos de entrada

- `index.html` — catálogo principal.
- `movie-template.html` — modelo para novas páginas.
- `netlify.toml` — configuração de deploy.

## 5. Segurança

Projeto estático: nenhuma credencial identificada no repositório.

## 6. Problemas Comuns

Abrir os arquivos com `file://` pode bloquear CSS/JS em alguns navegadores — use um servidor local.
Nomes de arquivos com acentos ou espaços precisam de codificação de URL.

## 7. Observações (organização)

> Revisão realizada em 17/11/2026 durante a padronização dos repositórios, inspirada no README do FreelaMZ.
- Catálogo estático com muitas páginas HTML nomeadas por título.
- Existe um PR aberto (#1, "sitemap") que remove `sitemap.xml` — revisar antes de mesclar.
- Sugestão: gerar o sitemap dinamicamente em vez de removê-lo.

## 8. Licença

Projeto pessoal/acadêmico. Verifique a licença de templates ou bibliotecas de terceiros antes de uso comercial.

