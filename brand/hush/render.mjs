import { chromium } from 'playwright-core';
import fs from 'fs'; import path from 'path';
const [,, ...files] = process.argv;
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] });
const p = await b.newPage({ deviceScaleFactor:2 });
for (const f of files){ const s=fs.readFileSync(f,'utf8'); const m=s.match(/viewBox="0 0 (\d+) (\d+)"/); const w=+m[1],h=+m[2];
 await p.setViewportSize({width:w*(w<200?2:1),height:h*(w<200?2:1)}); fs.writeFileSync('/tmp/_r.html',`<body style="margin:0;background:#E8EDEA"><img src="file://${path.resolve(f)}" style="width:${w*(w<200?2:1)}px;height:${h*(w<200?2:1)}px;display:block">`); await p.goto('file:///tmp/_r.html');
 await p.waitForTimeout(150); await p.screenshot({path:f.replace(/\.svg$/,'.png')}); }
await b.close();
