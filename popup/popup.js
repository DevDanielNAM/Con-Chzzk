const HISTORY_LIMIT = 150;
const GET_USER_STATUS_API =
  "https://comm-api.game.naver.com/nng_main/v1/user/getUserStatus";
let currentFilter = "ALL";
let timeUpdaterInterval = null; // 인터벌 ID를 저장할 변수

// *** 스토리지 변경 감시자 ***
// chrome.storage.local에 있는 데이터가 변경될 때마다 이 함수가 자동으로 실행
chrome.storage.onChanged.addListener((changes, namespace) => {
  // 변경된 데이터 중에 'notificationHistory'가 있는지,
  // 그리고 'local' 스토리지에서 발생한 변경인지 확인
  if (namespace === "local" && changes.notificationHistory) {
    // 알림 목록을 다시 그리는 함수를 호출하여 화면을 업데이트
    renderNotificationCenter();
  }
});

// *** 페이지에 표시된 모든 시간 텍스트를 업데이트하는 함수 ***
function updateAllTimestamps() {
  const timeElements = document.querySelectorAll(".time-ago");
  timeElements.forEach((element) => {
    const timestamp = element.dataset.timestamp;
    if (timestamp) {
      element.textContent = formatTimeAgo(timestamp);
    }
  });
}

// 팝업이 열릴 때마다 모든 상태를 확인하고 UI를 렌더링
document.addEventListener("DOMContentLoaded", async () => {
  checkLoginStatus();
  initializeAllToggles();
  setupNotificationChecker();
  initializeDisplayLimitSettings();
  await renderNotificationCenter();

  chrome.runtime.sendMessage({ type: "UPDATE_BADGE" });

  // *** 1분마다 시간 업데이트 시작 ***
  // 이전에 실행되던 인터벌이 있다면 중지 (안전장치)
  if (timeUpdaterInterval) {
    clearInterval(timeUpdaterInterval);
  }
  // 1분(60000ms)마다 updateAllTimestamps 함수를 실행
  timeUpdaterInterval = setInterval(updateAllTimestamps, 60000);
});

// *** 팝업이 닫힐 때 인터벌을 정리하여 불필요한 리소스 사용 방지 ***
window.addEventListener("unload", () => {
  if (timeUpdaterInterval) {
    clearInterval(timeUpdaterInterval);
  }
});

/**
 * 1. 치지직 로그인 상태를 확인하고 UI를 업데이트하는 함수
 */
async function checkLoginStatus() {
  // --- 캐시된 데이터로 즉시 UI 렌더링 ---
  const { cachedLoginStatus } = await chrome.storage.session.get(
    "cachedLoginStatus"
  );
  if (cachedLoginStatus) {
    updateLoginUI(
      cachedLoginStatus.isLoggedIn,
      cachedLoginStatus.nickname,
      cachedLoginStatus.profileImageUrl
    );
  }

  // --- API를 호출하여 최신 정보로 다시 렌더링  ---
  // 캐시와 실제 상태가 다를 경우를 대비한 최종 동기화
  try {
    const response = await fetch(GET_USER_STATUS_API);
    const data = await response.json();
    const isLoggedIn = data.code === 200 && data.content?.userIdHash;
    updateLoginUI(
      isLoggedIn,
      data.content?.nickname,
      data.content?.profileImageUrl
    );
  } catch (error) {
    // 네트워크 오류 시 로그아웃 상태로 표시
    updateLoginUI(false);
  }

  // 로그인 버튼 이벤트
  const loginButton = document.getElementById("login-button");
  if (loginButton) {
    loginButton.addEventListener("click", () => {
      chrome.tabs.create({
        url: "https://nid.naver.com/nidlogin.login?url=https%3A%2F%2Fchzzk.naver.com%2F",
      });
    });
  }

  const notificationCheckWrapper = document.getElementById(
    "notification-check-wrapper"
  );
  const settingsWrapper = document.getElementById("settings-wrapper");

  const testBtn = document.getElementById("test-btn");
  if (testBtn) {
    testBtn.addEventListener("click", () => {
      notificationCheckWrapper.style.display = "flex";
    });
  }

  const closeBtn = document.querySelector(".close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      notificationCheckWrapper.style.display = "none";
    });
  }

  const settingsBtn = document.getElementById("settings-btn");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      settingsWrapper.style.display = "flex";
    });
  }

  const closeSettingsBtn = document.querySelector(".close-settings-btn");
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener("click", () => {
      settingsWrapper.style.display = "none";
    });
  }
}

/**
 * 로그인 UI를 업데이트하는 재사용 가능한 함수
 */
function updateLoginUI(isLoggedIn, nickname = "사용자", profileImageUrl = "") {
  const loginBox = document.getElementById("status-login");
  const logoutBox = document.getElementById("status-logout");
  const loginIdSpan = document.getElementById("login-id");
  const loginProfile = document.getElementById("login-profile");

  const testBtn = document.getElementById("test-btn");

  const controlWrapper = document.getElementById("control-wrapper");

  controlWrapper.classList.add("hidden");
  testBtn.classList.add("hidden");

  if (isLoggedIn) {
    // 로그인 상태
    let userId = nickname || "사용자";
    if (/[ㄱ-ㅎ가-힣]/.test(userId)) {
      userId = userId.length > 11 ? userId.substring(0, 11) + "..." : userId;
    } else {
      userId = userId.length > 13 ? userId.substring(0, 13) + "..." : userId;
    }

    loginIdSpan.textContent = userId;
    loginIdSpan.title = nickname;

    loginProfile.setAttribute("src", profileImageUrl);
    loginProfile.style.width = "30px";

    loginBox.style.display = "flex";
    logoutBox.style.display = "none";

    controlWrapper.classList.remove("hidden");
    testBtn.classList.remove("hidden");
    testBtn.style.display = "inline";
  } else {
    // 로그아웃 상태 (401 등)
    logoutBox.style.display = "flex";
    loginBox.style.display = "none";
    controlWrapper.classList.add("hidden");
    testBtn.classList.add("hidden");
  }
}

// --- 모든 설정 토글을 초기화하고 이벤트를 연결하는 메인 함수 ---
function initializeAllToggles() {
  // 1. 관리할 모든 설정을 배열로 정의합니다.
  const settings = [
    { toggleId: "pause-toggle", storageKey: "isPaused" },
    { toggleId: "live-pause-toggle", storageKey: "isLivePaused" },
    { toggleId: "category-pause-toggle", storageKey: "isCategoryPaused" },
    { toggleId: "live-title-pause-toggle", storageKey: "isLiveTitlePaused" },
    { toggleId: "watch-party-pause-toggle", storageKey: "isWatchPartyPaused" },
    { toggleId: "drops-pause-toggle", storageKey: "isDropsPaused" },
    { toggleId: "restrict-pause-toggle", storageKey: "isRestrictPaused" },
    { toggleId: "video-pause-toggle", storageKey: "isVideoPaused" },
    { toggleId: "community-pause-toggle", storageKey: "isCommunityPaused" },
    { toggleId: "chzzk-lounge-pause-toggle", storageKey: "isLoungePaused" },
    { toggleId: "chzzk-banner-pause-toggle", storageKey: "isBannerPaused" },
    { toggleId: "live-keep-pause-toggle", storageKey: "isLiveKeepPaused" },
    {
      toggleId: "category-keep-pause-toggle",
      storageKey: "isCategoryKeepPaused",
    },
    {
      toggleId: "live-title-keep-pause-toggle",
      storageKey: "isLiveTitleKeepPaused",
    },
    {
      toggleId: "watch-party-keep-pause-toggle",
      storageKey: "isWatchPartyKeepPaused",
    },
    { toggleId: "drops-keep-pause-toggle", storageKey: "isDropsKeepPaused" },
    {
      toggleId: "restrict-keep-pause-toggle",
      storageKey: "isRestrictKeepPaused",
    },
    { toggleId: "video-keep-pause-toggle", storageKey: "isVideoKeepPaused" },
    {
      toggleId: "community-keep-pause-toggle",
      storageKey: "isCommunityKeepPaused",
    },
    {
      toggleId: "chzzk-lounge-keep-pause-toggle",
      storageKey: "isLoungeKeepPaused",
    },
    {
      toggleId: "chzzk-banner-keep-pause-toggle",
      storageKey: "isBannerKeepPaused",
    },
  ];

  // 2. 배열을 순회하며 각 설정에 대해 토글을 설정합니다.
  settings.forEach((setting) => {
    setupToggle(setting.toggleId, setting.storageKey);
  });
}

/**
 * 개별 토글 스위치를 설정하는 재사용 가능한 함수
 * @param {string} toggleId - 토글 input 요소의 ID
 * @param {string} storageKey - chrome.storage에 저장될 키 이름
 */
function setupToggle(toggleId, storageKey) {
  const toggleElement = document.getElementById(toggleId);
  if (!toggleElement) return;

  // 스토리지에서 현재 설정값을 가져와 토글의 체크 상태에 반영
  // 저장된 값이 없으면 기본값은 false (알림 ON)
  chrome.storage.local.get({ [storageKey]: false }, (data) => {
    toggleElement.checked = !data[storageKey];
  });

  // 토글 상태 변경 시 이벤트 처리
  toggleElement.addEventListener("change", (event) => {
    const isPaused = !event.target.checked;
    // 동적 키를 사용하여 올바른 스토리지 키에 값을 저장
    chrome.storage.local.set({ [storageKey]: isPaused });

    if (storageKey.includes("Keep")) {
      const newToggleId = toggleId.replace("-keep", "");
      const newToggleElement = document.getElementById(newToggleId);
      const newStorageKey = storageKey.replace("Keep", "");

      chrome.storage.local.set({ [newStorageKey]: isPaused });
      newToggleElement.checked = !isPaused;
    }
  });
}

/**
 * 3. 알림 권한 확인 관련 기능을 설정하는 함수
 */
function setupNotificationChecker() {
  const testNotificationBtn = document.getElementById("test-notification-btn");
  const settingsLink = document.getElementById("settings-link");
  const notificationCheckWrapper = document.getElementById(
    "notification-check-wrapper"
  );

  // 테스트 알림 버튼
  testNotificationBtn.addEventListener("click", () => {
    chrome.notifications.create("test-notification", {
      type: "basic",
      iconUrl: "../icon_128.png",
      title: "테스트 알림",
      message: "알림이 정상적으로 작동합니다!",
    });
    notificationCheckWrapper.style.display = "none";
  });

  // 설정 페이지 링크
  settingsLink.addEventListener("click", (event) => {
    event.preventDefault();
    chrome.tabs.create({ url: "chrome://settings/content/notifications" });
  });

  // OS별 안내 문구 표시
  showOSNotificationGuide();
}

// OS를 확인하고 플랫폼에 맞는 알림 설정 안내를 제공하는 함수
function showOSNotificationGuide() {
  const testNotificationBtn = document.getElementById("test-notification-btn");
  // OS를 확인하여 macOS 사용자에게 추가 안내를 제공
  chrome.runtime.getPlatformInfo((platformInfo) => {
    if (platformInfo.os === "mac") {
      const infoText = document.querySelector(
        "#notification-check-wrapper .info-text"
      );
      if (infoText) {
        // 기존 안내 문구 뒤에 macOS 전용 안내를 추가
        const macInfo = document.createElement("p");
        macInfo.innerHTML =
          "macOS에서는 <strong>'시스템 설정 > 알림 > Google Chrome'</strong>에서 알림을 허용해야 합니다.";
        macInfo.style.margin = "8px auto";
        macInfo.style.fontWeight = "bold";
        macInfo.style.width = "90%";
        infoText.parentNode.insertBefore(macInfo, testNotificationBtn);
      }
    } else if (platformInfo.os === "win") {
      const infoText = document.querySelector(
        "#notification-check-wrapper .info-text"
      );
      if (infoText) {
        // 기존 안내 문구 뒤에 winOS 전용 안내를 추가
        const winInfo = document.createElement("p");
        winInfo.innerHTML =
          "Windows에서는 <strong>'설정 > 시스템 > 알림'</strong>에서<br> Chrome 알림이 켜져 있고, '집중 지원(방해 금지 모드)'이 꺼져있는지 확인해주세요.";
        winInfo.style.margin = "8px auto";
        winInfo.style.fontWeight = "bold";
        winInfo.style.width = "90%";
        infoText.parentNode.insertBefore(winInfo, testNotificationBtn);
      }
    }
  });
}

// *** DisplayLimit 설정 초기화 함수 ***
function initializeDisplayLimitSettings() {
  const displayLimitSettingsWrapper = document.getElementById(
    "display-limit-settings-wrapper"
  );
  const displayLimitInput = document.getElementById("display-limit-input");
  const displayLimitConfrimBtn = document.getElementById(
    "display-limit-confirm-btn"
  );
  const displayLimitSettingsBtn = document.getElementById(
    "display-limit-settings-btn"
  );
  const closeDispalySettingsBtn = document.querySelector(
    ".close-display-settings-btn"
  );

  // 저장된 값을 input에 표시하는 함수
  async function loadDisplayLimit() {
    const { displayLimit = 100 } = await chrome.storage.local.get(
      "displayLimit"
    );
    displayLimitInput.value = displayLimit;
  }
  loadDisplayLimit(); // 초기 로드

  // 설정 창 열기 버튼
  displayLimitSettingsBtn.onclick = () => {
    displayLimitSettingsWrapper.style.display = "block";
  };

  // 설정 창 닫기 버튼
  if (closeDispalySettingsBtn) {
    closeDispalySettingsBtn.onclick = () => {
      displayLimitSettingsWrapper.style.display = "none";
    };
  }

  // input 값 유효성 검사
  displayLimitInput.oninput = () => {
    const newLimit = parseInt(displayLimitInput.value, 10);
    const minValue = 10;
    const maxValue = 500;
    displayLimitConfrimBtn.disabled =
      newLimit < minValue || newLimit > maxValue;
  };

  displayLimitConfrimBtn.onclick = async () => {
    let newLimit = parseInt(displayLimitInput.value, 10);

    if (!isNaN(newLimit)) {
      const minValue = 10;
      const maxValue = 500;
      newLimit = Math.max(minValue, Math.min(newLimit, maxValue));

      await chrome.storage.local.set({ displayLimit: newLimit });
      displayLimitInput.value = newLimit;
      displayLimitSettingsWrapper.style.display = "none";

      await renderNotificationCenter(); // 필터 유지한 채로 새로고침
      chrome.runtime.sendMessage({ type: "UPDATE_BADGE" });
    } else {
      loadDisplayLimit(); // 유효하지 않은 값이면 저장된 값으로 복원
    }
  };
}

// "YYYYMMDDHHmmss" 지원 파서
function parseTimestampFormat(timestamp) {
  if (typeof timestamp === "string" && /^\d{14}$/.test(timestamp)) {
    const y = Number(timestamp.slice(0, 4));
    const mo = Number(timestamp.slice(4, 6)) - 1;
    const d = Number(timestamp.slice(6, 8));
    const h = Number(timestamp.slice(8, 10));
    const mi = Number(timestamp.slice(10, 12));
    const s = Number(timestamp.slice(12, 14));

    return new Date(y, mo, d, h, mi, s);
  } else {
    return new Date(timestamp);
  }
}

// --- 상대 시간을 계산하는 헬퍼 함수 ---
function formatTimeAgo(timestamp) {
  const checkedDate = parseTimestampFormat(timestamp);
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
  return "방금 전";
}

/**
 * 알림 센터를 렌더링하고 이벤트를 설정하는 함수
 */
async function renderNotificationCenter(options = { resetScroll: false }) {
  const listElement = document.getElementById("notification-list");
  const noNotificationsElement = document.getElementById("no-notifications");

  const markAllBtn = document.getElementById("mark-all-btn");
  const markLiveBtn = document.getElementById("mark-live-btn");
  const markCategoryLiveTitleBtn = document.getElementById(
    "mark-category-live-title-btn"
  );
  const markWatchPartyBtn = document.getElementById("mark-watch-party-btn");
  const markDropsBtn = document.getElementById("mark-drops-btn");
  const markRestrictBtn = document.getElementById("mark-restrict-btn");
  const markVideoBtn = document.getElementById("mark-video-btn");
  const markCommunityBtn = document.getElementById("mark-community-btn");
  const markLoungeBtn = document.getElementById("mark-lounge-btn");
  const markBannerBtn = document.getElementById("mark-banner-btn");

  const markAllReadBtn = document.getElementById("mark-all-read-btn");
  const markAllDeleteBtn = document.getElementById("mark-all-delete-btn");

  const centerHeader = document.querySelector(".center-header h3");

  // 1. 스토리지에서 알림 내역 가져오기
  const data = await chrome.storage.local.get([
    "notificationHistory",
    "liveStatus",
  ]);
  const history = data.notificationHistory || [];
  const liveStatusMap = data.liveStatus || {}; // 최신 라이브 상태 맵

  // 사용자가 설정한 표시 개수를 가져옴
  const { displayLimit = 100 } = await chrome.storage.local.get("displayLimit");

  // 전체 내역에서 사용자가 원하는 개수만큼만 잘라냄
  const displayHistory = history.slice(0, displayLimit);

  // *** 현재 필터 상태에 따라 보여줄 목록을 결정 ***
  let filteredHistory = displayHistory;
  if (currentFilter !== "ALL") {
    if (currentFilter === "CATEGORY/LIVETITLE") {
      filteredHistory = displayHistory.filter(
        (item) =>
          item.type === "CATEGORY/LIVETITLE" ||
          item.type === "CATEGORY" ||
          item.type === "LIVETITLE"
      );
    } else {
      filteredHistory = displayHistory.filter(
        (item) => item.type === currentFilter
      );
    }
  }

  if (centerHeader) {
    centerHeader.innerHTML = `최신 알림 <span>(${filteredHistory.length}/${displayLimit})</span>`;
  }
  // *** 옵션에 따라 스크롤을 초기화하도록 변경 ***
  if (options.resetScroll) {
    listElement.scrollTop = 0;
  }

  // 2. 리스트 초기화
  listElement.innerHTML = "";

  if (displayHistory.length === 0) {
    listElement.appendChild(noNotificationsElement);

    if (!noNotificationsElement) {
      noNotificationsElement = document.createElement("div");
      noNotificationsElement.id = "no-notifications";
      noNotificationsElement.innerHTML = "<p>표시할 알림이 없습니다.</p>";
      listElement.parentNode.insertBefore(
        noNotificationsElement,
        listElement.nextSibling
      );
    }

    noNotificationsElement.style.display = "block";

    markAllReadBtn.style.display = "none";
    markAllDeleteBtn.style.display = "none";

    markAllBtn.style.display = "none";
    markLiveBtn.style.display = "none";
    markCategoryLiveTitleBtn.style.display = "none";
    markWatchPartyBtn.style.display = "none";
    markDropsBtn.style.display = "none";
    markRestrictBtn.style.display = "none";
    markVideoBtn.style.display = "none";
    markCommunityBtn.style.display = "none";
    markLoungeBtn.style.display = "none";
    markBannerBtn.style.display = "none";
  } else {
    markAllReadBtn.style.display = "block";

    markAllBtn.style.display = "block";
    markAllBtn.title = "전체";

    markLiveBtn.style.display = "none";
    markCategoryLiveTitleBtn.style.display = "none";
    markWatchPartyBtn.style.display = "none";
    markDropsBtn.style.display = "none";
    markRestrictBtn.style.display = "none";
    markVideoBtn.style.display = "none";
    markCommunityBtn.style.display = "none";
    markLoungeBtn.style.display = "none";
    markBannerBtn.style.display = "none";

    const historySet = new Set();

    displayHistory.slice().filter((item) => historySet.add(item.type));

    historySet.forEach((item) => {
      switch (item) {
        case "LIVE":
          markLiveBtn.style.display = "block";
          markLiveBtn.title = "라이브";
          break;
        case "CATEGORY/LIVETITLE":
        case "LIVETITLE":
        case "CATEGORY":
          markCategoryLiveTitleBtn.style.display = "block";
          markCategoryLiveTitleBtn.title = "카테고리/라이브 제목";
          break;
        case "WATCHPARTY":
          markWatchPartyBtn.style.display = "block";
          markWatchPartyBtn.title = "같이보기";
          break;
        case "DROPS":
          markDropsBtn.style.display = "block";
          markDropsBtn.title = "드롭스";
          break;
        case "ADULT":
          markRestrictBtn.style.display = "block";
          markRestrictBtn.title = "19세 연령 제한";
          break;
        case "VIDEO":
          markVideoBtn.style.display = "block";
          markVideoBtn.title = "다시보기/동영상";
          break;
        case "POST":
          markCommunityBtn.style.display = "block";
          markCommunityBtn.title = "커뮤니티";
          break;
        case "LOUNGE":
          markLoungeBtn.style.display = "block";
          markLoungeBtn.title = "라운지";
          break;
        case "BANNER":
          markBannerBtn.style.display = "block";
          markBannerBtn.title = "배너";
          break;
      }
    });

    // 3. 각 알림 아이템을 HTML로 만들어 추가
    if (filteredHistory.length === 0) {
      currentFilter = "ALL";
    } else {
      // 필터링된 목록을 화면에 그림
      filteredHistory
        .sort(
          (a, b) =>
            new Date(parseTimestampFormat(b.timestamp)) -
            new Date(parseTimestampFormat(a.timestamp))
        )
        .forEach((item) => {
          const itemElement = createNotificationItem(item, liveStatusMap);
          listElement.appendChild(itemElement);
        });
    }
  }

  // *** 필터 버튼 활성화 상태 업데이트 로직 ***
  const allFilterButtons = document.querySelectorAll(
    ".mark-btn-wrapper button"
  );

  allFilterButtons.forEach((btn) => btn.classList.remove("active-filter"));

  // 현재 필터(currentFilter)에 해당하는 버튼을 찾아 active-filter 클래스를 추가
  switch (currentFilter) {
    case "ALL":
      document.getElementById("mark-all-btn").classList.add("active-filter");
      markAllDeleteBtn.innerText = "모두 삭제";
      markAllReadBtn.innerText = "모두 읽음";
      break;
    case "LIVE":
      document.getElementById("mark-live-btn").classList.add("active-filter");
      markAllDeleteBtn.innerText = "🔴 모두 삭제";
      markAllReadBtn.innerText = "🔴 모두 읽음";
      break;
    case "CATEGORY/LIVETITLE":
      document
        .getElementById("mark-category-live-title-btn")
        .classList.add("active-filter");
      markAllDeleteBtn.innerText = "🔄 모두 삭제";
      markAllReadBtn.innerText = "🔄 모두 읽음";
      break;
    case "WATCHPARTY":
      document
        .getElementById("mark-watch-party-btn")
        .classList.add("active-filter");
      markAllDeleteBtn.innerText = "🍿 모두 삭제";
      markAllReadBtn.innerText = "🍿 모두 읽음";
      break;
    case "DROPS":
      document.getElementById("mark-drops-btn").classList.add("active-filter");
      markAllDeleteBtn.innerText = "🪂 모두 삭제";
      markAllReadBtn.innerText = "🪂 모두 읽음";
      break;
    case "ADULT":
      document
        .getElementById("mark-restrict-btn")
        .classList.add("active-filter");
      markAllDeleteBtn.innerText = "🔞 모두 삭제";
      markAllReadBtn.innerText = "🔞 모두 읽음";
      break;
    case "VIDEO":
      document.getElementById("mark-video-btn").classList.add("active-filter");
      markAllDeleteBtn.innerText = "🎬 / 🎦 모두 삭제";
      markAllReadBtn.innerText = "🎬 / 🎦 모두 읽음";
      break;
    case "POST":
      document
        .getElementById("mark-community-btn")
        .classList.add("active-filter");
      markAllDeleteBtn.innerText = "💬 모두 삭제";
      markAllReadBtn.innerText = "💬 모두 읽음";
      break;
    case "LOUNGE":
      document.getElementById("mark-lounge-btn").classList.add("active-filter");
      markAllDeleteBtn.innerText = "🧀 모두 삭제";
      markAllReadBtn.innerText = "🧀 모두 읽음";
      break;
    case "BANNER":
      document.getElementById("mark-banner-btn").classList.add("active-filter");
      markAllDeleteBtn.innerText = "📢 모두 삭제";
      markAllReadBtn.innerText = "📢 모두 읽음";
      break;
  }

  // 4. 이벤트 리스너 설정
  // '모두 읽음' 버튼 클릭
  markAllReadBtn.onclick = async () => {
    const data = await chrome.storage.local.get("notificationHistory");
    const history = data.notificationHistory || [];

    const { displayLimit = 100 } = await chrome.storage.local.get(
      "displayLimit"
    );

    const updatedHistory = history.map((item, index) => {
      if (index < displayLimit) {
        let shouldMarkAsRead = false;

        if (currentFilter === "ALL") {
          shouldMarkAsRead = true;
        } else if (currentFilter === "CATEGORY/LIVETITLE") {
          if (
            item.type === "CATEGORY/LIVETITLE" ||
            item.type === "CATEGORY" ||
            item.type === "LIVETITLE"
          ) {
            shouldMarkAsRead = true;
          }
        } else {
          if (item.type === currentFilter) {
            shouldMarkAsRead = true;
          }
        }

        if (shouldMarkAsRead) {
          return { ...item, read: true };
        }
      }
      return item;
    });

    await chrome.storage.local.set({ notificationHistory: updatedHistory });

    renderNotificationCenter();
    chrome.runtime.sendMessage({ type: "UPDATE_BADGE" });
  };

  // '모두 삭제' 버튼 이벤트 핸들러
  markAllDeleteBtn.onclick = async () => {
    const data = await chrome.storage.local.get("notificationHistory");
    const history = data.notificationHistory || [];

    const { displayLimit = 100 } = await chrome.storage.local.get(
      "displayLimit"
    );

    let updatedHistory;

    if (currentFilter === "ALL") {
      updatedHistory = history.slice(displayLimit);
    } else {
      updatedHistory = history.filter((item, index) => {
        if (index >= displayLimit) {
          return true;
        }

        if (currentFilter === "CATEGORY/LIVETITLE") {
          return (
            item.type !== "CATEGORY/LIVETITLE" &&
            item.type !== "CATEGORY" &&
            item.type !== "LIVETITLE"
          );
        } else {
          return item.type !== currentFilter;
        }
      });
    }

    await chrome.storage.local.set({ notificationHistory: updatedHistory });

    renderNotificationCenter();
    chrome.runtime.sendMessage({ type: "UPDATE_BADGE" });
  };

  markAllBtn.onclick = async () => {
    currentFilter = "ALL";
    renderNotificationCenter({ resetScroll: true });
  };

  markLiveBtn.onclick = () => {
    currentFilter = "LIVE";
    renderNotificationCenter({ resetScroll: true });
  };

  markCategoryLiveTitleBtn.onclick = () => {
    currentFilter = "CATEGORY/LIVETITLE";
    renderNotificationCenter({ resetScroll: true });
  };

  markWatchPartyBtn.onclick = () => {
    currentFilter = "WATCHPARTY";
    renderNotificationCenter({ resetScroll: true });
  };

  markDropsBtn.onclick = () => {
    currentFilter = "DROPS";
    renderNotificationCenter({ resetScroll: true });
  };

  markRestrictBtn.onclick = () => {
    currentFilter = "ADULT";
    renderNotificationCenter({ resetScroll: true });
  };

  markVideoBtn.onclick = () => {
    currentFilter = "VIDEO";
    renderNotificationCenter({ resetScroll: true });
  };

  markCommunityBtn.onclick = () => {
    currentFilter = "POST";
    renderNotificationCenter({ resetScroll: true });
  };

  markLoungeBtn.onclick = () => {
    currentFilter = "LOUNGE";
    renderNotificationCenter({ resetScroll: true });
  };

  markBannerBtn.onclick = () => {
    currentFilter = "BANNER";
    renderNotificationCenter({ resetScroll: true });
  };

  // 개별 아이템 클릭 (이벤트 위임)
  listElement.onclick = async (event) => {
    const target = event.target;
    const itemElement = target.closest(".notification-item");
    if (!itemElement) return;

    const itemId = itemElement.dataset.id;

    // 개별 버튼 클릭 시
    if (target.classList.contains("mark-one-delete-btn")) {
      const updatedHistory = history.filter((item) => item.id !== itemId);
      await chrome.storage.local.set({ notificationHistory: updatedHistory });
      renderNotificationCenter();

      chrome.runtime.sendMessage({ type: "UPDATE_BADGE" });
      return;
    }

    renderNotificationCenter();

    chrome.runtime.sendMessage({
      type: "NOTIFICATION_CLICKED",
      notificationId: itemId,
    });

    // 사용자 경험을 위해 팝업을 즉시 닫음
    window.close();
  };
}

// --- 본문 정규화/자르기 헬퍼 함수 ---
function normalizeBody(text) {
  return text.replace(/\r\n?/g, "\n").replace(/(?:\n[ \t]*){3,}/g, "\n\n");
}
function makeExcerpt(text) {
  const collapsed = normalizeBody(text || "");
  const paraCount = (collapsed.match(/\n\n/g) || []).length + 1;
  const max =
    paraCount > 7 ? 240 : paraCount > 6 ? 260 : paraCount > 5 ? 280 : 375;
  return collapsed.length > max
    ? collapsed.slice(0, max).replace(/\s+\S*$/, "") + " ...(더보기)"
    : collapsed;
}

/**
 * 알림 아이템 HTML 요소를 생성하는 함수
 * @param {object} item - 알림 데이터 객체
 * @param {object} liveStatusMap - 모든 채널의 최신 라이브 상태 맵
 */
function createNotificationItem(item, liveStatusMap) {
  // *** 현재 라이브 상태를 liveStatusMap에서 확인 ***
  const currentLiveStatus = liveStatusMap[item.channelId];
  const isCurrentlyLive = currentLiveStatus?.live || false;
  const currentLiveId = currentLiveStatus?.currentLiveId || null;
  const hasPaidPromotion = currentLiveStatus?.paidPromotion || false;
  const isPrimeChannel = currentLiveStatus?.isPrime || false;

  const div = document.createElement("div");
  div.className = "notification-item";
  if (item.read) {
    div.classList.add("read");
  }
  div.dataset.id = item.id;
  div.dataset.type = item.type;
  div.dataset.channelId =
    item.type === "BANNER" ? "chzzk-banner" : item.channelId;

  if (item.commentId) {
    div.dataset.commentId = item.commentId;
  }
  if (item.videoNo) {
    div.dataset.videoNo = item.videoNo;
  }

  const channelLink = document.createElement("a");
  channelLink.className = "live-channel-link";
  channelLink.href = `https://chzzk.naver.com/${item.channelId}`;
  channelLink.title = `${item.channelName} 채널로 이동`;
  channelLink.target = "_blank"; // 새 탭에서 열기

  // 이벤트 버블링을 막아, 이미지 클릭 시 전체 알림 클릭이 함께 실행되는 것을 방지
  channelLink.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  const channelImg = document.createElement("img");
  channelImg.className = "channel-img";
  channelImg.src = item.channelImageUrl;
  channelImg.alt = item.channelName;
  channelImg.loading = "lazy";
  channelImg.style.width = "30px";
  channelImg.style.height = "30px";

  channelLink.append(channelImg);

  const liveChannelImgWrapper = document.createElement("span");
  liveChannelImgWrapper.className = "live-channel-img-wrapper";

  const channelImgWrapper = document.createElement("span");
  channelImgWrapper.className = "channel-img-wrapper";

  const em = document.createElement("em");

  const svgNS = "http://www.w3.org/2000/svg";

  const svgElement = document.createElementNS(svgNS, "svg");

  svgElement.setAttribute("width", "16");
  svgElement.setAttribute("height", "8");
  svgElement.setAttribute("viewBox", "0 0 28 10");

  const pathElement = document.createElementNS(svgNS, "path");

  pathElement.setAttribute(
    "d",
    "M21.553 9.3V.7H27.5v2.003h-3.47v1.394h3.253V5.91H24.03v1.389h3.47V9.3h-5.947ZM14.332 9.3 11.82.7h2.863l1.244 5.99h.117L17.288.7h2.863l-2.512 8.6h-3.307ZM7.941 9.3V.7h2.477v8.6H7.941ZM.5 9.3V.7h2.477v6.598h3.435V9.3H.5Z"
  );

  pathElement.setAttribute("fill", "#fff");

  svgElement.appendChild(pathElement);

  em.appendChild(svgElement);

  const contentDiv = document.createElement("div");
  contentDiv.className = "notification-content";

  const nameDiv = document.createElement("div");
  nameDiv.className = "channel-name";

  const timeDiv = document.createElement("div");
  timeDiv.className = "time-ago";
  timeDiv.dataset.timestamp = item.timestamp;

  const messageDiv = document.createElement("div");
  messageDiv.className = "notification-message";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "mark-one-delete-btn";
  deleteBtn.title = "삭제";
  deleteBtn.textContent = "×";

  let contentType = "";
  let contentTitle = "";

  // 알림 메시지 타입, 제목 설정
  if (item.type === "LIVE") {
    contentType = "🔴";
    contentTitle = item.channelName + "님이 라이브를 시작했어요";
  } else if (item.type === "POST") {
    contentType = "💬";
    contentTitle = item.channelName + "님이 새 글을 작성했어요";
    contentTitle = item.isEdited
      ? `${contentTitle} <span class="edited-indicator">(수정됨)</span>`
      : contentTitle;
  } else if (item.type === "VIDEO") {
    if (item.videoType === "REPLAY") {
      contentType = "🎬";
      contentTitle = item.channelName + "님의 다시보기가 올라왔어요";
    } else {
      contentType = "🎦";
      contentTitle = item.channelName + "님의 새 동영상이 올라왔어요";
    }
  } else if (item.type === "CATEGORY/LIVETITLE") {
    contentType = "🔄";
    contentTitle = item.channelName + "님이 카테고리&제목을 변경했어요";
  } else if (item.type === "CATEGORY") {
    contentType = "🔄";
    contentTitle = item.channelName + "님이 카테고리를 변경했어요";
  } else if (item.type === "WATCHPARTY") {
    contentType = "🍿";
    contentTitle =
      item.channelName +
      `님이 같이보기를 ${item.watchPartyTag ? "설정" : "해제"}했어요`;
  } else if (item.type === "DROPS") {
    contentType = "🪂";
    contentTitle =
      item.channelName +
      `님이 드롭스를 ${item.dropsCampaignNo ? "설정" : "해제"}했어요`;
  } else if (item.type === "LOUNGE") {
    contentType = "🧀";
    contentTitle = item.channelName + "님이 새 라운지 글을 작성했어요";
  } else if (item.type === "LIVETITLE") {
    contentType = "🔄";
    contentTitle = item.channelName + "님이 라이브 제목을 변경했어요";
  } else if (item.type === "ADULT") {
    contentType = item.adultMode ? "🔞" : "✅";
    contentTitle =
      item.channelName +
      `님이 19세 연령 제한을 ${item.adultMode ? "설정" : "해제"}했어요`;
  } else {
    contentType = "📢";
    contentTitle = "치지직 배너를 알려드려요";
  }

  nameDiv.innerHTML = `${contentType} ${contentTitle}`;

  // 타입별 알림 메시지 본문 작성
  if (item.type === "POST") {
    messageDiv.style.whiteSpace = "break-spaces";
    const hasAttaches = item.attaches && item.attaches.length > 0;
    if (hasAttaches) {
      // 마이그레이션 fallback
      const temp = item.excerpt || makeExcerpt(item.content);
      const hasText = temp && temp.trim().length > 0;
      if (hasText) {
        const content = document.createTextNode(
          item.excerpt || makeExcerpt(item.content)
        );
        messageDiv.append(content);
      }
      const attachWrapper = document.createElement("div");
      attachWrapper.className = "notification-attach-wrapper";
      attachWrapper.classList.add(`${item.attachLayout || "layout-default"}`);
      item.attaches.forEach((attach) => {
        const img = document.createElement("img");
        img.src = attach.attachValue;
        img.loading = "lazy";

        const dimensions = JSON.parse(attach.extraJson);
        if (dimensions && attach.attachType === "PHOTO") {
          const ratio = dimensions.width / dimensions.height;
          let maxWidth = 100;
          if (item.attachLayout === "layout-single-big") {
            maxWidth = 250;
          } else if (item.attachLayout === "layout-double-medium") {
            maxWidth = 160;
          }
          if (ratio < 0.3) {
            img.style.aspectRatio = `${dimensions.width} / ${dimensions.height}`;
          } else if (ratio > 1.25) {
            img.style.height = "141px";
          } else {
            const height = maxWidth * ratio;
            img.style.height = `${height}px`;
          }
        } else if (attach.attachType === "STICKER") {
          img.style.width = "100px";
          img.style.height = "100px";
        }
        attachWrapper.appendChild(img);
      });

      messageDiv.append(attachWrapper);
      messageDiv.style.lineHeight = "13px";
    } else {
      // 마이그레이션 fallback
      const content = document.createTextNode(
        item.excerpt || makeExcerpt(item.content)
      );
      messageDiv.style.lineHeight = "14px";
      messageDiv.append(content);
    }
  } else if (item.type === "LIVE") {
    const categorySpan = document.createElement("span");
    categorySpan.className = "live-category";
    categorySpan.textContent = item.liveCategoryValue;

    if (item.liveCategoryValue) {
      messageDiv.append(categorySpan);
    }

    if (item.watchPartyTag) {
      const span = document.createElement("span");
      span.className = "live-watchParty";
      span.textContent = "같이보기";

      const watchPartySapn = document.createElement("span");
      watchPartySapn.className = "live-watchParty";
      watchPartySapn.textContent = item.watchPartyTag;

      messageDiv.append(span, watchPartySapn);
    }

    if (item.dropsCampaignNo) {
      const span = document.createElement("span");
      span.className = "live-drops";
      span.textContent = "드롭스";

      messageDiv.append(span);
    }

    if (item.id === currentLiveId && hasPaidPromotion) {
      const span = document.createElement("span");
      span.className = "live-paid-promotion";
      span.textContent = "유료 프로모션 포함";

      messageDiv.append(span);
    }

    if (isPrimeChannel || item.isPrime) {
      const primeSpan = document.createElement("span");
      primeSpan.className = "live-prime";
      primeSpan.textContent = "프라임";
      messageDiv.appendChild(primeSpan);
    }

    const liveTitle = document.createTextNode(` ${item.liveTitle}`);
    messageDiv.append(liveTitle);
  } else if (item.type === "WATCHPARTY") {
    const categorySpan = document.createElement("span");
    categorySpan.className = "live-category";
    categorySpan.textContent = item.liveCategoryValue;

    const watchPartySpan = document.createElement("span");
    watchPartySpan.className = "live-watchParty";
    watchPartySpan.textContent = "같이보기";

    const watchPartyTagSpan = document.createElement("span");
    watchPartyTagSpan.className = "live-watchParty";
    watchPartyTagSpan.textContent = item.watchPartyTag;

    const liveTitle = document.createTextNode(` ${item.liveTitle}`);

    if (item.liveCategoryValue) {
      if (item.watchPartyTag) {
        messageDiv.append(
          categorySpan,
          watchPartySpan,
          watchPartyTagSpan,
          liveTitle
        );
      } else {
        messageDiv.append(categorySpan, liveTitle);
      }
    } else {
      if (item.watchPartyTag) {
        messageDiv.append(watchPartySpan, watchPartyTagSpan, liveTitle);
      } else {
        messageDiv.append(liveTitle);
      }
    }
  } else if (item.type === "DROPS") {
    const categorySpan = document.createElement("span");
    categorySpan.className = "live-category";
    categorySpan.textContent = item.liveCategoryValue;

    const dropsSpan = document.createElement("span");
    dropsSpan.className = "live-drops";
    dropsSpan.textContent = "드롭스";

    const liveTitle = document.createTextNode(` ${item.liveTitle}`);

    if (item.liveCategoryValue) {
      if (item.drops) {
        messageDiv.append(categorySpan, dropsSpan, liveTitle);
      } else {
        messageDiv.append(categorySpan, liveTitle);
      }
    } else {
      if (item.drops) {
        messageDiv.append(dropsSpan, liveTitle);
      } else {
        messageDiv.append(liveTitle);
      }
    }
  } else if (item.type === "CATEGORY") {
    const oldCategorySpan = document.createElement("span");
    oldCategorySpan.className = "live-category";
    oldCategorySpan.textContent = `${item.oldCategory || "없음"}`;

    const arrowChar = document.createTextNode(" → ");

    const newCategorySpan = document.createElement("span");
    newCategorySpan.className = "live-category";
    newCategorySpan.textContent = item.newCategory;

    messageDiv.append(oldCategorySpan, arrowChar, newCategorySpan);
  } else if (item.type === "CATEGORY/LIVETITLE") {
    const oldCategorySpan = document.createElement("span");
    oldCategorySpan.className = "live-category";
    oldCategorySpan.textContent = `${item.oldCategory || "없음"}`;

    const oldLiveTitle = document.createTextNode(
      ` ${item.oldLiveTitle || "없음"}`
    );

    const arrowChar = document.createTextNode(" → ");

    const newCategorySpan = document.createElement("span");
    newCategorySpan.className = "live-category";
    newCategorySpan.textContent = item.newCategory;

    const newLiveTitle = document.createTextNode(` ${item.newLiveTitle}`);

    messageDiv.append(
      oldCategorySpan,
      oldLiveTitle,
      arrowChar,
      newCategorySpan,
      newLiveTitle
    );
  } else if (item.type === "ADULT") {
    const categorySpan = document.createElement("span");
    categorySpan.className = "live-category";
    categorySpan.textContent = item.liveCategoryValue;

    const liveTitle = document.createTextNode(` ${item.liveTitle}`);

    if (item.liveCategoryValue) {
      messageDiv.append(categorySpan, liveTitle);
    } else {
      messageDiv.append(liveTitle);
    }
  } else if (item.type === "LOUNGE") {
    const span = document.createElement("span");
    span.className = "lounge-board";
    span.textContent = item.boardName;

    const liveTitle = document.createTextNode(` ${item.title}`);

    messageDiv.append(span, liveTitle);
  } else if (item.type === "BANNER") {
    const div = document.createElement("div");
    div.className = "banner-wrapper";

    const img = document.createElement("img");
    img.src = item.lightThemeImageUrl ? item.lightThemeImageUrl : item.imageUrl;
    img.style.width = "100px";

    const adSpan = document.createElement("span");
    adSpan.className = "ad-banner";
    adSpan.textContent = "광고";

    const title = document.createElement("strong");
    title.className = "banner-title";
    title.textContent = item.title;

    const subCopy = document.createElement("div");
    subCopy.className = "banner-subcopy";
    subCopy.textContent = item.subCopy;

    const scheduledDate = document.createElement("strong");
    scheduledDate.className = "banner-scheduled-date";
    scheduledDate.textContent = item.scheduledDate;

    const span = document.createElement("span");
    span.className = "banner";
    span.append(title, subCopy, scheduledDate);
    if (item.ad) {
      div.append(span, img, adSpan);
      messageDiv.append(div);
    } else {
      div.append(span, img);
      messageDiv.append(div);
    }
  } else {
    const content = document.createTextNode(item.content);
    messageDiv.append(content);
  }

  if (item.type === "VIDEO") {
    // 썸네일이 있으면 사용하고 없으면 채널 프로필 이미지 사용
    const imageUrl =
      item.thumbnailImageUrl ||
      "../thumbnail.gif" ||
      item.channelImageUrl ||
      "../icon_128.png";

    const videoCategorySpan = document.createElement("span");
    videoCategorySpan.className = "video-category";
    videoCategorySpan.textContent = item.videoCategoryValue;

    messageDiv.textContent = "";
    const content = document.createTextNode(` ${item.content}`);

    if (item.adult) {
      const span = document.createElement("span");
      span.className = "video-adult-mode";
      span.style.marginBottom = "3px";

      const img = document.createElement("img");
      img.src = imageUrl;
      img.loading = "lazy";

      const br = document.createElement("br");

      span.append(img);

      if (item.videoCategoryValue) {
        messageDiv.append(span, br, videoCategorySpan, content);
      } else {
        messageDiv.append(span, br, content);
      }
    } else {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.style.width = "250px";
      img.style.height = "141px";
      img.style.marginBottom = "3px";
      img.style.borderRadius = "6px";
      img.loading = "lazy";

      const br = document.createElement("br");

      if (item.videoCategoryValue) {
        messageDiv.append(img, br, videoCategorySpan, content);
      } else {
        messageDiv.append(img, br, content);
      }
    }
  }

  const timeAgo = formatTimeAgo(item.timestamp);
  timeDiv.textContent = timeAgo;

  // 최종 조합
  if (item.type === "BANNER") {
    contentDiv.append(nameDiv, messageDiv);
  } else {
    contentDiv.append(nameDiv, timeDiv, messageDiv);
  }

  if (isCurrentlyLive) {
    liveChannelImgWrapper.append(channelLink, em);

    div.append(liveChannelImgWrapper, contentDiv, deleteBtn);
  } else {
    if (item.type === "BANNER") {
      const emptyChannelImg = document.createElement("span");
      emptyChannelImg.className = "empty-channel-img";

      div.append(emptyChannelImg, contentDiv, deleteBtn);
    } else {
      channelImgWrapper.append(channelLink);

      div.append(channelImgWrapper, contentDiv, deleteBtn);
    }
  }

  return div;
}
