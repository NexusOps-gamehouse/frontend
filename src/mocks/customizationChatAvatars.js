const CHAT_THEME_AVATAR_MODULES = import.meta.glob(
  '../assets/customization/chat-themes/*/avatars/*.png',
  {
    eager: true,
    import: 'default',
  },
);

const AVATAR_LABELS = {
  'moonlight-lounge': {
    'moon-cloud': '구름 달',
    moon: '달빛',
    rabbit: '달토끼',
    star: '별빛',
  },
  'green-forest': {
    hedgehog: '고슴도치',
    leaf: '잎사귀',
    sprout: '새싹',
    tree: '나무',
  },
  'pixel-arcade': {
    alien: '외계인',
    heart: '픽셀 하트',
    planet: '행성',
    star: '픽셀 별',
  },
  'cherry-garden': {
    butterfly: '나비',
    'cherry-blossom': '벚꽃',
    'cherry-tree': '벚나무',
    flower: '꽃',
  },
  'magic-library': {
    'magic-book': '마법책',
    potion: '마법 물약',
    star: '마법 별',
    'wizard-hat': '마법사 모자',
  },
  'ocean-walk': {
    shell: '조개',
    starfish: '불가사리',
    turtle: '거북이',
    wave: '파도',
  },
};

export const CHAT_THEME_KEYS = [
  'moonlight-lounge',
  'green-forest',
  'pixel-arcade',
  'cherry-garden',
  'magic-library',
  'ocean-walk',
];

const themeIdFromKey = (themeKey) => `chat-theme-${themeKey}`;

export const getChatThemeKey = (themeIdOrKey) => {
  const source = String(themeIdOrKey ?? '');
  return CHAT_THEME_KEYS.find((themeKey) => (
    source === themeKey || source === themeIdFromKey(themeKey)
  )) ?? null;
};

export const chatThemeAvatars = Object.entries(CHAT_THEME_AVATAR_MODULES)
  .flatMap(([path, asset]) => {
    const match = path.match(/chat-themes\/([^/]+)\/avatars\/([^/]+)\.png$/);
    if (!match) return [];
    const [, themeKey, assetKey] = match;
    if (!CHAT_THEME_KEYS.includes(themeKey)) return [];
    return [{
      id: `chat-avatar-${themeKey}-${assetKey}`,
      name: AVATAR_LABELS[themeKey]?.[assetKey] ?? assetKey,
      asset,
      assetKey,
      themeId: themeIdFromKey(themeKey),
      themeKey,
    }];
  })
  .sort((left, right) => (
    CHAT_THEME_KEYS.indexOf(left.themeKey) - CHAT_THEME_KEYS.indexOf(right.themeKey)
      || left.assetKey.localeCompare(right.assetKey)
  ));

export const getChatThemeAvatars = (themeIdOrKey) => {
  const themeKey = getChatThemeKey(themeIdOrKey);
  return themeKey
    ? chatThemeAvatars.filter((avatar) => avatar.themeKey === themeKey)
    : [];
};

export const getChatThemeAvatarById = (avatarId) => (
  chatThemeAvatars.find((avatar) => avatar.id === avatarId) ?? null
);

export const getDefaultChatThemeAvatar = (themeIdOrKey) => (
  getChatThemeAvatars(themeIdOrKey)[0] ?? null
);
