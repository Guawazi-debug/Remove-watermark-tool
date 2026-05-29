const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function stringToUtf8Bytes(str) {
  const encoded = encodeURIComponent(str)
  const bytes = []

  for (let i = 0; i < encoded.length; i++) {
    if (encoded[i] === '%') {
      bytes.push(parseInt(encoded.slice(i + 1, i + 3), 16))
      i += 2
    } else {
      bytes.push(encoded.charCodeAt(i))
    }
  }

  return bytes
}

function utf8BytesToString(bytes) {
  const encoded = bytes
    .map(byte => `%${byte.toString(16).toUpperCase().padStart(2, '0')}`)
    .join('')

  try {
    return decodeURIComponent(encoded)
  } catch (error) {
    throw new Error('Invalid UTF-8 text')
  }
}

function base64DecodeToBytes(base64) {
  const normalized = String(base64 || '').replace(/\s+/g, '')
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(normalized)) {
    throw new Error('Invalid Base64')
  }

  const bytes = []
  for (let i = 0; i < normalized.length; i += 4) {
    const a = BASE64_CHARS.indexOf(normalized[i])
    const b = BASE64_CHARS.indexOf(normalized[i + 1])
    const cChar = normalized[i + 2]
    const dChar = normalized[i + 3]
    const c = cChar === '=' ? 0 : BASE64_CHARS.indexOf(cChar)
    const d = dChar === '=' ? 0 : BASE64_CHARS.indexOf(dChar)

    bytes.push((a << 2) | (b >> 4))
    if (cChar !== '=') {
      bytes.push(((b & 15) << 4) | (c >> 2))
    }
    if (dChar !== '=') {
      bytes.push(((c & 3) << 6) | d)
    }
  }

  return bytes
}

function bytesToBase64(bytes) {
  let result = ''

  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i]
    const b2 = bytes[i + 1]
    const b3 = bytes[i + 2]

    result += BASE64_CHARS[b1 >> 2]
    result += BASE64_CHARS[((b1 & 3) << 4) | ((b2 || 0) >> 4)]
    result += typeof b2 === 'number' ? BASE64_CHARS[((b2 & 15) << 2) | ((b3 || 0) >> 6)] : '='
    result += typeof b3 === 'number' ? BASE64_CHARS[b3 & 63] : '='
  }

  return result
}

function encodeBase64(str) {
  return bytesToBase64(stringToUtf8Bytes(str))
}

function decodeBase64ToString(base64) {
  return utf8BytesToString(base64DecodeToBytes(base64))
}

function base64UrlDecodeToString(str) {
  let normalized = String(str || '').replace(/-/g, '+').replace(/_/g, '/')
  while (normalized.length % 4) {
    normalized += '='
  }

  return decodeBase64ToString(normalized)
}

module.exports = {
  stringToUtf8Bytes,
  utf8BytesToString,
  base64DecodeToBytes,
  bytesToBase64,
  encodeBase64,
  decodeBase64ToString,
  base64UrlDecodeToString
}
