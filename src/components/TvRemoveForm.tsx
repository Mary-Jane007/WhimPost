"use client";

/** Owner × control that works even when React never hydrates. */
export function TvRemoveForm({
  action,
  id,
  label,
  returnTo = "/tv-corner",
  disabled,
  onRemove,
}: {
  action: "/api/tv/videos" | "/api/tv/channels";
  id: string;
  label: string;
  returnTo?: string;
  disabled?: boolean;
  /** When React hydrates, prefer this over a full page reload. */
  onRemove?: (id: string) => void | Promise<void>;
}) {
  return (
    <form
      className="tv-remove-form"
      action={action}
      method="post"
      onSubmit={(e) => {
        if (!onRemove) return;
        e.preventDefault();
        void onRemove(id);
      }}
    >
      <input type="hidden" name="intent" value="remove" />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next" value={returnTo} />
      <button
        type="submit"
        className="tv-video-remove"
        disabled={disabled}
        aria-label={label}
        title={label}
      >
        ×
      </button>
    </form>
  );
}
