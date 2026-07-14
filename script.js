// ---------- state ----------
const LS_TASKS='sq_tasks', LS_PROFILE='sq_profile';
let tasks = JSON.parse(localStorage.getItem(LS_TASKS) || '[]');
let profile = JSON.parse(localStorage.getItem(LS_PROFILE) || '{"total":0,"avail":0}');

const REWARDS=[
  {name:'🎮 เล่นเกม 1 ชั่วโมง', cost:50},
  {name:'🍰 ขนมหวานที่อยากกิน', cost:30},
  {name:'📺 ดูซีรีส์ 1 ตอน', cost:40},
  {name:'😴 งีบ 30 นาที', cost:25},
  {name:'🎵 ฟังเพลง lo-fi ชิล ๆ 1 ชม.', cost:20},
];

const $=id=>document.getElementById(id);

// ---------- core: calculate ----------
function calc(){
  const ch=parseFloat($('fCh').value), min=parseFloat($('fMin').value);
  const box=$('result');
  if(!ch || !min || ch<=0 || min<=0){
    box.style.display='block'; box.className='slow';
    box.textContent='⚠️ กรุณากรอกจำนวนบทและเวลาให้ถูกต้อง (ต้องมากกว่า 0)';
    return null;
  }
  const speed = min/ch; // นาทีต่อบท
  let pace, cls, advice, xp;
  if(speed <= 30){         // if/else จำแนกคำแนะนำ
    pace='Fast'; cls='fast'; xp=25;
    advice='เร็วมาก! อ่านได้กระชับ ลองทวนสรุปสั้น ๆ ท้ายบทเพื่อกันลืมด้วยนะ';
  } else if(speed <= 60){
    pace='Normal'; cls='normal'; xp=50;
    advice='กำลังดีเลย สม่ำเสมอแบบนี้ต่อไป แนะนำพัก 5 นาทีทุก 1 บท';
  } else {
    pace='Chill'; cls='slow'; xp=100;
    advice='บทนี้ใช้เวลาเยอะ อาจเป็นเนื้อหายาก ลองแบ่งอ่านเป็นช่วงสั้น ๆ หรือทำ mind map ช่วยสรุป';
  }
  box.style.display='block'; box.className=cls;
  box.innerHTML=`⏱️ ความเร็วเฉลี่ย <b>${speed.toFixed(1)} นาที/บท</b> — ระดับ <b>${pace}</b><br>💡 ${advice}<br>🏅 ภารกิจนี้จะได้รับ <b>${xp} EXP</b> เมื่อทำเสร็จ`;
  return {speed, pace, cls, xp};
}

// ---------- save task ----------
function saveTask(){
  const r=calc(); if(!r) return;
  const name=$('fName').value.trim() || 'ภารกิจไม่มีชื่อ';
  tasks.push({
    id:Date.now(), name, subj:$('fSubj').value,
    ch:+$('fCh').value, min:+$('fMin').value,
    speed:+r.speed.toFixed(1), pace:r.pace, cls:r.cls, xp:r.xp, done:false
  });
  persist(); renderTasks(); toast('บันทึกภารกิจแล้ว 💾');
  $('fName').value=''; $('fMin').value='';
}

// ---------- complete / delete ----------
function completeTask(id){
  const t=tasks.find(t=>t.id===id);
  if(!t || t.done) return;
  t.done=true;
  profile.total+=t.xp; profile.avail+=t.xp;
  persist(); renderAll(); toast(`เยี่ยม! +${t.xp} EXP ✨`);
}
function delTask(id){
  tasks=tasks.filter(t=>t.id!==id);
  persist(); renderTasks();
}

// ---------- shop ----------
function buy(i){
  const r=REWARDS[i];
  if(profile.avail < r.cost){ toast('EXP ไม่พอ อ่านหนังสือเพิ่มก่อนนะ 😅'); return; }
  profile.avail-=r.cost;
  persist(); renderProfile(); renderShop();
  toast(`แลก "${r.name}" สำเร็จ! ไปพักผ่อนได้เลย 🎉`);
}

// ---------- render ----------
function renderProfile(){
  const lvl=Math.floor(profile.total/100)+1, into=profile.total%100;
  $('pLevel').textContent=lvl;
  $('pTotal').textContent=profile.total;
  $('pAvail').textContent=profile.avail;
  $('xpFill').style.width=into+'%';
  $('xpLabel').textContent=`${into} / 100 สู่เลเวลถัดไป`;
}
function renderTasks(){
  const el=$('taskList');
  if(!tasks.length){ el.innerHTML='<div class="empty">ยังไม่มีภารกิจ — เพิ่มงานแรกของคุณเลย ☕</div>'; return; }
  el.innerHTML=tasks.map(t=>`
    <div class="task ${t.done?'done':''}">
      <div>
        <div class="t-name">${esc(t.name)}</div>
        <span class="tag subj">${t.subj}</span>
        <span class="tag pace-${t.cls}">${t.pace}</span>
        <div class="t-meta">${t.ch} บท · ${t.min} นาที · เฉลี่ย ${t.speed} นาที/บท</div>
      </div>
      <div style="text-align:right">
        <div class="t-xp">+${t.xp} EXP</div>
        <div class="btns" style="margin-top:6px">
          ${t.done ? '<span class="tag pace-fast">✔ เสร็จแล้ว</span>'
                   : `<button class="b-done" onclick="completeTask(${t.id})">✔ ทำเสร็จ</button>`}
          <button class="b-del" onclick="delTask(${t.id})">ลบ</button>
        </div>
      </div>
    </div>`).join('');
}
function renderShop(){
  $('shop').innerHTML=REWARDS.map((r,i)=>`
    <div class="shop-item">
      <div>${r.name}<div class="t-meta">${r.cost} EXP</div></div>
      <button class="b-buy" onclick="buy(${i})" ${profile.avail<r.cost?'disabled':''}>แลก</button>
    </div>`).join('');
}
function renderAll(){ renderProfile(); renderTasks(); renderShop(); }

// ---------- utils ----------
function persist(){
  localStorage.setItem(LS_TASKS, JSON.stringify(tasks));
  localStorage.setItem(LS_PROFILE, JSON.stringify(profile));
}
function esc(s){ return s.replace(/[<>&"]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
let toastTimer;
function toast(msg){
  const t=$('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2200);
}

$('btnCalc').onclick=calc;
$('btnSave').onclick=saveTask;
renderAll();
