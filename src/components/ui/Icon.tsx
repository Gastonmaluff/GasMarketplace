export type IconName =
  | 'dashboard'
  | 'components'
  | 'menu'
  | 'collapse'
  | 'expand'
  | 'close'
  | 'search'
  | 'chevron'
  | 'user'
  | 'upload'
  | 'check'
  | 'alert'
  | 'settings'
  | 'tag'
  | 'box'
  | 'truck'
  | 'wallet'
  | 'refresh'
  | 'heart'
  | 'shield'
  | 'star'
  | 'cart'
  | 'chevron-down'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'filter'
  | 'dollar'
  | 'bell';

interface IconProps {
  name: IconName;
  size?: number;
}

const paths: Record<IconName, React.ReactNode> = {
  dashboard: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
  components: <path d="m12 3 4 4-4 4-4-4 4-4ZM5 13l4 4-4 4-4-4 4-4Zm14 0 4 4-4 4-4-4 4-4Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  collapse: <path d="m14 6-6 6 6 6M20 4v16" />,
  expand: <path d="m10 6 6 6-6 6M4 4v16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  search: <path d="m21 21-4.4-4.4M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  user: <path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />,
  upload: <path d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14" />,
  check: <path d="m5 12 4 4L19 6" />,
  alert: (
    <path d="M12 9v4m0 4h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
  ),
  settings: (
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.5-2.4 1a7.5 7.5 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.5 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.5 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.5-2-1.5c.1-.4.1-.8.1-1.2Z" />
  ),
  tag: (
    <path d="m20.6 13.4-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8ZM7.5 7.5h.01" />
  ),
  box: <path d="m21 8-9-5-9 5m18 0v8l-9 5m9-13-9 5m-9-5v8l9 5m-9-13 9 5m0 8V13" />,
  truck: (
    <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7M6.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
  ),
  wallet: (
    <path d="M3 7a2 2 0 0 1 2-2h12v4M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 7h16a1 1 0 0 1 1 1v3m0 0h-4a2 2 0 0 0 0 4h4" />
  ),
  refresh: <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />,
  heart: (
    <path d="M12 20s-7-4.3-9.3-8.5C1 8.5 2.5 5.5 5.5 5.5c2 0 3.3 1.2 4.5 2.8 1.2-1.6 2.5-2.8 4.5-2.8 3 0 4.5 3 2.8 6C19 15.7 12 20 12 20Z" />
  ),
  shield: <path d="M12 3 5 6v5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3ZM9 12l2 2 4-4" />,
  star: <path d="M12 3.5 14.6 9l6 .6-4.5 4 1.3 5.9L12 16.6 6.6 19.5 8 13.6 3.5 9.6l6-.6L12 3.5Z" />,
  cart: (
    <path d="M3 4h2l2.4 12.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 8H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
  ),
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3ZM13.5 7.5l3 3" />,
  trash: <path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13M10 11v5M14 11v5" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  dollar: (
    <path d="M12 3v18M16 7.5a4 4 0 0 0-4-2c-2.2 0-4 1.1-4 2.8 0 4.4 8 1.7 8 6 0 1.6-1.8 2.7-4 2.7a5 5 0 0 1-4.5-2.4" />
  ),
  bell: <path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7ZM10 20h4" />,
};

export function Icon({ name, size = 20 }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        {paths[name]}
      </g>
    </svg>
  );
}
