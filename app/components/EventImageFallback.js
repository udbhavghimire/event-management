/** Placeholder when an event has no cover image. */
const SIZES = {
  card: { wrapper: "h-40 w-full", emoji: "text-7xl" },
  detail: { wrapper: "w-full aspect-[21/9] sm:aspect-[2.4/1]", emoji: "text-8xl sm:text-9xl" },
  thumb: { wrapper: "w-full h-full min-h-[6rem]", emoji: "text-5xl" },
};

export default function EventImageFallback({ size = "card", className = "" }) {
  const s = SIZES[size] ?? SIZES.card;
  return (
    <div
      className={`bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100 flex items-center justify-center ${s.wrapper} ${className}`}
      aria-hidden
    >
      <span className={`${s.emoji} leading-none select-none`}>🎉</span>
    </div>
  );
}
