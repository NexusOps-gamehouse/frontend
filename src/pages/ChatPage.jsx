import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  Client,
} from '@stomp/stompjs';

import SockJS
  from 'sockjs-client';

import api, {
  errMsg,
} from '../api/client';

import {
  getCustomizationState,
} from '../api/customization';

import {
  useAuth,
} from '../context/AuthContext';

import ThemedChatPanel, {
  chatUserId,
  ThemedChatAvatar,
} from '../components/ThemedChatPanel';

import {
  CUSTOMIZATION_CATEGORY,
  customizationItems,
} from '../mocks/customizationItems';

import {
  CHAT_THEME_KEYS,
  getChatThemeKey as getCatalogChatThemeKey,
} from '../mocks/customizationChatAvatars';

import {
  WS_URL,
} from '../config';

import './ChatPage.css';
import './ChatThemeFinal.css';

const wsUrl =
  WS_URL;

/* =========================================================
   Chat Theme
========================================================= */

const itemSearchText = (
  item,
) =>
  [
    item?.id,
    item?.name,
    item?.asset,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const getChatThemeKey = (
  item,
) => {
  const catalogKey =
    getCatalogChatThemeKey(
      item?.id,
    );

  if (
    catalogKey &&
    catalogKey !==
      'default'
  ) {
    return catalogKey;
  }

  return (
    CHAT_THEME_KEYS.find(
      (key) =>
        itemSearchText(
          item,
        ).includes(
          key,
        ),
    ) ??
    'default'
  );
};

/* =========================================================
   Chat Page
========================================================= */

export default function ChatPage() {
  const navigate =
    useNavigate();

  const {
    roomId,
  } = useParams();

  const {
    user,
  } = useAuth();

  const [
    room,
    setRoom,
  ] = useState(null);

  const [
    messages,
    setMessages,
  ] = useState([]);

  const [
    hasMore,
    setHasMore,
  ] = useState(false);

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false);

  const [
    input,
    setInput,
  ] = useState('');

  const [
    connected,
    setConnected,
  ] = useState(false);

  const [
    customization,
    setCustomization,
  ] = useState(null);

  const clientRef =
    useRef(null);

  const bottomRef =
    useRef(null);

  /*
   * 이전 메시지를 앞에 붙일 때
   * 맨 아래로 이동하지 않기 위한 플래그
   */
  const keepScrollRef =
    useRef(false);

  const isOwner =
    room &&
    user &&
    room.postAuthorId ===
      user.id;

  /* =========================================================
     Equipped Chat Theme
  ========================================================= */

  const equippedChatTheme =
    useMemo(
      () => {
        const itemId =
          customization
            ?.equippedChatThemeId;

        if (
          !itemId
        ) {
          return null;
        }

        return (
          customizationItems.find(
            (item) =>
              item.id ===
                itemId &&
              item.category ===
                CUSTOMIZATION_CATEGORY.CHAT_THEME,
          ) ??
          null
        );
      },
      [
        customization,
      ],
    );

  const chatThemeKey =
    useMemo(
      () =>
        getChatThemeKey(
          equippedChatTheme,
        ),
      [
        equippedChatTheme,
      ],
    );

  const equippedChatAvatarId =
    customization
      ?.equippedChatAvatarId ??
    null;

  const chatThemeClass =
    `chat-theme-${chatThemeKey}`;

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

          return;
        }

        try {
          const state =
            await getCustomizationState(
              user,
            );

          setCustomization(
            state,
          );
        } catch {
          /*
           * 꾸미기 정보 조회 실패가
           * 실제 채팅 이용을 막아서는 안 된다.
           */
          setCustomization(
            null,
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
    },
    [
      loadCustomization,
    ],
  );

  /*
   * 내 꾸미기에서 적용값이 변경되었을 때
   * 같은 브라우저 안에서 바로 갱신
   */
  useEffect(
    () => {
      const handleCustomizationChange =
        () => {
          loadCustomization();
        };

      const handleStorage =
        (
          event,
        ) => {
          if (
            event.key ===
            'gamehouse.customization.v2'
          ) {
            loadCustomization();
          }
        };

      window.addEventListener(
        'gamehouse:customization-changed',
        handleCustomizationChange,
      );

      window.addEventListener(
        'storage',
        handleStorage,
      );

      return () => {
        window.removeEventListener(
          'gamehouse:customization-changed',
          handleCustomizationChange,
        );

        window.removeEventListener(
          'storage',
          handleStorage,
        );
      };
    },
    [
      loadCustomization,
    ],
  );

  /* =========================================================
     Room
  ========================================================= */

  const loadRoom =
    useCallback(
      async () => {
        try {
          const {
            data,
          } =
            await api.get(
              `/chat/rooms/${roomId}`,
            );

          setRoom(
            data.room,
          );

          setMessages(
            data.messages,
          );

          setHasMore(
            data.hasMore,
          );
        } catch (
          err
        ) {
          alert(
            errMsg(
              err,
            ),
          );

          navigate(
            '/',
          );
        }
      },
      [
        roomId,
        navigate,
      ],
    );

  /*
   * 방 정보만 갱신.
   *
   * 메시지는 유지해서
   * 이전 메시지 조회 내역이 사라지지 않게 한다.
   */
  const refreshRoom =
    useCallback(
      async () => {
        try {
          const {
            data,
          } =
            await api.get(
              `/chat/rooms/${roomId}`,
            );

          setRoom(
            data.room,
          );
        } catch {
          /*
           * 방 정보 갱신 실패는
           * 기존 채팅을 유지한다.
           */
        }
      },
      [
        roomId,
      ],
    );

  /* =========================================================
     Older Messages
  ========================================================= */

  const loadOlder =
    useCallback(
      async () => {
        if (
          !messages.length ||
          loadingMore
        ) {
          return;
        }

        setLoadingMore(
          true,
        );

        try {
          const {
            data,
          } =
            await api.get(
              `/chat/rooms/${roomId}/messages`,
              {
                params: {
                  before:
                    messages[
                      0
                    ].id,
                },
              },
            );

          keepScrollRef.current =
            true;

          setMessages(
            (
              previous,
            ) => [
              ...data.messages,
              ...previous,
            ],
          );

          setHasMore(
            data.hasMore,
          );
        } catch (
          err
        ) {
          alert(
            errMsg(
              err,
            ),
          );
        } finally {
          setLoadingMore(
            false,
          );
        }
      },
      [
        roomId,
        messages,
        loadingMore,
      ],
    );

  useEffect(
    () => {
      loadRoom();
    },
    [
      loadRoom,
    ],
  );

  /* =========================================================
     WebSocket
  ========================================================= */

  useEffect(
    () => {
      const token =
        localStorage.getItem(
          'token',
        );

      const client =
        new Client({
          webSocketFactory:
            () =>
              new SockJS(
                wsUrl,
              ),

          connectHeaders: {
            Authorization:
              `Bearer ${token}`,
          },

          reconnectDelay:
            3000,

          onConnect:
            () => {
              setConnected(
                true,
              );

              client.subscribe(
                `/topic/rooms.${roomId}`,
                (
                  frame,
                ) => {
                  const message =
                    JSON.parse(
                      frame.body,
                    );

                  setMessages(
                    (
                      previous,
                    ) => [
                      ...previous,
                      message,
                    ],
                  );
                },
              );
            },

          onDisconnect:
            () =>
              setConnected(
                false,
              ),

          onWebSocketClose:
            () =>
              setConnected(
                false,
              ),
        });

      client.activate();

      clientRef.current =
        client;

      return () => {
        clientRef.current =
          null;

        client.deactivate();
      };
    },
    [
      roomId,
    ],
  );

  /* =========================================================
     Scroll
  ========================================================= */

  useEffect(
    () => {
      if (
        keepScrollRef.current
      ) {
        keepScrollRef.current =
          false;

        return;
      }

      bottomRef.current
        ?.scrollIntoView({
          behavior:
            'smooth',
        });
    },
    [
      messages,
    ],
  );

  /* =========================================================
     Send Message
  ========================================================= */

  const send = (
    event,
  ) => {
    event.preventDefault();

    const content =
      input.trim();

    if (
      !content ||
      !clientRef.current
        ?.connected
    ) {
      return;
    }

    clientRef.current.publish({
      destination:
        `/app/rooms/${roomId}`,

      body:
        JSON.stringify({
          content,
        }),
    });

    setInput('');
  };

  /* =========================================================
     Party Actions
  ========================================================= */

  const confirmMember =
    async (
      applicationId,
    ) => {
      try {
        await api.post(
          `/applications/${applicationId}/confirm`,
        );

        refreshRoom();
      } catch (
        err
      ) {
        alert(
          errMsg(
            err,
          ),
        );
      }
    };

  const kick =
    async (
      userId,
      nickname,
    ) => {
      if (
        !confirm(
          `${nickname}님을 파티에서 내보낼까요? (신청도 거절 처리됩니다)`,
        )
      ) {
        return;
      }

      try {
        await api.delete(
          `/chat/rooms/${roomId}/members/${userId}`,
        );

        refreshRoom();
      } catch (
        err
      ) {
        alert(
          errMsg(
            err,
          ),
        );
      }
    };

  const closeRecruit =
    async () => {
      /*
       * TODO(house-suggestion):
       *
       * 실제 game/party 종료 이벤트가
       * participant 목록과 suggestionId를 제공하면
       * HouseCreateSuggestionModal을 연결한다.
       */
      if (
        !confirm(
          '모집을 완료 처리할까요? 이후 참가 신청을 받지 않습니다.',
        )
      ) {
        return;
      }

      try {
        await api.post(
          `/posts/${room.postId}/close`,
        );

        refreshRoom();
      } catch (
        err
      ) {
        alert(
          errMsg(
            err,
          ),
        );
      }
    };

  /* =========================================================
     Shared Themed Chat Adapters
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
          themeKey={
            chatThemeKey
          }
          currentUser={
            user
          }
          equippedChatAvatarId={
            equippedChatAvatarId
          }
          size={
            size
          }
        />
      ),
      [
        chatThemeKey,
        equippedChatAvatarId,
        user,
      ],
    );

  const isMessageMine =
    useCallback(
      (
        message,
      ) =>
        String(
          message
            ?.senderId ??
          '',
        ) ===
        chatUserId(
          user,
        ),
      [
        user,
      ],
    );

  const getMessageSender =
    useCallback(
      (
        message,
      ) => {
        if (
          isMessageMine(
            message,
          )
        ) {
          return user;
        }

        return {
          id:
            message
              ?.senderId,

          nickname:
            message
              ?.senderNickname ??
            '사용자',
        };
      },
      [
        isMessageMine,
        user,
      ],
    );

  /* =========================================================
     Loading
  ========================================================= */

  if (
    !room
  ) {
    return null;
  }

  const recruiting =
    room.postStatus ===
    'RECRUITING';

  const headerActions =
    isOwner &&
    recruiting
      ? (
        <button
          className="btn sm"
          type="button"
          onClick={
            closeRecruit
          }
        >
          모집완료
        </button>
      )
      : null;

  /* =========================================================
     Render
  ========================================================= */

  return (
    <div
      className={`page themed-chat-page ${chatThemeClass}`}
    >
      <div className="center chat themed-chat-shell">
        <ThemedChatPanel
          title={
            room.postTitle
          }

          onTitleClick={() =>
            navigate(
              `/post/${room.postId}`,
            )
          }

          statusLabel={
            recruiting
              ? '모집중 · 파티 채팅'
              : '모집완료 · 파티 채팅'
          }

          themeName={
            equippedChatTheme
              ?.name ??
            '기본 테마'
          }

          connected={
            connected
          }

          connectionLabel={
            connected
              ? '연결됨'
              : '연결 중'
          }

          headerActions={
            headerActions
          }

          participants={
            room.members
          }

          getParticipantPerson={(
            member,
          ) =>
            member.user
          }

          onParticipantClick={(
            person,
          ) =>
            navigate(
              `/profile/${person.id}`,
            )
          }

          renderParticipantActions={(
            member,
          ) => (
            <span className="themed-chat-participant-actions">
              {member.owner && (
                <span className="ui-tag is-primary">
                  방장
                </span>
              )}

              {!member.owner &&
                member.confirmed && (
                  <span className="ui-tag is-online">
                    ✔ 확정
                  </span>
                )}

              {isOwner &&
                !member.owner &&
                !member.confirmed &&
                member.applicationId && (
                  <button
                    className="textlink"
                    type="button"
                    onClick={() =>
                      confirmMember(
                        member.applicationId,
                      )
                    }
                  >
                    확정
                  </button>
                )}

              {isOwner &&
                !member.owner &&
                !member.confirmed && (
                  <button
                    className="textlink"
                    type="button"
                    onClick={() =>
                      kick(
                        member.user.id,
                        member.user.nickname,
                      )
                    }
                  >
                    내보내기
                  </button>
                )}
            </span>
          )}

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

          hasMore={
            hasMore
          }

          loadingMore={
            loadingMore
          }

          onLoadMore={
            loadOlder
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
            send
          }

          inputPlaceholder={
            connected
              ? '메시지를 입력하세요...'
              : '연결 중...'
          }

          inputDisabled={
            !connected
          }

          sendDisabled={
            !connected ||
            !input.trim()
          }
        />
      </div>
    </div>
  );
}
