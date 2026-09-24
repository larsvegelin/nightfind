import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const S=path.dirname(fileURLToPath(import.meta.url));
const res=[]; const errs=[];
function ok(n,c,x){res.push((c?'PASS ':'FAIL ')+n+(x!==undefined?'  -> '+String(x).slice(0,150):''));console.log(res.at(-1));}
// contrastberekening volgens WCAG
function lum(hex){const c=hex.replace('#','').match(/../g).map(h=>{let v=parseInt(h,16)/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];}
function ratio(a,b){const l1=lum(a),l2=lum(b);return ((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05));}
import fs from 'node:fs';
const exe=fs.existsSync('/opt/pw-browsers/chromium')?{executablePath:'/opt/pw-browsers/chromium'}:{};
const b=await chromium.launch({...exe,args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:1440,height:1000}});
const p=await ctx.newPage();
p.on('pageerror',e=>errs.push('[pageerror] '+e.message));
p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_|favicon/.test(m.text()))errs.push('[console] '+m.text().slice(0,120));});
const U='http://127.0.0.1:8080/index.html';
await p.goto(U,{waitUntil:'load'});
await p.evaluate(()=>{localStorage.clear();});
await p.reload({waitUntil:'load'});
await p.fill('#login-email','lars@dewaerdse.nl'); await p.click('#login-form button[type=submit]'); await p.waitForTimeout(1200);
// tokens
const tok = await p.evaluate(()=>{const cs=getComputedStyle(document.documentElement);return {muted:cs.getPropertyValue('--muted').trim(),blueOn:cs.getPropertyValue('--blue-on').trim(),field:cs.getPropertyValue('--field').trim(),danger:cs.getPropertyValue('--danger').trim(),dot:cs.getPropertyValue('--dot-off').trim()};});
ok('palet 2.1 compleet', tok.muted==='#4A5A6C'&&tok.blueOn==='#215A88'&&tok.field==='#8A90A5'&&tok.danger==='#8A3B2E'&&tok.dot==='#B9C3CE', JSON.stringify(tok));
ok('secundaire tekst haalt 4,5:1 op wit', ratio('#4A5A6C','#FFFFFF')>=4.5, ratio('#4A5A6C','#FFFFFF').toFixed(2)+':1');
ok('blauw op blauwe tint haalt 4,5:1', ratio('#215A88','#DCE8F2')>=4.5, ratio('#215A88','#DCE8F2').toFixed(2)+':1');
ok('crème op navy haalt 4,5:1', ratio('#F2F0E7','#1F3A5F')>=4.5, ratio('#F2F0E7','#1F3A5F').toFixed(2)+':1');
// typografie
const h1 = await p.evaluate(()=>{const e=document.querySelector('.overview-title h1');const c=getComputedStyle(e);return {size:c.fontSize,weight:c.fontWeight,lang:document.documentElement.lang};});
ok('paginatitel 34px, gewicht 700', h1.size==='34px'&&h1.weight==='700', JSON.stringify(h1));
ok('lang volgt het profiel', h1.lang==='nl', h1.lang);
// raster en geen horizontale scroll
const grid = await p.evaluate(()=>{const g=document.querySelector('.launch');const c=getComputedStyle(g);return {gap:c.gap, kids:[...g.children].every(k=>getComputedStyle(k).minWidth==='0px')};});
ok('raster gap 24px en kaarten met min-width 0', grid.gap==='24px'&&grid.kids, JSON.stringify(grid));
// knoppen 44px en focusring
await p.click('.nav-item[data-go="help"]'); await p.waitForTimeout(500);
const btn = await p.evaluate(()=>{const e=[...document.querySelectorAll('.btn, .btn-pill')].find(x=>x.offsetParent) || document.querySelector('.launch button');const r=e.getBoundingClientRect();return {h:Math.round(r.height), radius:getComputedStyle(e).borderRadius};});
ok('knop minstens 44px hoog, radius 14', btn.h>=44&&btn.radius==='14px', JSON.stringify(btn));
await p.evaluate(() => { location.hash = '#overview'; }); await p.waitForTimeout(400);
await p.keyboard.press('Tab');
const focus = await p.evaluate(()=>{const e=document.activeElement;const c=getComputedStyle(e);return c.outlineColor+' '+c.outlineWidth+' '+c.outlineOffset;});
ok('focusring goud, 2px, 3px afstand', /201, 169, 97/.test(focus)&&focus.includes('2px')&&focus.includes('3px'), focus);
// laadtoestand
const skel = await p.evaluate(() => (renderFiles().match(/class="skel"/g) || []).length);
ok('laden toont een skelet, geen leeg vlak', skel >= 2, skel);
await p.click('.nav-item[data-go="files"]'); await p.waitForTimeout(1500);
// pld-namen
const pld = await p.evaluate(()=>({card:document.querySelectorAll('.pld-card').length,btn:document.querySelectorAll('.pld-btn').length,caps:document.querySelectorAll('.pld-caps').length}));
ok('componenten dragen de pld-naam', pld.card>0&&pld.btn>0&&pld.caps>0, JSON.stringify(pld));
// breedtes
for (const w of [1440, 768, 375]) {
  await p.setViewportSize({width:w,height:900});
  await p.evaluate(() => { location.hash = "#overview"; }); await p.waitForTimeout(600);
  const sw = await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  ok('geen horizontale scroll op '+w+'px', sw<=0, sw);
  await p.screenshot({path:S+'/shots/sg-'+w+'.png', fullPage:true});
}
await p.setViewportSize({width:375,height:900});
const small = await p.evaluate(()=>getComputedStyle(document.querySelector('.overview-title h1')).fontSize);
ok('titel zakt naar 28px onder 480px', small==='28px', small);
ok('geen JS-fouten', errs.length===0, errs.slice(0,3).join(' || '));
await b.close();
const fout=res.filter(r=>r.startsWith('FAIL'));
console.log('\n'+(res.length-fout.length)+'/'+res.length+' goed');
process.exit(fout.length?1:0);
