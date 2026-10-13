import os,sys
sys.path.insert(0,os.path.dirname(__file__))
from common import *
import art
logo_dark=svgfile('logo-horizontal-lime-on-dark.svg',cls='logo')
logo_light=svgfile('logo-horizontal-mono-light.svg',cls='logo')
I=lambda n,s=24:icon(n,s)
eb,atv,utv=art.ebike(),art.atv(),art.utv()
TPL=r'''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ТЯГА: макет главной страницы</title>
<meta name="description" content="Макет главной страницы ТЯГА (рабочее название). Модели, цены и адреса условные.">
<link rel="icon" href="../logo/favicon.svg" type="image/svg+xml">
@@FONTS@@
<style>
@@TOKENS@@
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--f-text);font-size:16px;line-height:1.6;overflow-wrap:break-word}
img,svg{max-width:100%}
a{color:inherit}
:focus-visible{outline:var(--focus);outline-offset:3px}
.skip{position:absolute;left:-999px;top:8px;background:var(--c-lime);color:var(--c-ink);padding:10px 16px;z-index:100}
.skip:focus{left:8px}
.wrap{width:min(1200px,100% - 32px);margin-inline:auto}
section{padding:calc(72px*var(--density)) 0}
h1,h2,h3{font-family:var(--f-display);font-weight:var(--display-weight);letter-spacing:var(--display-tracking);text-transform:var(--display-case);line-height:1.1;margin:0 0 16px}
h1{font-size:clamp(34px,6.4vw,72px)}
h2{font-size:clamp(26px,4vw,44px)}
h3{font-size:clamp(18px,2vw,22px)}
.eyebrow{font-family:var(--f-mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 14px}
.lead{font-size:clamp(17px,2vw,20px);color:var(--muted);max-width:56ch}
.ex{font-family:var(--f-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--line);padding:2px 6px;color:var(--muted);white-space:nowrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 24px;font:600 16px var(--f-text);border:2px solid transparent;border-radius:var(--radius);cursor:pointer;text-decoration:none;background:var(--accent);color:var(--on-accent);transition:transform var(--t-fast) var(--ease),background var(--t-fast)}
.btn:hover{transform:translateY(-2px)}
.btn.ghost{background:transparent;color:var(--text);border-color:currentColor}
.btn.slant{clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%);border-radius:0;padding:0 30px}
.row{display:flex;flex-wrap:wrap;gap:12px}
.ic{flex:none}
/* header */
header.top{position:sticky;top:0;z-index:50;background:var(--c-ink);color:var(--c-bone);border-bottom:1px solid var(--c-spruce-600)}
header.top .wrap{display:flex;align-items:center;gap:20px;min-height:64px}
.logo{height:26px;width:auto;display:block}
header.top nav{display:flex;gap:22px;margin-left:auto;font-size:15px}
header.top nav a{text-decoration:none;padding:10px 0;color:var(--c-bone)}
header.top nav a:hover{color:var(--c-lime)}
header.top .btn{min-height:40px;padding:0 18px;background:var(--c-lime);color:var(--c-ink);font-size:14px}
.menu-btn{display:none;margin-left:auto;background:none;border:1px solid var(--c-spruce-600);color:var(--c-bone);min-height:44px;padding:0 14px;font:600 14px var(--f-text);cursor:pointer}
@media(max-width:860px){header.top nav,header.top .btn.hd{display:none}.menu-btn{display:block}header.top.open nav{display:flex;position:absolute;left:0;right:0;top:64px;background:var(--c-ink);flex-direction:column;padding:8px 16px 16px;gap:0;border-bottom:1px solid var(--c-spruce-600)}header.top.open nav a{padding:14px 0;border-bottom:1px solid var(--c-spruce-600)}}
/* hero */
.hero{position:relative;overflow:hidden;background:var(--c-ink);color:var(--c-bone);padding:56px 0 0}
.hero .grid{display:grid;grid-template-columns:1.1fr .9fr;gap:32px;align-items:center}
.hero h1 .a{color:var(--c-lime)}
.hero .lead{color:var(--c-mist);margin:0 0 28px}
.hero-art{color:var(--c-bone);--art-accent:var(--c-lime);position:relative}
.hero-art svg{width:100%;height:auto;display:block}
.hero-art::before{content:"";position:absolute;inset:6% 0 0 10%;background:var(--c-spruce-800);clip-path:polygon(12% 0,100% 0,88% 100%,0 100%);z-index:0}
.hero-art svg{position:relative;z-index:1}
.chips{display:grid;grid-template-columns:repeat(4,1fr);margin-top:48px;border-top:1px solid var(--c-spruce-600)}
.chip{padding:20px 16px 24px 0}
.chip b{display:block;font:600 clamp(20px,3vw,30px) var(--f-mono);color:var(--c-lime)}
.chip span{font-size:13px;color:var(--c-mist)}
.slash{position:absolute;right:-40px;top:0;bottom:0;width:140px;background:var(--c-lime);transform:skewX(-12deg);opacity:.9}
@media(max-width:860px){.hero .grid{grid-template-columns:1fr}.chips{grid-template-columns:1fr 1fr}.slash{display:none}}
/* quiz */
.quiz{background:var(--c-spruce-800);color:var(--c-bone)}
.quiz .box{display:grid;grid-template-columns:.8fr 1.2fr;gap:40px;align-items:start}
.quiz .lead{color:var(--c-mist)}
fieldset{border:0;padding:0;margin:0 0 22px;min-width:0}
legend{font:600 17px var(--f-text);margin-bottom:10px;padding:0}
.opts{display:flex;flex-wrap:wrap;gap:8px}
.opts label{position:relative}
.opts input{position:absolute;opacity:0;inset:0;cursor:pointer}
.opts span{display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border:2px solid var(--c-spruce-600);border-radius:var(--radius);background:var(--c-ink);font-size:15px}
.opts input:checked+span{background:var(--c-lime);color:var(--c-ink);border-color:var(--c-lime);font-weight:600}
.opts input:focus-visible+span{outline:3px solid var(--c-lime);outline-offset:3px}
.result{border:2px dashed var(--c-spruce-600);padding:20px;margin-top:8px}
.result b{font-family:var(--f-display);font-size:22px;color:var(--c-lime)}
.result p{margin:6px 0 0;color:var(--c-mist)}
@media(max-width:860px){.quiz .box{grid-template-columns:1fr}}
/* lineup (salon) */
.salon{--bg:var(--c-bone);--surface:var(--c-paper);--text:var(--c-ink);--muted:var(--c-stone);--accent:var(--c-ink);--on-accent:var(--c-bone);--line:var(--c-dust);--focus-c:var(--c-ink);--radius:2px;--display-weight:300;--display-tracking:.02em;--display-case:none;--density:1.35;background:var(--bg);color:var(--text)}
.club{--bg:var(--c-ink);--surface:var(--c-spruce-800);--text:var(--c-bone);--muted:var(--c-mist);--accent:var(--c-violet-soft);--on-accent:var(--c-ink);--line:var(--c-spruce-600);--focus-c:var(--c-violet-soft);--radius:999px;--display-weight:700;--display-tracking:0;--display-case:none;--density:.9;background:var(--bg);color:var(--text)}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:32px}
.card{background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;position:relative}
.card .pic{color:var(--c-ink);--art-accent:var(--c-ink);padding:28px 20px 8px;background:var(--c-bone);border-bottom:1px solid var(--line)}
.card.pro .pic{--art-accent:var(--c-spruce-600)}
.card.ultra .pic{background:var(--c-ink);color:var(--c-bone);--art-accent:var(--c-lime)}
.card .pic svg{width:100%;height:auto;display:block}
.badge{position:absolute;left:16px;top:16px;font:600 12px var(--f-mono);letter-spacing:.12em;text-transform:uppercase;padding:5px 14px 5px 10px;clip-path:polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%)}
.lite .badge{background:var(--c-dust);color:var(--c-ink)}.pro .badge{background:var(--c-spruce-800);color:var(--c-bone)}.ultra .badge{background:var(--c-lime);color:var(--c-ink)}
.card .body{padding:20px;display:flex;flex-direction:column;gap:14px;flex:1}
.card h3{margin:0;font-size:22px;text-transform:none}
.spec{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;margin:0}
.spec div{border-top:1px solid var(--line);padding-top:8px}
.spec dt{font:11px var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.spec dd{margin:0;font:600 16px var(--f-mono)}
.note{font-size:13px;color:var(--muted);margin:0}
.price{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:auto}
.price b{font:600 20px var(--f-mono)}
.price .btn{min-height:44px;padding:0 18px;font-size:15px}
@media(max-width:900px){.cards{grid-template-columns:1fr}}
/* types */
.types{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:28px}
.type{min-width:0;border:1px solid var(--line);background:var(--surface);padding:18px;display:flex;gap:12px;align-items:center;text-decoration:none;min-height:64px}
.type:hover{border-color:var(--text)}
@media(max-width:900px){.types{grid-template-columns:1fr 1fr}}
@media(max-width:520px){.types{grid-template-columns:1fr}}
/* configurator */
.conf{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center}
.conf .view{background:var(--surface);border:1px solid var(--line);padding:24px;color:var(--c-ink)}
.conf .view svg{width:100%;height:auto;display:block}
.sum{display:flex;justify-content:space-between;align-items:baseline;border-top:2px solid var(--text);padding-top:14px;margin:20px 0 18px;gap:12px;flex-wrap:wrap}
.sum b{font:600 26px var(--f-mono)}
.sw{display:flex;gap:10px}
.sw label{position:relative;width:44px;height:44px}
.sw input{position:absolute;inset:0;opacity:0;cursor:pointer}
.sw span{display:block;width:100%;height:100%;border:2px solid var(--line);border-radius:50%}
.sw input:checked+span{box-shadow:0 0 0 3px var(--bg),0 0 0 5px var(--text)}
.sw input:focus-visible+span{outline:3px solid var(--text);outline-offset:6px}
.salon .opts span{background:var(--c-paper);border-color:var(--c-dust)}
.salon .opts input:checked+span{background:var(--c-ink);color:var(--c-bone);border-color:var(--c-ink)}
.salon .opts input:focus-visible+span{outline-color:var(--c-ink)}
@media(max-width:900px){.conf{grid-template-columns:1fr}}
/* compare */
.tw{overflow-x:auto;border:1px solid var(--line);background:var(--surface)}
table{border-collapse:collapse;width:100%;min-width:560px}
th,td{text-align:left;padding:14px 16px;border-bottom:1px solid var(--line);font-size:15px;vertical-align:top}
th{font:600 12px var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
td:first-child{color:var(--muted)}
td.m{font-family:var(--f-mono);font-weight:600}
tr:last-child td{border-bottom:0}
/* showroom */
.show{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:stretch}
.addr{list-style:none;padding:0;margin:20px 0 0}
.addr li{display:flex;gap:12px;padding:12px 0;border-top:1px solid var(--line)}
.addr b{display:block}
.geo{background:var(--c-ink);color:var(--c-bone);padding:24px;position:relative;min-height:300px}
.geo svg{width:100%;height:auto;display:block}
@media(max-width:900px){.show{grid-template-columns:1fr}}
/* cta */
.cta .box{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
form{display:grid;gap:14px}
label.f{display:grid;gap:6px;font-weight:600;font-size:15px}
input[type=text],input[type=tel],select{min-height:48px;padding:0 16px;font:16px var(--f-text);background:var(--c-paper);color:var(--c-ink);border:2px solid var(--c-mist);border-radius:8px;width:100%}
.hint{font-size:13px;color:var(--muted);font-weight:400}
.club .btn{border-radius:999px}
.ok{display:none;border:2px solid var(--accent);padding:14px 18px;border-radius:14px}
@media(max-width:900px){.cta .box{grid-template-columns:1fr}}
/* footer */
footer{background:var(--c-ink);color:var(--c-bone);padding:56px 0 32px}
footer .cols{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:32px}
footer h4{font:600 12px var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--c-mist);margin:0 0 12px}
footer ul{list-style:none;padding:0;margin:0;display:grid;gap:6px}
footer a{text-decoration:none}footer a:hover{color:var(--c-lime)}
footer .fine{border-top:1px solid var(--c-spruce-600);margin-top:36px;padding-top:20px;font-size:13px;color:var(--c-mist)}
@media(max-width:860px){footer .cols{grid-template-columns:1fr 1fr}}
@media(max-width:480px){footer .cols{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.btn{transition:none}}
</style>
</head>
<body>
<a class="skip" href="#main">К содержимому</a>
<header class="top" id="hd">
 <div class="wrap">
  <a href="#" aria-label="ТЯГА, на главную">@@LOGO_D@@</a>
  <nav aria-label="Основное меню"><a href="#podbor">Подбор</a><a href="#linejka">Линейка</a><a href="#kastom">Кастом</a><a href="#sravnenie">Сравнение</a><a href="#shourum">Шоурум</a><a href="#opt">Опт</a></nav>
  <a class="btn hd" href="#test">Тест-драйв</a>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="hd" id="mb">Меню</button>
 </div>
</header>
<main id="main">

<section class="hero" data-mode="trail" style="padding-bottom:0">
 <div class="slash" aria-hidden="true"></div>
 <div class="wrap">
  <div class="grid">
   <div>
    <p class="eyebrow">Электровелосипеды · квадроциклы · UTV · снегоходы</p>
    <h1>Тяга <span class="a">в цифрах.</span></h1>
    <p class="lead">Называем число, единицу и условия замера. Остальное расскажет тест-драйв в Ростове или на выезде.</p>
    <div class="row"><a class="btn slant" href="#test">Записаться на тест-драйв</a><a class="btn ghost" href="#podbor">Подобрать за минуту</a></div>
   </div>
   <div class="hero-art">@@EB@@</div>
  </div>
  <div class="chips" role="list">
   <div class="chip" role="listitem"><b>до 120 км</b><span>запас хода Pro, груз 80 кг, +20 °C <span class="ex">пример</span></span></div>
   <div class="chip" role="listitem"><b>1 440 Вт·ч</b><span>батарея Pro 50 <span class="ex">пример</span></span></div>
   <div class="chip" role="listitem"><b>2 дня</b><span>срок ремонта в сервисе или подменная техника</span></div>
   <div class="chip" role="listitem"><b>3 города</b><span>Москва, Ростов-на-Дону, Краснодарский край</span></div>
  </div>
 </div>
</section>

<section class="quiz" id="podbor" data-mode="trail" aria-labelledby="qh">
 <div class="wrap box">
  <div>
   <p class="eyebrow">Подбор · 4 вопроса</p>
   <h2 id="qh">Подбор за минуту</h2>
   <p class="lead">Четыре вопроса, три подходящие модели. Без звонка и анкет.</p>
  </div>
  <form id="quiz" onsubmit="return false">
   <fieldset><legend>Где катаетесь чаще всего?</legend><div class="opts">
    <label><input type="radio" name="q1" value="0" checked><span>Город и дача</span></label>
    <label><input type="radio" name="q1" value="1"><span>Трасса и лес</span></label>
    <label><input type="radio" name="q1" value="2"><span>Бездорожье и снег</span></label></div></fieldset>
   <fieldset><legend>Сколько километров за раз?</legend><div class="opts">
    <label><input type="radio" name="q2" value="0" checked><span>до 40</span></label>
    <label><input type="radio" name="q2" value="1"><span>40-80</span></label>
    <label><input type="radio" name="q2" value="2"><span>больше 80</span></label></div></fieldset>
   <fieldset><legend>Кто будет ездить?</legend><div class="opts">
    <label><input type="radio" name="q3" value="0" checked><span>Один человек</span></label>
    <label><input type="radio" name="q3" value="1"><span>Двое или с грузом</span></label>
    <label><input type="radio" name="q3" value="2"><span>Подросток</span></label></div></fieldset>
   <fieldset><legend>Какой бюджет комфортен?</legend><div class="opts">
    <label><input type="radio" name="q4" value="0" checked><span>до 300 тыс. ₽</span></label>
    <label><input type="radio" name="q4" value="1"><span>300-500 тыс. ₽</span></label>
    <label><input type="radio" name="q4" value="2"><span>выше 500 тыс. ₽</span></label></div></fieldset>
   <div class="result" role="status" aria-live="polite"><b id="rn">Тяга Lite 30</b><p id="rt">Для города и дачи: легкая, тихая, сервис рядом.</p></div>
  </form>
 </div>
</section>

<section class="salon" id="linejka" data-mode="salon" aria-labelledby="lh">
 <div class="wrap">
  <p class="eyebrow">Линейка · примеры</p>
  <h2 id="lh">Lite, Pro, Ultra</h2>
  <p class="lead">Три ступени вместо сетки из сотен карточек. Названия и значения на макете условные.</p>
  <div class="cards">
   <article class="card lite"><span class="badge">Lite</span><div class="pic">@@EB@@</div><div class="body"><h3>Тяга Lite 30 <span class="ex">пример</span></h3>
    <dl class="spec"><div><dt>Запас хода</dt><dd>до 60 км</dd></div><div><dt>Батарея</dt><dd>720 Вт·ч</dd></div><div><dt>Момент</dt><dd>65 Н·м</dd></div><div><dt>Масса</dt><dd>29 кг</dd></div></dl>
    <p class="note">Замер: груз 80 кг, +20 °C, смешанный маршрут.</p>
    <div class="price"><b>от 189 000 ₽</b><a class="btn" href="#test">Тест-драйв</a></div></div></article>
   <article class="card pro"><span class="badge">Pro</span><div class="pic">@@ATV@@</div><div class="body"><h3>Тяга Pro 50 <span class="ex">пример</span></h3>
    <dl class="spec"><div><dt>Запас хода</dt><dd>до 120 км</dd></div><div><dt>Батарея</dt><dd>1 440 Вт·ч</dd></div><div><dt>Момент</dt><dd>90 Н·м</dd></div><div><dt>Масса</dt><dd>46 кг</dd></div></dl>
    <p class="note">Замер: груз 80 кг, +20 °C, смешанный маршрут.</p>
    <div class="price"><b>от 389 000 ₽</b><a class="btn" href="#test">Тест-драйв</a></div></div></article>
   <article class="card ultra"><span class="badge">Ultra</span><div class="pic">@@UTV@@</div><div class="body"><h3>Тяга Ultra 90 <span class="ex">пример</span></h3>
    <dl class="spec"><div><dt>Запас хода</dt><dd>до 160 км</dd></div><div><dt>Батарея</dt><dd>14,4 кВт·ч</dd></div><div><dt>Момент</dt><dd>240 Н·м</dd></div><div><dt>Масса</dt><dd>610 кг</dd></div></dl>
    <p class="note">Замер: груз 160 кг, +20 °C, смешанный маршрут.</p>
    <div class="price"><b>от 1 190 000 ₽</b><a class="btn" href="#test">Тест-драйв</a></div></div></article>
  </div>
  <div class="types" aria-label="Типы техники">
   <a class="type" href="#linejka">@@I_ebike@@Электровелосипеды</a><a class="type" href="#linejka">@@I_atv@@Квадроциклы</a><a class="type" href="#linejka">@@I_utv@@UTV</a><a class="type" href="#linejka">@@I_snow@@Снегоходы</a>
  </div>
 </div>
</section>

<section class="salon" id="kastom" data-mode="salon" style="padding-top:0" aria-labelledby="kh">
 <div class="wrap conf">
  <div class="view" id="cview" style="--art-accent:var(--c-ink)">@@EB@@</div>
  <div>
   <p class="eyebrow">Кастом · превью конфигуратора</p>
   <h2 id="kh">Соберите под себя</h2>
   <p class="lead">Цвет, батарея, багажник. Цена и запас хода пересчитываются сразу.</p>
   <fieldset><legend>Цвет рамы</legend><div class="sw">
    <label><input type="radio" name="col" value="#0F1F1A" checked aria-label="Хвоя-ночь"><span style="background:#0F1F1A"></span></label>
    <label><input type="radio" name="col" value="#28493F" aria-label="Мох-хвоя"><span style="background:#28493F"></span></label>
    <label><input type="radio" name="col" value="#CFC6B2" aria-label="Пыль"><span style="background:#CFC6B2"></span></label>
    <label><input type="radio" name="col" value="#C8F03A" aria-label="Разряд"><span style="background:#C8F03A"></span></label></div></fieldset>
   <fieldset><legend>Батарея</legend><div class="opts">
    <label><input type="radio" name="bat" value="0" checked><span>720 Вт·ч</span></label>
    <label><input type="radio" name="bat" value="1"><span>1 080 Вт·ч</span></label>
    <label><input type="radio" name="bat" value="2"><span>1 440 Вт·ч</span></label></div></fieldset>
   <fieldset><legend>Багажник</legend><div class="opts">
    <label><input type="radio" name="rack" value="0" checked><span>Без багажника</span></label>
    <label><input type="radio" name="rack" value="1"><span>Дорожный</span></label></div></fieldset>
   <div class="sum" role="status" aria-live="polite"><span>Запас хода: <b id="crange">до 60 км</b></span><span>Цена: <b id="cprice">189 000 ₽</b></span></div>
   <p class="note">Пример расчета. Значения условные, замер: груз 80 кг, +20 °C.</p>
  </div>
 </div>
</section>

<section class="salon" id="sravnenie" data-mode="salon" style="padding-top:0" aria-labelledby="ch">
 <div class="wrap">
  <p class="eyebrow">Сравнение</p>
  <h2 id="ch">Три модели в одной таблице</h2>
  <div class="tw" tabindex="0" role="region" aria-label="Таблица сравнения, прокручивается по горизонтали">
  <table><caption class="ex" style="text-align:left;border:0;padding:12px 16px 0;caption-side:top">Данные примерные</caption>
   <thead><tr><th scope="col">Параметр</th><th scope="col">Lite 30</th><th scope="col">Pro 50</th><th scope="col">Ultra 90</th></tr></thead>
   <tbody>
    <tr><td>Запас хода</td><td class="m">до 60 км</td><td class="m">до 120 км</td><td class="m">до 160 км</td></tr>
    <tr><td>Батарея</td><td class="m">720 Вт·ч</td><td class="m">1 440 Вт·ч</td><td class="m">14,4 кВт·ч</td></tr>
    <tr><td>Момент</td><td class="m">65 Н·м</td><td class="m">90 Н·м</td><td class="m">240 Н·м</td></tr>
    <tr><td>Масса</td><td class="m">29 кг</td><td class="m">46 кг</td><td class="m">610 кг</td></tr>
    <tr><td>Подходит для</td><td>города, дачи</td><td>трассы, леса</td><td>бездорожья, работы</td></tr>
    <tr><td>Цена</td><td class="m">от 189 000 ₽</td><td class="m">от 389 000 ₽</td><td class="m">от 1 190 000 ₽</td></tr>
   </tbody></table></div>
 </div>
</section>

<section class="salon" id="shourum" data-mode="salon" style="padding-top:0" aria-labelledby="sh">
 <div class="wrap show">
  <div>
   <p class="eyebrow">Живой шоурум</p>
   <h2 id="sh">Приезжайте в Ростов</h2>
   <p class="lead">Увидеть, потрогать, проехать круг. Доставка, сборка и сервис по югу и в Москве.</p>
   <ul class="addr">
    <li>@@I_pin@@<div><b>Ростов-на-Дону, шоурум</b>Адрес и часы работы будут здесь <span class="ex">пример</span></div></li>
    <li>@@I_delivery@@<div><b>Москва и Краснодарский край</b>Доставка, сборка и настройка под ключ</div></li>
    <li>@@I_service@@<div><b>Сервис</b>Ремонт за 2 дня или подменная техника</div></li>
   </ul>
  </div>
  <div class="geo" role="img" aria-label="Схема: Москва, Ростов-на-Дону и Краснодарский край, схематично">
   <svg viewBox="0 0 400 300" fill="none" stroke="#28493F" stroke-width="1.2" aria-hidden="true">
    <path d="M0 220 C80 190 120 240 200 210 S330 150 400 180"/><path d="M0 252 C80 222 120 270 200 240 S330 180 400 210"/><path d="M0 190 C80 160 120 210 200 180 S330 120 400 150"/>
    <path d="M200 60 L170 190 L130 240" stroke="#C8F03A" stroke-width="2.5" stroke-dasharray="6 6"/>
    <g stroke="none"><circle cx="200" cy="60" r="7" fill="#EDEAE2"/><circle cx="170" cy="190" r="10" fill="#C8F03A"/><circle cx="130" cy="240" r="7" fill="#EDEAE2"/></g>
    <g fill="#EDEAE2" stroke="none" font-family="Onest,sans-serif" font-size="14"><text x="214" y="66">Москва</text><text x="186" y="186">Ростов-на-Дону</text><text x="146" y="258">Краснодарский край</text></g>
   </svg>
   <p class="note" style="color:var(--c-mist)">Схема, не карта. Лаймовая точка - шоурум.</p>
  </div>
 </div>
</section>

<section class="salon" id="opt" data-mode="salon" style="padding-top:0" aria-labelledby="oh">
 <div class="wrap">
  <p class="eyebrow">Опт</p>
  <h2 id="oh">Для магазинов и прокатов</h2>
  <p class="lead">Прайс, условия поставки и сервисная поддержка. Напишите, и менеджер пришлет предложение на вашу почту.</p>
  <a class="btn" href="#test">Запросить условия</a>
 </div>
</section>

<section class="club cta" id="test" data-mode="club" aria-labelledby="th">
 <div class="wrap box">
  <div>
   <p class="eyebrow">Клуб · тест-драйв</p>
   <h2 id="th">Поехали на тест.</h2>
   <p class="lead">Суббота, 11:00, Ростов: приходи, прокатимся и расскажем цифры. Заезды клуба и маршруты смотри в анонсах.</p>
  </div>
  <form id="tf" onsubmit="return false" novalidate>
   <label class="f">Как тебя зовут<input type="text" name="n" autocomplete="given-name"></label>
   <label class="f">Телефон<input type="tel" name="p" autocomplete="tel" placeholder="+7 (000) 000-00-00" aria-describedby="ph"><span class="hint" id="ph">Перезвоним в течение рабочего дня.</span></label>
   <label class="f">Что хочешь проехать<select name="m"><option>Электровелосипед</option><option>Квадроцикл</option><option>UTV</option><option>Снегоход</option></select></label>
   <button class="btn" type="submit" id="tsend">Погнали на тест</button>
   <div class="ok" id="tok" role="status">Заявка принята (демо). В боевой версии здесь подтверждение от менеджера.</div>
  </form>
 </div>
</section>

</main>
<footer data-mode="trail">
 <div class="wrap">
  <div class="cols">
   <div>@@LOGO_D@@<p style="color:var(--c-mist);max-width:34ch;margin-top:16px">Электровелосипеды, квадроциклы, UTV и снегоходы. Москва, Ростов-на-Дону, Краснодарский край.</p></div>
   <div><h4>Техника</h4><ul><li><a href="#linejka">Электровелосипеды</a></li><li><a href="#linejka">Квадроциклы</a></li><li><a href="#linejka">UTV</a></li><li><a href="#linejka">Снегоходы</a></li></ul></div>
   <div><h4>Сервис</h4><ul><li><a href="#podbor">Подбор</a></li><li><a href="#kastom">Кастом</a></li><li><a href="#shourum">Шоурум</a></li><li><a href="#opt">Опт</a></li></ul></div>
   <div><h4>Связь</h4><ul><li>+7 (000) 000-00-00</li><li>hello@tyaga.example</li><li><a href="#test">Тест-драйв</a></li></ul></div>
  </div>
  <p class="fine">ТЯГА (TYAGA) - рабочее название. Модели, цены, адреса, телефоны и характеристики на макете условные.</p>
 </div>
</footer>
<script>
(function(){
var $=function(s){return document.querySelector(s)};
var hd=$('#hd'),mb=$('#mb');
mb.addEventListener('click',function(){var o=hd.classList.toggle('open');mb.setAttribute('aria-expanded',o)});
hd.querySelectorAll('nav a').forEach(function(a){a.addEventListener('click',function(){hd.classList.remove('open');mb.setAttribute('aria-expanded',false)})});
function val(n){var e=document.querySelector('input[name='+n+']:checked');return e?+e.value:0}
var R=[['Тяга Lite 30','Для города и дачи: легкая, тихая, сервис рядом.'],['Тяга Pro 50','Для трассы и леса: запас хода до 120 км и момент 90 Н·м.'],['Тяга Ultra 90','Для бездорожья и снега: запас хода до 160 км, груз и двое в экипаже.']];
function quiz(){var s=val('q1')+val('q2')+val('q3')+val('q4');var i=s<=2?0:(s<=5?1:2);$('#rn').textContent=R[i][0];$('#rt').textContent=R[i][1]}
document.querySelectorAll('#quiz input').forEach(function(e){e.addEventListener('change',quiz)});
var BR=[60,90,120],BP=[0,60000,120000];
function conf(){var b=val('bat'),r=val('rack');$('#crange').textContent='до '+BR[b]+' км';var p=189000+BP[b]+r*14000;$('#cprice').textContent=p.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' ₽';var c=document.querySelector('input[name=col]:checked').value;$('#cview').style.setProperty('--art-accent',c==='#0F1F1A'?'#0F1F1A':c)}
document.querySelectorAll('#kastom input').forEach(function(e){e.addEventListener('change',conf)});
$('#tf').addEventListener('submit',function(){$('#tok').style.display='block'});
})();
</script>
</body>
</html>
'''
out=TPL.replace('@@TOKENS@@',tokens_css()).replace('@@FONTS@@',FONTS_LINK).replace('@@LOGO_D@@',logo_dark)
out=out.replace('@@EB@@',eb).replace('@@ATV@@',atv).replace('@@UTV@@',utv)
for n in ['ebike','atv','utv','snow','pin','delivery','service']: out=out.replace('@@I_%s@@'%n,I(n))
open(os.path.join(os.path.dirname(__file__),'..','site-mockup','index.html'),'w',encoding='utf-8').write(out)
print(len(out))
