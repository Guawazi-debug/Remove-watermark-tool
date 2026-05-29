const { stringToUtf8Bytes } = require('./encoding')

function safeAdd(x, y) {
  const low = (x & 0xffff) + (y & 0xffff)
  const high = (x >>> 16) + (y >>> 16) + (low >>> 16)
  return (high << 16) | (low & 0xffff)
}

function addAll() {
  let result = 0
  for (let i = 0; i < arguments.length; i++) {
    result = safeAdd(result, arguments[i])
  }
  return result
}

function rotateLeft(value, bits) {
  return (value << bits) | (value >>> (32 - bits))
}

function rotateRight(value, bits) {
  return (value >>> bits) | (value << (32 - bits))
}

function wordArrayFromBytesLE(bytes) {
  const words = []
  for (let i = 0; i < bytes.length; i++) {
    words[i >> 2] = (words[i >> 2] || 0) | (bytes[i] << ((i % 4) * 8))
  }
  return words
}

function wordArrayFromBytesBE(bytes) {
  const words = []
  for (let i = 0; i < bytes.length; i++) {
    words[i >> 2] = (words[i >> 2] || 0) | (bytes[i] << (24 - (i % 4) * 8))
  }
  return words
}

function wordsToHexLE(words) {
  let result = ''
  for (let i = 0; i < words.length; i++) {
    for (let j = 0; j < 4; j++) {
      result += ((words[i] >>> (j * 8)) & 0xff).toString(16).padStart(2, '0')
    }
  }
  return result
}

function wordsToHexBE(words) {
  return words.map(word => (word >>> 0).toString(16).padStart(8, '0')).join('')
}

function md5(input) {
  const bytes = stringToUtf8Bytes(input)
  const words = wordArrayFromBytesLE(bytes)
  const bitLength = bytes.length * 8
  const totalLength = ((((bytes.length + 8) >>> 6) + 1) * 16)

  words[bytes.length >> 2] = (words[bytes.length >> 2] || 0) | (0x80 << ((bytes.length % 4) * 8))
  while (words.length < totalLength) {
    words.push(0)
  }
  words[totalLength - 2] = bitLength >>> 0
  words[totalLength - 1] = Math.floor(bitLength / 0x100000000)

  const shifts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ]

  const constants = [
    -680876936, -389564586, 606105819, -1044525330, -176418897, 1200080426,
    -1473231341, -45705983, 1770035416, -1958414417, -42063, -1990404162,
    1804603682, -40341101, -1502002290, 1236535329, -165796510, -1069501632,
    643717713, -373897302, -701558691, 38016083, -660478335, -405537848,
    568446438, -1019803690, -187363961, 1163531501, -1444681467, -51403784,
    1735328473, -1926607734, -378558, -2022574463, 1839030562, -35309556,
    -1530992060, 1272893353, -155497632, -1094730640, 681279174, -358537222,
    -722521979, 76029189, -640364487, -421815835, 530742520, -995338651,
    -198630844, 1126891415, -1416354905, -57434055, 1700485571, -1894986606,
    -1051523, -2054922799, 1873313359, -30611744, -1560198380, 1309151649,
    -145523070, -1120210379, 718787259, -343485551
  ]

  let a = 1732584193
  let b = -271733879
  let c = -1732584194
  let d = 271733878

  for (let i = 0; i < words.length; i += 16) {
    let aa = a
    let bb = b
    let cc = c
    let dd = d

    for (let j = 0; j < 64; j++) {
      let f
      let g

      if (j < 16) {
        f = (bb & cc) | (~bb & dd)
        g = j
      } else if (j < 32) {
        f = (dd & bb) | (~dd & cc)
        g = (5 * j + 1) % 16
      } else if (j < 48) {
        f = bb ^ cc ^ dd
        g = (3 * j + 5) % 16
      } else {
        f = cc ^ (bb | ~dd)
        g = (7 * j) % 16
      }

      const temp = dd
      dd = cc
      cc = bb
      bb = safeAdd(bb, rotateLeft(addAll(aa, f, constants[j], words[i + g] || 0), shifts[j]))
      aa = temp
    }

    a = safeAdd(a, aa)
    b = safeAdd(b, bb)
    c = safeAdd(c, cc)
    d = safeAdd(d, dd)
  }

  return wordsToHexLE([a, b, c, d])
}

function sha1(input) {
  const bytes = stringToUtf8Bytes(input)
  const words = wordArrayFromBytesBE(bytes)
  const bitLength = bytes.length * 8
  const totalLength = ((((bytes.length + 8) >>> 6) + 1) * 16)

  words[bytes.length >> 2] = (words[bytes.length >> 2] || 0) | (0x80 << (24 - (bytes.length % 4) * 8))
  while (words.length < totalLength) {
    words.push(0)
  }
  words[totalLength - 2] = Math.floor(bitLength / 0x100000000)
  words[totalLength - 1] = bitLength >>> 0

  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476
  let h4 = 0xc3d2e1f0

  for (let i = 0; i < words.length; i += 16) {
    const w = new Array(80)
    for (let t = 0; t < 16; t++) {
      w[t] = words[i + t] || 0
    }
    for (let t = 16; t < 80; t++) {
      w[t] = rotateLeft(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1) >>> 0
    }

    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4

    for (let t = 0; t < 80; t++) {
      let f
      let k
      if (t < 20) {
        f = (b & c) | (~b & d)
        k = 0x5a827999
      } else if (t < 40) {
        f = b ^ c ^ d
        k = 0x6ed9eba1
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d)
        k = 0x8f1bbcdc
      } else {
        f = b ^ c ^ d
        k = 0xca62c1d6
      }

      const temp = addAll(rotateLeft(a, 5), f, e, k, w[t]) >>> 0
      e = d
      d = c
      c = rotateLeft(b, 30) >>> 0
      b = a
      a = temp
    }

    h0 = addAll(h0, a) >>> 0
    h1 = addAll(h1, b) >>> 0
    h2 = addAll(h2, c) >>> 0
    h3 = addAll(h3, d) >>> 0
    h4 = addAll(h4, e) >>> 0
  }

  return wordsToHexBE([h0, h1, h2, h3, h4])
}

function sha256(input) {
  const bytes = stringToUtf8Bytes(input)
  const words = wordArrayFromBytesBE(bytes)
  const bitLength = bytes.length * 8
  const totalLength = ((((bytes.length + 8) >>> 6) + 1) * 16)

  words[bytes.length >> 2] = (words[bytes.length >> 2] || 0) | (0x80 << (24 - (bytes.length % 4) * 8))
  while (words.length < totalLength) {
    words.push(0)
  }
  words[totalLength - 2] = Math.floor(bitLength / 0x100000000)
  words[totalLength - 1] = bitLength >>> 0

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ]

  for (let i = 0; i < words.length; i += 16) {
    const w = new Array(64)
    for (let t = 0; t < 16; t++) {
      w[t] = words[i + t] || 0
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotateRight(w[t - 15], 7) ^ rotateRight(w[t - 15], 18) ^ (w[t - 15] >>> 3)
      const s1 = rotateRight(w[t - 2], 17) ^ rotateRight(w[t - 2], 19) ^ (w[t - 2] >>> 10)
      w[t] = addAll(w[t - 16], s0, w[t - 7], s1) >>> 0
    }

    let [a, b, c, d, e, f, g, h] = hash

    for (let t = 0; t < 64; t++) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = addAll(h, s1, ch, k[t], w[t]) >>> 0
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = addAll(s0, maj) >>> 0

      h = g
      g = f
      f = e
      e = addAll(d, temp1) >>> 0
      d = c
      c = b
      b = a
      a = addAll(temp1, temp2) >>> 0
    }

    hash[0] = addAll(hash[0], a) >>> 0
    hash[1] = addAll(hash[1], b) >>> 0
    hash[2] = addAll(hash[2], c) >>> 0
    hash[3] = addAll(hash[3], d) >>> 0
    hash[4] = addAll(hash[4], e) >>> 0
    hash[5] = addAll(hash[5], f) >>> 0
    hash[6] = addAll(hash[6], g) >>> 0
    hash[7] = addAll(hash[7], h) >>> 0
  }

  return wordsToHexBE(hash)
}

module.exports = {
  md5,
  sha1,
  sha256
}
