
export default async function handler(req, res) {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const targetUrl = decodeURIComponent(url);
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://watchfooty.st/',
        'Origin': 'https://watchfooty.st'
      }
    });

    // Forward key headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/json');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    // Handle response
    if (!response.ok) {
        return res.status(response.status).json({ error: `Upstream error: ${response.status}` });
    }

    const data = await response.text();
    res.status(200).send(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
