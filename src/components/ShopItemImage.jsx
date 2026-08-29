import { useEffect, useState } from 'react';

const CATEGORY_LABEL = {
  BORDER: '프로필 테두리',
  BANNER: '프로필 배너',
  HOUSE_ICON: '휘장',
  CHAT_SKIN: '채팅방 테마',
  OTHER: '기타',
};

const getCategoryLabel = (category) => CATEGORY_LABEL[category] || CATEGORY_LABEL.OTHER;

export default function ShopItemImage({ item, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false);
  const source = item?.imageUrl || item?.asset || '';

  useEffect(() => setFailed(false), [source]);

  if (!source || failed) {
    return (
      <span className={`customization-item-image-fallback ${className}`} aria-label={`${item?.name || '상품'} 미리보기 없음`}>
        {getCategoryLabel(item?.category)}
      </span>
    );
  }

  return <img className={className} src={source} alt={alt} onError={() => setFailed(true)} />;
}
