// Script para adicionar aviso de cookies em todos os arquivos HTML do projeto
const fs = require('fs');
const path = require('path');

// Estatísticas
const stats = {
  processados: 0,
  alterados: 0,
  erros: 0,
  arquivosAlterados: []
};

// Conteúdo do CSS e Script dos cookies
const cookiesConteudo = {
  css: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.css" />',
  script: `
    <script src="https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.js"></script>
    <!-- CookieConsent Script -->
    <script>
    window.cookieconsent.initialise({
        "palette": {
            "popup": { "background": "#1a1a1a" },
            "button": { "background": "#dc3545", "text": "#ffffff" }
        },
        "theme": "classic",
        "position": "bottom-right",
        "content": {
            "message": "Este site usa cookies para melhorar sua experiência e exibir anúncios personalizados.",
            "dismiss": "Entendi",
            "link": "Saiba mais",
            "href": "privacidade.html"
        }
    });
    </script>
    
    <!-- Estilo personalizado para o aviso de cookies -->
    <style>
    .cc-window {
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        border-radius: 8px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .cc-btn {
        border-radius: 4px;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.9em;
        transition: all 0.3s ease;
    }
    
    .cc-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    .cc-message {
        font-size: 0.95em;
        line-height: 1.4;
    }
    
    .cc-link {
        text-decoration: underline;
        opacity: 0.8;
        transition: opacity 0.3s ease;
    }
    
    .cc-link:hover {
        opacity: 1;
    }
    </style>`
};

function adicionarCookies(conteudo) {
  try {
    let conteudoModificado = conteudo;
    let foiModificado = false;

    // Verifica se já tem o aviso de cookies
    if (!conteudo.includes('cookieconsent.min.css') && !conteudo.includes('cookieconsent.min.js')) {
      // Adiciona CSS no head
      if (conteudoModificado.includes('</head>')) {
        conteudoModificado = conteudoModificado.replace('</head>', `${cookiesConteudo.css}\n</head>`);
      }

      // Adiciona Script antes do </body>
      if (conteudoModificado.includes('</body>')) {
        conteudoModificado = conteudoModificado.replace('</body>', `${cookiesConteudo.script}\n</body>`);
      }

      foiModificado = true;
    }

    return {
      conteudo: conteudoModificado,
      modificado: foiModificado
    };
  } catch (error) {
    console.error('Erro ao adicionar cookies:', error);
    return {
      conteudo: conteudo,
      modificado: false
    };
  }
}

function processarArquivo(arquivo) {
  try {
    console.log(`\nProcessando: ${arquivo}`);
    stats.processados++;

    let conteudo = fs.readFileSync(arquivo, 'utf8');
    const resultado = adicionarCookies(conteudo);

    if (resultado.modificado) {
      fs.writeFileSync(arquivo, resultado.conteudo, 'utf8');
      console.log(`  ✓ Aviso de cookies adicionado com sucesso`);
      stats.alterados++;
      stats.arquivosAlterados.push(path.basename(arquivo));
    } else {
      console.log(`  ℹ Arquivo já possui aviso de cookies`);
    }
  } catch (error) {
    console.error(`  ❌ Erro ao processar ${arquivo}:`, error);
    stats.erros++;
  }
}

function buscarArquivos(diretorio) {
  try {
    fs.readdirSync(diretorio).forEach(nome => {
      const caminho = path.join(diretorio, nome);
      
      // Ignora node_modules e outros diretórios especiais
      if (nome === 'node_modules' || nome === '.git') {
        return;
      }

      if (fs.statSync(caminho).isDirectory()) {
        buscarArquivos(caminho);
      } else if (nome.toLowerCase().endsWith('.html')) {
        processarArquivo(caminho);
      }
    });
  } catch (error) {
    console.error(`Erro ao ler diretório ${diretorio}:`, error);
  }
}

console.log('Iniciando adição de aviso de cookies nos arquivos HTML...\n');

// Inicia o processamento a partir do diretório raiz do projeto
const diretorioRaiz = path.resolve(__dirname, '.');
buscarArquivos(diretorioRaiz);

// Exibe estatísticas
console.log('\nProcessamento finalizado!');
console.log('─────────────────────────');
console.log(`📊 Estatísticas:`);
console.log(`  ✓ Arquivos processados: ${stats.processados}`);
console.log(`  ✓ Arquivos alterados: ${stats.alterados}`);
console.log(`  ⚠ Erros encontrados: ${stats.erros}`);

if (stats.arquivosAlterados.length > 0) {
  console.log('\n📄 Arquivos modificados:');
  stats.arquivosAlterados.forEach(arquivo => {
    console.log(`  • ${arquivo}`);
  });
} 