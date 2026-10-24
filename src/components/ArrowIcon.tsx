export default function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  const d =
    direction === "left"
      ? "M11.0833 7H2.91667M7 2.91667L2.91667 7L7 11.0833"
      : "M2.91667 7H11.0833M7 11.0833L11.0833 7L7 2.91667";
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={d} stroke="white" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
