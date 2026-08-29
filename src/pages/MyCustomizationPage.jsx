import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import {
  getCustomizationState,
  saveEquippedCustomization,
} from '../api/customization';
import { listMyHouses } from '../api/houses';
import {
  listShopInventory,
  updateInventoryItemApplication,
} from '../api/shop';
import {
  CUSTOMIZATION_CATEGORY,
  CUSTOMIZATION_CATEGORY_LABEL,
  customizationItems,
} from '../mocks/customizationItems';
import {
  getChatThemeAvatarById,
  getChatThemeAvatars,
  getDefaultChatThemeAvatar,
} from '../mocks/customizationChatAvatars';
import ShopItemImage from '../components/ShopItemImage';
import './MyCustomizationPage.css';
import './ChatThemeFinal.css';

const PROFILE_CATEGORIES = [
  CUSTOMIZATION_CATEGORY.FRAME,
  CUSTOMIZATION_CATEGORY.PROFILE_BANNER,
  CUSTOMIZATION_CATEGORY.EMBLEM,
];

const BANNER_LAYOUTS = [
  ['guardian-name', 'guardian'],
  ['amethyst', 'amethyst'],
  ['disco-pop', 'disco'],
  ['forest-warrior', 'forest'],
  ['starry-night', 'starry'],
  ['voyage-road', 'voyage'],
  ['fairy-garden', 'fairy'],
  ['mermaid-ocean', 'mermaid'],
];

const EMPTY_SELECTION = {
  [CUSTOMIZATION_CATEGORY.FRAME]:
    null,

  [CUSTOMIZATION_CATEGORY.PROFILE_BANNER]:
    null,

  [CUSTOMIZATION_CATEGORY.EMBLEM]:
    null,

  [CUSTOMIZATION_CATEGORY.CHAT_THEME]:
    null,

  equippedChatAvatarId:
    null,
};

const getBannerLayoutKey = (
  banner,
) => {
  const source = [
    banner?.id,
    banner?.name,
    banner?.asset,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matched =
    BANNER_LAYOUTS.find(
      ([key]) =>
        source.includes(key),
    );

  return matched?.[1] ?? 'default';
};

const stateToSelection = (
  state,
) => {
  const equippedChatThemeId =
    state?.equippedChatThemeId ??
    null;

  const savedChatAvatar =
    getChatThemeAvatarById(
      state?.equippedChatAvatarId,
    );

  return {
    [CUSTOMIZATION_CATEGORY.FRAME]:
      state?.equippedFrameId ??
      null,

    [CUSTOMIZATION_CATEGORY.PROFILE_BANNER]:
      state?.equippedBannerId ??
      null,

    [CUSTOMIZATION_CATEGORY.EMBLEM]:
      state?.equippedEmblemId ??
      null,

    [CUSTOMIZATION_CATEGORY.CHAT_THEME]:
      equippedChatThemeId,

    equippedChatAvatarId:
      savedChatAvatar?.themeId ===
        equippedChatThemeId
        ? savedChatAvatar.id
        : getDefaultChatThemeAvatar(
            equippedChatThemeId,
          )?.id ?? null,
  };
};

function LegacyMyCustomizationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeSection, setActiveSection] =
    useState('PROFILE');

  const [
    activeProfileCategory,
    setActiveProfileCategory,
  ] = useState(
    CUSTOMIZATION_CATEGORY.FRAME,
  );

  const [ownedItemIds, setOwnedItemIds] =
    useState([]);

  const [appliedItems, setAppliedItems] =
    useState(EMPTY_SELECTION);

  const [selectedItems, setSelectedItems] =
    useState(EMPTY_SELECTION);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [
    bannerAspectRatio,
    setBannerAspectRatio,
  ] = useState('3.3 / 1');

  /*
   * 저장된 보유 / 장착 상태 불러오기
   */
  useEffect(() => {
    let alive = true;

    const load =
      async () => {
        if (!user) {
          return;
        }

        setLoading(true);
        setError('');

        try {
          const state =
            await getCustomizationState(
              user,
            );

          if (!alive) {
            return;
          }

          const equipped =
            stateToSelection(state);

          setOwnedItemIds(
            state.ownedItemIds ?? [],
          );

          setAppliedItems(
            equipped,
          );

          setSelectedItems(
            equipped,
          );
        } catch (requestError) {
          if (!alive) {
            return;
          }

          setError(
            requestError.message ||
              '꾸미기 정보를 불러오지 못했습니다.',
          );
        } finally {
          if (alive) {
            setLoading(false);
          }
        }
      };

    load();

    return () => {
      alive = false;
    };
  }, [user]);

  const activeCategory =
    activeSection === 'PROFILE'
      ? activeProfileCategory
      : CUSTOMIZATION_CATEGORY.CHAT_THEME;

  /*
   * 이제 진짜 보유한 아이템만 표시한다.
   */
  const ownedItems = useMemo(
    () =>
      customizationItems.filter(
        (item) =>
          ownedItemIds.includes(
            item.id,
          ),
      ),
    [ownedItemIds],
  );

  const visibleItems = useMemo(
    () =>
      ownedItems.filter(
        (item) =>
          item.category ===
          activeCategory,
      ),
    [
      ownedItems,
      activeCategory,
    ],
  );

  const findItem = (itemId) =>
    customizationItems.find(
      (item) =>
        item.id === itemId,
    ) ?? null;

  /*
   * 선택 중인 LIVE PREVIEW 조합
   */
  const previewFrame =
    findItem(
      selectedItems[
        CUSTOMIZATION_CATEGORY.FRAME
      ],
    );

  const previewBanner =
    findItem(
      selectedItems[
        CUSTOMIZATION_CATEGORY.PROFILE_BANNER
      ],
    );

  const previewEmblem =
    findItem(
      selectedItems[
        CUSTOMIZATION_CATEGORY.EMBLEM
      ],
    );

  const previewChatTheme =
    findItem(
      selectedItems[
        CUSTOMIZATION_CATEGORY.CHAT_THEME
      ],
    );

  const previewChatAvatars =
    useMemo(
      () =>
        getChatThemeAvatars(
          selectedItems[
            CUSTOMIZATION_CATEGORY.CHAT_THEME
          ],
        ),
      [
        selectedItems,
      ],
    );

  const previewChatAvatar =
    previewChatAvatars.find(
      (avatar) =>
        avatar.id ===
        selectedItems.equippedChatAvatarId,
    ) ?? previewChatAvatars[0] ?? null;

  const bannerLayoutKey =
    getBannerLayoutKey(
      previewBanner,
    );

  useEffect(() => {
    setBannerAspectRatio(
      '3.3 / 1',
    );
  }, [previewBanner?.id]);

  const selectedItemId =
    selectedItems[
      activeCategory
    ];

  const hasAnyChanges =
    useMemo(
      () =>
        Object.keys(
          selectedItems,
        ).some(
          (category) =>
            selectedItems[
              category
            ] !==
            appliedItems[
              category
            ],
        ),
      [
        selectedItems,
        appliedItems,
      ],
    );

  const nickname =
    user?.nickname ||
    user?.name ||
    'GAME HOUSE USER';

  const profileSubText =
    user?.riotId ||
    user?.riotNickname ||
    user?.gameName ||
    'GAME HOUSE PLAYER';

  const handleSectionChange = (
    section,
  ) => {
    setActiveSection(
      section,
    );

    setSuccessMessage('');
  };

  const handleProfileCategoryChange = (
    category,
  ) => {
    setActiveProfileCategory(
      category,
    );

    setSuccessMessage('');
  };

  const handleSelectItem = (
    itemId,
  ) => {
    setSelectedItems(
      (current) => {
        if (
          activeCategory ===
          CUSTOMIZATION_CATEGORY.CHAT_THEME
        ) {
          const avatars =
            getChatThemeAvatars(
              itemId,
            );

          const currentAvatar =
            getChatThemeAvatarById(
              current.equippedChatAvatarId,
            );

          return {
            ...current,

            [activeCategory]:
              itemId,

            equippedChatAvatarId:
              currentAvatar?.themeId ===
                itemId
                ? currentAvatar.id
                : avatars[0]?.id ?? null,
          };
        }

        return {
          ...current,

          [activeCategory]:
            itemId,
        };
      },
    );

    setSuccessMessage('');
  };

  const handleSelectChatAvatar = (
    avatarId,
  ) => {
    if (
      !previewChatAvatars.some(
        (avatar) =>
          avatar.id === avatarId,
      )
    ) {
      return;
    }

    setSelectedItems(
      (current) => ({
        ...current,
        equippedChatAvatarId:
          avatarId,
      }),
    );

    setSuccessMessage('');
  };

  /*
   * 아직 저장하지 않은 선택을
   * 실제 장착 상태로 되돌린다.
   */
  const handleCancel = () => {
    setSelectedItems({
      ...appliedItems,
    });

    setError('');
    setSuccessMessage('');
  };

  /*
   * 실제 저장
   */
  const handleApply =
    async () => {
      if (
        !hasAnyChanges ||
        saving
      ) {
        return;
      }

      setSaving(true);
      setError('');
      setSuccessMessage('');

      try {
        const savedState =
          await saveEquippedCustomization(
            user,
            selectedItems,
          );

        const equipped =
          stateToSelection(
            savedState,
          );

        setOwnedItemIds(
          savedState.ownedItemIds ??
            [],
        );

        setAppliedItems(
          equipped,
        );

        setSelectedItems(
          equipped,
        );

        setSuccessMessage(
          '선택한 꾸미기 아이템을 적용했습니다.',
        );
      } catch (requestError) {
        setError(
          requestError.message ||
            '꾸미기 아이템을 적용하지 못했습니다.',
        );
      } finally {
        setSaving(false);
      }
    };

  const handleBannerLoad = (
    event,
  ) => {
    const {
      naturalWidth,
      naturalHeight,
    } = event.currentTarget;

    if (
      naturalWidth > 0 &&
      naturalHeight > 0
    ) {
      setBannerAspectRatio(
        `${naturalWidth} / ${naturalHeight}`,
      );
    }
  };

  if (loading) {
    return (
      <main className="my-customization-page">
        <div className="my-customization-container">
          <div className="ui-empty">
            <p>
              꾸미기 정보를 불러오는 중…
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="my-customization-page">
      <div className="my-customization-container">
        {/* Header */}
        <header className="my-customization-header">
          <div>
            <h1>내 꾸미기</h1>

            <p>
              보유한 아이템을 선택해
              프로필과 채팅방에 적용할
              수 있습니다.
            </p>
          </div>

          <button
            type="button"
            className="ui-btn-secondary my-customization-shop-button"
            onClick={() =>
              navigate(
                '/customization/shop',
              )
            }
          >
            상점으로
          </button>
        </header>

        {/* Main Tabs */}
        <nav
          className="my-customization-main-tabs"
          aria-label="꾸미기 종류"
        >
          <button
            type="button"
            className={
              activeSection ===
              'PROFILE'
                ? 'my-customization-main-tab is-active'
                : 'my-customization-main-tab'
            }
            onClick={() =>
              handleSectionChange(
                'PROFILE',
              )
            }
          >
            프로필
          </button>

          <button
            type="button"
            className={
              activeSection ===
              'CHAT'
                ? 'my-customization-main-tab is-active'
                : 'my-customization-main-tab'
            }
            onClick={() =>
              handleSectionChange(
                'CHAT',
              )
            }
          >
            채팅방
          </button>
        </nav>

        {/* Profile Category Tabs */}
        {activeSection ===
          'PROFILE' && (
          <nav
            className="my-customization-profile-tabs"
            aria-label="프로필 꾸미기 카테고리"
          >
            {PROFILE_CATEGORIES.map(
              (category) => (
                <button
                  key={category}
                  type="button"
                  className={
                    activeProfileCategory ===
                    category
                      ? 'my-customization-profile-tab is-active'
                      : 'my-customization-profile-tab'
                  }
                  onClick={() =>
                    handleProfileCategoryChange(
                      category,
                    )
                  }
                >
                  {
                    CUSTOMIZATION_CATEGORY_LABEL[
                      category
                    ]
                  }
                </button>
              ),
            )}
          </nav>
        )}

        {error && (
          <div
            className="house-alert error"
            role="alert"
            style={{
              marginBottom: 18,
            }}
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            className="house-alert success"
            role="status"
            style={{
              marginBottom: 18,
            }}
          >
            {successMessage}
          </div>
        )}

        <div className="my-customization-content">
          {/* LEFT */}
          <section className="my-customization-preview-column">
            <h2 className="my-customization-section-title">
              {activeSection ===
              'PROFILE'
                ? '프로필 미리보기'
                : '채팅방 미리보기'}
            </h2>

            {activeSection ===
            'PROFILE' ? (
              <>
                <div
                  className={[
                    'custom-profile-preview',
                    `banner-layout-${bannerLayoutKey}`,
                  ].join(' ')}
                  style={{
                    '--banner-ratio':
                      bannerAspectRatio,
                  }}
                >
                  {previewBanner && (
                    <img
                      className="custom-profile-banner"
                      src={
                        previewBanner.asset
                      }
                      alt=""
                      aria-hidden="true"
                      onLoad={
                        handleBannerLoad
                      }
                    />
                  )}

                  <div className="custom-profile-overlay">
                    {/* Avatar + Frame */}
                    <div className="custom-profile-avatar-slot">
                      <div className="custom-profile-avatar-stage">
                        <div className="custom-profile-avatar">
                          <Avatar
                            user={user}
                            size="lg"
                          />
                        </div>

                        {previewFrame && (
                          <img
                            className="custom-profile-frame"
                            src={
                              previewFrame.asset
                            }
                            alt=""
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="custom-profile-info">
                      <strong className="custom-profile-nickname">
                        {nickname}
                      </strong>

                      <span className="custom-profile-subtext">
                        {
                          profileSubText
                        }
                      </span>

                      <div className="custom-profile-tags">
                        <span>
                          GAME HOUSE
                        </span>

                        <span>
                          PLAYER
                        </span>

                        <span>
                          CUSTOM
                        </span>
                      </div>
                    </div>

                    {/* Emblem */}
                    <div className="custom-profile-emblem-slot">
                      <div className="custom-profile-emblem">
                        {previewEmblem ? (
                          <img
                            src={
                              previewEmblem.asset
                            }
                            alt={`${previewEmblem.name} 휘장`}
                          />
                        ) : (
                          <span>
                            휘장 없음
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Combination */}
                <section className="my-customization-current-panel">
                  <h3>
                    현재 조합
                  </h3>

                  <div className="my-customization-current-grid">
                    <div className="my-customization-current-card">
                      <span>
                        테두리
                      </span>

                      <div className="current-item-preview square">
                        {previewFrame && (
                          <img
                            src={
                              previewFrame.asset
                            }
                            alt={
                              previewFrame.name
                            }
                          />
                        )}
                      </div>

                      <strong>
                        {previewFrame?.name ??
                          '없음'}
                      </strong>
                    </div>

                    <div className="my-customization-current-card">
                      <span>
                        프로필 배너
                      </span>

                      <div className="current-item-preview banner">
                        {previewBanner && (
                          <img
                            src={
                              previewBanner.asset
                            }
                            alt={
                              previewBanner.name
                            }
                          />
                        )}
                      </div>

                      <strong>
                        {previewBanner?.name ??
                          '없음'}
                      </strong>
                    </div>

                    <div className="my-customization-current-card">
                      <span>
                        휘장
                      </span>

                      <div className="current-item-preview square">
                        {previewEmblem && (
                          <img
                            src={
                              previewEmblem.asset
                            }
                            alt={
                              previewEmblem.name
                            }
                          />
                        )}
                      </div>

                      <strong>
                        {previewEmblem?.name ??
                          '없음'}
                      </strong>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <>
                <div className="my-customization-chat-preview">
                  {previewChatTheme ? (
                    <>
                      <img
                        className="my-customization-chat-theme-image"
                        src={
                          previewChatTheme.asset
                        }
                        alt={`${previewChatTheme.name} 채팅 테마`}
                      />

                      {previewChatAvatar && (
                        <div className="my-customization-chat-avatar-preview">
                          <img
                            src={
                              previewChatAvatar.asset
                            }
                            alt={`${previewChatAvatar.name} 프로필 이미지`}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="my-customization-chat-empty">
                      적용할 채팅 테마를
                      선택해주세요.
                    </div>
                  )}
                </div>

                <section className="my-customization-chat-avatar-picker">
                  <div className="my-customization-chat-avatar-heading">
                    <div>
                      <h3>테마 프로필 선택</h3>
                      <p>채팅에서 사용할 프로필 이미지를 직접 선택하세요.</p>
                    </div>

                    <span>{previewChatAvatars.length}개</span>
                  </div>

                  {previewChatAvatars.length > 0 ? (
                    <div className="my-customization-chat-avatar-grid" role="radiogroup" aria-label="채팅 테마 프로필 이미지">
                      {previewChatAvatars.map(
                        (avatar) => {
                          const isSelected =
                            previewChatAvatar?.id ===
                            avatar.id;

                          return (
                            <button
                              key={avatar.id}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              className={isSelected
                                ? 'my-customization-chat-avatar-option is-selected'
                                : 'my-customization-chat-avatar-option'}
                              onClick={() =>
                                handleSelectChatAvatar(
                                  avatar.id,
                                )
                              }
                            >
                              <span className="my-customization-chat-avatar-image">
                                <img src={avatar.asset} alt="" aria-hidden="true" />
                                {isSelected && <span aria-hidden="true">✓</span>}
                              </span>
                              <strong>{avatar.name}</strong>
                            </button>
                          );
                        },
                      )}
                    </div>
                  ) : (
                    <div className="my-customization-chat-avatar-empty">
                      이 테마에서 사용할 수 있는 프로필 이미지가 없습니다.
                    </div>
                  )}
                </section>

                <section className="my-customization-current-panel">
                  <h3>
                    현재 조합
                  </h3>

                  <div className="my-customization-chat-current-list">
                    <div className="my-customization-chat-current">
                      <span>
                        채팅방 테마
                      </span>

                      <strong>
                        {previewChatTheme?.name ??
                          '없음'}
                      </strong>
                    </div>

                    <div className="my-customization-chat-current">
                      <span>
                        프로필 이미지
                      </span>

                      <strong>
                        {previewChatAvatar?.name ??
                          '기본 Avatar'}
                      </strong>
                    </div>
                  </div>
                </section>
              </>
            )}
          </section>

          {/* RIGHT */}
          <section className="my-customization-inventory-column">
            <div className="my-customization-inventory-header">
              <div>
                <h2>
                  보유 아이템
                </h2>

                <p>
                  {
                    CUSTOMIZATION_CATEGORY_LABEL[
                      activeCategory
                    ]
                  }{' '}
                  {visibleItems.length}개
                </p>
              </div>
            </div>

            {visibleItems.length ===
            0 ? (
              <div className="ui-empty">
                <p>
                  보유한{' '}
                  {
                    CUSTOMIZATION_CATEGORY_LABEL[
                      activeCategory
                    ]
                  }{' '}
                  아이템이 없습니다.
                  <br />
                  상점에서 아이템을
                  확인해보세요.
                </p>
              </div>
            ) : (
              <div className="my-customization-item-grid">
                {visibleItems.map(
                  (item) => {
                    const isSelected =
                      selectedItemId ===
                      item.id;

                    const isApplied =
                      appliedItems[
                        activeCategory
                      ] === item.id;

                    const categoryClass =
                      item.category.toLowerCase();

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={[
                          'my-customization-item-card',

                          isSelected
                            ? 'is-selected'
                            : '',

                          isApplied
                            ? 'is-applied'
                            : '',
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(' ')}
                        onClick={() =>
                          handleSelectItem(
                            item.id,
                          )
                        }
                      >
                        <span className="my-customization-item-name">
                          {item.name}
                        </span>

                        <div
                          className={`my-customization-item-image ${categoryClass}`}
                        >
                          <img
                            src={
                              item.asset
                            }
                            alt={
                              item.name
                            }
                            loading="lazy"
                          />

                          {isApplied && (
                            <span className="my-customization-applied-badge">
                              적용 중
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="my-customization-action-bar">
        <div className="my-customization-action-inner">
          <button
            type="button"
            className="ui-btn-secondary my-customization-cancel-button"
            disabled={
              !hasAnyChanges ||
              saving
            }
            onClick={
              handleCancel
            }
          >
            취소
          </button>

          <button
            type="button"
            className="ui-btn-primary my-customization-apply-button"
            disabled={
              !hasAnyChanges ||
              saving
            }
            onClick={
              handleApply
            }
          >
            {saving
              ? '적용 중…'
              : '선택 항목 적용'}
          </button>

          <p className="my-customization-action-help">
            ⓘ 적용 결과는 프로필과
            서비스 내 사용자 정보에
            반영됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}

const CREW_CUSTOMIZATION_CATEGORY = {
  BORDER: CUSTOMIZATION_CATEGORY.FRAME,
  BANNER: CUSTOMIZATION_CATEGORY.PROFILE_BANNER,
  HOUSE_ICON: CUSTOMIZATION_CATEGORY.EMBLEM,
  CHAT_SKIN: CUSTOMIZATION_CATEGORY.CHAT_THEME,
};

const crewCategory = (category) => CREW_CUSTOMIZATION_CATEGORY[category] || null;

const crewItemFromInventory = (entry) => {
  const item = entry?.item;
  const category = crewCategory(item?.category);
  if (!item || !category || entry.quantity <= 0) return null;
  return {
    ...item,
    id: item.id,
    category,
    imageUrl: item.imageUrl || null,
    inventoryId: entry.id,
    isApplied: entry.isApplied === true,
  };
};

const emptyCrewSelection = () => ({
  [CUSTOMIZATION_CATEGORY.FRAME]: null,
  [CUSTOMIZATION_CATEGORY.PROFILE_BANNER]: null,
  [CUSTOMIZATION_CATEGORY.EMBLEM]: null,
  [CUSTOMIZATION_CATEGORY.CHAT_THEME]: null,
  equippedChatAvatarId: null,
});

function CrewMyCustomizationPage({ user, houses }) {
  const [selectedHouseId, setSelectedHouseId] = useState(houses[0]?.id ?? '');
  const [inventory, setInventory] = useState([]);
  const [activeSection, setActiveSection] = useState('PROFILE');
  const [activeProfileCategory, setActiveProfileCategory] = useState(CUSTOMIZATION_CATEGORY.FRAME);
  const [selectedItems, setSelectedItems] = useState(emptyCrewSelection);
  const [appliedItems, setAppliedItems] = useState(emptyCrewSelection);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const mountedRef = useRef(false);
  const loadVersionRef = useRef(0);
  const selectedHouse = houses.find((house) => String(house.id) === String(selectedHouseId));

  const loadInventory = async () => {
    if (!selectedHouseId) return;
    const version = loadVersionRef.current + 1;
    loadVersionRef.current = version;
    const isCurrentLoad = () => mountedRef.current && version === loadVersionRef.current;
    setLoading(true);
    setError('');
    try {
      const entries = await listShopInventory({ houseId: selectedHouseId, userId: user.id });
      if (!isCurrentLoad()) return;
      const nextApplied = emptyCrewSelection();
      entries.forEach((entry) => {
        const item = crewItemFromInventory(entry);
        if (item?.isApplied) nextApplied[item.category] = item.id;
      });
      setInventory(entries);
      setAppliedItems(nextApplied);
      setSelectedItems(nextApplied);
    } catch (requestError) {
      if (isCurrentLoad()) {
        setInventory([]);
        setError(requestError.message || 'Inventory를 불러오지 못했습니다.');
      }
    } finally {
      if (isCurrentLoad()) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    setInventory([]);
    setSelectedItems(emptyCrewSelection());
    setAppliedItems(emptyCrewSelection());
    loadInventory();
    return () => { mountedRef.current = false; };
    // House 선택 변경마다 서버 Inventory를 다시 조회한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHouseId]);

  const items = useMemo(() => inventory.map(crewItemFromInventory).filter(Boolean), [inventory]);
  const activeCategory = activeSection === 'PROFILE' ? activeProfileCategory : CUSTOMIZATION_CATEGORY.CHAT_THEME;
  const visibleItems = useMemo(() => items.filter((item) => item.category === activeCategory), [activeCategory, items]);
  const selectedItemId = selectedItems[activeCategory];
  const findItem = (itemId) => items.find((item) => String(item.id) === String(itemId)) || null;
  const previewFrame = findItem(selectedItems[CUSTOMIZATION_CATEGORY.FRAME]);
  const previewBanner = findItem(selectedItems[CUSTOMIZATION_CATEGORY.PROFILE_BANNER]);
  const previewEmblem = findItem(selectedItems[CUSTOMIZATION_CATEGORY.EMBLEM]);
  const previewChatTheme = findItem(selectedItems[CUSTOMIZATION_CATEGORY.CHAT_THEME]);
  const hasAnyChanges = Object.keys(selectedItems).some((key) => selectedItems[key] !== appliedItems[key]);

  const handleApply = async () => {
    if (!hasAnyChanges || saving || !selectedHouse) return;
    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      for (const category of Object.values(CUSTOMIZATION_CATEGORY)) {
        const categoryEntries = inventory.filter((entry) => (
          entry.quantity > 0 && crewCategory(entry.item?.category) === category
        ));
        const desiredId = selectedItems[category];
        const currentApplied = categoryEntries.filter((entry) => entry.isApplied === true);
        for (const entry of currentApplied) {
          if (String(entry.item?.id) !== String(desiredId)) {
            await updateInventoryItemApplication(entry.id, { houseId: selectedHouse.id, action: 'UNAPPLY' });
          }
        }
        const desired = categoryEntries.find((entry) => String(entry.item?.id) === String(desiredId));
        if (desired && !desired.isApplied) {
          await updateInventoryItemApplication(desired.id, { houseId: selectedHouse.id, action: 'APPLY' });
        }
      }
      await loadInventory();
      if (mountedRef.current) setSuccessMessage('선택한 꾸미기 아이템을 적용했습니다.');
    } catch (requestError) {
      if (mountedRef.current) setError(requestError.message || '꾸미기 아이템을 적용하지 못했습니다.');
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  return (
    <main className="my-customization-page">
      <div className="my-customization-container">
        <header className="my-customization-header">
          <div><h1>내 꾸미기</h1><p>선택한 House에서 보유한 아이템을 적용합니다.</p></div>
          <div className="my-customization-house-control">
            <label htmlFor="my-customization-house">House</label>
            <select id="my-customization-house" value={selectedHouseId} onChange={(event) => setSelectedHouseId(event.target.value)}>
              {houses.map((house) => <option key={house.id} value={house.id}>{house.name}</option>)}
            </select>
          </div>
        </header>

        {error && <div className="house-alert error" role="alert">{error}</div>}
        {successMessage && <div className="house-alert success" role="status">{successMessage}</div>}

        <nav className="my-customization-main-tabs" aria-label="꾸미기 종류">
          <button type="button" className={activeSection === 'PROFILE' ? 'my-customization-main-tab is-active' : 'my-customization-main-tab'} onClick={() => setActiveSection('PROFILE')}>프로필</button>
          <button type="button" className={activeSection === 'CHAT' ? 'my-customization-main-tab is-active' : 'my-customization-main-tab'} onClick={() => setActiveSection('CHAT')}>채팅방</button>
        </nav>

        {activeSection === 'PROFILE' && (
          <nav className="my-customization-profile-tabs" aria-label="프로필 꾸미기 카테고리">
            {[CUSTOMIZATION_CATEGORY.FRAME, CUSTOMIZATION_CATEGORY.PROFILE_BANNER, CUSTOMIZATION_CATEGORY.EMBLEM].map((category) => (
              <button key={category} type="button" className={activeProfileCategory === category ? 'my-customization-profile-tab is-active' : 'my-customization-profile-tab'} onClick={() => setActiveProfileCategory(category)}>
                {category === CUSTOMIZATION_CATEGORY.FRAME ? '테두리' : category === CUSTOMIZATION_CATEGORY.PROFILE_BANNER ? '프로필 배너' : '휘장'}
              </button>
            ))}
          </nav>
        )}

        <div className="my-customization-content">
          <section className="my-customization-preview-column">
            <h2 className="my-customization-section-title">{activeSection === 'PROFILE' ? '프로필 미리보기' : '채팅방 미리보기'}</h2>
            {activeSection === 'PROFILE' ? (
              <div className="custom-profile-preview">
                {previewBanner && <ShopItemImage item={previewBanner} className="custom-profile-banner" alt="" />}
                <div className="custom-profile-overlay">
                  <div className="custom-profile-avatar-slot"><div className="custom-profile-avatar-stage"><div className="custom-profile-avatar"><Avatar user={user} size="lg" /></div>{previewFrame && <ShopItemImage item={previewFrame} className="custom-profile-frame" alt="" />}</div></div>
                  <div className="custom-profile-info"><strong className="custom-profile-nickname">{user.nickname || user.name || 'GAME HOUSE USER'}</strong><span className="custom-profile-subtext">{user.riotId || user.gameName || 'GAME HOUSE PLAYER'}</span></div>
                  <div className="custom-profile-emblem-slot"><div className="custom-profile-emblem">{previewEmblem ? <ShopItemImage item={previewEmblem} alt={previewEmblem.name} /> : <span>휘장 없음</span>}</div></div>
                </div>
              </div>
            ) : <div className="my-customization-chat-preview">{previewChatTheme ? <ShopItemImage item={previewChatTheme} className="my-customization-chat-theme-image" alt={`${previewChatTheme.name} 채팅 테마`} /> : <div className="my-customization-chat-empty">적용할 채팅 테마를 선택해주세요.</div>}</div>}
          </section>

          <section className="my-customization-inventory-column">
            <div className="my-customization-inventory-header">
              <div><h2>보유 아이템</h2><p>{visibleItems.length}개</p></div>
              {selectedItems[activeCategory] && (
                <button type="button" className="ui-btn-secondary ui-btn-sm" disabled={saving} onClick={() => setSelectedItems((current) => ({ ...current, [activeCategory]: null }))}>
                  적용 해제
                </button>
              )}
            </div>
            {loading && <div className="ui-empty"><p>Inventory를 불러오는 중…</p></div>}
            {!loading && visibleItems.length === 0 && <div className="ui-empty"><p>이 House에 보유한 아이템이 없습니다.</p></div>}
            {!loading && visibleItems.length > 0 && <div className="my-customization-item-grid">{visibleItems.map((item) => {
              const applied = appliedItems[activeCategory] === item.id;
              const selected = selectedItemId === item.id;
              return <button key={item.id} type="button" className={['my-customization-item-card', selected ? 'is-selected' : '', applied ? 'is-applied' : ''].filter(Boolean).join(' ')} onClick={() => setSelectedItems((current) => ({ ...current, [activeCategory]: item.id }))}>
                <span className="my-customization-item-name">{item.name}</span>
                <div className={`my-customization-item-image ${activeCategory.toLowerCase()}`}><ShopItemImage item={item} alt={item.name} />{applied && <span className="my-customization-applied-badge">적용 중</span>}</div>
              </button>;
            })}</div>}
          </section>
        </div>
      </div>

      <div className="my-customization-action-bar"><div className="my-customization-action-inner">
        <button type="button" className="ui-btn-secondary my-customization-cancel-button" disabled={!hasAnyChanges || saving} onClick={() => setSelectedItems({ ...appliedItems })}>취소</button>
        <button type="button" className="ui-btn-primary my-customization-apply-button" disabled={!hasAnyChanges || saving} onClick={handleApply}>{saving ? '적용 중…' : '선택 항목 적용'}</button>
        <p className="my-customization-action-help">ⓘ 적용 결과는 선택한 House의 서버 Inventory에 반영됩니다.</p>
      </div></div>
    </main>
  );
}

export default function MyCustomizationPage() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: '', houses: [] });
  const useMock = import.meta.env.VITE_USE_CUSTOMIZATION_MOCK === 'true';

  useEffect(() => {
    let alive = true;
    if (useMock || !user) return () => { alive = false; };
    listMyHouses().then((houses) => {
      if (alive) setState({ loading: false, error: '', houses });
    }).catch((requestError) => {
      if (alive) setState({ loading: false, error: requestError.message || 'House 정보를 불러오지 못했습니다.', houses: [] });
    });
    return () => { alive = false; };
  }, [user, useMock]);

  if (useMock || (!state.loading && !state.error && state.houses.length === 0)) return <LegacyMyCustomizationPage />;
  if (state.loading) return <main className="my-customization-page"><div className="my-customization-container"><div className="ui-empty"><p>House 정보를 불러오는 중…</p></div></div></main>;
  if (state.error) return <main className="my-customization-page"><div className="my-customization-container"><div className="house-alert error" role="alert">{state.error}</div><button type="button" className="ui-btn-secondary" onClick={() => window.location.reload()}>다시 시도</button></div></main>;
  return <CrewMyCustomizationPage user={user} houses={state.houses} />;
}
