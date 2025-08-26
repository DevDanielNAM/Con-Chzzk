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
  const loginBox = document.getElementById("status-login");
  const logoutBox = document.getElementById("status-logout");
  const loginIdSpan = document.getElementById("login-id");
  const loginProfile = document.getElementById("login-profile");

  const testBtn = document.getElementById("test-btn");
  const notificationCheckWrapper = document.getElementById(
    "notification-check-wrapper"
  );

  const controlWrapper = document.getElementById("control-wrapper");

  const settingsWrapper = document.getElementById("settings-wrapper");

  controlWrapper.classList.add("hidden");
  testBtn.classList.add("hidden");

  try {
    const response = await fetch(
      "https://comm-api.game.naver.com/nng_main/v1/user/getUserStatus"
    );
    const data = await response.json();

    if (data.code === 200 && data.content.userIdHash) {
      // 로그인 상태
      let userId = data.content?.nickname || "사용자";
      if (/[ㄱ-ㅎ가-힣]/.test(userId)) {
        userId = userId.length > 11 ? userId.substring(0, 11) + "..." : userId;
      } else {
        userId = userId.length > 13 ? userId.substring(0, 13) + "..." : userId;
      }

      loginIdSpan.textContent = userId;
      loginIdSpan.title = data.content?.nickname;

      loginProfile.setAttribute("src", data.content?.profileImageUrl);
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
  } catch (error) {
    // 네트워크 오류 등
    logoutBox.textContent =
      "상태를 확인할 수 없습니다. 인터넷 연결을 확인해주세요.";
    logoutBox.style.display = "flex";
    loginBox.style.display = "none";
    controlWrapper.classList.add("hidden");
    testBtn.classList.add("hidden");
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
      settingsWrapper.style.display = "block";
    });
  }

  const closeSettingsBtn = document.querySelector(".close-settings-btn");
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener("click", () => {
      settingsWrapper.style.display = "none";
    });
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
    { toggleId: "restrict-pause-toggle", storageKey: "isRestrictPaused" },
    { toggleId: "video-pause-toggle", storageKey: "isVideoPaused" },
    { toggleId: "community-pause-toggle", storageKey: "isCommunityPaused" },
    { toggleId: "chzzk-lounge-pause-toggle", storageKey: "isLoungePaused" },
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
  const markRestrictBtn = document.getElementById("mark-restrict-btn");
  const markVideoBtn = document.getElementById("mark-video-btn");
  const markCommunityBtn = document.getElementById("mark-community-btn");
  const markLoungeBtn = document.getElementById("mark-lounge-btn");

  const markAllReadBtn = document.getElementById("mark-all-read-btn");
  const markAllDeleteBtn = document.getElementById("mark-all-delete-btn");

  const centerHeader = document.querySelector(".center-header h3");
  const HISTORY_LIMIT = 50;

  // 1. 스토리지에서 알림 내역 가져오기
  const data = await chrome.storage.local.get("notificationHistory");
  const history = data.notificationHistory || [];

  // *** 현재 필터 상태에 따라 보여줄 목록을 결정 ***
  let filteredHistory = history;
  if (currentFilter !== "ALL") {
    if (currentFilter === "CATEGORY/LIVETITLE") {
      filteredHistory = history.filter(
        (item) =>
          item.type === "CATEGORY/LIVETITLE" ||
          item.type === "CATEGORY" ||
          item.type === "LIVETITLE"
      );
    } else {
      filteredHistory = history.filter((item) => item.type === currentFilter);
    }
  }

  if (centerHeader) {
    centerHeader.innerHTML = `최신 알림 <span>(${filteredHistory.length}/${HISTORY_LIMIT})</span>`;
  }

  // *** 옵션에 따라 스크롤을 초기화하도록 변경 ***
  if (options.resetScroll) {
    listElement.scrollTop = 0;
  }

  // 2. 리스트 초기화
  listElement.innerHTML = "";

  if (history.length === 0) {
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
    markRestrictBtn.style.display = "none";
    markVideoBtn.style.display = "none";
    markCommunityBtn.style.display = "none";
    markLoungeBtn.style.display = "none";
  } else {
    markAllReadBtn.style.display = "block";

    markAllBtn.style.display = "block";
    markAllBtn.title = "전체";

    markLiveBtn.style.display = "none";
    markCategoryLiveTitleBtn.style.display = "none";
    markRestrictBtn.style.display = "none";
    markVideoBtn.style.display = "none";
    markCommunityBtn.style.display = "none";
    markLoungeBtn.style.display = "none";

    const historySet = new Set();

    history.slice().filter((item) => historySet.add(item.type));

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
          const itemElement = createNotificationItem(item);
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
    case "ADULT":
      document
        .getElementById("mark-restrict-btn")
        .classList.add("active-filter");
      markAllDeleteBtn.innerText = "🔞 모두 삭제";
      markAllReadBtn.innerText = "🔞 모두 읽음";
      break;
    case "VIDEO":
      document.getElementById("mark-video-btn").classList.add("active-filter");
      markAllDeleteBtn.innerText = "🎬/🎦 모두 삭제";
      markAllReadBtn.innerText = "🎬/🎦 모두 읽음";
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
  }

  // 4. 이벤트 리스너 설정
  // '모두 읽음' 버튼 클릭
  markAllReadBtn.onclick = async () => {
    const data = await chrome.storage.local.get("notificationHistory");
    const history = data.notificationHistory || [];

    const updatedHistory = history.map((item) => {
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
      } else {
        return item;
      }
    });

    await chrome.storage.local.set({ notificationHistory: updatedHistory });

    renderNotificationCenter();
    chrome.runtime.sendMessage({ type: "UPDATE_BADGE" });
  };

  // '모두 삭제' 버튼 이벤트 핸들러
  markAllDeleteBtn.onclick = async () => {
    const data = await chrome.storage.local.get("notificationHistory");
    const history = data.notificationHistory || [];

    let updatedHistory;

    if (currentFilter === "ALL") {
      updatedHistory = [];
    } else {
      if (currentFilter === "CATEGORY/LIVETITLE") {
        updatedHistory = history.filter(
          (item) =>
            item.type !== "CATEGORY/LIVETITLE" &&
            item.type !== "CATEGORY" &&
            item.type !== "LIVETITLE"
        );
      } else {
        updatedHistory = history.filter((item) => item.type !== currentFilter);
      }
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

  // 개별 아이템 클릭 (이벤트 위임)
  listElement.onclick = async (event) => {
    const target = event.target;
    const itemElement = target.closest(".notification-item");
    if (!itemElement) return;

    const itemId = itemElement.dataset.id;

    // 개별 버튼 클릭 시
    if (target.classList.contains("mark-one-read-btn")) {
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

/**
 * 알림 아이템 HTML 요소를 생성하는 함수
 * @param {object} item - 알림 데이터 객체
 */
function createNotificationItem(item) {
  const div = document.createElement("div");
  div.className = "notification-item";
  if (item.read) {
    div.classList.add("read");
  }
  div.dataset.id = item.id;
  div.dataset.type = item.type;
  div.dataset.channelId = item.channelId;

  if (item.commentId) {
    div.dataset.commentId = item.commentId;
  }
  if (item.videoNo) {
    div.dataset.videoNo = item.videoNo;
  }

  let contentHTML = "";
  const hasText = item.content && item.content.trim().length > 0;
  const hasAttaches = item.attaches && item.attaches.length > 0;
  const hasVideo = item.type === "VIDEO";
  const isVideoAdult = item.adult;

  let contentType = "";
  let contentTitle = "";

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
  } else if (item.type === "LOUNGE") {
    contentType = "🧀";
    contentTitle = item.channelName + "님이 새 라운지 글을 작성했어요";
  } else if (item.type === "LIVETITLE") {
    contentType = "🔄";
    contentTitle = item.channelName + "님이 라이브 제목을 변경했어요";
  } else {
    contentType = item.adultMode ? "🔞" : "✅";
    contentTitle =
      item.channelName +
      `님이 19세 연령 제한을 ${item.adultMode ? "설정" : "해제"}했어요`;
  }

  // VIDEO 타입일 경우, 썸네일이 있으면 사용하고 없으면 채널 프로필 이미지 사용
  const imageUrl =
    item.type === "VIDEO"
      ? item.thumbnailImageUrl || item.channelImageUrl
      : item.channelImageUrl;

  // --- 1. 텍스트가 있는 경우 ---
  if (hasText) {
    // --- CATEGORY/LIVETITLE 타입인 경우  ---
    if (item.type === "CATEGORY/LIVETITLE") {
      const temp = item.content.split(" → ");
      let [oldMessageContent, newMessageContent] = temp;

      oldMessageContent =
        oldMessageContent.length > 170
          ? oldMessageContent.substring(0, 170) + " ..."
          : oldMessageContent;

      newMessageContent =
        newMessageContent.length > 170
          ? newMessageContent.substring(0, 170) + " ...(더보기)"
          : newMessageContent;

      contentHTML = `${oldMessageContent} → ${newMessageContent}`;
    } else {
      const collapsed = item.content
        .replace(/\r\n?/g, "\n")
        .replace(/(?:\n[ \t]*){3,}/g, "\n\n");

      contentHTML =
        collapsed.length > 375
          ? collapsed.substring(0, 375) + " ...(더보기)"
          : collapsed;
    }

    if (hasAttaches) {
      const collapsed = item.content
        .replace(/\r\n?/g, "\n")
        .replace(/(?:\n[ \t]*){3,}/g, "\n\n");

      const p = countParagraphs(collapsed);
      let limit = 375;

      if (p > 7) limit = 240;
      else if (p > 6) limit = 260;
      else if (p > 5) limit = 280;

      const text =
        collapsed.length > limit
          ? collapsed.slice(0, limit) + " ...(더보기)"
          : collapsed;
      contentHTML = text;

      const attachWrapper = document.createElement("div");
      attachWrapper.id = "notification-attach-wrapper";
      item.attaches.forEach((attach) => {
        const img = document.createElement("img");
        img.src = attach.attachValue;
        attachWrapper.appendChild(img);
      });
      contentHTML += attachWrapper.outerHTML;
    }

    if (hasVideo) {
      const tempContentHTML = contentHTML;
      if (isVideoAdult) {
        contentHTML = `<span class="video-adult-mode"><img src="${imageUrl}"></span><br> ${tempContentHTML}`;
        contentHTML += ``;
      } else {
        contentHTML = `<img src="${imageUrl}" style="max-width: 250px; margin-bottom: 3px; border-radius: 6px;"><br> ${tempContentHTML}`;
      }
    }
  } else if (hasAttaches) {
    // --- 2. 텍스트 없이 첨부파일만 있는 경우 ---
    const attachWrapper = document.createElement("div");
    attachWrapper.id = "notification-attach-wrapper";
    item.attaches.forEach((attach) => {
      const img = document.createElement("img");
      img.src = attach.attachValue;
      attachWrapper.appendChild(img);
    });
    contentHTML += attachWrapper.outerHTML;
  }

  const timeAgo = formatTimeAgo(item.timestamp);

  div.innerHTML = `
    <img src="${item.channelImageUrl}" alt="${item.channelName}" class="channel-img">
    <div class="notification-content">
      <div class="channel-name">${contentType} ${contentTitle}</div>
      <div class="time-ago" data-timestamp="${item.timestamp}">${timeAgo}</div>
      <div class="notification-message">${contentHTML}</div>
    </div>
    <button class="mark-one-read-btn" title="삭제">×</button>
  `;
  return div;
}
