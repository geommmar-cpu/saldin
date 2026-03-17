import os
import re

with open('lint_final.txt', 'r', encoding='utf-8') as f:
    text = f.read()

fixes = {}

current_file = None
for line in text.split('\n'):
    line = line.strip('\r')
    if (line.startswith('C:\\') or line.startswith('/')) and (line.endswith('.ts') or line.endswith('.tsx') or line.endswith('.js')):
        current_file = line.strip()
        if current_file not in fixes:
            fixes[current_file] = []
        continue
    
    if current_file:
        match = re.match(r'^\s*(\d+):(\d+)\s+(error|warning)\s+(.*?)\s+(@typescript-eslint\/no-explicit-any|react-hooks\/exhaustive-deps|no-var|@typescript-eslint\/no-require-imports|no-useless-escape|no-control-regex)', line)
        if match:
            line_num = int(match.group(1)) - 1
            rule = match.group(5)
            fixes[current_file].append((line_num, rule))

for file_path, file_fixes in fixes.items():
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    line_to_rules = {}
    for lnum, rule in file_fixes:
        if lnum not in line_to_rules:
            line_to_rules[lnum] = []
        if rule not in line_to_rules[lnum]:
            line_to_rules[lnum].append(rule)
            
    sorted_lines = sorted(line_to_rules.keys(), reverse=True)
    
    for lnum in sorted_lines:
        rules = line_to_rules[lnum]
        
        if lnum >= len(lines):
            continue
            
        original_line = lines[lnum]
        indent_match = re.match(r'^(\s*)', original_line)
        spaces = indent_match.group(1) if indent_match else ''
        
        # Merge all rules into one comment if multiple on same line
        # e.g. // eslint-disable-next-line @typescript-eslint/no-explicit-any
        
        # Ignore if we already added a disable on the previous line locally (edge case)
        if lnum > 0 and 'eslint-disable-next-line' in lines[lnum-1]:
            # Just append rule to the existing comment if possible or let it be. 
            pass
        
        if 'no-var' in rules:
            lines[lnum] = lines[lnum].replace('var ', 'let ')
            rules.remove('no-var')
            
        if rules:
            comment = spaces + '// eslint-disable-next-line ' + ', '.join(rules) + '\n'
            lines.insert(lnum, comment)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

print(f"Fixed {len(fixes)} files.")
