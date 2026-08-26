import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HouseCoinWallet from '../components/HouseCoinWallet';
import {
  CUSTOMIZATION_CATEGORY,
  CUSTOMIZATION_CATEGORY_LABEL,
  customizationItems,
} from '../mocks/customizationItems';
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

  const [activeCategory, setActiveCategory] = useState(
    CUSTOMIZATION_CATEGORY.FRAME,
  );

  const [selectedItemId, setSelectedItemId] = useState(null);

  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  const visibleItems = useMemo(
    () =>
      customizationItems.filter(
        (item) => item.category === activeCategory,
      ),
    [activeCategory],
  );

  const selectedItem = useMemo(
    () =>
      customizationItems.find(
        (item) => item.id === selectedItemId,
      ) ?? null,
    [selectedItemId],
  );

  const selectCategory = (category) => {
    setActiveCategory(category);
    setSelectedItemId(null);
    setIsPreviewExpanded(false);
  };

  const selectItem = (itemId) => {
    setSelectedItemId(itemId);
    setIsPreviewExpanded(false);
  };

  const selectedCategoryClass = selectedItem
    ? selectedItem.category.toLowerCase()
    : '';

  const isChatThemeSelected =
    selectedItem?.category === CUSTOMIZATION_CATEGORY.CHAT_THEME;

  return (
    <main className="customization-shop-page">
      <div className="customization-shop-container">
        {/* Header */}
        <header className="customization-shop-header">
          <div>
            <span className="customization-shop-eyebrow">
              GAME HOUSE CUSTOMIZATION
            </span>

            <h1>꾸미기 상점</h1>

            <p>
              House 활동으로 획득한 HC를 사용해 프로필과 채팅 공간을
              꾸밀 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            className="ui-btn-secondary"
            onClick={() => navigate('/mypage')}
          >
            마이페이지
          </button>
        </header>

        {/* HC */}
        <HouseCoinWallet user={user} />

        {/* Category */}
        <section
          className="customization-category-tabs"
          aria-label="꾸미기 상점 카테고리"
        >
          {CATEGORY_ORDER.map((category) => (
            <button
              key={category}
              type="button"
              className={
                activeCategory === category
                  ? 'customization-category-tab is-active'
                  : 'customization-category-tab'
              }
              onClick={() => selectCategory(category)}
            >
              {CUSTOMIZATION_CATEGORY_LABEL[category]}
            </button>
          ))}
        </section>

        <div className="customization-shop-content">
          {/* Item List */}
          <section className="customization-shop-list">
            <div className="customization-shop-section-head">
              <div>
                <h2>
                  {CUSTOMIZATION_CATEGORY_LABEL[activeCategory]}
                </h2>

                <p>총 {visibleItems.length}개의 아이템</p>
              </div>
            </div>

            <div className="customization-item-grid">
              {visibleItems.map((item) => {
                const selected = selectedItemId === item.id;
                const itemCategoryClass = item.category.toLowerCase();

                return (
                  <article
                    key={item.id}
                    className={
                      selected
                        ? 'customization-item-card is-selected'
                        : 'customization-item-card'
                    }
                  >
                    <button
                      type="button"
                      className="customization-item-select"
                      onClick={() => selectItem(item.id)}
                      aria-pressed={selected}
                    >
                      <div
                        className={`customization-item-image ${itemCategoryClass}`}
                      >
                        <img
                          src={item.asset}
                          alt={item.name}
                          loading="lazy"
                        />
                      </div>

                      <strong>{item.name}</strong>
                    </button>

                    <div className="customization-item-footer">
                      <span className="customization-item-status">
                        가격 정책 준비 중
                      </span>

                      <button
                        type="button"
                        className="ui-btn-primary ui-btn-sm"
                        disabled
                        title="구매 기능은 후속 단계에서 구현됩니다."
                      >
                        구매
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Preview */}
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
                  onClick={() => setIsPreviewExpanded(true)}
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
                    src={selectedItem.asset}
                    alt={`${selectedItem.name} 미리보기`}
                  />
                </div>

                <div className="customization-preview-info">
                  <span>
                    {CUSTOMIZATION_CATEGORY_LABEL[selectedItem.category]}
                  </span>

                  <strong>{selectedItem.name}</strong>

                  {isChatThemeSelected ? (
                    <p>
                      채팅방 테마 전체 화면을 미리 확인할 수 있습니다.
                    </p>
                  ) : (
                    <p>
                      실제 구매 및 장착 기능은 다음 구현 단계에서
                      연결됩니다.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="customization-preview-empty">
                <strong>아이템을 선택해보세요.</strong>

                <p>선택한 아이템을 크게 미리볼 수 있습니다.</p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Chat Theme Full Preview */}
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
              <img
                src={selectedItem.asset}
                alt={`${selectedItem.name} 전체 화면 미리보기`}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}