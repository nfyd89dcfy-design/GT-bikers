import sys,json
sys.path.insert(0,'/tmp/claude-0/-home-claude-gt-bikers/39987e8a-d449-5753-8a00-9672aeeac6ed/scratchpad')
from pw import *
B='/home/claude/wt/gritt/brand/gritt/'
with sync_playwright() as p:
    b=launch(p);pg=b.new_page(viewport={'width':6400,'height':6040})
    pg.goto('file://'+B+'board/index.html');pg.evaluate('document.fonts.ready');pg.wait_for_timeout(2500)
    print(pg.evaluate("[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family+f.unicodeRange.slice(0,6))"))
    pg.screenshot(path=B+'board/gritt-board.png')
    pg.pdf(path=B+'board/gritt-board.pdf',width='6400px',height='6040px',print_background=True,page_ranges='1')
    for f in json.load(open(B+'board/frames.json')):
        pg.locator('[id="'+f['id']+'"]').screenshot(path=B+f"board/frames/{f['id']}.png")
    pg2=b.new_page(viewport={'width':1123,'height':794});pg2.goto('file://'+B+'brandbook.html');pg2.wait_for_selector('body[data-ready]');pg2.wait_for_timeout(1500)
    pg2.pdf(path=B+'brandbook.pdf',width='297mm',height='210mm',print_background=True)
    b.close()
