// 프로필 테두리
import adventurersSpringFrame from '../assets/customization/frames/shop/adventurers-spring.png';
import amethystFrame from '../assets/customization/frames/shop/amethyst.png';
import apprenticeMageFrame from '../assets/customization/frames/shop/apprentice-mage.png';
import arcadePixelFrame from '../assets/customization/frames/shop/arcade-pixel.png';
import cherryBlossomFrame from '../assets/customization/frames/shop/cherry-blossom.png';
import coinRushFrame from '../assets/customization/frames/shop/coin-rush.png';
import dicePartyFrame from '../assets/customization/frames/shop/dice-party.png';
import flamePlayFrame from '../assets/customization/frames/shop/flame-play.png';
import forestFriendFrame from '../assets/customization/frames/shop/forest-friend.png';
import inkWashFrame from '../assets/customization/frames/shop/ink-wash.png';
import lanternFrame from '../assets/customization/frames/shop/lantern.png';
import miniArcadeFrame from '../assets/customization/frames/shop/mini-arcade.png';
import moonDreamFrame from '../assets/customization/frames/shop/moon-dream.png';
import musicNightFrame from '../assets/customization/frames/shop/music-night.png';
import nightFireflyFrame from '../assets/customization/frames/shop/night-firefly.png';
import oceanWaveFrame from '../assets/customization/frames/shop/ocean-wave.png';
import olympiaFrame from '../assets/customization/frames/shop/olympia.png';
import royalHouseFrame from '../assets/customization/frames/shop/royal-house.png';
import shiningButterFrame from '../assets/customization/frames/shop/shining-butter.png';
import snowTownFrame from '../assets/customization/frames/shop/snow-town.png';
import spaceFrame from '../assets/customization/frames/shop/space.png';
import starlightGalaxyFrame from '../assets/customization/frames/shop/starlight-galaxy.png';
import sunsetMatchFrame from '../assets/customization/frames/shop/sunset-match.png';

// 프로필 배너
import guardianNameBanner from '../assets/customization/banners/guardian-name.png';
import amethystBanner from '../assets/customization/banners/amethyst.png';
import discoPopBanner from '../assets/customization/banners/disco-pop.png';
import forestWarriorBanner from '../assets/customization/banners/forest-warrior.png';
import starryNightBanner from '../assets/customization/banners/starry-night.png';
import voyageRoadBanner from '../assets/customization/banners/voyage-road.png';
import fairyGardenBanner from '../assets/customization/banners/fairy-garden.png';
import mermaidOceanBanner from '../assets/customization/banners/mermaid-ocean.png';

// 캐주얼 휘장
import acornEmblem from '../assets/customization/emblems/casual/acorn.png';
import cherryBlossomEmblem from '../assets/customization/emblems/casual/cherry-blossom.png';
import crescentMoonEmblem from '../assets/customization/emblems/casual/crescent-moon.png';
import laurelEmblem from '../assets/customization/emblems/casual/laurel.png';
import pixelHeartEmblem from '../assets/customization/emblems/casual/pixel-heart.png';
import waveEmblem from '../assets/customization/emblems/casual/wave.png';

// 전투 휘장
import archerEmblem from '../assets/customization/emblems/combat/archer.png';
import crossedAxesEmblem from '../assets/customization/emblems/combat/crossed-axes.png';
import crossedSwordsEmblem from '../assets/customization/emblems/combat/crossed-swords.png';
import hammerAnvilEmblem from '../assets/customization/emblems/combat/hammer-anvil.png';
import knightShieldEmblem from '../assets/customization/emblems/combat/knight-shield.png';
import oniMaskEmblem from '../assets/customization/emblems/combat/oni-mask.png';
import spearEmblem from '../assets/customization/emblems/combat/spear.png';
import tridentEmblem from '../assets/customization/emblems/combat/trident.png';

// 채팅 테마
import cherryGardenTheme from '../assets/customization/chat-themes/cherry-garden/preview.png';
import greenForestTheme from '../assets/customization/chat-themes/green-forest/preview.png';
import magicLibraryTheme from '../assets/customization/chat-themes/magic-library/preview.png';
import moonlightLoungeTheme from '../assets/customization/chat-themes/moonlight-lounge/preview.png';
import oceanWalkTheme from '../assets/customization/chat-themes/ocean-walk/preview.png';
import pixelArcadeTheme from '../assets/customization/chat-themes/pixel-arcade/preview.png';

export const CUSTOMIZATION_CATEGORY = {
  FRAME: 'FRAME',
  PROFILE_BANNER: 'PROFILE_BANNER',
  EMBLEM: 'EMBLEM',
  CHAT_THEME: 'CHAT_THEME',
};

export const CUSTOMIZATION_CATEGORY_LABEL = {
  FRAME: '테두리',
  PROFILE_BANNER: '프로필 배너',
  EMBLEM: '휘장',
  CHAT_THEME: '채팅방 테마',
};

export const customizationItems = [
  // ─────────────────────────────
  // 프로필 테두리 23종
  // ─────────────────────────────
  {
    id: 'frame-adventurers-spring',
    code: 'FRAME_ADVENTURERS_SPRING',
    name: '모험자의 봄',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: adventurersSpringFrame,
  },
  {
    id: 'frame-forest-friend',
    code: 'FRAME_FOREST_FRIEND',
    name: '숲 속 친구',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: forestFriendFrame,
  },
  {
    id: 'frame-shining-butter',
    code: 'FRAME_SHINING_BUTTER',
    name: '샤이닝 버터',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: shiningButterFrame,
  },
  {
    id: 'frame-night-firefly',
    code: 'FRAME_NIGHT_FIREFLY',
    name: '밤빛 반디',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: nightFireflyFrame,
  },
  {
    id: 'frame-apprentice-mage',
    code: 'FRAME_APPRENTICE_MAGE',
    name: '견습 마법사',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: apprenticeMageFrame,
  },
  {
    id: 'frame-amethyst',
    code: 'FRAME_AMETHYST',
    name: '자수정',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: amethystFrame,
  },
  {
    id: 'frame-ink-wash',
    code: 'FRAME_INK_WASH',
    name: '수묵화',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: inkWashFrame,
  },
  {
    id: 'frame-lantern',
    code: 'FRAME_LANTERN',
    name: '연등',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: lanternFrame,
  },
  {
    id: 'frame-coin-rush',
    code: 'FRAME_COIN_RUSH',
    name: '코인 러시',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: coinRushFrame,
  },
  {
    id: 'frame-mini-arcade',
    code: 'FRAME_MINI_ARCADE',
    name: '미니 아케이드',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: miniArcadeFrame,
  },
  {
    id: 'frame-space',
    code: 'FRAME_SPACE',
    name: '스페이스',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: spaceFrame,
  },
  {
    id: 'frame-sunset-match',
    code: 'FRAME_SUNSET_MATCH',
    name: '선셋 매치',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: sunsetMatchFrame,
  },
  {
    id: 'frame-starlight-galaxy',
    code: 'FRAME_STARLIGHT_GALAXY',
    name: '별빛 은하',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: starlightGalaxyFrame,
  },
  {
    id: 'frame-cherry-blossom',
    code: 'FRAME_CHERRY_BLOSSOM',
    name: '체리 블러썸',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: cherryBlossomFrame,
  },
  {
    id: 'frame-flame-play',
    code: 'FRAME_FLAME_PLAY',
    name: '플레임 플레이',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: flamePlayFrame,
  },
  {
    id: 'frame-dice-party',
    code: 'FRAME_DICE_PARTY',
    name: '다이스 파티',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: dicePartyFrame,
  },
  {
    id: 'frame-royal-house',
    code: 'FRAME_ROYAL_HOUSE',
    name: '로열 하우스',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: royalHouseFrame,
  },
  {
    id: 'frame-moon-dream',
    code: 'FRAME_MOON_DREAM',
    name: '달의 꿈',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: moonDreamFrame,
  },
  {
    id: 'frame-olympia',
    code: 'FRAME_OLYMPIA',
    name: '올림피아',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: olympiaFrame,
  },
  {
    id: 'frame-ocean-wave',
    code: 'FRAME_OCEAN_WAVE',
    name: '오션 웨이브',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: oceanWaveFrame,
  },
  {
    id: 'frame-snow-town',
    code: 'FRAME_SNOW_TOWN',
    name: '스노우 타운',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: snowTownFrame,
  },
  {
    id: 'frame-arcade-pixel',
    code: 'FRAME_ARCADE_PIXEL',
    name: '아케이드 픽셀',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: arcadePixelFrame,
  },
  {
    id: 'frame-music-night',
    code: 'FRAME_MUSIC_NIGHT',
    name: '뮤직 나이트',
    category: CUSTOMIZATION_CATEGORY.FRAME,
    asset: musicNightFrame,
  },

  // ─────────────────────────────
  // 프로필 배너 8종
  // ─────────────────────────────
  {
    id: 'banner-guardian-name',
    name: '수호의 명',
    category: CUSTOMIZATION_CATEGORY.PROFILE_BANNER,
    asset: guardianNameBanner,
  },
  {
    id: 'banner-amethyst',
    name: '애머시스트',
    category: CUSTOMIZATION_CATEGORY.PROFILE_BANNER,
    asset: amethystBanner,
  },
  {
    id: 'banner-disco-pop',
    name: '디스코 팝',
    category: CUSTOMIZATION_CATEGORY.PROFILE_BANNER,
    asset: discoPopBanner,
  },
  {
    id: 'banner-forest-warrior',
    name: '숲의 전사',
    category: CUSTOMIZATION_CATEGORY.PROFILE_BANNER,
    asset: forestWarriorBanner,
  },
  {
    id: 'banner-starry-night',
    name: '별 헤는 밤',
    category: CUSTOMIZATION_CATEGORY.PROFILE_BANNER,
    asset: starryNightBanner,
  },
  {
    id: 'banner-voyage-road',
    name: '항해의 길',
    category: CUSTOMIZATION_CATEGORY.PROFILE_BANNER,
    asset: voyageRoadBanner,
  },
  {
    id: 'banner-fairy-garden',
    name: '요정의 정원',
    category: CUSTOMIZATION_CATEGORY.PROFILE_BANNER,
    asset: fairyGardenBanner,
  },
  {
    id: 'banner-mermaid-ocean',
    name: '머메이드 오션',
    category: CUSTOMIZATION_CATEGORY.PROFILE_BANNER,
    asset: mermaidOceanBanner,
  },

  // ─────────────────────────────
  // 휘장 14종
  // ─────────────────────────────
  {
    id: 'emblem-crescent-moon',
    name: '초승달',
    category: CUSTOMIZATION_CATEGORY.EMBLEM,
    asset: crescentMoonEmblem,
  },
  {
    id: 'emblem-laurel',
    name: '월계수',
    category: CUSTOMIZATION_CATEGORY.EMBLEM,
    asset: laurelEmblem,
  },
  {
    id: 'emblem-wave',
    name: '파도',
    category: CUSTOMIZATION_CATEGORY.EMBLEM,
    asset: waveEmblem,
  },
  {
    id: 'emblem-cherry-blossom',
    name: '도토리',
    category: CUSTOMIZATION_CATEGORY.EMBLEM,
    asset: cherryBlossomEmblem,
  },
  {
    id: 'emblem-pixel-heart',
    name: '픽셀 하트',
    category: CUSTOMIZATION_CATEGORY.EMBLEM,
    asset: pixelHeartEmblem,
  },
  {
    id: 'emblem-acorn',
    name: '벚꽃',
    category: CUSTOMIZATION_CATEGORY.EMBLEM,
    asset: acornEmblem,
  },
  {
    id: 'emblem-crossed-swords',
    name: '쌍검',
    category: CUSTOMIZATION_CATEGORY.EMBLEM,
    asset: crossedSwordsEmblem,
  },
  {
    id: 'emblem-spear',
    name: '수호자',
    category: CUSTOMIZATION_CATEGORY.EMBLEM,
    asset: spearEmblem,
  },
  {
    id: 'emblem-crossed-axes',
    name: '창',
    category: CUSTOMIZATION_CATEGORY.EMBLEM,
    asset: crossedAxesEmblem,
  },
  {
    id: 'emblem-archer',
    name: '망치와 모루',
    category: CUSTOMIZATION_CATEGORY.EMBLEM,
    asset: archerEmblem,
  },
  {
    id: 'emblem-oni-mask',
    name: '쌍도끼',
    category: CUSTOMIZATION_CATEGORY.EMBLEM,
    asset: oniMaskEmblem,
  },
  {
    id: 'emblem-trident',
    name: '기사 방패',
    category: CUSTOMIZATION_CATEGORY.EMBLEM,
    asset: tridentEmblem,
  },
  {
    id: 'emblem-hammer-anvil',
    name: '궁수',
    category: CUSTOMIZATION_CATEGORY.EMBLEM,
    asset: hammerAnvilEmblem,
  },
  {
    id: 'emblem-knight-shield',
    name: '삼지창',
    category: CUSTOMIZATION_CATEGORY.EMBLEM,
    asset: knightShieldEmblem,
  },

  // ─────────────────────────────
  // 채팅방 테마 6종
  // ─────────────────────────────
  {
    id: 'chat-theme-moonlight-lounge',
    name: '달빛 라운지',
    category: CUSTOMIZATION_CATEGORY.CHAT_THEME,
    asset: moonlightLoungeTheme,
  },
  {
    id: 'chat-theme-cherry-garden',
    name: '벚꽃 정원',
    category: CUSTOMIZATION_CATEGORY.CHAT_THEME,
    asset: cherryGardenTheme,
  },
  {
    id: 'chat-theme-green-forest',
    name: '초록빛 숲',
    category: CUSTOMIZATION_CATEGORY.CHAT_THEME,
    asset: greenForestTheme,
  },
  {
    id: 'chat-theme-pixel-arcade',
    name: '픽셀 아케이드',
    category: CUSTOMIZATION_CATEGORY.CHAT_THEME,
    asset: pixelArcadeTheme,
  },
  {
    id: 'chat-theme-magic-library',
    name: '마법 서재',
    category: CUSTOMIZATION_CATEGORY.CHAT_THEME,
    asset: magicLibraryTheme,
  },
  {
    id: 'chat-theme-ocean-walk',
    name: '바다 산책',
    category: CUSTOMIZATION_CATEGORY.CHAT_THEME,
    asset: oceanWalkTheme,
  },
];

export const getCustomizationItemsByCategory = (category) => (
  customizationItems.filter((item) => item.category === category)
);

export const getCustomizationItemById = (itemId) => (
  customizationItems.find((item) => item.id === itemId) ?? null
);

// 실제 Shop API의 영구 code와 기존 로컬 asset을 연결하는 정확한 registry 조회.
export const getCustomizationItemByCode = (code) => (
  customizationItems.find((item) => item.code === code) ?? null
);
