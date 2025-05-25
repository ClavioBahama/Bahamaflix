# Script para adicionar ads-manager.js em todos os arquivos HTML
$files = Get-ChildItem -Path . -Filter *.html -Recurse
$scriptTag = '    <script src="js/ads-manager.js"></script>'

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Encoding UTF8
    
    # Verifica se o script já está incluído
    if ($content -notmatch 'ads-manager.js') {
        # Encontra a última tag script antes do </body>
        $lastScriptIndex = [array]::IndexOf($content, ($content -match '</script>' | Select-Object -Last 1))
        
        if ($lastScriptIndex -ge 0) {
            # Insere o novo script após o último script existente
            $content = $content[0..$lastScriptIndex] + $scriptTag + $content[($lastScriptIndex + 1)..($content.Length - 1)]
            
            # Salva o arquivo com a nova tag
            $content | Set-Content $file.FullName -Encoding UTF8
            Write-Host "Adicionado ads-manager.js em $($file.Name)"
        }
    } else {
        Write-Host "ads-manager.js já existe em $($file.Name)"
    }
} 