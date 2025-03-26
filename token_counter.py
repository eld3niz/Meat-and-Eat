import os
import re
import tiktoken
from collections import defaultdict

# Encoder für GPT-Tokenisierung
encoder = tiktoken.get_encoding("cl100k_base")  # Das ist der Encoder für GPT-4 und einige GPT-3.5 Modelle

# Dateitypen, die analysiert werden sollen
TEXT_EXTENSIONS = {
    '.ts', '.tsx', '.js', '.jsx', '.md', '.txt', '.json', '.html', '.css', 
    '.scss', '.py', '.sh', '.yaml', '.yml'
}

# Verzeichnisse, die ignoriert werden sollen
IGNORE_DIRS = {
    'node_modules', '.git', '.next', 'dist', 'build', '.vscode'
}

def count_tokens_in_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            tokens = encoder.encode(content)
            return len(tokens)
    except Exception as e:
        print(f"Fehler beim Lesen von {file_path}: {e}")
        return 0

def get_extension(file_path):
    _, ext = os.path.splitext(file_path)
    return ext.lower()

def scan_directory(directory):
    token_counts = defaultdict(int)
    file_counts = defaultdict(int)
    
    for root, dirs, files in os.walk(directory):
        # Ignoriere bestimmte Verzeichnisse
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            file_path = os.path.join(root, file)
            ext = get_extension(file_path)
            
            if ext in TEXT_EXTENSIONS:
                tokens = count_tokens_in_file(file_path)
                token_counts[ext] += tokens
                file_counts[ext] += 1
                # Ausgabe für jede Datei
                relative_path = os.path.relpath(file_path, directory)
                print(f"{relative_path}: {tokens} Tokens")
    
    return token_counts, file_counts

def main():
    # Das aktuelle Verzeichnis (Repository-Wurzel)
    repo_dir = os.getcwd()
    
    print("Zähle Tokens im Repository...\n")
    token_counts, file_counts = scan_directory(repo_dir)
    
    # Ergebnisse sortieren und ausgeben
    total_tokens = sum(token_counts.values())
    total_files = sum(file_counts.values())
    
    print("\n=== Token-Zusammenfassung nach Dateityp ===")
    sorted_exts = sorted(token_counts.keys(), key=lambda x: token_counts[x], reverse=True)
    
    for ext in sorted_exts:
        print(f"{ext}: {token_counts[ext]} Tokens in {file_counts[ext]} Dateien")
    
    print("\n=== Gesamtergebnis ===")
    print(f"Insgesamt: {total_tokens} Tokens in {total_files} Dateien")
    print(f"Ungefähre Kosten bei Verwendung mit GPT-4: ${(total_tokens / 1000) * 0.03:.2f} USD (Input-Kosten)")

if __name__ == "__main__":
    main()
