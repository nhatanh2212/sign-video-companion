export default async function handler(req, res) {
  const { text, spoken = 'en', signed = 'ase' } = req.query;
  if (!text) {
    return res.status(400).json({ error: 'missing "text" query parameter' });
  }

  const upstream = new URL('https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose');
  upstream.searchParams.set('text', text);
  upstream.searchParams.set('spoken', spoken);
  upstream.searchParams.set('signed', signed);

  const response = await fetch(upstream.toString());

  res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
  const disposition = response.headers.get('content-disposition');
  if (disposition) res.setHeader('Content-Disposition', disposition);

  const body = Buffer.from(await response.arrayBuffer());
  return res.status(response.status).send(body);
}

export const config = {
  api: { responseLimit: false },
};
