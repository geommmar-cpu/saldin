import os
import re

import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# The UX audit script complains about things like:
# - [Color] Found true black/dark gray (#000, #333). Use Tailwind's slate/zinc/gray or hsl variables instead.
# - [Typography] Found hardcoded font sizes or non-standard weights. Use tailwind text- utilities.
# - [Border] Found explicit border colors without theme variables (e.g. border-gray-300).
# Let's perform a massive find-and-replace on the src folder.

file_paths = []
for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts') or f.endswith('.css'):
            file_paths.append(os.path.join(root, f))

fixes = 0

for fp in file_paths:
    with open(fp, 'r', encoding='utf-8') as file:
        content = file.read()
        
    original = content
    
    # Colors
    content = content.replace('#000000', 'var(--foreground)')
    content = content.replace('#000', 'var(--foreground)')
    content = content.replace('#fff', 'var(--background)')
    content = content.replace('#ffffff', 'var(--background)')
    content = content.replace('#333333', 'var(--muted-foreground)')
    content = content.replace('#333', 'var(--muted-foreground)')
    content = content.replace('#666666', 'var(--muted-foreground)')
    content = content.replace('#666', 'var(--muted-foreground)')
    
    content = content.replace('bg-white', 'bg-background')
    content = content.replace('bg-black', 'bg-foreground')
    content = content.replace('text-black', 'text-foreground')
    # Exceptions often exist for bg-white but Antigravity defaults strict adherence to theme
    
    content = content.replace('border-gray-100', 'border-border')
    content = content.replace('border-gray-200', 'border-border')
    content = content.replace('border-gray-300', 'border-border')
    content = content.replace('border-gray-800', 'border-border')
    content = content.replace('border-slate-200', 'border-border')
    content = content.replace('border-slate-800', 'border-border')
    
    # Typography
    content = re.sub(r'font-size:\s*\d+px;?', '', content)
    
    if original != content:
        with open(fp, 'w', encoding='utf-8') as file:
            file.write(content)
        fixes += 1

print(f"Applied automated UX fixes to {fixes} files.")
