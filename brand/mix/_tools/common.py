import re,os,json,sys
sys.path.insert(0,os.path.dirname(__file__))
import art
BASE=os.path.join(os.path.dirname(__file__),'..')
def svgfile(name,fill=None,strip_bg=True,cls=''):
    s=open(os.path.join(BASE,'logo',name),encoding='utf-8').read()
    s=re.sub(r'\swidth="\d+"\sheight="\d+"','',s,count=1)
    s=re.sub(r'<title>.*?</title>','',s)
    if strip_bg: s=re.sub(r'<rect width="\d+" height="\d+"( rx="\d+")? fill="#[0-9A-Fa-f]{6}"/>','',s) if 'app-icon' not in name and 'favicon' not in name else s
    if fill: s=re.sub(r'(<path[^>]*?) fill="#[0-9A-Fa-f]{6}"',lambda m:m.group(1)+f' fill="{fill}"',s)
    if cls: s=s.replace('<svg ',f'<svg class="{cls}" ',1)
    return s
ICONS={
 'ebike':'<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16 L10 8 H15 L18 16 M10 8 L12 16 H6"/>',
 'atv':'<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M3 14 L7 9 H16 L21 14 M10 9 V6 H14"/>',
 'utv':'<path d="M3 15 H21 V11 L18 7 H8 L5 11 Z"/><circle cx="7" cy="17" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
 'snow':'<path d="M3 18 H18 L21 15 M6 18 V12 L12 9 H17 L19 13 H9"/><path d="M8 21 H17"/>',
 'battery':'<rect x="3" y="7" width="16" height="10"/><path d="M21 10 V14 M12 9 L9 12.5 H13 L10.5 15.5"/>',
 'motor':'<circle cx="12" cy="12" r="4"/><path d="M12 3 V6 M12 18 V21 M3 12 H6 M18 12 H21 M5.6 5.6 L7.8 7.8 M16.2 16.2 L18.4 18.4 M18.4 5.6 L16.2 7.8 M7.8 16.2 L5.6 18.4"/>',
 'range':'<path d="M3 20 H21 M5 20 V15 M10 20 V12 M15 20 V8 M20 20 V4"/>',
 'test':'<circle cx="12" cy="12" r="9"/><path d="M10 8 L16 12 L10 16 Z"/>',
 'pin':'<path d="M12 21 C6 14 5 11 5 9 A7 7 0 0 1 19 9 C19 11 18 14 12 21 Z"/><circle cx="12" cy="9" r="2.5"/>',
 'delivery':'<path d="M2 16 V7 H14 V16 M14 10 H18 L21 13 V16 H2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
 'service':'<path d="M15 4 A4.5 4.5 0 0 0 19 9.5 L9 19.5 A2.2 2.2 0 0 1 5 15.5 L14.5 6 Z"/>',
 'compare':'<path d="M8 4 V20 M16 4 V20 M3 8 H12 M12 15 H21"/>',
 'quiz':'<circle cx="12" cy="12" r="9"/><path d="M9 9.5 A3 3 0 1 1 12.5 12.4 V14 M12 17 V17.6"/>',
 'custom':'<path d="M3 8 H21 M3 16 H21"/><rect x="6" y="5" width="4" height="6"/><rect x="14" y="13" width="4" height="6"/>',
}
def icon(n,size=24,cls='ic'):
    return f'<svg class="{cls}" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter" stroke-linecap="butt" aria-hidden="true" focusable="false">{ICONS[n]}</svg>'
def tokens_css(): return open(os.path.join(BASE,'tokens','tokens.css'),encoding='utf-8').read()
def contrast(): return json.load(open(os.path.join(BASE,'tokens','contrast.json'),encoding='utf-8'))
def colors(): return json.load(open(os.path.join(BASE,'tokens','tokens.json'),encoding='utf-8'))['color']
FONTS_LINK='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Onest:wght@300;400;500;600;700&family=Unbounded:wght@300;400;600;700;800&display=swap&subset=cyrillic" rel="stylesheet">'
