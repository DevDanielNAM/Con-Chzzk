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

  /**
   * 로그인 상태를 실시간으로 감시하고 background에 알리는 함수
   */
  function monitorLoginStatus() {
    let previousLoginState = !!localStorage.getItem("userStatus.idhash");

    // sessionStorage에 ID를 저장하는 로직
    const STORAGE_KEY = "chzzkExt_loginMonitorId";
    const intervalId = setInterval(() => {
      try {
        if (
          typeof chrome === "undefined" ||
          !chrome.runtime ||
          !chrome.runtime.id
        ) {
          clearInterval(intervalId);
          return;
        }

        const currentLoginState = !!localStorage.getItem("userStatus.idhash");

        if (previousLoginState !== currentLoginState) {
          chrome.runtime.sendMessage({ type: "LOGIN_STATE_CHANGED" });
          previousLoginState = currentLoginState;
        }
      } catch (e) {
        clearInterval(intervalId);
      }
    }, 2000);

    // background.js가 찾아낼 수 있도록 타이머 ID를 저장
    sessionStorage.setItem(STORAGE_KEY, intervalId);
  }

  // 확장 프로그램 기능 시작
  chrome.storage.local.get("isPaused", (data) => {
    if (data.isPaused) {
      return;
    }

    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
      monitorLoginStatus();
    }
  });
})(); // 즉시 실행 함수 종료
