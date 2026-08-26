import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Navigate,
} from 'react-router-dom';

import {
  getCustomizationState,
  subscribeCustomization,
} from '../api/customization';

import {
  useAuth,
} from '../context/AuthContext';

import {
  CUSTOMIZATION_CATEGORY,
  customizationItems,
} from '../mocks/customizationItems';

import {
  getChatThemeKey,
} from '../mocks/customizationChatAvatars';

import ThemedChatPanel, {
  chatUserId,
  ThemedChatAvatar,
} from '../components/ThemedChatPanel';

import './ChatPage.css';
import './ChatThemeFinal.css';
import './ChatPreviewPage.css';

/* =========================================================
   Preview Theme Catalog
========================================================= */

const PREVIEW_THEMES = [
  {
    key: 'moonlight-lounge',
    label: '달빛 라운지',
  },
  {
    key: 'cherry-garden',
    label: '벚꽃 정원',
  },
  {
    key: 'green-forest',
    label: '초록빛 숲',
  },
  {
    key: 'pixel-arcade',
    label: '픽셀 아케이드',
  },
  {
    key: 'magic-library',
    label: '마법 서재',
  },
  {
    key: 'ocean-walk',
    label: '바다 산책',
  },
];

const themeLabel = (
  themeKey,
) =>
  PREVIEW_THEMES.find(
    (theme) =>
      theme.key ===
      themeKey,
  )?.label ??
  '기본 테마';

/* =========================================================
   Preview Users
========================================================= */

const OTHER_USERS = [
  {
    id: 'preview-user-2',
    nickname: '달토끼',
  },
  {
    id: 'preview-user-3',
    nickname: '별빛',
  },
];

/* =========================================================
   Preview Messages
========================================================= */

const createInitialMessages = (
  user,
) => {
  const now =
    Date.now();

  return [
    {
      id: 'preview-1',
      sender:
        OTHER_USERS[0],
      content:
        '안녕하세요! 다들 반가워요.',
      createdAt:
        new Date(
          now -
            4 * 60 * 1000,
        ).toISOString(),
    },
    {
      id: 'preview-2',
      sender:
        user,
      content:
        '오늘 9시에 시작할까요?',
      createdAt:
        new Date(
          now -
            3 * 60 * 1000,
        ).toISOString(),
    },
    {
      id: 'preview-3',
      sender:
        OTHER_USERS[1],
      content:
        '좋아요! 준비 완료했습니다.',
      createdAt:
        new Date(
          now -
            2 * 60 * 1000,
        ).toISOString(),
    },
    {
      id: 'preview-4',
      sender:
        OTHER_USERS[0],
      content:
        '저도 참여할게요.',
      createdAt:
        new Date(
          now -
            1 * 60 * 1000,
        ).toISOString(),
    },
    {
      id: 'preview-5',
      sender:
        user,
      content:
        '그럼 9시에 만나요! 🙂',
      createdAt:
        new Date(
          now,
        ).toISOString(),
    },
  ];
};

/* =========================================================
   Chat Preview
========================================================= */

export default function ChatPreviewPage() {
  const {
    user,
  } = useAuth();

  const [
    customization,
    setCustomization,
  ] = useState(null);

  const [
    messages,
    setMessages,
  ] = useState(
    () =>
      createInitialMessages(
        user,
      ),
  );

  const [
    input,
    setInput,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    previewThemeKey,
    setPreviewThemeKey,
  ] = useState(
    'moonlight-lounge',
  );

  const [
    themeManuallySelected,
    setThemeManuallySelected,
  ] = useState(false);

  const bottomRef =
    useRef(null);

  /* =========================================================
     Customization
  ========================================================= */

  const loadCustomization =
    useCallback(
      async () => {
        if (
          !user
        ) {
          setCustomization(
            null,
          );

          setLoading(
            false,
          );

          return;
        }

        setLoading(
          true,
        );

        setError('');

        try {
          const state =
            await getCustomizationState(
              user,
            );

          setCustomization(
            state,
          );
        } catch (
          requestError
        ) {
          setCustomization(
            null,
          );

          setError(
            requestError
              ?.message ||
              '꾸미기 정보를 불러오지 못했습니다.',
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [
        user,
      ],
    );

  useEffect(
    () => {
      loadCustomization();

      return subscribeCustomization(
        loadCustomization,
      );
    },
    [
      loadCustomization,
    ],
  );

  /* =========================================================
     Equipped Theme
  ========================================================= */

  const equippedChatTheme =
    useMemo(
      () =>
        customizationItems.find(
          (
            item,
          ) =>
            item.id ===
              customization
                ?.equippedChatThemeId &&
            item.category ===
              CUSTOMIZATION_CATEGORY.CHAT_THEME,
        ) ??
        null,
      [
        customization,
      ],
    );

  const equippedThemeKey =
    useMemo(
      () =>
        getChatThemeKey(
          equippedChatTheme
            ?.id,
        ) ??
        'default',
      [
        equippedChatTheme,
      ],
    );

  /*
   * 처음 미리보기를 열었을 때는
   * 실제 장착 테마를 기본 선택한다.
   *
   * 사용자가 미리보기 버튼으로 테마를 고른 뒤에는
   * 실제 장착값이 갱신되어도 미리보기 선택을 덮어쓰지 않는다.
   */
  useEffect(
    () => {
      if (
        themeManuallySelected ||
        equippedThemeKey ===
          'default'
      ) {
        return;
      }

      setPreviewThemeKey(
        equippedThemeKey,
      );
    },
    [
      equippedThemeKey,
      themeManuallySelected,
    ],
  );

  /* =========================================================
     Preview Theme
  ========================================================= */

  const previewTheme =
    useMemo(
      () =>
        customizationItems.find(
          (
            item,
          ) =>
            item.category ===
              CUSTOMIZATION_CATEGORY.CHAT_THEME &&
            getChatThemeKey(
              item.id,
            ) ===
              previewThemeKey,
        ) ??
        null,
      [
        previewThemeKey,
      ],
    );

  const previewThemeName =
    previewTheme?.name ??
    themeLabel(
      previewThemeKey,
    );

  /*
   * 실제 장착 테마를 미리보는 경우에만
   * 사용자가 직접 선택한 equippedChatAvatarId를 사용한다.
   *
   * 다른 테마를 임시 미리보기할 때는
   * 해당 테마의 첫 번째 avatar로 자동 fallback된다.
   */
  const previewAvatarId =
    previewThemeKey ===
      equippedThemeKey
      ? customization
          ?.equippedChatAvatarId ??
        null
      : null;

  /* =========================================================
     Participants
  ========================================================= */

  const participants =
    useMemo(
      () =>
        [
          user,
          ...OTHER_USERS,
        ].filter(
          Boolean,
        ),
      [
        user,
      ],
    );

  /* =========================================================
     Avatar
  ========================================================= */

  const renderAvatar =
    useCallback(
      (
        person,
        size = 'md',
      ) => (
        <ThemedChatAvatar
          person={
            person
          }
          currentUser={
            user
          }
          themeKey={
            previewThemeKey
          }
          equippedChatAvatarId={
            previewAvatarId
          }
          size={
            size
          }
        />
      ),
      [
        previewAvatarId,
        previewThemeKey,
        user,
      ],
    );

  /* =========================================================
     Messages
  ========================================================= */

  const isMessageMine =
    useCallback(
      (
        message,
      ) =>
        Boolean(
          chatUserId(
            message?.sender,
          ) &&
            chatUserId(
              message?.sender,
            ) ===
              chatUserId(
                user,
              ),
        ),
      [
        user,
      ],
    );

  const getMessageSender =
    useCallback(
      (
        message,
      ) =>
        message?.sender ??
        null,
      [],
    );

  /* =========================================================
     Send Preview Message
  ========================================================= */

  const sendPreviewMessage =
    (
      event,
    ) => {
      event.preventDefault();

      const content =
        input.trim();

      if (
        !content ||
        !user
      ) {
        return;
      }

      setMessages(
        (
          current,
        ) => [
          ...current,
          {
            id:
              `preview-local-${Date.now()}`,
            sender:
              user,
            content:
              content.slice(
                0,
                500,
              ),
            createdAt:
              new Date()
                .toISOString(),
          },
        ],
      );

      setInput('');
    };

  /* =========================================================
     Scroll
  ========================================================= */

  useEffect(
    () => {
      bottomRef.current
        ?.scrollIntoView({
          behavior:
            'smooth',
          block:
            'end',
        });
    },
    [
      messages,
    ],
  );

  /* =========================================================
     Production Guard
  ========================================================= */

  if (
    !import.meta.env.DEV
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /* =========================================================
     Render
  ========================================================= */

  return (
    <div
      className={
        `page themed-chat-page chat-theme-${previewThemeKey}`
      }
    >
      <div className="center chat themed-chat-shell chat-preview-shell">

        <section
          className="chat-preview-theme-switcher"
          aria-label="개발용 채팅 테마 전환"
        >
          <div className="chat-preview-theme-switcher-heading">
            <div>
              <strong>
                채팅 테마 빠른 미리보기
              </strong>

              <span>
                실제 장착 상태는 변경되지 않습니다.
              </span>
            </div>

            <div className="chat-preview-theme-current">
              <span>
                현재 미리보기
              </span>

              <strong>
                {previewThemeName}
              </strong>
            </div>
          </div>

          <div
            className="chat-preview-theme-buttons"
            role="radiogroup"
            aria-label="미리볼 채팅 테마"
          >
            {PREVIEW_THEMES.map(
              (
                theme,
              ) => {
                const active =
                  theme.key ===
                  previewThemeKey;

                const equipped =
                  theme.key ===
                  equippedThemeKey;

                return (
                  <button
                    key={
                      theme.key
                    }
                    className={
                      [
                        'chat-preview-theme-button',
                        active
                          ? 'is-active'
                          : '',
                        equipped
                          ? 'is-equipped'
                          : '',
                      ]
                        .filter(
                          Boolean,
                        )
                        .join(
                          ' ',
                        )
                    }
                    type="button"
                    role="radio"
                    aria-checked={
                      active
                    }
                    onClick={() => {
                      setThemeManuallySelected(
                        true,
                      );

                      setPreviewThemeKey(
                        theme.key,
                      );
                    }}
                  >
                    <span>
                      {theme.label}
                    </span>

                    {equipped && (
                      <small>
                        장착 중
                      </small>
                    )}
                  </button>
                );
              },
            )}
          </div>
        </section>

        {loading && (
          <div
            className="house-alert"
            role="status"
          >
            장착한 채팅 테마를 불러오는 중…
          </div>
        )}

        {!loading &&
          error && (
            <div
              className="house-alert error chat-preview-error"
              role="alert"
            >
              <span>
                {error}
              </span>

              <button
                className="ui-btn-secondary ui-btn-sm"
                type="button"
                onClick={
                  loadCustomization
                }
              >
                다시 시도
              </button>
            </div>
          )}

        <ThemedChatPanel
          title="게임 파트너 채팅"

          statusLabel="게임 시작 전 파티 채팅"

          themeName={
            previewThemeName
          }

          connected

          connectionLabel="로컬 모드"

          previewLabel="DEV PREVIEW"

          participants={
            participants
          }

          getParticipantPerson={(
            participant,
          ) =>
            participant
          }

          renderParticipantActions={(
            participant,
          ) => {
            const mine =
              chatUserId(
                participant,
              ) ===
              chatUserId(
                user,
              );

            return (
              <span className="themed-chat-participant-actions">
                <span
                  className={
                    mine
                      ? 'ui-tag is-primary'
                      : 'ui-tag is-online'
                  }
                >
                  {mine
                    ? '나'
                    : '샘플'}
                </span>
              </span>
            );
          }}

          messages={
            messages
          }

          currentUser={
            user
          }

          isMessageMine={
            isMessageMine
          }

          getMessageSender={
            getMessageSender
          }

          renderAvatar={
            renderAvatar
          }

          bottomRef={
            bottomRef
          }

          input={
            input
          }

          onInputChange={(
            event,
          ) =>
            setInput(
              event.target.value,
            )
          }

          onSubmit={
            sendPreviewMessage
          }

          inputPlaceholder="메시지를 입력하세요..."

          inputDisabled={
            !user
          }

          sendDisabled={
            !user ||
            !input.trim()
          }
        />
      </div>
    </div>
  );
}
