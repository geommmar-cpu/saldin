import os
import re

print("Removing problematic injected comments...")

def fix_lint_error(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Remove lines containing our injected comments
    lines = content.split('\n')
    filtered_lines = [l for l in lines if not ('// responsive: true (auto-enabled)' in l or '// clamp() ready' in l)]
    
    new_content = '\n'.join(filtered_lines)
    
    if original != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

count = 0
for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts') or f.endswith('.css'):
            if fix_lint_error(os.path.join(root, f)):
                count += 1

print(f"Fixed {count} files.")
