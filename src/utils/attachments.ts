export const isImageAttachment = (name: string, mimeType?: string) =>
  Boolean(mimeType?.startsWith('image/')) || Boolean(name.toLowerCase().match(/\.(jpg|jpeg|png)$/))
