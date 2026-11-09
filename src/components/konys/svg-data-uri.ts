const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// expo-image en Android requiere Base64 para data URIs. Sin Buffer ni APIs de navegador.
export function svgDataUri(svg: string): string {
  const bytes = encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g,
    (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
  let encoded = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes.charCodeAt(index);
    const hasSecond = index + 1 < bytes.length;
    const hasThird = index + 2 < bytes.length;
    const second = hasSecond ? bytes.charCodeAt(index + 1) : 0;
    const third = hasThird ? bytes.charCodeAt(index + 2) : 0;
    encoded += alphabet[first >> 2];
    encoded += alphabet[((first & 3) << 4) | (second >> 4)];
    encoded += hasSecond ? alphabet[((second & 15) << 2) | (third >> 6)] : '=';
    encoded += hasThird ? alphabet[third & 63] : '=';
  }
  return `data:image/svg+xml;base64,${encoded}`;
}
