// Script para alterar texto em todos os arquivos HTML do projeto
const fs = require('fs');
const path = require('path');

// Estatísticas
const stats = {
  processados: 0,
  alterados: 0,
  erros: 0,
  arquivosAlterados: []
};

function alterarTexto(conteudo) {
  // Array de possíveis variações da palavra "Filtrar"
  const padroes = [
    /Filtrar/g,           // Exato
    /filtrar/g,           // Minúsculo
    /FILTRAR/g,           // Maiúsculo
    /"Filtrar"/g,         // Com aspas
    /'Filtrar'/g,         // Com aspas simples
    />Filtrar</g,         // Dentro de tags
    /\bFiltrar\b/g        // Palavra inteira
  ];

  let conteudoModificado = conteudo;
  let foiModificado = false;

  // Substitui todas as ocorrências
  for (const padrao of padroes) {
    if (padrao.test(conteudoModificado)) {
      conteudoModificado = conteudoModificado.replace(padrao, 'Ver Mais');
      foiModificado = true;
    }
  }

  return {
    conteudo: conteudoModificado,
    modificado: foiModificado
  };
}

function processarArquivo(arquivo) {
  try {
    console.log(`\nProcessando: ${arquivo}`);
    stats.processados++;

    let conteudo = fs.readFileSync(arquivo, 'utf8');
    const resultado = alterarTexto(conteudo);

    if (resultado.modificado) {
      fs.writeFileSync(arquivo, resultado.conteudo, 'utf8');
      console.log(`  ✓ Texto alterado com sucesso`);
      stats.alterados++;
      stats.arquivosAlterados.push(path.basename(arquivo));
    } else {
      console.log(`  ℹ Nenhuma ocorrência encontrada`);
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

console.log('Iniciando alteração de texto nos arquivos HTML...\n');

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