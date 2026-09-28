import JoinRedirectClient from '@/components/JoinRedirectClient';

export function generateMetadata({ params }) {
  return {
    title: `Join ${params.slug.toUpperCase()} Node | Sofe Node`,
    description: `Connect with your local campus node and join the official WhatsApp student chapter.`,
  };
}

export default function JoinChapterPage({ params }) {
  return <JoinRedirectClient slug={params.slug} />;
}
