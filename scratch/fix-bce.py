import sys

def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('  </div>\n</section>\n\n{/*  TICKETS  */}', '  </div>\n  </div>\n</section>\n\n{/*  TICKETS  */}')
    c = c.replace('onclick=', 'onClick=')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)

fix_file('components/BceClient.jsx')
