const fs = require('fs');
const path = require('path');

const SCRIPTS = [
  "<script type='text/javascript' src='//pl26742386.profitableratecpm.com/55/0b/50/550b50e6d03ac93a807c12fafc884d89.js'></script>",
  "<script type='text/javascript' src='//www.profitableratecpm.com/huexcf8fte?key=17b7ff2b0406db4058d9a4f74cb2ea96'></script>"
];

function processDirectory(dir) {
  // Lista todos os arquivos e pastas do diretório
  fs.readdirSync(dir).forEach(item => {
    const fullPath = path.join(dir, item);
    
    // Se for um diretório, processa recursivamente
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    }
    // Se for um arquivo HTML, adiciona os scripts
    else if (item.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Adiciona cada script se ainda não estiver presente
      SCRIPTS.forEach(script => {
        if (!content.includes(script)) {
          content = content.replace(/<\/body>/i, script + '\n</body>');
          modified = true;
        }
      });
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Scripts adicionados em: ${fullPath}`);
      }
    }
  });
}

// Inicia o processamento a partir do diretório atual
processDirectory('.');
