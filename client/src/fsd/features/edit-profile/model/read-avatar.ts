const MAX_FILE_BYTES = 8 * 1024 * 1024

export async function readAvatarFile(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Выберите изображение")
  if (file.size > MAX_FILE_BYTES) throw new Error("Фото слишком большое")

  const bitmap = await createImageBitmap(file)
  const size = 256
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d")
  if (!context) {
    bitmap.close()
    throw new Error("Не удалось прочитать фото")
  }

  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const width = bitmap.width * scale
  const height = bitmap.height * scale
  context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height)
  bitmap.close()

  const data = canvas.toDataURL("image/jpeg", 0.85)
  if (!data.startsWith("data:image/jpeg;base64,")) throw new Error("Не удалось прочитать фото")
  return data
}
