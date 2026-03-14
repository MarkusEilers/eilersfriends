interface TestimonialCardProps {
  quote: string
  authorName: string
  authorRole: string
  authorCompany?: string
  avatarUrl?: string
}

export function TestimonialCard({
  quote,
  authorName,
  authorRole,
  authorCompany,
  avatarUrl,
}: TestimonialCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col gap-4">
      {/* Stars */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="text-amber text-sm" style={{ color: '#B07C0A' }}>★</span>
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-sm leading-relaxed text-gray-700 flex-1">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={authorName}
            className="h-10 w-10 rounded-full object-cover grayscale"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
            {authorName.charAt(0)}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-900">{authorName}</p>
          <p className="text-xs text-gray-500">
            {authorRole}{authorCompany && `, ${authorCompany}`}
          </p>
        </div>
      </div>
    </div>
  )
}
