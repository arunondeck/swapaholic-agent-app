import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import QRCode from 'qrcode';
import { buildBoothProductCode, extractBoothProductIdFromCode } from '../utils/boothProductCode';

const printedProducts = new Set();

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildLabelHtml = ({ product, code, qrDataUrl }) => {
  const shopName = escapeHtml(product.seller_booth?.name || 'Shop');
  const productName = escapeHtml(product.name || 'Product');
  const price = Number(product.listing_price || 0).toFixed(2);

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            margin: 0;
            font-family: Arial, sans-serif;
          }
          .label {
            width: 302px;
            height: 94px;
            display: flex;
            align-items: stretch;
            padding: 2px;
            box-sizing: border-box;
          }
          .qr {
            width: 94px;
            height: 94px;
            object-fit: contain;
          }
          .details {
            flex: 1;
            padding: 2px 6px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .shop {
            font-size: 11px;
            line-height: 1.1;
          }
          .code {
            font-size: 11px;
            font-weight: 700;
            margin-top: 4px;
            word-break: break-all;
          }
          .name {
            font-size: 15px;
            line-height: 1.1;
            margin-top: 6px;
          }
          .price {
            font-size: 18px;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="label">
          <img class="qr" src="${qrDataUrl}" />
          <div class="details">
            <div>
              <div class="shop">${shopName}</div>
              <div class="code">${escapeHtml(code)}</div>
            </div>
            <div class="name">${productName}</div>
            <div class="price">Price: $${price}</div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const generateBoothProductLabel = async (product) => {
  const code = buildBoothProductCode(product);
  const qrDataUrl = await QRCode.toDataURL(code, { width: 200, margin: 1 });
  const html = buildLabelHtml({ product, code, qrDataUrl });
  const filename = `${code}.pdf`;

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
  } else {
    const result = await Print.printToFileAsync({ html, base64: false, width: 302, height: 94 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(result.uri, {
        mimeType: 'application/pdf',
        dialogTitle: filename,
        UTI: '.pdf',
      });
    }
  }

  markBoothProductPrinted(product.seller_booth?.id || '0', product.id || extractBoothProductIdFromCode(code) || '0');
  return { code, filename };
};

export const markBoothProductPrinted = (boothId, productId) => {
  printedProducts.add(`${boothId}-${productId}`);
};

export const isBoothProductPrinted = (boothId, productId) => printedProducts.has(`${boothId}-${productId}`);
