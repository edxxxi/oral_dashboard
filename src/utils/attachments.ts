export const isImageAttachment = (name: string, mimeType?: string) =>
  Boolean(mimeType?.startsWith('image/')) ||
  Boolean(name.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/))

/** 從附件清單中找出第一張照片（優先有 storage path 的項目） */
export function findPhotoAttachment(attachments: { id: string; name: string; mimeType?: string; path?: string; url?: string }[]) {
  const withPath = attachments.filter((a) => a.path && isImageAttachment(a.name, a.mimeType))
  if (withPath.length > 0) return withPath[0]
  return attachments.find((a) => isImageAttachment(a.name, a.mimeType))
}
