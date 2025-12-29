/* Rengørings-app – Jakob (Hjørring)
   Daglige, ugentlige og månedlige opgaver med automatisk nulstilling.
   Gemmer lokalt i browser (offline), og fungerer som PWA.
*/

// --- Data ---
const tasksDaily = [
  "Støvsugning i hele boligen",
  "Aftør bordplader og komfur i køkkenet",
  "Oprydning i stue/multirum"
];

const tasksWeeklyByDay = {
  "Mandag": [
    "Børneværelser – red sengen & oprydning",
    "Tør flader af på skriveborde og hylder",
    "Gang – tør støv langs paneler og kommoder"
  ],
  "Tirsdag": [
    "Toilet/badeværelse 1 – rens toilet, vask håndvask og spejl",
    "Toilet 2 – rens toilet, vask håndvask og spejl",
    "Bruseområde – aftør fliser"
  ],
  "Onsdag": [
    "Køkken – grundig aftørring af bordplader, komfur og emhætte",
    "Aftør håndtag og skuffer",
    "Bryggers – overflader og gulv (let gulvvask)"
  ],
  "Torsdag": [
    "Soveværelse – skift sengetøj",
    "Tør støv af natborde/kommode",
    "Støvsug ekstra under seng"
  ],
  "Fredag": [
    "Stue – aftør sofabord, hylder, tv-møbel",
    "Ryst puder",
    "Multirum – oprydning + aftør flader"
  ],
  "Lørdag": [
    "Gulvvask i hele huset (køkken, gang, bryggers, stue, multirum)",
    "Børneværelser – støv og orden",
    "Ekstraopgave – vælg én: ovn/køleskab/vinduer/legetøj/sengetøj børn"
  ],
  "Søndag": [
    "Hurtig støvsugning",
    "Oprydning i stue og multirum",
    "Klargør til ny uge"
  ]
};

const tasksMonthly = [
  "Aftør paneler og dørkarme",
  "Støvsug bag møbler",
  "Rens vaskemaskine/tørretumbler",
  "Afkalk badeværelser",
  "Rens hundekurv/legetøj",
  "Rens ovn",
  "Rens køleskab",
  "Puds vinduer",
  "Skift sengetøj til børn",
  "Sorter legetøj i multirum"
];

// --- Utils: datoer og nøgler ---
function formatDate(d){
  return d.toLocaleDateString('da-DK', { weekday:'long', day:'numeric', month:'long' });
}
function getDayName(d){
  return d.toLocaleDateString('da-DK', { weekday:'long' });
}
function getYMD(d){
  const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function getYearMonth(d){
  const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0');
  return `${y}-${m}`;
}
// ISO uge-nummer
function getISOWeek(d){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
}

// --- Storage helpers ---
function loadState(key){
  try{ return JSON.parse(localStorage.getItem(key)) || {}; }catch(_){ return {}; }
}
function saveState(key, obj){
  localStorage.setItem(key, JSON.stringify(obj));
}

// --- Rendering af lister ---
function renderList(container, tasks, stateKey){
  const state = loadState(stateKey);
  container.innerHTML = '';
  tasks.forEach((task, idx)=>{
    const id = `${stateKey}-${idx}`;
    const checked = !!state[id];
    const item = document.createElement('div');
    item.className = 'item';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = id;
    cb.checked = checked;
    cb.addEventListener('change', ()=>{
      const s = loadState(stateKey);
      s[id] = cb.checked;
      saveState(stateKey, s);
    });
    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = task;
    item.appendChild(cb);
    item.appendChild(label);
    container.appendChild(item);
  });
}

function renderFullWeek(container){
  container.innerHTML = '';
  Object.entries(tasksWeeklyByDay).forEach(([day, list])=>{
    const wrap = document.createElement('div');
    wrap.className = 'week-day';
    const h3 = document.createElement('h3'); h3.textContent = day;
    wrap.appendChild(h3);
    const ul = document.createElement('ul');
    list.forEach(t=>{ const li=document.createElement('li'); li.textContent=t; ul.appendChild(li); });
    wrap.appendChild(ul);
    container.appendChild(wrap);
  });
}

// --- Install prompt ---
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('installBtn');
  btn.hidden = false;
  btn.addEventListener('click', async ()=>{
    btn.hidden = true;
    if(deferredPrompt){
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
  });
});

// --- SW registration ---
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('/regn/sw.js');
  });
}

function init(){
  const now = new Date();
  document.getElementById('dateDisplay').textContent = formatDate(now);
  const dayName = getDayName(now);
  const capDay = dayName.charAt(0).toUpperCase()+dayName.slice(1);
  document.getElementById('todayName').textContent = `(i dag: ${capDay})`;

  // Nøgler
  const dailyKey = `daily-${getYMD(now)}`;
  const weeklyKey = `weekly-${getISOWeek(now)}-${capDay}`; // uge + dag
  const monthlyKey = `monthly-${getYearMonth(now)}`;

  // Render
  renderList(document.getElementById('dailyList'), tasksDaily, dailyKey);
  renderList(document.getElementById('weeklyList'), tasksWeeklyByDay[capDay], weeklyKey);
  renderList(document.getElementById('monthlyList'), tasksMonthly, monthlyKey);
  renderFullWeek(document.getElementById('fullWeek'));

  // Nulstil-knapper
  document.getElementById('resetToday').onclick = ()=>{ localStorage.removeItem(dailyKey); init(); };
  document.getElementById('resetWeek').onclick = ()=>{
    const prefix = `weekly-${getISOWeek(new Date())}`;
    Object.keys(localStorage).forEach(k=>{ if(k.startsWith(prefix)) localStorage.removeItem(k); });
    init();
  };
  document.getElementById('resetMonth').onclick = ()=>{
    const prefix = `monthly-${getYearMonth(new Date())}`;
    Object.keys(localStorage).forEach(k=>{ if(k.startsWith(prefix)) localStorage.removeItem(k); });
    init();
  };

  // Auto-opdater ved dato-skift (hver minut)
  if(window.__dateTick) clearInterval(window.__dateTick);
  window.__dateTick = setInterval(()=>{
    const stamp = document.getElementById('dateDisplay').textContent;
    const now2 = new Date();
    const fmt = formatDate(now2);
    if(fmt !== stamp){ init(); }
  }, 60000);
}

(function cleanOld(){
  const ym = getYearMonth(new Date());
  Object.keys(localStorage).forEach(k=>{
    if(k.startsWith('monthly-') && !k.includes(ym)){
      localStorage.removeItem(k);
    }
  });
})();

document.addEventListener('DOMContentLoaded', init);
