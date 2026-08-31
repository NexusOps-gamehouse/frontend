import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../context/AuthContext';

import HouseCoinWallet
  from '../components/HouseCoinWallet';

import {
  getCustomizationState,
  purchaseCustomizationItem,
} from '../api/customization';
import {
  listMyHouses,
  getHouseCurrency,
} from '../api/houses';
import {
  buyShopItem,
  listShopInventory,
  listShopItems,
} from '../api/shop';

import {
  CUSTOMIZATION_CATEGORY,
  CUSTOMIZATION_CATEGORY_LABEL,
  customizationItems,
} from '../mocks/customizationItems';

import {
  getCustomizationItemPrice,
} from '../mocks/customizationShopCatalog';
import Modal from '../components/Modal';
import ShopItemImage from '../components/ShopItemImage';

import './CustomizationShopPage.css';
import './ChatThemeFinal.css';

/* =========================
   Category
========================= */

const CATEGORY_ORDER = [
  CUSTOMIZATION_CATEGORY.FRAME,
  CUSTOMIZATION_CATEGORY.PROFILE_BANNER,
  CUSTOMIZATION_CATEGORY.EMBLEM,
  CUSTOMIZATION_CATEGORY.CHAT_THEME,
];

/* =========================
   Price Helpers
========================= */

const getPriceLabel = (
  item,
) => {
  const price =
    getCustomizationItemPrice(
      item,
    );

  return price === 0
    ? '무료'
    : `${price} HC`;
};

/* =========================
   Purchase Error Helper
========================= */

const getPurchaseFailureMessage = (
  requestError,
  free,
) => {
  const message =
    String(
      requestError?.message ??
        '',
    ).trim();

  /*
   * Mock / 실제 API에서
   * 잔액 부족 관련 문구가 달라질 수 있으므로
   * 대표적인 표현을 함께 검사한다.
   */
  if (
    !free &&
    /부족|잔액|insufficient|balance/i.test(
      message,
    )
  ) {
    return '코인이 부족합니다.';
  }

  if (message) {
    return message;
  }

  return free
    ? '무료 아이템을 획득하지 못했습니다.'
    : '아이템을 구매하지 못했습니다.';
};

/* =========================
   Modal Style
========================= */

const modalStyle = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    padding: 20,

    background:
      'rgba(15, 23, 42, 0.5)',
  },

  modal: {
    width: '100%',
    maxWidth: 390,

    padding:
      '26px 24px 22px',

    border:
      '1px solid rgba(148, 163, 184, 0.3)',

    borderRadius: 18,

    background:
      '#ffffff',

    boxShadow:
      '0 24px 70px rgba(15, 23, 42, 0.28)',

    textAlign:
      'center',
  },

  icon: {
    display:
      'flex',

    alignItems:
      'center',

    justifyContent:
      'center',

    width: 52,
    height: 52,

    margin:
      '0 auto 14px',

    borderRadius:
      '50%',

    fontSize: 24,
    fontWeight: 900,
  },

  successIcon: {
    background:
      '#ecfdf5',

    color:
      '#059669',
  },

  failureIcon: {
    background:
      '#fef2f2',

    color:
      '#dc2626',
  },

  infoIcon: {
    background:
      '#eff6ff',

    color:
      '#2563eb',
  },

  eyebrow: {
    display:
      'block',

    marginBottom:
      8,

    color:
      '#64748b',

    fontSize:
      11,

    fontWeight:
      800,

    letterSpacing:
      '0.08em',
  },

  title: {
    margin: 0,

    color:
      '#0f172a',

    fontSize:
      20,

    fontWeight:
      800,
  },

  itemName: {
    margin:
      '14px 0 0',

    color:
      '#334155',

    fontSize:
      14,

    fontWeight:
      700,
  },

  description: {
    margin:
      '8px 0 0',

    color:
      '#64748b',

    fontSize:
      13,

    lineHeight:
      1.6,
  },

  actions: {
    display:
      'grid',

    gridTemplateColumns:
      '1fr 1fr',

    gap:
      10,

    marginTop:
      24,
  },

  singleAction: {
    display:
      'grid',

    gridTemplateColumns:
      '1fr',

    marginTop:
      24,
  },

  secondaryButton: {
    minHeight:
      42,

    border:
      '1px solid #cbd5e1',

    borderRadius:
      10,

    background:
      '#ffffff',

    color:
      '#334155',

    fontSize:
      14,

    fontWeight:
      700,

    cursor:
      'pointer',
  },

  primaryButton: {
    minHeight:
      42,

    border:
      0,

    borderRadius:
      10,

    background:
      '#2563eb',

    color:
      '#ffffff',

    fontSize:
      14,

    fontWeight:
      800,

    cursor:
      'pointer',
  },
};

/* =========================
   Page
========================= */

function LegacyCustomizationShopPage() {
  const navigate =
    useNavigate();

  const {
    user,
  } = useAuth();

  /* =========================
     Category / Selection
  ========================= */

  const [
    activeCategory,
    setActiveCategory,
  ] = useState(
    CUSTOMIZATION_CATEGORY.FRAME,
  );

  const [
    selectedItemId,
    setSelectedItemId,
  ] = useState(null);

  const [
    isPreviewExpanded,
    setIsPreviewExpanded,
  ] = useState(false);

  /* =========================
     Ownership
  ========================= */

  const [
    ownedItemIds,
    setOwnedItemIds,
  ] = useState([]);

  const [
    loadingOwnership,
    setLoadingOwnership,
  ] = useState(true);

  /* =========================
     Purchase
  ========================= */

  const [
    purchasingItemId,
    setPurchasingItemId,
  ] = useState(null);

  /*
   * 구매 전 확인 팝업
   */
  const [
    purchaseConfirmItem,
    setPurchaseConfirmItem,
  ] = useState(null);

  /*
   * 구매 / 획득 결과 팝업
   *
   * {
   *   type:
   *     'success'
   *     | 'failure'
   *     | 'info',
   *   title,
   *   message,
   *   itemName
   * }
   */
  const [
    purchaseResult,
    setPurchaseResult,
  ] = useState(null);

  /*
   * HouseCoinWallet
   * 강제 갱신용
   */
  const [
    walletRefreshKey,
    setWalletRefreshKey,
  ] = useState(0);

  /* =========================
     General Error
  ========================= */

  const [
    error,
    setError,
  ] = useState('');

  /* =========================
     Visible Items
  ========================= */

  const visibleItems =
    useMemo(
      () =>
        customizationItems.filter(
          (item) =>
            item.category ===
            activeCategory,
        ),
      [
        activeCategory,
      ],
    );

  /* =========================
     Selected Item
  ========================= */

  const selectedItem =
    useMemo(
      () =>
        customizationItems.find(
          (item) =>
            item.id ===
            selectedItemId,
        ) ?? null,
      [
        selectedItemId,
      ],
    );

  /* =========================
     Load Ownership
  ========================= */

  useEffect(
    () => {
      let alive = true;

      const loadOwnership =
        async () => {
          if (!user) {
            if (alive) {
              setOwnedItemIds(
                [],
              );

              setLoadingOwnership(
                false,
              );
            }

            return;
          }

          setLoadingOwnership(
            true,
          );

          setError('');

          try {
            const state =
              await getCustomizationState(
                user,
              );

            if (!alive) {
              return;
            }

            setOwnedItemIds(
              state.ownedItemIds ??
                [],
            );
          } catch (
            requestError
          ) {
            if (!alive) {
              return;
            }

            setError(
              requestError.message ||
                '보유 아이템 정보를 불러오지 못했습니다.',
            );
          } finally {
            if (alive) {
              setLoadingOwnership(
                false,
              );
            }
          }
        };

      loadOwnership();

      return () => {
        alive = false;
      };
    },
    [
      user,
    ],
  );

  /* =========================
     ESC Modal Close
  ========================= */

  useEffect(
    () => {
      if (
        !purchaseConfirmItem &&
        !purchaseResult
      ) {
        return undefined;
      }

      const handleKeyDown = (
        event,
      ) => {
        if (
          event.key !==
          'Escape'
        ) {
          return;
        }

        /*
         * 실제 구매 처리 중에는
         * 팝업 상태를 임의로 변경하지 않는다.
         */
        if (
          purchasingItemId
        ) {
          return;
        }

        if (
          purchaseResult
        ) {
          setPurchaseResult(
            null,
          );

          return;
        }

        setPurchaseConfirmItem(
          null,
        );
      };

      window.addEventListener(
        'keydown',
        handleKeyDown,
      );

      return () => {
        window.removeEventListener(
          'keydown',
          handleKeyDown,
        );
      };
    },
    [
      purchaseConfirmItem,
      purchaseResult,
      purchasingItemId,
    ],
  );

  /* =========================
     Select Category
  ========================= */

  const selectCategory = (
    category,
  ) => {
    setActiveCategory(
      category,
    );

    setSelectedItemId(
      null,
    );

    setIsPreviewExpanded(
      false,
    );

    setPurchaseConfirmItem(
      null,
    );

    setPurchaseResult(
      null,
    );

    setError('');
  };

  /* =========================
     Select Item
  ========================= */

  const selectItem = (
    itemId,
  ) => {
    setSelectedItemId(
      itemId,
    );

    setIsPreviewExpanded(
      false,
    );

    setError('');
  };

  /* =========================
     Open Purchase Confirm
  ========================= */

  const openPurchaseConfirm = (
    item,
  ) => {
    if (
      !user ||
      purchasingItemId
    ) {
      return;
    }

    setSelectedItemId(
      item.id,
    );

    setError('');

    /*
     * 이미 보유 중인 경우
     */
    if (
      ownedItemIds.includes(
        item.id,
      )
    ) {
      setPurchaseResult({
        type:
          'info',

        title:
          '이미 보유 중',

        itemName:
          item.name,

        message:
          '이미 보유 중인 아이템입니다. 내 꾸미기에서 장착할 수 있습니다.',
      });

      return;
    }

    setPurchaseConfirmItem(
      item,
    );
  };

  /* =========================
     Cancel Confirm
  ========================= */

  const cancelPurchaseConfirm =
    () => {
      if (
        purchasingItemId
      ) {
        return;
      }

      setPurchaseConfirmItem(
        null,
      );
    };

  /* =========================
     Close Result
  ========================= */

  const closePurchaseResult =
    () => {
      setPurchaseResult(
        null,
      );
    };

  /* =========================
     Actual Purchase
  ========================= */

  const handlePurchase =
    async (item) => {
      if (
        !user ||
        purchasingItemId
      ) {
        return;
      }

      if (
        ownedItemIds.includes(
          item.id,
        )
      ) {
        setPurchaseConfirmItem(
          null,
        );

        setPurchaseResult({
          type:
            'info',

          title:
            '이미 보유 중',

          itemName:
            item.name,

          message:
            '이미 보유 중인 아이템입니다. 내 꾸미기에서 장착할 수 있습니다.',
        });

        return;
      }

      const price =
        getCustomizationItemPrice(
          item,
        );

      const free =
        price === 0;

      /*
       * 확인 팝업 종료 후
       * 실제 처리 시작
       */
      setPurchaseConfirmItem(
        null,
      );

      setPurchaseResult(
        null,
      );

      setSelectedItemId(
        item.id,
      );

      setPurchasingItemId(
        item.id,
      );

      setError('');

      try {
        const result =
          await purchaseCustomizationItem(
            user,
            item.id,
          );

        setOwnedItemIds(
          result.customization
            ?.ownedItemIds ??
            [],
        );

        /*
         * 유료 구매만
         * HC 잔액 변경
         */
        if (
          result.price > 0
        ) {
          setWalletRefreshKey(
            (current) =>
              current + 1,
          );
        }

        /*
         * 처리 도중 이미 보유 상태로
         * 확인된 경우
         */
        if (
          result.alreadyOwned
        ) {
          setPurchaseResult({
            type:
              'info',

            title:
              '이미 보유 중',

            itemName:
              item.name,

            message:
              '이미 보유 중인 아이템입니다. 내 꾸미기에서 장착할 수 있습니다.',
          });

          return;
        }

        /*
         * 무료 획득 성공
         */
        if (
          result.isFree ||
          free
        ) {
          setPurchaseResult({
            type:
              'success',

            title:
              '획득 완료',

            itemName:
              item.name,

            message:
              '무료 아이템을 획득했습니다. 내 꾸미기에서 바로 장착할 수 있습니다.',
          });

          return;
        }

        /*
         * 유료 구매 성공
         */
        setPurchaseResult({
          type:
            'success',

          title:
            '구매 완료',

          itemName:
            item.name,

          message:
            `${price} HC로 구매했습니다. 내 꾸미기에서 바로 장착할 수 있습니다.`,
        });
      } catch (
        requestError
      ) {
        /*
         * 구매 실패도
         * 페이지 상단 에러가 아닌
         * 결과 팝업으로 표시한다.
         */
        setPurchaseResult({
          type:
            'failure',

          title:
            free
              ? '획득 실패'
              : '구매 실패',

          itemName:
            item.name,

          message:
            getPurchaseFailureMessage(
              requestError,
              free,
            ),
        });
      } finally {
        setPurchasingItemId(
          null,
        );
      }
    };

  /* =========================
     Confirm Purchase
  ========================= */

  const confirmPurchase =
    () => {
      if (
        !purchaseConfirmItem
      ) {
        return;
      }

      handlePurchase(
        purchaseConfirmItem,
      );
    };

  /* =========================
     Selected Item Info
  ========================= */

  const selectedCategoryClass =
    selectedItem
      ? selectedItem.category
          .toLowerCase()
      : '';

  const isChatThemeSelected =
    selectedItem?.category ===
    CUSTOMIZATION_CATEGORY.CHAT_THEME;

  const selectedItemPrice =
    selectedItem
      ? getCustomizationItemPrice(
          selectedItem,
        )
      : null;

  const selectedItemFree =
    selectedItemPrice === 0;

  const selectedItemOwned =
    selectedItem
      ? ownedItemIds.includes(
          selectedItem.id,
        )
      : false;

  /* =========================
     Confirm Item Info
  ========================= */

  const confirmItemPrice =
    purchaseConfirmItem
      ? getCustomizationItemPrice(
          purchaseConfirmItem,
        )
      : null;

  const confirmItemFree =
    confirmItemPrice === 0;

  /* =========================
     Result Icon
  ========================= */

  const resultIcon =
    purchaseResult?.type ===
    'success'
      ? '✓'
      : purchaseResult?.type ===
          'failure'
        ? '!'
        : 'i';

  const resultIconStyle =
    purchaseResult?.type ===
    'success'
      ? {
          ...modalStyle.icon,
          ...modalStyle.successIcon,
        }
      : purchaseResult?.type ===
          'failure'
        ? {
            ...modalStyle.icon,
            ...modalStyle.failureIcon,
          }
        : {
            ...modalStyle.icon,
            ...modalStyle.infoIcon,
          };

  /* =========================
     Render
  ========================= */

  return (
    <main className="customization-shop-page">
      <div className="customization-shop-container">

        {/* =========================
            Header
        ========================= */}

        <header className="customization-shop-header">
          <div>
            <span className="customization-shop-eyebrow">
              GAME HOUSE CUSTOMIZATION
            </span>

            <h1>
              꾸미기 상점
            </h1>

            <p>
              House 활동으로 획득한 HC를 사용해
              프로필과 채팅 공간을 꾸밀 수 있습니다.
              무료 아이템은 HC 없이 바로 획득할 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            className="ui-btn-secondary"
            onClick={() =>
              navigate(
                '/customization',
              )
            }
          >
            내 꾸미기
          </button>
        </header>

        {/* =========================
            HC Wallet
        ========================= */}

        <HouseCoinWallet
          user={user}
          refreshKey={
            walletRefreshKey
          }
        />

        {/* =========================
            General Error
        ========================= */}

        {error && (
          <div
            className="house-alert error"
            role="alert"
            style={{
              marginTop: 18,
              marginBottom: 18,
            }}
          >
            {error}
          </div>
        )}

        {/* =========================
            Category Tabs
        ========================= */}

        <section
          className="customization-category-tabs"
          aria-label="꾸미기 상점 카테고리"
        >
          {CATEGORY_ORDER.map(
            (category) => (
              <button
                key={
                  category
                }
                type="button"
                className={
                  activeCategory ===
                  category
                    ? 'customization-category-tab is-active'
                    : 'customization-category-tab'
                }
                onClick={() =>
                  selectCategory(
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
        </section>

        <div className="customization-shop-content">

          {/* =========================
              Item List
          ========================= */}

          <section className="customization-shop-list">
            <div className="customization-shop-section-head">
              <div>
                <h2>
                  {
                    CUSTOMIZATION_CATEGORY_LABEL[
                      activeCategory
                    ]
                  }
                </h2>

                <p>
                  총 {visibleItems.length}개의 아이템
                </p>
              </div>
            </div>

            {loadingOwnership ? (
              <div className="ui-empty">
                <p>
                  상점 정보를 불러오는 중…
                </p>
              </div>
            ) : (
              <div className="customization-item-grid">
                {visibleItems.map(
                  (item) => {
                    const selected =
                      selectedItemId ===
                      item.id;

                    const owned =
                      ownedItemIds.includes(
                        item.id,
                      );

                    const purchasing =
                      purchasingItemId ===
                      item.id;

                    const itemCategoryClass =
                      item.category
                        .toLowerCase();

                    const price =
                      getCustomizationItemPrice(
                        item,
                      );

                    const free =
                      price === 0;

                    const statusLabel =
                      owned
                        ? '보유 중'
                        : free
                          ? '무료'
                          : `${price} HC`;

                    const buttonLabel =
                      owned
                        ? '보유 중'
                        : purchasing
                          ? (
                              free
                                ? '획득 중…'
                                : '구매 중…'
                            )
                          : (
                              free
                                ? '무료 획득'
                                : '구매'
                            );

                    return (
                      <article
                        key={
                          item.id
                        }
                        className={
                          selected
                            ? 'customization-item-card is-selected'
                            : 'customization-item-card'
                        }
                      >
                        {/* Preview Select */}

                        <button
                          type="button"
                          className="customization-item-select"
                          onClick={() =>
                            selectItem(
                              item.id,
                            )
                          }
                          aria-pressed={
                            selected
                          }
                        >
                          <div
                            className={`customization-item-image ${itemCategoryClass}`}
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
                          </div>

                          <strong>
                            {
                              item.name
                            }
                          </strong>
                        </button>

                        {/* Purchase */}

                        <div className="customization-item-footer">
                          <span className="customization-item-status">
                            {
                              statusLabel
                            }
                          </span>

                          <button
                            type="button"
                            className="ui-btn-primary ui-btn-sm"
                            disabled={
                              owned ||
                              purchasing ||
                              Boolean(
                                purchasingItemId,
                              )
                            }
                            onClick={() =>
                              openPurchaseConfirm(
                                item,
                              )
                            }
                          >
                            {
                              buttonLabel
                            }
                          </button>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </section>

          {/* =========================
              Preview
          ========================= */}

          <aside
            className={
              isChatThemeSelected
                ? 'customization-shop-preview is-chat-theme'
                : 'customization-shop-preview'
            }
          >
            <div className="customization-preview-heading">
              <span className="customization-shop-preview-label">
                PREVIEW
              </span>

              {isChatThemeSelected && (
                <button
                  type="button"
                  className="customization-preview-expand-button"
                  onClick={() =>
                    setIsPreviewExpanded(
                      true,
                    )
                  }
                >
                  전체 화면으로 보기
                </button>
              )}
            </div>

            {selectedItem ? (
              <>
                <div
                  className={`customization-preview-image ${selectedCategoryClass}`}
                >
                  <img
                    src={
                      selectedItem.asset
                    }
                    alt={`${selectedItem.name} 미리보기`}
                  />
                </div>

                <div className="customization-preview-info">
                  <span>
                    {
                      CUSTOMIZATION_CATEGORY_LABEL[
                        selectedItem.category
                      ]
                    }
                  </span>

                  <strong>
                    {
                      selectedItem.name
                    }
                  </strong>

                  <p>
                    {selectedItemOwned
                      ? '보유 중인 아이템입니다. 내 꾸미기에서 장착할 수 있습니다.'
                      : selectedItemFree
                        ? '무료 아이템입니다. HC 차감 없이 바로 획득할 수 있습니다.'
                        : `${getPriceLabel(
                            selectedItem,
                          )}로 구매할 수 있습니다.`}
                  </p>

                  {isChatThemeSelected && (
                    <p>
                      전체 화면으로 실제 채팅방 테마를
                      미리 확인할 수 있습니다.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="customization-preview-empty">
                <strong>
                  아이템을 선택해보세요.
                </strong>

                <p>
                  선택한 아이템을 크게 미리볼 수 있습니다.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* =========================
          Purchase Confirm Modal
      ========================= */}

      {purchaseConfirmItem && (
        <div
          style={
            modalStyle.overlay
          }
          role="presentation"
          onClick={
            cancelPurchaseConfirm
          }
        >
          <div
            style={
              modalStyle.modal
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="customization-purchase-confirm-title"
            aria-describedby="customization-purchase-confirm-description"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <span
              style={
                modalStyle.eyebrow
              }
            >
              GAME HOUSE SHOP
            </span>

            <h2
              id="customization-purchase-confirm-title"
              style={
                modalStyle.title
              }
            >
              {confirmItemFree
                ? '무료로 획득하시겠습니까?'
                : '구매하시겠습니까?'}
            </h2>

            <p
              style={
                modalStyle.itemName
              }
            >
              {
                purchaseConfirmItem.name
              }
            </p>

            <p
              id="customization-purchase-confirm-description"
              style={
                modalStyle.description
              }
            >
              {confirmItemFree
                ? 'HC가 차감되지 않습니다.'
                : `${confirmItemPrice} HC가 차감됩니다.`}
            </p>

            <div
              style={
                modalStyle.actions
              }
            >
              <button
                type="button"
                style={
                  modalStyle.secondaryButton
                }
                disabled={
                  Boolean(
                    purchasingItemId,
                  )
                }
                onClick={
                  cancelPurchaseConfirm
                }
              >
                아니오
              </button>

              <button
                type="button"
                style={
                  modalStyle.primaryButton
                }
                disabled={
                  Boolean(
                    purchasingItemId,
                  )
                }
                onClick={
                  confirmPurchase
                }
              >
                예
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          Purchase Result Modal
      ========================= */}

      {purchaseResult && (
        <div
          style={
            modalStyle.overlay
          }
          role="presentation"
          onClick={
            closePurchaseResult
          }
        >
          <div
            style={
              modalStyle.modal
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="customization-purchase-result-title"
            aria-describedby="customization-purchase-result-description"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div
              style={
                resultIconStyle
              }
              aria-hidden="true"
            >
              {
                resultIcon
              }
            </div>

            <span
              style={
                modalStyle.eyebrow
              }
            >
              GAME HOUSE SHOP
            </span>

            <h2
              id="customization-purchase-result-title"
              style={
                modalStyle.title
              }
            >
              {
                purchaseResult.title
              }
            </h2>

            {purchaseResult.itemName && (
              <p
                style={
                  modalStyle.itemName
                }
              >
                {
                  purchaseResult.itemName
                }
              </p>
            )}

            <p
              id="customization-purchase-result-description"
              style={
                modalStyle.description
              }
            >
              {
                purchaseResult.message
              }
            </p>

            <div
              style={
                modalStyle.singleAction
              }
            >
              <button
                type="button"
                style={
                  modalStyle.primaryButton
                }
                onClick={
                  closePurchaseResult
                }
                autoFocus
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          Chat Theme Full Preview
      ========================= */}

      {isPreviewExpanded &&
        isChatThemeSelected &&
        selectedItem && (
          <div
            className="customization-full-preview-overlay"
            role="presentation"
            onClick={() =>
              setIsPreviewExpanded(
                false,
              )
            }
          >
            <div
              className="customization-full-preview"
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedItem.name} 전체 화면 미리보기`}
              onClick={(
                event,
              ) =>
                event.stopPropagation()
              }
            >
              <div className="customization-full-preview-header">
                <div>
                  <span>
                    CHAT THEME PREVIEW
                  </span>

                  <strong>
                    {
                      selectedItem.name
                    }
                  </strong>
                </div>

                <button
                  type="button"
                  className="customization-full-preview-close"
                  onClick={() =>
                    setIsPreviewExpanded(
                      false,
                    )
                  }
                  aria-label="전체 화면 미리보기 닫기"
                >
                  ✕
                </button>
              </div>

              <div className="customization-full-preview-image">
                <img
                  src={
                    selectedItem.asset
                  }
                  alt={`${selectedItem.name} 전체 화면 미리보기`}
                />
              </div>
            </div>
          </div>
        )}
    </main>
  );
}

const SHOP_CATEGORY_ORDER = [
  'BORDER',
  'BANNER',
  'HOUSE_ICON',
  'CHAT_SKIN',
  'OTHER',
];

const SHOP_CATEGORY_LABEL = {
  BORDER: '프로필 테두리',
  BANNER: '프로필 배너',
  HOUSE_ICON: '휘장',
  CHAT_SKIN: '채팅방 테마',
  OTHER: '기타',
};

const toShopCategory = (category) => {
  if (SHOP_CATEGORY_ORDER.includes(category)) return category;
  return 'OTHER';
};

const getSafeShopPrice = (item) => {
  const price = Number(item?.priceHc);
  return Number.isSafeInteger(price) && price >= 0 ? price : 0;
};

function CrewCustomizationShopPage({ user, houses, items }) {
  const [selectedHouseId, setSelectedHouseId] = useState(() => houses[0]?.id ?? '');
  const [activeCategory, setActiveCategory] = useState('BORDER');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [currency, setCurrency] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const [currencyError, setCurrencyError] = useState('');
  const [purchaseItem, setPurchaseItem] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const mountedRef = useRef(false);
  const loadVersionRef = useRef(0);
  const navigate = useNavigate();
  const selectedHouse = houses.find((house) => String(house.id) === String(selectedHouseId));

  const loadHouseData = async () => {
    if (!selectedHouseId) {
      setInventory([]);
      setCurrency(null);
      return;
    }

    const version = loadVersionRef.current + 1;
    loadVersionRef.current = version;
    const isCurrentLoad = () => mountedRef.current && version === loadVersionRef.current;
    setInventoryLoading(true);
    setCurrencyLoading(true);
    setInventoryError('');
    setCurrencyError('');

    const [inventoryResult, currencyResult] = await Promise.allSettled([
      listShopInventory({ houseId: selectedHouseId }),
      getHouseCurrency(selectedHouseId),
    ]);

    if (!isCurrentLoad()) return;
    if (inventoryResult.status === 'fulfilled') {
      setInventory(inventoryResult.value);
    } else {
      setInventory([]);
      setInventoryError(inventoryResult.reason?.message || '보유 아이템을 불러오지 못했습니다.');
    }
    if (currencyResult.status === 'fulfilled') {
      setCurrency(currencyResult.value);
    } else {
      setCurrency(null);
      setCurrencyError(currencyResult.reason?.message || 'House HC를 불러오지 못했습니다.');
    }
    setInventoryLoading(false);
    setCurrencyLoading(false);
  };

  useEffect(() => {
    mountedRef.current = true;
    setSelectedItemId(null);
    setMessage('');
    setError('');
    loadHouseData();
    return () => {
      mountedRef.current = false;
      loadVersionRef.current += 1;
    };
    // selectedHouseId는 실제 선택 변경 시에만 House별 데이터를 다시 조회한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHouseId]);

  useEffect(() => {
    if (!isPreviewExpanded) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsPreviewExpanded(false);
      }
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isPreviewExpanded]);

  const visibleItems = useMemo(() => {
    const filteredItems = items.filter((item) => (
      toShopCategory(item.category) === activeCategory
    ));
    if (activeCategory !== 'BANNER') return filteredItems;

    const bannerOrder = new Map(
      customizationItems
        .filter((item) => item.category === CUSTOMIZATION_CATEGORY.PROFILE_BANNER)
        .map((item, index) => [item.code, index]),
    );
    return filteredItems.sort((left, right) => (
      (bannerOrder.get(left.code) ?? Number.MAX_SAFE_INTEGER)
      - (bannerOrder.get(right.code) ?? Number.MAX_SAFE_INTEGER)
    ));
  }, [activeCategory, items]);

  const selectedItem = items.find((item) => String(item.id) === String(selectedItemId)) ?? null;
  const isChatThemeSelected = toShopCategory(selectedItem?.category) === 'CHAT_SKIN';
  const ownedItemIds = useMemo(() => new Set(
    inventory
      .filter((entry) => entry.quantity > 0)
      .map((entry) => String(entry.itemId)),
  ), [inventory]);
  const selectedOwned = selectedItem ? ownedItemIds.has(String(selectedItem.id)) : false;

  const openPurchase = (item) => {
    setMessage('');
    setError('');
    if (!selectedHouse) {
      setError('구매할 APPROVED House를 선택해주세요.');
      return;
    }
    if (ownedItemIds.has(String(item.id))) {
      setMessage('이미 보유 중인 상품입니다. 내 꾸미기에서 적용할 수 있습니다.');
      return;
    }
    setPurchaseItem(item);
  };

  const confirmPurchase = async () => {
    if (!purchaseItem || !selectedHouse || purchasing) return;
    const price = getSafeShopPrice(purchaseItem);
    if (!currency || currency.hc < price) {
      setError('HC가 부족합니다.');
      return;
    }

    setPurchasing(true);
    setError('');
    setMessage('');
    try {
      const purchaseResult = await buyShopItem({
        houseId: selectedHouse.id,
        itemId: purchaseItem.id,
        quantity: 1,
      });
      await loadHouseData();
      setPurchaseItem(null);
      setMessage(purchaseResult?.message || '상품을 구매했습니다. 최신 보유 상품과 House HC를 불러왔습니다.');
    } catch (requestError) {
      setError(requestError.message || '상품을 구매하지 못했습니다.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <main className="customization-shop-page">
      <div className="customization-shop-container">
        <header className="customization-shop-header">
          <div>
            <span className="customization-shop-eyebrow">GAME HOUSE CUSTOMIZATION</span>
            <h1>꾸미기 상점</h1>
            <p>선택한 House의 HC로 실제 상점 상품을 구매할 수 있습니다.</p>
          </div>
          <button type="button" className="ui-btn-secondary" onClick={() => navigate('/customization')}>
            내 꾸미기
          </button>
        </header>

        <section className="customization-shop-house-controls" aria-label="구매 House 선택">
          <label htmlFor="customization-shop-house">구매할 House</label>
          <select
            id="customization-shop-house"
            value={selectedHouseId}
            onChange={(event) => setSelectedHouseId(event.target.value)}
            disabled={houses.length === 0}
          >
            {houses.length === 0 && <option value="">승인된 House가 없습니다</option>}
            {houses.map((house) => <option key={house.id} value={house.id}>{house.name}</option>)}
          </select>
          <span className="customization-shop-house-currency" aria-live="polite">
            {currencyLoading ? 'HC 불러오는 중…' : currency ? `House HC ${currency.hc}` : 'House HC 확인 필요'}
          </span>
        </section>

        {currencyError && <div className="house-alert error" role="alert">{currencyError}</div>}
        {inventoryError && <div className="house-alert error" role="alert">{inventoryError}</div>}
        {error && <div className="house-alert error" role="alert">{error}</div>}
        {message && <div className="house-alert success" role="status">{message}</div>}

        <section className="customization-category-tabs" aria-label="꾸미기 상점 카테고리">
          {SHOP_CATEGORY_ORDER.map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? 'customization-category-tab is-active' : 'customization-category-tab'}
              onClick={() => {
                setActiveCategory(category);
                setSelectedItemId(null);
                setIsPreviewExpanded(false);
              }}
            >
              {SHOP_CATEGORY_LABEL[category]}
            </button>
          ))}
        </section>

        <div className="customization-shop-content">
          <section className="customization-shop-list">
            <div className="customization-shop-section-head">
              <div><h2>{SHOP_CATEGORY_LABEL[activeCategory]}</h2><p>총 {visibleItems.length}개의 아이템</p></div>
            </div>
            {inventoryLoading && <div className="ui-empty"><p>보유 상태를 불러오는 중…</p></div>}
            {!inventoryLoading && visibleItems.length === 0 && <div className="ui-empty"><p>현재 카테고리에 상품이 없습니다.</p></div>}
            {!inventoryLoading && visibleItems.length > 0 && (
              <div className="customization-item-grid">
                {visibleItems.map((item) => {
                  const owned = ownedItemIds.has(String(item.id));
                  const price = getSafeShopPrice(item);
                  return (
                    <article key={item.id} className={selectedItemId === item.id ? 'customization-item-card is-selected' : 'customization-item-card'}>
                      <button
                        type="button"
                        className="customization-item-select"
                        onClick={() => {
                          setSelectedItemId(item.id);
                          if (toShopCategory(item.category) === 'CHAT_SKIN') {
                            setIsPreviewExpanded(true);
                          }
                        }}
                        aria-pressed={selectedItemId === item.id}
                      >
                        <div className={`customization-item-image ${toShopCategory(item.category).toLowerCase()}`}>
                          <ShopItemImage item={item} alt={item.name} />
                        </div>
                        <strong>{item.name}</strong>
                      </button>
                      <div className="customization-item-footer">
                        <span className="customization-item-status">{owned ? '보유 중' : `HC ${price}`}</span>
                        <button type="button" className="ui-btn-primary ui-btn-sm" disabled={owned || !selectedHouse || !currency || currency.hc < price} onClick={() => openPurchase(item)}>
                          {owned ? '보유 중' : !selectedHouse ? 'House 선택' : !currency ? 'HC 확인 필요' : currency.hc < price ? 'HC 부족' : '구매'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="customization-shop-preview">
            <div className="customization-preview-heading">
              <span className="customization-shop-preview-label">PREVIEW</span>
              {isChatThemeSelected && selectedItem && (
                <button
                  type="button"
                  className="customization-preview-expand-button"
                  onClick={() => setIsPreviewExpanded(true)}
                >
                  전체 화면으로 보기
                </button>
              )}
            </div>
            {selectedItem ? (
              <>
                <div className={`customization-preview-image ${toShopCategory(selectedItem.category).toLowerCase()}`}>
                  <ShopItemImage item={selectedItem} alt={`${selectedItem.name} 미리보기`} />
                </div>
                <div className="customization-preview-info">
                  <span>{SHOP_CATEGORY_LABEL[toShopCategory(selectedItem.category)]}</span>
                  <strong>{selectedItem.name}</strong>
                  <p>{selectedOwned ? '보유 중인 상품입니다. 내 꾸미기에서 적용할 수 있습니다.' : `HC ${getSafeShopPrice(selectedItem)}로 구매할 수 있습니다.`}</p>
                </div>
              </>
            ) : <div className="customization-preview-empty"><strong>상품을 선택해보세요.</strong><p>선택한 상품을 크게 미리볼 수 있습니다.</p></div>}
          </aside>
        </div>
      </div>

      <Modal
        open={Boolean(purchaseItem)}
        title="상품을 구매하시겠습니까?"
        onClose={() => { if (!purchasing) setPurchaseItem(null); }}
        footer={(
          <>
            <button type="button" className="ui-btn-secondary" disabled={purchasing} onClick={() => setPurchaseItem(null)}>취소</button>
            <button type="button" className="ui-btn-primary" disabled={purchasing} onClick={confirmPurchase}>{purchasing ? '구매 중…' : '구매 확인'}</button>
          </>
        )}
      >
        {purchaseItem && (
          <div className="customization-purchase-summary">
            <div className="customization-purchase-image"><ShopItemImage item={purchaseItem} alt="" /></div>
            <strong>{purchaseItem.name}</strong>
            <p>House: {selectedHouse?.name}</p>
            <p>구매 전 HC {currency?.hc ?? 0}</p>
            <p>구매 후 예상 HC {Math.max(0, (currency?.hc ?? 0) - getSafeShopPrice(purchaseItem))}</p>
            <p>가격 HC {getSafeShopPrice(purchaseItem)}</p>
          </div>
        )}
      </Modal>

      {isPreviewExpanded && isChatThemeSelected && selectedItem && (
        <div
          className="customization-full-preview-overlay"
          role="presentation"
          onClick={() => setIsPreviewExpanded(false)}
        >
          <div
            className="customization-full-preview"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedItem.name} 전체 화면 미리보기`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="customization-full-preview-header">
              <div>
                <span>CHAT THEME PREVIEW</span>
                <strong>{selectedItem.name}</strong>
              </div>
              <button
                type="button"
                className="customization-full-preview-close"
                onClick={() => setIsPreviewExpanded(false)}
                aria-label="전체 화면 미리보기 닫기"
              >
                ✕
              </button>
            </div>

            <div className="customization-full-preview-image">
              <ShopItemImage item={selectedItem} alt={`${selectedItem.name} 전체 화면 미리보기`} />
            </div>

            <div className="customization-full-preview-footer">
              <div>
                <strong>{selectedOwned ? '보유 중' : `HC ${getSafeShopPrice(selectedItem)}`}</strong>
                <span>{selectedOwned ? '내 꾸미기에서 적용할 수 있습니다.' : '미리보기는 구매 없이 확인할 수 있습니다.'}</span>
              </div>
              {selectedOwned ? (
                <span className="customization-item-status">보유 중</span>
              ) : (
                <button
                  type="button"
                  className="ui-btn-primary ui-btn-sm"
                  onClick={() => {
                    setIsPreviewExpanded(false);
                    openPurchase(selectedItem);
                  }}
                >
                  구매
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CustomizationShopPage() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: '', houses: [], items: [] });
  const useMock = import.meta.env.VITE_USE_CUSTOMIZATION_MOCK === 'true';

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (useMock) return;
      if (!user) return;
      const [housesResult, itemsResult] = await Promise.allSettled([listMyHouses(), listShopItems()]);
      if (!alive) return;
      const errors = [housesResult, itemsResult]
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason?.message)
        .filter(Boolean);
      setState({
        loading: false,
        error: errors[0] || '',
        houses: housesResult.status === 'fulfilled' ? housesResult.value : [],
        items: itemsResult.status === 'fulfilled' ? itemsResult.value : [],
      });
    };
    load();
    return () => { alive = false; };
  }, [user, useMock]);

  if (useMock) {
    return <LegacyCustomizationShopPage />;
  }

  if (state.loading) {
    return <main className="customization-shop-page"><div className="customization-shop-container"><div className="ui-empty"><p>상점 정보를 불러오는 중…</p></div></div></main>;
  }

  if (state.error) {
    return <main className="customization-shop-page"><div className="customization-shop-container"><div className="house-alert error" role="alert">{state.error}</div><button type="button" className="ui-btn-secondary" onClick={() => window.location.reload()}>다시 시도</button></div></main>;
  }

  return <CrewCustomizationShopPage user={user} houses={state.houses} items={state.items} />;
}
