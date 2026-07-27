"use client";

import { useMemo, useState } from "react";
import type { LibraryShelf } from "@/lib/libraryBooks";
import type {
  ClubBook,
  ReadingCategory,
  ReadingListBook,
} from "@/lib/libraryContent";
import { ShelfBookCoverAttach } from "@/components/ShelfBookCoverAttach";
import { ShelfBookFileAttach } from "@/components/ShelfBookFileAttach";
import { ShelfBookRemove } from "@/components/ShelfBookRemove";

const CATEGORIES: ReadingCategory[] = [
  "Fantasy",
  "Mystery",
  "Philosophy",
  "Psychology",
  "History",
  "Nature",
  "Science",
  "Classic Literature",
  "Poetry",
];

const DIFFICULTIES: ReadingListBook["difficulty"][] = [
  "Gentle",
  "Steady",
  "Dense",
];
const LENGTHS: ReadingListBook["length"][] = ["Short", "Medium", "Long"];

type EditableBook = {
  id: string;
  shelf: LibraryShelf;
  title: string;
  author: string;
  description: string;
  minutes: number;
  coverEmoji: string;
  coverUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  quotes: string;
  reflections: string;
  category: ReadingCategory;
  difficulty: ReadingListBook["difficulty"];
  length: ReadingListBook["length"];
  mood: string;
  themes: string;
};

function toEditable(
  book: ClubBook | ReadingListBook,
  shelf: LibraryShelf
): EditableBook {
  const club = "quotes" in book ? (book as ClubBook) : null;
  const reading = "category" in book ? (book as ReadingListBook) : null;
  return {
    id: book.id,
    shelf,
    title: book.title,
    author: book.author,
    description: club?.description || reading?.description || "",
    minutes: club?.minutes || 180,
    coverEmoji: book.coverEmoji || "📖",
    coverUrl: book.coverUrl,
    fileUrl: book.fileUrl,
    fileName: book.fileName,
    quotes: (club?.quotes || []).join("\n"),
    reflections: (club?.reflections || []).join("\n"),
    category: reading?.category || "Classic Literature",
    difficulty: reading?.difficulty || "Gentle",
    length: reading?.length || "Medium",
    mood: reading?.mood || "Cozy",
    themes: (reading?.themes || []).join("\n"),
  };
}

export function LibraryAdminEditor({
  clubBooks = [],
  readingList = [],
  daysUntilShuffle = 14,
  returnTo = "/library?tab=bookclub",
  onChanged,
}: {
  clubBooks?: ClubBook[];
  readingList?: ReadingListBook[];
  daysUntilShuffle?: number;
  returnTo?: string;
  onChanged?: () => void;
}) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "club" | "readinglist">("all");

  const shelfBooks = useMemo(() => {
    const rows = [
      ...(clubBooks || []).map((b) => toEditable(b, "club")),
      ...(readingList || []).map((b) => toEditable(b, "readinglist")),
    ];
    // De-dupe by id (rotation shelf may overlap reading list).
    const seen = new Set<string>();
    return rows.filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });
  }, [clubBooks, readingList]);

  const filtered = shelfBooks.filter((b) => {
    if (filter === "all") return true;
    return b.shelf === filter;
  });

  async function postForm(form: HTMLFormElement) {
    setSaving(true);
    setError("");
    setStatus("");
    const res = await fetch("/api/library/books", {
      method: "POST",
      body: new FormData(form),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save library changes");
      return;
    }
    if (data.removed) setStatus(`Removed “${data.removed}”.`);
    else if (data.moved) setStatus(`Moved “${data.book?.title || "book"}”.`);
    else if (data.shuffleSalt != null) setStatus("Book Club reshuffled.");
    else setStatus(`Saved “${data.book?.title || "book"}”.`);
    form.reset();
    onChanged?.();
  }

  return (
    <details className="welcome-editor forest-panel mh-admin-details">
      <summary className="btn-secondary mh-admin-summary">
        📚 Owner · Add &amp; edit library books
      </summary>
      <div className="welcome-editor-body">
        <p className="lede">
          Add new titles, edit Book Club copy, move books between shelves, or
          reshuffle the club. The Book Club pulls from the whole library and
          reshuffles about every two weeks
          {daysUntilShuffle
            ? ` (next automatic shuffle in ~${daysUntilShuffle} day${
                daysUntilShuffle === 1 ? "" : "s"
              })`
            : ""}
          .
        </p>

        <form
          className="mh-attach mh-admin-reshuffle"
          action="/api/library/books"
          method="post"
          onSubmit={(e) => {
            e.preventDefault();
            void postForm(e.currentTarget);
          }}
        >
          <input type="hidden" name="intent" value="reshuffle" />
          <input type="hidden" name="next" value={returnTo} />
          <button type="submit" className="btn-secondary" disabled={saving}>
            Shuffle Book Club now
          </button>
        </form>

        <h3 className="mh-admin-subhead">Add a new book</h3>
        <form
          className="auth-form"
          action="/api/library/books"
          method="post"
          encType="multipart/form-data"
          onSubmit={(e) => {
            e.preventDefault();
            void postForm(e.currentTarget);
          }}
        >
          <input type="hidden" name="next" value={returnTo} />
          <input type="hidden" name="published" value="1" />
          <label>
            Shelf
            <select name="shelf" defaultValue="club">
              <option value="club">Monthly Book Club</option>
              <option value="readinglist">Owl&apos;s Reading List</option>
            </select>
          </label>
          <label>
            Title
            <input name="title" required maxLength={120} />
          </label>
          <label>
            Author
            <input name="author" required maxLength={80} />
          </label>
          <label>
            Description
            <textarea name="description" rows={3} maxLength={2000} />
          </label>
          <div className="mh-admin-row">
            <label>
              Cover emoji
              <input name="coverEmoji" defaultValue="📖" maxLength={8} />
            </label>
            <label>
              Minutes
              <input
                type="number"
                name="minutes"
                min={1}
                defaultValue={180}
              />
            </label>
          </div>
          <label>
            Category (reading list)
            <select name="category" defaultValue="Classic Literature">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="mh-admin-row">
            <label>
              Difficulty
              <select name="difficulty" defaultValue="Gentle">
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Length
              <select name="length" defaultValue="Medium">
                {LENGTHS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Mood
            <input name="mood" defaultValue="Cozy" maxLength={80} />
          </label>
          <label>
            Themes (one per line)
            <textarea name="themes" rows={2} />
          </label>
          <label>
            Quotes (one per line)
            <textarea name="quotes" rows={2} />
          </label>
          <label>
            Reflections (one per line)
            <textarea name="reflections" rows={2} />
          </label>
          <label>
            Book file (PDF or EPUB)
            <input
              type="file"
              name="file"
              accept=".pdf,.epub,application/pdf,application/epub+zip"
            />
          </label>
          <label>
            Cover image (optional)
            <input
              type="file"
              name="cover"
              accept="image/jpeg,image/png,image/webp,image/gif"
            />
          </label>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Shelving…" : "Add book to library"}
          </button>
        </form>

        <div className="mh-admin-list">
          <h3>Edit Book Club &amp; shelves</h3>
          <div className="mh-chips mh-admin-filters">
            <button
              type="button"
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={filter === "club" ? "active" : ""}
              onClick={() => setFilter("club")}
            >
              Book Club
            </button>
            <button
              type="button"
              className={filter === "readinglist" ? "active" : ""}
              onClick={() => setFilter("readinglist")}
            >
              Reading List
            </button>
          </div>
          {filtered.length === 0 ? (
            <p className="muted">No books on this filter.</p>
          ) : null}
          <ul>
            {filtered.map((b) => (
              <li key={b.id}>
                <div className="mh-admin-book">
                  <span className="mh-shelf-thumb" aria-hidden>
                    {b.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.coverUrl} alt="" />
                    ) : (
                      <span>{b.coverEmoji || "📖"}</span>
                    )}
                  </span>
                  <div>
                    <strong>{b.title}</strong>
                    <span className="muted">
                      {" "}
                      · {b.author} ·{" "}
                      {b.shelf === "club" ? "Book Club" : "Reading List"}
                    </span>
                  </div>
                </div>

                <div className="mh-owner-book-tools">
                  <ShelfBookCoverAttach
                    bookId={b.id}
                    bookTitle={b.title}
                    hasCover={Boolean(b.coverUrl)}
                    returnTo={returnTo}
                    onAttached={() => onChanged?.()}
                  />
                  <ShelfBookFileAttach
                    bookId={b.id}
                    bookTitle={b.title}
                    hasFile={Boolean(b.fileUrl)}
                    returnTo={returnTo}
                    onAttached={() => onChanged?.()}
                  />
                  <form
                    className="mh-attach"
                    action="/api/library/books"
                    method="post"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void postForm(e.currentTarget);
                    }}
                  >
                    <input type="hidden" name="intent" value="set-shelf" />
                    <input type="hidden" name="bookId" value={b.id} />
                    <input type="hidden" name="next" value={returnTo} />
                    <input
                      type="hidden"
                      name="shelf"
                      value={b.shelf === "club" ? "readinglist" : "club"}
                    />
                    <button
                      type="submit"
                      className="btn-secondary mh-attach-btn"
                      disabled={saving}
                    >
                      {b.shelf === "club"
                        ? "Move to Reading List"
                        : "Move to Book Club"}
                    </button>
                  </form>
                  <ShelfBookRemove
                    bookId={b.id}
                    bookTitle={b.title}
                    returnTo={returnTo}
                    onRemoved={() => {
                      setStatus(`Removed “${b.title}”.`);
                      onChanged?.();
                    }}
                  />
                </div>

                <details className="mh-admin-edit">
                  <summary>Edit “{b.title}”</summary>
                  <form
                    className="auth-form"
                    action="/api/library/books"
                    method="post"
                    encType="multipart/form-data"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void postForm(e.currentTarget);
                    }}
                  >
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="next" value={returnTo} />
                    <input type="hidden" name="published" value="1" />
                    <label>
                      Shelf
                      <select name="shelf" defaultValue={b.shelf}>
                        <option value="club">Monthly Book Club</option>
                        <option value="readinglist">
                          Owl&apos;s Reading List
                        </option>
                      </select>
                    </label>
                    <label>
                      Title
                      <input
                        name="title"
                        required
                        maxLength={120}
                        defaultValue={b.title}
                      />
                    </label>
                    <label>
                      Author
                      <input
                        name="author"
                        required
                        maxLength={80}
                        defaultValue={b.author}
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        name="description"
                        rows={3}
                        maxLength={2000}
                        defaultValue={b.description}
                      />
                    </label>
                    <div className="mh-admin-row">
                      <label>
                        Cover emoji
                        <input
                          name="coverEmoji"
                          maxLength={8}
                          defaultValue={b.coverEmoji}
                        />
                      </label>
                      <label>
                        Minutes
                        <input
                          type="number"
                          name="minutes"
                          min={1}
                          defaultValue={b.minutes}
                        />
                      </label>
                    </div>
                    <label>
                      Category
                      <select name="category" defaultValue={b.category}>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="mh-admin-row">
                      <label>
                        Difficulty
                        <select name="difficulty" defaultValue={b.difficulty}>
                          {DIFFICULTIES.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Length
                        <select name="length" defaultValue={b.length}>
                          {LENGTHS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      Mood
                      <input
                        name="mood"
                        maxLength={80}
                        defaultValue={b.mood}
                      />
                    </label>
                    <label>
                      Themes (one per line)
                      <textarea
                        name="themes"
                        rows={2}
                        defaultValue={b.themes}
                      />
                    </label>
                    <label>
                      Quotes (one per line)
                      <textarea
                        name="quotes"
                        rows={2}
                        defaultValue={b.quotes}
                      />
                    </label>
                    <label>
                      Reflections (one per line)
                      <textarea
                        name="reflections"
                        rows={2}
                        defaultValue={b.reflections}
                      />
                    </label>
                    <label>
                      Replace book file (optional)
                      <input
                        type="file"
                        name="file"
                        accept=".pdf,.epub,application/pdf,application/epub+zip"
                      />
                    </label>
                    <label>
                      Replace cover image (optional)
                      <input
                        type="file"
                        name="cover"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                      />
                    </label>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={saving}
                    >
                      Save changes
                    </button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {status ? <p className="form-success">{status}</p> : null}
      </div>
    </details>
  );
}
