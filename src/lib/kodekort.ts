// Tegn et lille kodekort som PNG, der kan printes eller gemmes i Billeder.

export interface KodekortData {
  appNavn: string
  flag: string
  familiekode: string
  gendannelseskode: string
  adresse: string
}

function linjer(ctx: CanvasRenderingContext2D, tekst: string, x: number, y: number, maks: number, hoejde: number): number {
  let linje = ''
  for (const ord of tekst.split(' ')) {
    const proeve = linje ? `${linje} ${ord}` : ord
    if (ctx.measureText(proeve).width > maks && linje) {
      ctx.fillText(linje, x, y)
      y += hoejde
      linje = ord
    } else linje = proeve
  }
  if (linje) ctx.fillText(linje, x, y)
  return y + hoejde
}

export async function lavKodekort(d: KodekortData): Promise<Blob> {
  const W = 1200
  const H = 760
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#fbf6e9'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#2b1d0e'
  ctx.lineWidth = 6
  ctx.setLineDash([18, 12])
  ctx.strokeRect(24, 24, W - 48, H - 48)
  ctx.setLineDash([])
  ctx.fillStyle = '#2b1d0e'
  ctx.font = '700 54px Nunito, system-ui, sans-serif'
  ctx.fillText(`${d.flag} ${d.appNavn}`, 70, 120)
  ctx.font = '600 28px Nunito, system-ui, sans-serif'
  ctx.fillStyle = '#5a4630'
  ctx.fillText(`Familiens kodekort · ${new Date().toLocaleDateString('da-DK')}`, 70, 168)

  const felt = (titel: string, kode: string, forklaring: string, y: number) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(70, y, W - 140, 190)
    ctx.strokeStyle = '#c9ad73'
    ctx.lineWidth = 3
    ctx.strokeRect(70, y, W - 140, 190)
    ctx.fillStyle = '#5a4630'
    ctx.font = '800 26px Nunito, system-ui, sans-serif'
    ctx.fillText(titel.toUpperCase(), 100, y + 46)
    ctx.fillStyle = '#2b1d0e'
    ctx.font = '700 56px ui-monospace, Menlo, monospace'
    ctx.fillText(kode, 100, y + 116)
    ctx.fillStyle = '#5a4630'
    ctx.font = '600 24px Nunito, system-ui, sans-serif'
    linjer(ctx, forklaring, 100, y + 160, W - 200, 30)
  }
  felt('Familiekode', d.familiekode, 'Skriv den på hver iPad, telefon og computer, så skatten følger med.', 210)
  felt('Gendannelseskode', d.gendannelseskode, 'Bruges kun, hvis I glemmer familiekoden: "Glemt familiekoden?" i appen.', 430)

  ctx.fillStyle = '#5a4630'
  ctx.font = '600 24px Nunito, system-ui, sans-serif'
  linjer(ctx, `Gem kortet et sikkert sted. Alle, der kender koderne, kan se og ændre familiens skat. ${d.adresse}`, 70, 680, W - 140, 32)
  return await new Promise<Blob>((ok, fejl) => c.toBlob((b) => (b ? ok(b) : fejl(new Error('Kunne ikke tegne kortet'))), 'image/png'))
}
