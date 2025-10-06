(() => {
  const TARGET_HASH = "#channel_power";
  const TOTAL_ID = "cheemo-total-power";
  const TITLE_SELECTOR =
    "[class*=channel_power_wrapper__] > strong[class*=channel_power_title__], strong[class*=channel_power_title__]";

  let isRendering = false;
  let cachedTotal = null; // balances 총합 캐시
  let triedOnce = false; // 초기 폴링 수행 여부
  let mo = null; // MutationObserver 인스턴스
  let isOurInsertion = false; // 뱃지 삽입할 때 발생하는 childList 변이 무시용

  function formatKR(n) {
    return (n || 0).toLocaleString("ko-KR");
  }

  async function fetchTotal() {
    if (cachedTotal != null) return cachedTotal;
    const res = await chrome.runtime
      .sendMessage({ type: "GET_LOG_POWER_BALANCES" })
      .catch((e) => ({ success: false, error: String(e) }));

    if (!res?.success) throw new Error(res?.error || "balances fetch failed");
    const list = res.data?.content?.data || [];
    cachedTotal = list.reduce((acc, it) => acc + (Number(it?.amount) || 0), 0);
    return cachedTotal;
  }

  function upsertBadge(titleEl) {
    let badge = document.getElementById(TOTAL_ID);
    const needsInsert =
      !badge ||
      !badge.isConnected ||
      titleEl.nextElementSibling?.id !== TOTAL_ID;

    if (needsInsert) {
      isOurInsertion = true; // 이 삽입으로 인한 childList 변이는 무시
      badge = document.createElement("span");
      badge.id = TOTAL_ID;
      badge.style.marginLeft = "5px";
      badge.style.fontWeight = "700";
      badge.style.fontSize = "0.95em";
      badge.style.opacity = "0.9";
      titleEl.insertAdjacentElement("afterend", badge);
      // 마이크로태스크 이후에만 감시 재개
      queueMicrotask(() => (isOurInsertion = false));
    }
    return badge;
  }

  async function render() {
    if (isRendering) return;
    if (location.hash !== TARGET_HASH) return;

    const titleEl = document.querySelector(TITLE_SELECTOR);
    if (!titleEl) return;

    isRendering = true;
    try {
      const badge = upsertBadge(titleEl);
      if (!badge.textContent) badge.textContent = " (합계 계산 중…)";

      const total = await fetchTotal().catch(() => null);
      const text =
        total == null
          ? " (합계 계산 실패)"
          : ` (통나무 파워 합계 ${formatKR(total)})`;
      if (badge.textContent !== text) badge.textContent = text;
    } finally {
      isRendering = false;
    }
  }

  function ensureObserver() {
    if (mo) return;
    // SPA가 섹션을 통째로 교체하므로 body 기준으로 childList만 관찰
    mo = new MutationObserver((records) => {
      if (isOurInsertion) return; // 삽입으로 생긴 변이는 무시
      if (location.hash !== TARGET_HASH) return;

      // 섹션/타이틀이 갈렸거나, 뱃지가 떨어졌으면 재렌더
      const titleEl = document.querySelector(TITLE_SELECTOR);
      const badge = document.getElementById(TOTAL_ID);
      if (
        !titleEl ||
        !badge ||
        !badge.isConnected ||
        titleEl.nextElementSibling?.id !== TOTAL_ID
      ) {
        render();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function bootTryRender() {
    // 첫 진입/탭 전환 직후 DOM이 늦게 뜰 수 있으니 짧게만 폴링 (최대 3초)
    const start = Date.now();
    const iv = setInterval(() => {
      if (location.hash !== TARGET_HASH) return;
      render();
      if (document.getElementById(TOTAL_ID)) clearInterval(iv);
      if (Date.now() - start > 3000) clearInterval(iv);
    }, 250);
  }

  function tryRenderOnce() {
    if (location.hash === TARGET_HASH) {
      ensureObserver();
      render();
      if (!triedOnce) {
        triedOnce = true;
        bootTryRender();
      }
    }
  }

  // 해시가 목표 섹션으로 "진입"했을 때만 리셋 + 렌더
  window.addEventListener("hashchange", () => {
    if (location.hash === TARGET_HASH) {
      // 필요 시 새 합계를 원하면 아래 주석 해제 (기본은 캐시 재사용)
      cachedTotal = null;
      triedOnce = false;
      tryRenderOnce();
    }
  });

  // 탭 전환 등으로 다시 돌아왔을 때 보이지 않으면 재시도
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tryRenderOnce();
  });

  // 초기 1회
  tryRenderOnce();
})();
