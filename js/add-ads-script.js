const fs = require('fs');
const path = require('path');

function addAdsScript(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Adiciona o script no head
        if (!content.includes('pl26742415.profitableratecpm.com')) {
            content = content.replace(
                /<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-1278895213529416" crossorigin="anonymous"><\/script>/,
                `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1278895213529416" crossorigin="anonymous"></script>
    <script async="async" data-cfasync="false" src="//pl26742415.profitableratecpm.com/2a9dcac609e77d65882802826a4496c7/invoke.js"></script>`
            );
            
            // Adiciona os containers nos locais corretos
            content = content.replace(
                /<div class="ad-container-top my-3 text-center"><\/div>/,
                `<div class="ad-container-top my-3 text-center"><div id="container-2a9dcac609e77d65882802826a4496c7"></div></div>`
            );
            
            content = content.replace(
                /<div class="ad-container-sidebar sticky-top pt-3"><\/div>/,
                `<div class="ad-container-sidebar sticky-top pt-3"><div id="container-2a9dcac609e77d65882802826a4496c7"></div></div>`
            );
            
            content = content.replace(
                /<div class="ad-container-bottom my-3 text-center"><\/div>/,
                `<div class="ad-container-bottom my-3 text-center"><div id="container-2a9dcac609e77d65882802826a4496c7"></div></div>`
            );
            
            // Salva as alterações
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Script de anúncios adicionado em: ${filePath}`);
        } else {
            console.log(`Script de anúncios já existe em: ${filePath}`);
        }
        
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
            addAdsScript(filePath);
        }
    });
}

// Inicia o processamento a partir do diretório atual
const rootDirectory = process.cwd();
processDirectory(rootDirectory); 