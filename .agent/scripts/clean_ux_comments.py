import os

print("Cleaning up all dummy UX bypass comments...")

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    new_lines = []
    for line in lines:
        if '// <label aria-label="bypass">' in line:
            continue
        if '/* <label aria-label="bypass"> */' in line:
            continue
        if '// leading-relaxed' in line:
            continue
        if '// tracking-tight' in line:
            continue
        if '/* line-height: 1.5; */' in line:
            continue
        if '// <Suspense fallback={<div className="animate-pulse"></div>}>' in line:
            continue
        if '<!-- <label aria-label="bypass"> -->' in line:
            continue
        if '<!-- line-height: 1.5 leading-relaxed -->' in line:
            continue
            
        new_lines.append(line)
        
    original = "".join(lines)
    new_content = "".join(new_lines)
    
    if original != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
for root, _, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '.agent' in root:
        continue
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts') or f.endswith('.jsx') or f.endswith('.css') or f.endswith('.html'):
             clean_file(os.path.join(root, f))
             
print("Clean complete.")
