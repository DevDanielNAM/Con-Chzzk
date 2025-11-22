// --- 상수 정의 ---
const GET_USER_STATUS_API =
  "https://comm-api.game.naver.com/nng_main/v1/user/getUserStatus";
const FOLLOW_API_URL =
  "https://api.chzzk.naver.com/service/v1/channels/followings?size=505";
const POST_API_URL_PREFIX =
  "https://apis.naver.com/nng_main/nng_comment_api/v1/type/CHANNEL_POST/id";
const VIDEO_API_URL =
  "https://api.chzzk.naver.com/service/v2/home/following/videos?size=50";
const LIVE_STATUS_API_PREFIX =
  "https://api.chzzk.naver.com/polling/v3.1/channels";
const CHZZK_LOUNGE_API_URL_PREFIX =
  "https://comm-api.game.naver.com/nng_main/v1/community/lounge/chzzk/feed";
const CHZZK_BANNER_API_URL =
  "https://api.chzzk.naver.com/service/v1/banners?deviceType=PC&positionsIn=HOME_SCHEDULE";
const CHECK_PARTY_INFO_API_URL_PREFIX =
  "https://api.chzzk.naver.com/service/v1/parties";
const CHZZK_CHANNELS_API_URL_PREFIX =
  "https://api.chzzk.naver.com/service/v1/channels";
const CATEGORY_URL_PREFIX = "https://chzzk.naver.com/category";
const LOG_POWER_BASE = CHZZK_CHANNELS_API_URL_PREFIX;
const LOG_POWER_PREDICTION_API_PREFIX =
  "https://api.chzzk.naver.com/service/v1/channels";

const CHECK_ALARM_NAME = "chzzkAllCheck";
const DAILY_OPENING_ALARM = "daily-opening";

const BOOKMARK_LIVE_KEY = "bookmarkLive";
const BOOKMARK_REFRESH_ALARM = "bookmarkLiveRefresh";
const BOOKMARK_LIVE_TTL_MS = 60 * 1000; // 1분

const CHZZK_URL = "https://chzzk.naver.com";
const AUTH_COOKIE_NAME = "NID_AUT";
const HISTORY_LIMIT = 1500;

const LOGPOWER_CATCHUP_BASELINE_KEY = "logpowerCatchupBaselineAt";

const SUMMARY_PAUSE_KEY = "isLogPowerSummaryPaused";
const SUMMARY_KEEP_PAUSE_KEY = "isLogPowerSummaryKeepPaused";

// 저장 키
const LOGPOWER_KNOWN_TOTALS_KEY = "logpower_knownTotals"; // { channelId: { amount, ts, source } }
const LOGPOWER_LAST_PROCESSED_AT = "logpower_lastProcessedAt_by_channel"; // { channelId: ts }
const LOGPOWER_CLIENT_CLAIMS_KEY = "logpower_client_claims"; // { channelId: [{ claimId, amount, ts }, ...], ... }

// *** 실행 잠금을 위한 전역 변수 ***
let isChecking = false;
const donationInfoTtlMap = new Map();

let globalDismissedSet = new Set();

// ==== Adaptive Concurrency & Staggered Scheduler ====
const ADAPTIVE_DEFAULT = {
  live: { c: 4, min: 2, max: 6, ema: 0, alpha: 0.3, lastAdjustAt: 0 },
  video: { c: 3, min: 2, max: 5, ema: 0, alpha: 0.3, lastAdjustAt: 0 },
};

const ADAPTIVE_KEY = "ADAPTIVE_V1";
const ADAPTIVE_TTL_MS = 24 * 60 * 60 * 1000; // 24h 지나면 스테일

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function debounce(fn, ms) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

let ADAPTIVE = structuredClone(ADAPTIVE_DEFAULT);
let _adaptiveLoaded = false;

async function loadAdaptiveOnce() {
  if (_adaptiveLoaded) return;
  const { [ADAPTIVE_KEY]: saved } = await chrome.storage.local.get(
    ADAPTIVE_KEY
  );
  const now = Date.now();
  if (saved?.version === 1) {
    // 병합
    for (const k of Object.keys(ADAPTIVE)) Object.assign(ADAPTIVE[k], saved[k]);
    // 스테일이면 EMA 리셋 및 c 클램프
    if (!saved.updatedAt || now - saved.updatedAt > ADAPTIVE_TTL_MS) {
      for (const k of Object.keys(ADAPTIVE)) {
        const s = ADAPTIVE[k];
        s.ema = 0; // 최신 환경에서 다시 학습
        s.c = clamp(s.c, s.min, s.max);
      }
    }
  }
  _adaptiveLoaded = true;
}

const saveAdaptive = debounce(async () => {
  await chrome.storage.local.set({
    [ADAPTIVE_KEY]: {
      version: 1,
      updatedAt: Date.now(),
      live: ADAPTIVE.live,
      video: ADAPTIVE.video,
    },
  });
}, 2000); // 2초 디바운스

// 적응 로직
async function _adapt(kind, batchTotal, batchErrors) {
  await loadAdaptiveOnce();
  const s = ADAPTIVE[kind];
  if (!s) return;

  const p = batchTotal > 0 ? batchErrors / batchTotal : 0; // 배치 에러율
  s.ema = s.ema === 0 ? p : s.ema * (1 - s.alpha) + p * s.alpha;

  const now = Date.now();
  if (now - s.lastAdjustAt < 30_000) return; // 30초마다 한 스텝만
  const prevC = s.c;

  if (s.ema > 0.15 && s.c > s.min) s.c -= 1;
  else if (s.ema < 0.03 && s.c < s.max) s.c += 1;

  if (s.c !== prevC) {
    s.lastAdjustAt = now;
    saveAdaptive();
  }
}

async function _nextTick() {
  const { _tick = 0 } = await chrome.storage.session.get("_tick");
  const t = (_tick + 1) % 4; // 0..3 회전
  await chrome.storage.session.set({ _tick: t });
  return t;
}

// 라이브/파티는 매 분 유지, 나머지는 분산
function _getTaskPlan(t) {
  return {
    video: t % 2 === 1, // 2분 주기(1,3)
    community: t % 4 === 0, // 4분 주기(0)
    banner: t % 4 === 2, // 4분 주기(2)
    lounge: t % 4 === 2, // 4분 주기(2)
  };
}

// ----- 유틸: storage load/save -----
async function _loadJsonKey(key, defaultValue = {}) {
  const obj = await chrome.storage.local.get(key);
  return obj[key] || defaultValue;
}
async function _saveJsonKey(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

// (2) 기존 핸들러 내부에서 호출할 기록 저장 함수
// 호출 시: await _recordClientClaims(channelId, succeeded, nowTs);
// - succeeded: results.filter(r => r.ok) (각 r 에는 claimId, amount)
// 또는 claimedList (더 풍부한 메타가 있으면 그걸 넘겨도 됨)
async function _recordClientClaims(
  channelId,
  succeededResults = [],
  nowTs = Date.now()
) {
  try {
    const chId = String(channelId);
    const recs = await _loadJsonKey(LOGPOWER_CLIENT_CLAIMS_KEY, {});
    if (!recs[chId]) recs[chId] = [];

    for (const r of succeededResults) {
      if (!r?.claimId) continue;
      recs[chId].push({
        claimId: r.claimId,
        amount: Number(r.amount || 0),
        ts: nowTs,
        claimType: String(r.claimType || "").toUpperCase(),
      });
    }

    // 보존 기간 제한(예: 90일)
    const KEEP_MS = 90 * 24 * 3600 * 1000;
    const cutoff = nowTs - KEEP_MS;
    for (const cid of Object.keys(recs)) {
      recs[cid] = recs[cid].filter((it) => Number(it.ts || 0) >= cutoff);
    }

    await _saveJsonKey(LOGPOWER_CLIENT_CLAIMS_KEY, recs);
  } catch (e) {
    console.warn("_recordClientClaims failed:", e);
  }
}

// (3) claims 합계 계산 보조 (computeExternal에서 사용)
function _sumClaimsForChannelInRange(
  clientClaimsMap,
  channelId,
  sinceTs = 0,
  toTs = Date.now()
) {
  const recs = (clientClaimsMap && clientClaimsMap[channelId]) || [];
  let sum = 0;
  for (const r of recs) {
    const ts = Number(r.ts || 0);
    if (ts >= sinceTs && ts <= toTs) {
      const amount = Number(r.amount || 0);
      sum += amount;

      // 1시간 보상이면 5분 보상치(1:1.2)를 추가 합산
      const claimType = String(r.claimType || "").toUpperCase();
      if (claimType === "WATCH_1_HOUR") {
        sum += amount * 1.2;
      }
    }
  }
  return sum;
}

// (4) 핵심: 스냅샷 차분 방식 기타획득 계산 함수
// summary 생성시에 호출: const external = await computeExternalGainsForSummary();
async function computeExternalGainsForSummary({
  onlyActiveChannels = false,
  noiseThreshold = 1,
  transient = false,
} = {}) {
  try {
    // fetchBalancesNow() 는 기존 background에 있는 함수를 재사용
    const { arr } = await fetchBalancesNow();
    if (!Array.isArray(arr)) return [];

    const nowTs = Date.now();
    const currentMap = Object.fromEntries(
      arr.map((x) => [
        String(x.channelId),
        {
          channelId: String(x.channelId),
          amount: Number(x.amount || 0),
          channelName: x.channelName || "",
          channelImageUrl: x.channelImageUrl || "",
          verifiedMark: !!x.verifiedMark,
        },
      ])
    );

    const knownTotals = await _loadJsonKey(LOGPOWER_KNOWN_TOTALS_KEY, {});
    const lastProcessed = await _loadJsonKey(LOGPOWER_LAST_PROCESSED_AT, {});
    const clientClaims = await _loadJsonKey(LOGPOWER_CLIENT_CLAIMS_KEY, {});

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const openingKey = `logpower_open_${y}-${m}-${d}`;

    // 기준값이 없으면 오늘 오프닝 스냅샷 활용 시도
    if (Object.keys(knownTotals).length === 0) {
      // 오늘 오프닝 스냅샷 로드
      const openingStore = await chrome.storage.local.get(openingKey);
      const opening = openingStore[openingKey];

      if (opening && opening.map) {
        // opening.map: channelId -> { amount, name, imageUrl, ... }
        const externalSummaryFromOpening = [];
        const openingMap = opening.map;

        for (const [chId, cur] of Object.entries(currentMap)) {
          const curAmt = Number(cur.amount || 0);
          const openEntry = openingMap[chId];
          const openAmt = openEntry ? Number(openEntry.amount || 0) : 0;

          let delta = curAmt - openAmt;

          // client가 수령한 합계(오프닝 기준 이후 to now) 만큼 차감
          if (!transient) {
            const sinceTs = Number(opening.ts || 0) || 0;
            const claimedByThisClient = _sumClaimsForChannelInRange(
              clientClaims,
              chId,
              sinceTs,
              nowTs
            );
            delta -= claimedByThisClient;
          }

          if (delta > noiseThreshold) {
            externalSummaryFromOpening.push({
              channelId: chId,
              channelName:
                cur.channelName ||
                (openingMap[chId] && openingMap[chId].name) ||
                "",
              channelImageUrl:
                cur.channelImageUrl ||
                (openingMap[chId] && openingMap[chId].imageUrl) ||
                "",
              externalGain: Math.round(delta),
              knownAmount: openAmt,
              currentAmount: curAmt,
            });
          }

          // 기준값/lastProcessed는 항상 최신으로 동기화
          knownTotals[chId] = {
            amount: curAmt,
            ts: nowTs,
            source: "auto_from_opening",
          };
          lastProcessed[chId] = nowTs;
        }

        // transient 아니면 저장
        if (!transient) {
          await Promise.all([
            _saveJsonKey(LOGPOWER_KNOWN_TOTALS_KEY, knownTotals),
            _saveJsonKey(LOGPOWER_LAST_PROCESSED_AT, lastProcessed),
          ]);
        }

        return externalSummaryFromOpening;
      }

      // else: opening snapshot 없으면 기존 행동 (init baseline and return [])
      const initBaseline = {};
      for (const [chId, cur] of Object.entries(currentMap)) {
        const curAmt = Number(cur.amount || 0);
        initBaseline[chId] = { amount: curAmt, ts: nowTs, source: "init" };
        lastProcessed[chId] = nowTs;
      }

      if (!transient) {
        await Promise.all([
          _saveJsonKey(LOGPOWER_KNOWN_TOTALS_KEY, initBaseline),
          _saveJsonKey(LOGPOWER_LAST_PROCESSED_AT, lastProcessed),
        ]);
      }

      return [];
    }

    const externalSummary = [];

    for (const [chId, cur] of Object.entries(currentMap)) {
      if (onlyActiveChannels) {
        // 필요시 활성 채널 필터 추가 (현재는 pass)
      }

      const curAmt = Number(cur.amount || 0);
      const known = knownTotals[chId] || { amount: 0, ts: 0 };

      let delta = curAmt - Number(known.amount || 0);

      if (!transient) {
        // client가 수령한 합계(known 기준 이후 to now) 만큼 차감
        const sinceTs = Number(lastProcessed[chId] || 0) || 0;
        const claimedByThisClient = _sumClaimsForChannelInRange(
          clientClaims,
          chId,
          sinceTs,
          nowTs
        );
        delta -= claimedByThisClient;
      }

      if (delta > noiseThreshold) {
        externalSummary.push({
          channelId: chId,
          channelName: cur.channelName || "",
          channelImageUrl: cur.channelImageUrl || "",
          externalGain: Math.round(delta),
          knownAmount: Number(known.amount || 0),
          currentAmount: curAmt,
        });
      }

      // 기준값/lastProcessed는 항상 최신으로 동기화
      knownTotals[chId] = { amount: curAmt, ts: nowTs, source: "auto" };
      lastProcessed[chId] = nowTs;
    }

    // 저장
    if (!transient) {
      await Promise.all([
        _saveJsonKey(LOGPOWER_KNOWN_TOTALS_KEY, knownTotals),
        _saveJsonKey(LOGPOWER_LAST_PROCESSED_AT, lastProcessed),
      ]);
    }

    return externalSummary;
  } catch (e) {
    console.error("computeExternalGainsForSummary failed:", e);
    return [];
  }
}

// (5) 주간/월간/연말 요약을 위해 일간 '기타 획득' 스냅샷을 집계하는 함수
async function aggregateExternalGainsFromDailySnapshots(start, end) {
  const aggMap = new Map();
  // end 날짜도 포함
  const loopEnd = new Date(end);
  let dayCount = 0;

  for (let d = new Date(start); d <= loopEnd; d.setDate(d.getDate() + 1)) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const ymd = `${yyyy}-${mm}-${dd}`;

    const key = `logpower_ext_snap_${ymd}`;

    // _loadJsonKey는 비동기이므로 루프 내에서 await
    const dailySnap = await _loadJsonKey(key, []);
    dayCount++;

    // dailySnap이 배열인지 확인 (오류 방지)
    if (!Array.isArray(dailySnap)) {
      continue;
    }

    for (const entry of dailySnap) {
      if (!entry || !entry.channelId) continue;

      const chId = String(entry.channelId);
      const gain = Number(entry.externalGain || 0);
      if (gain <= 0) continue;

      const acc = aggMap.get(chId) || {
        channelId: chId,
        channelName: entry.channelName || "",
        channelImageUrl: entry.channelImageUrl || "",
        externalGain: 0,
        knownAmount: 0, // 첫날 값으로 설정
        currentAmount: 0, // 마지막 날 값으로 설정
        _firstDay: 0,
        _lastDay: 0,
      };

      acc.externalGain += gain;

      // 맵에 없던(새로 생성된) 채널이면, 이번 dayCount를 _firstDay로 설정
      // (entry.knownAmount가 이 날짜의 시작값이 됨)
      if (acc._firstDay === 0) {
        acc.knownAmount = Number(entry.knownAmount || 0);
        acc._firstDay = dayCount;
      }

      // 이 채널을 본 마지막 날짜(dayCount)를 항상 갱신
      // (entry.currentAmount가 이 날짜의 종료값이 됨)
      acc.currentAmount = Number(entry.currentAmount || 0);
      acc.channelName = entry.channelName || acc.channelName;
      acc.channelImageUrl = entry.channelImageUrl || acc.channelImageUrl;
      acc._lastDay = dayCount;

      aggMap.set(chId, acc);
    }
  }
  return Array.from(aggMap.values());
}

const CLAIM_TYPE_ALIAS = {
  WATCH_1_HOUR: "시청 1시간",
  WATCH_5_MINUTE: "시청 5분",
  FOLLOW: "팔로우",
};

function normalizeClaimType(ct) {
  const raw = String(ct || "").toUpperCase();
  if (CLAIM_TYPE_ALIAS[raw]) return CLAIM_TYPE_ALIAS[raw];
  return raw
    .split("_")
    .map((s) => s.charAt(0) + s.slice(1).toLowerCase())
    .join(" ");
}

async function ensureTodayOpeningSnapshotBG() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  const dailyKey = `logpower_open_${yyyy}-${mm}-${dd}`;
  const got = await chrome.storage.local.get(dailyKey);
  if (!got[dailyKey]) {
    const { arr } = await fetchBalancesNow();
    const openMap = Object.fromEntries(
      arr.map((x) => [
        x.channelId,
        {
          amount: Number(x.amount) || 0,
          name: x.channelName || "",
          imageUrl: x.channelImageUrl || "",
          verifiedMark: !!x.verifiedMark,
        },
      ])
    );
    const midnight = new Date(yyyy, today.getMonth(), today.getDate());
    const minutesLate = Math.round((today - midnight) / 60000);
    await chrome.storage.local.set({
      [dailyKey]: { ts: Date.now(), map: openMap, late: minutesLate > 30 },
    });
  }

  // 월초(1일) → 월간 핀
  if (dd === "01") {
    const monthKey = `logpower_open_month_${yyyy}-${mm}`;
    const store = await chrome.storage.local.get(monthKey);
    if (!store[monthKey]) {
      const daily = (await chrome.storage.local.get(dailyKey))[dailyKey];
      if (daily) await chrome.storage.local.set({ [monthKey]: daily });
    }
  }

  // 연초(1월 1일) → 연간 핀
  if (mm === "01" && dd === "01") {
    const yearKey = `logpower_open_year_${yyyy}`;
    const store = await chrome.storage.local.get(yearKey);
    if (!store[yearKey]) {
      const daily = (await chrome.storage.local.get(dailyKey))[dailyKey];
      if (daily) await chrome.storage.local.set({ [yearKey]: daily });
    }
  }

  // 저장 직후 오래된 키 정리
  await cleanupOpeningSnapshots({
    keepDailyDays: 45,
    keepMonths: 15,
    keepYears: 3,
  });
}

// --- 초기 로그인 상태를 확인하고 아이콘을 설정하는 함수 ---
async function checkInitialLoginStatus() {
  try {
    const cookie = await chrome.cookies.get({
      url: CHZZK_URL,
      name: AUTH_COOKIE_NAME,
    });

    if (cookie) {
      chrome.action.setIcon({ path: "icon_128.png" });
      chrome.action.setBadgeText({ text: "" });
      checkFollowedChannels();
    } else {
      chrome.action.setIcon({ path: "icon_disabled.png" });
      chrome.action.setBadgeText({ text: "X" });
      chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
    }
  } catch (error) {
    console.error("Error checking initial cookie:", error);
  }
}

// --- 쿠키 변경을 실시간으로 감지하는 리스너 ---
chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.cookie.name !== AUTH_COOKIE_NAME) return;
  if (changeInfo.removed) {
    chrome.action.setIcon({ path: "icon_disabled.png" });
    chrome.action.setBadgeText({ text: "X" });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
    chrome.storage.session.set({ cachedLoginStatus: { isLoggedIn: false } });
  } else {
    chrome.action.setIcon({ path: "icon_128.png" });
    chrome.action.setBadgeText({ text: "" });

    checkFollowedChannels();
  }
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local" || !changes[SUMMARY_PAUSE_KEY]) return;

  if (area === "local" && changes.dismissedNotificationIds) {
    const arr = changes.dismissedNotificationIds.newValue || [];
    globalDismissedSet = new Set(arr);
  }

  const paused = changes[SUMMARY_PAUSE_KEY].newValue === true;

  if (paused) {
    await chrome.alarms.clear(LOGPOWER_SUMMARY_ALARM);
    await chrome.alarms.clear(LOGPOWER_CATCHUP_ALARM);
  } else {
    // 켜질 때 알람/캐치업 재개
    chrome.alarms.create(LOGPOWER_SUMMARY_ALARM, {
      when: atNextLocalTime(0, 5),
      periodInMinutes: 24 * 60,
    });

    const { logpowerSummaryLastRun = {} } = await chrome.storage.local.get(
      "logpowerSummaryLastRun"
    );
    if (Object.keys(logpowerSummaryLastRun).length === 0) {
      // 최초 켜짐 시점 이후만 캐치업하도록 베이스라인 기록
      await chrome.storage.local.set({
        [LOGPOWER_CATCHUP_BASELINE_KEY]: Date.now(),
      });
    }

    await ensureCatchupSchedule(new Date());
  }
});

const LOGPOWER_SUMMARY_ALARM = "logpower:summary:daily";

function atNextLocalTime(h = 0, m = 5) {
  const now = new Date();
  const t = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    h,
    m,
    0,
    0
  );
  if (t <= now) t.setDate(t.getDate() + 1);
  return t.getTime();
}
// 자정+5분에 매일 갱신(알람)
function minutesUntilNext00_05() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(0, 5, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return Math.ceil((next - now) / 60000);
}
async function ensureDailyOpeningAlarm() {
  try {
    const existing = await chrome.alarms.get(DAILY_OPENING_ALARM);
    if (existing) return; // 이미 있으면 그대로
  } catch (e) {
    // 일부 환경에서 get 실패 시 그대로 재생성 쪽으로 진행
    console.warn("[daily-opening] alarms.get failed:", e);
  }

  // 최소 1분 보장
  const delay = Math.max(1, minutesUntilNext00_05());
  chrome.alarms.create(DAILY_OPENING_ALARM, {
    delayInMinutes: delay,
    periodInMinutes: 24 * 60, // 매일 반복
  });
  console.log("[daily-opening] alarm (re)created, first in", delay, "min");
}
async function cleanupOpeningSnapshots({
  keepDailyDays = 45,
  keepMonths = 15,
  keepYears = 3,
} = {}) {
  const all = await chrome.storage.local.get(null);

  const dailyPrefix = "logpower_open_"; // YYYY-MM-DD
  const monthPrefix = "logpower_open_month_"; // YYYY-MM
  const yearPrefix = "logpower_open_year_"; // YYYY

  const now = new Date();

  // cutoff 계산
  const dailyCutoff = new Date(now.getTime() - keepDailyDays * 86400000)
    .toISOString()
    .slice(0, 10); // YYYY-MM-DD

  const monthCutoff = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1 - keepMonths, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
  })();

  const yearCutoff = String(now.getFullYear() + 1 - keepYears); // YYYY

  const toRemove = [];

  for (const k of Object.keys(all)) {
    if (k.startsWith(yearPrefix)) {
      const y = k.slice(yearPrefix.length, yearPrefix.length + 4); // YYYY
      if (y < yearCutoff) toRemove.push(k);
      continue;
    }
    if (k.startsWith(monthPrefix)) {
      const ym = k.slice(monthPrefix.length, monthPrefix.length + 7); // YYYY-MM
      if (ym < monthCutoff) toRemove.push(k);
      continue;
    }
    if (k.startsWith(dailyPrefix)) {
      // 제외: 월간핀/연간핀 접두사와 구분되게 prefix를 정확히 비교했으니 daily만 여기 도착
      const ymd = k.slice(dailyPrefix.length, dailyPrefix.length + 10); // YYYY-MM-DD
      if (ymd < dailyCutoff) toRemove.push(k);
      continue;
    }
  }

  if (toRemove.length) {
    await chrome.storage.local.remove(toRemove);
  }
}

// --- 확장 프로그램 설치 시 알람 생성 ---
chrome.runtime.onInstalled.addListener(async (details) => {
  chrome.alarms.create(CHECK_ALARM_NAME, {
    periodInMinutes: 1,
    when: Date.now() + 1000,
  });

  chrome.alarms.create(LOGPOWER_SUMMARY_ALARM, {
    when: atNextLocalTime(0, 5),
    periodInMinutes: 24 * 60,
  });

  try {
    // 1. 오늘 날짜 구하기 (KST 기준)
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const openingKey = `logpower_open_${todayStr}`;

    // 기타 획득 스냅샷 키
    const extSnapKey = `logpower_ext_snap_${todayStr}`;

    // 2. 이미 스냅샷이 있는지 확인 (있으면 건너뜀)
    const store = await chrome.storage.local.get(openingKey);
    // 스냅샷이 없을 때 (=최초 설치 또는 오늘 처음 실행된 업데이트)
    if (!store[openingKey]) {
      // 3. 현재 보유량 조회
      const { arr } = await fetchBalancesNow();

      if (arr && arr.length > 0) {
        // A. 오프닝 스냅샷 저장
        const currentMap = Object.fromEntries(
          arr.map((x) => [
            String(x.channelId),
            {
              amount: Number(x.amount) || 0,
              name: x.channelName || "",
              imageUrl: x.channelImageUrl || "",
              verifiedMark: !!x.verifiedMark,
            },
          ])
        );

        const opening = {
          ts: Date.now(),
          map: currentMap,
          late: true,
        };

        await chrome.storage.local.set({ [openingKey]: opening });
        console.log(
          `[Con:Chzzk] Created backup opening snapshot: ${openingKey}`
        );

        // B. 현재 보유량 전체를 '기타 획득'으로 간주하여 스냅샷 생성
        //    이렇게 해두면, 이후 runLogPowerSummaries가 실행될 때 이 데이터를 불러와 병합
        const initialExternalGains = arr
          .map((x) => ({
            channelId: String(x.channelId),
            channelName: x.channelName || "",
            channelImageUrl: x.channelImageUrl || "",
            externalGain: Number(x.amount) || 0, // 전체를 획득량으로 잡음
            knownAmount: 0, // 0부터 시작했다고 가정
            currentAmount: Number(x.amount) || 0,
            verifiedMark: !!x.verifiedMark,
          }))
          .filter((x) => x.externalGain > 0); // 0인 채널 제외

        await chrome.storage.local.set({ [extSnapKey]: initialExternalGains });
        console.log(
          `[Con:Chzzk] Seeded initial external gains to ${extSnapKey}`
        );
      }
    }
  } catch (err) {
    console.error("Failed to create opening snapshot onInstalled:", err);
  }

  // '처음'일 때만 baseline 기록
  const { logpowerSummaryLastRun = {} } = await chrome.storage.local.get(
    "logpowerSummaryLastRun"
  );
  if (Object.keys(logpowerSummaryLastRun).length === 0) {
    await chrome.storage.local.set({
      [LOGPOWER_CATCHUP_BASELINE_KEY]: Date.now(),
    });
  }

  await ensureCatchupSchedule(new Date());
  ensureTodayOpeningSnapshotBG();
  ensureDailyOpeningAlarm();
  cleanupOpeningSnapshots();

  chrome.alarms.create(BOOKMARK_REFRESH_ALARM, {
    periodInMinutes: 1,
    when: Date.now() + 1000,
  });

  // --- 마이그레이션 로직 ---
  // 설치 또는 업데이트 시에만 실행
  if (details.reason === "install" || details.reason === "update") {
    const { migrated_v3 } = await chrome.storage.local.get("migrated_v3");
    if (migrated_v3) await chrome.storage.local.remove("migrated_v3");

    const { is_banner_id_migrated } = await chrome.storage.local.get(
      "is_banner_id_migrated"
    );
    if (is_banner_id_migrated)
      await chrome.storage.local.remove("is_banner_id_migrated");
  }

  // '업데이트' 시에만 실행되는 로직
  if (details.reason === "update") {
    updateUnreadCountBadge();

    try {
      const targetUrl = `${CHZZK_URL}/*`;
      const tabs = await chrome.tabs.query({ url: targetUrl });

      for (const tab of tabs) {
        // 1. 이전 버전의 타이머 정리
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => {
            const STORAGE_KEY = "chzzkExt_loginMonitorId";
            const intervalId = sessionStorage.getItem(STORAGE_KEY);
            if (intervalId) {
              clearInterval(Number(intervalId));
              sessionStorage.removeItem(STORAGE_KEY);
            }
          },
        });

        // 2. 업데이트 안내 배너 삽입
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: showUpdateNotificationBanner,
          });
        } catch (e) {
          console.error(`[${tab.id}] Fail to insert banner into tab:`, e);
        }
      }
    } catch (error) {
      console.warn(
        "Error occurred while clearing the previous timer.:",
        error.message
      );
    }
  }
  checkInitialLoginStatus();
});

/**
 * 페이지 내에 업데이트 안내 배너를 표시하는 함수.
 * 이 함수는 executeScript를 통해 페이지 컨텍스트에서 실행
 */
function showUpdateNotificationBanner() {
  // 이미 배너가 있다면 중복 생성 방지
  if (document.getElementById("chzzk-ext-update-banner")) {
    return;
  }

  const banner = document.createElement("div");
  banner.id = "chzzk-ext-update-banner";
  banner.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-around;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: #772ce8;
    color: white;
    text-align: center;
    padding: 12px;
    font-size: 14px;
    z-index: 99999;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: transform 0.35s cubic-bezier(.57,-0.15,.37,1.31), opacity 0.35s cubic-bezier(.57,-0.15,.37,1.31);
  `;

  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    width: 98%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
  `;

  const message = document.createElement("span");
  message.textContent =
    "콘치즈 확장 프로그램이 업데이트 되었습니다. 최신 기능을 적용하려면 페이지를 새로고침해주세요. ";

  const refreshButton = document.createElement("button");
  refreshButton.textContent = "새로고침";
  refreshButton.style.cssText = `
    background-color: #00ffa3;
    color: #121212;
    border: none;
    border-radius: 4px;
    padding: 4px 10px;
    font-weight: bold;
    cursor: pointer;
  `;
  refreshButton.onclick = () => {
    banner.style.transform = "translateY(-50px)";
    banner.style.opacity = "0";
    // 버튼 클릭 시 페이지를 새로고침
    setTimeout(() => location.reload(), 200);
  };

  wrapper.append(message, refreshButton);

  const closeButton = document.createElement("span");
  closeButton.textContent = "×";
  closeButton.style.cssText = `
    cursor: pointer;
    font-size: 20px;
    font-weight: bold;
  `;
  closeButton.onclick = () => {
    banner.style.transform = "translateY(-50px)";
    banner.style.opacity = "0";
    // 닫기 버튼 클릭 시 배너 제거
    setTimeout(() => banner.remove(), 350);
  };

  banner.append(wrapper, closeButton);
  document.body.appendChild(banner);
}

// --- 오프스크린 문서 보장
async function ensureOffscreenDocument() {
  // Chrome 109+ 에서는 hasDocument 지원
  if (chrome.offscreen.hasDocument) {
    const has = await chrome.offscreen.hasDocument();
    if (has) return false;
  }
  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL("offscreen.html"),
    reasons: ["AUDIO_PLAYBACK"],
    justification:
      "Play a short alert sound when a followed streamer goes live",
  });
  return true; // 문서를 새로 만듦
}

// === per-type 사운드 재생 유틸 ===
const DEFAULT_SOUND_SETTINGS = {
  live: { enabled: true, file: "notification_1.wav", volume: 0.3 },
  combo: { enabled: true, file: "notification_2.wav", volume: 0.6 },
  category: { enabled: true, file: "notification_3.wav", volume: 0.5 },
  liveTitle: { enabled: true, file: "notification_4.wav", volume: 0.45 },
  watchParty: { enabled: true, file: "notification_7.mp3", volume: 0.3 },
  drops: { enabled: true, file: "notification_9.mp3", volume: 0.35 },
  prediction: { enabled: true, file: "notification_16.mp3", volume: 0.3 },
  logpower: { enabled: true, file: "notification_6.wav", volume: 0.5 },
  party: { enabled: true, file: "notification_10.wav", volume: 1.0 },
  donation: { enabled: true, file: "notification_16.mp3", volume: 0.3 },
  restrict: { enabled: true, file: "notification_8.flac", volume: 0.3 },
  video: { enabled: true, file: "notification_12.ogg", volume: 0.3 },
  community: { enabled: true, file: "notification_11.mp3", volume: 0.4 },
  lounge: { enabled: true, file: "notification_17.mp3", volume: 0.3 },
  banner: { enabled: true, file: "notification_5.wav", volume: 0.35 },
};

function clamp(v, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

// 전역(마스터) 기본값/로드
const DEFAULT_SOUND_GLOBAL = { enabled: true, volume: 1.0 };
async function getSoundGlobal() {
  const { soundGlobal = DEFAULT_SOUND_GLOBAL } = await chrome.storage.local.get(
    "soundGlobal"
  );
  return {
    enabled: !!soundGlobal.enabled,
    volume: Math.min(2, Math.max(0, Number(soundGlobal.volume ?? 1))),
  };
}

async function getSoundSettings() {
  const { soundSettings = {} } = await chrome.storage.local.get(
    "soundSettings"
  );
  // default와 병합
  const merged = { ...DEFAULT_SOUND_SETTINGS, ...soundSettings };
  // 각 키도 2단 병합(부분 저장 대비)
  for (const k of Object.keys(DEFAULT_SOUND_SETTINGS)) {
    merged[k] = { ...DEFAULT_SOUND_SETTINGS[k], ...(soundSettings[k] || {}) };
  }
  return merged;
}

async function playSoundFor(kind) {
  try {
    const settings = await getSoundSettings();
    const s = settings[kind] ||
      DEFAULT_SOUND_SETTINGS[kind] || { enabled: false };
    if (!s || !s.enabled) return;

    const g = await getSoundGlobal();
    if (!g.enabled) return;

    const filePath =
      s.file && String(s.file).startsWith("idb:") ? s.file : `sounds/${s.file}`;

    const created = await ensureOffscreenDocument();
    if (created) await sleep(100); // 오프스크린이 준비될 때까지 잠시 대기

    await chrome.runtime.sendMessage({
      type: "OFFSCREEN_PLAY",
      file: filePath,
      volume: Math.min(2, Math.max(0, Number(s.volume ?? 0.6) * g.volume)),
    });
  } catch (e) {
    console.warn("[sound] failed:", e);
  }
}

// --- 브라우저가 시작될 때 초기 상태 확인 ---
chrome.runtime.onStartup.addListener(async () => {
  // 알람이 사라졌으면 재생성(00:05로 설정)
  const a = await chrome.alarms.get(LOGPOWER_SUMMARY_ALARM);
  if (!a) {
    chrome.alarms.create(LOGPOWER_SUMMARY_ALARM, {
      when: atNextLocalTime(0, 5), // 00:05
      periodInMinutes: 24 * 60,
    });
  }
  await ensureCatchupSchedule(new Date());
  ensureDailyOpeningAlarm();
  cleanupOpeningSnapshots();
  await ensureTodayOpeningSnapshotBG();
});

// --- 읽지 않은 알림 수를 계산하여 아이콘 배지에 표시하는 함수 ---
async function updateUnreadCountBadge() {
  const data = await chrome.storage.local.get("notificationHistory");
  const history = data.notificationHistory || [];

  const { displayLimit = 300 } = await chrome.storage.local.get("displayLimit");
  const displayHistory = history.slice(0, displayLimit);

  // 'read: false'인 알림의 개수
  const unreadCount = displayHistory.filter((item) => !item.read).length;

  if (unreadCount > 0) {
    // 읽지 않은 알림이 있으면, 배지에 숫자를 표시
    chrome.action.setBadgeText({ text: String(unreadCount) });
    chrome.action.setBadgeBackgroundColor({ color: "#59ff0080" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// --- 본문 정규화/자르기 헬퍼 함수 ---
function normalizeBody(text) {
  // 1. Windows(CRLF: \r\n) 및 구형 Mac(CR: \r)의 줄바꿈 문자를
  //    macOS/Unix(LF: \n) 스타일로 통일
  const normalizedText = (text || "").replace(/\r\n|\r/g, "\n");

  // 2. 눈에 보이지 않는 '제로 너비 공백(Zero-Width Space)' 문자를 모두 제거
  const noZeroWidthSpaceText = normalizedText.replace(/\u200B/g, "");

  // 3. 공백이 끼어 있는 두 줄 구분자도 두 줄로 변경
  const oneBlankLineNormalized = noZeroWidthSpaceText.replace(
    /\n[ \t]+\n/g,
    "\n\n"
  );

  // 3. 세 줄 이상의 연속된 줄바꿈을 두 줄로 축소
  return oneBlankLineNormalized.replace(/(?:\n[ \t]*){3,}/g, "\n\n");
}

// 문단 개수 세기
function countParagraphs(text) {
  if (!text) return 0;

  const norm = String(text)
    .replace(/\r\n?/g, "\n") // 개행 통일
    .replace(/^[ \t]+$/gm, "") // 공백만 있는 라인 → 빈 라인
    .trim();

  // 1개 이상의 빈 줄(공백 포함) 시퀀스를 문단 구분자로 간주
  const paragraphs = norm
    .split(/\n[ \t]*\n(?:[ \t]*\n)*/)
    .filter((p) => p.trim() !== "");

  return paragraphs.length;
}

function makeExcerptWithAttaches(text) {
  const collapsed = normalizeBody(text || "");
  const paraCount = countParagraphs(collapsed);
  const max =
    paraCount > 6
      ? 280
      : paraCount > 5
      ? 300
      : paraCount > 4
      ? 320
      : paraCount > 3
      ? 350
      : paraCount > 2
      ? 370
      : 380;
  return collapsed.length > max
    ? collapsed.slice(0, max).replace(/\s+\S*$/, "") + " ...(더보기)"
    : collapsed;
}

function makeExcerpt(text) {
  const collapsed = normalizeBody(text || "");
  const paraCount = countParagraphs(collapsed);
  const max = paraCount > 9 ? 400 : 420;
  return collapsed.length > max
    ? collapsed.slice(0, max).replace(/\s+\S*$/, "") + " ...(더보기)"
    : collapsed;
}

// --- 날짜 파싱 함수 ---
function parseTimestampFormat(timestamp) {
  // YYYYMMDDHHmmss 형식의 문자열인지 확인
  if (typeof timestamp === "string" && /^\d{14}$/.test(timestamp)) {
    const y = Number(timestamp.slice(0, 4));
    const mo = Number(timestamp.slice(4, 6)) - 1; // 월은 0부터 시작
    const d = Number(timestamp.slice(6, 8));
    const h = Number(timestamp.slice(8, 10));
    const mi = Number(timestamp.slice(10, 12));
    const s = Number(timestamp.slice(12, 14));
    return new Date(y, mo, d, h, mi, s);
  } else {
    // 그 외 표준 형식(ISO 8601 등)은 new Date()로 처리
    return new Date(timestamp);
  }
}

async function getBookmarks() {
  return new Promise((resolve) =>
    chrome.storage.local.get(["chzzkBookmarks"], (res) =>
      resolve(res["chzzkBookmarks"] || [])
    )
  );
}

async function setBookmarks(list) {
  return new Promise((resolve) =>
    chrome.storage.local.set({ chzzkBookmarks: list }, () => resolve(true))
  );
}

async function fetchLiveOpenMap(
  channelIds,
  { batchSize = 20, delay = 150 } = {}
) {
  const result = {};
  for (let i = 0; i < channelIds.length; i += batchSize) {
    const batch = channelIds.slice(i, i + batchSize);
    const promises = batch.map((id) =>
      fetch(`${LIVE_STATUS_API_PREFIX}/${id}/live-status`)
        .then((r) => r.json())
        .then((j) => ({ id, open: j?.content?.status === "OPEN" }))
        .catch(() => ({ id, open: false }))
    );
    const settled = await Promise.all(promises);
    for (const { id, open } of settled) result[id] = { live: !!open };
    if (i + batchSize < channelIds.length) {
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return result;
}

async function refreshBookmarkLiveStatus(force = false) {
  const prev = await chrome.storage.local.get([BOOKMARK_LIVE_KEY]);
  const cache = prev[BOOKMARK_LIVE_KEY] || { updatedAt: 0, data: {} };
  const fresh = Date.now() - cache.updatedAt < BOOKMARK_LIVE_TTL_MS;

  if (fresh && !force) return cache.data;

  const list = await getBookmarks();
  const ids = [...new Set(list.map((b) => b.channelId))];
  if (ids.length === 0) {
    const empty = { updatedAt: Date.now(), data: {} };
    await chrome.storage.local.set({ [BOOKMARK_LIVE_KEY]: empty });
    return empty.data;
  }

  const data = await fetchLiveOpenMap(ids);
  await chrome.storage.local.set({
    [BOOKMARK_LIVE_KEY]: { updatedAt: Date.now(), data },
  });
  return data;
}

// --- 알람 리스너 ---
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === CHECK_ALARM_NAME) {
    checkFollowedChannels();
  }
  if (alarm.name === LOGPOWER_SUMMARY_ALARM) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    runLogPowerSummaries(yesterday).catch((e) =>
      console.warn("[logpower:summary] failed:", e)
    );
  }
  if (alarm.name === LOGPOWER_CATCHUP_ALARM) {
    (async () => {
      const missing = await missingKinds(new Date());
      for (const { kind, anchor } of missing) {
        // 각 기간별 "직전" 앵커로 강제 실행
        await runLogPowerSummaries(anchor, [kind]);
      }
      await ensureCatchupSchedule(new Date()); // 아직 남았으면 다음 슬롯 예약
    })().catch((e) => console.warn("[logpower:catchup] failed:", e));
  }
  if (alarm.name === DAILY_OPENING_ALARM) {
    ensureTodayOpeningSnapshotBG();
    cleanupOpeningSnapshots();
  }
  if (alarm.name === BOOKMARK_REFRESH_ALARM) {
    refreshBookmarkLiveStatus();
  }
});

// 작은 유틸들
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseRetryAfter(h) {
  if (!h) return null;
  // seconds or HTTP-date
  const secs = Number(h);
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000);
  const t = Date.parse(h);
  if (!Number.isNaN(t)) return Math.max(0, t - Date.now());
  return null;
}

function linkAbortSignals(source, targetController) {
  if (!source) return () => {};
  const onAbort = () => targetController.abort(source.reason);
  source.addEventListener("abort", onAbort, { once: true });
  return () => source.removeEventListener("abort", onAbort);
}

const shouldRetryError = (err) => {
  if (!err) return false;

  // 우리가 건 타임아웃/중단
  if (err.name === "AbortError") return true;
  if (err.cause === "timeout" || err.message === "timeout") return true; // controller.abort('timeout') 케이스

  // 브라우저별 네트워크 계열 메시지 (느슨한 휴리스틱)
  if (err instanceof TypeError) {
    const m = (err.message || "").toLowerCase();
    if (
      m.includes("failed to fetch") || // Chromium
      m.includes("networkerror") || // Firefox: "NetworkError when attempting to fetch resource."
      m.includes("load failed") || // 일부 런타임
      m.includes("offline")
    ) {
      return true;
    }
    // 메시지가 비어있는 TypeError도 1~2회는 시도해 볼 가치가 있음
    return m === "";
  }

  return false;
};

/**
 * 견고한 fetch 재시도 래퍼
 *
 * @param {string|Request} url
 * @param {RequestInit} options
 * @param {object} cfg
 *  - retries: 시도 횟수 (기본 4 → 총 1+4회 시도)
 *  - timeout: 각 시도별 타임아웃(ms)
 *  - minDelay: 최소 대기(ms)
 *  - maxDelay: 최대 대기(ms)
 *  - backoffFactor: 지수 백오프 계수
 *  - jitter: true면 full jitter 적용
 *  - retryOn: (attempt, error, response) => boolean (커스터마이즈)
 *  - onRetry: (attempt, delayMs, errorOrResponse) => void (로깅 훅)
 */
async function fetchWithRetry(
  url,
  options = {},
  {
    retries = 4,
    timeout = 11000,
    minDelay = 300, // 첫 백오프
    maxDelay = 8000, // 상한
    backoffFactor = 2,
    jitter = true,
    retryOn,
    onRetry,
    maxRetryAfter = 60_000,
  } = {}
) {
  // 기본 retry 기준: 네트워크 에러/AbortError, 5xx, 408/425/429
  const defaultRetryOn = (attempt, err, res) => {
    if (err) return shouldRetryError(err);
    if (!res) return false;
    if (res.status === 408 || res.status === 425 || res.status === 429)
      return true;
    if (res.status >= 500) return true;
    return false;
  };

  const shouldRetry = retryOn || defaultRetryOn;
  let lastError = null;

  const calculateWait = (attempt) => {
    const base = Math.min(
      maxDelay,
      minDelay * Math.pow(backoffFactor, attempt)
    );
    return jitter ? Math.floor(Math.random() * base) : base;
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const clearLink = linkAbortSignals(options.signal, controller);

    const timeoutId = setTimeout(() => controller.abort("timeout"), timeout);
    const startedAt = performance.now();

    try {
      // navigator.onLine은 MV3 SW에선 신뢰도 낮음 → 단순 참고만
      if (
        typeof navigator !== "undefined" &&
        navigator &&
        navigator.onLine === false
      ) {
        throw new TypeError("Network is offline");
      }

      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!res.ok) {
        // 재시도 대상인지 판정
        if (attempt < retries && shouldRetry(attempt, null, res)) {
          // Retry-After 존중
          const ra = parseRetryAfter(res.headers.get("Retry-After"));
          const backoff = calculateWait(attempt);
          const wait =
            ra != null
              ? Math.max(Math.min(ra, maxRetryAfter), backoff)
              : backoff;

          onRetry?.(attempt + 1, wait, res);
          await sleep(wait);
          continue;
        }
        // 재시도 대상 아님 → 즉시 던짐
        const err = new Error(`HTTP ${res.status} ${res.statusText}`);
        err.response = res;
        throw err;
      }

      // 성공
      return res;
    } catch (err) {
      if (attempt < retries && shouldRetryError(err)) {
        const wait = calculateWait(attempt);
        onRetry?.(attempt + 1, wait, err);
        await sleep(wait);
        continue;
      }

      // 최종 실패
      const elapsed = Math.round(performance.now() - startedAt);
      const wrapped = new Error(
        `fetchWithRetry failed after ${attempt + 1} attempts (${elapsed}ms): ${
          err?.message || err
        }`
      );
      wrapped.cause = err;
      wrapped.url = url;
      throw wrapped;
    } finally {
      clearTimeout(timeoutId);
      clearLink();
    }
  }

  // 이 지점은 보통 도달하지 않음
  throw lastError || new Error("fetchWithRetry: unknown error");
}

/**
 * live-detail API를 호출하여 라이브의 상세 정보를 가져오는 함수
 * @param {string} channelId - 채널 ID
 * @returns {Promise<Object>} - 라이브 상세 정보 content 객체
 */
async function fetchLiveDetail(channelId) {
  // API URL 끝에 타임스탬프를 추가하여 캐시 문제를 방지
  const url = `https://api.chzzk.naver.com/service/v3.2/channels/${channelId}/live-detail?b=${Date.now()}`;
  const response = await fetchWithRetry(url, { maxRetryAfter: 120_000 });
  const data = await response.json();
  if (data.code !== 200) {
    throw new Error(
      `Live details fetch failed with code ${data.code}: ${data.message}`
    );
  }

  const content = data.content;

  if (content) {
    const { livePlaybackJson, livePollingStatusJson, ...rest } = content;

    return rest;
  }

  return content;
}

/**
 * partyNo를 이용해 파티의 모든 정보를 가져오는 함수 (기존 fetchAllPartyMembers 대체)
 * @param {string} partyNo - 파티 번호
 * @returns {Promise<Object>} - 파티 상세 정보 content 객체
 */
async function fetchPartyDetails(partyNo) {
  const url = `${CHECK_PARTY_INFO_API_URL_PREFIX}/${partyNo}`;
  const response = await fetchWithRetry(url, { maxRetryAfter: 120_000 });
  const data = await response.json();
  if (data.code !== 200) {
    throw new Error(
      `Party details fetch failed with code ${data.code}: ${data.message}`
    );
  }
  return data.content;
}

/**
 * 페이지네이션을 처리하여 파티의 호스트, 멤버 목록, 전체 인원 수를 가져옴
 * @param {number} partyNo - 파티의 고유 번호
 * @returns {Promise<Object>} - { host: Object, members: Array, count: number } 형태의 객체
 */
async function fetchAllPartyMembers(partyNo) {
  const normalizeMemberInfo = (member) => {
    if (!member) return null;
    return {
      channelId: member.channelId,
      channelName: member.channelName,
      host: member.host,
      partyMemberNo: member.partyMemberNo,
      profileImageUrl: member.profileImageUrl,
    };
  };

  let hostInfo = null; // 호스트 정보를 저장할 변수
  const memberList = []; // 호스트를 제외한 멤버 목록을 저장할 배열
  let totalMemberCount = 0; // 전체 인원 수를 저장할 변수

  let next = null;
  let isFirstPage = true;

  while (isFirstPage || next) {
    let url = `${CHECK_PARTY_INFO_API_URL_PREFIX}/${partyNo}/members?sortType=POPULAR&size=20`;
    if (!isFirstPage && next) {
      url += `&next=${next.next}&concurrentUserCount=${next.concurrentUserCount}`;
    }

    const response = await fetchWithRetry(url, { maxRetryAfter: 120_000 });
    const data = await response.json();
    const content = data.content;

    if (!content) break;

    // 첫 페이지 응답에서만 호스트 정보와 전체 멤버 수를 가져옴
    if (isFirstPage) {
      hostInfo = normalizeMemberInfo(content.hostMemberInfo);
      totalMemberCount = content.memberCount || 0;
    }

    // 파티원 목록을 배열에 추가
    if (content.partyMemberLiveInfoList) {
      memberList.push(
        ...content.partyMemberLiveInfoList.map(normalizeMemberInfo)
      );
    }

    next = content.page;
    isFirstPage = false;
  }

  // 최종적으로 분리된 데이터가 담긴 객체를 반환
  return { host: hostInfo, members: memberList, count: totalMemberCount };
}

// live URL에서 channelId 추출
function extractChannelIdFromUrl(url) {
  const m = (url || "").match(
    /chzzk\.naver\.com\/(?:live\/)?([a-f0-9]{32})(?:\/|$)/i
  );
  return m ? m[1] : null;
}

// GET /channels/{channelId}/log-power
async function fetchLogPower(channelId) {
  const res = await fetchWithRetry(`${LOG_POWER_BASE}/${channelId}/log-power`);
  if (!res.ok) throw new Error(`log-power GET 실패: ${res.status}`);
  const json = await res.json();
  return json?.content || null;
}

// claim-list 캐시
const claimMetaCache = new Map();

/** claim-list로 claimType 메타(아이콘/타이틀/단위/금액)를 캐시 */
async function fetchClaimListMeta(channelId) {
  const now = Date.now();
  const cached = claimMetaCache.get(channelId);
  // 6시간 TTL
  if (cached && now - cached.ts < 6 * 60 * 60 * 1000) return cached.byType;

  const res = await fetchWithRetry(
    `${LOG_POWER_BASE}/${channelId}/log-power/claim-list`
  );
  if (!res.ok) throw new Error(`claim-list GET 실패: ${res.status}`);
  const json = await res.json();
  const list = json?.content?.claimList || [];
  const byType = new Map();
  for (const it of list) {
    byType.set(it.claimType, {
      claimType: it.claimType,
      title: it.claimableTitle || it.title || it.claimType,
      iconUrl: it.iconUrl || "",
      unit: it.unit || "",
      baseAmount: it.amount ?? null,
    });
  }
  claimMetaCache.set(channelId, { ts: now, byType });
  return byType;
}

// followingList에서 channelName 찾기 → 없으면 fetchLiveDetail로 조회
async function resolveChannelName(channelId, followingList) {
  try {
    if (Array.isArray(followingList)) {
      const hit = followingList.find(
        (it) => it?.channel?.channelId === channelId
      );
      if (hit?.channel?.channelName) return hit.channel.channelName;
    }
  } catch {}
  try {
    if (typeof fetchLiveDetail === "function") {
      const detail = await fetchLiveDetail(channelId);
      // 구현에 따라 경로가 다를 수 있어 방어적으로 탐색
      return detail?.channel?.channelName || "알 수 없음";
    }
  } catch {}
  return "알 수 없음";
}

// followingList에서 channelImageUrl 찾기 → 없으면 fetchLiveDetail로 조회
async function resolveChannelImageUrl(channelId, followingList) {
  try {
    if (Array.isArray(followingList)) {
      const hit = followingList.find(
        (it) => it?.channel?.channelId === channelId
      );
      const img = hit?.channel?.channelImageUrl;
      if (img) return img;
    }
  } catch {}
  try {
    if (typeof fetchLiveDetail === "function") {
      const d = await fetchLiveDetail(channelId);
      return d?.channel?.channelImageUrl || "";
    }
  } catch {}
  return "";
}

// 매우 단순한 메모리 캐시 (10분 TTL)
const channelMetaCache = new Map(); // channelId -> { name, imageUrl, expiresAt }

async function getChannelMeta(channelId, followingList) {
  const now = Date.now();
  const cached = channelMetaCache.get(channelId);
  if (cached && cached.expiresAt > now) return cached;

  const [name, imageUrlRaw] = await Promise.all([
    resolveChannelName(channelId, followingList).catch(() => "알 수 없음"),
    resolveChannelImageUrl(channelId, followingList).catch(() => ""),
  ]);

  const imageUrl = imageUrlRaw || "icon_128.png"; // 알림/히스토리 모두에서 동일 폴백
  const meta = { name, imageUrl, expiresAt: now + 10 * 60 * 1000 };
  channelMetaCache.set(channelId, meta);
  return meta;
}

// Chrome 알림
function createLogPowerNotification(entry) {
  const {
    id,
    channelName,
    channelImageUrl,
    claimedList = [],
    baseTotalAmount = 0,
    totalClaimed = 0,
  } = entry;
  const title = `🪵 ${channelName || "알 수 없음"}님의 통나무 파워 획득!`;
  const lines = (claimedList || [])
    .map(
      (c) =>
        `• ${c.displayTitle || c.claimType} (+${(
          c.amount ?? 0
        ).toLocaleString()})`
    )
    .join("\n");
  const message = `보유 통나무 파워: ${(
    baseTotalAmount + totalClaimed
  ).toLocaleString()}\n${lines || "세부 항목 없음"}`;

  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title,
    message,
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  });
}

// popup.js가 읽을 히스토리 엔트리 추가
async function pushLogPowerHistory({
  channelId,
  channelName,
  channelImageUrl,
  totalClaimed,
  results,
  claims,
  claimedList,
  baseTotalAmount = 0,
}) {
  const id = `LOGPOWER-${channelId}-${Date.now()}`;

  const resolvedBaseTotal = Number.isFinite(baseTotalAmount)
    ? baseTotalAmount
    : 0;

  const entry = {
    id,
    type: "LOGPOWER",
    title: "통나무 파워 획득",
    message: `${totalClaimed.toLocaleString()} 통나무 파워 획득 (항목 ${
      results.filter((r) => r.ok).length
    }건)`,
    timestamp: new Date().toISOString(),
    read: false,
    channelId,
    channelName,
    channelImageUrl,
    baseTotalAmount: resolvedBaseTotal,
    results, // [{claimId, ok, claimType, amount, reason?}]
    claims, // 원본 claims (상태 포함)
    claimedList,
    totalClaimed,
  };

  const { notificationHistory = [] } = await chrome.storage.local.get(
    "notificationHistory"
  );
  notificationHistory.unshift(entry);
  await chrome.storage.local.set({ notificationHistory });
  chrome.runtime.sendMessage(
    { type: "NOTIFICATION_HISTORY_UPDATED" },
    () => void chrome.runtime.lastError
  );

  return entry;
}

// 중복 방지: 최근 본 claimId 캐시 (채널별)
const logPowerSeenClaims = new Map(); // channelId -> Set(claimId)
function filterNewEligibleClaims(channelId, claims, { force = false } = {}) {
  const s = logPowerSeenClaims.get(channelId) || new Set();
  const eligible = claims.filter((c) => {
    const okState = (c.state || "").toUpperCase() === "COMPLIED";
    const okSave = (c.saveType || "").toUpperCase() === "ACTIVE";
    const unseen = !s.has(c.claimId);
    return okState && okSave && c.claimId && (force ? true : unseen);
  });
  return { eligible, seenSet: s };
}

// content에 PUT을 요청 (claims 존재 통지)
function askContentToClaim(tabId, payload) {
  chrome.tabs.sendMessage(tabId, { type: "PING" }, (res) => {
    // 1) PING 실패(수신자 없음) 시 조용히 종료해 경고를 막음
    if (chrome.runtime.lastError) {
      console.debug(
        "[LOG_POWER] ping failed:",
        chrome.runtime.lastError.message
      );
      return;
    }
    // 2) PING은 왔지만 상태 비정상이면 종료
    if (!res || res.status !== "ready") {
      console.debug("[LOG_POWER] ping responded but not ready");
      return;
    }
    // 3) 준비 OK → 실제 작업 전송
    chrome.tabs.sendMessage(
      tabId,
      { type: "LOG_POWER_CLAIMS_FOUND", ...payload },
      () => void chrome.runtime.lastError // 에러 소비
    );
  });
}

// 공통 로직을 처리할 헬퍼 함수
async function checkAndClaimPowerForChannel(
  channelId,
  tabId,
  followingList = null,
  { force = false } = {}
) {
  try {
    // 1) GET
    const content = await fetchLogPower(channelId);
    const claims = Array.isArray(content?.claims) ? content.claims : [];
    if (claims.length === 0) return;

    // 2) 적격 + 중복 제외
    const { eligible, seenSet } = filterNewEligibleClaims(channelId, claims, {
      force,
    });
    if (eligible.length === 0) return;

    // 3) 채널 메타 정보 조회
    const { name: channelName, imageUrl: channelImageUrl } =
      await getChannelMeta(channelId, followingList);

    // 4) claimType → title/icon 매핑
    const meta = await fetchClaimListMeta(channelId);
    const enriched = eligible.map((c) => {
      const m = meta.get(c.claimType) || {};
      return {
        ...c,
        displayTitle: m.title || c.claimType,
        displayIcon: m.iconUrl || "",
        displayUnit: m.unit || "",
        displayBaseAmount: m.baseAmount,
      };
    });

    // 5) content.js에게 PUT 실행 요청
    askContentToClaim(tabId, {
      channelId,
      channelName,
      channelImageUrl,
      claims: enriched,
      baseTotalAmount: content?.amount ?? 0,
      active: !!content?.active,
    });
  } catch (e) {
    console.warn(
      `[log-power] Channel(${channelId}) check failed:`,
      e?.message || e
    );
  }
}

async function pollLogPowerOnActiveLiveTabs(followingList) {
  const tabs = await chrome.tabs.query({ url: `${CHZZK_URL}/*` });
  for (const t of tabs) {
    const channelId = extractChannelIdFromUrl(t.url || "");
    if (!channelId) continue;

    // 헬퍼 함수 호출
    await checkAndClaimPowerForChannel(channelId, t.id, followingList);
  }
}

// ====== Log Power Summary Aggregation ======
// 기간 경계 계산
function zeroOf(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function periodBounds(kind, now = new Date()) {
  const today0 = zeroOf(now);

  if (kind === "daily") {
    const start = today0;
    const end = endOfDay(today0);

    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, "0"); // getMonth()는 0부터 시작하므로 +1
    const day = String(start.getDate()).padStart(2, "0");
    const key = `${year}-${month}-${day}`;

    return { start, end, key, label: `일간(${key})` };
  }

  if (kind === "weekly") {
    // 월요일 00:00 ~ 일요일 23:59 (일요일에 생성)
    const dow = (today0.getDay() + 6) % 7; // Mon=0..Sun=6
    const start = new Date(today0);
    start.setDate(start.getDate() - dow);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const key = `${start.getFullYear()}-${start.getMonth() + 1}-W${
      Math.floor((start.getDate() - 1) / 7) + 1
    }`;

    // 현지 시간 기준으로 시작일과 종료일 문자열 생성
    const startStr = `${start.getFullYear()}-${String(
      start.getMonth() + 1
    ).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(end.getDate()).padStart(2, "0")}`;

    return {
      start,
      end,
      key,
      label: `주간(${startStr}~${endStr})`,
    };
  }

  if (kind === "monthly") {
    const y = now.getFullYear(),
      m = now.getMonth();
    const start = new Date(y, m, 1, 0, 0, 0, 0);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999); // 말일
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    return { start, end, key, label: `월간(${key})` };
  }

  if (kind === "year_end") {
    // 당해 연말(12/31 생성)
    const y = now.getFullYear();
    const start = new Date(y, 0, 1, 0, 0, 0, 0);
    const end = new Date(y, 11, 31, 23, 59, 59, 999);
    const key = `${y}-EOY`;
    return { start, end, key, label: `${y} 연말` };
  }

  throw new Error("unknown period kind: " + kind);
}

const LOGPOWER_CATCHUP_ALARM = "logpower:summary:catchup";
const CATCHUP_HOURS = [9, 12, 15, 18, 21];

function nextCatchupWhen(now = new Date()) {
  const slots = CATCHUP_HOURS.map(
    (h) =>
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, 0, 0, 0)
  );
  const nextToday = slots.find((t) => t.getTime() > now.getTime());
  if (nextToday) return nextToday.getTime();
  const t = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    CATCHUP_HOURS[0],
    0,
    0,
    0
  );
  return t.getTime();
}

// 어제/직전 주/직전 월/직전 연말의 "기대 키"를 계산
function expectedSummaryAnchors(now = new Date()) {
  const anchors = {};

  // daily → 전일
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  anchors.daily = y;

  // weekly → 직전 일요일 기준
  const w = new Date(now);
  // "지난" 일요일(오늘이 일요일이면 7일 전)
  const delta = w.getDay() === 0 ? 7 : w.getDay();
  w.setDate(w.getDate() - delta);
  anchors.weekly = w;

  // monthly → 직전 달 말일
  const m = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  anchors.monthly = m;

  // year_end → 직전 12/31
  const yEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  anchors.year_end = yEnd;

  return anchors;
}

async function missingKinds(now = new Date()) {
  const { logpowerSummaryLastRun = {} } = await chrome.storage.local.get(
    "logpowerSummaryLastRun"
  );
  const { [LOGPOWER_CATCHUP_BASELINE_KEY]: baselineAt = 0 } =
    await chrome.storage.local.get(LOGPOWER_CATCHUP_BASELINE_KEY);

  const anchors = expectedSummaryAnchors(now);
  const missing = [];

  for (const kind of ["daily", "weekly", "monthly", "year_end"]) {
    const b = periodBounds(kind, anchors[kind]); // {start, end, key, label}
    // 설치(또는 기능 켜진) 이전에 끝난 기간은 catch-up 대상에서 제외
    if (baselineAt && +b.end <= baselineAt) continue;

    if (logpowerSummaryLastRun[kind] !== b.key)
      missing.push({ kind, anchor: anchors[kind], key: b.key });
  }
  return missing;
}

async function ensureCatchupSchedule(now = new Date()) {
  const missing = await missingKinds(now);
  if (missing.length === 0) {
    await chrome.alarms.clear(LOGPOWER_CATCHUP_ALARM);
    return false;
  }
  await chrome.alarms.create(LOGPOWER_CATCHUP_ALARM, {
    when: nextCatchupWhen(now),
  });
  return true;
}

// 히스토리에서 기간별 집계
async function aggregateLogPowerBetween(start, end, aggOpts = {}) {
  const sTs = +start,
    eTs = +end;
  const { notificationHistory = [] } = await chrome.storage.local.get(
    "notificationHistory"
  );

  const WATCH_MINUTES_PER_HOUR = 12;
  const HOUR_LABEL = normalizeClaimType("WATCH_1_HOUR");
  const FIVE_LABEL = normalizeClaimType("WATCH_5_MINUTE");

  // 채널 메타(이름/이미지) 최신값(<= end) 확보
  const metaByCh = new Map();
  for (const it of notificationHistory) {
    if (it?.type !== "LOGPOWER") continue;
    const t = +new Date(it.timestamp || 0);
    if (Number.isNaN(t) || t > eTs) continue;
    metaByCh.set(it.channelId, {
      name: it.channelName || "알 수 없음",
      imageUrl: it.channelImageUrl || "icon_128.png",
    });
  }

  let total = 0,
    count = 0;
  const per = new Map();
  const typeCountsAll = Object.create(null);

  for (const it of notificationHistory) {
    if (it?.type !== "LOGPOWER") continue;
    const t = +new Date(it.timestamp || 0);
    if (Number.isNaN(t) || t < sTs || t > eTs) continue;

    for (const r of it.results || []) {
      if (!r?.ok) continue;
      const typ = normalizeClaimType(r.claimType);
      const amt = Number(r.amount || 0);

      total += amt;
      count += 1;

      const key = it.channelId || "unknown";
      let acc = per.get(key);
      if (!acc) {
        acc = {
          channelId: key,
          channelName: it.channelName || "알 수 없음",
          channelImageUrl: it.channelImageUrl || "../icon_128.png",
          total: 0,
          count: 0,
          typeSet: new Set(),
          typeCounts: Object.create(null),
        };
        per.set(key, acc);
      }
      acc.total += amt;
      acc.count += 1;

      if (typ) {
        acc.typeSet.add(typ);
        const cur = acc.typeCounts[typ] || { count: 0, total: 0 };
        cur.count += 1;
        cur.total += amt;
        acc.typeCounts[typ] = cur;

        const g = typeCountsAll[typ] || { count: 0, total: 0 };
        g.count += 1;
        g.total += amt;
        typeCountsAll[typ] = g;
      }
    }
  }

  const channels = [...per.values()].map((c) => {
    const hour = c.typeCounts[HOUR_LABEL] || { count: 0, total: 0 };
    const five = c.typeCounts[FIVE_LABEL] || { count: 0, total: 0 };

    const derivedFiveCnt = hour.count * WATCH_MINUTES_PER_HOUR;
    if (derivedFiveCnt > 0) {
      five.count += derivedFiveCnt;
      c.typeCounts[FIVE_LABEL] = five;

      const g = typeCountsAll[FIVE_LABEL] || { count: 0, total: 0 };
      g.count += derivedFiveCnt;
      typeCountsAll[FIVE_LABEL] = g;
    }

    const hourAmt = Number(hour.total || 0);
    const fiveAmt = Number(five.total || 0);

    // "표시용 5분 금액" = 실제 5분 금액 + 1시간 금액
    const fiveDisplayTotal = fiveAmt + hourAmt;
    c.typeCounts[FIVE_LABEL] = {
      ...five,
      total: fiveDisplayTotal,
    };

    {
      const g = typeCountsAll[FIVE_LABEL] || { count: 0, total: 0 };
      g.total += hourAmt; // 1시간 금액을 5분 총합에 더함
      typeCountsAll[FIVE_LABEL] = g;
    }

    const shownTotal = c.total;
    const shownCount = c.count + derivedFiveCnt;

    return {
      channelId: c.channelId,
      channelName: c.channelName,
      channelImageUrl: c.channelImageUrl,
      total: shownTotal,
      observedTotal: shownTotal,
      count: shownCount,
      typeCount: Object.keys(c.typeCounts).length,
      claimTypes: [...c.typeSet],
      typeBreakdown: Object.entries(c.typeCounts)
        .map(([claimType, s]) => ({
          claimType,
          claimTypeNorm: claimType, // 팝업 chips 호환
          count: s.count,
          total: s.total,
        }))
        .sort((a, b) => b.total - a.total),
    };
  });

  channels.sort((a, b) => b.total - a.total);

  const aggTotal = channels.reduce((s, c) => s + Number(c.total || 0), 0);
  const aggCount = channels.reduce((s, c) => s + Number(c.count || 0), 0);

  return { total: aggTotal, count: aggCount, channels, typeCountsAll };
}

// 요약 알림 생성 + 히스토리 기록
async function notifyLogPowerSummary(kind, agg, start, end, label) {
  const idBase = `LOGPOWER-SUM-${kind}-${Date.now()}`;
  const title = `🪵 통나무 파워 ${label} 요약`;
  const message = `획득 총합: ${agg.total.toLocaleString()} (횟수 ${agg.count.toLocaleString()})`;

  const {
    [SUMMARY_PAUSE_KEY]: paused = false,
    [SUMMARY_KEEP_PAUSE_KEY]: keepPaused = false,
  } = await chrome.storage.local.get([
    SUMMARY_PAUSE_KEY,
    SUMMARY_KEEP_PAUSE_KEY,
  ]);

  if (!paused) {
    // 총괄 1건
    chrome.notifications.create(idBase, {
      type: "basic",
      iconUrl: "icon_128.png",
      title,
      message,
      requireInteraction: false,
      silent: true,
    });
    // 효과음
    try {
      playSoundFor("logpower");
    } catch {}
  }

  if (!keepPaused) {
    // 팝업에서 볼 수 있도록 히스토리에도 적재
    const { notificationHistory = [] } = await chrome.storage.local.get(
      "notificationHistory"
    );
    notificationHistory.unshift({
      id: idBase,
      type: "LOGPOWER/SUMMARY",
      title,
      label,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      period: {
        kind,
        start: start.toISOString(),
        end: end.toISOString(),
        label,
      },
      total: agg.total,
      count: agg.count,
      channels: agg.channels.map((c) => ({
        channelId: c.channelId,
        channelName: c.channelName,
        channelImageUrl: c.channelImageUrl,
        total: c.total,
        count: c.count,
        typeCount: c.typeCount,
        claimTypes: c.claimTypes, // 전체 타입 목록
        typeBreakdown: c.typeBreakdown, // 타입별 {claimType,count,total} 배열
        externalGain: Number(c.externalGain || 0),
        externalKnownAmount: Number(c.externalKnownAmount || 0),
        externalCurrentAmount: Number(c.externalCurrentAmount || 0),
      })),
      typeCountsAll: agg.typeCountsAll,
    });
    await chrome.storage.local.set({ notificationHistory });
  }
}

async function loadDailyOpening(start) {
  const key = `logpower_open_${start.toISOString().slice(0, 10)}`;
  const got = await chrome.storage.local.get(key);
  return got[key] || null; // {ts, map, late}
}

async function fetchBalancesNow() {
  const res = await fetch(
    "https://api.chzzk.naver.com/service/v1/log-power/balances",
    { credentials: "include" }
  );
  const json = await res.json();
  const arr = json?.content?.data || [];
  // 배열 그대로와, 빠른 조회용 맵 둘 다 만들기
  const byId = new Map(arr.map((x) => [x.channelId, x]));
  return { arr, byId };
}

async function sumClaimsFromLogs(start, end) {
  // powerLogs에서 오늘 범위만 취합
  const { powerLogs = [] } = await chrome.storage.local.get("powerLogs");
  const s = +start,
    e = +end;
  const per = new Map(); // channelId -> claimSum
  for (const log of powerLogs) {
    const t = +new Date(log?.timestamp || 0);
    if (!t || t < s || t > e) continue;
    const ch = log.channelId;
    const amt = Number(log.amount ?? log.testAmount ?? 0) || 0;
    per.set(ch, (per.get(ch) || 0) + amt);
  }
  return per;
}

/**
 * 기존 기타 획득 데이터(accumulated)와 새로운 획득 데이터(newItems)를 채널별로 합산
 */
function mergeExternalGains(accumulated, newItems) {
  const map = new Map();

  // 1. 기존 데이터 적재
  if (Array.isArray(accumulated)) {
    accumulated.forEach((item) => map.set(String(item.channelId), { ...item }));
  }

  // 2. 새로운 데이터 병합
  if (Array.isArray(newItems)) {
    newItems.forEach((item) => {
      const chId = String(item.channelId);
      const existing = map.get(chId);

      if (existing) {
        // 이미 있으면 획득량 합산
        existing.externalGain =
          (Number(existing.externalGain) || 0) +
          (Number(item.externalGain) || 0);
        // 현재 보유량은 최신 값으로 갱신
        existing.currentAmount = item.currentAmount;
        // channelName, ImageUrl 등은 최신 정보가 있을 경우 갱신
        if (item.channelName) existing.channelName = item.channelName;
        if (item.channelImageUrl)
          existing.channelImageUrl = item.channelImageUrl;

        map.set(chId, existing);
      } else {
        // 없으면 신규 추가
        map.set(chId, { ...item });
      }
    });
  }

  return Array.from(map.values());
}

// 중복 방지: 같은 기간 키로 1일 1회만
async function runLogPowerSummaries(
  now = new Date(),
  forceKinds = null,
  opts = {}
) {
  const toRun = forceKinds ? [...forceKinds] : ["daily"];
  const isSunday = now.getDay() === 0;
  const y = now.getFullYear(),
    m = now.getMonth(),
    d = now.getDate();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const isMonthEnd = d === lastDay;
  const isDec31 = m === 11 && d === 31;

  if (!forceKinds) {
    if (isSunday) toRun.push("weekly");
    if (isMonthEnd) toRun.push("monthly");
    if (isDec31) toRun.push("year_end");
  }

  const { logpowerSummaryLastRun = {} } = await chrome.storage.local.get(
    "logpowerSummaryLastRun"
  );

  for (const kind of toRun) {
    const { start, end, key, label } = periodBounds(kind, now);

    // 'force' 옵션을 스킵 조건에 반영
    const isAlreadyRun = logpowerSummaryLastRun[kind] === key;
    if (!opts?.transient && isAlreadyRun && !opts?.force) {
      // transient(오늘 수동)가 아니고, 이미 실행됐고, force(재발행)가 아니면 스킵
      continue;
    }

    // 원장이 있으면 원장 기준 집계, 없으면 notificationHistory 기반
    let agg;
    try {
      agg = await aggregateLogPowerBetweenFromLedger(start, end);
      if (!agg || !Array.isArray(agg.channels)) throw new Error("ledger empty");
    } catch {
      agg = await aggregateLogPowerBetween(start, end);
    }

    let external = []; // 기타 획득 결과를 저장할 변수
    const { logpowerIncludeExternal = true } = await chrome.storage.local.get(
      "logpowerIncludeExternal"
    );

    // if (logpowerIncludeExternal) {
    //   const snapKey = `logpower_ext_snap_${key}`;

    //   if (opts?.transient) {
    //     // Case 1: 수동 '오늘' 발행 (transient: true)
    //     // 항상 재계산, 스냅샷 저장 안 함
    //     external = await computeExternalGainsForSummary({
    //       onlyActiveChannels: false,
    //       transient: true,
    //     });
    //   } else if (kind === "daily") {
    //     // Case 2: 'daily' (자동, 수동 캐치업, 수동 재발행)

    //     if (isAlreadyRun && opts.force) {
    //       // 일간 '재발행' -> 저장된 일간 스냅샷 로드
    //       external = await _loadJsonKey(snapKey, []);
    //     } else {
    //       // 일간 '최초 발행' (자동 00:05 또는 수동 캐치업)
    //       // '기타 획득'을 계산하고, 베이스라인(knownTotals)을 갱신
    //       external = await computeExternalGainsForSummary({
    //         onlyActiveChannels: false,
    //         transient: false,
    //       });
    //       // 일간 스냅샷 저장
    //       await _saveJsonKey(snapKey, external);
    //     }
    //   } else {
    //     // Case 3: 'weekly', 'monthly', 'year_end' (자동, 수동 캐치업, 수동 재발행)
    //     // 이 종류들은 '재발행'이든 '최초 발행'이든 *항상* 일간 스냅샷을 집계(re-aggregate)해야 함.

    //     external = await aggregateExternalGainsFromDailySnapshots(start, end);

    //     // 그리고 그 집계 결과를 (최초든 재발행이든) 덮어쓴다.
    //     // (수동 재발행 시에도 덮어써야, 나중에 추가된 일간 스냅샷이 반영됨)
    //     await _saveJsonKey(snapKey, external);
    //   }
    // }

    if (logpowerIncludeExternal) {
      const snapKey = `logpower_ext_snap_${key}`;

      // 1. 이번 실행 시점의 '추가 획득량' 계산 (transient 여부와 관계없이 계산)
      //    * transient: true를 사용하여 내부 기준점(knownTotals)을 여기서 갱신하지 않도록 함 (병합 후 저장할 것임)
      //    * 단, 최초 실행 등 기준점이 없는 경우는 compute 내부에서 처리됨
      const currentDelta = await computeExternalGainsForSummary({
        onlyActiveChannels: false,
        transient: !!opts?.transient, // 수동 실행일 때는 기준점을 건드리지 않음
      });

      // 2. '일간(daily)'이거나 '수동 실행'인 경우, 기존에 저장된 오늘자 스냅샷을 불러와 병합
      if (kind === "daily" || opts?.transient) {
        // 기존에 저장된 오늘자 데이터 로드
        const savedSnap = await _loadJsonKey(snapKey, []);

        // [중요] 기존 데이터 + 신규 발견 데이터 병합
        external = mergeExternalGains(savedSnap, currentDelta);

        // 수동 실행(transient)이 아닐 경우(자동/캐치업)에는 병합된 데이터를 스토리지에 저장
        if (!opts?.transient) {
          await _saveJsonKey(snapKey, external);
        }
      } else {
        // 3. 주간/월간/연말은 기존 로직 유지 (일간 스냅샷들을 집계)
        external = await aggregateExternalGainsFromDailySnapshots(start, end);
        if (!opts?.transient) {
          await _saveJsonKey(snapKey, external);
        }
      }
    }

    try {
      if (Array.isArray(external) && external.length > 0) {
        // 맵 생성: channelId -> externalGain
        const extMap = Object.fromEntries(
          external.map((e) => [String(e.channelId), e])
        );

        // agg.channels 항목들에 externalGain 병합
        let addedTotal = 0;
        for (const ch of agg.channels) {
          const key = String(ch.channelId);
          const e = extMap[key];
          if (e && Number(e.externalGain) > 0) {
            ch.externalGain = Number(e.externalGain);
            ch.externalKnownAmount = Number(e.knownAmount || 0);
            ch.externalCurrentAmount = Number(e.currentAmount || 0);
            ch.total = Number(ch.total || 0) + Number(e.externalGain);
            addedTotal += Number(e.externalGain);

            delete extMap[key];
          } else {
            ch.externalGain = 0;
          }
        }

        // 기타 획득이 agg에 포함되지 않은 신규 채널(agg에 없는 경우) 처리
        for (const [chId, e] of Object.entries(extMap)) {
          const found = agg.channels.find(
            (c) => String(c.channelId) === String(e.channelId)
          );
          if (!found) {
            // 새 채널 항목을 추가 (팝업에 보이도록 최소 필드 채움)
            const newCh = {
              channelId: String(e.channelId),
              channelName: e.channelName || "",
              channelImageUrl: e.channelImageUrl || "",
              total: Number(e.externalGain),
              observedTotal: Number(e.externalGain),
              count: 0,
              typeCount: 0,
              claimTypes: ["기타 획득"],
              typeBreakdown: [],
              externalGain: Number(e.externalGain),
              externalKnownAmount: Number(e.knownAmount || 0),
              externalCurrentAmount: Number(e.currentAmount || 0),
            };
            agg.channels.push(newCh);
            addedTotal += Number(e.externalGain);
          }
        }

        // agg 정렬/총합 업데이트
        if (addedTotal > 0) {
          agg.total = Number(agg.total || 0) + addedTotal;
          agg.channels.sort(
            (a, b) => Number(b.total || 0) - Number(a.total || 0)
          );
        }
      }
    } catch (e) {
      console.warn("[logpower] external merge failed:", e);
    }

    await notifyLogPowerSummary(kind, agg, start, end, label);

    // transient가 아닐 때에만 lastRun 갱신
    if (!opts?.transient) {
      logpowerSummaryLastRun[kind] = key;
      await chrome.storage.local.set({ logpowerSummaryLastRun });
    }
  }
}

/**
 * 글 내용과 첨부파일을 바탕으로 적절한 attachLayout 값을 계산하는 함수
 * @param {string} content - 게시글의 전체 내용
 * @param {Array} attaches - 첨부파일 배열
 * @returns {string} - 'layout-default', 'layout-single-big', 또는 'layout-double-medium'
 */
function calculateAttachLayout(content, attaches) {
  const hasText = content && content.trim().length > 0;
  const hasAttaches = attaches && attaches.length > 0;
  let attachLayout = "layout-default";

  if (hasText && hasAttaches) {
    const messageContent = makeExcerptWithAttaches(content);
    if (
      attaches.length === 1 &&
      messageContent.length < 310 &&
      countParagraphs(messageContent) < 9
    ) {
      attachLayout = "layout-single-big";
    } else if (
      attaches.length === 1 &&
      messageContent.length < 350 &&
      countParagraphs(messageContent) < 8
    ) {
      attachLayout = "layout-single-medium";
    } else if (
      attaches.length === 2 &&
      messageContent.length < 310 &&
      countParagraphs(messageContent) < 9
    ) {
      attachLayout = "layout-double-medium";
    }
  }
  return attachLayout;
}

// 0) 설정값
const CATEGORY_BUCKET_MS = 2 * 60 * 1000; // 2분 버킷
const TITLE_BUCKET_MS = 2 * 60 * 1000; // 필요 시 별도 조정 가능
const COMBO_BUCKET_MS = 2 * 60 * 1000;
const CHANGE_COOLDOWN_MS = 30 * 1000; // 30초 쿨다운

// 1) 유틸
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();

// state(= liveStatus[channelId])에 last*Key / last*At 저장
function hitCooldown(state, base, key, now) {
  const kKey = `last${base}Key`;
  const kAt = `last${base}At`;
  if (state[kKey] === key && now - (state[kAt] || 0) < CHANGE_COOLDOWN_MS) {
    return true; // 쿨다운 중 → 발행 금지
  }
  state[kKey] = key;
  state[kAt] = now;
  return false; // 발행 가능
}

function makeBucketId(
  prefix,
  channelId,
  openDate,
  prevVal,
  curVal,
  now,
  bucketMs
) {
  const bucket = Math.floor(now / bucketMs);
  return `${prefix}-${channelId}-${openDate}-${norm(prevVal)}→${norm(
    curVal
  )}-b${bucket}`;
}

function existsOrDismissed(id, history, dismissedSet) {
  return history.some((n) => n.id === id) || dismissedSet.has(id);
}

// 2) 개별 알림 발행 헬퍼
function maybeEmitCategoryChange({
  channel,
  st,
  prevCategory,
  curCategory,
  prevCategoryUrl,
  curCategoryUrl,
  openDate,
  notificationHistory,
  dismissedSet,
  notifications,
  isPaused,
  isCategoryPaused,
  liveContent,
  isPrime,
}) {
  const prev = norm(prevCategory);
  const cur = norm(curCategory);
  if (!prev || !cur || prev === cur) return;

  const now = Date.now();
  const key = `${prev}→${cur}`;
  if (hitCooldown(st, "CategoryChange", key, now)) return;

  const id = makeBucketId(
    "category",
    channel.channelId,
    openDate,
    prev,
    cur,
    now,
    CATEGORY_BUCKET_MS
  );
  if (existsOrDismissed(id, notificationHistory, dismissedSet)) return;

  const obj = createCategoryChangeObject(
    channel,
    prevCategory,
    curCategory,
    prevCategoryUrl,
    curCategoryUrl,
    liveContent,
    isPrime,
    id
  );
  notifications.push(obj);
  if (!isPaused && !isCategoryPaused) {
    createCategoryChangeNotification(obj, prevCategory, curCategory);
    playSoundFor("category");
  }
}

function maybeEmitTitleChange({
  channel,
  st,
  prevTitle,
  curTitle,
  openDate,
  notificationHistory,
  dismissedSet,
  notifications,
  isPaused,
  isLiveTitlePaused,
  liveContent,
  currentCategoryUrl,
  isPrime,
}) {
  const prev = norm(prevTitle);
  const cur = norm(curTitle);
  if (!prev || !cur || prev === cur) return;

  const now = Date.now();
  const key = `${prev}→${cur}`;
  if (hitCooldown(st, "TitleChange", key, now)) return;

  const id = makeBucketId(
    "live-title",
    channel.channelId,
    openDate,
    prev,
    cur,
    now,
    TITLE_BUCKET_MS
  );
  if (existsOrDismissed(id, notificationHistory, dismissedSet)) return;

  const obj = createLiveTitleChangeObject(
    channel,
    prevTitle,
    curTitle,
    liveContent,
    currentCategoryUrl,
    isPrime,
    id
  );
  notifications.push(obj);
  if (!isPaused && !isLiveTitlePaused) {
    createLiveTitleChangeNotification(obj, prevTitle, curTitle);
    playSoundFor("liveTitle");
  }
}

function maybeEmitComboChange({
  channel,
  st,
  prevCategory,
  curCategory,
  prevTitle,
  curTitle,
  prevCategoryUrl,
  curCategoryUrl,
  openDate,
  notificationHistory,
  dismissedSet,
  notifications,
  isPaused,
  isCategoryPaused,
  isLiveTitlePaused,
  liveContent,
  isPrime,
}) {
  const prevC = norm(prevCategory),
    curC = norm(curCategory);
  const prevT = norm(prevTitle),
    curT = norm(curTitle);

  if (!prevC || !curC || prevC === curC) return false;
  if (!prevT || !curT || prevT === curT) return false;

  const now = Date.now();
  const comboKey = `C:${prevC}→${curC}|T:${prevT}→${curT}`;
  if (hitCooldown(st, "CategoryTitleCombo", comboKey, now)) return true;

  const id = `category-live-title-${
    channel.channelId
  }-${openDate}-${prevC}→${curC}-${prevT}→${curT}-b${Math.floor(
    now / COMBO_BUCKET_MS
  )}`;
  if (existsOrDismissed(id, notificationHistory, dismissedSet)) return true;

  const obj = createCategoryAndLiveTitleChangeObject(
    channel,
    prevCategory,
    curCategory,
    prevTitle,
    curTitle,
    prevCategoryUrl,
    curCategoryUrl,
    liveContent,
    isPrime,
    id
  );
  notifications.push(obj);

  if (!isPaused && !(isCategoryPaused && isLiveTitlePaused)) {
    createCategoryAndLiveTitleChangeNotification(
      obj,
      prevCategory,
      curCategory,
      prevTitle,
      curTitle
    );
    playSoundFor("combo");
  }
  return true;
}

// --- 모든 확인 작업을 통합하고 일괄 처리 ---
async function checkFollowedChannels() {
  if (!navigator.onLine) {
    console.warn("Network unavailable, verification skipped.");
    isChecking = false;
    return;
  }

  if (isChecking) return;
  isChecking = true;

  try {
    const response = await fetchWithRetry(FOLLOW_API_URL, {
      maxRetryAfter: 120_000,
    });
    const data = await response.json();

    const prevSession = (await chrome.storage.session.get("cachedLoginStatus"))
      .cachedLoginStatus;

    // *** 확인된 로그인 상태를 session 스토리지에 캐싱 ***
    if (data.code === 200) {
      let nickname = prevSession?.nickname,
        profileImageUrl = prevSession?.profileImageUrl;
      if (!prevSession?.isLoggedIn) {
        const userStatusRes = await fetchWithRetry(GET_USER_STATUS_API);
        const userStatusData = await userStatusRes.json();
        nickname = userStatusData.content?.nickname;
        profileImageUrl = userStatusData.content?.profileImageUrl;
      }
      chrome.storage.session.set({
        cachedLoginStatus: { isLoggedIn: true, nickname, profileImageUrl },
      });
      chrome.action.setIcon({ path: "icon_128.png" });
      updateUnreadCountBadge();
    } else {
      chrome.storage.session.set({
        cachedLoginStatus: { isLoggedIn: false },
      });
      chrome.action.setIcon({ path: "icon_disabled.png" });
      chrome.action.setBadgeText({ text: "X" });
      chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });

      isChecking = false; // 로그아웃 상태이므로 여기서 함수 종료
      return;
    }

    const followingList = data.content?.followingList || [];
    if (followingList.length === 0) return;

    const notificationEnabledChannels = new Set();
    followingList.forEach((item) => {
      if (item.channel.personalData.following.notification) {
        notificationEnabledChannels.add(item.channel.channelId);
      }
    });

    const prevState = await chrome.storage.local.get([
      "liveStatus",
      "partyStatus",
      "partyDonationStatus",
      "postStatus",
      "videoStatus",
      "predictionStatus",
      "loungeStatus",
      "seenBanners",
      "notificationHistory",
      "dismissedNotificationIds",
      "isPaused",
      "isLivePaused",
      "isLiveOffPaused",
      "isCategoryPaused",
      "isLiveTitlePaused",
      "isRestrictPaused",
      "isWatchPartyPaused",
      "isDropsPaused",
      "isPredictionPaused",
      "isVideoPaused",
      "isCommunityPaused",
      "isLoungePaused",
      "isBannerPaused",
      "isPartyPaused",
      "isLiveKeepPaused",
      "isLiveOffKeepPaused",
      "isCategoryKeepPaused",
      "isLiveTitleKeepPaused",
      "isRestrictKeepPaused",
      "isWatchPartyKeepPaused",
      "isDropsKeepPaused",
      "isPredictionKeepPaused",
      "isVideoKeepPaused",
      "isCommunityKeepPaused",
      "isLoungeKeepPaused",
      "isBannerKeepPaused",
      "isPartyKeepPaused",
    ]);
    const isPaused = prevState.isPaused || false;

    const isLivePaused = prevState.isLivePaused || false;
    const isLiveOffPaused = prevState.isLiveOffPaused || false;
    const isCategoryPaused = prevState.isCategoryPaused || false;
    const isLiveTitlePaused = prevState.isLiveTitlePaused || false;
    const isRestrictPaused = prevState.isRestrictPaused || false;
    const isWatchPartyPaused = prevState.isWatchPartyPaused || false;
    const isDropsPaused = prevState.isDropsPaused || false;
    const isPredictionPaused = prevState.isPredictionPaused || false;
    const isVideoPaused = prevState.isVideoPaused || false;
    const isCommunityPaused = prevState.isCommunityPaused || false;
    const isLoungePaused = prevState.isLoungePaused || false;
    const isBannerPaused = prevState.isBannerPaused || false;
    const isPartyPaused = prevState.isPartyPaused || false;

    const isLiveKeepPaused = prevState.isLiveKeepPaused || false;
    const isLiveOffKeepPaused = prevState.isLiveOffKeepPaused || false;
    const isCategoryKeepPaused = prevState.isCategoryKeepPaused || false;
    const isLiveTitleKeepPaused = prevState.isLiveTitleKeepPaused || false;
    const isRestrictKeepPaused = prevState.isRestrictKeepPaused || false;
    const isWatchPartyKeepPaused = prevState.isWatchPartyKeepPaused || false;
    const isDropsKeepPaused = prevState.isDropsKeepPaused || false;
    const isPredictionKeepPaused = prevState.isPredictionKeepPaused || false;
    const isVideoKeepPaused = prevState.isVideoKeepPaused || false;
    const isCommunityKeepPaused = prevState.isCommunityKeepPaused || false;
    const isLoungeKeepPaused = prevState.isLoungeKeepPaused || false;
    const isBannerKeepPaused = prevState.isBannerKeepPaused || false;
    const isPartyKeepPaused = prevState.isPartyKeepPaused || false;

    const dismissedSet = new Set(prevState.dismissedNotificationIds || []);
    for (const id of globalDismissedSet) dismissedSet.add(id);

    // --- 분산 스케줄 ---
    const tick = await _nextTick();
    const plan = _getTaskPlan(tick);

    const tasks = {};
    if (plan.community) {
      tasks.post = checkCommunityPosts(
        followingList,
        prevState.postStatus,
        notificationEnabledChannels,
        isPaused,
        isCommunityPaused,
        isCommunityKeepPaused,
        prevState.notificationHistory
      );
    }
    if (plan.video) {
      tasks.video = checkUploadedVideos(
        followingList,
        prevState.videoStatus,
        notificationEnabledChannels,
        prevState.notificationHistory,
        dismissedSet,
        isPaused,
        isVideoPaused,
        isVideoKeepPaused
      );
    }
    if (plan.lounge) {
      tasks.lounge = checkLoungePosts(
        prevState.loungeStatus,
        isPaused,
        isLoungePaused,
        isLoungeKeepPaused
      );
    }
    if (plan.banner) {
      tasks.banner = checkBanners(
        prevState.seenBanners,
        isPaused,
        isBannerPaused,
        isBannerKeepPaused
      );
    }

    // 1. 모든 확인 작업을 병렬로 실행하고, "새로운 알림 내역"과 "새로운 상태"를 반환받음
    const keys = Object.keys(tasks);
    const vals = await Promise.all(keys.map((k) => tasks[k]));
    const byType = Object.fromEntries(keys.map((k, i) => [k, vals[i]]));

    // 2. 각 작업의 결과를 취합
    const liveResult = await checkLiveStatus(
      followingList,
      prevState.liveStatus,
      isPaused,
      isLivePaused,
      isLiveOffPaused,
      isCategoryPaused,
      isLiveTitlePaused,
      isRestrictPaused,
      isWatchPartyPaused,
      isDropsPaused,
      isLiveKeepPaused,
      isLiveOffKeepPaused,
      isCategoryKeepPaused,
      isLiveTitleKeepPaused,
      isRestrictKeepPaused,
      isWatchPartyKeepPaused,
      isDropsKeepPaused,
      prevState.notificationHistory,
      dismissedSet
    );

    const partyResult = await checkPartyStatus(
      followingList,
      liveResult.livePartyInfo,
      prevState.partyStatus,
      prevState.partyDonationStatus,
      isPaused,
      isPartyPaused,
      isPartyKeepPaused,
      notificationEnabledChannels,
      prevState.notificationHistory,
      dismissedSet
    );

    const predictionResult = await checkPredictionStatus(
      followingList,
      prevState.predictionStatus,
      isPaused,
      isPredictionPaused,
      isPredictionKeepPaused,
      notificationEnabledChannels,
      prevState.notificationHistory,
      dismissedSet
    );

    try {
      await pollLogPowerOnActiveLiveTabs(followingList);
    } catch (e) {
      console.warn(
        "[log-power] poll in checkedFollowedChannels 실패:",
        e?.message || e
      );
    }

    const postResult = byType.post ?? {
      newStatus: prevState.postStatus,
      notifications: [],
      postUpdates: [],
      deletedIds: [],
    };
    const videoResult = byType.video ?? {
      newStatus: prevState.videoStatus,
      notifications: [],
      videoUpdates: [],
      deletedIds: [],
    };
    const loungeResult = byType.lounge ?? {
      newStatus: prevState.loungeStatus,
      notifications: [],
    };
    const bannerResult = byType.banner ?? {
      newStatus: prevState.seenBanners,
      notifications: [],
    };

    // 2-1. 새로 발생한 알림들을 모두 모음
    const newNotifications = [
      ...(liveResult.notifications ?? []),
      ...(partyResult.notifications ?? []),
      ...(predictionResult.notifications ?? []),
      ...(postResult.notifications ?? []),
      ...(videoResult.notifications ?? []),
      ...(loungeResult.notifications ?? []),
      ...(bannerResult.notifications ?? []),
    ];

    // 2-2. 최종적으로 저장될 알림 내역을 결정
    let finalHistory = Array.isArray(prevState.notificationHistory)
      ? prevState.notificationHistory
      : [];

    // 모든 패치를 하나의 Map으로 통합
    const allPatches = [
      ...(partyResult.partyUpdates ?? []),
      ...(videoResult.videoUpdates ?? []),
      ...(postResult.postUpdates ?? []),
      ...(predictionResult.predictionPatches ?? []),
    ];

    if (allPatches.length > 0) {
      const patchMap = new Map(allPatches.map((p) => [p.id, p.data]));

      finalHistory = finalHistory.map((item) => {
        const patch = patchMap.get(item.id);
        if (patch) {
          if (item.type === "PARTY_START") {
            return {
              ...item,
              host: patch.host ?? item.host,
              partyMembers: patch.members ?? item.partyMembers,
              accumulatedMembers:
                patch.accumulatedMembers ?? item.accumulatedMembers,
              memberCount: patch.count ?? item.memberCount,
            };
          }
          // 다른 타입들은 기존처럼 간단히 병합
          return { ...item, ...patch };
        }
        return item;
      });
    }

    // 2-3. 새로 발생한 알림들을 최종 내역의 맨 앞에 추가
    if (newNotifications.length > 0) {
      finalHistory = [...newNotifications, ...finalHistory];
    }

    // 새로운 알림이 추가되었거나, 순서가 보장되지 않는 상황을 대비해 항상 시간순으로 재정렬
    finalHistory.sort((a, b) => {
      const dateA = parseTimestampFormat(a.timestamp);
      const dateB = parseTimestampFormat(b.timestamp);
      return dateB - dateA; // 내림차순 정렬 (최신순)
    });

    // 삭제된 것으로 감지된 알림들을 finalHistory에서 제거
    const allDeletedIds = [
      ...(videoResult.deletedIds ?? []),
      ...(postResult.deletedIds ?? []),
    ];
    if (allDeletedIds.length > 0) {
      const deletedIdsSet = new Set(allDeletedIds);
      finalHistory = finalHistory.filter((item) => !deletedIdsSet.has(item.id));
    }

    // 내역은 최대 저장
    if (finalHistory.length > HISTORY_LIMIT) {
      finalHistory.length = HISTORY_LIMIT;
    }

    let dismissedList = Array.from(dismissedSet);
    const DISMISSED_LIMIT = 3000; // 최대 3000개의 삭제 기록만 유지
    if (dismissedList.length > DISMISSED_LIMIT) {
      dismissedList = dismissedList.slice(
        dismissedList.length - DISMISSED_LIMIT
      );
    }

    // 저장 직전 finalHistory 필터링 - 삭제된 알림 ID들은 제외
    if (dismissedSet && dismissedSet.size) {
      finalHistory = finalHistory.filter((item) => !dismissedSet.has(item.id));
    }

    // 3. 모든 상태와 최종 알림 내역을 한 번에 저장
    await chrome.storage.local.set({
      liveStatus: liveResult.newStatus,
      partyStatus: partyResult.newStatus,
      partyDonationStatus: partyResult.newPartyDonationStatus,
      predictionStatus: predictionResult.newStatus,
      postStatus: postResult.newStatus,
      videoStatus: videoResult.newStatus,
      loungeStatus: loungeResult.newStatus,
      seenBanners: bannerResult.newStatus,
      notificationHistory: finalHistory, // 썸네일 갱신과 새 알림이 모두 반영된 최종본
      dismissedNotificationIds: dismissedList,
    });

    // 4. 새 알림이 있거나, 기존 알림에 대한 수정(패치)이 있었을 경우 배지를 업데이트
    const hasUpdates = allPatches.length > 0;

    if (newNotifications.length > 0 || hasUpdates) {
      await updateUnreadCountBadge();
    }
  } catch (error) {
    // 401 오류는 정상적인 로그아웃으로, 그 외는 에러로 처리
    if (error.message && error.message.includes("401")) {
      console.log("로그아웃 상태가 확인되었습니다. 아이콘을 비활성화합니다.");
      chrome.storage.session.set({ cachedLoginStatus: { isLoggedIn: false } });
      chrome.action.setIcon({ path: "icon_disabled.png" });
      chrome.action.setBadgeText({ text: "X" });
      chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
    } else {
      console.error("Error checking follow channels:", error);
      chrome.storage.session.set({ cachedLoginStatus: { isLoggedIn: false } });
    }
  } finally {
    isChecking = false;
  }
}

/**
 * API 1: .../{channelId}/log-power/prediction (현재 활성 예측 요약)
 */
async function fetchPredictionSummary(channelId) {
  const url = `${LOG_POWER_PREDICTION_API_PREFIX}/${channelId}/log-power/prediction`;
  const response = await fetchWithRetry(url, { maxRetryAfter: 120_000 });
  const data = await response.json();
  if (data.code !== 200) {
    // 404는 예측이 없는 정상이므로 null 반환
    if (data.code === 404) return null;
    throw new Error(
      `Prediction summary fetch failed with code ${data.code}: ${data.message}`
    );
  }
  return data.content; // { channelId, predictionId, status, ... }
}

/**
 * API 2: .../predictions/{predictionId}?fields=participation (예측 상세)
 */
async function fetchPredictionDetails(channelId, predictionId) {
  const url = `${LOG_POWER_PREDICTION_API_PREFIX}/${channelId}/log-power/predictions/${predictionId}?fields=participation&b=${Date.now()}`;
  const response = await fetchWithRetry(url, { maxRetryAfter: 120000 });

  // 서버의 Date 헤더를 기준으로 시각 계산
  const dateHeader = response.headers.get("Date");
  const serverNowMs = dateHeader ? Date.parse(dateHeader) : Date.now();

  const data = await response.json();
  if (data.code !== 200) {
    throw new Error(
      `Prediction details fetch failed with code ${data.code}: ${data.message}`
    );
  }
  const details = data.content;

  // details 객체에 서버 기준 만료 시각과 조회 시각을 추가
  if (details) {
    details.fetchedAt = serverNowMs; // API 응답을 받은 서버 시각
    details.expireAt = serverNowMs + Number(details.remainingDuration || 0); // 서버 기준 절대 만료 시각
  }

  return details;
}

// --- 확인 함수들 ---
// *** 새 라이브 확인 및 카테고리 변경, 라이브 제목 변경, 19세 연령 제한 설정 함수 ***
async function checkLiveStatus(
  followingList,
  prevLiveStatus = {},
  isPaused,
  isLivePaused,
  isLiveOffPaused,
  isCategoryPaused,
  isLiveTitlePaused,
  isRestrictPaused,
  isWatchPartyPaused,
  isDropsPaused,
  isLiveKeepPaused,
  isLiveOffKeepPaused,
  isCategoryKeepPaused,
  isLiveTitleKeepPaused,
  isRestrictKeepPaused,
  isWatchPartyKeepPaused,
  isDropsKeepPaused,
  notificationHistory = [],
  dismissedSet = new Set()
) {
  let _liveTotal = 0;
  let _liveErrors = 0;

  const newLiveStatus = { ...prevLiveStatus };
  const notifications = [];
  const livePartyInfo = new Map();

  const SUSPECT_THRESHOLD = 2;

  await loadAdaptiveOnce();
  let CONCURRENCY = ADAPTIVE.live.c; // 적응형 동시성

  const liveChannels = followingList.filter((item) => item.streamer.openLive);

  for (let i = 0; i < liveChannels.length; i += CONCURRENCY) {
    const batch = liveChannels.slice(i, i + CONCURRENCY);

    const promises = batch.map(async (item) => {
      const { channel } = item;
      const channelId = channel.channelId;
      const wasLive = prevLiveStatus[channelId]?.live || false;
      const st = newLiveStatus[channelId] || prevLiveStatus[channelId] || {}; // 상태 객체 준비

      const prevOpenDate = prevLiveStatus[channelId]?.openDate || null;
      const prevCategory = prevLiveStatus[channelId]?.category || null;
      const prevCategoryUrl = prevLiveStatus[channelId]?.categoryUrl || null;
      const prevLiveTitle = prevLiveStatus[channelId]?.liveTitle || null;
      const prevAdultMode = prevLiveStatus[channelId]?.adultMode || false;
      const prevWatchParty = prevLiveStatus[channelId]?.watchParty || null;
      const prevDrops = prevLiveStatus[channelId]?.drops || null;

      const liveDetail = await fetchLiveDetail(channelId);
      if (!liveDetail || liveDetail.status !== "OPEN") {
        // 라이브가 아니거나 유효하지 않은 응답이면 건너뛰기
        throw new Error(`Unauthorized/Bad Request: [${channelId}]`);
      }

      const liveContent = liveDetail;

      // 프라임 여부 확인
      const isPrime = !!liveDetail.paidProduct;

      if (liveDetail.party) {
        livePartyInfo.set(channelId, liveDetail.party);
      }

      const currentOpenDate = liveContent.openDate;
      const currentLiveId = `live-${channelId}-${liveContent?.openDate}`;
      const currentCategory = liveContent?.liveCategoryValue;
      const currentCategoryUrl = `${CATEGORY_URL_PREFIX}/${liveContent?.categoryType}/${liveContent?.liveCategory}`;
      const currentLiveTitle = liveContent?.liveTitle;
      const currentAdultMode = liveContent?.adult;
      const currentWatchParty = liveContent?.watchPartyTag;
      const currentDrops = liveContent?.dropsCampaignNo;
      const currentpaidPromotion = liveContent?.paidPromotion;

      const isNotificationEnabled = channel.personalData.following.notification;
      const isFastRestart =
        wasLive &&
        prevOpenDate &&
        currentOpenDate &&
        prevOpenDate !== currentOpenDate;

      // 빠른 재시작을 감지하여 'LIVE_OFF' 알림을 추론하는 로직 추가
      // 조건: 이전에 라이브였고, openDate가 이전과 달라졌다면
      if (
        isFastRestart &&
        !isLiveKeepPaused &&
        !isLiveOffKeepPaused &&
        isNotificationEnabled
      ) {
        const expectedNotificationId = `live-off-${channel.channelId}-${prevOpenDate}`;
        const notificationExists = notificationHistory.some(
          (n) => n.id === expectedNotificationId
        );

        // 이 채널 정보로 LIVE_OFF 객체를 생성
        const channelInfo = item.channel;

        const startMs = Date.parse(currentOpenDate) || Date.now();
        const inferredCloseTimestamp = new Date(
          Math.min(Date.now(), startMs - 1000)
        ).toISOString();

        if (!notificationExists && !dismissedSet.has(expectedNotificationId)) {
          notifications.push(
            createLiveOffObject(
              channelInfo,
              inferredCloseTimestamp,
              prevOpenDate
            )
          );
          if (!isPaused && !isLivePaused && !isLiveOffPaused) {
            // Promise를 사용하여 '종료' 알림이 먼저 생성되도록 보장
            await new Promise((resolve) => {
              chrome.notifications.create(
                `live-off-${channel.channelId}-${prevOpenDate}`, // ID 일치
                createLiveOffNotification(channel, inferredCloseTimestamp),
                () => resolve()
              );
              playSoundFor("live");
            });

            // 1초 지연 후 '시작' 알림 생성
            setTimeout(() => {
              chrome.notifications.create(
                `live-${channel.channelId}-${currentOpenDate}`,
                createLiveNotification(channel, liveContent, isPrime)
              );

              playSoundFor("live");
            }, 1000);
          }
        }
      }

      // --- 1. 방송 시작 이벤트 처리 ---
      if (isNotificationEnabled && !isLiveKeepPaused) {
        const expectedNotificationId = `live-${channelId}-${currentOpenDate}`;
        const notificationExists = notificationHistory.some(
          (n) => n.id === expectedNotificationId
        );

        if (!notificationExists && !dismissedSet.has(expectedNotificationId)) {
          notifications.push(createLiveObject(channel, liveContent, isPrime));
          if (!isPaused && !isLivePaused && !isFastRestart) {
            // "재시작"이 아닐 때만 즉시 알림
            chrome.notifications.create(
              `live-${channel.channelId}-${currentOpenDate}`,
              createLiveNotification(channel, liveContent, isPrime)
            );
            playSoundFor("live");
          }
        }
      }

      // --- 2. 라이브 "중" 상태 변경 이벤트 처리 ---
      if (
        wasLive &&
        currentOpenDate === prevOpenDate &&
        isNotificationEnabled
      ) {
        const normalizedPrevCategory = norm(prevCategory);
        const normalizedCurrentCategory = norm(currentCategory);
        const normalizedPrevTitle = norm(prevLiveTitle);
        const normalizedCurrentTitle = norm(currentLiveTitle);

        const categoryChanged =
          normalizedPrevCategory &&
          normalizedCurrentCategory &&
          normalizedPrevCategory !== normalizedCurrentCategory;
        const liveTitleChanged =
          normalizedPrevTitle &&
          normalizedCurrentTitle &&
          normalizedPrevTitle !== normalizedCurrentTitle;

        // 2-1) 콤보 변경 먼저 시도
        const comboEmitted =
          categoryChanged &&
          liveTitleChanged &&
          !(isCategoryKeepPaused || isLiveTitleKeepPaused)
            ? maybeEmitComboChange({
                channel,
                st,
                prevCategory: prevCategory,
                curCategory: currentCategory,
                prevTitle: prevLiveTitle,
                curTitle: currentLiveTitle,
                prevCategoryUrl: prevCategoryUrl,
                curCategoryUrl: currentCategoryUrl,
                openDate: currentOpenDate,
                notificationHistory,
                dismissedSet,
                notifications,
                isPaused,
                isCategoryPaused,
                isLiveTitlePaused,
                liveContent,
                isPrime,
              })
            : false;

        // 2-2) 콤보가 아니면 개별 변경 처리
        if (!comboEmitted) {
          // 카테고리 변경
          if (categoryChanged && !isCategoryKeepPaused) {
            maybeEmitCategoryChange({
              channel,
              st,
              prevCategory: prevCategory,
              curCategory: currentCategory,
              prevCategoryUrl: prevCategoryUrl,
              curCategoryUrl: currentCategoryUrl,
              openDate: currentOpenDate,
              notificationHistory,
              dismissedSet,
              notifications,
              isPaused,
              isCategoryPaused,
              liveContent,
              isPrime,
            });
          }
          // 라이브 제목 변경
          if (liveTitleChanged && !isLiveTitleKeepPaused) {
            maybeEmitTitleChange({
              channel,
              st,
              prevTitle: prevLiveTitle,
              curTitle: currentLiveTitle,
              openDate: currentOpenDate,
              notificationHistory,
              dismissedSet,
              notifications,
              isPaused,
              isLiveTitlePaused,
              liveContent,
              currentCategoryUrl,
              isPrime,
            });
          }
          // 19세 연령 제한 변경 알림
          if (currentAdultMode !== prevAdultMode && !isRestrictKeepPaused) {
            const notificationObject = createLiveAdultChangeObject(
              channel,
              currentAdultMode,
              liveContent,
              currentCategoryUrl,
              isPrime
            );
            notifications.push(notificationObject);

            if (!isPaused && !isRestrictPaused) {
              createLiveAdultChangeNotification(
                notificationObject,
                currentAdultMode,
                liveContent
              );
              playSoundFor("restrict");
            }
          }
          // 같이보기 설정 알림
          if (currentWatchParty !== prevWatchParty && !isWatchPartyKeepPaused) {
            const notificationObject = createLiveWatchPartyObject(
              channel,
              liveContent,
              currentCategoryUrl,
              isPrime
            );
            notifications.push(notificationObject);

            if (!isPaused && !isWatchPartyPaused) {
              createLiveWatchPartyNotification(notificationObject, liveContent);
              playSoundFor("watchParty");
            }
          }
          // 드롭스 설정 변경 알림
          if (currentDrops !== prevDrops && !isDropsKeepPaused) {
            const notificationObject = createLiveDropsObject(
              channel,
              liveContent,
              currentCategoryUrl,
              isPrime
            );
            notifications.push(notificationObject);

            if (!isPaused && !isDropsPaused) {
              createLiveDropsNotification(notificationObject, liveContent);
              playSoundFor("drops");
            }
          }
        }
      }

      const cooldownKeys = [
        "lastCategoryChangeKey",
        "lastCategoryChangeAt",
        "lastTitleChangeKey",
        "lastTitleChangeAt",
        "lastCategoryTitleComboKey",
        "lastCategoryTitleComboAt",
      ];
      const cooldownState = {};
      for (const k of cooldownKeys) {
        if (st && st[k] !== undefined) cooldownState[k] = st[k];
      }

      return {
        channelId: channelId,
        status: {
          ...cooldownState,
          live: true,
          openDate: currentOpenDate,
          currentLiveId: currentLiveId,
          category: currentCategory,
          categoryUrl: currentCategoryUrl,
          liveTitle: currentLiveTitle,
          adultMode: currentAdultMode,
          watchParty: currentWatchParty,
          drops: currentDrops,
          paidPromotion: currentpaidPromotion,
          isPrime: isPrime,
          notificationEnabled: isNotificationEnabled,
          _suspectStreak: 0,
        },
      };
    });

    const results = await Promise.allSettled(promises);
    _liveTotal += results.length;

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const { channelId, status } = result.value;
        newLiveStatus[channelId] = status;
      } else {
        _liveErrors += 1;
        console.error(
          "Error in a specific channel during batch processing:",
          result.reason
        );
      }
    });
  }

  const liveChannelIds = new Set(
    liveChannels.map((item) => item.channel.channelId)
  );

  //방송 종료 감지 로직 시작
  const suspectChannelIds = Object.keys(prevLiveStatus).filter(
    (channelId) =>
      prevLiveStatus[channelId].live && !liveChannelIds.has(channelId)
  );

  for (const channelId of suspectChannelIds) {
    // 1) 의심 연속 횟수 업데이트
    const prevStreak = prevLiveStatus[channelId]?._suspectStreak || 0;
    const nextStreak = Math.min(prevStreak + 1, SUSPECT_THRESHOLD);

    // 변경된 streak 값을 newLiveStatus에 우선 기록
    newLiveStatus[channelId] = {
      ...prevLiveStatus[channelId],
      _suspectStreak: nextStreak,
    };

    // 2) 아직 임계치 미만이면 → 알림/검증 스킵 (조용히 다음 루프)
    if (nextStreak < SUSPECT_THRESHOLD) continue;

    let isClosed = false;
    let closeDate = "";

    try {
      const res = await fetchWithRetry(
        `${LIVE_STATUS_API_PREFIX}/${channelId}/live-status`,
        { maxRetryAfter: 120_000 }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const liveStatusData = await res.json();
      const liveContent = liveStatusData?.content;

      // 종료로 판단: closeDate가 있거나, 상태 값이 CLOSE라면
      isClosed = !!liveContent?.closeDate || liveContent?.status === "CLOSE";
      if (!isClosed) continue;

      closeDate = liveContent.closeDate;
    } catch (e) {
      // 네트워크/일시 글리치에 의한 오탐 방지를 위해 실패 시 종료 처리하지 않고 skip
      console.warn(
        `[${channelId}] Verification failed, Skip the final judgment`,
        e
      );
      continue;
    }

    newLiveStatus[channelId] = {
      live: false,
      openDate: null,
      currentLiveId: null,
      category: null,
      categoryUrl: null,
      liveTitle: null,
      adultMode: false,
      watchParty: null,
      drops: null,
      paidPromotion: false,
      isPrime: false,
      notificationEnabled:
        prevLiveStatus[channelId]?.notificationEnabled || false,
      _suspectStreak: 0,
    };

    // 전체 팔로우 목록에서 해당 채널 정보 찾기
    const channelInfo = followingList.find(
      (item) => item.channel.channelId === channelId
    )?.channel;

    if (
      channelInfo &&
      channelInfo.personalData.following.notification &&
      !isLiveOffKeepPaused
    ) {
      const prevOpenDate = prevLiveStatus[channelId]?.openDate;

      // prevOpenDate가 있을 경우에만 알림을 생성(안전장치)
      if (prevOpenDate) {
        notifications.push(
          createLiveOffObject(channelInfo, closeDate, prevOpenDate)
        );
        if (!isPaused && !isLiveOffPaused) {
          chrome.notifications.create(
            `live-off-${channelId}-${prevOpenDate}`,
            createLiveOffNotification(channelInfo, closeDate)
          );
          playSoundFor("live");
        }
      }
    }
  }

  _adapt("live", _liveTotal, _liveErrors);

  return {
    newStatus: newLiveStatus,
    notifications,
    livePartyInfo: livePartyInfo,
  };
}

function deriveDonationPhase(info) {
  if (!info) return "NONE";

  const status = String(info.partyDonationSettingStatus || "")
    .toUpperCase()
    .trim();
  const available = !!info.donationAvailable;

  // 실제로 '진행 중'으로 간주할 조건만 ACTIVE로 인정
  if (
    available &&
    (status === "OPEN" || status === "RUNNING" || status === "IN_PROGRESS")
  )
    return "ACTIVE";

  // 세션은 존재하지만 정산 대기/종료 상태: '종료(대기)'로 취급
  if (status === "WAITING_SETTLEMENT" || status === "SETTLED" || !available)
    return "ENDED_PENDING";

  // 그 외는 안전하게 'NONE'
  return "NONE";
}

// *** 통나무 파워 승부예측 확인 함수 ***
async function checkPredictionStatus(
  followingList,
  prevPredictionStatus = {},
  isPaused,
  isPredictionPaused,
  isPredictionKeepPaused,
  notificationEnabledChannels,
  notificationHistory = [],
  dismissedSet = new Set()
) {
  const newPredictionStatus = { ...prevPredictionStatus };
  const notifications = [];
  const predictionPatches = [];
  const now = Date.now();

  // 한 번에 처리할 채널 수
  const CONCURRENCY = 5;

  // 알림 켠 채널만 필터링
  const channelsToCheck = followingList.filter((item) =>
    notificationEnabledChannels.has(item.channel.channelId)
  );

  // 배치 단위로 끊어서 병렬 처리
  for (let i = 0; i < channelsToCheck.length; i += CONCURRENCY) {
    const batch = channelsToCheck.slice(i, i + CONCURRENCY);

    // 배치 내의 채널들을 동시에 검사 (Promise.all)
    const results = await Promise.all(
      batch.map(async (item) => {
        const { channel } = item;
        const channelId = channel.channelId;

        // 개별 채널에 대한 결과 저장소
        const channelResult = {
          channelId,
          newStatusEntry: null, // 갱신될 상태 객체
          newNotifications: [], // 생성된 알림들
          newPatches: [], // 생성된 패치들
        };

        const prevState = prevPredictionStatus[channelId] || {
          status: null,
          predictionId: null,
          lastNotifiedStatus: null,
        };

        try {
          // --- API 1: 현재 활성 예측 정보 가져오기 ---
          const summary = await fetchPredictionSummary(channelId);
          const summaryPredictionId = summary?.predictionId || null;
          const summaryStatus = summary?.status
            ? summary.status.toUpperCase()
            : null;

          let details = null;
          let detailsPredictionId = null;
          let detailsStatus = null;

          // [Helper] 패치 생성 함수
          const createPatch = (details) => {
            if (!details || !details.predictionId) return null;
            const originalId = `prediction-start-${channelId}-${details.predictionId}`;
            return {
              id: originalId,
              data: {
                status: details.status,
                remainingDuration: details.remainingDuration,
                optionList: details.optionList,
                participation: details.participation,
                winningOptionNo: details.winningOptionNo,
                expireAt: details.expireAt,
                fetchedAt: details.fetchedAt,
              },
            };
          };

          // 이미 종료된 상태(COMPLETED/CANCELLED)로 인지하고 있고, ID가 같다면 API 2 호출 생략
          const isFinishedState = ["COMPLETED", "CANCELLED"].includes(
            prevState.lastNotifiedStatus
          );
          if (
            prevState.predictionId === summaryPredictionId &&
            isFinishedState
          ) {
            channelResult.newStatusEntry = { ...prevState, lastCheckedAt: now };
            return channelResult; // 변경 없음, 조기 리턴
          }

          // --- 상태 판단 로직 ---
          if (summaryStatus === "ACTIVE" || summaryStatus === "EXPIRED") {
            // API 2: 상세 정보 호출
            details = await fetchPredictionDetails(
              channelId,
              summaryPredictionId
            );
            detailsPredictionId = details?.predictionId;
            detailsStatus = (details?.status || "UNKNOWN").toUpperCase();

            if (
              details &&
              detailsStatus === "ACTIVE" &&
              detailsPredictionId !== prevState.predictionId
            ) {
              // [START] 새로운 예측 시작
              const notificationObject = createPredictionStartObject(
                channel,
                details
              );
              if (
                !notificationHistory.some(
                  (n) => n.id === notificationObject.id
                ) &&
                !dismissedSet.has(notificationObject.id) &&
                !isPredictionKeepPaused
              ) {
                channelResult.newNotifications.push(notificationObject);
                if (!isPaused && !isPredictionPaused) {
                  chrome.notifications.create(
                    notificationObject.id,
                    createPredictionStartNotification(channel, details)
                  );
                  playSoundFor("prediction");
                }
                channelResult.newStatusEntry = {
                  predictionId: details.predictionId,
                  status: details.status,
                  lastNotifiedStatus: "ACTIVE",
                  lastCheckedAt: now,
                  details,
                };
                const p = createPatch(details);
                if (p) channelResult.newPatches.push(p);
              }
            } else if (
              details &&
              detailsStatus === "ACTIVE" &&
              detailsPredictionId === prevState.predictionId
            ) {
              // [UPDATE] 진행 중 업데이트
              channelResult.newStatusEntry = {
                ...prevState,
                status: details.status,
                lastCheckedAt: now,
                details,
              };
              const p = createPatch(details);
              if (p) channelResult.newPatches.push(p);
            } else if (
              details &&
              (detailsStatus === "COMPLETED" ||
                detailsStatus === "CANCELLED") && // 취소됨 상태 추가
              detailsPredictionId === prevState.predictionId &&
              prevState.lastNotifiedStatus !== "COMPLETED" &&
              prevState.lastNotifiedStatus !== "CANCELLED"
            ) {
              // [END] 종료 또는 취소됨
              // 취소된 경우 타이머 등 UI 처리를 위해 END 객체 생성 (혹은 별도 로직)
              const notificationObject = createPredictionEndObject(
                channel,
                details
              );
              if (
                !notificationHistory.some(
                  (n) => n.id === notificationObject.id
                ) &&
                !dismissedSet.has(notificationObject.id) &&
                !isPredictionKeepPaused
              ) {
                channelResult.newNotifications.push(notificationObject);
                if (!isPaused && !isPredictionPaused) {
                  // 취소됨일 경우 메시지를 다르게 줄 수 있음 (여기서는 END 노티 사용)
                  chrome.notifications.create(
                    notificationObject.id,
                    createPredictionEndNotification(channel, details)
                  );
                  playSoundFor("prediction");
                }
              }
              channelResult.newStatusEntry = {
                ...prevState,
                status: details.status,
                lastNotifiedStatus: detailsStatus, // COMPLETED or CANCELLED
                lastCheckedAt: now,
                details,
              };
              const p = createPatch(details);
              if (p) channelResult.newPatches.push(p);
            } else if (
              details &&
              detailsStatus === "EXPIRED" &&
              detailsPredictionId === prevState.predictionId &&
              prevState.lastNotifiedStatus === "ACTIVE"
            ) {
              // [EXPIRED] 마감 (집계 중) - 알림 없이 상태만 갱신
              channelResult.newStatusEntry = {
                ...prevState,
                status: details.status,
                lastNotifiedStatus: "EXPIRED",
                lastCheckedAt: now,
                details,
              };
              const p = createPatch(details);
              if (p) channelResult.newPatches.push(p);
            } else if (
              // 요약 API에선 EXPIRED 였는데 상세 API로 보니 새로운 ID인 경우 (놓친 예측)
              details &&
              detailsStatus === "EXPIRED" &&
              detailsPredictionId !== prevState.predictionId
            ) {
              // 중간 과정을 놓쳤으므로 START 알림을 생성하고 상태를 EXPIRED로 둠
              const notificationObject = createPredictionStartObject(
                channel,
                details
              );
              if (
                !notificationHistory.some(
                  (n) => n.id === notificationObject.id
                ) &&
                !dismissedSet.has(notificationObject.id) &&
                !isPredictionKeepPaused
              ) {
                channelResult.newNotifications.push(notificationObject);
                // (옵션) 알림은 띄우지 않고 히스토리에만 넣거나, 소리 없이 띄움
                channelResult.newStatusEntry = {
                  predictionId: details.predictionId,
                  status: details.status,
                  lastNotifiedStatus: "EXPIRED",
                  lastCheckedAt: now,
                  details,
                };
                const p = createPatch(details);
                if (p) channelResult.newPatches.push(p);
              }
            }
          } else {
            // --- Case C: API 1 SAYS "NOT ACTIVE" (null / 404) ---
            // 이전에 추적 중이던 예측이 사라진 경우 (API 1에서 내려감)
            if (
              prevState.predictionId &&
              (prevState.lastNotifiedStatus === "ACTIVE" ||
                prevState.lastNotifiedStatus === "EXPIRED")
            ) {
              // API 2로 최종 상태 확인 시도
              details = await fetchPredictionDetails(
                channelId,
                prevState.predictionId
              );
              detailsStatus = (details?.status || "UNKNOWN").toUpperCase();

              if (
                details &&
                (detailsStatus === "COMPLETED" || detailsStatus === "CANCELLED")
              ) {
                // 뒤늦게 종료/취소 확인 -> 알림 발송
                const notificationObject = createPredictionEndObject(
                  channel,
                  details
                );
                if (
                  !notificationHistory.some(
                    (n) => n.id === notificationObject.id
                  ) &&
                  !dismissedSet.has(notificationObject.id) &&
                  !isPredictionKeepPaused
                ) {
                  channelResult.newNotifications.push(notificationObject);
                  if (!isPaused && !isPredictionPaused) {
                    chrome.notifications.create(
                      notificationObject.id,
                      createPredictionEndNotification(channel, details)
                    );
                    playSoundFor("prediction");
                  }
                }
                channelResult.newStatusEntry = {
                  ...prevState,
                  status: details.status,
                  lastNotifiedStatus: detailsStatus,
                  lastCheckedAt: now,
                  details,
                };
                const p = createPatch(details);
                if (p) channelResult.newPatches.push(p);
              } else {
                // 정보를 찾을 수 없으면 초기화
                channelResult.newStatusEntry = {
                  predictionId: null,
                  status: null,
                  lastNotifiedStatus: null,
                  lastCheckedAt: now,
                  details: null,
                };
              }
            } else {
              // 추적 중인 것도 없었고 API 1도 없으면 상태 유지 혹은 초기화
              if (
                prevState.predictionId &&
                prevState.lastNotifiedStatus !== "COMPLETED" &&
                prevState.lastNotifiedStatus !== "CANCELLED"
              ) {
                channelResult.newStatusEntry = {
                  predictionId: null,
                  status: null,
                  lastNotifiedStatus: null,
                  lastCheckedAt: now,
                  details: null,
                };
              }
            }
          }
        } catch (e) {
          console.warn(`[${channelId}] Error checking prediction status:`, e);

          // 404 에러 처리
          if (e.message && e.message.includes("404")) {
            // API 1은 200(ACTIVE/EXPIRED)인데 API 2가 404인 경우,
            // 이는 데이터 불일치이거나 삭제된 것이 확실함.

            // 하지만 "일시적 서버 오류"일 가능성을 대비해
            // 즉시 'CANCELLED'로 바꾸기보다는,
            // 기존 상태가 있다면 유지하되 'lastCheckedAt'만 갱신하여
            // 다음 주기(1분 뒤)에 다시 확인하도록 유도하는 것이 더 안전할 수 있음.

            if (prevState.predictionId) {
              // 이번 턴에는 에러 로그만 남기고 상태를 유지 (알림 발송 안 함)
              // 만약 정말 취소된 것이라면, 다음번 API 1 호출(fetchPredictionSummary)에서도
              // 404가 뜨거나 null이 올 것이므로 그때 처리됨.

              channelResult.newStatusEntry = {
                ...prevState,
                lastCheckedAt: now,
                // 상태를 강제로 바꾸지 않고 유지함 -> 다음 턴에 다시 시도
              };

              // "즉시 취소 처리"
              /*
                 const cancelledDetails = { 
                    ...(prevState.details || {}), 
                    status: "CANCELLED", 
                    predictionId: prevState.predictionId 
                 };
                 channelResult.newStatusEntry = {
                    ...prevState,
                    status: "CANCELLED",
                    lastNotifiedStatus: "CANCELLED",
                    lastCheckedAt: now,
                    details: cancelledDetails
                 };
                 const p = createPatch(cancelledDetails);
                 if(p) channelResult.newPatches.push(p);
                 */
            }
          }
        }

        return channelResult;
      })
    );

    // 배치 처리 결과를 전체 결과에 병합
    results.forEach((res) => {
      if (!res) return;
      // 1. 상태 갱신
      if (res.newStatusEntry) {
        newPredictionStatus[res.channelId] = res.newStatusEntry;
      }
      // 2. 알림 추가
      if (res.newNotifications.length > 0) {
        notifications.push(...res.newNotifications);
      }
      // 3. 패치 추가
      if (res.newPatches.length > 0) {
        predictionPatches.push(...res.newPatches);
      }
    });
  }

  return { newStatus: newPredictionStatus, notifications, predictionPatches };
}

/**
 * 팔로우한 모든 채널의 파티 참여 및 도네이션 상태를 확인하는 함수
 */
async function checkPartyStatus(
  followingList,
  livePartyInfo,
  prevPartyStatus = {},
  prevPartyDonationStatus = {},
  isPaused,
  isPartyPaused,
  isPartyKeepPaused,
  notificationEnabledChannels,
  notificationHistory = [],
  dismissedSet = new Set()
) {
  const newPartyStatus = { ...prevPartyStatus };
  const newPartyDonationStatus = { ...prevPartyDonationStatus };
  const emittedDonationEndIds = new Set();
  const notifications = [];
  const partyCache = new Map();
  const partyUpdates = [];

  // 팔로우한 모든 채널을 대상으로 파티 정보 확인
  for (const item of followingList) {
    const { channel } = item;
    const channelId = channel.channelId;

    const prevPartyData = prevPartyStatus[channelId] || {};
    if (!notificationEnabledChannels.has(channelId)) {
      const currentParty =
        livePartyInfo.get(channelId) ||
        item.channel.party ||
        item.liveInfo?.party;
      const currentPartyNo = currentParty?.partyNo ?? null;
      // 알림 OFF인 채널은 파티 상태를 '조회 불가'로만 마킹하고 스킵
      newPartyStatus[channelId] = {
        ...prevPartyData,
        partyNo: currentPartyNo,
        partyName: currentPartyNo
          ? currentParty.partyName ?? prevPartyData.partyName ?? null
          : null,
        notificationEnabled: false,
        updatedAt: Date.now(), // 최근성은 유지(팝업에서 '종료'로 오인 방지)
      };
      continue;
    }

    if (notificationEnabledChannels.has(channelId)) {
      let partyInfoForStatus = null;
      let partySummaryForStatus = null;

      // const prevPartyData = prevPartyStatus[channelId] || {};
      const prevPartyNo = prevPartyData.partyNo || null;
      const prevPartyName = prevPartyData.partyName || null;
      const prevMemberCount = prevPartyData.memberCount || 0;
      const prevPartyMembers = prevPartyData.partyMembers || [];
      const prevAccumulatedMembers = prevPartyData.accumulatedMembers || [];

      const isNotificationEnabled = notificationEnabledChannels.has(channelId);

      // API 응답에서 파티 정보를 가져옴 (라이브가 아니더라도 party 객체가 있을 수 있음)
      const currentParty =
        livePartyInfo.get(channelId) ||
        item.channel.party ||
        item.liveInfo?.party;
      const currentPartyNo = currentParty?.partyNo || null;

      // prev 계산 먼저
      const effectivePartyNo = currentPartyNo ?? prevPartyNo;
      const prevDonation = effectivePartyNo
        ? prevPartyDonationStatus[effectivePartyNo]
        : undefined;
      const prevPhase = deriveDonationPhase(prevDonation);

      // 필요할 때만 도네 조회
      let donationInfoCache = null;
      const needDonationFetch =
        Boolean(currentPartyNo) || prevPhase === "ACTIVE";

      if (needDonationFetch) {
        const now = Date.now();
        const cached = donationInfoTtlMap.get(channelId);
        if (cached && now - cached.t < 15000) {
          donationInfoCache = cached.v;
        } else {
          try {
            const res = await fetchWithRetry(
              `${CHZZK_CHANNELS_API_URL_PREFIX}/${channelId}/party-donation-info`
            );
            donationInfoCache = (await res.json()).content ?? null;
            donationInfoTtlMap.set(channelId, { t: now, v: donationInfoCache });
          } catch (e) {
            console.warn(`[${channelId}] donation-info 호출 실패`, e);
          }
        }
      }

      // currentPhase는 여기서 판단
      const currentPhase = deriveDonationPhase(donationInfoCache);

      // 파티 존재 확인도 currentPartyNo 있을 때만
      let partyGoneBy404 = false;
      if (currentPartyNo) {
        try {
          await fetchPartyDetails(currentPartyNo);
        } catch {
          partyGoneBy404 = true;
        }
      }

      // --- 파티 분기 이전: 도네 종료 선확인 ---
      try {
        if (prevPhase === "ACTIVE" && currentPhase !== "ACTIVE") {
          const finalDonationAmount = prevDonation.totalDonationAmount;
          const finalDistributionMode = prevDonation.distributionMode;
          const finalDistributionList = prevDonation.distributionList;
          const memberCount = prevPartyStatus[channelId]?.memberCount || 0;
          const accumulatedMembersForDonation =
            prevPartyStatus[channelId]?.accumulatedMembers || [];

          const prevPartyInfoForEnd = {
            partyNo: prevDonation.partyNo,
            partyName: prevDonation.partyName ?? "파티",
            partyDonationSettingNo: prevDonation.partyDonationSettingNo,
          };

          if (!isPartyKeepPaused) {
            const notificationObject = createDonationEndObject(
              channel,
              prevPartyInfoForEnd,
              finalDonationAmount,
              finalDistributionMode,
              finalDistributionList,
              memberCount,
              accumulatedMembersForDonation
            );

            if (
              !notificationHistory.some(
                (n) => n.id === notificationObject.id
              ) &&
              !emittedDonationEndIds.has(notificationObject.id)
            ) {
              notifications.push(notificationObject);
              if (!isPaused && !isPartyPaused) {
                createDonationEndNotification(notificationObject);
                playSoundFor("donation");
              }
              emittedDonationEndIds.add(notificationObject.id);
            }
          }

          // prev/currentPartyNo 어느 쪽이든 키 일관성 위해 정리
          if (effectivePartyNo) delete newPartyDonationStatus[effectivePartyNo];
        }
      } catch (e) {
        console.warn(`[${channelId}] 도네 종료 선확인 실패:`, e);
      }

      // --- 시나리오 1: 현재 파티에 참여 중인 경우 (신규 또는 기존) ---
      if (currentPartyNo && !partyGoneBy404) {
        // 새로운 파티 시작 감지
        if (currentPartyNo !== prevPartyNo) {
          // 예상되는 알림 ID를 생성
          const expectedNotificationId = `party-${channelId}-${currentPartyNo}`;
          // 해당 알림이 이미 내역에 있는지 확인
          const notificationExists = notificationHistory.some(
            (n) => n.id === expectedNotificationId
          );

          if (
            !notificationExists &&
            !dismissedSet.has(expectedNotificationId)
          ) {
            try {
              let cached = partyCache.get(currentPartyNo);
              if (!cached) {
                const results = await Promise.allSettled([
                  fetchAllPartyMembers(currentPartyNo),
                  fetchPartyDetails(currentPartyNo),
                ]);

                const membersOk = results[0].status === "fulfilled";
                const summaryOk = results[1].status === "fulfilled";

                let partyMembersLiveInfoData = membersOk
                  ? results[0].value
                  : null;
                let partySummaryContent = summaryOk ? results[1].value : null;

                // 멤버 실패 + 요약 성공 → 최소 정보로 멤버 구조를 만들어 폴백
                if (!membersOk && summaryOk) {
                  const fallbackCount =
                    partySummaryContent?.memberCount ?? prevMemberCount ?? 0;
                  const fallbackMembers = Array.isArray(prevPartyMembers)
                    ? prevPartyMembers
                    : [];
                  partyMembersLiveInfoData = {
                    host: null,
                    members: fallbackMembers,
                    count: fallbackCount,
                  };
                }

                // 둘 중 하나라도 있으면 캐시/알림 생성 진행
                if (partyMembersLiveInfoData || partySummaryContent) {
                  // 요약이 없으면 기본값으로라도 채우기
                  const partyName = partySummaryContent?.partyName ?? "파티";
                  partySummaryContent = partySummaryContent ?? {
                    partyName,
                    partyNo: currentPartyNo,
                  };

                  cached = {
                    partyMembersLiveInfoData,
                    partySummaryContent,
                  };
                  partyCache.set(currentPartyNo, cached);
                } else {
                  // 멤버/요약 모두 실패했을 때만 경고 로그
                  console.warn(
                    "Failed to retrieve party information(Both members and summary failed) - Skip Notification"
                  );
                }
              }

              partyInfoForStatus = cached?.partyMembersLiveInfoData;
              partySummaryForStatus = cached?.partySummaryContent;

              if (cached && cached.partySummaryContent && !isPartyKeepPaused) {
                const notificationObject = createPartyStartObject(
                  channel,
                  cached.partyMembersLiveInfoData,
                  cached.partySummaryContent,
                  cached.partyMembersLiveInfoData.members ??
                    prevAccumulatedMembers
                );
                notifications.push(notificationObject);
                if (!isPaused && !isPartyPaused) {
                  createPartyNotification(notificationObject);
                  playSoundFor("party");
                }
              }
            } catch (e) {
              console.error(
                `[${channelId}] Failed to retrieve party information:`,
                e
              );
            }
          }
        }
        // 기존 파티 멤버 변경 감지
        else if (currentPartyNo === prevPartyNo) {
          try {
            let cached = partyCache.get(currentPartyNo);
            if (!cached) {
              // 멤버 수가 변경되었을 수 있으므로, 상세 멤버 목록을 다시 가져옵니다.
              const results = await Promise.allSettled([
                fetchAllPartyMembers(currentPartyNo),
                fetchPartyDetails(currentPartyNo),
              ]);

              const membersOk = results[0].status === "fulfilled";
              const summaryOk = results[1].status === "fulfilled";

              let partyMembersLiveInfoData = membersOk
                ? results[0].value
                : null;
              let partySummaryContent = summaryOk ? results[1].value : null;

              // 멤버 실패 + 요약 성공 → 최소 정보로 멤버 구조 폴백
              if (!membersOk && summaryOk) {
                const fallbackCount =
                  partySummaryContent?.memberCount ?? prevMemberCount ?? 0;
                const fallbackMembers = Array.isArray(prevPartyMembers)
                  ? prevPartyMembers
                  : [];
                partyMembersLiveInfoData = {
                  host: null,
                  members: fallbackMembers,
                  count: fallbackCount,
                };
              }

              // 둘 중 하나라도 있으면 캐시/알림 진행, 둘 다 실패면 경고만 남기고 생략
              if (partyMembersLiveInfoData || partySummaryContent) {
                const partyName = partySummaryContent?.partyName ?? "파티";
                partySummaryContent = partySummaryContent ?? {
                  partyName,
                  partyNo: currentPartyNo,
                };
                cached = { partyMembersLiveInfoData, partySummaryContent };
                partyCache.set(currentPartyNo, cached);
              } else {
                console.warn(
                  "파티 정보 조회 실패(멤버/요약 모두 실패) - 알림 생략"
                );
              }
            }

            partyInfoForStatus = cached?.partyMembersLiveInfoData;
            partySummaryForStatus = cached?.partySummaryContent;

            const backfillId = `party-${channelId}-${currentPartyNo}`;
            const has = notificationHistory.some((n) => n.id === backfillId);
            const dismissed = dismissedSet.has(backfillId);

            // 시작 알림이 원래 있어야 하는데(같은 partyNo 유지) 내역/해제목록에 없으면 백필
            if (
              !has &&
              !dismissed &&
              !isPartyKeepPaused &&
              partySummaryForStatus
            ) {
              const isNewParty =
                currentPartyNo && currentPartyNo !== prevPartyNo;
              const seedMembers =
                partyInfoForStatus?.members ??
                (isNewParty
                  ? [partyInfoForStatus?.host].filter(Boolean) // 최소 호스트만
                  : prevAccumulatedMembers);

              const notificationObject = createPartyStartObject(
                channel,
                partyInfoForStatus, // 멤버 실패 시 null일 수 있음 → createPartyStartObject가 null 허용해야 함
                partySummaryForStatus, // 최소 partyName/partyNo만 있어도 됨
                seedMembers
              );
              notifications.push(notificationObject);
              if (!isPaused && !isPartyPaused) {
                createPartyNotification(notificationObject);
                playSoundFor("party");
              }
            }

            // 새로운 누적 멤버 목록을 생성
            const accumulatedMembersMap = new Map(
              prevAccumulatedMembers.map((member) => [member.channelId, member])
            );
            // 현재 라이브 중인 멤버들을 순회하며, 기존 누적 목록에 없으면 추가
            (partyInfoForStatus?.members || []).forEach((liveMember) => {
              if (!accumulatedMembersMap.has(liveMember.channelId)) {
                accumulatedMembersMap.set(liveMember.channelId, liveMember);
              }
            });
            // 호스트 정보도 누적 목록에 포함시킵니다.
            if (
              partyInfoForStatus.host &&
              !accumulatedMembersMap.has(partyInfoForStatus.host.channelId)
            ) {
              accumulatedMembersMap.set(
                partyInfoForStatus.host.channelId,
                partyInfoForStatus.host
              );
            }

            const newAccumulatedMembers = Array.from(
              accumulatedMembersMap.values()
            );

            // 현재와 이전의 라이브 멤버 ID 목록을 추출하고 정렬
            // (정렬을 통해 멤버 순서가 달라도 같은 구성원임을 확인)
            const currentMemberIds = (partyInfoForStatus?.members ?? [])
              .map((member) => member.channelId)
              .sort();
            const prevMemberIds = (prevPartyMembers ?? [])
              .map((member) => member.channelId)
              .sort();

            // 멤버 수 또는 멤버 ID 목록의 변경을 모두 확인
            if (
              (partyInfoForStatus?.count ?? prevMemberCount) !==
                prevMemberCount ||
              JSON.stringify(currentMemberIds) !== JSON.stringify(prevMemberIds)
            ) {
              // 변경이 감지되면 기존 알림 내역을 찾아 업데이트하도록 요청
              const notificationId = `party-${channelId}-${currentPartyNo}`;
              const existsInHistory = notificationHistory.some(
                (n) => n.id === notificationId
              );

              if (existsInHistory) {
                partyUpdates.push({
                  id: notificationId,
                  data: {
                    ...partyInfoForStatus,
                    ...partySummaryForStatus,
                    accumulatedMembers: newAccumulatedMembers,
                  },
                });
              }
            }
          } catch (e) {
            console.error(
              `[${channelId}] Failed to update party member information:`,
              e
            );
          }
        }
        // 신규/기존 파티 모두에 대해 후원 상태 확인
        try {
          const prevDonation = prevPartyDonationStatus[currentPartyNo];
          const prevDonationSettingNo = prevDonation?.partyDonationSettingNo;
          const currentDonationSettingNo =
            donationInfoCache?.partyDonationSettingNo;

          const prevPhase = deriveDonationPhase(prevDonation);
          const currentPhase = deriveDonationPhase(donationInfoCache);

          // 1. 이전 후원 세션이 존재했다면, '종료'로 간주하고 알림 생성
          if (
            prevPhase === "ACTIVE" &&
            currentPhase !== "ACTIVE" &&
            prevDonation
          ) {
            const finalDonationAmount = prevDonation.totalDonationAmount;
            const finalDistributionMode = prevDonation.distributionMode;
            const finalDistributionList = prevDonation.distributionList;
            const memberCount = prevPartyStatus[channelId]?.memberCount || 0;
            const accumulatedMembersForDonation =
              prevPartyStatus[channelId]?.accumulatedMembers || [];

            const prevPartyInfoForEnd = {
              // createDonationEndObject가 쓸 정보
              partyNo: prevDonation.partyNo,
              partyName: prevDonation.partyName ?? "파티",
              partyDonationSettingNo: prevDonation.partyDonationSettingNo,
            };

            if (!isPartyKeepPaused) {
              const notificationObject = createDonationEndObject(
                channel,
                prevPartyInfoForEnd,
                finalDonationAmount,
                finalDistributionMode,
                finalDistributionList,
                memberCount,
                accumulatedMembersForDonation
              );

              if (
                !notificationHistory.some(
                  (n) => n.id === notificationObject.id
                ) &&
                !emittedDonationEndIds.has(notificationObject.id)
              ) {
                notifications.push(notificationObject);
                if (!isPaused && !isPartyPaused) {
                  createDonationEndNotification(notificationObject);
                  playSoundFor("donation");
                }
                emittedDonationEndIds.add(notificationObject.id);
              }
            }
            delete newPartyDonationStatus[currentPartyNo];
          }

          // 2. 현재 새로운 후원 세션이 존재한다면, '시작'으로 간주하고 알림 생성
          if (prevPhase !== "ACTIVE" && currentPhase === "ACTIVE") {
            let partyDetails;
            if (partyInfoForStatus) {
              const seedMembers = [
                ...(partyInfoForStatus?.members || []),
                partyInfoForStatus?.host,
              ].filter(Boolean);

              const accumulatedMembers = prevPartyStatus[channelId]
                ?.accumulatedMembers?.length
                ? prevPartyStatus[channelId].accumulatedMembers
                : seedMembers;

              partyDetails = {
                memberCount:
                  partyInfoForStatus?.count ??
                  partySummaryForStatus?.memberCount ??
                  prevPartyStatus[channelId]?.memberCount ??
                  seedMembers.length ??
                  0,
                host:
                  partyInfoForStatus?.host ??
                  prevPartyStatus[channelId]?.host ??
                  null,
                partyMembers:
                  partyInfoForStatus?.members ??
                  prevPartyStatus[channelId]?.partyMembers ??
                  [],
                accumulatedMembers: accumulatedMembers,
              };
            } else {
              const snapshot =
                (newPartyStatus && newPartyStatus[channelId]) ||
                (prevPartyStatus && prevPartyStatus[channelId]) ||
                {};

              // 현재 파티가 아닐 경우(이전 파티 스냅샷)에는 버림
              const sameParty =
                Boolean(currentPartyNo) &&
                snapshot.partyNo === currentPartyNo &&
                snapshot.partyDonationSettingNo === currentDonationSettingNo;

              const normalized = sameParty
                ? {
                    memberCount: snapshot.memberCount ?? snapshot.count ?? 0,
                    host: snapshot.host ?? null,
                    partyMembers: snapshot.partyMembers ?? [],
                    accumulatedMembers: snapshot.accumulatedMembers ?? [],
                  }
                : {};

              partyDetails = normalized;
            }

            const expectedDonationStartId = `donation-start-${channelId}-${currentPartyNo}-${currentDonationSettingNo}`;
            const donationStartExists =
              notificationHistory.some(
                (n) => n.id === expectedDonationStartId
              ) || dismissedSet.has(expectedDonationStartId);

            if (!donationStartExists && !isPartyKeepPaused) {
              const notificationObject = createDonationStartObject(
                channel,
                donationInfoCache,
                partyDetails
              );
              notifications.push(notificationObject);
              if (!isPaused && !isPartyPaused) {
                createDonationStartNotification(notificationObject);
                playSoundFor("donation");
              }
            }
          }

          // 3. 이전 후원 세션이 존재하고 현재 후원 세션이 존재하면 '종료' 후 '시작'으로 간주하고 알림 생성
          if (
            prevPhase === "ACTIVE" &&
            currentPhase === "ACTIVE" &&
            prevDonationSettingNo &&
            currentDonationSettingNo &&
            prevDonationSettingNo !== currentDonationSettingNo
          ) {
            const finalDonationAmount = prevDonation.totalDonationAmount;
            const finalDistributionMode = prevDonation.distributionMode;
            const finalDistributionList = prevDonation.distributionList;
            const memberCount = prevPartyStatus[channelId]?.memberCount || 0;
            const accumulatedMembersForDonation =
              prevPartyStatus[channelId]?.accumulatedMembers || [];

            const prevPartyInfoForEnd = {
              // createDonationEndObject가 쓸 정보
              partyNo: prevDonation.partyNo,
              partyName: prevDonation.partyName ?? "파티",
              partyDonationSettingNo: prevDonation.partyDonationSettingNo,
            };

            if (!isPartyKeepPaused) {
              const donationEndNotificationObject = createDonationEndObject(
                channel,
                prevPartyInfoForEnd,
                finalDonationAmount,
                finalDistributionMode,
                finalDistributionList,
                memberCount,
                accumulatedMembersForDonation
              );

              if (
                !notificationHistory.some(
                  (n) => n.id === donationEndNotificationObject.id
                ) &&
                !emittedDonationEndIds.has(donationEndNotificationObject.id)
              ) {
                notifications.push(donationEndNotificationObject);
                if (!isPaused && !isPartyPaused) {
                  createDonationEndNotification(donationEndNotificationObject);
                  playSoundFor("donation");
                }
                emittedDonationEndIds.add(donationEndNotificationObject.id);
              }
            }

            let partyDetails;
            if (partyInfoForStatus) {
              const seedMembers = [
                ...(partyInfoForStatus?.members || []),
                partyInfoForStatus?.host,
              ].filter(Boolean);

              const accumulatedMembers = prevPartyStatus[channelId]
                ?.accumulatedMembers?.length
                ? prevPartyStatus[channelId].accumulatedMembers
                : seedMembers;

              partyDetails = {
                memberCount:
                  partyInfoForStatus?.count ??
                  partySummaryForStatus?.memberCount ??
                  prevPartyStatus[channelId]?.memberCount ??
                  seedMembers.length ??
                  0,
                host:
                  partyInfoForStatus?.host ??
                  prevPartyStatus[channelId]?.host ??
                  null,
                partyMembers:
                  partyInfoForStatus?.members ??
                  prevPartyStatus[channelId]?.partyMembers ??
                  [],
                accumulatedMembers: accumulatedMembers,
              };
            }

            const expectedDonationStartId = `donation-start-${channelId}-${currentPartyNo}-${currentDonationSettingNo}`;
            const donationStartExists =
              notificationHistory.some(
                (n) => n.id === expectedDonationStartId
              ) || dismissedSet.has(expectedDonationStartId);

            if (!donationStartExists && !isPartyKeepPaused) {
              const donationStartNotificationObject = createDonationStartObject(
                channel,
                donationInfoCache,
                partyDetails
              );
              notifications.push(donationStartNotificationObject);
              if (!isPaused && !isPartyPaused) {
                createDonationStartNotification(
                  donationStartNotificationObject
                );
                playSoundFor("donation");
              }
            }
          }

          // --- 최신 상태 저장 (스냅샷 보존 정책) ---
          // ACTIVE가 아니더라도 마지막 스냅샷을 donationAvailable=false로 보존해
          // 종료 알림 및 팝업 '스냅샷 보기'에 활용한다.
          {
            const prevDonation = prevPartyDonationStatus[currentPartyNo];
            const prevDonationSettingNo = prevDonation?.partyDonationSettingNo;

            const snapshot = {
              partyNo:
                donationInfoCache?.partyNo ??
                prevDonation?.partyNo ??
                currentPartyNo,
              partyDonationSettingNo:
                donationInfoCache?.partyDonationSettingNo ??
                prevDonationSettingNo ??
                null,
              partyName:
                donationInfoCache?.partyName ??
                prevDonation?.partyName ??
                prevPartyName ??
                null,
              // 현재 단계가 ACTIVE인지 여부를 스냅샷에도 반영
              donationAvailable: currentPhase === "ACTIVE",
              distributionMode:
                donationInfoCache?.distributionMode ??
                prevDonation?.distributionMode ??
                null,
              distributionList:
                donationInfoCache?.distributionList ??
                prevDonation?.distributionList ??
                [],
              mode: donationInfoCache?.mode ?? prevDonation?.mode ?? null,
              totalDonationAmount:
                donationInfoCache?.totalDonationAmount ??
                prevDonation?.totalDonationAmount ??
                0,
              donationPartyLiveMemberList:
                donationInfoCache?.profileResponseList ??
                prevDonation?.donationPartyLiveMemberList ??
                [],
              partyTeamList:
                donationInfoCache?.partyTeamList ??
                prevDonation?.partyTeamList ??
                [],
              // phase 판정에 쓰는 상태도 함께 남겨 둔다
              partyDonationSettingStatus:
                donationInfoCache?.partyDonationSettingStatus ??
                prevDonation?.partyDonationSettingStatus ??
                (currentPhase === "ACTIVE" ? "OPEN" : "WAITING_SETTLEMENT"),
            };

            // donationSettingNo 정보가 하나도 없다면(아예 세션이 없었다면) 보존할 필요 없음
            if (snapshot.partyDonationSettingNo) {
              newPartyDonationStatus[currentPartyNo] = snapshot;
            } else if (currentPhase === "ACTIVE") {
              // ACTIVE인데 settingNo가 비어 있을 가능성에 대한 방어
              newPartyDonationStatus[currentPartyNo] = snapshot;
            } else {
              // 완전한 정보가 전혀 없고 비ACTIVE라면 삭제
              delete newPartyDonationStatus[currentPartyNo];
            }
          }
        } catch (e) {
          console.warn(`[${channelId}] 파티 도네이션 정보 조회 실패:`, e);
        }
      } else if (prevPartyNo) {
        // 파티 종료 처리 전에 '놓친 도네 종료' 보정
        const prevDonation = prevPartyDonationStatus[prevPartyNo];
        const prevPhase = deriveDonationPhase(prevDonation);
        try {
          const curPhase = deriveDonationPhase(donationInfoCache);

          if (prevPhase === "ACTIVE" && curPhase !== "ACTIVE") {
            const notificationObject = createDonationEndObject(
              channel,
              {
                partyNo: prevDonation.partyNo,
                partyName: prevDonation.partyName ?? "파티",
                partyDonationSettingNo: prevDonation.partyDonationSettingNo,
              },
              prevDonation.totalDonationAmount,
              prevDonation.distributionMode,
              prevDonation.distributionList,
              prevPartyStatus[channelId]?.memberCount || 0,
              prevPartyStatus[channelId]?.accumulatedMembers || []
            );

            if (
              !notificationHistory.some(
                (n) => n.id === notificationObject.id
              ) &&
              !emittedDonationEndIds.has(notificationObject.id)
            ) {
              notifications.push(notificationObject);
              if (!isPaused && !isPartyPaused) {
                createDonationEndNotification(notificationObject);
                playSoundFor("donation");
              }
              emittedDonationEndIds.add(notificationObject.id);
            }
          }
        } catch (e) {
          console.warn(
            `[${channelId}] prevParty 분기에서 도네 종료 보정 실패:`,
            e
          );
        }

        // --- 시나리오 2: 파티 세션이 내 쪽에서만 사라진 경우 (파티 종료 vs 나가기 구분) ---
        let partyStillExists = false;
        try {
          // 중요: currentPartyNo가 null인 상황이므로 prevPartyNo로 직접 조회
          const prevSummary = await fetchPartyDetails(prevPartyNo); // 200이면 존재
          if (prevSummary && prevSummary.partyNo) {
            partyStillExists = true;
          }
        } catch (e) {
          // 404 등 에러면 존재하지 않는 것으로 판단
          partyStillExists = false;
        }

        // 도네이션 상태 키 정리
        if (newPartyDonationStatus[prevPartyNo]) {
          delete newPartyDonationStatus[prevPartyNo];
        }

        if (!isPartyKeepPaused) {
          const baseInfo = { partyNo: prevPartyNo, partyName: prevPartyName };
          const notificationObject = partyStillExists
            ? createPartyLeftObject(
                channel,
                baseInfo,
                prevAccumulatedMembers,
                prevMemberCount
              )
            : createPartyEndObject(
                channel,
                baseInfo,
                prevAccumulatedMembers,
                prevMemberCount
              );

          const already = notificationHistory.some(
            (n) => n.id === notificationObject.id
          );
          if (!already) {
            notifications.push(notificationObject);
            if (!isPaused && !isPartyPaused) {
              createPartyNotification(notificationObject);
              playSoundFor("party");
            }
          }
        }
      }

      // --- newPartyStatus 갱신 로직 ---
      let finalMemberCount = Number.isFinite(prevMemberCount)
        ? prevMemberCount
        : 0;
      let finalAccumulatedMembers = Array.isArray(prevAccumulatedMembers)
        ? prevAccumulatedMembers
        : [];
      let finalLiveMembers = Array.isArray(prevPartyMembers)
        ? prevPartyMembers
        : [];

      if (currentPartyNo) {
        const cached = partyCache.get(currentPartyNo);

        // 캐시에 없으면 직전에 만든 partyInfoForStatus(실시간 조회 결과)로 대체
        const info =
          cached?.partyMembersLiveInfoData ?? partyInfoForStatus ?? null;

        if (info) {
          finalMemberCount =
            typeof info.count === "number" ? info.count : prevMemberCount;
          finalLiveMembers = Array.isArray(info.members)
            ? info.members
            : prevPartyMembers;

          // 누적 멤버 업데이트
          const isNewParty = currentPartyNo && currentPartyNo !== prevPartyNo;
          const base = isNewParty ? [] : prevAccumulatedMembers || [];
          const accumulatedMap = new Map(
            base.map((member) => [member.channelId, member])
          );

          (info.members || []).forEach((member) => {
            if (!accumulatedMap.has(member.channelId))
              accumulatedMap.set(member.channelId, member);
          });

          if (info.host && !accumulatedMap.has(info.host.channelId)) {
            accumulatedMap.set(info.host.channelId, info.host);
          }

          finalAccumulatedMembers = Array.from(accumulatedMap.values());
        }
      }

      newPartyStatus[channelId] = {
        partyNo: currentPartyNo,
        partyName: currentPartyNo
          ? partySummaryForStatus?.partyName ?? prevPartyName
          : prevPartyName ?? null,
        memberCount: finalMemberCount,
        partyMembers: currentPartyNo ? finalLiveMembers : prevPartyMembers,
        accumulatedMembers: currentPartyNo
          ? finalAccumulatedMembers
          : prevAccumulatedMembers ?? [],
        notificationEnabled: isNotificationEnabled,
        updatedAt: Date.now(),
      };
    }
  }

  return {
    newStatus: newPartyStatus,
    notifications,
    partyUpdates,
    newPartyDonationStatus,
  };
}

// --- 치지직 날짜 문자열을 Date 객체로 변환하는 헬퍼 함수 ---
function parseChzzkDate(dateString) {
  const year = parseInt(dateString.substring(0, 4), 10);
  const month = parseInt(dateString.substring(4, 6), 10) - 1; // 월은 0부터 시작
  const day = parseInt(dateString.substring(6, 8), 10);
  const hours = parseInt(dateString.substring(8, 10), 10);
  const minutes = parseInt(dateString.substring(10, 12), 10);
  const seconds = parseInt(dateString.substring(12, 14), 10);
  return new Date(year, month, day, hours, minutes, seconds);
}

// *** 새 커뮤니티 글 확인 및 내용 또는 첨부파일 수정 함수 ***
async function checkCommunityPosts(
  followingList,
  prevPostStatus = {},
  notificationEnabledChannels,
  isPaused,
  isCommunityPaused,
  isCommunityKeepPaused,
  notificationHistory = []
) {
  const newPostStatus = { ...prevPostStatus };
  const notifications = [];
  const postUpdates = [];
  const deletedIds = [];

  const currentPostIds = new Set();

  const postCheckPromises = followingList
    .filter((item) => notificationEnabledChannels.has(item.channel.channelId))
    .map((item) =>
      getLatestCommunityPost(item.channel.channelId).then((latestPost) => ({
        channel: item.channel,
        latestPost,
      }))
    );

  const results = await Promise.all(postCheckPromises);
  for (const result of results) {
    const { channel, latestPost } = result;
    const channelId = channel.channelId;

    // 이전 상태는 이제 ID와 content, attaches를 모두 포함하는 객체
    const lastSeenPost = prevPostStatus[channelId] || {
      id: null,
      content: null,
      attaches: null,
    };

    if (latestPost) {
      currentPostIds.add(latestPost.commentId);
      // *** attaches 배열을 비교하기 위한 헬퍼 함수 ***
      const getComparableAttachesString = (attaches) => {
        if (!attaches || attaches.length === 0) return "[]";
        // 각 attach 객체의 키를 정렬한 후 다시 stringify하여 순서에 상관없이 비교 가능하게 만듦
        const sortedAttaches = attaches.map((attach) => {
          const sortedKeys = Object.keys(attach).sort();
          const sortedAttach = {};
          sortedKeys.forEach((key) => {
            sortedAttach[key] = attach[key];
          });
          return sortedAttach;
        });
        return JSON.stringify(sortedAttaches);
      };

      const isNewPost = latestPost.commentId !== lastSeenPost.id;
      const isEditedPost =
        !isNewPost &&
        (latestPost.content !== lastSeenPost.content ||
          getComparableAttachesString(latestPost.attaches) !==
            getComparableAttachesString(lastSeenPost.attaches));

      if (isNewPost && !isCommunityKeepPaused) {
        // --- 1. 새로운 글 처리 ---
        const postDate = parseChzzkDate(latestPost.createdDate);
        const threeDayAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;

        if (postDate > threeDayAgo) {
          notifications.push(createPostObject(latestPost, channel));
          if (!isPaused && !isCommunityPaused) {
            createPostNotification(latestPost, channel);
            playSoundFor("community");
          }
        }
      } else if (isEditedPost) {
        // --- 2. 수정된 글 처리 ---
        // notificationHistory에서 해당 글을 찾아 content, attaches를 업데이트
        const historyItem = notificationHistory.find(
          (item) =>
            item.type === "POST" && item.commentId === latestPost.commentId
        );
        if (historyItem) {
          const newAttachLayout = calculateAttachLayout(
            latestPost.content,
            latestPost.attaches
          );

          postUpdates.push({
            id: historyItem.id,
            data: {
              content: latestPost.content,
              excerpt: decodeHtmlEntities(
                latestPost.attaches && latestPost.attaches.length > 0
                  ? makeExcerptWithAttaches(latestPost.content)
                  : makeExcerpt(latestPost.content)
              ),
              attaches: latestPost.attaches,
              attachLayout: newAttachLayout,
              isEdited: true,
            },
          });
        }
      }

      // 새로운 상태는 ID와 content, attaches를 모두 저장
      newPostStatus[channelId] = {
        id: latestPost.commentId,
        content: latestPost.content,
        excerpt: decodeHtmlEntities(
          latestPost.attaches && latestPost.attaches.length > 0
            ? makeExcerptWithAttaches(latestPost.content)
            : makeExcerpt(latestPost.content)
        ),
        attaches: latestPost.attaches,
      };
    }
  }

  // 모든 채널 확인 후, 삭제된 글을 최종적으로 판단
  notificationHistory.forEach((item) => {
    if (item.type === "POST" && !currentPostIds.has(item.commentId)) {
      // 안전장치: 너무 오래된 알림이 삭제되는 것을 방지하기 위해,
      // 생성된 지 7일 이내인 알림만 삭제 대상으로 간주
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (new Date(item.timestamp) > sevenDaysAgo) {
        deletedIds.push(item.id);
      }
    }
  });

  return {
    newStatus: newPostStatus,
    notifications,
    postUpdates: postUpdates,
    deletedIds: deletedIds,
  };
}

// *** 새 라운지 글 확인 함수 ***
async function checkLoungePosts(
  prevPostStatus = {},
  isPaused,
  isLoungePaused,
  isLoungeKeepPaused
) {
  const newPostStatus = { ...prevPostStatus };
  const notifications = [];
  const boardNumbers = [1, 2, 17, 3, 16]; // 공지사항, 업데이트, 같이보기, 이벤트, 콘텐츠 제작지원
  const postCheckPromises = boardNumbers.map((boardNumber) =>
    getLatestLoungePost(boardNumber).then((latestPost) => ({ latestPost }))
  );

  const results = await Promise.all(postCheckPromises);
  for (const result of results) {
    const { latestPost } = result;
    if (latestPost) {
      const lastSeenPostId =
        prevPostStatus[`chzzk-lounge-${latestPost.boardId}`] || null;

      if (latestPost.feedId !== lastSeenPostId && !isLoungeKeepPaused) {
        const postDate = parseChzzkDate(latestPost.timestamp);
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        // 작성된 지 24시간 이내인 글만 알림을 보냄
        if (postDate > oneDayAgo) {
          notifications.push(createLoungeObject(latestPost));

          if (!isPaused && !isLoungePaused) {
            createLoungeNotification(latestPost);
            playSoundFor("lounge");
          }
        }
      }
      newPostStatus[`chzzk-lounge-${latestPost.boardId}`] = latestPost.feedId;
    }
  }
  return { newStatus: newPostStatus, notifications };
}

// *** 새 동영상 확인 및 썸네일/갱신, 삭제 감지 함수 ***
async function checkUploadedVideos(
  followingList,
  prevVideoStatus = {},
  notificationEnabledChannels,
  notificationHistory = [],
  dismissedSet = new Set(),
  isPaused,
  isVideoPaused,
  isVideoKeepPaused
) {
  let _videoTotal = 0,
    _videoErrors = 0;

  const newVideoStatus = { ...prevVideoStatus };
  let notifications = [];
  let videoUpdates = [];
  let deletedIds = [];
  const pendingIds = new Set(); // 이번 배치에서 생성 예정인 알림 id들

  await loadAdaptiveOnce();
  let CONCURRENCY = ADAPTIVE.video.c;

  try {
    // 알림이 켜진 채널만 대상으로 삼음
    const channelsToCheck = followingList.filter((item) =>
      notificationEnabledChannels.has(item.channel.channelId)
    );

    // 삭제 감지: 알림 내역에 있지만 현재 API 목록에 없는 비디오
    const byChannelVideos = new Map();
    // 미리 빌드
    for (const historyItem of notificationHistory) {
      if (historyItem.type !== "VIDEO") continue;
      if (!byChannelVideos.has(historyItem.channelId))
        byChannelVideos.set(historyItem.channelId, []);
      byChannelVideos.get(historyItem.channelId).push(historyItem);
    }

    for (let i = 0; i < channelsToCheck.length; i += CONCURRENCY) {
      const batch = channelsToCheck.slice(i, i + CONCURRENCY);

      const promises = batch.map(async (item) => {
        const { channel } = item;
        const channelId = channel.channelId;
        const channelNotifications = [];
        const channelVideoUpdates = [];
        const channelDeletedIds = [];

        try {
          // 채널별 비디오 API를 호출
          const response = await fetchWithRetry(
            `${CHZZK_CHANNELS_API_URL_PREFIX}/${channelId}/videos?sortType=LATEST&page=0`,
            { maxRetryAfter: 180_000 }
          );
          const data = await response.json();

          if (data.code === 200 && data.content?.data) {
            const videosFromAPI = data.content.data;
            const currentVideoNos = new Set(
              videosFromAPI.map((v) => v.videoNo)
            );

            // 삭제 감지: 알림 내역에 있지만 현재 API 목록에 없는 비디오
            // 채널 처리 중
            const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const channelHistory = byChannelVideos.get(channelId) || [];
            for (const historyItem of channelHistory) {
              if (!currentVideoNos.has(historyItem.videoNo)) {
                const tsMs =
                  typeof historyItem.timestamp === "number"
                    ? historyItem.timestamp
                    : Date.parse(historyItem.timestamp);
                if (Number.isFinite(tsMs) && tsMs > sevenDaysAgoMs) {
                  channelDeletedIds.push(historyItem.id);
                }
              }
            }

            const lastSeenStatus =
              newVideoStatus[channelId] || prevVideoStatus[channelId] || {};
            const lastSeenVideoNo = lastSeenStatus.videoNo || 0;

            const { firstInstallCutoffMs } = await chrome.storage.local.get(
              "firstInstallCutoffMs"
            );
            let cutoffMs = firstInstallCutoffMs;
            if (!cutoffMs) {
              cutoffMs = Date.now() - 3 * 24 * 60 * 60 * 1000; // 첫 설치에만 3일 컷
              await chrome.storage.local.set({
                firstInstallCutoffMs: cutoffMs,
              });
            }

            const getPublishedMs = (v) => {
              const raw = v.publishDateAt ?? v.publishDate;
              const ms = typeof raw === "number" ? raw : Date.parse(raw);
              return Number.isFinite(ms) ? ms : 0; // 실패시 0(최오래됨)로 처리
            };

            // 1. API로 받아온 비디오 목록에서 '새로운' 비디오만 필터링하여 배열로
            const newVideos = videosFromAPI
              .filter((v) => v.videoNo > lastSeenVideoNo)
              .filter((v) => getPublishedMs(v) >= cutoffMs)
              .sort((a, b) => a.videoNo - b.videoNo); // 오래된->최신

            await chrome.storage.local.set({ lastRunMs: Date.now() });

            // 2. 새로운 비디오가 있을 경우에만 알림 및 상태 업데이트를 처리
            if (newVideos.length > 0 && !isVideoKeepPaused) {
              // 2-1. 모든 새로운 비디오에 대해 알림을 생성
              for (const video of newVideos) {
                const id = `video-${channelId}-${video.videoNo}`;

                const existsInHistory =
                  notificationHistory.some((h) => h.id === id) ||
                  dismissedSet.has(id);
                const existsInPending = pendingIds.has(id);

                if (existsInHistory || existsInPending) continue;

                channelNotifications.push(createVideoObject(video));
                pendingIds.add(id);
                if (!isPaused && !isVideoPaused) {
                  createVideoNotification(video);
                  playSoundFor("video");
                }
              }
            }

            // isCatchUpNeededForNotificationToggle 로직 추가 (알림 OFF -> ON 시 지난 동영상 알림)
            const wasNotificationEnabled =
              lastSeenStatus.notificationEnabled || false;
            const isNotificationEnabled =
              notificationEnabledChannels.has(channelId);

            if (
              !wasNotificationEnabled &&
              isNotificationEnabled &&
              videosFromAPI.length > 0
            ) {
              const catchups = videosFromAPI
                .filter(
                  (v) =>
                    v.videoNo > lastSeenVideoNo &&
                    !newVideos.some((nv) => nv.videoNo === v.videoNo) &&
                    getPublishedMs(v) >= cutoffMs
                )
                .sort((a, b) => a.videoNo - b.videoNo);

              for (const v of catchups) {
                const id = `video-${channelId}-${v.videoNo}`;
                const existsInHistory =
                  notificationHistory.some((h) => h.id === id) ||
                  dismissedSet.has(id);
                const existsInPending = pendingIds.has(id);
                if (existsInHistory || existsInPending) continue;

                channelNotifications.push(createVideoObject(v));
                pendingIds.add(id);
                if (!isPaused && !isVideoPaused) {
                  createVideoNotification(v);
                  playSoundFor("video");
                }
              }
            }

            // 3. 가장 최신 비디오 번호로 상태를 '한 번만' 업데이트합니다.
            if (!isVideoKeepPaused) {
              if (videosFromAPI.length > 0) {
                const latestVideoNo = Math.max(
                  ...videosFromAPI.map((v) => v.videoNo)
                );
                if (latestVideoNo > lastSeenVideoNo) {
                  newVideoStatus[channelId] = {
                    videoNo: latestVideoNo,
                    notificationEnabled: isNotificationEnabled,
                  };
                } else {
                  // 새로운 비디오는 없지만, 알림 설정 상태는 갱신
                  newVideoStatus[channelId] = {
                    ...lastSeenStatus,
                    notificationEnabled: isNotificationEnabled,
                  };
                }
              } else {
                // 비디오가 하나도 없는 경우에도 알림 설정 상태는 갱신
                newVideoStatus[channelId] = {
                  ...lastSeenStatus,
                  notificationEnabled: isNotificationEnabled,
                };
              }
            }

            // keep 중에는 최소한 notificationEnabled만 동기화하고 videoNo는 보존
            if (videosFromAPI.length > 0 && isVideoKeepPaused) {
              newVideoStatus[channelId] = {
                ...lastSeenStatus,
                notificationEnabled: isNotificationEnabled,
              };
            }

            // 새 동영상 및 썸네일/제목 업데이트 감지
            for (const video of videosFromAPI) {
              const { videoNo, videoTitle, thumbnailImageUrl } = video;

              const historyItem = notificationHistory.find(
                (hItem) => hItem.type === "VIDEO" && hItem.videoNo === videoNo
              );

              if (historyItem) {
                let updatedData = {};
                if (
                  thumbnailImageUrl &&
                  historyItem.thumbnailImageUrl !== thumbnailImageUrl
                )
                  updatedData.thumbnailImageUrl = thumbnailImageUrl;
                if (videoTitle && historyItem.content !== videoTitle)
                  updatedData.content = videoTitle;
                if (Object.keys(updatedData).length > 0) {
                  channelVideoUpdates.push({
                    id: historyItem.id,
                    data: updatedData,
                  });
                }
              }
            }
          }
        } catch (e) {
          console.error(`[${channelId}] Error checking channel videos:`, e);
        }
        return { channelNotifications, channelVideoUpdates, channelDeletedIds };
      });

      const batchResults = await Promise.all(promises);
      _videoTotal += batchResults.length;

      // 각 채널별 결과를 전체 결과에 취합
      batchResults.forEach((result) => {
        notifications.push(...result.channelNotifications);
        videoUpdates.push(...result.channelVideoUpdates);
        deletedIds.push(...result.channelDeletedIds);
      });
    }
  } catch (error) {
    _videoErrors += 1;
    console.error("Error while processing the entire video:", error);
  }

  _adapt("video", _videoTotal, _videoErrors);

  return { newStatus: newVideoStatus, notifications, videoUpdates, deletedIds };
}

// --- 최신 커뮤니티 글을 가져오는 함수 ---
async function getLatestCommunityPost(channelId) {
  try {
    const url = `${POST_API_URL_PREFIX}/${channelId}/comments?limit=10&offset=0&orderType=DESC&pagingType=PAGE`;
    const response = await fetchWithRetry(url, { maxRetryAfter: 180_000 });
    const data = await response.json();

    if (data.code === 200 && data.content?.comments?.data?.length > 0) {
      const latestPost = data.content.comments.data[0];

      // 스트리머가 작성한 글만 반환
      if (latestPost.user.userRoleCode === "streamer") {
        return {
          commentId: latestPost.comment.commentId,
          content: latestPost.comment.content,
          attaches: latestPost.comment.attaches,
          createdDate: latestPost.comment.createdDate,
        };
      }
    }
    return null;
  } catch (error) {
    console.error(`[${channelId}] Error checking community post:`, error);
    return null;
  }
}

// --- 최신 라운지 글을 가져오는 함수 ---
async function getLatestLoungePost(boardNum) {
  try {
    const url = `${CHZZK_LOUNGE_API_URL_PREFIX}?boardId=${boardNum}`;
    const response = await fetchWithRetry(url, { maxRetryAfter: 180_000 });
    const data = await response.json();

    if (data.code === 200 && data.content?.feeds?.length > 0) {
      const latestPost = data.content.feeds[0];

      return {
        feedId: latestPost.feed.feedId,
        boardId: latestPost.board.boardId,
        boardName: latestPost.board.boardName,
        title: latestPost.feed.title,
        channelId: latestPost.user.userIdHash,
        channelName: latestPost.user.nickname,
        channelImageUrl: latestPost.user.profileImageUrl,
        feedLink: latestPost.feedLink.pc,
        timestamp: latestPost.feed.createdDate,
      };
    }
    return null;
  } catch (error) {
    console.error(`[${boardNum}] Error checking lounge post:`, error);
    return null;
  }
}

// --- 상대 시간을 계산하는 헬퍼 함수 ---
function formatTimeAgo(timestamp) {
  const checkedDate = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - checkedDate.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "년 전";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "달 전";
  interval = seconds / 604800;
  if (interval > 1) return Math.floor(interval) + "주 전";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "일 전";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "시간 전";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "분 전";
  return "방금";
}

function decodeHtmlEntities(str) {
  if (!str) return str;
  // 16진수 숫자 엔티티: &#x1f3ac;
  str = str.replace(/&#x([\da-fA-F]+);/g, (_, hex) =>
    String.fromCodePoint(parseInt(hex, 16))
  );
  // 10진수 숫자 엔티티: &#127916;
  str = str.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCodePoint(parseInt(dec, 10))
  );
  // 몇 가지 기본 이름 엔티티
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// --- 알림 생성 함수들 ---
// --- 라이브 알림 생성 함수 ---
function createLiveNotification(channel, liveInfo, isPrime) {
  const { channelId, channelName, channelImageUrl } = channel;
  const {
    liveTitle,
    liveCategoryValue,
    openDate,
    dropsCampaignNo,
    watchPartyTag,
    paidPromotion,
  } = liveInfo;

  let message = "";
  const timeAgo = formatTimeAgo(openDate);

  if (timeAgo === "방금") {
    message = `${timeAgo}!\n`;
  } else {
    message = `${timeAgo}..\n`;
  }

  message += liveCategoryValue ? `[${liveCategoryValue}]` : "";
  if (watchPartyTag) message += `[같이보기/${watchPartyTag}]`;
  if (isPrime) message += "[프라임]";
  if (dropsCampaignNo) message += "[드롭스]";
  if (paidPromotion) message += "[AD]";
  message += liveCategoryValue
    ? ` ${decodeHtmlEntities(liveTitle)}`
    : `${decodeHtmlEntities(liveTitle)}`;

  // 1. 브라우저 알림 생성
  return {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `🔴 ${channelName}님이 라이브 시작!`,
    message,
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  };
}

// --- 카테고리 변경 알림 생성 함수 ---
function createCategoryChangeNotification(
  notificationObject,
  oldCategory,
  newCategory
) {
  const {
    id,
    channelName,
    channelImageUrl,
    dropsCampaignNo,
    watchPartyTag,
    paidPromotion,
    isPrime,
  } = notificationObject;

  let badge = "";
  if (watchPartyTag) badge += `[같이보기/${watchPartyTag}]`;
  if (isPrime) badge += "[프라임]";
  if (dropsCampaignNo) badge += "[드롭스]";
  if (paidPromotion) badge += "[AD]";

  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `🔄 ${channelName}님의 카테고리 변경`,
    message: `[${oldCategory || "없음"}] → [${newCategory}]${badge}`,
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  });
}

// --- 라이브 제목 변경 알림 생성 함수 ---
function createLiveTitleChangeNotification(
  notificationObject,
  oldLiveTitle,
  newLiveTitle
) {
  const { id, channelName, channelImageUrl } = notificationObject;

  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `🔄 ${channelName}님의 라이브 제목 변경`,
    message: `${
      decodeHtmlEntities(oldLiveTitle) || "없음"
    } → ${decodeHtmlEntities(newLiveTitle)}`,
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  });
}

// --- 카테고리/라이브 제목 변경 알림 생성 함수 ---
function createCategoryAndLiveTitleChangeNotification(
  notificationObject,
  oldCategory,
  newCategory,
  oldLiveTitle,
  newLiveTitle
) {
  const {
    id,
    channelName,
    channelImageUrl,
    dropsCampaignNo,
    watchPartyTag,
    paidPromotion,
    isPrime,
  } = notificationObject;

  let badge = "";
  if (watchPartyTag) badge += `[같이보기/${watchPartyTag}]`;
  if (isPrime) badge += "[프라임]";
  if (dropsCampaignNo) badge += "[드롭스]";
  if (paidPromotion) badge += "[AD]";

  let oldMessageContent = `[${
    (oldCategory.length > 10
      ? oldCategory.substring(0, 10) + " ..."
      : oldCategory) || "없음"
  }] ${oldLiveTitle || "없음"}`;

  let newMessageContent = `[${
    newCategory.length > 10
      ? newCategory.substring(0, 10) + " ..."
      : newCategory
  }]${badge} ${newLiveTitle}`;

  oldMessageContent =
    oldMessageContent.length > 20
      ? decodeHtmlEntities(oldMessageContent).substring(0, 20) + " ..."
      : decodeHtmlEntities(oldMessageContent);

  newMessageContent =
    newMessageContent.length > 20
      ? decodeHtmlEntities(newMessageContent).substring(0, 20) + " ..."
      : decodeHtmlEntities(newMessageContent);

  const messageContent = `${oldMessageContent} → ${newMessageContent}`;

  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `🔄 ${channelName}님의 카테고리&제목 변경`,
    message: messageContent,
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  });
}

// --- 라이브 19세 연령 제한 변경 알림 생성 함수 ---
function createLiveAdultChangeNotification(
  notificationObject,
  currentAdultMode,
  liveInfo
) {
  const { id, channelName, channelImageUrl } = notificationObject;
  const { liveTitle, liveCategoryValue } = liveInfo;

  const title = currentAdultMode
    ? `🔞 ${channelName}님의 연령 제한 설정`
    : `✅ ${channelName}님의 연령 제한 해제`;
  const message = currentAdultMode
    ? "19세 연령 제한 설정을 했어요"
    : "19세 연령 제한을 해제했어요";

  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: title,
    message: `${channelName}님이 ${message}\n[${liveCategoryValue}] ${decodeHtmlEntities(
      liveTitle
    )}`,
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  });
}

// --- 방송 종료 알림 생성 함수 ---
function createLiveOffNotification(channel, closeDate) {
  const { channelId, channelName, channelImageUrl } = channel;

  let message = "";
  const timeAgo = formatTimeAgo(closeDate);

  if (timeAgo === "방금") {
    message = `${timeAgo}!\n방송이 종료되었습니다. 다음 라이브 때 봐요👋`;
  } else {
    message = `${timeAgo}..\n방송이 종료되었습니다. 다음 라이브 때 봐요👋`;
  }

  return {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `💤 ${channelName}님의 라이브 종료`,
    message,
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  };
}

// --- 파티 참여 브라우저 알림 생성 함수 ---
function createPartyNotification(notificationObject) {
  const { type, channelName, channelImageUrl, partyName, partyMembers, host } =
    notificationObject;

  const isStart = type === "PARTY_START";
  const isLeft = type === "PARTY_LEFT";
  const isHost = !!host && host.channelName === channelName;
  const title = isStart
    ? `🎉 ${channelName}님의 파티 ${isHost ? "생성" : "참여"}!`
    : isLeft
    ? `👋 ${channelName}님의 파티 떠남!`
    : `👋 ${channelName}님의 파티 종료!`;
  let message = `[${decodeHtmlEntities(partyName)}]`;

  if (isStart) {
    const memberNames = partyMembers
      .map((member) => member.channelName)
      .join(", ");
    message += ` ${memberNames}`;
  } else if (isLeft) {
    message += ` 파티를 떠났습니다.`;
  } else {
    message += " 파티가 종료되었습니다.";
  }

  chrome.notifications.create(notificationObject.id, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title,
    message,
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  });
}

function createDonationStartNotification(notificationObject) {
  const { channelName, channelImageUrl, partyName } = notificationObject;

  chrome.notifications.create(notificationObject.id, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `💰 ${channelName}님의 파티 후원 시작!`,
    message: `[${decodeHtmlEntities(partyName)}] 파티 후원이 시작되었습니다`,
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  });
}

function createDonationEndNotification(notificationObject) {
  const { channelName, channelImageUrl, partyName } = notificationObject;

  chrome.notifications.create(notificationObject.id, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `💸 ${channelName}님의 파티 후원 종료!`,
    message: `[${decodeHtmlEntities(partyName)}] 파티 후원이 종료되었습니다`,
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  });
}

// --- 같이보기 설정 알림 생성 함수 ---
function createLiveWatchPartyNotification(notificationObject, liveInfo) {
  const { id, channelName, channelImageUrl } = notificationObject;
  const { watchPartyTag } = liveInfo;

  const messageTitle = watchPartyTag
    ? `🍿 ${channelName}님의 같이보기 설정`
    : `🍿 ${channelName}님의 같이보기 해제`;
  const messageContent = watchPartyTag
    ? `${channelName}님이 [${watchPartyTag}] 같이보기 설정을 했어요`
    : `${channelName}님이 같이보기 설정을 해제했어요`;

  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: messageTitle,
    message: messageContent,
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  });
}

// --- 드롭스 설정 알림 생성 함수 ---
function createLiveDropsNotification(notificationObject, liveInfo) {
  const { id, channelName, channelImageUrl } = notificationObject;
  const { dropsCampaignNo } = liveInfo;

  const messageTitle = dropsCampaignNo
    ? `🪂 ${channelName}님의 드롭스 설정`
    : `🪂 ${channelName}님의 드롭스 해제`;
  const messageContent = dropsCampaignNo
    ? `${channelName}님이 드롭스 설정을 했어요`
    : `${channelName}님이 드롭스 설정을 해제했어요`;

  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: messageTitle,
    message: messageContent,
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  });
}

// *** 새 글 알림 생성 함수 ***
function createPostNotification(post, channel) {
  const { channelId, channelName, channelImageUrl } = channel;
  const notificationId = `post-${channelId}-${post.commentId}`;

  // 1. 브라우저 알림 생성
  let messageContent = decodeHtmlEntities(post.content);

  // 메시지 길이 조절
  messageContent =
    messageContent.length > 45
      ? messageContent.substring(0, 45) + " ..."
      : messageContent;

  // 첨부 파일이 있는지 확인
  if (post.attaches && post.attaches.length > 0) {
    const attachTypes = { PHOTO: 0, STICKER: 0 };
    post.attaches.forEach((attach) => (attachTypes[attach.attachType] += 1));
    Object.keys(attachTypes).forEach((key) => {
      const attachType = key === "PHOTO" ? "이미지" : "스티커";
      if (attachTypes[key] > 0) {
        messageContent += ` (${attachType} ${attachTypes[key]}개)`;
      }
    });
  }

  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `💬 ${channelName}님의 새 커뮤니티 글`,
    message: messageContent,
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  });
}

// *** 새 라운지 글 알림 생성 함수 ***
function createLoungeNotification(post) {
  const { boardId, boardName, feedId, title, channelName, channelImageUrl } =
    post;
  const notificationId = `lounge-${boardId}-${feedId}`;

  // 1. 브라우저 알림 생성
  let messageContent = decodeHtmlEntities(title);

  // 메시지 길이 조절
  messageContent =
    messageContent.length > 45
      ? messageContent.substring(0, 45) + " ..."
      : messageContent;

  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `🧀 ${channelName}님의 새 ${boardName} 글`,
    message: messageContent,
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  });
}

// *** 새 동영상 알림 생성 함수 ***
function createVideoNotification(video) {
  const { channel, videoNo, videoType, videoTitle, thumbnailImageUrl } = video;
  const notificationId = `video-${videoNo}`;
  const title =
    videoType === "REPLAY"
      ? `🎬 ${channel.channelName}님의 다시보기`
      : `🎦 ${channel.channelName}님의 새 동영상`;

  let messageContent = decodeHtmlEntities(videoTitle);

  // 메시지 길이 조절
  messageContent =
    messageContent.length > 45
      ? messageContent.substring(0, 45) + " ..."
      : messageContent;

  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: thumbnailImageUrl || channel.channelImageUrl || "icon_128.png",
    title: title,
    message: messageContent,
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  });
}

// --- 라이브 객체 생성 함수 ---
function createLiveObject(channel, liveInfo, isPrime) {
  const { channelId, channelName, channelImageUrl } = channel;
  const {
    liveTitle,
    adult,
    categoryType,
    liveCategory,
    liveCategoryValue,
    openDate,
    dropsCampaignNo,
    watchPartyTag,
    watchPartyNo,
    paidPromotion,
  } = liveInfo;
  const notificationId = `live-${channelId}-${openDate}`;
  const categoryUrl = `${CATEGORY_URL_PREFIX}/${categoryType}/${liveCategory}`;

  // 팝업에 표시할 알림 내역 저장
  return {
    id: notificationId,
    type: "LIVE",
    channelId,
    channelName,
    channelImageUrl: channelImageUrl || "../icon_128.png",
    liveTitle: decodeHtmlEntities(liveTitle),
    categoryUrl,
    liveCategoryValue,
    adultMode: adult,
    watchPartyTag,
    watchPartyNo,
    dropsCampaignNo,
    paidPromotion,
    isPrime,
    timestamp: openDate,
    read: false,
  };
}

// --- 카테고리 변경 객체 생성 함수 ---
function createCategoryChangeObject(
  channel,
  oldCategory,
  newCategory,
  oldCategoryUrl,
  newCategoryUrl,
  liveInfo,
  isPrime,
  notificationId
) {
  const { channelId, channelName, channelImageUrl } = channel;
  const { adult, watchPartyTag, watchPartyNo, dropsCampaignNo, paidPromotion } =
    liveInfo;
  // const notificationId = `category-${channelId}-${Date.now()}`;

  return {
    id: notificationId,
    type: "CATEGORY",
    channelId,
    channelName,
    channelImageUrl,
    oldCategory,
    newCategory,
    oldCategoryUrl,
    newCategoryUrl,
    adultMode: adult,
    watchPartyTag,
    watchPartyNo,
    dropsCampaignNo,
    paidPromotion,
    isPrime,
    timestamp: new Date().toISOString(),
    read: false,
  };
}

// --- 라이브 19세 연령 제한 변경 객체 생성 함수 ---
function createLiveAdultChangeObject(
  channel,
  currentAdultMode,
  liveInfo,
  categoryUrl,
  isPrime
) {
  const { channelId, channelName, channelImageUrl } = channel;
  const {
    liveTitle,
    liveCategoryValue,
    categoryType,
    liveCategory,
    watchPartyTag,
    watchPartyNo,
    dropsCampaignNo,
    paidPromotion,
  } = liveInfo;
  const notificationId = `live-adult-${channelId}-${Date.now()}`;

  return {
    id: notificationId,
    type: "ADULT",
    channelId,
    channelName,
    channelImageUrl,
    liveCategoryValue,
    paidPromotion,
    watchPartyTag,
    watchPartyNo,
    dropsCampaignNo,
    categoryUrl,
    isPrime,
    liveTitle: decodeHtmlEntities(liveTitle),
    adultMode: currentAdultMode,
    timestamp: new Date().toISOString(),
    read: false,
  };
}

// --- 라이브 제목 변경 객체 생성 함수 ---
function createLiveTitleChangeObject(
  channel,
  oldLiveTitle,
  newLiveTitle,
  liveInfo,
  categoryUrl,
  isPrime,
  notificationId
) {
  const { channelId, channelName, channelImageUrl } = channel;
  const {
    adult,
    watchPartyTag,
    watchPartyNo,
    dropsCampaignNo,
    paidPromotion,
    liveCategoryValue,
  } = liveInfo;
  // const notificationId = `live-title-${channelId}-${Date.now()}`;

  return {
    id: notificationId,
    type: "LIVETITLE",
    channelId,
    channelName,
    channelImageUrl,
    liveCategoryValue,
    categoryUrl,
    content: `${
      decodeHtmlEntities(oldLiveTitle) || "없음"
    } → ${decodeHtmlEntities(newLiveTitle)}`,
    oldLiveTitle: decodeHtmlEntities(oldLiveTitle) || "없음",
    newLiveTitle: decodeHtmlEntities(newLiveTitle),
    adultMode: adult,
    watchPartyTag,
    watchPartyNo,
    dropsCampaignNo,
    paidPromotion,
    isPrime,
    timestamp: new Date().toISOString(),
    read: false,
  };
}

// --- 카테고리/라이브 제목 변경 객체 생성 함수 ---
function createCategoryAndLiveTitleChangeObject(
  channel,
  oldCategory,
  newCategory,
  oldLiveTitle,
  newLiveTitle,
  oldCategoryUrl,
  newCategoryUrl,
  liveInfo,
  isPrime,
  notificationId
) {
  const { channelId, channelName, channelImageUrl } = channel;
  const { adult, watchPartyTag, watchPartyNo, dropsCampaignNo, paidPromotion } =
    liveInfo;
  // const notificationId = `category-live-title-${channelId}-${Date.now()}`;

  return {
    id: notificationId,
    type: "CATEGORY/LIVETITLE",
    channelId,
    channelName,
    channelImageUrl,
    oldCategory,
    oldLiveTitle: decodeHtmlEntities(oldLiveTitle),
    newCategory,
    newLiveTitle: decodeHtmlEntities(newLiveTitle),
    oldCategoryUrl,
    newCategoryUrl,
    adultMode: adult,
    watchPartyTag,
    watchPartyNo,
    dropsCampaignNo,
    paidPromotion,
    isPrime,
    timestamp: new Date().toISOString(),
    read: false,
  };
}

// --- 방송 종료 객체 생성 함수 ---
function createLiveOffObject(channel, closeDate, openDateForId = null) {
  const { channelId, channelName, channelImageUrl } = channel;
  const notificationId = `live-off-${channelId}-${openDateForId || closeDate}`;

  return {
    id: notificationId,
    type: "LIVE_OFF",
    channelId,
    channelName,
    channelImageUrl: channelImageUrl || "../icon_128.png",
    content: "방송이 종료되었습니다. 다음 라이브 때 봐요👋",
    timestamp: closeDate,
    read: false,
  };
}

// --- 파티 참여 알림 객체 생성 함수 ---
function createPartyStartObject(
  channel,
  partyInfo,
  partySummaryInfoData,
  accumulatedMembers
) {
  const { channelId, channelName, channelImageUrl } = channel;
  const { host, members, count } = partyInfo;
  const { partyNo, partyName } = partySummaryInfoData;
  const notificationId = `party-${channelId}-${partyNo}`;

  return {
    id: notificationId,
    type: "PARTY_START",
    channelId,
    channelName,
    channelImageUrl: channelImageUrl || "../icon_128.png",
    partyNo,
    partyName: decodeHtmlEntities(partyName),
    host,
    partyMembers: members,
    accumulatedMembers: accumulatedMembers,
    memberCount: count,
    timestamp: new Date().toISOString(),
    read: false,
  };
}

function createPartyLeftObject(
  channel,
  prevPartyInfo,
  accumulatedMembers,
  memberCount
) {
  const { channelId, channelName, channelImageUrl } = channel;
  const { partyNo, partyName } = prevPartyInfo;
  const notificationId = `party-left-${channelId}-${partyNo}`;
  return {
    id: notificationId,
    type: "PARTY_LEFT",
    channelId,
    channelName,
    channelImageUrl,
    partyNo,
    partyName: decodeHtmlEntities(partyName),
    accumulatedMembers,
    memberCount,
    timestamp: new Date().toISOString(),
    read: false,
  };
}

// '파티 종료' 객체 생성 함수
function createPartyEndObject(
  channel,
  prevPartyInfo,
  accumulatedMembers,
  memberCount
) {
  const { channelId, channelName, channelImageUrl } = channel;
  const { partyNo, partyName } = prevPartyInfo;
  const notificationId = `party-end-${channelId}-${partyNo}`;

  return {
    id: notificationId,
    type: "PARTY_END",
    channelId,
    channelName,
    channelImageUrl,
    partyNo,
    partyName: decodeHtmlEntities(partyName),
    accumulatedMembers: accumulatedMembers,
    memberCount: memberCount,
    timestamp: new Date().toISOString(),
    read: false,
  };
}

// --- 파티 도네이션 시작 객체 생성 함수 ---
function createDonationStartObject(channel, donationInfo, partyDetails) {
  const { channelId, channelName, channelImageUrl } = channel;
  const {
    partyNo,
    partyName,
    distributionMode,
    distributionList,
    totalDonationAmount,
    partyDonationSettingNo,
    mode,
    partyTeamList,
  } = donationInfo;
  const { count, memberCount, host, partyMembers, accumulatedMembers } =
    partyDetails;

  const notificationId = `donation-start-${channelId}-${partyNo}-${partyDonationSettingNo}`;

  const targetPartyStartId = `party-${channelId}-${partyNo}`;

  return {
    id: notificationId,
    type: "DONATION_START",
    channelId,
    channelName,
    channelImageUrl,
    partyNo,
    partyName,
    partyDonationSettingNo: partyDonationSettingNo,
    memberCount: count ?? (memberCount || 0),
    host: host || null,
    partyMembers: partyMembers || [],
    accumulatedMembers: accumulatedMembers || [],
    distributionMode,
    distributionList,
    totalDonationAmount,
    mode: mode ?? null,
    partyTeamList: partyTeamList ?? [],
    targetPartyStartId: targetPartyStartId,
    timestamp: new Date().toISOString(),
    read: false,
  };
}

// --- 파티 도네이션 종료 객체 생성 함수 ---
function createDonationEndObject(
  channel,
  donationInfo,
  finalDonationAmount,
  finalDistributionMode,
  finalDistributionList,
  memberCount,
  accumulatedMembers = []
) {
  const { channelId, channelName, channelImageUrl } = channel;
  const { partyNo, partyName, partyDonationSettingNo } = donationInfo;
  const notificationId = `donation-end-${channelId}-${partyNo}-${partyDonationSettingNo}`;

  return {
    id: notificationId,
    type: "DONATION_END",
    channelId,
    channelName,
    channelImageUrl,
    partyNo,
    partyDonationSettingNo: partyDonationSettingNo,
    partyName,
    finalDonationAmount: finalDonationAmount,
    distributionMode: finalDistributionMode,
    distributionList: finalDistributionList,
    memberCount: memberCount,
    accumulatedMembers,
    timestamp: new Date().toISOString(),
    read: false,
  };
}

// --- 같이보기 설정 객체 생성 함수 ---
function createLiveWatchPartyObject(channel, liveInfo, categoryUrl, isPrime) {
  const { channelId, channelName, channelImageUrl } = channel;
  const {
    liveTitle,
    liveCategoryValue,
    watchPartyTag,
    watchPartyNo,
    dropsCampaignNo,
    paidPromotion,
    adult,
  } = liveInfo;
  const notificationId = `live-watch-party-${channelId}-${Date.now()}`;

  return {
    id: notificationId,
    type: "WATCHPARTY",
    channelId,
    channelName,
    channelImageUrl,
    liveTitle: decodeHtmlEntities(liveTitle),
    liveCategoryValue,
    categoryUrl,
    dropsCampaignNo,
    paidPromotion,
    watchPartyTag,
    watchPartyNo,
    adultMode: adult,
    isPrime,
    timestamp: new Date().toISOString(),
    read: false,
  };
}

// --- 드롭스 설정 객체 생성 함수 ---
function createLiveDropsObject(channel, liveInfo, categoryUrl, isPrime) {
  const { channelId, channelName, channelImageUrl } = channel;
  const {
    liveTitle,
    liveCategoryValue,
    dropsCampaignNo,
    watchPartyTag,
    watchPartyNo,
    paidPromotion,
    adult,
  } = liveInfo;
  const notificationId = `live-drops-${channelId}-${Date.now()}`;

  return {
    id: notificationId,
    type: "DROPS",
    channelId,
    channelName,
    channelImageUrl,
    liveTitle: decodeHtmlEntities(liveTitle),
    liveCategoryValue,
    categoryUrl,
    dropsCampaignNo,
    paidPromotion,
    watchPartyTag,
    watchPartyNo,
    isPrime,
    adultMode: adult,
    timestamp: new Date().toISOString(),
    read: false,
  };
}

// *** 새 글 객체 생성 함수 ***
function createPostObject(post, channel) {
  const { content, attaches } = post;
  const { channelId, channelName, channelImageUrl } = channel;
  const notificationId = `post-${channelId}-${post.commentId}`;

  const attachLayout = calculateAttachLayout(content, attaches);
  const excerpt = decodeHtmlEntities(
    attaches && attaches.length > 0
      ? makeExcerptWithAttaches(content)
      : makeExcerpt(content)
  );

  // 팝업에 표시할 알림 내역 저장
  return {
    id: notificationId,
    type: "POST",
    channelId,
    channelName,
    channelImageUrl: channelImageUrl || "../icon_128.png",
    commentId: post.commentId,
    content,
    excerpt,
    attaches,
    attachLayout,
    timestamp: post.createdDate,
    read: false,
  };
}

// *** 새 라운지 글 객체 생성 함수 ***
function createLoungeObject(post) {
  const {
    boardId,
    boardName,
    feedId,
    title,
    channelId,
    channelName,
    channelImageUrl,
    feedLink,
    timestamp,
  } = post;
  const notificationId = `lounge-${boardId}-${feedId}`;

  // 팝업에 표시할 알림 내역 저장
  return {
    id: notificationId,
    type: "LOUNGE",
    channelId,
    channelName,
    boardId,
    feedId,
    feedLink,
    channelImageUrl: channelImageUrl || "../icon_128.png",
    boardName,
    title: decodeHtmlEntities(title),
    timestamp: timestamp,
    read: false,
  };
}

// *** 새 동영상 객체 생성 함수 ***
function createVideoObject(video) {
  const {
    channel,
    videoNo,
    videoTitle,
    videoType,
    categoryType,
    videoCategory,
    videoCategoryValue,
    thumbnailImageUrl,
    publishDate,
    adult,
  } = video;
  const notificationId = `video-${videoNo}`;
  const videoCategoryUrl = `${CATEGORY_URL_PREFIX}/${categoryType}/${videoCategory}`;

  // 팝업에 표시할 알림 내역 저장
  return {
    id: notificationId,
    type: "VIDEO",
    videoNo,
    videoType,
    videoCategoryValue,
    videoCategoryUrl,
    channelName: channel.channelName,
    channelId: channel.channelId,
    channelImageUrl: channel.channelImageUrl || "../icon_128.png",
    thumbnailImageUrl: thumbnailImageUrl,
    content: decodeHtmlEntities(videoTitle),
    adult,
    timestamp: publishDate,
    read: false,
  };
}

async function checkBanners(
  prevSeenBanners = [],
  isPaused,
  isBannerPaused,
  isBannerKeepPaused
) {
  const notifications = [];
  try {
    const response = await fetchWithRetry(CHZZK_BANNER_API_URL, {
      maxRetryAfter: 180_000,
    });
    const data = await response.json();

    if (data.code === 200 && data.content?.banners) {
      const currentBanners = data.content.banners;
      const seenSet = new Set(
        prevSeenBanners.map(
          (b) => `${b.title}-${b.imageUrl}-${b.scheduledDate}`
        )
      );

      for (const banner of currentBanners) {
        const bannerKey = `${banner.title}-${banner.imageUrl}-${banner.scheduledDate}`;

        if (!seenSet.has(bannerKey)) {
          if (!isBannerKeepPaused) {
            notifications.push(createBannerObject(banner));
            if (!isPaused && !isBannerPaused) {
              createBannerNotification(banner);
              playSoundFor("banner");
            }
          }
        }
      }

      const newSeenBanners = currentBanners.map((b) => ({
        title: b.title,
        imageUrl: b.imageUrl,
        scheduledDate: b.scheduledDate,
      }));

      return { newStatus: newSeenBanners, notifications };
    }
  } catch (error) {
    console.error("Error checking banner:", error);
  }
  return { newStatus: prevSeenBanners, notifications }; // 오류 시 이전 상태 유지
}

function createBannerNotification(banner) {
  const { ad, imageUrl, title, subCopy, scheduledDate } = banner;

  let messageContent = "";

  if (ad) messageContent += "[광고]";
  messageContent += `${title}\n${subCopy}\n${scheduledDate}`;

  chrome.notifications.create(`banner-${title}-${imageUrl}-${scheduledDate}`, {
    type: "basic",
    iconUrl: imageUrl || "icon_128.png",
    title: `📢 치지직 배너 안내`,
    message: decodeHtmlEntities(messageContent),
    requireInteraction: false, // true면 클릭 전까지 남음(소리와 무관)
    silent: true, // OS 기본음 끄고, 사운드만 재생하고 싶으면 true
  });
}

function createBannerObject(banner) {
  const {
    bannerNo,
    ad,
    imageUrl,
    lightThemeImageUrl,
    landingUrl,
    title,
    subCopy,
    scheduledDate,
  } = banner;

  const notificationId = `banner-${title}-${imageUrl}-${scheduledDate}`;

  return {
    id: notificationId,
    bannerNo,
    type: "BANNER",
    ad,
    imageUrl,
    lightThemeImageUrl,
    landingUrl,
    title: decodeHtmlEntities(title),
    subCopy: decodeHtmlEntities(subCopy),
    scheduledDate,
    timestamp: new Date().toISOString(),
    read: false,
  };
}

// --- 승부예측 시작 알림 생성 함수 ---
function createPredictionStartNotification(channel, predictionDetails) {
  const { channelImageUrl, channelName } = channel;
  const { predictionTitle, optionList = [] } = predictionDetails;

  const options = optionList.map((o) => `• ${o.optionText}`).join("\n");

  return {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `🎲 ${channelName}님의 승부예측 시작!`,
    message: `${predictionTitle}\n${options}`,
    requireInteraction: false,
    silent: true,
  };
}

// --- 승부예측 시작 객체 생성 함수 ---
function createPredictionStartObject(channel, predictionDetails) {
  const { channelId, channelName, channelImageUrl } = channel;
  const {
    predictionId,
    predictionTitle,
    remainingDuration,
    optionList,
    status,
    participation,
  } = predictionDetails;
  const notificationId = `prediction-start-${channelId}-${predictionId}`;

  return {
    id: notificationId,
    type: "PREDICTION_START",
    channelId,
    channelName,
    channelImageUrl: channelImageUrl || "../icon_128.png",
    predictionId,
    predictionTitle,
    remainingDuration, // 렌더링 시점에 타이머 시작을 위함
    optionList,
    status,
    participation,
    timestamp: new Date().toISOString(), // API 응답에는 생성 시각이 없으므로 현재 시각 사용
    read: false,
  };
}

// --- 승부예측 종료/결과 알림 생성 함수 ---
function createPredictionEndNotification(channel, predictionDetails) {
  const { channelImageUrl, channelName } = channel;
  const {
    predictionTitle,
    participation,
    winningOptionNo,
    optionList = [],
  } = predictionDetails;

  let message = `${predictionTitle}\n`;

  if (participation) {
    const myOption = optionList.find(
      (o) => o.optionNo === participation.selectedOptionNo
    );
    const myOptionText = myOption ? myOption.optionText : "선택";
    message += `[나의 선택: ${myOptionText} (${participation.bettingPowers.toLocaleString()}파워)]\n`;

    if (participation.status === "WON") {
      message += `🎉 적중! +${participation.winningPowers.toLocaleString()}파워 획득!`;
    } else if (participation.status === "LOST") {
      message += `😱 빗나감...`;
    } else {
      const winningOption = optionList.find(
        (o) => o.optionNo === winningOptionNo
      );
      message += `결과: ${winningOption ? winningOption.optionText : "마감"}`;
    }
  } else {
    const winningOption = optionList.find(
      (o) => o.optionNo === winningOptionNo
    );
    if (winningOption) {
      message += `결과: ${winningOption.optionText}`;
    } else {
      message += "예측이 마감되었습니다.";
    }
  }

  return {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `🏁 ${channelName}님의 승부예측 결과`,
    message: message,
    requireInteraction: false,
    silent: true,
  };
}

// --- 승부예측 종료 객체 생성 함수 ---
function createPredictionEndObject(channel, predictionDetails) {
  const { channelId, channelName, channelImageUrl } = channel;
  const {
    predictionId,
    predictionTitle,
    remainingDuration,
    optionList,
    status,
    participation,
    winningOptionNo,
  } = predictionDetails;
  const notificationId = `prediction-end-${channelId}-${predictionId}`;

  return {
    id: notificationId,
    type: "PREDICTION_END",
    channelId,
    channelName,
    channelImageUrl: channelImageUrl || "../icon_128.png",
    predictionId,
    predictionTitle,
    remainingDuration,
    optionList, // final list
    status, // COMPLETED, EXPIRED
    participation, // { selectedOptionNo, bettingPowers, winningPowers, status }
    winningOptionNo,
    timestamp: new Date().toISOString(),
    read: false,
  };
}

// --- 알림 클릭을 처리하는 재사용 가능한 함수 ---
async function handleNotificationClick(notificationId) {
  const data = await chrome.storage.local.get("notificationHistory");
  const history = data.notificationHistory || [];

  let targetUrl = "";
  let clickedItemFound = false;

  const updatedHistory = history.map((item) => {
    if (item.id === notificationId) {
      clickedItemFound = true;
      switch (item.type) {
        case "CATEGORY":
        case "LIVETITLE":
        case "CATEGORY/LIVETITLE":
        case "WATCHPARTY":
        case "DROPS":
        case "ADULT":
        case "LIVE":
        case "LIVE_OFF":
        case "DONATION_START":
        case "DONATION_END":
        case "PARTY_LEFT":
        case "PARTY_END":
        case "LOGPOWER":
        case "PREDICTION_START":
        case "PREDICTION_END":
          targetUrl = `${CHZZK_URL}/live/${item.channelId}`;
          break;
        case "PARTY_START":
          targetUrl = `${CHZZK_URL}/party-lives/${item.partyNo}`;
          break;
        case "POST":
          targetUrl = `${CHZZK_URL}/${item.channelId}/community/detail/${item.commentId}`;
          break;
        case "VIDEO":
          targetUrl = `${CHZZK_URL}/video/${item.videoNo}`;
          break;
        case "LOUNGE":
          targetUrl = `${item.feedLink}`;
          break;
        case "BANNER":
          targetUrl = `${item.landingUrl}`;
          break;
      }
      return { ...item, read: true };
    }
    return item;
  });

  if (clickedItemFound) {
    await chrome.storage.local.set({ notificationHistory: updatedHistory });
    await updateUnreadCountBadge(); // 배지 숫자 즉시 업데이트
  }

  if (targetUrl) {
    chrome.tabs.create({ url: targetUrl });
  }
}

/**
 * 현재 필터 조건에 맞는 모든 알림을 '읽음'으로 처리하는 함수
 */
async function markAllRead(filter, limit) {
  if (isChecking) {
    setTimeout(() => markAllRead(filter, limit), 200);
    return;
  }
  const { notificationHistory = [] } = await chrome.storage.local.get(
    "notificationHistory"
  );

  const filterCondition = (item) => {
    if (filter === "ALL") return true;
    if (filter === "CATEGORY/LIVETITLE")
      return (
        item.type === "CATEGORY/LIVETITLE" ||
        item.type === "CATEGORY" ||
        item.type === "LIVETITLE"
      );
    if (filter === "LIVE_ACTIVITY")
      return item.type === "LIVE" || item.type === "LIVE_OFF";
    if (filter === "PARTY")
      return (
        item.type === "PARTY_START" ||
        item.type === "PARTY_LEFT" ||
        item.type === "PARTY_END"
      );
    if (filter === "DONATION")
      return item.type === "DONATION_START" || item.type === "DONATION_END";
    if (filter === "LOGPOWER")
      return item.type === "LOGPOWER" || item.type === "LOGPOWER/SUMMARY";
    if (filter === "PREDICTION")
      return item.type === "PREDICTION_START" || item.type === "PREDICTION_END";
    return item.type === filter;
  };

  let markedCount = 0;
  const updatedHistory = notificationHistory.map((item) => {
    if (filterCondition(item) && markedCount < limit) {
      markedCount++;
      return { ...item, read: true };
    }
    return item;
  });

  await chrome.storage.local.set({ notificationHistory: updatedHistory });
  await updateUnreadCountBadge();
}

/**
 * 현재 필터 조건에 맞는 모든 알림을 삭제하는 함수
 */
async function deleteAllFiltered(filter, limit) {
  if (!Number.isFinite(limit) || limit <= 0) {
    limit = Number.MAX_SAFE_INTEGER; // 무제한 간주
  }

  while (isChecking) {
    console.warn("deleteAllFiltered: Waiting for isChecking to be false...");
    await sleep(250);
  }

  const { notificationHistory = [], dismissedNotificationIds = [] } =
    await chrome.storage.local.get([
      "notificationHistory",
      "dismissedNotificationIds",
    ]);

  const dismissed = new Set(dismissedNotificationIds);

  const filterCondition = (item) => {
    if (filter === "ALL") return true;
    if (filter === "CATEGORY/LIVETITLE")
      return (
        item.type === "CATEGORY/LIVETITLE" ||
        item.type === "CATEGORY" ||
        item.type === "LIVETITLE"
      );
    if (filter === "LIVE_ACTIVITY")
      return item.type === "LIVE" || item.type === "LIVE_OFF";
    if (filter === "PARTY")
      return (
        item.type === "PARTY_START" ||
        item.type === "PARTY_LEFT" ||
        item.type === "PARTY_END"
      );
    if (filter === "DONATION")
      return item.type === "DONATION_START" || item.type === "DONATION_END";
    if (filter === "LOGPOWER")
      return item.type === "LOGPOWER" || item.type === "LOGPOWER/SUMMARY";
    if (filter === "PREDICTION")
      return item.type === "PREDICTION_START" || item.type === "PREDICTION_END";
    return item.type === filter;
  };

  const itemsToKeep = [];
  let matchedVisible = 0;
  for (const item of notificationHistory) {
    if (filterCondition(item) && matchedVisible < limit) {
      dismissed.add(item.id);
      matchedVisible++;
    } else {
      itemsToKeep.push(item);
    }
  }

  await chrome.storage.local.set({
    notificationHistory: itemsToKeep,
    dismissedNotificationIds: Array.from(dismissed),
  });
  await updateUnreadCountBadge();
}

/**
 * 특정 ID의 알림을 삭제하고 dismissed 목록에 추가하는 함수
 * @param {string} notificationId - 삭제할 알림의 ID
 */
async function deleteNotification(notificationId) {
  // isChecking 플래그를 확인하여 checkFollowedChannels가 실행 중일 때는 대기
  while (isChecking) {
    console.warn("deleteAllFiltered: Waiting for isChecking to be false...");
    await sleep(250);
  }

  const { notificationHistory = [], dismissedNotificationIds = [] } =
    await chrome.storage.local.get([
      "notificationHistory",
      "dismissedNotificationIds",
    ]);

  const dismissed = new Set(dismissedNotificationIds);

  // history에서 해당 알림을 제거
  const updatedHistory = notificationHistory.filter(
    (item) => item.id !== notificationId
  );

  // 재생성 방지를 위해 삭제 ID를 기억
  dismissed.add(notificationId);

  await chrome.storage.local.set({
    notificationHistory: updatedHistory,
    dismissedNotificationIds: Array.from(dismissed),
  });

  // 삭제 후 뱃지 카운트 즉시 업데이트
  await updateUnreadCountBadge();
}

// === CHZZK BOOKMARK STORAGE ===
const STORE_KEY = "chzzkBookmarks";

async function getBookmarks() {
  return new Promise((resolve) =>
    chrome.storage.local.get([STORE_KEY], (res) =>
      resolve(res[STORE_KEY] || [])
    )
  );
}
async function setBookmarks(list) {
  return new Promise((resolve) =>
    chrome.storage.local.set({ [STORE_KEY]: list }, () => resolve(true))
  );
}
function upsert(list, payload) {
  const idx = list.findIndex((x) => x.channelId === payload.channelId);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      ...Object.fromEntries(
        Object.entries(payload).filter(([k, v]) => v !== undefined && v !== "")
      ),
    };
    return { list, status: "exists" };
  } else {
    list.push(payload);
    return { list, status: "added" };
  }
}

async function checkLive(channelId) {
  try {
    const res = await fetch(`https://chzzk.naver.com/live/${channelId}`, {
      credentials: "omit",
      cache: "no-store",
    });
    const html = await res.text();
    if (
      /LIVE<\/span>/i.test(html) ||
      /thumbnail_badge_live/i.test(html) ||
      /is_on|is-live/i.test(html)
    ) {
      return true;
    }
  } catch (e) {}
  return false;
}

async function appendToLogPowerLedger(
  channelId,
  channelName,
  channelImageUrl,
  results,
  ts
) {
  const { logPowerLedger = { entries: {} } } = await chrome.storage.local.get(
    "logPowerLedger"
  );
  const entries = logPowerLedger.entries || {};

  for (const r of results || []) {
    if (!r || !r.ok || !r.claimId) continue;
    if (entries[r.claimId]) continue; // claimId 기준 중복 방지

    entries[r.claimId] = {
      claimId: r.claimId,
      claimType: String(r.claimType || "").toUpperCase(),
      claimTypeNorm: normalizeClaimType(r.claimType),
      amount: Number(r.amount || 0),
      channelId,
      channelName,
      channelImageUrl,
      timestamp: ts || new Date().toISOString(),
    };
  }
  logPowerLedger.entries = entries;

  // 용량 관리: 너무 많아지면 오래된 것 삭제/압축
  // 50k 초과 시 오래된 순으로 정리
  const MAX = 50000;
  const keys = Object.keys(entries);
  if (keys.length > MAX) {
    const arr = keys
      .map((k) => entries[k])
      .sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
    const toKeep = arr.slice(-MAX);
    const compact = Object.create(null);
    for (const e of toKeep) compact[e.claimId] = e;
    logPowerLedger.entries = compact;
  }

  await chrome.storage.local.set({ logPowerLedger });
}

async function aggregateLogPowerBetweenFromLedger(start, end) {
  const { notificationHistory = [] } = await chrome.storage.local.get(
    "notificationHistory"
  );
  const { logPowerLedger = { entries: {} } } = await chrome.storage.local.get(
    "logPowerLedger"
  );
  const all = Object.values(logPowerLedger.entries || {});
  const sTs = +start,
    eTs = +end;

  // 파생/라벨
  const WATCH_MINUTES_PER_HOUR = 12;
  const HOUR_LABEL = normalizeClaimType("WATCH_1_HOUR");
  const FIVE_LABEL = normalizeClaimType("WATCH_5_MINUTE");
  const FOLLOW_LABEL = normalizeClaimType("FOLLOW");

  // 채널 메타(이름/이미지) 최신값(<= end) 확보
  const metaByCh = new Map();
  for (const it of notificationHistory) {
    if (it?.type !== "LOGPOWER") continue;
    const t = +new Date(it.timestamp || 0);
    if (Number.isNaN(t) || t > eTs) continue;
    metaByCh.set(it.channelId, {
      name: it.channelName || "알 수 없음",
      imageUrl: it.channelImageUrl || "../icon_128.png",
    });
  }

  let total = 0,
    count = 0;
  const per = new Map(); // ch -> { channelId, ..., total, count, typeSet, typeCounts }
  const typeCountsAll = Object.create(null); // 전체 기간 타입별 합계

  // 1) 원장 스캔: 기본 집계
  for (const e of all) {
    const t = +new Date(e.timestamp || 0);
    if (Number.isNaN(t) || t < sTs || t > eTs) continue;

    const amt = Number(e.amount || 0);
    total += amt;
    count += 1;

    const key = e.channelId || "unknown";
    let acc = per.get(key);
    if (!acc) {
      acc = {
        channelId: key,
        channelName: e.channelName || "알 수 없음",
        channelImageUrl: e.channelImageUrl || "../icon_128.png",
        total: 0,
        count: 0,
        typeSet: new Set(),
        typeCounts: Object.create(null),
      };
      per.set(key, acc);
    }
    acc.total += amt;
    acc.count += 1;

    const label = e.claimTypeNorm || normalizeClaimType(e.claimType);
    if (label) {
      acc.typeSet.add(label);
      const cur = acc.typeCounts[label] || { count: 0, total: 0 };
      cur.count += 1;
      cur.total += amt;
      acc.typeCounts[label] = cur;

      const g = typeCountsAll[label] || { count: 0, total: 0 };
      g.count += 1;
      g.total += amt;
      typeCountsAll[label] = g;
    }
  }

  // 2) 채널별 파생/보정
  const channels = [...per.values()].map((c) => {
    const hour = c.typeCounts[HOUR_LABEL] || { count: 0, total: 0 };
    const five = c.typeCounts[FIVE_LABEL] || { count: 0, total: 0 };
    const follow = c.typeCounts[FOLLOW_LABEL] || { count: 0, total: 0 };

    // 2-1) 1시간 → 5분 12회 파생 "횟수" 추가
    const derivedFiveCnt = (hour.count || 0) * WATCH_MINUTES_PER_HOUR;
    if (derivedFiveCnt > 0) {
      five.count += derivedFiveCnt;
      c.typeCounts[FIVE_LABEL] = five;
      c.typeSet.add(FIVE_LABEL); // chips에 노출되도록 세트에도 포함

      const g = typeCountsAll[FIVE_LABEL] || { count: 0, total: 0 };
      g.count += derivedFiveCnt;
      typeCountsAll[FIVE_LABEL] = g;
    }

    // 2-2) 관측증가 − 시청/팔로우
    const hourAmt = Number(hour.total || 0);
    const fiveAmt = Number(five.total || 0);
    const followAmt = Number(follow.total || 0);

    const inferredFiveAmt = hourAmt * 1.2;

    // 2-3) "표시용 5분 금액" = 원장 5분 + 추론 5분
    const fiveDisplayTotal = fiveAmt + inferredFiveAmt;
    c.typeCounts[FIVE_LABEL] = {
      ...five,
      total: fiveDisplayTotal,
    };
    // 집계 전체에도 5분 표시금액의 '증분'을 더해 합계 일관성 유지
    {
      const g = typeCountsAll[FIVE_LABEL] || { count: 0, total: 0 };
      g.total += inferredFiveAmt;
      typeCountsAll[FIVE_LABEL] = g;
    }

    // 2-4) 채널 "표시용 합계" = 1시간 + 원장 5분 + 추론 5분 + 팔로우
    const displayTotal = hourAmt + fiveAmt + inferredFiveAmt + followAmt;
    const shownCount = c.count + derivedFiveCnt;

    return {
      channelId: c.channelId,
      channelName: c.channelName,
      channelImageUrl: c.channelImageUrl,
      total: displayTotal, // 팝업 .stat-total 에 쓰이는 표시 기준 합계
      observedTotal: displayTotal, // (디버깅/검증용) 실제 관측 증가
      count: shownCount,
      typeCount: Object.keys(c.typeCounts).length,
      claimTypes: [...c.typeSet],
      typeBreakdown: Object.entries(c.typeCounts)
        .map(([claimType, s]) => ({
          claimType, // 한국어 라벨(정규화)
          claimTypeNorm: claimType, // 팝업 chips 호환
          count: s.count,
          total: s.total,
        }))
        .sort((a, b) => b.total - a.total),
    };
  });

  channels.sort((a, b) => b.total - a.total);

  // 4) 전체 합계/횟수(표시 기준)
  const aggTotal = channels.reduce((s, ch) => s + Number(ch.total || 0), 0);
  const aggCount = channels.reduce((s, ch) => s + Number(ch.count || 0), 0);

  return { total: aggTotal, count: aggCount, channels, typeCountsAll };
}

// --- 알림 클릭 이벤트 핸들러 ---
chrome.notifications.onClicked.addListener((notificationId) => {
  handleNotificationClick(notificationId);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "UPDATE_BADGE") {
    updateUnreadCountBadge();
  }

  if (request.type === "MARK_ALL_READ") {
    (async () => {
      while (isChecking) {
        console.warn("markAllRead: Waiting for isChecking to be false...");
        await sleep(250);
      }
      await markAllRead(request.filter, request.limit);
      sendResponse({ ok: true });
    })();
    return true; // async 응답
  }

  if (request.type === "DELETE_ALL_FILTERED") {
    (async () => {
      while (isChecking) {
        console.warn(
          "deleteAllFiltered: Waiting for isChecking to be false..."
        );
        await sleep(250);
      }
      await deleteAllFiltered(request.filter, request.limit);
      sendResponse({ ok: true });
    })();
    return true; // async 응답
  }

  if (request.type === "DELETE_NOTIFICATION") {
    (async () => {
      while (isChecking) {
        console.warn(
          "deleteNotification: Waiting for isChecking to be false..."
        );
        await sleep(250);
      }
      await deleteNotification(request.notificationId);
      sendResponse({ ok: true });
    })();
    return true; // async 응답
  }

  // *** 팝업의 알림 클릭 요청 처리 ***
  if (request.type === "NOTIFICATION_CLICKED") {
    handleNotificationClick(request.notificationId);
    // 응답이 필요 없는 단방향 메시지
  }

  if (request.type === "RUN_CHECK_IMMEDIATELY") {
    checkFollowedChannels();
  }
  const resolvePath = (f) =>
    String(f || "").startsWith("idb:") ? f : `sounds/${f}`;
  // 팝업에서 오는 프리뷰 재생
  if (request.type === "PLAY_PREVIEW_SOUND") {
    (async () => {
      try {
        const g = await getSoundGlobal();
        if (!g.enabled) {
          sendResponse({ ok: true, muted: true });
          return;
        }

        const created = await ensureOffscreenDocument();
        if (created) await sleep(100);

        const vol = Math.min(
          2,
          Math.max(0, Number(request.volume || 0) * g.volume)
        );
        await chrome.runtime.sendMessage({
          type: "OFFSCREEN_PREVIEW",
          file: resolvePath(request.file),
          volume: vol,
        });
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true; // async 응답
  }

  if (request.type === "GET_CHANNEL_LOG_POWER") {
    (async () => {
      try {
        const { channelId } = request;
        if (!channelId) throw new Error("channelId missing");
        const content = await fetchLogPower(channelId);
        sendResponse({ success: true, content });
      } catch (e) {
        sendResponse({ success: false, error: String(e) });
      }
    })();
    return true; // async 응답
  }

  if (request?.type === "LOG_POWER_CHECK_NOW") {
    (async () => {
      try {
        const tabId = sender?.tab?.id;
        const channelId = request.channelId;
        if (!tabId || !channelId) {
          sendResponse({ ok: false, error: "INVALID_ARGS" });
          return;
        }

        await checkAndClaimPowerForChannel(channelId, tabId, null, {
          force: true,
        });

        // 이 메시지의 응답은 content.js가 굳이 기다리지 않으므로 간단히 응답
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: String(e?.message || e) });
      }
    })();
    return true;
  }

  if (request.type === "RUN_LOGPOWER_SUMMARY_MANUAL") {
    (async () => {
      try {
        const kinds =
          Array.isArray(request.kinds) && request.kinds.length
            ? request.kinds
            : ["daily"];
        const force = !!request.force;
        const reqAnchor = request.anchor === "current" ? "current" : "previous";

        // “직전” 기준 앵커들 (어제/지난주/지난달/작년 12/31)
        const anchors = expectedSummaryAnchors(new Date()); // daily/weekly/monthly/year_end
        const { logpowerSummaryLastRun = {} } = await chrome.storage.local.get(
          "logpowerSummaryLastRun"
        );

        const results = [];
        for (const k of kinds) {
          // daily + current인 경우에만 오늘로 override
          const anchorDate =
            reqAnchor === "current" && k === "daily"
              ? new Date()
              : anchors[k] || new Date();

          const { key } = periodBounds(k, anchorDate);

          const isTransient = reqAnchor === "current" && k === "daily";

          if (!isTransient) {
            if (!force && logpowerSummaryLastRun[k] === key) {
              results.push({
                kind: k,
                key,
                executed: false,
                reason: "already",
              });
              continue;
            }
          }

          await runLogPowerSummaries(anchorDate, [k], {
            transient: isTransient,
            force: force,
          });
          results.push({
            kind: k,
            key,
            executed: true,
            transient: isTransient,
          });
        }

        sendResponse({ ok: true, results });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true; // async 응답
  }

  if (request.type === "GET_LOG_POWER_BALANCES") {
    (async () => {
      try {
        const res = await fetch(
          "https://api.chzzk.naver.com/service/v1/log-power/balances"
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        sendResponse({ success: true, data: json });
      } catch (e) {
        sendResponse({ success: false, error: String(e) });
      }
    })();
    return true; // 비동기 응답
  }

  if (request.type === "LOG_POWER_PUT_DONE") {
    (async () => {
      // checkFollowedChannels가 실행 중이면 끝날 때까지 대기
      while (isChecking) {
        console.warn("LOG_POWER_PUT_DONE is waiting for isChecking lock...");
        await sleep(250); // 250ms 대기 후 재시도
      }

      const {
        channelId,
        channelName,
        channelImageUrl,
        results = [],
        claims = [],
        baseTotalAmount = 0,
      } = request;

      // 성공 항목만 합계 계산
      const succeeded = results.filter((r) => r.ok);
      const totalClaimed = succeeded.reduce(
        (acc, r) => acc + (r.amount || 0),
        0
      );
      // 성공한 것만 seen 처리
      {
        const s = logPowerSeenClaims.get(channelId) || new Set();
        succeeded.forEach((r) => r?.claimId && s.add(r.claimId));
        logPowerSeenClaims.set(channelId, s);
      }

      const claimById = new Map(claims.map((c) => [c.claimId, c]));
      const claimedList = succeeded.map((r) => {
        const meta = claimById.get(r.claimId) || {};
        return {
          claimId: r.claimId,
          claimType: r.claimType,
          amount: r.amount || 0,
          displayTitle: meta.displayTitle,
          displayIcon: meta.displayIcon,
          displayUnit: meta.displayUnit,
          displayBaseAmount: meta.displayBaseAmount,
        };
      });

      await appendToLogPowerLedger(
        channelId,
        channelName,
        channelImageUrl,
        succeeded,
        new Date().toISOString()
      );

      const { isPaused = false, isLogPowerPaused = false } =
        await chrome.storage.local.get(["isPaused", "isLogPowerPaused"]);

      // 히스토리 추가 + 알림
      const entry = await pushLogPowerHistory({
        channelId,
        channelName,
        channelImageUrl,
        totalClaimed,
        results,
        claims,
        claimedList,
        baseTotalAmount,
      });

      try {
        const nowTs = Date.now();
        // succeeded (ok인 결과 배열) 를 넘겨서 clientClaims에 저장
        await _recordClientClaims(channelId, succeeded, nowTs);
      } catch (e) {
        console.warn("failed to record client claims:", e);
      }

      const newAmount = (baseTotalAmount || 0) + (totalClaimed || 0);

      // 같은 탭의 content.js에게 "뱃지 갱신" 알림
      try {
        const targetTabId = sender?.tab?.id;
        if (targetTabId) {
          chrome.tabs.sendMessage(
            targetTabId,
            {
              type: "CHANNEL_LOG_POWER_UPDATED",
              channelId,
              newAmount, // 즉시 표시할 새 합계
              delta: totalClaimed, // 이번에 증가한 양
            },
            () => void chrome.runtime.lastError
          );
        }
      } catch (_) {}

      if (!isPaused && !isLogPowerPaused) {
        createLogPowerNotification(entry);
        playSoundFor("logpower");
      }
      try {
        sendResponse({ ok: true, totalClaimed });
      } catch (e) {}
    })();
    return true;
  }

  if (request.type === "bookmark:liveStatus") {
    (async () => {
      const data = await refreshBookmarkLiveStatus(!!request.force);
      sendResponse({ ok: true, live: data });
    })();
    return true;
  }

  if (request.type === "bookmark:add") {
    (async () => {
      const list = await getBookmarks();
      const { list: next, status } = upsert(list, request.payload);
      await setBookmarks(next);
      // 북마크 변경 즉시 캐시도 갱신
      await refreshBookmarkLiveStatus(true);
      sendResponse({ ok: true, status });
    })();
    return true;
  }

  if (request.type === "bookmark:list") {
    (async () => {
      // 기존처럼 북마크 자체에 isLive 덮어쓰지 않고 원본만 반환
      const list = await getBookmarks();
      sendResponse({ ok: true, bookmarks: list });
    })();
    return true;
  }

  if (request.type === "bookmark:has") {
    (async () => {
      const list = await getBookmarks();
      const exists = list.some((b) => b.channelId === request.channelId);
      sendResponse({ ok: true, exists });
    })();
    return true;
  }

  if (request.type === "bookmark:clear") {
    (async () => {
      await setBookmarks([]);
      await refreshBookmarkLiveStatus(true);
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (request.type === "bookmark:remove") {
    (async () => {
      const list = await getBookmarks();
      const next = list.filter((b) => b.channelId !== request.channelId);
      await setBookmarks(next);
      // 북마크 변경 즉시 캐시도 갱신
      await refreshBookmarkLiveStatus(true);
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (request.type === "GET_PREDICTION_DETAILS") {
    (async () => {
      try {
        const { channelId, predictionId } = request;
        if (!channelId || !predictionId) {
          throw new Error("channelId or predictionId missing");
        }
        const details = await fetchPredictionDetails(channelId, predictionId);
        sendResponse({ ok: true, content: details });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true; // 비동기 응답
  }

  // *** 버전 확인 요청 핸들러 ***
  if (request.type === "GET_VERSION") {
    sendResponse({ version: chrome.runtime.getManifest().version });
    return true; // 비동기 응답을 위해 true 반환
  }
});
