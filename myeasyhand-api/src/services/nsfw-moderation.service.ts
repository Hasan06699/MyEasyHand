import * as tf from '@tensorflow/tfjs-node';
import * as nsfwjs from 'nsfwjs';
import sharp from 'sharp';
import { config } from '../config';
import { ValidationError } from '../common/errors/AppError';
import { logger } from '../common/utils/logger';

type NsfwModel = nsfwjs.NSFWJS;
type NsfwPrediction = { className: string; probability: number };

const BLOCKED_CATEGORIES = ['Porn', 'Hentai', 'Sexy'] as const;

let modelPromise: Promise<NsfwModel> | null = null;

async function loadModel(): Promise<NsfwModel> {
  if (!modelPromise) {
    const modelName = config.nsfwModeration.model;
    modelPromise = nsfwjs.load(modelName);
  }
  return modelPromise;
}

function evaluateImage(predictions: NsfwPrediction[]): void {
  const porn = predictions.find((p) => p.className === 'Porn')?.probability ?? 0;
  const hentai = predictions.find((p) => p.className === 'Hentai')?.probability ?? 0;
  const sexy = predictions.find((p) => p.className === 'Sexy')?.probability ?? 0;
  const neutral = predictions.find((p) => p.className === 'Neutral')?.probability ?? 0;

  logger.info('Image NSFW scan', {
    porn: porn.toFixed(3),
    hentai: hentai.toFixed(3),
    sexy: sexy.toFixed(3),
    neutral: neutral.toFixed(3),
  });

  const { pornThreshold, hentaiThreshold, sexyThreshold, combinedThreshold } = config.nsfwModeration;

  if (porn >= pornThreshold || hentai >= hentaiThreshold) {
    logger.warn('Image upload blocked', { porn, hentai, sexy });
    throw new ValidationError(
      'This image was rejected because it appears to contain inappropriate or illegal content.',
    );
  }

  if (porn + hentai >= combinedThreshold) {
    logger.warn('Image upload blocked (combined)', { porn, hentai, sexy });
    throw new ValidationError(
      'This image was rejected because it appears to contain inappropriate or illegal content.',
    );
  }

  if (sexy >= sexyThreshold) {
    logger.warn('Image upload blocked (sexy)', { porn, hentai, sexy });
    throw new ValidationError(
      'This image was rejected because it appears to contain inappropriate or illegal content.',
    );
  }

  const top = [...predictions].sort((a, b) => b.probability - a.probability)[0];
  if (
    top &&
    (BLOCKED_CATEGORIES as readonly string[]).includes(top.className) &&
    top.probability >= config.nsfwModeration.topClassThreshold &&
    neutral < 0.8
  ) {
    logger.warn('Image upload blocked (top class)', {
      topClass: top.className,
      probability: top.probability,
      neutral,
    });
    throw new ValidationError(
      'This image was rejected because it appears to contain inappropriate or illegal content.',
    );
  }
}

async function bufferToTensor(buffer: Buffer): Promise<tf.Tensor3D> {
  const jpegBuffer = await sharp(buffer)
    .resize(299, 299, { fit: 'cover' })
    .jpeg()
    .toBuffer();
  const decoded = tf.node.decodeImage(jpegBuffer, 3);

  try {
    if (decoded.rank === 4) {
      const frame = tf.squeeze(decoded) as tf.Tensor3D;
      decoded.dispose();
      return frame;
    }
    return decoded as tf.Tensor3D;
  } catch (error) {
    decoded.dispose();
    throw error;
  }
}

export class NsfwModerationService {
  static async warmup(): Promise<void> {
    if (!config.nsfwModeration.enabled) {
      logger.info('NSFW moderation is disabled');
      return;
    }

    try {
      await loadModel();
      logger.info(`NSFW moderation ready (all image uploads, model: ${config.nsfwModeration.model})`);
    } catch (error) {
      logger.error('Failed to preload NSFW moderation model', error);
    }
  }

  /** NSFW check for all image uploads on the server. */
  static async assertImageSafe(buffer: Buffer): Promise<void> {
    if (!config.nsfwModeration.enabled) return;

    let image: tf.Tensor3D | null = null;

    try {
      const model = await loadModel();
      image = await bufferToTensor(buffer);
      const predictions = await model.classify(image);
      evaluateImage(predictions);
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      logger.error('Image NSFW scan failed', error);
      throw new ValidationError('Unable to verify image content. Please try a different image.');
    } finally {
      image?.dispose();
    }
  }

  /** @deprecated Use assertImageSafe */
  static async assertCategoryImageSafe(buffer: Buffer): Promise<void> {
    return this.assertImageSafe(buffer);
  }
}
