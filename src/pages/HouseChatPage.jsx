import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  getHouse,
  listHouseMessages,
  sendHouseMessage,
  subscribeHouseMessages,
} from '../api/houses';

import {
  useAuth,
} from '../context/AuthContext';

import Avatar from '../components/Avatar';

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
  NEW_MEMBER: '신입 멤버',
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
      role: 'NEW_MEMBER',
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
      role: 'NEW_MEMBER',
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
  role,
  large = false,
}) {
  const frame =
    getHouseRankFrame(
      role,
    );

  const layout =
    getHouseRankLayout(
      role,
      large,
    );

  const label =
    ROLE_LABEL[
      role
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

  const bottomRef =
    useRef(null);

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

  const viewerMember =
    house.members.find(
      (
        member,
      ) =>
        String(
          member.userId ?? member.id,
        ) ===
        viewerId,
    );

  const viewerRole =
    viewerMember?.role ??
    house.myRole ??
    house.myStatus ??
    'MEMBER';

  /* =========================================================
     Render
  ========================================================= */

  return (
    <div className="page house-chat-page">

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

      <section className="house-chat-panel">

        <header className="house-chat-header">

          <div>
            <span className="house-eyebrow">
              {previewMode
                ? 'HOUSE RANK FRAME PREVIEW'
                : 'HOUSE CHAT'}
            </span>

            <h1>
              {house.name}
            </h1>

            <p>
              {previewMode
                ? 'House 계급별 프로필 테두리 미리보기입니다.'
                : `${house.members.length}명의 House 멤버가 함께하는 전용 채팅입니다.`}
            </p>
          </div>

          <div className="house-chat-my-rank">

            <HouseRankAvatar
              person={
                viewerMember ??
                user
              }
              role={
                viewerRole
              }
              large
            />

            <div className="house-chat-my-rank-info">

              <span>
                {previewMode
                  ? '미리보기 계급'
                  : '내 House 계급'}
              </span>

              <strong>
                {
                  ROLE_LABEL[
                    viewerRole
                  ] ??
                  '일반 멤버'
                }
              </strong>

            </div>

          </div>

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

                const authorMember =
                  house.members.find(
                    (
                      member,
                    ) => String(
                      member.userId ??
                        member.id,
                    ) === String(
                      message.senderId ??
                        message.author?.id,
                    ),
                  );

                const authorRole =
                  message
                    .author
                    ?.role ??
                  authorMember?.role ??
                  'MEMBER';

                const avatar = (
                  <HouseRankAvatar
                    person={
                      message.author
                    }
                    role={
                      authorRole
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
                      }`
                    }
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
                              authorRole
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

        <form
          className="house-chat-composer"
          onSubmit={
            send
          }
        >

          {sendError && (
            <div
              className="house-alert error"
              role="alert"
            >
              {sendError}
            </div>
          )}

          <div className="house-chat-input-row">

            <textarea
              value={
                input
              }
              maxLength={
                500
              }
              rows={
                2
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
                  : '메시지를 입력하세요. Shift+Enter로 줄바꿈'
              }
            />

            <button
              className="ui-btn-primary"
              type="submit"
              disabled={
                sending ||
                !input.trim() ||
                (!previewMode && !connected)
              }
            >
              {sending
                ? '전송 중…'
                : connected || previewMode
                  ? '전송'
                  : '연결 중…'}
            </button>

          </div>

          <small>
            {input.length}/500
          </small>

        </form>

      </section>

    </div>
  );
}
