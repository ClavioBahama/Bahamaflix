import os

# Código a ser adicionado
script_code = '''<script async="async" data-cfasync="false" src="//pl26742415.profitableratecpm.com/2a9dcac609e77d65882802826a4496c7/invoke.js"></script>
<div id="container-2a9dcac609e77d65882802826a4496c7"></div>'''

def add_script_to_html(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Verifica se o script já existe no arquivo
        if script_code not in content:
            # Encontra a posição do fechamento do body
            body_end_pos = content.find('</body>')
            
            if body_end_pos != -1:
                # Adiciona o script antes do fechamento do body
                new_content = content[:body_end_pos] + script_code + content[body_end_pos:]
                
                with open(file_path, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                print(f'Script adicionado com sucesso em: {file_path}')
            else:
                print(f'Não foi possível encontrar a tag </body> em: {file_path}')
        else:
            print(f'O script já existe em: {file_path}')
            
    except Exception as e:
        print(f'Erro ao processar o arquivo {file_path}: {str(e)}')

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                add_script_to_html(file_path)

# Processa o diretório atual e todos os subdiretórios
process_directory('.') 