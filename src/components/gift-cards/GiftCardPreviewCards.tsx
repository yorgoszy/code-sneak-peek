import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { hyperkidsLogoBlack } from "@/assets/hyperkidsLogoBlack";
import { hyperkidsLogoWhite } from "@/assets/hyperkidsLogoWhite";
import { iconBlack } from "@/assets/iconBlack";

export const TRUST_MARK_TEXT = 'trust the process';

export interface GiftCardPreviewData {
  code: string;
  card_type: string;
  amount: number | null;
  sender_name: string | null;
  expires_at: string | null;
}

export interface PreviewImageAsset {
  src: string;
  width: number;
  height: number;
}

export const createTrustMarkImage = async (): Promise<PreviewImageAsset | null> => {
  const font = '26px UnifrakturMaguntia';
  if (document.fonts) {
    await document.fonts.load(font);
    await document.fonts.ready;
  }

  const scale = 4;
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) return null;

  measureCtx.font = font;
  const metrics = measureCtx.measureText(TRUST_MARK_TEXT);
  const width = Math.ceil(metrics.width + 2);
  const height = 30;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);
  ctx.font = font;
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'middle';
  ctx.fillText(TRUST_MARK_TEXT, 1, height / 2);

  return { src: canvas.toDataURL('image/png'), width, height };
};

export const createAmountImage = async (amount: number | null): Promise<PreviewImageAsset | null> => {
  const text = `€${amount || 0}`;
  const font = 'bold 24px "Robert Pro", "Roobert Pro", Arial, sans-serif';
  if (document.fonts) {
    await document.fonts.load(font);
    await document.fonts.ready;
  }

  const scale = 4;
  const width = 50;
  const height = 32;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);
  ctx.font = font;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width, height / 2);

  return { src: canvas.toDataURL('image/png'), width, height };
};

interface GiftCardPreviewFrontProps {
  giftCard: GiftCardPreviewData;
  subscriptionName: string | null;
  amountImage: PreviewImageAsset | null;
  capture?: boolean;
}

export const GiftCardPreviewFront = React.forwardRef<HTMLDivElement, GiftCardPreviewFrontProps>(({
  giftCard,
  subscriptionName,
  amountImage,
  capture = false,
}, ref) => {
  const expiryDate = giftCard.expires_at
    ? new Date(giftCard.expires_at).toLocaleDateString('el-GR')
    : '';

  return (
    <div
      ref={ref}
      data-bulk-card={capture ? 'true' : undefined}
      className="relative w-full aspect-[9/5] border border-gray-800 flex flex-col justify-between overflow-hidden shadow-2xl"
      style={{
        padding: '25px',
        backgroundColor: '#000',
        backgroundImage: `
          radial-gradient(ellipse at 20% 10%, rgba(180, 180, 180, 0.35) 0%, transparent 55%),
          radial-gradient(ellipse at 85% 25%, rgba(120, 120, 120, 0.3) 0%, transparent 55%),
          radial-gradient(ellipse at 70% 90%, rgba(200, 200, 200, 0.25) 0%, transparent 55%),
          radial-gradient(ellipse at 10% 80%, rgba(90, 90, 90, 0.3) 0%, transparent 55%),
          linear-gradient(135deg, #0a0a0a 0%, #1f1f1f 40%, #050505 100%)
        `,
      }}
    >
      <div className="flex items-start justify-between relative z-10">
        <img src={hyperkidsLogoWhite} alt="HYPERKIDS" className="h-8 object-contain" />
        {amountImage && (
          <img
            src={amountImage.src}
            alt={`€${giftCard.amount || 0}`}
            className="h-8 object-contain"
            style={{ width: `${amountImage.width}px`, height: `${amountImage.height}px` }}
          />
        )}
      </div>

      <div className="flex items-center justify-center relative z-10">
        <p className="text-white text-sm font-mono tracking-[0.3em] text-center">
          {giftCard.code}
        </p>
      </div>

      <div className="flex items-end justify-between relative z-10">
        <div>
          <p className="text-white text-xs font-bold tracking-widest">GIFT CARD</p>
          {giftCard.sender_name && (
            <p className="text-[10px] mt-0.5" style={{ color: '#d4d1c9' }}>Από: {giftCard.sender_name}</p>
          )}
          {giftCard.card_type === 'subscription' && subscriptionName && (
            <p className="text-[10px]" style={{ color: '#d4d1c9' }}>Συνδρομή · {subscriptionName}</p>
          )}
          {expiryDate && (
            <p className="text-[10px]" style={{ color: '#d4d1c9' }}>Ισχύει έως: {expiryDate}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="bg-white p-1.5">
            <QRCodeSVG value={`https://hyperkids.lovable.app/redeem?code=${giftCard.code}`} size={56} level="M" />
          </div>
        </div>
      </div>
    </div>
  );
});

GiftCardPreviewFront.displayName = 'GiftCardPreviewFront';

interface GiftCardPreviewBackProps {
  trustMarkImage: PreviewImageAsset | null;
  capture?: boolean;
}

export const GiftCardPreviewBack = React.forwardRef<HTMLDivElement, GiftCardPreviewBackProps>(({
  trustMarkImage,
  capture = false,
}, ref) => (
  <div
    ref={ref}
    data-bulk-card={capture ? 'true' : undefined}
    className="relative w-full aspect-[9/5] flex items-end justify-between overflow-hidden shadow-2xl"
    style={{
      padding: '25px',
      backgroundColor: '#d4d1c9',
      backgroundImage: `
        radial-gradient(ellipse at 20% 10%, rgba(60, 60, 60, 0.25) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 25%, rgba(60, 60, 60, 0.18) 0%, transparent 55%),
        radial-gradient(ellipse at 70% 90%, rgba(60, 60, 60, 0.22) 0%, transparent 55%),
        radial-gradient(ellipse at 10% 80%, rgba(60, 60, 60, 0.15) 0%, transparent 55%),
        linear-gradient(135deg, #e0ddd5 0%, #c8c5bd 50%, #b0ada5 100%)
      `,
    }}
  >
    {trustMarkImage && (
      <img
        src={trustMarkImage.src}
        alt={TRUST_MARK_TEXT}
        className="absolute object-contain"
        style={{ top: '25px', right: '25px', width: `${trustMarkImage.width}px`, height: `${trustMarkImage.height}px` }}
      />
    )}

    <img src={hyperkidsLogoBlack} alt="Hyperkids" className="absolute h-8 object-contain" style={{ top: '25px', left: '25px' }} />
    <img src={iconBlack} alt="Icon" className="absolute h-8 object-contain" style={{ bottom: '25px', left: '25px' }} />

    <div className="ml-auto text-right text-black text-[10px] leading-snug">
      <p>Αν. Γεωργίου 46, Θεσσαλονίκη 54627</p>
      <p>Τηλ: +30 2310 529104</p>
      <p>info@hyperkids.gr</p>
    </div>
  </div>
));

GiftCardPreviewBack.displayName = 'GiftCardPreviewBack';