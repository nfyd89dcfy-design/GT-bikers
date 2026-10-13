import sys, os, glob, re
from playwright.sync_api import sync_playwright
FONTDIR='/tmp/claude-0/fonts'
def font_css():
    css=''
    for fam,pkg,wts in [('Unbounded','unbounded',[300,400,500,600,700,800]),('Onest','onest',[300,400,500,600,700,800]),('JetBrains Mono','jetbrains-mono',[400,500,600,700])]:
        for wt in wts:
            for sub,rng in [('cyrillic','U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'),('latin','U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD')]:
                f=f'{FONTDIR}/fontsource-{pkg}-*/package/files/{pkg}-{sub}-{wt}-normal.woff2'
                m=glob.glob(f)
                if m: css+=f"@font-face{{font-family:'{fam}';font-weight:{wt};font-style:normal;src:url('file://{m[0]}') format('woff2');unicode-range:{rng};}}\n"
    return css
def browser(p):
    return p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
def page_with_fonts(b,w,h):
    ctx=b.new_context(viewport={'width':w,'height':h})
    pg=ctx.new_page()
    css=font_css()
    pg.route(re.compile(r'https://fonts\.(googleapis|gstatic)\.com/.*'),lambda r:r.fulfill(status=200,content_type='text/css',body=css))
    return pg
if __name__=='__main__':
    mode=sys.argv[1]
    with sync_playwright() as p:
        b=browser(p)
        if mode=='shot':
            url,out,w,h=sys.argv[2],sys.argv[3],int(sys.argv[4]),int(sys.argv[5])
            pg=page_with_fonts(b,w,h)
            pg.goto('file://'+os.path.abspath(url)); pg.wait_for_timeout(700)
            full = len(sys.argv)<7 or sys.argv[6]!='view'
            pg.screenshot(path=out,full_page=full)
            print('overflow-x:',pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth'))
        if mode=='tiles':
            url,pre,w,h,step=sys.argv[2],sys.argv[3],int(sys.argv[4]),int(sys.argv[5]),int(sys.argv[6])
            pg=page_with_fonts(b,w,h)
            pg.goto('file://'+os.path.abspath(url)); pg.wait_for_timeout(700)
            H=pg.evaluate('document.documentElement.scrollHeight'); i=0
            for y in range(0,H,step):
                pg.screenshot(path=f'{pre}-part{i:02d}.png',full_page=True,clip={'x':0,'y':y,'width':w,'height':min(step,H-y)}); i+=1
            print('tiles',i,'overflow-x:',pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth'))
        b.close()
