// Script para adicionar containers de anúncios em arquivos HTML
const fs = require('fs');
const path = require('path');

// Função para adicionar containers de anúncios em um arquivo HTML
function addAdContainers(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Adiciona o container superior após o header
        content = content.replace(
            /<\/header>/,
            `</header>\n    <!-- Container de anúncio superior -->\n    <div class="ad-container-top my-3 text-center"></div>`
        );
        
        // Adiciona o container da sidebar antes do conteúdo principal
        content = content.replace(
            /<div class="container-fluid">/,
            `<div class="container-fluid">\n        <!-- Sidebar com anúncios -->\n        <div class="col-lg-3">\n            <div class="ad-container-sidebar sticky-top pt-3"></div>\n        </div>`
        );
        
        // Adiciona o container inferior antes do footer
        content = content.replace(
            /<footer/,
            `    <!-- Container de anúncio inferior -->\n    <div class="ad-container-bottom my-3 text-center"></div>\n\n    <footer`
        );
        
        // Adiciona os links para os arquivos CSS e JS necessários
        content = content.replace(
            /<link rel="stylesheet" href="css\/style.css">/,
            `<link rel="stylesheet" href="css/style.css">\n    <link rel="stylesheet" href="css/ads.css">`
        );
        
        content = content.replace(
            /<script src="javascript\/script.js"><\/script>/,
            `<script src="javascript/script.js"></script>\n    <script src="js/ads-manager.js"></script>`
        );
        
        // Salva as alterações
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Containers de anúncios adicionados em: ${filePath}`);
        
    } catch (error) {
        console.error(`Erro ao processar o arquivo ${filePath}:`, error);
    }
}

// Função para processar todos os arquivos HTML em um diretório
function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            processDirectory(filePath);
        } else if (file.endsWith('.html')) {
            addAdContainers(filePath);
        }
    });
}

// Inicia o processamento a partir do diretório atual
const rootDirectory = process.cwd();
processDirectory(rootDirectory); 