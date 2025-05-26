// Script para adicionar ou atualizar footers em todos os arquivos HTML do projeto
// Execute com Node.js na raiz do projeto

const fs = require('fs');
const path = require('path');

// Estatísticas
const stats = {
  processados: 0,
  atualizados: 0,
  adicionados: 0,
  erros: 0
};

const novoConteudo = `
    <!-- Footer -->
    <footer class="bg-dark text-light py-4 mt-5">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-4 mb-4 mb-md-0 text-center">
                    <h5 class="mb-3">Contato</h5>
                    <p class="mb-1">
                        <a href="mailto:claviochitsulete@icloud.com" class="text-light text-decoration-none">
                            <i class="fas fa-envelope me-2"></i>claviochitsulete@icloud.com
                        </a>
                    </p>
                    <p>
                        <a href="tel:+25883384656" class="text-light text-decoration-none">
                            <i class="fas fa-phone me-2"></i>(+258) 83 384 6565
                        </a>
                    </p>
                </div>
                
                <div class="col-md-4 mb-4 mb-md-0 text-center">
                    <h5 class="mb-3">Redes Sociais</h5>
                    <div class="social-links">
                        <a href="https://www.facebook.com/ranilde.paulo?mibextid=LQQJ4d" class="text-light mx-2" target="_blank">
                            <i class="fab fa-facebook-f fa-lg"></i>
                        </a>
                        <a href="https://www.instagram.com/claviochitsulete?igsh=N2hvOWE0aWQyanht&utm_source=qr" class="text-light mx-2" target="_blank">
                            <i class="fab fa-instagram fa-lg"></i>
                        </a>
                        <a href="https://wa.me/258847944630" class="text-light mx-2" target="_blank">
                            <i class="fab fa-whatsapp fa-lg"></i>
                        </a>
                    </div>
                </div>

                <div class="col-md-4 text-center">
                    <h5 class="mb-3">Links Úteis</h5>
                    <p class="mb-1">
                        <a href="privacidade.html" class="text-light text-decoration-none">Política de Privacidade</a>
                    </p>
                    <p>
                        <a href="termos.html" class="text-light text-decoration-none">Termos de Uso</a>
                    </p>
                </div>
            </div>

            <hr class="my-4 bg-secondary">
            
            <div class="row">
                <div class="col text-center">
                    <p class="mb-0 text-muted">© 2025 Bahama Flix. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    </footer>

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

    <!-- Adiciona hover effect nos links do footer -->
    <style>
    footer a:hover {
        opacity: 0.8;
        transition: opacity 0.3s ease;
    }
    
    footer .social-links a {
        display: inline-block;
        width: 35px;
        height: 35px;
        line-height: 35px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
    }
    
    footer .social-links a:hover {
        background-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-3px);
    }
    </style>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;

function atualizarFooter(conteudo) {
  try {
    // Procura por diferentes padrões de footer e scripts
    const padroes = [
      /<footer[^>]*>[\s\S]*?<\/footer>[\s\S]*?<\/body>/i,  // Footer até o fim do body
      /<div[^>]*class="[^"]*footer[^"]*"[^>]*>[\s\S]*?<\/body>/i,  // Div footer até o fim do body
      /<div[^>]*id="[^"]*footer[^"]*"[^>]*>[\s\S]*?<\/body>/i      // Div com id footer até o fim do body
    ];

    let conteudoModificado = conteudo;
    let footerEncontrado = false;

    // Verifica se já existe algum footer
    for (const padrao of padroes) {
      if (padrao.test(conteudoModificado)) {
        // Substitui todo o conteúdo do footer até o fim do body
        conteudoModificado = conteudoModificado.replace(/<footer[\s\S]*?<\/body>/i, novoConteudo);
        footerEncontrado = true;
        break;
      }
    }

    // Se não encontrou footer, adiciona antes do </body>
    if (!footerEncontrado) {
      // Remove </body></html> existente e adiciona novo conteúdo
      conteudoModificado = conteudoModificado
        .replace(/<\/body>[\s\S]*?<\/html>/i, '')
        .trim() + novoConteudo;
    }

    return {
      conteudo: conteudoModificado,
      modificado: true,
      footerExistente: footerEncontrado
    };
  } catch (error) {
    console.error('Erro ao atualizar footer:', error);
    return {
      conteudo: conteudo,
      modificado: false,
      footerExistente: false
    };
  }
}

function processarArquivo(arquivo) {
  try {
    console.log(`Processando: ${arquivo}`);
    stats.processados++;

    let conteudo = fs.readFileSync(arquivo, 'utf8');
    const resultado = atualizarFooter(conteudo);

    if (resultado.modificado) {
      fs.writeFileSync(arquivo, resultado.conteudo, 'utf8');
      if (resultado.footerExistente) {
        console.log(`  ↳ Footer atualizado com sucesso: ${arquivo}`);
        stats.atualizados++;
      } else {
        console.log(`  ↳ Footer adicionado com sucesso: ${arquivo}`);
        stats.adicionados++;
      }
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

console.log('Iniciando atualização de footers dos arquivos HTML...\n');

// Inicia o processamento a partir do diretório raiz do projeto
const diretorioRaiz = path.resolve(__dirname, '..');
buscarHtmls(diretorioRaiz);

// Exibe estatísticas
console.log('\nProcessamento finalizado!');
console.log('─────────────────────────');
console.log(`📊 Estatísticas:`);
console.log(`  ✓ Arquivos processados: ${stats.processados}`);
console.log(`  ✓ Footers atualizados: ${stats.atualizados}`);
console.log(`  ✓ Footers adicionados: ${stats.adicionados}`);
console.log(`  ⚠ Erros encontrados: ${stats.erros}`); 