import os
import re

def update_html_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Verifica se o script já existe
        if 'javascript/script.js' not in content:
            # Encontra a posição do último script
            last_script_pos = content.rfind('</script>')
            
            if last_script_pos != -1:
                # Adiciona os scripts necessários
                new_scripts = '''
    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
    
    <!-- Nosso script -->
    <script src="javascript/script.js"></script>
    
    <!-- CookieConsent -->
    <script src="https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.js"></script>
'''
                new_content = content[:last_script_pos + 9] + new_scripts + content[last_script_pos + 9:]
                
                with open(file_path, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                print(f'Scripts atualizados com sucesso em: {file_path}')
            else:
                print(f'Não foi possível encontrar a tag </script> em: {file_path}')
        else:
            print(f'Os scripts já existem em: {file_path}')
            
    except Exception as e:
        print(f'Erro ao processar o arquivo {file_path}: {str(e)}')

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                update_html_file(file_path)

# Processa o diretório atual e todos os subdiretórios
process_directory('.') 