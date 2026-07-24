"use client";

import { useState } from "react";
import type { LibraryBookRecord, LibraryShelf } from "@/lib/libraryBooks";
import type {
  ClubBook,
  ReadingCategory,
  ReadingListBook,
} from "@/lib/libraryContent";
import { ShelfBookCoverAttach } from "@/components/ShelfBookCoverAttach";
import { ShelfBookFileAttach } from "@/components/ShelfBookFileAttach";

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

type ShelfRow = {
  id: string;
  shelf: LibraryShelf;
  title: string;
  author: string;
  coverEmoji?: string;
  coverUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
};

export function LibraryAdminEditor({
  onChanged,
}: {
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [books, setBooks] = useState<LibraryBookRecord[]>([]);
  const [shelfRows, setShelfRows] = useState<ShelfRow[]>([]);
  const [shelf, setShelf] = useState<LibraryShelf>("club");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("180");
  const [coverEmoji, setCoverEmoji] = useState("📖");
  const [quotes, setQuotes] = useState("");
  const [reflections, setReflections] = useState("");
  const [category, setCategory] = useState<ReadingCategory>("Classic Literature");
  const [difficulty, setDifficulty] =
    useState<ReadingListBook["difficulty"]>("Gentle");
  const [length, setLength] = useState<ReadingListBook["length"]>("Medium");
  const [mood, setMood] = useState("Cozy");
  const [themes, setThemes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "missing" | "ready">("all");

  async function load() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/library/books?admin=1");
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not load library books");
      return;
    }
    setBooks(data.books || []);
    const club = (data.clubBooks || []) as ClubBook[];
    const reading = (data.readingList || []) as ReadingListBook[];
    setShelfRows([
      ...club.map((b) => ({
        id: b.id,
        shelf: "club" as const,
        title: b.title,
        author: b.author,
        coverEmoji: b.coverEmoji,
        coverUrl: b.coverUrl,
        fileUrl: b.fileUrl,
        fileName: b.fileName,
      })),
      ...reading.map((b) => ({
        id: b.id,
        shelf: "readinglist" as const,
        title: b.title,
        author: b.author,
        coverEmoji: b.coverEmoji,
        coverUrl: b.coverUrl,
        fileUrl: b.fileUrl,
        fileName: b.fileName,
      })),
    ]);
  }

  function toggleOpen() {
    setOpen((wasOpen) => {
      const next = !wasOpen;
      if (next) void load();
      return next;
    });
  }

  function resetForm() {
    setTitle("");
    setAuthor("");
    setDescription("");
    setMinutes("180");
    setCoverEmoji("📖");
    setQuotes("");
    setReflections("");
    setThemes("");
    setMood("Cozy");
    setFile(null);
    setCover(null);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");
    const form = new FormData();
    form.set("shelf", shelf);
    form.set("title", title);
    form.set("author", author);
    form.set("description", description);
    form.set("minutes", minutes);
    form.set("coverEmoji", coverEmoji);
    form.set("quotes", quotes);
    form.set("reflections", reflections);
    form.set("category", category);
    form.set("difficulty", difficulty);
    form.set("length", length);
    form.set("mood", mood);
    form.set("themes", themes);
    form.set("published", "1");
    if (file) form.set("file", file);
    if (cover) form.set("cover", cover);

    const res = await fetch("/api/library/books", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save book");
      return;
    }
    setStatus(`Shelved “${data.book?.title || title}”.`);
    resetForm();
    void load();
    onChanged?.();
  }

  async function onDelete(id: string, bookTitle: string) {
    if (!window.confirm(`Remove “${bookTitle}” from the Grand Library?`)) return;
    setError("");
    const res = await fetch("/api/library/books", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not remove book");
      return;
    }
    setStatus(`Removed “${bookTitle}”.`);
    void load();
    onChanged?.();
  }

  const filteredShelf = shelfRows.filter((b) => {
    if (filter === "missing") return !b.fileUrl;
    if (filter === "ready") return Boolean(b.fileUrl);
    return true;
  });

  return (
    <section className="welcome-editor forest-panel">
      <button
        type="button"
        className="btn-secondary"
        onClick={toggleOpen}
      >
        {open ? "Close library shelves" : "📚 Owner · Upload library books"}
      </button>
      {open ? (
        <div className="welcome-editor-body">
          <p className="lede">
            Add cover images and PDF/EPUB files to books already on the shelf, or
            add a brand-new title. Covers show on the Book Club and Owl&apos;s
            Reading List.
          </p>

          <div className="mh-admin-list">
            <h3>Covers &amp; files on shelf books</h3>
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
                className={filter === "missing" ? "active" : ""}
                onClick={() => setFilter("missing")}
              >
                Need a file
              </button>
              <button
                type="button"
                className={filter === "ready" ? "active" : ""}
                onClick={() => setFilter("ready")}
              >
                Have a file
              </button>
            </div>
            {loading ? <p className="muted">Loading shelves…</p> : null}
            {!loading && filteredShelf.length === 0 ? (
              <p className="muted">No books match this filter.</p>
            ) : null}
            <ul>
              {filteredShelf.map((b) => (
                <li key={`${b.shelf}-${b.id}`}>
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
                      <div className="muted">
                        {b.coverUrl ? "Cover set" : "No cover"}
                        {" · "}
                        {b.fileUrl ? (
                          <a href={b.fileUrl} target="_blank" rel="noreferrer">
                            Open {b.fileName || "file"}
                          </a>
                        ) : (
                          "No file yet"
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mh-owner-book-tools">
                    <ShelfBookCoverAttach
                      bookId={b.id}
                      bookTitle={b.title}
                      hasCover={Boolean(b.coverUrl)}
                      onAttached={() => {
                        void load();
                        onChanged?.();
                      }}
                    />
                    <ShelfBookFileAttach
                      bookId={b.id}
                      bookTitle={b.title}
                      hasFile={Boolean(b.fileUrl)}
                      onAttached={() => {
                        void load();
                        onChanged?.();
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <h3 className="mh-admin-subhead">Add a new book</h3>
          <form className="auth-form" onSubmit={onSave}>
            <label>
              Shelf
              <select
                value={shelf}
                onChange={(e) => setShelf(e.target.value as LibraryShelf)}
              >
                <option value="club">Monthly Book Club</option>
                <option value="readinglist">Owl&apos;s Reading List</option>
              </select>
            </label>
            <label>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
              />
            </label>
            <label>
              Author
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                maxLength={80}
              />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={2000}
              />
            </label>
            <div className="mh-admin-row">
              <label>
                Cover emoji
                <input
                  value={coverEmoji}
                  onChange={(e) => setCoverEmoji(e.target.value)}
                  maxLength={8}
                />
              </label>
              <label>
                Minutes
                <input
                  type="number"
                  min={1}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
              </label>
            </div>
            {shelf === "readinglist" ? (
              <>
                <label>
                  Category
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as ReadingCategory)
                    }
                  >
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
                    <select
                      value={difficulty}
                      onChange={(e) =>
                        setDifficulty(
                          e.target.value as ReadingListBook["difficulty"]
                        )
                      }
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Length
                    <select
                      value={length}
                      onChange={(e) =>
                        setLength(e.target.value as ReadingListBook["length"])
                      }
                    >
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
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    maxLength={80}
                  />
                </label>
                <label>
                  Themes (one per line)
                  <textarea
                    value={themes}
                    onChange={(e) => setThemes(e.target.value)}
                    rows={2}
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Quotes (one per line)
                  <textarea
                    value={quotes}
                    onChange={(e) => setQuotes(e.target.value)}
                    rows={2}
                  />
                </label>
                <label>
                  Reflections (one per line)
                  <textarea
                    value={reflections}
                    onChange={(e) => setReflections(e.target.value)}
                    rows={2}
                  />
                </label>
              </>
            )}
            <label>
              Book file (PDF or EPUB)
              <input
                type="file"
                accept=".pdf,.epub,application/pdf,application/epub+zip"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <label>
              Cover image (optional)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setCover(e.target.files?.[0] || null)}
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            {status ? <p className="form-success">{status}</p> : null}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Shelving…" : "Add book to library"}
            </button>
          </form>

          <div className="mh-admin-list">
            <h3>Uploaded / attached records</h3>
            {!loading && books.length === 0 ? (
              <p className="muted">No owner file records yet.</p>
            ) : null}
            <ul>
              {books.map((b) => (
                <li key={b.id}>
                  <div>
                    <strong>
                      {b.coverEmoji} {b.title}
                    </strong>
                    <span className="muted">
                      {" "}
                      · {b.author} ·{" "}
                      {b.shelf === "club" ? "Book Club" : "Reading List"}
                    </span>
                    {b.fileUrl ? (
                      <div>
                        <a href={b.fileUrl} target="_blank" rel="noreferrer">
                          Open file
                        </a>
                      </div>
                    ) : (
                      <div className="muted">No file attached</div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => void onDelete(b.id, b.title)}
                  >
                    Remove file
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
