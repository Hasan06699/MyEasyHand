import { PromotionBannerPageClient } from '@/components/promotions/PromotionBannerPageClient';

export const metadata = {
  title: 'Promotion',
};

export default async function PromotionBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PromotionBannerPageClient id={id} />;
}
