// ---------- State ----------

const LS_TASKS = "sq_tasks";
const LS_PROFILE = "sq_profile";

let tasks = JSON.parse(localStorage.getItem(LS_TASKS) || "[]");
let profile = JSON.parse(
  localStorage.getItem(LS_PROFILE) || '{"total":0,"avail":0}'
);

const REWARDS = [
  { name: "🎮 เล่นเกม 1 ชั่วโมง", cost: 50 },
  { name: "🍰 ขนมหวานที่อยากกิน", cost: 30 },
  { name: "📺 ดูซีรีส์ 1 ตอน", cost: 40 },
  { name: "😴 งีบ 30 นาที", cost: 25 },
  { name: "🎵 ฟังเพลง lo-fi ชิล ๆ 1 ชม.", cost: 20 }
];

const $ = (id) => document.getElementById(id);

// ---------- Calculate ----------

function calc() {
  const ch = parseFloat($("fCh").value);
  const min = parseFloat($("fMin").value);
  const box = $("result");

  if (!ch || !min || ch <= 0 || min <= 0) {
    box.style.display = "block";
    box.className = "slow";
    box.textContent =
      "⚠️ กรุณากรอกจำนวนบทและเวลาให้ถูกต้อง (ต้องมากกว่า 0)";
    return null;
  }

  const speed = min / ch;

  let pace;
  let cls;
  let advice;
  let xp;

  if (speed <= 30) {
    pace = "Fast";
    cls = "fast";
    xp = 25;
    advice =
      "เร็วมาก! อ่านได้กระชับ ลองทวนสรุปสั้น ๆ ท้ายบทเพื่อกันลืมด้วยนะ";
  } else if (speed <= 60) {
    pace = "Normal";
    cls = "normal";
    xp = 50;
    advice =
      "กำลังดีเลย สม่ำเสมอแบบนี้ต่อไป แนะนำพัก 5 นาทีทุก 1 บท";
  } else {
    pace = "Chill";
    cls = "slow";
    xp = 100;
    advice =
      "บทนี้ใช้เวลาเยอะ อาจเป็นเนื้อหายาก ลองแบ่งอ่านเป็นช่วงสั้น ๆ หรือทำ Mind Map ช่วยสรุป";
  }

  box.style.display = "block";
  box.className = cls;

  box.innerHTML = `
    ⏱️ ความเร็วเฉลี่ย <b>${speed.toFixed(1)} นาที/บท</b>
    — ระดับ <b>${pace}</b><br>
    💡 ${advice}<br>
    🏅 ภารกิจนี้จะได้รับ <b>${xp} EXP</b> เมื่อทำเสร็จ
  `;

  return {
    speed,
    pace,
    cls,
    xp
  };
}

// ---------- Save Task ----------

function saveTask() {
  const result = calc();

  if (!result) return;

  const name = $("fName").value.trim() || "ภารกิจไม่มีชื่อ";

  tasks.push({
    id: Date.now(),
    name,
    subj: $("fSubj").value,
    ch: +$("fCh").value,
    min: +$("fMin").value,
    speed: +result.speed.toFixed(1),
    pace: result.pace,
    cls: result.cls,
    xp: result.xp,
    done: false
  });

  persist();
  renderTasks();

  toast("บันทึกภารกิจแล้ว 💾");

  $("fName").value = "";
  $("fMin").value = "";
}

// ---------- Complete / Delete ----------

function completeTask(id) {
  const task = tasks.find((t) => t.id === id);

  if (!task || task.done) return;

  task.done = true;

  profile.total += task.xp;
  profile.avail += task.xp;

  persist();
  renderAll();

  toast(`เยี่ยม! +${task.xp} EXP ✨`);
}

function delTask(id) {
  tasks = tasks.filter((t) => t.id !== id);

  persist();
  renderTasks();
}

// ---------- Reward Shop ----------

function buy(index) {
  const reward = REWARDS[index];

  if (profile.avail < reward.cost) {
    toast("EXP ไม่พอ อ่านหนังสือเพิ่มก่อนนะ 😅");
    return;
  }

  profile.avail -= reward.cost;

  persist();
  renderProfile();
  renderShop();

  toast(`แลก "${reward.name}" สำเร็จ! ไปพักผ่อนได้เลย 🎉`);
}

// ---------- Render ----------

function renderProfile() {
  const level = Math.floor(profile.total / 100) + 1;
  const currentXP = profile.total % 100;

  $("pLevel").textContent = level;
  $("pTotal").textContent = profile.total;
  $("pAvail").textContent = profile.avail;

  $("xpFill").style.width = currentXP + "%";
  $("xpLabel").textContent =
    `${currentXP} / 100 สู่เลเวลถัดไป`;
}

function renderTasks() {
  const list = $("taskList");

  if (!tasks.length) {
    list.innerHTML =
      '<div class="empty">ยังไม่มีภารกิจ — เพิ่มงานแรกของคุณเลย ☕</div>';
    return;
  }

  list.innerHTML = tasks.map((task) => `
    <div class="task ${task.done ? "done" : ""}">
      <div>
        <div class="t-name">${esc(task.name)}</div>

        <span class="tag subj">${task.subj}</span>
        <span class="tag pace-${task.cls}">
          ${task.pace}
        </span>

        <div class="t-meta">
          ${task.ch} บท ·
          ${task.min} นาที ·
          เฉลี่ย ${task.speed} นาที/บท
        </div>
      </div>

      <div style="text-align:right">
        <div class="t-xp">+${task.xp} EXP</div>

        <div class="btns" style="margin-top:6px">
          ${
            task.done
              ? '<span class="tag pace-fast">✔ เสร็จแล้ว</span>'
              : `<button class="b-done" onclick="completeTask(${task.id})">✔ ทำเสร็จ</button>`
          }

          <button class="b-del" onclick="delTask(${task.id})">
            ลบ
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

function renderShop() {
  $("shop").innerHTML = REWARDS.map((reward, index) => `
    <div class="shop-item">
      <div>
        ${reward.name}
        <div class="t-meta">
          ${reward.cost} EXP
        </div>
      </div>

      <button
        class="b-buy"
        onclick="buy(${index})"
        ${profile.avail < reward.cost ? "disabled" : ""}
      >
        แลก
      </button>
    </div>
  `).join("");
}

function renderAll() {
  renderProfile();
  renderTasks();
  renderShop();
}

// ---------- Utilities ----------

function persist() {
  localStorage.setItem(
    LS_TASKS,
    JSON.stringify(tasks)
  );

  localStorage.setItem(
    LS_PROFILE,
    JSON.stringify(profile)
  );
}

function esc(text) {
  return text.replace(/[<>&"]/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;"
  })[char]);
}

let toastTimer;

function toast(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// ---------- Events ----------

$("btnCalc").onclick = calc;
$("btnSave").onclick = saveTask;

// ---------- Initialize ----------

renderAll();
