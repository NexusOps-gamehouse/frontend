import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import HouseCoinWallet from '../components/HouseCoinWallet';

import {
  getCustomizationState,
  purchaseCustomizationItem,
} from '../api/customization';

import {
  CUSTOMIZATION_CATEGORY,
  CUSTOMIZATION_CATEGORY_LABEL,
  customizationItems,
} from '../mocks/customizationItems';

import {
  getCustomizationItemPrice,
} from '../mocks/customizationShopCatalog';

import './CustomizationShopPage.css';

const CATEGORY_ORDER = [
  CUSTOMIZATION_CATEGORY.FRAME,
  CUSTOMIZATION_CATEGORY.PROFILE_BANNER,
  CUSTOMIZATION_CATEGORY.EMBLEM,
  CUSTOMIZATION_CATEGORY.CHAT_THEME,
];

export default function CustomizationShopPage() {
  const navigate = useNavigate();

  const { user } = useAuth();

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

  /*
   * 구매 / 소유 상태
   */
  const [
    ownedItemIds,
    setOwnedItemIds,
  ] = useState([]);

  const [
    loadingOwnership,
    setLoadingOwnership,
  ] = useState(true);

  const [
    purchasingItemId,
    setPurchasingItemId,
  ] = useState(null);

  /*
   * HouseCoinWallet 강제 갱신용
   */
  const [
    walletRefreshKey,
    setWalletRefreshKey,
  ] = useState(0);

  const [
    error,
    setError,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  /*
   * 현재 카테고리 아이템
   */
  const visibleItems = useMemo(
    () =>
      customizationItems.filter(
        (item) =>
          item.category ===
          activeCategory,
      ),
    [activeCategory],
  );

  /*
   * 현재 선택 아이템
   */
  const selectedItem = useMemo(
    () =>
      customizationItems.find(
        (item) =>
          item.id ===
          selectedItemId,
      ) ?? null,
    [selectedItemId],
  );

  /*
   * 저장된 보유 아이템 불러오기
   */
  useEffect(() => {
    let alive = true;

    const loadOwnership =
      async () => {
        if (!user) {
          return;
        }

        setLoadingOwnership(true);
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
            state.ownedItemIds ?? [],
          );
        } catch (requestError) {
          if (!alive) {
            return;
          }

          setError(
            requestError.message ||
              '보유 아이템 정보를 불러오지 못했습니다.',
          );
        } finally {
          if (alive) {
            setLoadingOwnership(false);
          }
        }
      };

    loadOwnership();

    return () => {
      alive = false;
    };
  }, [user]);

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

    setError('');
    setSuccessMessage('');
  };

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
    setSuccessMessage('');
  };

  /*
   * 실제 구매
   */
  const handlePurchase =
    async (item) => {
      if (
        !user ||
        purchasingItemId
      ) {
        return;
      }

      /*
       * 중복 구매 방지
       */
      if (
        ownedItemIds.includes(
          item.id,
        )
      ) {
        setSelectedItemId(
          item.id,
        );

        setSuccessMessage(
          '이미 보유 중인 아이템입니다.',
        );

        return;
      }

      setSelectedItemId(
        item.id,
      );

      setPurchasingItemId(
        item.id,
      );

      setError('');
      setSuccessMessage('');

      try {
        const result =
          await purchaseCustomizationItem(
            user,
            item.id,
          );

        setOwnedItemIds(
          result.customization
            ?.ownedItemIds ?? [],
        );

        /*
         * HC가 차감됐으므로
         * 상단 지갑 다시 조회
         */
        setWalletRefreshKey(
          (current) =>
            current + 1,
        );

        if (
          result.alreadyOwned
        ) {
          setSuccessMessage(
            `${item.name}은(는) 이미 보유 중입니다.`,
          );

          return;
        }

        setSuccessMessage(
          `${item.name} 구매가 완료되었습니다. 내 꾸미기에서 장착할 수 있습니다.`,
        );
      } catch (requestError) {
        setError(
          requestError.message ||
            '아이템을 구매하지 못했습니다.',
        );
      } finally {
        setPurchasingItemId(
          null,
        );
      }
    };

  const selectedCategoryClass =
    selectedItem
      ? selectedItem.category.toLowerCase()
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

  const selectedItemOwned =
    selectedItem
      ? ownedItemIds.includes(
          selectedItem.id,
        )
      : false;

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
            Feedback
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

        {successMessage && (
          <div
            className="house-alert success"
            role="status"
            style={{
              marginTop: 18,
              marginBottom: 18,
            }}
          >
            {successMessage}
          </div>
        )}

        {/* =========================
            Category
        ========================= */}

        <section
          className="customization-category-tabs"
          aria-label="꾸미기 상점 카테고리"
        >
          {CATEGORY_ORDER.map(
            (category) => (
              <button
                key={category}
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
                      item.category.toLowerCase();

                    const price =
                      getCustomizationItemPrice(
                        item,
                      );

                    return (
                      <article
                        key={item.id}
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
                            {item.name}
                          </strong>
                        </button>

                        {/* Purchase */}
                        <div className="customization-item-footer">
                          <span className="customization-item-status">
                            {owned
                              ? '보유 중'
                              : `${price} HC`}
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
                              handlePurchase(
                                item,
                              )
                            }
                          >
                            {owned
                              ? '보유 중'
                              : purchasing
                                ? '구매 중…'
                                : '구매'}
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
                    {selectedItem.name}
                  </strong>

                  <p>
                    {selectedItemOwned
                      ? '보유 중인 아이템입니다. 내 꾸미기에서 장착할 수 있습니다.'
                      : `${selectedItemPrice} HC로 구매할 수 있습니다.`}
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
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="customization-full-preview-header">
                <div>
                  <span>
                    CHAT THEME PREVIEW
                  </span>

                  <strong>
                    {selectedItem.name}
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