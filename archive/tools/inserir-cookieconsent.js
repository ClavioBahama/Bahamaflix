// Script para inserir CookieConsent em todos os arquivos HTML do projeto
// Execute com Node.js na raiz do projeto

const fs = require('fs');
const path = require('path');

// Configurações
const link = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.css" />';
const script = '<script src="https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.js"></script>';

// Estatísticas
const stats = {
  processados: 0,
  atualizados: 0,
  ignorados: 0,
  erros: 0
};

function inserirEmHead(conteudo) {
  if (conteudo.includes(link)) return conteudo;
  
  try {
    if (/<head[^>]*>/i.test(conteudo)) {
      // Se existe <head>, insere logo após <head>
      return conteudo.replace(/(<head[^>]*>)/i, `$1\n    ${link}`);
    } else if (/<html[^>]*>/i.test(conteudo)) {
      // Se existe <html> mas não <head>, cria tag head
      return conteudo.replace(/(<html[^>]*>)/i, `$1\n  <head>\n    ${link}\n  </head>`);
    } else {
      // Se não existe nenhuma das tags, cria estrutura HTML básica
      return `<!DOCTYPE html>\n<html>\n  <head>\n    ${link}\n  </head>\n<body>\n${conteudo}\n</body>\n</html>`;
    }
  } catch (error) {
    console.error('Erro ao inserir no head:', error);
    return conteudo;
  }
}

function inserirAntesDeBodyClose(conteudo) {
  if (conteudo.includes(script)) return conteudo;
  
  try {
    if (/<\/body>/i.test(conteudo)) {
      // Se existe </body>, insere antes
      return conteudo.replace(/<\/body>/i, `    ${script}\n  </body>`);
    } else {
      // Se não existe </body>, insere no final
      return `${conteudo}\n${script}`;
    }
  } catch (error) {
    console.error('Erro ao inserir script:', error);
    return conteudo;
  }
}

function processarArquivo(arquivo) {
  try {
    console.log(`Processando: ${arquivo}`);
    stats.processados++;

    let conteudo = fs.readFileSync(arquivo, 'utf8');
    const original = conteudo;

    // Verifica se já tem ambos os elementos
    if (conteudo.includes(link) && conteudo.includes(script)) {
      console.log(`  ↳ Já possui cookie consent: ${arquivo}`);
      stats.ignorados++;
      return;
    }

    conteudo = inserirEmHead(conteudo);
    conteudo = inserirAntesDeBodyClose(conteudo);

    if (conteudo !== original) {
      fs.writeFileSync(arquivo, conteudo, 'utf8');
      console.log(`  ↳ Atualizado com sucesso: ${arquivo}`);
      stats.atualizados++;
    }
  } catch (error) {
    console.error(`  ↳ Erro ao processar ${arquivo}:`, error);
    stats.erros++;
  }
}

function buscarHtmls(diretorio) {
  try {
    fs.readdirSync(diretorio).forEach(nome => {
      const caminho = path.join(diretorio, nome);
      
      // Ignora node_modules e outros diretórios especiais
      if (nome === 'node_modules' || nome === '.git') {
        return;
      }

      if (fs.statSync(caminho).isDirectory()) {
        buscarHtmls(caminho);
      } else if (nome.toLowerCase().endsWith('.html')) {
        processarArquivo(caminho);
      }
    });
  } catch (error) {
    console.error(`Erro ao ler diretório ${diretorio}:`, error);
  }
}

console.log('Iniciando processamento de arquivos HTML...\n');

// Inicia o processamento a partir do diretório raiz do projeto
const diretorioRaiz = path.resolve(__dirname, '..');
buscarHtmls(diretorioRaiz);

// Exibe estatísticas
console.log('\nProcessamento finalizado!');
console.log('─────────────────────────');
console.log(`📊 Estatísticas:`);
console.log(`  ✓ Arquivos processados: ${stats.processados}`);
console.log(`  ✓ Arquivos atualizados: ${stats.atualizados}`);
console.log(`  ℹ Arquivos ignorados: ${stats.ignorados}`);
console.log(`  ⚠ Erros encontrados: ${stats.erros}`);
