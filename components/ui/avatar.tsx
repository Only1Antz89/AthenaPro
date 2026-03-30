export function Avatar({
  name,
  size = "md"
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const dimensions =
    size === "sm" ? "h-9 w-9 text-xs" : size === "lg" ? "h-14 w-14 text-base" : "h-11 w-11 text-sm";

  return (
    <div
      className={`inline-flex ${dimensions} items-center justify-center rounded-full bg-gradient-to-br from-accent to-teal-400 font-semibold text-white`}
    >
      {initials}
    </div>
  );
}
