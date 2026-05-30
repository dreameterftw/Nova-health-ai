import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NOVA — AI Health Intelligence',
    short_name: 'NOVA',
    description: 'Emotion-aware conversations, medical report analysis, and personalised recovery plans. Your private AI health companion.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F9FC',
    theme_color: '#5B5EF4',
    icons: [
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
