const GET_USER_STATUS_API =
  "https://comm-api.game.naver.com/nng_main/v1/user/getUserStatus";
const CHZZK_CATEGORY_URL = "https://chzzk.naver.com/category/ALL";
const CHZZK_WATCHPARTY_URL = "https://chzzk.naver.com/watchparty/";

const allSVG = `<svg width="15" height="15" viewBox="0 0 355 218" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <rect width="355" height="218" fill="url(#pattern0_13_54)"></rect>
              <defs>
                <pattern id="pattern0_13_54" patternContentUnits="objectBoundingBox" width="1" height="1">
                  <use xlink:href="#image0_13_54" transform="matrix(0.0028169 0 0 0.00458716 -0.198042 -0.63034)"></use>
                </pattern>
                <image id="image0_13_54" width="500" height="500" preserveAspectRatio="none" xlink:href="../svg_texture/all_texture.png"/>
              </defs>
            </svg>`;
const liveOnSVG = `<svg width="15" height="15" viewBox="0 0 359 359" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <rect width="359" height="359" fill="url(#pattern0_11_51)"></rect>
              <defs>
                <pattern id="pattern0_11_51" patternContentUnits="objectBoundingBox" width="1" height="1">
                  <use xlink:href="#image0_11_51" transform="translate(-0.192505 -0.198621) scale(0.00278552)"></use>
                </pattern>
                <image id="image0_11_51" width="500" height="500" preserveAspectRatio="none" xlink:href="../svg_texture/live_on_texture.png" />
              </defs>
            </svg>`;
const liveOffSVG = `<svg width="15" height="15" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <g clip-path="url(#clip0_15_89)">
                <rect x="-32" y="15" width="863" height="770" fill="url(#pattern0_15_89)"></rect>
              </g>
              <defs>
                <pattern id="pattern0_15_89" patternContentUnits="objectBoundingBox" width="1" height="1">
                  <use xlink:href="#image0_15_89" transform="matrix(0.00100618 0 0 0.00112755 -1.60626 0.0503178)"></use>
                </pattern>
                <clipPath id="clip0_15_89">
                  <rect width="800" height="800" fill="white"></rect>
                </clipPath>
                <image id="image0_15_89" width="3072" height="2048" preserveAspectRatio="none" xlink:href="../svg_texture/live_off_texture.png" />
              </defs>
            </svg>`;
const liveChangeSVG = `<svg width="15" height="15" viewBox="0 0 1500 1500" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <rect width="1500" height="1500" fill="url(#pattern0_2_69)"></rect>
              <defs>
                <pattern id="pattern0_2_69" patternContentUnits="objectBoundingBox" width="1" height="1">
                  <use xlink:href="#image0_2_69" transform="scale(0.000666667)"></use>
                </pattern>
                <image id="image0_2_69" width="1500" height="1500" preserveAspectRatio="none" xlink:href="../svg_texture/live_change_texture.png"/>
              </defs>
            </svg>`;
const watchPartySVG = `<svg width="15" height="15" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <rect x="19" y="15" width="781" height="770" fill="url(#pattern0_17_264)"></rect>
              <defs>
                <pattern id="pattern0_17_264" patternContentUnits="objectBoundingBox" width="1" height="1">
                  <use xlink:href="#image0_17_264" transform="matrix(0.00102376 0 0 0.00103824 -0.321363 -0.0371193)"></use>
                </pattern>
                <image id="image0_17_264" width="3072" height="2048" preserveAspectRatio="none" xlink:href="../svg_texture/watch_party_texture.png"/>
              </defs>
            </svg>`;
const dropsSVG = `<svg width="15" height="15" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <g clip-path="url(#clip0_16_232)">
                <rect x="0.162323" width="32" height="32" fill="url(#pattern0_16_232)"></rect>
              </g>
              <defs>
                <pattern id="pattern0_16_232" patternContentUnits="objectBoundingBox" width="1" height="1">
                  <use xlink:href="#image0_16_232" transform="scale(0.000976562)"></use>
                </pattern>
                <clipPath id="clip0_16_232">
                  <rect width="32" height="32" fill="white"></rect>
                </clipPath>
                <image id="image0_16_232" width="1024" height="1024" preserveAspectRatio="none" xlink:href="../svg_texture/drops_texture.png"/>
              </defs>
            </svg>`;
const partyStartSVG = `<svg width="15" height="15" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <g clip-path="url(#clip0_15_113)">
                <rect x="-11" y="15" width="821" height="770" fill="url(#pattern0_15_113)"></rect>
              </g>
              <defs>
                <pattern id="pattern0_15_113" patternContentUnits="objectBoundingBox" width="1" height="1">
                  <use xlink:href="#image0_15_113" transform="matrix(0.00089898 0 0 0.000958388 -0.202515 -0.0250543)"></use>
                </pattern>
                <clipPath id="clip0_15_113">
                  <rect width="800" height="800" fill="white"></rect>
                </clipPath>
                <image id="image0_15_113" width="3072" height="2048" preserveAspectRatio="none" xlink:href="../svg_texture/party_start_texture.png"/>
              </defs>
            </svg>`;
const partyEndSVG = `<svg width="15" height="15" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <rect x="19" y="15" width="781" height="770" fill="url(#pattern0_15_107)"></rect>
              <defs>
                <pattern id="pattern0_15_107" patternContentUnits="objectBoundingBox" width="1" height="1">
                  <use xlink:href="#image0_15_107" transform="matrix(0.000703309 0 0 0.000713357 -0.232243 0.0210555)"></use>
                </pattern>
                <image id="image0_15_107" width="4096" height="2838" preserveAspectRatio="none" xlink:href="../svg_texture/party_end_texture.png"/>
              </defs>
            </svg>`;
const partyLiveHostSVG = `<svg width="10" height="10" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="
                  vertical-align: text-bottom;
              ">
                <rect x="19" y="15" width="781" height="770" fill="url(#pattern0_21_63_live)"></rect>
                <defs>
                  <pattern id="pattern0_21_63_live" patternContentUnits="objectBoundingBox" width="1" height="1">
                    <use xlink:href="#image0_21_63_live" transform="matrix(0.00101732 0 0 0.00103171 -0.277727 0.00458562)"></use>
                  </pattern>
                  <image id="image0_21_63_live" width="3072" height="2048" preserveAspectRatio="none" xlink:href="../svg_texture/party_host_texture.png"></image>
                </defs>
              </svg>`;
const partyHostSVG = `<svg width="10" height="10" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="
                  vertical-align: text-bottom;
              ">
                <rect x="19" y="15" width="781" height="770" fill="url(#pattern0_21_63)"></rect>
                <defs>
                  <pattern id="pattern0_21_63" patternContentUnits="objectBoundingBox" width="1" height="1">
                    <use xlink:href="#image0_21_63" transform="matrix(0.00101732 0 0 0.00103171 -0.277727 0.00458562)"></use>
                  </pattern>
                  <image id="image0_21_63" width="3072" height="2048" preserveAspectRatio="none" xlink:href="../svg_texture/party_host_texture.png"></image>
                </defs>
              </svg>`;
const partyDonationStartSVG = `<svg width="15" height="15" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <rect x="19" y="15" width="781" height="770" fill="url(#pattern0_15_95)"></rect>
              <defs>
                <pattern id="pattern0_15_95" patternContentUnits="objectBoundingBox" width="1" height="1">
                  <use xlink:href="#image0_15_95" transform="matrix(0.000953885 0 0 0.000967375 -0.239418 -0.96682)"></use>
                </pattern>
                <image id="image0_15_95" width="3072" height="2048" preserveAspectRatio="none" xlink:href="../svg_texture/party_donation_start_texture.png"/>
              </defs>
            </svg>`;
const partyDonationEndSVG = `<svg width="15" height="15" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <g clip-path="url(#clip0_15_92)">
                <rect x="-30" y="15" width="859" height="770" fill="url(#pattern0_15_92)"></rect>
              </g>
              <defs>
                <pattern id="pattern0_15_92" patternContentUnits="objectBoundingBox" width="1" height="1">
                  <use xlink:href="#image0_15_92" transform="matrix(0.000749277 0 0 0.000835765 -1.21256 0.0717412)"></use>
                </pattern>
                <clipPath id="clip0_15_92">
                  <rect width="800" height="800" fill="white"></rect>
                </clipPath>
                <image id="image0_15_92" width="3072" height="2048" preserveAspectRatio="none" xlink:href="../svg_texture/party_donation_end_texture.png"/>
              </defs>
            </svg>`;
const restrictOnSVG = `<svg width="15" height="15" viewBox="0 0 394 394" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <rect width="394" height="394" fill="url(#pattern0_12_52)"></rect>
              <defs>
                <pattern id="pattern0_12_52" patternContentUnits="objectBoundingBox" width="1" height="1">
                  <use xlink:href="#image0_12_52" transform="translate(-0.135347 -0.137885) scale(0.00253807)"></use>
                </pattern>
                <image id="image0_12_52" width="500" height="500" preserveAspectRatio="none" xlink:href="../svg_texture/restrict_on_texture.png"/>
              </defs>
            </svg>`;
const restrictOffSVG = `<svg width="15" height="15" viewBox="0 0 1200 1200" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect width="1200" height="1200" fill="url(#pattern0_8_45)"/>
<defs>
<pattern id="pattern0_8_45" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_8_45" transform="scale(0.000833333)"/>
</pattern>
<image id="image0_8_45" width="1200" height="1200" preserveAspectRatio="none" xlink:href="../svg_texture/restrict_off_texture.png"/>
</defs>
</svg>
`;
const replaySVG = `<svg width="15" height="15" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <rect y="15" width="800" height="770" fill="url(#pattern0_16_116)" style="transform: translateY(10px);"></rect>
              <defs>
                <pattern id="pattern0_16_116" patternContentUnits="objectBoundingBox" width="1" height="1">
                  <use xlink:href="#image0_16_116" transform="matrix(0.00100196 0 0 0.00104085 -0.317484 0.00469463)"></use>
                </pattern>
                <image id="image0_16_116" width="3072" height="2048" preserveAspectRatio="none" xlink:href="../svg_texture/replay_texture.png"/>
              </defs>
            </svg>`;
const uploadSVG = `<svg width="15" height="15" viewBox="0 0 1500 1500" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <rect width="1500" height="1500" fill="url(#pattern0_2_166)"></rect>
              <defs>
                <pattern id="pattern0_2_166" patternContentUnits="objectBoundingBox" width="1" height="1">
                  <use xlink:href="#image0_2_166" transform="scale(0.000666667)"></use>
                </pattern>
                <image id="image0_2_166" width="1500" height="1500" preserveAspectRatio="none" xlink:href="../svg_texture/upload_texture.png"/>
              </defs>
            </svg>`;
const communitySVG = `<svg
              width="15"
              height="15"
              viewBox="0 0 1500 1500"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
            >
              <rect width="1500" height="1500" fill="url(#pattern0_32_64)" />
              <defs>
                <pattern
                  id="pattern0_32_64"
                  patternContentUnits="objectBoundingBox"
                  width="1"
                  height="1"
                >
                  <use
                    xlink:href="#image0_32_64"
                    transform="scale(0.000666667)"
                  />
                </pattern>
                <image
                  id="image0_32_64"
                  width="1500"
                  height="1500"
                  preserveAspectRatio="none"
                  xlink:href="../svg_texture/community_texture.png"
                />
              </defs>
            </svg>`;
const loungeSVG = `<svg width="15" height="15" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <rect x="19" y="15" width="781" height="770" fill="url(#pattern0_15_110)" style="transform: translate(-20px, -20px);"></rect>
              <defs>
                <pattern id="pattern0_15_110" patternContentUnits="objectBoundingBox" width="1" height="1">
                  <use xlink:href="#image0_15_110" transform="matrix(0.00182378 0 0 0.00184957 -0.169575 0.0368672)"></use>
                </pattern>
                <image id="image0_15_110" width="1536" height="1024" preserveAspectRatio="none" xlink:href="../svg_texture/lounge_texture.png"/>
              </defs>
            </svg>`;
const bannerSVG = `<svg
              width="15"
              height="15"
              viewBox="0 0 1200 1200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
            >
              <g clip-path="url(#clip0_32_87)">
                <rect width="1200" height="1200" fill="url(#pattern0_32_87)" />
              </g>
              <defs>
                <pattern
                  id="pattern0_32_87"
                  patternContentUnits="objectBoundingBox"
                  width="1"
                  height="1"
                >
                  <use
                    xlink:href="#image0_32_87"
                    transform="scale(0.000833333)"
                  />
                </pattern>
                <clipPath id="clip0_32_87">
                  <rect width="1200" height="1200" fill="white" />
                </clipPath>
                <image
                  id="image0_32_87"
                  width="1200"
                  height="1200"
                  preserveAspectRatio="none"
                  xlink:href="../svg_texture/banner_texture.png"
                />
              </defs>
            </svg>`;
const logPowerTitleSVG = `<svg
              width="15"
              height="15"
              viewBox="0 0 72 72"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
            >
              <rect width="72" height="72" fill="url(#pattern0_43_657)"></rect>
              <defs>
                <pattern
                  id="pattern0_43_657"
                  patternContentUnits="objectBoundingBox"
                  width="1"
                  height="1"
                >
                  <use
                    xlink:href="#image0_43_657"
                    transform="scale(0.0138889)"
                  ></use>
                </pattern>
                <image
                  id="image0_43_657"
                  width="72"
                  height="72"
                  preserveAspectRatio="none"
                  xlink:href="../svg_texture/log_power_texture.png"
                ></image>
              </defs>
            </svg>`;
const logPowerPredictionStartSVG = `
            <svg
              width="20"
              height="20"
              viewBox="0 0 256 256"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
            >
              <rect width="256" height="256" fill="url(#pattern0_63_101)" />
              <defs>
                <pattern
                  id="pattern0_63_101"
                  patternContentUnits="objectBoundingBox"
                  width="1"
                  height="1"
                >
                  <use
                    xlink:href="#image0_63_101"
                    transform="scale(0.00390625)"
                  />
                </pattern>
                <image
                  id="image0_63_101"
                  width="256"
                  height="256"
                  preserveAspectRatio="none"
                  xlink:href="../svg_texture/log_power_prediction_start_texture.png"
                />
              </defs>
            </svg>
            `;
const logPowerPredictionEndSVG = `
<svg
              width="20"
              height="20"
              viewBox="0 0 256 256"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
            >
              <rect width="256" height="256" fill="url(#pattern0_63_98)" />
              <defs>
                <pattern
                  id="pattern0_63_98"
                  patternContentUnits="objectBoundingBox"
                  width="1"
                  height="1"
                >
                  <use
                    xlink:href="#image0_63_98"
                    transform="scale(0.00390625)"
                  />
                </pattern>
                <image
                  id="image0_63_98"
                  width="256"
                  height="256"
                  preserveAspectRatio="none"
                  xlink:href="../svg_texture/log_power_prediction_end_texture.png"
                />
              </defs>
            </svg>
`;
const logPowerPredictionVersusSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 17" fill="none" class="live_chatting_prediction_message_icon_vs__brb1n" style="
    color: #168f5c;
"><path fill="currentColor" d="M10.674 5.65c.936 0 1.673.198 2.21.593.54.396.856.935.946 1.617l-1.882.116a.974.974 0 0 0-.208-.434 1.102 1.102 0 0 0-.42-.314 1.426 1.426 0 0 0-.613-.121c-.318 0-.587.068-.806.203-.218.132-.328.309-.328.53 0 .177.07.327.212.45.142.122.385.22.729.294l1.342.27c.72.148 1.258.386 1.612.714.354.329.53.76.53 1.294 0 .486-.142.912-.429 1.279-.283.366-.672.653-1.168.859-.492.203-1.06.304-1.703.304-.982 0-1.764-.205-2.346-.613a2.506 2.506 0 0 1-.593-.585l.217-.62.181-.518 1.199-.063c.06.3.209.528.444.686.235.154.535.231.902.231.36 0 .65-.07.87-.207.221-.142.334-.324.337-.546a.568.568 0 0 0-.237-.458c-.154-.123-.392-.216-.714-.28l-1.284-.256a3.965 3.965 0 0 1-1.077-.364l1.407-4.024c.212-.025.435-.037.67-.037ZM9.498 3.7l-2.591 7.412H4.59L2 3.7H4.17l1.54 5.304h.077L7.322 3.7h2.176Z"></path></svg>
`;
const addBookmarkSVG = `<svg class="chzzk-bookmark-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.8203 2H7.18031C5.05031 2 3.32031 3.74 3.32031 5.86V19.95C3.32031 21.75 4.61031 22.51 6.19031 21.64L11.0703 18.93C11.5903 18.64 12.4303 18.64 12.9403 18.93L17.8203 21.64C19.4003 22.52 20.6903 21.76 20.6903 19.95V5.86C20.6803 3.74 18.9503 2 16.8203 2ZM14.5003 11.4H12.7503V13.21C12.7503 13.62 12.4103 13.96 12.0003 13.96C11.5903 13.96 11.2503 13.62 11.2503 13.21V11.4H9.50031C9.09031 11.4 8.75031 11.06 8.75031 10.65C8.75031 10.24 9.09031 9.9 9.50031 9.9H11.2503V8.21C11.2503 7.8 11.5903 7.46 12.0003 7.46C12.4103 7.46 12.7503 7.8 12.7503 8.21V9.9H14.5003C14.9103 9.9 15.2503 10.24 15.2503 10.65C15.2503 11.06 14.9103 11.4 14.5003 11.4Z" fill="#292D32"></path>
</svg>`;

function makeCheeseSVG(uniqueId = Math.random().toString(36).slice(2)) {
  const pid = `pattern0_15_110_${uniqueId}`;
  const iid = `image0_15_110_${uniqueId}`;
  return `
  <svg width="15" height="14" viewBox="0 0 800 800" fill="none" style="vertical-align: text-bottom;"
       xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <rect x="19" y="15" width="781" height="770" fill="url(#${pid})" style="transform: translate(-20px, -20px)"></rect>
    <defs>
      <pattern id="${pid}" patternContentUnits="objectBoundingBox" width="1" height="1">
        <use xlink:href="#${iid}" transform="matrix(0.00182378 0 0 0.00184957 -0.169575 0.0368672)"></use>
      </pattern>
      <image id="${iid}" width="1536" height="1296" preserveAspectRatio="none"
             xlink:href="../svg_texture/lounge_texture.png"/>
    </defs>
  </svg>`;
}

function makeLogPowerSVG() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="live_chatting_popup_my_profile_icon_power__laD+4"><mask id="mask0_4502_4387" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16" style="mask-type: alpha;"><path d="M6.79453 2.43359C7.09254 2.43374 7.36838 2.58075 7.53476 2.82161L7.59921 2.93099L8.91692 5.56641H5.98333L5.82643 5.25326L5.06796 3.73568C4.76891 3.13737 5.20381 2.43379 5.87265 2.43359H6.79453Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M12.1484 4.43359C13.0053 4.43359 13.6561 5.0624 14.0599 5.80273C14.4754 6.5645 14.7148 7.57802 14.7148 8.66667C14.7148 9.75531 14.4754 10.7688 14.0599 11.5306C13.6561 12.2709 13.0053 12.8997 12.1484 12.8997H4C3.14314 12.8997 2.49236 12.2709 2.08854 11.5306C1.67304 10.7688 1.43359 9.75531 1.43359 8.66667C1.43359 7.57802 1.67304 6.5645 2.08854 5.80273C2.49236 5.0624 3.14314 4.43359 4 4.43359H12.1484ZM4 5.56641C3.75232 5.56641 3.40334 5.75848 3.08333 6.34505C2.77498 6.91036 2.56641 7.73027 2.56641 8.66667C2.56641 9.60306 2.77498 10.423 3.08333 10.9883C3.40334 11.5749 3.75232 11.7669 4 11.7669C4.24767 11.7669 4.59666 11.5749 4.91667 10.9883C5.22502 10.423 5.43359 9.60306 5.43359 8.66667C5.43359 7.73027 5.22502 6.91036 4.91667 6.34505C4.59666 5.75848 4.24767 5.56641 4 5.56641ZM6.52604 9.43359C6.48364 9.83162 6.40829 10.2124 6.30404 10.5664H11.6667L11.7246 10.5638C12.0104 10.5348 12.2331 10.2934 12.2331 10C12.2331 9.7066 12.0104 9.46522 11.7246 9.4362L11.6667 9.43359H6.52604ZM6.28385 6.70052C6.39253 7.05354 6.47186 7.43444 6.51823 7.83333H7.33333L7.39128 7.83073C7.67694 7.80172 7.89962 7.56022 7.89974 7.26693C7.89974 6.97353 7.67701 6.73215 7.39128 6.70312L7.33333 6.70052H6.28385ZM9.60026 6.70052C9.2873 6.70052 9.0332 6.95397 9.0332 7.26693C9.03333 7.57978 9.28738 7.83333 9.60026 7.83333H13.5228C13.4637 7.41061 13.3619 7.02765 13.2298 6.70052H9.60026Z" fill="currentColor"></path><path d="M5.43359 8.66667C5.43359 7.73027 5.22502 6.91036 4.91667 6.34505C4.59666 5.75848 4.24767 5.56641 4 5.56641C3.75232 5.56641 3.40334 5.75848 3.08333 6.34505C2.77498 6.91036 2.56641 7.73027 2.56641 8.66667C2.56641 9.60306 2.77498 10.423 3.08333 10.9883C3.40334 11.5749 3.75232 11.7669 4 11.7669C4.24767 11.7669 4.59666 11.5749 4.91667 10.9883C5.22502 10.423 5.43359 9.60306 5.43359 8.66667ZM6.56641 8.66667C6.56641 9.75531 6.32696 10.7688 5.91146 11.5306C5.50764 12.2709 4.85686 12.8997 4 12.8997C3.14314 12.8997 2.49236 12.2709 2.08854 11.5306C1.67304 10.7688 1.43359 9.75531 1.43359 8.66667C1.43359 7.57802 1.67304 6.5645 2.08854 5.80273C2.49236 5.0624 3.14314 4.43359 4 4.43359C4.85686 4.43359 5.50764 5.0624 5.91146 5.80273C6.32696 6.5645 6.56641 7.57802 6.56641 8.66667Z" fill="currentColor"></path><path d="M4.66667 8.66667C4.66667 9.40305 4.36819 10 4 10C3.63181 10 3.33333 9.40305 3.33333 8.66667C3.33333 7.93029 3.63181 7.33333 4 7.33333C4.36819 7.33333 4.66667 7.93029 4.66667 8.66667Z" fill="currentColor"></path></mask><g mask="url(#mask0_4502_4387)"><rect width="15.9998" height="16" fill="currentColor"></rect></g></svg>`;
}

/**
 * 숫자를 '억', '만', '천' 단위의 한글 문자열로 변환하는 함수
 * @param {number} num - 변환할 숫자
 * @returns {string} - 포맷팅된 문자열
 */
function formatKoreanNumber(num) {
  if (typeof num !== "number" || isNaN(num) || num === 0) {
    return "0";
  }

  // 1억 (100,000,000) 이상
  if (num >= 100000000) {
    const value = Math.floor(num / 100000000);
    return `${value.toLocaleString()}억`;
  }
  // 1만 (10,000) 이상
  if (num >= 10000) {
    const value = Math.floor(num / 10000);
    return `${value.toLocaleString()}만`;
  }
  // 1천 (1,000) 이상
  if (num >= 1000) {
    const value = Math.floor(num / 1000);
    return `${value.toLocaleString()}천`;
  }
  // 1천 미만
  return num.toLocaleString();
}

let currentFilter = "ALL";
let timeUpdaterInterval = null; // 인터벌 ID를 저장할 변수
let predictionUpdaterInterval = null;

let suppressNextStorageRerender = false;
// === Virtual list config ===
const VIRTUAL_CHUNK = 100; // 한번에 추가로 그릴 개수 (100~200 권장)
const VIRTUAL_OVERSCAN = 0; // (옵션) 여유분, 지금은 0
let virtualState = {
  items: [], // 필터링된 최종 목록
  max: 0, // 이번 렌더에서의 최대 표시 개수 (UI 설정값과 동일)
  rendered: 0, // 현재까지 화면에 올라간 개수
  liveStatusMap: {},
  partyDonationStatusMap: {},
  partyStatusMap: {},
  predictionStatusMap: {},
  loading: false,
  observer: null,
  filteredCount: 0,
  displayLimit: 300,
};

const scheduleIdle = (cb) => {
  if ("requestIdleCallback" in window) {
    return window.requestIdleCallback(cb, { timeout: 200 });
  }
  return setTimeout(cb, 0);
};

// *** 스토리지 변경 감시자 ***
// chrome.storage.local에 있는 데이터가 변경될 때마다 이 함수가 자동으로 실행
chrome.storage.onChanged.addListener((changes, namespace) => {
  // 변경된 데이터 중에 'notificationHistory'가 있는지,
  // 그리고 'local' 스토리지에서 발생한 변경인지 확인
  if (
    namespace === "local" &&
    (changes.notificationHistory || changes.predictionStatus)
  ) {
    if (suppressNextStorageRerender) {
      // 개별 삭제에 따른 1회성 변경은 UI에서 이미 처리했으니 스킵
      suppressNextStorageRerender = false;
      return;
    }
    // 알림 목록을 다시 그리는 함수를 호출하여 화면을 업데이트
    renderNotificationCenter();
  }
});

function detachVirtualObserver() {
  if (virtualState.observer) {
    virtualState.observer.disconnect();
    virtualState.observer = null;
  }
}

function ensureVirtualInner() {
  const list = document.getElementById("notification-list");
  let inner = list.querySelector(".virtual-inner");
  if (!inner) {
    inner = document.createElement("div");
    inner.className = "virtual-inner";
    // 센티넬 앞에 두도록 배치
    const sentinel = list.querySelector(".virtual-sentinel");
    if (sentinel) list.insertBefore(inner, sentinel);
    else list.appendChild(inner);
  }
  return inner;
}

function ensureSentinel() {
  const container = document.getElementById("notification-list");
  let sentinel = container.querySelector(".virtual-sentinel");
  if (!sentinel) {
    sentinel = document.createElement("div");
    sentinel.className = "virtual-sentinel";
    sentinel.setAttribute("aria-hidden", "true");
    container.appendChild(sentinel);
  } else if (sentinel.parentElement !== container) {
    container.appendChild(sentinel);
  }
  return sentinel;
}

function renderNextChunk() {
  if (virtualState.loading) return;
  if (virtualState.rendered >= virtualState.max) return;

  virtualState.loading = true;

  const nextEnd = Math.min(
    virtualState.rendered + VIRTUAL_CHUNK + VIRTUAL_OVERSCAN,
    virtualState.max
  );

  // renderList는 "전체 0~nextEnd"를 넘겨도 내부에서 DOM diff로 필요한만큼 갱신함
  const slice = virtualState.items.slice(0, nextEnd);
  renderList(
    slice,
    virtualState.liveStatusMap,
    virtualState.partyDonationStatusMap,
    virtualState.partyStatusMap
  );

  virtualState.rendered = nextEnd;
  virtualState.loading = false;
}

function attachVirtualObserver() {
  detachVirtualObserver();
  const container = document.getElementById("notification-list");
  const sentinel = ensureSentinel();

  // listElement 자체가 스크롤 컨테이너이므로 root 지정
  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (e.isIntersecting) {
        // 다음 청크 렌더를 rAF/idle로 미뤄서 프리즈 방지
        scheduleIdle(renderNextChunk);
      }
    },
    { root: container, threshold: 0.1 }
  );

  io.observe(sentinel);
  virtualState.observer = io;
}

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

function hasTooltip(element) {
  return (
    element.querySelector(".tooltip-text") !== null ||
    element.querySelector(".folded-tooltip-text") !== null
  );
}

function removeTooltips() {
  const tooltips = document.querySelectorAll(
    ".tooltip-text, .folded-tooltip-text"
  );
  tooltips.forEach((tip) => tip.remove());
}

function applyTooltip() {
  removeTooltips();

  const controlSwitch = document.querySelector("#control-wrapper label.switch");
  const offAllNotificationBtn = document.getElementById(
    "off-all-notification-btn"
  );
  const soundSettingsBtn = document.getElementById("sound-settings-open");
  const logpowerSettingsBtn = document.getElementById("logpower-settings-btn");
  const settingsBtn = document.getElementById("settings-btn");
  const displayLimitSettingsBtn = document.getElementById(
    "display-limit-settings-btn"
  );
  const toggleFoldBtn = document.getElementById("toggle-fold-btn");
  const bookmarkBtn = document.getElementById("bookmark-btn");

  if (
    !controlSwitch &&
    !offAllNotificationBtn &&
    !logpowerSettingsBtn &&
    !soundSettingsBtn &&
    !settingsBtn &&
    !displayLimitSettingsBtn &&
    !toggleFoldBtn &&
    !bookmarkBtn
  ) {
    return;
  }

  // 1. 이미 툴팁이 내부에 추가되었는지 확인하여 중복 실행을 방지
  if (
    hasTooltip(controlSwitch) &&
    hasTooltip(offAllNotificationBtn) &&
    hasTooltip(logpowerSettingsBtn) &&
    hasTooltip(soundSettingsBtn) &&
    hasTooltip(settingsBtn) &&
    hasTooltip(bookmarkBtn) &&
    hasTooltip(toggleFoldBtn) &&
    hasTooltip(displayLimitSettingsBtn)
  ) {
    return;
  }

  const isFolded = document.body.classList.contains("folded-view");

  // 2. 툴팁 텍스트를 담을 span 생성
  const controlSwitchTooltipText = document.createElement("span");
  controlSwitchTooltipText.className = "tooltip-text";
  controlSwitchTooltipText.textContent = "모든 브라우저 알림 켜기/끄기";

  const offAllNotificationTooltipText = document.createElement("span");
  offAllNotificationTooltipText.className = "tooltip-text";
  offAllNotificationTooltipText.textContent = "모든 팔로우 스트리머 알림 끄기";

  const soundSettingsTooltipText = document.createElement("span");
  soundSettingsTooltipText.className = "tooltip-text";
  soundSettingsTooltipText.textContent = "브라우저 알림 사운드 설정";

  const logpowerSettingsTooltipText = document.createElement("span");
  logpowerSettingsTooltipText.className = "tooltip-text";
  logpowerSettingsTooltipText.textContent = "통나무 파워 설정";

  const settingsTooltipText = document.createElement("span");
  settingsTooltipText.className = "tooltip-text";
  settingsTooltipText.textContent = "브라우저 알림 설정";

  const displayLimitSettingsTooltipText = document.createElement("span");
  displayLimitSettingsTooltipText.className = "tooltip-text";
  displayLimitSettingsTooltipText.textContent = "알림 개수 설정";

  const toggleFoldTooltipText = document.createElement("span");
  toggleFoldTooltipText.className = "tooltip-text";
  toggleFoldTooltipText.textContent = "펼치기/접기";

  const bookmarkTooltipText = document.createElement("span");
  bookmarkTooltipText.className = "tooltip-text";
  bookmarkTooltipText.textContent = "북마크 목록";

  if (isFolded) {
    displayLimitSettingsTooltipText.classList.add("folded-tooltip-text");
    toggleFoldTooltipText.classList.add("folded-tooltip-text");
    bookmarkTooltipText.classList.add("folded-tooltip-text");
  }

  // 3. 툴팁 wrapper 역할을 할 클래스를 버튼 자체에 부여
  controlSwitch.classList.add("control-switch-tooltip");
  offAllNotificationBtn.classList.add("off-all-notification-tooltip");
  logpowerSettingsBtn.classList.add("logpower-settings-tooltip");
  soundSettingsBtn.classList.add("sound-settings-tooltip");
  settingsBtn.classList.add("settings-tooltip");
  displayLimitSettingsBtn.classList.add("display-limit-settings-tooltip");
  toggleFoldBtn.classList.add("toggle-fold-tooltip");
  bookmarkBtn.classList.add("bookmark-tooltip");

  // 4. 툴팁 텍스트를 버튼의 자식으로 추가
  controlSwitch.appendChild(controlSwitchTooltipText);
  offAllNotificationBtn.appendChild(offAllNotificationTooltipText);
  logpowerSettingsBtn.appendChild(logpowerSettingsTooltipText);
  soundSettingsBtn.appendChild(soundSettingsTooltipText);
  settingsBtn.appendChild(settingsTooltipText);
  displayLimitSettingsBtn.appendChild(displayLimitSettingsTooltipText);
  toggleFoldBtn.appendChild(toggleFoldTooltipText);
  bookmarkBtn.appendChild(bookmarkTooltipText);
}

/**
 * 팝업의 접기/펼치기 UI를 초기화하는 함수
 */
async function initializeFoldToggle() {
  // 1. 로그인 상태를 확인합니다.
  const { cachedLoginStatus } = await chrome.storage.session.get(
    "cachedLoginStatus"
  );
  const isLoggedIn = cachedLoginStatus?.isLoggedIn || false;

  // 2. 필요한 DOM 요소를 가져옵니다.
  const foldBtn = document.getElementById("toggle-fold-btn");
  const body = document.body;

  // 3. 저장된 설정을 불러와 현재 UI 상태를 결정합니다.
  chrome.storage.local.get({ isFolded: false }, (data) => {
    // 로그아웃 상태이면 사용자의 설정과 관계없이 항상 뷰를 펼칩니다.
    if (isLoggedIn && data.isFolded) {
      body.classList.add("folded-view");
    } else {
      body.classList.remove("folded-view");
    }
    applyTooltip();
  });

  // 4. 접기/펼치기 버튼에 클릭 이벤트를 연결합니다.
  foldBtn.addEventListener("click", () => {
    body.classList.toggle("folded-view");
    const isFolded = body.classList.contains("folded-view");
    chrome.storage.local.set({ isFolded: isFolded });
    applyTooltip();
  });
}

// *** 승부예측 남은 시간 텍스트를 업데이트하는 함수 ***
function updatePredictionTimers() {
  const timerElements = document.querySelectorAll(
    ".prediction-timer[data-start-time][data-duration]"
  );
  if (timerElements.length === 0) return;

  const now = Date.now();

  timerElements.forEach((element) => {
    const startTime = parseInt(element.dataset.startTime, 10);
    const duration = parseInt(element.dataset.duration, 10);

    if (isNaN(startTime) || isNaN(duration)) {
      element.textContent = "시간 정보 없음";
      return;
    }

    // API 1 (요약)의 remainingDuration은 투표 시작 시점의 남은 시간.
    // (알림 생성 시각 - (전체 시간 - 남은 시간)) = 실제 시작 시각
    // 하지만 API 2 (상세)의 remainingDuration은 '현재' 남은 시간.
    // 알림 객체 생성 시각(timestamp)을 기준으로 삼고, API 2의 remainingDuration을 더해 종료 시각을 추정.
    // background.js가 1분마다 갱신해주므로, data-duration을 갱신된 remainingDuration으로 사용.
    const expireAt = parseInt(element.dataset.expireAt || "0", 10);
    const renderTime = parseInt(element.dataset.renderTime, 10) || startTime;

    // expireAt이 있으면 그것을 우선 사용, 없으면 기존 방식(fallback)
    const endTime = expireAt > 0 ? expireAt : renderTime + duration;

    // 클라이언트의 현재 시각(now)과 비교
    const remaining = Math.max(0, endTime - now);

    if (remaining === 0) {
      element.textContent = "참여 마감";
      element.classList.add("ended");
    } else {
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      element.textContent = `남은 시간 ${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
  });
}

let donationUpdaterInterval = null; // 인터벌 ID를 저장할 변수

// 실시간으로 후원액을 업데이트하는 함수
async function updateDonationAmounts() {
  const amountElements = document.querySelectorAll(
    ".donation-total-amount[data-party-no]"
  );
  if (amountElements.length === 0) return; // 업데이트할 요소가 없으면 종료

  const partyNos = [...amountElements].map((el) => el.dataset.partyNo);
  const uniquePartyNos = [...new Set(partyNos)];

  // 백그라운드에 저장된 최신 정보 가져오기
  const { partyDonationStatus = {} } = await chrome.storage.local.get(
    "partyDonationStatus"
  );

  uniquePartyNos.forEach((partyNo) => {
    const cheeseIcon = makeCheeseSVG();
    const donationInfo = partyDonationStatus[partyNo];
    if (donationInfo && donationInfo.donationAvailable) {
      // --- 총 후원액 업데이트 ---
      const elementsToUpdate = document.querySelectorAll(
        `.donation-total-amount[data-party-no="${partyNo}"]`
      );
      elementsToUpdate.forEach((el) => {
        el.innerHTML = `${cheeseIcon}&nbsp;총 후원금: ${(
          donationInfo.totalDonationAmount || 0
        ).toLocaleString()}&nbsp;치즈`;
      });

      // --- '똑같이 나누기' 후원액 실시간 업데이트 ---
      const sameElements = document.querySelectorAll(
        `.donation-per-person-same[data-party-no="${partyNo}"]`
      );
      sameElements.forEach((el) => {
        const container = el.closest("[data-member-count]");
        const memberCount = parseInt(container.dataset.memberCount, 10);
        if (memberCount > 0) {
          const amountPerPerson = Math.floor(
            (donationInfo.totalDonationAmount || 0) / memberCount
          );
          el.innerHTML = `${cheeseIcon}&nbsp;${amountPerPerson.toLocaleString()}&nbsp;치즈`;
        }
      });

      // --- '1명에게 몰아주기' 후원액 실시간 업데이트 ---
      const allInElements = document.querySelectorAll(
        `.donation-per-person-all-in[data-party-no="${partyNo}"]`
      );
      allInElements.forEach((el) => {
        const amountPerPerson = donationInfo.totalDonationAmount || 0;
        el.innerHTML = `${cheeseIcon}&nbsp;${amountPerPerson.toLocaleString()}&nbsp;치즈`;
      });

      // --- '자유롭게 나누기' 후원액 실시간 업데이트 ---
      const freeElements = document.querySelectorAll(
        `.donation-per-person-free[data-party-no="${partyNo}"]`
      );
      freeElements.forEach((el) => {
        const rate = parseInt(el.dataset.rate, 10);
        const amountPerRank = Math.floor(
          ((donationInfo.totalDonationAmount || 0) * rate) / 1000
        );
        el.innerHTML = `${cheeseIcon}&nbsp;${amountPerRank.toLocaleString()}&nbsp;치즈`;
      });
    }
  });
}

// 팝업이 열릴 때마다 모든 상태를 확인하고 UI를 렌더링
document.addEventListener("DOMContentLoaded", async () => {
  initializeBookmark();

  requestAnimationFrame(() => {
    renderNotificationCenter(); // await 제거
    initializeFoldToggle(); // await 제거
  });

  checkLoginStatus();
  initializeAllToggles();
  initializeLogPowerToggles();
  setupNotificationChecker();
  initializeDisplayLimitSettings();
  initializeSoundSettings();
  initializeBadgeClickAction();
  wireSummaryManualButtons();
  updateDonationAmounts();
  applyTooltip();

  // 팝업이 열려있는 동안 0.5초마다 승부예측 타이머 업데이트
  let predictionTimerInterval = null;
  if (predictionTimerInterval) clearInterval(predictionTimerInterval);
  predictionTimerInterval = setInterval(updatePredictionTimers, 500);

  if (predictionUpdaterInterval) clearInterval(predictionUpdaterInterval);
  predictionUpdaterInterval = setInterval(updateActivePredictionDetails, 10000); // 10초마다 실시간 갱신

  /**
   * 스토리지 변경 감시자
   * background.js에 의해 알림 데이터가 변경되면, 팝업 UI를 실시간으로 새로고침합니다.
   */
  chrome.storage.onChanged.addListener((changes, namespace) => {
    // 'local' 스토리지에서 'notificationHistory'가 변경되었을 때만 반응합니다.
    if (
      namespace === "local" &&
      (changes.notificationHistory || changes.predictionStatus)
    ) {
      if (suppressNextStorageRerender) {
        suppressNextStorageRerender = false;
        return;
      }
      console.log("알림 내역 변경 감지됨, UI를 새로고침합니다.");
      renderNotificationCenter(); // 알림 센터를 다시 렌더링하는 함수 호출
    }
  });

  // 팝업이 열려있는 동안 10초마다 후원액 업데이트
  if (donationUpdaterInterval) clearInterval(donationUpdaterInterval);
  donationUpdaterInterval = setInterval(updateDonationAmounts, 10000);

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

  if (donationUpdaterInterval) {
    clearInterval(donationUpdaterInterval);
  }

  if (predictionTimerInterval) {
    clearInterval(predictionTimerInterval);
  }

  if (predictionUpdaterInterval) {
    clearInterval(predictionUpdaterInterval);
  }
});

// manifest.json 파일의 정보
const manifest = chrome.runtime.getManifest();
const version = manifest.version;

const versionElement = document.createElement("div");
versionElement.id = "version-display";
versionElement.textContent = `v.${version}`;

document.body.prepend(versionElement);

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

    if (isLoggedIn) {
      chrome.runtime.sendMessage({ type: "RUN_CHECK_IMMEDIATELY" });
    }
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
  const offAllNotificationWrapper = document.getElementById(
    "off-all-notification-check-wrapper"
  );

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

  const closeOffAllNotificationBtn = document.querySelector(
    "#off-all-notification-check .close-btn"
  );
  if (closeOffAllNotificationBtn) {
    closeOffAllNotificationBtn.addEventListener("click", () => {
      offAllNotificationWrapper.style.display = "none";
    });
  }

  const offAllNotificationBtn = document.getElementById(
    "off-all-notification-btn"
  );
  if (offAllNotificationBtn) {
    offAllNotificationBtn.addEventListener("click", () => {
      offAllNotificationWrapper.style.display = "flex";
    });
  }

  const offAllNotificationConfirmBtn = document.getElementById(
    "off-all-notification-confrim-btn"
  );
  if (offAllNotificationConfirmBtn) {
    offAllNotificationConfirmBtn.addEventListener("click", async () => {
      const originalButtonText = offAllNotificationConfirmBtn.textContent;

      try {
        const tabs = await chrome.tabs.query({
          active: true,
          url: "https://chzzk.naver.com/*",
        });

        if (tabs.length === 0) {
          alert("알림을 끄기 위해 치지직 탭을 먼저 열어주세요.");
          offAllNotificationWrapper.style.display = "none";
          return; // 함수를 여기서 종료
        }

        const chzzkTabId = tabs[0].id;

        // --- 핸드셰이크 로직 시작 ---
        try {
          // 1. "준비됐니?" 라고 PING 메시지를 보냄
          const response = await chrome.tabs.sendMessage(chzzkTabId, {
            type: "PING",
          });
          // 2. "준비됐다"는 응답을 확인
          if (response?.status !== "ready") {
            throw new Error(
              "content.js가 응답했지만, 준비되지 않은 상태입니다."
            );
          }
        } catch (e) {
          // PING 메시지 전송에 실패하면 (연결 오류 등), 사용자에게 알리고 작업을 중단
          console.error("Content script 연결 실패:", e.message);
          alert(
            "치지직 페이지가 아직 로딩 중입니다. 잠시 후 다시 시도하거나 페이지를 새로고침 해주세요."
          );
          return; // 함수를 여기서 종료
        }

        // 2. 버튼을 비활성화하고 텍스트를 변경해 처리 중임을 알림
        closeOffAllNotificationBtn.style.visibility = "hidden";
        offAllNotificationConfirmBtn.disabled = true;
        offAllNotificationConfirmBtn.textContent = "처리 중...";

        // 핸드셰이크에 성공했으므로, 이제 안전하게 실제 명령을 보냄
        // 3. 찾은 탭(content.js)으로 메시지를 보냄
        chrome.tabs.sendMessage(chzzkTabId, {
          type: "TURN_OFF_ALL_NOTIFICATIONS",
        });

        // 메시지를 보낸 후 1.5초 정도 기다렸다가 창을 닫아
        // 사용자에게 작업이 시작되었음을 인지시킴
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        console.error("알림을 끄는 도중 에러 발생:", error);
      } finally {
        // 4. 작업이 성공하든 실패하든, 버튼 상태를 원래대로 복구
        closeOffAllNotificationBtn.style.visibility = "visible";
        offAllNotificationConfirmBtn.disabled = false;
        offAllNotificationConfirmBtn.textContent = originalButtonText;

        // 5. 모든 작업이 끝난 후 확인 창을 닫음
        offAllNotificationWrapper.style.display = "none";
      }
    });
  }

  const logpowerSettingsWrapper = document.getElementById(
    "logpower-settings-wrapper"
  );
  const logpowerSettingsBtn = document.getElementById("logpower-settings-btn");
  if (logpowerSettingsBtn) {
    logpowerSettingsBtn.addEventListener("click", () => {
      logpowerSettingsWrapper.style.display = "flex";
    });
  }

  const closeLogpowerSettingsBtn = document.querySelector(
    ".close-logpower-settings-btn"
  );
  const logpowerSummaryRunResult =
    document.getElementById("summary-run-result");
  if (closeLogpowerSettingsBtn) {
    closeLogpowerSettingsBtn.addEventListener("click", () => {
      logpowerSettingsWrapper.style.display = "none";
      logpowerSummaryRunResult.textContent = "";
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
    testBtn.style.display = "flex";
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
    { toggleId: "live-off-pause-toggle", storageKey: "isLiveOffPaused" },
    { toggleId: "category-pause-toggle", storageKey: "isCategoryPaused" },
    { toggleId: "live-title-pause-toggle", storageKey: "isLiveTitlePaused" },
    { toggleId: "watch-party-pause-toggle", storageKey: "isWatchPartyPaused" },
    { toggleId: "drops-pause-toggle", storageKey: "isDropsPaused" },
    { toggleId: "logpower-pause-toggle", storageKey: "isLogPowerPaused" },
    {
      toggleId: "logpower-summary-pause-toggle",
      storageKey: "isLogPowerSummaryPaused",
    },
    {
      toggleId: "logpower-display-pause-toggle",
      storageKey: "isLogPowerDisplayPaused",
    },
    { toggleId: "prediction-pause-toggle", storageKey: "isPredictionPaused" },
    { toggleId: "party-pause-toggle", storageKey: "isPartyPaused" },
    { toggleId: "restrict-pause-toggle", storageKey: "isRestrictPaused" },
    { toggleId: "video-pause-toggle", storageKey: "isVideoPaused" },
    { toggleId: "community-pause-toggle", storageKey: "isCommunityPaused" },
    { toggleId: "chzzk-lounge-pause-toggle", storageKey: "isLoungePaused" },
    { toggleId: "chzzk-banner-pause-toggle", storageKey: "isBannerPaused" },
    { toggleId: "live-keep-pause-toggle", storageKey: "isLiveKeepPaused" },
    {
      toggleId: "live-off-keep-pause-toggle",
      storageKey: "isLiveOffKeepPaused",
    },
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
      toggleId: "prediction-keep-pause-toggle",
      storageKey: "isPredictionKeepPaused",
    },
    {
      toggleId: "logpower-summary-keep-pause-toggle",
      storageKey: "isLogPowerSummaryKeepPaused",
    },
    { toggleId: "party-keep-pause-toggle", storageKey: "isPartyKeepPaused" },
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
 * 통나무 파워 관련 토글 스위치 초기화
 * (isPaused가 아닌 'true/false'를 직접 저장하는 토글용)
 */
function initializeLogPowerToggles() {
  const externalToggle = document.getElementById("logpower-external-toggle");
  const externalStorageKey = "logpowerIncludeExternal";

  if (externalToggle) {
    // 1. 스토리지에서 현재 설정값을 가져와 토글의 체크 상태에 반영 (기본값: true)
    chrome.storage.local.get({ [externalStorageKey]: true }, (data) => {
      externalToggle.checked = !!data[externalStorageKey];
    });

    // 2. 토글 상태 변경 시 이벤트 처리
    externalToggle.addEventListener("change", (event) => {
      // isPaused와 달리, 체크된 상태(true/false)를 그대로 저장
      chrome.storage.local.set({ [externalStorageKey]: event.target.checked });
    });
  }
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
        macInfo.style.cssText =
          "margin: 8px auto;font-weight: bold;width: 90%;word-break: keep-all;";
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
        winInfo.style.cssText =
          "margin: 8px auto;font-weight: bold;width: 90%;word-break: keep-all;";
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
    const { displayLimit = 300 } = await chrome.storage.local.get(
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
      displayLimitInput.classList.remove("input-invalid");
      loadDisplayLimit();
    };
  }

  // input 값 유효성 검사
  displayLimitInput.oninput = () => {
    const value = displayLimitInput.value;
    const minValue = 10;
    const maxValue = 1000;

    if (value.trim() === "") {
      displayLimitConfrimBtn.disabled = true;
      displayLimitInput.classList.add("input-invalid");
      return;
    }

    const newLimit = parseInt(value, 10);

    const isValid =
      !isNaN(newLimit) && newLimit >= minValue && newLimit <= maxValue;

    displayLimitConfrimBtn.disabled = !isValid;
    displayLimitInput.classList.toggle("input-invalid", !isValid);
  };

  displayLimitConfrimBtn.onclick = async () => {
    let newLimit = parseInt(displayLimitInput.value, 10);

    if (!isNaN(newLimit)) {
      const minValue = 10;
      const maxValue = 1000;
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

// *** attaches 배열을 비교하기 위한 헬퍼 함수 ***
function getComparableAttachesString(attaches) {
  if (!attaches || attaches.length === 0) return "[]";
  const sortedAttaches = attaches.map((attach) => {
    const sortedKeys = Object.keys(attach).sort();
    const sortedAttach = {};
    sortedKeys.forEach((key) => {
      sortedAttach[key] = attach[key];
    });
    return sortedAttach;
  });
  return JSON.stringify(sortedAttaches);
}

/**
 * 알림 객체의 핵심 데이터만 뽑아 '서명(signature)'을 만드는 함수
 */
function makeSig(
  item,
  liveStatusMap,
  partyDonationStatusMap,
  partyStatusMap,
  predictionStatusMap
) {
  // 모든 타입에 대해 read 상태를 시그니처에 포함
  const isCurrentlyLive = liveStatusMap[item.channelId]?.live || false;
  const commonSig = { id: item.id, read: item.read, live: isCurrentlyLive };

  if (item.type === "DATE_SEPARATOR") {
    return JSON.stringify({ id: item.id });
  }

  if (item.type === "PARTY_START") {
    const currentPartyStatus = partyStatusMap[item.channelId];
    const isPartyStillActive =
      currentPartyStatus && currentPartyStatus.partyNo === item.partyNo;

    const donationStatus = partyDonationStatusMap[item.partyNo] || {
      donationAvailable: false,
    };

    // accumulatedMembers가 없으면 호환성을 위해 기존 멤버 목록을 사용
    const allMembers = item.accumulatedMembers || [
      item.host,
      ...(item.partyMembers || []),
    ];
    // 멤버 ID 목록을 정렬하여 문자열로. 순서가 달라도 내용은 같도록 보장
    const memberIdSignature = JSON.stringify(
      allMembers.map((m) => m?.channelId).sort()
    );

    // 파티 깜빡임 방지를 위해, UI에 직접적인 영향을 주는 데이터만 포함
    return JSON.stringify({
      ...commonSig,
      memberCount: item.memberCount,
      partyName: item.partyName,
      isActive: isPartyStillActive,
      donationAvailable: donationStatus.donationAvailable,
      members: memberIdSignature,
    });
  } else if (item.type === "POST") {
    return JSON.stringify({
      ...commonSig,
      content: item.content, // 글 내용
      isEdited: item.isEdited, // 수정 여부
      attaches: getComparableAttachesString(item.attaches), // attaches 비교
    });
  } else if (item.type === "VIDEO") {
    return JSON.stringify({
      ...commonSig,
      content: item.content, // 동영상 제목
      thumbnailImageUrl: item.thumbnailImageUrl, // 썸네일 URL
    });
  } else if (item.type === "PREDICTION_START") {
    // 팝업에 실시간으로 반영되어야 할 모든 데이터를 시그니처에 포함
    const currentPredictionStatus = predictionStatusMap[item.channelId];
    let liveDetails = item; // 기본값은 히스토리 스냅샷

    // background가 갱신한 최신 'details'가 있고, predictionId가 일치하면 그것을 사용
    if (
      currentPredictionStatus &&
      currentPredictionStatus.details &&
      currentPredictionStatus.predictionId === item.predictionId &&
      (currentPredictionStatus.details.status === "ACTIVE" ||
        currentPredictionStatus.details.status === "EXPIRED" ||
        currentPredictionStatus.details.status === "COMPLETED")
    ) {
      // ACTIVE 상태일 때만
      liveDetails = currentPredictionStatus.details;
    }

    return JSON.stringify({
      ...commonSig,
      status: liveDetails.status, // "ACTIVE"
      remainingDuration: liveDetails.remainingDuration,
      // 옵션 리스트 전체를 JSON으로 변환하여 시그니처에 포함
      optionListSig: JSON.stringify(liveDetails.optionList),
      participation: JSON.stringify(liveDetails.participation),
    });
  }
  // 다른 일반 항목들을 위한 기본 시그니처 (필요에 따라 확장)
  return JSON.stringify(commonSig);
}

/**
 * 두 서명을 비교하여 변경 여부를 반환하는 함수
 */
function signatureChanged(
  prevSig,
  item,
  liveStatusMap,
  partyDonationStatusMap,
  partyStatusMap,
  predictionStatusMap
) {
  return (
    prevSig !==
    makeSig(
      item,
      liveStatusMap,
      partyDonationStatusMap,
      partyStatusMap,
      predictionStatusMap
    )
  );
}

/**
 * 일반 노드의 내용만 부분적으로 업데이트하는 함수
 */
function patchGenericNode(el, item, liveStatusMap) {
  // '읽음' 상태는 모든 알림의 공통 속성이므로 여기서 처리
  el.classList.toggle("read", item.read);

  // 라이브 상태에 따라 채널 이미지 래퍼를 업데이트
  const isCurrentlyLive = liveStatusMap[item.channelId]?.live || false;
  const imgWrapper = el.querySelector(
    ".live-channel-img-wrapper, .channel-img-wrapper"
  );
  if (imgWrapper) {
    // 라이브 상태면 'live-' 클래스를, 아니면 일반 클래스를 적용
    imgWrapper.className = isCurrentlyLive
      ? "live-channel-img-wrapper"
      : "channel-img-wrapper";
    // 라이브 상태일 때만 'LIVE' 태그(em)가 보이도록 처리
    const liveTag = imgWrapper.querySelector("em");
    if (liveTag) {
      liveTag.style.display = isCurrentlyLive ? "block" : "none";
    }
  }

  if (item.type === "POST") {
    const titleEl = el.querySelector(".channel-name");
    const textContentEl = el.querySelector(".post-text-content");
    if (textContentEl) {
      // 글 내용(excerpt) 업데이트
      textContentEl.textContent = item.excerpt;
    }
    // 수정됨 표시 추가
    if (
      titleEl &&
      item.isEdited &&
      !titleEl.querySelector(".edited-indicator")
    ) {
      titleEl.innerHTML += ' <span class="edited-indicator">(수정됨)</span>';
    }
    // attaches 업데이트
    const attachWrapper = el.querySelector(".notification-attach-wrapper");
    if (attachWrapper) {
      // 1. 기존 첨부파일 모두 삭제
      attachWrapper.innerHTML = "";
      // 2. 새로운 첨부파일 목록으로 다시 채우기
      if (item.attaches && item.attaches.length > 0) {
        item.attaches.forEach((attach) => {
          const img = document.createElement("img");
          img.src = attach.attachValue;
          img.loading = "lazy";
          img.title = "클릭하여 전체화면으로 보기";

          const dimensions = JSON.parse(attach.extraJson);
          if (dimensions && attach.attachType === "PHOTO") {
            const ratio = dimensions.width / dimensions.height;
            let maxWidth = 115;
            if (item.attachLayout === "layout-single-big") {
              maxWidth = 320;
            } else if (item.attachLayout === "layout-single-medium") {
              maxWidth = 150;
            } else if (item.attachLayout === "layout-double-medium") {
              maxWidth = 175;
            }
            if (ratio < 0.3) {
              img.style.aspectRatio = `${dimensions.width} / ${dimensions.height}`;
            } else if (ratio > 1.21) {
              if (item.attachLayout === "layout-single-big") {
                img.style.height = "180px";
              } else {
                img.style.height = "150px";
              }
            } else {
              const height = maxWidth / ratio;
              img.style.height = `${height}px`;
            }
          } else if (attach.attachType === "STICKER") {
            img.style.width = "100px";
            img.style.height = "100px";
            img.style.objectFit = "contain";
          }

          attachWrapper.appendChild(img);
        });
      }
    }
  } else if (item.type === "VIDEO") {
    const messageDiv = el.querySelector(".notification-message");
    const thumbnailEl = messageDiv.querySelector("img"); // 썸네일 이미지
    if (messageDiv) {
      // 동영상 제목 업데이트 (br 태그 다음의 텍스트 노드)
      const contentNode = Array.from(messageDiv.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE
      );
      if (contentNode) contentNode.textContent = ` ${item.content}`;
    }
    if (thumbnailEl) {
      thumbnailEl.src = item.thumbnailImageUrl || "../thumbnail.gif";
    }
  }
}

function createMemberElement(member, hostSVG) {
  const memberContainer = document.createElement("div");
  memberContainer.className = "chzzk-party-member-container";

  const channelLink = document.createElement("a");
  channelLink.href = `https://chzzk.naver.com/live/${member.channelId}`;
  channelLink.title = `${member.channelName} 채널로 이동`;
  channelLink.target = "_blank";
  channelLink.addEventListener("click", (event) => event.stopPropagation());

  const channelImg = document.createElement("img");
  channelImg.className = "party-member-img";
  channelImg.src = member.profileImageUrl;
  channelImg.loading = "lazy";
  channelLink.appendChild(channelImg);

  const memberName = document.createElement("span");
  memberName.className = "chzzk-party-member-name";

  if (member.host && typeof hostSVG === "string") {
    memberName.innerHTML = hostSVG;
  }

  let displayName =
    member.channelName.length > 25
      ? member.channelName.slice(0, 22) + "..."
      : member.channelName;
  memberName.append(document.createTextNode(displayName));

  memberContainer.append(channelLink, memberName);
  return memberContainer;
}

/**
 * 파티 멤버 UI를 생성하고 렌더링하는 함수
 */
function renderPartyMembers(
  container,
  item,
  partyStatusMap,
  partyDonationStatusMap
) {
  // 함수가 호출될 때마다 이전 내용을 깨끗이 지웁니다.
  container.innerHTML = "";

  const isStart = item.type === "PARTY_START";

  if (isStart) {
    const currentPartyStatus = partyStatusMap[item.channelId];
    const isPartyStillActive =
      currentPartyStatus &&
      currentPartyStatus.partyNo === item.partyNo &&
      Date.now() - (currentPartyStatus.updatedAt || 0) < 90_000;

    // '현재 진행 중인 파티'일 때만, 그리고 채널 알림이 꺼져 있을 때만 차단 문구 노출
    const isNotificationOffForCurrent =
      !!currentPartyStatus &&
      currentPartyStatus.notificationEnabled === false &&
      currentPartyStatus.partyNo === item.partyNo &&
      isPartyStillActive;

    if (isNotificationOffForCurrent) {
      const partyLink = document.createElement("a");
      partyLink.className = "live-party-link";
      partyLink.href = `https://chzzk.naver.com/party-lives/${item.partyNo}`;
      partyLink.title = `${item.partyName}(으)로 이동`;
      partyLink.target = "_blank";
      partyLink.addEventListener("click", (e) => e.stopPropagation());

      const partySpan = document.createElement("span");
      partySpan.className = "chzzk-party";
      partySpan.textContent = `${item.partyName} (${item.memberCount || 0}명)`;
      partyLink.appendChild(partySpan);

      const tip = document.createElement("div");
      tip.className = "donation-info-text";
      tip.textContent = `${item.channelName}님의 알림이 꺼져 있어 파티를 조회할 수 없습니다`;

      container.append(partyLink, tip);
      return; // 여기서 끝: '종료' UI로 넘어가지 않음
    }

    const partyLink = document.createElement("a");
    partyLink.className = "live-party-link";
    partyLink.href = `https://chzzk.naver.com/party-lives/${item.partyNo}`;
    partyLink.title = `${item.partyName}(으)로 이동`;
    partyLink.target = "_blank";
    partyLink.addEventListener("click", (event) => event.stopPropagation());

    const partySpan = document.createElement("span");
    partySpan.className = "chzzk-party";
    partySpan.textContent = `${item.partyName} (${item.memberCount || 0}명)`;
    partyLink.appendChild(partySpan);

    const warningText = document.createElement("div");
    warningText.className = "donation-info-text";
    warningText.style.color = "#c62828";
    warningText.style.fontSize = "10px";
    warningText.style.marginBottom = "4px";
    warningText.textContent = "파티원 목록은 실제와 다를 수 있습니다";
    warningText.classList.add("hidden");

    if (isPartyStillActive) {
      const allMembers = [item.host, ...(item.partyMembers || [])].filter(
        Boolean
      );

      const activeCandidates = [
        item.host,
        ...(currentPartyStatus?.partyMembers &&
        currentPartyStatus.partyNo === item.partyNo
          ? currentPartyStatus.partyMembers
          : item.partyMembers || []),
      ].filter(Boolean);
      const activeMembers = Array.from(
        new Map(activeCandidates.map((m) => [m.channelId, m])).values()
      );

      // 2) "참여 중인 파티원 보기"용(누적 포함, 보여주기 전용) - 중복 제거
      const displayCandidates = [
        item.host,
        ...(item.partyMembers || []),
        ...(currentPartyStatus?.accumulatedMembers || []),
        ...(item.accumulatedMembers || []),
      ].filter(Boolean);
      const displayAllMembers = Array.from(
        new Map(displayCandidates.map((m) => [m.channelId, m])).values()
      );

      const partyLiveDiv = document.createElement("div");
      partyLiveDiv.className = "chzzk-party-live";

      const partyMembersSpan = document.createElement("span");
      partyMembersSpan.className = "chzzk-party-member";
      partyMembersSpan.innerText = "라이브 파티원 정보 조회 중...";

      const partyAllMemberTitle = document.createElement("span");
      partyAllMemberTitle.className = "chzzk-party-all-member-title";
      partyAllMemberTitle.textContent = "지금까지 참여한 파티원";

      const partyAllMembersSpan = document.createElement("span");
      partyAllMembersSpan.className = "chzzk-party-all-member";
      partyAllMembersSpan.classList.add("hidden");

      partyAllMemberTitle.addEventListener("click", (event) => {
        event.stopPropagation();

        warningText.classList.toggle("hidden");
        const isHidden = partyAllMembersSpan.classList.toggle("hidden");
        if (!isHidden)
          partyAllMembersSpan.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
      });

      container.append(
        partyLink,
        partyAllMemberTitle,
        partyAllMembersSpan,
        partyLiveDiv,
        partyMembersSpan
      );

      // --- 실시간 라이브 상태 조회 로직 (원래 코드와 동일) ---
      setTimeout(async () => {
        try {
          const BATCH_SIZE = 5;
          const DELAY_BETWEEN_BATCHES = 200;
          const CACHE_KEY = `party_live_status_${item.partyNo}`;
          const CACHE_DURATION = 60 * 1000;

          const cachedData = sessionStorage.getItem(CACHE_KEY);
          if (cachedData) {
            const { timestamp, liveMemberIds } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_DURATION) {
              renderFinalMembers(new Set(liveMemberIds));
              return;
            }
          }

          const liveMemberIdSet = new Set();
          const idsToCheck = activeMembers.map((member) => member.channelId);

          for (let i = 0; i < idsToCheck.length; i += BATCH_SIZE) {
            const batch = idsToCheck.slice(i, i + BATCH_SIZE);
            const promises = batch.map((channelId) =>
              fetch(
                `https://api.chzzk.naver.com/polling/v3.1/channels/${channelId}/live-status`
              ).then((res) => res.json())
            );
            const results = await Promise.allSettled(promises);
            results.forEach((result, index) => {
              if (
                result.status === "fulfilled" &&
                result.value?.content?.status === "OPEN"
              ) {
                liveMemberIdSet.add(batch[index]);
              }
            });
            if (i + BATCH_SIZE < idsToCheck.length) {
              await new Promise((resolve) =>
                setTimeout(resolve, DELAY_BETWEEN_BATCHES)
              );
            }
          }

          const cachePayload = {
            timestamp: Date.now(),
            liveMemberIds: [...liveMemberIdSet],
          };
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
          renderFinalMembers(liveMemberIdSet);
        } catch (error) {
          console.error("파티원 라이브 상태 조회 중 오류:", error);
          partyMembersSpan.innerText = "파티원 정보를 불러오는 데 실패했습니다";
        }
      }, 0);

      function renderFinalMembers(liveMemberIdSet) {
        partyAllMembersSpan.innerHTML = ""; // 전체 멤버 목록 초기화
        partyMembersSpan.innerHTML = ""; // 라이브 멤버 목록 초기화

        // 전체 멤버 목록 (토글) 렌더링
        if (displayAllMembers.length > 0) {
          displayAllMembers.forEach((member) => {
            if (!member) return;
            const memberContainer = createMemberElement(member, partyHostSVG);
            partyAllMembersSpan.appendChild(memberContainer);
          });
          partyAllMembersSpan.after(warningText);
        } else {
          partyAllMembersSpan.innerText = "파티원 정보가 없습니다";
        }

        // 라이브 중인 멤버 목록 렌더링
        const liveDisplayMembers = allMembers.filter((member) =>
          liveMemberIdSet.has(member.channelId)
        );
        partyLiveDiv.textContent = `🔴 라이브 중인 파티원 (${liveDisplayMembers.length}명)`;

        if (liveDisplayMembers.length > 0) {
          liveDisplayMembers.forEach((member) => {
            const memberContainer = createMemberElement(
              member,
              partyLiveHostSVG
            );
            partyMembersSpan.appendChild(memberContainer);
          });
        } else {
          partyMembersSpan.style.paddingBottom = "10px";
          partyMembersSpan.innerText = "현재 라이브 중인 파티원이 없습니다";
        }
      }

      const donationInfo = partyDonationStatusMap[item.partyNo];
      if (donationInfo && donationInfo.donationAvailable) {
        renderDonationInfo(container, item, donationInfo);
      }
    } else {
      const partySpan = document.createElement("span");
      partySpan.className = "chzzk-end-party-name";
      partySpan.textContent = `${item.partyName} (${item.memberCount || 0}명)`;

      // 파티가 종료된 경우
      const partyEndMessage = document.createElement("div");
      partyEndMessage.innerText = `파티가 종료되었습니다`;
      partyEndMessage.style.marginTop = "5px";
      container.append(partySpan, partyEndMessage);
    }
  } else {
    // PARTY_END 처리
    const isLeft = item.type === "PARTY_LEFT";

    const partySpan = document.createElement("span");
    partySpan.className = "chzzk-end-party-name";
    partySpan.textContent = `${item.partyName} (${item.memberCount || 0}명)`;

    const endMessage = document.createTextNode(
      isLeft ? ` 파티를 떠났습니다` : ` 파티가 종료되었습니다`
    );

    const partyAllMemberTitle = document.createElement("div");
    partyAllMemberTitle.className = "chzzk-party-all-member-title";
    partyAllMemberTitle.textContent = "참여했던 파티원 보기";

    const partyAllMembersSpan = document.createElement("span");
    partyAllMembersSpan.className = "chzzk-party-all-member";
    partyAllMembersSpan.classList.add("hidden");

    const warningText = document.createElement("div");
    warningText.className = "donation-info-text";
    warningText.style.color = "#c62828";
    warningText.style.fontSize = "10px";
    warningText.style.marginBottom = "4px";
    warningText.textContent = "파티원 목록은 실제와 다를 수 있습니다";
    warningText.classList.add("hidden");

    partyAllMemberTitle.addEventListener("click", (event) => {
      event.stopPropagation();
      warningText.classList.toggle("hidden");
      partyAllMemberTitle.classList.toggle("active-end-party-click");
      partyAllMembersSpan.classList.toggle("active-end-party-all-member");

      const isHidden = partyAllMembersSpan.classList.toggle("hidden");
      if (!isHidden)
        partyAllMembersSpan.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
    });

    const finalMembers = item.accumulatedMembers || [];
    if (finalMembers.length > 0) {
      finalMembers.forEach((member) => {
        if (!member) return;
        const memberContainer = document.createElement("div");
        memberContainer.className = "chzzk-party-member-container";

        const channelLink = document.createElement("a");
        channelLink.href = `https://chzzk.naver.com/live/${member.channelId}`;
        channelLink.title = `${member.channelName} 채널로 이동`;
        channelLink.target = "_blank";
        channelLink.addEventListener("click", (event) =>
          event.stopPropagation()
        );

        const channelImg = document.createElement("img");
        channelImg.className = "party-member-img";
        channelImg.src = member.profileImageUrl;
        channelLink.appendChild(channelImg);

        const memberName = document.createElement("span");
        memberName.className = "chzzk-party-member-name";

        if (member.host) {
          memberName.innerHTML = partyHostSVG;
        }

        let displayName =
          member.channelName.length > 25
            ? member.channelName.slice(0, 22) + "..."
            : member.channelName;
        memberName.append(document.createTextNode(displayName));

        memberContainer.append(channelLink, memberName);
        partyAllMembersSpan.appendChild(memberContainer);
      });
    } else {
      partyAllMembersSpan.innerText = "이전 파티원 정보가 없습니다";
    }

    container.append(
      partySpan,
      endMessage,
      partyAllMemberTitle,
      partyAllMembersSpan,
      warningText
    );
  }
}

/**
 * PARTY_START 노드의 내용만 부분적으로 업데이트하는 함수
 */
function patchPartyNode(
  el,
  item,
  liveStatusMap,
  partyDonationStatusMap,
  partyStatusMap
) {
  // 1. 공통 속성 업데이트를 위해 generic 함수를 먼저 호출
  patchGenericNode(el, item, liveStatusMap);

  const messageDiv = el.querySelector(".notification-message");
  if (messageDiv) {
    renderPartyMembers(
      messageDiv,
      item,
      partyStatusMap,
      partyDonationStatusMap
    );
  }
}

/**
 * PREDICTION_START 노드의 내용만 부분적으로 업데이트하는 함수
 */
function patchPredictionNode(el, item, liveStatusMap, predictionStatusMap) {
  // 1. 공통 속성 (읽음, 라이브 상태) 업데이트
  patchGenericNode(el, item, liveStatusMap);

  // 2. 실시간 데이터 가져오기
  const currentPredictionStatus = predictionStatusMap[item.channelId];
  let liveDetails = item; // 기본값은 히스토리의 스냅샷

  // background가 갱신한 최신 'details'가 있고, predictionId가 일치하면 그것을 사용
  if (
    currentPredictionStatus &&
    currentPredictionStatus.details &&
    currentPredictionStatus.predictionId === item.predictionId &&
    (currentPredictionStatus.details.status === "ACTIVE" ||
      currentPredictionStatus.details.status === "EXPIRED" ||
      currentPredictionStatus.details.status === "COMPLETED" ||
      currentPredictionStatus.details.status === "CANCELLED")
  ) {
    liveDetails = currentPredictionStatus.details;
  }

  // 3. 타이머 업데이트
  const timerEl = el.querySelector(".prediction-timer");
  if (timerEl) {
    // 타이머 로직은 data-속성을 기반으로 작동하므로, 속성만 갱신
    // item.timestamp (알림 생성 시각)을 startTime으로 사용
    const renderTime = liveDetails.fetchedAt || Date.now(); // 갱신되는 현재 시각
    timerEl.dataset.renderTime = String(renderTime);
    timerEl.dataset.duration = String(liveDetails.remainingDuration ?? 0); // API 2의 'remainingDuration'

    // 서버 기준 절대 만료 시각을 dataset에 추가
    if (typeof liveDetails.expireAt === "number") {
      timerEl.dataset.expireAt = String(liveDetails.expireAt);
    }
  }

  // --- 상태별 갱신 분기 처리 ---

  // 3-1. "CANCELLED" (취소됨) 상태 처리
  if (liveDetails.status === "CANCELLED") {
    if (timerEl) {
      timerEl.textContent = "승부예측이 취소되었습니다";
      timerEl.classList.add("ended");
    }
    // 옵션 리스트와 내 베팅 정보를 숨김
    const optionListEl = el.querySelector(".prediction-option-list");
    if (optionListEl) optionListEl.style.display = "none";
    const myBetEl = el.querySelector(".prediction-my-bet");
    if (myBetEl) myBetEl.style.display = "none";

    el.dataset.predictionStatus = "CANCELLED"; // 현재 상태 저장
    return; // 갱신 종료
  }

  // 3-2. "EXPIRED" (참여 마감, 집계 중) 상태 처리
  const currentStatus = el.dataset.predictionStatus; // UI에 마지막으로 렌더링된 상태
  const newStatus = liveDetails.status;

  // 새 상태가 EXPIRED인데, UI가 이미 EXPIRED 또는 COMPLETED라면 갱신 안 함
  // (1분 주기 background.js의 변동하는 중간 집계 값 차단)
  if (
    newStatus === "EXPIRED" &&
    (currentStatus === "EXPIRED" || currentStatus === "COMPLETED")
  ) {
    return; // 갱신 종료
  }

  // "ACTIVE" -> "EXPIRED" (첫 1회) 또는 "EXPIRED" -> "COMPLETED"는 통과
  el.dataset.predictionStatus = newStatus; // 새 상태를 UI에 저장

  // 4. 옵션 리스트 업데이트
  const optionListEl = el.querySelector(".prediction-option-list");
  if (optionListEl) {
    const optionMap = new Map(
      Array.from(optionListEl.children).map((optEl) => [
        optEl.dataset.optionNo,
        optEl,
      ])
    );

    const mySelectionNo = liveDetails.participation?.selectedOptionNo;
    const options = Array.isArray(liveDetails.optionList)
      ? liveDetails.optionList
      : [];

    const totalLogPowersAll =
      options.reduce((acc, o) => acc + (o.totalLogPowers || 0), 0) || 1;

    const titleEl = el.querySelector(".prediction-title");
    if (titleEl) {
      const subtitleEl = titleEl.querySelector(".prediction-subtitle");
      if (subtitleEl) {
        subtitleEl.innerHTML = `${logPowerPredictionVersusSVG} ${formatKoreanNumber(
          totalLogPowersAll
        )} 파워가 걸린 명승부`;
      }
    }

    options.forEach((option) => {
      const optEl = optionMap.get(String(option.optionNo));
      if (!optEl) return; // 맵에 없는 옵션 (이론상으론 없어야 함)

      const bar = optEl.querySelector(".prediction-option-bar");
      const percentText = optEl.querySelector(".prediction-option-percent");
      const stats = optEl.querySelector(".prediction-option-stats");

      const percentage = (option.totalLogPowers / totalLogPowersAll) * 100;

      if (bar) bar.style.width = `${percentage}%`;
      if (percentText) percentText.textContent = `${Math.round(percentage)}%`;
      if (stats) {
        stats.innerHTML = `
            ${makeLogPowerSVG()}${option.totalLogPowers.toLocaleString()}
            (${option.participantCount.toLocaleString()}명)
            <span class="prediction-dist-rate">분배율: ${option.distributionRate.toFixed(
              2
            )}</span>
          `;
      }

      // 내 선택 하이라이트
      optEl.classList.toggle("my-selection", option.optionNo === mySelectionNo);
    });

    // 내 베팅 정보 업데이트
    let myBetEl = el.querySelector(".prediction-my-bet");
    const predictionWrapper = el.querySelector(".prediction-wrapper");

    if (mySelectionNo) {
      if (!myBetEl) {
        // 참여 정보가 생겼는데 .prediction-my-bet 요소가 없으면 새로 생성
        myBetEl = document.createElement("div");
        myBetEl.className = "prediction-my-bet";
        if (predictionWrapper) {
          predictionWrapper.appendChild(myBetEl);
        }
      }

      // 요소가 원래 있었거나 방금 생성되었으므로, 내용을 업데이트
      const myOption = options.find((o) => o.optionNo === mySelectionNo);
      myBetEl.innerHTML = `
          나의 선택: <b>${myOption ? myOption.optionText : "..."}</b> 
          ${makeLogPowerSVG()} <span>${(
        liveDetails.participation?.bettingPowers || 0
      ).toLocaleString()}</span>
      ${
        myOption.distributionRate
          ? ` | 예상 획득 파워: <span class="prediction-dist-rate">${makeLogPowerSVG()} ${Math.floor(
              liveDetails.participation?.bettingPowers *
                myOption.distributionRate.toFixed(2)
            ).toLocaleString()}</span>`
          : ""
      }
        `;
    } else if (!mySelectionNo && myBetEl) {
      myBetEl.remove(); // 참여하지 않게 된 경우(매우 드묾)
    }
  }
}

function animateRemove(el) {
  return new Promise((resolve) => {
    // 강제 리플로우는 1회만
    const h = el.getBoundingClientRect().height;
    el.style.height = h + "px";
    el.style.boxSizing = "border-box";
    el.classList.add("collapsing");

    requestAnimationFrame(() => {
      el.classList.add("leaving");
      el.style.height = "0px";

      const onEnd = (e) => {
        if (e.propertyName === "height") {
          el.removeEventListener("transitionend", onEnd);
          // 애니메이션에 썼던 인라인/클래스 정리
          el.style.height = "";
          el.classList.remove("collapsing", "leaving");
          resolve();
        }
      };
      el.addEventListener("transitionend", onEnd);
    });
  });
}

async function updateCenterHeader() {
  const centerHeader = document.querySelector(".center-header h3");
  if (!centerHeader) return;

  const filteredCount = Number.isFinite(virtualState.filteredCount)
    ? virtualState.filteredCount
    : 0;
  const displayLimit = Number.isFinite(virtualState.displayLimit)
    ? virtualState.displayLimit
    : 300;

  centerHeader.innerHTML = `최신 알림 <span>(${filteredCount}/${displayLimit})</span>`;
}

/**
 * 효율적인 렌더링을 위한 메인 함수 (DOM 비교 및 최소 업데이트)
 */
function renderList(
  nextItems,
  liveStatusMap,
  partyDonationStatusMap,
  partyStatusMap
) {
  const container = document.getElementById("notification-list");
  const inner = ensureVirtualInner();
  // const curNodes = new Map(
  //   Array.from(container.children).map((el) => [el.dataset.id, el])
  // );
  // 현재 노드는 "알림 아이템"만 수집 (센티넬/기타 제외)
  const curNodes = new Map(
    Array.from(inner.querySelectorAll(".notification-item")).map((el) => [
      el.dataset.id,
      el,
    ])
  );

  const frag = document.createDocumentFragment();

  // 1. 새로운 목록(nextItems)을 기준으로 순회
  for (const item of nextItems) {
    const id = item.id;
    let el = curNodes.get(id);

    if (el) {
      // 2. 이미 존재하는 노드일 경우: 변경점 확인 후 패치 또는 이동
      // 모든 알림 타입에 대해 변경을 감지하고 패치하도록 수정
      if (
        signatureChanged(
          el.__sig,
          item,
          liveStatusMap,
          partyDonationStatusMap,
          partyStatusMap,
          virtualState.predictionStatusMap
        )
      ) {
        if (item.type === "PARTY_START") {
          patchPartyNode(
            el,
            item,
            liveStatusMap,
            partyDonationStatusMap,
            partyStatusMap
          ); // 파티 전용 패치
        } else if (item.type === "PREDICTION_START") {
          patchPredictionNode(
            el,
            item,
            liveStatusMap,
            virtualState.predictionStatusMap
          );
        } else {
          patchGenericNode(
            el,
            item,
            liveStatusMap,
            virtualState.predictionStatusMap
          ); // 그 외 모든 타입 범용 패치
        }
      }
      el.__sig = makeSig(
        item,
        liveStatusMap,
        partyDonationStatusMap,
        partyStatusMap,
        virtualState.predictionStatusMap
      ); // 다음 비교를 위한 시그니처 저장
      frag.appendChild(el); // 기존 노드를 새 위치로 "이동"
      curNodes.delete(id);
    } else {
      // 3. 새로운 노드일 경우: 새로 생성
      el = createNotificationNode(
        item,
        liveStatusMap,
        partyDonationStatusMap,
        partyStatusMap,
        virtualState.predictionStatusMap
      );
      el.__sig = makeSig(
        item,
        liveStatusMap,
        partyDonationStatusMap,
        partyStatusMap,
        virtualState.predictionStatusMap
      );
      frag.appendChild(el);
    }
  }

  // 4. 더 이상 목록에 없는 노드들만 제거
  for (const [, el] of curNodes) el.remove();

  // 5. 한 번에 DOM에 삽입하여 reflow 최소화
  // container.replaceChildren(frag);
  inner.replaceChildren(frag);
}

/**
 * 알림 센터를 렌더링하고 이벤트를 설정하는 함수
 */
async function renderNotificationCenter(options = { resetScroll: false }) {
  const listElement = document.getElementById("notification-list");
  let noNotificationsElement = document.getElementById("no-notifications");

  const markAllBtn = document.getElementById("mark-all-btn");
  const markLiveBtn = document.getElementById("mark-live-btn");
  const markCategoryLiveTitleBtn = document.getElementById(
    "mark-category-live-title-btn"
  );
  const markWatchPartyBtn = document.getElementById("mark-watch-party-btn");
  const markDropsBtn = document.getElementById("mark-drops-btn");
  const markPartyBtn = document.getElementById("mark-party-btn");
  const markPartyDonationBtn = document.getElementById(
    "mark-party-donation-btn"
  );
  const markLogPowerBtn = document.getElementById("mark-logpower-btn");
  const markLogPowerPredictionBtn = document.getElementById(
    "mark-logpower-prediction-btn"
  );
  const markRestrictBtn = document.getElementById("mark-restrict-btn");
  const markVideoBtn = document.getElementById("mark-video-btn");
  const markCommunityBtn = document.getElementById("mark-community-btn");
  const markLoungeBtn = document.getElementById("mark-lounge-btn");
  const markBannerBtn = document.getElementById("mark-banner-btn");

  const markAllReadBtn = document.getElementById("mark-all-read-btn");
  const markAllDeleteBtn = document.getElementById("mark-all-delete-btn");

  const centerHeader = document.querySelector(".center-header h3");

  // 1. 스토리지에서 알림 내역 가져오기
  const {
    notificationHistory = [],
    liveStatus: _liveStatus,
    partyStatus: _partyStatus,
    partyDonationStatus: _partyDonationStatus,
    predictionStatus: _predictionStatus,
    displayLimit: _displayLimit,
  } = await chrome.storage.local.get([
    "notificationHistory",
    "liveStatus",
    "partyStatus",
    "partyDonationStatus",
    "predictionStatus",
    "displayLimit",
  ]);

  const displayLimit = typeof _displayLimit === "number" ? _displayLimit : 300;

  // 1) 필터링/표시 상한 계산
  const displayHistory = notificationHistory.slice(0, displayLimit);
  let filteredHistory = displayHistory;
  if (currentFilter !== "ALL") {
    if (currentFilter === "CATEGORY/LIVETITLE") {
      filteredHistory = displayHistory.filter(
        (item) =>
          item.type === "CATEGORY/LIVETITLE" ||
          item.type === "CATEGORY" ||
          item.type === "LIVETITLE"
      );
    } else if (currentFilter === "LIVE_ACTIVITY") {
      filteredHistory = displayHistory.filter(
        (item) => item.type === "LIVE" || item.type === "LIVE_OFF"
      );
    } else if (currentFilter === "PARTY") {
      filteredHistory = displayHistory.filter(
        (item) =>
          item.type === "PARTY_START" ||
          item.type === "PARTY_LEFT" ||
          item.type === "PARTY_END"
      );
    } else if (currentFilter === "DONATION") {
      filteredHistory = displayHistory.filter(
        (item) => item.type === "DONATION_START" || item.type === "DONATION_END"
      );
    } else if (currentFilter === "LOGPOWER") {
      filteredHistory = displayHistory.filter(
        (item) => item.type === "LOGPOWER" || item.type === "LOGPOWER/SUMMARY"
      );
    } else if (currentFilter === "PREDICTION") {
      filteredHistory = displayHistory.filter(
        (item) =>
          item.type === "PREDICTION_START" || item.type === "PREDICTION_END"
      );
    } else {
      filteredHistory = displayHistory.filter(
        (item) => item.type === currentFilter
      );
    }
  }

  const existingIds = new Set(notificationHistory.map((item) => item.id));

  // 필터링된 기록을 순회하며, DONATION_START 알림에 플래그를 추가
  filteredHistory.forEach((item) => {
    if (item.type === "DONATION_START" && item.targetPartyStartId) {
      item.isTargetPartyMissing = !existingIds.has(item.targetPartyStartId);
    }
  });

  const itemsWithDates = [];
  let lastDateStr = null;

  for (const item of filteredHistory) {
    const itemDate = parseTimestampFormat(item.timestamp);
    // 날짜가 동일한지 비교하기 위한 표준 문자열 (예: "Fri Sep 19 2025")
    const dateKey = new Date(
      itemDate.getFullYear(),
      itemDate.getMonth(),
      itemDate.getDate()
    ).toDateString();

    if (dateKey !== lastDateStr) {
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      const dayOfWeek = days[itemDate.getDay()];

      const formattedDate = `${itemDate.getFullYear()}년 ${
        itemDate.getMonth() + 1
      }월 ${itemDate.getDate()}일 (${dayOfWeek})`;
      itemsWithDates.push({
        type: "DATE_SEPARATOR",
        id: `date-${formattedDate}`, // 가상 스크롤을 위한 고유 ID
        dateStr: formattedDate,
      });
      lastDateStr = dateKey;
    }
    itemsWithDates.push(item);
  }

  // 2) 빈 목록 처리
  if (filteredHistory.length === 0) {
    noNotificationsElement.style.display = "flex";
    listElement.style.display = "none";
    noNotificationsElement.innerHTML = "<p>표시할 알림이 없습니다.</p>";
    detachVirtualObserver();
    ensureVirtualInner().replaceChildren(); // 이것만 비움
    ensureSentinel(); // 혹시 모를 유실 방지
    return;
  }

  noNotificationsElement.style.display = "none";
  listElement.style.display = "block";

  // 3) 가상 목록 상태 초기화
  virtualState.items = itemsWithDates;
  virtualState.max = itemsWithDates.length;
  virtualState.rendered = 0;
  virtualState.liveStatusMap = _liveStatus ?? {};
  virtualState.partyDonationStatusMap = _partyDonationStatus ?? {};
  virtualState.partyStatusMap = _partyStatus ?? {};
  virtualState.predictionStatusMap = _predictionStatus ?? {};
  virtualState.loading = false;
  virtualState.filteredCount = filteredHistory.length;
  virtualState.displayLimit = displayLimit;

  // 4) 초기 청크 렌더 + 옵저버 부착
  renderNextChunk(); // 첫 100~200개
  attachVirtualObserver(); // 스크롤 끝에 닿으면 다음 청크

  if (centerHeader) {
    centerHeader.innerHTML = `최신 알림 <span>(${virtualState.filteredCounT}/${virtualState.displayLimit})</span>`;
  }
  // 옵션에 따라 스크롤을 초기화하도록 변경
  if (options.resetScroll) {
    listElement.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // 2. 액션 버튼 (모두 읽음/삭제) 표시 여부 결정
  if (displayHistory.length === 0) {
    markAllReadBtn.style.display = "none";
    markAllDeleteBtn.style.display = "none";
  } else {
    markAllReadBtn.style.display = "block";
    markAllDeleteBtn.style.display = "block";
  }

  // 3. 카테고리 필터 버튼 표시 여부 결정
  // 먼저 모든 버튼을 숨겨서 초기화
  const allFilterButtons = document.querySelectorAll(
    ".mark-btn-wrapper button"
  );

  allFilterButtons.forEach((btn) => (btn.style.display = "none"));

  if (displayHistory.length > 0) {
    markAllReadBtn.style.display = "flex";
    markAllReadBtn.style.alignItems = "center";
    markAllDeleteBtn.style.display = "flex";
    markAllDeleteBtn.style.alignItems = "center";

    markAllBtn.style.display = "flex";
    markAllBtn.style.alignItems = "center";
    markAllBtn.title = "전체";

    const historySet = new Set();

    displayHistory.slice().filter((item) => historySet.add(item.type));

    historySet.forEach((item) => {
      switch (item) {
        case "LIVE":
        case "LIVE_OFF":
          markLiveBtn.style.display = "flex";
          markLiveBtn.style.alignItems = "center";
          markLiveBtn.title = "라이브";
          break;
        case "CATEGORY/LIVETITLE":
        case "LIVETITLE":
        case "CATEGORY":
          markCategoryLiveTitleBtn.style.display = "flex";
          markCategoryLiveTitleBtn.style.alignItems = "center";
          markCategoryLiveTitleBtn.title = "카테고리/라이브 제목";
          break;
        case "WATCHPARTY":
          markWatchPartyBtn.style.display = "flex";
          markWatchPartyBtn.style.alignItems = "center";
          markWatchPartyBtn.title = "같이보기";
          break;
        case "DROPS":
          markDropsBtn.style.display = "flex";
          markDropsBtn.style.alignItems = "center";
          markDropsBtn.title = "드롭스";
          break;
        case "PARTY_START":
        case "PARTY_LEFT":
        case "PARTY_END":
          markPartyBtn.style.display = "flex";
          markPartyBtn.style.alignItems = "center";
          markPartyBtn.title = "파티";
          break;
        case "DONATION_START":
        case "DONATION_END":
          markPartyDonationBtn.style.display = "flex";
          markPartyDonationBtn.style.alignItems = "center";
          markPartyDonationBtn.title = "파티 후원";
          break;
        case "LOGPOWER":
        case "LOGPOWER/SUMMARY":
          markLogPowerBtn.style.display = "flex";
          markLogPowerBtn.style.alignItems = "center";
          markLogPowerBtn.title = "통나무 파워";
          break;
        case "PREDICTION_START":
        case "PREDICTION_END":
          markLogPowerPredictionBtn.style.display = "flex";
          markLogPowerPredictionBtn.style.alignItems = "center";
          markLogPowerPredictionBtn.title = "통나무 파워 승부예측";
          break;
        case "ADULT":
          markRestrictBtn.style.display = "flex";
          markRestrictBtn.style.alignItems = "center";
          markRestrictBtn.title = "19세 연령 제한";
          break;
        case "VIDEO":
          markVideoBtn.style.display = "flex";
          markVideoBtn.style.alignItems = "center";
          markVideoBtn.title = "다시보기/동영상";
          break;
        case "POST":
          markCommunityBtn.style.display = "flex";
          markCommunityBtn.style.alignItems = "center";
          markCommunityBtn.title = "커뮤니티";
          break;
        case "LOUNGE":
          markLoungeBtn.style.display = "flex";
          markLoungeBtn.style.alignItems = "center";
          markLoungeBtn.title = "라운지";
          break;
        case "BANNER":
          markBannerBtn.style.display = "flex";
          markBannerBtn.style.alignItems = "center";
          markBannerBtn.title = "배너";
          break;
      }
    });
  }

  allFilterButtons.forEach((btn) => btn.classList.remove("active-filter"));

  // 현재 필터(currentFilter)에 해당하는 버튼을 찾아 active-filter 클래스를 추가
  switch (currentFilter) {
    case "ALL":
      document.getElementById("mark-all-btn").classList.add("active-filter");
      markAllDeleteBtn.innerHTML = `${allSVG}&nbsp;모두 삭제`;
      markAllReadBtn.innerHTML = `${allSVG}&nbsp;모두 읽음`;
      break;
    case "LIVE_ACTIVITY":
      document.getElementById("mark-live-btn").classList.add("active-filter");
      markAllDeleteBtn.innerHTML = `${liveOnSVG}/${liveOffSVG}&nbsp;모두 삭제`;
      markAllReadBtn.innerHTML = `${liveOnSVG}/${liveOffSVG}&nbsp;모두 읽음`;
      break;
    case "CATEGORY/LIVETITLE":
      document
        .getElementById("mark-category-live-title-btn")
        .classList.add("active-filter");
      markAllDeleteBtn.innerHTML = `${liveChangeSVG}&nbsp;모두 삭제`;
      markAllReadBtn.innerHTML = `${liveChangeSVG}&nbsp;모두 읽음`;
      break;
    case "WATCHPARTY":
      document
        .getElementById("mark-watch-party-btn")
        .classList.add("active-filter");
      markAllDeleteBtn.innerHTML = `${watchPartySVG}&nbsp;모두 삭제`;
      markAllReadBtn.innerHTML = `${watchPartySVG}&nbsp;모두 읽음`;
      break;
    case "DROPS":
      document.getElementById("mark-drops-btn").classList.add("active-filter");
      markAllDeleteBtn.innerHTML = `${dropsSVG}&nbsp;모두 삭제`;
      markAllReadBtn.innerHTML = `${dropsSVG}&nbsp;모두 읽음`;
      break;
    case "PARTY":
      document.getElementById("mark-party-btn").classList.add("active-filter");
      markAllDeleteBtn.innerHTML = `${partyStartSVG}/${partyEndSVG}&nbsp;모두 삭제`;
      markAllReadBtn.innerHTML = `${partyStartSVG}/${partyEndSVG}&nbsp;모두 읽음`;
      break;
    case "DONATION":
      document
        .getElementById("mark-party-donation-btn")
        .classList.add("active-filter");
      markAllDeleteBtn.innerHTML = `${partyDonationStartSVG}/${partyDonationEndSVG}&nbsp;모두 삭제`;
      markAllReadBtn.innerHTML = `${partyDonationStartSVG}/${partyDonationEndSVG}&nbsp;모두 읽음`;
      break;
    case "LOGPOWER":
      document
        .getElementById("mark-logpower-btn")
        .classList.add("active-filter");
      markAllDeleteBtn.innerHTML = `${logPowerTitleSVG} &nbsp;모두 삭제`;
      markAllReadBtn.innerHTML = `${logPowerTitleSVG} &nbsp;모두 읽음`;
      break;
    case "ADULT":
      document
        .getElementById("mark-restrict-btn")
        .classList.add("active-filter");
      markAllDeleteBtn.innerHTML = `${restrictOnSVG}&nbsp;모두 삭제`;
      markAllReadBtn.innerHTML = `${restrictOnSVG}&nbsp;모두 읽음`;
      break;
    case "VIDEO":
      document.getElementById("mark-video-btn").classList.add("active-filter");
      markAllDeleteBtn.innerHTML = `${replaySVG}/${uploadSVG}&nbsp;모두 삭제`;
      markAllReadBtn.innerHTML = `${replaySVG}/${uploadSVG}&nbsp;모두 읽음`;
      break;
    case "POST":
      document
        .getElementById("mark-community-btn")
        .classList.add("active-filter");
      markAllDeleteBtn.innerHTML = `${communitySVG}&nbsp;모두 삭제`;
      markAllReadBtn.innerHTML = `${communitySVG}&nbsp;모두 읽음`;
      break;
    case "LOUNGE":
      document.getElementById("mark-lounge-btn").classList.add("active-filter");
      markAllDeleteBtn.innerHTML = `${loungeSVG}&nbsp;모두 삭제`;
      markAllReadBtn.innerHTML = `${loungeSVG}&nbsp;모두 읽음`;
      break;
    case "BANNER":
      document.getElementById("mark-banner-btn").classList.add("active-filter");
      markAllDeleteBtn.innerHTML = `${bannerSVG}&nbsp;모두 삭제`;
      markAllReadBtn.innerHTML = `${bannerSVG}&nbsp;모두 읽음`;
      break;
  }

  // 4. 이벤트 리스너 설정
  // '모두 읽음' 버튼 클릭
  markAllReadBtn.onclick = async () => {
    const { displayLimit = 300 } = await chrome.storage.local.get(
      "displayLimit"
    );

    chrome.runtime.sendMessage({
      type: "MARK_ALL_READ",
      filter: currentFilter,
      limit: displayLimit,
    });
  };

  // '모두 삭제' 버튼 이벤트 핸들러
  markAllDeleteBtn.onclick = async () => {
    const { notificationHistory: history = [], displayLimit = 300 } =
      await chrome.storage.local.get(["notificationHistory", "displayLimit"]);

    // 현재 필터 조건을 만족하는 함수를 정의
    const filterCondition = (item) => {
      if (currentFilter === "ALL") return true;
      if (currentFilter === "CATEGORY/LIVETITLE") {
        return (
          item.type === "CATEGORY/LIVETITLE" ||
          item.type === "CATEGORY" ||
          item.type === "LIVETITLE"
        );
      }
      if (currentFilter === "LIVE_ACTIVITY") {
        return item.type === "LIVE" || item.type === "LIVE_OFF";
      }
      if (currentFilter === "PARTY") {
        return (
          item.type === "PARTY_START" ||
          item.type === "PARTY_LEFT" ||
          item.type === "PARTY_END"
        );
      }
      if (currentFilter === "DONATION") {
        return item.type === "DONATION_START" || item.type === "DONATION_END";
      }
      if (currentFilter === "LOGPOWER") {
        return item.type === "LOGPOWER" || item.type === "LOGPOWER/SUMMARY";
      }
      if (currentFilter === "PREDICTION") {
        return (
          item.type === "PREDICTION_START" || item.type === "PREDICTION_END"
        );
      }
      return item.type === currentFilter;
    };

    const itemsToRemove = history
      .filter(filterCondition)
      .slice(0, displayLimit);

    // 먼저 화면에서 부드럽게 접는 애니메이션
    const nodesToRemove = itemsToRemove
      .map((it) =>
        document.querySelector(
          `#notification-list .notification-item[data-id="${CSS.escape(
            it.id
          )}"]`
        )
      )
      .filter(Boolean);

    // 가상 스크롤의 IntersectionObserver를 일시적으로 중지시켜
    //    애니메이션 도중 새 항목이 렌더링되는 것을 방지
    detachVirtualObserver();
    // 옵저버 상태 끊기 (무한 스크롤 재주입 방지)
    if (window.virtualState) {
      try {
        virtualState.items = [];
        virtualState.max = 0;
        virtualState.rendered = 0;
        virtualState.loading = false;
        if (virtualState.observer) {
          virtualState.observer.disconnect();
          virtualState.observer = null;
        }
      } catch {}
    }

    await Promise.all(nodesToRemove.map(animateRemove));

    if (centerHeader) {
      centerHeader.innerHTML = `최신 알림 <span>(0/${displayLimit})</span>`;
    }

    chrome.runtime.sendMessage({
      type: "DELETE_ALL_FILTERED",
      filter: currentFilter,
      limit: Number.MAX_SAFE_INTEGER,
    });
  };

  markAllBtn.onclick = async () => {
    currentFilter = "ALL";
    renderNotificationCenter({ resetScroll: true });
  };

  markLiveBtn.onclick = () => {
    currentFilter = "LIVE_ACTIVITY";
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

  markPartyBtn.onclick = () => {
    currentFilter = "PARTY";
    renderNotificationCenter({ resetScroll: true });
  };

  markPartyDonationBtn.onclick = () => {
    currentFilter = "DONATION";
    renderNotificationCenter({ resetScroll: true });
  };

  markLogPowerBtn.onclick = () => {
    currentFilter = "LOGPOWER";
    renderNotificationCenter({ resetScroll: true });
  };

  markLogPowerPredictionBtn.onclick = () => {
    currentFilter = "PREDICTION";
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

    // 개별 버튼 클릭을 가장 먼저 확인
    if (target.classList.contains("mark-one-delete-btn")) {
      // 1) 먼저 UI에서 제거(애니메이션)
      await animateRemove(itemElement);
      itemElement.remove(); // DOM 실제 제거

      // 2) 가상 리스트 상태도 낙관적으로 조정
      const idx = virtualState.items.findIndex((it) => it.id === itemId);
      if (idx !== -1) {
        virtualState.items.splice(idx, 1);
        virtualState.max = Math.max(0, virtualState.max - 1);
        virtualState.rendered = Math.min(
          virtualState.rendered,
          virtualState.max
        );
      }

      if (virtualState.filteredCount > 0) {
        virtualState.filteredCount -= 1;
      }

      // 헤더 카운트 즉시 반영
      updateCenterHeader();

      // 3) 다음 onChanged 1회는 무시
      suppressNextStorageRerender = true;

      chrome.runtime.sendMessage({
        type: "DELETE_NOTIFICATION",
        notificationId: itemId,
      });
      return;
    }

    // 위 두 조건에 모두 해당하지 않으면 일반 클릭으로 처리
    chrome.runtime.sendMessage({
      type: "NOTIFICATION_CLICKED",
      notificationId: itemId,
    });

    // 사용자 경험을 위해 팝업을 즉시 닫음
    window.close();
  };

  updateCenterHeader();

  // === Keyboard scroll (ArrowUp/W = up, ArrowDown/S = down) ===
  (function initKeyboardScroll() {
    const list = document.getElementById("notification-list"); // 스크롤 컨테이너
    if (!list) return;

    // 컨테이너가 포커스를 받을 수 있게(키보드 접근성)
    if (!list.hasAttribute("tabindex")) list.setAttribute("tabindex", "0");

    // 스크롤 1회 이동량: 컨테이너 높이의 90% (최소 120px)
    const step = () => Math.max(120, Math.floor(list.clientHeight * 0.9));

    // 입력 필드/텍스트영역 등에서 타이핑 중엔 동작 금지
    const isTypingContext = (el) => {
      if (!el) return false;
      const tag = el.tagName;
      const editable =
        el.getAttribute && el.getAttribute("contenteditable") === "true";
      return (
        editable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
      );
    };

    // rAF로 중복 키 입력 시 부드럽게 합쳐서 처리
    let pending = 0;
    let rafId = 0;
    const flush = () => {
      if (!pending) return;
      const dy = pending;
      pending = 0;
      rafId = 0;
      list.scrollBy({ top: dy, behavior: "smooth" });
    };

    window.addEventListener(
      "keydown",
      (e) => {
        // 오버레이/라이트박스 등 다른 UI가 키를 쓰는 경우엔 기본 흐름 존중
        if (isTypingContext(document.activeElement)) return;

        // --- Shift 조합: 즉시 점프 ---
        if (e.shiftKey && (e.key === "ArrowUp" || e.code === "KeyW")) {
          e.preventDefault();
          list.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        if (e.shiftKey && (e.key === "ArrowDown" || e.code === "KeyS")) {
          e.preventDefault();
          // 가상스크롤 컨테이너의 현재 끝으로 이동 (센티넬 관찰로 다음 청크가 로드됨)
          list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
          return;
        }

        // Up/W
        if (e.key === "ArrowUp" || e.code === "KeyW") {
          e.preventDefault();
          pending -= step();
        }
        // Down/S
        else if (e.key === "ArrowDown" || e.code === "KeyS") {
          e.preventDefault();
          pending += step();
        } else {
          return;
        }

        // 요청 예약
        if (!rafId) rafId = requestAnimationFrame(flush);
      },
      { passive: false }
    );
  })();
}

async function handleGotoPartyInfo(itemElement) {
  // 삭제 버튼이 아닐 경우에만 스크롤 동작을 확인
  if (itemElement.classList.contains("donation-event-item")) {
    const targetId = itemElement.dataset.targetId;
    if (!targetId) return; // 목표 ID가 없으면 아무것도 안 함

    const targetElement = document.querySelector(
      `[data-party-start-id="${targetId}"]`
    );

    if (targetElement) {
      // 1-1. 목표가 현재 화면에 있으면 바로 스크롤하고 종료
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      targetElement.classList.add("highlight");
      setTimeout(() => {
        targetElement.classList.remove("highlight");
      }, 1500);
    } else {
      // 2. 목표가 현재 화면에 없으면, storage에 실제로 존재하는지 확인
      const { notificationHistory = [] } = await chrome.storage.local.get(
        "notificationHistory"
      );
      const targetExistsInHistory = notificationHistory.some(
        (item) => item.id === targetId
      );

      if (targetExistsInHistory) {
        // 2-1. storage에 존재한다면, 필터를 "PARTY"로 변경하고 다시 렌더링
        currentFilter = "PARTY";
        await renderNotificationCenter({ resetScroll: true });

        // 다시 렌더링된 후 목표 요소를 찾아 스크롤
        // requestAnimationFrame을 사용하여 DOM 업데이트 후 안정적으로 요소를 찾음
        setTimeout(() => {
          requestAnimationFrame(() => {
            const newTargetElement = document.querySelector(
              `[data-party-start-id="${targetId}"]`
            );
            if (newTargetElement) {
              newTargetElement.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
              newTargetElement.classList.add("highlight");
              setTimeout(() => {
                newTargetElement.classList.remove("highlight");
              }, 1500);
            } else {
              // 필터를 바꿨는데도 표시되지 않는 경우
              alert(
                "해당 파티 알림을 찾을 수 없습니다.\n필터를 확인하거나 표시 개수를 늘려주세요."
              );
            }
          });
        }, 100);
      } else {
        // 2-2. storage에도 목표가 없으면 (삭제된 경우), 필터를 변경하지 않고 알림을 표시
        await renderNotificationCenter({ resetScroll: true });
      }
    }
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

  // 4. 세 줄 이상의 연속된 줄바꿈을 두 줄로 축소
  return oneBlankLineNormalized.replace(/(?:\n[ \t]*){3,}/g, "\n\n");
}

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

function makeExcerpt(text) {
  const collapsed = normalizeBody(text || "");
  const paraCount = countParagraphs(collapsed);
  const max =
    paraCount > 7 ? 240 : paraCount > 6 ? 260 : paraCount > 5 ? 280 : 375;
  return collapsed.length > max
    ? collapsed.slice(0, max).replace(/\s+\S*$/, "") + " ...(더보기)"
    : collapsed;
}

// 뱃지(badge)를 생성하고 컨테이너에 추가하는 헬퍼 함수
function appendBadges(container, item, svgAdultElement) {
  const watchPartyLink = document.createElement("a");
  watchPartyLink.className = "live-watch-party-link";
  watchPartyLink.href = `${CHZZK_WATCHPARTY_URL}ALL`;
  watchPartyLink.title = `같이보기로 이동`;
  watchPartyLink.target = "_blank"; // 새 탭에서 열기

  const watchPartySpan = document.createElement("span");
  watchPartySpan.className = "live-watchParty";
  watchPartySpan.textContent = "같이보기";

  watchPartySpan.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  watchPartyLink.appendChild(watchPartySpan);

  const watchPartyNoLink = document.createElement("a");
  watchPartyNoLink.className = "live-watch-party-link";
  watchPartyNoLink.href = item.watchPartyNo
    ? `${CHZZK_WATCHPARTY_URL}${item.watchPartyNo}`
    : `${CHZZK_WATCHPARTY_URL}ALL`;
  watchPartyNoLink.title = `${item.watchPartyTag} (으)로 이동`;
  watchPartyNoLink.target = "_blank"; // 새 탭에서 열기

  const watchPartyTagSpan = document.createElement("span");
  watchPartyTagSpan.className = "live-watchParty";
  watchPartyTagSpan.textContent = item.watchPartyTag;

  watchPartyTagSpan.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  watchPartyNoLink.appendChild(watchPartyTagSpan);

  const primeSpan = document.createElement("span");
  primeSpan.className = "live-prime";
  primeSpan.textContent = "프라임";

  const dropsLink = document.createElement("a");
  dropsLink.className = "live-drops-link";
  dropsLink.href = `${item.categoryUrl}/lives#drops`;
  dropsLink.title = `${item.liveCategoryValue} 드롭스로 이동`;
  dropsLink.target = "_blank"; // 새 탭에서 열기

  const dropsSpan = document.createElement("span");
  dropsSpan.className = "live-drops";
  dropsSpan.textContent = "드롭스";

  dropsSpan.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  dropsLink.appendChild(dropsSpan);

  const paidPromotionSpan = document.createElement("span");
  paidPromotionSpan.className = "live-paid-promotion";
  paidPromotionSpan.textContent = "유료 프로모션 포함";

  const adultSpan = document.createElement("span");
  adultSpan.className = "live-adult";
  adultSpan.appendChild(svgAdultElement.cloneNode(true));

  if (item.watchPartyTag) container.append(watchPartyLink, watchPartyNoLink);
  if (item.isPrime) container.appendChild(primeSpan);
  if (item.dropsCampaignNo) container.appendChild(dropsLink);
  if (item.paidPromotion) container.appendChild(paidPromotionSpan);
  if (item.adultMode) container.appendChild(adultSpan);
}

/**
 * 파티 알림 메시지 내에 후원 정보 UI를 생성하고 추가하는 함수
 * @param {HTMLElement} container - 후원 UI가 추가될 부모 요소 (messageDiv)
 * @param {object} item - 알림 데이터 객체 (PARTY_START)
 * @param {object} donationInfo - 해당 파티의 후원 상태 정보
 */
function renderDonationInfo(container, item, donationInfo) {
  const donationDiv = document.createElement("div");
  donationDiv.className = "chzzk-party-donation-info";
  donationDiv.dataset.memberCount = item.memberCount;

  const modeEl = document.createElement("span");
  modeEl.className = "chzzk-party-donation-mode";
  modeEl.dataset.distributionMode = donationInfo.distributionMode;

  const distributionListDiv = document.createElement("div");
  distributionListDiv.className = "chzzk-party-donation-distribution";
  distributionListDiv.classList.add("hidden");

  const cheeseIcon = makeCheeseSVG();

  const totalAmountEl = document.createElement("span");
  totalAmountEl.className = "donation-total-amount";
  totalAmountEl.dataset.partyNo = item.partyNo;
  totalAmountEl.innerHTML = `${cheeseIcon}&nbsp;총 후원금: ${(
    donationInfo.totalDonationAmount || 0
  ).toLocaleString()}&nbsp;치즈`;

  const infoText = document.createElement("span");
  infoText.className = "donation-info-text";
  infoText.textContent = "표시된 후원금은 실제와 차이가 있을 수 있습니다";
  const infoHostRewardText = document.createTextNode(
    "호스트 수고비가 있다면, 총 후원금에서 수고비를 제한 금액으로 분배"
  );

  const br = document.createElement("br");
  const infoHostRatioText = document.createTextNode(
    "분배 비율에 따라 후원금 계산 시 발생하는 소수점 이하 자투리 금액은 합산되어 호스트에게 제공"
  );

  infoText.append(
    br,
    infoHostRewardText,
    br.cloneNode(true),
    infoHostRatioText
  );

  if (donationInfo.distributionMode === "SAME_FOR_ALL") {
    modeEl.textContent = `똑같이 나누기`;

    const donationWrapper = document.createElement("div");
    donationWrapper.className = "donation-distribution-wrapper";
    donationWrapper.textContent = "똑같이 나눌 후원금 ";

    const cheeseIcon = makeCheeseSVG();

    const donationPerPerson = document.createElement("span");
    donationPerPerson.className = "donation-per-person-same";
    donationPerPerson.dataset.partyNo = item.partyNo;
    donationPerPerson.dataset.memberCount = item.memberCount;
    donationPerPerson.style.border = "none";
    donationPerPerson.innerHTML = `${cheeseIcon}&nbsp;${Math.floor(
      donationInfo.totalDonationAmount / item.memberCount
    ).toLocaleString()}&nbsp;치즈`;

    donationWrapper.append(donationPerPerson, infoText.cloneNode(true));

    distributionListDiv.append(donationWrapper);

    modeEl.addEventListener("click", (event) => {
      event.stopPropagation();

      const isHidden = distributionListDiv.classList.toggle("hidden");
      if (!isHidden)
        distributionListDiv.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
    });
  } else if (donationInfo.distributionMode === "ALL_IN") {
    modeEl.textContent = `1명에게 몰아주기`;

    const donationWrapper = document.createElement("div");
    donationWrapper.className = "donation-distribution-wrapper";
    donationWrapper.textContent = "1명에게 몰아줄 후원금 ";

    const cheeseIcon = makeCheeseSVG();

    const donationPerPerson = document.createElement("span");
    donationPerPerson.className = "donation-per-person-all-in";
    donationPerPerson.dataset.partyNo = item.partyNo;
    donationPerPerson.style.border = "none";
    donationPerPerson.innerHTML = `${cheeseIcon}&nbsp;${donationInfo.totalDonationAmount.toLocaleString()}&nbsp;치즈`;

    donationWrapper.append(donationPerPerson, infoText.cloneNode(true));

    distributionListDiv.append(donationWrapper);

    modeEl.addEventListener("click", (event) => {
      event.stopPropagation();

      const isHidden = distributionListDiv.classList.toggle("hidden");
      if (!isHidden)
        distributionListDiv.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
    });
  } else {
    modeEl.textContent = `자유롭게 나누기`;

    if (Array.isArray(donationInfo.distributionList)) {
      donationInfo.distributionList.forEach((distItem) => {
        const donationWrapper = document.createElement("div");
        donationWrapper.className = "donation-distribution-wrapper";

        const donationInfoSpan = document.createElement("span");
        donationInfoSpan.className = "donation-distribution-info";
        donationInfoSpan.textContent = `${
          distItem.rankName
        }에게 나눌 후원금 중 ${distItem.rate / 10}%`;

        const boldArrowChar = document.createElement("b");
        boldArrowChar.style.color = "black";
        boldArrowChar.textContent = " → ";

        const cheeseIcon = makeCheeseSVG();

        const donationPerPerson = document.createElement("span");
        donationPerPerson.className = "donation-per-person-free";
        donationPerPerson.dataset.partyNo = item.partyNo;
        donationPerPerson.dataset.rate = distItem.rate;
        donationPerPerson.innerHTML = `${cheeseIcon}&nbsp;${Math.floor(
          (donationInfo.totalDonationAmount * distItem.rate) / 1000
        ).toLocaleString()}&nbsp;치즈`;

        donationWrapper.append(
          donationInfoSpan,
          boldArrowChar,
          donationPerPerson
        );

        distributionListDiv.append(donationWrapper);
      });
    }

    modeEl.addEventListener("click", (event) => {
      event.stopPropagation();
      const isHidden = distributionListDiv.classList.toggle("hidden");
      if (!isHidden)
        distributionListDiv.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
    });
  }

  donationDiv.append(modeEl, totalAmountEl);
  container.append(donationDiv);
  if (donationInfo.distributionMode === "FREE") {
    distributionListDiv.appendChild(infoText.cloneNode(true));
    container.append(distributionListDiv);
  } else {
    container.append(distributionListDiv);
  }

  const teamMemberContainer = document.createElement("div");
  teamMemberContainer.className = "chzzk-party-team-member-container";

  if (
    donationInfo.mode === "TEAM_PLAY" &&
    donationInfo.partyTeamList &&
    donationInfo.partyTeamList.length > 0
  ) {
    const TEAM_COLORS = [
      "#FF6B6BA0",
      "#4D96FFA0",
      "#6BCB77A0",
      "#FFD93DA0",
      "#845EC2A0",
      "#FF9671A0",
      "#00C9A7A0",
      "#2C73D2A0",
      "#C34A36A0",
      "#008F7AA0",
    ];

    const TEAM_NAME_COLORS = [
      "#FF6B6B",
      "#4D96FF",
      "#6BCB77",
      "#FFD93D",
      "#845EC2",
      "#FF9671",
      "#00C9A7",
      "#2C73D2",
      "#C34A36",
      "#008F7A",
    ];

    // 모든 팀을 감싸는 메인 컨테이너
    const allTeamsContainer = document.createElement("div");
    allTeamsContainer.className = "chzzk-party-all-teams-container"; // CSS 스타일링을 위한 클래스
    allTeamsContainer.style.marginTop = "8px";

    donationInfo.partyTeamList.forEach((team, idx) => {
      const color = TEAM_COLORS[idx % TEAM_COLORS.length];
      const textColor = TEAM_NAME_COLORS[idx % TEAM_NAME_COLORS.length];

      // 1. 각 팀을 위한 개별 컨테이너 생성
      const singleTeamContainer = document.createElement("div");
      singleTeamContainer.className = "chzzk-party-team-container";
      singleTeamContainer.style.marginBottom = "8px";
      singleTeamContainer.style.setProperty("--team-color", color);
      singleTeamContainer.style.setProperty("--team-name-color", textColor);

      // 2. 팀 이름을 표시할 요소 생성
      const teamName = document.createElement("div");
      teamName.className = "chzzk-party-team-name"; // CSS 스타일링을 위한 클래스
      teamName.textContent = team.name;
      teamName.style.fontWeight = "bold";

      // 3. 해당 팀의 멤버들을 담을 컨테이너 생성
      const teamMembersContainer = document.createElement("div");
      teamMembersContainer.className = "chzzk-party-member"; // 기존 멤버 목록 스타일 재사용

      // 4. 팀 멤버 목록을 순회하며 각 멤버 요소를 생성하고 추가
      team.partyMemberList.forEach((member) => {
        // 이미 만들어 둔 createMemberElement 함수를 재활용
        const memberElement = createMemberElement(member, partyHostSVG);
        teamMembersContainer.appendChild(memberElement);
      });

      // 5. 팀 이름과 멤버 목록 컨테이너를 개별 팀 컨테이너에 추가
      singleTeamContainer.append(teamName, teamMembersContainer);

      // 6. 완성된 개별 팀 컨테이너를 전체 팀 컨테이너에 추가
      allTeamsContainer.appendChild(singleTeamContainer);
    });

    // 7. 모든 팀 정보가 담긴 메인 컨테이너를 최종적으로 페이지에 추가
    container.append(allTeamsContainer);
  }
}

// 모듈 스코프에 단일 라이트박스
const lightbox = (() => {
  let overlay, track, caption, prevBtn, nextBtn, fig;
  let list = [],
    idx = 0,
    lastFocus = null;

  function build() {
    overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.innerHTML = `
      <div class="lightbox__backdrop"></div>
      <figure class="lightbox__figure" role="dialog" aria-modal="true" tabindex="-1">
        <button class="lightbox__close" aria-label="닫기">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
            </svg>
        </button>
        <div class="lightbox__track"></div>
        <figcaption class="lightbox__caption"></figcaption>
        <button class="lightbox__nav lightbox__prev" aria-label="이전">‹</button>
        <button class="lightbox__nav lightbox__next" aria-label="다음">›</button>
      </figure>`;
    document.body.appendChild(overlay);

    fig = overlay.querySelector(".lightbox__figure");
    track = overlay.querySelector(".lightbox__track");
    caption = overlay.querySelector(".lightbox__caption");
    prevBtn = overlay.querySelector(".lightbox__prev");
    nextBtn = overlay.querySelector(".lightbox__next");
    const closeBtn = overlay.querySelector(".lightbox__close");

    // 닫기/배경/키 핸들러
    overlay
      .querySelector(".lightbox__backdrop")
      .addEventListener("click", close);
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        close();
      }
      if (e.key === "ArrowLeft" || e.code === "KeyA") go(-1);
      if (e.key === "ArrowRight" || e.code === "KeyD") go(+1);
    });

    // 버튼으로 이동: scrollTo 스무스
    prevBtn.addEventListener("click", () => go(-1));
    nextBtn.addEventListener("click", () => go(+1));

    // 스크롤이 끝나면 현재 인덱스를 동기화
    let raf = null;
    track.addEventListener("scroll", () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = slideWidth();
        if (w > 0) {
          const newIdx = Math.round(track.scrollLeft / w);
          if (newIdx !== idx) {
            idx = newIdx;
            updateCaption();
          }
        }
      });
    });

    // 리사이즈 시 현재 슬라이드 정렬 유지
    new ResizeObserver(() => alignToIndex(false)).observe(track);
  }

  function slideWidth() {
    return track.getBoundingClientRect().width;
  }

  function open(attaches, startIndex = 0) {
    if (!overlay) build();
    list = (attaches || []).map((a) => ({
      src: a.attachValue,
      alt: a.alt || "",
    }));

    // 슬라이드 채우기
    track.innerHTML = "";
    for (const it of list) {
      const slide = document.createElement("div");
      slide.className = "lightbox__slide";
      const img = document.createElement("img");
      img.className = "lightbox__img";
      img.src = it.src;
      img.alt = it.alt;
      img.addEventListener("click", close);
      slide.appendChild(img);
      track.appendChild(slide);
    }

    idx = Math.max(0, Math.min(startIndex, list.length - 1));
    document.documentElement.style.overflow = "hidden";
    lastFocus = document.activeElement; // 열기 직전 포커스 저장
    overlay.classList.add("open");
    updateCaption();
    alignToIndex(true); // 초기에는 즉시 위치
    fig.focus();

    // 네비 활성/비활성
    const many = list.length > 1;
    prevBtn.style.display = many ? "" : "none";
    nextBtn.style.display = many ? "" : "none";

    const imgs = track.querySelectorAll("img");
    imgs.forEach((img) => {
      if (!imgs.length) return;
      img.style.maxWidth = many ? "85dvw" : "90dvw";
    });
  }

  function updateCaption() {
    caption.textContent = list.length ? `${idx + 1} / ${list.length}` : "";
  }

  function alignToIndex(instant) {
    const w = slideWidth();
    if (w <= 0) return;
    track.scrollTo({ left: w * idx, behavior: instant ? "auto" : "smooth" });
  }

  function go(dir) {
    if (list.length < 2) return;
    idx = (idx + dir + list.length) % list.length;
    alignToIndex(true); // 버튼은 즉시 위치 맞추고
    requestAnimationFrame(() => {
      // 다음 프레임에 부드럽게 보정
      alignToIndex(false);
    });
    updateCaption();
  }

  function close() {
    overlay.classList.remove("open");
    document.documentElement.style.overflow = "";
    // 닫을 때 포커스 복귀 (DOM에 아직 남아있고 focus 가능한 경우만)
    if (
      lastFocus &&
      lastFocus.isConnected &&
      typeof lastFocus.focus === "function"
    ) {
      lastFocus.focus();
    }
    lastFocus = null;
  }

  return { open };
})();

/**
 * 알림 아이템 HTML 요소를 생성하는 함수
 * @param {object} item - 알림 데이터 객체
 * @param {object} liveStatusMap - 모든 채널의 최신 라이브 상태 맵
 */
function createNotificationNode(
  item,
  liveStatusMap,
  partyDonationStatusMap,
  partyStatusMap,
  predictionStatusMap
) {
  // *** 현재 라이브 상태를 liveStatusMap에서 확인 ***
  const currentLiveStatus = liveStatusMap[item.channelId];
  const isCurrentlyLive = currentLiveStatus?.live || false;
  const currentLiveId = currentLiveStatus?.currentLiveId || null;
  const hasPaidPromotion = currentLiveStatus?.paidPromotion || false;
  const isPrimeChannel = currentLiveStatus?.isPrime || false;

  if (item.type === "DATE_SEPARATOR") {
    const separator = document.createElement("div");
    separator.className = "date-separator";
    separator.textContent = `${item.dateStr}`;
    separator.dataset.id = item.id;
    return separator;
  }

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
  channelImg.style.width = "28px";
  channelImg.style.height = "28px";

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

  let contentType;
  let contentTitle = "";

  // 알림 메시지 타입, 제목 설정
  if (item.type === "LIVE") {
    contentType = liveOnSVG; // "🔴";
    contentTitle = item.channelName + "님이 라이브를 시작했어요";
  } else if (item.type === "LIVE_OFF") {
    contentType = liveOffSVG; // "💤";
    contentTitle = item.channelName + "님이 방송을 종료했어요";
  } else if (item.type === "POST") {
    contentType = communitySVG; // "💬";
    contentTitle = item.channelName + "님이 새 글을 작성했어요";
    contentTitle = item.isEdited
      ? `${contentTitle} <span class="edited-indicator">(수정됨)</span>`
      : contentTitle;
  } else if (item.type === "VIDEO") {
    if (item.videoType === "REPLAY") {
      contentType = replaySVG; // "🎬";
      contentTitle = item.channelName + "님의 다시보기가 올라왔어요";
    } else {
      contentType = uploadSVG; // "🎦";
      contentTitle = item.channelName + "님의 새 동영상이 올라왔어요";
    }
  } else if (item.type === "CATEGORY/LIVETITLE") {
    contentType = liveChangeSVG; // "🔄";
    contentTitle = item.channelName + "님이 카테고리&제목을 변경했어요";
  } else if (item.type === "CATEGORY") {
    contentType = liveChangeSVG; //"🔄";
    contentTitle = item.channelName + "님이 카테고리를 변경했어요";
  } else if (item.type === "WATCHPARTY") {
    contentType = watchPartySVG; // "🍿";
    contentTitle =
      item.channelName +
      `님이 같이보기를 ${item.watchPartyTag ? "설정" : "해제"}했어요`;
  } else if (item.type === "DROPS") {
    contentType = dropsSVG; // "🪂";
    contentTitle =
      item.channelName +
      `님이 드롭스를 ${item.dropsCampaignNo ? "설정" : "해제"}했어요`;
  } else if (
    item.type === "PARTY_START" ||
    item.type === "PARTY_LEFT" ||
    item.type === "PARTY_END"
  ) {
    const isStart = item.type === "PARTY_START";
    const isLeft = item.type === "PARTY_LEFT";
    contentType = isStart ? partyStartSVG : partyEndSVG; // "🎉" : "👋";
    contentTitle =
      item.channelName +
      `${
        isStart
          ? item.host.channelName === item.channelName
            ? "님이 파티를 생성했어요"
            : "님이 파티에 참여했어요"
          : isLeft
          ? "님이 파티를 떠났어요"
          : "님의 파티가 종료되었어요"
      }`;
  } else if (item.type === "DONATION_START") {
    contentType = partyDonationStartSVG; // "💰";
    contentTitle = `${item.channelName}님의 파티에서 후원이 시작됐어요`;
  } else if (item.type === "DONATION_END") {
    contentType = partyDonationEndSVG; // "💸";
    contentTitle = `${item.channelName}님의 파티에서 후원이 종료됐어요`;
  } else if (item.type === "LOGPOWER") {
    contentType = logPowerTitleSVG; //"🪵";
    contentTitle = item.channelName + "님의 통나무 파워를 획득했어요";
  } else if (item.type === "LOGPOWER/SUMMARY") {
    contentType = logPowerTitleSVG; //"🪵";
    contentTitle = "통나무 파워 요약이 도착했어요";
  } else if (item.type === "PREDICTION_START") {
    contentType = logPowerPredictionStartSVG; // "🎲";
    contentTitle = item.channelName + "님이 승부예측을 시작했어요";
  } else if (item.type === "PREDICTION_END") {
    contentType = logPowerPredictionEndSVG; // "🏁";
    contentTitle = item.channelName + "님의 승부예측이 종료됐어요";
  } else if (item.type === "LOUNGE") {
    contentType = loungeSVG; // "🧀";
    contentTitle = item.channelName + "님이 새 라운지 글을 작성했어요";
  } else if (item.type === "LIVETITLE") {
    contentType = liveChangeSVG; // "🔄";
    contentTitle = item.channelName + "님이 라이브 제목을 변경했어요";
  } else if (item.type === "ADULT") {
    contentType = item.adultMode ? restrictOnSVG : restrictOffSVG; // "🔞" : "✅";
    contentTitle =
      item.channelName +
      `님이 19세 연령 제한을 ${item.adultMode ? "설정" : "해제"}했어요`;
  } else {
    contentType = bannerSVG; // "📢";
    contentTitle = "치지직 배너를 알려드려요";
  }

  nameDiv.innerHTML = `${contentType}&nbsp;${contentTitle}`;

  const svgAdultElement = document.createElementNS(svgNS, "svg");

  // SVG 속성 설정
  svgAdultElement.setAttribute("width", "14");
  svgAdultElement.setAttribute("height", "15");
  svgAdultElement.setAttribute("viewBox", "0 0 14 15");
  svgAdultElement.setAttribute("fill", "none");
  svgAdultElement.setAttribute("class", "video_information_icon_age__5jMJV");
  svgAdultElement.setAttribute("xmlns", svgNS);

  // <circle> 추가
  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("id", "Oval");
  circle.setAttribute("cx", "7");
  circle.setAttribute("cy", "7.5");
  circle.setAttribute("r", "6.4");
  circle.setAttribute("stroke", "currentColor");
  circle.setAttribute("stroke-width", "1.2");
  svgAdultElement.appendChild(circle);

  // 첫 번째 <path> 추가
  const path1 = document.createElementNS(svgNS, "path");
  path1.setAttribute("id", "Vector");
  path1.setAttribute(
    "d",
    "M8.65333 10.4453C7.71108 10.4453 7.02114 10.0116 6.78459 9.50302C6.7294 9.39263 6.70574 9.29406 6.70574 9.19156C6.70574 8.92741 6.88315 8.72635 7.19855 8.72635C7.43904 8.72635 7.57309 8.83279 7.7505 9.02992C8.01465 9.34926 8.26697 9.50302 8.6967 9.50302C9.53645 9.50302 9.92281 8.70269 9.92675 7.516V7.45292H9.9031C9.69809 8.00093 9.13826 8.37546 8.38918 8.37546C7.33654 8.37546 6.50073 7.62639 6.50073 6.51855C6.50073 5.33975 7.42327 4.5 8.69275 4.5C9.59953 4.5 10.3171 4.92185 10.731 5.75765C10.9479 6.19527 11.0661 6.75904 11.0661 7.42532C11.0661 9.31772 10.1633 10.4453 8.65333 10.4453ZM8.6967 7.49235C9.2999 7.49235 9.75328 7.0705 9.75328 6.49096C9.75328 5.90353 9.29596 5.45014 8.70852 5.45014C8.12109 5.45014 7.65982 5.89564 7.65982 6.47124C7.65982 7.06656 8.10138 7.49235 8.6967 7.49235Z"
  );
  path1.setAttribute("fill", "currentColor");
  svgAdultElement.appendChild(path1);

  // 두 번째 <path> 추가
  const path2 = document.createElementNS(svgNS, "path");
  path2.setAttribute("id", "Vector_2");
  path2.setAttribute(
    "d",
    "M4.98 10.4017C4.62912 10.4017 4.38863 10.1652 4.38863 9.80643V5.73384H4.36497L3.53311 6.31339C3.42272 6.39224 3.33993 6.41984 3.21771 6.41984C2.97722 6.41984 2.7998 6.24637 2.7998 5.99405C2.7998 5.81269 2.87077 5.67865 3.05607 5.54855L4.18362 4.76793C4.45959 4.5787 4.64883 4.54321 4.89326 4.54321C5.31511 4.54321 5.56743 4.79947 5.56743 5.20949V9.80643C5.56743 10.1652 5.33088 10.4017 4.98 10.4017Z"
  );
  path2.setAttribute("fill", "currentColor");
  svgAdultElement.appendChild(path2);

  // 타입별 알림 메시지 본문 작성
  if (item.type === "POST") {
    messageDiv.style.whiteSpace = "break-spaces";
    const hasAttaches = item.attaches && item.attaches.length > 0;
    if (hasAttaches) {
      // 마이그레이션 fallback
      const temp = item.excerpt || makeExcerpt(item.content);
      const hasText = temp && temp.trim().length > 0;
      if (hasText) {
        const content = document.createElement("p");
        content.className = "post-text-content";
        content.textContent = item.excerpt || makeExcerpt(item.content);

        messageDiv.append(content);
      }
      const attachWrapper = document.createElement("div");
      attachWrapper.className = "notification-attach-wrapper";
      attachWrapper.classList.add(`${item.attachLayout || "layout-default"}`);

      item.attaches.forEach((attach, idx) => {
        const img = document.createElement("img");
        img.src = attach.attachValue;
        img.loading = "lazy";
        img.title = "클릭하여 전체화면으로 보기";

        img.addEventListener("click", (e) => {
          e.stopPropagation();
          // 이 카드의 전체 첨부 배열과, 클릭한 이미지의 인덱스를 전달
          lightbox.open(item.attaches, idx);
        });

        const dimensions = JSON.parse(attach.extraJson);
        if (dimensions && attach.attachType === "PHOTO") {
          const ratio = dimensions.width / dimensions.height;
          let maxWidth = 115;
          if (item.attachLayout === "layout-single-big") {
            maxWidth = 320;
          } else if (item.attachLayout === "layout-single-medium") {
            maxWidth = 150;
          } else if (item.attachLayout === "layout-double-medium") {
            maxWidth = 175;
          }
          if (ratio < 0.3) {
            img.style.aspectRatio = `${dimensions.width} / ${dimensions.height}`;
          } else if (ratio > 1.21) {
            if (item.attachLayout === "layout-single-big") {
              img.style.height = "180px";
            } else {
              img.style.height = "150px";
            }
          } else {
            const height = maxWidth / ratio;
            img.style.height = `${height}px`;
          }
        } else if (attach.attachType === "STICKER") {
          img.style.width = "100px";
          img.style.height = "100px";
          img.style.objectFit = "contain";
        }
        attachWrapper.appendChild(img);
      });

      messageDiv.append(attachWrapper);
      messageDiv.style.lineHeight = "13px";
    } else {
      // 마이그레이션 fallback
      const content = document.createElement("p");
      content.className = "post-text-content";
      content.textContent = item.excerpt || makeExcerpt(item.content);

      messageDiv.style.lineHeight = "14px";
      messageDiv.append(content);
    }
  } else if (item.type === "LIVE") {
    const categoryLink = document.createElement("a");
    categoryLink.className = "live-category-link";
    categoryLink.href = `${item.categoryUrl || CHZZK_CATEGORY_URL}`;
    categoryLink.title = `${item.liveCategoryValue}(으)로 이동`;
    categoryLink.target = "_blank"; // 새 탭에서 열기

    const categorySpan = document.createElement("span");
    categorySpan.className = "live-category";
    categorySpan.textContent = item.liveCategoryValue;

    categorySpan.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    categoryLink.appendChild(categorySpan);

    const liveTitle = document.createTextNode(` ${item.liveTitle}`);

    const badgeContainer = document.createElement("div");
    badgeContainer.className = "badge-container";
    badgeContainer.style.display = "inline";

    if (item.liveCategoryValue) badgeContainer.appendChild(categoryLink);

    appendBadges(badgeContainer, item, svgAdultElement);

    messageDiv.append(badgeContainer, liveTitle);
  } else if (item.type === "WATCHPARTY") {
    const categoryLink = document.createElement("a");
    categoryLink.className = "live-category-link";
    categoryLink.href = `${item.categoryUrl || CHZZK_CATEGORY_URL}`;
    categoryLink.title = `${item.liveCategoryValue}(으)로 이동`;
    categoryLink.target = "_blank"; // 새 탭에서 열기

    const categorySpan = document.createElement("span");
    categorySpan.className = "live-category";
    categorySpan.textContent = item.liveCategoryValue;

    categorySpan.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    categoryLink.appendChild(categorySpan);

    const liveTitle = document.createTextNode(` ${item.liveTitle}`);

    const badgeContainer = document.createElement("div");
    badgeContainer.className = "badge-container";
    badgeContainer.style.display = "inline";

    if (item.liveCategoryValue) badgeContainer.appendChild(categoryLink);

    appendBadges(badgeContainer, item, svgAdultElement);

    messageDiv.append(badgeContainer, liveTitle);
  } else if (item.type === "DROPS") {
    const categoryLink = document.createElement("a");
    categoryLink.className = "live-category-link";
    categoryLink.href = `${item.categoryUrl || CHZZK_CATEGORY_URL}`;
    categoryLink.title = `${item.liveCategoryValue}(으)로 이동`;
    categoryLink.target = "_blank"; // 새 탭에서 열기

    const categorySpan = document.createElement("span");
    categorySpan.className = "live-category";
    categorySpan.textContent = item.liveCategoryValue;

    categorySpan.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    categoryLink.appendChild(categorySpan);

    const liveTitle = document.createTextNode(` ${item.liveTitle}`);

    const badgeContainer = document.createElement("div");
    badgeContainer.className = "badge-container";
    badgeContainer.style.display = "inline";

    if (item.liveCategoryValue) badgeContainer.appendChild(categoryLink);

    appendBadges(badgeContainer, item, svgAdultElement);

    messageDiv.append(badgeContainer, liveTitle);
  } else if (item.type === "CATEGORY") {
    const oldCategoryLink = document.createElement("a");
    oldCategoryLink.className = "live-category-link";
    oldCategoryLink.href = `${item.oldCategoryUrl || CHZZK_CATEGORY_URL}`;
    oldCategoryLink.title = `${item.oldCategory || "없음"}(으)로 이동`;
    oldCategoryLink.target = "_blank"; // 새 탭에서 열기

    const oldCategorySpan = document.createElement("span");
    oldCategorySpan.className = "live-category";
    oldCategorySpan.textContent = `${item.oldCategory || "없음"}`;

    oldCategorySpan.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    oldCategoryLink.appendChild(oldCategorySpan);

    const boldArrowChar = document.createElement("b");
    boldArrowChar.textContent = " → ";

    const newCategoryLink = document.createElement("a");
    newCategoryLink.className = "live-category-link";
    newCategoryLink.href = `${item.newCategoryUrl || CHZZK_CATEGORY_URL}`;
    newCategoryLink.title = `${item.newCategory}(으)로 이동`;
    newCategoryLink.target = "_blank"; // 새 탭에서 열기

    const newCategorySpan = document.createElement("span");
    newCategorySpan.className = "live-category";
    newCategorySpan.textContent = item.newCategory;

    newCategorySpan.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    newCategoryLink.appendChild(newCategorySpan);

    const badgeContainer = document.createElement("div");
    badgeContainer.className = "badge-container";
    badgeContainer.style.display = "inline";

    messageDiv.append(
      oldCategoryLink,
      boldArrowChar,
      newCategoryLink,
      badgeContainer
    );
  } else if (item.type === "CATEGORY/LIVETITLE") {
    const oldCategoryLink = document.createElement("a");
    oldCategoryLink.className = "live-category-link";
    oldCategoryLink.href = `${item.oldCategoryUrl || CHZZK_CATEGORY_URL}`;
    oldCategoryLink.title = `${item.oldCategory || "없음"}(으)로 이동`;
    oldCategoryLink.target = "_blank"; // 새 탭에서 열기

    const oldCategorySpan = document.createElement("span");
    oldCategorySpan.className = "live-category";
    oldCategorySpan.textContent = `${item.oldCategory || "없음"}`;

    oldCategorySpan.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    oldCategoryLink.appendChild(oldCategorySpan);

    const oldLiveTitle = document.createTextNode(
      ` ${item.oldLiveTitle || "없음"}`
    );

    const boldArrowChar = document.createElement("b");
    boldArrowChar.textContent = " → ";

    const newCategoryLink = document.createElement("a");
    newCategoryLink.className = "live-category-link";
    newCategoryLink.href = `${item.newCategoryUrl || CHZZK_CATEGORY_URL}`;
    newCategoryLink.title = `${item.newCategory}(으)로 이동`;
    newCategoryLink.target = "_blank"; // 새 탭에서 열기

    const newCategorySpan = document.createElement("span");
    newCategorySpan.className = "live-category";
    newCategorySpan.textContent = item.newCategory;

    newCategorySpan.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    newCategoryLink.appendChild(newCategorySpan);

    const newLiveTitle = document.createTextNode(` ${item.newLiveTitle}`);

    const badgeContainer = document.createElement("div");
    badgeContainer.className = "badge-container";
    badgeContainer.style.display = "inline";

    appendBadges(badgeContainer, item, svgAdultElement);

    messageDiv.append(
      oldCategoryLink,
      oldLiveTitle,
      boldArrowChar,
      newCategoryLink,
      badgeContainer,
      newLiveTitle
    );
  } else if (item.type === "LIVETITLE") {
    const oldLiveTitleSpan = document.createElement("span");
    oldLiveTitleSpan.className = "old-live-title";
    oldLiveTitleSpan.textContent = ` ${item.oldLiveTitle || "없음"}`;

    const boldArrowChar = document.createElement("b");
    boldArrowChar.textContent = " → ";

    const newLiveTitleSpan = document.createElement("span");
    newLiveTitleSpan.className = "new-live-title";
    newLiveTitleSpan.textContent = `${item.newLiveTitle}`;

    if (item.oldLiveTitle && item.newLiveTitle) {
      messageDiv.append(oldLiveTitleSpan, boldArrowChar, newLiveTitleSpan);
    } else {
      const splitedContent = item.content.split(" → ");
      const [leftSplitedContent, rightSplitedContent] = splitedContent;

      const oldLiveTitleSpan = document.createElement("span");
      oldLiveTitleSpan.className = "old-live-title";
      oldLiveTitleSpan.textContent = leftSplitedContent;

      const newLiveTitleSpan = document.createElement("span");
      newLiveTitleSpan.className = "new-live-title";
      newLiveTitleSpan.textContent = rightSplitedContent;

      messageDiv.append(oldLiveTitleSpan, boldArrowChar, newLiveTitleSpan);
    }
  } else if (item.type === "ADULT") {
    const categoryLink = document.createElement("a");
    categoryLink.className = "live-category-link";
    categoryLink.href = `${item.categoryUrl || CHZZK_CATEGORY_URL}`;
    categoryLink.title = `${item.liveCategoryValue}(으)로 이동`;
    categoryLink.target = "_blank"; // 새 탭에서 열기

    const categorySpan = document.createElement("span");
    categorySpan.className = "live-category";
    categorySpan.textContent = item.liveCategoryValue;

    categorySpan.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    categoryLink.appendChild(categorySpan);

    const liveTitle = document.createTextNode(` ${item.liveTitle}`);

    const badgeContainer = document.createElement("div");
    badgeContainer.className = "badge-container";
    badgeContainer.style.display = "inline";

    if (item.liveCategoryValue) badgeContainer.appendChild(categoryLink);

    appendBadges(badgeContainer, item, svgAdultElement);

    messageDiv.append(badgeContainer, liveTitle);
  } else if (
    item.type === "PARTY_START" ||
    item.type === "PARTY_LEFT" ||
    item.type === "PARTY_END"
  ) {
    // PARTY_START, PARTY_END 공통 처리
    if (item.type === "PARTY_START") {
      div.dataset.partyStartId = item.id;
    }
    // 새로 만든 renderPartyMembers 함수를 호출하여 UI를 messageDiv 안에 채워넣음
    renderPartyMembers(
      messageDiv,
      item,
      partyStatusMap,
      partyDonationStatusMap
    );
  } else if (item.type === "DONATION_START") {
    div.classList.add("donation-event-item");
    div.dataset.targetId = item.targetPartyStartId;
    div.title = "클릭하여 파티 정보로 이동";

    const status = partyStatusMap[item.channelId];
    const isCurrent =
      status &&
      status.partyNo === item.partyNo &&
      Date.now() - (status.updatedAt || 0) < 90_000;
    if (status && status.notificationEnabled === false && isCurrent) {
      const partyLink = document.createElement("a");
      partyLink.className = "live-party-link";
      partyLink.href = `https://chzzk.naver.com/party-lives/${item.partyNo}`;
      partyLink.title = `${item.partyName}(으)로 이동`;
      partyLink.target = "_blank";
      partyLink.addEventListener("click", (e) => e.stopPropagation());

      const partySpan = document.createElement("span");
      partySpan.className = "chzzk-party";
      partySpan.textContent = `${item.partyName} (${item.memberCount || 0}명)`;
      partyLink.appendChild(partySpan);

      const tip = document.createElement("div");
      tip.className = "donation-info-text";
      tip.textContent = `${item.channelName}님의 알림이 꺼져 있어 파티를 조회할 수 없습니다`;

      container.append(partyLink, tip);
      return; // 여기서 끝: '종료' UI로 넘어가지 않음
    }

    const partyLink = document.createElement("a");
    partyLink.className = "live-party-link";
    partyLink.href = `https://chzzk.naver.com/party-lives/${item.partyNo}`;
    partyLink.title = `${item.partyName}(으)로 이동`;
    partyLink.target = "_blank"; // 새 탭에서 열기

    const partySpan = document.createElement("span");
    partySpan.className = "chzzk-party";
    partySpan.textContent = `${item.partyName} (${item.memberCount || 0}명)`;

    partySpan.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    partyLink.appendChild(partySpan);

    if (item.isTargetPartyMissing) {
      // --- 목표 파티 알림이 삭제된 경우: 스냅샷 정보로 UI 생성 ---
      const gotoButton = document.createElement("span");
      gotoButton.className = "fallback-goto-party-btn";
      gotoButton.textContent = "파티 후원 정보 보기";

      messageDiv.append(partyLink, gotoButton);

      const warningText = document.createElement("div");
      warningText.className = "donation-info-text";
      warningText.style.color = "#c62828";
      warningText.style.fontSize = "10px";
      warningText.style.marginBottom = "4px";
      warningText.textContent = "파티원 목록은 실제와 다를 수 있습니다";
      warningText.classList.add("hidden");

      const fallbackContainer = document.createElement("div");
      fallbackContainer.classList.add("hidden");
      fallbackContainer.style.cssText =
        "margin-top: 5px; border-top: 1px dashed #ddd; padding-top: 5px;";

      gotoButton.addEventListener("click", async (event) => {
        const itemElement = event.target.closest(".notification-item");
        if (!itemElement) return;

        event.stopPropagation();
        await handleGotoPartyInfo(itemElement);

        warningText.classList.toggle("hidden");
        const isHidden = fallbackContainer.classList.toggle("hidden");
        if (!isHidden)
          fallbackContainer.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
      });

      const title = document.createElement("div");
      title.textContent = "후원에 참여 중인 파티원 (원본 알림 메시지 삭제됨)";
      title.style.cssText =
        "font-weight: bold; font-size: 11px; color: #555; margin-bottom: 4px;";

      const membersSpan = document.createElement("span");
      membersSpan.className = "chzzk-party-all-member";

      const finalMembers = item.accumulatedMembers || [];
      if (finalMembers.length > 0) {
        finalMembers.forEach((member) => {
          if (!member) return;
          const memberEl = createMemberElement(member, partyHostSVG);
          membersSpan.appendChild(memberEl);
        });
      } else {
        membersSpan.textContent = "저장된 파티원 정보가 없습니다";
      }

      fallbackContainer.append(title, membersSpan, warningText);

      const latestDonationInfo = partyDonationStatusMap[item.partyNo];

      // 1. item 객체에서 donationInfo 객체를 임시로 생성
      const snapshotDonationInfo = {
        mode: latestDonationInfo?.mode ?? item.mode ?? null,
        partyTeamList:
          latestDonationInfo?.partyTeamList ?? item.partyTeamList ?? [],
        distributionMode:
          latestDonationInfo?.distributionMode ?? item.distributionMode,
        distributionList:
          latestDonationInfo?.distributionList ?? item.distributionList ?? [],
        totalDonationAmount:
          latestDonationInfo?.totalDonationAmount ??
          item.totalDonationAmount ??
          0,
      };
      // 2. renderDonationInfo 함수를 호출하여 후원 UI를 생성하고 추가
      //    '시작 시점' 후원금을 실시간 후원금처럼 보이게 하기 위해
      //    실시간 업데이트 함수가 이 UI를 갱신
      renderDonationInfo(fallbackContainer, item, snapshotDonationInfo);

      messageDiv.append(fallbackContainer);
    } else {
      // --- 목표 파티 알림이 존재하는 경우: 기존 버튼 표시 ---
      const gotoButton = document.createElement("span");
      gotoButton.className = "goto-party-btn";
      gotoButton.textContent = "파티 후원 정보 보기";

      gotoButton.addEventListener("click", async (event) => {
        const itemElement = event.target.closest(".notification-item");
        if (!itemElement) return;

        event.stopPropagation();
        await handleGotoPartyInfo(itemElement);
      });

      messageDiv.append(partyLink, gotoButton);
    }
  } else if (item.type === "DONATION_END") {
    const resultDiv = document.createElement("div");
    resultDiv.style.marginTop = "7px";

    const partyNameSpan = document.createElement("span");
    partyNameSpan.className = "chzzk-party-members";
    partyNameSpan.textContent = `${item.partyName} (${
      item.memberCount || 0
    }명)`;

    const partyAllMembersSpan = document.createElement("span");
    partyAllMembersSpan.className = "chzzk-party-all-member";
    partyAllMembersSpan.classList.add("hidden");

    const warningText = document.createElement("div");
    warningText.className = "donation-info-text";
    warningText.style.color = "#c62828";
    warningText.style.fontSize = "10px";
    warningText.style.marginBottom = "4px";
    warningText.textContent = "파티원 목록은 실제와 다를 수 있습니다";
    warningText.classList.add("hidden");

    partyNameSpan.addEventListener("click", (event) => {
      event.stopPropagation();

      partyNameSpan.classList.toggle("active-end-party-click");
      partyAllMembersSpan.classList.toggle("active-end-party-all-member");
      warningText.classList.toggle("hidden");

      const isHidden = partyAllMembersSpan.classList.toggle("hidden");
      if (!isHidden)
        partyAllMembersSpan.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
    });

    const finalMembers = item.accumulatedMembers || [];

    if (finalMembers.length > 0) {
      finalMembers.forEach((member) => {
        if (!member) return;
        const memberContainer = createMemberElement(member, item.host);
        partyAllMembersSpan.appendChild(memberContainer);
      });
    } else {
      partyAllMembersSpan.innerText = "파티원 정보가 없습니다";
    }

    const modeSpan = document.createElement("span");
    modeSpan.dataset.distributionMode = item.distributionMode;
    modeSpan.className = "chzzk-party-donation-mode";

    const cheeseIcon = makeCheeseSVG();

    const finalAmountSpan = document.createElement("span");
    finalAmountSpan.className = "donation-final-amount";
    finalAmountSpan.innerHTML = `${cheeseIcon}&nbsp;최종 후원금: ${item.finalDonationAmount?.toLocaleString()}&nbsp;치즈`;

    const distributionListDiv = document.createElement("div");
    distributionListDiv.className = "chzzk-party-donation-distribution";
    distributionListDiv.classList.add("hidden"); // 기본적으로 숨김

    const infoText = document.createElement("span");
    infoText.className = "donation-info-text";
    infoText.textContent = "표시된 후원금은 실제와 차이가 있을 수 있습니다";
    const infoHostRewardText = document.createTextNode(
      "호스트 수고비가 있다면, 총 후원금에서 수고비를 제한 금액으로 분배"
    );

    const br = document.createElement("br");
    const infoHostRatioText = document.createTextNode(
      "분배 비율에 따라 후원금 계산 시 발생하는 소수점 이하 자투리 금액은 합산되어 호스트에게 제공"
    );

    infoText.append(
      br,
      infoHostRewardText,
      br.cloneNode(true),
      infoHostRatioText
    );

    let modeText = "";
    switch (item.distributionMode) {
      case "SAME_FOR_ALL":
        modeText = "똑같이 나누기";

        const donationWrapperSame = document.createElement("div");
        donationWrapperSame.className = "donation-distribution-wrapper";
        donationWrapperSame.textContent = "똑같이 나눌 후원금 ";

        const donationPerPersonSame = document.createElement("span");
        donationPerPersonSame.className = "donation-amount";
        donationPerPersonSame.style.border = "none";
        const amountPerPerson =
          item.memberCount > 0
            ? Math.floor(item.finalDonationAmount / item.memberCount)
            : 0;
        donationPerPersonSame.innerHTML = `${cheeseIcon}&nbsp;${amountPerPerson.toLocaleString()}&nbsp;치즈`;

        donationWrapperSame.append(
          donationPerPersonSame,
          infoText.cloneNode(true)
        );
        distributionListDiv.append(donationWrapperSame);
        break;

      case "ALL_IN":
        modeText = "1명에게 몰아주기";

        const donationWrapper = document.createElement("div");
        donationWrapper.className = "donation-distribution-wrapper";
        donationWrapper.textContent = "1명에게 몰아줄 후원금 ";

        const donationPerPerson = document.createElement("span");
        donationPerPerson.className = "donation-amount";
        donationPerPerson.style.border = "none";
        donationPerPerson.innerHTML = `${cheeseIcon}&nbsp;${item.finalDonationAmount.toLocaleString()}&nbsp;치즈`;

        donationWrapper.append(donationPerPerson, infoText.cloneNode(true));

        distributionListDiv.append(donationWrapper);
        break;

      default: // "FREE" 또는 기타
        modeText = "자유롭게 나누기";

        item.distributionList?.forEach((distItem) => {
          const donationWrapperFree = document.createElement("div");
          donationWrapperFree.className = "donation-distribution-wrapper";

          const donationInfoSpan = document.createElement("span");
          donationInfoSpan.className = "donation-distribution-info";
          donationInfoSpan.textContent = `${
            distItem.rankName
          }에게 나눌 후원금 중 ${distItem.rate / 10}%`;

          const boldArrowChar = document.createElement("b");
          boldArrowChar.style.color = "black";
          boldArrowChar.textContent = " → ";

          const donationPerPersonFree = document.createElement("span");
          donationPerPersonFree.className = "donation-amount";

          const amountPerRank = Math.floor(
            (item.finalDonationAmount * distItem.rate) / 1000
          );
          donationPerPersonFree.innerHTML = `${cheeseIcon}&nbsp;${amountPerRank.toLocaleString()}&nbsp;치즈`;

          donationWrapperFree.append(
            donationInfoSpan,
            boldArrowChar,
            donationPerPersonFree
          );
          distributionListDiv.append(donationWrapperFree);
        });

        if (item.distributionList) {
          distributionListDiv.appendChild(infoText.cloneNode(true));
        }
        break;
    }
    modeSpan.textContent = modeText;

    modeSpan.style.cursor = "pointer";
    modeSpan.addEventListener("click", (event) => {
      event.stopPropagation();

      const isHidden = distributionListDiv.classList.toggle("hidden");
      if (!isHidden) {
        distributionListDiv.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    });

    resultDiv.append(modeSpan, finalAmountSpan);
    messageDiv.append(
      partyNameSpan,
      partyAllMembersSpan,
      warningText,
      resultDiv,
      distributionListDiv
    );
  } else if (item.type === "LOGPOWER") {
    const wrap = document.createElement("div");
    wrap.className = "logpower-item";
    wrap.dataset.id = item.id;

    const msg = document.createElement("div");
    msg.className = "notification-message";

    const list = item.claims || [];
    if (list.length) {
      const totalAmount = document.createElement("div");

      const sumOfAmount = list.reduce((sum, p) => sum + (p.amount || 0), 0);
      const newTotal = (item.baseTotalAmount ?? 0) + sumOfAmount;

      totalAmount.className = "logpower-total-amount";
      totalAmount.innerHTML = `${
        item.channelName
      }님 채널의 내 통나무 파워: ${makeLogPowerSVG()} ${newTotal.toLocaleString()}`;

      const ul = document.createElement("ul");
      ul.className = "logpower-claimed-list";
      list.forEach((p) => {
        const img = document.createElement("img");
        img.src = p.displayIcon;

        const li = document.createElement("li");
        li.className = "logpower-claimed-item";

        const liText = document.createTextNode(
          `${p.displayTitle} (+${(p.amount || 0).toLocaleString()})`
        );

        li.append(img, liText);
        ul.append(li);
      });
      msg.append(ul, totalAmount);
    }

    wrap.appendChild(msg);
    messageDiv.append(wrap);
  } else if (item.type === "LOGPOWER/SUMMARY") {
    const wrap = document.createElement("div");
    wrap.className = "logpower-summary";

    // 헤더
    const header = document.createElement("div");
    header.className = "logpower-summary-header";
    header.innerHTML = `
    <div class="logpower-summary-meta">
      <span class="badge">${item.label || ""}</span>
      <div>
        <span>총합 ${makeLogPowerSVG()} <b>${(
      item.total ?? 0
    ).toLocaleString()}</b></span>
        <span class="sep">/</span>
        <span>획득 횟수 <b>${(item.count ?? 0).toLocaleString()}</b>회</span>
        <span class="sep">/</span>
        <span>획득 채널 <b>${(
          item.channels?.length ?? 0
        ).toLocaleString()}</b>개</span>      
      </div>
    </div>
  `;

    // 목록 (배경에서 이미 total 내림차순 정렬 완료)
    const list = document.createElement("ul");
    list.className = "logpower-summary-list";
    (item.channels || []).forEach((c) => {
      const li = document.createElement("li");
      li.className = "logpower-summary-item";

      const total = Number(c.total || 0);
      const external = Number(c.externalGain || 0);

      let totalHtml = "";
      totalHtml = `
          <span class="stat stat-total" title="총 ${total.toLocaleString()}">
            ${makeLogPowerSVG()} 
            <b>${total.toLocaleString()}</b>
          </span>
        `;

      li.innerHTML = `
      <a class="logpower-channel-link" href="https://chzzk.naver.com/${
        c.channelId
      }" target="_blank" rel="noopener">
        <img class="logpower-channel-img" src="${
          c.channelImageUrl || "../icon_128.png"
        }" loading="lazy" alt="${c.channelName}">
        <span class="logpower-channel-name" title="${c.channelName}">${
        c.channelName
      }</span>
      </a>
      <div class="logpower-channel-stats">
        ${totalHtml}
        <span class="sep">/</span>
      </div>
    `;

      const types = Array.isArray(c.typeBreakdown) ? c.typeBreakdown : [];
      if (types.length > 0 || external > 0) {
        const chips = document.createElement("span");
        chips.className = "logpower-chip-types";

        if (external > 0) {
          const chip = document.createElement("span");
          chip.className = "badge external-gain-chip";
          chip.title = `기타 획득: ${external.toLocaleString()} (모바일, 다른 PC 또는 누락된 획득량)
          (현재 총 ${Number(
            c.externalCurrentAmount || 0
          ).toLocaleString()} / 기준 ${Number(
            c.externalKnownAmount || 0
          ).toLocaleString()})`;
          chip.textContent = `기타 ${external.toLocaleString()}`;
          chips.appendChild(chip);
        }

        types.forEach((tb) => {
          if (!tb.claimTypeNorm) return;
          if (tb.count === 0) return;

          // '기타 획득'이 typeBreakdown에 이미 있다면 중복 표시 안 함
          if (tb.claimTypeNorm === "기타 획득") return;

          const chip = document.createElement("span");
          chip.className = "badge";
          chip.title = `${tb.claimTypeNorm}: ${(
            tb.count ?? 0
          ).toLocaleString()}회 / ${Number(tb.total || 0).toLocaleString()}`;
          chip.textContent = `${tb.claimTypeNorm} ${tb.count}회`;
          chips.appendChild(chip);
        });
        li.querySelector(".logpower-channel-stats").appendChild(chips);
      }
      // 리스트 내부 클릭은 전체 알림 클릭(읽음 처리 등)과 분리
      li.addEventListener("click", (e) => e.stopPropagation());
      list.appendChild(li);
    });

    const helperText = document.createElement("div");
    helperText.className = "logpower-summary-helper-text";
    helperText.textContent =
      "*기타 획득의 경우 실제와 차이가 있을 수 있습니다 (모바일, 다른 PC 또는 누락된 획득량)";

    wrap.append(header, list, helperText);
    messageDiv.append(wrap);
  } else if (item.type === "PREDICTION_START") {
    const currentPredictionStatus = predictionStatusMap[item.channelId];
    let liveDetails = item;
    let renderTime = new Date(item.timestamp).getTime();
    // background가 갱신한 최신 'details'가 있고, predictionId가 일치하면 그것을 사용
    if (
      currentPredictionStatus &&
      currentPredictionStatus.details &&
      currentPredictionStatus.predictionId === item.predictionId &&
      (currentPredictionStatus.details.status === "ACTIVE" ||
        currentPredictionStatus.details.status === "EXPIRED" ||
        currentPredictionStatus.details.status === "COMPLETED")
    ) {
      liveDetails = currentPredictionStatus.details;
      renderTime = liveDetails.fetchedAt || Date.now();
    }

    const predictionWrapper = document.createElement("div");
    predictionWrapper.className = "prediction-wrapper";

    // 현재 렌더링하는 상태를 dataset에 저장
    predictionWrapper.dataset.predictionStatus = liveDetails.status;

    const title = document.createElement("div");
    title.className = "prediction-title";
    title.textContent = item.predictionTitle;

    const timer = document.createElement("div");
    timer.className = "prediction-timer";

    // 타이머 로직을 위해 알림 생성 시각과 API 2의 'remainingDuration'을 저장
    const startTime = new Date(item.timestamp).getTime();
    timer.dataset.startTime = String(startTime);
    timer.dataset.renderTime = String(renderTime); // API 2가 불려진 시각
    timer.dataset.duration = String(liveDetails.remainingDuration ?? 0);

    // 서버 기준 절대 만료 시각을 dataset에 추가
    if (typeof liveDetails.expireAt === "number") {
      timer.dataset.expireAt = String(liveDetails.expireAt);
    }

    predictionWrapper.append(title, timer);

    const optionListEl = document.createElement("ul");
    optionListEl.className = "prediction-option-list";

    const mySelectionNo = liveDetails.participation?.selectedOptionNo;
    const options = Array.isArray(liveDetails.optionList)
      ? liveDetails.optionList
      : [];
    // 0으로 나누는 것을 방지하기 위해 || 1 추가
    const totalLogPowersAll =
      options.reduce((acc, o) => acc + (o.totalLogPowers || 0), 0) || 1;

    const subtitle = document.createElement("span");
    subtitle.className = "prediction-subtitle";
    subtitle.innerHTML = `${logPowerPredictionVersusSVG} ${formatKoreanNumber(
      totalLogPowersAll
    )} 파워가 걸린 명승부`;
    title.appendChild(subtitle);

    options.forEach((option) => {
      const li = document.createElement("li");
      li.className = "prediction-option-item";
      li.dataset.optionNo = option.optionNo;
      if (option.optionNo === mySelectionNo) {
        li.classList.add("my-selection");
      }

      const percentage = (option.totalLogPowers / totalLogPowersAll) * 100;

      li.innerHTML = `
        <div class="prediction-option-bar" style="width: ${percentage}%"></div>
        <div class="prediction-option-content">
          <span class="prediction-option-text">${option.optionText}</span>
          <span class="prediction-option-stats">
            ${makeLogPowerSVG()}${option.totalLogPowers.toLocaleString()}
            (${option.participantCount.toLocaleString()}명)
            <span class="prediction-dist-rate">분배율: ${option.distributionRate.toFixed(
              2
            )}</span>
          </span>
        </div>
        <div class="prediction-option-percent">${Math.round(percentage)}%</div>
      `;
      optionListEl.appendChild(li);
    });

    predictionWrapper.appendChild(optionListEl);

    if (mySelectionNo) {
      const myBet = document.createElement("div");
      myBet.className = "prediction-my-bet";
      const myOption = options.find((o) => o.optionNo === mySelectionNo);
      myBet.innerHTML = `
          나의 선택: <b>${myOption ? myOption.optionText : "..."}</b> 
          ${makeLogPowerSVG()} <span>${(
        liveDetails.participation?.bettingPowers || 0
      ).toLocaleString()}</span>
      ${
        myOption.distributionRate
          ? ` | 예상 획득 파워: <span class="prediction-dist-rate">${makeLogPowerSVG()} ${Math.floor(
              liveDetails.participation?.bettingPowers *
                myOption.distributionRate.toFixed(2)
            ).toLocaleString()}</span>`
          : ""
      }
        `;
      predictionWrapper.appendChild(myBet);
    }

    messageDiv.appendChild(predictionWrapper);
  } else if (item.type === "PREDICTION_END") {
    const predictionWrapper = document.createElement("div");
    predictionWrapper.className = "prediction-wrapper end";

    const title = document.createElement("div");
    title.className = "prediction-title";
    title.textContent = item.predictionTitle;
    predictionWrapper.append(title);

    const optionListEl = document.createElement("ul");
    optionListEl.className = "prediction-option-list";

    const mySelectionNo = item.participation?.selectedOptionNo;
    const winningOptionNo = item.winningOptionNo;
    const totalLogPowersAll =
      item.optionList.reduce((acc, o) => acc + o.totalLogPowers, 0) || 1;

    const subtitle = document.createElement("span");
    subtitle.className = "prediction-subtitle";
    subtitle.innerHTML = `${logPowerPredictionVersusSVG} ${formatKoreanNumber(
      totalLogPowersAll
    )} 파워가 걸린 명승부`;
    title.appendChild(subtitle);

    item.optionList.forEach((option) => {
      const li = document.createElement("li");
      li.className = "prediction-option-item";
      li.dataset.optionNo = option.optionNo;

      const isWinner = option.optionNo === winningOptionNo;
      const isMySelection = option.optionNo === mySelectionNo;

      if (isWinner) li.classList.add("winner");
      if (isMySelection) li.classList.add("my-selection");

      const percentage = (option.totalLogPowers / totalLogPowersAll) * 100;

      li.innerHTML = `
        <div class="prediction-option-bar" style="width: ${percentage}%"></div>
        <div class="prediction-option-content">
          <span class="prediction-option-text">
            ${option.optionText}
          </span>
          <span class="prediction-option-stats">
            ${makeLogPowerSVG()}${option.totalLogPowers.toLocaleString()}
            (${option.participantCount.toLocaleString()}명)
            <span class="prediction-dist-rate">분배율: ${option.distributionRate.toFixed(
              2
            )}</span>
          </span>
        </div>
        <div class="prediction-option-percent">${Math.round(percentage)}%</div>
      `;
      optionListEl.appendChild(li);
    });

    predictionWrapper.appendChild(optionListEl);

    if (item.participation) {
      const myResult = document.createElement("div");
      myResult.className = "prediction-my-result";
      const myOption = item.optionList.find(
        (o) => o.optionNo === mySelectionNo
      );

      let resultText = "";
      if (item.participation.status === "WON") {
        myResult.classList.add("won");
        resultText = `🎉 <b>적중! + ${makeLogPowerSVG()} ${item.participation.winningPowers.toLocaleString()}</b>`;
      } else if (item.participation.status === "LOST") {
        myResult.classList.add("lost");
        resultText = `😢 <b>빗나감</b>`;
      } else {
        resultText = `<b>종료</b>`; // e.g. Cancelled
      }

      myResult.innerHTML = `
          나의 선택: <b>${myOption ? myOption.optionText : "..."}</b> 
          ${makeLogPowerSVG()} <span>${(
        item.participation?.bettingPowers || 0
      ).toLocaleString()}</span> | 
          <span class="prediction-result-status">${resultText}</span>
        `;
      predictionWrapper.appendChild(myResult);
    }

    messageDiv.appendChild(predictionWrapper);
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

    const videoCategoryLink = document.createElement("a");
    videoCategoryLink.className = "video-category-link";
    videoCategoryLink.href = `${item.videoCategoryUrl || CHZZK_CATEGORY_URL}`;
    videoCategoryLink.title = `${item.videoCategoryValue}(으)로 이동`;
    videoCategoryLink.target = "_blank"; // 새 탭에서 열기

    const videoCategorySpan = document.createElement("span");
    videoCategorySpan.className = "video-category";
    videoCategorySpan.textContent = item.videoCategoryValue;

    videoCategorySpan.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    videoCategoryLink.appendChild(videoCategorySpan);

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
        messageDiv.append(span, br, videoCategoryLink, content);
      } else {
        messageDiv.append(span, br, content);
      }
    } else {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.loading = "lazy";

      const br = document.createElement("br");

      if (item.videoCategoryValue) {
        messageDiv.append(img, br, videoCategoryLink, content);
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
    if (item.type === "BANNER" || item.type === "LOGPOWER/SUMMARY") {
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

function initializeBadgeClickAction() {
  const radios = document.querySelectorAll('input[name="logpowerBadgeAction"]');
  const storageKey = "logpowerBadgeAction";

  // 1. 스토리지에서 저장된 값을 불러와 라디오 버튼에 반영
  chrome.storage.local.get({ [storageKey]: "popup" }, (data) => {
    radios.forEach((radio) => {
      if (radio.value === data[storageKey]) {
        radio.checked = true;
      }
    });
  });

  // 2. 라디오 버튼 변경 시 스토리지에 즉시 저장
  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        chrome.storage.local.set({ [storageKey]: radio.value });
      }
    });
  });
}

function wireSummaryManualButtons() {
  const result = document.getElementById("summary-run-result");
  const force = document.getElementById("summary-force-checkbox");

  document.querySelectorAll(".summary-run").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const kind = btn.dataset.kind; // daily|weekly|monthly|year_end
      const anchor = btn.dataset.anchor || "previous";
      const label = btn.textContent;
      const restore = btn.textContent;
      btn.disabled = true;
      btn.textContent = label + " 발행 중…";
      result.textContent = "";

      try {
        const resp = await chrome.runtime.sendMessage({
          type: "RUN_LOGPOWER_SUMMARY_MANUAL",
          kinds: [kind],
          anchor,
          force: !!(force && force.checked),
        });

        if (!resp?.ok) throw new Error(resp?.error || "FAILED");

        // 결과 요약
        const r = resp.results?.[0];
        if (r?.executed) {
          result.textContent = `${label} 요약 알림을 발행했어요. (${r.key})`;
        } else {
          result.textContent = `${label} 요약 알림은 이미 발행된 알림입니다. (${r?.key})`;
        }

        // 배지/목록 등 갱신
        chrome.runtime.sendMessage({ type: "UPDATE_BADGE" });
      } catch (e) {
        result.textContent = "발행 실패: " + (e?.message || e);
      } finally {
        btn.disabled = false;
        btn.textContent = restore;
      }
    });
  });
}

// === 사운드 파일 목록 ===
const AVAILABLE_SOUND_FILES = [
  "notification_1.wav",
  "notification_2.wav",
  "notification_3.wav",
  "notification_4.wav",
  "notification_5.wav",
  "notification_6.wav",
  "notification_7.mp3",
  "notification_8.flac",
  "notification_9.mp3",
  "notification_10.wav",
  "notification_11.mp3",
  "notification_12.ogg",
  "notification_13.wav",
  "notification_14.wav",
  "notification_15.mp3",
  "notification_16.mp3",
  "notification_17.mp3",
];

// === 타입 목록 ===
const SOUND_TYPES = [
  { key: "live", label: "라이브" },
  { key: "combo", label: "카테고리&제목 변경" },
  { key: "category", label: "카테고리 변경" },
  { key: "liveTitle", label: "라이브 제목 변경" },
  { key: "watchParty", label: "같이보기" },
  { key: "drops", label: "드롭스" },
  { key: "logpower", label: "통나무 파워" },
  { key: "prediction", label: "승부 예측" },
  { key: "video", label: "다시보기/동영상" },
  { key: "party", label: "파티" },
  { key: "donation", label: "파티 후원" },
  { key: "restrict", label: "연령 제한 설정" },
  { key: "community", label: "커뮤니티" },
  { key: "lounge", label: "치지직 라운지" },
  { key: "banner", label: "배너" },
];

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
  return Math.min(max, Math.max(min, Number(v) || 0));
}

// === 업로드 사운드 (IndexedDB) ===
const SOUND_UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5MB 제한
const IDB_DB_NAME = "zz_sound_uploads";
const IDB_STORE = "files";

function openUploadDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        const os = db.createObjectStore(IDB_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        os.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function addUploadRecord({ name, type, size, blob }) {
  const db = await openUploadDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).add({
      name,
      type,
      size,
      blob,
      createdAt: Date.now(),
    }).onsuccess = (ev) => resolve(ev.target.result);
    tx.onerror = () => reject(tx.error);
  });
}
async function getAllUploads() {
  const db = await openUploadDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function getUploadById(id) {
  const db = await openUploadDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(Number(id));
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
async function deleteUploadById(id) {
  const db = await openUploadDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const req = tx.objectStore(IDB_STORE).delete(Number(id));
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// 브라우저 디코딩 가능 여부 선검사 (지원 코덱/컨테이너 체크)
async function canDecodeAudioFile(file) {
  if (file.size === 0) return false;
  // 간단 MIME 체크 (힌트) + 실제 디코딩 시도
  const arrBuf = await file.arrayBuffer();
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    await ctx.decodeAudioData(arrBuf.slice(0)); // Safari 방지용 slice
    ctx.close?.();
    return true;
  } catch {
    return false;
  }
}

// 기본 + 업로드 목록을 합친 옵션 생성
async function getCombinedSoundOptions() {
  const builtin = AVAILABLE_SOUND_FILES.map((file) => {
    const fileName = file.split(".")[0];
    const fileNo = fileName.split("_")[1];
    const label =
      fileName.split("_")[0].replace("notification", "알림") + fileNo;
    return { value: file, label };
  });
  const uploads = await getAllUploads();
  const custom = uploads.map((u) => ({
    value: `idb:${u.id}`,
    label: `업로드: ${u.name}`,
  }));
  return [...builtin, ...custom];
}

// 어떤 업로드 id가 사용 중인지 검사
async function isUploadUsed(id) {
  const settings = await loadSoundSettings();
  const needle = `idb:${id}`;
  return Object.values(settings).some((s) => s.file === needle);
}

// 사용 중인 설정이 있으면 기본 파일로 롤백
async function unassignIfDeleted(id) {
  const needle = `idb:${id}`;
  const cur = await loadSoundSettings();
  let changed = false;
  for (const k of Object.keys(cur)) {
    if (cur[k]?.file === needle) {
      cur[k].file = DEFAULT_SOUND_SETTINGS[k]?.file || AVAILABLE_SOUND_FILES[0];
      changed = true;
    }
  }
  if (changed) await saveSoundSettings(cur);
}

async function loadSoundSettings() {
  const { soundSettings = {} } = await chrome.storage.local.get(
    "soundSettings"
  );
  const merged = { ...DEFAULT_SOUND_SETTINGS, ...soundSettings };
  for (const k of Object.keys(DEFAULT_SOUND_SETTINGS)) {
    merged[k] = { ...DEFAULT_SOUND_SETTINGS[k], ...(soundSettings[k] || {}) };
  }
  return merged;
}

// 전역(마스터) 기본값/로드/세이브
const DEFAULT_SOUND_GLOBAL = { enabled: true, volume: 1.0 };

async function loadSoundGlobal() {
  const { soundGlobal = DEFAULT_SOUND_GLOBAL } = await chrome.storage.local.get(
    "soundGlobal"
  );
  return {
    enabled: !!soundGlobal.enabled,
    volume: Math.min(2, Math.max(0, Number(soundGlobal.volume ?? 1))),
  };
}
async function saveSoundGlobal(next) {
  await chrome.storage.local.set({ soundGlobal: next });
}

// initializeSoundSettings() 내부에서 마스터 UI 바인딩
async function wireMasterControls() {
  const m = await loadSoundGlobal();
  const en = document.getElementById("sound-master-enabled");
  const vol = document.getElementById("sound-master-volume");
  const badge = document.getElementById("sound-master-volume-badge");

  if (!en || !vol || !badge) return;

  const setBadge = (v) => {
    badge.textContent = `${Math.round(v * 100)}%`;
    vol.title = `전체 볼륨: ${Math.round(v * 100)}%`;
  };

  en.checked = m.enabled;
  vol.value = String(m.volume);
  setBadge(m.volume);

  vol.style.setProperty("--min", "0");
  vol.style.setProperty("--max", "2");
  vol.style.setProperty("--val", vol.value);

  en.addEventListener("change", async () => {
    const cur = await loadSoundGlobal();
    cur.enabled = en.checked;
    await saveSoundGlobal(cur);
  });

  vol.addEventListener("input", async () => {
    const cur = await loadSoundGlobal();
    cur.volume = Math.min(2, Math.max(0, Number(vol.value)));
    setBadge(cur.volume);
    vol.style.setProperty("--val", vol.value);
    await saveSoundGlobal(cur);
  });
}

async function saveSoundSettings(next) {
  // next = 전체 설정 객체
  await chrome.storage.local.set({ soundSettings: next });
}

async function buildRow({ key, label }, settings, soundOptions) {
  const row = document.createElement("div");
  row.className = "row";

  const rowLabel = document.createElement("div");
  rowLabel.className = "row-label";
  rowLabel.textContent = label;

  const toggleWrap = document.createElement("label");
  toggleWrap.className = "row-toggle";

  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.checked = !!settings[key].enabled;

  chk.addEventListener("change", async () => {
    const cur = await loadSoundSettings();
    cur[key].enabled = chk.checked;
    await saveSoundSettings(cur);
  });
  toggleWrap.append(chk);
  rowLabel.appendChild(toggleWrap);

  const sel = document.createElement("select");

  for (const { value, label } of soundOptions) {
    const opt = document.createElement("option");
    opt.value = value; // builtin: "notification_1.wav", custom: "idb:123"
    opt.textContent = label;
    if (settings[key].file === value) opt.selected = true;
    sel.appendChild(opt);
  }

  sel.addEventListener("change", async () => {
    const cur = await loadSoundSettings();
    cur[key].file = sel.value;
    await saveSoundSettings(cur);
  });

  const vol = document.createElement("input");
  vol.type = "range";
  vol.min = "0";
  vol.max = "1";
  vol.step = "0.01";
  vol.value = String(clamp(settings[key].volume));
  vol.title = `${vol.value * 100}%`;

  vol.style.setProperty("--min", "0");
  vol.style.setProperty("--max", "1");
  vol.style.setProperty("--val", vol.value);

  const volValue = document.createElement("span");
  volValue.textContent = `${vol.value * 100}%`;

  function setVolTitle(el, container) {
    const v = clamp(el.value);
    container.textContent = `${(v * 100).toFixed(0)}%`; // ex) "볼륨: 65%"
    el.title = `${(v * 100).toFixed(0)}%`; // ex) "볼륨: 65%"
    el.setAttribute("aria-label", "볼륨");
    el.setAttribute("aria-valuemin", "0");
    el.setAttribute("aria-valuemax", "1");
    el.setAttribute("aria-valuenow", v.toFixed(2)); // 스크린리더용
  }
  setVolTitle(vol, volValue);

  vol.addEventListener("input", async () => {
    const cur = await loadSoundSettings();
    cur[key].volume = clamp(vol.value);
    setVolTitle(vol, volValue);
    vol.style.setProperty("--val", vol.value);
    await saveSoundSettings(cur);
  });

  // 변경 종료 시 한 번 더 확정 갱신
  vol.addEventListener("change", () => setVolTitle(vol, volValue));

  const preview = document.createElement("button");
  preview.textContent = "미리듣기";
  preview.className = "ghost-btn";
  preview.addEventListener("click", async () => {
    // background에 프리뷰 요청(오프스크린 보장 + 재생)
    await chrome.runtime.sendMessage({
      type: "PLAY_PREVIEW_SOUND",
      file: sel.value,
      volume: clamp(vol.value),
    });
  });

  const div = document.createElement("div");
  div.style.display = "flex";
  div.style.justifyContent = "center";
  div.style.width = "100%";

  div.append(sel, preview);

  row.append(rowLabel, div, vol, volValue);
  return row;
}

function buildMasterRow() {
  const masterRow = document.createElement("div");
  masterRow.className = "sound-master-row";

  const rowLabel = document.createElement("div");
  rowLabel.className = "row-label";
  rowLabel.textContent = "전체 소리";

  const rowToggle = document.createElement("div");
  rowToggle.className = "row-toggle";

  const label = document.createElement("label");
  label.className = "switch";
  label.title = "전체 소리 ON/OFF";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = "sound-master-enabled";

  const sliderSpan = document.createElement("span");
  sliderSpan.className = "slider";

  label.append(input, sliderSpan);
  rowToggle.appendChild(label);

  rowLabel.appendChild(rowToggle);

  const vol = document.createElement("div");
  vol.className = "row-master-vol";

  const volInput = document.createElement("input");
  volInput.type = "range";
  volInput.id = "sound-master-volume";
  volInput.min = "0";
  volInput.max = "2";
  volInput.step = "0.01";

  vol.appendChild(volInput);

  const badge = document.createElement("div");
  badge.className = "row-master-vol-badge";

  const badgeSpan = document.createElement("span");
  badgeSpan.id = "sound-master-volume-badge";
  badgeSpan.textContent = "100%";

  badge.appendChild(badgeSpan);

  const div = document.createElement("div");

  masterRow.append(rowLabel, vol, badge, div);

  return masterRow;
}

async function renderUploadedList(container, refresh = null) {
  container.innerHTML = ""; // 비움

  const closeBtn = document.querySelector(".close-btn-wrapper").cloneNode(true);
  closeBtn.addEventListener("click", () => container.classList.add("hidden"));

  const h1 = document.createElement("h1");
  h1.textContent = "업로드 알림 사운드 목록";

  container.append(closeBtn, h1);

  const list = document.createElement("div");
  list.className = "uploaded-sounds-list";

  const uploads = await getAllUploads();

  if (uploads.length === 0) {
    const empty = document.createElement("div");
    empty.className = "no-uploaded-sounds";
    empty.textContent = "업로드된 파일이 없습니다";
    container.appendChild(empty);
    return;
  }

  for (const u of uploads) {
    const row = document.createElement("div");
    row.className = "uploaded-sound-item";

    const left = document.createElement("div");
    left.textContent = `${u.name} (${(u.size / 1024).toFixed(0)}KB)`;

    const right = document.createElement("div");
    const del = document.createElement("button");
    del.textContent = "삭제";
    del.className = "ghost-btn";

    // 사용 중이면 삭제 비활성화
    if (await isUploadUsed(u.id)) {
      del.disabled = true;
      del.title = "현재 알림 타입에서 사용 중입니다.";
    } else {
      del.onclick = async () => {
        await deleteUploadById(u.id);
        await unassignIfDeleted(u.id);
        await renderUploadedList(container, refresh);
        // 그리드의 셀렉트 옵션도 갱신
        if (typeof refresh === "function") await refresh();
      };
    }

    right.appendChild(del);
    row.append(left, right);
    list.appendChild(row);
  }
  container.appendChild(list);
}

async function mountUploadUIOnce(refresh) {
  const footer = document.querySelector(".sound-settings-footer");
  if (!footer || footer.dataset.uploadInited === "1") return;

  // 업로드 버튼 + 히든 input
  const uploadBtn = document.createElement("button");
  uploadBtn.textContent = "사운드 업로드";
  uploadBtn.className = "ghost-btn";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "audio/*";
  fileInput.multiple = true;
  fileInput.style.display = "none";

  uploadBtn.onclick = () => fileInput.click();

  fileInput.onchange = async () => {
    const files = Array.from(fileInput.files || []);
    for (const f of files) {
      if (f.size > SOUND_UPLOAD_MAX_BYTES) {
        alert(
          `'${f.name}'은(는) 용량 제한(최대 ${
            (SOUND_UPLOAD_MAX_BYTES / 1024 / 1024) | 0
          }MB)을 초과했습니다`
        );
        continue;
      }
      const ok = await canDecodeAudioFile(f);
      if (!ok) {
        alert(
          `'${f.name}'은(는) 현재 브라우저에서 디코딩할 수 없는 형식입니다`
        );
        continue;
      }
      const blob = new Blob([await f.arrayBuffer()], {
        type: f.type || "audio/mpeg",
      });
      await addUploadRecord({ name: f.name, type: f.type, size: f.size, blob });
    }
    // 업로드 후 UI 갱신
    await renderUploadedList(uploadList, refresh);
    await refresh(); // 셀렉트 옵션 새로고침
    fileInput.value = ""; // 초기화
  };

  // 목록 컨테이너
  const uploadList = document.createElement("div");
  uploadList.className = "uploaded-sounds";
  uploadList.classList.add("hidden");

  // 제목
  const title = document.createElement("div");
  title.className = "ghost-btn";
  title.textContent = "업로드 목록";

  title.addEventListener("click", () => {
    uploadList.classList.toggle("hidden");
  });

  const uploadBtnWrapper = document.createElement("div");
  uploadBtnWrapper.style.display = "flex";

  uploadBtnWrapper.append(uploadBtn, title, fileInput, uploadList);

  // 부모 요소의 첫번째 자식을 가져옵니다 (2번째 자식을 찾기 위해)
  const firstChild = footer.firstElementChild;

  // 2번째 자식 (첫번째 자식의 다음 자식)을 찾습니다.
  const secondChild = firstChild ? firstChild.nextElementSibling : null;

  // 2번째 자식이 존재한다면 그 앞에 새 요소를 삽입합니다.
  if (secondChild) {
    footer.insertBefore(uploadBtnWrapper, secondChild);
  } else {
    // 2번째 자식이 없다면 마지막에 추가합니다.
    footer.appendChild(uploadBtnWrapper);
  }

  footer.dataset.uploadInited = "1";
  await renderUploadedList(uploadList, refresh);
}

async function initializeSoundSettings() {
  const openBtn = document.getElementById("sound-settings-open");
  const panel = document.getElementById("sound-settings-panel");
  const grid = document.getElementById("sound-settings-grid");
  const closeBtn = document.getElementById("sound-settings-close");
  const resetBtn = document.getElementById("sound-settings-reset");

  const header = panel.querySelector(".sound-settings-header");

  const render = async () => {
    grid.innerHTML = "";
    const settings = await loadSoundSettings();
    const soundOptions = await getCombinedSoundOptions();

    // 모든 buildRow 프로미스를 배열로 만듦
    const rowPromises = SOUND_TYPES.map((t) =>
      buildRow(t, settings, soundOptions)
    );

    // Promise.all로 모든 UI 조립을 병렬로 처리
    const rows = await Promise.all(rowPromises);

    // 완성된 모든 row를 한 번에 DOM에 추가
    rows.forEach((row) => grid.appendChild(row));

    panel.insertBefore(buildMasterRow(), grid);

    await wireMasterControls();
  };

  openBtn?.addEventListener("click", async () => {
    panel.classList.remove("hidden");
    await render();
    await mountUploadUIOnce(render);
  });
  closeBtn?.addEventListener("click", () => panel.classList.add("hidden"));
  resetBtn?.addEventListener("click", async () => {
    await saveSoundSettings(DEFAULT_SOUND_SETTINGS);
    await render();
  });
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (k.startsWith("on") && typeof v === "function")
      node.addEventListener(k.slice(2), v);
    else if (v !== undefined) node.setAttribute(k, v);
  });

  for (const c of children) {
    if (c == null) continue;
    if (typeof c === "string") node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  }
  return node;
}

function buildPanel() {
  let panel = document.getElementById("bookmarks-panel");
  if (panel) return panel;
  panel = el("div", { id: "bookmarks-panel", class: "panel" });

  // 삭제 버튼 클릭 위임 (한 번만 바인딩)
  panel.addEventListener("click", async (e) => {
    const btn = e.target.closest(".bookmark-delete-btn");
    if (!btn) return;
    const channelId = btn.dataset.channelId;
    if (!channelId) return;

    // 백그라운드에 삭제 요청
    const res = await chrome.runtime.sendMessage({
      type: "bookmark:remove",
      channelId,
    });
    if (res && res.ok) {
      // UI에서 해당 row 제거
      const row = btn.closest(".row");
      if (row) row.remove();
      // 라이브 캐시/표시 재동기화가 필요하면 새로고침
      // await refresh();
    }
  });

  const style = el("style", { id: "bookmarks-style" });
  document.head.appendChild(style);

  const wrapper = document.querySelector("#bookmarks-wrapper") || document.body;

  const header = el(
    "div",
    { id: "bookmarks-actions" },
    el("button", {
      class: "ghost-btn",
      id: "add-bookmarks",
      onclick: addBookmark,
    }),
    el(
      "button",
      { class: "ghost-btn", id: "refresh-bookmarks", onclick: refresh },
      "새로고침"
    ),
    el(
      "button",
      { class: "ghost-btn", id: "clear-bookmarks", onclick: clearAll },
      "모두 지우기"
    )
  );
  header.querySelector("#add-bookmarks").innerHTML = addBookmarkSVG;

  const isFolded = document.body.classList.contains("folded-view");

  const closeBtn = document.querySelector(".close-btn-wrapper").cloneNode(true);
  closeBtn.style.width = "100%";
  closeBtn.style.position = "relative";

  closeBtn.querySelector(".close-btn").style.position = "absolute";
  closeBtn.querySelector(".close-btn").style.right = "0";
  closeBtn.querySelector(".close-btn").style.top = "20px";

  closeBtn.addEventListener("click", () => wrapper.classList.add("hidden"));

  const h1 = document.createElement("h1");
  h1.textContent = "북마크 목록";

  wrapper.innerHTML = "";
  wrapper.append(closeBtn, h1);
  wrapper.appendChild(header);
  wrapper.appendChild(panel);
  return panel;
}

function linkset(channelId) {
  const base = "https://chzzk.naver.com";
  return [
    el(
      "span",
      {},
      el("a", { href: `${base}/${channelId}`, target: "_blank" }, "채널")
    ),
    el(
      "span",
      {},
      el("a", { href: `${base}/live/${channelId}`, target: "_blank" }, "라이브")
    ),
    el(
      "span",
      {},
      el(
        "a",
        { href: `${base}/${channelId}/videos`, target: "_blank" },
        "동영상"
      )
    ),
    el(
      "span",
      {},
      el("a", { href: `${base}/${channelId}/clips`, target: "_blank" }, "클립")
    ),
    el(
      "span",
      {},
      el(
        "a",
        { href: `${base}/${channelId}/community`, target: "_blank" },
        "커뮤니티"
      )
    ),
    el(
      "span",
      {},
      el("a", { href: `${base}/${channelId}/about`, target: "_blank" }, "정보")
    ),
  ];
}

function addBookmark() {
  window.open("https://chzzk.naver.com/following?tab=CHANNEL", "_blank");
}

async function refresh() {
  const panel = buildPanel();
  panel.textContent = "불러오는 중...";

  const res = await chrome.runtime.sendMessage({ type: "bookmark:list" });
  const list = (res && res.bookmarks) || [];

  // 캐시된 라이브 상태 요청(필요 시 백그라운드가 자동 갱신)
  const liveRes = await chrome.runtime.sendMessage({
    type: "bookmark:liveStatus",
  });
  const liveMap = (liveRes && liveRes.live) || {};

  panel.innerHTML = "";
  if (!list.length) {
    panel.appendChild(
      el("div", { id: "bookmarks-empty" }, "등록된 북마크가 없습니다")
    );
    const bookmarkPanel = document.getElementById("bookmarks-panel");
    bookmarkPanel.style.display = "flex";
    return;
  }

  list.forEach((b) => {
    const controlSwitch = document
      .querySelector("label.switch")
      .cloneNode(true);
    controlSwitch.removeAttribute("title");
    controlSwitch.className = "bookmark-switch";

    const checkbox = controlSwitch.querySelector("input");
    checkbox.removeAttribute("id");
    checkbox.className = "bookmark-checkbox";
    checkbox.disabled = true;

    const slider = controlSwitch.querySelector("span");
    slider.className = "bookmark-slider";

    const sliderText = document.createElement("span");

    const nowLive = !!liveMap[b.channelId]?.live; // 캐시 기준 최신 상태

    if (nowLive) {
      controlSwitch.classList.add("live");
      checkbox.checked = true;

      sliderText.className = "bookmark-slider-live";
      sliderText.textContent = "LIVE";
    } else {
      controlSwitch.classList.add("off");
      checkbox.checked = false;

      sliderText.className = "bookmark-slider-off";
      sliderText.textContent = "OFF";
    }

    slider.appendChild(sliderText);

    const row = el(
      "div",
      { class: `row ${nowLive ? "live" : "off"}` },
      el(
        "span",
        { class: "bookmark-delete-btn", dataset: { channelId: b.channelId } },
        "x"
      ),
      el(
        "div",
        { class: "bookmark-channel-info" },
        controlSwitch,
        el("div", { class: "links" }, ...linkset(b.channelId))
      ),
      el(
        "div",
        { class: "bookmark-channel-wrapper" },
        el("img", {
          class: "thumb",
          src: b.image || "",
          alt: `${b.name}_img` || "",
        }),
        el("span", { class: "name" }, b.name || "")
      )
    );
    panel.appendChild(row);
  });
}

async function clearAll() {
  await chrome.runtime.sendMessage({ type: "bookmark:clear" });
  refresh();
}

function initializeBookmark() {
  const btn = document.getElementById("bookmark-btn");
  const wrapper = document.querySelector("#bookmarks-wrapper");
  if (!btn || !wrapper) return;

  if (btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  const open = (e) => {
    e.preventDefault();
    wrapper.classList.remove("hidden");
    queueMicrotask(() => refresh());
  };

  btn.addEventListener("click", open);
}

/**
 * 팝업에 표시된 'ACTIVE' 상태의 승부예측만 10초마다 강제 갱신하는 함수
 */
async function updateActivePredictionDetails() {
  if (!virtualState || !virtualState.predictionStatusMap) return;

  const currentStatusMap = virtualState.predictionStatusMap;
  const channelsToUpdate = [];

  // 1. virtualState에서 'ACTIVE' 상태인 예측만 찾아냄
  for (const [channelId, state] of Object.entries(currentStatusMap)) {
    if (
      state &&
      state.details &&
      state.details.status === "ACTIVE" &&
      state.predictionId
    ) {
      channelsToUpdate.push({
        channelId: channelId,
        predictionId: state.predictionId,
      });
    }
  }

  if (channelsToUpdate.length === 0) return; // 갱신할 항목이 없으면 종료

  try {
    // 2. background.js에 최신 details를 병렬로 요청
    await Promise.all(
      channelsToUpdate.map(async ({ channelId, predictionId }) => {
        const response = await chrome.runtime.sendMessage({
          type: "GET_PREDICTION_DETAILS",
          channelId,
          predictionId,
        });

        if (response && response.ok && response.content) {
          // 3. virtualState의 맵을 최신 `details`로 덮어씀
          virtualState.predictionStatusMap[channelId] = {
            ...virtualState.predictionStatusMap[channelId],
            details: response.content,
          };
        } else {
          // 응답이 실패하면 (e.g., 취소됨, 404)
          // virtualState의 상태를 변경하여 다음 폴링 대상에서 제외
          if (virtualState.predictionStatusMap[channelId]) {
            virtualState.predictionStatusMap[channelId].details = {
              ...(virtualState.predictionStatusMap[channelId].details || {}),
              status: "CANCELLED", // 'ACTIVE'가 아닌 임의의 값
            };
          }
        }
      })
    );

    // 4. 모든 갱신이 완료된 후, renderList를 호출하여 UI를 패치(patch)
    renderList(
      virtualState.items,
      virtualState.liveStatusMap,
      virtualState.partyDonationStatusMap,
      virtualState.partyStatusMap
    );
  } catch (e) {
    console.warn("Prediction fast update failed:", e);
    if (predictionUpdaterInterval) {
      clearInterval(predictionUpdaterInterval);
    }
  }
}
