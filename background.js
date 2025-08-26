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

const CHECK_ALARM_NAME = "chzzkAllCheck";

// *** 실행 잠금을 위한 전역 변수 ***
let isChecking = false;
const HISTORY_LIMIT = 50;

// --- 확장 프로그램 설치 시 알람 생성 ---
chrome.runtime.onInstalled.addListener((details) => {
  chrome.alarms.create(CHECK_ALARM_NAME, {
    periodInMinutes: 1,
    when: Date.now() + 1000,
  });

  // '업데이트' 시에만 실행되는 로직
  if (details.reason === "update") {
    updateUnreadCountBadge();

    // 비동기 작업을 위한 즉시 실행 함수
    (async () => {
      const targetUrl = "https://chzzk.naver.com/*";
      try {
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
    })();
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
    if (data.code !== 200) {
      if (data.code === 401) {
        chrome.action.setIcon({ path: "icon_disabled.png" });
        chrome.action.setBadgeText({ text: "X" });
        chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
      }
      return;
    }

    chrome.action.setIcon({ path: "icon_128.png" });

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
      "notificationHistory",
      "isPaused",
      "isLivePaused",
      "isCategoryPaused",
      "isLiveTitlePaused",
      "isRestrictPaused",
      "isVideoPaused",
      "isCommunityPaused",
      "isLoungePaused",
    ]);
    const isPaused = prevState.isPaused || false;
    const isLivePaused = prevState.isLivePaused || false;
    const isCategoryPaused = prevState.isCategoryPaused || false;
    const isLiveTitlePaused = prevState.isLiveTitlePaused || false;
    const isRestrictPaused = prevState.isRestrictPaused || false;
    const isVideoPaused = prevState.isVideoPaused || false;
    const isCommunityPaused = prevState.isCommunityPaused || false;
    const isLoungePaused = prevState.isLoungePaused || false;

    // 1. 모든 확인 작업을 병렬로 실행하고, "새로운 알림 내역"과 "새로운 상태"를 반환받음
    const results = await Promise.all([
      checkLiveStatus(
        followingList,
        prevState.liveStatus,
        isPaused,
        isLivePaused,
        isCategoryPaused,
        isLiveTitlePaused,
        isRestrictPaused
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
    ]);

    // 2. 각 작업의 결과를 취합
    const liveResult = results[0];
    const postResult = results[1];
    const videoResult = results[2];
    const loungeResult = results[3];

    // 2-1. 새로 발생한 알림들을 모두 모음
    const newNotifications = [
      ...liveResult.notifications,
      ...postResult.notifications,
      ...videoResult.notifications,
      ...loungeResult.notifications,
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
      notificationHistory: finalHistory, // 썸네일 갱신과 새 알림이 모두 반영된 최종본
    });

    // 4. 새 알림이 있거나 썸네일 갱신이 있었을 경우 배지를 업데이트
    if (newNotifications.length > 0 || videoResult.updatedHistory) {
      await updateUnreadCountBadge();
    }
  } catch (error) {
    console.error("팔로우 채널 확인 중 오류 발생:", error);
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
  isRestrictPaused
) {
  const newLiveStatus = {};
  const notifications = [];

  for (const item of followingList) {
    const { channel, streamer } = item;
    const channelId = channel.channelId;
    const wasLive = prevLiveStatus[channelId]?.live || false;
    const prevCategory = prevLiveStatus[channelId]?.category || null;
    const prevLiveTitle = prevLiveStatus[channelId]?.liveTitle || null;
    const prevAdultMode = prevLiveStatus[channelId]?.adultMode || false;
    const isNowLive = streamer.openLive;

    if (isNowLive) {
      // 라이브 중인 채널의 상세 정보를 가져옴
      const liveStatusResponse = await fetch(
        `${LIVE_STATUS_API_PREFIX}${channelId}/live-status`
      );
      const liveStatusData = await liveStatusResponse.json();
      const currentCategory = liveStatusData.content?.liveCategoryValue;
      const currentLiveTtitle = liveStatusData.content?.liveTitle;
      const currentAdultMode = liveStatusData.content?.adult;

      const isNewLiveEvent =
        !wasLive && channel.personalData.following.notification;

      if (isNewLiveEvent) {
        // 1. 방송 시작 알림
        notifications.push(createLiveObject(channel, liveStatusData.content));

        if (!isPaused && !isLivePaused) {
          createLiveNotification(channel, liveStatusData.content);
        }
      } else if (
        prevCategory &&
        wasLive &&
        currentCategory &&
        currentCategory !== prevCategory &&
        prevLiveTitle &&
        currentLiveTtitle &&
        currentLiveTtitle !== prevLiveTitle &&
        channel.personalData.following.notification
      ) {
        notifications.push(
          createCategoryAndLiveTitleChangeObject(
            channel,
            prevCategory,
            currentCategory,
            prevLiveTitle,
            currentLiveTtitle
          )
        );

        if (!isPaused && !isCategoryPaused && !isLiveTitlePaused) {
          createCategoryAndLiveTitleChangeNotification(
            channel,
            prevCategory,
            currentCategory,
            prevLiveTitle,
            currentLiveTtitle
          );
        }
      } else {
        // 2. 카테고리 변경 알림
        if (
          prevCategory &&
          wasLive &&
          currentCategory &&
          currentCategory !== prevCategory &&
          channel.personalData.following.notification
        ) {
          notifications.push(
            createCategoryChangeObject(channel, prevCategory, currentCategory)
          );

          if (!isPaused && !isCategoryPaused) {
            createCategoryChangeNotification(
              channel,
              prevCategory,
              currentCategory
            );
          }
        }
        // 3. 라이브 제목 변경 알림
        if (
          prevLiveTitle &&
          wasLive &&
          currentLiveTtitle &&
          currentLiveTtitle !== prevLiveTitle &&
          channel.personalData.following.notification
        ) {
          notifications.push(
            createLiveTitleChangeObject(
              channel,
              prevLiveTitle,
              currentLiveTtitle
            )
          );

          if (!isPaused && !isLiveTitlePaused) {
            createLiveTitleChangeNotification(
              channel,
              prevLiveTitle,
              currentLiveTtitle
            );
          }
        }
        // 4. 19세 연령 제한 변경 알림
        if (
          wasLive &&
          currentAdultMode !== prevAdultMode &&
          channel.personalData.following.notification
        ) {
          notifications.push(
            createLiveAdultChangeObject(
              channel,
              currentAdultMode,
              liveStatusData.content.liveTitle,
              liveStatusData.content.liveCategoryValue
            )
          );

          if (!isPaused && !isRestrictPaused) {
            createLiveAdultChangeNotification(
              channel,
              currentAdultMode,
              liveStatusData.content
            );
          }
        }
      }
      newLiveStatus[channelId] = {
        live: true,
        category: currentCategory,
        liveTitle: currentLiveTtitle,
        adultMode: currentAdultMode,
      };
    } else {
      newLiveStatus[channelId] = {
        live: false,
        category: null,
        liveTitle: null,
        adultMode: false,
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
        const { channel, videoNo, thumbnailImageUrl } = video;
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
        if (
          historyItem &&
          thumbnailImageUrl &&
          historyItem.thumbnailImageUrl !== thumbnailImageUrl
        ) {
          historyItem.thumbnailImageUrl = thumbnailImageUrl;
          historyWasUpdated = true;
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
function createLiveNotification(channel, liveInfo) {
  const { channelId, channelName, channelImageUrl } = channel;
  const { liveTitle, liveCategoryValue, openDate } = liveInfo;
  const notificationId = `live-${channelId}-${openDate}`;

  // 1. 브라우저 알림 생성
  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `🔴 ${channelName}님이 라이브 시작!`,
    message: `${formatTimeAgo(
      openDate
    )}..\n[${liveCategoryValue}] ${liveTitle}`,
  });
}

// --- 카테고리 변경 알림 생성 함수 ---
function createCategoryChangeNotification(channel, oldCategory, newCategory) {
  const { channelId, channelName, channelImageUrl } = channel;
  const notificationId = `category-${channelId}-${Date.now()}`;

  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `🔄 ${channelName}님의 카테고리 변경`,
    message: `[${oldCategory || "없음"}] → [${newCategory}]`,
  });
}

// --- 라이브 제목 변경 알림 생성 함수 ---
function createLiveTitleChangeNotification(
  channel,
  oldLiveTitle,
  newLiveTitle
) {
  const { channelId, channelName, channelImageUrl } = channel;
  const notificationId = `live-title-${channelId}-${Date.now()}`;

  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `🔄 ${channelName}님의 라이브 제목 변경`,
    message: `${oldLiveTitle || "없음"} → ${newLiveTitle}`,
  });
}

// --- 카테고리/라이브 제목 변경 알림 생성 함수 ---
function createCategoryAndLiveTitleChangeNotification(
  channel,
  oldCategory,
  newCategory,
  oldLiveTitle,
  newLiveTitle
) {
  const { channelId, channelName, channelImageUrl } = channel;
  const notificationId = `category-live-title-${channelId}-${Date.now()}`;

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
      ? oldMessageContent.substring(0, 20) + " ..."
      : oldMessageContent;

  newMessageContent =
    newMessageContent.length > 20
      ? newMessageContent.substring(0, 20) + " ..."
      : newMessageContent;

  const messageContent = `${oldMessageContent} → ${newMessageContent}`;

  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: `🔄 ${channelName}님의 카테고리&제목 변경`,
    message: messageContent,
  });
}

// --- 라이브 19세 연령 제한 변경 알림 생성 함수 ---
function createLiveAdultChangeNotification(
  channel,
  currentAdultMode,
  liveInfo
) {
  const { channelId, channelName, channelImageUrl } = channel;
  const { liveTitle, liveCategoryValue } = liveInfo;
  const notificationId = `live-adult-${channelId}-${Date.now()}`;

  const title = currentAdultMode
    ? `🔞 ${channelName}님의 연령 제한 설정`
    : `✅ ${channelName}님의 연령 제한 해제`;
  const message = currentAdultMode
    ? "19세 연령 제한 설정을 했어요"
    : "19세 연령 제한을 해제했어요";

  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: channelImageUrl || "icon_128.png",
    title: title,
    message: `${channelName}님이 ${message}\n[${liveCategoryValue}] ${liveTitle}`,
  });
}

// *** 새 글 알림 생성 함수 ***
function createPostNotification(post, channel) {
  const { channelId, channelName, channelImageUrl } = channel;
  const notificationId = `post-${channelId}-${post.commentId}`;

  // 1. 브라우저 알림 생성
  let messageContent = post.content;

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

  let messageContent = videoTitle;

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
function createLiveObject(channel, liveInfo) {
  const { channelId, channelName, channelImageUrl } = channel;
  const { liveTitle, liveCategoryValue, openDate } = liveInfo;
  const notificationId = `live-${channelId}-${openDate}`;

  // 팝업에 표시할 알림 내역 저장
  return {
    id: notificationId,
    type: "LIVE",
    channelId,
    channelName,
    channelImageUrl: channelImageUrl || "../icon_128.png",
    content: `<span id="live-category">${liveCategoryValue}</span> ${liveTitle}`,
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
    content: `<span id="live-category">${
      oldCategory || "없음"
    }</span> → <span id="live-category">${newCategory}</span>`,
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
    content: `<span id="live-category">${liveCategoryValue}</span> ${liveTitle}`,
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
    content: `<span id="live-category">${oldCategory || "없음"}</span> ${
      oldLiveTitle || "없음"
    } → <span id="live-category">${newCategory}</span> ${newLiveTitle}`,
    timestamp: new Date(Date.now()).toISOString(),
    read: false,
  };
}

// *** 새 글 객체 생성 함수 ***
function createPostObject(post, channel) {
  const { channelId, channelName, channelImageUrl } = channel;
  const notificationId = `post-${channelId}-${post.commentId}`;

  // 팝업에 표시할 알림 내역 저장
  return {
    id: notificationId,
    type: "POST",
    channelId,
    channelName,
    channelImageUrl: channelImageUrl || "../icon_128.png",
    commentId: post.commentId,
    content: post.content,
    attaches: post.attaches,
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
    channelName,
    boardId,
    feedId,
    feedLink,
    channelImageUrl: channelImageUrl || "../icon_128.png",
    content: `<span id="lounge-board">${boardName}</span> ${title}`,
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
