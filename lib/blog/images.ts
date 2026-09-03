/**
 * Titelbilder.
 *
 * Wenn keines hochgeladen wird, wird eines erzeugt — im Bildstil des Autors,
 * nicht im Stil des Tages. Der Ablageort ist Vercel Blob und nicht die
 * Datenbank: Bilder in Tabellen sind ein Fehler, den man ein halbes Jahr
 * spaeter nicht mehr los wird.
 */

const SIZE = '1536x1024'

export async function generateHero(prompt: string, slug: string): Promise<{ url: string; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY fehlt')

  let lastError = ''
  for (const model of ['gpt-image-1.5', 'gpt-image-1']) {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, size: SIZE, n: 1 }),
    }).catch(() => null)
    if (!res) { lastError = 'Netzwerk'; continue }
    if (!res.ok) { lastError = `${model}: ${(await res.text()).slice(0, 160)}`; continue }

    const data = await res.json()
    const b64 = data.data?.[0]?.b64_json
    const remote = data.data?.[0]?.url
    const bytes = b64
      ? Buffer.from(b64, 'base64')
      : Buffer.from(await (await fetch(remote)).arrayBuffer())

    const { put } = await import('@vercel/blob')
    const blob = await put(`blog/${slug}-${Date.now()}.png`, bytes, {
      access: 'public', contentType: 'image/png',
    })
    return { url: blob.url, model }
  }
  throw new Error(`Bild nicht erzeugt — ${lastError}`)
}

export async function storeUpload(file: File, slug: string): Promise<string> {
  const { put } = await import('@vercel/blob')
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const blob = await put(`blog/${slug}-${Date.now()}.${ext}`, file, {
    access: 'public', contentType: file.type || 'image/jpeg',
  })
  return blob.url
}
