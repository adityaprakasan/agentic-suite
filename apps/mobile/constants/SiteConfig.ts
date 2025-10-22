export const siteConfig = {
  name: "Adentic",
  url: "https://tryadentic.com",
  description: "Adentic is the AI marketing intelligence workspace that combines video analytics, competitive research, content strategy, and campaign automation—turning insights into execution across every channel.",
  keywords: [
    'AI marketing',
    'marketing intelligence',
    'video analytics',
    'competitive research',
    'content strategy',
    'campaign automation',
    'marketing automation',
    'research',
    'data analysis',
    'marketing workspace',
  ],
  authors: [{ name: 'Adentic Team', url: 'https://tryadentic.com' }],
  creator: 'Adentic Team',
  publisher: 'Adentic Team',
  category: 'Technology',
  applicationName: 'Adentic',
  twitterHandle: '@adenticai',
  githubUrl: 'https://github.com/adentic/',
  
  // Mobile-specific configurations
  bundleId: {
    ios: 'workspace.tryadentic.com',
    android: 'workspace.tryadentic.com'
  },
  
  // Theme colors
  colors: {
    primary: '#000000',
    background: '#ffffff',
    theme: '#000000'
  }
};

// React Native metadata structure (for web builds)
export const mobileMetadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  category: siteConfig.category,
  applicationName: siteConfig.applicationName,
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    title: 'Adentic - AI Marketing Intelligence Workspace',
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: '/og-image-new.png',
        width: 1536,
        height: 1024,
        alt: 'Adentic - AI Marketing Intelligence Workspace',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Adentic - AI Marketing Intelligence Workspace',
    description: siteConfig.description,
    creator: siteConfig.twitterHandle,
    site: siteConfig.twitterHandle,
    images: [
      {
        url: '/og-image-new.png',
        width: 1536,
        height: 1024,
        alt: 'Adentic - AI Marketing Intelligence Workspace',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/favicon.png', sizes: 'any' },
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: siteConfig.url,
  },
}; 