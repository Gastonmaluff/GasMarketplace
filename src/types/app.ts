export type AppFeature = 'publicArea' | 'internalDemo' | 'firebase';
export type VisualDensity = 'comfortable' | 'compact';

export interface AppConfig {
  name: string;
  description: string;
  branding: {
    logoFull: string;
    logoCompact: string;
  };
  theme: {
    primary: string;
    secondary: string;
    sidebar: string;
    borderRadius: string;
    density: VisualDensity;
    sidebarExpandedWidth: string;
    sidebarCollapsedWidth: string;
  };
  locale: string;
  timezone: string;
  currency: string;
  features: Record<AppFeature, boolean>;
}
