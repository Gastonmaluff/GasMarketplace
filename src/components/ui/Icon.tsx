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
  | 'alert';

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
