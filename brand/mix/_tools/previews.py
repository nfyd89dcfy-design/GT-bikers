import os,glob
from playwright.sync_api import sync_playwright
L=os.path.abspath('../logo'); os.makedirs(L+'/preview',exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium'); pg=b.new_page(device_scale_factor=2)
    for f in sorted(glob.glob(L+'/*.svg')):
        n=os.path.basename(f)[:-4]
        dark=('light' in n and 'mono' in n) or 'on-dark' in n
        bg='transparent'
        pg.set_viewport_size({'width':640,'height':420})
        pg.set_content(f'<body style="margin:0;display:grid;place-items:center;height:100vh;background:#fff"><img src="file://{f}" style="max-width:600px;max-height:380px"></body>')
        pg.wait_for_timeout(150)
        pg.screenshot(path=f'{L}/preview/{n}.png')
    b.close()
