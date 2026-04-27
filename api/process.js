module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-License-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { action, text, format = 'named' } = req.body;

    if (!action || !text) {
      return res.status(400).json({ error: 'Missing required fields: action and text' });
    }

    // Text size limit - 100KB max
    if (text.length > 100000) {
      return res.status(413).json({ error: 'Text too large', maxLength: 100000 });
    }

    if (action === 'encode') {
      let encoded;
      switch (format) {
        case 'decimal':
          encoded = text.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);
          break;
        case 'hex':
          encoded = text.replace(/[&<>"']/g, char => `&#x${char.charCodeAt(0).toString(16).toUpperCase()};`);
          break;
        case 'named':
        default:
          encoded = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
          break;
      }
      return res.status(200).json({
        result: encoded,
        originalLength: text.length,
        resultLength: encoded.length,
        format
      });
    }

    if (action === 'decode') {
      // Node.js safe decode (no DOM)
      let decoded = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
        .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

      return res.status(200).json({
        result: decoded,
        originalLength: text.length,
        resultLength: decoded.length
      });
    }

    return res.status(400).json({ error: 'Invalid action. Use "encode" or "decode"' });

  } catch (error) {
    console.error('[ERROR] Process:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
