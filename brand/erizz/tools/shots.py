from playwright.sync_api import sync_playwright
O="/home/claude/wt/brand-erizz/brand/erizz/brandbook/img/"
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
    pg=b.new_page(viewport={"width":1440,"height":900})
    pg.goto("http://localhost:8791/"); pg.wait_for_timeout(2500)
    pg.screenshot(path=O+"gate.png")
    btns=pg.locator("button")
    for i in range(btns.count()):
        t=btns.nth(i).inner_text().lower()
        if "на ты" in t: btns.nth(i).click(timeout=4000,force=True); break
    pg.wait_for_timeout(4000); pg.screenshot(path=O+"hero.png")
    H=pg.evaluate("document.documentElement.scrollHeight")
    for n,f in (("lineup",.22),("showroom",.62)):
        pg.mouse.wheel(0,0); pg.evaluate(f"window.scrollTo(0,{int(H*f)})"); pg.wait_for_timeout(3500); pg.screenshot(path=O+n+".png")
    b.close()
