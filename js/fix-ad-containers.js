const fs = require('fs');
const path = require('path');

function fixAdContainers(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove duplicações de containers
        content = content.replace(/<div class="ad-container-top my-3 text-center"><\/div>\s*<div class="ad-container-top my-3 text-center"><\/div>/g, 
            '<div class="ad-container-top my-3 text-center"></div>');
            
        content = content.replace(/<div class="ad-container-sidebar sticky-top pt-3"><\/div>\s*<div class="ad-container-sidebar sticky-top pt-3"><\/div>/g, 
            '<div class="ad-container-sidebar sticky-top pt-3"></div>');
            
        content = content.replace(/<div class="ad-container-bottom my-3 text-center"><\/div>\s*<div class="ad-container-bottom my-3 text-center"><\/div>/g, 
            '<div class="ad-container-bottom my-3 text-center"></div>');
        
        // Garante que os containers estejam nos lugares corretos
        if (!content.includes('ad-container-top')) {
            content = content.replace(/<\/header>/,
                `</header>\n    <!-- Container de anúncio superior -->\n    <div class="ad-container-top my-3 text-center"></div>`);
        }
        
        if (!content.includes('ad-container-sidebar')) {
            content = content.replace(/<div class="container-fluid">/,
                `<div class="container-fluid">\n        <!-- Sidebar com anúncios -->\n        <div class="col-lg-3">\n            <div class="ad-container-sidebar sticky-top pt-3"></div>\n        </div>`);
        }
        
        if (!content.includes('ad-container-bottom')) {
            content = content.replace(/<footer/,
                `    <!-- Container de anúncio inferior -->\n    <div class="ad-container-bottom my-3 text-center"></div>\n\n    <footer`);
        }
        
        // Garante que os arquivos CSS e JS necessários estejam presentes
        if (!content.includes('ads.css')) {
            content = content.replace(/<link rel="stylesheet" href="css\/style.css">/,
                `<link rel="stylesheet" href="css/style.css">\n    <link rel="stylesheet" href="css/ads.css">`);
        }
        
        if (!content.includes('ads-manager.js')) {
            content = content.replace(/<script src="javascript\/script.js"><\/script>/,
                `<script src="javascript/script.js"></script>\n    <script src="js/ads-manager.js"></script>`);
        }
        
        // Salva as alterações
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Containers de anúncios corrigidos em: ${filePath}`);
        
    } catch (error) {
        console.error(`Erro ao processar o arquivo ${filePath}:`, error);
    }
}

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            processDirectory(filePath);
        } else if (file.endsWith('.html')) {
            fixAdContainers(filePath);
        }
    });
}

// Inicia o processamento a partir do diretório atual
const rootDirectory = process.cwd();
processDirectory(rootDirectory); 