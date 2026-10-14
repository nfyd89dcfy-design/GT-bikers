import sys,time
from playwright.sync_api import sync_playwright
O="/home/claude/wt/brand-erizz/brand/erizz/brandbook/img/"
t=time.time()
def L(m): print(round(time.time()-t,1),m,flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=b.new_page(viewport={"width":1440,"height":900})
    pg.goto("http://localhost:8791/",wait_until="commit"); pg.wait_for_timeout(2500); L("loaded")
    L(str(pg.evaluate("[...document.querySelectorAll('button')].map(b=>b.innerText.slice(0,30))")))
    pg.evaluate("[...document.querySelectorAll('button')].find(b=>/на ты/i.test(b.innerText))?.click()"); L("clicked")
    pg.wait_for_timeout(5000); L("waited")
    pg.screenshot(path=O+"hero.png",timeout=30000); L("hero")
    H=pg.evaluate("document.documentElement.scrollHeight"); L(H)
    for n,f in (("lineup",.22),("showroom",.62)):
        pg.evaluate(f"window.scrollTo(0,{int(H*f)})"); pg.wait_for_timeout(3500); pg.screenshot(path=O+n+".png",timeout=30000); L(n)
    b.close()
