let ctx;
const audioCache = new Map();
const objectUrlCache = new Map(); // idb 전용: id -> objectURL

// --- IDB helpers (offscreen도 같은 DB를 엽니다)
const IDB_DB_NAME = "zz_sound_uploads";
const IDB_STORE = "files";
function openUploadDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, {
          keyPath: "id",
          autoIncrement: true,
        }).createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function getUploadBlobById(id) {
  const db = await openUploadDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(Number(id));
    req.onsuccess = () => {
      const rec = req.result;
      resolve(rec?.blob || null);
    };
    req.onerror = () => reject(req.error);
  });
}

async function getAudioBySpec(spec) {
  if (!spec || typeof spec !== "string") spec = "sounds/notification_1.wav";
  if (audioCache.has(spec)) return audioCache.get(spec);

  if (!ctx) ctx = new (self.AudioContext || self.webkitAudioContext())();

  // 1) 오디오 소스 만들기 (내장 vs 업로드)
  let audio, srcUrl;
  if (spec.startsWith("idb:")) {
    const id = spec.slice(4);
    const blob = await getUploadBlobById(id);
    if (!blob) throw new Error("Uploaded sound not found");
    srcUrl = objectUrlCache.get(id);
    if (!srcUrl) {
      srcUrl = URL.createObjectURL(blob);
      objectUrlCache.set(id, srcUrl);
    }
    audio = new Audio(srcUrl);
  } else {
    srcUrl = chrome.runtime.getURL(spec);
    audio = new Audio(srcUrl);
  }

  // 2) Web Audio로 Gain 연결
  const src = ctx.createMediaElementSource(audio);
  const gain = ctx.createGain();
  gain.gain.value = 1;
  src.connect(gain).connect(ctx.destination);

  const node = { audio, src, gain };
  audioCache.set(spec, node);
  return node;
}

let lastPlayAt = 0;
let closeTimer = null;

function scheduleAutoClose() {
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = setTimeout(async () => {
    try {
      await chrome.offscreen.closeDocument();
    } catch (e) {}
  }, 20000);
}

// 모두 멈추기
function stopAllAudios() {
  for (const a of audioCache.values()) {
    try {
      a.audio.pause();
      a.audio.currentTime = 0;
    } catch {}
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "OFFSCREEN_PREVIEW" || msg?.type === "OFFSCREEN_PLAY") {
    (async () => {
      try {
        const url = msg.file || "sounds/notification_1.wav";
        const volume = Math.min(2, Math.max(0, Number(msg.volume ?? 0.6)));

        // 미리듣기만 기존 재생 강제 중지(겹침 방지)
        if (msg.type === "OFFSCREEN_PREVIEW") stopAllAudios();

        const { audio, gain } = await getAudioBySpec(url);
        audio.currentTime = 0;
        audio.volume = 1;
        gain.gain.value = volume;

        if (ctx && ctx.state === "suspended") ctx.resume();
        audio.play();

        lastPlayAt = Date.now();
        scheduleAutoClose();
      } catch (e) {
        console.warn("[offscreen] play failed:", e);
      }
    })();
  }
});
