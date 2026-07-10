'use client';

import { CSSProperties } from 'react';
import { Box, Typography, Stack, Chip, Card, CardContent, ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  ServiceRowBackground,
  ServiceRowSpacingByViewport,
  ServiceItem,
} from '@/lib/api';
import {
  DEFAULT_MARGIN,
  DEFAULT_PADDING,
  resolveSpacingSides,
} from '@/components/promotions/serviceRowSpacing';

export type ServiceRowPreviewData = {
  rowTitle: string;
  rowSubtitle?: string;
  background: ServiceRowBackground;
  rowMargin?: ServiceRowSpacingByViewport | ServiceRowSpacingByViewport['web'];
  rowPadding?: ServiceRowSpacingByViewport | ServiceRowSpacingByViewport['web'];
  maxItems?: number;
};

function getYoutubeEmbedUrl(url: string, autoplay: boolean, muted: boolean): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (!match) return null;
  const id = match[1];
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: muted ? '1' : '0',
    loop: '1',
    playlist: id,
    controls: '0',
    playsinline: '1',
    rel: '0',
  });
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

function resolveImageUrl(background: ServiceRowBackground, viewport: 'web' | 'mobile'): string | undefined {
  if (viewport === 'mobile') {
    return background.imageUrlMobile || background.imageUrlWeb || background.imageUrl;
  }
  return background.imageUrlWeb || background.imageUrlMobile || background.imageUrl;
}

function buildBackgroundStyle(background: ServiceRowBackground, viewport: 'web' | 'mobile'): CSSProperties {
  switch (background.type) {
    case 'color':
      return { backgroundColor: background.color ?? '#ffffff' };
    case 'gradient':
      return {
        background: `linear-gradient(${background.gradientAngle ?? 90}deg, ${background.gradientStart ?? '#31c1ca'}, ${background.gradientEnd ?? '#1e88e5'})`,
      };
    case 'image': {
      const imageUrl = resolveImageUrl(background, viewport);
      return imageUrl
        ? {
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : { backgroundColor: '#f5f5f5' };
    }
    default:
      return { backgroundColor: '#fafafa' };
  }
}

function needsLightText(background: ServiceRowBackground): boolean {
  if (background.type === 'gradient' || background.type === 'color') {
    return true;
  }
  return background.type === 'image' || background.type === 'video';
}

function PreviewServiceCard({ service, index }: { service?: ServiceItem; index: number }) {
  return (
    <Card
      variant="outlined"
      sx={{
        minWidth: 140,
        maxWidth: 140,
        flexShrink: 0,
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          height: 80,
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
            Service {index + 1}
          </Typography>
        )}
      </Box>
      <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
        <Typography variant="caption" sx={{ fontWeight: 600 }} noWrap>
          {service?.name ?? `Sample Service ${index + 1}`}
        </Typography>
        {service?.salePrice != null && (
          <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
            ₹{service.salePrice}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function ServiceRowPreview({
  data,
  services = [],
  compact = false,
  viewport = 'web',
  onViewportChange,
}: {
  data: ServiceRowPreviewData;
  services?: ServiceItem[];
  compact?: boolean;
  viewport?: 'web' | 'mobile';
  onViewportChange?: (viewport: 'web' | 'mobile') => void;
}) {
  const { rowTitle, rowSubtitle, background, rowMargin, rowPadding, maxItems = 4 } = data;
  const activeMargin = resolveSpacingSides(rowMargin, viewport, DEFAULT_MARGIN);
  const activePadding = resolveSpacingSides(rowPadding, viewport, DEFAULT_PADDING);
  const cardCount = Math.min(maxItems, 6);
  const previewServices =
    services.length > 0
      ? services.slice(0, cardCount)
      : Array.from({ length: Math.min(cardCount, 4) }, (_, i) => undefined);

  const lightText = needsLightText(background);
  const textColor = lightText && background.type !== 'none' ? '#fff' : 'text.primary';
  const subtextColor = lightText && background.type !== 'none' ? 'rgba(255,255,255,0.85)' : 'text.secondary';

  const autoplay = background.videoAutoplay !== false;
  const muted = background.videoMuted !== false;
  const youtubeEmbed =
    background.type === 'video' &&
    background.videoSource === 'youtube' &&
    background.youtubeUrl
      ? getYoutubeEmbedUrl(background.youtubeUrl, autoplay, muted)
      : null;

  const hasVideo =
    background.type === 'video' &&
    ((background.videoSource === 'youtube' && youtubeEmbed) ||
      (background.videoSource !== 'youtube' && background.videoUrl));

  const imageUrl = background.type === 'image' ? resolveImageUrl(background, viewport) : undefined;

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
        <Chip size="small" label={background.type} variant="outlined" />
        {background.type === 'image' && onViewportChange && (
          <ToggleButtonGroup
            size="small"
            exclusive
            value={viewport}
            onChange={(_, val) => val && onViewportChange(val)}
          >
            <ToggleButton value="web">Web</ToggleButton>
            <ToggleButton value="mobile">Mobile</ToggleButton>
          </ToggleButtonGroup>
        )}
        {!onViewportChange && (
          <Chip size="small" label={viewport === 'mobile' ? 'Mobile' : 'Web'} variant="outlined" />
        )}
        {background.type === 'video' && (
          <>
            <Chip size="small" label={background.videoSource === 'youtube' ? 'YouTube' : 'Upload'} />
            <Chip size="small" label={autoplay ? 'Autoplay' : 'No autoplay'} variant="outlined" />
            <Chip size="small" label={muted ? 'Sound off' : 'Sound on'} variant="outlined" />
          </>
        )}
      </Stack>

      <Box
        sx={{
          mt: `${activeMargin.top ?? 0}px`,
          mb: `${activeMargin.bottom ?? 0}px`,
          ml: `${activeMargin.left ?? 0}px`,
          mr: `${activeMargin.right ?? 0}px`,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 2,
            minHeight: compact ? 160 : 200,
            maxWidth: viewport === 'mobile' ? 375 : '100%',
            mx: viewport === 'mobile' ? 'auto' : 0,
            ...buildBackgroundStyle(background, viewport),
          }}
        >
          {background.type === 'video' && youtubeEmbed && (
            <Box
              component="iframe"
              src={youtubeEmbed}
              title="YouTube background"
              allow="autoplay; encrypted-media"
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 0,
                pointerEvents: 'none',
              }}
            />
          )}

          {background.type === 'video' &&
            background.videoSource !== 'youtube' &&
            background.videoUrl && (
              <Box
                component="video"
                src={background.videoUrl}
                autoPlay={autoplay}
                muted={muted}
                loop
                playsInline
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}

          {background.type === 'video' && !hasVideo && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'grey.300',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {background.videoSource === 'youtube' ? 'Add a YouTube URL' : 'No video uploaded'}
              </Typography>
            </Box>
          )}

          {background.type === 'image' && !imageUrl && (
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
                No {viewport} image uploaded
              </Typography>
            </Box>
          )}

          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              pt: `${activePadding.top ?? 16}px`,
              pb: `${activePadding.bottom ?? 16}px`,
              pl: `${activePadding.left ?? 16}px`,
              pr: `${activePadding.right ?? 16}px`,
            }}
          >
            <Typography variant={compact ? 'subtitle1' : 'h6'} sx={{ color: textColor, fontWeight: 700 }}>
              {rowTitle || 'Row Title'}
            </Typography>
            {rowSubtitle && (
              <Typography variant="body2" sx={{ color: subtextColor, mt: 0.5 }}>
                {rowSubtitle}
              </Typography>
            )}

            <Stack direction="row" spacing={1.5} sx={{ mt: 2, overflowX: 'auto', pb: 0.5 }}>
              {previewServices.map((service, i) => (
                <PreviewServiceCard key={service?._id ?? i} service={service} index={i} />
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
