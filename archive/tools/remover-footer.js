// Script para remover footers de todos os arquivos HTML do projeto
// Execute com Node.js na raiz do projeto

const fs = require('fs');
const path = require('path');

// Estatísticas
const stats = {
  processados: 0,
  atualizados: 0,
  semFooter: 0,
  erros: 0
};

function removerFooter(conteudo) {
  try {
    // Procura por diferentes padrões de footer
    const padroes = [
      /<footer[^>]*>[\s\S]*?<\/footer>/i,  // Tag footer padrão
      /<div[^>]*class="[^"]*footer[^"]*"[^>]*>[\s\S]*?<\/div>/i,  // Div com classe footer
      /<div[^>]*id="[^"]*footer[^"]*"[^>]*>[\s\S]*?<\/div>/i      // Div com id footer
    ];

    let conteudoModificado = conteudo;
    let foiModificado = false;

    for (const padrao of padroes) {
      if (padrao.test(conteudoModificado)) {
        conteudoModificado = conteudoModificado.replace(padrao, '');
        foiModificado = true;
      }
    }

    // Remove linhas vazias extras que podem ter ficado
    if (foiModificado) {
      conteudoModificado = conteudoModificado
        .replace(/(\n\s*\n\s*\n)/g, '\n\n')  // Remove múltiplas linhas vazias
        .replace(/\s+$/g, '\n');              // Garante apenas uma quebra de linha no final
    }

    return {
      conteudo: conteudoModificado,
      modificado: foiModificado
    };
  } catch (error) {
    console.error('Erro ao remover footer:', error);
    return {
      conteudo: conteudo,
      modificado: false
    };
  }
}

function processarArquivo(arquivo) {
  try {
    console.log(`Processando: ${arquivo}`);
    stats.processados++;

    let conteudo = fs.readFileSync(arquivo, 'utf8');
    const resultado = removerFooter(conteudo);

    if (resultado.modificado) {
      fs.writeFileSync(arquivo, resultado.conteudo, 'utf8');
      console.log(`  ↳ Footer removido com sucesso: ${arquivo}`);
      stats.atualizados++;
    } else {
      console.log(`  ↳ Nenhum footer encontrado: ${arquivo}`);
      stats.semFooter++;
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

console.log('Iniciando remoção de footers dos arquivos HTML...\n');

// Inicia o processamento a partir do diretório raiz do projeto
const diretorioRaiz = path.resolve(__dirname, '..');
buscarHtmls(diretorioRaiz);

// Exibe estatísticas
console.log('\nProcessamento finalizado!');
console.log('─────────────────────────');
console.log(`📊 Estatísticas:`);
console.log(`  ✓ Arquivos processados: ${stats.processados}`);
console.log(`  ✓ Footers removidos: ${stats.atualizados}`);
console.log(`  ℹ Arquivos sem footer: ${stats.semFooter}`);
console.log(`  ⚠ Erros encontrados: ${stats.erros}`); 