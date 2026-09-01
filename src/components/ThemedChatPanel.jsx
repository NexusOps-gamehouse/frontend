import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Avatar from './Avatar';

import {
  getChatThemeAvatarById,
  getChatThemeAvatars,
} from '../mocks/customizationChatAvatars';

/* =========================================================
   Shared helpers
========================================================= */

export const chatUserId = (
  person,
) => String(
  person?.id ??
  person?.userId ??
  person?.email ??
  person?.nickname ??
  '',
);

export const formatChatTime = (
  value,
) => {
  if (
    !value
  ) {
    return '';
  }

  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '';
  }

  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      hour:
        '2-digit',

      minute:
        '2-digit',

      hour12:
        false,
    },
  ).format(
    date,
  );
};

/* =========================================================
   Theme Avatar
========================================================= */

export function ThemedChatAvatar({
  person,
  themeKey,
  currentUser,
  equippedChatAvatarId,
  useThemeAvatar,
  size = 'md',
}) {
  const isCurrentUser =
    chatUserId(
      person,
    ) &&
    chatUserId(
      person,
    ) ===
      chatUserId(
        currentUser,
      );

  const shouldUseThemeAvatar =
    useThemeAvatar ??
    isCurrentUser;

  const selectedAvatar =
    shouldUseThemeAvatar
      ? getChatThemeAvatarById(
          equippedChatAvatarId,
        )
      : null;

  const firstThemeAvatar =
    shouldUseThemeAvatar
      ? getChatThemeAvatars(
          themeKey,
        )[0] ??
        null
      : null;

  const themeAvatar =
    selectedAvatar
      ?.themeKey ===
      themeKey
      ? selectedAvatar
      : firstThemeAvatar;

  if (
    !themeAvatar
  ) {
    return (
      <Avatar
        user={
          person
        }
        size={
          size ===
          'md'
            ? 'sm'
            : size
        }
      />
    );
  }

  return (
    <span
      className={
        `chat-theme-avatar chat-theme-avatar-${size}`
      }
      title={
        person?.nickname ??
        ''
      }
    >
      <img
        src={
          themeAvatar.asset
        }
        alt={
          person?.nickname
            ? `${person.nickname} 프로필`
            : '채팅 프로필'
        }
      />
    </span>
  );
}

/* =========================================================
   Icons
========================================================= */

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
      />

      <path d="m16 16 4 4" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
    >
      <circle
        cx="5"
        cy="12"
        r="1.5"
      />

      <circle
        cx="12"
        cy="12"
        r="1.5"
      />

      <circle
        cx="19"
        cy="12"
        r="1.5"
      />
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
   Participant row
========================================================= */

function ParticipantProfile({
  participant,
  person,
  avatar,
  onParticipantClick,
  actions,
}) {
  return (
    <div className="themed-chat-participant">
      <button
        type="button"
        className="themed-chat-participant-profile"
        disabled={
          !onParticipantClick
        }
        onClick={() =>
          onParticipantClick?.(
            person,
          )
        }
      >
        {avatar}

        <span>
          {person?.nickname ??
            person?.name ??
            '사용자'}
        </span>
      </button>

      {actions}
    </div>
  );
}

/* =========================================================
   Themed Chat Panel
========================================================= */

export default function ThemedChatPanel({
  title,
  onTitleClick,
  statusLabel,
  themeName,
  connected,
  connectionLabel,
  headerActions,

  participants = [],
  getParticipantPerson = (
    participant,
  ) => participant,
  onParticipantClick,
  renderParticipantActions,

  messages = [],
  currentUser,
  isMessageMine,
  getMessageSender,
  getMessageTime = (
    message,
  ) =>
    formatChatTime(
      message?.createdAt ??
        message?.sentAt ??
        message?.timestamp,
    ),
  renderAvatar,

  hasMore = false,
  loadingMore = false,
  onLoadMore,

  bottomRef,

  input,
  onInputChange,
  onSubmit,
  inputPlaceholder =
    '메시지를 입력하세요...',
  inputDisabled = false,
  sendDisabled = false,

  previewLabel,
}) {
  const [
    participantsOpen,
    setParticipantsOpen,
  ] = useState(
    false,
  );

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(
    false,
  );

  const [
    optionsOpen,
    setOptionsOpen,
  ] = useState(
    false,
  );

  const [
    memberSearch,
    setMemberSearch,
  ] = useState(
    '',
  );

  const headerRef =
    useRef(null);

  const searchInputRef =
    useRef(null);

  const renderPersonAvatar =
    renderAvatar ??
    ((
      person,
      size = 'md',
    ) => (
      <Avatar
        user={
          person
        }
        size={
          size ===
          'md'
            ? 'sm'
            : size
        }
      />
    ));

  /* =========================================================
     Participant search
  ========================================================= */

  const searchableParticipants =
    useMemo(
      () =>
        participants.map(
          (
            participant,
            index,
          ) => ({
            participant,

            index,

            person:
              getParticipantPerson(
                participant,
              ),
          }),
        ),
      [
        participants,
        getParticipantPerson,
      ],
    );

  const filteredParticipants =
    useMemo(
      () => {
        const query =
          memberSearch
            .trim()
            .toLowerCase();

        if (
          !query
        ) {
          return searchableParticipants;
        }

        return searchableParticipants.filter(
          ({
            person,
          }) => {
            const source =
              [
                person?.nickname,
                person?.name,
                person?.email,
                person?.riotId,
                person?.riotNickname,
              ]
                .filter(
                  Boolean,
                )
                .join(
                  ' ',
                )
                .toLowerCase();

            return source.includes(
              query,
            );
          },
        );
      },
      [
        memberSearch,
        searchableParticipants,
      ],
    );

  /* =========================================================
     Header menus
  ========================================================= */

  const closeHeaderMenus =
    () => {
      setParticipantsOpen(
        false,
      );

      setSearchOpen(
        false,
      );

      setOptionsOpen(
        false,
      );
    };

  const openParticipants =
    () => {
      setParticipantsOpen(
        true,
      );

      setSearchOpen(
        false,
      );

      setOptionsOpen(
        false,
      );
    };

  const toggleParticipants =
    () => {
      const next =
        !participantsOpen;

      closeHeaderMenus();

      setParticipantsOpen(
        next,
      );
    };

  const toggleSearch =
    () => {
      const next =
        !searchOpen;

      closeHeaderMenus();

      setSearchOpen(
        next,
      );
    };

  const toggleOptions =
    () => {
      const next =
        !optionsOpen;

      closeHeaderMenus();

      setOptionsOpen(
        next,
      );
    };

  useEffect(
    () => {
      if (
        !participantsOpen &&
        !searchOpen &&
        !optionsOpen
      ) {
        return undefined;
      }

      const closeOnOutsideClick =
        (
          event,
        ) => {
          if (
            !headerRef.current
              ?.contains(
                event.target,
              )
          ) {
            closeHeaderMenus();
          }
        };

      const closeOnEscape =
        (
          event,
        ) => {
          if (
            event.key ===
            'Escape'
          ) {
            closeHeaderMenus();
          }
        };

      document.addEventListener(
        'pointerdown',
        closeOnOutsideClick,
      );

      document.addEventListener(
        'keydown',
        closeOnEscape,
      );

      return () => {
        document.removeEventListener(
          'pointerdown',
          closeOnOutsideClick,
        );

        document.removeEventListener(
          'keydown',
          closeOnEscape,
        );
      };
    },
    [
      participantsOpen,
      searchOpen,
      optionsOpen,
    ],
  );

  useEffect(
    () => {
      if (
        searchOpen
      ) {
        window.setTimeout(
          () =>
            searchInputRef.current
              ?.focus(),
          0,
        );
      }
    },
    [
      searchOpen,
    ],
  );

  /* =========================================================
     Render
  ========================================================= */

  return (
    <section className="themed-chat-panel">
      <header
        className="themed-chat-header"
        ref={
          headerRef
        }
      >
        {/* ===============================================
            Theme profile icon in the artwork circle
        =============================================== */}

        <div className="themed-chat-brand">
          {currentUser &&
            renderPersonAvatar(
              currentUser,
              'lg',
            )}
        </div>

        {/* ===============================================
            Approved two-line artwork:
            1) member count
            2) actual room title
        =============================================== */}

        <button
          type="button"
          className="themed-chat-count"
          aria-expanded={
            participantsOpen
          }
          aria-controls="themed-chat-participants"
          onClick={
            toggleParticipants
          }
          title="구성원 목록"
        >
          {participants.length}명
        </button>

        <div className="themed-chat-heading">
          {onTitleClick ? (
            <button
              type="button"
              className="themed-chat-title"
              onClick={
                onTitleClick
              }
              title={
                title
              }
            >
              {title}
            </button>
          ) : (
            <h1
              className="themed-chat-title is-static"
              title={
                title
              }
            >
              {title}
            </h1>
          )}
        </div>

        {/* ===============================================
            Search / Options hit areas exactly over
            the baked search and more icons
        =============================================== */}

        <div className="themed-chat-header-controls">
          <button
            type="button"
            className="themed-chat-icon-button themed-chat-search-button"
            aria-label="구성원 검색"
            aria-expanded={
              searchOpen
            }
            onClick={
              toggleSearch
            }
            title="구성원 검색"
          >
            <SearchIcon />
          </button>

          <button
            type="button"
            className="themed-chat-icon-button themed-chat-more-button"
            aria-label="채팅방 옵션"
            aria-expanded={
              optionsOpen
            }
            onClick={
              toggleOptions
            }
            title="채팅방 옵션"
          >
            <MoreIcon />
          </button>
        </div>

        {/* ===============================================
            Participant list
        =============================================== */}

        {participantsOpen && (
          <div
            className="themed-chat-header-popover themed-chat-participants-popover"
            id="themed-chat-participants"
            role="dialog"
            aria-label="채팅 참여자"
          >
            <div className="themed-chat-popover-heading">
              <strong>
                구성원
              </strong>

              <span>
                {participants.length}명
              </span>
            </div>

            <div className="themed-chat-participant-list">
              {searchableParticipants.map(
                ({
                  participant,
                  person,
                  index,
                }) => (
                  <ParticipantProfile
                    key={
                      chatUserId(
                        person,
                      ) ||
                      index
                    }
                    participant={
                      participant
                    }
                    person={
                      person
                    }
                    avatar={
                      renderPersonAvatar(
                        person,
                        'sm',
                      )
                    }
                    onParticipantClick={
                      onParticipantClick
                    }
                    actions={
                      renderParticipantActions?.(
                        participant,
                      )
                    }
                  />
                ),
              )}
            </div>
          </div>
        )}

        {/* ===============================================
            Member search
        =============================================== */}

        {searchOpen && (
          <div
            className="themed-chat-header-popover themed-chat-search-popover"
            role="dialog"
            aria-label="구성원 검색"
          >
            <div className="themed-chat-popover-heading">
              <strong>
                구성원 검색
              </strong>

              <span>
                {filteredParticipants.length}명
              </span>
            </div>

            <label className="themed-chat-member-search-field">
              <SearchIcon />

              <input
                ref={
                  searchInputRef
                }
                type="search"
                value={
                  memberSearch
                }
                placeholder="닉네임으로 검색"
                onChange={(
                  event,
                ) =>
                  setMemberSearch(
                    event.target.value,
                  )
                }
              />
            </label>

            <div className="themed-chat-participant-list">
              {filteredParticipants.length ===
              0 ? (
                <div className="themed-chat-search-empty">
                  검색 결과가 없습니다.
                </div>
              ) : (
                filteredParticipants.map(
                  ({
                    participant,
                    person,
                    index,
                  }) => (
                    <ParticipantProfile
                      key={
                        chatUserId(
                          person,
                        ) ||
                        index
                      }
                      participant={
                        participant
                      }
                      person={
                        person
                      }
                      avatar={
                        renderPersonAvatar(
                          person,
                          'sm',
                        )
                      }
                      onParticipantClick={
                        onParticipantClick
                      }
                      actions={
                        renderParticipantActions?.(
                          participant,
                        )
                      }
                    />
                  ),
                )
              )}
            </div>
          </div>
        )}

        {/* ===============================================
            Options
        =============================================== */}

        {optionsOpen && (
          <div
            className="themed-chat-header-popover themed-chat-options-popover"
            role="menu"
            aria-label="채팅방 옵션"
          >
            <div className="themed-chat-options-summary">
              <strong>
                {title}
              </strong>

              {(statusLabel ||
                themeName) && (
                <span>
                  {[
                    statusLabel,
                    themeName,
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(
                      ' · ',
                    )}
                </span>
              )}

              <span
                className={
                  connected
                    ? 'is-connected'
                    : ''
                }
              >
                {connectionLabel ??
                  (connected
                    ? '연결됨'
                    : '연결 중')}
              </span>
            </div>

            <div className="themed-chat-options-list">
              <button
                type="button"
                role="menuitem"
                onClick={
                  openParticipants
                }
              >
                <span>
                  구성원 목록
                </span>

                <small>
                  {participants.length}명
                </small>
              </button>

              {onTitleClick && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeHeaderMenus();
                    onTitleClick();
                  }}
                >
                  채팅방 정보 보기
                </button>
              )}
            </div>

            {headerActions && (
              <div className="themed-chat-options-actions">
                {headerActions}
              </div>
            )}

            {previewLabel && (
              <div className="themed-chat-options-preview-label">
                {previewLabel}
              </div>
            )}
          </div>
        )}
      </header>

      {/* =====================================================
          Messages
      ===================================================== */}

      <div className="themed-chat-stage">
        <div
          className="themed-chat-decoration"
          aria-hidden="true"
        />

        <div
          className="themed-chat-messages"
          aria-live="polite"
        >
          {hasMore && (
            <div className="themed-chat-older-wrap">
              <button
                type="button"
                className="themed-chat-older"
                disabled={
                  loadingMore
                }
                onClick={
                  onLoadMore
                }
              >
                {loadingMore
                  ? '불러오는 중…'
                  : '이전 메시지 보기'}
              </button>
            </div>
          )}

          {messages.length ===
            0 && (
            <div className="themed-chat-empty">
              첫 메시지를 남겨보세요.
            </div>
          )}

          {messages.map(
            (
              message,
            ) => {
              const mine =
                isMessageMine(
                  message,
                );

              const sender =
                getMessageSender(
                  message,
                );

              const time =
                getMessageTime(
                  message,
                );

              return (
                <div
                  className={
                    `themed-chat-message-row ${mine ? 'is-me' : ''}`
                  }
                  key={
                    message.id
                  }
                >
                  {!mine &&
                    renderPersonAvatar(
                      sender,
                      'md',
                    )}

                  <div className="themed-chat-message-body">
                    {!mine && (
                      <div className="themed-chat-sender">
                        {sender?.nickname ??
                          sender?.name ??
                          '사용자'}
                      </div>
                    )}

                    <div className="themed-chat-message-line">
                      {mine &&
                        time && (
                          <time className="themed-chat-time">
                            {time}
                          </time>
                        )}

                      <div
                        className={
                          `themed-chat-bubble ${mine ? 'is-me' : ''}`
                        }
                      >
                        {message.content}
                      </div>

                      {!mine &&
                        time && (
                          <time className="themed-chat-time">
                            {time}
                          </time>
                        )}
                    </div>
                  </div>

                  {mine &&
                    renderPersonAvatar(
                      currentUser,
                      'md',
                    )}
                </div>
              );
            },
          )}

          <div
            ref={
              bottomRef
            }
          />
        </div>

        {/* ===================================================
            Composer
        =================================================== */}

        <form
          className="themed-chat-form"
          onSubmit={
            onSubmit
          }
        >
          <button
            type="button"
            className="themed-chat-attach"
            aria-label="파일 첨부 (준비 중)"
            title="파일 첨부는 준비 중입니다."
            disabled
          >
            <ClipIcon />
          </button>

          <input
            className="themed-chat-input"
            maxLength={
              500
            }
            placeholder={
              inputPlaceholder
            }
            value={
              input
            }
            disabled={
              inputDisabled
            }
            onChange={
              onInputChange
            }
          />

          <button
            className="themed-chat-send"
            type="submit"
            aria-label="메시지 전송"
            disabled={
              sendDisabled
            }
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </section>
  );
}
