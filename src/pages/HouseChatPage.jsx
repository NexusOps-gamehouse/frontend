import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  createPortal,
} from 'react-dom';

import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  getHouse,
  getHouseDisplayRank,
  listHouseMessages,
  sendHouseMessage,
  subscribeHouseMessages,
} from '../api/houses';

import {
  getCustomizationState,
  subscribeCustomization,
} from '../api/customization';

import {
  useAuth,
} from '../context/AuthContext';

import Avatar from '../components/Avatar';

import {
  chatUserId,
  ThemedChatAvatar,
} from '../components/ThemedChatPanel';

import {
  CUSTOMIZATION_CATEGORY,
  customizationItems,
} from '../mocks/customizationItems';

import {
  getChatThemeKey,
} from '../mocks/customizationChatAvatars';

import newMemberFrame
  from '../assets/customization/rank-frames/new-member.png';

import memberFrame
  from '../assets/customization/rank-frames/member.png';

import viceMasterFrame
  from '../assets/customization/rank-frames/vice-master.png';

import masterFrame
  from '../assets/customization/rank-frames/master.png';

import './HouseChatPage.css';
import './ChatThemeFinal.css';

/* =========================================================
   House Role
========================================================= */

const MEMBER_ROLES = [
  'OWNER',
  'MANAGER',
  'MEMBER',
];

const ROLE_LABEL = {
  OWNER: '방장',
  MANAGER: '부방장',
  MEMBER: '일반 멤버',
  NEW_MEMBER: '신규 회원',
};

/* =========================================================
   Rank Frame Assets
========================================================= */

const HOUSE_RANK_FRAME = {
  NEW_MEMBER: newMemberFrame,
  MEMBER: memberFrame,
  MANAGER: viceMasterFrame,
  OWNER: masterFrame,
};

/* =========================================================
   Rank Frame Geometry
========================================================= */

/*
 * v3 PNG 512x512의 실제 내부 원을 기준으로 계산.
 *
 * avatarSize:
 *   실제 프로필 이미지 원 크기
 *
 * frameSize:
 *   그 프로필 이미지가 프레임 내부 원에 맞도록
 *   PNG 전체를 표시할 크기
 *
 * frameOffsetY:
 *   PNG 캔버스 중앙과 실제 내부 원 중앙이
 *   일치하지 않기 때문에 필요한 위치 보정.
 *
 * 프로필 이미지는 움직이지 않는다.
 * 프레임만 프로필 이미지에 맞춰 움직인다.
 */

const HOUSE_RANK_LAYOUT = {
  NEW_MEMBER: {
    normal: {
      avatarSize: 28,
      frameSize: 59,
      frameOffsetX: 0,
      frameOffsetY: 0,
    },

    large: {
      avatarSize: 40,
      frameSize: 84,
      frameOffsetX: 0,
      frameOffsetY: 0,
    },
  },

  MEMBER: {
    normal: {
      avatarSize: 28,
      frameSize: 52,
      frameOffsetX: 0,
      frameOffsetY: 1,
    },

    large: {
      avatarSize: 40,
      frameSize: 75,
      frameOffsetX: 0,
      frameOffsetY: 1,
    },
  },

  MANAGER: {
    normal: {
      avatarSize: 28,
      frameSize: 58,
      frameOffsetX: 0,
      frameOffsetY: -1,
    },

    large: {
      avatarSize: 40,
      frameSize: 83,
      frameOffsetX: 0,
      frameOffsetY: -2,
    },
  },

  OWNER: {
    normal: {
      avatarSize: 28,
      frameSize: 62,
      frameOffsetX: 0,
      frameOffsetY: -5,
    },

    large: {
      avatarSize: 40,
      frameSize: 88,
      frameOffsetX: 0,
      frameOffsetY: -7,
    },
  },
};

const getHouseRankFrame = (
  role,
) =>
  HOUSE_RANK_FRAME[
    role
  ] ??
  memberFrame;

const getHouseRankLayout = (
  role,
  large,
) => {
  const config =
    HOUSE_RANK_LAYOUT[
      role
    ] ??
    HOUSE_RANK_LAYOUT.MEMBER;

  return large
    ? config.large
    : config.normal;
};

/* =========================================================
   Development Preview
========================================================= */

const PREVIEW_HOUSE = {
  id: 'preview',

  name:
    'GAME HOUSE 계급 테두리 미리보기',

  myStatus:
    'OWNER',

  members: [
    {
      id: 'preview-new-member',
      nickname: '신입멤버',
      role: 'MEMBER',
      rank: 'NEW_MEMBER',
    },

    {
      id: 'preview-member',
      nickname: '일반멤버',
      role: 'MEMBER',
    },

    {
      id: 'preview-manager',
      nickname: '부방장',
      role: 'MANAGER',
    },

    {
      id: 'preview-owner',
      nickname: '방장',
      role: 'OWNER',
    },
  ],
};

const PREVIEW_MESSAGES = [
  {
    id:
      'preview-message-new-member',

    author: {
      id: 'preview-new-member',
      nickname: '신입멤버',
      role: 'MEMBER',
      rank: 'NEW_MEMBER',
    },

    content:
      '신입 멤버 계급 테두리입니다.',

    createdAt:
      new Date().toISOString(),
  },

  {
    id:
      'preview-message-member',

    author: {
      id: 'preview-member',
      nickname: '일반멤버',
      role: 'MEMBER',
    },

    content:
      '일반 멤버 계급 테두리입니다.',

    createdAt:
      new Date().toISOString(),
  },

  {
    id:
      'preview-message-manager',

    author: {
      id: 'preview-manager',
      nickname: '부방장',
      role: 'MANAGER',
    },

    content:
      '부방장 계급 테두리입니다.',

    createdAt:
      new Date().toISOString(),
  },

  {
    id:
      'preview-message-owner',

    author: {
      id: 'preview-owner',
      nickname: '방장',
      role: 'OWNER',
    },

    content:
      '방장 계급 테두리입니다.',

    createdAt:
      new Date().toISOString(),
  },
];

/* =========================================================
   Time
========================================================= */

const TIME_FORMAT =
  new Intl.DateTimeFormat(
    'ko-KR',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  );

const userKey = (
  user,
) =>
  String(
    user?.id ??
      user?.userId ??
      user?.email ??
      user?.nickname ??
      '',
  );

const formatTime = (
  value,
) => {
  const date =
    new Date(
      value,
    );

  return Number.isNaN(
    date.getTime(),
  )
    ? '시간 정보 없음'
    : TIME_FORMAT.format(
        date,
      );
};

/* =========================================================
   Access
========================================================= */

const isAccessError = (
  error,
) =>
  (
    error?.code ===
      'PRIVATE_HOUSE' ||
    /House 멤버/.test(
      error?.message ||
        '',
    )
  );

/* =========================================================
   House Rank Avatar
========================================================= */

function HouseRankAvatar({
  person,
  displayRank,
  large = false,
  chatAvatar = null,
}) {
  const frame =
    getHouseRankFrame(
      displayRank,
    );

  const layout =
    getHouseRankLayout(
      displayRank,
      large,
    );

  const label =
    ROLE_LABEL[
      displayRank
    ] ??
    '일반 멤버';

  return (
    <div
      className={
        large
          ? 'house-rank-avatar is-large'
          : 'house-rank-avatar'
      }
      style={{
        '--rank-avatar-size':
          `${layout.avatarSize}px`,

        '--rank-frame-size':
          `${layout.frameSize}px`,

        '--rank-frame-offset-x':
          `${layout.frameOffsetX}px`,

        '--rank-frame-offset-y':
          `${layout.frameOffsetY}px`,
      }}
      title={
        `${person?.nickname ?? 'House 멤버'} · ${label}`
      }
    >
      <div className="house-rank-avatar-photo">
        {chatAvatar ?? (
          <Avatar
            user={
              person
            }
            size={
              large
                ? ''
                : 'sm'
            }
          />
        )}
      </div>

      <img
        className="house-rank-avatar-frame"
        src={
          frame
        }
        alt=""
        aria-hidden="true"
      />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="19" cy="12" r="1.7" />
    </svg>
  );
}

function ClipIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
    >
      <path d="m8.5 12.5 6.1-6.1a3.2 3.2 0 0 1 4.5 4.5l-8.3 8.3a5 5 0 0 1-7.1-7.1l8-8" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
    >
      <path d="m4 5 16 7-16 7 3-7-3-7Z" />
      <path d="M7 12h13" />
    </svg>
  );
}

/* =========================================================
   Page
========================================================= */

export default function HouseChatPage() {
  const {
    houseId,
  } = useParams();

  const {
    user,
  } = useAuth();

  const previewMode =
    import.meta.env.DEV &&
    houseId ===
      'preview';

  const [
    house,
    setHouse,
  ] = useState(
    previewMode
      ? PREVIEW_HOUSE
      : null,
  );

  const [
    messages,
    setMessages,
  ] = useState(
    previewMode
      ? PREVIEW_MESSAGES
      : [],
  );

  const [
    input,
    setInput,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(
    !previewMode,
  );

  const [
    error,
    setError,
  ] = useState('');

  const [
    accessDenied,
    setAccessDenied,
  ] = useState(false);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    connected,
    setConnected,
  ] = useState(previewMode);

  const [
    sendError,
    setSendError,
  ] = useState('');

  const [
    customization,
    setCustomization,
  ] = useState(null);

  const [
    customizationsByUserId,
    setCustomizationsByUserId,
  ] = useState({});

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const [
    participantsOpen,
    setParticipantsOpen,
  ] = useState(false);

  const [
    focusedMessageId,
    setFocusedMessageId,
  ] = useState(null);

  const [
    participantsPopoverPosition,
    setParticipantsPopoverPosition,
  ] = useState(null);

  const chatThemeKey = (() => {
    const itemId = customization?.equippedChatThemeId;
    const item = customizationItems.find((candidate) => (
      candidate.id === itemId
      && candidate.category === CUSTOMIZATION_CATEGORY.CHAT_THEME
    ));
    return getChatThemeKey(item?.id) ?? 'default';
  })();

  const chatThemeClass = `chat-theme-${chatThemeKey}`;

  const currentUserId = userKey(user);

  const houseMemberIds = [
    currentUserId,
    ...(house?.members ?? []).map(
      (member) =>
        member.userId ??
        member.id,
    ),
  ]
    .filter(Boolean)
    .map(String)
    .filter((id, index, ids) =>
      ids.indexOf(id) === index,
    )
    .join('|');

  const houseMembersByUserId =
    useMemo(
      () => new Map(
        (house?.members ?? []).map(
          (member) => [
            String(
              member.userId ??
              member.id,
            ),
            member,
          ],
        ),
      ),
      [
        house?.members,
      ],
    );

  const bottomRef =
    useRef(null);

  const headerRef =
    useRef(null);

  const searchInputRef =
    useRef(null);

  const searchButtonRef =
    useRef(null);

  const searchPopoverRef =
    useRef(null);

  const moreButtonRef =
    useRef(null);

  const participantPopoverRef =
    useRef(null);

  const messageRefs =
    useRef(new Map());

  const customizationReadInFlightRef =
    useRef(0);

  const participantCustomizationReadInFlightRef =
    useRef(0);

  const updateParticipantsPopoverPosition =
    useCallback(
      () => {
        const anchor =
          moreButtonRef.current;

        if (!anchor) {
          return;
        }

        const anchorRect =
          anchor.getBoundingClientRect();

        const popover =
          participantPopoverRef.current;

        const popoverWidth =
          popover?.offsetWidth || 330;

        const popoverHeight =
          popover?.offsetHeight || 360;

        const gap = 10;
        const viewportPadding = 12;

        let left =
          anchorRect.right + gap;

        if (
          left + popoverWidth >
          window.innerWidth - viewportPadding
        ) {
          const leftFallback =
            anchorRect.left - popoverWidth - gap;

          left =
            leftFallback >= viewportPadding
              ? leftFallback
              : Math.max(
                  viewportPadding,
                  window.innerWidth -
                    popoverWidth -
                    viewportPadding,
                );
        }

        const top =
          Math.min(
            Math.max(
              viewportPadding,
              anchorRect.top,
            ),
            Math.max(
              viewportPadding,
              window.innerHeight -
                popoverHeight -
                viewportPadding,
            ),
          );

        setParticipantsPopoverPosition({
          top,
          left,
        });
      },
      [],
    );

  const [
    searchPopoverPosition,
    setSearchPopoverPosition,
  ] = useState(null);

  const updateSearchPopoverPosition =
    useCallback(
      () => {
        const anchor =
          searchButtonRef.current;

        if (!anchor) {
          return;
        }

        const anchorRect =
          anchor.getBoundingClientRect();

        const popover =
          searchPopoverRef.current;

        const popoverWidth =
          popover?.offsetWidth || 330;

        const popoverHeight =
          popover?.offsetHeight || 360;

        const gap = 8;
        const viewportPadding = 12;

        let left =
          anchorRect.right - popoverWidth;

        if (
          left < viewportPadding
        ) {
          left = viewportPadding;
        }

        if (
          left + popoverWidth >
          window.innerWidth - viewportPadding
        ) {
          left = Math.max(
            viewportPadding,
            window.innerWidth -
              popoverWidth -
              viewportPadding,
          );
        }

        let top =
          anchorRect.bottom + gap;

        if (
          top + popoverHeight >
          window.innerHeight - viewportPadding
        ) {
          top = Math.max(
            viewportPadding,
            anchorRect.top -
              popoverHeight -
              gap,
          );
        }

        setSearchPopoverPosition({
          top,
          left,
        });
      },
      [],
    );

  const normalizedSearchQuery =
    searchQuery.trim().toLowerCase();

  const messageSearchResults =
    useMemo(
      () => {
        if (!normalizedSearchQuery) {
          return [];
        }

        return messages.filter(
          (message) => [
            message.content,
            message.senderName,
            message.author?.nickname,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearchQuery),
        );
      },
      [
        messages,
        normalizedSearchQuery,
      ],
    );

  useEffect(() => {
    let active = true;

    const loadCustomization = async () => {
      if (previewMode || !user) {
        if (active) setCustomization(null);
        return;
      }

      customizationReadInFlightRef.current += 1;

      try {
        const state = await getCustomizationState(user);
        if (active) setCustomization(state);
      } catch {
        if (active) setCustomization(null);
      } finally {
        customizationReadInFlightRef.current = Math.max(
          0,
          customizationReadInFlightRef.current - 1,
        );
      }
    };

    const handleCustomizationChange = () => {
      if (
        customizationReadInFlightRef.current ||
        participantCustomizationReadInFlightRef.current
      ) {
        return;
      }

      loadCustomization();
    };

    const unsubscribe = subscribeCustomization(
      handleCustomizationChange,
    );
    const handleStorage = (event) => {
      if (
        event.key === 'gamehouse.customization.v2' &&
        !customizationReadInFlightRef.current &&
        !participantCustomizationReadInFlightRef.current
      ) {
        loadCustomization();
      }
    };

    window.addEventListener('storage', handleStorage);
    loadCustomization();

    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, [
    currentUserId,
    previewMode,
  ]);

  useEffect(() => {
    let active = true;

    if (
      previewMode ||
      !houseMemberIds
    ) {
      setCustomizationsByUserId({});
      return () => {
        active = false;
      };
    }

    participantCustomizationReadInFlightRef.current += 1;

    const loadParticipantCustomizations = async () => {
      try {
        const entries = await Promise.all(
          houseMemberIds.split('|').map(
            async (id) => {
              try {
                return [
                  id,
                  await getCustomizationState({ id }),
                ];
              } catch {
                return [id, null];
              }
            },
          ),
        );

        if (active) {
          setCustomizationsByUserId(
            Object.fromEntries(entries),
          );
        }
      } finally {
        participantCustomizationReadInFlightRef.current = Math.max(
          0,
          participantCustomizationReadInFlightRef.current - 1,
        );
      }
    };

    loadParticipantCustomizations();

    return () => {
      active = false;
    };
  }, [
    houseMemberIds,
    previewMode,
  ]);

  useEffect(
    () => {
      if (!searchOpen && !participantsOpen) {
        return undefined;
      }

      const closeOnOutsideClick = (event) => {
        const isInsideHeader =
          headerRef.current?.contains(event.target);

        const isInsideParticipantPopover =
          participantPopoverRef.current?.contains(event.target);

        const isInsideSearchPopover =
          searchPopoverRef.current?.contains(event.target);

        if (
          !isInsideHeader &&
          !isInsideParticipantPopover &&
          !isInsideSearchPopover
        ) {
          setSearchOpen(false);
          setParticipantsOpen(false);
          setSearchQuery('');
          setParticipantsPopoverPosition(null);
          setSearchPopoverPosition(null);
        }
      };

      const closeOnEscape = (event) => {
        if (event.key === 'Escape') {
          setSearchOpen(false);
          setParticipantsOpen(false);
          setSearchQuery('');
          setParticipantsPopoverPosition(null);
          setSearchPopoverPosition(null);
        }
      };

      document.addEventListener('pointerdown', closeOnOutsideClick);
      document.addEventListener('keydown', closeOnEscape);

      return () => {
        document.removeEventListener('pointerdown', closeOnOutsideClick);
        document.removeEventListener('keydown', closeOnEscape);
      };
    },
    [
      participantsOpen,
      searchOpen,
    ],
  );

  useLayoutEffect(
    () => {
      if (!participantsOpen) {
        setParticipantsPopoverPosition(null);
        return undefined;
      }

      const updatePosition = () => {
        updateParticipantsPopoverPosition();
      };

      const frameId =
        window.requestAnimationFrame(
          updatePosition,
        );

      window.addEventListener(
        'resize',
        updatePosition,
      );

      window.addEventListener(
        'scroll',
        updatePosition,
        true,
      );

      return () => {
        window.cancelAnimationFrame(frameId);
        window.removeEventListener(
          'resize',
          updatePosition,
        );
        window.removeEventListener(
          'scroll',
          updatePosition,
          true,
        );
      };
    },
    [
      participantsOpen,
      updateParticipantsPopoverPosition,
    ],
  );

  useLayoutEffect(
    () => {
      if (!searchOpen) {
        setSearchPopoverPosition(null);
        return undefined;
      }

      const updatePosition = () => {
        updateSearchPopoverPosition();
      };

      const frameId =
        window.requestAnimationFrame(
          updatePosition,
        );

      window.addEventListener(
        'resize',
        updatePosition,
      );

      window.addEventListener(
        'scroll',
        updatePosition,
        true,
      );

      return () => {
        window.cancelAnimationFrame(frameId);
        window.removeEventListener(
          'resize',
          updatePosition,
        );
        window.removeEventListener(
          'scroll',
          updatePosition,
          true,
        );
      };
    },
    [
      searchOpen,
      updateSearchPopoverPosition,
    ],
  );

  useEffect(
    () => {
      if (searchOpen) {
        window.setTimeout(
          () => searchInputRef.current?.focus(),
          0,
        );
      }
    },
    [
      searchOpen,
    ],
  );

  /* =========================================================
     Access Denied
  ========================================================= */

  const denyAccess =
    useCallback(
      (
        message,
      ) => {
        setHouse(
          null,
        );

        setMessages(
          [],
        );

        setConnected(
          false,
        );

        setAccessDenied(
          true,
        );

        setError(
          message ||
            'House 멤버만 채팅을 이용할 수 있습니다.',
        );
      },
      [],
    );

  /* =========================================================
     Load
  ========================================================= */

  const load =
    useCallback(
      async () => {
        if (
          previewMode
        ) {
          setHouse(
            PREVIEW_HOUSE,
          );

          setMessages(
            PREVIEW_MESSAGES,
          );

          setLoading(
            false,
          );

          setConnected(
            true,
          );

          setError('');

          setAccessDenied(
            false,
          );

          return;
        }

        setLoading(
          true,
        );

        setConnected(
          false,
        );

        setError('');

        setAccessDenied(
          false,
        );

        try {
          const [
            houseData,
            messageData,
          ] =
            await Promise.all([
              getHouse(
                houseId,
                user,
              ),

              listHouseMessages(
                houseId,
                user,
                true,
              ),
            ]);

          if (
            !MEMBER_ROLES.includes(
              houseData.myRole ?? houseData.myStatus,
            )
          ) {
            denyAccess(
              'House 멤버만 채팅을 이용할 수 있습니다.',
            );

            return;
          }

          setHouse(
            houseData,
          );

          setMessages(
            messageData,
          );
        } catch (
          err
        ) {
          if (
            isAccessError(
              err,
            )
          ) {
            denyAccess(
              err.message,
            );
          } else {
            setError(
              err.message ||
                'House 채팅을 불러오지 못했습니다.',
            );
          }
        } finally {
          setLoading(
            false,
          );
        }
      },
      [
        denyAccess,
        houseId,
        previewMode,
        user,
      ],
    );

  useEffect(
    () => {
      load();
    },
    [
      load,
    ],
  );

  /* =========================================================
     Subscribe
  ========================================================= */

  useEffect(
    () => {
      if (
        previewMode
      ) {
        return undefined;
      }

      // REST history가 먼저 화면에 반영된 뒤 STOMP를 연결해 초기 메시지 유실을 막는다.
      if (
        loading ||
        !house ||
        accessDenied
      ) {
        return undefined;
      }

      let closed =
        false;

      let unsubscribe =
        () => {};

      subscribeHouseMessages(
        houseId,
        user,
        (
          nextMessages,
          subscriptionError,
          metadata,
        ) => {
          if (
            closed
          ) {
            return;
          }

          if (
            subscriptionError
          ) {
            if (
              isAccessError(
                subscriptionError,
              )
            ) {
              denyAccess(
                subscriptionError.message,
              );
            } else {
              setError(
                subscriptionError.message ||
                  '새 메시지를 불러오지 못했습니다.',
              );
            }

            return;
          }

          if (
            typeof metadata?.connected ===
              'boolean'
          ) {
            setConnected(
              metadata.connected,
            );

            if (
              metadata.connected
            ) {
              setError('');
              setSendError('');
            } else if (
              metadata.reconnecting
            ) {
              setSendError(
                'House 채팅 연결이 끊겼습니다. 재연결 중입니다.',
              );
            }
          }

          if (
            metadata?.realtime &&
            nextMessages
          ) {
            setMessages(
              (
                previous,
              ) => {
                const messageIds = new Set(
                  previous.map(
                    (
                      message,
                    ) => message.id,
                  ),
                );

                return messageIds.has(
                  nextMessages.id,
                )
                  ? previous
                  : [
                      ...previous,
                      nextMessages,
                    ].slice(-100);
              },
            );

            return;
          }

          if (
            Array.isArray(
              nextMessages,
            )
          ) {
            if (
              metadata?.history
            ) {
              setMessages(
                (
                  previous,
                ) => {
                  const byId = new Map(
                    previous.map(
                      (
                        message,
                      ) => [
                        message.id,
                        message,
                      ],
                    ),
                  );

                  nextMessages.forEach(
                    (
                      message,
                    ) => byId.set(
                      message.id,
                      message,
                    ),
                  );

                  return Array.from(
                    byId.values(),
                  )
                    .sort(
                      (
                        left,
                        right,
                      ) => new Date(
                        left.createdAt,
                      ).getTime() - new Date(
                        right.createdAt,
                      ).getTime(),
                    )
                    .slice(-100);
                },
              );
            } else {
              setMessages(
                nextMessages,
              );
            }
          }

          if (
            metadata
              ?.houseChanged
          ) {
            getHouse(
              houseId,
              user,
            )
              .then(
                (
                  updatedHouse,
                ) => {
                  if (
                    !closed
                  ) {
                    setHouse(
                      updatedHouse,
                    );
                  }
                },
              )
              .catch(
                (
                  err,
                ) => {
                  if (
                    !closed &&
                    isAccessError(
                      err,
                    )
                  ) {
                    denyAccess(
                      err.message,
                    );
                  }
                },
              );
          }
        },
        true,
      )
        .then(
          (
            cleanup,
          ) => {
            if (
              closed
            ) {
              cleanup();
            } else {
              unsubscribe =
                cleanup;
            }
          },
        )
        .catch(
          (
            err,
          ) => {
            if (
              closed
            ) {
              return;
            }

            if (
              isAccessError(
                err,
              )
            ) {
              denyAccess(
                err.message,
              );
            } else {
              setError(
                err.message ||
                  'House 채팅 연결을 시작하지 못했습니다.',
              );
            }
          },
        );

      return () => {
        closed =
          true;

        unsubscribe();
      };
    },
    [
      accessDenied,
      denyAccess,
      house,
      houseId,
      loading,
      previewMode,
      user,
    ],
  );

  /* =========================================================
     Scroll
  ========================================================= */

  useEffect(
    () => {
      bottomRef.current
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        });
    },
    [
      messages,
    ],
  );

  /* =========================================================
     Send
  ========================================================= */

  const send =
    async (
      event,
    ) => {
      event.preventDefault();

      if (
        sending
      ) {
        return;
      }

      const content =
        input.trim();

      if (
        !content
      ) {
        setSendError(
          '메시지를 입력해주세요.',
        );

        return;
      }

      if (
        content.length >
        500
      ) {
        setSendError(
          '메시지는 500자 이하로 입력해주세요.',
        );

        return;
      }

      if (
        previewMode
      ) {
        setMessages(
          (
            previous,
          ) => [
            ...previous,

            {
              id:
                `preview-${Date.now()}`,

              author: {
                id:
                  'preview-owner',

                nickname:
                  '방장',

                role:
                  'OWNER',
              },

              content,

              createdAt:
                new Date()
                  .toISOString(),
            },
          ],
        );

        setInput('');

        setSendError('');

        return;
      }

      setSending(
        true,
      );

      setSendError('');

      try {
        await sendHouseMessage(
          houseId,
          content,
          user,
          true,
        );

        setInput('');
      } catch (
        err
      ) {
        if (
          isAccessError(
            err,
          )
        ) {
          denyAccess(
            err.message,
          );
        } else {
          setSendError(
            err.message ||
              '메시지를 보내지 못했습니다.',
          );
        }
      } finally {
        setSending(
          false,
        );
      }
    };

  const handleInputKeyDown =
    (
      event,
    ) => {
      if (
        event.key ===
          'Enter' &&
        !event.shiftKey &&
        !event.nativeEvent
          .isComposing
      ) {
        event.preventDefault();

        event.currentTarget
          .form
          ?.requestSubmit();
      }
    };

  /* =========================================================
     Loading
  ========================================================= */

  if (
    loading
  ) {
    return (
      <div className="page house-chat-page">
        <div className="ui-empty">
          <p>
            House 채팅을 불러오는 중…
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     Access Denied
  ========================================================= */

  if (
    accessDenied
  ) {
    return (
      <div className="page house-chat-page">
        <div className="ui-empty house-chat-denied">

          <div aria-hidden="true">
            🔒
          </div>

          <h1>
            House 채팅에 접근할 수 없습니다
          </h1>

          <p>
            {error}
          </p>

          <Link
            className="ui-btn-secondary"
            to={`/houses/${houseId}`}
          >
            House 상세로
          </Link>

        </div>
      </div>
    );
  }

  if (
    !house ||
    error
  ) {
    return (
      <div className="page house-chat-page">
        <div className="ui-empty house-chat-denied">

          <h1>
            House 채팅을 열지 못했습니다
          </h1>

          <p>
            {error ||
              '잠시 후 다시 시도해주세요.'}
          </p>

          <div className="house-chat-error-actions">

            <Link
              className="ui-btn-secondary"
              to={`/houses/${houseId}`}
            >
              House 상세로
            </Link>

            <button
              className="ui-btn-primary"
              type="button"
              onClick={
                load
              }
            >
              다시 시도
            </button>

          </div>

        </div>
      </div>
    );
  }

  const viewerId =
    previewMode
      ? 'preview-owner'
      : userKey(
          user,
        );

  const memberCount =
    house.memberCount ??
    house.members.length;

  const houseAvatarFallback =
    house.name?.trim()?.charAt(0) ||
    '🏠';

  const toggleSearch = () => {
    const next = !searchOpen;
    setSearchOpen(next);
    setParticipantsOpen(false);
    setParticipantsPopoverPosition(null);
    setSearchPopoverPosition(null);

    if (!next) {
      setSearchQuery('');
    }
  };

  const toggleParticipants = () => {
    const next = !participantsOpen;
    setParticipantsOpen(next);
    setSearchOpen(false);
    setParticipantsPopoverPosition(null);
    setSearchPopoverPosition(null);
    setSearchQuery('');
  };

  const focusMessage = (messageId) => {
    const node = messageRefs.current.get(messageId);

    if (node) {
      node.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }

    setFocusedMessageId(messageId);
  };

  const getMemberDisplayName = (member) => {
    const memberUserId = member.userId ?? member.id;

    return member.nickname
      || member.name
      || member.userName
      || (
        String(memberUserId) === viewerId
          ? user?.nickname
          : null
      )
      || `사용자 #${memberUserId}`;
  };

  const getMemberPerson = (member) => ({
    ...member,
    nickname: getMemberDisplayName(member),
  });

  /* =========================================================
     Render
  ========================================================= */

  return (
    <div className={`page house-chat-page ${chatThemeClass}`}>

      <Link
        className="house-back"
        to={
          previewMode
            ? '/houses'
            : `/houses/${houseId}`
        }
      >
        ← House 상세
      </Link>

      <section className="house-chat-panel themed-chat-panel">

        <header
          className="house-chat-header themed-chat-header"
          ref={headerRef}
        >

          <div
            className="themed-chat-brand house-chat-room-avatar"
            aria-label={`${house.name} 대표 이미지`}
            title={`${house.name} 대표 이미지`}
          >
            <span className="house-chat-room-avatar-fallback">
              {houseAvatarFallback}
            </span>
          </div>

          <button
            type="button"
            className="themed-chat-count"
            aria-label={`House 참여 인원 ${memberCount}명`}
            aria-expanded={participantsOpen}
            aria-controls="house-chat-participants"
            onClick={toggleParticipants}
            title="구성원 목록"
          >
            {memberCount}명
          </button>

          <div className="themed-chat-heading">
            <h1
              className="themed-chat-title is-static"
              title={house.name}
            >
              {house.name}
            </h1>
          </div>

          <div className="themed-chat-header-controls">
            <button
              type="button"
              className="themed-chat-icon-button themed-chat-search-button house-chat-header-icon"
              ref={searchButtonRef}
              aria-label="메시지 검색"
              aria-expanded={searchOpen}
              aria-controls="house-chat-message-search"
              onClick={toggleSearch}
              title="메시지 검색"
            >
              <SearchIcon />
            </button>

            <button
              type="button"
              className="themed-chat-icon-button themed-chat-more-button house-chat-header-icon"
              ref={moreButtonRef}
              aria-label="채팅방 참여자"
              aria-expanded={participantsOpen}
              aria-controls="house-chat-participants"
              onClick={toggleParticipants}
              title="채팅방 참여자"
            >
              <MoreIcon />
            </button>
          </div>

          {participantsOpen && (
            createPortal(
              <div
                className={`house-chat-participants-portal-layer ${chatThemeClass}`}
                style={{
                  '--house-participants-top': `${participantsPopoverPosition?.top ?? 0}px`,
                  '--house-participants-left': `${participantsPopoverPosition?.left ?? 0}px`,
                  visibility: participantsPopoverPosition
                    ? 'visible'
                    : 'hidden',
                }}
              >
                <div
                  ref={participantPopoverRef}
                  className="themed-chat-header-popover themed-chat-participants-popover house-chat-participants-portal"
                  id="house-chat-participants"
                  role="dialog"
                  aria-label="House 참여자"
                >
                  <div className="themed-chat-popover-heading">
                    <strong>House 참여자</strong>
                    <span>{memberCount}명</span>
                  </div>

                  <div className="themed-chat-participant-list">
                    {house.members.length === 0 ? (
                      <div className="themed-chat-search-empty">
                        참여자가 없습니다.
                      </div>
                    ) : (
                      house.members.map((member) => {
                        const memberPerson = getMemberPerson(member);

                        return (
                          <div
                            className="themed-chat-participant"
                            key={member.userId ?? member.id}
                          >
                            <div className="themed-chat-participant-profile house-chat-participant-profile">
                              <Avatar
                                user={memberPerson}
                                size="sm"
                              />
                              <span>
                                {getMemberDisplayName(member)}
                              </span>
                            </div>

                          <span className="house-chat-participant-role">
                            {ROLE_LABEL[getHouseDisplayRank(member)] ?? '일반 멤버'}
                          </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>,
              document.body,
            )
          )}

          {searchOpen && (
            createPortal(
              <div
                className={`house-chat-search-portal-layer ${chatThemeClass}`}
                style={{
                  '--house-search-top': `${searchPopoverPosition?.top ?? 0}px`,
                  '--house-search-left': `${searchPopoverPosition?.left ?? 0}px`,
                  visibility: searchPopoverPosition
                    ? 'visible'
                    : 'hidden',
                }}
              >
                <div
                  ref={searchPopoverRef}
                  className="themed-chat-header-popover themed-chat-search-popover house-chat-search-portal"
                  id="house-chat-message-search"
                  role="dialog"
                  aria-label="House 메시지 검색"
                >
                  <div className="themed-chat-popover-heading">
                    <strong>메시지 검색</strong>
                    <span>
                      {normalizedSearchQuery
                        ? `${messageSearchResults.length}건`
                        : `${messages.length}건`}
                    </span>
                  </div>

                  <label className="themed-chat-member-search-field">
                    <SearchIcon />
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={searchQuery}
                      placeholder="메시지 또는 작성자 검색"
                      onChange={(event) => setSearchQuery(event.target.value)}
                      aria-label="메시지 검색어"
                    />
                  </label>

                  <div className="themed-chat-participant-list">
                    {!normalizedSearchQuery ? (
                      <div className="themed-chat-search-empty">
                        메시지 내용 또는 작성자를 입력하세요.
                      </div>
                    ) : messageSearchResults.length === 0 ? (
                      <div className="themed-chat-search-empty">
                        검색 결과가 없습니다.
                      </div>
                    ) : (
                      messageSearchResults.slice(0, 20).map((message) => (
                        <button
                          type="button"
                          className="house-chat-search-result"
                          key={message.id}
                          onClick={() => focusMessage(message.id)}
                        >
                          <strong>
                            {message.author?.nickname
                              || message.senderName
                              || `사용자 #${message.senderId}`}
                          </strong>
                          <span>{message.content}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>,
              document.body,
            )
          )}

        </header>

        <div
          className="house-chat-messages"
          aria-live="polite"
          aria-label="House 채팅 메시지"
        >

          {messages.length ===
          0 ? (
            <div className="ui-empty house-chat-empty">
              <p>
                아직 메시지가 없습니다.
                <br />
                House 멤버에게 첫 메시지를 보내보세요.
              </p>
            </div>
          ) : (
            messages.map(
              (
                message,
              ) => {
                const mine =
                  String(
                    message
                      .author
                      ?.id,
                  ) ===
                  viewerId;

                const senderId = String(
                  message.senderId ??
                    message.author?.id ??
                    '',
                );

                const authorMember =
                  houseMembersByUserId.get(
                    senderId,
                  );

                const authorRole =
                  message
                    .author
                    ?.role ??
                  authorMember?.role ??
                  'MEMBER';

                const senderMember = {
                  ...authorMember,
                  ...message.author,
                  role: authorRole,
                };

                const senderPerson = {
                  ...(authorMember
                    ? getMemberPerson(authorMember)
                    : {}),
                  ...(message.author ?? {}),
                  ...(mine ? user : {}),
                  id:
                    message.senderId ??
                    message.author?.id,
                  nickname:
                    message.author?.nickname ??
                    authorMember?.nickname ??
                    (mine ? user?.nickname : null) ??
                    'House 멤버',
                };

                const senderCustomization =
                  customizationsByUserId[
                    senderId
                  ];

                const senderThemeItem =
                  customizationItems.find(
                    (item) =>
                      item.id ===
                        senderCustomization
                          ?.equippedChatThemeId &&
                      item.category ===
                        CUSTOMIZATION_CATEGORY.CHAT_THEME,
                  );

                const senderThemeKey =
                  getChatThemeKey(
                    senderThemeItem?.id,
                  );

                const chatAvatar =
                  senderThemeKey ? (
                    <ThemedChatAvatar
                      person={
                        senderPerson
                      }
                      themeKey={
                        senderThemeKey
                      }
                      currentUser={
                        user
                      }
                      equippedChatAvatarId={
                        senderCustomization
                          ?.equippedChatAvatarId
                      }
                      useThemeAvatar={
                        true
                      }
                      size="sm"
                    />
                  ) : null;

                const displayRank =
                  getHouseDisplayRank(senderMember);

                const avatar = (
                  <HouseRankAvatar
                    person={
                      senderPerson
                    }
                    displayRank={
                      displayRank
                    }
                    chatAvatar={
                      chatAvatar
                    }
                  />
                );

                return (
                  <article
                    className={
                      `house-chat-message ${
                        mine
                          ? 'mine'
                          : ''
                      } ${
                        messageSearchResults.some(
                          (result) => result.id === message.id,
                        )
                          ? 'is-search-match'
                          : ''
                      } ${
                        focusedMessageId === message.id
                          ? 'is-search-target'
                          : ''
                      }`
                    }
                    ref={(node) => {
                      if (node) {
                        messageRefs.current.set(message.id, node);
                      } else {
                        messageRefs.current.delete(message.id);
                      }
                    }}
                    data-message-id={message.id}
                    key={
                      message.id
                    }
                  >

                    {!mine &&
                      avatar}

                    <div className="house-chat-message-body">

                      <div className="house-chat-message-meta">

                        <strong>
                          {message
                            .author
                            ?.nickname ||
                            'House 멤버'}
                        </strong>

                        <span
                          className={
                            `role-badge ${
                              authorRole
                                .toLowerCase()
                            }`
                          }
                        >
                          {
                            ROLE_LABEL[
                              displayRank
                            ] ??
                            '일반 멤버'
                          }
                        </span>

                        <time
                          dateTime={
                            message.createdAt
                          }
                        >
                          {
                            formatTime(
                              message.createdAt,
                            )
                          }
                        </time>

                      </div>

                      <p>
                        {
                          message.content
                        }
                      </p>

                    </div>

                    {mine &&
                      avatar}

                  </article>
                );
              },
            )
          )}

          <div
            ref={
              bottomRef
            }
          />

        </div>

        {sendError && (
          <div
            className="house-alert error house-chat-send-error"
            role="alert"
          >
            {sendError}
          </div>
        )}

        <form
          className="house-chat-composer themed-chat-form"
          onSubmit={
            send
          }
        >
          {/* 첨부 기능은 아직 없으므로 기존 테마 슬롯만 장식으로 유지한다. */}
          <span
            className="themed-chat-attach house-chat-composer-decoration"
            aria-hidden="true"
          >
            <ClipIcon />
          </span>

          <input
            className="themed-chat-input"
            type="text"
            value={
              input
            }
            maxLength={
              500
            }
            disabled={
              sending ||
              (!previewMode && !connected)
            }
            onChange={(
              event,
            ) => {
              setInput(
                event.target.value,
              );

              if (
                sendError
              ) {
                setSendError('');
              }
            }}
            onKeyDown={
              handleInputKeyDown
            }
            aria-label="House 채팅 메시지"
            placeholder={
              previewMode
                ? '미리보기 메시지를 입력하세요.'
                : '메시지를 입력하세요.'
            }
          />

          <button
            className="themed-chat-send"
            type="submit"
            aria-label="메시지 전송"
            title={
              sending
                ? '전송 중…'
                : connected || previewMode
                  ? '메시지 전송'
                  : 'House 채팅 연결 중…'
            }
            aria-busy={
              sending
            }
            disabled={
              sending ||
              !input.trim() ||
              (!previewMode && !connected)
            }
          >
            <SendIcon />
          </button>
        </form>

      </section>

    </div>
  );
}
