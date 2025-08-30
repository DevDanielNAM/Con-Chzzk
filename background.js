// --- 상수 정의 ---
const FOLLOW_API_URL =
  "https://api.chzzk.naver.com/service/v1/channels/followings?size=505";
const POST_API_URL_PREFIX =
  "https://apis.naver.com/nng_main/nng_comment_api/v1/type/CHANNEL_POST/id/";
const VIDEO_API_URL =
  "https://api.chzzk.naver.com/service/v2/home/following/videos?size=50";
const LIVE_STATUS_API_PREFIX =
  "https://api.chzzk.naver.com/polling/v3.1/channels/";
const CHZZK_LOUNGE_API_URL_PREFIX =
  "https://comm-api.game.naver.com/nng_main/v1/community/lounge/chzzk/feed";
const CHZZK_BANNER_API_URL =
  "https://api.chzzk.naver.com/service/v1/banners?deviceType=PC&positionsIn=HOME_SCHEDULE";
const CHECK_LIVE_PRIME_API_URL_PREFIX =
  "https://api.chzzk.naver.com/service/v1/channels/";

const CHECK_ALARM_NAME = "chzzkAllCheck";

// *** 실행 잠금을 위한 전역 변수 ***
let isChecking = false;
const HISTORY_LIMIT = 100;

// --- 확장 프로그램 설치 시 알람 생성 ---
chrome.runtime.onInstalled.addListener(async (details) => {
  chrome.alarms.create(CHECK_ALARM_NAME, {
    periodInMinutes: 1,
    when: Date.now() + 1000,
  });

  // --- 마이그레이션 로직 ---
  // 설치 또는 업데이트 시에만 실행
  if (details.reason === "install" || details.reason === "update") {
    const { migrated_v3 } = await chrome.storage.local.get("migrated_v3");
    if (!migrated_v3) {
      const { notificationHistory = [] } = await chrome.storage.local.get(
        "notificationHistory"
      );
      let changed = false;

      // 정규표현식을 사용하여 HTML에서 카테고리와 제목을 추출
      const categoryRegex = /<span[^>]*>([^<]+)<\/span>/;

      for (const item of notificationHistory) {
        if (item.type === "POST") {
          if (!item.excerpt) {
            item.excerpt = makeExcerpt(item.content || "");
            changed = true;
          }
          if (!item.attachLayout) {
            item.attachLayout = "layout-default";
            changed = true;
          }
        }

        if (item.type === "VIDEO") {
          if (!item.videoCategoryValue) {
            item.videoCategoryValue = "기타";
            changed = true;
          }
        }

        if (item.type === "LIVE" && typeof item.liveTitle === "undefined") {
          const content = item.content || "";
          const categoryMatch = content.match(categoryRegex);

          // 정규식으로 카테고리와 제목을 성공적으로 분리
          if (categoryMatch) {
            item.liveCategoryValue = categoryMatch[1];
            // HTML 태그를 제거하여 순수 제목만 추출
            item.liveTitle = content.replace(categoryRegex, "").trim();
          } else {
            // 분리 실패 시 content를 그대로 liveTitle로 사용
            item.liveCategoryValue = "기타";
            item.liveTitle = content;
          }

          // watchPartyTag, dropsCampaignNo 새로운 필드 초기화
          item.watchPartyTag = null;
          item.dropsCampaignNo = null;
          item.paidPromotion = false;

          delete item.content;

          changed = true;
        }

        if (
          item.type === "CATEGORY" &&
          typeof item.oldCategory === "undefined"
        ) {
          const content = item.content || "";
          const parts = content.split(" → ");
          if (parts.length === 2) {
            item.oldCategory = parts[0].replace(/<[^>]*>/g, "").trim(); // HTML 태그 제거
            item.newCategory = parts[1].replace(/<[^>]*>/g, "").trim(); // HTML 태그 제거
          } else {
            item.oldCategory = "없음";
            item.newCategory = "기타";
          }

          delete item.content;

          changed = true;
        }

        if (
          item.type === "CATEGORY/LIVETITLE" &&
          typeof item.oldCategory === "undefined"
        ) {
          const content = item.content || "";
          const parts = content.split(" → ");

          if (parts.length === 2) {
            const oldPart = parts[0];
            const newPart = parts[1];

            const oldCategoryMatch = oldPart.match(categoryRegex);
            const newCategoryMatch = newPart.match(categoryRegex);

            item.oldCategory = oldCategoryMatch ? oldCategoryMatch[1] : "없음";
            item.oldLiveTitle = oldPart.replace(categoryRegex, "").trim();

            item.newCategory = newCategoryMatch ? newCategoryMatch[1] : "기타";
            item.newLiveTitle = newPart.replace(categoryRegex, "").trim();
          }

          delete item.content;

          changed = true;
        }

        if (item.type === "ADULT" && typeof item.liveTitle === "undefined") {
          const content = item.content || "";
          const categoryMatch = content.match(categoryRegex);

          // 정규식으로 카테고리와 제목을 성공적으로 분리
          if (categoryMatch) {
            item.liveCategoryValue = categoryMatch[1];
            // HTML 태그를 제거하여 순수 제목만 추출
            item.liveTitle = content.replace(categoryRegex, "").trim();
          } else {
            // 분리 실패 시 content를 그대로 liveTitle로 사용
            item.liveCategoryValue = "기타";
            item.liveTitle = content;
          }

          delete item.content;

          changed = true;
        }

        if (item.type === "LOUNGE" && typeof item.channelId === "undefined") {
          item.channelId = "c42cd75ec4855a9edf204a407c3c1dd2";
          changed = true;
        }

        if (item.type === "LIVE" && typeof item.isPrime === "undefined") {
          item.isPrime = false;
          changed = true;
        }
      }

      const { liveStatus = {} } = await chrome.storage.local.get("liveStatus");

      for (const channelId in liveStatus) {
        if (typeof liveStatus[channelId].isPrime === "undefined") {
          liveStatus[channelId].isPrime = false; // 기본값 false 설정
          changed = true;
        }
      }

      const dataToSave = { migrated_v3: true };
      if (changed) {
        dataToSave.notificationHistory = notificationHistory;
        dataToSave.liveStatus = liveStatus;
      }
      await chrome.storage.local.set(dataToSave);
    }
  }

  // '업데이트' 시에만 실행되는 로직
  if (details.reason === "update") {
    updateUnreadCountBadge();

    try {
      const targetUrl = "https://chzzk.naver.com/*";
      const tabs = await chrome.tabs.query({ url: targetUrl });

      for (const tab of tabs) {
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
      }
    } catch (error) {
      console.warn("이전 타이머 정리 중 오류 발생:", error.message);
    }
  }
});

// --- 읽지 않은 알림 수를 계산하여 아이콘 배지에 표시하는 함수 ---
async function updateUnreadCountBadge() {
  const data = await chrome.storage.local.get("notificationHistory");
  const history = data.notificationHistory || [];

  // 'read: false'인 알림의 개수
  const unreadCount = history.filter((item) => !item.read).length;

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
  return text.replace(/\r\n?/g, "\n").replace(/(?:\n[ \t]*){3,}/g, "\n\n");
}
function makeExcerptWithAttaches(text) {
  const collapsed = normalizeBody(text || "");
  const paraCount = (collapsed.match(/\n\n/g) || []).length + 1;
  const max =
    paraCount > 7
      ? 280
      : paraCount > 6
      ? 300
      : paraCount > 5
      ? 320
      : paraCount > 4
      ? 350
      : paraCount > 3
      ? 370
      : 380;
  return collapsed.length > max
    ? collapsed.slice(0, max).replace(/\s+\S*$/, "") + " ...(더보기)"
    : collapsed;
}
function makeExcerpt(text) {
  const collapsed = normalizeBody(text || "");
  const paraCount = (collapsed.match(/\n\n/g) || []).length + 1;
  const max = paraCount > 10 ? 400 : 420;
  return collapsed.length > max
    ? collapsed.slice(0, max).replace(/\s+\S*$/, "") + " ...(더보기)"
    : collapsed;
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

// --- 알람 리스너 ---
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CHECK_ALARM_NAME) {
    checkFollowedChannels();
  }
});

// --- 모든 확인 작업을 통합하고 일괄 처리 ---
async function checkFollowedChannels() {
  if (isChecking) return;
  isChecking = true;

  try {
    const response = await fetch(FOLLOW_API_URL);
    const data = await response.json();

    // *** 확인된 로그인 상태를 session 스토리지에 캐싱 ***
    if (data.code === 200) {
      const userStatusRes = await fetch(
        "https://comm-api.game.naver.com/nng_main/v1/user/getUserStatus"
      );
      const userStatusData = await userStatusRes.json();
      const nickname = userStatusData.content?.nickname;
      const profileImageUrl = userStatusData.content?.profileImageUrl;

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
      "postStatus",
      "videoStatus",
      "loungeStatus",
      "seenBanners",
      "notificationHistory",
      "isPaused",
      "isLivePaused",
      "isCategoryPaused",
      "isLiveTitlePaused",
      "isRestrictPaused",
      "isWatchPartyPaused",
      "isDropsPaused",
      "isVideoPaused",
      "isCommunityPaused",
      "isLoungePaused",
      "isBannerPaused",
    ]);
    const isPaused = prevState.isPaused || false;
    const isLivePaused = prevState.isLivePaused || false;
    const isCategoryPaused = prevState.isCategoryPaused || false;
    const isLiveTitlePaused = prevState.isLiveTitlePaused || false;
    const isRestrictPaused = prevState.isRestrictPaused || false;
    const isWatchPartyPaused = prevState.isWatchPartyPaused || false;
    const isDropsPaused = prevState.isDropsPaused || false;
    const isVideoPaused = prevState.isVideoPaused || false;
    const isCommunityPaused = prevState.isCommunityPaused || false;
    const isLoungePaused = prevState.isLoungePaused || false;
    const isBannerPaused = prevState.isBannerPaused || false;

    // 1. 모든 확인 작업을 병렬로 실행하고, "새로운 알림 내역"과 "새로운 상태"를 반환받음
    const results = await Promise.all([
      checkLiveStatus(
        followingList,
        prevState.liveStatus,
        isPaused,
        isLivePaused,
        isCategoryPaused,
        isLiveTitlePaused,
        isRestrictPaused,
        isWatchPartyPaused,
        isDropsPaused
      ),
      checkCommunityPosts(
        followingList,
        prevState.postStatus,
        notificationEnabledChannels,
        isPaused,
        isCommunityPaused,
        prevState.notificationHistory
      ),
      checkUploadedVideos(
        prevState.videoStatus,
        notificationEnabledChannels,
        prevState.notificationHistory,
        isPaused,
        isVideoPaused
      ),
      checkLoungePosts(prevState.loungeStatus, isPaused, isLoungePaused),
      checkBanners(prevState.seenBanners, isPaused, isBannerPaused),
    ]);

    // 2. 각 작업의 결과를 취합
    const liveResult = results[0];
    const postResult = results[1];
    const videoResult = results[2];
    const loungeResult = results[3];
    const bannerResult = results[4];

    // 2-1. 새로 발생한 알림들을 모두 모음
    const newNotifications = [
      ...liveResult.notifications,
      ...postResult.notifications,
      ...videoResult.notifications,
      ...loungeResult.notifications,
      ...bannerResult.notifications,
    ];

    // 2-2. 최종적으로 저장될 알림 내역을 결정
    // postResult에 내용 또는 첨부파일의 수정이 있으면
    // videoResult에 썸네일이 갱신된 내역이 있으면 그것을 기반으로 하고,
    // 없으면 이전 내역을 그대로 사용
    let finalHistory =
      postResult.updatedHistory ||
      videoResult.updatedHistory ||
      prevState.notificationHistory ||
      [];

    // 2-3. 새로 발생한 알림들을 최종 내역의 맨 앞에 추가
    if (newNotifications.length > 0) {
      finalHistory = [...newNotifications, ...finalHistory];
    }

    // 내역은 최대 저장
    if (finalHistory.length > HISTORY_LIMIT) {
      finalHistory.length = HISTORY_LIMIT;
    }

    // 3. 모든 상태와 최종 알림 내역을 한 번에 저장
    await chrome.storage.local.set({
      liveStatus: liveResult.newStatus,
      postStatus: postResult.newStatus,
      videoStatus: videoResult.newStatus,
      loungeStatus: loungeResult.newStatus,
      seenBanners: bannerResult.newStatus,
      notificationHistory: finalHistory, // 썸네일 갱신과 새 알림이 모두 반영된 최종본
    });

    // 4. 새 알림이 있거나 썸네일 갱신이 있었을 경우 배지를 업데이트
    if (newNotifications.length > 0 || videoResult.updatedHistory) {
      await updateUnreadCountBadge();
    }
  } catch (error) {
    console.error("팔로우 채널 확인 중 오류 발생:", error);
    // 오류 발생 시에도 로그아웃 상태로 캐싱
    chrome.storage.session.set({ cachedLoginStatus: { isLoggedIn: false } });
  } finally {
    isChecking = false;
  }
}

// --- 확인 함수들 ---
// *** 새 라이브 확인 및 카테고리 변경, 라이브 제목 변경, 19세 연령 제한 설정 함수 ***
async function checkLiveStatus(
  followingList,
  prevLiveStatus = {},
  isPaused,
  isLivePaused,
  isCategoryPaused,
  isLiveTitlePaused,
  isRestrictPaused,
  isWatchPartyPaused,
  isDropsPaused
) {
  const newLiveStatus = {};
  const notifications = [];
  const primeStatusUpdates = {};

  for (const item of followingList) {
    const { channel, streamer } = item;
    const channelId = channel.channelId;
    const wasLive = prevLiveStatus[channelId]?.live || false;
    const prevCategory = prevLiveStatus[channelId]?.category || null;
    const prevLiveTitle = prevLiveStatus[channelId]?.liveTitle || null;
    const prevAdultMode = prevLiveStatus[channelId]?.adultMode || false;
    const prevWatchParty = prevLiveStatus[channelId]?.watchParty || null;
    const prevDrops = prevLiveStatus[channelId]?.drops || null;
    const isNowLive = streamer.openLive;

    if (isNowLive) {
      // 라이브 중인 채널의 상세 정보를 가져옴
      const liveStatusResponse = await fetch(
        `${LIVE_STATUS_API_PREFIX}${channelId}/live-status`
      );
      const liveStatusData = await liveStatusResponse.json();
      const liveContent = liveStatusData.content;
      if (!liveContent) continue; // 데이터 없으면 다음 채널로

      let isPrime = prevLiveStatus[channelId]?.isPrime || false;

      // 프라임 여부 확인
      const channelInfoResponse = await fetch(
        `https://api.chzzk.naver.com/service/v1/channels/${channelId}`
      );
      const channelInfoData = await channelInfoResponse.json();
      isPrime = channelInfoData.content?.paidProductSaleAllowed || false;

      primeStatusUpdates[channel.channelId] = isPrime;

      const currentLiveId = `live-${channelId}-${liveContent?.openDate}`;
      const currentCategory = liveContent?.liveCategoryValue;
      const currentLiveTitle = liveContent?.liveTitle;
      const currentAdultMode = liveContent?.adult;
      const currentWatchParty = liveContent?.watchPartyTag;
      const currentDrops = liveContent?.dropsCampaignNo;
      const currentpaidPromotion = liveContent?.paidPromotion;

      // --- 1. 방송 시작 이벤트 처리 ---
      if (!wasLive && channel.personalData.following.notification) {
        notifications.push(createLiveObject(channel, liveContent, isPrime));
        if (!isPaused && !isLivePaused) {
          createLiveNotification(channel, liveContent, isPrime);
        }
      }

      // --- 2. 라이브 "중" 상태 변경 이벤트 처리 ---
      if (wasLive && channel.personalData.following.notification) {
        if (
          prevCategory &&
          currentCategory &&
          currentCategory !== prevCategory &&
          prevLiveTitle &&
          currentLiveTitle &&
          currentLiveTitle !== prevLiveTitle
        ) {
          const notificationObject = createCategoryAndLiveTitleChangeObject(
            channel,
            prevCategory,
            currentCategory,
            prevLiveTitle,
            currentLiveTitle
          );
          notifications.push(notificationObject);

          if (!isPaused && !(isCategoryPaused || isLiveTitlePaused)) {
            createCategoryAndLiveTitleChangeNotification(
              notificationObject,
              prevCategory,
              currentCategory,
              prevLiveTitle,
              currentLiveTitle
            );
          }
        } else {
          // 2. 카테고리 변경 알림
          if (
            prevCategory &&
            currentCategory &&
            currentCategory !== prevCategory
          ) {
            const notificationObject = createCategoryChangeObject(
              channel,
              prevCategory,
              currentCategory
            );
            notifications.push(notificationObject);

            if (!isPaused && !isCategoryPaused) {
              createCategoryChangeNotification(
                notificationObject,
                prevCategory,
                currentCategory
              );
            }
          }
          // 3. 라이브 제목 변경 알림
          if (
            prevLiveTitle &&
            currentLiveTitle &&
            currentLiveTitle !== prevLiveTitle
          ) {
            const notificationObject = createLiveTitleChangeObject(
              channel,
              prevLiveTitle,
              currentLiveTitle
            );
            notifications.push(notificationObject);

            if (!isPaused && !isLiveTitlePaused) {
              createLiveTitleChangeNotification(
                notificationObject,
                prevLiveTitle,
                currentLiveTitle
              );
            }
          }
          // 4. 19세 연령 제한 변경 알림
          if (currentAdultMode !== prevAdultMode) {
            const notificationObject = createLiveAdultChangeObject(
              channel,
              currentAdultMode,
              liveStatusData.content.liveTitle,
              liveStatusData.content.liveCategoryValue
            );
            notifications.push(notificationObject);

            if (!isPaused && !isRestrictPaused) {
              createLiveAdultChangeNotification(
                notificationObject,
                currentAdultMode,
                liveStatusData.content
              );
            }
          }
          // 5. 같이보기 설정 알림
          if (currentWatchParty !== prevWatchParty) {
            const notificationObject = createLiveWatchPartyObject(
              channel,
              liveStatusData.content
            );
            notifications.push(notificationObject);

            if (!isPaused && !isWatchPartyPaused) {
              createLiveWatchPartyNotification(
                notificationObject,
                liveStatusData.content
              );
            }
          }
          // 6. 드롭스 설정 변경 알림
          if (currentDrops !== prevDrops) {
            const notificationObject = createLiveDropsObject(
              channel,
              liveStatusData.content
            );
            notifications.push(notificationObject);

            if (!isPaused && !isDropsPaused) {
              createLiveDropsNotification(
                notificationObject,
                liveStatusData.content
              );
            }
          }
        }
      }

      newLiveStatus[channelId] = {
        live: true,
        currentLiveId: currentLiveId,
        category: currentCategory,
        liveTitle: currentLiveTitle,
        adultMode: currentAdultMode,
        watchParty: currentWatchParty,
        drops: currentDrops,
        paidPromotion: currentpaidPromotion,
        isPrime: isPrime,
      };
    } else {
      newLiveStatus[channelId] = {
        live: false,
        currentLiveId: null,
        category: null,
        liveTitle: null,
        adultMode: false,
        watchParty: false,
        drops: false,
        paidPromotion: false,
        isPrime: false,
      };
    }
  }
  return { newStatus: newLiveStatus, notifications };
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
  notificationHistory = [] // 기존 알림 내역을 인자로 받음
) {
  const newPostStatus = { ...prevPostStatus };
  const notifications = [];
  let updatedHistory = [...notificationHistory]; // 수정 가능한 내역 복사본
  let historyWasUpdated = false;

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

      if (isNewPost) {
        // --- 1. 새로운 글 처리 ---
        const postDate = parseChzzkDate(latestPost.createdDate);
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        if (postDate > oneDayAgo) {
          notifications.push(createPostObject(latestPost, channel));
          if (!isPaused && !isCommunityPaused) {
            createPostNotification(latestPost, channel);
          }
        }
      } else if (isEditedPost) {
        // --- 2. 수정된 글 처리 ---
        // notificationHistory에서 해당 글을 찾아 content, attaches를 업데이트
        const historyItem = updatedHistory.find(
          (item) =>
            item.type === "POST" && item.commentId === latestPost.commentId
        );
        if (historyItem) {
          historyItem.content = latestPost.content;
          historyItem.attaches = latestPost.attaches;
          historyItem.isEdited = true; // 수정되었음을 표시하는 플래그 추가
          historyWasUpdated = true;
        }
      }

      // 새로운 상태는 ID와 content, attaches를 모두 저장
      newPostStatus[channelId] = {
        id: latestPost.commentId,
        content: latestPost.content,
        attaches: latestPost.attaches,
      };
    }
  }

  return {
    newStatus: newPostStatus,
    notifications,
    updatedHistory: historyWasUpdated ? updatedHistory : null,
  };
}

// *** 새 라운지 글 확인 함수 ***
async function checkLoungePosts(prevPostStatus = {}, isPaused, isLoungePaused) {
  const newPostStatus = { ...prevPostStatus };
  const notifications = [];
  const boardNumbers = [1, 2, 17, 3, 16]; // 공지사항, 업데이트, 같이보기, 이벤트, 콘텐츠 제작지원
  const postCheckPromises = boardNumbers.map((boardNumber) =>
    getLatestLoungePost(boardNumber).then((latestPost) => ({ latestPost }))
  );

  const results = await Promise.all(postCheckPromises);
  for (const result of results) {
    const { latestPost } = result;
    const lastSeenPostId =
      prevPostStatus[`chzzk-lounge-${latestPost.boardId}`] || null;

    if (latestPost && latestPost.feedId !== lastSeenPostId) {
      const postDate = parseChzzkDate(latestPost.timestamp);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      // 작성된 지 24시간 이내인 글만 알림을 보냄
      if (postDate > oneDayAgo) {
        notifications.push(createLoungeObject(latestPost));

        if (!isPaused && !isLoungePaused) {
          createLoungeNotification(latestPost);
        }
      }
    }
    if (latestPost) {
      newPostStatus[`chzzk-lounge-${latestPost.boardId}`] = latestPost.feedId;
    }
  }
  return { newStatus: newPostStatus, notifications };
}

// *** 새 동영상 확인 및 썸네일 갱신 함수 ***
async function checkUploadedVideos(
  prevVideoStatus = {},
  notificationEnabledChannels,
  notificationHistory = [],
  isPaused,
  isVideoPaused
) {
  const newVideoStatus = { ...prevVideoStatus };
  const notifications = [];
  let updatedHistory = [...notificationHistory];
  let historyWasUpdated = false;

  try {
    const response = await fetch(VIDEO_API_URL);
    const data = await response.json();

    if (data.code === 200 && data.content?.data) {
      for (const video of data.content.data) {
        const { channel, videoNo, videoTitle, thumbnailImageUrl } = video;
        const lastSeenVideoNo = prevVideoStatus[channel.channelId] || 0;

        // --- 1. 새로운 동영상 확인 ---
        if (
          notificationEnabledChannels.has(channel.channelId) &&
          videoNo > lastSeenVideoNo
        ) {
          notifications.push(createVideoObject(video));
          if (!isPaused && !isVideoPaused) {
            createVideoNotification(video);
          }
        }

        if ((newVideoStatus[channel.channelId] || 0) < videoNo) {
          newVideoStatus[channel.channelId] = videoNo;
        }

        // --- 2. 기존 동영상의 썸네일 갱신 확인 ---
        const historyItem = updatedHistory.find(
          (item) => item.type === "VIDEO" && item.videoNo === videoNo
        );

        // historyItem이 존재할 때만 아래 로직을 실행
        if (historyItem) {
          // 1. 썸네일 변경 확인
          if (
            thumbnailImageUrl &&
            historyItem.thumbnailImageUrl !== thumbnailImageUrl
          ) {
            historyItem.thumbnailImageUrl = thumbnailImageUrl;
            historyWasUpdated = true;
          }

          // 2. 동영상 제목 변경 확인
          if (videoTitle && historyItem.content !== videoTitle) {
            historyItem.content = videoTitle;
            historyWasUpdated = true;
          }
        }
      }
    }
  } catch (error) {
    console.error("새 동영상 확인 중 오류:", error);
  }

  // 새 동영상 알림, 갱신된 상태, 그리고 썸네일이 수정된 경우에만 갱신된 전체 내역을 반환
  return {
    newStatus: newVideoStatus,
    notifications,
    updatedHistory: historyWasUpdated ? updatedHistory : null,
  };
}

// --- 최신 커뮤니티 글을 가져오는 함수 ---
async function getLatestCommunityPost(channelId) {
  try {
    const url = `${POST_API_URL_PREFIX}${channelId}/comments?limit=10&offset=0&orderType=DESC&pagingType=PAGE`;
    const response = await fetch(url);
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
    console.error(`[${channelId}] 커뮤니티 글 확인 중 오류:`, error);
    return null;
  }
}

// --- 최신 라운지 글을 가져오는 함수 ---
async function getLatestLoungePost(boardNum) {
  try {
    const url = `${CHZZK_LOUNGE_API_URL_PREFIX}?boardId=${boardNum}`;
    const response = await fetch(url);
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
    console.error(`[${boardNum}] 라운지 글 확인 중 오류:`, error);
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
  const notificationId = `live-${channelId}-${openDate}`;

  let messageContent = liveCategoryValue ? `[${liveCategoryValue}]` : "";
  if (watchPartyTag) messageContent += `[같이보기/${watchPartyTag}]`;
  if (isPrime) messageContent += "[프라임]";
  if (dropsCampaignNo) messageContent += "[드롭스]";
  if (paidPromotion) messageContent += "[AD]";
  messageContent += liveCategoryValue
    ? ` ${decodeHtmlEntities(liveTitle)}`
    : `${decodeHtmlEntities(liveTitle)}`;

  // 1. 브라우저 알림 생성
  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `🔴 ${channelName}님이 라이브 시작!`,
    message: `${formatTimeAgo(openDate)}..\n${messageContent}`,
  });
}

// --- 카테고리 변경 알림 생성 함수 ---
function createCategoryChangeNotification(
  notificationObject,
  oldCategory,
  newCategory
) {
  const { id, channelName, channelImageUrl } = notificationObject;

  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `🔄 ${channelName}님의 카테고리 변경`,
    message: `[${oldCategory || "없음"}] → [${newCategory}]`,
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
  const { id, channelName, channelImageUrl } = notificationObject;

  let oldMessageContent = `[${
    (oldCategory.length > 10
      ? oldCategory.substring(0, 10) + " ..."
      : oldCategory) || "없음"
  }] ${oldLiveTitle || "없음"}`;

  let newMessageContent = `[${
    newCategory.length > 10
      ? newCategory.substring(0, 10) + " ..."
      : newCategory
  }] ${newLiveTitle}`;

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
  });
}

// --- 라이브 객체 생성 함수 ---
function createLiveObject(channel, liveInfo, isPrime) {
  const { channelId, channelName, channelImageUrl } = channel;
  const {
    liveTitle,
    liveCategoryValue,
    openDate,
    dropsCampaignNo,
    watchPartyTag,
    paidPromotion,
  } = liveInfo;
  const notificationId = `live-${channelId}-${openDate}`;

  // 팝업에 표시할 알림 내역 저장
  return {
    id: notificationId,
    type: "LIVE",
    channelId,
    channelName,
    channelImageUrl: channelImageUrl || "../icon_128.png",
    liveTitle,
    liveCategoryValue,
    watchPartyTag,
    dropsCampaignNo,
    paidPromotion,
    isPrime,
    timestamp: openDate,
    read: false,
  };
}

// --- 카테고리 변경 객체 생성 함수 ---
function createCategoryChangeObject(channel, oldCategory, newCategory) {
  const { channelId, channelName, channelImageUrl } = channel;
  const notificationId = `category-${channelId}-${Date.now()}`;

  return {
    id: notificationId,
    type: "CATEGORY",
    channelId,
    channelName,
    channelImageUrl,
    oldCategory,
    newCategory,
    timestamp: new Date(Date.now()).toISOString(),
    read: false,
  };
}

// --- 라이브 19세 연령 제한 변경 객체 생성 함수 ---
function createLiveAdultChangeObject(
  channel,
  currentAdultMode,
  liveTitle,
  liveCategoryValue
) {
  const { channelId, channelName, channelImageUrl } = channel;
  const notificationId = `live-adult-${channelId}-${Date.now()}`;

  return {
    id: notificationId,
    type: "ADULT",
    channelId,
    channelName,
    channelImageUrl,
    liveCategoryValue,
    liveTitle,
    adultMode: currentAdultMode,
    timestamp: new Date(Date.now()).toISOString(),
    read: false,
  };
}

// --- 라이브 제목 변경 객체 생성 함수 ---
function createLiveTitleChangeObject(channel, oldLiveTitle, newLiveTitle) {
  const { channelId, channelName, channelImageUrl } = channel;
  const notificationId = `live-title-${channelId}-${Date.now()}`;

  return {
    id: notificationId,
    type: "LIVETITLE",
    channelId,
    channelName,
    channelImageUrl,
    content: `${oldLiveTitle || "없음"} → ${newLiveTitle}`,
    timestamp: new Date(Date.now()).toISOString(),
    read: false,
  };
}

// --- 카테고리/라이브 제목 변경 객체 생성 함수 ---
function createCategoryAndLiveTitleChangeObject(
  channel,
  oldCategory,
  newCategory,
  oldLiveTitle,
  newLiveTitle
) {
  const { channelId, channelName, channelImageUrl } = channel;
  const notificationId = `category-live-title-${channelId}-${Date.now()}`;

  return {
    id: notificationId,
    type: "CATEGORY/LIVETITLE",
    channelId,
    channelName,
    channelImageUrl,
    oldCategory,
    oldLiveTitle,
    newCategory,
    newLiveTitle,
    timestamp: new Date(Date.now()).toISOString(),
    read: false,
  };
}

// --- 같이보기 설정 객체 생성 함수 ---
function createLiveWatchPartyObject(channel, liveInfo) {
  const { channelId, channelName, channelImageUrl } = channel;
  const { liveTitle, liveCategoryValue, watchPartyTag } = liveInfo;
  const notificationId = `live-watch-party-${channelId}-${Date.now()}`;

  return {
    id: notificationId,
    type: "WATCHPARTY",
    channelId,
    channelName,
    channelImageUrl,
    liveTitle,
    liveCategoryValue,
    watchPartyTag,
    timestamp: new Date(Date.now()).toISOString(),
    read: false,
  };
}

// --- 드롭스 설정 객체 생성 함수 ---
function createLiveDropsObject(channel, liveInfo) {
  const { channelId, channelName, channelImageUrl } = channel;
  const { liveTitle, liveCategoryValue, dropsCampaignNo } = liveInfo;
  const notificationId = `live-drops-${channelId}-${Date.now()}`;

  return {
    id: notificationId,
    type: "DROPS",
    channelId,
    channelName,
    channelImageUrl,
    liveTitle,
    liveCategoryValue,
    dropsCampaignNo,
    timestamp: new Date(Date.now()).toISOString(),
    read: false,
  };
}

// *** 새 글 객체 생성 함수 ***
function createPostObject(post, channel) {
  const { content, attaches } = post;
  const { channelId, channelName, channelImageUrl } = channel;
  const notificationId = `post-${channelId}-${post.commentId}`;

  const hasText = content && content.trim().length > 0;
  const hasAttaches = attaches && attaches.length > 0;

  let messageContent = "";
  let attachLayout = "layout-default";

  if (hasText) {
    if (hasAttaches) {
      messageContent = makeExcerptWithAttaches(content);

      if (
        attaches.length === 1 &&
        messageContent.length < 310 &&
        countParagraphs(messageContent) < 8
      ) {
        attachLayout = "layout-single-big";
      }
      if (
        attaches.length === 2 &&
        messageContent.length < 310 &&
        countParagraphs(messageContent) < 8
      ) {
        attachLayout = "layout-double-medium";
      }
    } else {
      messageContent = makeExcerpt(content);
    }
  }

  // 팝업에 표시할 알림 내역 저장
  return {
    id: notificationId,
    type: "POST",
    channelId,
    channelName,
    channelImageUrl: channelImageUrl || "../icon_128.png",
    commentId: post.commentId,
    content,
    excerpt: messageContent,
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
    title,
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
    videoCategoryValue,
    thumbnailImageUrl,
    publishDate,
    adult,
  } = video;
  const notificationId = `video-${videoNo}`;

  // 팝업에 표시할 알림 내역 저장
  return {
    id: notificationId,
    type: "VIDEO",
    videoNo,
    videoType,
    videoCategoryValue,
    channelName: channel.channelName,
    channelId: channel.channelId,
    channelImageUrl: channel.channelImageUrl || "../icon_128.png",
    thumbnailImageUrl: thumbnailImageUrl,
    content: videoTitle,
    adult,
    timestamp: publishDate,
    read: false,
  };
}

async function checkBanners(prevSeenBanners = [], isPaused, isBannerPaused) {
  const notifications = [];
  try {
    const response = await fetch(CHZZK_BANNER_API_URL);
    const data = await response.json();

    if (data.code === 200 && data.content?.banners) {
      const currentBanners = data.content.banners;
      const seenSet = new Set(
        prevSeenBanners.map((b) => `${b.bannerNo}-${b.scheduledDate}`)
      );

      for (const banner of currentBanners) {
        const bannerKey = `${banner.bannerNo}-${banner.scheduledDate}`;

        if (!seenSet.has(bannerKey)) {
          notifications.push(createBannerObject(banner));
          if (!isPaused && !isBannerPaused) {
            createBannerNotification(banner);
          }
        }
      }

      const newSeenBanners = currentBanners.map((b) => ({
        bannerNo: b.bannerNo,
        scheduledDate: b.scheduledDate,
      }));

      return { newStatus: newSeenBanners, notifications };
    }
  } catch (error) {
    console.error("배너 확인 중 오류:", error);
  }
  return { newStatus: prevSeenBanners, notifications }; // 오류 시 이전 상태 유지
}

function createBannerNotification(banner) {
  const { bannerNo, ad, imageUrl, title, subCopy, scheduledDate } = banner;

  let messageContent = "";

  if (ad) messageContent += "[광고]";
  messageContent += `${title}\n${subCopy}\n${scheduledDate}`;

  chrome.notifications.create(`banner-${bannerNo}`, {
    type: "basic",
    iconUrl: imageUrl || "icon_128.png",
    title: `📢 치지직 배너 안내`,
    message: messageContent,
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

  const notificationId = `banner-${bannerNo}`;

  return {
    id: notificationId,
    bannerNo,
    type: "BANNER",
    ad,
    imageUrl,
    lightThemeImageUrl,
    landingUrl,
    title,
    subCopy,
    scheduledDate,
    timestamp: new Date(Date.now()).toISOString(),
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
          targetUrl = `https://chzzk.naver.com/live/${item.channelId}`;
          break;
        case "POST":
          targetUrl = `https://chzzk.naver.com/${item.channelId}/community/detail/${item.commentId}`;
          break;
        case "VIDEO":
          targetUrl = `https://chzzk.naver.com/video/${item.videoNo}`;
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

// --- 알림 클릭 이벤트 핸들러 ---
chrome.notifications.onClicked.addListener((notificationId) => {
  handleNotificationClick(notificationId);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // content.js로부터 로그인 상태 변경 신호를 받으면 즉시 상태 확인
  if (request.type === "LOGIN_STATE_CHANGED") {
    // 1분 알람을 기다리지 않고 즉시 함수를 실행
    checkFollowedChannels();
  }

  if (request.type === "UPDATE_BADGE") {
    updateUnreadCountBadge();
  }

  // *** 팝업의 알림 클릭 요청 처리 ***
  if (request.type === "NOTIFICATION_CLICKED") {
    handleNotificationClick(request.notificationId);
    // 응답이 필요 없는 단방향 메시지
  }

  // *** 버전 확인 요청 핸들러 ***
  if (request.type === "GET_VERSION") {
    sendResponse({ version: chrome.runtime.getManifest().version });
    return true; // 비동기 응답을 위해 true 반환
  }
});
