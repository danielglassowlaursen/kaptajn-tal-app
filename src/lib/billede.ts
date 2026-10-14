/** Formindsk et foto til højst `maks` pixel på den længste led og gem som JPEG. */
export async function komprimer(fil: File, maks = 1600, kvalitet = 0.82): Promise<Blob> {
  const bmp = await createImageBitmap(fil)
  const skala = Math.min(1, maks / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * skala)
  const h = Math.round(bmp.height * skala)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('Kan ikke tegne billedet')
  ctx.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  return await new Promise<Blob>((ok, fejl) => c.toBlob((b) => (b ? ok(b) : fejl(new Error('Kunne ikke gemme billedet'))), 'image/jpeg', kvalitet))
}

/** Blob → base64 uden "data:"-præfiks. */
export async function tilBase64(blob: Blob): Promise<string> {
  const url = await new Promise<string>((ok, fejl) => {
    const r = new FileReader()
    r.onload = () => ok(String(r.result))
    r.onerror = () => fejl(r.error)
    r.readAsDataURL(blob)
  })
  return url.slice(url.indexOf(',') + 1)
}
