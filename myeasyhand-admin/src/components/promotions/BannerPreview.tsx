'use client';

import { Box, Typography, Stack, Chip, Card, CardContent, ToggleButton, ToggleButtonGroup, Link, Button } from '@mui/material';
import { IconExternalLink, IconLink, IconCopy } from '@tabler/icons-react';
import { BannerType, BannerTextPosition, ServiceItem } from '@/lib/api';

export type BannerPreviewData = {
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerImageWeb?: string;
  bannerImageMobile?: string;
  bannerType: BannerType;
  showImageOnly?: boolean;
  textPosition: BannerTextPosition;
  linkUrl?: string;
  htmlContent?: string;
  couponCode?: string;
  maxItems?: number;
};

function textPositionFlex(position: BannerTextPosition) {
  const map: Record<BannerTextPosition, { justifyContent: string; alignItems: string; textAlign: string }> = {
    'top-left': { justifyContent: 'flex-start', alignItems: 'flex-start', textAlign: 'left' },
    'top-center': { justifyContent: 'center', alignItems: 'flex-start', textAlign: 'center' },
    'top-right': { justifyContent: 'flex-end', alignItems: 'flex-start', textAlign: 'right' },
    'center-left': { justifyContent: 'flex-start', alignItems: 'center', textAlign: 'left' },
    center: { justifyContent: 'center', alignItems: 'center', textAlign: 'center' },
    'center-right': { justifyContent: 'flex-end', alignItems: 'center', textAlign: 'right' },
    'bottom-left': { justifyContent: 'flex-start', alignItems: 'flex-end', textAlign: 'left' },
    'bottom-center': { justifyContent: 'center', alignItems: 'flex-end', textAlign: 'center' },
    'bottom-right': { justifyContent: 'flex-end', alignItems: 'flex-end', textAlign: 'right' },
  };
  return map[position];
}

function resolveBannerImage(data: BannerPreviewData, viewport: 'web' | 'mobile'): string | undefined {
  if (viewport === 'mobile') {
    return data.bannerImageMobile || data.bannerImageWeb;
  }
  return data.bannerImageWeb || data.bannerImageMobile;
}

function PreviewServiceCard({ service, index }: { service?: ServiceItem; index: number }) {
  return (
    <Card
      variant="outlined"
      sx={{
        minWidth: 120,
        maxWidth: 120,
        flexShrink: 0,
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          height: 72,
          bgcolor: 'grey.200',
          backgroundImage: service?.image ? `url(${service.image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!service?.image && (
          <Typography variant="caption" color="text.secondary">
            {index + 1}
          </Typography>
        )}
      </Box>
      <CardContent sx={{ py: 0.75, px: 1, '&:last-child': { pb: 0.75 } }}>
        <Typography variant="caption" sx={{ fontWeight: 600 }} noWrap>
          {service?.name ?? `Service ${index + 1}`}
        </Typography>
      </CardContent>
    </Card>
  );
}

const BANNER_TYPE_LABELS: Record<BannerType, string> = {
  services: 'Services',
  link: 'Link',
  html: 'HTML Page',
  coupon: 'Coupon',
};

export default function BannerPreview({
  data,
  services = [],
  compact = false,
  viewport = 'web',
  onViewportChange,
}: {
  data: BannerPreviewData;
  services?: ServiceItem[];
  compact?: boolean;
  viewport?: 'web' | 'mobile';
  onViewportChange?: (viewport: 'web' | 'mobile') => void;
}) {
  const {
    bannerTitle,
    bannerSubtitle,
    bannerType,
    showImageOnly = false,
    textPosition,
    linkUrl,
    htmlContent,
    couponCode,
    maxItems = 6,
  } = data;

  const imageUrl = resolveBannerImage(data, viewport);
  const flex = textPositionFlex(textPosition);
  const cardCount = Math.min(maxItems, 6);
  const previewServices =
    services.length > 0
      ? services.slice(0, cardCount)
      : Array.from({ length: Math.min(cardCount, 4) }, (_, i) => undefined);

  const bannerHeight = viewport === 'mobile' ? (compact ? 140 : 160) : compact ? 160 : 200;

  return (
    <Box
      sx={{
        bgcolor: 'grey.100',
        borderRadius: 2,
        p: compact ? 1.5 : 2,
        border: '1px dashed',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ mb: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          PREVIEW
        </Typography>
        <Chip size="small" label={BANNER_TYPE_LABELS[bannerType]} variant="outlined" />
        {showImageOnly && <Chip size="small" label="Image only" color="info" />}
        {onViewportChange ? (
          <ToggleButtonGroup
            size="small"
            exclusive
            value={viewport}
            onChange={(_, val) => val && onViewportChange(val)}
          >
            <ToggleButton value="web">Web</ToggleButton>
            <ToggleButton value="mobile">Mobile</ToggleButton>
          </ToggleButtonGroup>
        ) : (
          <Chip size="small" label={viewport === 'mobile' ? 'Mobile' : 'Web'} variant="outlined" />
        )}
      </Stack>

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          height: bannerHeight,
          maxWidth: viewport === 'mobile' ? 375 : '100%',
          mx: viewport === 'mobile' ? 'auto' : 0,
          bgcolor: 'grey.300',
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!imageUrl && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              No {viewport} banner image
            </Typography>
          </Box>
        )}

        {!showImageOnly && imageUrl && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%)',
            }}
          />
        )}

        {!showImageOnly && (
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            justifyContent: flex.justifyContent,
            alignItems: flex.alignItems,
            p: 2,
          }}
        >
          <Box sx={{ maxWidth: viewport === 'mobile' ? '90%' : '70%', textAlign: flex.textAlign as 'left' | 'center' | 'right' }}>
            <Typography
              variant={compact ? 'subtitle1' : 'h6'}
              sx={{ color: imageUrl ? '#fff' : 'text.primary', fontWeight: 700, textShadow: imageUrl ? '0 1px 4px rgba(0,0,0,0.5)' : 'none' }}
            >
              {bannerTitle || 'Banner Title'}
            </Typography>
            {bannerSubtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: imageUrl ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                  mt: 0.5,
                  textShadow: imageUrl ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                }}
              >
                {bannerSubtitle}
              </Typography>
            )}
            {bannerType === 'coupon' && (
              <Button
                size="small"
                variant="contained"
                startIcon={<IconCopy size={14} />}
                sx={{
                  mt: 1.5,
                  bgcolor: 'common.white',
                  color: 'text.primary',
                  '&:hover': { bgcolor: 'grey.100' },
                  textTransform: 'none',
                }}
              >
                Copy Coupon Code
              </Button>
            )}
          </Box>
        </Box>
        )}
      </Box>

      {bannerType === 'services' && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: 'auto', pb: 0.5 }}>
          {previewServices.map((service, i) => (
            <PreviewServiceCard key={service?._id ?? i} service={service} index={i} />
          ))}
        </Stack>
      )}

      {bannerType === 'link' && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
          <IconLink size={16} />
          {linkUrl ? (
            <Link href={linkUrl} target="_blank" rel="noopener noreferrer" variant="body2" sx={{ wordBreak: 'break-all' }}>
              {linkUrl}
              <IconExternalLink size={14} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
            </Link>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Add a link URL
            </Typography>
          )}
        </Stack>
      )}

      {bannerType === 'coupon' && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
          {couponCode ? (
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
              Code: {couponCode}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Select an active coupon
            </Typography>
          )}
        </Stack>
      )}

      {bannerType === 'html' && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}>
            HTML PAGE CONTENT
          </Typography>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
              p: 2,
              minHeight: compact ? 80 : 120,
              maxHeight: compact ? 160 : 240,
              overflow: 'auto',
            }}
          >
            {htmlContent?.trim() ? (
              <Box
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                sx={{ '& img': { maxWidth: '100%' } }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Add HTML content in the editor
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
