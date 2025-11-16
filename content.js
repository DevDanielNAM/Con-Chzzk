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
})();

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
    btn.style.marginRight = "6px";

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

    control.insertBefore(btn, control.firstElementChild);
    control.setAttribute(ATTR_MARK, "1");
    card.__bookmarkInjected = true;
  }

  function findFollowingFilter() {
    const candidates = [
      "[class*='navigation_component_filter__']",
      ".navigation_component_filter__xnJPq",
    ];
    for (const s of candidates) {
      const el = document.querySelector(s);
      if (el) return el;
    }
    // fallback: 탭 버튼 중 하나의 부모를 찾아본다
    const tb = document.querySelector('button[role="tab"]');
    if (tb) return tb.closest("div") || tb.parentElement;
    return null;
  }

  async function addGlobalNotifKillButton() {
    if (!isFollowingChannelTab()) return;

    const filter = findFollowingFilter();
    if (!filter) {
      // 짧은 재시도 (총 5번, 100ms 간격)
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 100));
        const f2 = findFollowingFilter();
        if (f2) {
          return addGlobalNotifKillButton(); // 재귀로 정상 루틴 진행
        }
      }
      return; // 못 찾으면 포기
    }

    // 이미 주입했는지 검사
    if (filter.querySelector(".chzzk-kill-all-btn")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "chzzk-kill-all-btn button_tab_item__PmbXE button_tab_solid__3yph7 button_tab_small__ym+kK button_tab_bold__edn1k";
    btn.textContent = "모든 알림 끄기";
    Object.assign(btn.style, {
      marginLeft: "5px",
      cursor: "pointer",
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
    // 1) 즉시 한 번 시도해서 보이면 바로 추가
    addGlobalNotifKillButton();

    queueMicrotask(() => addGlobalNotifKillButton());

    let tries = 0;
    const t = setInterval(() => {
      try {
        if (isFollowingChannelTab()) addGlobalNotifKillButton();
      } catch {}
      if (++tries > 7) clearInterval(t);
    }, 100);

    // 2) 필터 컨테이너가 아직 없다면, waitForSelectorOnce로 나타나는 즉시 주입
    waitForSelectorOnce(
      "[class*='navigation_component_filter__']",
      (filter) => {
        // 필터를 찾으면 재시도 루프 대신 즉시 주입
        addGlobalNotifKillButton();
        // 이 필터(네비게이션 바)에 클릭 리스너를 부착하여 탭 이동을 즉시 감지
        // 캡처링 단계(true)에서 감지하여 사이트의 React 핸들러보다 먼저 실행
        if (!filter.__chzzk_click_hooked) {
          filter.__chzzk_click_hooked = true;
          filter.addEventListener(
            "click",
            (e) => {
              const tabButton = e.target.closest('button[role="tab"]');

              if (!tabButton) return; // 탭 버튼이 아니면 무시

              try {
                // 버튼의 'id' (ALL, LIVE, VIDEO, CHANNEL 등)를 탭 이름으로 사용
                const tab = (tabButton.id || "").trim().toUpperCase();

                // 'CHANNEL' 탭이 아닌 다른 탭을 클릭했다면,
                // history.pushState가 1-3초 늦게 호출되더라도 버튼을 즉시 제거
                if (tab !== "CHANNEL") {
                  cleanupInjectedUI();
                }
              } catch (err) {
                // URL 파싱 오류 등은 조용히 무시
              }
            },
            true // 'true' (캡처링 단계)
          );
        }
      },
      document,
      30000
    );
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
          delete el.__bookmarkObserved;
        } catch {}
      });
  }

  let livePageObserver = null;
  let profilePageObserver = null;
  let followingPageObserver = null;

  function disconnectObservers() {
    for (const o of [
      livePageObserver,
      profilePageObserver,
      followingPageObserver,
    ]) {
      try {
        o?.disconnect();
      } catch {}
    }
    livePageObserver = profilePageObserver = followingPageObserver = null;
    try {
      if (cardIO) {
        cardIO.disconnect();
        cardIO = null;
      }
    } catch {}
  }

  function waitForSelectorOnce(
    selector,
    onFound,
    root = document,
    timeout = 30000
  ) {
    const el = root.querySelector(selector);
    if (el) {
      onFound(el);
      return () => {};
    }
    const mo = new MutationObserver((muts, obs) => {
      const n = root.querySelector(selector);
      if (n) {
        obs.disconnect();
        onFound(n);
      }
    });
    mo.observe(root, { childList: true, subtree: true });
    const to = setTimeout(() => {
      mo.disconnect();
    }, timeout);
    return () => {
      clearTimeout(to);
      mo.disconnect();
    };
  }

  function observeLivePage() {
    // 1. 기존 옵저버가 있다면 연결을 해제
    disconnectObservers();

    // 2. '넓은 화면' 토글 등으로 요소가 DOM에서 제거되었다가
    //    다시 추가되는 상황을 지속적으로 감지하기 위해
    //    영구적인 MutationObserver를 생성
    livePageObserver = new MutationObserver(() => {
      // DOM에 변경이 생길 때마다 버튼 주입을 "시도"
      // addBookmarkButtonToLivePage 함수 내부에는
      // 이미 주입되었는지 확인하는 로직(ATTR_MARK)이 있으므로
      // 여러 번 호출되어도 안전
      addBookmarkButtonToLivePage();
    });

    // 3. body 전체의 변경 사항을 감시
    //    (자식 노드가 추가/제거되거나, 하위 트리에 변경이 있을 때)
    livePageObserver.observe(document.body, {
      childList: true, // 자식 노드(요소) 추가/제거 감지
      subtree: true, // body 하위의 모든 요소 감지
    });

    // 4. 옵저버가 감지하기 전,
    //    페이지 진입 시점에 즉시 한 번 실행하여 버튼을 주입
    addBookmarkButtonToLivePage();
  }

  function observeProfilePage() {
    disconnectObservers();
    waitForSelectorOnce("[class*='channel_profile_action__']", () => {
      addBookmarkButtonToChannelProfilePage();
    });
  }

  // ---- Following 페이지: 목록 변화만 관찰 + 가시 카드에만 주입 ----
  let cardIO = null;
  function ensureCardIO() {
    if (cardIO) return;
    cardIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          try {
            injectIntoFollowingCard(e.target);
          } catch {}
          cardIO.unobserve(e.target);
        });
      },
      { root: null, rootMargin: "200px 0px", threshold: 0.01 }
    );
  }

  function observeFollowingPage() {
    disconnectObservers();
    ensureCardIO();
    // 최초 DOM이 뜨면, 카드들을 관찰만 하고 즉시 주입하지 않음
    waitForSelectorOnce("ul[class*='component_list__']", (list) => {
      const scanVisible = () => {
        const cards = new Set();
        document
          .querySelectorAll("li[class*='component_item__']")
          .forEach((li) => {
            const card = li.querySelector(
              "[class*='channel_item_container__']"
            );
            if (card && !card.__bookmarkObserved) {
              card.__bookmarkObserved = true;
              cardIO.observe(card);
              try {
                injectIntoFollowingCard(card);
              } catch (e) {
                /* 무시 */
              }
              cards.add(card);
            }
          });
        document
          .querySelectorAll("[class*='channel_item_container__']")
          .forEach((el) => {
            if (!el.__bookmarkObserved) {
              el.__bookmarkObserved = true;
              cardIO.observe(el);

              try {
                injectIntoFollowingCard(el); // 즉시 주입 시도
              } catch (e) {
                /* 무시 */
              }
            }
          });
      };
      scanVisible(); // 초기 1회
      let ticking = false;
      followingPageObserver = new MutationObserver(() => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          scanVisible();
        });
      });
      followingPageObserver.observe(list, { childList: true, subtree: true });
    });
  }

  function hookHistory() {
    const _push = history.pushState;
    const _replace = history.replaceState;
    history.pushState = function () {
      const ret = _push.apply(this, arguments);
      triggerIfUrlChanged();
      return ret;
    };
    history.replaceState = function () {
      const ret = _replace.apply(this, arguments);
      triggerIfUrlChanged();
      return ret;
    };
    window.addEventListener("popstate", triggerIfUrlChanged);

    // 혹시 프레임워크가 history를 안 쓰는 경우 대비 폴백
    setInterval(triggerIfUrlChanged, 4000);
  }

  // SPA 네비게이션을 감지하는 더 견고한 옵저버
  function observeNavigation() {
    const observer = new MutationObserver(() => {
      // DOM이 변경될 때마다 URL이 바뀌었는지 확인
      triggerIfUrlChanged();
    });

    // body 전체의 자식 노드 변경(페이지 전환)을 감지
    observer.observe(document.body, {
      childList: true, // 자식 노드(페이지) 변경 감지
      subtree: true, // 하위 모든 요소 감지
    });
  }

  function onRouteChange() {
    cleanupInjectedUI();
    const path = location.pathname;
    if (path.startsWith("/live/")) {
      observeLivePage();
    } else if (isChannelProfilePage()) {
      observeProfilePage();
      const id = path.split("/")[1];
      chrome.runtime.sendMessage({
        type: "LOG_POWER_CHECK_NOW",
        channelId: id,
        allowTypes: ["FOLLOW"],
      });
    } else if (isFollowingChannelTab()) {
      hookHeaderButtonOnFollowing();
      observeFollowingPage();
    } else {
      disconnectObservers();
    }
  }

  function init() {
    if (location.hostname !== "chzzk.naver.com") return;
    ensureBookmarkThemeCSS();
    onRouteChange();
    hookHistory();
    setTimeout(observeNavigation, 1000);
  }

  try {
    init();
  } catch (e) {
    console.warn("bookmark init error", e);
  }
})();

let popupCreateRetryTimer = null;
let popupLayerEscHandler = null;

/**
 * 팝업에 필요한 스타일시트를 페이지에 주입하는 함수.
 * 중복 주입을 방지하기 위해 ID를 확인합니다.
 */
function injectPopupStyles() {
  const styleId = "chzzk-power-popup-styles";
  if (document.getElementById(styleId)) {
    return; // 이미 주입되었다면 실행하지 않음
  }

  const link = document.createElement("link");
  link.id = styleId;
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = chrome.runtime.getURL("logpower-popup.css");

  document.head.appendChild(link);
}

/**
 * 통나무 파워 보유량 팝업을 생성하고 표시하는 함수
 * @param {number} [limit=Infinity] - 표시할 채널의 최대 개수 (기본값: 전체)
 */
function showLogPowerBalancesPopup(limit = Infinity) {
  // 1. 이미 다른 팝업이 열려있으면 닫고 함수 종료
  const existPopup = document.querySelector(
    ".chzzk_power_popup_layer, .live_chatting_popup_donation_layer__sQ9nX"
  );
  if (existPopup) {
    if (existPopup.parentNode) {
      existPopup.parentNode.removeChild(existPopup);
    }
    if (popupLayerEscHandler) {
      window.removeEventListener("keydown", popupLayerEscHandler);
      popupLayerEscHandler = null;
    }
    if (popupCreateRetryTimer) {
      clearTimeout(popupCreateRetryTimer);
      popupCreateRetryTimer = null;
    }
    return;
  }

  // 2. 이전 팝업 생성 재시도 타이머가 있다면 정리
  if (popupCreateRetryTimer) {
    clearTimeout(popupCreateRetryTimer);
    popupCreateRetryTimer = null;
  }

  // 3. 팝업 생성을 시도하는 내부 함수 (DOM이 준비될 때까지 재시도)
  (function tryCreatePopup() {
    const chatContainer = document.querySelector(
      'aside[class^="live_chatting_container__"]'
    );
    // 채팅창 UI가 아직 없으면 2초 후 재시도
    if (!chatContainer) {
      popupCreateRetryTimer = setTimeout(tryCreatePopup, 2000);
      return;
    }

    injectPopupStyles();

    // --- 팝업 UI 요소 생성 ---
    const popupLayer = document.createElement("div");
    popupLayer.className = "chzzk_power_popup_layer";
    popupLayer.setAttribute("role", "dialog");

    const popupContainer = document.createElement("div");
    popupContainer.className = "chzzk_power_popup_container";
    popupContainer.setAttribute("role", "alertdialog");
    popupContainer.setAttribute("aria-modal", "true");

    const action = document.createElement("div");
    action.className = "chzzk_power_popup_action";

    const refreshBtn = document.createElement("button");
    refreshBtn.className = "chzzk_power_popup_refresh_button";
    refreshBtn.type = "button";
    refreshBtn.setAttribute("aria-label", "새로고침");
    refreshBtn.innerHTML = `<svg id="refresh-icon" xmlns="http://www.w3.org/2000/svg" height="18px" width="18px" viewBox="0 -960 960 960" fill="currentColor">
              <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"></path>
            </svg>`;
    refreshBtn.onclick = () => {
      removePopup();
      showLogPowerBalancesPopup(limit);
    };

    const closeBtn = document.createElement("button");
    closeBtn.className = "chzzk_power_popup_close_button";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "팝업 닫기");
    closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path fill="currentColor" d="M16.6 4.933A1.083 1.083 0 1 0 15.066 3.4L10 8.468 4.933 3.4A1.083 1.083 0 0 0 3.4 4.933L8.468 10 3.4 15.067A1.083 1.083 0 1 0 4.933 16.6L10 11.532l5.067 5.067a1.083 1.083 0 1 0 1.532-1.532L11.532 10l5.067-5.067Z"/></svg>`;

    const loading = document.createElement("div");
    loading.style.cssText = "padding: 32px 0; font-size: 16px;";
    loading.textContent = "LOADING...";

    action.appendChild(closeBtn);
    popupContainer.append(action, loading);
    popupLayer.appendChild(popupContainer);
    chatContainer.appendChild(popupLayer);

    // --- 팝업 닫기 핸들러 설정 ---
    function removePopup() {
      if (popupLayer.parentNode) {
        popupLayer.parentNode.removeChild(popupLayer);
      }
      if (popupLayerEscHandler) {
        window.removeEventListener("keydown", popupLayerEscHandler);
        popupLayerEscHandler = null;
      }
    }
    closeBtn.onclick = removePopup;
    popupLayerEscHandler = function (ev) {
      if (ev.key === "Escape") removePopup();
    };
    window.addEventListener("keydown", popupLayerEscHandler);

    // --- API 호출 및 데이터 렌더링 ---
    fetch("https://api.chzzk.naver.com/service/v1/log-power/balances", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        loading.remove();
        const arr = data?.content?.data || [];

        const sorted = arr.sort((a, b) => b.amount - a.amount);

        const limitedData = sorted.slice(0, limit);

        const totalPower = sorted.reduce((sum, x) => sum + x.amount, 0);
        const totalLimitedDataLogPower = limitedData.reduce(
          (sum, x) => sum + x.amount,
          0
        );

        const table = document.createElement("div");
        table.className = "chzzk_power_popup_table";
        const defaultImg =
          "https://ssl.pstatic.net/cmstatic/nng/img/img_anonymous_square_gray_opacity2x.png?type=f120_120_na";

        let limitNotice = "";
        if (limit !== Infinity && sorted.length > limit) {
          limitNotice = `<div class="logpower-limit-notice">상위 ${limit}개 채널만 표시합니다.</div>`;
        }

        table.innerHTML = `
                <div class="total-logpower">전체 통나무 파워 합계 <span><svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="live_chatting_popup_my_profile_icon_power__laD+4"><mask id="mask0_4502_4387" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16" style="mask-type: alpha;"><path d="M6.79453 2.43359C7.09254 2.43374 7.36838 2.58075 7.53476 2.82161L7.59921 2.93099L8.91692 5.56641H5.98333L5.82643 5.25326L5.06796 3.73568C4.76891 3.13737 5.20381 2.43379 5.87265 2.43359H6.79453Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M12.1484 4.43359C13.0053 4.43359 13.6561 5.0624 14.0599 5.80273C14.4754 6.5645 14.7148 7.57802 14.7148 8.66667C14.7148 9.75531 14.4754 10.7688 14.0599 11.5306C13.6561 12.2709 13.0053 12.8997 12.1484 12.8997H4C3.14314 12.8997 2.49236 12.2709 2.08854 11.5306C1.67304 10.7688 1.43359 9.75531 1.43359 8.66667C1.43359 7.57802 1.67304 6.5645 2.08854 5.80273C2.49236 5.0624 3.14314 4.43359 4 4.43359H12.1484ZM4 5.56641C3.75232 5.56641 3.40334 5.75848 3.08333 6.34505C2.77498 6.91036 2.56641 7.73027 2.56641 8.66667C2.56641 9.60306 2.77498 10.423 3.08333 10.9883C3.40334 11.5749 3.75232 11.7669 4 11.7669C4.24767 11.7669 4.59666 11.5749 4.91667 10.9883C5.22502 10.423 5.43359 9.60306 5.43359 8.66667C5.43359 7.73027 5.22502 6.91036 4.91667 6.34505C4.59666 5.75848 4.24767 5.56641 4 5.56641ZM6.52604 9.43359C6.48364 9.83162 6.40829 10.2124 6.30404 10.5664H11.6667L11.7246 10.5638C12.0104 10.5348 12.2331 10.2934 12.2331 10C12.2331 9.7066 12.0104 9.46522 11.7246 9.4362L11.6667 9.43359H6.52604ZM6.28385 6.70052C6.39253 7.05354 6.47186 7.43444 6.51823 7.83333H7.33333L7.39128 7.83073C7.67694 7.80172 7.89962 7.56022 7.89974 7.26693C7.89974 6.97353 7.67701 6.73215 7.39128 6.70312L7.33333 6.70052H6.28385ZM9.60026 6.70052C9.2873 6.70052 9.0332 6.95397 9.0332 7.26693C9.03333 7.57978 9.28738 7.83333 9.60026 7.83333H13.5228C13.4637 7.41061 13.3619 7.02765 13.2298 6.70052H9.60026Z" fill="currentColor"></path><path d="M5.43359 8.66667C5.43359 7.73027 5.22502 6.91036 4.91667 6.34505C4.59666 5.75848 4.24767 5.56641 4 5.56641C3.75232 5.56641 3.40334 5.75848 3.08333 6.34505C2.77498 6.91036 2.56641 7.73027 2.56641 8.66667C2.56641 9.60306 2.77498 10.423 3.08333 10.9883C3.40334 11.5749 3.75232 11.7669 4 11.7669C4.24767 11.7669 4.59666 11.5749 4.91667 10.9883C5.22502 10.423 5.43359 9.60306 5.43359 8.66667ZM6.56641 8.66667C6.56641 9.75531 6.32696 10.7688 5.91146 11.5306C5.50764 12.2709 4.85686 12.8997 4 12.8997C3.14314 12.8997 2.49236 12.2709 2.08854 11.5306C1.67304 10.7688 1.43359 9.75531 1.43359 8.66667C1.43359 7.57802 1.67304 6.5645 2.08854 5.80273C2.49236 5.0624 3.14314 4.43359 4 4.43359C4.85686 4.43359 5.50764 5.0624 5.91146 5.80273C6.32696 6.5645 6.56641 7.57802 6.56641 8.66667Z" fill="currentColor"></path><path d="M4.66667 8.66667C4.66667 9.40305 4.36819 10 4 10C3.63181 10 3.33333 9.40305 3.33333 8.66667C3.33333 7.93029 3.63181 7.33333 4 7.33333C4.36819 7.33333 4.66667 7.93029 4.66667 8.66667Z" fill="currentColor"></path></mask><g mask="url(#mask0_4502_4387)"><rect width="15.9998" height="16" fill="currentColor"></rect></g></svg> ${totalPower.toLocaleString()}</span></div>
                <div class="total-logpower">TOP 5 통나무 파워 합계 <span><svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="live_chatting_popup_my_profile_icon_power__laD+4"><mask id="mask0_4502_4387" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16" style="mask-type: alpha;"><path d="M6.79453 2.43359C7.09254 2.43374 7.36838 2.58075 7.53476 2.82161L7.59921 2.93099L8.91692 5.56641H5.98333L5.82643 5.25326L5.06796 3.73568C4.76891 3.13737 5.20381 2.43379 5.87265 2.43359H6.79453Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M12.1484 4.43359C13.0053 4.43359 13.6561 5.0624 14.0599 5.80273C14.4754 6.5645 14.7148 7.57802 14.7148 8.66667C14.7148 9.75531 14.4754 10.7688 14.0599 11.5306C13.6561 12.2709 13.0053 12.8997 12.1484 12.8997H4C3.14314 12.8997 2.49236 12.2709 2.08854 11.5306C1.67304 10.7688 1.43359 9.75531 1.43359 8.66667C1.43359 7.57802 1.67304 6.5645 2.08854 5.80273C2.49236 5.0624 3.14314 4.43359 4 4.43359H12.1484ZM4 5.56641C3.75232 5.56641 3.40334 5.75848 3.08333 6.34505C2.77498 6.91036 2.56641 7.73027 2.56641 8.66667C2.56641 9.60306 2.77498 10.423 3.08333 10.9883C3.40334 11.5749 3.75232 11.7669 4 11.7669C4.24767 11.7669 4.59666 11.5749 4.91667 10.9883C5.22502 10.423 5.43359 9.60306 5.43359 8.66667C5.43359 7.73027 5.22502 6.91036 4.91667 6.34505C4.59666 5.75848 4.24767 5.56641 4 5.56641ZM6.52604 9.43359C6.48364 9.83162 6.40829 10.2124 6.30404 10.5664H11.6667L11.7246 10.5638C12.0104 10.5348 12.2331 10.2934 12.2331 10C12.2331 9.7066 12.0104 9.46522 11.7246 9.4362L11.6667 9.43359H6.52604ZM6.28385 6.70052C6.39253 7.05354 6.47186 7.43444 6.51823 7.83333H7.33333L7.39128 7.83073C7.67694 7.80172 7.89962 7.56022 7.89974 7.26693C7.89974 6.97353 7.67701 6.73215 7.39128 6.70312L7.33333 6.70052H6.28385ZM9.60026 6.70052C9.2873 6.70052 9.0332 6.95397 9.0332 7.26693C9.03333 7.57978 9.28738 7.83333 9.60026 7.83333H13.5228C13.4637 7.41061 13.3619 7.02765 13.2298 6.70052H9.60026Z" fill="currentColor"></path><path d="M5.43359 8.66667C5.43359 7.73027 5.22502 6.91036 4.91667 6.34505C4.59666 5.75848 4.24767 5.56641 4 5.56641C3.75232 5.56641 3.40334 5.75848 3.08333 6.34505C2.77498 6.91036 2.56641 7.73027 2.56641 8.66667C2.56641 9.60306 2.77498 10.423 3.08333 10.9883C3.40334 11.5749 3.75232 11.7669 4 11.7669C4.24767 11.7669 4.59666 11.5749 4.91667 10.9883C5.22502 10.423 5.43359 9.60306 5.43359 8.66667ZM6.56641 8.66667C6.56641 9.75531 6.32696 10.7688 5.91146 11.5306C5.50764 12.2709 4.85686 12.8997 4 12.8997C3.14314 12.8997 2.49236 12.2709 2.08854 11.5306C1.67304 10.7688 1.43359 9.75531 1.43359 8.66667C1.43359 7.57802 1.67304 6.5645 2.08854 5.80273C2.49236 5.0624 3.14314 4.43359 4 4.43359C4.85686 4.43359 5.50764 5.0624 5.91146 5.80273C6.32696 6.5645 6.56641 7.57802 6.56641 8.66667Z" fill="currentColor"></path><path d="M4.66667 8.66667C4.66667 9.40305 4.36819 10 4 10C3.63181 10 3.33333 9.40305 3.33333 8.66667C3.33333 7.93029 3.63181 7.33333 4 7.33333C4.36819 7.33333 4.66667 7.93029 4.66667 8.66667Z" fill="currentColor"></path></mask><g mask="url(#mask0_4502_4387)"><rect width="15.9998" height="16" fill="currentColor"></rect></g></svg> ${totalLimitedDataLogPower.toLocaleString()}</span></div>
                <div class="channel-logpower"><a href="https://game.naver.com/profile#channel_power" target="_blank">채널별 통나무 파워</a></div>
                ${limitNotice}
                <div class="logpower-info">100 파워 이상 보유한 채널만 표시합니다.<br>비활성화된 채널은 회색으로 표시됩니다.</div>
                <div class="channel-logpower-table">
                    ${limitedData
                      .map(
                        (x, i) => `
                        <div class="logpower-row">
                            <div>
                                <span style="color:${
                                  x.active
                                    ? "var(--Content-Brand-Strong)"
                                    : "#666"
                                }">${i + 1}</span>
                                <a href="https://chzzk.naver.com/${
                                  x.channelId
                                }" target="_blank" class="logpower-channel-link">
                                <img src="${
                                  x.channelImageUrl || defaultImg
                                }" alt="${
                          x.channelName
                        }-logpower" style="opacity:${x.active ? "1" : "0.5"};">
                                <span style="color:${
                                  x.active ? "inherit" : "#666"
                                };" title="${x.channelName}">
                                    ${x.channelName}
                                    ${
                                      x.verifiedMark
                                        ? `<img src='https://ssl.pstatic.net/static/nng/glive/resource/p/static/media/icon_official.a53d1555f8f4796d7862.png' alt='인증' style='width:16px;height:16px;vertical-align:middle;margin-left:2px;'>`
                                        : ""
                                    }
                                </span>
                                </a>
                            </div>
                            <span style="color:${
                              x.active ? "inherit" : "#666"
                            };">${x.amount.toLocaleString()}</span>
                        </div>
                    `
                      )
                      .join("")}
                </div>`;
        table.querySelector(".channel-logpower").appendChild(refreshBtn);
        popupContainer.appendChild(table);
      })
      .catch((err) => {
        loading.remove();
        const errDiv = document.createElement("div");
        errDiv.className = "logpower-error";
        errDiv.textContent = "API 요청 실패: " + err;
        popupContainer.appendChild(errDiv);
      });

    // 성공적으로 생성되었으므로 재시도 타이머 해제
    if (popupCreateRetryTimer) {
      clearTimeout(popupCreateRetryTimer);
      popupCreateRetryTimer = null;
    }
  })();
}

// === LIVE PAGE: 현재 채널 통나무 파워 뱃지 주입 ===
(() => {
  const CONTAINER_SEL = "[class*=live_chatting_input_donation__]";
  const BADGE_ID = "conchzzk-live-logpower";
  let mo = null;
  let isConChzzkInsertion = false;
  let cachedAmount = null;
  let lastFetchedAt = 0;
  let lastRenderedHref = null; // URL 변경 감지를 위해 마지막으로 렌더링된 URL 저장
  let lastHrefForPolling = location.href;

  const KR = (n) => (Number(n) || 0).toLocaleString("ko-KR");
  const now = () => Date.now();
  const extractChannelId = () => {
    const m = location.href.match(/\/live\/([a-f0-9]{32})/i);
    return m ? m[1] : null;
  };

  const DISP_KEY = "isLogPowerDisplayPaused";
  let displayPaused = false;

  function removeBadge() {
    const b = document.getElementById(BADGE_ID);
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  async function fetchChannelLogPower() {
    // 60초 캐시 + URL이 동일할 때만 캐시 사용
    if (
      cachedAmount != null &&
      now() - lastFetchedAt < 60_000 &&
      location.href === lastRenderedHref
    ) {
      return cachedAmount;
    }

    const channelId = extractChannelId();
    if (!channelId) return null;

    try {
      const res = await chrome.runtime
        .sendMessage({ type: "GET_CHANNEL_LOG_POWER", channelId })
        .catch(() => null);

      if (!res?.success) return null;

      const amt = Number(res.content?.amount) || 0;
      cachedAmount = amt;
      lastFetchedAt = now();
      lastRenderedHref = location.href; // 캐시와 함께 현재 URL 저장
      return amt;
    } catch (error) {
      if (error.message.includes("Extension context invalidated")) {
        console.log(
          "확장 프로그램이 업데이트되어 이전 content script의 활동을 중지합니다. 페이지를 새로고침하세요."
        );
      }
      return null;
    }
  }

  function applyTooltip() {
    const bageBtn = document.getElementById(BADGE_ID);
    if (!bageBtn) {
      return;
    }

    // 1. 이미 툴팁이 내부에 추가되었는지 확인하여 중복 실행을 방지
    if (bageBtn.querySelector(".tooltip-text")) {
      return;
    }

    // 2. 툴팁 텍스트를 담을 span 생성
    const tooltipText = document.createElement("span");
    tooltipText.className = "tooltip-text";
    tooltipText.textContent = "통나무 파워";

    // 3. 툴팁 wrapper 역할을 할 클래스를 버튼 자체에 부여
    bageBtn.classList.add("logpower-tooltip");

    // 4. 툴팁 텍스트를 버튼의 자식으로 추가
    bageBtn.appendChild(tooltipText);
  }

  function upsertBadge(parentEl) {
    let badge = document.getElementById(BADGE_ID);
    const needsInsert =
      !badge ||
      !badge.isConnected ||
      parentEl.lastElementChild?.id !== BADGE_ID;

    if (needsInsert) {
      isConChzzkInsertion = true;
      badge = document.createElement("span");
      badge.id = BADGE_ID;

      badge.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="live_chatting_popup_my_profile_icon_power__laD+4"><mask id="mask0_4502_4387" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16" style="mask-type: alpha;"><path d="M6.79453 2.43359C7.09254 2.43374 7.36838 2.58075 7.53476 2.82161L7.59921 2.93099L8.91692 5.56641H5.98333L5.82643 5.25326L5.06796 3.73568C4.76891 3.13737 5.20381 2.43379 5.87265 2.43359H6.79453Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M12.1484 4.43359C13.0053 4.43359 13.6561 5.0624 14.0599 5.80273C14.4754 6.5645 14.7148 7.57802 14.7148 8.66667C14.7148 9.75531 14.4754 10.7688 14.0599 11.5306C13.6561 12.2709 13.0053 12.8997 12.1484 12.8997H4C3.14314 12.8997 2.49236 12.2709 2.08854 11.5306C1.67304 10.7688 1.43359 9.75531 1.43359 8.66667C1.43359 7.57802 1.67304 6.5645 2.08854 5.80273C2.49236 5.0624 3.14314 4.43359 4 4.43359H12.1484ZM4 5.56641C3.75232 5.56641 3.40334 5.75848 3.08333 6.34505C2.77498 6.91036 2.56641 7.73027 2.56641 8.66667C2.56641 9.60306 2.77498 10.423 3.08333 10.9883C3.40334 11.5749 3.75232 11.7669 4 11.7669C4.24767 11.7669 4.59666 11.5749 4.91667 10.9883C5.22502 10.423 5.43359 9.60306 5.43359 8.66667C5.43359 7.73027 5.22502 6.91036 4.91667 6.34505C4.59666 5.75848 4.24767 5.56641 4 5.56641ZM6.52604 9.43359C6.48364 9.83162 6.40829 10.2124 6.30404 10.5664H11.6667L11.7246 10.5638C12.0104 10.5348 12.2331 10.2934 12.2331 10C12.2331 9.7066 12.0104 9.46522 11.7246 9.4362L11.6667 9.43359H6.52604ZM6.28385 6.70052C6.39253 7.05354 6.47186 7.43444 6.51823 7.83333H7.33333L7.39128 7.83073C7.67694 7.80172 7.89962 7.56022 7.89974 7.26693C7.89974 6.97353 7.67701 6.73215 7.39128 6.70312L7.33333 6.70052H6.28385ZM9.60026 6.70052C9.2873 6.70052 9.0332 6.95397 9.0332 7.26693C9.03333 7.57978 9.28738 7.83333 9.60026 7.83333H13.5228C13.4637 7.41061 13.3619 7.02765 13.2298 6.70052H9.60026Z" fill="currentColor"></path><path d="M5.43359 8.66667C5.43359 7.73027 5.22502 6.91036 4.91667 6.34505C4.59666 5.75848 4.24767 5.56641 4 5.56641C3.75232 5.56641 3.40334 5.75848 3.08333 6.34505C2.77498 6.91036 2.56641 7.73027 2.56641 8.66667C2.56641 9.60306 2.77498 10.423 3.08333 10.9883C3.40334 11.5749 3.75232 11.7669 4 11.7669C4.24767 11.7669 4.59666 11.5749 4.91667 10.9883C5.22502 10.423 5.43359 9.60306 5.43359 8.66667ZM6.56641 8.66667C6.56641 9.75531 6.32696 10.7688 5.91146 11.5306C5.50764 12.2709 4.85686 12.8997 4 12.8997C3.14314 12.8997 2.49236 12.2709 2.08854 11.5306C1.67304 10.7688 1.43359 9.75531 1.43359 8.66667C1.43359 7.57802 1.67304 6.5645 2.08854 5.80273C2.49236 5.0624 3.14314 4.43359 4 4.43359C4.85686 4.43359 5.50764 5.0624 5.91146 5.80273C6.32696 6.5645 6.56641 7.57802 6.56641 8.66667Z" fill="currentColor"></path><path d="M4.66667 8.66667C4.66667 9.40305 4.36819 10 4 10C3.63181 10 3.33333 9.40305 3.33333 8.66667C3.33333 7.93029 3.63181 7.33333 4 7.33333C4.36819 7.33333 4.66667 7.93029 4.66667 8.66667Z" fill="currentColor"></path></mask><g mask="url(#mask0_4502_4387)"><rect width="15.9998" height="16" fill="currentColor"></rect></g></svg> <b class="conchzzk-logpower-text" style="font-size:12px">-</b>';

      badge.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();

        chrome.storage.local.get({ logpowerBadgeAction: "popup" }, (data) => {
          const action = data.logpowerBadgeAction;

          switch (action) {
            case "popup":
              showLogPowerBalancesPopup(5); // 5개만 보여주는 함수 호출
              break;
            case "navigate":
              // 통나무 파워 페이지로 이동
              window.open(
                "https://game.naver.com/profile#channel_power",
                "_blank"
              );
              break;
            case "none":
            default:
              // 아무것도 하지 않음
              break;
          }
        });
      };

      parentEl.parentElement.style.flexWrap = "wrap";
      parentEl.style.flexWrap = "wrap";
      parentEl.appendChild(badge);
      queueMicrotask(() => (isConChzzkInsertion = false));
    }
    return badge;
  }

  async function render() {
    if (displayPaused) {
      // 표시 끔이면 배지 제거 후 종료
      removeBadge();
      return;
    }

    // 라이브 페이지가 아니면 실행하지 않음
    if (!/\/live\/[a-f0-9]{32}/i.test(location.href)) {
      return;
    }

    const host = document.querySelector(CONTAINER_SEL);
    if (!host) return;

    const badge = upsertBadge(host);
    const amt = await fetchChannelLogPower();

    if (amt != null) {
      const txt = KR(amt);
      const el = badge.querySelector(".conchzzk-logpower-text");
      if (el && el.textContent !== txt) el.textContent = txt;
    }
    applyTooltip();
  }

  function ensureObserver() {
    if (mo) return;
    if (displayPaused) return;

    mo = new MutationObserver(() => {
      if (isConChzzkInsertion) return;
      // 렌더 함수 내에서 URL 체크를 하므로, 여기서는 렌더만 호출
      render();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  // URL 변경을 감지하고 뱃지를 다시 렌더링하는 함수
  function handleNavigation() {
    // 라이브 페이지인 경우에만 옵저버를 활성화하고 렌더링
    if (/\/live\/[a-f0-9]{32}/i.test(location.href)) {
      ensureObserver();
      render();
    }
  }

  chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
    if (request?.type !== "CHANNEL_LOG_POWER_UPDATED") return;

    // 현재 탭이 보고 있는 채널과 일치할 때만 동작
    const here = extractChannelId();
    if (!here || here !== request.channelId) return;

    // 1) 캐시 무효화
    cachedAmount = null;
    lastFetchedAt = 0;
    lastRenderedHref = null;

    // 2) 즉시 UI에 새 값을 반영 → 체감상 "바로 반영"
    const host = document.querySelector(CONTAINER_SEL);
    if (host) {
      const badge = upsertBadge(host);
      const el = badge.querySelector(".conchzzk-logpower-text");
      if (el && typeof request.newAmount === "number") {
        el.textContent = (request.newAmount || 0).toLocaleString("ko-KR");
      }
    }

    // 3) 서버 반영이 느릴 수 있으니 재검증 렌더(즉시 + 약간 딜레이 둘 다 권장)
    render(); // 한번 즉시 시도
    setTimeout(render, 1200); // 잠시 후 다시(최종 일치 보정)
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes[DISP_KEY]) return;
    displayPaused = !!changes[DISP_KEY].newValue;

    if (displayPaused) {
      if (mo) {
        mo.disconnect();
        mo = null;
      }
      removeBadge();
    } else {
      ensureObserver();
      render();
    }
  });

  // 스크립트 초기화 함수
  function init() {
    chrome.storage.local.get({ [DISP_KEY]: false }, (data) => {
      displayPaused = !!data[DISP_KEY];
      if (displayPaused) {
        if (mo) {
          mo.disconnect();
          mo = null;
        }
        removeBadge();
      } else {
        ensureObserver();
        render();
      }
    });

    // SPA 네비게이션 감지 로직
    const originalPushState = history.pushState;
    history.pushState = function () {
      originalPushState.apply(this, arguments);
      setTimeout(handleNavigation, 0);
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function () {
      originalReplaceState.apply(this, arguments);
      setTimeout(handleNavigation, 0);
    };

    window.addEventListener("popstate", handleNavigation);

    // URL 변경을 놓치지 않기 위한 폴백(주기적인 체크)
    setInterval(() => {
      if (location.href !== lastHrefForPolling) {
        lastHrefForPolling = location.href;
        handleNavigation();
      }
    }, 500);

    // 탭이 다시 활성화될 때 렌더링
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        handleNavigation();
      }
    });

    // 초기 실행
    handleNavigation();
  }

  init(); // 즉시 초기화 함수 실행
})();

// === 통나무 파워 버튼 자동 감지/처리 ===
(function setupAutoPowerClaim() {
  // 라이브 페이지 여부
  function isLivePage() {
    return location.pathname.startsWith("/live/");
  }

  // 현재 URL에서 channelId 추출
  function getChannelIdFromUrl() {
    const m = location.pathname.match(/\/live\/([a-f0-9]{32})/i);
    return m ? m[1] : null;
  }

  let lastHandledAt = 0;

  // [class*=live_chatting_power_button__]가 보이면:
  async function clickPowerButtonIfExists() {
    if (!isLivePage()) return;

    const btn = document.querySelector("[class*=live_chatting_power_button__]");
    if (!btn || btn.__conchzzkHandled) return;

    // 과열 방지(스팸 클릭/요청 방지)
    const now = Date.now();
    if (now - lastHandledAt < 5000) return;
    lastHandledAt = now;
    btn.__conchzzkHandled = true;

    const channelId = getChannelIdFromUrl();
    if (channelId) {
      // background에게 “이 채널의 claims를 지금 확인해 달라” 요청
      try {
        chrome.runtime.sendMessage(
          { type: "LOG_POWER_CHECK_NOW", channelId },
          () => void chrome.runtime.lastError // 응답 에러 무시
        );
      } catch (e) {
        // 확장 업데이트 직후 고아 컨텍스트일 때 발생
        console.warn("[LOG_POWER_CHECK_NOW] dropped:", String(e?.message || e));
      }
    }

    try {
      btn.parentElement.style.display = "none";
    } catch (_) {}

    // 쿨다운 후 다시 처리 가능
    setTimeout(() => {
      btn.__conchzzkHandled = false;
    }, 5000);
  }

  let powerMo = null;
  let powerPollInterval = null;

  function startPowerObserver() {
    if (powerMo || document.hidden) return;

    // 1. 기존 인터벌이 있다면 정리
    if (powerPollInterval) clearInterval(powerPollInterval);
    // 2. 5초마다 clickPowerButtonIfExists 함수를 강제로 호출
    powerPollInterval = setInterval(clickPowerButtonIfExists, 5000);

    const root =
      document.querySelector("#aside-chatting") ||
      document.querySelector("[class*=live_chatting_input_area__]") ||
      document.body;

    powerMo = new MutationObserver(() => {
      if (document.hidden) return;
      const btn = document.querySelector(
        "[class*=live_chatting_power_button__]"
      );
      if (btn) clickPowerButtonIfExists();
    });
    powerMo.observe(root, { childList: true, subtree: true });
  }
  function stopPowerObserver() {
    // 1. 인터벌 타이머 정리
    if (powerPollInterval) {
      clearInterval(powerPollInterval);
      powerPollInterval = null;
    }

    // 2. 기존 옵저버 정리
    if (powerMo) {
      powerMo.disconnect();
      powerMo = null;
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopPowerObserver();
    else startPowerObserver();
  });
  startPowerObserver();
})();

// 1) 하루 1회 Opening 스냅샷
async function snapshotDailyOpeningOnce() {
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const storageKey = `logpower_open_${todayKey}`;

  const got = await chrome.storage.local.get(storageKey);
  if (got[storageKey]) return; // 이미 저장됨

  // balances 호출
  const res = await fetch(
    "https://api.chzzk.naver.com/service/v1/log-power/balances",
    { credentials: "include" }
  );
  const json = await res.json();
  const arr = json?.content?.data || [];

  // channelId -> {amount, name, imageUrl, verifiedMark}
  const openMap = Object.fromEntries(
    arr.map((x) => [
      x.channelId,
      {
        amount: Number(x.amount) || 0,
        name: x.channelName || "알 수 없음",
        imageUrl: x.channelImageUrl || "icon_128.png",
        verifiedMark: !!x.verifiedMark,
      },
    ])
  );

  await chrome.storage.local.set({
    [storageKey]: { ts: Date.now(), map: openMap },
  });
}

async function ensureTodayOpeningSnapshot() {
  const todayKey = new Date().toISOString().slice(0, 10);
  const storageKey = `logpower_open_${todayKey}`;
  const got = await chrome.storage.local.get(storageKey);
  if (got[storageKey]) return true;
  try {
    await snapshotDailyOpeningOnce(); // 기존 함수 호출
    return true;
  } catch (_) {
    return false;
  }
}

// 페이지 상태와 무관하게 즉시 한 번 시도
ensureTodayOpeningSnapshot();

// 아직 문서가 로딩 중이면 DOMContentLoaded 때도 한 번 더
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      ensureTodayOpeningSnapshot();
    },
    { once: true }
  );
}

// 성공할 때까지 1분마다 재시도
const iv = setInterval(async () => {
  if (await ensureTodayOpeningSnapshot()) clearInterval(iv);
}, 60_000);
