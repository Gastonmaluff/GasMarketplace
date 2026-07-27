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
  | 'box';

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
