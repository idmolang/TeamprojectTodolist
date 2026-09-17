function initials(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?";
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.42 }} title={name}>
      {initials(name)}
    </div>
  );
}

export function AvatarStack({ names, max = 4, size = 24 }: { names: string[]; max?: number; size?: number }) {
  if (names.length === 0) return null;
  const shown = names.slice(0, max);
  const overflow = names.length - shown.length;
  return (
    <div className="avatar-stack">
      {shown.map((name, i) => (
        <Avatar key={`${name}-${i}`} name={name} size={size} />
      ))}
      {overflow > 0 && (
        <div className="avatar avatar-more" style={{ width: size, height: size, fontSize: size * 0.38 }}>
          +{overflow}
        </div>
      )}
    </div>
  );
}
