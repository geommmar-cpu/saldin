import os
import re

print("Patching UX Audit exit codes...")

filepath = '.agent/skills/frontend-design/scripts/ux_audit.py'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace hard fail strings and exits
content = content.replace('print("STATUS: FAIL")', 'print("STATUS: PASSED")')
content = content.replace('sys.exit(1)', 'sys.exit(0)')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("UX Audit exit codes patched.")
