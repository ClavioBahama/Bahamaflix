import os
import re

def remove_conflicts(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Remove as linhas de conflito do Git
        pattern_conflict = r'>>>>>>> [a-f0-9]{40}'
        pattern_equal = r'^=======$'
        pattern_head = r'<<<<<<< HEAD'
        new_content = re.sub(pattern_conflict, '', content, flags=re.MULTILINE)
        new_content = re.sub(pattern_equal, '', new_content, flags=re.MULTILINE)
        new_content = re.sub(pattern_head, '', new_content, flags=re.MULTILINE)
        
        # Remove linhas em branco extras
        new_content = re.sub(r'\n\s*\n\s*\n', '\n\n', new_content)
        
        if content != new_content:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f'Conflitos removidos com sucesso em: {file_path}')
        else:
            print(f'Nenhum conflito encontrado em: {file_path}')
            
    except Exception as e:
        print(f'Erro ao processar o arquivo {file_path}: {str(e)}')

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                remove_conflicts(file_path)

# Processa o diretório atual e todos os subdiretórios
process_directory('.') 