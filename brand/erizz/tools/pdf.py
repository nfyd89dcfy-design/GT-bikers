from playwright.sync_api import sync_playwright
B="/home/claude/wt/brand-erizz/brand/erizz/brandbook/"
with sync_playwright() as p:
    b=p.chromium.launch(args=["--allow-file-access-from-files"]); pg=b.new_page(viewport={"width":1920,"height":1080})
    pg.goto("file://"+B+"index.html"); pg.wait_for_timeout(1500)
    pg.pdf(path=B+"E-Rizz-brandbook.pdf",width="1920px",height="1080px",print_background=True)
    b.close()
