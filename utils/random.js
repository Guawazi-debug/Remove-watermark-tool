function getRandomInt(max) {
  if (max <= 0) return 0
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    const buffer = new Uint32Array(1)
    globalThis.crypto.getRandomValues(buffer)
    return buffer[0] % max
  }
  return Math.floor(Math.random() * max)
}

function randomHex(length) {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(getRandomInt(chars.length))
  }
  return result
}

module.exports = {
  getRandomInt,
  randomHex
}
