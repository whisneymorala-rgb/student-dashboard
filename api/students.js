export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'Students';

  if (!apiKey || !baseId) {
    res.status(500).json({
      error: 'Server is not configured. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.',
    });
    return;
  }

  try {
    const records = [];
    let offset;

    do {
      const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`);
      url.searchParams.set('pageSize', '100');
      if (offset) url.searchParams.set('offset', offset);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Airtable returned ${response.status}`);
      }

      const data = await response.json();
      records.push(...(data.records || []));
      offset = data.offset;
    } while (offset);

    res.status(200).json({ records });
  } catch (error) {
    console.error('Airtable fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch from Airtable' });
  }
}
