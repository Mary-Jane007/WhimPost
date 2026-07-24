"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { UserPublic } from "@/lib/types";
import type { LibraryProgress } from "@/lib/library";
import {
  ARCHIVE_CLIPS,
  LIBRARY_COLLECTIONS,
  LIBRARY_TABS,
  LIBRARY_XP,
  READING_CATEGORIES,
  featuredCuriosity,
  featuredMystery,
  featuredThought,
  weeklyChallenges,
  type ClubBook,
  type LibraryTabId,
  type ReadingCategory,
  type ReadingListBook,
} from "@/lib/libraryContent";
import { LibraryAdminEditor } from "@/components/LibraryAdminEditor";
import { LibraryBookReader } from "@/components/LibraryBookReader";
import { ShelfBookCoverAttach } from "@/components/ShelfBookCoverAttach";
import { ShelfBookFileAttach } from "@/components/ShelfBookFileAttach";

type Props = {
  user: UserPublic;
  initialProgress: LibraryProgress;
  clubBooks: ClubBook[];
  readingList: ReadingListBook[];
  featuredBook: ClubBook;
};

export function MosshollowLibrary({
  user,
  initialProgress,
  clubBooks,
  readingList,
  featuredBook,
}: Props) {
  const [tab, setTab] = useState<LibraryTabId>("bookclub");
  const [progress, setProgress] = useState(initialProgress);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [listCategory, setListCategory] = useState<ReadingCategory | "All">(
    "All"
  );
  const [mysteryAnswer, setMysteryAnswer] = useState("");
  const [thoughtBody, setThoughtBody] = useState("");
  const [journalName, setJournalName] = useState("");
  const [journalNote, setJournalNote] = useState("");
  const [journalQuote, setJournalQuote] = useState("");
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [secretVisible, setSecretVisible] = useState(false);
  const [shelfClub, setShelfClub] = useState(clubBooks);
  const [shelfList, setShelfList] = useState(readingList);
  const [book, setBook] = useState(featuredBook);
  const [reader, setReader] = useState<{
    bookId: string;
    title: string;
    author?: string;
    fileUrl: string;
    fileName?: string | null;
  } | null>(null);

  const curiosity = featuredCuriosity();
  const mystery = featuredMystery();
  const thought = featuredThought();
  const challenges = weeklyChallenges();

  async function refreshShelves() {
    const res = await fetch("/api/library/books");
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.clubBooks) && data.clubBooks.length) {
      setShelfClub(data.clubBooks);
      const monthIdx = new Date().getUTCMonth() % data.clubBooks.length;
      setBook(data.clubBooks[monthIdx]);
    }
    if (Array.isArray(data.readingList)) setShelfList(data.readingList);
  }
  const bookPct = progress.bookProgress[book.id] || 0;
  const bookFinished = Boolean(progress.finishedBooks[book.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSecretVisible(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function postAction(action: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/library/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update the library");
      if (data.progress) setProgress(data.progress);
      const { emitChronicleUnlock } = await import("@/lib/chronicleClient");
      emitChronicleUnlock(data.chronicleUnlock);
      return data.progress as LibraryProgress;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return null;
    } finally {
      setBusy(false);
    }
  }

  const filteredList = useMemo(() => {
    if (listCategory === "All") return shelfList;
    return shelfList.filter((b) => b.category === listCategory);
  }, [listCategory, shelfList]);

  return (
    <div className="mh-library">
      <div className="mh-atmosphere" aria-hidden>
        <span className="mh-dust d1" />
        <span className="mh-dust d2" />
        <span className="mh-dust d3" />
        <span className="mh-dust d4" />
        <span className="mh-candle c1" />
        <span className="mh-candle c2" />
        <span className="mh-owl-fly" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/stickers/villages/mosshollow/pack/books-stack.png"
          alt=""
          className="mh-deco books"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/stickers/villages/mosshollow/pack/ink-bottle.png"
          alt=""
          className="mh-deco ink"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/stickers/villages/mosshollow/pack/lantern.png"
          alt=""
          className="mh-deco lantern"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/stickers/villages/mosshollow/pack/moth.png"
          alt=""
          className="mh-deco moth"
        />
      </div>

      <header className="mh-hero">
        <p className="mh-eyebrow">Mosshollow · Archivists only</p>
        <h1>The Grand Library</h1>
        <p className="mh-subtitle">
          <em>“Every answer uncovers another question.”</em>
        </p>
        <p className="mh-lead">
          Welcome to the heart of Mosshollow, {user.displayName}. Here, every
          villager is an Archivist, collecting knowledge one page at a time.
          Read books, solve mysteries, answer thought-provoking questions,
          uncover forgotten lore, and expand the Library&apos;s collection.
        </p>
        <div className="mh-status">
          <span>
            {progress.title.emoji} {progress.title.title}
          </span>
          <span>{progress.xp} library XP</span>
          <span>{progress.badges.length} badges</span>
          <span>{progress.stamps.length} stamps</span>
        </div>
      </header>

      {error ? <p className="mh-error">{error}</p> : null}
      {toast ? (
        <p className="mh-toast" role="status">
          {toast}
        </p>
      ) : null}

      <nav className="mh-tabs" aria-label="Library sections">
        {LIBRARY_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            <span aria-hidden>{t.emoji}</span> {t.label}
          </button>
        ))}
      </nav>

      {secretVisible &&
      progress.secretsFound.length < 5 &&
      !busy ? (
        <button
          type="button"
          className="mh-secret-book"
          onClick={() => {
            void postAction({ type: "claimSecret" }).then((p) => {
              if (p) {
                setToast("A glowing book revealed a secret…");
                setSecretVisible(false);
              }
            });
          }}
          aria-label="Secret glowing book"
        >
          ✦
        </button>
      ) : null}

      <div className="mh-panel">
        {tab === "bookclub" && (
          <section className="mh-section">
            <h2>Monthly Book Club</h2>
            <p className="mh-section-lead">
              One featured book each month. Finish it to earn the Bookworm
              Badge (+{LIBRARY_XP.reading} XP).
            </p>
            <article className="mh-book-feature">
              <div
                className={`mh-cover${book.coverUrl ? " has-image" : ""}`}
                aria-hidden
              >
                {book.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.coverUrl} alt="" className="mh-cover-img" />
                ) : (
                  <span>{book.coverEmoji}</span>
                )}
                {!book.coverUrl ? <strong>{book.title}</strong> : null}
              </div>
              <div>
                <h3>{book.title}</h3>
                <p className="muted">by {book.author}</p>
                <p>{book.description}</p>
                <p className="mh-meta">
                  Estimated reading time · about {book.minutes} minutes
                  {progress.readingPositions?.[book.id]?.label
                    ? ` · Bookmark: ${progress.readingPositions[book.id].label}`
                    : progress.bookProgress[book.id]
                      ? ` · ${progress.bookProgress[book.id]}% read`
                      : ""}
                </p>
                {book.fileUrl ? (
                  <p className="mh-file-link">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() =>
                        setReader({
                          bookId: book.id,
                          title: book.title,
                          author: book.author,
                          fileUrl: book.fileUrl!,
                          fileName: book.fileName,
                        })
                      }
                    >
                      Read in the library
                      {book.fileName ? ` · ${book.fileName}` : ""}
                    </button>
                  </p>
                ) : null}
                {user.isOwner ? (
                  <div className="mh-owner-book-tools">
                    <ShelfBookCoverAttach
                      bookId={book.id}
                      bookTitle={book.title}
                      hasCover={Boolean(book.coverUrl)}
                      onAttached={() => void refreshShelves()}
                    />
                    <ShelfBookFileAttach
                      bookId={book.id}
                      bookTitle={book.title}
                      hasFile={Boolean(book.fileUrl)}
                      onAttached={() => void refreshShelves()}
                    />
                  </div>
                ) : null}
                <label className="mh-progress-label">
                  Reading progress · {bookPct}%
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={bookPct}
                    disabled={busy || bookFinished}
                    onChange={(e) => {
                      const percent = Number(e.target.value);
                      setProgress((prev) => ({
                        ...prev,
                        bookProgress: {
                          ...prev.bookProgress,
                          [book.id]: percent,
                        },
                      }));
                    }}
                    onMouseUp={(e) => {
                      const percent = Number(
                        (e.target as HTMLInputElement).value
                      );
                      void postAction({
                        type: "bookProgress",
                        bookId: book.id,
                        percent,
                      });
                    }}
                    onTouchEnd={(e) => {
                      const percent = Number(
                        (e.target as HTMLInputElement).value
                      );
                      void postAction({
                        type: "bookProgress",
                        bookId: book.id,
                        percent,
                      });
                    }}
                  />
                </label>
                <div className="mh-quotes">
                  <h4>Favorite quotes</h4>
                  <ul>
                    {book.quotes.map((q) => (
                      <li key={q}>
                        <em>“{q}”</em>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mh-quotes">
                  <h4>Reflection questions</h4>
                  <ul>
                    {book.reflections.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>
                <div className="mh-discussion">
                  <h4>Discussion thread</h4>
                  <p className="muted">
                    Share thoughts in your Archivist Journal, or leave a
                    reflection when you mark the book finished.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy || bookFinished}
                  onClick={() =>
                    void postAction({
                      type: "finishBook",
                      bookId: book.id,
                      reflection: `Finished ${book.title} with the Book Club.`,
                      quote: book.quotes[0],
                    }).then((p) => {
                      if (p) setToast("Bookworm Badge earned — well read.");
                    })
                  }
                >
                  {bookFinished ? "Finished" : "Mark as Finished"}
                </button>
              </div>
            </article>
            <div className="mh-club-shelf">
              <h3>This season&apos;s shelf</h3>
              <ul>
                {shelfClub.map((b) => (
                  <li key={b.id} className={b.id === book.id ? "active" : ""}>
                    <div className="mh-shelf-row">
                      <button
                        type="button"
                        className="mh-shelf-select"
                        onClick={() => setBook(b)}
                      >
                        <span className="mh-shelf-thumb" aria-hidden>
                          {b.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={b.coverUrl} alt="" />
                          ) : (
                            <span>{b.coverEmoji}</span>
                          )}
                        </span>
                        <span>
                          {b.title}
                          {b.fileUrl ? " · 📄" : ""}
                          {progress.readingPositions?.[b.id]?.label
                            ? ` · ${progress.readingPositions[b.id].label}`
                            : ""}
                          {progress.finishedBooks[b.id] ? " · ✓" : ""}
                        </span>
                      </button>
                      <div className="mh-shelf-actions">
                        {b.fileUrl ? (
                          <button
                            type="button"
                            className="btn-secondary mh-attach-btn"
                            onClick={() =>
                              setReader({
                                bookId: b.id,
                                title: b.title,
                                author: b.author,
                                fileUrl: b.fileUrl!,
                                fileName: b.fileName,
                              })
                            }
                          >
                            Read
                          </button>
                        ) : null}
                        {user.isOwner ? (
                          <>
                            <ShelfBookCoverAttach
                              bookId={b.id}
                              bookTitle={b.title}
                              hasCover={Boolean(b.coverUrl)}
                              onAttached={() => void refreshShelves()}
                            />
                            <ShelfBookFileAttach
                              bookId={b.id}
                              bookTitle={b.title}
                              hasFile={Boolean(b.fileUrl)}
                              onAttached={() => void refreshShelves()}
                            />
                          </>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {tab === "readinglist" && (
          <section className="mh-section">
            <h2>Owl&apos;s Reading List</h2>
            <p className="mh-section-lead">
              A permanent nest of recommendations — filter by mood of mind.
            </p>
            <div className="mh-chips">
              <button
                type="button"
                className={listCategory === "All" ? "active" : ""}
                onClick={() => setListCategory("All")}
              >
                All
              </button>
              {READING_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={listCategory === c ? "active" : ""}
                  onClick={() => setListCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="mh-grid">
              {filteredList.map((b) => {
                const status = progress.readingStatus[b.id] || "none";
                const wished = Boolean(progress.wishlist[b.id]);
                return (
                  <article key={b.id} className="mh-card">
                    <div
                      className={`mh-card-cover${b.coverUrl ? " has-image" : ""}`}
                      aria-hidden
                    >
                      {b.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.coverUrl} alt="" />
                      ) : (
                        <span>{b.coverEmoji || "📖"}</span>
                      )}
                    </div>
                    <h3>{b.title}</h3>
                    <p className="muted">{b.author}</p>
                    <p className="mh-meta">
                      {b.category} · {b.difficulty} · {b.length} · {b.mood}
                    </p>
                    <p className="mh-themes">{b.themes.join(" · ")}</p>
                    <p className="mh-rating">★ {b.rating.toFixed(1)} community</p>
                    {b.fileUrl ? (
                      <p className="mh-file-link">
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() =>
                            setReader({
                              bookId: b.id,
                              title: b.title,
                              author: b.author,
                              fileUrl: b.fileUrl!,
                              fileName: b.fileName,
                            })
                          }
                        >
                          Read in the library
                        </button>
                      </p>
                    ) : null}
                    {user.isOwner ? (
                      <div className="mh-owner-book-tools">
                        <ShelfBookCoverAttach
                          bookId={b.id}
                          bookTitle={b.title}
                          hasCover={Boolean(b.coverUrl)}
                          onAttached={() => void refreshShelves()}
                        />
                        <ShelfBookFileAttach
                          bookId={b.id}
                          bookTitle={b.title}
                          hasFile={Boolean(b.fileUrl)}
                          onAttached={() => void refreshShelves()}
                        />
                      </div>
                    ) : null}
                    <div className="mh-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() =>
                          void postAction({
                            type: "wishlist",
                            bookId: b.id,
                            on: !wished,
                          })
                        }
                      >
                        {wished ? "Wishlisted" : "Wishlist"}
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={busy || status === "finished"}
                        onClick={() =>
                          void postAction({
                            type: "readingStatus",
                            bookId: b.id,
                            status:
                              status === "reading" ? "finished" : "reading",
                          })
                        }
                      >
                        {status === "finished"
                          ? "Finished"
                          : status === "reading"
                            ? "Mark finished"
                            : "Start reading"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "curiosity" && (
          <section className="mh-section">
            <h2>Curiosity Cabinet</h2>
            <p className="mh-section-lead">
              A new fascinating fact each day. Correct quizzes award +
              {LIBRARY_XP.quiz} XP.
            </p>
            <article className="mh-card mh-curiosity">
              <h3>{curiosity.question}</h3>
              <p>{curiosity.fact}</p>
              {progress.curiosityDone[curiosity.id] ? (
                <p className="mh-done">Logged in your cabinet for today.</p>
              ) : (
                <div className="mh-quiz">
                  <p>{curiosity.quiz.prompt}</p>
                  <div className="mh-quiz-options">
                    {curiosity.quiz.options.map((opt, i) => (
                      <button
                        key={opt}
                        type="button"
                        className={quizChoice === i ? "active" : ""}
                        disabled={busy}
                        onClick={() => setQuizChoice(i)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy || quizChoice === null}
                    onClick={() => {
                      if (quizChoice === null) return;
                      void postAction({
                        type: "curiosityQuiz",
                        factId: curiosity.id,
                        choice: quizChoice,
                      }).then((p) => {
                        if (!p) return;
                        setToast(
                          quizChoice === curiosity.quiz.answer
                            ? "Correct — lantern lit."
                            : "Fact saved; try another night."
                        );
                        setQuizChoice(null);
                      });
                    }}
                  >
                    Submit answer
                  </button>
                </div>
              )}
            </article>
          </section>
        )}

        {tab === "mystery" && (
          <section className="mh-section">
            <h2>Mystery of the Month</h2>
            <p className="mh-section-lead">
              Solve the case for +{LIBRARY_XP.mystery} XP and a Library Stamp.
            </p>
            <article className="mh-card">
              <h3>{mystery.title}</h3>
              <p>{mystery.synopsis}</p>
              <h4>Clues</h4>
              <ol className="mh-clues">
                {mystery.clues.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ol>
              {progress.mysteryDone[mystery.id] ? (
                <p className="mh-done">
                  Solved · stamp collected: {mystery.stamp}
                </p>
              ) : (
                <form
                  className="mh-mystery-form"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    void postAction({
                      type: "solveMystery",
                      mysteryId: mystery.id,
                      answer: mysteryAnswer,
                    }).then((p) => {
                      if (!p) return;
                      if (p.mysteryDone[mystery.id]) {
                        setToast(`Stamp unlocked: ${mystery.stamp}`);
                        setMysteryAnswer("");
                      } else {
                        setError("Not quite — reread the clues by candlelight.");
                      }
                    });
                  }}
                >
                  <label>
                    <span>{mystery.puzzlePrompt}</span>
                    <input
                      value={mysteryAnswer}
                      onChange={(e) => setMysteryAnswer(e.target.value)}
                      disabled={busy}
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={busy || !mysteryAnswer.trim()}
                  >
                    Submit solution
                  </button>
                </form>
              )}
            </article>
          </section>
        )}

        {tab === "challenges" && (
          <section className="mh-section">
            <h2>Archive Challenges</h2>
            <p className="mh-section-lead">
              Small weekly tasks · +{LIBRARY_XP.challenge} XP each.
            </p>
            <div className="mh-grid">
              {challenges.map((c) => {
                const done = Boolean(progress.challenges[c.id]);
                return (
                  <article key={c.id} className="mh-card">
                    <h3>{c.label}</h3>
                    <p>{c.detail}</p>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy || done}
                      onClick={() =>
                        void postAction({
                          type: "completeChallenge",
                          challengeId: c.id,
                        })
                      }
                    >
                      {done ? "Completed" : "Mark complete"}
                    </button>
                  </article>
                );
              })}
            </div>
            <div className="mh-collections">
              <h3>Library Collections</h3>
              <ul>
                {LIBRARY_COLLECTIONS.map((c) => (
                  <li key={c.id}>
                    <span aria-hidden>{c.emoji}</span> {c.title}{" "}
                    <em>
                      {progress.collectionProgress[c.id] || 0}/{c.need}
                    </em>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {tab === "thoughts" && (
          <section className="mh-section">
            <h2>Thought Experiments</h2>
            <p className="mh-section-lead">
              One deep question each week. Share a thoughtful reply (+
              {LIBRARY_XP.thought + LIBRARY_XP.reflection} XP).
            </p>
            <article className="mh-card">
              <h3>{thought.question}</h3>
              <form
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  void postAction({
                    type: "submitThought",
                    promptId: thought.id,
                    body: thoughtBody,
                  }).then((p) => {
                    if (p) {
                      setThoughtBody("");
                      setToast("Your reflection joined the quiet circle.");
                    }
                  });
                }}
              >
                <label>
                  <span>Your response</span>
                  <textarea
                    rows={5}
                    value={thoughtBody}
                    onChange={(e) => setThoughtBody(e.target.value)}
                    disabled={busy}
                    placeholder="Write with ink and honesty…"
                    required
                    minLength={12}
                  />
                </label>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={busy || thoughtBody.trim().length < 12}
                >
                  Submit reflection
                </button>
              </form>
            </article>
            <div className="mh-thought-list">
              <h3>From fellow Archivists</h3>
              {progress.thoughts.length === 0 ? (
                <p className="muted">No replies yet — be the first candle.</p>
              ) : (
                <ul>
                  {progress.thoughts.map((t) => (
                    <li key={t.id}>
                      <strong>{t.authorName}</strong>
                      <p>{t.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {tab === "archives" && (
          <section className="mh-section">
            <h2>Mosshollow Archives</h2>
            <p className="mh-section-lead">
              Exclusive broadcasts for Mosshollow villagers — mark favorites and
              completed viewings.
            </p>
            <div className="mh-grid archives">
              {ARCHIVE_CLIPS.map((clip) => {
                const state = progress.archives[clip.id] || {};
                return (
                  <article key={clip.id} className="mh-card mh-archive-card">
                    <div className="mh-thumb" aria-hidden>
                      {clip.emoji}
                    </div>
                    <h3>{clip.title}</h3>
                    <p className="mh-meta">
                      {clip.category} · {clip.duration}
                    </p>
                    <div className="mh-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() =>
                          void postAction({
                            type: "archive",
                            clipId: clip.id,
                            favorite: !state.favorite,
                          })
                        }
                      >
                        {state.favorite ? "Favorited" : "Favorite"}
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={busy || state.completed}
                        onClick={() =>
                          void postAction({
                            type: "archive",
                            clipId: clip.id,
                            completed: true,
                            progress: 100,
                          })
                        }
                      >
                        {state.completed ? "Completed" : "Mark completed"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "journal" && (
          <section className="mh-section">
            <h2>Archivist Journal</h2>
            <p className="mh-section-lead">
              An old leather-bound notebook of everything you&apos;ve uncovered.
            </p>
            <form
              className="mh-card mh-journal-form"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void postAction({
                  type: "journalEntry",
                  activityName: journalName,
                  note: journalNote,
                  quote: journalQuote,
                }).then((p) => {
                  if (p) {
                    setJournalName("");
                    setJournalNote("");
                    setJournalQuote("");
                    setToast("Journal page pressed into the ledger.");
                  }
                });
              }}
            >
              <h3>New page</h3>
              <label>
                <span>Activity</span>
                <input
                  value={journalName}
                  onChange={(e) => setJournalName(e.target.value)}
                  disabled={busy}
                  required
                  maxLength={120}
                />
              </label>
              <label>
                <span>Reflection</span>
                <textarea
                  rows={4}
                  value={journalNote}
                  onChange={(e) => setJournalNote(e.target.value)}
                  disabled={busy}
                  required
                />
              </label>
              <label>
                <span>Favorite quote (optional)</span>
                <input
                  value={journalQuote}
                  onChange={(e) => setJournalQuote(e.target.value)}
                  disabled={busy}
                  maxLength={500}
                />
              </label>
              <button type="submit" className="btn-primary" disabled={busy}>
                Save to journal
              </button>
            </form>

            {progress.journal.length === 0 ? (
              <p className="muted">Your first page is waiting.</p>
            ) : (
              <div className="mh-journal-pages">
                {progress.journal.map((entry) => (
                  <article key={entry.id} className="mh-journal-page">
                    <header>
                      <time dateTime={entry.createdAt}>
                        {new Date(
                          entry.createdAt.replace(" ", "T") + "Z"
                        ).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                      <span>+{entry.xpEarned} XP</span>
                    </header>
                    <h3>{entry.activityName}</h3>
                    <p>{entry.note}</p>
                    {entry.quote ? (
                      <blockquote>“{entry.quote}”</blockquote>
                    ) : null}
                  </article>
                ))}
              </div>
            )}

            {progress.badges.length > 0 ? (
              <div className="mh-badges">
                <h3>Badges & stamps</h3>
                <ul>
                  {progress.badges.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                  {progress.stamps.map((s) => (
                    <li key={s}>Stamp · {s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        )}
      </div>

      {user.isOwner ? (
        <div style={{ marginTop: "1rem" }}>
          <LibraryAdminEditor onChanged={() => void refreshShelves()} />
        </div>
      ) : null}

      {reader ? (
        <LibraryBookReader
          bookId={reader.bookId}
          title={reader.title}
          author={reader.author}
          fileUrl={reader.fileUrl}
          fileName={reader.fileName}
          initialPosition={
            progress.readingPositions?.[reader.bookId] || null
          }
          onClose={() => setReader(null)}
          onProgressSaved={({ bookId, percent, position }) => {
            setProgress((prev) => ({
              ...prev,
              bookProgress: {
                ...prev.bookProgress,
                [bookId]: Math.max(prev.bookProgress[bookId] || 0, percent),
              },
              readingStatus: {
                ...prev.readingStatus,
                [bookId]:
                  percent >= 100
                    ? "finished"
                    : percent > 0
                      ? "reading"
                      : prev.readingStatus[bookId] || "none",
              },
              readingPositions: {
                ...prev.readingPositions,
                [bookId]: position,
              },
            }));
          }}
        />
      ) : null}
    </div>
  );
}
