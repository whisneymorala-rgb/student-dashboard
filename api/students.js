export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const response = await fetch('https://api.airtable.com/v0/app7AEsZy6fX24otc/Students', {
      headers: {
        Authorization: 'Bearer patbkesskTB3yutPB',
      },
    });

    if (!response.ok) {
      throw new Error(`Airtable returned ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Airtable fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch from Airtable' });
  }
}
