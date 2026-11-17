// Small line icons shared by the cart and buy buttons.

type IconProps = { className?: string; size?: number };

function Svg({ className, size = 18, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

export function BagIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 7h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 7Z" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </Svg>
  );
}

/** Chat bubble with a handset, used for "Order on WhatsApp". */
export function ChatIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3.5 20.5 4.8 16.4A8.5 8.5 0 1 1 8 19.3L3.5 20.5Z" />
      <path d="M9.2 8.6c.2-.4.5-.5.8-.5h.4l.8 1.8-.6.8c.4.9 1.2 1.7 2.1 2.1l.8-.6 1.8.8v.4c0 .3-.1.6-.5.8-.6.4-1.5.5-2.6-.1a7 7 0 0 1-2.9-2.9c-.6-1.1-.5-2 .1-2.6Z" />
    </Svg>
  );
}

export function MinusIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 12h14" />
    </Svg>
  );
}

export function PlusIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function TrashIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
    </Svg>
  );
}

export function AlertIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4.5M12 16h.01" />
    </Svg>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function ArrowIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}
