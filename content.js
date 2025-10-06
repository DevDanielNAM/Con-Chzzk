/**
 * 팔로우 중인 채널 중 알림이 켜져 있는 모든 채널의 알림을 OFF
 */
async function offAllNotifications() {
  const BATCH_SIZE = 10;
  const DELAY_BETWEEN_BATCHES = 500;

  try {
    // 1. 팔로우 중인 모든 채널 목록 가져오기
    console.log("팔로우 중인 모든 채널 목록을 가져오는 중...");
    const followListUrl =
      "https://api.chzzk.naver.com/service/v1/channels/followings?size=505&sortType=FOLLOW";
    const response = await fetch(followListUrl, { credentials: "include" });

    if (!response.ok) {
      throw new Error(
        `팔로우 목록을 가져오는데 실패했습니다: ${response.status}`
      );
    }

    const data = await response.json();

    // 현재 알림이 'true'인 채널만 필터링
    const channelIds =
      data.content?.followingList
        .filter((item) => item.channel.personalData.following.notification)
        .map((item) => item.channel.channelId) || [];

    if (channelIds.length === 0) {
      console.log("알림을 끌 채널이 없습니다.");
      return;
    }

    console.log(`총 ${channelIds.length}개의 채널에 대해 알림을 끕니다.`);

    // 2. 필터링된 채널에 대해서만 알림 끄기 요청 (배치 처리)
    for (let i = 0; i < channelIds.length; i += BATCH_SIZE) {
      const batch = channelIds.slice(i, i + BATCH_SIZE);
      console.log(
        `배치 ${Math.floor(i / BATCH_SIZE) + 1} 처리 중... (${i + 1} ~ ${
          i + batch.length
        } / ${channelIds.length})`
      );

      const promises = batch.map((channelId) => {
        const url = `https://api.chzzk.naver.com/service/v1/channels/${channelId}/notification`;
        // 알림 끄기 (DELETE)
        return fetch(url, {
          method: "DELETE",
          credentials: "include",
        });
      });

      await Promise.all(promises);

      if (i + BATCH_SIZE < channelIds.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES)
        );
      }
    }

    console.log("선택된 모든 채널의 알림이 성공적으로 꺼졌습니다.");
  } catch (error) {
    console.error("전체 알림 끄기 중 오류 발생:", error);
  }
}

(async () => {
  // 1. 자신의 버전과 background의 버전을 확인하여 '고아' 스크립트인지 검사
  try {
    const myVersion = chrome.runtime.getManifest().version;
    const response = await chrome.runtime.sendMessage({ type: "GET_VERSION" });

    // 버전이 다르다면 '고아'이므로 즉시 실행을 중단
    if (!response || myVersion !== response.version) {
      console.warn(`구버전(v${myVersion}) content.js 실행을 중단합니다.`);
      return;
    }
  } catch (error) {
    // background와 통신 자체가 불가능하면 '고아'이므로 실행을 중단
    if (error.message.includes("Could not establish connection")) {
      console.warn("연결할 수 없는 content.js 실행을 중단합니다.");
      return;
    }
  }

  // 확장 프로그램 기능 시작
  chrome.storage.local.get("isPaused", (data) => {
    if (data.isPaused) {
      return;
    }
  });

  // --- 메시지 수신 이벤트 리스너 추가 ---
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // PING 메시지에 응답
    if (request.type === "PING") {
      // 이 응답을 보내면 popup.js는 content.js가 살아있다는 것을 알게 됩니다.
      sendResponse({ status: "ready" });
      return true; // 비동기 응답을 위해 true를 반환해야 합니다.
    }

    // 팝업으로부터 "모든 알림 끄기" 요청을 받았는지 확인
    if (request.type === "TURN_OFF_ALL_NOTIFICATIONS") {
      (async () => {
        try {
          await offAllNotifications();
          sendResponse({ ok: true });
        } catch (e) {
          sendResponse({ ok: false, error: e?.message || "FAILED" });
        }
      })();
      return true; // 비동기 응답
    }

    if (request?.type === "LOG_POWER_CLAIMS_FOUND") {
      const {
        channelId,
        channelName = "",
        channelImageUrl = "",
        claims = [],
        baseTotalAmount = 0,
      } = request;
      (async () => {
        const results = [];
        for (const c of claims) {
          if (!c?.claimId) continue;
          try {
            await putLogPowerClaim(channelId, c.claimId);
            results.push({
              claimId: c.claimId,
              ok: true,
              claimType: c.claimType,
              amount: c.amount ?? 0,
            });
          } catch (e) {
            results.push({
              claimId: c.claimId,
              ok: false,
              claimType: c.claimType,
              reason: e?.message || "PUT_FAILED",
            });
          }
        }

        // 완료 보고 (background가 알림/히스토리 생성)
        chrome.runtime.sendMessage(
          {
            type: "LOG_POWER_PUT_DONE",
            channelId,
            channelName,
            channelImageUrl,
            results,
            claims, // 원본도 같이 보내주면 메시지 작성에 유용
            baseTotalAmount,
          },
          () => void chrome.runtime.lastError // 응답이 없어도 콘솔 경고 방지
        );
      })();

      // async 응답
      return true;
    }
  });

  async function putWithRetry(url, { retries = 2, timeout = 10000 } = {}) {
    for (let i = 0; i <= retries; i++) {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeout);
      try {
        const res = await fetch(url, {
          method: "PUT",
          signal: controller.signal,
          credentials: "include",
        });
        clearTimeout(t);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
      } catch (e) {
        clearTimeout(t);
        if (i === retries) throw e;
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 700));
      }
    }
  }

  const LOG_POWER_BASE = "https://api.chzzk.naver.com/service/v1/channels";

  async function putLogPowerClaim(channelId, claimId) {
    await putWithRetry(
      `${LOG_POWER_BASE}/${channelId}/log-power/claims/${claimId}`
    );
    return true;
  }
})(); // 즉시 실행 함수 종료

// === CHZZK BOOKMARK INJECTION ===
(function () {
  const BOOKMARK_BTN_CLASS = "chzzk-bookmark-btn";
  const ATTR_MARK = "data-chzzk-bookmark-injected";
  const DEBOUNCE_MS = 150;

  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function makeAddBookmarkSVG() {
    return `<svg class="chzzk-bookmark-icon" width="24" height="24" style="margin-right: 3px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.8203 2H7.18031C5.05031 2 3.32031 3.74 3.32031 5.86V19.95C3.32031 21.75 4.61031 22.51 6.19031 21.64L11.0703 18.93C11.5903 18.64 12.4303 18.64 12.9403 18.93L17.8203 21.64C19.4003 22.52 20.6903 21.76 20.6903 19.95V5.86C20.6803 3.74 18.9503 2 16.8203 2ZM14.5003 11.4H12.7503V13.21C12.7503 13.62 12.4103 13.96 12.0003 13.96C11.5903 13.96 11.2503 13.62 11.2503 13.21V11.4H9.50031C9.09031 11.4 8.75031 11.06 8.75031 10.65C8.75031 10.24 9.09031 9.9 9.50031 9.9H11.2503V8.21C11.2503 7.8 11.5903 7.46 12.0003 7.46C12.4103 7.46 12.7503 7.8 12.7503 8.21V9.9H14.5003C14.9103 9.9 15.2503 10.24 15.2503 10.65C15.2503 11.06 14.9103 11.4 14.5003 11.4Z" fill="#292D32"/>
</svg>
`;
  }

  function makeBookmarkingSVG() {
    return `<svg class="chzzk-bookmark-icon" width="24" height="24" style="margin-right: 3px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.8203 1.91016H7.18031C5.06031 1.91016 3.32031 3.65016 3.32031 5.77016V19.8602C3.32031 21.6602 4.61031 22.4202 6.19031 21.5502L11.0703 18.8402C11.5903 18.5502 12.4303 18.5502 12.9403 18.8402L17.8203 21.5502C19.4003 22.4302 20.6903 21.6702 20.6903 19.8602V5.77016C20.6803 3.65016 18.9503 1.91016 16.8203 1.91016ZM15.6203 9.03016L11.6203 13.0302C11.4703 13.1802 11.2803 13.2502 11.0903 13.2502C10.9003 13.2502 10.7103 13.1802 10.5603 13.0302L9.06031 11.5302C8.77031 11.2402 8.77031 10.7602 9.06031 10.4702C9.35031 10.1802 9.83031 10.1802 10.1203 10.4702L11.0903 11.4402L14.5603 7.97016C14.8503 7.68016 15.3303 7.68016 15.6203 7.97016C15.9103 8.26016 15.9103 8.74016 15.6203 9.03016Z" fill="#292D32"/>
</svg>
`;
  }

  function isFollowingChannelTab() {
    try {
      const u = new URL(location.href);
      if (!u.pathname.startsWith("/following")) return false;
      const tab = (u.searchParams.get("tab") || "").trim().toUpperCase();
      return tab === "CHANNEL";
    } catch {
      return false;
    }
  }

  function isChannelProfilePage() {
    const p = location.pathname;
    if (p.startsWith("/live/") || p.startsWith("/following")) return false;
    return /^\/[a-f0-9]{32}(?:\/[a-z]+)?$/i.test(p);
  }

  let __lastHref = location.href;

  function triggerIfUrlChanged() {
    const href = location.href;
    if (href !== __lastHref) {
      __lastHref = href;
      onRouteChange();
    }
  }

  function ensureBookmarkThemeCSS() {
    if (document.getElementById("chzzk-bookmark-theme")) return;
    const style = document.createElement("style");
    style.id = "chzzk-bookmark-theme";
    style.textContent = `
    .${BOOKMARK_BTN_CLASS} svg.chzzk-bookmark-icon { transition: filter .2s ease; }
    .theme_dark .${BOOKMARK_BTN_CLASS} svg.chzzk-bookmark-icon { filter: invert(1); }
  `;
    (document.head || document.documentElement).appendChild(style);
  }

  function setSavedState(btn) {
    if (!btn) return;
    const bookmarkingIcon = makeBookmarkingSVG();

    btn.innerHTML = `${bookmarkingIcon} 북마크 중`;
    btn.classList.add("chzzk-bookmark-saved");
  }

  function initSavedState(btn, channelId) {
    chrome.runtime.sendMessage({ type: "bookmark:has", channelId }, (res) => {
      if (res && res.ok && res.exists) setSavedState(btn);
    });
  }

  function getChannelIdFromLiveHref(href) {
    try {
      const u = new URL(href, location.origin);
      const parts = u.pathname.split("/");
      const idx = parts.indexOf("live");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    } catch (e) {}
    return null;
  }

  function getChannelIdFromHref(href) {
    try {
      const u = new URL(href, location.origin);
      const parts = u.pathname.split("/");
      if (parts[1]) return parts[1];
    } catch (e) {}
    return null;
  }

  function resolveChannelOnCard(card) {
    const liveA = card.querySelector('a[href^="/live/"]');
    if (liveA) {
      const id = getChannelIdFromLiveHref(liveA.getAttribute("href"));
      if (id) return { channelId: id, isLive: true };
    }
    const channelA =
      card.querySelector("a[class*='channel_item_wrapper__'][href^='/']") ||
      card.querySelector("a[class*='channel_item_thumbnail__'][href^='/']");
    if (channelA) {
      const id = getChannelIdFromHref(channelA.getAttribute("href"));
      if (id)
        return {
          channelId: id,
          isLive: !!card.querySelector("[class*='thumbnail_badge_live__']"),
        };
    }
    return { channelId: null, isLive: false };
  }

  function getChannelIdFromPage() {
    const m = location.pathname.match(/\/live\/([a-z0-9]+)/i);
    return m ? m[1] : null;
  }

  // 채널 프로필 상단 액션 바에 북마크 버튼 주입
  function addBookmarkButtonToChannelProfilePage() {
    const actionWrap = document.querySelector(
      "[class*='channel_profile_action__']"
    );
    if (!actionWrap || actionWrap.getAttribute(ATTR_MARK)) return;

    const channelId = getChannelIdFromHref(location.href); // /{id} 에서 id 추출
    if (!channelId) return;

    actionWrap.setAttribute(ATTR_MARK, "1");

    // 버튼 클래스는 액션바의 기존 버튼과 동일한 스타일을 최대한 복제
    const baseClass =
      "button_container__x044H button_medium__r15mw button_capsule__tU-O- button_dark__cw8hT";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = baseClass + " " + BOOKMARK_BTN_CLASS;
    btn.style.borderRadius = "17px";
    btn.style.marginRight = "5px";
    btn.innerHTML = `${makeAddBookmarkSVG()} 북마크`;

    // 기존 저장 상태 반영
    initSavedState(btn, channelId);

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      btn.disabled = true;

      // 채널 이름/이미지 추출(여러 레이아웃 대비 다중 셀렉터)
      const nameEl =
        document.querySelector(
          "[class*='channel_profile_name__'] [class*='name_text__']"
        ) ||
        document.querySelector(
          "[class*='channel_header_name__'] [class*='name_text__']"
        );
      const imageEl =
        document.querySelector("[class*='channel_profile_thumbnail__'] img") ||
        document.querySelector("[class*='channel_header_thumbnail__'] img");

      const channelName = nameEl ? nameEl.textContent.trim() : "";
      const image = imageEl ? imageEl.src : "";

      try {
        const listRes = await chrome.runtime.sendMessage({
          type: "bookmark:list",
        });
        const exists =
          Array.isArray(listRes?.bookmarks) &&
          listRes.bookmarks.some((b) => b.channelId === channelId);

        if (exists) {
          await chrome.runtime.sendMessage({
            type: "bookmark:remove",
            channelId,
          });
          btn.innerHTML = `${makeAddBookmarkSVG()} 북마크`;
          btn.classList.remove("chzzk-bookmark-saved");
        } else {
          const payload = {
            channelId,
            name: channelName,
            image,
            savedFrom: "channel_profile",
            savedAt: Date.now(),
          };
          const addRes = await chrome.runtime.sendMessage({
            type: "bookmark:add",
            payload,
          });
          btn.innerHTML =
            addRes && addRes.status === "exists"
              ? "이미 등록됨"
              : `${makeBookmarkingSVG()} 북마크 중`;
          btn.classList.add("chzzk-bookmark-saved");
        }
      } finally {
        btn.disabled = false;
      }
    });

    // 액션바 맨 앞(또는 뒤)에 삽입
    actionWrap.insertBefore(btn, actionWrap.firstElementChild);
  }

  // ---------- Live page ----------
  function addBookmarkButtonToLivePage() {
    const wrap = q("[class*='video_information_control__']");
    if (!wrap || wrap.getAttribute(ATTR_MARK)) return;
    wrap.setAttribute(ATTR_MARK, "1");

    const channelId = getChannelIdFromPage();
    if (!channelId) return;

    const btn = document.createElement("button");
    initSavedState(btn, channelId);

    const addBookmarkIcon = makeAddBookmarkSVG();

    btn.type = "button";
    btn.className =
      "button_container__ppWwB button_secondary__Q03ET button_solid__ZZe8g button_large__oOJou button_font_bold__qEQfU " +
      BOOKMARK_BTN_CLASS;
    btn.innerHTML = `${addBookmarkIcon} 북마크`;
    btn.style.borderRadius = "17px";

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const nameEl = q(
        "[class*='video_information_name__'] [class*='name_text__']"
      );
      const channelName = nameEl ? nameEl.textContent.trim() : "";
      const imgEl = q(
        "[class*='video_information_thumbnail__'] img[class*='video_information_image__']"
      );
      const image = imgEl ? imgEl.src : "";
      btn.disabled = true;

      try {
        const listRes = await chrome.runtime.sendMessage({
          type: "bookmark:list",
        });
        const exists =
          Array.isArray(listRes?.bookmarks) &&
          listRes.bookmarks.some((b) => b.channelId === channelId);

        if (exists) {
          await chrome.runtime.sendMessage({
            type: "bookmark:remove",
            channelId,
          });
          btn.innerHTML = `${makeAddBookmarkSVG()} 북마크`;
        } else {
          const payload = {
            channelId,
            name: channelName,
            image,
            savedFrom: "live",
            savedAt: Date.now(),
          };
          const addRes = await chrome.runtime.sendMessage({
            type: "bookmark:add",
            payload,
          });
          btn.innerHTML =
            addRes && addRes.status === "exists"
              ? "이미 등록됨"
              : `${makeBookmarkingSVG()} 북마크 중`;
        }
      } finally {
        btn.disabled = false;
      }
    });

    wrap.insertBefore(btn, wrap.firstElementChild);
  }

  // ---------- Following page ----------
  function injectIntoFollowingCard(card) {
    if (!card || card.__bookmarkInjected) return;

    const liveA = q('a[href^="/live/"]', card);
    const channelA =
      q("a[class*='channel_item_wrapper__'][href^='/']", card) ||
      q("a[class*='channel_item_thumbnail__'][href^='/']", card);

    const channelId = liveA
      ? getChannelIdFromLiveHref(liveA.getAttribute("href"))
      : channelA
      ? getChannelIdFromHref(channelA.getAttribute("href"))
      : null;

    if (!channelId) return;

    const control =
      q("[class*='channel_item_control__']", card) ||
      q("[class*='channel_item_follow__']", card)?.parentElement ||
      card;

    if (control.querySelector("." + BOOKMARK_BTN_CLASS)) return;

    const btn = document.createElement("button");
    initSavedState(btn, channelId);

    const addBookmarkIcon = makeAddBookmarkSVG();

    btn.type = "button";
    btn.className =
      "button_container__x044H button_medium__r15mw button_capsule__tU-O- button_dark__cw8hT " +
      BOOKMARK_BTN_CLASS;
    btn.innerHTML = `${addBookmarkIcon} 북마크`;

    btn.addEventListener("click", async (e) => {
      e.preventDefault();

      const { channelId, isLive } = resolveChannelOnCard(card); // 클릭 시점 재계산
      if (!channelId) return;

      const nameEl = card.querySelector(
        "[class*='channel_item_channel__'] [class*='name_text__']"
      );
      const imageEl = card.querySelector("img[class*='channel_item_image__']");
      const payload = {
        channelId,
        name: nameEl ? nameEl.textContent.trim() : "",
        image: imageEl ? imageEl.src : "",
        isLive: !!isLive,
        savedFrom: "following",
        savedAt: Date.now(),
      };

      btn.disabled = true;

      try {
        // 현재 북마크 존재 여부
        const res = await chrome.runtime.sendMessage({ type: "bookmark:list" });
        const exists =
          Array.isArray(res?.bookmarks) &&
          res.bookmarks.some((b) => b.channelId === channelId);

        if (exists) {
          await chrome.runtime.sendMessage({
            type: "bookmark:remove",
            channelId,
          });
          btn.innerHTML = `${makeAddBookmarkSVG()} 북마크`;
        } else {
          const addRes = await chrome.runtime.sendMessage({
            type: "bookmark:add",
            payload,
          });
          btn.innerHTML =
            addRes && addRes.status === "exists"
              ? "이미 등록됨"
              : `${makeBookmarkingSVG()} 북마크 중`;
        }
      } finally {
        btn.disabled = false;
      }
    });

    control.appendChild(btn);
    control.setAttribute(ATTR_MARK, "1");
    card.__bookmarkInjected = true;
  }

  let debounceTimer = null;
  function scanFollowingPage() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const cards = new Set();
      document
        .querySelectorAll("li[class*='component_item__']")
        .forEach((li) => {
          const card =
            li.querySelector("[class*='channel_item_container__']") || li;
          cards.add(card);
        });
      document
        .querySelectorAll("[class*='channel_item_container__']")
        .forEach((el) => cards.add(el));
      cards.forEach((card) => injectIntoFollowingCard(card));
    }, DEBOUNCE_MS);
  }

  function addGlobalNotifKillButton() {
    if (!isFollowingChannelTab()) return;

    const filter = document.querySelector(
      "[class*='navigation_component_filter__']"
    );
    if (!filter) return;

    // 이미 주입했는지 검사
    if (filter.querySelector(".chzzk-kill-all-btn")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "chzzk-kill-all-btn button_container__x044H button_medium__r15mw button_capsule__tU-O- button_dark__cw8hT";
    btn.textContent = "모든 알림 끄기";
    Object.assign(btn.style, {
      marginLeft: "5px",
      cursor: "pointer",
      padding: "12px",
    });

    btn.addEventListener("click", async () => {
      const old = btn.textContent;
      btn.disabled = true;
      btn.textContent = "끄는 중...";
      try {
        await offAllNotifications();
        btn.textContent = "완료!";
      } catch {
        btn.textContent = "실패";
      } finally {
        setTimeout(() => {
          btn.textContent = old;
          btn.disabled = false;
        }, 1500);
      }
    });

    filter.appendChild(btn);
  }

  function hookHeaderButtonOnFollowing() {
    addGlobalNotifKillButton();
    // 동적 로딩 대비 약간 재시도
    let tries = 0;
    const t = setInterval(() => {
      addGlobalNotifKillButton();
      if (++tries > 10) clearInterval(t);
    }, 300);
  }

  function cleanupInjectedUI() {
    // 버튼 제거
    document
      .querySelectorAll(".chzzk-kill-all-btn, .chzzk-bookmark-btn")
      .forEach((n) => n.remove());

    // 주입 마크 제거
    document
      .querySelectorAll("[data-chzzk-bookmark-injected]")
      .forEach((n) => n.removeAttribute("data-chzzk-bookmark-injected"));

    // 카드에 달아둔 플래그도 초기화
    document
      .querySelectorAll('[class*="channel_item_container__"]')
      .forEach((el) => {
        try {
          delete el.__bookmarkInjected;
        } catch {}
      });
  }

  function observeMutations() {
    const obs = new MutationObserver(() => {
      if (location.pathname.startsWith("/live/")) {
        addBookmarkButtonToLivePage();
      } else if (isChannelProfilePage()) {
        addBookmarkButtonToChannelProfilePage();
      } else if (isFollowingChannelTab()) {
        scanFollowingPage();
      } else {
        cleanupInjectedUI();
      }
    });
    obs.observe(document.documentElement, { subtree: true, childList: true });
  }

  function hookHistory() {
    const _push = history.pushState;
    const _replace = history.replaceState;
    history.pushState = function () {
      const ret = _push.apply(this, arguments);
      setTimeout(triggerIfUrlChanged, 0);
      return ret;
    };
    history.replaceState = function () {
      const ret = _replace.apply(this, arguments);
      setTimeout(triggerIfUrlChanged, 0);
      return ret;
    };
    window.addEventListener("popstate", triggerIfUrlChanged);

    // 혹시 프레임워크가 history를 안 쓰는 경우 대비 폴백
    setInterval(triggerIfUrlChanged, 500);
  }

  function onRouteChange() {
    if (location.pathname.startsWith("/live/")) {
      cleanupInjectedUI();
      addBookmarkButtonToLivePage();
    } else if (isChannelProfilePage()) {
      cleanupInjectedUI();
      addBookmarkButtonToChannelProfilePage();
    } else if (isFollowingChannelTab()) {
      scanFollowingPage();
      hookHeaderButtonOnFollowing();
      let tries = 0;
      const t = setInterval(() => {
        scanFollowingPage();
        if (++tries > 20) clearInterval(t);
      }, 300);
    } else {
      cleanupInjectedUI();
    }
  }

  function init() {
    if (location.hostname !== "chzzk.naver.com") return;
    ensureBookmarkThemeCSS();
    onRouteChange();
    observeMutations();
    hookHistory();
  }

  try {
    init();
  } catch (e) {
    console.warn("bookmark init error", e);
  }
})();
