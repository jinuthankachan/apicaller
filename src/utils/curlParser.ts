interface ParsedCurlRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

function cleanCurlCommand(command: string): string {
  // Join multiline commands and clean up whitespace
  return command
    .replace(/\\\r?\n\s*/g, ' ') // Replace line continuations with space
    .replace(/\s+/g, ' ')        // Normalize whitespace
    .trim();
}

export function parseCurlCommand(curlCommand: string): ParsedCurlRequest {
  try {
    const result: ParsedCurlRequest = {
      url: '',
      method: 'GET',
      headers: {},
      body: ''
    };

    // Clean up the command first
    let command = cleanCurlCommand(curlCommand);
    console.log('Cleaned cURL Command:', command);
    // Remove 'curl' from the beginning and trim
    command = command.replace(/^\s*curl\s+/, '').trim();

    // First try to find a URL with http(s) prefix
    const urlMatch = command.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/);
    if (urlMatch) {
      result.url = urlMatch[1] || urlMatch[2];
      console.log('Parsed URL:', result.url);
    } else {
      // Try to match any non-option argument as URL
      const unquotedUrlMatch = command.match(/\s+(?!-)([^\s'"]+)/);
      if (unquotedUrlMatch) {
        result.url = unquotedUrlMatch[1];
        console.log('Parsed Unquoted URL:', result.url);
      }
    }

    // Parse headers
    const headerRegex = /(?:-H|--header)\s+['"]([^:]+):\s*([^'"]+)['"]|(?:-H|--header)\s+([^:]+):\s*([^\s]+)/g;
    let headerMatch;
    while ((headerMatch = headerRegex.exec(command)) !== null) {
      const [_, quotedKey, quotedValue, unquotedKey, unquotedValue] = headerMatch;
      const key = quotedKey || unquotedKey;
      const value = quotedValue || unquotedValue;
      if (key && value) {
        result.headers[key.trim()] = value.trim();
        console.log('Parsed Header:', key.trim(), '=', value.trim());
      }
    }

    // Parse method
    const methodRegex = /(?:-X|--request)\s+['"]?(\w+)['"]?/i;
    const methodMatch = command.match(methodRegex);
    if (methodMatch) {
      result.method = methodMatch[1].toUpperCase();
      console.log('Parsed Method:', result.method);
    }

    // Parse body
    const bodyRegex = /(?:-d|--data|--data-raw)\s+['"]([\s\S]+?)['"](?=\s+-|$)/;
    const bodyMatch = command.match(bodyRegex);
    if (bodyMatch) {
      result.body = bodyMatch[1]
        .replace(/\\(['"])/g, '$1')  // Unescape quotes
        .replace(/\\n/g, '\n');      // Handle newlines
      console.log('Parsed Body:', result.body);
      
      // If method is not set and we have a body, assume POST
      if (result.method === 'GET') {
        result.method = 'POST';
        console.log('Assumed Method:', result.method);
      }
    }

    return result;
  } catch (error) {
    console.error('Error parsing cURL command:', error);
    throw new Error('Failed to parse cURL command');
  }
}
