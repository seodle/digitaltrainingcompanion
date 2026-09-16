import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QR_SIZE = 268;

const BrandedQrCode = forwardRef(({ value, size = QR_SIZE }, ref) => {
  const wrapRef = useRef(null);

  useImperativeHandle(ref, () => ({
    download: () => {
      const source = wrapRef.current?.querySelector('canvas');
      if (!source) {
        return;
      }

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 1024;
      exportCanvas.height = 1024;
      const ctx = exportCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(source, 0, 0, 1024, 1024);

      exportCanvas.toBlob((blob) => {
        if (!blob) {
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'QRCode.png';
        link.click();
        URL.revokeObjectURL(url);
      });
    },
  }));

  return (
    <div
      ref={wrapRef}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        maxWidth: size,
        maxHeight: size,
        flexShrink: 0,
        overflow: 'hidden',
        lineHeight: 0,
      }}
    >
      <QRCodeCanvas
        value={value || 'https://evalution-asso.ch'}
        size={size}
        bgColor="#ffffff"
        fgColor="#1a1a1a"
        level="M"
        includeMargin
        style={{ width: size, height: size, display: 'block' }}
      />
    </div>
  );
});

BrandedQrCode.displayName = 'BrandedQrCode';

export default BrandedQrCode;
