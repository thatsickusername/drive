var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var jh = (i, t) => () => (t || i((t = { exports: {} }).exports, t), t.exports);
var Ug = jh((zg, Vh) => {
  (function() {
    const t = document.createElement("link").relList;
    if (t && t.supports && t.supports("modulepreload")) return;
    for (const r of document.querySelectorAll('link[rel="modulepreload"]')) n(r);
    new MutationObserver((r) => {
      for (const s of r) if (s.type === "childList") for (const a of s.addedNodes) a.tagName === "LINK" && a.rel === "modulepreload" && n(a);
    }).observe(document, { childList: true, subtree: true });
    function e(r) {
      const s = {};
      return r.integrity && (s.integrity = r.integrity), r.referrerPolicy && (s.referrerPolicy = r.referrerPolicy), r.crossOrigin === "use-credentials" ? s.credentials = "include" : r.crossOrigin === "anonymous" ? s.credentials = "omit" : s.credentials = "same-origin", s;
    }
    function n(r) {
      if (r.ep) return;
      r.ep = true;
      const s = e(r);
      fetch(r.href, s);
    }
  })();
  /**
  * @license
  * Copyright 2010-2024 Three.js Authors
  * SPDX-License-Identifier: MIT
  */
  const oo = "170", Yh = 0, Zo = 1, Kh = 2, Ec = 1, Tc = 2, yn = 3, Wn = 0, ze = 1, En = 2, kn = 0, Li = 1, $o = 2, Jo = 3, Qo = 4, Zh = 5, ri = 100, $h = 101, Jh = 102, Qh = 103, tu = 104, eu = 200, nu = 201, iu = 202, ru = 203, ca = 204, ha = 205, su = 206, au = 207, ou = 208, lu = 209, cu = 210, hu = 211, uu = 212, du = 213, fu = 214, ua = 0, da = 1, fa = 2, Ni = 3, pa = 4, _a = 5, ma = 6, ga = 7, Rc = 0, pu = 1, _u = 2, Vn = 0, mu = 1, gu = 2, wu = 3, vu = 4, bu = 5, xu = 6, Su = 7, Ac = 300, Oi = 301, zi = 302, wa = 303, va = 304, ws = 306, ba = 1e3, ai = 1001, xa = 1002, on = 1003, yu = 1004, Sr = 1005, dn = 1006, Is = 1007, oi = 1008, Cn = 1009, Cc = 1010, Pc = 1011, lr = 1012, lo = 1013, hi = 1014, Tn = 1015, fr = 1016, co = 1017, ho = 1018, Bi = 1020, Ic = 35902, Lc = 1021, Dc = 1022, an = 1023, Uc = 1024, Fc = 1025, Di = 1026, Hi = 1027, Nc = 1028, uo = 1029, Oc = 1030, fo = 1031, po = 1033, $r = 33776, Jr = 33777, Qr = 33778, ts = 33779, Sa = 35840, ya = 35841, Ma = 35842, Ea = 35843, Ta = 36196, Ra = 37492, Aa = 37496, Ca = 37808, Pa = 37809, Ia = 37810, La = 37811, Da = 37812, Ua = 37813, Fa = 37814, Na = 37815, Oa = 37816, za = 37817, Ba = 37818, Ha = 37819, Ga = 37820, ka = 37821, es = 36492, Va = 36494, Wa = 36495, zc = 36283, Xa = 36284, qa = 36285, ja = 36286, Mu = 3200, Eu = 3201, Bc = 0, Tu = 1, Gn = "", Ze = "srgb", Wi = "srgb-linear", vs = "linear", ne = "srgb", _i = 7680, tl = 519, Ru = 512, Au = 513, Cu = 514, Hc = 515, Pu = 516, Iu = 517, Lu = 518, Du = 519, el = 35044, nl = "300 es", Rn = 2e3, is = 2001;
  class Xi {
    addEventListener(t, e) {
      this._listeners === void 0 && (this._listeners = {});
      const n = this._listeners;
      n[t] === void 0 && (n[t] = []), n[t].indexOf(e) === -1 && n[t].push(e);
    }
    hasEventListener(t, e) {
      if (this._listeners === void 0) return false;
      const n = this._listeners;
      return n[t] !== void 0 && n[t].indexOf(e) !== -1;
    }
    removeEventListener(t, e) {
      if (this._listeners === void 0) return;
      const r = this._listeners[t];
      if (r !== void 0) {
        const s = r.indexOf(e);
        s !== -1 && r.splice(s, 1);
      }
    }
    dispatchEvent(t) {
      if (this._listeners === void 0) return;
      const n = this._listeners[t.type];
      if (n !== void 0) {
        t.target = this;
        const r = n.slice(0);
        for (let s = 0, a = r.length; s < a; s++) r[s].call(this, t);
        t.target = null;
      }
    }
  }
  const Le = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "0a", "0b", "0c", "0d", "0e", "0f", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "1a", "1b", "1c", "1d", "1e", "1f", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "2a", "2b", "2c", "2d", "2e", "2f", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "3a", "3b", "3c", "3d", "3e", "3f", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "4a", "4b", "4c", "4d", "4e", "4f", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "5a", "5b", "5c", "5d", "5e", "5f", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "6a", "6b", "6c", "6d", "6e", "6f", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "7a", "7b", "7c", "7d", "7e", "7f", "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "8a", "8b", "8c", "8d", "8e", "8f", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", "9a", "9b", "9c", "9d", "9e", "9f", "a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "aa", "ab", "ac", "ad", "ae", "af", "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "ba", "bb", "bc", "bd", "be", "bf", "c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "ca", "cb", "cc", "cd", "ce", "cf", "d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "da", "db", "dc", "dd", "de", "df", "e0", "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "ea", "eb", "ec", "ed", "ee", "ef", "f0", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "fa", "fb", "fc", "fd", "fe", "ff"], Ls = Math.PI / 180, Ya = 180 / Math.PI;
  function pr() {
    const i = Math.random() * 4294967295 | 0, t = Math.random() * 4294967295 | 0, e = Math.random() * 4294967295 | 0, n = Math.random() * 4294967295 | 0;
    return (Le[i & 255] + Le[i >> 8 & 255] + Le[i >> 16 & 255] + Le[i >> 24 & 255] + "-" + Le[t & 255] + Le[t >> 8 & 255] + "-" + Le[t >> 16 & 15 | 64] + Le[t >> 24 & 255] + "-" + Le[e & 63 | 128] + Le[e >> 8 & 255] + "-" + Le[e >> 16 & 255] + Le[e >> 24 & 255] + Le[n & 255] + Le[n >> 8 & 255] + Le[n >> 16 & 255] + Le[n >> 24 & 255]).toLowerCase();
  }
  function Oe(i, t, e) {
    return Math.max(t, Math.min(e, i));
  }
  function Uu(i, t) {
    return (i % t + t) % t;
  }
  function Ds(i, t, e) {
    return (1 - e) * i + e * t;
  }
  function Ji(i, t) {
    switch (t.constructor) {
      case Float32Array:
        return i;
      case Uint32Array:
        return i / 4294967295;
      case Uint16Array:
        return i / 65535;
      case Uint8Array:
        return i / 255;
      case Int32Array:
        return Math.max(i / 2147483647, -1);
      case Int16Array:
        return Math.max(i / 32767, -1);
      case Int8Array:
        return Math.max(i / 127, -1);
      default:
        throw new Error("Invalid component type.");
    }
  }
  function Ne(i, t) {
    switch (t.constructor) {
      case Float32Array:
        return i;
      case Uint32Array:
        return Math.round(i * 4294967295);
      case Uint16Array:
        return Math.round(i * 65535);
      case Uint8Array:
        return Math.round(i * 255);
      case Int32Array:
        return Math.round(i * 2147483647);
      case Int16Array:
        return Math.round(i * 32767);
      case Int8Array:
        return Math.round(i * 127);
      default:
        throw new Error("Invalid component type.");
    }
  }
  class Jt {
    constructor(t = 0, e = 0) {
      Jt.prototype.isVector2 = true, this.x = t, this.y = e;
    }
    get width() {
      return this.x;
    }
    set width(t) {
      this.x = t;
    }
    get height() {
      return this.y;
    }
    set height(t) {
      this.y = t;
    }
    set(t, e) {
      return this.x = t, this.y = e, this;
    }
    setScalar(t) {
      return this.x = t, this.y = t, this;
    }
    setX(t) {
      return this.x = t, this;
    }
    setY(t) {
      return this.y = t, this;
    }
    setComponent(t, e) {
      switch (t) {
        case 0:
          this.x = e;
          break;
        case 1:
          this.y = e;
          break;
        default:
          throw new Error("index is out of range: " + t);
      }
      return this;
    }
    getComponent(t) {
      switch (t) {
        case 0:
          return this.x;
        case 1:
          return this.y;
        default:
          throw new Error("index is out of range: " + t);
      }
    }
    clone() {
      return new this.constructor(this.x, this.y);
    }
    copy(t) {
      return this.x = t.x, this.y = t.y, this;
    }
    add(t) {
      return this.x += t.x, this.y += t.y, this;
    }
    addScalar(t) {
      return this.x += t, this.y += t, this;
    }
    addVectors(t, e) {
      return this.x = t.x + e.x, this.y = t.y + e.y, this;
    }
    addScaledVector(t, e) {
      return this.x += t.x * e, this.y += t.y * e, this;
    }
    sub(t) {
      return this.x -= t.x, this.y -= t.y, this;
    }
    subScalar(t) {
      return this.x -= t, this.y -= t, this;
    }
    subVectors(t, e) {
      return this.x = t.x - e.x, this.y = t.y - e.y, this;
    }
    multiply(t) {
      return this.x *= t.x, this.y *= t.y, this;
    }
    multiplyScalar(t) {
      return this.x *= t, this.y *= t, this;
    }
    divide(t) {
      return this.x /= t.x, this.y /= t.y, this;
    }
    divideScalar(t) {
      return this.multiplyScalar(1 / t);
    }
    applyMatrix3(t) {
      const e = this.x, n = this.y, r = t.elements;
      return this.x = r[0] * e + r[3] * n + r[6], this.y = r[1] * e + r[4] * n + r[7], this;
    }
    min(t) {
      return this.x = Math.min(this.x, t.x), this.y = Math.min(this.y, t.y), this;
    }
    max(t) {
      return this.x = Math.max(this.x, t.x), this.y = Math.max(this.y, t.y), this;
    }
    clamp(t, e) {
      return this.x = Math.max(t.x, Math.min(e.x, this.x)), this.y = Math.max(t.y, Math.min(e.y, this.y)), this;
    }
    clampScalar(t, e) {
      return this.x = Math.max(t, Math.min(e, this.x)), this.y = Math.max(t, Math.min(e, this.y)), this;
    }
    clampLength(t, e) {
      const n = this.length();
      return this.divideScalar(n || 1).multiplyScalar(Math.max(t, Math.min(e, n)));
    }
    floor() {
      return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this;
    }
    ceil() {
      return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this;
    }
    round() {
      return this.x = Math.round(this.x), this.y = Math.round(this.y), this;
    }
    roundToZero() {
      return this.x = Math.trunc(this.x), this.y = Math.trunc(this.y), this;
    }
    negate() {
      return this.x = -this.x, this.y = -this.y, this;
    }
    dot(t) {
      return this.x * t.x + this.y * t.y;
    }
    cross(t) {
      return this.x * t.y - this.y * t.x;
    }
    lengthSq() {
      return this.x * this.x + this.y * this.y;
    }
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    manhattanLength() {
      return Math.abs(this.x) + Math.abs(this.y);
    }
    normalize() {
      return this.divideScalar(this.length() || 1);
    }
    angle() {
      return Math.atan2(-this.y, -this.x) + Math.PI;
    }
    angleTo(t) {
      const e = Math.sqrt(this.lengthSq() * t.lengthSq());
      if (e === 0) return Math.PI / 2;
      const n = this.dot(t) / e;
      return Math.acos(Oe(n, -1, 1));
    }
    distanceTo(t) {
      return Math.sqrt(this.distanceToSquared(t));
    }
    distanceToSquared(t) {
      const e = this.x - t.x, n = this.y - t.y;
      return e * e + n * n;
    }
    manhattanDistanceTo(t) {
      return Math.abs(this.x - t.x) + Math.abs(this.y - t.y);
    }
    setLength(t) {
      return this.normalize().multiplyScalar(t);
    }
    lerp(t, e) {
      return this.x += (t.x - this.x) * e, this.y += (t.y - this.y) * e, this;
    }
    lerpVectors(t, e, n) {
      return this.x = t.x + (e.x - t.x) * n, this.y = t.y + (e.y - t.y) * n, this;
    }
    equals(t) {
      return t.x === this.x && t.y === this.y;
    }
    fromArray(t, e = 0) {
      return this.x = t[e], this.y = t[e + 1], this;
    }
    toArray(t = [], e = 0) {
      return t[e] = this.x, t[e + 1] = this.y, t;
    }
    fromBufferAttribute(t, e) {
      return this.x = t.getX(e), this.y = t.getY(e), this;
    }
    rotateAround(t, e) {
      const n = Math.cos(e), r = Math.sin(e), s = this.x - t.x, a = this.y - t.y;
      return this.x = s * n - a * r + t.x, this.y = s * r + a * n + t.y, this;
    }
    random() {
      return this.x = Math.random(), this.y = Math.random(), this;
    }
    *[Symbol.iterator]() {
      yield this.x, yield this.y;
    }
  }
  class Nt {
    constructor(t, e, n, r, s, a, o, l, c) {
      Nt.prototype.isMatrix3 = true, this.elements = [1, 0, 0, 0, 1, 0, 0, 0, 1], t !== void 0 && this.set(t, e, n, r, s, a, o, l, c);
    }
    set(t, e, n, r, s, a, o, l, c) {
      const u = this.elements;
      return u[0] = t, u[1] = r, u[2] = o, u[3] = e, u[4] = s, u[5] = l, u[6] = n, u[7] = a, u[8] = c, this;
    }
    identity() {
      return this.set(1, 0, 0, 0, 1, 0, 0, 0, 1), this;
    }
    copy(t) {
      const e = this.elements, n = t.elements;
      return e[0] = n[0], e[1] = n[1], e[2] = n[2], e[3] = n[3], e[4] = n[4], e[5] = n[5], e[6] = n[6], e[7] = n[7], e[8] = n[8], this;
    }
    extractBasis(t, e, n) {
      return t.setFromMatrix3Column(this, 0), e.setFromMatrix3Column(this, 1), n.setFromMatrix3Column(this, 2), this;
    }
    setFromMatrix4(t) {
      const e = t.elements;
      return this.set(e[0], e[4], e[8], e[1], e[5], e[9], e[2], e[6], e[10]), this;
    }
    multiply(t) {
      return this.multiplyMatrices(this, t);
    }
    premultiply(t) {
      return this.multiplyMatrices(t, this);
    }
    multiplyMatrices(t, e) {
      const n = t.elements, r = e.elements, s = this.elements, a = n[0], o = n[3], l = n[6], c = n[1], u = n[4], f = n[7], p = n[2], _ = n[5], g = n[8], v = r[0], m = r[3], d = r[6], T = r[1], E = r[4], y = r[7], H = r[2], P = r[5], A = r[8];
      return s[0] = a * v + o * T + l * H, s[3] = a * m + o * E + l * P, s[6] = a * d + o * y + l * A, s[1] = c * v + u * T + f * H, s[4] = c * m + u * E + f * P, s[7] = c * d + u * y + f * A, s[2] = p * v + _ * T + g * H, s[5] = p * m + _ * E + g * P, s[8] = p * d + _ * y + g * A, this;
    }
    multiplyScalar(t) {
      const e = this.elements;
      return e[0] *= t, e[3] *= t, e[6] *= t, e[1] *= t, e[4] *= t, e[7] *= t, e[2] *= t, e[5] *= t, e[8] *= t, this;
    }
    determinant() {
      const t = this.elements, e = t[0], n = t[1], r = t[2], s = t[3], a = t[4], o = t[5], l = t[6], c = t[7], u = t[8];
      return e * a * u - e * o * c - n * s * u + n * o * l + r * s * c - r * a * l;
    }
    invert() {
      const t = this.elements, e = t[0], n = t[1], r = t[2], s = t[3], a = t[4], o = t[5], l = t[6], c = t[7], u = t[8], f = u * a - o * c, p = o * l - u * s, _ = c * s - a * l, g = e * f + n * p + r * _;
      if (g === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
      const v = 1 / g;
      return t[0] = f * v, t[1] = (r * c - u * n) * v, t[2] = (o * n - r * a) * v, t[3] = p * v, t[4] = (u * e - r * l) * v, t[5] = (r * s - o * e) * v, t[6] = _ * v, t[7] = (n * l - c * e) * v, t[8] = (a * e - n * s) * v, this;
    }
    transpose() {
      let t;
      const e = this.elements;
      return t = e[1], e[1] = e[3], e[3] = t, t = e[2], e[2] = e[6], e[6] = t, t = e[5], e[5] = e[7], e[7] = t, this;
    }
    getNormalMatrix(t) {
      return this.setFromMatrix4(t).invert().transpose();
    }
    transposeIntoArray(t) {
      const e = this.elements;
      return t[0] = e[0], t[1] = e[3], t[2] = e[6], t[3] = e[1], t[4] = e[4], t[5] = e[7], t[6] = e[2], t[7] = e[5], t[8] = e[8], this;
    }
    setUvTransform(t, e, n, r, s, a, o) {
      const l = Math.cos(s), c = Math.sin(s);
      return this.set(n * l, n * c, -n * (l * a + c * o) + a + t, -r * c, r * l, -r * (-c * a + l * o) + o + e, 0, 0, 1), this;
    }
    scale(t, e) {
      return this.premultiply(Us.makeScale(t, e)), this;
    }
    rotate(t) {
      return this.premultiply(Us.makeRotation(-t)), this;
    }
    translate(t, e) {
      return this.premultiply(Us.makeTranslation(t, e)), this;
    }
    makeTranslation(t, e) {
      return t.isVector2 ? this.set(1, 0, t.x, 0, 1, t.y, 0, 0, 1) : this.set(1, 0, t, 0, 1, e, 0, 0, 1), this;
    }
    makeRotation(t) {
      const e = Math.cos(t), n = Math.sin(t);
      return this.set(e, -n, 0, n, e, 0, 0, 0, 1), this;
    }
    makeScale(t, e) {
      return this.set(t, 0, 0, 0, e, 0, 0, 0, 1), this;
    }
    equals(t) {
      const e = this.elements, n = t.elements;
      for (let r = 0; r < 9; r++) if (e[r] !== n[r]) return false;
      return true;
    }
    fromArray(t, e = 0) {
      for (let n = 0; n < 9; n++) this.elements[n] = t[n + e];
      return this;
    }
    toArray(t = [], e = 0) {
      const n = this.elements;
      return t[e] = n[0], t[e + 1] = n[1], t[e + 2] = n[2], t[e + 3] = n[3], t[e + 4] = n[4], t[e + 5] = n[5], t[e + 6] = n[6], t[e + 7] = n[7], t[e + 8] = n[8], t;
    }
    clone() {
      return new this.constructor().fromArray(this.elements);
    }
  }
  const Us = new Nt();
  function Gc(i) {
    for (let t = i.length - 1; t >= 0; --t) if (i[t] >= 65535) return true;
    return false;
  }
  function rs(i) {
    return document.createElementNS("http://www.w3.org/1999/xhtml", i);
  }
  function Fu() {
    const i = rs("canvas");
    return i.style.display = "block", i;
  }
  const il = {};
  function sr(i) {
    i in il || (il[i] = true, console.warn(i));
  }
  function Nu(i, t, e) {
    return new Promise(function(n, r) {
      function s() {
        switch (i.clientWaitSync(t, i.SYNC_FLUSH_COMMANDS_BIT, 0)) {
          case i.WAIT_FAILED:
            r();
            break;
          case i.TIMEOUT_EXPIRED:
            setTimeout(s, e);
            break;
          default:
            n();
        }
      }
      setTimeout(s, e);
    });
  }
  function Ou(i) {
    const t = i.elements;
    t[2] = 0.5 * t[2] + 0.5 * t[3], t[6] = 0.5 * t[6] + 0.5 * t[7], t[10] = 0.5 * t[10] + 0.5 * t[11], t[14] = 0.5 * t[14] + 0.5 * t[15];
  }
  function zu(i) {
    const t = i.elements;
    t[11] === -1 ? (t[10] = -t[10] - 1, t[14] = -t[14]) : (t[10] = -t[10], t[14] = -t[14] + 1);
  }
  const Zt = { enabled: true, workingColorSpace: Wi, spaces: {}, convert: function(i, t, e) {
    return this.enabled === false || t === e || !t || !e || (this.spaces[t].transfer === ne && (i.r = An(i.r), i.g = An(i.g), i.b = An(i.b)), this.spaces[t].primaries !== this.spaces[e].primaries && (i.applyMatrix3(this.spaces[t].toXYZ), i.applyMatrix3(this.spaces[e].fromXYZ)), this.spaces[e].transfer === ne && (i.r = Ui(i.r), i.g = Ui(i.g), i.b = Ui(i.b))), i;
  }, fromWorkingColorSpace: function(i, t) {
    return this.convert(i, this.workingColorSpace, t);
  }, toWorkingColorSpace: function(i, t) {
    return this.convert(i, t, this.workingColorSpace);
  }, getPrimaries: function(i) {
    return this.spaces[i].primaries;
  }, getTransfer: function(i) {
    return i === Gn ? vs : this.spaces[i].transfer;
  }, getLuminanceCoefficients: function(i, t = this.workingColorSpace) {
    return i.fromArray(this.spaces[t].luminanceCoefficients);
  }, define: function(i) {
    Object.assign(this.spaces, i);
  }, _getMatrix: function(i, t, e) {
    return i.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ);
  }, _getDrawingBufferColorSpace: function(i) {
    return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace;
  }, _getUnpackColorSpace: function(i = this.workingColorSpace) {
    return this.spaces[i].workingColorSpaceConfig.unpackColorSpace;
  } };
  function An(i) {
    return i < 0.04045 ? i * 0.0773993808 : Math.pow(i * 0.9478672986 + 0.0521327014, 2.4);
  }
  function Ui(i) {
    return i < 31308e-7 ? i * 12.92 : 1.055 * Math.pow(i, 0.41666) - 0.055;
  }
  const rl = [0.64, 0.33, 0.3, 0.6, 0.15, 0.06], sl = [0.2126, 0.7152, 0.0722], al = [0.3127, 0.329], ol = new Nt().set(0.4123908, 0.3575843, 0.1804808, 0.212639, 0.7151687, 0.0721923, 0.0193308, 0.1191948, 0.9505322), ll = new Nt().set(3.2409699, -1.5373832, -0.4986108, -0.9692436, 1.8759675, 0.0415551, 0.0556301, -0.203977, 1.0569715);
  Zt.define({ [Wi]: { primaries: rl, whitePoint: al, transfer: vs, toXYZ: ol, fromXYZ: ll, luminanceCoefficients: sl, workingColorSpaceConfig: { unpackColorSpace: Ze }, outputColorSpaceConfig: { drawingBufferColorSpace: Ze } }, [Ze]: { primaries: rl, whitePoint: al, transfer: ne, toXYZ: ol, fromXYZ: ll, luminanceCoefficients: sl, outputColorSpaceConfig: { drawingBufferColorSpace: Ze } } });
  let mi;
  class Bu {
    static getDataURL(t) {
      if (/^data:/i.test(t.src) || typeof HTMLCanvasElement > "u") return t.src;
      let e;
      if (t instanceof HTMLCanvasElement) e = t;
      else {
        mi === void 0 && (mi = rs("canvas")), mi.width = t.width, mi.height = t.height;
        const n = mi.getContext("2d");
        t instanceof ImageData ? n.putImageData(t, 0, 0) : n.drawImage(t, 0, 0, t.width, t.height), e = mi;
      }
      return e.width > 2048 || e.height > 2048 ? (console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons", t), e.toDataURL("image/jpeg", 0.6)) : e.toDataURL("image/png");
    }
    static sRGBToLinear(t) {
      if (typeof HTMLImageElement < "u" && t instanceof HTMLImageElement || typeof HTMLCanvasElement < "u" && t instanceof HTMLCanvasElement || typeof ImageBitmap < "u" && t instanceof ImageBitmap) {
        const e = rs("canvas");
        e.width = t.width, e.height = t.height;
        const n = e.getContext("2d");
        n.drawImage(t, 0, 0, t.width, t.height);
        const r = n.getImageData(0, 0, t.width, t.height), s = r.data;
        for (let a = 0; a < s.length; a++) s[a] = An(s[a] / 255) * 255;
        return n.putImageData(r, 0, 0), e;
      } else if (t.data) {
        const e = t.data.slice(0);
        for (let n = 0; n < e.length; n++) e instanceof Uint8Array || e instanceof Uint8ClampedArray ? e[n] = Math.floor(An(e[n] / 255) * 255) : e[n] = An(e[n]);
        return { data: e, width: t.width, height: t.height };
      } else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."), t;
    }
  }
  let Hu = 0;
  class kc {
    constructor(t = null) {
      this.isSource = true, Object.defineProperty(this, "id", { value: Hu++ }), this.uuid = pr(), this.data = t, this.dataReady = true, this.version = 0;
    }
    set needsUpdate(t) {
      t === true && this.version++;
    }
    toJSON(t) {
      const e = t === void 0 || typeof t == "string";
      if (!e && t.images[this.uuid] !== void 0) return t.images[this.uuid];
      const n = { uuid: this.uuid, url: "" }, r = this.data;
      if (r !== null) {
        let s;
        if (Array.isArray(r)) {
          s = [];
          for (let a = 0, o = r.length; a < o; a++) r[a].isDataTexture ? s.push(Fs(r[a].image)) : s.push(Fs(r[a]));
        } else s = Fs(r);
        n.url = s;
      }
      return e || (t.images[this.uuid] = n), n;
    }
  }
  function Fs(i) {
    return typeof HTMLImageElement < "u" && i instanceof HTMLImageElement || typeof HTMLCanvasElement < "u" && i instanceof HTMLCanvasElement || typeof ImageBitmap < "u" && i instanceof ImageBitmap ? Bu.getDataURL(i) : i.data ? { data: Array.from(i.data), width: i.width, height: i.height, type: i.data.constructor.name } : (console.warn("THREE.Texture: Unable to serialize Texture."), {});
  }
  let Gu = 0;
  class Be extends Xi {
    constructor(t = Be.DEFAULT_IMAGE, e = Be.DEFAULT_MAPPING, n = ai, r = ai, s = dn, a = oi, o = an, l = Cn, c = Be.DEFAULT_ANISOTROPY, u = Gn) {
      super(), this.isTexture = true, Object.defineProperty(this, "id", { value: Gu++ }), this.uuid = pr(), this.name = "", this.source = new kc(t), this.mipmaps = [], this.mapping = e, this.channel = 0, this.wrapS = n, this.wrapT = r, this.magFilter = s, this.minFilter = a, this.anisotropy = c, this.format = o, this.internalFormat = null, this.type = l, this.offset = new Jt(0, 0), this.repeat = new Jt(1, 1), this.center = new Jt(0, 0), this.rotation = 0, this.matrixAutoUpdate = true, this.matrix = new Nt(), this.generateMipmaps = true, this.premultiplyAlpha = false, this.flipY = true, this.unpackAlignment = 4, this.colorSpace = u, this.userData = {}, this.version = 0, this.onUpdate = null, this.isRenderTargetTexture = false, this.pmremVersion = 0;
    }
    get image() {
      return this.source.data;
    }
    set image(t = null) {
      this.source.data = t;
    }
    updateMatrix() {
      this.matrix.setUvTransform(this.offset.x, this.offset.y, this.repeat.x, this.repeat.y, this.rotation, this.center.x, this.center.y);
    }
    clone() {
      return new this.constructor().copy(this);
    }
    copy(t) {
      return this.name = t.name, this.source = t.source, this.mipmaps = t.mipmaps.slice(0), this.mapping = t.mapping, this.channel = t.channel, this.wrapS = t.wrapS, this.wrapT = t.wrapT, this.magFilter = t.magFilter, this.minFilter = t.minFilter, this.anisotropy = t.anisotropy, this.format = t.format, this.internalFormat = t.internalFormat, this.type = t.type, this.offset.copy(t.offset), this.repeat.copy(t.repeat), this.center.copy(t.center), this.rotation = t.rotation, this.matrixAutoUpdate = t.matrixAutoUpdate, this.matrix.copy(t.matrix), this.generateMipmaps = t.generateMipmaps, this.premultiplyAlpha = t.premultiplyAlpha, this.flipY = t.flipY, this.unpackAlignment = t.unpackAlignment, this.colorSpace = t.colorSpace, this.userData = JSON.parse(JSON.stringify(t.userData)), this.needsUpdate = true, this;
    }
    toJSON(t) {
      const e = t === void 0 || typeof t == "string";
      if (!e && t.textures[this.uuid] !== void 0) return t.textures[this.uuid];
      const n = { metadata: { version: 4.6, type: "Texture", generator: "Texture.toJSON" }, uuid: this.uuid, name: this.name, image: this.source.toJSON(t).uuid, mapping: this.mapping, channel: this.channel, repeat: [this.repeat.x, this.repeat.y], offset: [this.offset.x, this.offset.y], center: [this.center.x, this.center.y], rotation: this.rotation, wrap: [this.wrapS, this.wrapT], format: this.format, internalFormat: this.internalFormat, type: this.type, colorSpace: this.colorSpace, minFilter: this.minFilter, magFilter: this.magFilter, anisotropy: this.anisotropy, flipY: this.flipY, generateMipmaps: this.generateMipmaps, premultiplyAlpha: this.premultiplyAlpha, unpackAlignment: this.unpackAlignment };
      return Object.keys(this.userData).length > 0 && (n.userData = this.userData), e || (t.textures[this.uuid] = n), n;
    }
    dispose() {
      this.dispatchEvent({ type: "dispose" });
    }
    transformUv(t) {
      if (this.mapping !== Ac) return t;
      if (t.applyMatrix3(this.matrix), t.x < 0 || t.x > 1) switch (this.wrapS) {
        case ba:
          t.x = t.x - Math.floor(t.x);
          break;
        case ai:
          t.x = t.x < 0 ? 0 : 1;
          break;
        case xa:
          Math.abs(Math.floor(t.x) % 2) === 1 ? t.x = Math.ceil(t.x) - t.x : t.x = t.x - Math.floor(t.x);
          break;
      }
      if (t.y < 0 || t.y > 1) switch (this.wrapT) {
        case ba:
          t.y = t.y - Math.floor(t.y);
          break;
        case ai:
          t.y = t.y < 0 ? 0 : 1;
          break;
        case xa:
          Math.abs(Math.floor(t.y) % 2) === 1 ? t.y = Math.ceil(t.y) - t.y : t.y = t.y - Math.floor(t.y);
          break;
      }
      return this.flipY && (t.y = 1 - t.y), t;
    }
    set needsUpdate(t) {
      t === true && (this.version++, this.source.needsUpdate = true);
    }
    set needsPMREMUpdate(t) {
      t === true && this.pmremVersion++;
    }
  }
  Be.DEFAULT_IMAGE = null;
  Be.DEFAULT_MAPPING = Ac;
  Be.DEFAULT_ANISOTROPY = 1;
  class me {
    constructor(t = 0, e = 0, n = 0, r = 1) {
      me.prototype.isVector4 = true, this.x = t, this.y = e, this.z = n, this.w = r;
    }
    get width() {
      return this.z;
    }
    set width(t) {
      this.z = t;
    }
    get height() {
      return this.w;
    }
    set height(t) {
      this.w = t;
    }
    set(t, e, n, r) {
      return this.x = t, this.y = e, this.z = n, this.w = r, this;
    }
    setScalar(t) {
      return this.x = t, this.y = t, this.z = t, this.w = t, this;
    }
    setX(t) {
      return this.x = t, this;
    }
    setY(t) {
      return this.y = t, this;
    }
    setZ(t) {
      return this.z = t, this;
    }
    setW(t) {
      return this.w = t, this;
    }
    setComponent(t, e) {
      switch (t) {
        case 0:
          this.x = e;
          break;
        case 1:
          this.y = e;
          break;
        case 2:
          this.z = e;
          break;
        case 3:
          this.w = e;
          break;
        default:
          throw new Error("index is out of range: " + t);
      }
      return this;
    }
    getComponent(t) {
      switch (t) {
        case 0:
          return this.x;
        case 1:
          return this.y;
        case 2:
          return this.z;
        case 3:
          return this.w;
        default:
          throw new Error("index is out of range: " + t);
      }
    }
    clone() {
      return new this.constructor(this.x, this.y, this.z, this.w);
    }
    copy(t) {
      return this.x = t.x, this.y = t.y, this.z = t.z, this.w = t.w !== void 0 ? t.w : 1, this;
    }
    add(t) {
      return this.x += t.x, this.y += t.y, this.z += t.z, this.w += t.w, this;
    }
    addScalar(t) {
      return this.x += t, this.y += t, this.z += t, this.w += t, this;
    }
    addVectors(t, e) {
      return this.x = t.x + e.x, this.y = t.y + e.y, this.z = t.z + e.z, this.w = t.w + e.w, this;
    }
    addScaledVector(t, e) {
      return this.x += t.x * e, this.y += t.y * e, this.z += t.z * e, this.w += t.w * e, this;
    }
    sub(t) {
      return this.x -= t.x, this.y -= t.y, this.z -= t.z, this.w -= t.w, this;
    }
    subScalar(t) {
      return this.x -= t, this.y -= t, this.z -= t, this.w -= t, this;
    }
    subVectors(t, e) {
      return this.x = t.x - e.x, this.y = t.y - e.y, this.z = t.z - e.z, this.w = t.w - e.w, this;
    }
    multiply(t) {
      return this.x *= t.x, this.y *= t.y, this.z *= t.z, this.w *= t.w, this;
    }
    multiplyScalar(t) {
      return this.x *= t, this.y *= t, this.z *= t, this.w *= t, this;
    }
    applyMatrix4(t) {
      const e = this.x, n = this.y, r = this.z, s = this.w, a = t.elements;
      return this.x = a[0] * e + a[4] * n + a[8] * r + a[12] * s, this.y = a[1] * e + a[5] * n + a[9] * r + a[13] * s, this.z = a[2] * e + a[6] * n + a[10] * r + a[14] * s, this.w = a[3] * e + a[7] * n + a[11] * r + a[15] * s, this;
    }
    divide(t) {
      return this.x /= t.x, this.y /= t.y, this.z /= t.z, this.w /= t.w, this;
    }
    divideScalar(t) {
      return this.multiplyScalar(1 / t);
    }
    setAxisAngleFromQuaternion(t) {
      this.w = 2 * Math.acos(t.w);
      const e = Math.sqrt(1 - t.w * t.w);
      return e < 1e-4 ? (this.x = 1, this.y = 0, this.z = 0) : (this.x = t.x / e, this.y = t.y / e, this.z = t.z / e), this;
    }
    setAxisAngleFromRotationMatrix(t) {
      let e, n, r, s;
      const l = t.elements, c = l[0], u = l[4], f = l[8], p = l[1], _ = l[5], g = l[9], v = l[2], m = l[6], d = l[10];
      if (Math.abs(u - p) < 0.01 && Math.abs(f - v) < 0.01 && Math.abs(g - m) < 0.01) {
        if (Math.abs(u + p) < 0.1 && Math.abs(f + v) < 0.1 && Math.abs(g + m) < 0.1 && Math.abs(c + _ + d - 3) < 0.1) return this.set(1, 0, 0, 0), this;
        e = Math.PI;
        const E = (c + 1) / 2, y = (_ + 1) / 2, H = (d + 1) / 2, P = (u + p) / 4, A = (f + v) / 4, N = (g + m) / 4;
        return E > y && E > H ? E < 0.01 ? (n = 0, r = 0.707106781, s = 0.707106781) : (n = Math.sqrt(E), r = P / n, s = A / n) : y > H ? y < 0.01 ? (n = 0.707106781, r = 0, s = 0.707106781) : (r = Math.sqrt(y), n = P / r, s = N / r) : H < 0.01 ? (n = 0.707106781, r = 0.707106781, s = 0) : (s = Math.sqrt(H), n = A / s, r = N / s), this.set(n, r, s, e), this;
      }
      let T = Math.sqrt((m - g) * (m - g) + (f - v) * (f - v) + (p - u) * (p - u));
      return Math.abs(T) < 1e-3 && (T = 1), this.x = (m - g) / T, this.y = (f - v) / T, this.z = (p - u) / T, this.w = Math.acos((c + _ + d - 1) / 2), this;
    }
    setFromMatrixPosition(t) {
      const e = t.elements;
      return this.x = e[12], this.y = e[13], this.z = e[14], this.w = e[15], this;
    }
    min(t) {
      return this.x = Math.min(this.x, t.x), this.y = Math.min(this.y, t.y), this.z = Math.min(this.z, t.z), this.w = Math.min(this.w, t.w), this;
    }
    max(t) {
      return this.x = Math.max(this.x, t.x), this.y = Math.max(this.y, t.y), this.z = Math.max(this.z, t.z), this.w = Math.max(this.w, t.w), this;
    }
    clamp(t, e) {
      return this.x = Math.max(t.x, Math.min(e.x, this.x)), this.y = Math.max(t.y, Math.min(e.y, this.y)), this.z = Math.max(t.z, Math.min(e.z, this.z)), this.w = Math.max(t.w, Math.min(e.w, this.w)), this;
    }
    clampScalar(t, e) {
      return this.x = Math.max(t, Math.min(e, this.x)), this.y = Math.max(t, Math.min(e, this.y)), this.z = Math.max(t, Math.min(e, this.z)), this.w = Math.max(t, Math.min(e, this.w)), this;
    }
    clampLength(t, e) {
      const n = this.length();
      return this.divideScalar(n || 1).multiplyScalar(Math.max(t, Math.min(e, n)));
    }
    floor() {
      return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this.z = Math.floor(this.z), this.w = Math.floor(this.w), this;
    }
    ceil() {
      return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this.z = Math.ceil(this.z), this.w = Math.ceil(this.w), this;
    }
    round() {
      return this.x = Math.round(this.x), this.y = Math.round(this.y), this.z = Math.round(this.z), this.w = Math.round(this.w), this;
    }
    roundToZero() {
      return this.x = Math.trunc(this.x), this.y = Math.trunc(this.y), this.z = Math.trunc(this.z), this.w = Math.trunc(this.w), this;
    }
    negate() {
      return this.x = -this.x, this.y = -this.y, this.z = -this.z, this.w = -this.w, this;
    }
    dot(t) {
      return this.x * t.x + this.y * t.y + this.z * t.z + this.w * t.w;
    }
    lengthSq() {
      return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    }
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }
    manhattanLength() {
      return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w);
    }
    normalize() {
      return this.divideScalar(this.length() || 1);
    }
    setLength(t) {
      return this.normalize().multiplyScalar(t);
    }
    lerp(t, e) {
      return this.x += (t.x - this.x) * e, this.y += (t.y - this.y) * e, this.z += (t.z - this.z) * e, this.w += (t.w - this.w) * e, this;
    }
    lerpVectors(t, e, n) {
      return this.x = t.x + (e.x - t.x) * n, this.y = t.y + (e.y - t.y) * n, this.z = t.z + (e.z - t.z) * n, this.w = t.w + (e.w - t.w) * n, this;
    }
    equals(t) {
      return t.x === this.x && t.y === this.y && t.z === this.z && t.w === this.w;
    }
    fromArray(t, e = 0) {
      return this.x = t[e], this.y = t[e + 1], this.z = t[e + 2], this.w = t[e + 3], this;
    }
    toArray(t = [], e = 0) {
      return t[e] = this.x, t[e + 1] = this.y, t[e + 2] = this.z, t[e + 3] = this.w, t;
    }
    fromBufferAttribute(t, e) {
      return this.x = t.getX(e), this.y = t.getY(e), this.z = t.getZ(e), this.w = t.getW(e), this;
    }
    random() {
      return this.x = Math.random(), this.y = Math.random(), this.z = Math.random(), this.w = Math.random(), this;
    }
    *[Symbol.iterator]() {
      yield this.x, yield this.y, yield this.z, yield this.w;
    }
  }
  class ku extends Xi {
    constructor(t = 1, e = 1, n = {}) {
      super(), this.isRenderTarget = true, this.width = t, this.height = e, this.depth = 1, this.scissor = new me(0, 0, t, e), this.scissorTest = false, this.viewport = new me(0, 0, t, e);
      const r = { width: t, height: e, depth: 1 };
      n = Object.assign({ generateMipmaps: false, internalFormat: null, minFilter: dn, depthBuffer: true, stencilBuffer: false, resolveDepthBuffer: true, resolveStencilBuffer: true, depthTexture: null, samples: 0, count: 1 }, n);
      const s = new Be(r, n.mapping, n.wrapS, n.wrapT, n.magFilter, n.minFilter, n.format, n.type, n.anisotropy, n.colorSpace);
      s.flipY = false, s.generateMipmaps = n.generateMipmaps, s.internalFormat = n.internalFormat, this.textures = [];
      const a = n.count;
      for (let o = 0; o < a; o++) this.textures[o] = s.clone(), this.textures[o].isRenderTargetTexture = true;
      this.depthBuffer = n.depthBuffer, this.stencilBuffer = n.stencilBuffer, this.resolveDepthBuffer = n.resolveDepthBuffer, this.resolveStencilBuffer = n.resolveStencilBuffer, this.depthTexture = n.depthTexture, this.samples = n.samples;
    }
    get texture() {
      return this.textures[0];
    }
    set texture(t) {
      this.textures[0] = t;
    }
    setSize(t, e, n = 1) {
      if (this.width !== t || this.height !== e || this.depth !== n) {
        this.width = t, this.height = e, this.depth = n;
        for (let r = 0, s = this.textures.length; r < s; r++) this.textures[r].image.width = t, this.textures[r].image.height = e, this.textures[r].image.depth = n;
        this.dispose();
      }
      this.viewport.set(0, 0, t, e), this.scissor.set(0, 0, t, e);
    }
    clone() {
      return new this.constructor().copy(this);
    }
    copy(t) {
      this.width = t.width, this.height = t.height, this.depth = t.depth, this.scissor.copy(t.scissor), this.scissorTest = t.scissorTest, this.viewport.copy(t.viewport), this.textures.length = 0;
      for (let n = 0, r = t.textures.length; n < r; n++) this.textures[n] = t.textures[n].clone(), this.textures[n].isRenderTargetTexture = true;
      const e = Object.assign({}, t.texture.image);
      return this.texture.source = new kc(e), this.depthBuffer = t.depthBuffer, this.stencilBuffer = t.stencilBuffer, this.resolveDepthBuffer = t.resolveDepthBuffer, this.resolveStencilBuffer = t.resolveStencilBuffer, t.depthTexture !== null && (this.depthTexture = t.depthTexture.clone()), this.samples = t.samples, this;
    }
    dispose() {
      this.dispatchEvent({ type: "dispose" });
    }
  }
  class ui extends ku {
    constructor(t = 1, e = 1, n = {}) {
      super(t, e, n), this.isWebGLRenderTarget = true;
    }
  }
  class Vc extends Be {
    constructor(t = null, e = 1, n = 1, r = 1) {
      super(null), this.isDataArrayTexture = true, this.image = { data: t, width: e, height: n, depth: r }, this.magFilter = on, this.minFilter = on, this.wrapR = ai, this.generateMipmaps = false, this.flipY = false, this.unpackAlignment = 1, this.layerUpdates = /* @__PURE__ */ new Set();
    }
    addLayerUpdate(t) {
      this.layerUpdates.add(t);
    }
    clearLayerUpdates() {
      this.layerUpdates.clear();
    }
  }
  class Vu extends Be {
    constructor(t = null, e = 1, n = 1, r = 1) {
      super(null), this.isData3DTexture = true, this.image = { data: t, width: e, height: n, depth: r }, this.magFilter = on, this.minFilter = on, this.wrapR = ai, this.generateMipmaps = false, this.flipY = false, this.unpackAlignment = 1;
    }
  }
  let qi = class {
    constructor(t = 0, e = 0, n = 0, r = 1) {
      this.isQuaternion = true, this._x = t, this._y = e, this._z = n, this._w = r;
    }
    static slerpFlat(t, e, n, r, s, a, o) {
      let l = n[r + 0], c = n[r + 1], u = n[r + 2], f = n[r + 3];
      const p = s[a + 0], _ = s[a + 1], g = s[a + 2], v = s[a + 3];
      if (o === 0) {
        t[e + 0] = l, t[e + 1] = c, t[e + 2] = u, t[e + 3] = f;
        return;
      }
      if (o === 1) {
        t[e + 0] = p, t[e + 1] = _, t[e + 2] = g, t[e + 3] = v;
        return;
      }
      if (f !== v || l !== p || c !== _ || u !== g) {
        let m = 1 - o;
        const d = l * p + c * _ + u * g + f * v, T = d >= 0 ? 1 : -1, E = 1 - d * d;
        if (E > Number.EPSILON) {
          const H = Math.sqrt(E), P = Math.atan2(H, d * T);
          m = Math.sin(m * P) / H, o = Math.sin(o * P) / H;
        }
        const y = o * T;
        if (l = l * m + p * y, c = c * m + _ * y, u = u * m + g * y, f = f * m + v * y, m === 1 - o) {
          const H = 1 / Math.sqrt(l * l + c * c + u * u + f * f);
          l *= H, c *= H, u *= H, f *= H;
        }
      }
      t[e] = l, t[e + 1] = c, t[e + 2] = u, t[e + 3] = f;
    }
    static multiplyQuaternionsFlat(t, e, n, r, s, a) {
      const o = n[r], l = n[r + 1], c = n[r + 2], u = n[r + 3], f = s[a], p = s[a + 1], _ = s[a + 2], g = s[a + 3];
      return t[e] = o * g + u * f + l * _ - c * p, t[e + 1] = l * g + u * p + c * f - o * _, t[e + 2] = c * g + u * _ + o * p - l * f, t[e + 3] = u * g - o * f - l * p - c * _, t;
    }
    get x() {
      return this._x;
    }
    set x(t) {
      this._x = t, this._onChangeCallback();
    }
    get y() {
      return this._y;
    }
    set y(t) {
      this._y = t, this._onChangeCallback();
    }
    get z() {
      return this._z;
    }
    set z(t) {
      this._z = t, this._onChangeCallback();
    }
    get w() {
      return this._w;
    }
    set w(t) {
      this._w = t, this._onChangeCallback();
    }
    set(t, e, n, r) {
      return this._x = t, this._y = e, this._z = n, this._w = r, this._onChangeCallback(), this;
    }
    clone() {
      return new this.constructor(this._x, this._y, this._z, this._w);
    }
    copy(t) {
      return this._x = t.x, this._y = t.y, this._z = t.z, this._w = t.w, this._onChangeCallback(), this;
    }
    setFromEuler(t, e = true) {
      const n = t._x, r = t._y, s = t._z, a = t._order, o = Math.cos, l = Math.sin, c = o(n / 2), u = o(r / 2), f = o(s / 2), p = l(n / 2), _ = l(r / 2), g = l(s / 2);
      switch (a) {
        case "XYZ":
          this._x = p * u * f + c * _ * g, this._y = c * _ * f - p * u * g, this._z = c * u * g + p * _ * f, this._w = c * u * f - p * _ * g;
          break;
        case "YXZ":
          this._x = p * u * f + c * _ * g, this._y = c * _ * f - p * u * g, this._z = c * u * g - p * _ * f, this._w = c * u * f + p * _ * g;
          break;
        case "ZXY":
          this._x = p * u * f - c * _ * g, this._y = c * _ * f + p * u * g, this._z = c * u * g + p * _ * f, this._w = c * u * f - p * _ * g;
          break;
        case "ZYX":
          this._x = p * u * f - c * _ * g, this._y = c * _ * f + p * u * g, this._z = c * u * g - p * _ * f, this._w = c * u * f + p * _ * g;
          break;
        case "YZX":
          this._x = p * u * f + c * _ * g, this._y = c * _ * f + p * u * g, this._z = c * u * g - p * _ * f, this._w = c * u * f - p * _ * g;
          break;
        case "XZY":
          this._x = p * u * f - c * _ * g, this._y = c * _ * f - p * u * g, this._z = c * u * g + p * _ * f, this._w = c * u * f + p * _ * g;
          break;
        default:
          console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: " + a);
      }
      return e === true && this._onChangeCallback(), this;
    }
    setFromAxisAngle(t, e) {
      const n = e / 2, r = Math.sin(n);
      return this._x = t.x * r, this._y = t.y * r, this._z = t.z * r, this._w = Math.cos(n), this._onChangeCallback(), this;
    }
    setFromRotationMatrix(t) {
      const e = t.elements, n = e[0], r = e[4], s = e[8], a = e[1], o = e[5], l = e[9], c = e[2], u = e[6], f = e[10], p = n + o + f;
      if (p > 0) {
        const _ = 0.5 / Math.sqrt(p + 1);
        this._w = 0.25 / _, this._x = (u - l) * _, this._y = (s - c) * _, this._z = (a - r) * _;
      } else if (n > o && n > f) {
        const _ = 2 * Math.sqrt(1 + n - o - f);
        this._w = (u - l) / _, this._x = 0.25 * _, this._y = (r + a) / _, this._z = (s + c) / _;
      } else if (o > f) {
        const _ = 2 * Math.sqrt(1 + o - n - f);
        this._w = (s - c) / _, this._x = (r + a) / _, this._y = 0.25 * _, this._z = (l + u) / _;
      } else {
        const _ = 2 * Math.sqrt(1 + f - n - o);
        this._w = (a - r) / _, this._x = (s + c) / _, this._y = (l + u) / _, this._z = 0.25 * _;
      }
      return this._onChangeCallback(), this;
    }
    setFromUnitVectors(t, e) {
      let n = t.dot(e) + 1;
      return n < Number.EPSILON ? (n = 0, Math.abs(t.x) > Math.abs(t.z) ? (this._x = -t.y, this._y = t.x, this._z = 0, this._w = n) : (this._x = 0, this._y = -t.z, this._z = t.y, this._w = n)) : (this._x = t.y * e.z - t.z * e.y, this._y = t.z * e.x - t.x * e.z, this._z = t.x * e.y - t.y * e.x, this._w = n), this.normalize();
    }
    angleTo(t) {
      return 2 * Math.acos(Math.abs(Oe(this.dot(t), -1, 1)));
    }
    rotateTowards(t, e) {
      const n = this.angleTo(t);
      if (n === 0) return this;
      const r = Math.min(1, e / n);
      return this.slerp(t, r), this;
    }
    identity() {
      return this.set(0, 0, 0, 1);
    }
    invert() {
      return this.conjugate();
    }
    conjugate() {
      return this._x *= -1, this._y *= -1, this._z *= -1, this._onChangeCallback(), this;
    }
    dot(t) {
      return this._x * t._x + this._y * t._y + this._z * t._z + this._w * t._w;
    }
    lengthSq() {
      return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;
    }
    length() {
      return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w);
    }
    normalize() {
      let t = this.length();
      return t === 0 ? (this._x = 0, this._y = 0, this._z = 0, this._w = 1) : (t = 1 / t, this._x = this._x * t, this._y = this._y * t, this._z = this._z * t, this._w = this._w * t), this._onChangeCallback(), this;
    }
    multiply(t) {
      return this.multiplyQuaternions(this, t);
    }
    premultiply(t) {
      return this.multiplyQuaternions(t, this);
    }
    multiplyQuaternions(t, e) {
      const n = t._x, r = t._y, s = t._z, a = t._w, o = e._x, l = e._y, c = e._z, u = e._w;
      return this._x = n * u + a * o + r * c - s * l, this._y = r * u + a * l + s * o - n * c, this._z = s * u + a * c + n * l - r * o, this._w = a * u - n * o - r * l - s * c, this._onChangeCallback(), this;
    }
    slerp(t, e) {
      if (e === 0) return this;
      if (e === 1) return this.copy(t);
      const n = this._x, r = this._y, s = this._z, a = this._w;
      let o = a * t._w + n * t._x + r * t._y + s * t._z;
      if (o < 0 ? (this._w = -t._w, this._x = -t._x, this._y = -t._y, this._z = -t._z, o = -o) : this.copy(t), o >= 1) return this._w = a, this._x = n, this._y = r, this._z = s, this;
      const l = 1 - o * o;
      if (l <= Number.EPSILON) {
        const _ = 1 - e;
        return this._w = _ * a + e * this._w, this._x = _ * n + e * this._x, this._y = _ * r + e * this._y, this._z = _ * s + e * this._z, this.normalize(), this;
      }
      const c = Math.sqrt(l), u = Math.atan2(c, o), f = Math.sin((1 - e) * u) / c, p = Math.sin(e * u) / c;
      return this._w = a * f + this._w * p, this._x = n * f + this._x * p, this._y = r * f + this._y * p, this._z = s * f + this._z * p, this._onChangeCallback(), this;
    }
    slerpQuaternions(t, e, n) {
      return this.copy(t).slerp(e, n);
    }
    random() {
      const t = 2 * Math.PI * Math.random(), e = 2 * Math.PI * Math.random(), n = Math.random(), r = Math.sqrt(1 - n), s = Math.sqrt(n);
      return this.set(r * Math.sin(t), r * Math.cos(t), s * Math.sin(e), s * Math.cos(e));
    }
    equals(t) {
      return t._x === this._x && t._y === this._y && t._z === this._z && t._w === this._w;
    }
    fromArray(t, e = 0) {
      return this._x = t[e], this._y = t[e + 1], this._z = t[e + 2], this._w = t[e + 3], this._onChangeCallback(), this;
    }
    toArray(t = [], e = 0) {
      return t[e] = this._x, t[e + 1] = this._y, t[e + 2] = this._z, t[e + 3] = this._w, t;
    }
    fromBufferAttribute(t, e) {
      return this._x = t.getX(e), this._y = t.getY(e), this._z = t.getZ(e), this._w = t.getW(e), this._onChangeCallback(), this;
    }
    toJSON() {
      return this.toArray();
    }
    _onChange(t) {
      return this._onChangeCallback = t, this;
    }
    _onChangeCallback() {
    }
    *[Symbol.iterator]() {
      yield this._x, yield this._y, yield this._z, yield this._w;
    }
  }, z = class Wc {
    constructor(t = 0, e = 0, n = 0) {
      Wc.prototype.isVector3 = true, this.x = t, this.y = e, this.z = n;
    }
    set(t, e, n) {
      return n === void 0 && (n = this.z), this.x = t, this.y = e, this.z = n, this;
    }
    setScalar(t) {
      return this.x = t, this.y = t, this.z = t, this;
    }
    setX(t) {
      return this.x = t, this;
    }
    setY(t) {
      return this.y = t, this;
    }
    setZ(t) {
      return this.z = t, this;
    }
    setComponent(t, e) {
      switch (t) {
        case 0:
          this.x = e;
          break;
        case 1:
          this.y = e;
          break;
        case 2:
          this.z = e;
          break;
        default:
          throw new Error("index is out of range: " + t);
      }
      return this;
    }
    getComponent(t) {
      switch (t) {
        case 0:
          return this.x;
        case 1:
          return this.y;
        case 2:
          return this.z;
        default:
          throw new Error("index is out of range: " + t);
      }
    }
    clone() {
      return new this.constructor(this.x, this.y, this.z);
    }
    copy(t) {
      return this.x = t.x, this.y = t.y, this.z = t.z, this;
    }
    add(t) {
      return this.x += t.x, this.y += t.y, this.z += t.z, this;
    }
    addScalar(t) {
      return this.x += t, this.y += t, this.z += t, this;
    }
    addVectors(t, e) {
      return this.x = t.x + e.x, this.y = t.y + e.y, this.z = t.z + e.z, this;
    }
    addScaledVector(t, e) {
      return this.x += t.x * e, this.y += t.y * e, this.z += t.z * e, this;
    }
    sub(t) {
      return this.x -= t.x, this.y -= t.y, this.z -= t.z, this;
    }
    subScalar(t) {
      return this.x -= t, this.y -= t, this.z -= t, this;
    }
    subVectors(t, e) {
      return this.x = t.x - e.x, this.y = t.y - e.y, this.z = t.z - e.z, this;
    }
    multiply(t) {
      return this.x *= t.x, this.y *= t.y, this.z *= t.z, this;
    }
    multiplyScalar(t) {
      return this.x *= t, this.y *= t, this.z *= t, this;
    }
    multiplyVectors(t, e) {
      return this.x = t.x * e.x, this.y = t.y * e.y, this.z = t.z * e.z, this;
    }
    applyEuler(t) {
      return this.applyQuaternion(cl.setFromEuler(t));
    }
    applyAxisAngle(t, e) {
      return this.applyQuaternion(cl.setFromAxisAngle(t, e));
    }
    applyMatrix3(t) {
      const e = this.x, n = this.y, r = this.z, s = t.elements;
      return this.x = s[0] * e + s[3] * n + s[6] * r, this.y = s[1] * e + s[4] * n + s[7] * r, this.z = s[2] * e + s[5] * n + s[8] * r, this;
    }
    applyNormalMatrix(t) {
      return this.applyMatrix3(t).normalize();
    }
    applyMatrix4(t) {
      const e = this.x, n = this.y, r = this.z, s = t.elements, a = 1 / (s[3] * e + s[7] * n + s[11] * r + s[15]);
      return this.x = (s[0] * e + s[4] * n + s[8] * r + s[12]) * a, this.y = (s[1] * e + s[5] * n + s[9] * r + s[13]) * a, this.z = (s[2] * e + s[6] * n + s[10] * r + s[14]) * a, this;
    }
    applyQuaternion(t) {
      const e = this.x, n = this.y, r = this.z, s = t.x, a = t.y, o = t.z, l = t.w, c = 2 * (a * r - o * n), u = 2 * (o * e - s * r), f = 2 * (s * n - a * e);
      return this.x = e + l * c + a * f - o * u, this.y = n + l * u + o * c - s * f, this.z = r + l * f + s * u - a * c, this;
    }
    project(t) {
      return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix);
    }
    unproject(t) {
      return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld);
    }
    transformDirection(t) {
      const e = this.x, n = this.y, r = this.z, s = t.elements;
      return this.x = s[0] * e + s[4] * n + s[8] * r, this.y = s[1] * e + s[5] * n + s[9] * r, this.z = s[2] * e + s[6] * n + s[10] * r, this.normalize();
    }
    divide(t) {
      return this.x /= t.x, this.y /= t.y, this.z /= t.z, this;
    }
    divideScalar(t) {
      return this.multiplyScalar(1 / t);
    }
    min(t) {
      return this.x = Math.min(this.x, t.x), this.y = Math.min(this.y, t.y), this.z = Math.min(this.z, t.z), this;
    }
    max(t) {
      return this.x = Math.max(this.x, t.x), this.y = Math.max(this.y, t.y), this.z = Math.max(this.z, t.z), this;
    }
    clamp(t, e) {
      return this.x = Math.max(t.x, Math.min(e.x, this.x)), this.y = Math.max(t.y, Math.min(e.y, this.y)), this.z = Math.max(t.z, Math.min(e.z, this.z)), this;
    }
    clampScalar(t, e) {
      return this.x = Math.max(t, Math.min(e, this.x)), this.y = Math.max(t, Math.min(e, this.y)), this.z = Math.max(t, Math.min(e, this.z)), this;
    }
    clampLength(t, e) {
      const n = this.length();
      return this.divideScalar(n || 1).multiplyScalar(Math.max(t, Math.min(e, n)));
    }
    floor() {
      return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this.z = Math.floor(this.z), this;
    }
    ceil() {
      return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this.z = Math.ceil(this.z), this;
    }
    round() {
      return this.x = Math.round(this.x), this.y = Math.round(this.y), this.z = Math.round(this.z), this;
    }
    roundToZero() {
      return this.x = Math.trunc(this.x), this.y = Math.trunc(this.y), this.z = Math.trunc(this.z), this;
    }
    negate() {
      return this.x = -this.x, this.y = -this.y, this.z = -this.z, this;
    }
    dot(t) {
      return this.x * t.x + this.y * t.y + this.z * t.z;
    }
    lengthSq() {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    manhattanLength() {
      return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
    }
    normalize() {
      return this.divideScalar(this.length() || 1);
    }
    setLength(t) {
      return this.normalize().multiplyScalar(t);
    }
    lerp(t, e) {
      return this.x += (t.x - this.x) * e, this.y += (t.y - this.y) * e, this.z += (t.z - this.z) * e, this;
    }
    lerpVectors(t, e, n) {
      return this.x = t.x + (e.x - t.x) * n, this.y = t.y + (e.y - t.y) * n, this.z = t.z + (e.z - t.z) * n, this;
    }
    cross(t) {
      return this.crossVectors(this, t);
    }
    crossVectors(t, e) {
      const n = t.x, r = t.y, s = t.z, a = e.x, o = e.y, l = e.z;
      return this.x = r * l - s * o, this.y = s * a - n * l, this.z = n * o - r * a, this;
    }
    projectOnVector(t) {
      const e = t.lengthSq();
      if (e === 0) return this.set(0, 0, 0);
      const n = t.dot(this) / e;
      return this.copy(t).multiplyScalar(n);
    }
    projectOnPlane(t) {
      return Ns.copy(this).projectOnVector(t), this.sub(Ns);
    }
    reflect(t) {
      return this.sub(Ns.copy(t).multiplyScalar(2 * this.dot(t)));
    }
    angleTo(t) {
      const e = Math.sqrt(this.lengthSq() * t.lengthSq());
      if (e === 0) return Math.PI / 2;
      const n = this.dot(t) / e;
      return Math.acos(Oe(n, -1, 1));
    }
    distanceTo(t) {
      return Math.sqrt(this.distanceToSquared(t));
    }
    distanceToSquared(t) {
      const e = this.x - t.x, n = this.y - t.y, r = this.z - t.z;
      return e * e + n * n + r * r;
    }
    manhattanDistanceTo(t) {
      return Math.abs(this.x - t.x) + Math.abs(this.y - t.y) + Math.abs(this.z - t.z);
    }
    setFromSpherical(t) {
      return this.setFromSphericalCoords(t.radius, t.phi, t.theta);
    }
    setFromSphericalCoords(t, e, n) {
      const r = Math.sin(e) * t;
      return this.x = r * Math.sin(n), this.y = Math.cos(e) * t, this.z = r * Math.cos(n), this;
    }
    setFromCylindrical(t) {
      return this.setFromCylindricalCoords(t.radius, t.theta, t.y);
    }
    setFromCylindricalCoords(t, e, n) {
      return this.x = t * Math.sin(e), this.y = n, this.z = t * Math.cos(e), this;
    }
    setFromMatrixPosition(t) {
      const e = t.elements;
      return this.x = e[12], this.y = e[13], this.z = e[14], this;
    }
    setFromMatrixScale(t) {
      const e = this.setFromMatrixColumn(t, 0).length(), n = this.setFromMatrixColumn(t, 1).length(), r = this.setFromMatrixColumn(t, 2).length();
      return this.x = e, this.y = n, this.z = r, this;
    }
    setFromMatrixColumn(t, e) {
      return this.fromArray(t.elements, e * 4);
    }
    setFromMatrix3Column(t, e) {
      return this.fromArray(t.elements, e * 3);
    }
    setFromEuler(t) {
      return this.x = t._x, this.y = t._y, this.z = t._z, this;
    }
    setFromColor(t) {
      return this.x = t.r, this.y = t.g, this.z = t.b, this;
    }
    equals(t) {
      return t.x === this.x && t.y === this.y && t.z === this.z;
    }
    fromArray(t, e = 0) {
      return this.x = t[e], this.y = t[e + 1], this.z = t[e + 2], this;
    }
    toArray(t = [], e = 0) {
      return t[e] = this.x, t[e + 1] = this.y, t[e + 2] = this.z, t;
    }
    fromBufferAttribute(t, e) {
      return this.x = t.getX(e), this.y = t.getY(e), this.z = t.getZ(e), this;
    }
    random() {
      return this.x = Math.random(), this.y = Math.random(), this.z = Math.random(), this;
    }
    randomDirection() {
      const t = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, n = Math.sqrt(1 - e * e);
      return this.x = n * Math.cos(t), this.y = e, this.z = n * Math.sin(t), this;
    }
    *[Symbol.iterator]() {
      yield this.x, yield this.y, yield this.z;
    }
  };
  const Ns = new z(), cl = new qi();
  class _r {
    constructor(t = new z(1 / 0, 1 / 0, 1 / 0), e = new z(-1 / 0, -1 / 0, -1 / 0)) {
      this.isBox3 = true, this.min = t, this.max = e;
    }
    set(t, e) {
      return this.min.copy(t), this.max.copy(e), this;
    }
    setFromArray(t) {
      this.makeEmpty();
      for (let e = 0, n = t.length; e < n; e += 3) this.expandByPoint(tn.fromArray(t, e));
      return this;
    }
    setFromBufferAttribute(t) {
      this.makeEmpty();
      for (let e = 0, n = t.count; e < n; e++) this.expandByPoint(tn.fromBufferAttribute(t, e));
      return this;
    }
    setFromPoints(t) {
      this.makeEmpty();
      for (let e = 0, n = t.length; e < n; e++) this.expandByPoint(t[e]);
      return this;
    }
    setFromCenterAndSize(t, e) {
      const n = tn.copy(e).multiplyScalar(0.5);
      return this.min.copy(t).sub(n), this.max.copy(t).add(n), this;
    }
    setFromObject(t, e = false) {
      return this.makeEmpty(), this.expandByObject(t, e);
    }
    clone() {
      return new this.constructor().copy(this);
    }
    copy(t) {
      return this.min.copy(t.min), this.max.copy(t.max), this;
    }
    makeEmpty() {
      return this.min.x = this.min.y = this.min.z = 1 / 0, this.max.x = this.max.y = this.max.z = -1 / 0, this;
    }
    isEmpty() {
      return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
    }
    getCenter(t) {
      return this.isEmpty() ? t.set(0, 0, 0) : t.addVectors(this.min, this.max).multiplyScalar(0.5);
    }
    getSize(t) {
      return this.isEmpty() ? t.set(0, 0, 0) : t.subVectors(this.max, this.min);
    }
    expandByPoint(t) {
      return this.min.min(t), this.max.max(t), this;
    }
    expandByVector(t) {
      return this.min.sub(t), this.max.add(t), this;
    }
    expandByScalar(t) {
      return this.min.addScalar(-t), this.max.addScalar(t), this;
    }
    expandByObject(t, e = false) {
      t.updateWorldMatrix(false, false);
      const n = t.geometry;
      if (n !== void 0) {
        const s = n.getAttribute("position");
        if (e === true && s !== void 0 && t.isInstancedMesh !== true) for (let a = 0, o = s.count; a < o; a++) t.isMesh === true ? t.getVertexPosition(a, tn) : tn.fromBufferAttribute(s, a), tn.applyMatrix4(t.matrixWorld), this.expandByPoint(tn);
        else t.boundingBox !== void 0 ? (t.boundingBox === null && t.computeBoundingBox(), yr.copy(t.boundingBox)) : (n.boundingBox === null && n.computeBoundingBox(), yr.copy(n.boundingBox)), yr.applyMatrix4(t.matrixWorld), this.union(yr);
      }
      const r = t.children;
      for (let s = 0, a = r.length; s < a; s++) this.expandByObject(r[s], e);
      return this;
    }
    containsPoint(t) {
      return t.x >= this.min.x && t.x <= this.max.x && t.y >= this.min.y && t.y <= this.max.y && t.z >= this.min.z && t.z <= this.max.z;
    }
    containsBox(t) {
      return this.min.x <= t.min.x && t.max.x <= this.max.x && this.min.y <= t.min.y && t.max.y <= this.max.y && this.min.z <= t.min.z && t.max.z <= this.max.z;
    }
    getParameter(t, e) {
      return e.set((t.x - this.min.x) / (this.max.x - this.min.x), (t.y - this.min.y) / (this.max.y - this.min.y), (t.z - this.min.z) / (this.max.z - this.min.z));
    }
    intersectsBox(t) {
      return t.max.x >= this.min.x && t.min.x <= this.max.x && t.max.y >= this.min.y && t.min.y <= this.max.y && t.max.z >= this.min.z && t.min.z <= this.max.z;
    }
    intersectsSphere(t) {
      return this.clampPoint(t.center, tn), tn.distanceToSquared(t.center) <= t.radius * t.radius;
    }
    intersectsPlane(t) {
      let e, n;
      return t.normal.x > 0 ? (e = t.normal.x * this.min.x, n = t.normal.x * this.max.x) : (e = t.normal.x * this.max.x, n = t.normal.x * this.min.x), t.normal.y > 0 ? (e += t.normal.y * this.min.y, n += t.normal.y * this.max.y) : (e += t.normal.y * this.max.y, n += t.normal.y * this.min.y), t.normal.z > 0 ? (e += t.normal.z * this.min.z, n += t.normal.z * this.max.z) : (e += t.normal.z * this.max.z, n += t.normal.z * this.min.z), e <= -t.constant && n >= -t.constant;
    }
    intersectsTriangle(t) {
      if (this.isEmpty()) return false;
      this.getCenter(Qi), Mr.subVectors(this.max, Qi), gi.subVectors(t.a, Qi), wi.subVectors(t.b, Qi), vi.subVectors(t.c, Qi), Fn.subVectors(wi, gi), Nn.subVectors(vi, wi), Kn.subVectors(gi, vi);
      let e = [0, -Fn.z, Fn.y, 0, -Nn.z, Nn.y, 0, -Kn.z, Kn.y, Fn.z, 0, -Fn.x, Nn.z, 0, -Nn.x, Kn.z, 0, -Kn.x, -Fn.y, Fn.x, 0, -Nn.y, Nn.x, 0, -Kn.y, Kn.x, 0];
      return !Os(e, gi, wi, vi, Mr) || (e = [1, 0, 0, 0, 1, 0, 0, 0, 1], !Os(e, gi, wi, vi, Mr)) ? false : (Er.crossVectors(Fn, Nn), e = [Er.x, Er.y, Er.z], Os(e, gi, wi, vi, Mr));
    }
    clampPoint(t, e) {
      return e.copy(t).clamp(this.min, this.max);
    }
    distanceToPoint(t) {
      return this.clampPoint(t, tn).distanceTo(t);
    }
    getBoundingSphere(t) {
      return this.isEmpty() ? t.makeEmpty() : (this.getCenter(t.center), t.radius = this.getSize(tn).length() * 0.5), t;
    }
    intersect(t) {
      return this.min.max(t.min), this.max.min(t.max), this.isEmpty() && this.makeEmpty(), this;
    }
    union(t) {
      return this.min.min(t.min), this.max.max(t.max), this;
    }
    applyMatrix4(t) {
      return this.isEmpty() ? this : (wn[0].set(this.min.x, this.min.y, this.min.z).applyMatrix4(t), wn[1].set(this.min.x, this.min.y, this.max.z).applyMatrix4(t), wn[2].set(this.min.x, this.max.y, this.min.z).applyMatrix4(t), wn[3].set(this.min.x, this.max.y, this.max.z).applyMatrix4(t), wn[4].set(this.max.x, this.min.y, this.min.z).applyMatrix4(t), wn[5].set(this.max.x, this.min.y, this.max.z).applyMatrix4(t), wn[6].set(this.max.x, this.max.y, this.min.z).applyMatrix4(t), wn[7].set(this.max.x, this.max.y, this.max.z).applyMatrix4(t), this.setFromPoints(wn), this);
    }
    translate(t) {
      return this.min.add(t), this.max.add(t), this;
    }
    equals(t) {
      return t.min.equals(this.min) && t.max.equals(this.max);
    }
  }
  const wn = [new z(), new z(), new z(), new z(), new z(), new z(), new z(), new z()], tn = new z(), yr = new _r(), gi = new z(), wi = new z(), vi = new z(), Fn = new z(), Nn = new z(), Kn = new z(), Qi = new z(), Mr = new z(), Er = new z(), Zn = new z();
  function Os(i, t, e, n, r) {
    for (let s = 0, a = i.length - 3; s <= a; s += 3) {
      Zn.fromArray(i, s);
      const o = r.x * Math.abs(Zn.x) + r.y * Math.abs(Zn.y) + r.z * Math.abs(Zn.z), l = t.dot(Zn), c = e.dot(Zn), u = n.dot(Zn);
      if (Math.max(-Math.max(l, c, u), Math.min(l, c, u)) > o) return false;
    }
    return true;
  }
  const Wu = new _r(), tr = new z(), zs = new z();
  class bs {
    constructor(t = new z(), e = -1) {
      this.isSphere = true, this.center = t, this.radius = e;
    }
    set(t, e) {
      return this.center.copy(t), this.radius = e, this;
    }
    setFromPoints(t, e) {
      const n = this.center;
      e !== void 0 ? n.copy(e) : Wu.setFromPoints(t).getCenter(n);
      let r = 0;
      for (let s = 0, a = t.length; s < a; s++) r = Math.max(r, n.distanceToSquared(t[s]));
      return this.radius = Math.sqrt(r), this;
    }
    copy(t) {
      return this.center.copy(t.center), this.radius = t.radius, this;
    }
    isEmpty() {
      return this.radius < 0;
    }
    makeEmpty() {
      return this.center.set(0, 0, 0), this.radius = -1, this;
    }
    containsPoint(t) {
      return t.distanceToSquared(this.center) <= this.radius * this.radius;
    }
    distanceToPoint(t) {
      return t.distanceTo(this.center) - this.radius;
    }
    intersectsSphere(t) {
      const e = this.radius + t.radius;
      return t.center.distanceToSquared(this.center) <= e * e;
    }
    intersectsBox(t) {
      return t.intersectsSphere(this);
    }
    intersectsPlane(t) {
      return Math.abs(t.distanceToPoint(this.center)) <= this.radius;
    }
    clampPoint(t, e) {
      const n = this.center.distanceToSquared(t);
      return e.copy(t), n > this.radius * this.radius && (e.sub(this.center).normalize(), e.multiplyScalar(this.radius).add(this.center)), e;
    }
    getBoundingBox(t) {
      return this.isEmpty() ? (t.makeEmpty(), t) : (t.set(this.center, this.center), t.expandByScalar(this.radius), t);
    }
    applyMatrix4(t) {
      return this.center.applyMatrix4(t), this.radius = this.radius * t.getMaxScaleOnAxis(), this;
    }
    translate(t) {
      return this.center.add(t), this;
    }
    expandByPoint(t) {
      if (this.isEmpty()) return this.center.copy(t), this.radius = 0, this;
      tr.subVectors(t, this.center);
      const e = tr.lengthSq();
      if (e > this.radius * this.radius) {
        const n = Math.sqrt(e), r = (n - this.radius) * 0.5;
        this.center.addScaledVector(tr, r / n), this.radius += r;
      }
      return this;
    }
    union(t) {
      return t.isEmpty() ? this : this.isEmpty() ? (this.copy(t), this) : (this.center.equals(t.center) === true ? this.radius = Math.max(this.radius, t.radius) : (zs.subVectors(t.center, this.center).setLength(t.radius), this.expandByPoint(tr.copy(t.center).add(zs)), this.expandByPoint(tr.copy(t.center).sub(zs))), this);
    }
    equals(t) {
      return t.center.equals(this.center) && t.radius === this.radius;
    }
    clone() {
      return new this.constructor().copy(this);
    }
  }
  const vn = new z(), Bs = new z(), Tr = new z(), On = new z(), Hs = new z(), Rr = new z(), Gs = new z();
  let Xc = class {
    constructor(t = new z(), e = new z(0, 0, -1)) {
      this.origin = t, this.direction = e;
    }
    set(t, e) {
      return this.origin.copy(t), this.direction.copy(e), this;
    }
    copy(t) {
      return this.origin.copy(t.origin), this.direction.copy(t.direction), this;
    }
    at(t, e) {
      return e.copy(this.origin).addScaledVector(this.direction, t);
    }
    lookAt(t) {
      return this.direction.copy(t).sub(this.origin).normalize(), this;
    }
    recast(t) {
      return this.origin.copy(this.at(t, vn)), this;
    }
    closestPointToPoint(t, e) {
      e.subVectors(t, this.origin);
      const n = e.dot(this.direction);
      return n < 0 ? e.copy(this.origin) : e.copy(this.origin).addScaledVector(this.direction, n);
    }
    distanceToPoint(t) {
      return Math.sqrt(this.distanceSqToPoint(t));
    }
    distanceSqToPoint(t) {
      const e = vn.subVectors(t, this.origin).dot(this.direction);
      return e < 0 ? this.origin.distanceToSquared(t) : (vn.copy(this.origin).addScaledVector(this.direction, e), vn.distanceToSquared(t));
    }
    distanceSqToSegment(t, e, n, r) {
      Bs.copy(t).add(e).multiplyScalar(0.5), Tr.copy(e).sub(t).normalize(), On.copy(this.origin).sub(Bs);
      const s = t.distanceTo(e) * 0.5, a = -this.direction.dot(Tr), o = On.dot(this.direction), l = -On.dot(Tr), c = On.lengthSq(), u = Math.abs(1 - a * a);
      let f, p, _, g;
      if (u > 0) if (f = a * l - o, p = a * o - l, g = s * u, f >= 0) if (p >= -g) if (p <= g) {
        const v = 1 / u;
        f *= v, p *= v, _ = f * (f + a * p + 2 * o) + p * (a * f + p + 2 * l) + c;
      } else p = s, f = Math.max(0, -(a * p + o)), _ = -f * f + p * (p + 2 * l) + c;
      else p = -s, f = Math.max(0, -(a * p + o)), _ = -f * f + p * (p + 2 * l) + c;
      else p <= -g ? (f = Math.max(0, -(-a * s + o)), p = f > 0 ? -s : Math.min(Math.max(-s, -l), s), _ = -f * f + p * (p + 2 * l) + c) : p <= g ? (f = 0, p = Math.min(Math.max(-s, -l), s), _ = p * (p + 2 * l) + c) : (f = Math.max(0, -(a * s + o)), p = f > 0 ? s : Math.min(Math.max(-s, -l), s), _ = -f * f + p * (p + 2 * l) + c);
      else p = a > 0 ? -s : s, f = Math.max(0, -(a * p + o)), _ = -f * f + p * (p + 2 * l) + c;
      return n && n.copy(this.origin).addScaledVector(this.direction, f), r && r.copy(Bs).addScaledVector(Tr, p), _;
    }
    intersectSphere(t, e) {
      vn.subVectors(t.center, this.origin);
      const n = vn.dot(this.direction), r = vn.dot(vn) - n * n, s = t.radius * t.radius;
      if (r > s) return null;
      const a = Math.sqrt(s - r), o = n - a, l = n + a;
      return l < 0 ? null : o < 0 ? this.at(l, e) : this.at(o, e);
    }
    intersectsSphere(t) {
      return this.distanceSqToPoint(t.center) <= t.radius * t.radius;
    }
    distanceToPlane(t) {
      const e = t.normal.dot(this.direction);
      if (e === 0) return t.distanceToPoint(this.origin) === 0 ? 0 : null;
      const n = -(this.origin.dot(t.normal) + t.constant) / e;
      return n >= 0 ? n : null;
    }
    intersectPlane(t, e) {
      const n = this.distanceToPlane(t);
      return n === null ? null : this.at(n, e);
    }
    intersectsPlane(t) {
      const e = t.distanceToPoint(this.origin);
      return e === 0 || t.normal.dot(this.direction) * e < 0;
    }
    intersectBox(t, e) {
      let n, r, s, a, o, l;
      const c = 1 / this.direction.x, u = 1 / this.direction.y, f = 1 / this.direction.z, p = this.origin;
      return c >= 0 ? (n = (t.min.x - p.x) * c, r = (t.max.x - p.x) * c) : (n = (t.max.x - p.x) * c, r = (t.min.x - p.x) * c), u >= 0 ? (s = (t.min.y - p.y) * u, a = (t.max.y - p.y) * u) : (s = (t.max.y - p.y) * u, a = (t.min.y - p.y) * u), n > a || s > r || ((s > n || isNaN(n)) && (n = s), (a < r || isNaN(r)) && (r = a), f >= 0 ? (o = (t.min.z - p.z) * f, l = (t.max.z - p.z) * f) : (o = (t.max.z - p.z) * f, l = (t.min.z - p.z) * f), n > l || o > r) || ((o > n || n !== n) && (n = o), (l < r || r !== r) && (r = l), r < 0) ? null : this.at(n >= 0 ? n : r, e);
    }
    intersectsBox(t) {
      return this.intersectBox(t, vn) !== null;
    }
    intersectTriangle(t, e, n, r, s) {
      Hs.subVectors(e, t), Rr.subVectors(n, t), Gs.crossVectors(Hs, Rr);
      let a = this.direction.dot(Gs), o;
      if (a > 0) {
        if (r) return null;
        o = 1;
      } else if (a < 0) o = -1, a = -a;
      else return null;
      On.subVectors(this.origin, t);
      const l = o * this.direction.dot(Rr.crossVectors(On, Rr));
      if (l < 0) return null;
      const c = o * this.direction.dot(Hs.cross(On));
      if (c < 0 || l + c > a) return null;
      const u = -o * On.dot(Gs);
      return u < 0 ? null : this.at(u / a, s);
    }
    applyMatrix4(t) {
      return this.origin.applyMatrix4(t), this.direction.transformDirection(t), this;
    }
    equals(t) {
      return t.origin.equals(this.origin) && t.direction.equals(this.direction);
    }
    clone() {
      return new this.constructor().copy(this);
    }
  };
  class pe {
    constructor(t, e, n, r, s, a, o, l, c, u, f, p, _, g, v, m) {
      pe.prototype.isMatrix4 = true, this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], t !== void 0 && this.set(t, e, n, r, s, a, o, l, c, u, f, p, _, g, v, m);
    }
    set(t, e, n, r, s, a, o, l, c, u, f, p, _, g, v, m) {
      const d = this.elements;
      return d[0] = t, d[4] = e, d[8] = n, d[12] = r, d[1] = s, d[5] = a, d[9] = o, d[13] = l, d[2] = c, d[6] = u, d[10] = f, d[14] = p, d[3] = _, d[7] = g, d[11] = v, d[15] = m, this;
    }
    identity() {
      return this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), this;
    }
    clone() {
      return new pe().fromArray(this.elements);
    }
    copy(t) {
      const e = this.elements, n = t.elements;
      return e[0] = n[0], e[1] = n[1], e[2] = n[2], e[3] = n[3], e[4] = n[4], e[5] = n[5], e[6] = n[6], e[7] = n[7], e[8] = n[8], e[9] = n[9], e[10] = n[10], e[11] = n[11], e[12] = n[12], e[13] = n[13], e[14] = n[14], e[15] = n[15], this;
    }
    copyPosition(t) {
      const e = this.elements, n = t.elements;
      return e[12] = n[12], e[13] = n[13], e[14] = n[14], this;
    }
    setFromMatrix3(t) {
      const e = t.elements;
      return this.set(e[0], e[3], e[6], 0, e[1], e[4], e[7], 0, e[2], e[5], e[8], 0, 0, 0, 0, 1), this;
    }
    extractBasis(t, e, n) {
      return t.setFromMatrixColumn(this, 0), e.setFromMatrixColumn(this, 1), n.setFromMatrixColumn(this, 2), this;
    }
    makeBasis(t, e, n) {
      return this.set(t.x, e.x, n.x, 0, t.y, e.y, n.y, 0, t.z, e.z, n.z, 0, 0, 0, 0, 1), this;
    }
    extractRotation(t) {
      const e = this.elements, n = t.elements, r = 1 / bi.setFromMatrixColumn(t, 0).length(), s = 1 / bi.setFromMatrixColumn(t, 1).length(), a = 1 / bi.setFromMatrixColumn(t, 2).length();
      return e[0] = n[0] * r, e[1] = n[1] * r, e[2] = n[2] * r, e[3] = 0, e[4] = n[4] * s, e[5] = n[5] * s, e[6] = n[6] * s, e[7] = 0, e[8] = n[8] * a, e[9] = n[9] * a, e[10] = n[10] * a, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, this;
    }
    makeRotationFromEuler(t) {
      const e = this.elements, n = t.x, r = t.y, s = t.z, a = Math.cos(n), o = Math.sin(n), l = Math.cos(r), c = Math.sin(r), u = Math.cos(s), f = Math.sin(s);
      if (t.order === "XYZ") {
        const p = a * u, _ = a * f, g = o * u, v = o * f;
        e[0] = l * u, e[4] = -l * f, e[8] = c, e[1] = _ + g * c, e[5] = p - v * c, e[9] = -o * l, e[2] = v - p * c, e[6] = g + _ * c, e[10] = a * l;
      } else if (t.order === "YXZ") {
        const p = l * u, _ = l * f, g = c * u, v = c * f;
        e[0] = p + v * o, e[4] = g * o - _, e[8] = a * c, e[1] = a * f, e[5] = a * u, e[9] = -o, e[2] = _ * o - g, e[6] = v + p * o, e[10] = a * l;
      } else if (t.order === "ZXY") {
        const p = l * u, _ = l * f, g = c * u, v = c * f;
        e[0] = p - v * o, e[4] = -a * f, e[8] = g + _ * o, e[1] = _ + g * o, e[5] = a * u, e[9] = v - p * o, e[2] = -a * c, e[6] = o, e[10] = a * l;
      } else if (t.order === "ZYX") {
        const p = a * u, _ = a * f, g = o * u, v = o * f;
        e[0] = l * u, e[4] = g * c - _, e[8] = p * c + v, e[1] = l * f, e[5] = v * c + p, e[9] = _ * c - g, e[2] = -c, e[6] = o * l, e[10] = a * l;
      } else if (t.order === "YZX") {
        const p = a * l, _ = a * c, g = o * l, v = o * c;
        e[0] = l * u, e[4] = v - p * f, e[8] = g * f + _, e[1] = f, e[5] = a * u, e[9] = -o * u, e[2] = -c * u, e[6] = _ * f + g, e[10] = p - v * f;
      } else if (t.order === "XZY") {
        const p = a * l, _ = a * c, g = o * l, v = o * c;
        e[0] = l * u, e[4] = -f, e[8] = c * u, e[1] = p * f + v, e[5] = a * u, e[9] = _ * f - g, e[2] = g * f - _, e[6] = o * u, e[10] = v * f + p;
      }
      return e[3] = 0, e[7] = 0, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, this;
    }
    makeRotationFromQuaternion(t) {
      return this.compose(Xu, t, qu);
    }
    lookAt(t, e, n) {
      const r = this.elements;
      return ke.subVectors(t, e), ke.lengthSq() === 0 && (ke.z = 1), ke.normalize(), zn.crossVectors(n, ke), zn.lengthSq() === 0 && (Math.abs(n.z) === 1 ? ke.x += 1e-4 : ke.z += 1e-4, ke.normalize(), zn.crossVectors(n, ke)), zn.normalize(), Ar.crossVectors(ke, zn), r[0] = zn.x, r[4] = Ar.x, r[8] = ke.x, r[1] = zn.y, r[5] = Ar.y, r[9] = ke.y, r[2] = zn.z, r[6] = Ar.z, r[10] = ke.z, this;
    }
    multiply(t) {
      return this.multiplyMatrices(this, t);
    }
    premultiply(t) {
      return this.multiplyMatrices(t, this);
    }
    multiplyMatrices(t, e) {
      const n = t.elements, r = e.elements, s = this.elements, a = n[0], o = n[4], l = n[8], c = n[12], u = n[1], f = n[5], p = n[9], _ = n[13], g = n[2], v = n[6], m = n[10], d = n[14], T = n[3], E = n[7], y = n[11], H = n[15], P = r[0], A = r[4], N = r[8], S = r[12], x = r[1], C = r[5], W = r[9], V = r[13], Y = r[2], Q = r[6], j = r[10], et = r[14], q = r[3], ot = r[7], ft = r[11], Mt = r[15];
      return s[0] = a * P + o * x + l * Y + c * q, s[4] = a * A + o * C + l * Q + c * ot, s[8] = a * N + o * W + l * j + c * ft, s[12] = a * S + o * V + l * et + c * Mt, s[1] = u * P + f * x + p * Y + _ * q, s[5] = u * A + f * C + p * Q + _ * ot, s[9] = u * N + f * W + p * j + _ * ft, s[13] = u * S + f * V + p * et + _ * Mt, s[2] = g * P + v * x + m * Y + d * q, s[6] = g * A + v * C + m * Q + d * ot, s[10] = g * N + v * W + m * j + d * ft, s[14] = g * S + v * V + m * et + d * Mt, s[3] = T * P + E * x + y * Y + H * q, s[7] = T * A + E * C + y * Q + H * ot, s[11] = T * N + E * W + y * j + H * ft, s[15] = T * S + E * V + y * et + H * Mt, this;
    }
    multiplyScalar(t) {
      const e = this.elements;
      return e[0] *= t, e[4] *= t, e[8] *= t, e[12] *= t, e[1] *= t, e[5] *= t, e[9] *= t, e[13] *= t, e[2] *= t, e[6] *= t, e[10] *= t, e[14] *= t, e[3] *= t, e[7] *= t, e[11] *= t, e[15] *= t, this;
    }
    determinant() {
      const t = this.elements, e = t[0], n = t[4], r = t[8], s = t[12], a = t[1], o = t[5], l = t[9], c = t[13], u = t[2], f = t[6], p = t[10], _ = t[14], g = t[3], v = t[7], m = t[11], d = t[15];
      return g * (+s * l * f - r * c * f - s * o * p + n * c * p + r * o * _ - n * l * _) + v * (+e * l * _ - e * c * p + s * a * p - r * a * _ + r * c * u - s * l * u) + m * (+e * c * f - e * o * _ - s * a * f + n * a * _ + s * o * u - n * c * u) + d * (-r * o * u - e * l * f + e * o * p + r * a * f - n * a * p + n * l * u);
    }
    transpose() {
      const t = this.elements;
      let e;
      return e = t[1], t[1] = t[4], t[4] = e, e = t[2], t[2] = t[8], t[8] = e, e = t[6], t[6] = t[9], t[9] = e, e = t[3], t[3] = t[12], t[12] = e, e = t[7], t[7] = t[13], t[13] = e, e = t[11], t[11] = t[14], t[14] = e, this;
    }
    setPosition(t, e, n) {
      const r = this.elements;
      return t.isVector3 ? (r[12] = t.x, r[13] = t.y, r[14] = t.z) : (r[12] = t, r[13] = e, r[14] = n), this;
    }
    invert() {
      const t = this.elements, e = t[0], n = t[1], r = t[2], s = t[3], a = t[4], o = t[5], l = t[6], c = t[7], u = t[8], f = t[9], p = t[10], _ = t[11], g = t[12], v = t[13], m = t[14], d = t[15], T = f * m * c - v * p * c + v * l * _ - o * m * _ - f * l * d + o * p * d, E = g * p * c - u * m * c - g * l * _ + a * m * _ + u * l * d - a * p * d, y = u * v * c - g * f * c + g * o * _ - a * v * _ - u * o * d + a * f * d, H = g * f * l - u * v * l - g * o * p + a * v * p + u * o * m - a * f * m, P = e * T + n * E + r * y + s * H;
      if (P === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      const A = 1 / P;
      return t[0] = T * A, t[1] = (v * p * s - f * m * s - v * r * _ + n * m * _ + f * r * d - n * p * d) * A, t[2] = (o * m * s - v * l * s + v * r * c - n * m * c - o * r * d + n * l * d) * A, t[3] = (f * l * s - o * p * s - f * r * c + n * p * c + o * r * _ - n * l * _) * A, t[4] = E * A, t[5] = (u * m * s - g * p * s + g * r * _ - e * m * _ - u * r * d + e * p * d) * A, t[6] = (g * l * s - a * m * s - g * r * c + e * m * c + a * r * d - e * l * d) * A, t[7] = (a * p * s - u * l * s + u * r * c - e * p * c - a * r * _ + e * l * _) * A, t[8] = y * A, t[9] = (g * f * s - u * v * s - g * n * _ + e * v * _ + u * n * d - e * f * d) * A, t[10] = (a * v * s - g * o * s + g * n * c - e * v * c - a * n * d + e * o * d) * A, t[11] = (u * o * s - a * f * s - u * n * c + e * f * c + a * n * _ - e * o * _) * A, t[12] = H * A, t[13] = (u * v * r - g * f * r + g * n * p - e * v * p - u * n * m + e * f * m) * A, t[14] = (g * o * r - a * v * r - g * n * l + e * v * l + a * n * m - e * o * m) * A, t[15] = (a * f * r - u * o * r + u * n * l - e * f * l - a * n * p + e * o * p) * A, this;
    }
    scale(t) {
      const e = this.elements, n = t.x, r = t.y, s = t.z;
      return e[0] *= n, e[4] *= r, e[8] *= s, e[1] *= n, e[5] *= r, e[9] *= s, e[2] *= n, e[6] *= r, e[10] *= s, e[3] *= n, e[7] *= r, e[11] *= s, this;
    }
    getMaxScaleOnAxis() {
      const t = this.elements, e = t[0] * t[0] + t[1] * t[1] + t[2] * t[2], n = t[4] * t[4] + t[5] * t[5] + t[6] * t[6], r = t[8] * t[8] + t[9] * t[9] + t[10] * t[10];
      return Math.sqrt(Math.max(e, n, r));
    }
    makeTranslation(t, e, n) {
      return t.isVector3 ? this.set(1, 0, 0, t.x, 0, 1, 0, t.y, 0, 0, 1, t.z, 0, 0, 0, 1) : this.set(1, 0, 0, t, 0, 1, 0, e, 0, 0, 1, n, 0, 0, 0, 1), this;
    }
    makeRotationX(t) {
      const e = Math.cos(t), n = Math.sin(t);
      return this.set(1, 0, 0, 0, 0, e, -n, 0, 0, n, e, 0, 0, 0, 0, 1), this;
    }
    makeRotationY(t) {
      const e = Math.cos(t), n = Math.sin(t);
      return this.set(e, 0, n, 0, 0, 1, 0, 0, -n, 0, e, 0, 0, 0, 0, 1), this;
    }
    makeRotationZ(t) {
      const e = Math.cos(t), n = Math.sin(t);
      return this.set(e, -n, 0, 0, n, e, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), this;
    }
    makeRotationAxis(t, e) {
      const n = Math.cos(e), r = Math.sin(e), s = 1 - n, a = t.x, o = t.y, l = t.z, c = s * a, u = s * o;
      return this.set(c * a + n, c * o - r * l, c * l + r * o, 0, c * o + r * l, u * o + n, u * l - r * a, 0, c * l - r * o, u * l + r * a, s * l * l + n, 0, 0, 0, 0, 1), this;
    }
    makeScale(t, e, n) {
      return this.set(t, 0, 0, 0, 0, e, 0, 0, 0, 0, n, 0, 0, 0, 0, 1), this;
    }
    makeShear(t, e, n, r, s, a) {
      return this.set(1, n, s, 0, t, 1, a, 0, e, r, 1, 0, 0, 0, 0, 1), this;
    }
    compose(t, e, n) {
      const r = this.elements, s = e._x, a = e._y, o = e._z, l = e._w, c = s + s, u = a + a, f = o + o, p = s * c, _ = s * u, g = s * f, v = a * u, m = a * f, d = o * f, T = l * c, E = l * u, y = l * f, H = n.x, P = n.y, A = n.z;
      return r[0] = (1 - (v + d)) * H, r[1] = (_ + y) * H, r[2] = (g - E) * H, r[3] = 0, r[4] = (_ - y) * P, r[5] = (1 - (p + d)) * P, r[6] = (m + T) * P, r[7] = 0, r[8] = (g + E) * A, r[9] = (m - T) * A, r[10] = (1 - (p + v)) * A, r[11] = 0, r[12] = t.x, r[13] = t.y, r[14] = t.z, r[15] = 1, this;
    }
    decompose(t, e, n) {
      const r = this.elements;
      let s = bi.set(r[0], r[1], r[2]).length();
      const a = bi.set(r[4], r[5], r[6]).length(), o = bi.set(r[8], r[9], r[10]).length();
      this.determinant() < 0 && (s = -s), t.x = r[12], t.y = r[13], t.z = r[14], en.copy(this);
      const c = 1 / s, u = 1 / a, f = 1 / o;
      return en.elements[0] *= c, en.elements[1] *= c, en.elements[2] *= c, en.elements[4] *= u, en.elements[5] *= u, en.elements[6] *= u, en.elements[8] *= f, en.elements[9] *= f, en.elements[10] *= f, e.setFromRotationMatrix(en), n.x = s, n.y = a, n.z = o, this;
    }
    makePerspective(t, e, n, r, s, a, o = Rn) {
      const l = this.elements, c = 2 * s / (e - t), u = 2 * s / (n - r), f = (e + t) / (e - t), p = (n + r) / (n - r);
      let _, g;
      if (o === Rn) _ = -(a + s) / (a - s), g = -2 * a * s / (a - s);
      else if (o === is) _ = -a / (a - s), g = -a * s / (a - s);
      else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: " + o);
      return l[0] = c, l[4] = 0, l[8] = f, l[12] = 0, l[1] = 0, l[5] = u, l[9] = p, l[13] = 0, l[2] = 0, l[6] = 0, l[10] = _, l[14] = g, l[3] = 0, l[7] = 0, l[11] = -1, l[15] = 0, this;
    }
    makeOrthographic(t, e, n, r, s, a, o = Rn) {
      const l = this.elements, c = 1 / (e - t), u = 1 / (n - r), f = 1 / (a - s), p = (e + t) * c, _ = (n + r) * u;
      let g, v;
      if (o === Rn) g = (a + s) * f, v = -2 * f;
      else if (o === is) g = s * f, v = -1 * f;
      else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: " + o);
      return l[0] = 2 * c, l[4] = 0, l[8] = 0, l[12] = -p, l[1] = 0, l[5] = 2 * u, l[9] = 0, l[13] = -_, l[2] = 0, l[6] = 0, l[10] = v, l[14] = -g, l[3] = 0, l[7] = 0, l[11] = 0, l[15] = 1, this;
    }
    equals(t) {
      const e = this.elements, n = t.elements;
      for (let r = 0; r < 16; r++) if (e[r] !== n[r]) return false;
      return true;
    }
    fromArray(t, e = 0) {
      for (let n = 0; n < 16; n++) this.elements[n] = t[n + e];
      return this;
    }
    toArray(t = [], e = 0) {
      const n = this.elements;
      return t[e] = n[0], t[e + 1] = n[1], t[e + 2] = n[2], t[e + 3] = n[3], t[e + 4] = n[4], t[e + 5] = n[5], t[e + 6] = n[6], t[e + 7] = n[7], t[e + 8] = n[8], t[e + 9] = n[9], t[e + 10] = n[10], t[e + 11] = n[11], t[e + 12] = n[12], t[e + 13] = n[13], t[e + 14] = n[14], t[e + 15] = n[15], t;
    }
  }
  const bi = new z(), en = new pe(), Xu = new z(0, 0, 0), qu = new z(1, 1, 1), zn = new z(), Ar = new z(), ke = new z(), hl = new pe(), ul = new qi();
  class pn {
    constructor(t = 0, e = 0, n = 0, r = pn.DEFAULT_ORDER) {
      this.isEuler = true, this._x = t, this._y = e, this._z = n, this._order = r;
    }
    get x() {
      return this._x;
    }
    set x(t) {
      this._x = t, this._onChangeCallback();
    }
    get y() {
      return this._y;
    }
    set y(t) {
      this._y = t, this._onChangeCallback();
    }
    get z() {
      return this._z;
    }
    set z(t) {
      this._z = t, this._onChangeCallback();
    }
    get order() {
      return this._order;
    }
    set order(t) {
      this._order = t, this._onChangeCallback();
    }
    set(t, e, n, r = this._order) {
      return this._x = t, this._y = e, this._z = n, this._order = r, this._onChangeCallback(), this;
    }
    clone() {
      return new this.constructor(this._x, this._y, this._z, this._order);
    }
    copy(t) {
      return this._x = t._x, this._y = t._y, this._z = t._z, this._order = t._order, this._onChangeCallback(), this;
    }
    setFromRotationMatrix(t, e = this._order, n = true) {
      const r = t.elements, s = r[0], a = r[4], o = r[8], l = r[1], c = r[5], u = r[9], f = r[2], p = r[6], _ = r[10];
      switch (e) {
        case "XYZ":
          this._y = Math.asin(Oe(o, -1, 1)), Math.abs(o) < 0.9999999 ? (this._x = Math.atan2(-u, _), this._z = Math.atan2(-a, s)) : (this._x = Math.atan2(p, c), this._z = 0);
          break;
        case "YXZ":
          this._x = Math.asin(-Oe(u, -1, 1)), Math.abs(u) < 0.9999999 ? (this._y = Math.atan2(o, _), this._z = Math.atan2(l, c)) : (this._y = Math.atan2(-f, s), this._z = 0);
          break;
        case "ZXY":
          this._x = Math.asin(Oe(p, -1, 1)), Math.abs(p) < 0.9999999 ? (this._y = Math.atan2(-f, _), this._z = Math.atan2(-a, c)) : (this._y = 0, this._z = Math.atan2(l, s));
          break;
        case "ZYX":
          this._y = Math.asin(-Oe(f, -1, 1)), Math.abs(f) < 0.9999999 ? (this._x = Math.atan2(p, _), this._z = Math.atan2(l, s)) : (this._x = 0, this._z = Math.atan2(-a, c));
          break;
        case "YZX":
          this._z = Math.asin(Oe(l, -1, 1)), Math.abs(l) < 0.9999999 ? (this._x = Math.atan2(-u, c), this._y = Math.atan2(-f, s)) : (this._x = 0, this._y = Math.atan2(o, _));
          break;
        case "XZY":
          this._z = Math.asin(-Oe(a, -1, 1)), Math.abs(a) < 0.9999999 ? (this._x = Math.atan2(p, c), this._y = Math.atan2(o, s)) : (this._x = Math.atan2(-u, _), this._y = 0);
          break;
        default:
          console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: " + e);
      }
      return this._order = e, n === true && this._onChangeCallback(), this;
    }
    setFromQuaternion(t, e, n) {
      return hl.makeRotationFromQuaternion(t), this.setFromRotationMatrix(hl, e, n);
    }
    setFromVector3(t, e = this._order) {
      return this.set(t.x, t.y, t.z, e);
    }
    reorder(t) {
      return ul.setFromEuler(this), this.setFromQuaternion(ul, t);
    }
    equals(t) {
      return t._x === this._x && t._y === this._y && t._z === this._z && t._order === this._order;
    }
    fromArray(t) {
      return this._x = t[0], this._y = t[1], this._z = t[2], t[3] !== void 0 && (this._order = t[3]), this._onChangeCallback(), this;
    }
    toArray(t = [], e = 0) {
      return t[e] = this._x, t[e + 1] = this._y, t[e + 2] = this._z, t[e + 3] = this._order, t;
    }
    _onChange(t) {
      return this._onChangeCallback = t, this;
    }
    _onChangeCallback() {
    }
    *[Symbol.iterator]() {
      yield this._x, yield this._y, yield this._z, yield this._order;
    }
  }
  pn.DEFAULT_ORDER = "XYZ";
  class qc {
    constructor() {
      this.mask = 1;
    }
    set(t) {
      this.mask = (1 << t | 0) >>> 0;
    }
    enable(t) {
      this.mask |= 1 << t | 0;
    }
    enableAll() {
      this.mask = -1;
    }
    toggle(t) {
      this.mask ^= 1 << t | 0;
    }
    disable(t) {
      this.mask &= ~(1 << t | 0);
    }
    disableAll() {
      this.mask = 0;
    }
    test(t) {
      return (this.mask & t.mask) !== 0;
    }
    isEnabled(t) {
      return (this.mask & (1 << t | 0)) !== 0;
    }
  }
  let ju = 0;
  const dl = new z(), xi = new qi(), bn = new pe(), Cr = new z(), er = new z(), Yu = new z(), Ku = new qi(), fl = new z(1, 0, 0), pl = new z(0, 1, 0), _l = new z(0, 0, 1), ml = { type: "added" }, Zu = { type: "removed" }, Si = { type: "childadded", child: null }, ks = { type: "childremoved", child: null };
  class Ae extends Xi {
    constructor() {
      super(), this.isObject3D = true, Object.defineProperty(this, "id", { value: ju++ }), this.uuid = pr(), this.name = "", this.type = "Object3D", this.parent = null, this.children = [], this.up = Ae.DEFAULT_UP.clone();
      const t = new z(), e = new pn(), n = new qi(), r = new z(1, 1, 1);
      function s() {
        n.setFromEuler(e, false);
      }
      function a() {
        e.setFromQuaternion(n, void 0, false);
      }
      e._onChange(s), n._onChange(a), Object.defineProperties(this, { position: { configurable: true, enumerable: true, value: t }, rotation: { configurable: true, enumerable: true, value: e }, quaternion: { configurable: true, enumerable: true, value: n }, scale: { configurable: true, enumerable: true, value: r }, modelViewMatrix: { value: new pe() }, normalMatrix: { value: new Nt() } }), this.matrix = new pe(), this.matrixWorld = new pe(), this.matrixAutoUpdate = Ae.DEFAULT_MATRIX_AUTO_UPDATE, this.matrixWorldAutoUpdate = Ae.DEFAULT_MATRIX_WORLD_AUTO_UPDATE, this.matrixWorldNeedsUpdate = false, this.layers = new qc(), this.visible = true, this.castShadow = false, this.receiveShadow = false, this.frustumCulled = true, this.renderOrder = 0, this.animations = [], this.userData = {};
    }
    onBeforeShadow() {
    }
    onAfterShadow() {
    }
    onBeforeRender() {
    }
    onAfterRender() {
    }
    applyMatrix4(t) {
      this.matrixAutoUpdate && this.updateMatrix(), this.matrix.premultiply(t), this.matrix.decompose(this.position, this.quaternion, this.scale);
    }
    applyQuaternion(t) {
      return this.quaternion.premultiply(t), this;
    }
    setRotationFromAxisAngle(t, e) {
      this.quaternion.setFromAxisAngle(t, e);
    }
    setRotationFromEuler(t) {
      this.quaternion.setFromEuler(t, true);
    }
    setRotationFromMatrix(t) {
      this.quaternion.setFromRotationMatrix(t);
    }
    setRotationFromQuaternion(t) {
      this.quaternion.copy(t);
    }
    rotateOnAxis(t, e) {
      return xi.setFromAxisAngle(t, e), this.quaternion.multiply(xi), this;
    }
    rotateOnWorldAxis(t, e) {
      return xi.setFromAxisAngle(t, e), this.quaternion.premultiply(xi), this;
    }
    rotateX(t) {
      return this.rotateOnAxis(fl, t);
    }
    rotateY(t) {
      return this.rotateOnAxis(pl, t);
    }
    rotateZ(t) {
      return this.rotateOnAxis(_l, t);
    }
    translateOnAxis(t, e) {
      return dl.copy(t).applyQuaternion(this.quaternion), this.position.add(dl.multiplyScalar(e)), this;
    }
    translateX(t) {
      return this.translateOnAxis(fl, t);
    }
    translateY(t) {
      return this.translateOnAxis(pl, t);
    }
    translateZ(t) {
      return this.translateOnAxis(_l, t);
    }
    localToWorld(t) {
      return this.updateWorldMatrix(true, false), t.applyMatrix4(this.matrixWorld);
    }
    worldToLocal(t) {
      return this.updateWorldMatrix(true, false), t.applyMatrix4(bn.copy(this.matrixWorld).invert());
    }
    lookAt(t, e, n) {
      t.isVector3 ? Cr.copy(t) : Cr.set(t, e, n);
      const r = this.parent;
      this.updateWorldMatrix(true, false), er.setFromMatrixPosition(this.matrixWorld), this.isCamera || this.isLight ? bn.lookAt(er, Cr, this.up) : bn.lookAt(Cr, er, this.up), this.quaternion.setFromRotationMatrix(bn), r && (bn.extractRotation(r.matrixWorld), xi.setFromRotationMatrix(bn), this.quaternion.premultiply(xi.invert()));
    }
    add(t) {
      if (arguments.length > 1) {
        for (let e = 0; e < arguments.length; e++) this.add(arguments[e]);
        return this;
      }
      return t === this ? (console.error("THREE.Object3D.add: object can't be added as a child of itself.", t), this) : (t && t.isObject3D ? (t.removeFromParent(), t.parent = this, this.children.push(t), t.dispatchEvent(ml), Si.child = t, this.dispatchEvent(Si), Si.child = null) : console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.", t), this);
    }
    remove(t) {
      if (arguments.length > 1) {
        for (let n = 0; n < arguments.length; n++) this.remove(arguments[n]);
        return this;
      }
      const e = this.children.indexOf(t);
      return e !== -1 && (t.parent = null, this.children.splice(e, 1), t.dispatchEvent(Zu), ks.child = t, this.dispatchEvent(ks), ks.child = null), this;
    }
    removeFromParent() {
      const t = this.parent;
      return t !== null && t.remove(this), this;
    }
    clear() {
      return this.remove(...this.children);
    }
    attach(t) {
      return this.updateWorldMatrix(true, false), bn.copy(this.matrixWorld).invert(), t.parent !== null && (t.parent.updateWorldMatrix(true, false), bn.multiply(t.parent.matrixWorld)), t.applyMatrix4(bn), t.removeFromParent(), t.parent = this, this.children.push(t), t.updateWorldMatrix(false, true), t.dispatchEvent(ml), Si.child = t, this.dispatchEvent(Si), Si.child = null, this;
    }
    getObjectById(t) {
      return this.getObjectByProperty("id", t);
    }
    getObjectByName(t) {
      return this.getObjectByProperty("name", t);
    }
    getObjectByProperty(t, e) {
      if (this[t] === e) return this;
      for (let n = 0, r = this.children.length; n < r; n++) {
        const a = this.children[n].getObjectByProperty(t, e);
        if (a !== void 0) return a;
      }
    }
    getObjectsByProperty(t, e, n = []) {
      this[t] === e && n.push(this);
      const r = this.children;
      for (let s = 0, a = r.length; s < a; s++) r[s].getObjectsByProperty(t, e, n);
      return n;
    }
    getWorldPosition(t) {
      return this.updateWorldMatrix(true, false), t.setFromMatrixPosition(this.matrixWorld);
    }
    getWorldQuaternion(t) {
      return this.updateWorldMatrix(true, false), this.matrixWorld.decompose(er, t, Yu), t;
    }
    getWorldScale(t) {
      return this.updateWorldMatrix(true, false), this.matrixWorld.decompose(er, Ku, t), t;
    }
    getWorldDirection(t) {
      this.updateWorldMatrix(true, false);
      const e = this.matrixWorld.elements;
      return t.set(e[8], e[9], e[10]).normalize();
    }
    raycast() {
    }
    traverse(t) {
      t(this);
      const e = this.children;
      for (let n = 0, r = e.length; n < r; n++) e[n].traverse(t);
    }
    traverseVisible(t) {
      if (this.visible === false) return;
      t(this);
      const e = this.children;
      for (let n = 0, r = e.length; n < r; n++) e[n].traverseVisible(t);
    }
    traverseAncestors(t) {
      const e = this.parent;
      e !== null && (t(e), e.traverseAncestors(t));
    }
    updateMatrix() {
      this.matrix.compose(this.position, this.quaternion, this.scale), this.matrixWorldNeedsUpdate = true;
    }
    updateMatrixWorld(t) {
      this.matrixAutoUpdate && this.updateMatrix(), (this.matrixWorldNeedsUpdate || t) && (this.matrixWorldAutoUpdate === true && (this.parent === null ? this.matrixWorld.copy(this.matrix) : this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)), this.matrixWorldNeedsUpdate = false, t = true);
      const e = this.children;
      for (let n = 0, r = e.length; n < r; n++) e[n].updateMatrixWorld(t);
    }
    updateWorldMatrix(t, e) {
      const n = this.parent;
      if (t === true && n !== null && n.updateWorldMatrix(true, false), this.matrixAutoUpdate && this.updateMatrix(), this.matrixWorldAutoUpdate === true && (this.parent === null ? this.matrixWorld.copy(this.matrix) : this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)), e === true) {
        const r = this.children;
        for (let s = 0, a = r.length; s < a; s++) r[s].updateWorldMatrix(false, true);
      }
    }
    toJSON(t) {
      const e = t === void 0 || typeof t == "string", n = {};
      e && (t = { geometries: {}, materials: {}, textures: {}, images: {}, shapes: {}, skeletons: {}, animations: {}, nodes: {} }, n.metadata = { version: 4.6, type: "Object", generator: "Object3D.toJSON" });
      const r = {};
      r.uuid = this.uuid, r.type = this.type, this.name !== "" && (r.name = this.name), this.castShadow === true && (r.castShadow = true), this.receiveShadow === true && (r.receiveShadow = true), this.visible === false && (r.visible = false), this.frustumCulled === false && (r.frustumCulled = false), this.renderOrder !== 0 && (r.renderOrder = this.renderOrder), Object.keys(this.userData).length > 0 && (r.userData = this.userData), r.layers = this.layers.mask, r.matrix = this.matrix.toArray(), r.up = this.up.toArray(), this.matrixAutoUpdate === false && (r.matrixAutoUpdate = false), this.isInstancedMesh && (r.type = "InstancedMesh", r.count = this.count, r.instanceMatrix = this.instanceMatrix.toJSON(), this.instanceColor !== null && (r.instanceColor = this.instanceColor.toJSON())), this.isBatchedMesh && (r.type = "BatchedMesh", r.perObjectFrustumCulled = this.perObjectFrustumCulled, r.sortObjects = this.sortObjects, r.drawRanges = this._drawRanges, r.reservedRanges = this._reservedRanges, r.visibility = this._visibility, r.active = this._active, r.bounds = this._bounds.map((o) => ({ boxInitialized: o.boxInitialized, boxMin: o.box.min.toArray(), boxMax: o.box.max.toArray(), sphereInitialized: o.sphereInitialized, sphereRadius: o.sphere.radius, sphereCenter: o.sphere.center.toArray() })), r.maxInstanceCount = this._maxInstanceCount, r.maxVertexCount = this._maxVertexCount, r.maxIndexCount = this._maxIndexCount, r.geometryInitialized = this._geometryInitialized, r.geometryCount = this._geometryCount, r.matricesTexture = this._matricesTexture.toJSON(t), this._colorsTexture !== null && (r.colorsTexture = this._colorsTexture.toJSON(t)), this.boundingSphere !== null && (r.boundingSphere = { center: r.boundingSphere.center.toArray(), radius: r.boundingSphere.radius }), this.boundingBox !== null && (r.boundingBox = { min: r.boundingBox.min.toArray(), max: r.boundingBox.max.toArray() }));
      function s(o, l) {
        return o[l.uuid] === void 0 && (o[l.uuid] = l.toJSON(t)), l.uuid;
      }
      if (this.isScene) this.background && (this.background.isColor ? r.background = this.background.toJSON() : this.background.isTexture && (r.background = this.background.toJSON(t).uuid)), this.environment && this.environment.isTexture && this.environment.isRenderTargetTexture !== true && (r.environment = this.environment.toJSON(t).uuid);
      else if (this.isMesh || this.isLine || this.isPoints) {
        r.geometry = s(t.geometries, this.geometry);
        const o = this.geometry.parameters;
        if (o !== void 0 && o.shapes !== void 0) {
          const l = o.shapes;
          if (Array.isArray(l)) for (let c = 0, u = l.length; c < u; c++) {
            const f = l[c];
            s(t.shapes, f);
          }
          else s(t.shapes, l);
        }
      }
      if (this.isSkinnedMesh && (r.bindMode = this.bindMode, r.bindMatrix = this.bindMatrix.toArray(), this.skeleton !== void 0 && (s(t.skeletons, this.skeleton), r.skeleton = this.skeleton.uuid)), this.material !== void 0) if (Array.isArray(this.material)) {
        const o = [];
        for (let l = 0, c = this.material.length; l < c; l++) o.push(s(t.materials, this.material[l]));
        r.material = o;
      } else r.material = s(t.materials, this.material);
      if (this.children.length > 0) {
        r.children = [];
        for (let o = 0; o < this.children.length; o++) r.children.push(this.children[o].toJSON(t).object);
      }
      if (this.animations.length > 0) {
        r.animations = [];
        for (let o = 0; o < this.animations.length; o++) {
          const l = this.animations[o];
          r.animations.push(s(t.animations, l));
        }
      }
      if (e) {
        const o = a(t.geometries), l = a(t.materials), c = a(t.textures), u = a(t.images), f = a(t.shapes), p = a(t.skeletons), _ = a(t.animations), g = a(t.nodes);
        o.length > 0 && (n.geometries = o), l.length > 0 && (n.materials = l), c.length > 0 && (n.textures = c), u.length > 0 && (n.images = u), f.length > 0 && (n.shapes = f), p.length > 0 && (n.skeletons = p), _.length > 0 && (n.animations = _), g.length > 0 && (n.nodes = g);
      }
      return n.object = r, n;
      function a(o) {
        const l = [];
        for (const c in o) {
          const u = o[c];
          delete u.metadata, l.push(u);
        }
        return l;
      }
    }
    clone(t) {
      return new this.constructor().copy(this, t);
    }
    copy(t, e = true) {
      if (this.name = t.name, this.up.copy(t.up), this.position.copy(t.position), this.rotation.order = t.rotation.order, this.quaternion.copy(t.quaternion), this.scale.copy(t.scale), this.matrix.copy(t.matrix), this.matrixWorld.copy(t.matrixWorld), this.matrixAutoUpdate = t.matrixAutoUpdate, this.matrixWorldAutoUpdate = t.matrixWorldAutoUpdate, this.matrixWorldNeedsUpdate = t.matrixWorldNeedsUpdate, this.layers.mask = t.layers.mask, this.visible = t.visible, this.castShadow = t.castShadow, this.receiveShadow = t.receiveShadow, this.frustumCulled = t.frustumCulled, this.renderOrder = t.renderOrder, this.animations = t.animations.slice(), this.userData = JSON.parse(JSON.stringify(t.userData)), e === true) for (let n = 0; n < t.children.length; n++) {
        const r = t.children[n];
        this.add(r.clone());
      }
      return this;
    }
  }
  Ae.DEFAULT_UP = new z(0, 1, 0);
  Ae.DEFAULT_MATRIX_AUTO_UPDATE = true;
  Ae.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = true;
  const nn = new z(), xn = new z(), Vs = new z(), Sn = new z(), yi = new z(), Mi = new z(), gl = new z(), Ws = new z(), Xs = new z(), qs = new z(), js = new me(), Ys = new me(), Ks = new me();
  let nr = class Ci {
    constructor(t = new z(), e = new z(), n = new z()) {
      this.a = t, this.b = e, this.c = n;
    }
    static getNormal(t, e, n, r) {
      r.subVectors(n, e), nn.subVectors(t, e), r.cross(nn);
      const s = r.lengthSq();
      return s > 0 ? r.multiplyScalar(1 / Math.sqrt(s)) : r.set(0, 0, 0);
    }
    static getBarycoord(t, e, n, r, s) {
      nn.subVectors(r, e), xn.subVectors(n, e), Vs.subVectors(t, e);
      const a = nn.dot(nn), o = nn.dot(xn), l = nn.dot(Vs), c = xn.dot(xn), u = xn.dot(Vs), f = a * c - o * o;
      if (f === 0) return s.set(0, 0, 0), null;
      const p = 1 / f, _ = (c * l - o * u) * p, g = (a * u - o * l) * p;
      return s.set(1 - _ - g, g, _);
    }
    static containsPoint(t, e, n, r) {
      return this.getBarycoord(t, e, n, r, Sn) === null ? false : Sn.x >= 0 && Sn.y >= 0 && Sn.x + Sn.y <= 1;
    }
    static getInterpolation(t, e, n, r, s, a, o, l) {
      return this.getBarycoord(t, e, n, r, Sn) === null ? (l.x = 0, l.y = 0, "z" in l && (l.z = 0), "w" in l && (l.w = 0), null) : (l.setScalar(0), l.addScaledVector(s, Sn.x), l.addScaledVector(a, Sn.y), l.addScaledVector(o, Sn.z), l);
    }
    static getInterpolatedAttribute(t, e, n, r, s, a) {
      return js.setScalar(0), Ys.setScalar(0), Ks.setScalar(0), js.fromBufferAttribute(t, e), Ys.fromBufferAttribute(t, n), Ks.fromBufferAttribute(t, r), a.setScalar(0), a.addScaledVector(js, s.x), a.addScaledVector(Ys, s.y), a.addScaledVector(Ks, s.z), a;
    }
    static isFrontFacing(t, e, n, r) {
      return nn.subVectors(n, e), xn.subVectors(t, e), nn.cross(xn).dot(r) < 0;
    }
    set(t, e, n) {
      return this.a.copy(t), this.b.copy(e), this.c.copy(n), this;
    }
    setFromPointsAndIndices(t, e, n, r) {
      return this.a.copy(t[e]), this.b.copy(t[n]), this.c.copy(t[r]), this;
    }
    setFromAttributeAndIndices(t, e, n, r) {
      return this.a.fromBufferAttribute(t, e), this.b.fromBufferAttribute(t, n), this.c.fromBufferAttribute(t, r), this;
    }
    clone() {
      return new this.constructor().copy(this);
    }
    copy(t) {
      return this.a.copy(t.a), this.b.copy(t.b), this.c.copy(t.c), this;
    }
    getArea() {
      return nn.subVectors(this.c, this.b), xn.subVectors(this.a, this.b), nn.cross(xn).length() * 0.5;
    }
    getMidpoint(t) {
      return t.addVectors(this.a, this.b).add(this.c).multiplyScalar(1 / 3);
    }
    getNormal(t) {
      return Ci.getNormal(this.a, this.b, this.c, t);
    }
    getPlane(t) {
      return t.setFromCoplanarPoints(this.a, this.b, this.c);
    }
    getBarycoord(t, e) {
      return Ci.getBarycoord(t, this.a, this.b, this.c, e);
    }
    getInterpolation(t, e, n, r, s) {
      return Ci.getInterpolation(t, this.a, this.b, this.c, e, n, r, s);
    }
    containsPoint(t) {
      return Ci.containsPoint(t, this.a, this.b, this.c);
    }
    isFrontFacing(t) {
      return Ci.isFrontFacing(this.a, this.b, this.c, t);
    }
    intersectsBox(t) {
      return t.intersectsTriangle(this);
    }
    closestPointToPoint(t, e) {
      const n = this.a, r = this.b, s = this.c;
      let a, o;
      yi.subVectors(r, n), Mi.subVectors(s, n), Ws.subVectors(t, n);
      const l = yi.dot(Ws), c = Mi.dot(Ws);
      if (l <= 0 && c <= 0) return e.copy(n);
      Xs.subVectors(t, r);
      const u = yi.dot(Xs), f = Mi.dot(Xs);
      if (u >= 0 && f <= u) return e.copy(r);
      const p = l * f - u * c;
      if (p <= 0 && l >= 0 && u <= 0) return a = l / (l - u), e.copy(n).addScaledVector(yi, a);
      qs.subVectors(t, s);
      const _ = yi.dot(qs), g = Mi.dot(qs);
      if (g >= 0 && _ <= g) return e.copy(s);
      const v = _ * c - l * g;
      if (v <= 0 && c >= 0 && g <= 0) return o = c / (c - g), e.copy(n).addScaledVector(Mi, o);
      const m = u * g - _ * f;
      if (m <= 0 && f - u >= 0 && _ - g >= 0) return gl.subVectors(s, r), o = (f - u) / (f - u + (_ - g)), e.copy(r).addScaledVector(gl, o);
      const d = 1 / (m + v + p);
      return a = v * d, o = p * d, e.copy(n).addScaledVector(yi, a).addScaledVector(Mi, o);
    }
    equals(t) {
      return t.a.equals(this.a) && t.b.equals(this.b) && t.c.equals(this.c);
    }
  };
  const jc = { aliceblue: 15792383, antiquewhite: 16444375, aqua: 65535, aquamarine: 8388564, azure: 15794175, beige: 16119260, bisque: 16770244, black: 0, blanchedalmond: 16772045, blue: 255, blueviolet: 9055202, brown: 10824234, burlywood: 14596231, cadetblue: 6266528, chartreuse: 8388352, chocolate: 13789470, coral: 16744272, cornflowerblue: 6591981, cornsilk: 16775388, crimson: 14423100, cyan: 65535, darkblue: 139, darkcyan: 35723, darkgoldenrod: 12092939, darkgray: 11119017, darkgreen: 25600, darkgrey: 11119017, darkkhaki: 12433259, darkmagenta: 9109643, darkolivegreen: 5597999, darkorange: 16747520, darkorchid: 10040012, darkred: 9109504, darksalmon: 15308410, darkseagreen: 9419919, darkslateblue: 4734347, darkslategray: 3100495, darkslategrey: 3100495, darkturquoise: 52945, darkviolet: 9699539, deeppink: 16716947, deepskyblue: 49151, dimgray: 6908265, dimgrey: 6908265, dodgerblue: 2003199, firebrick: 11674146, floralwhite: 16775920, forestgreen: 2263842, fuchsia: 16711935, gainsboro: 14474460, ghostwhite: 16316671, gold: 16766720, goldenrod: 14329120, gray: 8421504, green: 32768, greenyellow: 11403055, grey: 8421504, honeydew: 15794160, hotpink: 16738740, indianred: 13458524, indigo: 4915330, ivory: 16777200, khaki: 15787660, lavender: 15132410, lavenderblush: 16773365, lawngreen: 8190976, lemonchiffon: 16775885, lightblue: 11393254, lightcoral: 15761536, lightcyan: 14745599, lightgoldenrodyellow: 16448210, lightgray: 13882323, lightgreen: 9498256, lightgrey: 13882323, lightpink: 16758465, lightsalmon: 16752762, lightseagreen: 2142890, lightskyblue: 8900346, lightslategray: 7833753, lightslategrey: 7833753, lightsteelblue: 11584734, lightyellow: 16777184, lime: 65280, limegreen: 3329330, linen: 16445670, magenta: 16711935, maroon: 8388608, mediumaquamarine: 6737322, mediumblue: 205, mediumorchid: 12211667, mediumpurple: 9662683, mediumseagreen: 3978097, mediumslateblue: 8087790, mediumspringgreen: 64154, mediumturquoise: 4772300, mediumvioletred: 13047173, midnightblue: 1644912, mintcream: 16121850, mistyrose: 16770273, moccasin: 16770229, navajowhite: 16768685, navy: 128, oldlace: 16643558, olive: 8421376, olivedrab: 7048739, orange: 16753920, orangered: 16729344, orchid: 14315734, palegoldenrod: 15657130, palegreen: 10025880, paleturquoise: 11529966, palevioletred: 14381203, papayawhip: 16773077, peachpuff: 16767673, peru: 13468991, pink: 16761035, plum: 14524637, powderblue: 11591910, purple: 8388736, rebeccapurple: 6697881, red: 16711680, rosybrown: 12357519, royalblue: 4286945, saddlebrown: 9127187, salmon: 16416882, sandybrown: 16032864, seagreen: 3050327, seashell: 16774638, sienna: 10506797, silver: 12632256, skyblue: 8900331, slateblue: 6970061, slategray: 7372944, slategrey: 7372944, snow: 16775930, springgreen: 65407, steelblue: 4620980, tan: 13808780, teal: 32896, thistle: 14204888, tomato: 16737095, turquoise: 4251856, violet: 15631086, wheat: 16113331, white: 16777215, whitesmoke: 16119285, yellow: 16776960, yellowgreen: 10145074 }, Bn = { h: 0, s: 0, l: 0 }, Pr = { h: 0, s: 0, l: 0 };
  function Zs(i, t, e) {
    return e < 0 && (e += 1), e > 1 && (e -= 1), e < 1 / 6 ? i + (t - i) * 6 * e : e < 1 / 2 ? t : e < 2 / 3 ? i + (t - i) * 6 * (2 / 3 - e) : i;
  }
  class Vt {
    constructor(t, e, n) {
      return this.isColor = true, this.r = 1, this.g = 1, this.b = 1, this.set(t, e, n);
    }
    set(t, e, n) {
      if (e === void 0 && n === void 0) {
        const r = t;
        r && r.isColor ? this.copy(r) : typeof r == "number" ? this.setHex(r) : typeof r == "string" && this.setStyle(r);
      } else this.setRGB(t, e, n);
      return this;
    }
    setScalar(t) {
      return this.r = t, this.g = t, this.b = t, this;
    }
    setHex(t, e = Ze) {
      return t = Math.floor(t), this.r = (t >> 16 & 255) / 255, this.g = (t >> 8 & 255) / 255, this.b = (t & 255) / 255, Zt.toWorkingColorSpace(this, e), this;
    }
    setRGB(t, e, n, r = Zt.workingColorSpace) {
      return this.r = t, this.g = e, this.b = n, Zt.toWorkingColorSpace(this, r), this;
    }
    setHSL(t, e, n, r = Zt.workingColorSpace) {
      if (t = Uu(t, 1), e = Oe(e, 0, 1), n = Oe(n, 0, 1), e === 0) this.r = this.g = this.b = n;
      else {
        const s = n <= 0.5 ? n * (1 + e) : n + e - n * e, a = 2 * n - s;
        this.r = Zs(a, s, t + 1 / 3), this.g = Zs(a, s, t), this.b = Zs(a, s, t - 1 / 3);
      }
      return Zt.toWorkingColorSpace(this, r), this;
    }
    setStyle(t, e = Ze) {
      function n(s) {
        s !== void 0 && parseFloat(s) < 1 && console.warn("THREE.Color: Alpha component of " + t + " will be ignored.");
      }
      let r;
      if (r = /^(\w+)\(([^\)]*)\)/.exec(t)) {
        let s;
        const a = r[1], o = r[2];
        switch (a) {
          case "rgb":
          case "rgba":
            if (s = /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o)) return n(s[4]), this.setRGB(Math.min(255, parseInt(s[1], 10)) / 255, Math.min(255, parseInt(s[2], 10)) / 255, Math.min(255, parseInt(s[3], 10)) / 255, e);
            if (s = /^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o)) return n(s[4]), this.setRGB(Math.min(100, parseInt(s[1], 10)) / 100, Math.min(100, parseInt(s[2], 10)) / 100, Math.min(100, parseInt(s[3], 10)) / 100, e);
            break;
          case "hsl":
          case "hsla":
            if (s = /^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o)) return n(s[4]), this.setHSL(parseFloat(s[1]) / 360, parseFloat(s[2]) / 100, parseFloat(s[3]) / 100, e);
            break;
          default:
            console.warn("THREE.Color: Unknown color model " + t);
        }
      } else if (r = /^\#([A-Fa-f\d]+)$/.exec(t)) {
        const s = r[1], a = s.length;
        if (a === 3) return this.setRGB(parseInt(s.charAt(0), 16) / 15, parseInt(s.charAt(1), 16) / 15, parseInt(s.charAt(2), 16) / 15, e);
        if (a === 6) return this.setHex(parseInt(s, 16), e);
        console.warn("THREE.Color: Invalid hex color " + t);
      } else if (t && t.length > 0) return this.setColorName(t, e);
      return this;
    }
    setColorName(t, e = Ze) {
      const n = jc[t.toLowerCase()];
      return n !== void 0 ? this.setHex(n, e) : console.warn("THREE.Color: Unknown color " + t), this;
    }
    clone() {
      return new this.constructor(this.r, this.g, this.b);
    }
    copy(t) {
      return this.r = t.r, this.g = t.g, this.b = t.b, this;
    }
    copySRGBToLinear(t) {
      return this.r = An(t.r), this.g = An(t.g), this.b = An(t.b), this;
    }
    copyLinearToSRGB(t) {
      return this.r = Ui(t.r), this.g = Ui(t.g), this.b = Ui(t.b), this;
    }
    convertSRGBToLinear() {
      return this.copySRGBToLinear(this), this;
    }
    convertLinearToSRGB() {
      return this.copyLinearToSRGB(this), this;
    }
    getHex(t = Ze) {
      return Zt.fromWorkingColorSpace(De.copy(this), t), Math.round(Oe(De.r * 255, 0, 255)) * 65536 + Math.round(Oe(De.g * 255, 0, 255)) * 256 + Math.round(Oe(De.b * 255, 0, 255));
    }
    getHexString(t = Ze) {
      return ("000000" + this.getHex(t).toString(16)).slice(-6);
    }
    getHSL(t, e = Zt.workingColorSpace) {
      Zt.fromWorkingColorSpace(De.copy(this), e);
      const n = De.r, r = De.g, s = De.b, a = Math.max(n, r, s), o = Math.min(n, r, s);
      let l, c;
      const u = (o + a) / 2;
      if (o === a) l = 0, c = 0;
      else {
        const f = a - o;
        switch (c = u <= 0.5 ? f / (a + o) : f / (2 - a - o), a) {
          case n:
            l = (r - s) / f + (r < s ? 6 : 0);
            break;
          case r:
            l = (s - n) / f + 2;
            break;
          case s:
            l = (n - r) / f + 4;
            break;
        }
        l /= 6;
      }
      return t.h = l, t.s = c, t.l = u, t;
    }
    getRGB(t, e = Zt.workingColorSpace) {
      return Zt.fromWorkingColorSpace(De.copy(this), e), t.r = De.r, t.g = De.g, t.b = De.b, t;
    }
    getStyle(t = Ze) {
      Zt.fromWorkingColorSpace(De.copy(this), t);
      const e = De.r, n = De.g, r = De.b;
      return t !== Ze ? `color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})` : `rgb(${Math.round(e * 255)},${Math.round(n * 255)},${Math.round(r * 255)})`;
    }
    offsetHSL(t, e, n) {
      return this.getHSL(Bn), this.setHSL(Bn.h + t, Bn.s + e, Bn.l + n);
    }
    add(t) {
      return this.r += t.r, this.g += t.g, this.b += t.b, this;
    }
    addColors(t, e) {
      return this.r = t.r + e.r, this.g = t.g + e.g, this.b = t.b + e.b, this;
    }
    addScalar(t) {
      return this.r += t, this.g += t, this.b += t, this;
    }
    sub(t) {
      return this.r = Math.max(0, this.r - t.r), this.g = Math.max(0, this.g - t.g), this.b = Math.max(0, this.b - t.b), this;
    }
    multiply(t) {
      return this.r *= t.r, this.g *= t.g, this.b *= t.b, this;
    }
    multiplyScalar(t) {
      return this.r *= t, this.g *= t, this.b *= t, this;
    }
    lerp(t, e) {
      return this.r += (t.r - this.r) * e, this.g += (t.g - this.g) * e, this.b += (t.b - this.b) * e, this;
    }
    lerpColors(t, e, n) {
      return this.r = t.r + (e.r - t.r) * n, this.g = t.g + (e.g - t.g) * n, this.b = t.b + (e.b - t.b) * n, this;
    }
    lerpHSL(t, e) {
      this.getHSL(Bn), t.getHSL(Pr);
      const n = Ds(Bn.h, Pr.h, e), r = Ds(Bn.s, Pr.s, e), s = Ds(Bn.l, Pr.l, e);
      return this.setHSL(n, r, s), this;
    }
    setFromVector3(t) {
      return this.r = t.x, this.g = t.y, this.b = t.z, this;
    }
    applyMatrix3(t) {
      const e = this.r, n = this.g, r = this.b, s = t.elements;
      return this.r = s[0] * e + s[3] * n + s[6] * r, this.g = s[1] * e + s[4] * n + s[7] * r, this.b = s[2] * e + s[5] * n + s[8] * r, this;
    }
    equals(t) {
      return t.r === this.r && t.g === this.g && t.b === this.b;
    }
    fromArray(t, e = 0) {
      return this.r = t[e], this.g = t[e + 1], this.b = t[e + 2], this;
    }
    toArray(t = [], e = 0) {
      return t[e] = this.r, t[e + 1] = this.g, t[e + 2] = this.b, t;
    }
    fromBufferAttribute(t, e) {
      return this.r = t.getX(e), this.g = t.getY(e), this.b = t.getZ(e), this;
    }
    toJSON() {
      return this.getHex();
    }
    *[Symbol.iterator]() {
      yield this.r, yield this.g, yield this.b;
    }
  }
  const De = new Vt();
  Vt.NAMES = jc;
  let $u = 0;
  class ji extends Xi {
    static get type() {
      return "Material";
    }
    get type() {
      return this.constructor.type;
    }
    set type(t) {
    }
    constructor() {
      super(), this.isMaterial = true, Object.defineProperty(this, "id", { value: $u++ }), this.uuid = pr(), this.name = "", this.blending = Li, this.side = Wn, this.vertexColors = false, this.opacity = 1, this.transparent = false, this.alphaHash = false, this.blendSrc = ca, this.blendDst = ha, this.blendEquation = ri, this.blendSrcAlpha = null, this.blendDstAlpha = null, this.blendEquationAlpha = null, this.blendColor = new Vt(0, 0, 0), this.blendAlpha = 0, this.depthFunc = Ni, this.depthTest = true, this.depthWrite = true, this.stencilWriteMask = 255, this.stencilFunc = tl, this.stencilRef = 0, this.stencilFuncMask = 255, this.stencilFail = _i, this.stencilZFail = _i, this.stencilZPass = _i, this.stencilWrite = false, this.clippingPlanes = null, this.clipIntersection = false, this.clipShadows = false, this.shadowSide = null, this.colorWrite = true, this.precision = null, this.polygonOffset = false, this.polygonOffsetFactor = 0, this.polygonOffsetUnits = 0, this.dithering = false, this.alphaToCoverage = false, this.premultipliedAlpha = false, this.forceSinglePass = false, this.visible = true, this.toneMapped = true, this.userData = {}, this.version = 0, this._alphaTest = 0;
    }
    get alphaTest() {
      return this._alphaTest;
    }
    set alphaTest(t) {
      this._alphaTest > 0 != t > 0 && this.version++, this._alphaTest = t;
    }
    onBeforeRender() {
    }
    onBeforeCompile() {
    }
    customProgramCacheKey() {
      return this.onBeforeCompile.toString();
    }
    setValues(t) {
      if (t !== void 0) for (const e in t) {
        const n = t[e];
        if (n === void 0) {
          console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);
          continue;
        }
        const r = this[e];
        if (r === void 0) {
          console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);
          continue;
        }
        r && r.isColor ? r.set(n) : r && r.isVector3 && n && n.isVector3 ? r.copy(n) : this[e] = n;
      }
    }
    toJSON(t) {
      const e = t === void 0 || typeof t == "string";
      e && (t = { textures: {}, images: {} });
      const n = { metadata: { version: 4.6, type: "Material", generator: "Material.toJSON" } };
      n.uuid = this.uuid, n.type = this.type, this.name !== "" && (n.name = this.name), this.color && this.color.isColor && (n.color = this.color.getHex()), this.roughness !== void 0 && (n.roughness = this.roughness), this.metalness !== void 0 && (n.metalness = this.metalness), this.sheen !== void 0 && (n.sheen = this.sheen), this.sheenColor && this.sheenColor.isColor && (n.sheenColor = this.sheenColor.getHex()), this.sheenRoughness !== void 0 && (n.sheenRoughness = this.sheenRoughness), this.emissive && this.emissive.isColor && (n.emissive = this.emissive.getHex()), this.emissiveIntensity !== void 0 && this.emissiveIntensity !== 1 && (n.emissiveIntensity = this.emissiveIntensity), this.specular && this.specular.isColor && (n.specular = this.specular.getHex()), this.specularIntensity !== void 0 && (n.specularIntensity = this.specularIntensity), this.specularColor && this.specularColor.isColor && (n.specularColor = this.specularColor.getHex()), this.shininess !== void 0 && (n.shininess = this.shininess), this.clearcoat !== void 0 && (n.clearcoat = this.clearcoat), this.clearcoatRoughness !== void 0 && (n.clearcoatRoughness = this.clearcoatRoughness), this.clearcoatMap && this.clearcoatMap.isTexture && (n.clearcoatMap = this.clearcoatMap.toJSON(t).uuid), this.clearcoatRoughnessMap && this.clearcoatRoughnessMap.isTexture && (n.clearcoatRoughnessMap = this.clearcoatRoughnessMap.toJSON(t).uuid), this.clearcoatNormalMap && this.clearcoatNormalMap.isTexture && (n.clearcoatNormalMap = this.clearcoatNormalMap.toJSON(t).uuid, n.clearcoatNormalScale = this.clearcoatNormalScale.toArray()), this.dispersion !== void 0 && (n.dispersion = this.dispersion), this.iridescence !== void 0 && (n.iridescence = this.iridescence), this.iridescenceIOR !== void 0 && (n.iridescenceIOR = this.iridescenceIOR), this.iridescenceThicknessRange !== void 0 && (n.iridescenceThicknessRange = this.iridescenceThicknessRange), this.iridescenceMap && this.iridescenceMap.isTexture && (n.iridescenceMap = this.iridescenceMap.toJSON(t).uuid), this.iridescenceThicknessMap && this.iridescenceThicknessMap.isTexture && (n.iridescenceThicknessMap = this.iridescenceThicknessMap.toJSON(t).uuid), this.anisotropy !== void 0 && (n.anisotropy = this.anisotropy), this.anisotropyRotation !== void 0 && (n.anisotropyRotation = this.anisotropyRotation), this.anisotropyMap && this.anisotropyMap.isTexture && (n.anisotropyMap = this.anisotropyMap.toJSON(t).uuid), this.map && this.map.isTexture && (n.map = this.map.toJSON(t).uuid), this.matcap && this.matcap.isTexture && (n.matcap = this.matcap.toJSON(t).uuid), this.alphaMap && this.alphaMap.isTexture && (n.alphaMap = this.alphaMap.toJSON(t).uuid), this.lightMap && this.lightMap.isTexture && (n.lightMap = this.lightMap.toJSON(t).uuid, n.lightMapIntensity = this.lightMapIntensity), this.aoMap && this.aoMap.isTexture && (n.aoMap = this.aoMap.toJSON(t).uuid, n.aoMapIntensity = this.aoMapIntensity), this.bumpMap && this.bumpMap.isTexture && (n.bumpMap = this.bumpMap.toJSON(t).uuid, n.bumpScale = this.bumpScale), this.normalMap && this.normalMap.isTexture && (n.normalMap = this.normalMap.toJSON(t).uuid, n.normalMapType = this.normalMapType, n.normalScale = this.normalScale.toArray()), this.displacementMap && this.displacementMap.isTexture && (n.displacementMap = this.displacementMap.toJSON(t).uuid, n.displacementScale = this.displacementScale, n.displacementBias = this.displacementBias), this.roughnessMap && this.roughnessMap.isTexture && (n.roughnessMap = this.roughnessMap.toJSON(t).uuid), this.metalnessMap && this.metalnessMap.isTexture && (n.metalnessMap = this.metalnessMap.toJSON(t).uuid), this.emissiveMap && this.emissiveMap.isTexture && (n.emissiveMap = this.emissiveMap.toJSON(t).uuid), this.specularMap && this.specularMap.isTexture && (n.specularMap = this.specularMap.toJSON(t).uuid), this.specularIntensityMap && this.specularIntensityMap.isTexture && (n.specularIntensityMap = this.specularIntensityMap.toJSON(t).uuid), this.specularColorMap && this.specularColorMap.isTexture && (n.specularColorMap = this.specularColorMap.toJSON(t).uuid), this.envMap && this.envMap.isTexture && (n.envMap = this.envMap.toJSON(t).uuid, this.combine !== void 0 && (n.combine = this.combine)), this.envMapRotation !== void 0 && (n.envMapRotation = this.envMapRotation.toArray()), this.envMapIntensity !== void 0 && (n.envMapIntensity = this.envMapIntensity), this.reflectivity !== void 0 && (n.reflectivity = this.reflectivity), this.refractionRatio !== void 0 && (n.refractionRatio = this.refractionRatio), this.gradientMap && this.gradientMap.isTexture && (n.gradientMap = this.gradientMap.toJSON(t).uuid), this.transmission !== void 0 && (n.transmission = this.transmission), this.transmissionMap && this.transmissionMap.isTexture && (n.transmissionMap = this.transmissionMap.toJSON(t).uuid), this.thickness !== void 0 && (n.thickness = this.thickness), this.thicknessMap && this.thicknessMap.isTexture && (n.thicknessMap = this.thicknessMap.toJSON(t).uuid), this.attenuationDistance !== void 0 && this.attenuationDistance !== 1 / 0 && (n.attenuationDistance = this.attenuationDistance), this.attenuationColor !== void 0 && (n.attenuationColor = this.attenuationColor.getHex()), this.size !== void 0 && (n.size = this.size), this.shadowSide !== null && (n.shadowSide = this.shadowSide), this.sizeAttenuation !== void 0 && (n.sizeAttenuation = this.sizeAttenuation), this.blending !== Li && (n.blending = this.blending), this.side !== Wn && (n.side = this.side), this.vertexColors === true && (n.vertexColors = true), this.opacity < 1 && (n.opacity = this.opacity), this.transparent === true && (n.transparent = true), this.blendSrc !== ca && (n.blendSrc = this.blendSrc), this.blendDst !== ha && (n.blendDst = this.blendDst), this.blendEquation !== ri && (n.blendEquation = this.blendEquation), this.blendSrcAlpha !== null && (n.blendSrcAlpha = this.blendSrcAlpha), this.blendDstAlpha !== null && (n.blendDstAlpha = this.blendDstAlpha), this.blendEquationAlpha !== null && (n.blendEquationAlpha = this.blendEquationAlpha), this.blendColor && this.blendColor.isColor && (n.blendColor = this.blendColor.getHex()), this.blendAlpha !== 0 && (n.blendAlpha = this.blendAlpha), this.depthFunc !== Ni && (n.depthFunc = this.depthFunc), this.depthTest === false && (n.depthTest = this.depthTest), this.depthWrite === false && (n.depthWrite = this.depthWrite), this.colorWrite === false && (n.colorWrite = this.colorWrite), this.stencilWriteMask !== 255 && (n.stencilWriteMask = this.stencilWriteMask), this.stencilFunc !== tl && (n.stencilFunc = this.stencilFunc), this.stencilRef !== 0 && (n.stencilRef = this.stencilRef), this.stencilFuncMask !== 255 && (n.stencilFuncMask = this.stencilFuncMask), this.stencilFail !== _i && (n.stencilFail = this.stencilFail), this.stencilZFail !== _i && (n.stencilZFail = this.stencilZFail), this.stencilZPass !== _i && (n.stencilZPass = this.stencilZPass), this.stencilWrite === true && (n.stencilWrite = this.stencilWrite), this.rotation !== void 0 && this.rotation !== 0 && (n.rotation = this.rotation), this.polygonOffset === true && (n.polygonOffset = true), this.polygonOffsetFactor !== 0 && (n.polygonOffsetFactor = this.polygonOffsetFactor), this.polygonOffsetUnits !== 0 && (n.polygonOffsetUnits = this.polygonOffsetUnits), this.linewidth !== void 0 && this.linewidth !== 1 && (n.linewidth = this.linewidth), this.dashSize !== void 0 && (n.dashSize = this.dashSize), this.gapSize !== void 0 && (n.gapSize = this.gapSize), this.scale !== void 0 && (n.scale = this.scale), this.dithering === true && (n.dithering = true), this.alphaTest > 0 && (n.alphaTest = this.alphaTest), this.alphaHash === true && (n.alphaHash = true), this.alphaToCoverage === true && (n.alphaToCoverage = true), this.premultipliedAlpha === true && (n.premultipliedAlpha = true), this.forceSinglePass === true && (n.forceSinglePass = true), this.wireframe === true && (n.wireframe = true), this.wireframeLinewidth > 1 && (n.wireframeLinewidth = this.wireframeLinewidth), this.wireframeLinecap !== "round" && (n.wireframeLinecap = this.wireframeLinecap), this.wireframeLinejoin !== "round" && (n.wireframeLinejoin = this.wireframeLinejoin), this.flatShading === true && (n.flatShading = true), this.visible === false && (n.visible = false), this.toneMapped === false && (n.toneMapped = false), this.fog === false && (n.fog = false), Object.keys(this.userData).length > 0 && (n.userData = this.userData);
      function r(s) {
        const a = [];
        for (const o in s) {
          const l = s[o];
          delete l.metadata, a.push(l);
        }
        return a;
      }
      if (e) {
        const s = r(t.textures), a = r(t.images);
        s.length > 0 && (n.textures = s), a.length > 0 && (n.images = a);
      }
      return n;
    }
    clone() {
      return new this.constructor().copy(this);
    }
    copy(t) {
      this.name = t.name, this.blending = t.blending, this.side = t.side, this.vertexColors = t.vertexColors, this.opacity = t.opacity, this.transparent = t.transparent, this.blendSrc = t.blendSrc, this.blendDst = t.blendDst, this.blendEquation = t.blendEquation, this.blendSrcAlpha = t.blendSrcAlpha, this.blendDstAlpha = t.blendDstAlpha, this.blendEquationAlpha = t.blendEquationAlpha, this.blendColor.copy(t.blendColor), this.blendAlpha = t.blendAlpha, this.depthFunc = t.depthFunc, this.depthTest = t.depthTest, this.depthWrite = t.depthWrite, this.stencilWriteMask = t.stencilWriteMask, this.stencilFunc = t.stencilFunc, this.stencilRef = t.stencilRef, this.stencilFuncMask = t.stencilFuncMask, this.stencilFail = t.stencilFail, this.stencilZFail = t.stencilZFail, this.stencilZPass = t.stencilZPass, this.stencilWrite = t.stencilWrite;
      const e = t.clippingPlanes;
      let n = null;
      if (e !== null) {
        const r = e.length;
        n = new Array(r);
        for (let s = 0; s !== r; ++s) n[s] = e[s].clone();
      }
      return this.clippingPlanes = n, this.clipIntersection = t.clipIntersection, this.clipShadows = t.clipShadows, this.shadowSide = t.shadowSide, this.colorWrite = t.colorWrite, this.precision = t.precision, this.polygonOffset = t.polygonOffset, this.polygonOffsetFactor = t.polygonOffsetFactor, this.polygonOffsetUnits = t.polygonOffsetUnits, this.dithering = t.dithering, this.alphaTest = t.alphaTest, this.alphaHash = t.alphaHash, this.alphaToCoverage = t.alphaToCoverage, this.premultipliedAlpha = t.premultipliedAlpha, this.forceSinglePass = t.forceSinglePass, this.visible = t.visible, this.toneMapped = t.toneMapped, this.userData = JSON.parse(JSON.stringify(t.userData)), this;
    }
    dispose() {
      this.dispatchEvent({ type: "dispose" });
    }
    set needsUpdate(t) {
      t === true && this.version++;
    }
    onBuild() {
      console.warn("Material: onBuild() has been removed.");
    }
  }
  class ss extends ji {
    static get type() {
      return "MeshBasicMaterial";
    }
    constructor(t) {
      super(), this.isMeshBasicMaterial = true, this.color = new Vt(16777215), this.map = null, this.lightMap = null, this.lightMapIntensity = 1, this.aoMap = null, this.aoMapIntensity = 1, this.specularMap = null, this.alphaMap = null, this.envMap = null, this.envMapRotation = new pn(), this.combine = Rc, this.reflectivity = 1, this.refractionRatio = 0.98, this.wireframe = false, this.wireframeLinewidth = 1, this.wireframeLinecap = "round", this.wireframeLinejoin = "round", this.fog = true, this.setValues(t);
    }
    copy(t) {
      return super.copy(t), this.color.copy(t.color), this.map = t.map, this.lightMap = t.lightMap, this.lightMapIntensity = t.lightMapIntensity, this.aoMap = t.aoMap, this.aoMapIntensity = t.aoMapIntensity, this.specularMap = t.specularMap, this.alphaMap = t.alphaMap, this.envMap = t.envMap, this.envMapRotation.copy(t.envMapRotation), this.combine = t.combine, this.reflectivity = t.reflectivity, this.refractionRatio = t.refractionRatio, this.wireframe = t.wireframe, this.wireframeLinewidth = t.wireframeLinewidth, this.wireframeLinecap = t.wireframeLinecap, this.wireframeLinejoin = t.wireframeLinejoin, this.fog = t.fog, this;
    }
  }
  const ve = new z(), Ir = new Jt();
  class fn {
    constructor(t, e, n = false) {
      if (Array.isArray(t)) throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");
      this.isBufferAttribute = true, this.name = "", this.array = t, this.itemSize = e, this.count = t !== void 0 ? t.length / e : 0, this.normalized = n, this.usage = el, this.updateRanges = [], this.gpuType = Tn, this.version = 0;
    }
    onUploadCallback() {
    }
    set needsUpdate(t) {
      t === true && this.version++;
    }
    setUsage(t) {
      return this.usage = t, this;
    }
    addUpdateRange(t, e) {
      this.updateRanges.push({ start: t, count: e });
    }
    clearUpdateRanges() {
      this.updateRanges.length = 0;
    }
    copy(t) {
      return this.name = t.name, this.array = new t.array.constructor(t.array), this.itemSize = t.itemSize, this.count = t.count, this.normalized = t.normalized, this.usage = t.usage, this.gpuType = t.gpuType, this;
    }
    copyAt(t, e, n) {
      t *= this.itemSize, n *= e.itemSize;
      for (let r = 0, s = this.itemSize; r < s; r++) this.array[t + r] = e.array[n + r];
      return this;
    }
    copyArray(t) {
      return this.array.set(t), this;
    }
    applyMatrix3(t) {
      if (this.itemSize === 2) for (let e = 0, n = this.count; e < n; e++) Ir.fromBufferAttribute(this, e), Ir.applyMatrix3(t), this.setXY(e, Ir.x, Ir.y);
      else if (this.itemSize === 3) for (let e = 0, n = this.count; e < n; e++) ve.fromBufferAttribute(this, e), ve.applyMatrix3(t), this.setXYZ(e, ve.x, ve.y, ve.z);
      return this;
    }
    applyMatrix4(t) {
      for (let e = 0, n = this.count; e < n; e++) ve.fromBufferAttribute(this, e), ve.applyMatrix4(t), this.setXYZ(e, ve.x, ve.y, ve.z);
      return this;
    }
    applyNormalMatrix(t) {
      for (let e = 0, n = this.count; e < n; e++) ve.fromBufferAttribute(this, e), ve.applyNormalMatrix(t), this.setXYZ(e, ve.x, ve.y, ve.z);
      return this;
    }
    transformDirection(t) {
      for (let e = 0, n = this.count; e < n; e++) ve.fromBufferAttribute(this, e), ve.transformDirection(t), this.setXYZ(e, ve.x, ve.y, ve.z);
      return this;
    }
    set(t, e = 0) {
      return this.array.set(t, e), this;
    }
    getComponent(t, e) {
      let n = this.array[t * this.itemSize + e];
      return this.normalized && (n = Ji(n, this.array)), n;
    }
    setComponent(t, e, n) {
      return this.normalized && (n = Ne(n, this.array)), this.array[t * this.itemSize + e] = n, this;
    }
    getX(t) {
      let e = this.array[t * this.itemSize];
      return this.normalized && (e = Ji(e, this.array)), e;
    }
    setX(t, e) {
      return this.normalized && (e = Ne(e, this.array)), this.array[t * this.itemSize] = e, this;
    }
    getY(t) {
      let e = this.array[t * this.itemSize + 1];
      return this.normalized && (e = Ji(e, this.array)), e;
    }
    setY(t, e) {
      return this.normalized && (e = Ne(e, this.array)), this.array[t * this.itemSize + 1] = e, this;
    }
    getZ(t) {
      let e = this.array[t * this.itemSize + 2];
      return this.normalized && (e = Ji(e, this.array)), e;
    }
    setZ(t, e) {
      return this.normalized && (e = Ne(e, this.array)), this.array[t * this.itemSize + 2] = e, this;
    }
    getW(t) {
      let e = this.array[t * this.itemSize + 3];
      return this.normalized && (e = Ji(e, this.array)), e;
    }
    setW(t, e) {
      return this.normalized && (e = Ne(e, this.array)), this.array[t * this.itemSize + 3] = e, this;
    }
    setXY(t, e, n) {
      return t *= this.itemSize, this.normalized && (e = Ne(e, this.array), n = Ne(n, this.array)), this.array[t + 0] = e, this.array[t + 1] = n, this;
    }
    setXYZ(t, e, n, r) {
      return t *= this.itemSize, this.normalized && (e = Ne(e, this.array), n = Ne(n, this.array), r = Ne(r, this.array)), this.array[t + 0] = e, this.array[t + 1] = n, this.array[t + 2] = r, this;
    }
    setXYZW(t, e, n, r, s) {
      return t *= this.itemSize, this.normalized && (e = Ne(e, this.array), n = Ne(n, this.array), r = Ne(r, this.array), s = Ne(s, this.array)), this.array[t + 0] = e, this.array[t + 1] = n, this.array[t + 2] = r, this.array[t + 3] = s, this;
    }
    onUpload(t) {
      return this.onUploadCallback = t, this;
    }
    clone() {
      return new this.constructor(this.array, this.itemSize).copy(this);
    }
    toJSON() {
      const t = { itemSize: this.itemSize, type: this.array.constructor.name, array: Array.from(this.array), normalized: this.normalized };
      return this.name !== "" && (t.name = this.name), this.usage !== el && (t.usage = this.usage), t;
    }
  }
  class Yc extends fn {
    constructor(t, e, n) {
      super(new Uint16Array(t), e, n);
    }
  }
  class Kc extends fn {
    constructor(t, e, n) {
      super(new Uint32Array(t), e, n);
    }
  }
  class He extends fn {
    constructor(t, e, n) {
      super(new Float32Array(t), e, n);
    }
  }
  let Ju = 0;
  const Ke = new pe(), $s = new Ae(), Ei = new z(), Ve = new _r(), ir = new _r(), Ee = new z();
  class _n extends Xi {
    constructor() {
      super(), this.isBufferGeometry = true, Object.defineProperty(this, "id", { value: Ju++ }), this.uuid = pr(), this.name = "", this.type = "BufferGeometry", this.index = null, this.indirect = null, this.attributes = {}, this.morphAttributes = {}, this.morphTargetsRelative = false, this.groups = [], this.boundingBox = null, this.boundingSphere = null, this.drawRange = { start: 0, count: 1 / 0 }, this.userData = {};
    }
    getIndex() {
      return this.index;
    }
    setIndex(t) {
      return Array.isArray(t) ? this.index = new (Gc(t) ? Kc : Yc)(t, 1) : this.index = t, this;
    }
    setIndirect(t) {
      return this.indirect = t, this;
    }
    getIndirect() {
      return this.indirect;
    }
    getAttribute(t) {
      return this.attributes[t];
    }
    setAttribute(t, e) {
      return this.attributes[t] = e, this;
    }
    deleteAttribute(t) {
      return delete this.attributes[t], this;
    }
    hasAttribute(t) {
      return this.attributes[t] !== void 0;
    }
    addGroup(t, e, n = 0) {
      this.groups.push({ start: t, count: e, materialIndex: n });
    }
    clearGroups() {
      this.groups = [];
    }
    setDrawRange(t, e) {
      this.drawRange.start = t, this.drawRange.count = e;
    }
    applyMatrix4(t) {
      const e = this.attributes.position;
      e !== void 0 && (e.applyMatrix4(t), e.needsUpdate = true);
      const n = this.attributes.normal;
      if (n !== void 0) {
        const s = new Nt().getNormalMatrix(t);
        n.applyNormalMatrix(s), n.needsUpdate = true;
      }
      const r = this.attributes.tangent;
      return r !== void 0 && (r.transformDirection(t), r.needsUpdate = true), this.boundingBox !== null && this.computeBoundingBox(), this.boundingSphere !== null && this.computeBoundingSphere(), this;
    }
    applyQuaternion(t) {
      return Ke.makeRotationFromQuaternion(t), this.applyMatrix4(Ke), this;
    }
    rotateX(t) {
      return Ke.makeRotationX(t), this.applyMatrix4(Ke), this;
    }
    rotateY(t) {
      return Ke.makeRotationY(t), this.applyMatrix4(Ke), this;
    }
    rotateZ(t) {
      return Ke.makeRotationZ(t), this.applyMatrix4(Ke), this;
    }
    translate(t, e, n) {
      return Ke.makeTranslation(t, e, n), this.applyMatrix4(Ke), this;
    }
    scale(t, e, n) {
      return Ke.makeScale(t, e, n), this.applyMatrix4(Ke), this;
    }
    lookAt(t) {
      return $s.lookAt(t), $s.updateMatrix(), this.applyMatrix4($s.matrix), this;
    }
    center() {
      return this.computeBoundingBox(), this.boundingBox.getCenter(Ei).negate(), this.translate(Ei.x, Ei.y, Ei.z), this;
    }
    setFromPoints(t) {
      const e = this.getAttribute("position");
      if (e === void 0) {
        const n = [];
        for (let r = 0, s = t.length; r < s; r++) {
          const a = t[r];
          n.push(a.x, a.y, a.z || 0);
        }
        this.setAttribute("position", new He(n, 3));
      } else {
        for (let n = 0, r = e.count; n < r; n++) {
          const s = t[n];
          e.setXYZ(n, s.x, s.y, s.z || 0);
        }
        t.length > e.count && console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."), e.needsUpdate = true;
      }
      return this;
    }
    computeBoundingBox() {
      this.boundingBox === null && (this.boundingBox = new _r());
      const t = this.attributes.position, e = this.morphAttributes.position;
      if (t && t.isGLBufferAttribute) {
        console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.", this), this.boundingBox.set(new z(-1 / 0, -1 / 0, -1 / 0), new z(1 / 0, 1 / 0, 1 / 0));
        return;
      }
      if (t !== void 0) {
        if (this.boundingBox.setFromBufferAttribute(t), e) for (let n = 0, r = e.length; n < r; n++) {
          const s = e[n];
          Ve.setFromBufferAttribute(s), this.morphTargetsRelative ? (Ee.addVectors(this.boundingBox.min, Ve.min), this.boundingBox.expandByPoint(Ee), Ee.addVectors(this.boundingBox.max, Ve.max), this.boundingBox.expandByPoint(Ee)) : (this.boundingBox.expandByPoint(Ve.min), this.boundingBox.expandByPoint(Ve.max));
        }
      } else this.boundingBox.makeEmpty();
      (isNaN(this.boundingBox.min.x) || isNaN(this.boundingBox.min.y) || isNaN(this.boundingBox.min.z)) && console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.', this);
    }
    computeBoundingSphere() {
      this.boundingSphere === null && (this.boundingSphere = new bs());
      const t = this.attributes.position, e = this.morphAttributes.position;
      if (t && t.isGLBufferAttribute) {
        console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.", this), this.boundingSphere.set(new z(), 1 / 0);
        return;
      }
      if (t) {
        const n = this.boundingSphere.center;
        if (Ve.setFromBufferAttribute(t), e) for (let s = 0, a = e.length; s < a; s++) {
          const o = e[s];
          ir.setFromBufferAttribute(o), this.morphTargetsRelative ? (Ee.addVectors(Ve.min, ir.min), Ve.expandByPoint(Ee), Ee.addVectors(Ve.max, ir.max), Ve.expandByPoint(Ee)) : (Ve.expandByPoint(ir.min), Ve.expandByPoint(ir.max));
        }
        Ve.getCenter(n);
        let r = 0;
        for (let s = 0, a = t.count; s < a; s++) Ee.fromBufferAttribute(t, s), r = Math.max(r, n.distanceToSquared(Ee));
        if (e) for (let s = 0, a = e.length; s < a; s++) {
          const o = e[s], l = this.morphTargetsRelative;
          for (let c = 0, u = o.count; c < u; c++) Ee.fromBufferAttribute(o, c), l && (Ei.fromBufferAttribute(t, c), Ee.add(Ei)), r = Math.max(r, n.distanceToSquared(Ee));
        }
        this.boundingSphere.radius = Math.sqrt(r), isNaN(this.boundingSphere.radius) && console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.', this);
      }
    }
    computeTangents() {
      const t = this.index, e = this.attributes;
      if (t === null || e.position === void 0 || e.normal === void 0 || e.uv === void 0) {
        console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");
        return;
      }
      const n = e.position, r = e.normal, s = e.uv;
      this.hasAttribute("tangent") === false && this.setAttribute("tangent", new fn(new Float32Array(4 * n.count), 4));
      const a = this.getAttribute("tangent"), o = [], l = [];
      for (let N = 0; N < n.count; N++) o[N] = new z(), l[N] = new z();
      const c = new z(), u = new z(), f = new z(), p = new Jt(), _ = new Jt(), g = new Jt(), v = new z(), m = new z();
      function d(N, S, x) {
        c.fromBufferAttribute(n, N), u.fromBufferAttribute(n, S), f.fromBufferAttribute(n, x), p.fromBufferAttribute(s, N), _.fromBufferAttribute(s, S), g.fromBufferAttribute(s, x), u.sub(c), f.sub(c), _.sub(p), g.sub(p);
        const C = 1 / (_.x * g.y - g.x * _.y);
        isFinite(C) && (v.copy(u).multiplyScalar(g.y).addScaledVector(f, -_.y).multiplyScalar(C), m.copy(f).multiplyScalar(_.x).addScaledVector(u, -g.x).multiplyScalar(C), o[N].add(v), o[S].add(v), o[x].add(v), l[N].add(m), l[S].add(m), l[x].add(m));
      }
      let T = this.groups;
      T.length === 0 && (T = [{ start: 0, count: t.count }]);
      for (let N = 0, S = T.length; N < S; ++N) {
        const x = T[N], C = x.start, W = x.count;
        for (let V = C, Y = C + W; V < Y; V += 3) d(t.getX(V + 0), t.getX(V + 1), t.getX(V + 2));
      }
      const E = new z(), y = new z(), H = new z(), P = new z();
      function A(N) {
        H.fromBufferAttribute(r, N), P.copy(H);
        const S = o[N];
        E.copy(S), E.sub(H.multiplyScalar(H.dot(S))).normalize(), y.crossVectors(P, S);
        const C = y.dot(l[N]) < 0 ? -1 : 1;
        a.setXYZW(N, E.x, E.y, E.z, C);
      }
      for (let N = 0, S = T.length; N < S; ++N) {
        const x = T[N], C = x.start, W = x.count;
        for (let V = C, Y = C + W; V < Y; V += 3) A(t.getX(V + 0)), A(t.getX(V + 1)), A(t.getX(V + 2));
      }
    }
    computeVertexNormals() {
      const t = this.index, e = this.getAttribute("position");
      if (e !== void 0) {
        let n = this.getAttribute("normal");
        if (n === void 0) n = new fn(new Float32Array(e.count * 3), 3), this.setAttribute("normal", n);
        else for (let p = 0, _ = n.count; p < _; p++) n.setXYZ(p, 0, 0, 0);
        const r = new z(), s = new z(), a = new z(), o = new z(), l = new z(), c = new z(), u = new z(), f = new z();
        if (t) for (let p = 0, _ = t.count; p < _; p += 3) {
          const g = t.getX(p + 0), v = t.getX(p + 1), m = t.getX(p + 2);
          r.fromBufferAttribute(e, g), s.fromBufferAttribute(e, v), a.fromBufferAttribute(e, m), u.subVectors(a, s), f.subVectors(r, s), u.cross(f), o.fromBufferAttribute(n, g), l.fromBufferAttribute(n, v), c.fromBufferAttribute(n, m), o.add(u), l.add(u), c.add(u), n.setXYZ(g, o.x, o.y, o.z), n.setXYZ(v, l.x, l.y, l.z), n.setXYZ(m, c.x, c.y, c.z);
        }
        else for (let p = 0, _ = e.count; p < _; p += 3) r.fromBufferAttribute(e, p + 0), s.fromBufferAttribute(e, p + 1), a.fromBufferAttribute(e, p + 2), u.subVectors(a, s), f.subVectors(r, s), u.cross(f), n.setXYZ(p + 0, u.x, u.y, u.z), n.setXYZ(p + 1, u.x, u.y, u.z), n.setXYZ(p + 2, u.x, u.y, u.z);
        this.normalizeNormals(), n.needsUpdate = true;
      }
    }
    normalizeNormals() {
      const t = this.attributes.normal;
      for (let e = 0, n = t.count; e < n; e++) Ee.fromBufferAttribute(t, e), Ee.normalize(), t.setXYZ(e, Ee.x, Ee.y, Ee.z);
    }
    toNonIndexed() {
      function t(o, l) {
        const c = o.array, u = o.itemSize, f = o.normalized, p = new c.constructor(l.length * u);
        let _ = 0, g = 0;
        for (let v = 0, m = l.length; v < m; v++) {
          o.isInterleavedBufferAttribute ? _ = l[v] * o.data.stride + o.offset : _ = l[v] * u;
          for (let d = 0; d < u; d++) p[g++] = c[_++];
        }
        return new fn(p, u, f);
      }
      if (this.index === null) return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."), this;
      const e = new _n(), n = this.index.array, r = this.attributes;
      for (const o in r) {
        const l = r[o], c = t(l, n);
        e.setAttribute(o, c);
      }
      const s = this.morphAttributes;
      for (const o in s) {
        const l = [], c = s[o];
        for (let u = 0, f = c.length; u < f; u++) {
          const p = c[u], _ = t(p, n);
          l.push(_);
        }
        e.morphAttributes[o] = l;
      }
      e.morphTargetsRelative = this.morphTargetsRelative;
      const a = this.groups;
      for (let o = 0, l = a.length; o < l; o++) {
        const c = a[o];
        e.addGroup(c.start, c.count, c.materialIndex);
      }
      return e;
    }
    toJSON() {
      const t = { metadata: { version: 4.6, type: "BufferGeometry", generator: "BufferGeometry.toJSON" } };
      if (t.uuid = this.uuid, t.type = this.type, this.name !== "" && (t.name = this.name), Object.keys(this.userData).length > 0 && (t.userData = this.userData), this.parameters !== void 0) {
        const l = this.parameters;
        for (const c in l) l[c] !== void 0 && (t[c] = l[c]);
        return t;
      }
      t.data = { attributes: {} };
      const e = this.index;
      e !== null && (t.data.index = { type: e.array.constructor.name, array: Array.prototype.slice.call(e.array) });
      const n = this.attributes;
      for (const l in n) {
        const c = n[l];
        t.data.attributes[l] = c.toJSON(t.data);
      }
      const r = {};
      let s = false;
      for (const l in this.morphAttributes) {
        const c = this.morphAttributes[l], u = [];
        for (let f = 0, p = c.length; f < p; f++) {
          const _ = c[f];
          u.push(_.toJSON(t.data));
        }
        u.length > 0 && (r[l] = u, s = true);
      }
      s && (t.data.morphAttributes = r, t.data.morphTargetsRelative = this.morphTargetsRelative);
      const a = this.groups;
      a.length > 0 && (t.data.groups = JSON.parse(JSON.stringify(a)));
      const o = this.boundingSphere;
      return o !== null && (t.data.boundingSphere = { center: o.center.toArray(), radius: o.radius }), t;
    }
    clone() {
      return new this.constructor().copy(this);
    }
    copy(t) {
      this.index = null, this.attributes = {}, this.morphAttributes = {}, this.groups = [], this.boundingBox = null, this.boundingSphere = null;
      const e = {};
      this.name = t.name;
      const n = t.index;
      n !== null && this.setIndex(n.clone(e));
      const r = t.attributes;
      for (const c in r) {
        const u = r[c];
        this.setAttribute(c, u.clone(e));
      }
      const s = t.morphAttributes;
      for (const c in s) {
        const u = [], f = s[c];
        for (let p = 0, _ = f.length; p < _; p++) u.push(f[p].clone(e));
        this.morphAttributes[c] = u;
      }
      this.morphTargetsRelative = t.morphTargetsRelative;
      const a = t.groups;
      for (let c = 0, u = a.length; c < u; c++) {
        const f = a[c];
        this.addGroup(f.start, f.count, f.materialIndex);
      }
      const o = t.boundingBox;
      o !== null && (this.boundingBox = o.clone());
      const l = t.boundingSphere;
      return l !== null && (this.boundingSphere = l.clone()), this.drawRange.start = t.drawRange.start, this.drawRange.count = t.drawRange.count, this.userData = t.userData, this;
    }
    dispose() {
      this.dispatchEvent({ type: "dispose" });
    }
  }
  const wl = new pe(), $n = new Xc(), Lr = new bs(), vl = new z(), Dr = new z(), Ur = new z(), Fr = new z(), Js = new z(), Nr = new z(), bl = new z(), Or = new z();
  class Re extends Ae {
    constructor(t = new _n(), e = new ss()) {
      super(), this.isMesh = true, this.type = "Mesh", this.geometry = t, this.material = e, this.updateMorphTargets();
    }
    copy(t, e) {
      return super.copy(t, e), t.morphTargetInfluences !== void 0 && (this.morphTargetInfluences = t.morphTargetInfluences.slice()), t.morphTargetDictionary !== void 0 && (this.morphTargetDictionary = Object.assign({}, t.morphTargetDictionary)), this.material = Array.isArray(t.material) ? t.material.slice() : t.material, this.geometry = t.geometry, this;
    }
    updateMorphTargets() {
      const e = this.geometry.morphAttributes, n = Object.keys(e);
      if (n.length > 0) {
        const r = e[n[0]];
        if (r !== void 0) {
          this.morphTargetInfluences = [], this.morphTargetDictionary = {};
          for (let s = 0, a = r.length; s < a; s++) {
            const o = r[s].name || String(s);
            this.morphTargetInfluences.push(0), this.morphTargetDictionary[o] = s;
          }
        }
      }
    }
    getVertexPosition(t, e) {
      const n = this.geometry, r = n.attributes.position, s = n.morphAttributes.position, a = n.morphTargetsRelative;
      e.fromBufferAttribute(r, t);
      const o = this.morphTargetInfluences;
      if (s && o) {
        Nr.set(0, 0, 0);
        for (let l = 0, c = s.length; l < c; l++) {
          const u = o[l], f = s[l];
          u !== 0 && (Js.fromBufferAttribute(f, t), a ? Nr.addScaledVector(Js, u) : Nr.addScaledVector(Js.sub(e), u));
        }
        e.add(Nr);
      }
      return e;
    }
    raycast(t, e) {
      const n = this.geometry, r = this.material, s = this.matrixWorld;
      r !== void 0 && (n.boundingSphere === null && n.computeBoundingSphere(), Lr.copy(n.boundingSphere), Lr.applyMatrix4(s), $n.copy(t.ray).recast(t.near), !(Lr.containsPoint($n.origin) === false && ($n.intersectSphere(Lr, vl) === null || $n.origin.distanceToSquared(vl) > (t.far - t.near) ** 2)) && (wl.copy(s).invert(), $n.copy(t.ray).applyMatrix4(wl), !(n.boundingBox !== null && $n.intersectsBox(n.boundingBox) === false) && this._computeIntersections(t, e, $n)));
    }
    _computeIntersections(t, e, n) {
      let r;
      const s = this.geometry, a = this.material, o = s.index, l = s.attributes.position, c = s.attributes.uv, u = s.attributes.uv1, f = s.attributes.normal, p = s.groups, _ = s.drawRange;
      if (o !== null) if (Array.isArray(a)) for (let g = 0, v = p.length; g < v; g++) {
        const m = p[g], d = a[m.materialIndex], T = Math.max(m.start, _.start), E = Math.min(o.count, Math.min(m.start + m.count, _.start + _.count));
        for (let y = T, H = E; y < H; y += 3) {
          const P = o.getX(y), A = o.getX(y + 1), N = o.getX(y + 2);
          r = zr(this, d, t, n, c, u, f, P, A, N), r && (r.faceIndex = Math.floor(y / 3), r.face.materialIndex = m.materialIndex, e.push(r));
        }
      }
      else {
        const g = Math.max(0, _.start), v = Math.min(o.count, _.start + _.count);
        for (let m = g, d = v; m < d; m += 3) {
          const T = o.getX(m), E = o.getX(m + 1), y = o.getX(m + 2);
          r = zr(this, a, t, n, c, u, f, T, E, y), r && (r.faceIndex = Math.floor(m / 3), e.push(r));
        }
      }
      else if (l !== void 0) if (Array.isArray(a)) for (let g = 0, v = p.length; g < v; g++) {
        const m = p[g], d = a[m.materialIndex], T = Math.max(m.start, _.start), E = Math.min(l.count, Math.min(m.start + m.count, _.start + _.count));
        for (let y = T, H = E; y < H; y += 3) {
          const P = y, A = y + 1, N = y + 2;
          r = zr(this, d, t, n, c, u, f, P, A, N), r && (r.faceIndex = Math.floor(y / 3), r.face.materialIndex = m.materialIndex, e.push(r));
        }
      }
      else {
        const g = Math.max(0, _.start), v = Math.min(l.count, _.start + _.count);
        for (let m = g, d = v; m < d; m += 3) {
          const T = m, E = m + 1, y = m + 2;
          r = zr(this, a, t, n, c, u, f, T, E, y), r && (r.faceIndex = Math.floor(m / 3), e.push(r));
        }
      }
    }
  }
  function Qu(i, t, e, n, r, s, a, o) {
    let l;
    if (t.side === ze ? l = n.intersectTriangle(a, s, r, true, o) : l = n.intersectTriangle(r, s, a, t.side === Wn, o), l === null) return null;
    Or.copy(o), Or.applyMatrix4(i.matrixWorld);
    const c = e.ray.origin.distanceTo(Or);
    return c < e.near || c > e.far ? null : { distance: c, point: Or.clone(), object: i };
  }
  function zr(i, t, e, n, r, s, a, o, l, c) {
    i.getVertexPosition(o, Dr), i.getVertexPosition(l, Ur), i.getVertexPosition(c, Fr);
    const u = Qu(i, t, e, n, Dr, Ur, Fr, bl);
    if (u) {
      const f = new z();
      nr.getBarycoord(bl, Dr, Ur, Fr, f), r && (u.uv = nr.getInterpolatedAttribute(r, o, l, c, f, new Jt())), s && (u.uv1 = nr.getInterpolatedAttribute(s, o, l, c, f, new Jt())), a && (u.normal = nr.getInterpolatedAttribute(a, o, l, c, f, new z()), u.normal.dot(n.direction) > 0 && u.normal.multiplyScalar(-1));
      const p = { a: o, b: l, c, normal: new z(), materialIndex: 0 };
      nr.getNormal(Dr, Ur, Fr, p.normal), u.face = p, u.barycoord = f;
    }
    return u;
  }
  class qe extends _n {
    constructor(t = 1, e = 1, n = 1, r = 1, s = 1, a = 1) {
      super(), this.type = "BoxGeometry", this.parameters = { width: t, height: e, depth: n, widthSegments: r, heightSegments: s, depthSegments: a };
      const o = this;
      r = Math.floor(r), s = Math.floor(s), a = Math.floor(a);
      const l = [], c = [], u = [], f = [];
      let p = 0, _ = 0;
      g("z", "y", "x", -1, -1, n, e, t, a, s, 0), g("z", "y", "x", 1, -1, n, e, -t, a, s, 1), g("x", "z", "y", 1, 1, t, n, e, r, a, 2), g("x", "z", "y", 1, -1, t, n, -e, r, a, 3), g("x", "y", "z", 1, -1, t, e, n, r, s, 4), g("x", "y", "z", -1, -1, t, e, -n, r, s, 5), this.setIndex(l), this.setAttribute("position", new He(c, 3)), this.setAttribute("normal", new He(u, 3)), this.setAttribute("uv", new He(f, 2));
      function g(v, m, d, T, E, y, H, P, A, N, S) {
        const x = y / A, C = H / N, W = y / 2, V = H / 2, Y = P / 2, Q = A + 1, j = N + 1;
        let et = 0, q = 0;
        const ot = new z();
        for (let ft = 0; ft < j; ft++) {
          const Mt = ft * C - V;
          for (let Ht = 0; Ht < Q; Ht++) {
            const ie = Ht * x - W;
            ot[v] = ie * T, ot[m] = Mt * E, ot[d] = Y, c.push(ot.x, ot.y, ot.z), ot[v] = 0, ot[m] = 0, ot[d] = P > 0 ? 1 : -1, u.push(ot.x, ot.y, ot.z), f.push(Ht / A), f.push(1 - ft / N), et += 1;
          }
        }
        for (let ft = 0; ft < N; ft++) for (let Mt = 0; Mt < A; Mt++) {
          const Ht = p + Mt + Q * ft, ie = p + Mt + Q * (ft + 1), Z = p + (Mt + 1) + Q * (ft + 1), rt = p + (Mt + 1) + Q * ft;
          l.push(Ht, ie, rt), l.push(ie, Z, rt), q += 6;
        }
        o.addGroup(_, q, S), _ += q, p += et;
      }
    }
    copy(t) {
      return super.copy(t), this.parameters = Object.assign({}, t.parameters), this;
    }
    static fromJSON(t) {
      return new qe(t.width, t.height, t.depth, t.widthSegments, t.heightSegments, t.depthSegments);
    }
  }
  function Gi(i) {
    const t = {};
    for (const e in i) {
      t[e] = {};
      for (const n in i[e]) {
        const r = i[e][n];
        r && (r.isColor || r.isMatrix3 || r.isMatrix4 || r.isVector2 || r.isVector3 || r.isVector4 || r.isTexture || r.isQuaternion) ? r.isRenderTargetTexture ? (console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."), t[e][n] = null) : t[e][n] = r.clone() : Array.isArray(r) ? t[e][n] = r.slice() : t[e][n] = r;
      }
    }
    return t;
  }
  function Ue(i) {
    const t = {};
    for (let e = 0; e < i.length; e++) {
      const n = Gi(i[e]);
      for (const r in n) t[r] = n[r];
    }
    return t;
  }
  function td(i) {
    const t = [];
    for (let e = 0; e < i.length; e++) t.push(i[e].clone());
    return t;
  }
  function Zc(i) {
    const t = i.getRenderTarget();
    return t === null ? i.outputColorSpace : t.isXRRenderTarget === true ? t.texture.colorSpace : Zt.workingColorSpace;
  }
  const ed = { clone: Gi, merge: Ue };
  var nd = `void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`, id = `void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;
  class Xn extends ji {
    static get type() {
      return "ShaderMaterial";
    }
    constructor(t) {
      super(), this.isShaderMaterial = true, this.defines = {}, this.uniforms = {}, this.uniformsGroups = [], this.vertexShader = nd, this.fragmentShader = id, this.linewidth = 1, this.wireframe = false, this.wireframeLinewidth = 1, this.fog = false, this.lights = false, this.clipping = false, this.forceSinglePass = true, this.extensions = { clipCullDistance: false, multiDraw: false }, this.defaultAttributeValues = { color: [1, 1, 1], uv: [0, 0], uv1: [0, 0] }, this.index0AttributeName = void 0, this.uniformsNeedUpdate = false, this.glslVersion = null, t !== void 0 && this.setValues(t);
    }
    copy(t) {
      return super.copy(t), this.fragmentShader = t.fragmentShader, this.vertexShader = t.vertexShader, this.uniforms = Gi(t.uniforms), this.uniformsGroups = td(t.uniformsGroups), this.defines = Object.assign({}, t.defines), this.wireframe = t.wireframe, this.wireframeLinewidth = t.wireframeLinewidth, this.fog = t.fog, this.lights = t.lights, this.clipping = t.clipping, this.extensions = Object.assign({}, t.extensions), this.glslVersion = t.glslVersion, this;
    }
    toJSON(t) {
      const e = super.toJSON(t);
      e.glslVersion = this.glslVersion, e.uniforms = {};
      for (const r in this.uniforms) {
        const a = this.uniforms[r].value;
        a && a.isTexture ? e.uniforms[r] = { type: "t", value: a.toJSON(t).uuid } : a && a.isColor ? e.uniforms[r] = { type: "c", value: a.getHex() } : a && a.isVector2 ? e.uniforms[r] = { type: "v2", value: a.toArray() } : a && a.isVector3 ? e.uniforms[r] = { type: "v3", value: a.toArray() } : a && a.isVector4 ? e.uniforms[r] = { type: "v4", value: a.toArray() } : a && a.isMatrix3 ? e.uniforms[r] = { type: "m3", value: a.toArray() } : a && a.isMatrix4 ? e.uniforms[r] = { type: "m4", value: a.toArray() } : e.uniforms[r] = { value: a };
      }
      Object.keys(this.defines).length > 0 && (e.defines = this.defines), e.vertexShader = this.vertexShader, e.fragmentShader = this.fragmentShader, e.lights = this.lights, e.clipping = this.clipping;
      const n = {};
      for (const r in this.extensions) this.extensions[r] === true && (n[r] = true);
      return Object.keys(n).length > 0 && (e.extensions = n), e;
    }
  }
  class $c extends Ae {
    constructor() {
      super(), this.isCamera = true, this.type = "Camera", this.matrixWorldInverse = new pe(), this.projectionMatrix = new pe(), this.projectionMatrixInverse = new pe(), this.coordinateSystem = Rn;
    }
    copy(t, e) {
      return super.copy(t, e), this.matrixWorldInverse.copy(t.matrixWorldInverse), this.projectionMatrix.copy(t.projectionMatrix), this.projectionMatrixInverse.copy(t.projectionMatrixInverse), this.coordinateSystem = t.coordinateSystem, this;
    }
    getWorldDirection(t) {
      return super.getWorldDirection(t).negate();
    }
    updateMatrixWorld(t) {
      super.updateMatrixWorld(t), this.matrixWorldInverse.copy(this.matrixWorld).invert();
    }
    updateWorldMatrix(t, e) {
      super.updateWorldMatrix(t, e), this.matrixWorldInverse.copy(this.matrixWorld).invert();
    }
    clone() {
      return new this.constructor().copy(this);
    }
  }
  const Hn = new z(), xl = new Jt(), Sl = new Jt();
  class $e extends $c {
    constructor(t = 50, e = 1, n = 0.1, r = 2e3) {
      super(), this.isPerspectiveCamera = true, this.type = "PerspectiveCamera", this.fov = t, this.zoom = 1, this.near = n, this.far = r, this.focus = 10, this.aspect = e, this.view = null, this.filmGauge = 35, this.filmOffset = 0, this.updateProjectionMatrix();
    }
    copy(t, e) {
      return super.copy(t, e), this.fov = t.fov, this.zoom = t.zoom, this.near = t.near, this.far = t.far, this.focus = t.focus, this.aspect = t.aspect, this.view = t.view === null ? null : Object.assign({}, t.view), this.filmGauge = t.filmGauge, this.filmOffset = t.filmOffset, this;
    }
    setFocalLength(t) {
      const e = 0.5 * this.getFilmHeight() / t;
      this.fov = Ya * 2 * Math.atan(e), this.updateProjectionMatrix();
    }
    getFocalLength() {
      const t = Math.tan(Ls * 0.5 * this.fov);
      return 0.5 * this.getFilmHeight() / t;
    }
    getEffectiveFOV() {
      return Ya * 2 * Math.atan(Math.tan(Ls * 0.5 * this.fov) / this.zoom);
    }
    getFilmWidth() {
      return this.filmGauge * Math.min(this.aspect, 1);
    }
    getFilmHeight() {
      return this.filmGauge / Math.max(this.aspect, 1);
    }
    getViewBounds(t, e, n) {
      Hn.set(-1, -1, 0.5).applyMatrix4(this.projectionMatrixInverse), e.set(Hn.x, Hn.y).multiplyScalar(-t / Hn.z), Hn.set(1, 1, 0.5).applyMatrix4(this.projectionMatrixInverse), n.set(Hn.x, Hn.y).multiplyScalar(-t / Hn.z);
    }
    getViewSize(t, e) {
      return this.getViewBounds(t, xl, Sl), e.subVectors(Sl, xl);
    }
    setViewOffset(t, e, n, r, s, a) {
      this.aspect = t / e, this.view === null && (this.view = { enabled: true, fullWidth: 1, fullHeight: 1, offsetX: 0, offsetY: 0, width: 1, height: 1 }), this.view.enabled = true, this.view.fullWidth = t, this.view.fullHeight = e, this.view.offsetX = n, this.view.offsetY = r, this.view.width = s, this.view.height = a, this.updateProjectionMatrix();
    }
    clearViewOffset() {
      this.view !== null && (this.view.enabled = false), this.updateProjectionMatrix();
    }
    updateProjectionMatrix() {
      const t = this.near;
      let e = t * Math.tan(Ls * 0.5 * this.fov) / this.zoom, n = 2 * e, r = this.aspect * n, s = -0.5 * r;
      const a = this.view;
      if (this.view !== null && this.view.enabled) {
        const l = a.fullWidth, c = a.fullHeight;
        s += a.offsetX * r / l, e -= a.offsetY * n / c, r *= a.width / l, n *= a.height / c;
      }
      const o = this.filmOffset;
      o !== 0 && (s += t * o / this.getFilmWidth()), this.projectionMatrix.makePerspective(s, s + r, e, e - n, t, this.far, this.coordinateSystem), this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
    }
    toJSON(t) {
      const e = super.toJSON(t);
      return e.object.fov = this.fov, e.object.zoom = this.zoom, e.object.near = this.near, e.object.far = this.far, e.object.focus = this.focus, e.object.aspect = this.aspect, this.view !== null && (e.object.view = Object.assign({}, this.view)), e.object.filmGauge = this.filmGauge, e.object.filmOffset = this.filmOffset, e;
    }
  }
  const Ti = -90, Ri = 1;
  class rd extends Ae {
    constructor(t, e, n) {
      super(), this.type = "CubeCamera", this.renderTarget = n, this.coordinateSystem = null, this.activeMipmapLevel = 0;
      const r = new $e(Ti, Ri, t, e);
      r.layers = this.layers, this.add(r);
      const s = new $e(Ti, Ri, t, e);
      s.layers = this.layers, this.add(s);
      const a = new $e(Ti, Ri, t, e);
      a.layers = this.layers, this.add(a);
      const o = new $e(Ti, Ri, t, e);
      o.layers = this.layers, this.add(o);
      const l = new $e(Ti, Ri, t, e);
      l.layers = this.layers, this.add(l);
      const c = new $e(Ti, Ri, t, e);
      c.layers = this.layers, this.add(c);
    }
    updateCoordinateSystem() {
      const t = this.coordinateSystem, e = this.children.concat(), [n, r, s, a, o, l] = e;
      for (const c of e) this.remove(c);
      if (t === Rn) n.up.set(0, 1, 0), n.lookAt(1, 0, 0), r.up.set(0, 1, 0), r.lookAt(-1, 0, 0), s.up.set(0, 0, -1), s.lookAt(0, 1, 0), a.up.set(0, 0, 1), a.lookAt(0, -1, 0), o.up.set(0, 1, 0), o.lookAt(0, 0, 1), l.up.set(0, 1, 0), l.lookAt(0, 0, -1);
      else if (t === is) n.up.set(0, -1, 0), n.lookAt(-1, 0, 0), r.up.set(0, -1, 0), r.lookAt(1, 0, 0), s.up.set(0, 0, 1), s.lookAt(0, 1, 0), a.up.set(0, 0, -1), a.lookAt(0, -1, 0), o.up.set(0, -1, 0), o.lookAt(0, 0, 1), l.up.set(0, -1, 0), l.lookAt(0, 0, -1);
      else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: " + t);
      for (const c of e) this.add(c), c.updateMatrixWorld();
    }
    update(t, e) {
      this.parent === null && this.updateMatrixWorld();
      const { renderTarget: n, activeMipmapLevel: r } = this;
      this.coordinateSystem !== t.coordinateSystem && (this.coordinateSystem = t.coordinateSystem, this.updateCoordinateSystem());
      const [s, a, o, l, c, u] = this.children, f = t.getRenderTarget(), p = t.getActiveCubeFace(), _ = t.getActiveMipmapLevel(), g = t.xr.enabled;
      t.xr.enabled = false;
      const v = n.texture.generateMipmaps;
      n.texture.generateMipmaps = false, t.setRenderTarget(n, 0, r), t.render(e, s), t.setRenderTarget(n, 1, r), t.render(e, a), t.setRenderTarget(n, 2, r), t.render(e, o), t.setRenderTarget(n, 3, r), t.render(e, l), t.setRenderTarget(n, 4, r), t.render(e, c), n.texture.generateMipmaps = v, t.setRenderTarget(n, 5, r), t.render(e, u), t.setRenderTarget(f, p, _), t.xr.enabled = g, n.texture.needsPMREMUpdate = true;
    }
  }
  class Jc extends Be {
    constructor(t, e, n, r, s, a, o, l, c, u) {
      t = t !== void 0 ? t : [], e = e !== void 0 ? e : Oi, super(t, e, n, r, s, a, o, l, c, u), this.isCubeTexture = true, this.flipY = false;
    }
    get images() {
      return this.image;
    }
    set images(t) {
      this.image = t;
    }
  }
  class sd extends ui {
    constructor(t = 1, e = {}) {
      super(t, t, e), this.isWebGLCubeRenderTarget = true;
      const n = { width: t, height: t, depth: 1 }, r = [n, n, n, n, n, n];
      this.texture = new Jc(r, e.mapping, e.wrapS, e.wrapT, e.magFilter, e.minFilter, e.format, e.type, e.anisotropy, e.colorSpace), this.texture.isRenderTargetTexture = true, this.texture.generateMipmaps = e.generateMipmaps !== void 0 ? e.generateMipmaps : false, this.texture.minFilter = e.minFilter !== void 0 ? e.minFilter : dn;
    }
    fromEquirectangularTexture(t, e) {
      this.texture.type = e.type, this.texture.colorSpace = e.colorSpace, this.texture.generateMipmaps = e.generateMipmaps, this.texture.minFilter = e.minFilter, this.texture.magFilter = e.magFilter;
      const n = { uniforms: { tEquirect: { value: null } }, vertexShader: `

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`, fragmentShader: `

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			` }, r = new qe(5, 5, 5), s = new Xn({ name: "CubemapFromEquirect", uniforms: Gi(n.uniforms), vertexShader: n.vertexShader, fragmentShader: n.fragmentShader, side: ze, blending: kn });
      s.uniforms.tEquirect.value = e;
      const a = new Re(r, s), o = e.minFilter;
      return e.minFilter === oi && (e.minFilter = dn), new rd(1, 10, this).update(t, a), e.minFilter = o, a.geometry.dispose(), a.material.dispose(), this;
    }
    clear(t, e, n, r) {
      const s = t.getRenderTarget();
      for (let a = 0; a < 6; a++) t.setRenderTarget(this, a), t.clear(e, n, r);
      t.setRenderTarget(s);
    }
  }
  const Qs = new z(), ad = new z(), od = new Nt();
  class ni {
    constructor(t = new z(1, 0, 0), e = 0) {
      this.isPlane = true, this.normal = t, this.constant = e;
    }
    set(t, e) {
      return this.normal.copy(t), this.constant = e, this;
    }
    setComponents(t, e, n, r) {
      return this.normal.set(t, e, n), this.constant = r, this;
    }
    setFromNormalAndCoplanarPoint(t, e) {
      return this.normal.copy(t), this.constant = -e.dot(this.normal), this;
    }
    setFromCoplanarPoints(t, e, n) {
      const r = Qs.subVectors(n, e).cross(ad.subVectors(t, e)).normalize();
      return this.setFromNormalAndCoplanarPoint(r, t), this;
    }
    copy(t) {
      return this.normal.copy(t.normal), this.constant = t.constant, this;
    }
    normalize() {
      const t = 1 / this.normal.length();
      return this.normal.multiplyScalar(t), this.constant *= t, this;
    }
    negate() {
      return this.constant *= -1, this.normal.negate(), this;
    }
    distanceToPoint(t) {
      return this.normal.dot(t) + this.constant;
    }
    distanceToSphere(t) {
      return this.distanceToPoint(t.center) - t.radius;
    }
    projectPoint(t, e) {
      return e.copy(t).addScaledVector(this.normal, -this.distanceToPoint(t));
    }
    intersectLine(t, e) {
      const n = t.delta(Qs), r = this.normal.dot(n);
      if (r === 0) return this.distanceToPoint(t.start) === 0 ? e.copy(t.start) : null;
      const s = -(t.start.dot(this.normal) + this.constant) / r;
      return s < 0 || s > 1 ? null : e.copy(t.start).addScaledVector(n, s);
    }
    intersectsLine(t) {
      const e = this.distanceToPoint(t.start), n = this.distanceToPoint(t.end);
      return e < 0 && n > 0 || n < 0 && e > 0;
    }
    intersectsBox(t) {
      return t.intersectsPlane(this);
    }
    intersectsSphere(t) {
      return t.intersectsPlane(this);
    }
    coplanarPoint(t) {
      return t.copy(this.normal).multiplyScalar(-this.constant);
    }
    applyMatrix4(t, e) {
      const n = e || od.getNormalMatrix(t), r = this.coplanarPoint(Qs).applyMatrix4(t), s = this.normal.applyMatrix3(n).normalize();
      return this.constant = -r.dot(s), this;
    }
    translate(t) {
      return this.constant -= t.dot(this.normal), this;
    }
    equals(t) {
      return t.normal.equals(this.normal) && t.constant === this.constant;
    }
    clone() {
      return new this.constructor().copy(this);
    }
  }
  const Jn = new bs(), Br = new z();
  class _o {
    constructor(t = new ni(), e = new ni(), n = new ni(), r = new ni(), s = new ni(), a = new ni()) {
      this.planes = [t, e, n, r, s, a];
    }
    set(t, e, n, r, s, a) {
      const o = this.planes;
      return o[0].copy(t), o[1].copy(e), o[2].copy(n), o[3].copy(r), o[4].copy(s), o[5].copy(a), this;
    }
    copy(t) {
      const e = this.planes;
      for (let n = 0; n < 6; n++) e[n].copy(t.planes[n]);
      return this;
    }
    setFromProjectionMatrix(t, e = Rn) {
      const n = this.planes, r = t.elements, s = r[0], a = r[1], o = r[2], l = r[3], c = r[4], u = r[5], f = r[6], p = r[7], _ = r[8], g = r[9], v = r[10], m = r[11], d = r[12], T = r[13], E = r[14], y = r[15];
      if (n[0].setComponents(l - s, p - c, m - _, y - d).normalize(), n[1].setComponents(l + s, p + c, m + _, y + d).normalize(), n[2].setComponents(l + a, p + u, m + g, y + T).normalize(), n[3].setComponents(l - a, p - u, m - g, y - T).normalize(), n[4].setComponents(l - o, p - f, m - v, y - E).normalize(), e === Rn) n[5].setComponents(l + o, p + f, m + v, y + E).normalize();
      else if (e === is) n[5].setComponents(o, f, v, E).normalize();
      else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: " + e);
      return this;
    }
    intersectsObject(t) {
      if (t.boundingSphere !== void 0) t.boundingSphere === null && t.computeBoundingSphere(), Jn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);
      else {
        const e = t.geometry;
        e.boundingSphere === null && e.computeBoundingSphere(), Jn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld);
      }
      return this.intersectsSphere(Jn);
    }
    intersectsSprite(t) {
      return Jn.center.set(0, 0, 0), Jn.radius = 0.7071067811865476, Jn.applyMatrix4(t.matrixWorld), this.intersectsSphere(Jn);
    }
    intersectsSphere(t) {
      const e = this.planes, n = t.center, r = -t.radius;
      for (let s = 0; s < 6; s++) if (e[s].distanceToPoint(n) < r) return false;
      return true;
    }
    intersectsBox(t) {
      const e = this.planes;
      for (let n = 0; n < 6; n++) {
        const r = e[n];
        if (Br.x = r.normal.x > 0 ? t.max.x : t.min.x, Br.y = r.normal.y > 0 ? t.max.y : t.min.y, Br.z = r.normal.z > 0 ? t.max.z : t.min.z, r.distanceToPoint(Br) < 0) return false;
      }
      return true;
    }
    containsPoint(t) {
      const e = this.planes;
      for (let n = 0; n < 6; n++) if (e[n].distanceToPoint(t) < 0) return false;
      return true;
    }
    clone() {
      return new this.constructor().copy(this);
    }
  }
  function Qc() {
    let i = null, t = false, e = null, n = null;
    function r(s, a) {
      e(s, a), n = i.requestAnimationFrame(r);
    }
    return { start: function() {
      t !== true && e !== null && (n = i.requestAnimationFrame(r), t = true);
    }, stop: function() {
      i.cancelAnimationFrame(n), t = false;
    }, setAnimationLoop: function(s) {
      e = s;
    }, setContext: function(s) {
      i = s;
    } };
  }
  function ld(i) {
    const t = /* @__PURE__ */ new WeakMap();
    function e(o, l) {
      const c = o.array, u = o.usage, f = c.byteLength, p = i.createBuffer();
      i.bindBuffer(l, p), i.bufferData(l, c, u), o.onUploadCallback();
      let _;
      if (c instanceof Float32Array) _ = i.FLOAT;
      else if (c instanceof Uint16Array) o.isFloat16BufferAttribute ? _ = i.HALF_FLOAT : _ = i.UNSIGNED_SHORT;
      else if (c instanceof Int16Array) _ = i.SHORT;
      else if (c instanceof Uint32Array) _ = i.UNSIGNED_INT;
      else if (c instanceof Int32Array) _ = i.INT;
      else if (c instanceof Int8Array) _ = i.BYTE;
      else if (c instanceof Uint8Array) _ = i.UNSIGNED_BYTE;
      else if (c instanceof Uint8ClampedArray) _ = i.UNSIGNED_BYTE;
      else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: " + c);
      return { buffer: p, type: _, bytesPerElement: c.BYTES_PER_ELEMENT, version: o.version, size: f };
    }
    function n(o, l, c) {
      const u = l.array, f = l.updateRanges;
      if (i.bindBuffer(c, o), f.length === 0) i.bufferSubData(c, 0, u);
      else {
        f.sort((_, g) => _.start - g.start);
        let p = 0;
        for (let _ = 1; _ < f.length; _++) {
          const g = f[p], v = f[_];
          v.start <= g.start + g.count + 1 ? g.count = Math.max(g.count, v.start + v.count - g.start) : (++p, f[p] = v);
        }
        f.length = p + 1;
        for (let _ = 0, g = f.length; _ < g; _++) {
          const v = f[_];
          i.bufferSubData(c, v.start * u.BYTES_PER_ELEMENT, u, v.start, v.count);
        }
        l.clearUpdateRanges();
      }
      l.onUploadCallback();
    }
    function r(o) {
      return o.isInterleavedBufferAttribute && (o = o.data), t.get(o);
    }
    function s(o) {
      o.isInterleavedBufferAttribute && (o = o.data);
      const l = t.get(o);
      l && (i.deleteBuffer(l.buffer), t.delete(o));
    }
    function a(o, l) {
      if (o.isInterleavedBufferAttribute && (o = o.data), o.isGLBufferAttribute) {
        const u = t.get(o);
        (!u || u.version < o.version) && t.set(o, { buffer: o.buffer, type: o.type, bytesPerElement: o.elementSize, version: o.version });
        return;
      }
      const c = t.get(o);
      if (c === void 0) t.set(o, e(o, l));
      else if (c.version < o.version) {
        if (c.size !== o.array.byteLength) throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");
        n(c.buffer, o, l), c.version = o.version;
      }
    }
    return { get: r, remove: s, update: a };
  }
  class xs extends _n {
    constructor(t = 1, e = 1, n = 1, r = 1) {
      super(), this.type = "PlaneGeometry", this.parameters = { width: t, height: e, widthSegments: n, heightSegments: r };
      const s = t / 2, a = e / 2, o = Math.floor(n), l = Math.floor(r), c = o + 1, u = l + 1, f = t / o, p = e / l, _ = [], g = [], v = [], m = [];
      for (let d = 0; d < u; d++) {
        const T = d * p - a;
        for (let E = 0; E < c; E++) {
          const y = E * f - s;
          g.push(y, -T, 0), v.push(0, 0, 1), m.push(E / o), m.push(1 - d / l);
        }
      }
      for (let d = 0; d < l; d++) for (let T = 0; T < o; T++) {
        const E = T + c * d, y = T + c * (d + 1), H = T + 1 + c * (d + 1), P = T + 1 + c * d;
        _.push(E, y, P), _.push(y, H, P);
      }
      this.setIndex(_), this.setAttribute("position", new He(g, 3)), this.setAttribute("normal", new He(v, 3)), this.setAttribute("uv", new He(m, 2));
    }
    copy(t) {
      return super.copy(t), this.parameters = Object.assign({}, t.parameters), this;
    }
    static fromJSON(t) {
      return new xs(t.width, t.height, t.widthSegments, t.heightSegments);
    }
  }
  var cd = `#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`, hd = `#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`, ud = `#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`, dd = `#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`, fd = `#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`, pd = `#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`, _d = `#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`, md = `#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`, gd = `#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`, wd = `#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`, vd = `vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`, bd = `vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`, xd = `float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`, Sd = `#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`, yd = `#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`, Md = `#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`, Ed = `#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`, Td = `#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`, Rd = `#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`, Ad = `#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`, Cd = `#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`, Pd = `#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`, Id = `#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`, Ld = `#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`, Dd = `#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`, Ud = `vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`, Fd = `#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`, Nd = `#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`, Od = `#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`, zd = `#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`, Bd = "gl_FragColor = linearToOutputTexel( gl_FragColor );", Hd = `vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`, Gd = `#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`, kd = `#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`, Vd = `#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`, Wd = `#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`, Xd = `#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`, qd = `#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`, jd = `#ifdef USE_FOG
	varying float vFogDepth;
#endif`, Yd = `#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`, Kd = `#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`, Zd = `#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`, $d = `#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`, Jd = `LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`, Qd = `varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`, tf = `uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`, ef = `#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`, nf = `ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`, rf = `varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`, sf = `BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`, af = `varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`, of = `PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`, lf = `struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`, cf = `
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`, hf = `#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`, uf = `#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`, df = `#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`, ff = `#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`, pf = `#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`, _f = `#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`, mf = `#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`, gf = `#ifdef USE_MAP
	uniform sampler2D map;
#endif`, wf = `#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`, vf = `#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`, bf = `float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`, xf = `#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`, Sf = `#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`, yf = `#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`, Mf = `#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`, Ef = `#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`, Tf = `#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`, Rf = `float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`, Af = `#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`, Cf = `#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`, Pf = `#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`, If = `#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`, Lf = `#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`, Df = `#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`, Uf = `#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`, Ff = `#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`, Nf = `#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`, Of = `#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`, zf = `vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`, Bf = `#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`, Hf = `vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`, Gf = `#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`, kf = `#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`, Vf = `float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`, Wf = `#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`, Xf = `#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`, qf = `#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`, jf = `#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`, Yf = `float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`, Kf = `#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`, Zf = `#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`, $f = `#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`, Jf = `#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`, Qf = `float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`, tp = `#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`, ep = `#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`, np = `#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`, ip = `#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`, rp = `#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`, sp = `#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`, ap = `#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`, op = `#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`, lp = `#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;
  const cp = `varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`, hp = `uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`, up = `varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`, dp = `#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`, fp = `varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`, pp = `uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`, _p = `#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`, mp = `#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`, gp = `#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`, wp = `#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`, vp = `varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`, bp = `uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`, xp = `uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`, Sp = `uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`, yp = `#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`, Mp = `uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, Ep = `#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`, Tp = `#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, Rp = `#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`, Ap = `#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, Cp = `#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`, Pp = `#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`, Ip = `#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`, Lp = `#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, Dp = `#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`, Up = `#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, Fp = `#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`, Np = `#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, Op = `uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`, zp = `uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`, Bp = `#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`, Hp = `uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`, Gp = `uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`, kp = `uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`, zt = { alphahash_fragment: cd, alphahash_pars_fragment: hd, alphamap_fragment: ud, alphamap_pars_fragment: dd, alphatest_fragment: fd, alphatest_pars_fragment: pd, aomap_fragment: _d, aomap_pars_fragment: md, batching_pars_vertex: gd, batching_vertex: wd, begin_vertex: vd, beginnormal_vertex: bd, bsdfs: xd, iridescence_fragment: Sd, bumpmap_pars_fragment: yd, clipping_planes_fragment: Md, clipping_planes_pars_fragment: Ed, clipping_planes_pars_vertex: Td, clipping_planes_vertex: Rd, color_fragment: Ad, color_pars_fragment: Cd, color_pars_vertex: Pd, color_vertex: Id, common: Ld, cube_uv_reflection_fragment: Dd, defaultnormal_vertex: Ud, displacementmap_pars_vertex: Fd, displacementmap_vertex: Nd, emissivemap_fragment: Od, emissivemap_pars_fragment: zd, colorspace_fragment: Bd, colorspace_pars_fragment: Hd, envmap_fragment: Gd, envmap_common_pars_fragment: kd, envmap_pars_fragment: Vd, envmap_pars_vertex: Wd, envmap_physical_pars_fragment: ef, envmap_vertex: Xd, fog_vertex: qd, fog_pars_vertex: jd, fog_fragment: Yd, fog_pars_fragment: Kd, gradientmap_pars_fragment: Zd, lightmap_pars_fragment: $d, lights_lambert_fragment: Jd, lights_lambert_pars_fragment: Qd, lights_pars_begin: tf, lights_toon_fragment: nf, lights_toon_pars_fragment: rf, lights_phong_fragment: sf, lights_phong_pars_fragment: af, lights_physical_fragment: of, lights_physical_pars_fragment: lf, lights_fragment_begin: cf, lights_fragment_maps: hf, lights_fragment_end: uf, logdepthbuf_fragment: df, logdepthbuf_pars_fragment: ff, logdepthbuf_pars_vertex: pf, logdepthbuf_vertex: _f, map_fragment: mf, map_pars_fragment: gf, map_particle_fragment: wf, map_particle_pars_fragment: vf, metalnessmap_fragment: bf, metalnessmap_pars_fragment: xf, morphinstance_vertex: Sf, morphcolor_vertex: yf, morphnormal_vertex: Mf, morphtarget_pars_vertex: Ef, morphtarget_vertex: Tf, normal_fragment_begin: Rf, normal_fragment_maps: Af, normal_pars_fragment: Cf, normal_pars_vertex: Pf, normal_vertex: If, normalmap_pars_fragment: Lf, clearcoat_normal_fragment_begin: Df, clearcoat_normal_fragment_maps: Uf, clearcoat_pars_fragment: Ff, iridescence_pars_fragment: Nf, opaque_fragment: Of, packing: zf, premultiplied_alpha_fragment: Bf, project_vertex: Hf, dithering_fragment: Gf, dithering_pars_fragment: kf, roughnessmap_fragment: Vf, roughnessmap_pars_fragment: Wf, shadowmap_pars_fragment: Xf, shadowmap_pars_vertex: qf, shadowmap_vertex: jf, shadowmask_pars_fragment: Yf, skinbase_vertex: Kf, skinning_pars_vertex: Zf, skinning_vertex: $f, skinnormal_vertex: Jf, specularmap_fragment: Qf, specularmap_pars_fragment: tp, tonemapping_fragment: ep, tonemapping_pars_fragment: np, transmission_fragment: ip, transmission_pars_fragment: rp, uv_pars_fragment: sp, uv_pars_vertex: ap, uv_vertex: op, worldpos_vertex: lp, background_vert: cp, background_frag: hp, backgroundCube_vert: up, backgroundCube_frag: dp, cube_vert: fp, cube_frag: pp, depth_vert: _p, depth_frag: mp, distanceRGBA_vert: gp, distanceRGBA_frag: wp, equirect_vert: vp, equirect_frag: bp, linedashed_vert: xp, linedashed_frag: Sp, meshbasic_vert: yp, meshbasic_frag: Mp, meshlambert_vert: Ep, meshlambert_frag: Tp, meshmatcap_vert: Rp, meshmatcap_frag: Ap, meshnormal_vert: Cp, meshnormal_frag: Pp, meshphong_vert: Ip, meshphong_frag: Lp, meshphysical_vert: Dp, meshphysical_frag: Up, meshtoon_vert: Fp, meshtoon_frag: Np, points_vert: Op, points_frag: zp, shadow_vert: Bp, shadow_frag: Hp, sprite_vert: Gp, sprite_frag: kp }, st = { common: { diffuse: { value: new Vt(16777215) }, opacity: { value: 1 }, map: { value: null }, mapTransform: { value: new Nt() }, alphaMap: { value: null }, alphaMapTransform: { value: new Nt() }, alphaTest: { value: 0 } }, specularmap: { specularMap: { value: null }, specularMapTransform: { value: new Nt() } }, envmap: { envMap: { value: null }, envMapRotation: { value: new Nt() }, flipEnvMap: { value: -1 }, reflectivity: { value: 1 }, ior: { value: 1.5 }, refractionRatio: { value: 0.98 } }, aomap: { aoMap: { value: null }, aoMapIntensity: { value: 1 }, aoMapTransform: { value: new Nt() } }, lightmap: { lightMap: { value: null }, lightMapIntensity: { value: 1 }, lightMapTransform: { value: new Nt() } }, bumpmap: { bumpMap: { value: null }, bumpMapTransform: { value: new Nt() }, bumpScale: { value: 1 } }, normalmap: { normalMap: { value: null }, normalMapTransform: { value: new Nt() }, normalScale: { value: new Jt(1, 1) } }, displacementmap: { displacementMap: { value: null }, displacementMapTransform: { value: new Nt() }, displacementScale: { value: 1 }, displacementBias: { value: 0 } }, emissivemap: { emissiveMap: { value: null }, emissiveMapTransform: { value: new Nt() } }, metalnessmap: { metalnessMap: { value: null }, metalnessMapTransform: { value: new Nt() } }, roughnessmap: { roughnessMap: { value: null }, roughnessMapTransform: { value: new Nt() } }, gradientmap: { gradientMap: { value: null } }, fog: { fogDensity: { value: 25e-5 }, fogNear: { value: 1 }, fogFar: { value: 2e3 }, fogColor: { value: new Vt(16777215) } }, lights: { ambientLightColor: { value: [] }, lightProbe: { value: [] }, directionalLights: { value: [], properties: { direction: {}, color: {} } }, directionalLightShadows: { value: [], properties: { shadowIntensity: 1, shadowBias: {}, shadowNormalBias: {}, shadowRadius: {}, shadowMapSize: {} } }, directionalShadowMap: { value: [] }, directionalShadowMatrix: { value: [] }, spotLights: { value: [], properties: { color: {}, position: {}, direction: {}, distance: {}, coneCos: {}, penumbraCos: {}, decay: {} } }, spotLightShadows: { value: [], properties: { shadowIntensity: 1, shadowBias: {}, shadowNormalBias: {}, shadowRadius: {}, shadowMapSize: {} } }, spotLightMap: { value: [] }, spotShadowMap: { value: [] }, spotLightMatrix: { value: [] }, pointLights: { value: [], properties: { color: {}, position: {}, decay: {}, distance: {} } }, pointLightShadows: { value: [], properties: { shadowIntensity: 1, shadowBias: {}, shadowNormalBias: {}, shadowRadius: {}, shadowMapSize: {}, shadowCameraNear: {}, shadowCameraFar: {} } }, pointShadowMap: { value: [] }, pointShadowMatrix: { value: [] }, hemisphereLights: { value: [], properties: { direction: {}, skyColor: {}, groundColor: {} } }, rectAreaLights: { value: [], properties: { color: {}, position: {}, width: {}, height: {} } }, ltc_1: { value: null }, ltc_2: { value: null } }, points: { diffuse: { value: new Vt(16777215) }, opacity: { value: 1 }, size: { value: 1 }, scale: { value: 1 }, map: { value: null }, alphaMap: { value: null }, alphaMapTransform: { value: new Nt() }, alphaTest: { value: 0 }, uvTransform: { value: new Nt() } }, sprite: { diffuse: { value: new Vt(16777215) }, opacity: { value: 1 }, center: { value: new Jt(0.5, 0.5) }, rotation: { value: 0 }, map: { value: null }, mapTransform: { value: new Nt() }, alphaMap: { value: null }, alphaMapTransform: { value: new Nt() }, alphaTest: { value: 0 } } }, un = { basic: { uniforms: Ue([st.common, st.specularmap, st.envmap, st.aomap, st.lightmap, st.fog]), vertexShader: zt.meshbasic_vert, fragmentShader: zt.meshbasic_frag }, lambert: { uniforms: Ue([st.common, st.specularmap, st.envmap, st.aomap, st.lightmap, st.emissivemap, st.bumpmap, st.normalmap, st.displacementmap, st.fog, st.lights, { emissive: { value: new Vt(0) } }]), vertexShader: zt.meshlambert_vert, fragmentShader: zt.meshlambert_frag }, phong: { uniforms: Ue([st.common, st.specularmap, st.envmap, st.aomap, st.lightmap, st.emissivemap, st.bumpmap, st.normalmap, st.displacementmap, st.fog, st.lights, { emissive: { value: new Vt(0) }, specular: { value: new Vt(1118481) }, shininess: { value: 30 } }]), vertexShader: zt.meshphong_vert, fragmentShader: zt.meshphong_frag }, standard: { uniforms: Ue([st.common, st.envmap, st.aomap, st.lightmap, st.emissivemap, st.bumpmap, st.normalmap, st.displacementmap, st.roughnessmap, st.metalnessmap, st.fog, st.lights, { emissive: { value: new Vt(0) }, roughness: { value: 1 }, metalness: { value: 0 }, envMapIntensity: { value: 1 } }]), vertexShader: zt.meshphysical_vert, fragmentShader: zt.meshphysical_frag }, toon: { uniforms: Ue([st.common, st.aomap, st.lightmap, st.emissivemap, st.bumpmap, st.normalmap, st.displacementmap, st.gradientmap, st.fog, st.lights, { emissive: { value: new Vt(0) } }]), vertexShader: zt.meshtoon_vert, fragmentShader: zt.meshtoon_frag }, matcap: { uniforms: Ue([st.common, st.bumpmap, st.normalmap, st.displacementmap, st.fog, { matcap: { value: null } }]), vertexShader: zt.meshmatcap_vert, fragmentShader: zt.meshmatcap_frag }, points: { uniforms: Ue([st.points, st.fog]), vertexShader: zt.points_vert, fragmentShader: zt.points_frag }, dashed: { uniforms: Ue([st.common, st.fog, { scale: { value: 1 }, dashSize: { value: 1 }, totalSize: { value: 2 } }]), vertexShader: zt.linedashed_vert, fragmentShader: zt.linedashed_frag }, depth: { uniforms: Ue([st.common, st.displacementmap]), vertexShader: zt.depth_vert, fragmentShader: zt.depth_frag }, normal: { uniforms: Ue([st.common, st.bumpmap, st.normalmap, st.displacementmap, { opacity: { value: 1 } }]), vertexShader: zt.meshnormal_vert, fragmentShader: zt.meshnormal_frag }, sprite: { uniforms: Ue([st.sprite, st.fog]), vertexShader: zt.sprite_vert, fragmentShader: zt.sprite_frag }, background: { uniforms: { uvTransform: { value: new Nt() }, t2D: { value: null }, backgroundIntensity: { value: 1 } }, vertexShader: zt.background_vert, fragmentShader: zt.background_frag }, backgroundCube: { uniforms: { envMap: { value: null }, flipEnvMap: { value: -1 }, backgroundBlurriness: { value: 0 }, backgroundIntensity: { value: 1 }, backgroundRotation: { value: new Nt() } }, vertexShader: zt.backgroundCube_vert, fragmentShader: zt.backgroundCube_frag }, cube: { uniforms: { tCube: { value: null }, tFlip: { value: -1 }, opacity: { value: 1 } }, vertexShader: zt.cube_vert, fragmentShader: zt.cube_frag }, equirect: { uniforms: { tEquirect: { value: null } }, vertexShader: zt.equirect_vert, fragmentShader: zt.equirect_frag }, distanceRGBA: { uniforms: Ue([st.common, st.displacementmap, { referencePosition: { value: new z() }, nearDistance: { value: 1 }, farDistance: { value: 1e3 } }]), vertexShader: zt.distanceRGBA_vert, fragmentShader: zt.distanceRGBA_frag }, shadow: { uniforms: Ue([st.lights, st.fog, { color: { value: new Vt(0) }, opacity: { value: 1 } }]), vertexShader: zt.shadow_vert, fragmentShader: zt.shadow_frag } };
  un.physical = { uniforms: Ue([un.standard.uniforms, { clearcoat: { value: 0 }, clearcoatMap: { value: null }, clearcoatMapTransform: { value: new Nt() }, clearcoatNormalMap: { value: null }, clearcoatNormalMapTransform: { value: new Nt() }, clearcoatNormalScale: { value: new Jt(1, 1) }, clearcoatRoughness: { value: 0 }, clearcoatRoughnessMap: { value: null }, clearcoatRoughnessMapTransform: { value: new Nt() }, dispersion: { value: 0 }, iridescence: { value: 0 }, iridescenceMap: { value: null }, iridescenceMapTransform: { value: new Nt() }, iridescenceIOR: { value: 1.3 }, iridescenceThicknessMinimum: { value: 100 }, iridescenceThicknessMaximum: { value: 400 }, iridescenceThicknessMap: { value: null }, iridescenceThicknessMapTransform: { value: new Nt() }, sheen: { value: 0 }, sheenColor: { value: new Vt(0) }, sheenColorMap: { value: null }, sheenColorMapTransform: { value: new Nt() }, sheenRoughness: { value: 1 }, sheenRoughnessMap: { value: null }, sheenRoughnessMapTransform: { value: new Nt() }, transmission: { value: 0 }, transmissionMap: { value: null }, transmissionMapTransform: { value: new Nt() }, transmissionSamplerSize: { value: new Jt() }, transmissionSamplerMap: { value: null }, thickness: { value: 0 }, thicknessMap: { value: null }, thicknessMapTransform: { value: new Nt() }, attenuationDistance: { value: 0 }, attenuationColor: { value: new Vt(0) }, specularColor: { value: new Vt(1, 1, 1) }, specularColorMap: { value: null }, specularColorMapTransform: { value: new Nt() }, specularIntensity: { value: 1 }, specularIntensityMap: { value: null }, specularIntensityMapTransform: { value: new Nt() }, anisotropyVector: { value: new Jt() }, anisotropyMap: { value: null }, anisotropyMapTransform: { value: new Nt() } }]), vertexShader: zt.meshphysical_vert, fragmentShader: zt.meshphysical_frag };
  const Hr = { r: 0, b: 0, g: 0 }, Qn = new pn(), Vp = new pe();
  function Wp(i, t, e, n, r, s, a) {
    const o = new Vt(0);
    let l = s === true ? 0 : 1, c, u, f = null, p = 0, _ = null;
    function g(T) {
      let E = T.isScene === true ? T.background : null;
      return E && E.isTexture && (E = (T.backgroundBlurriness > 0 ? e : t).get(E)), E;
    }
    function v(T) {
      let E = false;
      const y = g(T);
      y === null ? d(o, l) : y && y.isColor && (d(y, 1), E = true);
      const H = i.xr.getEnvironmentBlendMode();
      H === "additive" ? n.buffers.color.setClear(0, 0, 0, 1, a) : H === "alpha-blend" && n.buffers.color.setClear(0, 0, 0, 0, a), (i.autoClear || E) && (n.buffers.depth.setTest(true), n.buffers.depth.setMask(true), n.buffers.color.setMask(true), i.clear(i.autoClearColor, i.autoClearDepth, i.autoClearStencil));
    }
    function m(T, E) {
      const y = g(E);
      y && (y.isCubeTexture || y.mapping === ws) ? (u === void 0 && (u = new Re(new qe(1, 1, 1), new Xn({ name: "BackgroundCubeMaterial", uniforms: Gi(un.backgroundCube.uniforms), vertexShader: un.backgroundCube.vertexShader, fragmentShader: un.backgroundCube.fragmentShader, side: ze, depthTest: false, depthWrite: false, fog: false })), u.geometry.deleteAttribute("normal"), u.geometry.deleteAttribute("uv"), u.onBeforeRender = function(H, P, A) {
        this.matrixWorld.copyPosition(A.matrixWorld);
      }, Object.defineProperty(u.material, "envMap", { get: function() {
        return this.uniforms.envMap.value;
      } }), r.update(u)), Qn.copy(E.backgroundRotation), Qn.x *= -1, Qn.y *= -1, Qn.z *= -1, y.isCubeTexture && y.isRenderTargetTexture === false && (Qn.y *= -1, Qn.z *= -1), u.material.uniforms.envMap.value = y, u.material.uniforms.flipEnvMap.value = y.isCubeTexture && y.isRenderTargetTexture === false ? -1 : 1, u.material.uniforms.backgroundBlurriness.value = E.backgroundBlurriness, u.material.uniforms.backgroundIntensity.value = E.backgroundIntensity, u.material.uniforms.backgroundRotation.value.setFromMatrix4(Vp.makeRotationFromEuler(Qn)), u.material.toneMapped = Zt.getTransfer(y.colorSpace) !== ne, (f !== y || p !== y.version || _ !== i.toneMapping) && (u.material.needsUpdate = true, f = y, p = y.version, _ = i.toneMapping), u.layers.enableAll(), T.unshift(u, u.geometry, u.material, 0, 0, null)) : y && y.isTexture && (c === void 0 && (c = new Re(new xs(2, 2), new Xn({ name: "BackgroundMaterial", uniforms: Gi(un.background.uniforms), vertexShader: un.background.vertexShader, fragmentShader: un.background.fragmentShader, side: Wn, depthTest: false, depthWrite: false, fog: false })), c.geometry.deleteAttribute("normal"), Object.defineProperty(c.material, "map", { get: function() {
        return this.uniforms.t2D.value;
      } }), r.update(c)), c.material.uniforms.t2D.value = y, c.material.uniforms.backgroundIntensity.value = E.backgroundIntensity, c.material.toneMapped = Zt.getTransfer(y.colorSpace) !== ne, y.matrixAutoUpdate === true && y.updateMatrix(), c.material.uniforms.uvTransform.value.copy(y.matrix), (f !== y || p !== y.version || _ !== i.toneMapping) && (c.material.needsUpdate = true, f = y, p = y.version, _ = i.toneMapping), c.layers.enableAll(), T.unshift(c, c.geometry, c.material, 0, 0, null));
    }
    function d(T, E) {
      T.getRGB(Hr, Zc(i)), n.buffers.color.setClear(Hr.r, Hr.g, Hr.b, E, a);
    }
    return { getClearColor: function() {
      return o;
    }, setClearColor: function(T, E = 1) {
      o.set(T), l = E, d(o, l);
    }, getClearAlpha: function() {
      return l;
    }, setClearAlpha: function(T) {
      l = T, d(o, l);
    }, render: v, addToRenderList: m };
  }
  function Xp(i, t) {
    const e = i.getParameter(i.MAX_VERTEX_ATTRIBS), n = {}, r = p(null);
    let s = r, a = false;
    function o(x, C, W, V, Y) {
      let Q = false;
      const j = f(V, W, C);
      s !== j && (s = j, c(s.object)), Q = _(x, V, W, Y), Q && g(x, V, W, Y), Y !== null && t.update(Y, i.ELEMENT_ARRAY_BUFFER), (Q || a) && (a = false, y(x, C, W, V), Y !== null && i.bindBuffer(i.ELEMENT_ARRAY_BUFFER, t.get(Y).buffer));
    }
    function l() {
      return i.createVertexArray();
    }
    function c(x) {
      return i.bindVertexArray(x);
    }
    function u(x) {
      return i.deleteVertexArray(x);
    }
    function f(x, C, W) {
      const V = W.wireframe === true;
      let Y = n[x.id];
      Y === void 0 && (Y = {}, n[x.id] = Y);
      let Q = Y[C.id];
      Q === void 0 && (Q = {}, Y[C.id] = Q);
      let j = Q[V];
      return j === void 0 && (j = p(l()), Q[V] = j), j;
    }
    function p(x) {
      const C = [], W = [], V = [];
      for (let Y = 0; Y < e; Y++) C[Y] = 0, W[Y] = 0, V[Y] = 0;
      return { geometry: null, program: null, wireframe: false, newAttributes: C, enabledAttributes: W, attributeDivisors: V, object: x, attributes: {}, index: null };
    }
    function _(x, C, W, V) {
      const Y = s.attributes, Q = C.attributes;
      let j = 0;
      const et = W.getAttributes();
      for (const q in et) if (et[q].location >= 0) {
        const ft = Y[q];
        let Mt = Q[q];
        if (Mt === void 0 && (q === "instanceMatrix" && x.instanceMatrix && (Mt = x.instanceMatrix), q === "instanceColor" && x.instanceColor && (Mt = x.instanceColor)), ft === void 0 || ft.attribute !== Mt || Mt && ft.data !== Mt.data) return true;
        j++;
      }
      return s.attributesNum !== j || s.index !== V;
    }
    function g(x, C, W, V) {
      const Y = {}, Q = C.attributes;
      let j = 0;
      const et = W.getAttributes();
      for (const q in et) if (et[q].location >= 0) {
        let ft = Q[q];
        ft === void 0 && (q === "instanceMatrix" && x.instanceMatrix && (ft = x.instanceMatrix), q === "instanceColor" && x.instanceColor && (ft = x.instanceColor));
        const Mt = {};
        Mt.attribute = ft, ft && ft.data && (Mt.data = ft.data), Y[q] = Mt, j++;
      }
      s.attributes = Y, s.attributesNum = j, s.index = V;
    }
    function v() {
      const x = s.newAttributes;
      for (let C = 0, W = x.length; C < W; C++) x[C] = 0;
    }
    function m(x) {
      d(x, 0);
    }
    function d(x, C) {
      const W = s.newAttributes, V = s.enabledAttributes, Y = s.attributeDivisors;
      W[x] = 1, V[x] === 0 && (i.enableVertexAttribArray(x), V[x] = 1), Y[x] !== C && (i.vertexAttribDivisor(x, C), Y[x] = C);
    }
    function T() {
      const x = s.newAttributes, C = s.enabledAttributes;
      for (let W = 0, V = C.length; W < V; W++) C[W] !== x[W] && (i.disableVertexAttribArray(W), C[W] = 0);
    }
    function E(x, C, W, V, Y, Q, j) {
      j === true ? i.vertexAttribIPointer(x, C, W, Y, Q) : i.vertexAttribPointer(x, C, W, V, Y, Q);
    }
    function y(x, C, W, V) {
      v();
      const Y = V.attributes, Q = W.getAttributes(), j = C.defaultAttributeValues;
      for (const et in Q) {
        const q = Q[et];
        if (q.location >= 0) {
          let ot = Y[et];
          if (ot === void 0 && (et === "instanceMatrix" && x.instanceMatrix && (ot = x.instanceMatrix), et === "instanceColor" && x.instanceColor && (ot = x.instanceColor)), ot !== void 0) {
            const ft = ot.normalized, Mt = ot.itemSize, Ht = t.get(ot);
            if (Ht === void 0) continue;
            const ie = Ht.buffer, Z = Ht.type, rt = Ht.bytesPerElement, xt = Z === i.INT || Z === i.UNSIGNED_INT || ot.gpuType === lo;
            if (ot.isInterleavedBufferAttribute) {
              const lt = ot.data, Pt = lt.stride, Dt = ot.offset;
              if (lt.isInstancedInterleavedBuffer) {
                for (let Gt = 0; Gt < q.locationSize; Gt++) d(q.location + Gt, lt.meshPerAttribute);
                x.isInstancedMesh !== true && V._maxInstanceCount === void 0 && (V._maxInstanceCount = lt.meshPerAttribute * lt.count);
              } else for (let Gt = 0; Gt < q.locationSize; Gt++) m(q.location + Gt);
              i.bindBuffer(i.ARRAY_BUFFER, ie);
              for (let Gt = 0; Gt < q.locationSize; Gt++) E(q.location + Gt, Mt / q.locationSize, Z, ft, Pt * rt, (Dt + Mt / q.locationSize * Gt) * rt, xt);
            } else {
              if (ot.isInstancedBufferAttribute) {
                for (let lt = 0; lt < q.locationSize; lt++) d(q.location + lt, ot.meshPerAttribute);
                x.isInstancedMesh !== true && V._maxInstanceCount === void 0 && (V._maxInstanceCount = ot.meshPerAttribute * ot.count);
              } else for (let lt = 0; lt < q.locationSize; lt++) m(q.location + lt);
              i.bindBuffer(i.ARRAY_BUFFER, ie);
              for (let lt = 0; lt < q.locationSize; lt++) E(q.location + lt, Mt / q.locationSize, Z, ft, Mt * rt, Mt / q.locationSize * lt * rt, xt);
            }
          } else if (j !== void 0) {
            const ft = j[et];
            if (ft !== void 0) switch (ft.length) {
              case 2:
                i.vertexAttrib2fv(q.location, ft);
                break;
              case 3:
                i.vertexAttrib3fv(q.location, ft);
                break;
              case 4:
                i.vertexAttrib4fv(q.location, ft);
                break;
              default:
                i.vertexAttrib1fv(q.location, ft);
            }
          }
        }
      }
      T();
    }
    function H() {
      N();
      for (const x in n) {
        const C = n[x];
        for (const W in C) {
          const V = C[W];
          for (const Y in V) u(V[Y].object), delete V[Y];
          delete C[W];
        }
        delete n[x];
      }
    }
    function P(x) {
      if (n[x.id] === void 0) return;
      const C = n[x.id];
      for (const W in C) {
        const V = C[W];
        for (const Y in V) u(V[Y].object), delete V[Y];
        delete C[W];
      }
      delete n[x.id];
    }
    function A(x) {
      for (const C in n) {
        const W = n[C];
        if (W[x.id] === void 0) continue;
        const V = W[x.id];
        for (const Y in V) u(V[Y].object), delete V[Y];
        delete W[x.id];
      }
    }
    function N() {
      S(), a = true, s !== r && (s = r, c(s.object));
    }
    function S() {
      r.geometry = null, r.program = null, r.wireframe = false;
    }
    return { setup: o, reset: N, resetDefaultState: S, dispose: H, releaseStatesOfGeometry: P, releaseStatesOfProgram: A, initAttributes: v, enableAttribute: m, disableUnusedAttributes: T };
  }
  function qp(i, t, e) {
    let n;
    function r(c) {
      n = c;
    }
    function s(c, u) {
      i.drawArrays(n, c, u), e.update(u, n, 1);
    }
    function a(c, u, f) {
      f !== 0 && (i.drawArraysInstanced(n, c, u, f), e.update(u, n, f));
    }
    function o(c, u, f) {
      if (f === 0) return;
      t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n, c, 0, u, 0, f);
      let _ = 0;
      for (let g = 0; g < f; g++) _ += u[g];
      e.update(_, n, 1);
    }
    function l(c, u, f, p) {
      if (f === 0) return;
      const _ = t.get("WEBGL_multi_draw");
      if (_ === null) for (let g = 0; g < c.length; g++) a(c[g], u[g], p[g]);
      else {
        _.multiDrawArraysInstancedWEBGL(n, c, 0, u, 0, p, 0, f);
        let g = 0;
        for (let v = 0; v < f; v++) g += u[v] * p[v];
        e.update(g, n, 1);
      }
    }
    this.setMode = r, this.render = s, this.renderInstances = a, this.renderMultiDraw = o, this.renderMultiDrawInstances = l;
  }
  function jp(i, t, e, n) {
    let r;
    function s() {
      if (r !== void 0) return r;
      if (t.has("EXT_texture_filter_anisotropic") === true) {
        const A = t.get("EXT_texture_filter_anisotropic");
        r = i.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      } else r = 0;
      return r;
    }
    function a(A) {
      return !(A !== an && n.convert(A) !== i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT));
    }
    function o(A) {
      const N = A === fr && (t.has("EXT_color_buffer_half_float") || t.has("EXT_color_buffer_float"));
      return !(A !== Cn && n.convert(A) !== i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE) && A !== Tn && !N);
    }
    function l(A) {
      if (A === "highp") {
        if (i.getShaderPrecisionFormat(i.VERTEX_SHADER, i.HIGH_FLOAT).precision > 0 && i.getShaderPrecisionFormat(i.FRAGMENT_SHADER, i.HIGH_FLOAT).precision > 0) return "highp";
        A = "mediump";
      }
      return A === "mediump" && i.getShaderPrecisionFormat(i.VERTEX_SHADER, i.MEDIUM_FLOAT).precision > 0 && i.getShaderPrecisionFormat(i.FRAGMENT_SHADER, i.MEDIUM_FLOAT).precision > 0 ? "mediump" : "lowp";
    }
    let c = e.precision !== void 0 ? e.precision : "highp";
    const u = l(c);
    u !== c && (console.warn("THREE.WebGLRenderer:", c, "not supported, using", u, "instead."), c = u);
    const f = e.logarithmicDepthBuffer === true, p = e.reverseDepthBuffer === true && t.has("EXT_clip_control"), _ = i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS), g = i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS), v = i.getParameter(i.MAX_TEXTURE_SIZE), m = i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE), d = i.getParameter(i.MAX_VERTEX_ATTRIBS), T = i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS), E = i.getParameter(i.MAX_VARYING_VECTORS), y = i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS), H = g > 0, P = i.getParameter(i.MAX_SAMPLES);
    return { isWebGL2: true, getMaxAnisotropy: s, getMaxPrecision: l, textureFormatReadable: a, textureTypeReadable: o, precision: c, logarithmicDepthBuffer: f, reverseDepthBuffer: p, maxTextures: _, maxVertexTextures: g, maxTextureSize: v, maxCubemapSize: m, maxAttributes: d, maxVertexUniforms: T, maxVaryings: E, maxFragmentUniforms: y, vertexTextures: H, maxSamples: P };
  }
  function Yp(i) {
    const t = this;
    let e = null, n = 0, r = false, s = false;
    const a = new ni(), o = new Nt(), l = { value: null, needsUpdate: false };
    this.uniform = l, this.numPlanes = 0, this.numIntersection = 0, this.init = function(f, p) {
      const _ = f.length !== 0 || p || n !== 0 || r;
      return r = p, n = f.length, _;
    }, this.beginShadows = function() {
      s = true, u(null);
    }, this.endShadows = function() {
      s = false;
    }, this.setGlobalState = function(f, p) {
      e = u(f, p, 0);
    }, this.setState = function(f, p, _) {
      const g = f.clippingPlanes, v = f.clipIntersection, m = f.clipShadows, d = i.get(f);
      if (!r || g === null || g.length === 0 || s && !m) s ? u(null) : c();
      else {
        const T = s ? 0 : n, E = T * 4;
        let y = d.clippingState || null;
        l.value = y, y = u(g, p, E, _);
        for (let H = 0; H !== E; ++H) y[H] = e[H];
        d.clippingState = y, this.numIntersection = v ? this.numPlanes : 0, this.numPlanes += T;
      }
    };
    function c() {
      l.value !== e && (l.value = e, l.needsUpdate = n > 0), t.numPlanes = n, t.numIntersection = 0;
    }
    function u(f, p, _, g) {
      const v = f !== null ? f.length : 0;
      let m = null;
      if (v !== 0) {
        if (m = l.value, g !== true || m === null) {
          const d = _ + v * 4, T = p.matrixWorldInverse;
          o.getNormalMatrix(T), (m === null || m.length < d) && (m = new Float32Array(d));
          for (let E = 0, y = _; E !== v; ++E, y += 4) a.copy(f[E]).applyMatrix4(T, o), a.normal.toArray(m, y), m[y + 3] = a.constant;
        }
        l.value = m, l.needsUpdate = true;
      }
      return t.numPlanes = v, t.numIntersection = 0, m;
    }
  }
  function Kp(i) {
    let t = /* @__PURE__ */ new WeakMap();
    function e(a, o) {
      return o === wa ? a.mapping = Oi : o === va && (a.mapping = zi), a;
    }
    function n(a) {
      if (a && a.isTexture) {
        const o = a.mapping;
        if (o === wa || o === va) if (t.has(a)) {
          const l = t.get(a).texture;
          return e(l, a.mapping);
        } else {
          const l = a.image;
          if (l && l.height > 0) {
            const c = new sd(l.height);
            return c.fromEquirectangularTexture(i, a), t.set(a, c), a.addEventListener("dispose", r), e(c.texture, a.mapping);
          } else return null;
        }
      }
      return a;
    }
    function r(a) {
      const o = a.target;
      o.removeEventListener("dispose", r);
      const l = t.get(o);
      l !== void 0 && (t.delete(o), l.dispose());
    }
    function s() {
      t = /* @__PURE__ */ new WeakMap();
    }
    return { get: n, dispose: s };
  }
  class th extends $c {
    constructor(t = -1, e = 1, n = 1, r = -1, s = 0.1, a = 2e3) {
      super(), this.isOrthographicCamera = true, this.type = "OrthographicCamera", this.zoom = 1, this.view = null, this.left = t, this.right = e, this.top = n, this.bottom = r, this.near = s, this.far = a, this.updateProjectionMatrix();
    }
    copy(t, e) {
      return super.copy(t, e), this.left = t.left, this.right = t.right, this.top = t.top, this.bottom = t.bottom, this.near = t.near, this.far = t.far, this.zoom = t.zoom, this.view = t.view === null ? null : Object.assign({}, t.view), this;
    }
    setViewOffset(t, e, n, r, s, a) {
      this.view === null && (this.view = { enabled: true, fullWidth: 1, fullHeight: 1, offsetX: 0, offsetY: 0, width: 1, height: 1 }), this.view.enabled = true, this.view.fullWidth = t, this.view.fullHeight = e, this.view.offsetX = n, this.view.offsetY = r, this.view.width = s, this.view.height = a, this.updateProjectionMatrix();
    }
    clearViewOffset() {
      this.view !== null && (this.view.enabled = false), this.updateProjectionMatrix();
    }
    updateProjectionMatrix() {
      const t = (this.right - this.left) / (2 * this.zoom), e = (this.top - this.bottom) / (2 * this.zoom), n = (this.right + this.left) / 2, r = (this.top + this.bottom) / 2;
      let s = n - t, a = n + t, o = r + e, l = r - e;
      if (this.view !== null && this.view.enabled) {
        const c = (this.right - this.left) / this.view.fullWidth / this.zoom, u = (this.top - this.bottom) / this.view.fullHeight / this.zoom;
        s += c * this.view.offsetX, a = s + c * this.view.width, o -= u * this.view.offsetY, l = o - u * this.view.height;
      }
      this.projectionMatrix.makeOrthographic(s, a, o, l, this.near, this.far, this.coordinateSystem), this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
    }
    toJSON(t) {
      const e = super.toJSON(t);
      return e.object.zoom = this.zoom, e.object.left = this.left, e.object.right = this.right, e.object.top = this.top, e.object.bottom = this.bottom, e.object.near = this.near, e.object.far = this.far, this.view !== null && (e.object.view = Object.assign({}, this.view)), e;
    }
  }
  const Pi = 4, yl = [0.125, 0.215, 0.35, 0.446, 0.526, 0.582], si = 20, ta = new th(), Ml = new Vt();
  let ea = null, na = 0, ia = 0, ra = false;
  const ii = (1 + Math.sqrt(5)) / 2, Ai = 1 / ii, El = [new z(-ii, Ai, 0), new z(ii, Ai, 0), new z(-Ai, 0, ii), new z(Ai, 0, ii), new z(0, ii, -Ai), new z(0, ii, Ai), new z(-1, 1, -1), new z(1, 1, -1), new z(-1, 1, 1), new z(1, 1, 1)];
  class Tl {
    constructor(t) {
      this._renderer = t, this._pingPongRenderTarget = null, this._lodMax = 0, this._cubeSize = 0, this._lodPlanes = [], this._sizeLods = [], this._sigmas = [], this._blurMaterial = null, this._cubemapMaterial = null, this._equirectMaterial = null, this._compileMaterial(this._blurMaterial);
    }
    fromScene(t, e = 0, n = 0.1, r = 100) {
      ea = this._renderer.getRenderTarget(), na = this._renderer.getActiveCubeFace(), ia = this._renderer.getActiveMipmapLevel(), ra = this._renderer.xr.enabled, this._renderer.xr.enabled = false, this._setSize(256);
      const s = this._allocateTargets();
      return s.depthBuffer = true, this._sceneToCubeUV(t, n, r, s), e > 0 && this._blur(s, 0, 0, e), this._applyPMREM(s), this._cleanup(s), s;
    }
    fromEquirectangular(t, e = null) {
      return this._fromTexture(t, e);
    }
    fromCubemap(t, e = null) {
      return this._fromTexture(t, e);
    }
    compileCubemapShader() {
      this._cubemapMaterial === null && (this._cubemapMaterial = Cl(), this._compileMaterial(this._cubemapMaterial));
    }
    compileEquirectangularShader() {
      this._equirectMaterial === null && (this._equirectMaterial = Al(), this._compileMaterial(this._equirectMaterial));
    }
    dispose() {
      this._dispose(), this._cubemapMaterial !== null && this._cubemapMaterial.dispose(), this._equirectMaterial !== null && this._equirectMaterial.dispose();
    }
    _setSize(t) {
      this._lodMax = Math.floor(Math.log2(t)), this._cubeSize = Math.pow(2, this._lodMax);
    }
    _dispose() {
      this._blurMaterial !== null && this._blurMaterial.dispose(), this._pingPongRenderTarget !== null && this._pingPongRenderTarget.dispose();
      for (let t = 0; t < this._lodPlanes.length; t++) this._lodPlanes[t].dispose();
    }
    _cleanup(t) {
      this._renderer.setRenderTarget(ea, na, ia), this._renderer.xr.enabled = ra, t.scissorTest = false, Gr(t, 0, 0, t.width, t.height);
    }
    _fromTexture(t, e) {
      t.mapping === Oi || t.mapping === zi ? this._setSize(t.image.length === 0 ? 16 : t.image[0].width || t.image[0].image.width) : this._setSize(t.image.width / 4), ea = this._renderer.getRenderTarget(), na = this._renderer.getActiveCubeFace(), ia = this._renderer.getActiveMipmapLevel(), ra = this._renderer.xr.enabled, this._renderer.xr.enabled = false;
      const n = e || this._allocateTargets();
      return this._textureToCubeUV(t, n), this._applyPMREM(n), this._cleanup(n), n;
    }
    _allocateTargets() {
      const t = 3 * Math.max(this._cubeSize, 112), e = 4 * this._cubeSize, n = { magFilter: dn, minFilter: dn, generateMipmaps: false, type: fr, format: an, colorSpace: Wi, depthBuffer: false }, r = Rl(t, e, n);
      if (this._pingPongRenderTarget === null || this._pingPongRenderTarget.width !== t || this._pingPongRenderTarget.height !== e) {
        this._pingPongRenderTarget !== null && this._dispose(), this._pingPongRenderTarget = Rl(t, e, n);
        const { _lodMax: s } = this;
        ({ sizeLods: this._sizeLods, lodPlanes: this._lodPlanes, sigmas: this._sigmas } = Zp(s)), this._blurMaterial = $p(s, t, e);
      }
      return r;
    }
    _compileMaterial(t) {
      const e = new Re(this._lodPlanes[0], t);
      this._renderer.compile(e, ta);
    }
    _sceneToCubeUV(t, e, n, r) {
      const o = new $e(90, 1, e, n), l = [1, -1, 1, 1, 1, 1], c = [1, 1, 1, -1, -1, -1], u = this._renderer, f = u.autoClear, p = u.toneMapping;
      u.getClearColor(Ml), u.toneMapping = Vn, u.autoClear = false;
      const _ = new ss({ name: "PMREM.Background", side: ze, depthWrite: false, depthTest: false }), g = new Re(new qe(), _);
      let v = false;
      const m = t.background;
      m ? m.isColor && (_.color.copy(m), t.background = null, v = true) : (_.color.copy(Ml), v = true);
      for (let d = 0; d < 6; d++) {
        const T = d % 3;
        T === 0 ? (o.up.set(0, l[d], 0), o.lookAt(c[d], 0, 0)) : T === 1 ? (o.up.set(0, 0, l[d]), o.lookAt(0, c[d], 0)) : (o.up.set(0, l[d], 0), o.lookAt(0, 0, c[d]));
        const E = this._cubeSize;
        Gr(r, T * E, d > 2 ? E : 0, E, E), u.setRenderTarget(r), v && u.render(g, o), u.render(t, o);
      }
      g.geometry.dispose(), g.material.dispose(), u.toneMapping = p, u.autoClear = f, t.background = m;
    }
    _textureToCubeUV(t, e) {
      const n = this._renderer, r = t.mapping === Oi || t.mapping === zi;
      r ? (this._cubemapMaterial === null && (this._cubemapMaterial = Cl()), this._cubemapMaterial.uniforms.flipEnvMap.value = t.isRenderTargetTexture === false ? -1 : 1) : this._equirectMaterial === null && (this._equirectMaterial = Al());
      const s = r ? this._cubemapMaterial : this._equirectMaterial, a = new Re(this._lodPlanes[0], s), o = s.uniforms;
      o.envMap.value = t;
      const l = this._cubeSize;
      Gr(e, 0, 0, 3 * l, 2 * l), n.setRenderTarget(e), n.render(a, ta);
    }
    _applyPMREM(t) {
      const e = this._renderer, n = e.autoClear;
      e.autoClear = false;
      const r = this._lodPlanes.length;
      for (let s = 1; s < r; s++) {
        const a = Math.sqrt(this._sigmas[s] * this._sigmas[s] - this._sigmas[s - 1] * this._sigmas[s - 1]), o = El[(r - s - 1) % El.length];
        this._blur(t, s - 1, s, a, o);
      }
      e.autoClear = n;
    }
    _blur(t, e, n, r, s) {
      const a = this._pingPongRenderTarget;
      this._halfBlur(t, a, e, n, r, "latitudinal", s), this._halfBlur(a, t, n, n, r, "longitudinal", s);
    }
    _halfBlur(t, e, n, r, s, a, o) {
      const l = this._renderer, c = this._blurMaterial;
      a !== "latitudinal" && a !== "longitudinal" && console.error("blur direction must be either latitudinal or longitudinal!");
      const u = 3, f = new Re(this._lodPlanes[r], c), p = c.uniforms, _ = this._sizeLods[n] - 1, g = isFinite(s) ? Math.PI / (2 * _) : 2 * Math.PI / (2 * si - 1), v = s / g, m = isFinite(s) ? 1 + Math.floor(u * v) : si;
      m > si && console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${si}`);
      const d = [];
      let T = 0;
      for (let A = 0; A < si; ++A) {
        const N = A / v, S = Math.exp(-N * N / 2);
        d.push(S), A === 0 ? T += S : A < m && (T += 2 * S);
      }
      for (let A = 0; A < d.length; A++) d[A] = d[A] / T;
      p.envMap.value = t.texture, p.samples.value = m, p.weights.value = d, p.latitudinal.value = a === "latitudinal", o && (p.poleAxis.value = o);
      const { _lodMax: E } = this;
      p.dTheta.value = g, p.mipInt.value = E - n;
      const y = this._sizeLods[r], H = 3 * y * (r > E - Pi ? r - E + Pi : 0), P = 4 * (this._cubeSize - y);
      Gr(e, H, P, 3 * y, 2 * y), l.setRenderTarget(e), l.render(f, ta);
    }
  }
  function Zp(i) {
    const t = [], e = [], n = [];
    let r = i;
    const s = i - Pi + 1 + yl.length;
    for (let a = 0; a < s; a++) {
      const o = Math.pow(2, r);
      e.push(o);
      let l = 1 / o;
      a > i - Pi ? l = yl[a - i + Pi - 1] : a === 0 && (l = 0), n.push(l);
      const c = 1 / (o - 2), u = -c, f = 1 + c, p = [u, u, f, u, f, f, u, u, f, f, u, f], _ = 6, g = 6, v = 3, m = 2, d = 1, T = new Float32Array(v * g * _), E = new Float32Array(m * g * _), y = new Float32Array(d * g * _);
      for (let P = 0; P < _; P++) {
        const A = P % 3 * 2 / 3 - 1, N = P > 2 ? 0 : -1, S = [A, N, 0, A + 2 / 3, N, 0, A + 2 / 3, N + 1, 0, A, N, 0, A + 2 / 3, N + 1, 0, A, N + 1, 0];
        T.set(S, v * g * P), E.set(p, m * g * P);
        const x = [P, P, P, P, P, P];
        y.set(x, d * g * P);
      }
      const H = new _n();
      H.setAttribute("position", new fn(T, v)), H.setAttribute("uv", new fn(E, m)), H.setAttribute("faceIndex", new fn(y, d)), t.push(H), r > Pi && r--;
    }
    return { lodPlanes: t, sizeLods: e, sigmas: n };
  }
  function Rl(i, t, e) {
    const n = new ui(i, t, e);
    return n.texture.mapping = ws, n.texture.name = "PMREM.cubeUv", n.scissorTest = true, n;
  }
  function Gr(i, t, e, n, r) {
    i.viewport.set(t, e, n, r), i.scissor.set(t, e, n, r);
  }
  function $p(i, t, e) {
    const n = new Float32Array(si), r = new z(0, 1, 0);
    return new Xn({ name: "SphericalGaussianBlur", defines: { n: si, CUBEUV_TEXEL_WIDTH: 1 / t, CUBEUV_TEXEL_HEIGHT: 1 / e, CUBEUV_MAX_MIP: `${i}.0` }, uniforms: { envMap: { value: null }, samples: { value: 1 }, weights: { value: n }, latitudinal: { value: false }, dTheta: { value: 0 }, mipInt: { value: 0 }, poleAxis: { value: r } }, vertexShader: mo(), fragmentShader: `

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`, blending: kn, depthTest: false, depthWrite: false });
  }
  function Al() {
    return new Xn({ name: "EquirectangularToCubeUV", uniforms: { envMap: { value: null } }, vertexShader: mo(), fragmentShader: `

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`, blending: kn, depthTest: false, depthWrite: false });
  }
  function Cl() {
    return new Xn({ name: "CubemapToCubeUV", uniforms: { envMap: { value: null }, flipEnvMap: { value: -1 } }, vertexShader: mo(), fragmentShader: `

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`, blending: kn, depthTest: false, depthWrite: false });
  }
  function mo() {
    return `

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`;
  }
  function Jp(i) {
    let t = /* @__PURE__ */ new WeakMap(), e = null;
    function n(o) {
      if (o && o.isTexture) {
        const l = o.mapping, c = l === wa || l === va, u = l === Oi || l === zi;
        if (c || u) {
          let f = t.get(o);
          const p = f !== void 0 ? f.texture.pmremVersion : 0;
          if (o.isRenderTargetTexture && o.pmremVersion !== p) return e === null && (e = new Tl(i)), f = c ? e.fromEquirectangular(o, f) : e.fromCubemap(o, f), f.texture.pmremVersion = o.pmremVersion, t.set(o, f), f.texture;
          if (f !== void 0) return f.texture;
          {
            const _ = o.image;
            return c && _ && _.height > 0 || u && _ && r(_) ? (e === null && (e = new Tl(i)), f = c ? e.fromEquirectangular(o) : e.fromCubemap(o), f.texture.pmremVersion = o.pmremVersion, t.set(o, f), o.addEventListener("dispose", s), f.texture) : null;
          }
        }
      }
      return o;
    }
    function r(o) {
      let l = 0;
      const c = 6;
      for (let u = 0; u < c; u++) o[u] !== void 0 && l++;
      return l === c;
    }
    function s(o) {
      const l = o.target;
      l.removeEventListener("dispose", s);
      const c = t.get(l);
      c !== void 0 && (t.delete(l), c.dispose());
    }
    function a() {
      t = /* @__PURE__ */ new WeakMap(), e !== null && (e.dispose(), e = null);
    }
    return { get: n, dispose: a };
  }
  function Qp(i) {
    const t = {};
    function e(n) {
      if (t[n] !== void 0) return t[n];
      let r;
      switch (n) {
        case "WEBGL_depth_texture":
          r = i.getExtension("WEBGL_depth_texture") || i.getExtension("MOZ_WEBGL_depth_texture") || i.getExtension("WEBKIT_WEBGL_depth_texture");
          break;
        case "EXT_texture_filter_anisotropic":
          r = i.getExtension("EXT_texture_filter_anisotropic") || i.getExtension("MOZ_EXT_texture_filter_anisotropic") || i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
          break;
        case "WEBGL_compressed_texture_s3tc":
          r = i.getExtension("WEBGL_compressed_texture_s3tc") || i.getExtension("MOZ_WEBGL_compressed_texture_s3tc") || i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");
          break;
        case "WEBGL_compressed_texture_pvrtc":
          r = i.getExtension("WEBGL_compressed_texture_pvrtc") || i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");
          break;
        default:
          r = i.getExtension(n);
      }
      return t[n] = r, r;
    }
    return { has: function(n) {
      return e(n) !== null;
    }, init: function() {
      e("EXT_color_buffer_float"), e("WEBGL_clip_cull_distance"), e("OES_texture_float_linear"), e("EXT_color_buffer_half_float"), e("WEBGL_multisampled_render_to_texture"), e("WEBGL_render_shared_exponent");
    }, get: function(n) {
      const r = e(n);
      return r === null && sr("THREE.WebGLRenderer: " + n + " extension not supported."), r;
    } };
  }
  function t_(i, t, e, n) {
    const r = {}, s = /* @__PURE__ */ new WeakMap();
    function a(f) {
      const p = f.target;
      p.index !== null && t.remove(p.index);
      for (const g in p.attributes) t.remove(p.attributes[g]);
      for (const g in p.morphAttributes) {
        const v = p.morphAttributes[g];
        for (let m = 0, d = v.length; m < d; m++) t.remove(v[m]);
      }
      p.removeEventListener("dispose", a), delete r[p.id];
      const _ = s.get(p);
      _ && (t.remove(_), s.delete(p)), n.releaseStatesOfGeometry(p), p.isInstancedBufferGeometry === true && delete p._maxInstanceCount, e.memory.geometries--;
    }
    function o(f, p) {
      return r[p.id] === true || (p.addEventListener("dispose", a), r[p.id] = true, e.memory.geometries++), p;
    }
    function l(f) {
      const p = f.attributes;
      for (const g in p) t.update(p[g], i.ARRAY_BUFFER);
      const _ = f.morphAttributes;
      for (const g in _) {
        const v = _[g];
        for (let m = 0, d = v.length; m < d; m++) t.update(v[m], i.ARRAY_BUFFER);
      }
    }
    function c(f) {
      const p = [], _ = f.index, g = f.attributes.position;
      let v = 0;
      if (_ !== null) {
        const T = _.array;
        v = _.version;
        for (let E = 0, y = T.length; E < y; E += 3) {
          const H = T[E + 0], P = T[E + 1], A = T[E + 2];
          p.push(H, P, P, A, A, H);
        }
      } else if (g !== void 0) {
        const T = g.array;
        v = g.version;
        for (let E = 0, y = T.length / 3 - 1; E < y; E += 3) {
          const H = E + 0, P = E + 1, A = E + 2;
          p.push(H, P, P, A, A, H);
        }
      } else return;
      const m = new (Gc(p) ? Kc : Yc)(p, 1);
      m.version = v;
      const d = s.get(f);
      d && t.remove(d), s.set(f, m);
    }
    function u(f) {
      const p = s.get(f);
      if (p) {
        const _ = f.index;
        _ !== null && p.version < _.version && c(f);
      } else c(f);
      return s.get(f);
    }
    return { get: o, update: l, getWireframeAttribute: u };
  }
  function e_(i, t, e) {
    let n;
    function r(p) {
      n = p;
    }
    let s, a;
    function o(p) {
      s = p.type, a = p.bytesPerElement;
    }
    function l(p, _) {
      i.drawElements(n, _, s, p * a), e.update(_, n, 1);
    }
    function c(p, _, g) {
      g !== 0 && (i.drawElementsInstanced(n, _, s, p * a, g), e.update(_, n, g));
    }
    function u(p, _, g) {
      if (g === 0) return;
      t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n, _, 0, s, p, 0, g);
      let m = 0;
      for (let d = 0; d < g; d++) m += _[d];
      e.update(m, n, 1);
    }
    function f(p, _, g, v) {
      if (g === 0) return;
      const m = t.get("WEBGL_multi_draw");
      if (m === null) for (let d = 0; d < p.length; d++) c(p[d] / a, _[d], v[d]);
      else {
        m.multiDrawElementsInstancedWEBGL(n, _, 0, s, p, 0, v, 0, g);
        let d = 0;
        for (let T = 0; T < g; T++) d += _[T] * v[T];
        e.update(d, n, 1);
      }
    }
    this.setMode = r, this.setIndex = o, this.render = l, this.renderInstances = c, this.renderMultiDraw = u, this.renderMultiDrawInstances = f;
  }
  function n_(i) {
    const t = { geometries: 0, textures: 0 }, e = { frame: 0, calls: 0, triangles: 0, points: 0, lines: 0 };
    function n(s, a, o) {
      switch (e.calls++, a) {
        case i.TRIANGLES:
          e.triangles += o * (s / 3);
          break;
        case i.LINES:
          e.lines += o * (s / 2);
          break;
        case i.LINE_STRIP:
          e.lines += o * (s - 1);
          break;
        case i.LINE_LOOP:
          e.lines += o * s;
          break;
        case i.POINTS:
          e.points += o * s;
          break;
        default:
          console.error("THREE.WebGLInfo: Unknown draw mode:", a);
          break;
      }
    }
    function r() {
      e.calls = 0, e.triangles = 0, e.points = 0, e.lines = 0;
    }
    return { memory: t, render: e, programs: null, autoReset: true, reset: r, update: n };
  }
  function i_(i, t, e) {
    const n = /* @__PURE__ */ new WeakMap(), r = new me();
    function s(a, o, l) {
      const c = a.morphTargetInfluences, u = o.morphAttributes.position || o.morphAttributes.normal || o.morphAttributes.color, f = u !== void 0 ? u.length : 0;
      let p = n.get(o);
      if (p === void 0 || p.count !== f) {
        let x = function() {
          N.dispose(), n.delete(o), o.removeEventListener("dispose", x);
        };
        var _ = x;
        p !== void 0 && p.texture.dispose();
        const g = o.morphAttributes.position !== void 0, v = o.morphAttributes.normal !== void 0, m = o.morphAttributes.color !== void 0, d = o.morphAttributes.position || [], T = o.morphAttributes.normal || [], E = o.morphAttributes.color || [];
        let y = 0;
        g === true && (y = 1), v === true && (y = 2), m === true && (y = 3);
        let H = o.attributes.position.count * y, P = 1;
        H > t.maxTextureSize && (P = Math.ceil(H / t.maxTextureSize), H = t.maxTextureSize);
        const A = new Float32Array(H * P * 4 * f), N = new Vc(A, H, P, f);
        N.type = Tn, N.needsUpdate = true;
        const S = y * 4;
        for (let C = 0; C < f; C++) {
          const W = d[C], V = T[C], Y = E[C], Q = H * P * 4 * C;
          for (let j = 0; j < W.count; j++) {
            const et = j * S;
            g === true && (r.fromBufferAttribute(W, j), A[Q + et + 0] = r.x, A[Q + et + 1] = r.y, A[Q + et + 2] = r.z, A[Q + et + 3] = 0), v === true && (r.fromBufferAttribute(V, j), A[Q + et + 4] = r.x, A[Q + et + 5] = r.y, A[Q + et + 6] = r.z, A[Q + et + 7] = 0), m === true && (r.fromBufferAttribute(Y, j), A[Q + et + 8] = r.x, A[Q + et + 9] = r.y, A[Q + et + 10] = r.z, A[Q + et + 11] = Y.itemSize === 4 ? r.w : 1);
          }
        }
        p = { count: f, texture: N, size: new Jt(H, P) }, n.set(o, p), o.addEventListener("dispose", x);
      }
      if (a.isInstancedMesh === true && a.morphTexture !== null) l.getUniforms().setValue(i, "morphTexture", a.morphTexture, e);
      else {
        let g = 0;
        for (let m = 0; m < c.length; m++) g += c[m];
        const v = o.morphTargetsRelative ? 1 : 1 - g;
        l.getUniforms().setValue(i, "morphTargetBaseInfluence", v), l.getUniforms().setValue(i, "morphTargetInfluences", c);
      }
      l.getUniforms().setValue(i, "morphTargetsTexture", p.texture, e), l.getUniforms().setValue(i, "morphTargetsTextureSize", p.size);
    }
    return { update: s };
  }
  function r_(i, t, e, n) {
    let r = /* @__PURE__ */ new WeakMap();
    function s(l) {
      const c = n.render.frame, u = l.geometry, f = t.get(l, u);
      if (r.get(f) !== c && (t.update(f), r.set(f, c)), l.isInstancedMesh && (l.hasEventListener("dispose", o) === false && l.addEventListener("dispose", o), r.get(l) !== c && (e.update(l.instanceMatrix, i.ARRAY_BUFFER), l.instanceColor !== null && e.update(l.instanceColor, i.ARRAY_BUFFER), r.set(l, c))), l.isSkinnedMesh) {
        const p = l.skeleton;
        r.get(p) !== c && (p.update(), r.set(p, c));
      }
      return f;
    }
    function a() {
      r = /* @__PURE__ */ new WeakMap();
    }
    function o(l) {
      const c = l.target;
      c.removeEventListener("dispose", o), e.remove(c.instanceMatrix), c.instanceColor !== null && e.remove(c.instanceColor);
    }
    return { update: s, dispose: a };
  }
  class eh extends Be {
    constructor(t, e, n, r, s, a, o, l, c, u = Di) {
      if (u !== Di && u !== Hi) throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");
      n === void 0 && u === Di && (n = hi), n === void 0 && u === Hi && (n = Bi), super(null, r, s, a, o, l, u, n, c), this.isDepthTexture = true, this.image = { width: t, height: e }, this.magFilter = o !== void 0 ? o : on, this.minFilter = l !== void 0 ? l : on, this.flipY = false, this.generateMipmaps = false, this.compareFunction = null;
    }
    copy(t) {
      return super.copy(t), this.compareFunction = t.compareFunction, this;
    }
    toJSON(t) {
      const e = super.toJSON(t);
      return this.compareFunction !== null && (e.compareFunction = this.compareFunction), e;
    }
  }
  const nh = new Be(), Pl = new eh(1, 1), ih = new Vc(), rh = new Vu(), sh = new Jc(), Il = [], Ll = [], Dl = new Float32Array(16), Ul = new Float32Array(9), Fl = new Float32Array(4);
  function Yi(i, t, e) {
    const n = i[0];
    if (n <= 0 || n > 0) return i;
    const r = t * e;
    let s = Il[r];
    if (s === void 0 && (s = new Float32Array(r), Il[r] = s), t !== 0) {
      n.toArray(s, 0);
      for (let a = 1, o = 0; a !== t; ++a) o += e, i[a].toArray(s, o);
    }
    return s;
  }
  function Se(i, t) {
    if (i.length !== t.length) return false;
    for (let e = 0, n = i.length; e < n; e++) if (i[e] !== t[e]) return false;
    return true;
  }
  function ye(i, t) {
    for (let e = 0, n = t.length; e < n; e++) i[e] = t[e];
  }
  function Ss(i, t) {
    let e = Ll[t];
    e === void 0 && (e = new Int32Array(t), Ll[t] = e);
    for (let n = 0; n !== t; ++n) e[n] = i.allocateTextureUnit();
    return e;
  }
  function s_(i, t) {
    const e = this.cache;
    e[0] !== t && (i.uniform1f(this.addr, t), e[0] = t);
  }
  function a_(i, t) {
    const e = this.cache;
    if (t.x !== void 0) (e[0] !== t.x || e[1] !== t.y) && (i.uniform2f(this.addr, t.x, t.y), e[0] = t.x, e[1] = t.y);
    else {
      if (Se(e, t)) return;
      i.uniform2fv(this.addr, t), ye(e, t);
    }
  }
  function o_(i, t) {
    const e = this.cache;
    if (t.x !== void 0) (e[0] !== t.x || e[1] !== t.y || e[2] !== t.z) && (i.uniform3f(this.addr, t.x, t.y, t.z), e[0] = t.x, e[1] = t.y, e[2] = t.z);
    else if (t.r !== void 0) (e[0] !== t.r || e[1] !== t.g || e[2] !== t.b) && (i.uniform3f(this.addr, t.r, t.g, t.b), e[0] = t.r, e[1] = t.g, e[2] = t.b);
    else {
      if (Se(e, t)) return;
      i.uniform3fv(this.addr, t), ye(e, t);
    }
  }
  function l_(i, t) {
    const e = this.cache;
    if (t.x !== void 0) (e[0] !== t.x || e[1] !== t.y || e[2] !== t.z || e[3] !== t.w) && (i.uniform4f(this.addr, t.x, t.y, t.z, t.w), e[0] = t.x, e[1] = t.y, e[2] = t.z, e[3] = t.w);
    else {
      if (Se(e, t)) return;
      i.uniform4fv(this.addr, t), ye(e, t);
    }
  }
  function c_(i, t) {
    const e = this.cache, n = t.elements;
    if (n === void 0) {
      if (Se(e, t)) return;
      i.uniformMatrix2fv(this.addr, false, t), ye(e, t);
    } else {
      if (Se(e, n)) return;
      Fl.set(n), i.uniformMatrix2fv(this.addr, false, Fl), ye(e, n);
    }
  }
  function h_(i, t) {
    const e = this.cache, n = t.elements;
    if (n === void 0) {
      if (Se(e, t)) return;
      i.uniformMatrix3fv(this.addr, false, t), ye(e, t);
    } else {
      if (Se(e, n)) return;
      Ul.set(n), i.uniformMatrix3fv(this.addr, false, Ul), ye(e, n);
    }
  }
  function u_(i, t) {
    const e = this.cache, n = t.elements;
    if (n === void 0) {
      if (Se(e, t)) return;
      i.uniformMatrix4fv(this.addr, false, t), ye(e, t);
    } else {
      if (Se(e, n)) return;
      Dl.set(n), i.uniformMatrix4fv(this.addr, false, Dl), ye(e, n);
    }
  }
  function d_(i, t) {
    const e = this.cache;
    e[0] !== t && (i.uniform1i(this.addr, t), e[0] = t);
  }
  function f_(i, t) {
    const e = this.cache;
    if (t.x !== void 0) (e[0] !== t.x || e[1] !== t.y) && (i.uniform2i(this.addr, t.x, t.y), e[0] = t.x, e[1] = t.y);
    else {
      if (Se(e, t)) return;
      i.uniform2iv(this.addr, t), ye(e, t);
    }
  }
  function p_(i, t) {
    const e = this.cache;
    if (t.x !== void 0) (e[0] !== t.x || e[1] !== t.y || e[2] !== t.z) && (i.uniform3i(this.addr, t.x, t.y, t.z), e[0] = t.x, e[1] = t.y, e[2] = t.z);
    else {
      if (Se(e, t)) return;
      i.uniform3iv(this.addr, t), ye(e, t);
    }
  }
  function __(i, t) {
    const e = this.cache;
    if (t.x !== void 0) (e[0] !== t.x || e[1] !== t.y || e[2] !== t.z || e[3] !== t.w) && (i.uniform4i(this.addr, t.x, t.y, t.z, t.w), e[0] = t.x, e[1] = t.y, e[2] = t.z, e[3] = t.w);
    else {
      if (Se(e, t)) return;
      i.uniform4iv(this.addr, t), ye(e, t);
    }
  }
  function m_(i, t) {
    const e = this.cache;
    e[0] !== t && (i.uniform1ui(this.addr, t), e[0] = t);
  }
  function g_(i, t) {
    const e = this.cache;
    if (t.x !== void 0) (e[0] !== t.x || e[1] !== t.y) && (i.uniform2ui(this.addr, t.x, t.y), e[0] = t.x, e[1] = t.y);
    else {
      if (Se(e, t)) return;
      i.uniform2uiv(this.addr, t), ye(e, t);
    }
  }
  function w_(i, t) {
    const e = this.cache;
    if (t.x !== void 0) (e[0] !== t.x || e[1] !== t.y || e[2] !== t.z) && (i.uniform3ui(this.addr, t.x, t.y, t.z), e[0] = t.x, e[1] = t.y, e[2] = t.z);
    else {
      if (Se(e, t)) return;
      i.uniform3uiv(this.addr, t), ye(e, t);
    }
  }
  function v_(i, t) {
    const e = this.cache;
    if (t.x !== void 0) (e[0] !== t.x || e[1] !== t.y || e[2] !== t.z || e[3] !== t.w) && (i.uniform4ui(this.addr, t.x, t.y, t.z, t.w), e[0] = t.x, e[1] = t.y, e[2] = t.z, e[3] = t.w);
    else {
      if (Se(e, t)) return;
      i.uniform4uiv(this.addr, t), ye(e, t);
    }
  }
  function b_(i, t, e) {
    const n = this.cache, r = e.allocateTextureUnit();
    n[0] !== r && (i.uniform1i(this.addr, r), n[0] = r);
    let s;
    this.type === i.SAMPLER_2D_SHADOW ? (Pl.compareFunction = Hc, s = Pl) : s = nh, e.setTexture2D(t || s, r);
  }
  function x_(i, t, e) {
    const n = this.cache, r = e.allocateTextureUnit();
    n[0] !== r && (i.uniform1i(this.addr, r), n[0] = r), e.setTexture3D(t || rh, r);
  }
  function S_(i, t, e) {
    const n = this.cache, r = e.allocateTextureUnit();
    n[0] !== r && (i.uniform1i(this.addr, r), n[0] = r), e.setTextureCube(t || sh, r);
  }
  function y_(i, t, e) {
    const n = this.cache, r = e.allocateTextureUnit();
    n[0] !== r && (i.uniform1i(this.addr, r), n[0] = r), e.setTexture2DArray(t || ih, r);
  }
  function M_(i) {
    switch (i) {
      case 5126:
        return s_;
      case 35664:
        return a_;
      case 35665:
        return o_;
      case 35666:
        return l_;
      case 35674:
        return c_;
      case 35675:
        return h_;
      case 35676:
        return u_;
      case 5124:
      case 35670:
        return d_;
      case 35667:
      case 35671:
        return f_;
      case 35668:
      case 35672:
        return p_;
      case 35669:
      case 35673:
        return __;
      case 5125:
        return m_;
      case 36294:
        return g_;
      case 36295:
        return w_;
      case 36296:
        return v_;
      case 35678:
      case 36198:
      case 36298:
      case 36306:
      case 35682:
        return b_;
      case 35679:
      case 36299:
      case 36307:
        return x_;
      case 35680:
      case 36300:
      case 36308:
      case 36293:
        return S_;
      case 36289:
      case 36303:
      case 36311:
      case 36292:
        return y_;
    }
  }
  function E_(i, t) {
    i.uniform1fv(this.addr, t);
  }
  function T_(i, t) {
    const e = Yi(t, this.size, 2);
    i.uniform2fv(this.addr, e);
  }
  function R_(i, t) {
    const e = Yi(t, this.size, 3);
    i.uniform3fv(this.addr, e);
  }
  function A_(i, t) {
    const e = Yi(t, this.size, 4);
    i.uniform4fv(this.addr, e);
  }
  function C_(i, t) {
    const e = Yi(t, this.size, 4);
    i.uniformMatrix2fv(this.addr, false, e);
  }
  function P_(i, t) {
    const e = Yi(t, this.size, 9);
    i.uniformMatrix3fv(this.addr, false, e);
  }
  function I_(i, t) {
    const e = Yi(t, this.size, 16);
    i.uniformMatrix4fv(this.addr, false, e);
  }
  function L_(i, t) {
    i.uniform1iv(this.addr, t);
  }
  function D_(i, t) {
    i.uniform2iv(this.addr, t);
  }
  function U_(i, t) {
    i.uniform3iv(this.addr, t);
  }
  function F_(i, t) {
    i.uniform4iv(this.addr, t);
  }
  function N_(i, t) {
    i.uniform1uiv(this.addr, t);
  }
  function O_(i, t) {
    i.uniform2uiv(this.addr, t);
  }
  function z_(i, t) {
    i.uniform3uiv(this.addr, t);
  }
  function B_(i, t) {
    i.uniform4uiv(this.addr, t);
  }
  function H_(i, t, e) {
    const n = this.cache, r = t.length, s = Ss(e, r);
    Se(n, s) || (i.uniform1iv(this.addr, s), ye(n, s));
    for (let a = 0; a !== r; ++a) e.setTexture2D(t[a] || nh, s[a]);
  }
  function G_(i, t, e) {
    const n = this.cache, r = t.length, s = Ss(e, r);
    Se(n, s) || (i.uniform1iv(this.addr, s), ye(n, s));
    for (let a = 0; a !== r; ++a) e.setTexture3D(t[a] || rh, s[a]);
  }
  function k_(i, t, e) {
    const n = this.cache, r = t.length, s = Ss(e, r);
    Se(n, s) || (i.uniform1iv(this.addr, s), ye(n, s));
    for (let a = 0; a !== r; ++a) e.setTextureCube(t[a] || sh, s[a]);
  }
  function V_(i, t, e) {
    const n = this.cache, r = t.length, s = Ss(e, r);
    Se(n, s) || (i.uniform1iv(this.addr, s), ye(n, s));
    for (let a = 0; a !== r; ++a) e.setTexture2DArray(t[a] || ih, s[a]);
  }
  function W_(i) {
    switch (i) {
      case 5126:
        return E_;
      case 35664:
        return T_;
      case 35665:
        return R_;
      case 35666:
        return A_;
      case 35674:
        return C_;
      case 35675:
        return P_;
      case 35676:
        return I_;
      case 5124:
      case 35670:
        return L_;
      case 35667:
      case 35671:
        return D_;
      case 35668:
      case 35672:
        return U_;
      case 35669:
      case 35673:
        return F_;
      case 5125:
        return N_;
      case 36294:
        return O_;
      case 36295:
        return z_;
      case 36296:
        return B_;
      case 35678:
      case 36198:
      case 36298:
      case 36306:
      case 35682:
        return H_;
      case 35679:
      case 36299:
      case 36307:
        return G_;
      case 35680:
      case 36300:
      case 36308:
      case 36293:
        return k_;
      case 36289:
      case 36303:
      case 36311:
      case 36292:
        return V_;
    }
  }
  class X_ {
    constructor(t, e, n) {
      this.id = t, this.addr = n, this.cache = [], this.type = e.type, this.setValue = M_(e.type);
    }
  }
  class q_ {
    constructor(t, e, n) {
      this.id = t, this.addr = n, this.cache = [], this.type = e.type, this.size = e.size, this.setValue = W_(e.type);
    }
  }
  class j_ {
    constructor(t) {
      this.id = t, this.seq = [], this.map = {};
    }
    setValue(t, e, n) {
      const r = this.seq;
      for (let s = 0, a = r.length; s !== a; ++s) {
        const o = r[s];
        o.setValue(t, e[o.id], n);
      }
    }
  }
  const sa = /(\w+)(\])?(\[|\.)?/g;
  function Nl(i, t) {
    i.seq.push(t), i.map[t.id] = t;
  }
  function Y_(i, t, e) {
    const n = i.name, r = n.length;
    for (sa.lastIndex = 0; ; ) {
      const s = sa.exec(n), a = sa.lastIndex;
      let o = s[1];
      const l = s[2] === "]", c = s[3];
      if (l && (o = o | 0), c === void 0 || c === "[" && a + 2 === r) {
        Nl(e, c === void 0 ? new X_(o, i, t) : new q_(o, i, t));
        break;
      } else {
        let f = e.map[o];
        f === void 0 && (f = new j_(o), Nl(e, f)), e = f;
      }
    }
  }
  class ns {
    constructor(t, e) {
      this.seq = [], this.map = {};
      const n = t.getProgramParameter(e, t.ACTIVE_UNIFORMS);
      for (let r = 0; r < n; ++r) {
        const s = t.getActiveUniform(e, r), a = t.getUniformLocation(e, s.name);
        Y_(s, a, this);
      }
    }
    setValue(t, e, n, r) {
      const s = this.map[e];
      s !== void 0 && s.setValue(t, n, r);
    }
    setOptional(t, e, n) {
      const r = e[n];
      r !== void 0 && this.setValue(t, n, r);
    }
    static upload(t, e, n, r) {
      for (let s = 0, a = e.length; s !== a; ++s) {
        const o = e[s], l = n[o.id];
        l.needsUpdate !== false && o.setValue(t, l.value, r);
      }
    }
    static seqWithValue(t, e) {
      const n = [];
      for (let r = 0, s = t.length; r !== s; ++r) {
        const a = t[r];
        a.id in e && n.push(a);
      }
      return n;
    }
  }
  function Ol(i, t, e) {
    const n = i.createShader(t);
    return i.shaderSource(n, e), i.compileShader(n), n;
  }
  const K_ = 37297;
  let Z_ = 0;
  function $_(i, t) {
    const e = i.split(`
`), n = [], r = Math.max(t - 6, 0), s = Math.min(t + 6, e.length);
    for (let a = r; a < s; a++) {
      const o = a + 1;
      n.push(`${o === t ? ">" : " "} ${o}: ${e[a]}`);
    }
    return n.join(`
`);
  }
  const zl = new Nt();
  function J_(i) {
    Zt._getMatrix(zl, Zt.workingColorSpace, i);
    const t = `mat3( ${zl.elements.map((e) => e.toFixed(4))} )`;
    switch (Zt.getTransfer(i)) {
      case vs:
        return [t, "LinearTransferOETF"];
      case ne:
        return [t, "sRGBTransferOETF"];
      default:
        return console.warn("THREE.WebGLProgram: Unsupported color space: ", i), [t, "LinearTransferOETF"];
    }
  }
  function Bl(i, t, e) {
    const n = i.getShaderParameter(t, i.COMPILE_STATUS), r = i.getShaderInfoLog(t).trim();
    if (n && r === "") return "";
    const s = /ERROR: 0:(\d+)/.exec(r);
    if (s) {
      const a = parseInt(s[1]);
      return e.toUpperCase() + `

` + r + `

` + $_(i.getShaderSource(t), a);
    } else return r;
  }
  function Q_(i, t) {
    const e = J_(t);
    return [`vec4 ${i}( vec4 value ) {`, `	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`, "}"].join(`
`);
  }
  function tm(i, t) {
    let e;
    switch (t) {
      case mu:
        e = "Linear";
        break;
      case gu:
        e = "Reinhard";
        break;
      case wu:
        e = "Cineon";
        break;
      case vu:
        e = "ACESFilmic";
        break;
      case xu:
        e = "AgX";
        break;
      case Su:
        e = "Neutral";
        break;
      case bu:
        e = "Custom";
        break;
      default:
        console.warn("THREE.WebGLProgram: Unsupported toneMapping:", t), e = "Linear";
    }
    return "vec3 " + i + "( vec3 color ) { return " + e + "ToneMapping( color ); }";
  }
  const kr = new z();
  function em() {
    Zt.getLuminanceCoefficients(kr);
    const i = kr.x.toFixed(4), t = kr.y.toFixed(4), e = kr.z.toFixed(4);
    return ["float luminance( const in vec3 rgb ) {", `	const vec3 weights = vec3( ${i}, ${t}, ${e} );`, "	return dot( weights, rgb );", "}"].join(`
`);
  }
  function nm(i) {
    return [i.extensionClipCullDistance ? "#extension GL_ANGLE_clip_cull_distance : require" : "", i.extensionMultiDraw ? "#extension GL_ANGLE_multi_draw : require" : ""].filter(ar).join(`
`);
  }
  function im(i) {
    const t = [];
    for (const e in i) {
      const n = i[e];
      n !== false && t.push("#define " + e + " " + n);
    }
    return t.join(`
`);
  }
  function rm(i, t) {
    const e = {}, n = i.getProgramParameter(t, i.ACTIVE_ATTRIBUTES);
    for (let r = 0; r < n; r++) {
      const s = i.getActiveAttrib(t, r), a = s.name;
      let o = 1;
      s.type === i.FLOAT_MAT2 && (o = 2), s.type === i.FLOAT_MAT3 && (o = 3), s.type === i.FLOAT_MAT4 && (o = 4), e[a] = { type: s.type, location: i.getAttribLocation(t, a), locationSize: o };
    }
    return e;
  }
  function ar(i) {
    return i !== "";
  }
  function Hl(i, t) {
    const e = t.numSpotLightShadows + t.numSpotLightMaps - t.numSpotLightShadowsWithMaps;
    return i.replace(/NUM_DIR_LIGHTS/g, t.numDirLights).replace(/NUM_SPOT_LIGHTS/g, t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g, t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g, e).replace(/NUM_RECT_AREA_LIGHTS/g, t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g, t.numPointLights).replace(/NUM_HEMI_LIGHTS/g, t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g, t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g, t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g, t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g, t.numPointLightShadows);
  }
  function Gl(i, t) {
    return i.replace(/NUM_CLIPPING_PLANES/g, t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g, t.numClippingPlanes - t.numClipIntersection);
  }
  const sm = /^[ \t]*#include +<([\w\d./]+)>/gm;
  function Ka(i) {
    return i.replace(sm, om);
  }
  const am = /* @__PURE__ */ new Map();
  function om(i, t) {
    let e = zt[t];
    if (e === void 0) {
      const n = am.get(t);
      if (n !== void 0) e = zt[n], console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.', t, n);
      else throw new Error("Can not resolve #include <" + t + ">");
    }
    return Ka(e);
  }
  const lm = /#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;
  function kl(i) {
    return i.replace(lm, cm);
  }
  function cm(i, t, e, n) {
    let r = "";
    for (let s = parseInt(t); s < parseInt(e); s++) r += n.replace(/\[\s*i\s*\]/g, "[ " + s + " ]").replace(/UNROLLED_LOOP_INDEX/g, s);
    return r;
  }
  function Vl(i) {
    let t = `precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;
    return i.precision === "highp" ? t += `
#define HIGH_PRECISION` : i.precision === "mediump" ? t += `
#define MEDIUM_PRECISION` : i.precision === "lowp" && (t += `
#define LOW_PRECISION`), t;
  }
  function hm(i) {
    let t = "SHADOWMAP_TYPE_BASIC";
    return i.shadowMapType === Ec ? t = "SHADOWMAP_TYPE_PCF" : i.shadowMapType === Tc ? t = "SHADOWMAP_TYPE_PCF_SOFT" : i.shadowMapType === yn && (t = "SHADOWMAP_TYPE_VSM"), t;
  }
  function um(i) {
    let t = "ENVMAP_TYPE_CUBE";
    if (i.envMap) switch (i.envMapMode) {
      case Oi:
      case zi:
        t = "ENVMAP_TYPE_CUBE";
        break;
      case ws:
        t = "ENVMAP_TYPE_CUBE_UV";
        break;
    }
    return t;
  }
  function dm(i) {
    let t = "ENVMAP_MODE_REFLECTION";
    if (i.envMap) switch (i.envMapMode) {
      case zi:
        t = "ENVMAP_MODE_REFRACTION";
        break;
    }
    return t;
  }
  function fm(i) {
    let t = "ENVMAP_BLENDING_NONE";
    if (i.envMap) switch (i.combine) {
      case Rc:
        t = "ENVMAP_BLENDING_MULTIPLY";
        break;
      case pu:
        t = "ENVMAP_BLENDING_MIX";
        break;
      case _u:
        t = "ENVMAP_BLENDING_ADD";
        break;
    }
    return t;
  }
  function pm(i) {
    const t = i.envMapCubeUVHeight;
    if (t === null) return null;
    const e = Math.log2(t) - 2, n = 1 / t;
    return { texelWidth: 1 / (3 * Math.max(Math.pow(2, e), 7 * 16)), texelHeight: n, maxMip: e };
  }
  function _m(i, t, e, n) {
    const r = i.getContext(), s = e.defines;
    let a = e.vertexShader, o = e.fragmentShader;
    const l = hm(e), c = um(e), u = dm(e), f = fm(e), p = pm(e), _ = nm(e), g = im(s), v = r.createProgram();
    let m, d, T = e.glslVersion ? "#version " + e.glslVersion + `
` : "";
    e.isRawShaderMaterial ? (m = ["#define SHADER_TYPE " + e.shaderType, "#define SHADER_NAME " + e.shaderName, g].filter(ar).join(`
`), m.length > 0 && (m += `
`), d = ["#define SHADER_TYPE " + e.shaderType, "#define SHADER_NAME " + e.shaderName, g].filter(ar).join(`
`), d.length > 0 && (d += `
`)) : (m = [Vl(e), "#define SHADER_TYPE " + e.shaderType, "#define SHADER_NAME " + e.shaderName, g, e.extensionClipCullDistance ? "#define USE_CLIP_DISTANCE" : "", e.batching ? "#define USE_BATCHING" : "", e.batchingColor ? "#define USE_BATCHING_COLOR" : "", e.instancing ? "#define USE_INSTANCING" : "", e.instancingColor ? "#define USE_INSTANCING_COLOR" : "", e.instancingMorph ? "#define USE_INSTANCING_MORPH" : "", e.useFog && e.fog ? "#define USE_FOG" : "", e.useFog && e.fogExp2 ? "#define FOG_EXP2" : "", e.map ? "#define USE_MAP" : "", e.envMap ? "#define USE_ENVMAP" : "", e.envMap ? "#define " + u : "", e.lightMap ? "#define USE_LIGHTMAP" : "", e.aoMap ? "#define USE_AOMAP" : "", e.bumpMap ? "#define USE_BUMPMAP" : "", e.normalMap ? "#define USE_NORMALMAP" : "", e.normalMapObjectSpace ? "#define USE_NORMALMAP_OBJECTSPACE" : "", e.normalMapTangentSpace ? "#define USE_NORMALMAP_TANGENTSPACE" : "", e.displacementMap ? "#define USE_DISPLACEMENTMAP" : "", e.emissiveMap ? "#define USE_EMISSIVEMAP" : "", e.anisotropy ? "#define USE_ANISOTROPY" : "", e.anisotropyMap ? "#define USE_ANISOTROPYMAP" : "", e.clearcoatMap ? "#define USE_CLEARCOATMAP" : "", e.clearcoatRoughnessMap ? "#define USE_CLEARCOAT_ROUGHNESSMAP" : "", e.clearcoatNormalMap ? "#define USE_CLEARCOAT_NORMALMAP" : "", e.iridescenceMap ? "#define USE_IRIDESCENCEMAP" : "", e.iridescenceThicknessMap ? "#define USE_IRIDESCENCE_THICKNESSMAP" : "", e.specularMap ? "#define USE_SPECULARMAP" : "", e.specularColorMap ? "#define USE_SPECULAR_COLORMAP" : "", e.specularIntensityMap ? "#define USE_SPECULAR_INTENSITYMAP" : "", e.roughnessMap ? "#define USE_ROUGHNESSMAP" : "", e.metalnessMap ? "#define USE_METALNESSMAP" : "", e.alphaMap ? "#define USE_ALPHAMAP" : "", e.alphaHash ? "#define USE_ALPHAHASH" : "", e.transmission ? "#define USE_TRANSMISSION" : "", e.transmissionMap ? "#define USE_TRANSMISSIONMAP" : "", e.thicknessMap ? "#define USE_THICKNESSMAP" : "", e.sheenColorMap ? "#define USE_SHEEN_COLORMAP" : "", e.sheenRoughnessMap ? "#define USE_SHEEN_ROUGHNESSMAP" : "", e.mapUv ? "#define MAP_UV " + e.mapUv : "", e.alphaMapUv ? "#define ALPHAMAP_UV " + e.alphaMapUv : "", e.lightMapUv ? "#define LIGHTMAP_UV " + e.lightMapUv : "", e.aoMapUv ? "#define AOMAP_UV " + e.aoMapUv : "", e.emissiveMapUv ? "#define EMISSIVEMAP_UV " + e.emissiveMapUv : "", e.bumpMapUv ? "#define BUMPMAP_UV " + e.bumpMapUv : "", e.normalMapUv ? "#define NORMALMAP_UV " + e.normalMapUv : "", e.displacementMapUv ? "#define DISPLACEMENTMAP_UV " + e.displacementMapUv : "", e.metalnessMapUv ? "#define METALNESSMAP_UV " + e.metalnessMapUv : "", e.roughnessMapUv ? "#define ROUGHNESSMAP_UV " + e.roughnessMapUv : "", e.anisotropyMapUv ? "#define ANISOTROPYMAP_UV " + e.anisotropyMapUv : "", e.clearcoatMapUv ? "#define CLEARCOATMAP_UV " + e.clearcoatMapUv : "", e.clearcoatNormalMapUv ? "#define CLEARCOAT_NORMALMAP_UV " + e.clearcoatNormalMapUv : "", e.clearcoatRoughnessMapUv ? "#define CLEARCOAT_ROUGHNESSMAP_UV " + e.clearcoatRoughnessMapUv : "", e.iridescenceMapUv ? "#define IRIDESCENCEMAP_UV " + e.iridescenceMapUv : "", e.iridescenceThicknessMapUv ? "#define IRIDESCENCE_THICKNESSMAP_UV " + e.iridescenceThicknessMapUv : "", e.sheenColorMapUv ? "#define SHEEN_COLORMAP_UV " + e.sheenColorMapUv : "", e.sheenRoughnessMapUv ? "#define SHEEN_ROUGHNESSMAP_UV " + e.sheenRoughnessMapUv : "", e.specularMapUv ? "#define SPECULARMAP_UV " + e.specularMapUv : "", e.specularColorMapUv ? "#define SPECULAR_COLORMAP_UV " + e.specularColorMapUv : "", e.specularIntensityMapUv ? "#define SPECULAR_INTENSITYMAP_UV " + e.specularIntensityMapUv : "", e.transmissionMapUv ? "#define TRANSMISSIONMAP_UV " + e.transmissionMapUv : "", e.thicknessMapUv ? "#define THICKNESSMAP_UV " + e.thicknessMapUv : "", e.vertexTangents && e.flatShading === false ? "#define USE_TANGENT" : "", e.vertexColors ? "#define USE_COLOR" : "", e.vertexAlphas ? "#define USE_COLOR_ALPHA" : "", e.vertexUv1s ? "#define USE_UV1" : "", e.vertexUv2s ? "#define USE_UV2" : "", e.vertexUv3s ? "#define USE_UV3" : "", e.pointsUvs ? "#define USE_POINTS_UV" : "", e.flatShading ? "#define FLAT_SHADED" : "", e.skinning ? "#define USE_SKINNING" : "", e.morphTargets ? "#define USE_MORPHTARGETS" : "", e.morphNormals && e.flatShading === false ? "#define USE_MORPHNORMALS" : "", e.morphColors ? "#define USE_MORPHCOLORS" : "", e.morphTargetsCount > 0 ? "#define MORPHTARGETS_TEXTURE_STRIDE " + e.morphTextureStride : "", e.morphTargetsCount > 0 ? "#define MORPHTARGETS_COUNT " + e.morphTargetsCount : "", e.doubleSided ? "#define DOUBLE_SIDED" : "", e.flipSided ? "#define FLIP_SIDED" : "", e.shadowMapEnabled ? "#define USE_SHADOWMAP" : "", e.shadowMapEnabled ? "#define " + l : "", e.sizeAttenuation ? "#define USE_SIZEATTENUATION" : "", e.numLightProbes > 0 ? "#define USE_LIGHT_PROBES" : "", e.logarithmicDepthBuffer ? "#define USE_LOGDEPTHBUF" : "", e.reverseDepthBuffer ? "#define USE_REVERSEDEPTHBUF" : "", "uniform mat4 modelMatrix;", "uniform mat4 modelViewMatrix;", "uniform mat4 projectionMatrix;", "uniform mat4 viewMatrix;", "uniform mat3 normalMatrix;", "uniform vec3 cameraPosition;", "uniform bool isOrthographic;", "#ifdef USE_INSTANCING", "	attribute mat4 instanceMatrix;", "#endif", "#ifdef USE_INSTANCING_COLOR", "	attribute vec3 instanceColor;", "#endif", "#ifdef USE_INSTANCING_MORPH", "	uniform sampler2D morphTexture;", "#endif", "attribute vec3 position;", "attribute vec3 normal;", "attribute vec2 uv;", "#ifdef USE_UV1", "	attribute vec2 uv1;", "#endif", "#ifdef USE_UV2", "	attribute vec2 uv2;", "#endif", "#ifdef USE_UV3", "	attribute vec2 uv3;", "#endif", "#ifdef USE_TANGENT", "	attribute vec4 tangent;", "#endif", "#if defined( USE_COLOR_ALPHA )", "	attribute vec4 color;", "#elif defined( USE_COLOR )", "	attribute vec3 color;", "#endif", "#ifdef USE_SKINNING", "	attribute vec4 skinIndex;", "	attribute vec4 skinWeight;", "#endif", `
`].filter(ar).join(`
`), d = [Vl(e), "#define SHADER_TYPE " + e.shaderType, "#define SHADER_NAME " + e.shaderName, g, e.useFog && e.fog ? "#define USE_FOG" : "", e.useFog && e.fogExp2 ? "#define FOG_EXP2" : "", e.alphaToCoverage ? "#define ALPHA_TO_COVERAGE" : "", e.map ? "#define USE_MAP" : "", e.matcap ? "#define USE_MATCAP" : "", e.envMap ? "#define USE_ENVMAP" : "", e.envMap ? "#define " + c : "", e.envMap ? "#define " + u : "", e.envMap ? "#define " + f : "", p ? "#define CUBEUV_TEXEL_WIDTH " + p.texelWidth : "", p ? "#define CUBEUV_TEXEL_HEIGHT " + p.texelHeight : "", p ? "#define CUBEUV_MAX_MIP " + p.maxMip + ".0" : "", e.lightMap ? "#define USE_LIGHTMAP" : "", e.aoMap ? "#define USE_AOMAP" : "", e.bumpMap ? "#define USE_BUMPMAP" : "", e.normalMap ? "#define USE_NORMALMAP" : "", e.normalMapObjectSpace ? "#define USE_NORMALMAP_OBJECTSPACE" : "", e.normalMapTangentSpace ? "#define USE_NORMALMAP_TANGENTSPACE" : "", e.emissiveMap ? "#define USE_EMISSIVEMAP" : "", e.anisotropy ? "#define USE_ANISOTROPY" : "", e.anisotropyMap ? "#define USE_ANISOTROPYMAP" : "", e.clearcoat ? "#define USE_CLEARCOAT" : "", e.clearcoatMap ? "#define USE_CLEARCOATMAP" : "", e.clearcoatRoughnessMap ? "#define USE_CLEARCOAT_ROUGHNESSMAP" : "", e.clearcoatNormalMap ? "#define USE_CLEARCOAT_NORMALMAP" : "", e.dispersion ? "#define USE_DISPERSION" : "", e.iridescence ? "#define USE_IRIDESCENCE" : "", e.iridescenceMap ? "#define USE_IRIDESCENCEMAP" : "", e.iridescenceThicknessMap ? "#define USE_IRIDESCENCE_THICKNESSMAP" : "", e.specularMap ? "#define USE_SPECULARMAP" : "", e.specularColorMap ? "#define USE_SPECULAR_COLORMAP" : "", e.specularIntensityMap ? "#define USE_SPECULAR_INTENSITYMAP" : "", e.roughnessMap ? "#define USE_ROUGHNESSMAP" : "", e.metalnessMap ? "#define USE_METALNESSMAP" : "", e.alphaMap ? "#define USE_ALPHAMAP" : "", e.alphaTest ? "#define USE_ALPHATEST" : "", e.alphaHash ? "#define USE_ALPHAHASH" : "", e.sheen ? "#define USE_SHEEN" : "", e.sheenColorMap ? "#define USE_SHEEN_COLORMAP" : "", e.sheenRoughnessMap ? "#define USE_SHEEN_ROUGHNESSMAP" : "", e.transmission ? "#define USE_TRANSMISSION" : "", e.transmissionMap ? "#define USE_TRANSMISSIONMAP" : "", e.thicknessMap ? "#define USE_THICKNESSMAP" : "", e.vertexTangents && e.flatShading === false ? "#define USE_TANGENT" : "", e.vertexColors || e.instancingColor || e.batchingColor ? "#define USE_COLOR" : "", e.vertexAlphas ? "#define USE_COLOR_ALPHA" : "", e.vertexUv1s ? "#define USE_UV1" : "", e.vertexUv2s ? "#define USE_UV2" : "", e.vertexUv3s ? "#define USE_UV3" : "", e.pointsUvs ? "#define USE_POINTS_UV" : "", e.gradientMap ? "#define USE_GRADIENTMAP" : "", e.flatShading ? "#define FLAT_SHADED" : "", e.doubleSided ? "#define DOUBLE_SIDED" : "", e.flipSided ? "#define FLIP_SIDED" : "", e.shadowMapEnabled ? "#define USE_SHADOWMAP" : "", e.shadowMapEnabled ? "#define " + l : "", e.premultipliedAlpha ? "#define PREMULTIPLIED_ALPHA" : "", e.numLightProbes > 0 ? "#define USE_LIGHT_PROBES" : "", e.decodeVideoTexture ? "#define DECODE_VIDEO_TEXTURE" : "", e.decodeVideoTextureEmissive ? "#define DECODE_VIDEO_TEXTURE_EMISSIVE" : "", e.logarithmicDepthBuffer ? "#define USE_LOGDEPTHBUF" : "", e.reverseDepthBuffer ? "#define USE_REVERSEDEPTHBUF" : "", "uniform mat4 viewMatrix;", "uniform vec3 cameraPosition;", "uniform bool isOrthographic;", e.toneMapping !== Vn ? "#define TONE_MAPPING" : "", e.toneMapping !== Vn ? zt.tonemapping_pars_fragment : "", e.toneMapping !== Vn ? tm("toneMapping", e.toneMapping) : "", e.dithering ? "#define DITHERING" : "", e.opaque ? "#define OPAQUE" : "", zt.colorspace_pars_fragment, Q_("linearToOutputTexel", e.outputColorSpace), em(), e.useDepthPacking ? "#define DEPTH_PACKING " + e.depthPacking : "", `
`].filter(ar).join(`
`)), a = Ka(a), a = Hl(a, e), a = Gl(a, e), o = Ka(o), o = Hl(o, e), o = Gl(o, e), a = kl(a), o = kl(o), e.isRawShaderMaterial !== true && (T = `#version 300 es
`, m = [_, "#define attribute in", "#define varying out", "#define texture2D texture"].join(`
`) + `
` + m, d = ["#define varying in", e.glslVersion === nl ? "" : "layout(location = 0) out highp vec4 pc_fragColor;", e.glslVersion === nl ? "" : "#define gl_FragColor pc_fragColor", "#define gl_FragDepthEXT gl_FragDepth", "#define texture2D texture", "#define textureCube texture", "#define texture2DProj textureProj", "#define texture2DLodEXT textureLod", "#define texture2DProjLodEXT textureProjLod", "#define textureCubeLodEXT textureLod", "#define texture2DGradEXT textureGrad", "#define texture2DProjGradEXT textureProjGrad", "#define textureCubeGradEXT textureGrad"].join(`
`) + `
` + d);
    const E = T + m + a, y = T + d + o, H = Ol(r, r.VERTEX_SHADER, E), P = Ol(r, r.FRAGMENT_SHADER, y);
    r.attachShader(v, H), r.attachShader(v, P), e.index0AttributeName !== void 0 ? r.bindAttribLocation(v, 0, e.index0AttributeName) : e.morphTargets === true && r.bindAttribLocation(v, 0, "position"), r.linkProgram(v);
    function A(C) {
      if (i.debug.checkShaderErrors) {
        const W = r.getProgramInfoLog(v).trim(), V = r.getShaderInfoLog(H).trim(), Y = r.getShaderInfoLog(P).trim();
        let Q = true, j = true;
        if (r.getProgramParameter(v, r.LINK_STATUS) === false) if (Q = false, typeof i.debug.onShaderError == "function") i.debug.onShaderError(r, v, H, P);
        else {
          const et = Bl(r, H, "vertex"), q = Bl(r, P, "fragment");
          console.error("THREE.WebGLProgram: Shader Error " + r.getError() + " - VALIDATE_STATUS " + r.getProgramParameter(v, r.VALIDATE_STATUS) + `

Material Name: ` + C.name + `
Material Type: ` + C.type + `

Program Info Log: ` + W + `
` + et + `
` + q);
        }
        else W !== "" ? console.warn("THREE.WebGLProgram: Program Info Log:", W) : (V === "" || Y === "") && (j = false);
        j && (C.diagnostics = { runnable: Q, programLog: W, vertexShader: { log: V, prefix: m }, fragmentShader: { log: Y, prefix: d } });
      }
      r.deleteShader(H), r.deleteShader(P), N = new ns(r, v), S = rm(r, v);
    }
    let N;
    this.getUniforms = function() {
      return N === void 0 && A(this), N;
    };
    let S;
    this.getAttributes = function() {
      return S === void 0 && A(this), S;
    };
    let x = e.rendererExtensionParallelShaderCompile === false;
    return this.isReady = function() {
      return x === false && (x = r.getProgramParameter(v, K_)), x;
    }, this.destroy = function() {
      n.releaseStatesOfProgram(this), r.deleteProgram(v), this.program = void 0;
    }, this.type = e.shaderType, this.name = e.shaderName, this.id = Z_++, this.cacheKey = t, this.usedTimes = 1, this.program = v, this.vertexShader = H, this.fragmentShader = P, this;
  }
  let mm = 0;
  class gm {
    constructor() {
      this.shaderCache = /* @__PURE__ */ new Map(), this.materialCache = /* @__PURE__ */ new Map();
    }
    update(t) {
      const e = t.vertexShader, n = t.fragmentShader, r = this._getShaderStage(e), s = this._getShaderStage(n), a = this._getShaderCacheForMaterial(t);
      return a.has(r) === false && (a.add(r), r.usedTimes++), a.has(s) === false && (a.add(s), s.usedTimes++), this;
    }
    remove(t) {
      const e = this.materialCache.get(t);
      for (const n of e) n.usedTimes--, n.usedTimes === 0 && this.shaderCache.delete(n.code);
      return this.materialCache.delete(t), this;
    }
    getVertexShaderID(t) {
      return this._getShaderStage(t.vertexShader).id;
    }
    getFragmentShaderID(t) {
      return this._getShaderStage(t.fragmentShader).id;
    }
    dispose() {
      this.shaderCache.clear(), this.materialCache.clear();
    }
    _getShaderCacheForMaterial(t) {
      const e = this.materialCache;
      let n = e.get(t);
      return n === void 0 && (n = /* @__PURE__ */ new Set(), e.set(t, n)), n;
    }
    _getShaderStage(t) {
      const e = this.shaderCache;
      let n = e.get(t);
      return n === void 0 && (n = new wm(t), e.set(t, n)), n;
    }
  }
  class wm {
    constructor(t) {
      this.id = mm++, this.code = t, this.usedTimes = 0;
    }
  }
  function vm(i, t, e, n, r, s, a) {
    const o = new qc(), l = new gm(), c = /* @__PURE__ */ new Set(), u = [], f = r.logarithmicDepthBuffer, p = r.vertexTextures;
    let _ = r.precision;
    const g = { MeshDepthMaterial: "depth", MeshDistanceMaterial: "distanceRGBA", MeshNormalMaterial: "normal", MeshBasicMaterial: "basic", MeshLambertMaterial: "lambert", MeshPhongMaterial: "phong", MeshToonMaterial: "toon", MeshStandardMaterial: "physical", MeshPhysicalMaterial: "physical", MeshMatcapMaterial: "matcap", LineBasicMaterial: "basic", LineDashedMaterial: "dashed", PointsMaterial: "points", ShadowMaterial: "shadow", SpriteMaterial: "sprite" };
    function v(S) {
      return c.add(S), S === 0 ? "uv" : `uv${S}`;
    }
    function m(S, x, C, W, V) {
      const Y = W.fog, Q = V.geometry, j = S.isMeshStandardMaterial ? W.environment : null, et = (S.isMeshStandardMaterial ? e : t).get(S.envMap || j), q = et && et.mapping === ws ? et.image.height : null, ot = g[S.type];
      S.precision !== null && (_ = r.getMaxPrecision(S.precision), _ !== S.precision && console.warn("THREE.WebGLProgram.getParameters:", S.precision, "not supported, using", _, "instead."));
      const ft = Q.morphAttributes.position || Q.morphAttributes.normal || Q.morphAttributes.color, Mt = ft !== void 0 ? ft.length : 0;
      let Ht = 0;
      Q.morphAttributes.position !== void 0 && (Ht = 1), Q.morphAttributes.normal !== void 0 && (Ht = 2), Q.morphAttributes.color !== void 0 && (Ht = 3);
      let ie, Z, rt, xt;
      if (ot) {
        const ee = un[ot];
        ie = ee.vertexShader, Z = ee.fragmentShader;
      } else ie = S.vertexShader, Z = S.fragmentShader, l.update(S), rt = l.getVertexShaderID(S), xt = l.getFragmentShaderID(S);
      const lt = i.getRenderTarget(), Pt = i.state.buffers.depth.getReversed(), Dt = V.isInstancedMesh === true, Gt = V.isBatchedMesh === true, de = !!S.map, Yt = !!S.matcap, ge = !!et, O = !!S.aoMap, je = !!S.lightMap, Wt = !!S.bumpMap, Xt = !!S.normalMap, Rt = !!S.displacementMap, oe = !!S.emissiveMap, Tt = !!S.metalnessMap, M = !!S.roughnessMap, w = S.anisotropy > 0, B = S.clearcoat > 0, $ = S.dispersion > 0, tt = S.iridescence > 0, K = S.sheen > 0, St = S.transmission > 0, ct = w && !!S.anisotropyMap, pt = B && !!S.clearcoatMap, Kt = B && !!S.clearcoatNormalMap, nt = B && !!S.clearcoatRoughnessMap, _t = tt && !!S.iridescenceMap, Ct = tt && !!S.iridescenceThicknessMap, It = K && !!S.sheenColorMap, mt = K && !!S.sheenRoughnessMap, qt = !!S.specularMap, Ot = !!S.specularColorMap, se = !!S.specularIntensityMap, L = St && !!S.transmissionMap, at = St && !!S.thicknessMap, X = !!S.gradientMap, J = !!S.alphaMap, dt = S.alphaTest > 0, ht = !!S.alphaHash, Ut = !!S.extensions;
      let _e = Vn;
      S.toneMapped && (lt === null || lt.isXRRenderTarget === true) && (_e = i.toneMapping);
      const Ie = { shaderID: ot, shaderType: S.type, shaderName: S.name, vertexShader: ie, fragmentShader: Z, defines: S.defines, customVertexShaderID: rt, customFragmentShaderID: xt, isRawShaderMaterial: S.isRawShaderMaterial === true, glslVersion: S.glslVersion, precision: _, batching: Gt, batchingColor: Gt && V._colorsTexture !== null, instancing: Dt, instancingColor: Dt && V.instanceColor !== null, instancingMorph: Dt && V.morphTexture !== null, supportsVertexTextures: p, outputColorSpace: lt === null ? i.outputColorSpace : lt.isXRRenderTarget === true ? lt.texture.colorSpace : Wi, alphaToCoverage: !!S.alphaToCoverage, map: de, matcap: Yt, envMap: ge, envMapMode: ge && et.mapping, envMapCubeUVHeight: q, aoMap: O, lightMap: je, bumpMap: Wt, normalMap: Xt, displacementMap: p && Rt, emissiveMap: oe, normalMapObjectSpace: Xt && S.normalMapType === Tu, normalMapTangentSpace: Xt && S.normalMapType === Bc, metalnessMap: Tt, roughnessMap: M, anisotropy: w, anisotropyMap: ct, clearcoat: B, clearcoatMap: pt, clearcoatNormalMap: Kt, clearcoatRoughnessMap: nt, dispersion: $, iridescence: tt, iridescenceMap: _t, iridescenceThicknessMap: Ct, sheen: K, sheenColorMap: It, sheenRoughnessMap: mt, specularMap: qt, specularColorMap: Ot, specularIntensityMap: se, transmission: St, transmissionMap: L, thicknessMap: at, gradientMap: X, opaque: S.transparent === false && S.blending === Li && S.alphaToCoverage === false, alphaMap: J, alphaTest: dt, alphaHash: ht, combine: S.combine, mapUv: de && v(S.map.channel), aoMapUv: O && v(S.aoMap.channel), lightMapUv: je && v(S.lightMap.channel), bumpMapUv: Wt && v(S.bumpMap.channel), normalMapUv: Xt && v(S.normalMap.channel), displacementMapUv: Rt && v(S.displacementMap.channel), emissiveMapUv: oe && v(S.emissiveMap.channel), metalnessMapUv: Tt && v(S.metalnessMap.channel), roughnessMapUv: M && v(S.roughnessMap.channel), anisotropyMapUv: ct && v(S.anisotropyMap.channel), clearcoatMapUv: pt && v(S.clearcoatMap.channel), clearcoatNormalMapUv: Kt && v(S.clearcoatNormalMap.channel), clearcoatRoughnessMapUv: nt && v(S.clearcoatRoughnessMap.channel), iridescenceMapUv: _t && v(S.iridescenceMap.channel), iridescenceThicknessMapUv: Ct && v(S.iridescenceThicknessMap.channel), sheenColorMapUv: It && v(S.sheenColorMap.channel), sheenRoughnessMapUv: mt && v(S.sheenRoughnessMap.channel), specularMapUv: qt && v(S.specularMap.channel), specularColorMapUv: Ot && v(S.specularColorMap.channel), specularIntensityMapUv: se && v(S.specularIntensityMap.channel), transmissionMapUv: L && v(S.transmissionMap.channel), thicknessMapUv: at && v(S.thicknessMap.channel), alphaMapUv: J && v(S.alphaMap.channel), vertexTangents: !!Q.attributes.tangent && (Xt || w), vertexColors: S.vertexColors, vertexAlphas: S.vertexColors === true && !!Q.attributes.color && Q.attributes.color.itemSize === 4, pointsUvs: V.isPoints === true && !!Q.attributes.uv && (de || J), fog: !!Y, useFog: S.fog === true, fogExp2: !!Y && Y.isFogExp2, flatShading: S.flatShading === true, sizeAttenuation: S.sizeAttenuation === true, logarithmicDepthBuffer: f, reverseDepthBuffer: Pt, skinning: V.isSkinnedMesh === true, morphTargets: Q.morphAttributes.position !== void 0, morphNormals: Q.morphAttributes.normal !== void 0, morphColors: Q.morphAttributes.color !== void 0, morphTargetsCount: Mt, morphTextureStride: Ht, numDirLights: x.directional.length, numPointLights: x.point.length, numSpotLights: x.spot.length, numSpotLightMaps: x.spotLightMap.length, numRectAreaLights: x.rectArea.length, numHemiLights: x.hemi.length, numDirLightShadows: x.directionalShadowMap.length, numPointLightShadows: x.pointShadowMap.length, numSpotLightShadows: x.spotShadowMap.length, numSpotLightShadowsWithMaps: x.numSpotLightShadowsWithMaps, numLightProbes: x.numLightProbes, numClippingPlanes: a.numPlanes, numClipIntersection: a.numIntersection, dithering: S.dithering, shadowMapEnabled: i.shadowMap.enabled && C.length > 0, shadowMapType: i.shadowMap.type, toneMapping: _e, decodeVideoTexture: de && S.map.isVideoTexture === true && Zt.getTransfer(S.map.colorSpace) === ne, decodeVideoTextureEmissive: oe && S.emissiveMap.isVideoTexture === true && Zt.getTransfer(S.emissiveMap.colorSpace) === ne, premultipliedAlpha: S.premultipliedAlpha, doubleSided: S.side === En, flipSided: S.side === ze, useDepthPacking: S.depthPacking >= 0, depthPacking: S.depthPacking || 0, index0AttributeName: S.index0AttributeName, extensionClipCullDistance: Ut && S.extensions.clipCullDistance === true && n.has("WEBGL_clip_cull_distance"), extensionMultiDraw: (Ut && S.extensions.multiDraw === true || Gt) && n.has("WEBGL_multi_draw"), rendererExtensionParallelShaderCompile: n.has("KHR_parallel_shader_compile"), customProgramCacheKey: S.customProgramCacheKey() };
      return Ie.vertexUv1s = c.has(1), Ie.vertexUv2s = c.has(2), Ie.vertexUv3s = c.has(3), c.clear(), Ie;
    }
    function d(S) {
      const x = [];
      if (S.shaderID ? x.push(S.shaderID) : (x.push(S.customVertexShaderID), x.push(S.customFragmentShaderID)), S.defines !== void 0) for (const C in S.defines) x.push(C), x.push(S.defines[C]);
      return S.isRawShaderMaterial === false && (T(x, S), E(x, S), x.push(i.outputColorSpace)), x.push(S.customProgramCacheKey), x.join();
    }
    function T(S, x) {
      S.push(x.precision), S.push(x.outputColorSpace), S.push(x.envMapMode), S.push(x.envMapCubeUVHeight), S.push(x.mapUv), S.push(x.alphaMapUv), S.push(x.lightMapUv), S.push(x.aoMapUv), S.push(x.bumpMapUv), S.push(x.normalMapUv), S.push(x.displacementMapUv), S.push(x.emissiveMapUv), S.push(x.metalnessMapUv), S.push(x.roughnessMapUv), S.push(x.anisotropyMapUv), S.push(x.clearcoatMapUv), S.push(x.clearcoatNormalMapUv), S.push(x.clearcoatRoughnessMapUv), S.push(x.iridescenceMapUv), S.push(x.iridescenceThicknessMapUv), S.push(x.sheenColorMapUv), S.push(x.sheenRoughnessMapUv), S.push(x.specularMapUv), S.push(x.specularColorMapUv), S.push(x.specularIntensityMapUv), S.push(x.transmissionMapUv), S.push(x.thicknessMapUv), S.push(x.combine), S.push(x.fogExp2), S.push(x.sizeAttenuation), S.push(x.morphTargetsCount), S.push(x.morphAttributeCount), S.push(x.numDirLights), S.push(x.numPointLights), S.push(x.numSpotLights), S.push(x.numSpotLightMaps), S.push(x.numHemiLights), S.push(x.numRectAreaLights), S.push(x.numDirLightShadows), S.push(x.numPointLightShadows), S.push(x.numSpotLightShadows), S.push(x.numSpotLightShadowsWithMaps), S.push(x.numLightProbes), S.push(x.shadowMapType), S.push(x.toneMapping), S.push(x.numClippingPlanes), S.push(x.numClipIntersection), S.push(x.depthPacking);
    }
    function E(S, x) {
      o.disableAll(), x.supportsVertexTextures && o.enable(0), x.instancing && o.enable(1), x.instancingColor && o.enable(2), x.instancingMorph && o.enable(3), x.matcap && o.enable(4), x.envMap && o.enable(5), x.normalMapObjectSpace && o.enable(6), x.normalMapTangentSpace && o.enable(7), x.clearcoat && o.enable(8), x.iridescence && o.enable(9), x.alphaTest && o.enable(10), x.vertexColors && o.enable(11), x.vertexAlphas && o.enable(12), x.vertexUv1s && o.enable(13), x.vertexUv2s && o.enable(14), x.vertexUv3s && o.enable(15), x.vertexTangents && o.enable(16), x.anisotropy && o.enable(17), x.alphaHash && o.enable(18), x.batching && o.enable(19), x.dispersion && o.enable(20), x.batchingColor && o.enable(21), S.push(o.mask), o.disableAll(), x.fog && o.enable(0), x.useFog && o.enable(1), x.flatShading && o.enable(2), x.logarithmicDepthBuffer && o.enable(3), x.reverseDepthBuffer && o.enable(4), x.skinning && o.enable(5), x.morphTargets && o.enable(6), x.morphNormals && o.enable(7), x.morphColors && o.enable(8), x.premultipliedAlpha && o.enable(9), x.shadowMapEnabled && o.enable(10), x.doubleSided && o.enable(11), x.flipSided && o.enable(12), x.useDepthPacking && o.enable(13), x.dithering && o.enable(14), x.transmission && o.enable(15), x.sheen && o.enable(16), x.opaque && o.enable(17), x.pointsUvs && o.enable(18), x.decodeVideoTexture && o.enable(19), x.decodeVideoTextureEmissive && o.enable(20), x.alphaToCoverage && o.enable(21), S.push(o.mask);
    }
    function y(S) {
      const x = g[S.type];
      let C;
      if (x) {
        const W = un[x];
        C = ed.clone(W.uniforms);
      } else C = S.uniforms;
      return C;
    }
    function H(S, x) {
      let C;
      for (let W = 0, V = u.length; W < V; W++) {
        const Y = u[W];
        if (Y.cacheKey === x) {
          C = Y, ++C.usedTimes;
          break;
        }
      }
      return C === void 0 && (C = new _m(i, x, S, s), u.push(C)), C;
    }
    function P(S) {
      if (--S.usedTimes === 0) {
        const x = u.indexOf(S);
        u[x] = u[u.length - 1], u.pop(), S.destroy();
      }
    }
    function A(S) {
      l.remove(S);
    }
    function N() {
      l.dispose();
    }
    return { getParameters: m, getProgramCacheKey: d, getUniforms: y, acquireProgram: H, releaseProgram: P, releaseShaderCache: A, programs: u, dispose: N };
  }
  function bm() {
    let i = /* @__PURE__ */ new WeakMap();
    function t(a) {
      return i.has(a);
    }
    function e(a) {
      let o = i.get(a);
      return o === void 0 && (o = {}, i.set(a, o)), o;
    }
    function n(a) {
      i.delete(a);
    }
    function r(a, o, l) {
      i.get(a)[o] = l;
    }
    function s() {
      i = /* @__PURE__ */ new WeakMap();
    }
    return { has: t, get: e, remove: n, update: r, dispose: s };
  }
  function xm(i, t) {
    return i.groupOrder !== t.groupOrder ? i.groupOrder - t.groupOrder : i.renderOrder !== t.renderOrder ? i.renderOrder - t.renderOrder : i.material.id !== t.material.id ? i.material.id - t.material.id : i.z !== t.z ? i.z - t.z : i.id - t.id;
  }
  function Wl(i, t) {
    return i.groupOrder !== t.groupOrder ? i.groupOrder - t.groupOrder : i.renderOrder !== t.renderOrder ? i.renderOrder - t.renderOrder : i.z !== t.z ? t.z - i.z : i.id - t.id;
  }
  function Xl() {
    const i = [];
    let t = 0;
    const e = [], n = [], r = [];
    function s() {
      t = 0, e.length = 0, n.length = 0, r.length = 0;
    }
    function a(f, p, _, g, v, m) {
      let d = i[t];
      return d === void 0 ? (d = { id: f.id, object: f, geometry: p, material: _, groupOrder: g, renderOrder: f.renderOrder, z: v, group: m }, i[t] = d) : (d.id = f.id, d.object = f, d.geometry = p, d.material = _, d.groupOrder = g, d.renderOrder = f.renderOrder, d.z = v, d.group = m), t++, d;
    }
    function o(f, p, _, g, v, m) {
      const d = a(f, p, _, g, v, m);
      _.transmission > 0 ? n.push(d) : _.transparent === true ? r.push(d) : e.push(d);
    }
    function l(f, p, _, g, v, m) {
      const d = a(f, p, _, g, v, m);
      _.transmission > 0 ? n.unshift(d) : _.transparent === true ? r.unshift(d) : e.unshift(d);
    }
    function c(f, p) {
      e.length > 1 && e.sort(f || xm), n.length > 1 && n.sort(p || Wl), r.length > 1 && r.sort(p || Wl);
    }
    function u() {
      for (let f = t, p = i.length; f < p; f++) {
        const _ = i[f];
        if (_.id === null) break;
        _.id = null, _.object = null, _.geometry = null, _.material = null, _.group = null;
      }
    }
    return { opaque: e, transmissive: n, transparent: r, init: s, push: o, unshift: l, finish: u, sort: c };
  }
  function Sm() {
    let i = /* @__PURE__ */ new WeakMap();
    function t(n, r) {
      const s = i.get(n);
      let a;
      return s === void 0 ? (a = new Xl(), i.set(n, [a])) : r >= s.length ? (a = new Xl(), s.push(a)) : a = s[r], a;
    }
    function e() {
      i = /* @__PURE__ */ new WeakMap();
    }
    return { get: t, dispose: e };
  }
  function ym() {
    const i = {};
    return { get: function(t) {
      if (i[t.id] !== void 0) return i[t.id];
      let e;
      switch (t.type) {
        case "DirectionalLight":
          e = { direction: new z(), color: new Vt() };
          break;
        case "SpotLight":
          e = { position: new z(), direction: new z(), color: new Vt(), distance: 0, coneCos: 0, penumbraCos: 0, decay: 0 };
          break;
        case "PointLight":
          e = { position: new z(), color: new Vt(), distance: 0, decay: 0 };
          break;
        case "HemisphereLight":
          e = { direction: new z(), skyColor: new Vt(), groundColor: new Vt() };
          break;
        case "RectAreaLight":
          e = { color: new Vt(), position: new z(), halfWidth: new z(), halfHeight: new z() };
          break;
      }
      return i[t.id] = e, e;
    } };
  }
  function Mm() {
    const i = {};
    return { get: function(t) {
      if (i[t.id] !== void 0) return i[t.id];
      let e;
      switch (t.type) {
        case "DirectionalLight":
          e = { shadowIntensity: 1, shadowBias: 0, shadowNormalBias: 0, shadowRadius: 1, shadowMapSize: new Jt() };
          break;
        case "SpotLight":
          e = { shadowIntensity: 1, shadowBias: 0, shadowNormalBias: 0, shadowRadius: 1, shadowMapSize: new Jt() };
          break;
        case "PointLight":
          e = { shadowIntensity: 1, shadowBias: 0, shadowNormalBias: 0, shadowRadius: 1, shadowMapSize: new Jt(), shadowCameraNear: 1, shadowCameraFar: 1e3 };
          break;
      }
      return i[t.id] = e, e;
    } };
  }
  let Em = 0;
  function Tm(i, t) {
    return (t.castShadow ? 2 : 0) - (i.castShadow ? 2 : 0) + (t.map ? 1 : 0) - (i.map ? 1 : 0);
  }
  function Rm(i) {
    const t = new ym(), e = Mm(), n = { version: 0, hash: { directionalLength: -1, pointLength: -1, spotLength: -1, rectAreaLength: -1, hemiLength: -1, numDirectionalShadows: -1, numPointShadows: -1, numSpotShadows: -1, numSpotMaps: -1, numLightProbes: -1 }, ambient: [0, 0, 0], probe: [], directional: [], directionalShadow: [], directionalShadowMap: [], directionalShadowMatrix: [], spot: [], spotLightMap: [], spotShadow: [], spotShadowMap: [], spotLightMatrix: [], rectArea: [], rectAreaLTC1: null, rectAreaLTC2: null, point: [], pointShadow: [], pointShadowMap: [], pointShadowMatrix: [], hemi: [], numSpotLightShadowsWithMaps: 0, numLightProbes: 0 };
    for (let c = 0; c < 9; c++) n.probe.push(new z());
    const r = new z(), s = new pe(), a = new pe();
    function o(c) {
      let u = 0, f = 0, p = 0;
      for (let S = 0; S < 9; S++) n.probe[S].set(0, 0, 0);
      let _ = 0, g = 0, v = 0, m = 0, d = 0, T = 0, E = 0, y = 0, H = 0, P = 0, A = 0;
      c.sort(Tm);
      for (let S = 0, x = c.length; S < x; S++) {
        const C = c[S], W = C.color, V = C.intensity, Y = C.distance, Q = C.shadow && C.shadow.map ? C.shadow.map.texture : null;
        if (C.isAmbientLight) u += W.r * V, f += W.g * V, p += W.b * V;
        else if (C.isLightProbe) {
          for (let j = 0; j < 9; j++) n.probe[j].addScaledVector(C.sh.coefficients[j], V);
          A++;
        } else if (C.isDirectionalLight) {
          const j = t.get(C);
          if (j.color.copy(C.color).multiplyScalar(C.intensity), C.castShadow) {
            const et = C.shadow, q = e.get(C);
            q.shadowIntensity = et.intensity, q.shadowBias = et.bias, q.shadowNormalBias = et.normalBias, q.shadowRadius = et.radius, q.shadowMapSize = et.mapSize, n.directionalShadow[_] = q, n.directionalShadowMap[_] = Q, n.directionalShadowMatrix[_] = C.shadow.matrix, T++;
          }
          n.directional[_] = j, _++;
        } else if (C.isSpotLight) {
          const j = t.get(C);
          j.position.setFromMatrixPosition(C.matrixWorld), j.color.copy(W).multiplyScalar(V), j.distance = Y, j.coneCos = Math.cos(C.angle), j.penumbraCos = Math.cos(C.angle * (1 - C.penumbra)), j.decay = C.decay, n.spot[v] = j;
          const et = C.shadow;
          if (C.map && (n.spotLightMap[H] = C.map, H++, et.updateMatrices(C), C.castShadow && P++), n.spotLightMatrix[v] = et.matrix, C.castShadow) {
            const q = e.get(C);
            q.shadowIntensity = et.intensity, q.shadowBias = et.bias, q.shadowNormalBias = et.normalBias, q.shadowRadius = et.radius, q.shadowMapSize = et.mapSize, n.spotShadow[v] = q, n.spotShadowMap[v] = Q, y++;
          }
          v++;
        } else if (C.isRectAreaLight) {
          const j = t.get(C);
          j.color.copy(W).multiplyScalar(V), j.halfWidth.set(C.width * 0.5, 0, 0), j.halfHeight.set(0, C.height * 0.5, 0), n.rectArea[m] = j, m++;
        } else if (C.isPointLight) {
          const j = t.get(C);
          if (j.color.copy(C.color).multiplyScalar(C.intensity), j.distance = C.distance, j.decay = C.decay, C.castShadow) {
            const et = C.shadow, q = e.get(C);
            q.shadowIntensity = et.intensity, q.shadowBias = et.bias, q.shadowNormalBias = et.normalBias, q.shadowRadius = et.radius, q.shadowMapSize = et.mapSize, q.shadowCameraNear = et.camera.near, q.shadowCameraFar = et.camera.far, n.pointShadow[g] = q, n.pointShadowMap[g] = Q, n.pointShadowMatrix[g] = C.shadow.matrix, E++;
          }
          n.point[g] = j, g++;
        } else if (C.isHemisphereLight) {
          const j = t.get(C);
          j.skyColor.copy(C.color).multiplyScalar(V), j.groundColor.copy(C.groundColor).multiplyScalar(V), n.hemi[d] = j, d++;
        }
      }
      m > 0 && (i.has("OES_texture_float_linear") === true ? (n.rectAreaLTC1 = st.LTC_FLOAT_1, n.rectAreaLTC2 = st.LTC_FLOAT_2) : (n.rectAreaLTC1 = st.LTC_HALF_1, n.rectAreaLTC2 = st.LTC_HALF_2)), n.ambient[0] = u, n.ambient[1] = f, n.ambient[2] = p;
      const N = n.hash;
      (N.directionalLength !== _ || N.pointLength !== g || N.spotLength !== v || N.rectAreaLength !== m || N.hemiLength !== d || N.numDirectionalShadows !== T || N.numPointShadows !== E || N.numSpotShadows !== y || N.numSpotMaps !== H || N.numLightProbes !== A) && (n.directional.length = _, n.spot.length = v, n.rectArea.length = m, n.point.length = g, n.hemi.length = d, n.directionalShadow.length = T, n.directionalShadowMap.length = T, n.pointShadow.length = E, n.pointShadowMap.length = E, n.spotShadow.length = y, n.spotShadowMap.length = y, n.directionalShadowMatrix.length = T, n.pointShadowMatrix.length = E, n.spotLightMatrix.length = y + H - P, n.spotLightMap.length = H, n.numSpotLightShadowsWithMaps = P, n.numLightProbes = A, N.directionalLength = _, N.pointLength = g, N.spotLength = v, N.rectAreaLength = m, N.hemiLength = d, N.numDirectionalShadows = T, N.numPointShadows = E, N.numSpotShadows = y, N.numSpotMaps = H, N.numLightProbes = A, n.version = Em++);
    }
    function l(c, u) {
      let f = 0, p = 0, _ = 0, g = 0, v = 0;
      const m = u.matrixWorldInverse;
      for (let d = 0, T = c.length; d < T; d++) {
        const E = c[d];
        if (E.isDirectionalLight) {
          const y = n.directional[f];
          y.direction.setFromMatrixPosition(E.matrixWorld), r.setFromMatrixPosition(E.target.matrixWorld), y.direction.sub(r), y.direction.transformDirection(m), f++;
        } else if (E.isSpotLight) {
          const y = n.spot[_];
          y.position.setFromMatrixPosition(E.matrixWorld), y.position.applyMatrix4(m), y.direction.setFromMatrixPosition(E.matrixWorld), r.setFromMatrixPosition(E.target.matrixWorld), y.direction.sub(r), y.direction.transformDirection(m), _++;
        } else if (E.isRectAreaLight) {
          const y = n.rectArea[g];
          y.position.setFromMatrixPosition(E.matrixWorld), y.position.applyMatrix4(m), a.identity(), s.copy(E.matrixWorld), s.premultiply(m), a.extractRotation(s), y.halfWidth.set(E.width * 0.5, 0, 0), y.halfHeight.set(0, E.height * 0.5, 0), y.halfWidth.applyMatrix4(a), y.halfHeight.applyMatrix4(a), g++;
        } else if (E.isPointLight) {
          const y = n.point[p];
          y.position.setFromMatrixPosition(E.matrixWorld), y.position.applyMatrix4(m), p++;
        } else if (E.isHemisphereLight) {
          const y = n.hemi[v];
          y.direction.setFromMatrixPosition(E.matrixWorld), y.direction.transformDirection(m), v++;
        }
      }
    }
    return { setup: o, setupView: l, state: n };
  }
  function ql(i) {
    const t = new Rm(i), e = [], n = [];
    function r(u) {
      c.camera = u, e.length = 0, n.length = 0;
    }
    function s(u) {
      e.push(u);
    }
    function a(u) {
      n.push(u);
    }
    function o() {
      t.setup(e);
    }
    function l(u) {
      t.setupView(e, u);
    }
    const c = { lightsArray: e, shadowsArray: n, camera: null, lights: t, transmissionRenderTarget: {} };
    return { init: r, state: c, setupLights: o, setupLightsView: l, pushLight: s, pushShadow: a };
  }
  function Am(i) {
    let t = /* @__PURE__ */ new WeakMap();
    function e(r, s = 0) {
      const a = t.get(r);
      let o;
      return a === void 0 ? (o = new ql(i), t.set(r, [o])) : s >= a.length ? (o = new ql(i), a.push(o)) : o = a[s], o;
    }
    function n() {
      t = /* @__PURE__ */ new WeakMap();
    }
    return { get: e, dispose: n };
  }
  class Cm extends ji {
    static get type() {
      return "MeshDepthMaterial";
    }
    constructor(t) {
      super(), this.isMeshDepthMaterial = true, this.depthPacking = Mu, this.map = null, this.alphaMap = null, this.displacementMap = null, this.displacementScale = 1, this.displacementBias = 0, this.wireframe = false, this.wireframeLinewidth = 1, this.setValues(t);
    }
    copy(t) {
      return super.copy(t), this.depthPacking = t.depthPacking, this.map = t.map, this.alphaMap = t.alphaMap, this.displacementMap = t.displacementMap, this.displacementScale = t.displacementScale, this.displacementBias = t.displacementBias, this.wireframe = t.wireframe, this.wireframeLinewidth = t.wireframeLinewidth, this;
    }
  }
  class Pm extends ji {
    static get type() {
      return "MeshDistanceMaterial";
    }
    constructor(t) {
      super(), this.isMeshDistanceMaterial = true, this.map = null, this.alphaMap = null, this.displacementMap = null, this.displacementScale = 1, this.displacementBias = 0, this.setValues(t);
    }
    copy(t) {
      return super.copy(t), this.map = t.map, this.alphaMap = t.alphaMap, this.displacementMap = t.displacementMap, this.displacementScale = t.displacementScale, this.displacementBias = t.displacementBias, this;
    }
  }
  const Im = `void main() {
	gl_Position = vec4( position, 1.0 );
}`, Lm = `uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;
  function Dm(i, t, e) {
    let n = new _o();
    const r = new Jt(), s = new Jt(), a = new me(), o = new Cm({ depthPacking: Eu }), l = new Pm(), c = {}, u = e.maxTextureSize, f = { [Wn]: ze, [ze]: Wn, [En]: En }, p = new Xn({ defines: { VSM_SAMPLES: 8 }, uniforms: { shadow_pass: { value: null }, resolution: { value: new Jt() }, radius: { value: 4 } }, vertexShader: Im, fragmentShader: Lm }), _ = p.clone();
    _.defines.HORIZONTAL_PASS = 1;
    const g = new _n();
    g.setAttribute("position", new fn(new Float32Array([-1, -1, 0.5, 3, -1, 0.5, -1, 3, 0.5]), 3));
    const v = new Re(g, p), m = this;
    this.enabled = false, this.autoUpdate = true, this.needsUpdate = false, this.type = Ec;
    let d = this.type;
    this.render = function(P, A, N) {
      if (m.enabled === false || m.autoUpdate === false && m.needsUpdate === false || P.length === 0) return;
      const S = i.getRenderTarget(), x = i.getActiveCubeFace(), C = i.getActiveMipmapLevel(), W = i.state;
      W.setBlending(kn), W.buffers.color.setClear(1, 1, 1, 1), W.buffers.depth.setTest(true), W.setScissorTest(false);
      const V = d !== yn && this.type === yn, Y = d === yn && this.type !== yn;
      for (let Q = 0, j = P.length; Q < j; Q++) {
        const et = P[Q], q = et.shadow;
        if (q === void 0) {
          console.warn("THREE.WebGLShadowMap:", et, "has no shadow.");
          continue;
        }
        if (q.autoUpdate === false && q.needsUpdate === false) continue;
        r.copy(q.mapSize);
        const ot = q.getFrameExtents();
        if (r.multiply(ot), s.copy(q.mapSize), (r.x > u || r.y > u) && (r.x > u && (s.x = Math.floor(u / ot.x), r.x = s.x * ot.x, q.mapSize.x = s.x), r.y > u && (s.y = Math.floor(u / ot.y), r.y = s.y * ot.y, q.mapSize.y = s.y)), q.map === null || V === true || Y === true) {
          const Mt = this.type !== yn ? { minFilter: on, magFilter: on } : {};
          q.map !== null && q.map.dispose(), q.map = new ui(r.x, r.y, Mt), q.map.texture.name = et.name + ".shadowMap", q.camera.updateProjectionMatrix();
        }
        i.setRenderTarget(q.map), i.clear();
        const ft = q.getViewportCount();
        for (let Mt = 0; Mt < ft; Mt++) {
          const Ht = q.getViewport(Mt);
          a.set(s.x * Ht.x, s.y * Ht.y, s.x * Ht.z, s.y * Ht.w), W.viewport(a), q.updateMatrices(et, Mt), n = q.getFrustum(), y(A, N, q.camera, et, this.type);
        }
        q.isPointLightShadow !== true && this.type === yn && T(q, N), q.needsUpdate = false;
      }
      d = this.type, m.needsUpdate = false, i.setRenderTarget(S, x, C);
    };
    function T(P, A) {
      const N = t.update(v);
      p.defines.VSM_SAMPLES !== P.blurSamples && (p.defines.VSM_SAMPLES = P.blurSamples, _.defines.VSM_SAMPLES = P.blurSamples, p.needsUpdate = true, _.needsUpdate = true), P.mapPass === null && (P.mapPass = new ui(r.x, r.y)), p.uniforms.shadow_pass.value = P.map.texture, p.uniforms.resolution.value = P.mapSize, p.uniforms.radius.value = P.radius, i.setRenderTarget(P.mapPass), i.clear(), i.renderBufferDirect(A, null, N, p, v, null), _.uniforms.shadow_pass.value = P.mapPass.texture, _.uniforms.resolution.value = P.mapSize, _.uniforms.radius.value = P.radius, i.setRenderTarget(P.map), i.clear(), i.renderBufferDirect(A, null, N, _, v, null);
    }
    function E(P, A, N, S) {
      let x = null;
      const C = N.isPointLight === true ? P.customDistanceMaterial : P.customDepthMaterial;
      if (C !== void 0) x = C;
      else if (x = N.isPointLight === true ? l : o, i.localClippingEnabled && A.clipShadows === true && Array.isArray(A.clippingPlanes) && A.clippingPlanes.length !== 0 || A.displacementMap && A.displacementScale !== 0 || A.alphaMap && A.alphaTest > 0 || A.map && A.alphaTest > 0) {
        const W = x.uuid, V = A.uuid;
        let Y = c[W];
        Y === void 0 && (Y = {}, c[W] = Y);
        let Q = Y[V];
        Q === void 0 && (Q = x.clone(), Y[V] = Q, A.addEventListener("dispose", H)), x = Q;
      }
      if (x.visible = A.visible, x.wireframe = A.wireframe, S === yn ? x.side = A.shadowSide !== null ? A.shadowSide : A.side : x.side = A.shadowSide !== null ? A.shadowSide : f[A.side], x.alphaMap = A.alphaMap, x.alphaTest = A.alphaTest, x.map = A.map, x.clipShadows = A.clipShadows, x.clippingPlanes = A.clippingPlanes, x.clipIntersection = A.clipIntersection, x.displacementMap = A.displacementMap, x.displacementScale = A.displacementScale, x.displacementBias = A.displacementBias, x.wireframeLinewidth = A.wireframeLinewidth, x.linewidth = A.linewidth, N.isPointLight === true && x.isMeshDistanceMaterial === true) {
        const W = i.properties.get(x);
        W.light = N;
      }
      return x;
    }
    function y(P, A, N, S, x) {
      if (P.visible === false) return;
      if (P.layers.test(A.layers) && (P.isMesh || P.isLine || P.isPoints) && (P.castShadow || P.receiveShadow && x === yn) && (!P.frustumCulled || n.intersectsObject(P))) {
        P.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse, P.matrixWorld);
        const V = t.update(P), Y = P.material;
        if (Array.isArray(Y)) {
          const Q = V.groups;
          for (let j = 0, et = Q.length; j < et; j++) {
            const q = Q[j], ot = Y[q.materialIndex];
            if (ot && ot.visible) {
              const ft = E(P, ot, S, x);
              P.onBeforeShadow(i, P, A, N, V, ft, q), i.renderBufferDirect(N, null, V, ft, P, q), P.onAfterShadow(i, P, A, N, V, ft, q);
            }
          }
        } else if (Y.visible) {
          const Q = E(P, Y, S, x);
          P.onBeforeShadow(i, P, A, N, V, Q, null), i.renderBufferDirect(N, null, V, Q, P, null), P.onAfterShadow(i, P, A, N, V, Q, null);
        }
      }
      const W = P.children;
      for (let V = 0, Y = W.length; V < Y; V++) y(W[V], A, N, S, x);
    }
    function H(P) {
      P.target.removeEventListener("dispose", H);
      for (const N in c) {
        const S = c[N], x = P.target.uuid;
        x in S && (S[x].dispose(), delete S[x]);
      }
    }
  }
  const Um = { [ua]: da, [fa]: ma, [pa]: ga, [Ni]: _a, [da]: ua, [ma]: fa, [ga]: pa, [_a]: Ni };
  function Fm(i, t) {
    function e() {
      let L = false;
      const at = new me();
      let X = null;
      const J = new me(0, 0, 0, 0);
      return { setMask: function(dt) {
        X !== dt && !L && (i.colorMask(dt, dt, dt, dt), X = dt);
      }, setLocked: function(dt) {
        L = dt;
      }, setClear: function(dt, ht, Ut, _e, Ie) {
        Ie === true && (dt *= _e, ht *= _e, Ut *= _e), at.set(dt, ht, Ut, _e), J.equals(at) === false && (i.clearColor(dt, ht, Ut, _e), J.copy(at));
      }, reset: function() {
        L = false, X = null, J.set(-1, 0, 0, 0);
      } };
    }
    function n() {
      let L = false, at = false, X = null, J = null, dt = null;
      return { setReversed: function(ht) {
        if (at !== ht) {
          const Ut = t.get("EXT_clip_control");
          at ? Ut.clipControlEXT(Ut.LOWER_LEFT_EXT, Ut.ZERO_TO_ONE_EXT) : Ut.clipControlEXT(Ut.LOWER_LEFT_EXT, Ut.NEGATIVE_ONE_TO_ONE_EXT);
          const _e = dt;
          dt = null, this.setClear(_e);
        }
        at = ht;
      }, getReversed: function() {
        return at;
      }, setTest: function(ht) {
        ht ? lt(i.DEPTH_TEST) : Pt(i.DEPTH_TEST);
      }, setMask: function(ht) {
        X !== ht && !L && (i.depthMask(ht), X = ht);
      }, setFunc: function(ht) {
        if (at && (ht = Um[ht]), J !== ht) {
          switch (ht) {
            case ua:
              i.depthFunc(i.NEVER);
              break;
            case da:
              i.depthFunc(i.ALWAYS);
              break;
            case fa:
              i.depthFunc(i.LESS);
              break;
            case Ni:
              i.depthFunc(i.LEQUAL);
              break;
            case pa:
              i.depthFunc(i.EQUAL);
              break;
            case _a:
              i.depthFunc(i.GEQUAL);
              break;
            case ma:
              i.depthFunc(i.GREATER);
              break;
            case ga:
              i.depthFunc(i.NOTEQUAL);
              break;
            default:
              i.depthFunc(i.LEQUAL);
          }
          J = ht;
        }
      }, setLocked: function(ht) {
        L = ht;
      }, setClear: function(ht) {
        dt !== ht && (at && (ht = 1 - ht), i.clearDepth(ht), dt = ht);
      }, reset: function() {
        L = false, X = null, J = null, dt = null, at = false;
      } };
    }
    function r() {
      let L = false, at = null, X = null, J = null, dt = null, ht = null, Ut = null, _e = null, Ie = null;
      return { setTest: function(ee) {
        L || (ee ? lt(i.STENCIL_TEST) : Pt(i.STENCIL_TEST));
      }, setMask: function(ee) {
        at !== ee && !L && (i.stencilMask(ee), at = ee);
      }, setFunc: function(ee, Je, mn) {
        (X !== ee || J !== Je || dt !== mn) && (i.stencilFunc(ee, Je, mn), X = ee, J = Je, dt = mn);
      }, setOp: function(ee, Je, mn) {
        (ht !== ee || Ut !== Je || _e !== mn) && (i.stencilOp(ee, Je, mn), ht = ee, Ut = Je, _e = mn);
      }, setLocked: function(ee) {
        L = ee;
      }, setClear: function(ee) {
        Ie !== ee && (i.clearStencil(ee), Ie = ee);
      }, reset: function() {
        L = false, at = null, X = null, J = null, dt = null, ht = null, Ut = null, _e = null, Ie = null;
      } };
    }
    const s = new e(), a = new n(), o = new r(), l = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new WeakMap();
    let u = {}, f = {}, p = /* @__PURE__ */ new WeakMap(), _ = [], g = null, v = false, m = null, d = null, T = null, E = null, y = null, H = null, P = null, A = new Vt(0, 0, 0), N = 0, S = false, x = null, C = null, W = null, V = null, Y = null;
    const Q = i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    let j = false, et = 0;
    const q = i.getParameter(i.VERSION);
    q.indexOf("WebGL") !== -1 ? (et = parseFloat(/^WebGL (\d)/.exec(q)[1]), j = et >= 1) : q.indexOf("OpenGL ES") !== -1 && (et = parseFloat(/^OpenGL ES (\d)/.exec(q)[1]), j = et >= 2);
    let ot = null, ft = {};
    const Mt = i.getParameter(i.SCISSOR_BOX), Ht = i.getParameter(i.VIEWPORT), ie = new me().fromArray(Mt), Z = new me().fromArray(Ht);
    function rt(L, at, X, J) {
      const dt = new Uint8Array(4), ht = i.createTexture();
      i.bindTexture(L, ht), i.texParameteri(L, i.TEXTURE_MIN_FILTER, i.NEAREST), i.texParameteri(L, i.TEXTURE_MAG_FILTER, i.NEAREST);
      for (let Ut = 0; Ut < X; Ut++) L === i.TEXTURE_3D || L === i.TEXTURE_2D_ARRAY ? i.texImage3D(at, 0, i.RGBA, 1, 1, J, 0, i.RGBA, i.UNSIGNED_BYTE, dt) : i.texImage2D(at + Ut, 0, i.RGBA, 1, 1, 0, i.RGBA, i.UNSIGNED_BYTE, dt);
      return ht;
    }
    const xt = {};
    xt[i.TEXTURE_2D] = rt(i.TEXTURE_2D, i.TEXTURE_2D, 1), xt[i.TEXTURE_CUBE_MAP] = rt(i.TEXTURE_CUBE_MAP, i.TEXTURE_CUBE_MAP_POSITIVE_X, 6), xt[i.TEXTURE_2D_ARRAY] = rt(i.TEXTURE_2D_ARRAY, i.TEXTURE_2D_ARRAY, 1, 1), xt[i.TEXTURE_3D] = rt(i.TEXTURE_3D, i.TEXTURE_3D, 1, 1), s.setClear(0, 0, 0, 1), a.setClear(1), o.setClear(0), lt(i.DEPTH_TEST), a.setFunc(Ni), Wt(false), Xt(Zo), lt(i.CULL_FACE), O(kn);
    function lt(L) {
      u[L] !== true && (i.enable(L), u[L] = true);
    }
    function Pt(L) {
      u[L] !== false && (i.disable(L), u[L] = false);
    }
    function Dt(L, at) {
      return f[L] !== at ? (i.bindFramebuffer(L, at), f[L] = at, L === i.DRAW_FRAMEBUFFER && (f[i.FRAMEBUFFER] = at), L === i.FRAMEBUFFER && (f[i.DRAW_FRAMEBUFFER] = at), true) : false;
    }
    function Gt(L, at) {
      let X = _, J = false;
      if (L) {
        X = p.get(at), X === void 0 && (X = [], p.set(at, X));
        const dt = L.textures;
        if (X.length !== dt.length || X[0] !== i.COLOR_ATTACHMENT0) {
          for (let ht = 0, Ut = dt.length; ht < Ut; ht++) X[ht] = i.COLOR_ATTACHMENT0 + ht;
          X.length = dt.length, J = true;
        }
      } else X[0] !== i.BACK && (X[0] = i.BACK, J = true);
      J && i.drawBuffers(X);
    }
    function de(L) {
      return g !== L ? (i.useProgram(L), g = L, true) : false;
    }
    const Yt = { [ri]: i.FUNC_ADD, [$h]: i.FUNC_SUBTRACT, [Jh]: i.FUNC_REVERSE_SUBTRACT };
    Yt[Qh] = i.MIN, Yt[tu] = i.MAX;
    const ge = { [eu]: i.ZERO, [nu]: i.ONE, [iu]: i.SRC_COLOR, [ca]: i.SRC_ALPHA, [cu]: i.SRC_ALPHA_SATURATE, [ou]: i.DST_COLOR, [su]: i.DST_ALPHA, [ru]: i.ONE_MINUS_SRC_COLOR, [ha]: i.ONE_MINUS_SRC_ALPHA, [lu]: i.ONE_MINUS_DST_COLOR, [au]: i.ONE_MINUS_DST_ALPHA, [hu]: i.CONSTANT_COLOR, [uu]: i.ONE_MINUS_CONSTANT_COLOR, [du]: i.CONSTANT_ALPHA, [fu]: i.ONE_MINUS_CONSTANT_ALPHA };
    function O(L, at, X, J, dt, ht, Ut, _e, Ie, ee) {
      if (L === kn) {
        v === true && (Pt(i.BLEND), v = false);
        return;
      }
      if (v === false && (lt(i.BLEND), v = true), L !== Zh) {
        if (L !== m || ee !== S) {
          if ((d !== ri || y !== ri) && (i.blendEquation(i.FUNC_ADD), d = ri, y = ri), ee) switch (L) {
            case Li:
              i.blendFuncSeparate(i.ONE, i.ONE_MINUS_SRC_ALPHA, i.ONE, i.ONE_MINUS_SRC_ALPHA);
              break;
            case $o:
              i.blendFunc(i.ONE, i.ONE);
              break;
            case Jo:
              i.blendFuncSeparate(i.ZERO, i.ONE_MINUS_SRC_COLOR, i.ZERO, i.ONE);
              break;
            case Qo:
              i.blendFuncSeparate(i.ZERO, i.SRC_COLOR, i.ZERO, i.SRC_ALPHA);
              break;
            default:
              console.error("THREE.WebGLState: Invalid blending: ", L);
              break;
          }
          else switch (L) {
            case Li:
              i.blendFuncSeparate(i.SRC_ALPHA, i.ONE_MINUS_SRC_ALPHA, i.ONE, i.ONE_MINUS_SRC_ALPHA);
              break;
            case $o:
              i.blendFunc(i.SRC_ALPHA, i.ONE);
              break;
            case Jo:
              i.blendFuncSeparate(i.ZERO, i.ONE_MINUS_SRC_COLOR, i.ZERO, i.ONE);
              break;
            case Qo:
              i.blendFunc(i.ZERO, i.SRC_COLOR);
              break;
            default:
              console.error("THREE.WebGLState: Invalid blending: ", L);
              break;
          }
          T = null, E = null, H = null, P = null, A.set(0, 0, 0), N = 0, m = L, S = ee;
        }
        return;
      }
      dt = dt || at, ht = ht || X, Ut = Ut || J, (at !== d || dt !== y) && (i.blendEquationSeparate(Yt[at], Yt[dt]), d = at, y = dt), (X !== T || J !== E || ht !== H || Ut !== P) && (i.blendFuncSeparate(ge[X], ge[J], ge[ht], ge[Ut]), T = X, E = J, H = ht, P = Ut), (_e.equals(A) === false || Ie !== N) && (i.blendColor(_e.r, _e.g, _e.b, Ie), A.copy(_e), N = Ie), m = L, S = false;
    }
    function je(L, at) {
      L.side === En ? Pt(i.CULL_FACE) : lt(i.CULL_FACE);
      let X = L.side === ze;
      at && (X = !X), Wt(X), L.blending === Li && L.transparent === false ? O(kn) : O(L.blending, L.blendEquation, L.blendSrc, L.blendDst, L.blendEquationAlpha, L.blendSrcAlpha, L.blendDstAlpha, L.blendColor, L.blendAlpha, L.premultipliedAlpha), a.setFunc(L.depthFunc), a.setTest(L.depthTest), a.setMask(L.depthWrite), s.setMask(L.colorWrite);
      const J = L.stencilWrite;
      o.setTest(J), J && (o.setMask(L.stencilWriteMask), o.setFunc(L.stencilFunc, L.stencilRef, L.stencilFuncMask), o.setOp(L.stencilFail, L.stencilZFail, L.stencilZPass)), oe(L.polygonOffset, L.polygonOffsetFactor, L.polygonOffsetUnits), L.alphaToCoverage === true ? lt(i.SAMPLE_ALPHA_TO_COVERAGE) : Pt(i.SAMPLE_ALPHA_TO_COVERAGE);
    }
    function Wt(L) {
      x !== L && (L ? i.frontFace(i.CW) : i.frontFace(i.CCW), x = L);
    }
    function Xt(L) {
      L !== Yh ? (lt(i.CULL_FACE), L !== C && (L === Zo ? i.cullFace(i.BACK) : L === Kh ? i.cullFace(i.FRONT) : i.cullFace(i.FRONT_AND_BACK))) : Pt(i.CULL_FACE), C = L;
    }
    function Rt(L) {
      L !== W && (j && i.lineWidth(L), W = L);
    }
    function oe(L, at, X) {
      L ? (lt(i.POLYGON_OFFSET_FILL), (V !== at || Y !== X) && (i.polygonOffset(at, X), V = at, Y = X)) : Pt(i.POLYGON_OFFSET_FILL);
    }
    function Tt(L) {
      L ? lt(i.SCISSOR_TEST) : Pt(i.SCISSOR_TEST);
    }
    function M(L) {
      L === void 0 && (L = i.TEXTURE0 + Q - 1), ot !== L && (i.activeTexture(L), ot = L);
    }
    function w(L, at, X) {
      X === void 0 && (ot === null ? X = i.TEXTURE0 + Q - 1 : X = ot);
      let J = ft[X];
      J === void 0 && (J = { type: void 0, texture: void 0 }, ft[X] = J), (J.type !== L || J.texture !== at) && (ot !== X && (i.activeTexture(X), ot = X), i.bindTexture(L, at || xt[L]), J.type = L, J.texture = at);
    }
    function B() {
      const L = ft[ot];
      L !== void 0 && L.type !== void 0 && (i.bindTexture(L.type, null), L.type = void 0, L.texture = void 0);
    }
    function $() {
      try {
        i.compressedTexImage2D.apply(i, arguments);
      } catch (L) {
        console.error("THREE.WebGLState:", L);
      }
    }
    function tt() {
      try {
        i.compressedTexImage3D.apply(i, arguments);
      } catch (L) {
        console.error("THREE.WebGLState:", L);
      }
    }
    function K() {
      try {
        i.texSubImage2D.apply(i, arguments);
      } catch (L) {
        console.error("THREE.WebGLState:", L);
      }
    }
    function St() {
      try {
        i.texSubImage3D.apply(i, arguments);
      } catch (L) {
        console.error("THREE.WebGLState:", L);
      }
    }
    function ct() {
      try {
        i.compressedTexSubImage2D.apply(i, arguments);
      } catch (L) {
        console.error("THREE.WebGLState:", L);
      }
    }
    function pt() {
      try {
        i.compressedTexSubImage3D.apply(i, arguments);
      } catch (L) {
        console.error("THREE.WebGLState:", L);
      }
    }
    function Kt() {
      try {
        i.texStorage2D.apply(i, arguments);
      } catch (L) {
        console.error("THREE.WebGLState:", L);
      }
    }
    function nt() {
      try {
        i.texStorage3D.apply(i, arguments);
      } catch (L) {
        console.error("THREE.WebGLState:", L);
      }
    }
    function _t() {
      try {
        i.texImage2D.apply(i, arguments);
      } catch (L) {
        console.error("THREE.WebGLState:", L);
      }
    }
    function Ct() {
      try {
        i.texImage3D.apply(i, arguments);
      } catch (L) {
        console.error("THREE.WebGLState:", L);
      }
    }
    function It(L) {
      ie.equals(L) === false && (i.scissor(L.x, L.y, L.z, L.w), ie.copy(L));
    }
    function mt(L) {
      Z.equals(L) === false && (i.viewport(L.x, L.y, L.z, L.w), Z.copy(L));
    }
    function qt(L, at) {
      let X = c.get(at);
      X === void 0 && (X = /* @__PURE__ */ new WeakMap(), c.set(at, X));
      let J = X.get(L);
      J === void 0 && (J = i.getUniformBlockIndex(at, L.name), X.set(L, J));
    }
    function Ot(L, at) {
      const J = c.get(at).get(L);
      l.get(at) !== J && (i.uniformBlockBinding(at, J, L.__bindingPointIndex), l.set(at, J));
    }
    function se() {
      i.disable(i.BLEND), i.disable(i.CULL_FACE), i.disable(i.DEPTH_TEST), i.disable(i.POLYGON_OFFSET_FILL), i.disable(i.SCISSOR_TEST), i.disable(i.STENCIL_TEST), i.disable(i.SAMPLE_ALPHA_TO_COVERAGE), i.blendEquation(i.FUNC_ADD), i.blendFunc(i.ONE, i.ZERO), i.blendFuncSeparate(i.ONE, i.ZERO, i.ONE, i.ZERO), i.blendColor(0, 0, 0, 0), i.colorMask(true, true, true, true), i.clearColor(0, 0, 0, 0), i.depthMask(true), i.depthFunc(i.LESS), a.setReversed(false), i.clearDepth(1), i.stencilMask(4294967295), i.stencilFunc(i.ALWAYS, 0, 4294967295), i.stencilOp(i.KEEP, i.KEEP, i.KEEP), i.clearStencil(0), i.cullFace(i.BACK), i.frontFace(i.CCW), i.polygonOffset(0, 0), i.activeTexture(i.TEXTURE0), i.bindFramebuffer(i.FRAMEBUFFER, null), i.bindFramebuffer(i.DRAW_FRAMEBUFFER, null), i.bindFramebuffer(i.READ_FRAMEBUFFER, null), i.useProgram(null), i.lineWidth(1), i.scissor(0, 0, i.canvas.width, i.canvas.height), i.viewport(0, 0, i.canvas.width, i.canvas.height), u = {}, ot = null, ft = {}, f = {}, p = /* @__PURE__ */ new WeakMap(), _ = [], g = null, v = false, m = null, d = null, T = null, E = null, y = null, H = null, P = null, A = new Vt(0, 0, 0), N = 0, S = false, x = null, C = null, W = null, V = null, Y = null, ie.set(0, 0, i.canvas.width, i.canvas.height), Z.set(0, 0, i.canvas.width, i.canvas.height), s.reset(), a.reset(), o.reset();
    }
    return { buffers: { color: s, depth: a, stencil: o }, enable: lt, disable: Pt, bindFramebuffer: Dt, drawBuffers: Gt, useProgram: de, setBlending: O, setMaterial: je, setFlipSided: Wt, setCullFace: Xt, setLineWidth: Rt, setPolygonOffset: oe, setScissorTest: Tt, activeTexture: M, bindTexture: w, unbindTexture: B, compressedTexImage2D: $, compressedTexImage3D: tt, texImage2D: _t, texImage3D: Ct, updateUBOMapping: qt, uniformBlockBinding: Ot, texStorage2D: Kt, texStorage3D: nt, texSubImage2D: K, texSubImage3D: St, compressedTexSubImage2D: ct, compressedTexSubImage3D: pt, scissor: It, viewport: mt, reset: se };
  }
  function jl(i, t, e, n) {
    const r = Nm(n);
    switch (e) {
      case Lc:
        return i * t;
      case Uc:
        return i * t;
      case Fc:
        return i * t * 2;
      case Nc:
        return i * t / r.components * r.byteLength;
      case uo:
        return i * t / r.components * r.byteLength;
      case Oc:
        return i * t * 2 / r.components * r.byteLength;
      case fo:
        return i * t * 2 / r.components * r.byteLength;
      case Dc:
        return i * t * 3 / r.components * r.byteLength;
      case an:
        return i * t * 4 / r.components * r.byteLength;
      case po:
        return i * t * 4 / r.components * r.byteLength;
      case $r:
      case Jr:
        return Math.floor((i + 3) / 4) * Math.floor((t + 3) / 4) * 8;
      case Qr:
      case ts:
        return Math.floor((i + 3) / 4) * Math.floor((t + 3) / 4) * 16;
      case ya:
      case Ea:
        return Math.max(i, 16) * Math.max(t, 8) / 4;
      case Sa:
      case Ma:
        return Math.max(i, 8) * Math.max(t, 8) / 2;
      case Ta:
      case Ra:
        return Math.floor((i + 3) / 4) * Math.floor((t + 3) / 4) * 8;
      case Aa:
        return Math.floor((i + 3) / 4) * Math.floor((t + 3) / 4) * 16;
      case Ca:
        return Math.floor((i + 3) / 4) * Math.floor((t + 3) / 4) * 16;
      case Pa:
        return Math.floor((i + 4) / 5) * Math.floor((t + 3) / 4) * 16;
      case Ia:
        return Math.floor((i + 4) / 5) * Math.floor((t + 4) / 5) * 16;
      case La:
        return Math.floor((i + 5) / 6) * Math.floor((t + 4) / 5) * 16;
      case Da:
        return Math.floor((i + 5) / 6) * Math.floor((t + 5) / 6) * 16;
      case Ua:
        return Math.floor((i + 7) / 8) * Math.floor((t + 4) / 5) * 16;
      case Fa:
        return Math.floor((i + 7) / 8) * Math.floor((t + 5) / 6) * 16;
      case Na:
        return Math.floor((i + 7) / 8) * Math.floor((t + 7) / 8) * 16;
      case Oa:
        return Math.floor((i + 9) / 10) * Math.floor((t + 4) / 5) * 16;
      case za:
        return Math.floor((i + 9) / 10) * Math.floor((t + 5) / 6) * 16;
      case Ba:
        return Math.floor((i + 9) / 10) * Math.floor((t + 7) / 8) * 16;
      case Ha:
        return Math.floor((i + 9) / 10) * Math.floor((t + 9) / 10) * 16;
      case Ga:
        return Math.floor((i + 11) / 12) * Math.floor((t + 9) / 10) * 16;
      case ka:
        return Math.floor((i + 11) / 12) * Math.floor((t + 11) / 12) * 16;
      case es:
      case Va:
      case Wa:
        return Math.ceil(i / 4) * Math.ceil(t / 4) * 16;
      case zc:
      case Xa:
        return Math.ceil(i / 4) * Math.ceil(t / 4) * 8;
      case qa:
      case ja:
        return Math.ceil(i / 4) * Math.ceil(t / 4) * 16;
    }
    throw new Error(`Unable to determine texture byte length for ${e} format.`);
  }
  function Nm(i) {
    switch (i) {
      case Cn:
      case Cc:
        return { byteLength: 1, components: 1 };
      case lr:
      case Pc:
      case fr:
        return { byteLength: 2, components: 1 };
      case co:
      case ho:
        return { byteLength: 2, components: 4 };
      case hi:
      case lo:
      case Tn:
        return { byteLength: 4, components: 1 };
      case Ic:
        return { byteLength: 4, components: 3 };
    }
    throw new Error(`Unknown texture type ${i}.`);
  }
  function Om(i, t, e, n, r, s, a) {
    const o = t.has("WEBGL_multisampled_render_to_texture") ? t.get("WEBGL_multisampled_render_to_texture") : null, l = typeof navigator > "u" ? false : /OculusBrowser/g.test(navigator.userAgent), c = new Jt(), u = /* @__PURE__ */ new WeakMap();
    let f;
    const p = /* @__PURE__ */ new WeakMap();
    let _ = false;
    try {
      _ = typeof OffscreenCanvas < "u" && new OffscreenCanvas(1, 1).getContext("2d") !== null;
    } catch {
    }
    function g(M, w) {
      return _ ? new OffscreenCanvas(M, w) : rs("canvas");
    }
    function v(M, w, B) {
      let $ = 1;
      const tt = Tt(M);
      if ((tt.width > B || tt.height > B) && ($ = B / Math.max(tt.width, tt.height)), $ < 1) if (typeof HTMLImageElement < "u" && M instanceof HTMLImageElement || typeof HTMLCanvasElement < "u" && M instanceof HTMLCanvasElement || typeof ImageBitmap < "u" && M instanceof ImageBitmap || typeof VideoFrame < "u" && M instanceof VideoFrame) {
        const K = Math.floor($ * tt.width), St = Math.floor($ * tt.height);
        f === void 0 && (f = g(K, St));
        const ct = w ? g(K, St) : f;
        return ct.width = K, ct.height = St, ct.getContext("2d").drawImage(M, 0, 0, K, St), console.warn("THREE.WebGLRenderer: Texture has been resized from (" + tt.width + "x" + tt.height + ") to (" + K + "x" + St + ")."), ct;
      } else return "data" in M && console.warn("THREE.WebGLRenderer: Image in DataTexture is too big (" + tt.width + "x" + tt.height + ")."), M;
      return M;
    }
    function m(M) {
      return M.generateMipmaps;
    }
    function d(M) {
      i.generateMipmap(M);
    }
    function T(M) {
      return M.isWebGLCubeRenderTarget ? i.TEXTURE_CUBE_MAP : M.isWebGL3DRenderTarget ? i.TEXTURE_3D : M.isWebGLArrayRenderTarget || M.isCompressedArrayTexture ? i.TEXTURE_2D_ARRAY : i.TEXTURE_2D;
    }
    function E(M, w, B, $, tt = false) {
      if (M !== null) {
        if (i[M] !== void 0) return i[M];
        console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '" + M + "'");
      }
      let K = w;
      if (w === i.RED && (B === i.FLOAT && (K = i.R32F), B === i.HALF_FLOAT && (K = i.R16F), B === i.UNSIGNED_BYTE && (K = i.R8)), w === i.RED_INTEGER && (B === i.UNSIGNED_BYTE && (K = i.R8UI), B === i.UNSIGNED_SHORT && (K = i.R16UI), B === i.UNSIGNED_INT && (K = i.R32UI), B === i.BYTE && (K = i.R8I), B === i.SHORT && (K = i.R16I), B === i.INT && (K = i.R32I)), w === i.RG && (B === i.FLOAT && (K = i.RG32F), B === i.HALF_FLOAT && (K = i.RG16F), B === i.UNSIGNED_BYTE && (K = i.RG8)), w === i.RG_INTEGER && (B === i.UNSIGNED_BYTE && (K = i.RG8UI), B === i.UNSIGNED_SHORT && (K = i.RG16UI), B === i.UNSIGNED_INT && (K = i.RG32UI), B === i.BYTE && (K = i.RG8I), B === i.SHORT && (K = i.RG16I), B === i.INT && (K = i.RG32I)), w === i.RGB_INTEGER && (B === i.UNSIGNED_BYTE && (K = i.RGB8UI), B === i.UNSIGNED_SHORT && (K = i.RGB16UI), B === i.UNSIGNED_INT && (K = i.RGB32UI), B === i.BYTE && (K = i.RGB8I), B === i.SHORT && (K = i.RGB16I), B === i.INT && (K = i.RGB32I)), w === i.RGBA_INTEGER && (B === i.UNSIGNED_BYTE && (K = i.RGBA8UI), B === i.UNSIGNED_SHORT && (K = i.RGBA16UI), B === i.UNSIGNED_INT && (K = i.RGBA32UI), B === i.BYTE && (K = i.RGBA8I), B === i.SHORT && (K = i.RGBA16I), B === i.INT && (K = i.RGBA32I)), w === i.RGB && B === i.UNSIGNED_INT_5_9_9_9_REV && (K = i.RGB9_E5), w === i.RGBA) {
        const St = tt ? vs : Zt.getTransfer($);
        B === i.FLOAT && (K = i.RGBA32F), B === i.HALF_FLOAT && (K = i.RGBA16F), B === i.UNSIGNED_BYTE && (K = St === ne ? i.SRGB8_ALPHA8 : i.RGBA8), B === i.UNSIGNED_SHORT_4_4_4_4 && (K = i.RGBA4), B === i.UNSIGNED_SHORT_5_5_5_1 && (K = i.RGB5_A1);
      }
      return (K === i.R16F || K === i.R32F || K === i.RG16F || K === i.RG32F || K === i.RGBA16F || K === i.RGBA32F) && t.get("EXT_color_buffer_float"), K;
    }
    function y(M, w) {
      let B;
      return M ? w === null || w === hi || w === Bi ? B = i.DEPTH24_STENCIL8 : w === Tn ? B = i.DEPTH32F_STENCIL8 : w === lr && (B = i.DEPTH24_STENCIL8, console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")) : w === null || w === hi || w === Bi ? B = i.DEPTH_COMPONENT24 : w === Tn ? B = i.DEPTH_COMPONENT32F : w === lr && (B = i.DEPTH_COMPONENT16), B;
    }
    function H(M, w) {
      return m(M) === true || M.isFramebufferTexture && M.minFilter !== on && M.minFilter !== dn ? Math.log2(Math.max(w.width, w.height)) + 1 : M.mipmaps !== void 0 && M.mipmaps.length > 0 ? M.mipmaps.length : M.isCompressedTexture && Array.isArray(M.image) ? w.mipmaps.length : 1;
    }
    function P(M) {
      const w = M.target;
      w.removeEventListener("dispose", P), N(w), w.isVideoTexture && u.delete(w);
    }
    function A(M) {
      const w = M.target;
      w.removeEventListener("dispose", A), x(w);
    }
    function N(M) {
      const w = n.get(M);
      if (w.__webglInit === void 0) return;
      const B = M.source, $ = p.get(B);
      if ($) {
        const tt = $[w.__cacheKey];
        tt.usedTimes--, tt.usedTimes === 0 && S(M), Object.keys($).length === 0 && p.delete(B);
      }
      n.remove(M);
    }
    function S(M) {
      const w = n.get(M);
      i.deleteTexture(w.__webglTexture);
      const B = M.source, $ = p.get(B);
      delete $[w.__cacheKey], a.memory.textures--;
    }
    function x(M) {
      const w = n.get(M);
      if (M.depthTexture && (M.depthTexture.dispose(), n.remove(M.depthTexture)), M.isWebGLCubeRenderTarget) for (let $ = 0; $ < 6; $++) {
        if (Array.isArray(w.__webglFramebuffer[$])) for (let tt = 0; tt < w.__webglFramebuffer[$].length; tt++) i.deleteFramebuffer(w.__webglFramebuffer[$][tt]);
        else i.deleteFramebuffer(w.__webglFramebuffer[$]);
        w.__webglDepthbuffer && i.deleteRenderbuffer(w.__webglDepthbuffer[$]);
      }
      else {
        if (Array.isArray(w.__webglFramebuffer)) for (let $ = 0; $ < w.__webglFramebuffer.length; $++) i.deleteFramebuffer(w.__webglFramebuffer[$]);
        else i.deleteFramebuffer(w.__webglFramebuffer);
        if (w.__webglDepthbuffer && i.deleteRenderbuffer(w.__webglDepthbuffer), w.__webglMultisampledFramebuffer && i.deleteFramebuffer(w.__webglMultisampledFramebuffer), w.__webglColorRenderbuffer) for (let $ = 0; $ < w.__webglColorRenderbuffer.length; $++) w.__webglColorRenderbuffer[$] && i.deleteRenderbuffer(w.__webglColorRenderbuffer[$]);
        w.__webglDepthRenderbuffer && i.deleteRenderbuffer(w.__webglDepthRenderbuffer);
      }
      const B = M.textures;
      for (let $ = 0, tt = B.length; $ < tt; $++) {
        const K = n.get(B[$]);
        K.__webglTexture && (i.deleteTexture(K.__webglTexture), a.memory.textures--), n.remove(B[$]);
      }
      n.remove(M);
    }
    let C = 0;
    function W() {
      C = 0;
    }
    function V() {
      const M = C;
      return M >= r.maxTextures && console.warn("THREE.WebGLTextures: Trying to use " + M + " texture units while this GPU supports only " + r.maxTextures), C += 1, M;
    }
    function Y(M) {
      const w = [];
      return w.push(M.wrapS), w.push(M.wrapT), w.push(M.wrapR || 0), w.push(M.magFilter), w.push(M.minFilter), w.push(M.anisotropy), w.push(M.internalFormat), w.push(M.format), w.push(M.type), w.push(M.generateMipmaps), w.push(M.premultiplyAlpha), w.push(M.flipY), w.push(M.unpackAlignment), w.push(M.colorSpace), w.join();
    }
    function Q(M, w) {
      const B = n.get(M);
      if (M.isVideoTexture && Rt(M), M.isRenderTargetTexture === false && M.version > 0 && B.__version !== M.version) {
        const $ = M.image;
        if ($ === null) console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");
        else if ($.complete === false) console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");
        else {
          Z(B, M, w);
          return;
        }
      }
      e.bindTexture(i.TEXTURE_2D, B.__webglTexture, i.TEXTURE0 + w);
    }
    function j(M, w) {
      const B = n.get(M);
      if (M.version > 0 && B.__version !== M.version) {
        Z(B, M, w);
        return;
      }
      e.bindTexture(i.TEXTURE_2D_ARRAY, B.__webglTexture, i.TEXTURE0 + w);
    }
    function et(M, w) {
      const B = n.get(M);
      if (M.version > 0 && B.__version !== M.version) {
        Z(B, M, w);
        return;
      }
      e.bindTexture(i.TEXTURE_3D, B.__webglTexture, i.TEXTURE0 + w);
    }
    function q(M, w) {
      const B = n.get(M);
      if (M.version > 0 && B.__version !== M.version) {
        rt(B, M, w);
        return;
      }
      e.bindTexture(i.TEXTURE_CUBE_MAP, B.__webglTexture, i.TEXTURE0 + w);
    }
    const ot = { [ba]: i.REPEAT, [ai]: i.CLAMP_TO_EDGE, [xa]: i.MIRRORED_REPEAT }, ft = { [on]: i.NEAREST, [yu]: i.NEAREST_MIPMAP_NEAREST, [Sr]: i.NEAREST_MIPMAP_LINEAR, [dn]: i.LINEAR, [Is]: i.LINEAR_MIPMAP_NEAREST, [oi]: i.LINEAR_MIPMAP_LINEAR }, Mt = { [Ru]: i.NEVER, [Du]: i.ALWAYS, [Au]: i.LESS, [Hc]: i.LEQUAL, [Cu]: i.EQUAL, [Lu]: i.GEQUAL, [Pu]: i.GREATER, [Iu]: i.NOTEQUAL };
    function Ht(M, w) {
      if (w.type === Tn && t.has("OES_texture_float_linear") === false && (w.magFilter === dn || w.magFilter === Is || w.magFilter === Sr || w.magFilter === oi || w.minFilter === dn || w.minFilter === Is || w.minFilter === Sr || w.minFilter === oi) && console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."), i.texParameteri(M, i.TEXTURE_WRAP_S, ot[w.wrapS]), i.texParameteri(M, i.TEXTURE_WRAP_T, ot[w.wrapT]), (M === i.TEXTURE_3D || M === i.TEXTURE_2D_ARRAY) && i.texParameteri(M, i.TEXTURE_WRAP_R, ot[w.wrapR]), i.texParameteri(M, i.TEXTURE_MAG_FILTER, ft[w.magFilter]), i.texParameteri(M, i.TEXTURE_MIN_FILTER, ft[w.minFilter]), w.compareFunction && (i.texParameteri(M, i.TEXTURE_COMPARE_MODE, i.COMPARE_REF_TO_TEXTURE), i.texParameteri(M, i.TEXTURE_COMPARE_FUNC, Mt[w.compareFunction])), t.has("EXT_texture_filter_anisotropic") === true) {
        if (w.magFilter === on || w.minFilter !== Sr && w.minFilter !== oi || w.type === Tn && t.has("OES_texture_float_linear") === false) return;
        if (w.anisotropy > 1 || n.get(w).__currentAnisotropy) {
          const B = t.get("EXT_texture_filter_anisotropic");
          i.texParameterf(M, B.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(w.anisotropy, r.getMaxAnisotropy())), n.get(w).__currentAnisotropy = w.anisotropy;
        }
      }
    }
    function ie(M, w) {
      let B = false;
      M.__webglInit === void 0 && (M.__webglInit = true, w.addEventListener("dispose", P));
      const $ = w.source;
      let tt = p.get($);
      tt === void 0 && (tt = {}, p.set($, tt));
      const K = Y(w);
      if (K !== M.__cacheKey) {
        tt[K] === void 0 && (tt[K] = { texture: i.createTexture(), usedTimes: 0 }, a.memory.textures++, B = true), tt[K].usedTimes++;
        const St = tt[M.__cacheKey];
        St !== void 0 && (tt[M.__cacheKey].usedTimes--, St.usedTimes === 0 && S(w)), M.__cacheKey = K, M.__webglTexture = tt[K].texture;
      }
      return B;
    }
    function Z(M, w, B) {
      let $ = i.TEXTURE_2D;
      (w.isDataArrayTexture || w.isCompressedArrayTexture) && ($ = i.TEXTURE_2D_ARRAY), w.isData3DTexture && ($ = i.TEXTURE_3D);
      const tt = ie(M, w), K = w.source;
      e.bindTexture($, M.__webglTexture, i.TEXTURE0 + B);
      const St = n.get(K);
      if (K.version !== St.__version || tt === true) {
        e.activeTexture(i.TEXTURE0 + B);
        const ct = Zt.getPrimaries(Zt.workingColorSpace), pt = w.colorSpace === Gn ? null : Zt.getPrimaries(w.colorSpace), Kt = w.colorSpace === Gn || ct === pt ? i.NONE : i.BROWSER_DEFAULT_WEBGL;
        i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL, w.flipY), i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL, w.premultiplyAlpha), i.pixelStorei(i.UNPACK_ALIGNMENT, w.unpackAlignment), i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL, Kt);
        let nt = v(w.image, false, r.maxTextureSize);
        nt = oe(w, nt);
        const _t = s.convert(w.format, w.colorSpace), Ct = s.convert(w.type);
        let It = E(w.internalFormat, _t, Ct, w.colorSpace, w.isVideoTexture);
        Ht($, w);
        let mt;
        const qt = w.mipmaps, Ot = w.isVideoTexture !== true, se = St.__version === void 0 || tt === true, L = K.dataReady, at = H(w, nt);
        if (w.isDepthTexture) It = y(w.format === Hi, w.type), se && (Ot ? e.texStorage2D(i.TEXTURE_2D, 1, It, nt.width, nt.height) : e.texImage2D(i.TEXTURE_2D, 0, It, nt.width, nt.height, 0, _t, Ct, null));
        else if (w.isDataTexture) if (qt.length > 0) {
          Ot && se && e.texStorage2D(i.TEXTURE_2D, at, It, qt[0].width, qt[0].height);
          for (let X = 0, J = qt.length; X < J; X++) mt = qt[X], Ot ? L && e.texSubImage2D(i.TEXTURE_2D, X, 0, 0, mt.width, mt.height, _t, Ct, mt.data) : e.texImage2D(i.TEXTURE_2D, X, It, mt.width, mt.height, 0, _t, Ct, mt.data);
          w.generateMipmaps = false;
        } else Ot ? (se && e.texStorage2D(i.TEXTURE_2D, at, It, nt.width, nt.height), L && e.texSubImage2D(i.TEXTURE_2D, 0, 0, 0, nt.width, nt.height, _t, Ct, nt.data)) : e.texImage2D(i.TEXTURE_2D, 0, It, nt.width, nt.height, 0, _t, Ct, nt.data);
        else if (w.isCompressedTexture) if (w.isCompressedArrayTexture) {
          Ot && se && e.texStorage3D(i.TEXTURE_2D_ARRAY, at, It, qt[0].width, qt[0].height, nt.depth);
          for (let X = 0, J = qt.length; X < J; X++) if (mt = qt[X], w.format !== an) if (_t !== null) if (Ot) {
            if (L) if (w.layerUpdates.size > 0) {
              const dt = jl(mt.width, mt.height, w.format, w.type);
              for (const ht of w.layerUpdates) {
                const Ut = mt.data.subarray(ht * dt / mt.data.BYTES_PER_ELEMENT, (ht + 1) * dt / mt.data.BYTES_PER_ELEMENT);
                e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY, X, 0, 0, ht, mt.width, mt.height, 1, _t, Ut);
              }
              w.clearLayerUpdates();
            } else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY, X, 0, 0, 0, mt.width, mt.height, nt.depth, _t, mt.data);
          } else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY, X, It, mt.width, mt.height, nt.depth, 0, mt.data, 0, 0);
          else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");
          else Ot ? L && e.texSubImage3D(i.TEXTURE_2D_ARRAY, X, 0, 0, 0, mt.width, mt.height, nt.depth, _t, Ct, mt.data) : e.texImage3D(i.TEXTURE_2D_ARRAY, X, It, mt.width, mt.height, nt.depth, 0, _t, Ct, mt.data);
        } else {
          Ot && se && e.texStorage2D(i.TEXTURE_2D, at, It, qt[0].width, qt[0].height);
          for (let X = 0, J = qt.length; X < J; X++) mt = qt[X], w.format !== an ? _t !== null ? Ot ? L && e.compressedTexSubImage2D(i.TEXTURE_2D, X, 0, 0, mt.width, mt.height, _t, mt.data) : e.compressedTexImage2D(i.TEXTURE_2D, X, It, mt.width, mt.height, 0, mt.data) : console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()") : Ot ? L && e.texSubImage2D(i.TEXTURE_2D, X, 0, 0, mt.width, mt.height, _t, Ct, mt.data) : e.texImage2D(i.TEXTURE_2D, X, It, mt.width, mt.height, 0, _t, Ct, mt.data);
        }
        else if (w.isDataArrayTexture) if (Ot) {
          if (se && e.texStorage3D(i.TEXTURE_2D_ARRAY, at, It, nt.width, nt.height, nt.depth), L) if (w.layerUpdates.size > 0) {
            const X = jl(nt.width, nt.height, w.format, w.type);
            for (const J of w.layerUpdates) {
              const dt = nt.data.subarray(J * X / nt.data.BYTES_PER_ELEMENT, (J + 1) * X / nt.data.BYTES_PER_ELEMENT);
              e.texSubImage3D(i.TEXTURE_2D_ARRAY, 0, 0, 0, J, nt.width, nt.height, 1, _t, Ct, dt);
            }
            w.clearLayerUpdates();
          } else e.texSubImage3D(i.TEXTURE_2D_ARRAY, 0, 0, 0, 0, nt.width, nt.height, nt.depth, _t, Ct, nt.data);
        } else e.texImage3D(i.TEXTURE_2D_ARRAY, 0, It, nt.width, nt.height, nt.depth, 0, _t, Ct, nt.data);
        else if (w.isData3DTexture) Ot ? (se && e.texStorage3D(i.TEXTURE_3D, at, It, nt.width, nt.height, nt.depth), L && e.texSubImage3D(i.TEXTURE_3D, 0, 0, 0, 0, nt.width, nt.height, nt.depth, _t, Ct, nt.data)) : e.texImage3D(i.TEXTURE_3D, 0, It, nt.width, nt.height, nt.depth, 0, _t, Ct, nt.data);
        else if (w.isFramebufferTexture) {
          if (se) if (Ot) e.texStorage2D(i.TEXTURE_2D, at, It, nt.width, nt.height);
          else {
            let X = nt.width, J = nt.height;
            for (let dt = 0; dt < at; dt++) e.texImage2D(i.TEXTURE_2D, dt, It, X, J, 0, _t, Ct, null), X >>= 1, J >>= 1;
          }
        } else if (qt.length > 0) {
          if (Ot && se) {
            const X = Tt(qt[0]);
            e.texStorage2D(i.TEXTURE_2D, at, It, X.width, X.height);
          }
          for (let X = 0, J = qt.length; X < J; X++) mt = qt[X], Ot ? L && e.texSubImage2D(i.TEXTURE_2D, X, 0, 0, _t, Ct, mt) : e.texImage2D(i.TEXTURE_2D, X, It, _t, Ct, mt);
          w.generateMipmaps = false;
        } else if (Ot) {
          if (se) {
            const X = Tt(nt);
            e.texStorage2D(i.TEXTURE_2D, at, It, X.width, X.height);
          }
          L && e.texSubImage2D(i.TEXTURE_2D, 0, 0, 0, _t, Ct, nt);
        } else e.texImage2D(i.TEXTURE_2D, 0, It, _t, Ct, nt);
        m(w) && d($), St.__version = K.version, w.onUpdate && w.onUpdate(w);
      }
      M.__version = w.version;
    }
    function rt(M, w, B) {
      if (w.image.length !== 6) return;
      const $ = ie(M, w), tt = w.source;
      e.bindTexture(i.TEXTURE_CUBE_MAP, M.__webglTexture, i.TEXTURE0 + B);
      const K = n.get(tt);
      if (tt.version !== K.__version || $ === true) {
        e.activeTexture(i.TEXTURE0 + B);
        const St = Zt.getPrimaries(Zt.workingColorSpace), ct = w.colorSpace === Gn ? null : Zt.getPrimaries(w.colorSpace), pt = w.colorSpace === Gn || St === ct ? i.NONE : i.BROWSER_DEFAULT_WEBGL;
        i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL, w.flipY), i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL, w.premultiplyAlpha), i.pixelStorei(i.UNPACK_ALIGNMENT, w.unpackAlignment), i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL, pt);
        const Kt = w.isCompressedTexture || w.image[0].isCompressedTexture, nt = w.image[0] && w.image[0].isDataTexture, _t = [];
        for (let J = 0; J < 6; J++) !Kt && !nt ? _t[J] = v(w.image[J], true, r.maxCubemapSize) : _t[J] = nt ? w.image[J].image : w.image[J], _t[J] = oe(w, _t[J]);
        const Ct = _t[0], It = s.convert(w.format, w.colorSpace), mt = s.convert(w.type), qt = E(w.internalFormat, It, mt, w.colorSpace), Ot = w.isVideoTexture !== true, se = K.__version === void 0 || $ === true, L = tt.dataReady;
        let at = H(w, Ct);
        Ht(i.TEXTURE_CUBE_MAP, w);
        let X;
        if (Kt) {
          Ot && se && e.texStorage2D(i.TEXTURE_CUBE_MAP, at, qt, Ct.width, Ct.height);
          for (let J = 0; J < 6; J++) {
            X = _t[J].mipmaps;
            for (let dt = 0; dt < X.length; dt++) {
              const ht = X[dt];
              w.format !== an ? It !== null ? Ot ? L && e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X + J, dt, 0, 0, ht.width, ht.height, It, ht.data) : e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X + J, dt, qt, ht.width, ht.height, 0, ht.data) : console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()") : Ot ? L && e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X + J, dt, 0, 0, ht.width, ht.height, It, mt, ht.data) : e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X + J, dt, qt, ht.width, ht.height, 0, It, mt, ht.data);
            }
          }
        } else {
          if (X = w.mipmaps, Ot && se) {
            X.length > 0 && at++;
            const J = Tt(_t[0]);
            e.texStorage2D(i.TEXTURE_CUBE_MAP, at, qt, J.width, J.height);
          }
          for (let J = 0; J < 6; J++) if (nt) {
            Ot ? L && e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X + J, 0, 0, 0, _t[J].width, _t[J].height, It, mt, _t[J].data) : e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X + J, 0, qt, _t[J].width, _t[J].height, 0, It, mt, _t[J].data);
            for (let dt = 0; dt < X.length; dt++) {
              const Ut = X[dt].image[J].image;
              Ot ? L && e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X + J, dt + 1, 0, 0, Ut.width, Ut.height, It, mt, Ut.data) : e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X + J, dt + 1, qt, Ut.width, Ut.height, 0, It, mt, Ut.data);
            }
          } else {
            Ot ? L && e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X + J, 0, 0, 0, It, mt, _t[J]) : e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X + J, 0, qt, It, mt, _t[J]);
            for (let dt = 0; dt < X.length; dt++) {
              const ht = X[dt];
              Ot ? L && e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X + J, dt + 1, 0, 0, It, mt, ht.image[J]) : e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X + J, dt + 1, qt, It, mt, ht.image[J]);
            }
          }
        }
        m(w) && d(i.TEXTURE_CUBE_MAP), K.__version = tt.version, w.onUpdate && w.onUpdate(w);
      }
      M.__version = w.version;
    }
    function xt(M, w, B, $, tt, K) {
      const St = s.convert(B.format, B.colorSpace), ct = s.convert(B.type), pt = E(B.internalFormat, St, ct, B.colorSpace), Kt = n.get(w), nt = n.get(B);
      if (nt.__renderTarget = w, !Kt.__hasExternalTextures) {
        const _t = Math.max(1, w.width >> K), Ct = Math.max(1, w.height >> K);
        tt === i.TEXTURE_3D || tt === i.TEXTURE_2D_ARRAY ? e.texImage3D(tt, K, pt, _t, Ct, w.depth, 0, St, ct, null) : e.texImage2D(tt, K, pt, _t, Ct, 0, St, ct, null);
      }
      e.bindFramebuffer(i.FRAMEBUFFER, M), Xt(w) ? o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER, $, tt, nt.__webglTexture, 0, Wt(w)) : (tt === i.TEXTURE_2D || tt >= i.TEXTURE_CUBE_MAP_POSITIVE_X && tt <= i.TEXTURE_CUBE_MAP_NEGATIVE_Z) && i.framebufferTexture2D(i.FRAMEBUFFER, $, tt, nt.__webglTexture, K), e.bindFramebuffer(i.FRAMEBUFFER, null);
    }
    function lt(M, w, B) {
      if (i.bindRenderbuffer(i.RENDERBUFFER, M), w.depthBuffer) {
        const $ = w.depthTexture, tt = $ && $.isDepthTexture ? $.type : null, K = y(w.stencilBuffer, tt), St = w.stencilBuffer ? i.DEPTH_STENCIL_ATTACHMENT : i.DEPTH_ATTACHMENT, ct = Wt(w);
        Xt(w) ? o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER, ct, K, w.width, w.height) : B ? i.renderbufferStorageMultisample(i.RENDERBUFFER, ct, K, w.width, w.height) : i.renderbufferStorage(i.RENDERBUFFER, K, w.width, w.height), i.framebufferRenderbuffer(i.FRAMEBUFFER, St, i.RENDERBUFFER, M);
      } else {
        const $ = w.textures;
        for (let tt = 0; tt < $.length; tt++) {
          const K = $[tt], St = s.convert(K.format, K.colorSpace), ct = s.convert(K.type), pt = E(K.internalFormat, St, ct, K.colorSpace), Kt = Wt(w);
          B && Xt(w) === false ? i.renderbufferStorageMultisample(i.RENDERBUFFER, Kt, pt, w.width, w.height) : Xt(w) ? o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER, Kt, pt, w.width, w.height) : i.renderbufferStorage(i.RENDERBUFFER, pt, w.width, w.height);
        }
      }
      i.bindRenderbuffer(i.RENDERBUFFER, null);
    }
    function Pt(M, w) {
      if (w && w.isWebGLCubeRenderTarget) throw new Error("Depth Texture with cube render targets is not supported");
      if (e.bindFramebuffer(i.FRAMEBUFFER, M), !(w.depthTexture && w.depthTexture.isDepthTexture)) throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");
      const $ = n.get(w.depthTexture);
      $.__renderTarget = w, (!$.__webglTexture || w.depthTexture.image.width !== w.width || w.depthTexture.image.height !== w.height) && (w.depthTexture.image.width = w.width, w.depthTexture.image.height = w.height, w.depthTexture.needsUpdate = true), Q(w.depthTexture, 0);
      const tt = $.__webglTexture, K = Wt(w);
      if (w.depthTexture.format === Di) Xt(w) ? o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER, i.DEPTH_ATTACHMENT, i.TEXTURE_2D, tt, 0, K) : i.framebufferTexture2D(i.FRAMEBUFFER, i.DEPTH_ATTACHMENT, i.TEXTURE_2D, tt, 0);
      else if (w.depthTexture.format === Hi) Xt(w) ? o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER, i.DEPTH_STENCIL_ATTACHMENT, i.TEXTURE_2D, tt, 0, K) : i.framebufferTexture2D(i.FRAMEBUFFER, i.DEPTH_STENCIL_ATTACHMENT, i.TEXTURE_2D, tt, 0);
      else throw new Error("Unknown depthTexture format");
    }
    function Dt(M) {
      const w = n.get(M), B = M.isWebGLCubeRenderTarget === true;
      if (w.__boundDepthTexture !== M.depthTexture) {
        const $ = M.depthTexture;
        if (w.__depthDisposeCallback && w.__depthDisposeCallback(), $) {
          const tt = () => {
            delete w.__boundDepthTexture, delete w.__depthDisposeCallback, $.removeEventListener("dispose", tt);
          };
          $.addEventListener("dispose", tt), w.__depthDisposeCallback = tt;
        }
        w.__boundDepthTexture = $;
      }
      if (M.depthTexture && !w.__autoAllocateDepthBuffer) {
        if (B) throw new Error("target.depthTexture not supported in Cube render targets");
        Pt(w.__webglFramebuffer, M);
      } else if (B) {
        w.__webglDepthbuffer = [];
        for (let $ = 0; $ < 6; $++) if (e.bindFramebuffer(i.FRAMEBUFFER, w.__webglFramebuffer[$]), w.__webglDepthbuffer[$] === void 0) w.__webglDepthbuffer[$] = i.createRenderbuffer(), lt(w.__webglDepthbuffer[$], M, false);
        else {
          const tt = M.stencilBuffer ? i.DEPTH_STENCIL_ATTACHMENT : i.DEPTH_ATTACHMENT, K = w.__webglDepthbuffer[$];
          i.bindRenderbuffer(i.RENDERBUFFER, K), i.framebufferRenderbuffer(i.FRAMEBUFFER, tt, i.RENDERBUFFER, K);
        }
      } else if (e.bindFramebuffer(i.FRAMEBUFFER, w.__webglFramebuffer), w.__webglDepthbuffer === void 0) w.__webglDepthbuffer = i.createRenderbuffer(), lt(w.__webglDepthbuffer, M, false);
      else {
        const $ = M.stencilBuffer ? i.DEPTH_STENCIL_ATTACHMENT : i.DEPTH_ATTACHMENT, tt = w.__webglDepthbuffer;
        i.bindRenderbuffer(i.RENDERBUFFER, tt), i.framebufferRenderbuffer(i.FRAMEBUFFER, $, i.RENDERBUFFER, tt);
      }
      e.bindFramebuffer(i.FRAMEBUFFER, null);
    }
    function Gt(M, w, B) {
      const $ = n.get(M);
      w !== void 0 && xt($.__webglFramebuffer, M, M.texture, i.COLOR_ATTACHMENT0, i.TEXTURE_2D, 0), B !== void 0 && Dt(M);
    }
    function de(M) {
      const w = M.texture, B = n.get(M), $ = n.get(w);
      M.addEventListener("dispose", A);
      const tt = M.textures, K = M.isWebGLCubeRenderTarget === true, St = tt.length > 1;
      if (St || ($.__webglTexture === void 0 && ($.__webglTexture = i.createTexture()), $.__version = w.version, a.memory.textures++), K) {
        B.__webglFramebuffer = [];
        for (let ct = 0; ct < 6; ct++) if (w.mipmaps && w.mipmaps.length > 0) {
          B.__webglFramebuffer[ct] = [];
          for (let pt = 0; pt < w.mipmaps.length; pt++) B.__webglFramebuffer[ct][pt] = i.createFramebuffer();
        } else B.__webglFramebuffer[ct] = i.createFramebuffer();
      } else {
        if (w.mipmaps && w.mipmaps.length > 0) {
          B.__webglFramebuffer = [];
          for (let ct = 0; ct < w.mipmaps.length; ct++) B.__webglFramebuffer[ct] = i.createFramebuffer();
        } else B.__webglFramebuffer = i.createFramebuffer();
        if (St) for (let ct = 0, pt = tt.length; ct < pt; ct++) {
          const Kt = n.get(tt[ct]);
          Kt.__webglTexture === void 0 && (Kt.__webglTexture = i.createTexture(), a.memory.textures++);
        }
        if (M.samples > 0 && Xt(M) === false) {
          B.__webglMultisampledFramebuffer = i.createFramebuffer(), B.__webglColorRenderbuffer = [], e.bindFramebuffer(i.FRAMEBUFFER, B.__webglMultisampledFramebuffer);
          for (let ct = 0; ct < tt.length; ct++) {
            const pt = tt[ct];
            B.__webglColorRenderbuffer[ct] = i.createRenderbuffer(), i.bindRenderbuffer(i.RENDERBUFFER, B.__webglColorRenderbuffer[ct]);
            const Kt = s.convert(pt.format, pt.colorSpace), nt = s.convert(pt.type), _t = E(pt.internalFormat, Kt, nt, pt.colorSpace, M.isXRRenderTarget === true), Ct = Wt(M);
            i.renderbufferStorageMultisample(i.RENDERBUFFER, Ct, _t, M.width, M.height), i.framebufferRenderbuffer(i.FRAMEBUFFER, i.COLOR_ATTACHMENT0 + ct, i.RENDERBUFFER, B.__webglColorRenderbuffer[ct]);
          }
          i.bindRenderbuffer(i.RENDERBUFFER, null), M.depthBuffer && (B.__webglDepthRenderbuffer = i.createRenderbuffer(), lt(B.__webglDepthRenderbuffer, M, true)), e.bindFramebuffer(i.FRAMEBUFFER, null);
        }
      }
      if (K) {
        e.bindTexture(i.TEXTURE_CUBE_MAP, $.__webglTexture), Ht(i.TEXTURE_CUBE_MAP, w);
        for (let ct = 0; ct < 6; ct++) if (w.mipmaps && w.mipmaps.length > 0) for (let pt = 0; pt < w.mipmaps.length; pt++) xt(B.__webglFramebuffer[ct][pt], M, w, i.COLOR_ATTACHMENT0, i.TEXTURE_CUBE_MAP_POSITIVE_X + ct, pt);
        else xt(B.__webglFramebuffer[ct], M, w, i.COLOR_ATTACHMENT0, i.TEXTURE_CUBE_MAP_POSITIVE_X + ct, 0);
        m(w) && d(i.TEXTURE_CUBE_MAP), e.unbindTexture();
      } else if (St) {
        for (let ct = 0, pt = tt.length; ct < pt; ct++) {
          const Kt = tt[ct], nt = n.get(Kt);
          e.bindTexture(i.TEXTURE_2D, nt.__webglTexture), Ht(i.TEXTURE_2D, Kt), xt(B.__webglFramebuffer, M, Kt, i.COLOR_ATTACHMENT0 + ct, i.TEXTURE_2D, 0), m(Kt) && d(i.TEXTURE_2D);
        }
        e.unbindTexture();
      } else {
        let ct = i.TEXTURE_2D;
        if ((M.isWebGL3DRenderTarget || M.isWebGLArrayRenderTarget) && (ct = M.isWebGL3DRenderTarget ? i.TEXTURE_3D : i.TEXTURE_2D_ARRAY), e.bindTexture(ct, $.__webglTexture), Ht(ct, w), w.mipmaps && w.mipmaps.length > 0) for (let pt = 0; pt < w.mipmaps.length; pt++) xt(B.__webglFramebuffer[pt], M, w, i.COLOR_ATTACHMENT0, ct, pt);
        else xt(B.__webglFramebuffer, M, w, i.COLOR_ATTACHMENT0, ct, 0);
        m(w) && d(ct), e.unbindTexture();
      }
      M.depthBuffer && Dt(M);
    }
    function Yt(M) {
      const w = M.textures;
      for (let B = 0, $ = w.length; B < $; B++) {
        const tt = w[B];
        if (m(tt)) {
          const K = T(M), St = n.get(tt).__webglTexture;
          e.bindTexture(K, St), d(K), e.unbindTexture();
        }
      }
    }
    const ge = [], O = [];
    function je(M) {
      if (M.samples > 0) {
        if (Xt(M) === false) {
          const w = M.textures, B = M.width, $ = M.height;
          let tt = i.COLOR_BUFFER_BIT;
          const K = M.stencilBuffer ? i.DEPTH_STENCIL_ATTACHMENT : i.DEPTH_ATTACHMENT, St = n.get(M), ct = w.length > 1;
          if (ct) for (let pt = 0; pt < w.length; pt++) e.bindFramebuffer(i.FRAMEBUFFER, St.__webglMultisampledFramebuffer), i.framebufferRenderbuffer(i.FRAMEBUFFER, i.COLOR_ATTACHMENT0 + pt, i.RENDERBUFFER, null), e.bindFramebuffer(i.FRAMEBUFFER, St.__webglFramebuffer), i.framebufferTexture2D(i.DRAW_FRAMEBUFFER, i.COLOR_ATTACHMENT0 + pt, i.TEXTURE_2D, null, 0);
          e.bindFramebuffer(i.READ_FRAMEBUFFER, St.__webglMultisampledFramebuffer), e.bindFramebuffer(i.DRAW_FRAMEBUFFER, St.__webglFramebuffer);
          for (let pt = 0; pt < w.length; pt++) {
            if (M.resolveDepthBuffer && (M.depthBuffer && (tt |= i.DEPTH_BUFFER_BIT), M.stencilBuffer && M.resolveStencilBuffer && (tt |= i.STENCIL_BUFFER_BIT)), ct) {
              i.framebufferRenderbuffer(i.READ_FRAMEBUFFER, i.COLOR_ATTACHMENT0, i.RENDERBUFFER, St.__webglColorRenderbuffer[pt]);
              const Kt = n.get(w[pt]).__webglTexture;
              i.framebufferTexture2D(i.DRAW_FRAMEBUFFER, i.COLOR_ATTACHMENT0, i.TEXTURE_2D, Kt, 0);
            }
            i.blitFramebuffer(0, 0, B, $, 0, 0, B, $, tt, i.NEAREST), l === true && (ge.length = 0, O.length = 0, ge.push(i.COLOR_ATTACHMENT0 + pt), M.depthBuffer && M.resolveDepthBuffer === false && (ge.push(K), O.push(K), i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER, O)), i.invalidateFramebuffer(i.READ_FRAMEBUFFER, ge));
          }
          if (e.bindFramebuffer(i.READ_FRAMEBUFFER, null), e.bindFramebuffer(i.DRAW_FRAMEBUFFER, null), ct) for (let pt = 0; pt < w.length; pt++) {
            e.bindFramebuffer(i.FRAMEBUFFER, St.__webglMultisampledFramebuffer), i.framebufferRenderbuffer(i.FRAMEBUFFER, i.COLOR_ATTACHMENT0 + pt, i.RENDERBUFFER, St.__webglColorRenderbuffer[pt]);
            const Kt = n.get(w[pt]).__webglTexture;
            e.bindFramebuffer(i.FRAMEBUFFER, St.__webglFramebuffer), i.framebufferTexture2D(i.DRAW_FRAMEBUFFER, i.COLOR_ATTACHMENT0 + pt, i.TEXTURE_2D, Kt, 0);
          }
          e.bindFramebuffer(i.DRAW_FRAMEBUFFER, St.__webglMultisampledFramebuffer);
        } else if (M.depthBuffer && M.resolveDepthBuffer === false && l) {
          const w = M.stencilBuffer ? i.DEPTH_STENCIL_ATTACHMENT : i.DEPTH_ATTACHMENT;
          i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER, [w]);
        }
      }
    }
    function Wt(M) {
      return Math.min(r.maxSamples, M.samples);
    }
    function Xt(M) {
      const w = n.get(M);
      return M.samples > 0 && t.has("WEBGL_multisampled_render_to_texture") === true && w.__useRenderToTexture !== false;
    }
    function Rt(M) {
      const w = a.render.frame;
      u.get(M) !== w && (u.set(M, w), M.update());
    }
    function oe(M, w) {
      const B = M.colorSpace, $ = M.format, tt = M.type;
      return M.isCompressedTexture === true || M.isVideoTexture === true || B !== Wi && B !== Gn && (Zt.getTransfer(B) === ne ? ($ !== an || tt !== Cn) && console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.") : console.error("THREE.WebGLTextures: Unsupported texture color space:", B)), w;
    }
    function Tt(M) {
      return typeof HTMLImageElement < "u" && M instanceof HTMLImageElement ? (c.width = M.naturalWidth || M.width, c.height = M.naturalHeight || M.height) : typeof VideoFrame < "u" && M instanceof VideoFrame ? (c.width = M.displayWidth, c.height = M.displayHeight) : (c.width = M.width, c.height = M.height), c;
    }
    this.allocateTextureUnit = V, this.resetTextureUnits = W, this.setTexture2D = Q, this.setTexture2DArray = j, this.setTexture3D = et, this.setTextureCube = q, this.rebindTextures = Gt, this.setupRenderTarget = de, this.updateRenderTargetMipmap = Yt, this.updateMultisampleRenderTarget = je, this.setupDepthRenderbuffer = Dt, this.setupFrameBufferTexture = xt, this.useMultisampledRTT = Xt;
  }
  function zm(i, t) {
    function e(n, r = Gn) {
      let s;
      const a = Zt.getTransfer(r);
      if (n === Cn) return i.UNSIGNED_BYTE;
      if (n === co) return i.UNSIGNED_SHORT_4_4_4_4;
      if (n === ho) return i.UNSIGNED_SHORT_5_5_5_1;
      if (n === Ic) return i.UNSIGNED_INT_5_9_9_9_REV;
      if (n === Cc) return i.BYTE;
      if (n === Pc) return i.SHORT;
      if (n === lr) return i.UNSIGNED_SHORT;
      if (n === lo) return i.INT;
      if (n === hi) return i.UNSIGNED_INT;
      if (n === Tn) return i.FLOAT;
      if (n === fr) return i.HALF_FLOAT;
      if (n === Lc) return i.ALPHA;
      if (n === Dc) return i.RGB;
      if (n === an) return i.RGBA;
      if (n === Uc) return i.LUMINANCE;
      if (n === Fc) return i.LUMINANCE_ALPHA;
      if (n === Di) return i.DEPTH_COMPONENT;
      if (n === Hi) return i.DEPTH_STENCIL;
      if (n === Nc) return i.RED;
      if (n === uo) return i.RED_INTEGER;
      if (n === Oc) return i.RG;
      if (n === fo) return i.RG_INTEGER;
      if (n === po) return i.RGBA_INTEGER;
      if (n === $r || n === Jr || n === Qr || n === ts) if (a === ne) if (s = t.get("WEBGL_compressed_texture_s3tc_srgb"), s !== null) {
        if (n === $r) return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;
        if (n === Jr) return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;
        if (n === Qr) return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;
        if (n === ts) return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT;
      } else return null;
      else if (s = t.get("WEBGL_compressed_texture_s3tc"), s !== null) {
        if (n === $r) return s.COMPRESSED_RGB_S3TC_DXT1_EXT;
        if (n === Jr) return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;
        if (n === Qr) return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;
        if (n === ts) return s.COMPRESSED_RGBA_S3TC_DXT5_EXT;
      } else return null;
      if (n === Sa || n === ya || n === Ma || n === Ea) if (s = t.get("WEBGL_compressed_texture_pvrtc"), s !== null) {
        if (n === Sa) return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
        if (n === ya) return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;
        if (n === Ma) return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
        if (n === Ea) return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG;
      } else return null;
      if (n === Ta || n === Ra || n === Aa) if (s = t.get("WEBGL_compressed_texture_etc"), s !== null) {
        if (n === Ta || n === Ra) return a === ne ? s.COMPRESSED_SRGB8_ETC2 : s.COMPRESSED_RGB8_ETC2;
        if (n === Aa) return a === ne ? s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC : s.COMPRESSED_RGBA8_ETC2_EAC;
      } else return null;
      if (n === Ca || n === Pa || n === Ia || n === La || n === Da || n === Ua || n === Fa || n === Na || n === Oa || n === za || n === Ba || n === Ha || n === Ga || n === ka) if (s = t.get("WEBGL_compressed_texture_astc"), s !== null) {
        if (n === Ca) return a === ne ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR : s.COMPRESSED_RGBA_ASTC_4x4_KHR;
        if (n === Pa) return a === ne ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR : s.COMPRESSED_RGBA_ASTC_5x4_KHR;
        if (n === Ia) return a === ne ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR : s.COMPRESSED_RGBA_ASTC_5x5_KHR;
        if (n === La) return a === ne ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR : s.COMPRESSED_RGBA_ASTC_6x5_KHR;
        if (n === Da) return a === ne ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR : s.COMPRESSED_RGBA_ASTC_6x6_KHR;
        if (n === Ua) return a === ne ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR : s.COMPRESSED_RGBA_ASTC_8x5_KHR;
        if (n === Fa) return a === ne ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR : s.COMPRESSED_RGBA_ASTC_8x6_KHR;
        if (n === Na) return a === ne ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR : s.COMPRESSED_RGBA_ASTC_8x8_KHR;
        if (n === Oa) return a === ne ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR : s.COMPRESSED_RGBA_ASTC_10x5_KHR;
        if (n === za) return a === ne ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR : s.COMPRESSED_RGBA_ASTC_10x6_KHR;
        if (n === Ba) return a === ne ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR : s.COMPRESSED_RGBA_ASTC_10x8_KHR;
        if (n === Ha) return a === ne ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR : s.COMPRESSED_RGBA_ASTC_10x10_KHR;
        if (n === Ga) return a === ne ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR : s.COMPRESSED_RGBA_ASTC_12x10_KHR;
        if (n === ka) return a === ne ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR : s.COMPRESSED_RGBA_ASTC_12x12_KHR;
      } else return null;
      if (n === es || n === Va || n === Wa) if (s = t.get("EXT_texture_compression_bptc"), s !== null) {
        if (n === es) return a === ne ? s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT : s.COMPRESSED_RGBA_BPTC_UNORM_EXT;
        if (n === Va) return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;
        if (n === Wa) return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT;
      } else return null;
      if (n === zc || n === Xa || n === qa || n === ja) if (s = t.get("EXT_texture_compression_rgtc"), s !== null) {
        if (n === es) return s.COMPRESSED_RED_RGTC1_EXT;
        if (n === Xa) return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;
        if (n === qa) return s.COMPRESSED_RED_GREEN_RGTC2_EXT;
        if (n === ja) return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT;
      } else return null;
      return n === Bi ? i.UNSIGNED_INT_24_8 : i[n] !== void 0 ? i[n] : null;
    }
    return { convert: e };
  }
  class Bm extends $e {
    constructor(t = []) {
      super(), this.isArrayCamera = true, this.cameras = t;
    }
  }
  class Ii extends Ae {
    constructor() {
      super(), this.isGroup = true, this.type = "Group";
    }
  }
  const Hm = { type: "move" };
  class aa {
    constructor() {
      this._targetRay = null, this._grip = null, this._hand = null;
    }
    getHandSpace() {
      return this._hand === null && (this._hand = new Ii(), this._hand.matrixAutoUpdate = false, this._hand.visible = false, this._hand.joints = {}, this._hand.inputState = { pinching: false }), this._hand;
    }
    getTargetRaySpace() {
      return this._targetRay === null && (this._targetRay = new Ii(), this._targetRay.matrixAutoUpdate = false, this._targetRay.visible = false, this._targetRay.hasLinearVelocity = false, this._targetRay.linearVelocity = new z(), this._targetRay.hasAngularVelocity = false, this._targetRay.angularVelocity = new z()), this._targetRay;
    }
    getGripSpace() {
      return this._grip === null && (this._grip = new Ii(), this._grip.matrixAutoUpdate = false, this._grip.visible = false, this._grip.hasLinearVelocity = false, this._grip.linearVelocity = new z(), this._grip.hasAngularVelocity = false, this._grip.angularVelocity = new z()), this._grip;
    }
    dispatchEvent(t) {
      return this._targetRay !== null && this._targetRay.dispatchEvent(t), this._grip !== null && this._grip.dispatchEvent(t), this._hand !== null && this._hand.dispatchEvent(t), this;
    }
    connect(t) {
      if (t && t.hand) {
        const e = this._hand;
        if (e) for (const n of t.hand.values()) this._getHandJoint(e, n);
      }
      return this.dispatchEvent({ type: "connected", data: t }), this;
    }
    disconnect(t) {
      return this.dispatchEvent({ type: "disconnected", data: t }), this._targetRay !== null && (this._targetRay.visible = false), this._grip !== null && (this._grip.visible = false), this._hand !== null && (this._hand.visible = false), this;
    }
    update(t, e, n) {
      let r = null, s = null, a = null;
      const o = this._targetRay, l = this._grip, c = this._hand;
      if (t && e.session.visibilityState !== "visible-blurred") {
        if (c && t.hand) {
          a = true;
          for (const v of t.hand.values()) {
            const m = e.getJointPose(v, n), d = this._getHandJoint(c, v);
            m !== null && (d.matrix.fromArray(m.transform.matrix), d.matrix.decompose(d.position, d.rotation, d.scale), d.matrixWorldNeedsUpdate = true, d.jointRadius = m.radius), d.visible = m !== null;
          }
          const u = c.joints["index-finger-tip"], f = c.joints["thumb-tip"], p = u.position.distanceTo(f.position), _ = 0.02, g = 5e-3;
          c.inputState.pinching && p > _ + g ? (c.inputState.pinching = false, this.dispatchEvent({ type: "pinchend", handedness: t.handedness, target: this })) : !c.inputState.pinching && p <= _ - g && (c.inputState.pinching = true, this.dispatchEvent({ type: "pinchstart", handedness: t.handedness, target: this }));
        } else l !== null && t.gripSpace && (s = e.getPose(t.gripSpace, n), s !== null && (l.matrix.fromArray(s.transform.matrix), l.matrix.decompose(l.position, l.rotation, l.scale), l.matrixWorldNeedsUpdate = true, s.linearVelocity ? (l.hasLinearVelocity = true, l.linearVelocity.copy(s.linearVelocity)) : l.hasLinearVelocity = false, s.angularVelocity ? (l.hasAngularVelocity = true, l.angularVelocity.copy(s.angularVelocity)) : l.hasAngularVelocity = false));
        o !== null && (r = e.getPose(t.targetRaySpace, n), r === null && s !== null && (r = s), r !== null && (o.matrix.fromArray(r.transform.matrix), o.matrix.decompose(o.position, o.rotation, o.scale), o.matrixWorldNeedsUpdate = true, r.linearVelocity ? (o.hasLinearVelocity = true, o.linearVelocity.copy(r.linearVelocity)) : o.hasLinearVelocity = false, r.angularVelocity ? (o.hasAngularVelocity = true, o.angularVelocity.copy(r.angularVelocity)) : o.hasAngularVelocity = false, this.dispatchEvent(Hm)));
      }
      return o !== null && (o.visible = r !== null), l !== null && (l.visible = s !== null), c !== null && (c.visible = a !== null), this;
    }
    _getHandJoint(t, e) {
      if (t.joints[e.jointName] === void 0) {
        const n = new Ii();
        n.matrixAutoUpdate = false, n.visible = false, t.joints[e.jointName] = n, t.add(n);
      }
      return t.joints[e.jointName];
    }
  }
  const Gm = `
void main() {

	gl_Position = vec4( position, 1.0 );

}`, km = `
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;
  class Vm {
    constructor() {
      this.texture = null, this.mesh = null, this.depthNear = 0, this.depthFar = 0;
    }
    init(t, e, n) {
      if (this.texture === null) {
        const r = new Be(), s = t.properties.get(r);
        s.__webglTexture = e.texture, (e.depthNear != n.depthNear || e.depthFar != n.depthFar) && (this.depthNear = e.depthNear, this.depthFar = e.depthFar), this.texture = r;
      }
    }
    getMesh(t) {
      if (this.texture !== null && this.mesh === null) {
        const e = t.cameras[0].viewport, n = new Xn({ vertexShader: Gm, fragmentShader: km, uniforms: { depthColor: { value: this.texture }, depthWidth: { value: e.z }, depthHeight: { value: e.w } } });
        this.mesh = new Re(new xs(20, 20), n);
      }
      return this.mesh;
    }
    reset() {
      this.texture = null, this.mesh = null;
    }
    getDepthTexture() {
      return this.texture;
    }
  }
  class Wm extends Xi {
    constructor(t, e) {
      super();
      const n = this;
      let r = null, s = 1, a = null, o = "local-floor", l = 1, c = null, u = null, f = null, p = null, _ = null, g = null;
      const v = new Vm(), m = e.getContextAttributes();
      let d = null, T = null;
      const E = [], y = [], H = new Jt();
      let P = null;
      const A = new $e();
      A.viewport = new me();
      const N = new $e();
      N.viewport = new me();
      const S = [A, N], x = new Bm();
      let C = null, W = null;
      this.cameraAutoUpdate = true, this.enabled = false, this.isPresenting = false, this.getController = function(Z) {
        let rt = E[Z];
        return rt === void 0 && (rt = new aa(), E[Z] = rt), rt.getTargetRaySpace();
      }, this.getControllerGrip = function(Z) {
        let rt = E[Z];
        return rt === void 0 && (rt = new aa(), E[Z] = rt), rt.getGripSpace();
      }, this.getHand = function(Z) {
        let rt = E[Z];
        return rt === void 0 && (rt = new aa(), E[Z] = rt), rt.getHandSpace();
      };
      function V(Z) {
        const rt = y.indexOf(Z.inputSource);
        if (rt === -1) return;
        const xt = E[rt];
        xt !== void 0 && (xt.update(Z.inputSource, Z.frame, c || a), xt.dispatchEvent({ type: Z.type, data: Z.inputSource }));
      }
      function Y() {
        r.removeEventListener("select", V), r.removeEventListener("selectstart", V), r.removeEventListener("selectend", V), r.removeEventListener("squeeze", V), r.removeEventListener("squeezestart", V), r.removeEventListener("squeezeend", V), r.removeEventListener("end", Y), r.removeEventListener("inputsourceschange", Q);
        for (let Z = 0; Z < E.length; Z++) {
          const rt = y[Z];
          rt !== null && (y[Z] = null, E[Z].disconnect(rt));
        }
        C = null, W = null, v.reset(), t.setRenderTarget(d), _ = null, p = null, f = null, r = null, T = null, ie.stop(), n.isPresenting = false, t.setPixelRatio(P), t.setSize(H.width, H.height, false), n.dispatchEvent({ type: "sessionend" });
      }
      this.setFramebufferScaleFactor = function(Z) {
        s = Z, n.isPresenting === true && console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.");
      }, this.setReferenceSpaceType = function(Z) {
        o = Z, n.isPresenting === true && console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.");
      }, this.getReferenceSpace = function() {
        return c || a;
      }, this.setReferenceSpace = function(Z) {
        c = Z;
      }, this.getBaseLayer = function() {
        return p !== null ? p : _;
      }, this.getBinding = function() {
        return f;
      }, this.getFrame = function() {
        return g;
      }, this.getSession = function() {
        return r;
      }, this.setSession = async function(Z) {
        if (r = Z, r !== null) {
          if (d = t.getRenderTarget(), r.addEventListener("select", V), r.addEventListener("selectstart", V), r.addEventListener("selectend", V), r.addEventListener("squeeze", V), r.addEventListener("squeezestart", V), r.addEventListener("squeezeend", V), r.addEventListener("end", Y), r.addEventListener("inputsourceschange", Q), m.xrCompatible !== true && await e.makeXRCompatible(), P = t.getPixelRatio(), t.getSize(H), r.renderState.layers === void 0) {
            const rt = { antialias: m.antialias, alpha: true, depth: m.depth, stencil: m.stencil, framebufferScaleFactor: s };
            _ = new XRWebGLLayer(r, e, rt), r.updateRenderState({ baseLayer: _ }), t.setPixelRatio(1), t.setSize(_.framebufferWidth, _.framebufferHeight, false), T = new ui(_.framebufferWidth, _.framebufferHeight, { format: an, type: Cn, colorSpace: t.outputColorSpace, stencilBuffer: m.stencil });
          } else {
            let rt = null, xt = null, lt = null;
            m.depth && (lt = m.stencil ? e.DEPTH24_STENCIL8 : e.DEPTH_COMPONENT24, rt = m.stencil ? Hi : Di, xt = m.stencil ? Bi : hi);
            const Pt = { colorFormat: e.RGBA8, depthFormat: lt, scaleFactor: s };
            f = new XRWebGLBinding(r, e), p = f.createProjectionLayer(Pt), r.updateRenderState({ layers: [p] }), t.setPixelRatio(1), t.setSize(p.textureWidth, p.textureHeight, false), T = new ui(p.textureWidth, p.textureHeight, { format: an, type: Cn, depthTexture: new eh(p.textureWidth, p.textureHeight, xt, void 0, void 0, void 0, void 0, void 0, void 0, rt), stencilBuffer: m.stencil, colorSpace: t.outputColorSpace, samples: m.antialias ? 4 : 0, resolveDepthBuffer: p.ignoreDepthValues === false });
          }
          T.isXRRenderTarget = true, this.setFoveation(l), c = null, a = await r.requestReferenceSpace(o), ie.setContext(r), ie.start(), n.isPresenting = true, n.dispatchEvent({ type: "sessionstart" });
        }
      }, this.getEnvironmentBlendMode = function() {
        if (r !== null) return r.environmentBlendMode;
      }, this.getDepthTexture = function() {
        return v.getDepthTexture();
      };
      function Q(Z) {
        for (let rt = 0; rt < Z.removed.length; rt++) {
          const xt = Z.removed[rt], lt = y.indexOf(xt);
          lt >= 0 && (y[lt] = null, E[lt].disconnect(xt));
        }
        for (let rt = 0; rt < Z.added.length; rt++) {
          const xt = Z.added[rt];
          let lt = y.indexOf(xt);
          if (lt === -1) {
            for (let Dt = 0; Dt < E.length; Dt++) if (Dt >= y.length) {
              y.push(xt), lt = Dt;
              break;
            } else if (y[Dt] === null) {
              y[Dt] = xt, lt = Dt;
              break;
            }
            if (lt === -1) break;
          }
          const Pt = E[lt];
          Pt && Pt.connect(xt);
        }
      }
      const j = new z(), et = new z();
      function q(Z, rt, xt) {
        j.setFromMatrixPosition(rt.matrixWorld), et.setFromMatrixPosition(xt.matrixWorld);
        const lt = j.distanceTo(et), Pt = rt.projectionMatrix.elements, Dt = xt.projectionMatrix.elements, Gt = Pt[14] / (Pt[10] - 1), de = Pt[14] / (Pt[10] + 1), Yt = (Pt[9] + 1) / Pt[5], ge = (Pt[9] - 1) / Pt[5], O = (Pt[8] - 1) / Pt[0], je = (Dt[8] + 1) / Dt[0], Wt = Gt * O, Xt = Gt * je, Rt = lt / (-O + je), oe = Rt * -O;
        if (rt.matrixWorld.decompose(Z.position, Z.quaternion, Z.scale), Z.translateX(oe), Z.translateZ(Rt), Z.matrixWorld.compose(Z.position, Z.quaternion, Z.scale), Z.matrixWorldInverse.copy(Z.matrixWorld).invert(), Pt[10] === -1) Z.projectionMatrix.copy(rt.projectionMatrix), Z.projectionMatrixInverse.copy(rt.projectionMatrixInverse);
        else {
          const Tt = Gt + Rt, M = de + Rt, w = Wt - oe, B = Xt + (lt - oe), $ = Yt * de / M * Tt, tt = ge * de / M * Tt;
          Z.projectionMatrix.makePerspective(w, B, $, tt, Tt, M), Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert();
        }
      }
      function ot(Z, rt) {
        rt === null ? Z.matrixWorld.copy(Z.matrix) : Z.matrixWorld.multiplyMatrices(rt.matrixWorld, Z.matrix), Z.matrixWorldInverse.copy(Z.matrixWorld).invert();
      }
      this.updateCamera = function(Z) {
        if (r === null) return;
        let rt = Z.near, xt = Z.far;
        v.texture !== null && (v.depthNear > 0 && (rt = v.depthNear), v.depthFar > 0 && (xt = v.depthFar)), x.near = N.near = A.near = rt, x.far = N.far = A.far = xt, (C !== x.near || W !== x.far) && (r.updateRenderState({ depthNear: x.near, depthFar: x.far }), C = x.near, W = x.far), A.layers.mask = Z.layers.mask | 2, N.layers.mask = Z.layers.mask | 4, x.layers.mask = A.layers.mask | N.layers.mask;
        const lt = Z.parent, Pt = x.cameras;
        ot(x, lt);
        for (let Dt = 0; Dt < Pt.length; Dt++) ot(Pt[Dt], lt);
        Pt.length === 2 ? q(x, A, N) : x.projectionMatrix.copy(A.projectionMatrix), ft(Z, x, lt);
      };
      function ft(Z, rt, xt) {
        xt === null ? Z.matrix.copy(rt.matrixWorld) : (Z.matrix.copy(xt.matrixWorld), Z.matrix.invert(), Z.matrix.multiply(rt.matrixWorld)), Z.matrix.decompose(Z.position, Z.quaternion, Z.scale), Z.updateMatrixWorld(true), Z.projectionMatrix.copy(rt.projectionMatrix), Z.projectionMatrixInverse.copy(rt.projectionMatrixInverse), Z.isPerspectiveCamera && (Z.fov = Ya * 2 * Math.atan(1 / Z.projectionMatrix.elements[5]), Z.zoom = 1);
      }
      this.getCamera = function() {
        return x;
      }, this.getFoveation = function() {
        if (!(p === null && _ === null)) return l;
      }, this.setFoveation = function(Z) {
        l = Z, p !== null && (p.fixedFoveation = Z), _ !== null && _.fixedFoveation !== void 0 && (_.fixedFoveation = Z);
      }, this.hasDepthSensing = function() {
        return v.texture !== null;
      }, this.getDepthSensingMesh = function() {
        return v.getMesh(x);
      };
      let Mt = null;
      function Ht(Z, rt) {
        if (u = rt.getViewerPose(c || a), g = rt, u !== null) {
          const xt = u.views;
          _ !== null && (t.setRenderTargetFramebuffer(T, _.framebuffer), t.setRenderTarget(T));
          let lt = false;
          xt.length !== x.cameras.length && (x.cameras.length = 0, lt = true);
          for (let Dt = 0; Dt < xt.length; Dt++) {
            const Gt = xt[Dt];
            let de = null;
            if (_ !== null) de = _.getViewport(Gt);
            else {
              const ge = f.getViewSubImage(p, Gt);
              de = ge.viewport, Dt === 0 && (t.setRenderTargetTextures(T, ge.colorTexture, p.ignoreDepthValues ? void 0 : ge.depthStencilTexture), t.setRenderTarget(T));
            }
            let Yt = S[Dt];
            Yt === void 0 && (Yt = new $e(), Yt.layers.enable(Dt), Yt.viewport = new me(), S[Dt] = Yt), Yt.matrix.fromArray(Gt.transform.matrix), Yt.matrix.decompose(Yt.position, Yt.quaternion, Yt.scale), Yt.projectionMatrix.fromArray(Gt.projectionMatrix), Yt.projectionMatrixInverse.copy(Yt.projectionMatrix).invert(), Yt.viewport.set(de.x, de.y, de.width, de.height), Dt === 0 && (x.matrix.copy(Yt.matrix), x.matrix.decompose(x.position, x.quaternion, x.scale)), lt === true && x.cameras.push(Yt);
          }
          const Pt = r.enabledFeatures;
          if (Pt && Pt.includes("depth-sensing")) {
            const Dt = f.getDepthInformation(xt[0]);
            Dt && Dt.isValid && Dt.texture && v.init(t, Dt, r.renderState);
          }
        }
        for (let xt = 0; xt < E.length; xt++) {
          const lt = y[xt], Pt = E[xt];
          lt !== null && Pt !== void 0 && Pt.update(lt, rt, c || a);
        }
        Mt && Mt(Z, rt), rt.detectedPlanes && n.dispatchEvent({ type: "planesdetected", data: rt }), g = null;
      }
      const ie = new Qc();
      ie.setAnimationLoop(Ht), this.setAnimationLoop = function(Z) {
        Mt = Z;
      }, this.dispose = function() {
      };
    }
  }
  const ti = new pn(), Xm = new pe();
  function qm(i, t) {
    function e(m, d) {
      m.matrixAutoUpdate === true && m.updateMatrix(), d.value.copy(m.matrix);
    }
    function n(m, d) {
      d.color.getRGB(m.fogColor.value, Zc(i)), d.isFog ? (m.fogNear.value = d.near, m.fogFar.value = d.far) : d.isFogExp2 && (m.fogDensity.value = d.density);
    }
    function r(m, d, T, E, y) {
      d.isMeshBasicMaterial || d.isMeshLambertMaterial ? s(m, d) : d.isMeshToonMaterial ? (s(m, d), f(m, d)) : d.isMeshPhongMaterial ? (s(m, d), u(m, d)) : d.isMeshStandardMaterial ? (s(m, d), p(m, d), d.isMeshPhysicalMaterial && _(m, d, y)) : d.isMeshMatcapMaterial ? (s(m, d), g(m, d)) : d.isMeshDepthMaterial ? s(m, d) : d.isMeshDistanceMaterial ? (s(m, d), v(m, d)) : d.isMeshNormalMaterial ? s(m, d) : d.isLineBasicMaterial ? (a(m, d), d.isLineDashedMaterial && o(m, d)) : d.isPointsMaterial ? l(m, d, T, E) : d.isSpriteMaterial ? c(m, d) : d.isShadowMaterial ? (m.color.value.copy(d.color), m.opacity.value = d.opacity) : d.isShaderMaterial && (d.uniformsNeedUpdate = false);
    }
    function s(m, d) {
      m.opacity.value = d.opacity, d.color && m.diffuse.value.copy(d.color), d.emissive && m.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity), d.map && (m.map.value = d.map, e(d.map, m.mapTransform)), d.alphaMap && (m.alphaMap.value = d.alphaMap, e(d.alphaMap, m.alphaMapTransform)), d.bumpMap && (m.bumpMap.value = d.bumpMap, e(d.bumpMap, m.bumpMapTransform), m.bumpScale.value = d.bumpScale, d.side === ze && (m.bumpScale.value *= -1)), d.normalMap && (m.normalMap.value = d.normalMap, e(d.normalMap, m.normalMapTransform), m.normalScale.value.copy(d.normalScale), d.side === ze && m.normalScale.value.negate()), d.displacementMap && (m.displacementMap.value = d.displacementMap, e(d.displacementMap, m.displacementMapTransform), m.displacementScale.value = d.displacementScale, m.displacementBias.value = d.displacementBias), d.emissiveMap && (m.emissiveMap.value = d.emissiveMap, e(d.emissiveMap, m.emissiveMapTransform)), d.specularMap && (m.specularMap.value = d.specularMap, e(d.specularMap, m.specularMapTransform)), d.alphaTest > 0 && (m.alphaTest.value = d.alphaTest);
      const T = t.get(d), E = T.envMap, y = T.envMapRotation;
      E && (m.envMap.value = E, ti.copy(y), ti.x *= -1, ti.y *= -1, ti.z *= -1, E.isCubeTexture && E.isRenderTargetTexture === false && (ti.y *= -1, ti.z *= -1), m.envMapRotation.value.setFromMatrix4(Xm.makeRotationFromEuler(ti)), m.flipEnvMap.value = E.isCubeTexture && E.isRenderTargetTexture === false ? -1 : 1, m.reflectivity.value = d.reflectivity, m.ior.value = d.ior, m.refractionRatio.value = d.refractionRatio), d.lightMap && (m.lightMap.value = d.lightMap, m.lightMapIntensity.value = d.lightMapIntensity, e(d.lightMap, m.lightMapTransform)), d.aoMap && (m.aoMap.value = d.aoMap, m.aoMapIntensity.value = d.aoMapIntensity, e(d.aoMap, m.aoMapTransform));
    }
    function a(m, d) {
      m.diffuse.value.copy(d.color), m.opacity.value = d.opacity, d.map && (m.map.value = d.map, e(d.map, m.mapTransform));
    }
    function o(m, d) {
      m.dashSize.value = d.dashSize, m.totalSize.value = d.dashSize + d.gapSize, m.scale.value = d.scale;
    }
    function l(m, d, T, E) {
      m.diffuse.value.copy(d.color), m.opacity.value = d.opacity, m.size.value = d.size * T, m.scale.value = E * 0.5, d.map && (m.map.value = d.map, e(d.map, m.uvTransform)), d.alphaMap && (m.alphaMap.value = d.alphaMap, e(d.alphaMap, m.alphaMapTransform)), d.alphaTest > 0 && (m.alphaTest.value = d.alphaTest);
    }
    function c(m, d) {
      m.diffuse.value.copy(d.color), m.opacity.value = d.opacity, m.rotation.value = d.rotation, d.map && (m.map.value = d.map, e(d.map, m.mapTransform)), d.alphaMap && (m.alphaMap.value = d.alphaMap, e(d.alphaMap, m.alphaMapTransform)), d.alphaTest > 0 && (m.alphaTest.value = d.alphaTest);
    }
    function u(m, d) {
      m.specular.value.copy(d.specular), m.shininess.value = Math.max(d.shininess, 1e-4);
    }
    function f(m, d) {
      d.gradientMap && (m.gradientMap.value = d.gradientMap);
    }
    function p(m, d) {
      m.metalness.value = d.metalness, d.metalnessMap && (m.metalnessMap.value = d.metalnessMap, e(d.metalnessMap, m.metalnessMapTransform)), m.roughness.value = d.roughness, d.roughnessMap && (m.roughnessMap.value = d.roughnessMap, e(d.roughnessMap, m.roughnessMapTransform)), d.envMap && (m.envMapIntensity.value = d.envMapIntensity);
    }
    function _(m, d, T) {
      m.ior.value = d.ior, d.sheen > 0 && (m.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen), m.sheenRoughness.value = d.sheenRoughness, d.sheenColorMap && (m.sheenColorMap.value = d.sheenColorMap, e(d.sheenColorMap, m.sheenColorMapTransform)), d.sheenRoughnessMap && (m.sheenRoughnessMap.value = d.sheenRoughnessMap, e(d.sheenRoughnessMap, m.sheenRoughnessMapTransform))), d.clearcoat > 0 && (m.clearcoat.value = d.clearcoat, m.clearcoatRoughness.value = d.clearcoatRoughness, d.clearcoatMap && (m.clearcoatMap.value = d.clearcoatMap, e(d.clearcoatMap, m.clearcoatMapTransform)), d.clearcoatRoughnessMap && (m.clearcoatRoughnessMap.value = d.clearcoatRoughnessMap, e(d.clearcoatRoughnessMap, m.clearcoatRoughnessMapTransform)), d.clearcoatNormalMap && (m.clearcoatNormalMap.value = d.clearcoatNormalMap, e(d.clearcoatNormalMap, m.clearcoatNormalMapTransform), m.clearcoatNormalScale.value.copy(d.clearcoatNormalScale), d.side === ze && m.clearcoatNormalScale.value.negate())), d.dispersion > 0 && (m.dispersion.value = d.dispersion), d.iridescence > 0 && (m.iridescence.value = d.iridescence, m.iridescenceIOR.value = d.iridescenceIOR, m.iridescenceThicknessMinimum.value = d.iridescenceThicknessRange[0], m.iridescenceThicknessMaximum.value = d.iridescenceThicknessRange[1], d.iridescenceMap && (m.iridescenceMap.value = d.iridescenceMap, e(d.iridescenceMap, m.iridescenceMapTransform)), d.iridescenceThicknessMap && (m.iridescenceThicknessMap.value = d.iridescenceThicknessMap, e(d.iridescenceThicknessMap, m.iridescenceThicknessMapTransform))), d.transmission > 0 && (m.transmission.value = d.transmission, m.transmissionSamplerMap.value = T.texture, m.transmissionSamplerSize.value.set(T.width, T.height), d.transmissionMap && (m.transmissionMap.value = d.transmissionMap, e(d.transmissionMap, m.transmissionMapTransform)), m.thickness.value = d.thickness, d.thicknessMap && (m.thicknessMap.value = d.thicknessMap, e(d.thicknessMap, m.thicknessMapTransform)), m.attenuationDistance.value = d.attenuationDistance, m.attenuationColor.value.copy(d.attenuationColor)), d.anisotropy > 0 && (m.anisotropyVector.value.set(d.anisotropy * Math.cos(d.anisotropyRotation), d.anisotropy * Math.sin(d.anisotropyRotation)), d.anisotropyMap && (m.anisotropyMap.value = d.anisotropyMap, e(d.anisotropyMap, m.anisotropyMapTransform))), m.specularIntensity.value = d.specularIntensity, m.specularColor.value.copy(d.specularColor), d.specularColorMap && (m.specularColorMap.value = d.specularColorMap, e(d.specularColorMap, m.specularColorMapTransform)), d.specularIntensityMap && (m.specularIntensityMap.value = d.specularIntensityMap, e(d.specularIntensityMap, m.specularIntensityMapTransform));
    }
    function g(m, d) {
      d.matcap && (m.matcap.value = d.matcap);
    }
    function v(m, d) {
      const T = t.get(d).light;
      m.referencePosition.value.setFromMatrixPosition(T.matrixWorld), m.nearDistance.value = T.shadow.camera.near, m.farDistance.value = T.shadow.camera.far;
    }
    return { refreshFogUniforms: n, refreshMaterialUniforms: r };
  }
  function jm(i, t, e, n) {
    let r = {}, s = {}, a = [];
    const o = i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);
    function l(T, E) {
      const y = E.program;
      n.uniformBlockBinding(T, y);
    }
    function c(T, E) {
      let y = r[T.id];
      y === void 0 && (g(T), y = u(T), r[T.id] = y, T.addEventListener("dispose", m));
      const H = E.program;
      n.updateUBOMapping(T, H);
      const P = t.render.frame;
      s[T.id] !== P && (p(T), s[T.id] = P);
    }
    function u(T) {
      const E = f();
      T.__bindingPointIndex = E;
      const y = i.createBuffer(), H = T.__size, P = T.usage;
      return i.bindBuffer(i.UNIFORM_BUFFER, y), i.bufferData(i.UNIFORM_BUFFER, H, P), i.bindBuffer(i.UNIFORM_BUFFER, null), i.bindBufferBase(i.UNIFORM_BUFFER, E, y), y;
    }
    function f() {
      for (let T = 0; T < o; T++) if (a.indexOf(T) === -1) return a.push(T), T;
      return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."), 0;
    }
    function p(T) {
      const E = r[T.id], y = T.uniforms, H = T.__cache;
      i.bindBuffer(i.UNIFORM_BUFFER, E);
      for (let P = 0, A = y.length; P < A; P++) {
        const N = Array.isArray(y[P]) ? y[P] : [y[P]];
        for (let S = 0, x = N.length; S < x; S++) {
          const C = N[S];
          if (_(C, P, S, H) === true) {
            const W = C.__offset, V = Array.isArray(C.value) ? C.value : [C.value];
            let Y = 0;
            for (let Q = 0; Q < V.length; Q++) {
              const j = V[Q], et = v(j);
              typeof j == "number" || typeof j == "boolean" ? (C.__data[0] = j, i.bufferSubData(i.UNIFORM_BUFFER, W + Y, C.__data)) : j.isMatrix3 ? (C.__data[0] = j.elements[0], C.__data[1] = j.elements[1], C.__data[2] = j.elements[2], C.__data[3] = 0, C.__data[4] = j.elements[3], C.__data[5] = j.elements[4], C.__data[6] = j.elements[5], C.__data[7] = 0, C.__data[8] = j.elements[6], C.__data[9] = j.elements[7], C.__data[10] = j.elements[8], C.__data[11] = 0) : (j.toArray(C.__data, Y), Y += et.storage / Float32Array.BYTES_PER_ELEMENT);
            }
            i.bufferSubData(i.UNIFORM_BUFFER, W, C.__data);
          }
        }
      }
      i.bindBuffer(i.UNIFORM_BUFFER, null);
    }
    function _(T, E, y, H) {
      const P = T.value, A = E + "_" + y;
      if (H[A] === void 0) return typeof P == "number" || typeof P == "boolean" ? H[A] = P : H[A] = P.clone(), true;
      {
        const N = H[A];
        if (typeof P == "number" || typeof P == "boolean") {
          if (N !== P) return H[A] = P, true;
        } else if (N.equals(P) === false) return N.copy(P), true;
      }
      return false;
    }
    function g(T) {
      const E = T.uniforms;
      let y = 0;
      const H = 16;
      for (let A = 0, N = E.length; A < N; A++) {
        const S = Array.isArray(E[A]) ? E[A] : [E[A]];
        for (let x = 0, C = S.length; x < C; x++) {
          const W = S[x], V = Array.isArray(W.value) ? W.value : [W.value];
          for (let Y = 0, Q = V.length; Y < Q; Y++) {
            const j = V[Y], et = v(j), q = y % H, ot = q % et.boundary, ft = q + ot;
            y += ot, ft !== 0 && H - ft < et.storage && (y += H - ft), W.__data = new Float32Array(et.storage / Float32Array.BYTES_PER_ELEMENT), W.__offset = y, y += et.storage;
          }
        }
      }
      const P = y % H;
      return P > 0 && (y += H - P), T.__size = y, T.__cache = {}, this;
    }
    function v(T) {
      const E = { boundary: 0, storage: 0 };
      return typeof T == "number" || typeof T == "boolean" ? (E.boundary = 4, E.storage = 4) : T.isVector2 ? (E.boundary = 8, E.storage = 8) : T.isVector3 || T.isColor ? (E.boundary = 16, E.storage = 12) : T.isVector4 ? (E.boundary = 16, E.storage = 16) : T.isMatrix3 ? (E.boundary = 48, E.storage = 48) : T.isMatrix4 ? (E.boundary = 64, E.storage = 64) : T.isTexture ? console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group.") : console.warn("THREE.WebGLRenderer: Unsupported uniform value type.", T), E;
    }
    function m(T) {
      const E = T.target;
      E.removeEventListener("dispose", m);
      const y = a.indexOf(E.__bindingPointIndex);
      a.splice(y, 1), i.deleteBuffer(r[E.id]), delete r[E.id], delete s[E.id];
    }
    function d() {
      for (const T in r) i.deleteBuffer(r[T]);
      a = [], r = {}, s = {};
    }
    return { bind: l, update: c, dispose: d };
  }
  class Ym {
    constructor(t = {}) {
      const { canvas: e = Fu(), context: n = null, depth: r = true, stencil: s = false, alpha: a = false, antialias: o = false, premultipliedAlpha: l = true, preserveDrawingBuffer: c = false, powerPreference: u = "default", failIfMajorPerformanceCaveat: f = false, reverseDepthBuffer: p = false } = t;
      this.isWebGLRenderer = true;
      let _;
      if (n !== null) {
        if (typeof WebGLRenderingContext < "u" && n instanceof WebGLRenderingContext) throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");
        _ = n.getContextAttributes().alpha;
      } else _ = a;
      const g = new Uint32Array(4), v = new Int32Array(4);
      let m = null, d = null;
      const T = [], E = [];
      this.domElement = e, this.debug = { checkShaderErrors: true, onShaderError: null }, this.autoClear = true, this.autoClearColor = true, this.autoClearDepth = true, this.autoClearStencil = true, this.sortObjects = true, this.clippingPlanes = [], this.localClippingEnabled = false, this._outputColorSpace = Ze, this.toneMapping = Vn, this.toneMappingExposure = 1;
      const y = this;
      let H = false, P = 0, A = 0, N = null, S = -1, x = null;
      const C = new me(), W = new me();
      let V = null;
      const Y = new Vt(0);
      let Q = 0, j = e.width, et = e.height, q = 1, ot = null, ft = null;
      const Mt = new me(0, 0, j, et), Ht = new me(0, 0, j, et);
      let ie = false;
      const Z = new _o();
      let rt = false, xt = false;
      const lt = new pe(), Pt = new pe(), Dt = new z(), Gt = new me(), de = { background: null, fog: null, environment: null, overrideMaterial: null, isScene: true };
      let Yt = false;
      function ge() {
        return N === null ? q : 1;
      }
      let O = n;
      function je(b, U) {
        return e.getContext(b, U);
      }
      try {
        const b = { alpha: true, depth: r, stencil: s, antialias: o, premultipliedAlpha: l, preserveDrawingBuffer: c, powerPreference: u, failIfMajorPerformanceCaveat: f };
        if ("setAttribute" in e && e.setAttribute("data-engine", `three.js r${oo}`), e.addEventListener("webglcontextlost", J, false), e.addEventListener("webglcontextrestored", dt, false), e.addEventListener("webglcontextcreationerror", ht, false), O === null) {
          const U = "webgl2";
          if (O = je(U, b), O === null) throw je(U) ? new Error("Error creating WebGL context with your selected attributes.") : new Error("Error creating WebGL context.");
        }
      } catch (b) {
        throw console.error("THREE.WebGLRenderer: " + b.message), b;
      }
      let Wt, Xt, Rt, oe, Tt, M, w, B, $, tt, K, St, ct, pt, Kt, nt, _t, Ct, It, mt, qt, Ot, se, L;
      function at() {
        Wt = new Qp(O), Wt.init(), Ot = new zm(O, Wt), Xt = new jp(O, Wt, t, Ot), Rt = new Fm(O, Wt), Xt.reverseDepthBuffer && p && Rt.buffers.depth.setReversed(true), oe = new n_(O), Tt = new bm(), M = new Om(O, Wt, Rt, Tt, Xt, Ot, oe), w = new Kp(y), B = new Jp(y), $ = new ld(O), se = new Xp(O, $), tt = new t_(O, $, oe, se), K = new r_(O, tt, $, oe), It = new i_(O, Xt, M), nt = new Yp(Tt), St = new vm(y, w, B, Wt, Xt, se, nt), ct = new qm(y, Tt), pt = new Sm(), Kt = new Am(Wt), Ct = new Wp(y, w, B, Rt, K, _, l), _t = new Dm(y, K, Xt), L = new jm(O, oe, Xt, Rt), mt = new qp(O, Wt, oe), qt = new e_(O, Wt, oe), oe.programs = St.programs, y.capabilities = Xt, y.extensions = Wt, y.properties = Tt, y.renderLists = pt, y.shadowMap = _t, y.state = Rt, y.info = oe;
      }
      at();
      const X = new Wm(y, O);
      this.xr = X, this.getContext = function() {
        return O;
      }, this.getContextAttributes = function() {
        return O.getContextAttributes();
      }, this.forceContextLoss = function() {
        const b = Wt.get("WEBGL_lose_context");
        b && b.loseContext();
      }, this.forceContextRestore = function() {
        const b = Wt.get("WEBGL_lose_context");
        b && b.restoreContext();
      }, this.getPixelRatio = function() {
        return q;
      }, this.setPixelRatio = function(b) {
        b !== void 0 && (q = b, this.setSize(j, et, false));
      }, this.getSize = function(b) {
        return b.set(j, et);
      }, this.setSize = function(b, U, G = true) {
        if (X.isPresenting) {
          console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");
          return;
        }
        j = b, et = U, e.width = Math.floor(b * q), e.height = Math.floor(U * q), G === true && (e.style.width = b + "px", e.style.height = U + "px"), this.setViewport(0, 0, b, U);
      }, this.getDrawingBufferSize = function(b) {
        return b.set(j * q, et * q).floor();
      }, this.setDrawingBufferSize = function(b, U, G) {
        j = b, et = U, q = G, e.width = Math.floor(b * G), e.height = Math.floor(U * G), this.setViewport(0, 0, b, U);
      }, this.getCurrentViewport = function(b) {
        return b.copy(C);
      }, this.getViewport = function(b) {
        return b.copy(Mt);
      }, this.setViewport = function(b, U, G, k) {
        b.isVector4 ? Mt.set(b.x, b.y, b.z, b.w) : Mt.set(b, U, G, k), Rt.viewport(C.copy(Mt).multiplyScalar(q).round());
      }, this.getScissor = function(b) {
        return b.copy(Ht);
      }, this.setScissor = function(b, U, G, k) {
        b.isVector4 ? Ht.set(b.x, b.y, b.z, b.w) : Ht.set(b, U, G, k), Rt.scissor(W.copy(Ht).multiplyScalar(q).round());
      }, this.getScissorTest = function() {
        return ie;
      }, this.setScissorTest = function(b) {
        Rt.setScissorTest(ie = b);
      }, this.setOpaqueSort = function(b) {
        ot = b;
      }, this.setTransparentSort = function(b) {
        ft = b;
      }, this.getClearColor = function(b) {
        return b.copy(Ct.getClearColor());
      }, this.setClearColor = function() {
        Ct.setClearColor.apply(Ct, arguments);
      }, this.getClearAlpha = function() {
        return Ct.getClearAlpha();
      }, this.setClearAlpha = function() {
        Ct.setClearAlpha.apply(Ct, arguments);
      }, this.clear = function(b = true, U = true, G = true) {
        let k = 0;
        if (b) {
          let F = false;
          if (N !== null) {
            const it = N.texture.format;
            F = it === po || it === fo || it === uo;
          }
          if (F) {
            const it = N.texture.type, ut = it === Cn || it === hi || it === lr || it === Bi || it === co || it === ho, wt = Ct.getClearColor(), vt = Ct.getClearAlpha(), Lt = wt.r, Ft = wt.g, bt = wt.b;
            ut ? (g[0] = Lt, g[1] = Ft, g[2] = bt, g[3] = vt, O.clearBufferuiv(O.COLOR, 0, g)) : (v[0] = Lt, v[1] = Ft, v[2] = bt, v[3] = vt, O.clearBufferiv(O.COLOR, 0, v));
          } else k |= O.COLOR_BUFFER_BIT;
        }
        U && (k |= O.DEPTH_BUFFER_BIT), G && (k |= O.STENCIL_BUFFER_BIT, this.state.buffers.stencil.setMask(4294967295)), O.clear(k);
      }, this.clearColor = function() {
        this.clear(true, false, false);
      }, this.clearDepth = function() {
        this.clear(false, true, false);
      }, this.clearStencil = function() {
        this.clear(false, false, true);
      }, this.dispose = function() {
        e.removeEventListener("webglcontextlost", J, false), e.removeEventListener("webglcontextrestored", dt, false), e.removeEventListener("webglcontextcreationerror", ht, false), pt.dispose(), Kt.dispose(), Tt.dispose(), w.dispose(), B.dispose(), K.dispose(), se.dispose(), L.dispose(), St.dispose(), X.dispose(), X.removeEventListener("sessionstart", ko), X.removeEventListener("sessionend", Vo), Yn.stop();
      };
      function J(b) {
        b.preventDefault(), console.log("THREE.WebGLRenderer: Context Lost."), H = true;
      }
      function dt() {
        console.log("THREE.WebGLRenderer: Context Restored."), H = false;
        const b = oe.autoReset, U = _t.enabled, G = _t.autoUpdate, k = _t.needsUpdate, F = _t.type;
        at(), oe.autoReset = b, _t.enabled = U, _t.autoUpdate = G, _t.needsUpdate = k, _t.type = F;
      }
      function ht(b) {
        console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ", b.statusMessage);
      }
      function Ut(b) {
        const U = b.target;
        U.removeEventListener("dispose", Ut), _e(U);
      }
      function _e(b) {
        Ie(b), Tt.remove(b);
      }
      function Ie(b) {
        const U = Tt.get(b).programs;
        U !== void 0 && (U.forEach(function(G) {
          St.releaseProgram(G);
        }), b.isShaderMaterial && St.releaseShaderCache(b));
      }
      this.renderBufferDirect = function(b, U, G, k, F, it) {
        U === null && (U = de);
        const ut = F.isMesh && F.matrixWorld.determinant() < 0, wt = Wh(b, U, G, k, F);
        Rt.setMaterial(k, ut);
        let vt = G.index, Lt = 1;
        if (k.wireframe === true) {
          if (vt = tt.getWireframeAttribute(G), vt === void 0) return;
          Lt = 2;
        }
        const Ft = G.drawRange, bt = G.attributes.position;
        let $t = Ft.start * Lt, ae = (Ft.start + Ft.count) * Lt;
        it !== null && ($t = Math.max($t, it.start * Lt), ae = Math.min(ae, (it.start + it.count) * Lt)), vt !== null ? ($t = Math.max($t, 0), ae = Math.min(ae, vt.count)) : bt != null && ($t = Math.max($t, 0), ae = Math.min(ae, bt.count));
        const le = ae - $t;
        if (le < 0 || le === 1 / 0) return;
        se.setup(F, k, wt, G, vt);
        let Fe, Qt = mt;
        if (vt !== null && (Fe = $.get(vt), Qt = qt, Qt.setIndex(Fe)), F.isMesh) k.wireframe === true ? (Rt.setLineWidth(k.wireframeLinewidth * ge()), Qt.setMode(O.LINES)) : Qt.setMode(O.TRIANGLES);
        else if (F.isLine) {
          let yt = k.linewidth;
          yt === void 0 && (yt = 1), Rt.setLineWidth(yt * ge()), F.isLineSegments ? Qt.setMode(O.LINES) : F.isLineLoop ? Qt.setMode(O.LINE_LOOP) : Qt.setMode(O.LINE_STRIP);
        } else F.isPoints ? Qt.setMode(O.POINTS) : F.isSprite && Qt.setMode(O.TRIANGLES);
        if (F.isBatchedMesh) if (F._multiDrawInstances !== null) Qt.renderMultiDrawInstances(F._multiDrawStarts, F._multiDrawCounts, F._multiDrawCount, F._multiDrawInstances);
        else if (Wt.get("WEBGL_multi_draw")) Qt.renderMultiDraw(F._multiDrawStarts, F._multiDrawCounts, F._multiDrawCount);
        else {
          const yt = F._multiDrawStarts, gn = F._multiDrawCounts, te = F._multiDrawCount, Qe = vt ? $.get(vt).bytesPerElement : 1, pi = Tt.get(k).currentProgram.getUniforms();
          for (let Ge = 0; Ge < te; Ge++) pi.setValue(O, "_gl_DrawID", Ge), Qt.render(yt[Ge] / Qe, gn[Ge]);
        }
        else if (F.isInstancedMesh) Qt.renderInstances($t, le, F.count);
        else if (G.isInstancedBufferGeometry) {
          const yt = G._maxInstanceCount !== void 0 ? G._maxInstanceCount : 1 / 0, gn = Math.min(G.instanceCount, yt);
          Qt.renderInstances($t, le, gn);
        } else Qt.render($t, le);
      };
      function ee(b, U, G) {
        b.transparent === true && b.side === En && b.forceSinglePass === false ? (b.side = ze, b.needsUpdate = true, xr(b, U, G), b.side = Wn, b.needsUpdate = true, xr(b, U, G), b.side = En) : xr(b, U, G);
      }
      this.compile = function(b, U, G = null) {
        G === null && (G = b), d = Kt.get(G), d.init(U), E.push(d), G.traverseVisible(function(F) {
          F.isLight && F.layers.test(U.layers) && (d.pushLight(F), F.castShadow && d.pushShadow(F));
        }), b !== G && b.traverseVisible(function(F) {
          F.isLight && F.layers.test(U.layers) && (d.pushLight(F), F.castShadow && d.pushShadow(F));
        }), d.setupLights();
        const k = /* @__PURE__ */ new Set();
        return b.traverse(function(F) {
          if (!(F.isMesh || F.isPoints || F.isLine || F.isSprite)) return;
          const it = F.material;
          if (it) if (Array.isArray(it)) for (let ut = 0; ut < it.length; ut++) {
            const wt = it[ut];
            ee(wt, G, F), k.add(wt);
          }
          else ee(it, G, F), k.add(it);
        }), E.pop(), d = null, k;
      }, this.compileAsync = function(b, U, G = null) {
        const k = this.compile(b, U, G);
        return new Promise((F) => {
          function it() {
            if (k.forEach(function(ut) {
              Tt.get(ut).currentProgram.isReady() && k.delete(ut);
            }), k.size === 0) {
              F(b);
              return;
            }
            setTimeout(it, 10);
          }
          Wt.get("KHR_parallel_shader_compile") !== null ? it() : setTimeout(it, 10);
        });
      };
      let Je = null;
      function mn(b) {
        Je && Je(b);
      }
      function ko() {
        Yn.stop();
      }
      function Vo() {
        Yn.start();
      }
      const Yn = new Qc();
      Yn.setAnimationLoop(mn), typeof self < "u" && Yn.setContext(self), this.setAnimationLoop = function(b) {
        Je = b, X.setAnimationLoop(b), b === null ? Yn.stop() : Yn.start();
      }, X.addEventListener("sessionstart", ko), X.addEventListener("sessionend", Vo), this.render = function(b, U) {
        if (U !== void 0 && U.isCamera !== true) {
          console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");
          return;
        }
        if (H === true) return;
        if (b.matrixWorldAutoUpdate === true && b.updateMatrixWorld(), U.parent === null && U.matrixWorldAutoUpdate === true && U.updateMatrixWorld(), X.enabled === true && X.isPresenting === true && (X.cameraAutoUpdate === true && X.updateCamera(U), U = X.getCamera()), b.isScene === true && b.onBeforeRender(y, b, U, N), d = Kt.get(b, E.length), d.init(U), E.push(d), Pt.multiplyMatrices(U.projectionMatrix, U.matrixWorldInverse), Z.setFromProjectionMatrix(Pt), xt = this.localClippingEnabled, rt = nt.init(this.clippingPlanes, xt), m = pt.get(b, T.length), m.init(), T.push(m), X.enabled === true && X.isPresenting === true) {
          const it = y.xr.getDepthSensingMesh();
          it !== null && Ps(it, U, -1 / 0, y.sortObjects);
        }
        Ps(b, U, 0, y.sortObjects), m.finish(), y.sortObjects === true && m.sort(ot, ft), Yt = X.enabled === false || X.isPresenting === false || X.hasDepthSensing() === false, Yt && Ct.addToRenderList(m, b), this.info.render.frame++, rt === true && nt.beginShadows();
        const G = d.state.shadowsArray;
        _t.render(G, b, U), rt === true && nt.endShadows(), this.info.autoReset === true && this.info.reset();
        const k = m.opaque, F = m.transmissive;
        if (d.setupLights(), U.isArrayCamera) {
          const it = U.cameras;
          if (F.length > 0) for (let ut = 0, wt = it.length; ut < wt; ut++) {
            const vt = it[ut];
            Xo(k, F, b, vt);
          }
          Yt && Ct.render(b);
          for (let ut = 0, wt = it.length; ut < wt; ut++) {
            const vt = it[ut];
            Wo(m, b, vt, vt.viewport);
          }
        } else F.length > 0 && Xo(k, F, b, U), Yt && Ct.render(b), Wo(m, b, U);
        N !== null && (M.updateMultisampleRenderTarget(N), M.updateRenderTargetMipmap(N)), b.isScene === true && b.onAfterRender(y, b, U), se.resetDefaultState(), S = -1, x = null, E.pop(), E.length > 0 ? (d = E[E.length - 1], rt === true && nt.setGlobalState(y.clippingPlanes, d.state.camera)) : d = null, T.pop(), T.length > 0 ? m = T[T.length - 1] : m = null;
      };
      function Ps(b, U, G, k) {
        if (b.visible === false) return;
        if (b.layers.test(U.layers)) {
          if (b.isGroup) G = b.renderOrder;
          else if (b.isLOD) b.autoUpdate === true && b.update(U);
          else if (b.isLight) d.pushLight(b), b.castShadow && d.pushShadow(b);
          else if (b.isSprite) {
            if (!b.frustumCulled || Z.intersectsSprite(b)) {
              k && Gt.setFromMatrixPosition(b.matrixWorld).applyMatrix4(Pt);
              const ut = K.update(b), wt = b.material;
              wt.visible && m.push(b, ut, wt, G, Gt.z, null);
            }
          } else if ((b.isMesh || b.isLine || b.isPoints) && (!b.frustumCulled || Z.intersectsObject(b))) {
            const ut = K.update(b), wt = b.material;
            if (k && (b.boundingSphere !== void 0 ? (b.boundingSphere === null && b.computeBoundingSphere(), Gt.copy(b.boundingSphere.center)) : (ut.boundingSphere === null && ut.computeBoundingSphere(), Gt.copy(ut.boundingSphere.center)), Gt.applyMatrix4(b.matrixWorld).applyMatrix4(Pt)), Array.isArray(wt)) {
              const vt = ut.groups;
              for (let Lt = 0, Ft = vt.length; Lt < Ft; Lt++) {
                const bt = vt[Lt], $t = wt[bt.materialIndex];
                $t && $t.visible && m.push(b, ut, $t, G, Gt.z, bt);
              }
            } else wt.visible && m.push(b, ut, wt, G, Gt.z, null);
          }
        }
        const it = b.children;
        for (let ut = 0, wt = it.length; ut < wt; ut++) Ps(it[ut], U, G, k);
      }
      function Wo(b, U, G, k) {
        const F = b.opaque, it = b.transmissive, ut = b.transparent;
        d.setupLightsView(G), rt === true && nt.setGlobalState(y.clippingPlanes, G), k && Rt.viewport(C.copy(k)), F.length > 0 && br(F, U, G), it.length > 0 && br(it, U, G), ut.length > 0 && br(ut, U, G), Rt.buffers.depth.setTest(true), Rt.buffers.depth.setMask(true), Rt.buffers.color.setMask(true), Rt.setPolygonOffset(false);
      }
      function Xo(b, U, G, k) {
        if ((G.isScene === true ? G.overrideMaterial : null) !== null) return;
        d.state.transmissionRenderTarget[k.id] === void 0 && (d.state.transmissionRenderTarget[k.id] = new ui(1, 1, { generateMipmaps: true, type: Wt.has("EXT_color_buffer_half_float") || Wt.has("EXT_color_buffer_float") ? fr : Cn, minFilter: oi, samples: 4, stencilBuffer: s, resolveDepthBuffer: false, resolveStencilBuffer: false, colorSpace: Zt.workingColorSpace }));
        const it = d.state.transmissionRenderTarget[k.id], ut = k.viewport || C;
        it.setSize(ut.z, ut.w);
        const wt = y.getRenderTarget();
        y.setRenderTarget(it), y.getClearColor(Y), Q = y.getClearAlpha(), Q < 1 && y.setClearColor(16777215, 0.5), y.clear(), Yt && Ct.render(G);
        const vt = y.toneMapping;
        y.toneMapping = Vn;
        const Lt = k.viewport;
        if (k.viewport !== void 0 && (k.viewport = void 0), d.setupLightsView(k), rt === true && nt.setGlobalState(y.clippingPlanes, k), br(b, G, k), M.updateMultisampleRenderTarget(it), M.updateRenderTargetMipmap(it), Wt.has("WEBGL_multisampled_render_to_texture") === false) {
          let Ft = false;
          for (let bt = 0, $t = U.length; bt < $t; bt++) {
            const ae = U[bt], le = ae.object, Fe = ae.geometry, Qt = ae.material, yt = ae.group;
            if (Qt.side === En && le.layers.test(k.layers)) {
              const gn = Qt.side;
              Qt.side = ze, Qt.needsUpdate = true, qo(le, G, k, Fe, Qt, yt), Qt.side = gn, Qt.needsUpdate = true, Ft = true;
            }
          }
          Ft === true && (M.updateMultisampleRenderTarget(it), M.updateRenderTargetMipmap(it));
        }
        y.setRenderTarget(wt), y.setClearColor(Y, Q), Lt !== void 0 && (k.viewport = Lt), y.toneMapping = vt;
      }
      function br(b, U, G) {
        const k = U.isScene === true ? U.overrideMaterial : null;
        for (let F = 0, it = b.length; F < it; F++) {
          const ut = b[F], wt = ut.object, vt = ut.geometry, Lt = k === null ? ut.material : k, Ft = ut.group;
          wt.layers.test(G.layers) && qo(wt, U, G, vt, Lt, Ft);
        }
      }
      function qo(b, U, G, k, F, it) {
        b.onBeforeRender(y, U, G, k, F, it), b.modelViewMatrix.multiplyMatrices(G.matrixWorldInverse, b.matrixWorld), b.normalMatrix.getNormalMatrix(b.modelViewMatrix), F.onBeforeRender(y, U, G, k, b, it), F.transparent === true && F.side === En && F.forceSinglePass === false ? (F.side = ze, F.needsUpdate = true, y.renderBufferDirect(G, U, k, F, b, it), F.side = Wn, F.needsUpdate = true, y.renderBufferDirect(G, U, k, F, b, it), F.side = En) : y.renderBufferDirect(G, U, k, F, b, it), b.onAfterRender(y, U, G, k, F, it);
      }
      function xr(b, U, G) {
        U.isScene !== true && (U = de);
        const k = Tt.get(b), F = d.state.lights, it = d.state.shadowsArray, ut = F.state.version, wt = St.getParameters(b, F.state, it, U, G), vt = St.getProgramCacheKey(wt);
        let Lt = k.programs;
        k.environment = b.isMeshStandardMaterial ? U.environment : null, k.fog = U.fog, k.envMap = (b.isMeshStandardMaterial ? B : w).get(b.envMap || k.environment), k.envMapRotation = k.environment !== null && b.envMap === null ? U.environmentRotation : b.envMapRotation, Lt === void 0 && (b.addEventListener("dispose", Ut), Lt = /* @__PURE__ */ new Map(), k.programs = Lt);
        let Ft = Lt.get(vt);
        if (Ft !== void 0) {
          if (k.currentProgram === Ft && k.lightsStateVersion === ut) return Yo(b, wt), Ft;
        } else wt.uniforms = St.getUniforms(b), b.onBeforeCompile(wt, y), Ft = St.acquireProgram(wt, vt), Lt.set(vt, Ft), k.uniforms = wt.uniforms;
        const bt = k.uniforms;
        return (!b.isShaderMaterial && !b.isRawShaderMaterial || b.clipping === true) && (bt.clippingPlanes = nt.uniform), Yo(b, wt), k.needsLights = qh(b), k.lightsStateVersion = ut, k.needsLights && (bt.ambientLightColor.value = F.state.ambient, bt.lightProbe.value = F.state.probe, bt.directionalLights.value = F.state.directional, bt.directionalLightShadows.value = F.state.directionalShadow, bt.spotLights.value = F.state.spot, bt.spotLightShadows.value = F.state.spotShadow, bt.rectAreaLights.value = F.state.rectArea, bt.ltc_1.value = F.state.rectAreaLTC1, bt.ltc_2.value = F.state.rectAreaLTC2, bt.pointLights.value = F.state.point, bt.pointLightShadows.value = F.state.pointShadow, bt.hemisphereLights.value = F.state.hemi, bt.directionalShadowMap.value = F.state.directionalShadowMap, bt.directionalShadowMatrix.value = F.state.directionalShadowMatrix, bt.spotShadowMap.value = F.state.spotShadowMap, bt.spotLightMatrix.value = F.state.spotLightMatrix, bt.spotLightMap.value = F.state.spotLightMap, bt.pointShadowMap.value = F.state.pointShadowMap, bt.pointShadowMatrix.value = F.state.pointShadowMatrix), k.currentProgram = Ft, k.uniformsList = null, Ft;
      }
      function jo(b) {
        if (b.uniformsList === null) {
          const U = b.currentProgram.getUniforms();
          b.uniformsList = ns.seqWithValue(U.seq, b.uniforms);
        }
        return b.uniformsList;
      }
      function Yo(b, U) {
        const G = Tt.get(b);
        G.outputColorSpace = U.outputColorSpace, G.batching = U.batching, G.batchingColor = U.batchingColor, G.instancing = U.instancing, G.instancingColor = U.instancingColor, G.instancingMorph = U.instancingMorph, G.skinning = U.skinning, G.morphTargets = U.morphTargets, G.morphNormals = U.morphNormals, G.morphColors = U.morphColors, G.morphTargetsCount = U.morphTargetsCount, G.numClippingPlanes = U.numClippingPlanes, G.numIntersection = U.numClipIntersection, G.vertexAlphas = U.vertexAlphas, G.vertexTangents = U.vertexTangents, G.toneMapping = U.toneMapping;
      }
      function Wh(b, U, G, k, F) {
        U.isScene !== true && (U = de), M.resetTextureUnits();
        const it = U.fog, ut = k.isMeshStandardMaterial ? U.environment : null, wt = N === null ? y.outputColorSpace : N.isXRRenderTarget === true ? N.texture.colorSpace : Wi, vt = (k.isMeshStandardMaterial ? B : w).get(k.envMap || ut), Lt = k.vertexColors === true && !!G.attributes.color && G.attributes.color.itemSize === 4, Ft = !!G.attributes.tangent && (!!k.normalMap || k.anisotropy > 0), bt = !!G.morphAttributes.position, $t = !!G.morphAttributes.normal, ae = !!G.morphAttributes.color;
        let le = Vn;
        k.toneMapped && (N === null || N.isXRRenderTarget === true) && (le = y.toneMapping);
        const Fe = G.morphAttributes.position || G.morphAttributes.normal || G.morphAttributes.color, Qt = Fe !== void 0 ? Fe.length : 0, yt = Tt.get(k), gn = d.state.lights;
        if (rt === true && (xt === true || b !== x)) {
          const Ye = b === x && k.id === S;
          nt.setState(k, b, Ye);
        }
        let te = false;
        k.version === yt.__version ? (yt.needsLights && yt.lightsStateVersion !== gn.state.version || yt.outputColorSpace !== wt || F.isBatchedMesh && yt.batching === false || !F.isBatchedMesh && yt.batching === true || F.isBatchedMesh && yt.batchingColor === true && F.colorTexture === null || F.isBatchedMesh && yt.batchingColor === false && F.colorTexture !== null || F.isInstancedMesh && yt.instancing === false || !F.isInstancedMesh && yt.instancing === true || F.isSkinnedMesh && yt.skinning === false || !F.isSkinnedMesh && yt.skinning === true || F.isInstancedMesh && yt.instancingColor === true && F.instanceColor === null || F.isInstancedMesh && yt.instancingColor === false && F.instanceColor !== null || F.isInstancedMesh && yt.instancingMorph === true && F.morphTexture === null || F.isInstancedMesh && yt.instancingMorph === false && F.morphTexture !== null || yt.envMap !== vt || k.fog === true && yt.fog !== it || yt.numClippingPlanes !== void 0 && (yt.numClippingPlanes !== nt.numPlanes || yt.numIntersection !== nt.numIntersection) || yt.vertexAlphas !== Lt || yt.vertexTangents !== Ft || yt.morphTargets !== bt || yt.morphNormals !== $t || yt.morphColors !== ae || yt.toneMapping !== le || yt.morphTargetsCount !== Qt) && (te = true) : (te = true, yt.__version = k.version);
        let Qe = yt.currentProgram;
        te === true && (Qe = xr(k, U, F));
        let pi = false, Ge = false, Zi = false;
        const ce = Qe.getUniforms(), cn = yt.uniforms;
        if (Rt.useProgram(Qe.program) && (pi = true, Ge = true, Zi = true), k.id !== S && (S = k.id, Ge = true), pi || x !== b) {
          Rt.buffers.depth.getReversed() ? (lt.copy(b.projectionMatrix), Ou(lt), zu(lt), ce.setValue(O, "projectionMatrix", lt)) : ce.setValue(O, "projectionMatrix", b.projectionMatrix), ce.setValue(O, "viewMatrix", b.matrixWorldInverse);
          const Dn = ce.map.cameraPosition;
          Dn !== void 0 && Dn.setValue(O, Dt.setFromMatrixPosition(b.matrixWorld)), Xt.logarithmicDepthBuffer && ce.setValue(O, "logDepthBufFC", 2 / (Math.log(b.far + 1) / Math.LN2)), (k.isMeshPhongMaterial || k.isMeshToonMaterial || k.isMeshLambertMaterial || k.isMeshBasicMaterial || k.isMeshStandardMaterial || k.isShaderMaterial) && ce.setValue(O, "isOrthographic", b.isOrthographicCamera === true), x !== b && (x = b, Ge = true, Zi = true);
        }
        if (F.isSkinnedMesh) {
          ce.setOptional(O, F, "bindMatrix"), ce.setOptional(O, F, "bindMatrixInverse");
          const Ye = F.skeleton;
          Ye && (Ye.boneTexture === null && Ye.computeBoneTexture(), ce.setValue(O, "boneTexture", Ye.boneTexture, M));
        }
        F.isBatchedMesh && (ce.setOptional(O, F, "batchingTexture"), ce.setValue(O, "batchingTexture", F._matricesTexture, M), ce.setOptional(O, F, "batchingIdTexture"), ce.setValue(O, "batchingIdTexture", F._indirectTexture, M), ce.setOptional(O, F, "batchingColorTexture"), F._colorsTexture !== null && ce.setValue(O, "batchingColorTexture", F._colorsTexture, M));
        const $i = G.morphAttributes;
        if (($i.position !== void 0 || $i.normal !== void 0 || $i.color !== void 0) && It.update(F, G, Qe), (Ge || yt.receiveShadow !== F.receiveShadow) && (yt.receiveShadow = F.receiveShadow, ce.setValue(O, "receiveShadow", F.receiveShadow)), k.isMeshGouraudMaterial && k.envMap !== null && (cn.envMap.value = vt, cn.flipEnvMap.value = vt.isCubeTexture && vt.isRenderTargetTexture === false ? -1 : 1), k.isMeshStandardMaterial && k.envMap === null && U.environment !== null && (cn.envMapIntensity.value = U.environmentIntensity), Ge && (ce.setValue(O, "toneMappingExposure", y.toneMappingExposure), yt.needsLights && Xh(cn, Zi), it && k.fog === true && ct.refreshFogUniforms(cn, it), ct.refreshMaterialUniforms(cn, k, q, et, d.state.transmissionRenderTarget[b.id]), ns.upload(O, jo(yt), cn, M)), k.isShaderMaterial && k.uniformsNeedUpdate === true && (ns.upload(O, jo(yt), cn, M), k.uniformsNeedUpdate = false), k.isSpriteMaterial && ce.setValue(O, "center", F.center), ce.setValue(O, "modelViewMatrix", F.modelViewMatrix), ce.setValue(O, "normalMatrix", F.normalMatrix), ce.setValue(O, "modelMatrix", F.matrixWorld), k.isShaderMaterial || k.isRawShaderMaterial) {
          const Ye = k.uniformsGroups;
          for (let Dn = 0, Un = Ye.length; Dn < Un; Dn++) {
            const Ko = Ye[Dn];
            L.update(Ko, Qe), L.bind(Ko, Qe);
          }
        }
        return Qe;
      }
      function Xh(b, U) {
        b.ambientLightColor.needsUpdate = U, b.lightProbe.needsUpdate = U, b.directionalLights.needsUpdate = U, b.directionalLightShadows.needsUpdate = U, b.pointLights.needsUpdate = U, b.pointLightShadows.needsUpdate = U, b.spotLights.needsUpdate = U, b.spotLightShadows.needsUpdate = U, b.rectAreaLights.needsUpdate = U, b.hemisphereLights.needsUpdate = U;
      }
      function qh(b) {
        return b.isMeshLambertMaterial || b.isMeshToonMaterial || b.isMeshPhongMaterial || b.isMeshStandardMaterial || b.isShadowMaterial || b.isShaderMaterial && b.lights === true;
      }
      this.getActiveCubeFace = function() {
        return P;
      }, this.getActiveMipmapLevel = function() {
        return A;
      }, this.getRenderTarget = function() {
        return N;
      }, this.setRenderTargetTextures = function(b, U, G) {
        Tt.get(b.texture).__webglTexture = U, Tt.get(b.depthTexture).__webglTexture = G;
        const k = Tt.get(b);
        k.__hasExternalTextures = true, k.__autoAllocateDepthBuffer = G === void 0, k.__autoAllocateDepthBuffer || Wt.has("WEBGL_multisampled_render_to_texture") === true && (console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"), k.__useRenderToTexture = false);
      }, this.setRenderTargetFramebuffer = function(b, U) {
        const G = Tt.get(b);
        G.__webglFramebuffer = U, G.__useDefaultFramebuffer = U === void 0;
      }, this.setRenderTarget = function(b, U = 0, G = 0) {
        N = b, P = U, A = G;
        let k = true, F = null, it = false, ut = false;
        if (b) {
          const vt = Tt.get(b);
          if (vt.__useDefaultFramebuffer !== void 0) Rt.bindFramebuffer(O.FRAMEBUFFER, null), k = false;
          else if (vt.__webglFramebuffer === void 0) M.setupRenderTarget(b);
          else if (vt.__hasExternalTextures) M.rebindTextures(b, Tt.get(b.texture).__webglTexture, Tt.get(b.depthTexture).__webglTexture);
          else if (b.depthBuffer) {
            const bt = b.depthTexture;
            if (vt.__boundDepthTexture !== bt) {
              if (bt !== null && Tt.has(bt) && (b.width !== bt.image.width || b.height !== bt.image.height)) throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");
              M.setupDepthRenderbuffer(b);
            }
          }
          const Lt = b.texture;
          (Lt.isData3DTexture || Lt.isDataArrayTexture || Lt.isCompressedArrayTexture) && (ut = true);
          const Ft = Tt.get(b).__webglFramebuffer;
          b.isWebGLCubeRenderTarget ? (Array.isArray(Ft[U]) ? F = Ft[U][G] : F = Ft[U], it = true) : b.samples > 0 && M.useMultisampledRTT(b) === false ? F = Tt.get(b).__webglMultisampledFramebuffer : Array.isArray(Ft) ? F = Ft[G] : F = Ft, C.copy(b.viewport), W.copy(b.scissor), V = b.scissorTest;
        } else C.copy(Mt).multiplyScalar(q).floor(), W.copy(Ht).multiplyScalar(q).floor(), V = ie;
        if (Rt.bindFramebuffer(O.FRAMEBUFFER, F) && k && Rt.drawBuffers(b, F), Rt.viewport(C), Rt.scissor(W), Rt.setScissorTest(V), it) {
          const vt = Tt.get(b.texture);
          O.framebufferTexture2D(O.FRAMEBUFFER, O.COLOR_ATTACHMENT0, O.TEXTURE_CUBE_MAP_POSITIVE_X + U, vt.__webglTexture, G);
        } else if (ut) {
          const vt = Tt.get(b.texture), Lt = U || 0;
          O.framebufferTextureLayer(O.FRAMEBUFFER, O.COLOR_ATTACHMENT0, vt.__webglTexture, G || 0, Lt);
        }
        S = -1;
      }, this.readRenderTargetPixels = function(b, U, G, k, F, it, ut) {
        if (!(b && b.isWebGLRenderTarget)) {
          console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");
          return;
        }
        let wt = Tt.get(b).__webglFramebuffer;
        if (b.isWebGLCubeRenderTarget && ut !== void 0 && (wt = wt[ut]), wt) {
          Rt.bindFramebuffer(O.FRAMEBUFFER, wt);
          try {
            const vt = b.texture, Lt = vt.format, Ft = vt.type;
            if (!Xt.textureFormatReadable(Lt)) {
              console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");
              return;
            }
            if (!Xt.textureTypeReadable(Ft)) {
              console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");
              return;
            }
            U >= 0 && U <= b.width - k && G >= 0 && G <= b.height - F && O.readPixels(U, G, k, F, Ot.convert(Lt), Ot.convert(Ft), it);
          } finally {
            const vt = N !== null ? Tt.get(N).__webglFramebuffer : null;
            Rt.bindFramebuffer(O.FRAMEBUFFER, vt);
          }
        }
      }, this.readRenderTargetPixelsAsync = async function(b, U, G, k, F, it, ut) {
        if (!(b && b.isWebGLRenderTarget)) throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");
        let wt = Tt.get(b).__webglFramebuffer;
        if (b.isWebGLCubeRenderTarget && ut !== void 0 && (wt = wt[ut]), wt) {
          const vt = b.texture, Lt = vt.format, Ft = vt.type;
          if (!Xt.textureFormatReadable(Lt)) throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");
          if (!Xt.textureTypeReadable(Ft)) throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");
          if (U >= 0 && U <= b.width - k && G >= 0 && G <= b.height - F) {
            Rt.bindFramebuffer(O.FRAMEBUFFER, wt);
            const bt = O.createBuffer();
            O.bindBuffer(O.PIXEL_PACK_BUFFER, bt), O.bufferData(O.PIXEL_PACK_BUFFER, it.byteLength, O.STREAM_READ), O.readPixels(U, G, k, F, Ot.convert(Lt), Ot.convert(Ft), 0);
            const $t = N !== null ? Tt.get(N).__webglFramebuffer : null;
            Rt.bindFramebuffer(O.FRAMEBUFFER, $t);
            const ae = O.fenceSync(O.SYNC_GPU_COMMANDS_COMPLETE, 0);
            return O.flush(), await Nu(O, ae, 4), O.bindBuffer(O.PIXEL_PACK_BUFFER, bt), O.getBufferSubData(O.PIXEL_PACK_BUFFER, 0, it), O.deleteBuffer(bt), O.deleteSync(ae), it;
          } else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.");
        }
      }, this.copyFramebufferToTexture = function(b, U = null, G = 0) {
        b.isTexture !== true && (sr("WebGLRenderer: copyFramebufferToTexture function signature has changed."), U = arguments[0] || null, b = arguments[1]);
        const k = Math.pow(2, -G), F = Math.floor(b.image.width * k), it = Math.floor(b.image.height * k), ut = U !== null ? U.x : 0, wt = U !== null ? U.y : 0;
        M.setTexture2D(b, 0), O.copyTexSubImage2D(O.TEXTURE_2D, G, 0, 0, ut, wt, F, it), Rt.unbindTexture();
      }, this.copyTextureToTexture = function(b, U, G = null, k = null, F = 0) {
        b.isTexture !== true && (sr("WebGLRenderer: copyTextureToTexture function signature has changed."), k = arguments[0] || null, b = arguments[1], U = arguments[2], F = arguments[3] || 0, G = null);
        let it, ut, wt, vt, Lt, Ft, bt, $t, ae;
        const le = b.isCompressedTexture ? b.mipmaps[F] : b.image;
        G !== null ? (it = G.max.x - G.min.x, ut = G.max.y - G.min.y, wt = G.isBox3 ? G.max.z - G.min.z : 1, vt = G.min.x, Lt = G.min.y, Ft = G.isBox3 ? G.min.z : 0) : (it = le.width, ut = le.height, wt = le.depth || 1, vt = 0, Lt = 0, Ft = 0), k !== null ? (bt = k.x, $t = k.y, ae = k.z) : (bt = 0, $t = 0, ae = 0);
        const Fe = Ot.convert(U.format), Qt = Ot.convert(U.type);
        let yt;
        U.isData3DTexture ? (M.setTexture3D(U, 0), yt = O.TEXTURE_3D) : U.isDataArrayTexture || U.isCompressedArrayTexture ? (M.setTexture2DArray(U, 0), yt = O.TEXTURE_2D_ARRAY) : (M.setTexture2D(U, 0), yt = O.TEXTURE_2D), O.pixelStorei(O.UNPACK_FLIP_Y_WEBGL, U.flipY), O.pixelStorei(O.UNPACK_PREMULTIPLY_ALPHA_WEBGL, U.premultiplyAlpha), O.pixelStorei(O.UNPACK_ALIGNMENT, U.unpackAlignment);
        const gn = O.getParameter(O.UNPACK_ROW_LENGTH), te = O.getParameter(O.UNPACK_IMAGE_HEIGHT), Qe = O.getParameter(O.UNPACK_SKIP_PIXELS), pi = O.getParameter(O.UNPACK_SKIP_ROWS), Ge = O.getParameter(O.UNPACK_SKIP_IMAGES);
        O.pixelStorei(O.UNPACK_ROW_LENGTH, le.width), O.pixelStorei(O.UNPACK_IMAGE_HEIGHT, le.height), O.pixelStorei(O.UNPACK_SKIP_PIXELS, vt), O.pixelStorei(O.UNPACK_SKIP_ROWS, Lt), O.pixelStorei(O.UNPACK_SKIP_IMAGES, Ft);
        const Zi = b.isDataArrayTexture || b.isData3DTexture, ce = U.isDataArrayTexture || U.isData3DTexture;
        if (b.isRenderTargetTexture || b.isDepthTexture) {
          const cn = Tt.get(b), $i = Tt.get(U), Ye = Tt.get(cn.__renderTarget), Dn = Tt.get($i.__renderTarget);
          Rt.bindFramebuffer(O.READ_FRAMEBUFFER, Ye.__webglFramebuffer), Rt.bindFramebuffer(O.DRAW_FRAMEBUFFER, Dn.__webglFramebuffer);
          for (let Un = 0; Un < wt; Un++) Zi && O.framebufferTextureLayer(O.READ_FRAMEBUFFER, O.COLOR_ATTACHMENT0, Tt.get(b).__webglTexture, F, Ft + Un), b.isDepthTexture ? (ce && O.framebufferTextureLayer(O.DRAW_FRAMEBUFFER, O.COLOR_ATTACHMENT0, Tt.get(U).__webglTexture, F, ae + Un), O.blitFramebuffer(vt, Lt, it, ut, bt, $t, it, ut, O.DEPTH_BUFFER_BIT, O.NEAREST)) : ce ? O.copyTexSubImage3D(yt, F, bt, $t, ae + Un, vt, Lt, it, ut) : O.copyTexSubImage2D(yt, F, bt, $t, ae + Un, vt, Lt, it, ut);
          Rt.bindFramebuffer(O.READ_FRAMEBUFFER, null), Rt.bindFramebuffer(O.DRAW_FRAMEBUFFER, null);
        } else ce ? b.isDataTexture || b.isData3DTexture ? O.texSubImage3D(yt, F, bt, $t, ae, it, ut, wt, Fe, Qt, le.data) : U.isCompressedArrayTexture ? O.compressedTexSubImage3D(yt, F, bt, $t, ae, it, ut, wt, Fe, le.data) : O.texSubImage3D(yt, F, bt, $t, ae, it, ut, wt, Fe, Qt, le) : b.isDataTexture ? O.texSubImage2D(O.TEXTURE_2D, F, bt, $t, it, ut, Fe, Qt, le.data) : b.isCompressedTexture ? O.compressedTexSubImage2D(O.TEXTURE_2D, F, bt, $t, le.width, le.height, Fe, le.data) : O.texSubImage2D(O.TEXTURE_2D, F, bt, $t, it, ut, Fe, Qt, le);
        O.pixelStorei(O.UNPACK_ROW_LENGTH, gn), O.pixelStorei(O.UNPACK_IMAGE_HEIGHT, te), O.pixelStorei(O.UNPACK_SKIP_PIXELS, Qe), O.pixelStorei(O.UNPACK_SKIP_ROWS, pi), O.pixelStorei(O.UNPACK_SKIP_IMAGES, Ge), F === 0 && U.generateMipmaps && O.generateMipmap(yt), Rt.unbindTexture();
      }, this.copyTextureToTexture3D = function(b, U, G = null, k = null, F = 0) {
        return b.isTexture !== true && (sr("WebGLRenderer: copyTextureToTexture3D function signature has changed."), G = arguments[0] || null, k = arguments[1] || null, b = arguments[2], U = arguments[3], F = arguments[4] || 0), sr('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'), this.copyTextureToTexture(b, U, G, k, F);
      }, this.initRenderTarget = function(b) {
        Tt.get(b).__webglFramebuffer === void 0 && M.setupRenderTarget(b);
      }, this.initTexture = function(b) {
        b.isCubeTexture ? M.setTextureCube(b, 0) : b.isData3DTexture ? M.setTexture3D(b, 0) : b.isDataArrayTexture || b.isCompressedArrayTexture ? M.setTexture2DArray(b, 0) : M.setTexture2D(b, 0), Rt.unbindTexture();
      }, this.resetState = function() {
        P = 0, A = 0, N = null, Rt.reset(), se.reset();
      }, typeof __THREE_DEVTOOLS__ < "u" && __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe", { detail: this }));
    }
    get coordinateSystem() {
      return Rn;
    }
    get outputColorSpace() {
      return this._outputColorSpace;
    }
    set outputColorSpace(t) {
      this._outputColorSpace = t;
      const e = this.getContext();
      e.drawingBufferColorspace = Zt._getDrawingBufferColorSpace(t), e.unpackColorSpace = Zt._getUnpackColorSpace();
    }
  }
  class go {
    constructor(t, e = 1, n = 1e3) {
      this.isFog = true, this.name = "", this.color = new Vt(t), this.near = e, this.far = n;
    }
    clone() {
      return new go(this.color, this.near, this.far);
    }
    toJSON() {
      return { type: "Fog", name: this.name, color: this.color.getHex(), near: this.near, far: this.far };
    }
  }
  class Km extends Ae {
    constructor() {
      super(), this.isScene = true, this.type = "Scene", this.background = null, this.environment = null, this.fog = null, this.backgroundBlurriness = 0, this.backgroundIntensity = 1, this.backgroundRotation = new pn(), this.environmentIntensity = 1, this.environmentRotation = new pn(), this.overrideMaterial = null, typeof __THREE_DEVTOOLS__ < "u" && __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe", { detail: this }));
    }
    copy(t, e) {
      return super.copy(t, e), t.background !== null && (this.background = t.background.clone()), t.environment !== null && (this.environment = t.environment.clone()), t.fog !== null && (this.fog = t.fog.clone()), this.backgroundBlurriness = t.backgroundBlurriness, this.backgroundIntensity = t.backgroundIntensity, this.backgroundRotation.copy(t.backgroundRotation), this.environmentIntensity = t.environmentIntensity, this.environmentRotation.copy(t.environmentRotation), t.overrideMaterial !== null && (this.overrideMaterial = t.overrideMaterial.clone()), this.matrixAutoUpdate = t.matrixAutoUpdate, this;
    }
    toJSON(t) {
      const e = super.toJSON(t);
      return this.fog !== null && (e.object.fog = this.fog.toJSON()), this.backgroundBlurriness > 0 && (e.object.backgroundBlurriness = this.backgroundBlurriness), this.backgroundIntensity !== 1 && (e.object.backgroundIntensity = this.backgroundIntensity), e.object.backgroundRotation = this.backgroundRotation.toArray(), this.environmentIntensity !== 1 && (e.object.environmentIntensity = this.environmentIntensity), e.object.environmentRotation = this.environmentRotation.toArray(), e;
    }
  }
  class ah extends ji {
    static get type() {
      return "LineBasicMaterial";
    }
    constructor(t) {
      super(), this.isLineBasicMaterial = true, this.color = new Vt(16777215), this.map = null, this.linewidth = 1, this.linecap = "round", this.linejoin = "round", this.fog = true, this.setValues(t);
    }
    copy(t) {
      return super.copy(t), this.color.copy(t.color), this.map = t.map, this.linewidth = t.linewidth, this.linecap = t.linecap, this.linejoin = t.linejoin, this.fog = t.fog, this;
    }
  }
  const as = new z(), os = new z(), Yl = new pe(), rr = new Xc(), Vr = new bs(), oa = new z(), Kl = new z();
  class Zm extends Ae {
    constructor(t = new _n(), e = new ah()) {
      super(), this.isLine = true, this.type = "Line", this.geometry = t, this.material = e, this.updateMorphTargets();
    }
    copy(t, e) {
      return super.copy(t, e), this.material = Array.isArray(t.material) ? t.material.slice() : t.material, this.geometry = t.geometry, this;
    }
    computeLineDistances() {
      const t = this.geometry;
      if (t.index === null) {
        const e = t.attributes.position, n = [0];
        for (let r = 1, s = e.count; r < s; r++) as.fromBufferAttribute(e, r - 1), os.fromBufferAttribute(e, r), n[r] = n[r - 1], n[r] += as.distanceTo(os);
        t.setAttribute("lineDistance", new He(n, 1));
      } else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");
      return this;
    }
    raycast(t, e) {
      const n = this.geometry, r = this.matrixWorld, s = t.params.Line.threshold, a = n.drawRange;
      if (n.boundingSphere === null && n.computeBoundingSphere(), Vr.copy(n.boundingSphere), Vr.applyMatrix4(r), Vr.radius += s, t.ray.intersectsSphere(Vr) === false) return;
      Yl.copy(r).invert(), rr.copy(t.ray).applyMatrix4(Yl);
      const o = s / ((this.scale.x + this.scale.y + this.scale.z) / 3), l = o * o, c = this.isLineSegments ? 2 : 1, u = n.index, p = n.attributes.position;
      if (u !== null) {
        const _ = Math.max(0, a.start), g = Math.min(u.count, a.start + a.count);
        for (let v = _, m = g - 1; v < m; v += c) {
          const d = u.getX(v), T = u.getX(v + 1), E = Wr(this, t, rr, l, d, T);
          E && e.push(E);
        }
        if (this.isLineLoop) {
          const v = u.getX(g - 1), m = u.getX(_), d = Wr(this, t, rr, l, v, m);
          d && e.push(d);
        }
      } else {
        const _ = Math.max(0, a.start), g = Math.min(p.count, a.start + a.count);
        for (let v = _, m = g - 1; v < m; v += c) {
          const d = Wr(this, t, rr, l, v, v + 1);
          d && e.push(d);
        }
        if (this.isLineLoop) {
          const v = Wr(this, t, rr, l, g - 1, _);
          v && e.push(v);
        }
      }
    }
    updateMorphTargets() {
      const e = this.geometry.morphAttributes, n = Object.keys(e);
      if (n.length > 0) {
        const r = e[n[0]];
        if (r !== void 0) {
          this.morphTargetInfluences = [], this.morphTargetDictionary = {};
          for (let s = 0, a = r.length; s < a; s++) {
            const o = r[s].name || String(s);
            this.morphTargetInfluences.push(0), this.morphTargetDictionary[o] = s;
          }
        }
      }
    }
  }
  function Wr(i, t, e, n, r, s) {
    const a = i.geometry.attributes.position;
    if (as.fromBufferAttribute(a, r), os.fromBufferAttribute(a, s), e.distanceSqToSegment(as, os, oa, Kl) > n) return;
    oa.applyMatrix4(i.matrixWorld);
    const l = t.ray.origin.distanceTo(oa);
    if (!(l < t.near || l > t.far)) return { distance: l, point: Kl.clone().applyMatrix4(i.matrixWorld), index: r, face: null, faceIndex: null, barycoord: null, object: i };
  }
  const Zl = new z(), $l = new z();
  class $m extends Zm {
    constructor(t, e) {
      super(t, e), this.isLineSegments = true, this.type = "LineSegments";
    }
    computeLineDistances() {
      const t = this.geometry;
      if (t.index === null) {
        const e = t.attributes.position, n = [];
        for (let r = 0, s = e.count; r < s; r += 2) Zl.fromBufferAttribute(e, r), $l.fromBufferAttribute(e, r + 1), n[r] = r === 0 ? 0 : n[r - 1], n[r + 1] = n[r] + Zl.distanceTo($l);
        t.setAttribute("lineDistance", new He(n, 1));
      } else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");
      return this;
    }
  }
  class wo extends _n {
    constructor(t = 1, e = 1, n = 1, r = 32, s = 1, a = false, o = 0, l = Math.PI * 2) {
      super(), this.type = "CylinderGeometry", this.parameters = { radiusTop: t, radiusBottom: e, height: n, radialSegments: r, heightSegments: s, openEnded: a, thetaStart: o, thetaLength: l };
      const c = this;
      r = Math.floor(r), s = Math.floor(s);
      const u = [], f = [], p = [], _ = [];
      let g = 0;
      const v = [], m = n / 2;
      let d = 0;
      T(), a === false && (t > 0 && E(true), e > 0 && E(false)), this.setIndex(u), this.setAttribute("position", new He(f, 3)), this.setAttribute("normal", new He(p, 3)), this.setAttribute("uv", new He(_, 2));
      function T() {
        const y = new z(), H = new z();
        let P = 0;
        const A = (e - t) / n;
        for (let N = 0; N <= s; N++) {
          const S = [], x = N / s, C = x * (e - t) + t;
          for (let W = 0; W <= r; W++) {
            const V = W / r, Y = V * l + o, Q = Math.sin(Y), j = Math.cos(Y);
            H.x = C * Q, H.y = -x * n + m, H.z = C * j, f.push(H.x, H.y, H.z), y.set(Q, A, j).normalize(), p.push(y.x, y.y, y.z), _.push(V, 1 - x), S.push(g++);
          }
          v.push(S);
        }
        for (let N = 0; N < r; N++) for (let S = 0; S < s; S++) {
          const x = v[S][N], C = v[S + 1][N], W = v[S + 1][N + 1], V = v[S][N + 1];
          (t > 0 || S !== 0) && (u.push(x, C, V), P += 3), (e > 0 || S !== s - 1) && (u.push(C, W, V), P += 3);
        }
        c.addGroup(d, P, 0), d += P;
      }
      function E(y) {
        const H = g, P = new Jt(), A = new z();
        let N = 0;
        const S = y === true ? t : e, x = y === true ? 1 : -1;
        for (let W = 1; W <= r; W++) f.push(0, m * x, 0), p.push(0, x, 0), _.push(0.5, 0.5), g++;
        const C = g;
        for (let W = 0; W <= r; W++) {
          const Y = W / r * l + o, Q = Math.cos(Y), j = Math.sin(Y);
          A.x = S * j, A.y = m * x, A.z = S * Q, f.push(A.x, A.y, A.z), p.push(0, x, 0), P.x = Q * 0.5 + 0.5, P.y = j * 0.5 * x + 0.5, _.push(P.x, P.y), g++;
        }
        for (let W = 0; W < r; W++) {
          const V = H + W, Y = C + W;
          y === true ? u.push(Y, Y + 1, V) : u.push(Y + 1, Y, V), N += 3;
        }
        c.addGroup(d, N, y === true ? 1 : 2), d += N;
      }
    }
    copy(t) {
      return super.copy(t), this.parameters = Object.assign({}, t.parameters), this;
    }
    static fromJSON(t) {
      return new wo(t.radiusTop, t.radiusBottom, t.height, t.radialSegments, t.heightSegments, t.openEnded, t.thetaStart, t.thetaLength);
    }
  }
  class li extends ji {
    static get type() {
      return "MeshStandardMaterial";
    }
    constructor(t) {
      super(), this.isMeshStandardMaterial = true, this.defines = { STANDARD: "" }, this.color = new Vt(16777215), this.roughness = 1, this.metalness = 0, this.map = null, this.lightMap = null, this.lightMapIntensity = 1, this.aoMap = null, this.aoMapIntensity = 1, this.emissive = new Vt(0), this.emissiveIntensity = 1, this.emissiveMap = null, this.bumpMap = null, this.bumpScale = 1, this.normalMap = null, this.normalMapType = Bc, this.normalScale = new Jt(1, 1), this.displacementMap = null, this.displacementScale = 1, this.displacementBias = 0, this.roughnessMap = null, this.metalnessMap = null, this.alphaMap = null, this.envMap = null, this.envMapRotation = new pn(), this.envMapIntensity = 1, this.wireframe = false, this.wireframeLinewidth = 1, this.wireframeLinecap = "round", this.wireframeLinejoin = "round", this.flatShading = false, this.fog = true, this.setValues(t);
    }
    copy(t) {
      return super.copy(t), this.defines = { STANDARD: "" }, this.color.copy(t.color), this.roughness = t.roughness, this.metalness = t.metalness, this.map = t.map, this.lightMap = t.lightMap, this.lightMapIntensity = t.lightMapIntensity, this.aoMap = t.aoMap, this.aoMapIntensity = t.aoMapIntensity, this.emissive.copy(t.emissive), this.emissiveMap = t.emissiveMap, this.emissiveIntensity = t.emissiveIntensity, this.bumpMap = t.bumpMap, this.bumpScale = t.bumpScale, this.normalMap = t.normalMap, this.normalMapType = t.normalMapType, this.normalScale.copy(t.normalScale), this.displacementMap = t.displacementMap, this.displacementScale = t.displacementScale, this.displacementBias = t.displacementBias, this.roughnessMap = t.roughnessMap, this.metalnessMap = t.metalnessMap, this.alphaMap = t.alphaMap, this.envMap = t.envMap, this.envMapRotation.copy(t.envMapRotation), this.envMapIntensity = t.envMapIntensity, this.wireframe = t.wireframe, this.wireframeLinewidth = t.wireframeLinewidth, this.wireframeLinecap = t.wireframeLinecap, this.wireframeLinejoin = t.wireframeLinejoin, this.flatShading = t.flatShading, this.fog = t.fog, this;
    }
  }
  class vo extends Ae {
    constructor(t, e = 1) {
      super(), this.isLight = true, this.type = "Light", this.color = new Vt(t), this.intensity = e;
    }
    dispose() {
    }
    copy(t, e) {
      return super.copy(t, e), this.color.copy(t.color), this.intensity = t.intensity, this;
    }
    toJSON(t) {
      const e = super.toJSON(t);
      return e.object.color = this.color.getHex(), e.object.intensity = this.intensity, this.groundColor !== void 0 && (e.object.groundColor = this.groundColor.getHex()), this.distance !== void 0 && (e.object.distance = this.distance), this.angle !== void 0 && (e.object.angle = this.angle), this.decay !== void 0 && (e.object.decay = this.decay), this.penumbra !== void 0 && (e.object.penumbra = this.penumbra), this.shadow !== void 0 && (e.object.shadow = this.shadow.toJSON()), this.target !== void 0 && (e.object.target = this.target.uuid), e;
    }
  }
  class Jm extends vo {
    constructor(t, e, n) {
      super(t, n), this.isHemisphereLight = true, this.type = "HemisphereLight", this.position.copy(Ae.DEFAULT_UP), this.updateMatrix(), this.groundColor = new Vt(e);
    }
    copy(t, e) {
      return super.copy(t, e), this.groundColor.copy(t.groundColor), this;
    }
  }
  const la = new pe(), Jl = new z(), Ql = new z();
  class Qm {
    constructor(t) {
      this.camera = t, this.intensity = 1, this.bias = 0, this.normalBias = 0, this.radius = 1, this.blurSamples = 8, this.mapSize = new Jt(512, 512), this.map = null, this.mapPass = null, this.matrix = new pe(), this.autoUpdate = true, this.needsUpdate = false, this._frustum = new _o(), this._frameExtents = new Jt(1, 1), this._viewportCount = 1, this._viewports = [new me(0, 0, 1, 1)];
    }
    getViewportCount() {
      return this._viewportCount;
    }
    getFrustum() {
      return this._frustum;
    }
    updateMatrices(t) {
      const e = this.camera, n = this.matrix;
      Jl.setFromMatrixPosition(t.matrixWorld), e.position.copy(Jl), Ql.setFromMatrixPosition(t.target.matrixWorld), e.lookAt(Ql), e.updateMatrixWorld(), la.multiplyMatrices(e.projectionMatrix, e.matrixWorldInverse), this._frustum.setFromProjectionMatrix(la), n.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1), n.multiply(la);
    }
    getViewport(t) {
      return this._viewports[t];
    }
    getFrameExtents() {
      return this._frameExtents;
    }
    dispose() {
      this.map && this.map.dispose(), this.mapPass && this.mapPass.dispose();
    }
    copy(t) {
      return this.camera = t.camera.clone(), this.intensity = t.intensity, this.bias = t.bias, this.radius = t.radius, this.mapSize.copy(t.mapSize), this;
    }
    clone() {
      return new this.constructor().copy(this);
    }
    toJSON() {
      const t = {};
      return this.intensity !== 1 && (t.intensity = this.intensity), this.bias !== 0 && (t.bias = this.bias), this.normalBias !== 0 && (t.normalBias = this.normalBias), this.radius !== 1 && (t.radius = this.radius), (this.mapSize.x !== 512 || this.mapSize.y !== 512) && (t.mapSize = this.mapSize.toArray()), t.camera = this.camera.toJSON(false).object, delete t.camera.matrix, t;
    }
  }
  class tg extends Qm {
    constructor() {
      super(new th(-5, 5, 5, -5, 0.5, 500)), this.isDirectionalLightShadow = true;
    }
  }
  class eg extends vo {
    constructor(t, e) {
      super(t, e), this.isDirectionalLight = true, this.type = "DirectionalLight", this.position.copy(Ae.DEFAULT_UP), this.updateMatrix(), this.target = new Ae(), this.shadow = new tg();
    }
    dispose() {
      this.shadow.dispose();
    }
    copy(t) {
      return super.copy(t), this.target = t.target.clone(), this.shadow = t.shadow.clone(), this;
    }
  }
  class ng extends vo {
    constructor(t, e) {
      super(t, e), this.isAmbientLight = true, this.type = "AmbientLight";
    }
  }
  class ig extends $m {
    constructor(t = 10, e = 10, n = 4473924, r = 8947848) {
      n = new Vt(n), r = new Vt(r);
      const s = e / 2, a = t / e, o = t / 2, l = [], c = [];
      for (let p = 0, _ = 0, g = -o; p <= e; p++, g += a) {
        l.push(-o, 0, g, o, 0, g), l.push(g, 0, -o, g, 0, o);
        const v = p === s ? n : r;
        v.toArray(c, _), _ += 3, v.toArray(c, _), _ += 3, v.toArray(c, _), _ += 3, v.toArray(c, _), _ += 3;
      }
      const u = new _n();
      u.setAttribute("position", new He(l, 3)), u.setAttribute("color", new He(c, 3));
      const f = new ah({ vertexColors: true, toneMapped: false });
      super(u, f), this.type = "GridHelper";
    }
    dispose() {
      this.geometry.dispose(), this.material.dispose();
    }
  }
  typeof __THREE_DEVTOOLS__ < "u" && __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register", { detail: { revision: oo } }));
  typeof window < "u" && (window.__THREE__ ? console.warn("WARNING: Multiple instances of Three.js being imported.") : window.__THREE__ = oo);
  class rg {
    constructor(t) {
      __publicField(this, "scene");
      __publicField(this, "camera");
      __publicField(this, "renderer");
      __publicField(this, "dirLight");
      this.scene = new Km(), this.scene.background = new Vt(8900331), this.scene.fog = new go(8900331, 60, 250), this.camera = new $e(60, window.innerWidth / window.innerHeight, 0.1, 1e3), this.camera.position.set(0, 10, -20), this.renderer = new Ym({ canvas: t, antialias: true, powerPreference: "high-performance" }), this.renderer.setSize(window.innerWidth, window.innerHeight), this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)), this.renderer.shadowMap.enabled = true, this.renderer.shadowMap.type = Tc;
      const e = new ng(16777215, 0.45);
      this.scene.add(e), this.dirLight = new eg(16777215, 1.2), this.dirLight.position.set(45, 60, -30), this.dirLight.castShadow = true, this.dirLight.shadow.mapSize.width = 2048, this.dirLight.shadow.mapSize.height = 2048, this.dirLight.shadow.camera.near = 1, this.dirLight.shadow.camera.far = 300;
      const n = 80;
      this.dirLight.shadow.camera.left = -n, this.dirLight.shadow.camera.right = n, this.dirLight.shadow.camera.top = n, this.dirLight.shadow.camera.bottom = -n, this.dirLight.shadow.bias = -5e-4, this.scene.add(this.dirLight);
      const r = new Jm(16777215, 3359829, 0.35);
      this.scene.add(r), window.addEventListener("resize", this.onWindowResize.bind(this));
    }
    onWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight, this.camera.updateProjectionMatrix(), this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    render() {
      this.renderer.render(this.scene, this.camera);
    }
  }
  let h;
  const jt = new Array(128).fill(void 0);
  jt.push(void 0, null, true, false);
  let or = jt.length;
  function Fi(i) {
    or === jt.length && jt.push(jt.length + 1);
    const t = or;
    return or = jt[t], jt[t] = i, t;
  }
  function sg(i) {
    return jt[i];
  }
  function ag(i) {
    i < 132 || (jt[i] = or, or = i);
  }
  function ls(i) {
    const t = sg(i);
    return ag(i), t;
  }
  function gt(i) {
    return i == null;
  }
  let Xr = null;
  function cs() {
    return (Xr === null || Xr.byteLength === 0) && (Xr = new Float64Array(h.memory.buffer)), Xr;
  }
  let qr = null;
  function At() {
    return (qr === null || qr.byteLength === 0) && (qr = new Int32Array(h.memory.buffer)), qr;
  }
  const og = typeof TextDecoder > "u" ? (0, Vh.require)("util").TextDecoder : TextDecoder;
  let oh = new og("utf-8", { ignoreBOM: true, fatal: true });
  oh.decode();
  let jr = null;
  function lg() {
    return (jr === null || jr.byteLength === 0) && (jr = new Uint8Array(h.memory.buffer)), jr;
  }
  function cg(i, t) {
    return i = i >>> 0, oh.decode(lg().subarray(i, i + t));
  }
  function hg() {
    let i, t;
    try {
      const r = h.__wbindgen_add_to_stack_pointer(-16);
      h.version(r);
      var e = At()[r / 4 + 0], n = At()[r / 4 + 1];
      return i = e, t = n, cg(e, n);
    } finally {
      h.__wbindgen_add_to_stack_pointer(16), h.__wbindgen_free(i, t, 1);
    }
  }
  function R(i, t) {
    if (!(i instanceof t)) throw new Error(`expected instance of ${t.name}`);
    return i.ptr;
  }
  let Yr = null;
  function he() {
    return (Yr === null || Yr.byteLength === 0) && (Yr = new Float32Array(h.memory.buffer)), Yr;
  }
  let re = 128;
  function ue(i) {
    if (re == 1) throw new Error("out of js stack");
    return jt[--re] = i, re;
  }
  function tc(i, t) {
    return i = i >>> 0, he().subarray(i / 4, i / 4 + t);
  }
  let Kr = null;
  function lh() {
    return (Kr === null || Kr.byteLength === 0) && (Kr = new Uint32Array(h.memory.buffer)), Kr;
  }
  function ug(i, t) {
    return i = i >>> 0, lh().subarray(i / 4, i / 4 + t);
  }
  let We = 0;
  function ei(i, t) {
    const e = t(i.length * 4, 4) >>> 0;
    return he().set(i, e / 4), We = i.length, e;
  }
  function Zr(i, t) {
    const e = t(i.length * 4, 4) >>> 0;
    return lh().set(i, e / 4), We = i.length, e;
  }
  const Ce = Object.freeze({ Ball: 0, 0: "Ball", Cuboid: 1, 1: "Cuboid", Capsule: 2, 2: "Capsule", Segment: 3, 3: "Segment", Polyline: 4, 4: "Polyline", Triangle: 5, 5: "Triangle", TriMesh: 6, 6: "TriMesh", HeightField: 7, 7: "HeightField", Compound: 8, 8: "Compound", ConvexPolyhedron: 9, 9: "ConvexPolyhedron", Cylinder: 10, 10: "Cylinder", Cone: 11, 11: "Cone", RoundCuboid: 12, 12: "RoundCuboid", RoundTriangle: 13, 13: "RoundTriangle", RoundCylinder: 14, 14: "RoundCylinder", RoundCone: 15, 15: "RoundCone", RoundConvexPolyhedron: 16, 16: "RoundConvexPolyhedron", HalfSpace: 17, 17: "HalfSpace" }), ys = Object.freeze({ LinX: 0, 0: "LinX", LinY: 1, 1: "LinY", LinZ: 2, 2: "LinZ", AngX: 3, 3: "AngX", AngY: 4, 4: "AngY", AngZ: 5, 5: "AngZ" }), sn = Object.freeze({ Revolute: 0, 0: "Revolute", Fixed: 1, 1: "Fixed", Prismatic: 2, 2: "Prismatic", Rope: 3, 3: "Rope", Spring: 4, 4: "Spring", Spherical: 5, 5: "Spherical", Generic: 6, 6: "Generic" }), ec = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawbroadphase_free(i >>> 0));
  class di {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(di.prototype);
      return e.__wbg_ptr = t, ec.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, ec.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawbroadphase_free(t);
    }
    constructor() {
      const t = h.rawbroadphase_new();
      return this.__wbg_ptr = t >>> 0, this;
    }
  }
  const dg = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawccdsolver_free(i >>> 0));
  class Za {
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, dg.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawccdsolver_free(t);
    }
    constructor() {
      const t = h.rawccdsolver_new();
      return this.__wbg_ptr = t >>> 0, this;
    }
  }
  const fg = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawcharactercollision_free(i >>> 0));
  class ch {
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, fg.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawcharactercollision_free(t);
    }
    constructor() {
      const t = h.rawcharactercollision_new();
      return this.__wbg_ptr = t >>> 0, this;
    }
    handle() {
      return h.rawcharactercollision_handle(this.__wbg_ptr);
    }
    translationDeltaApplied() {
      const t = h.rawcharactercollision_translationDeltaApplied(this.__wbg_ptr);
      return D.__wrap(t);
    }
    translationDeltaRemaining() {
      const t = h.rawcharactercollision_translationDeltaRemaining(this.__wbg_ptr);
      return D.__wrap(t);
    }
    toi() {
      return h.rawcharactercollision_toi(this.__wbg_ptr);
    }
    worldWitness1() {
      const t = h.rawcharactercollision_worldWitness1(this.__wbg_ptr);
      return D.__wrap(t);
    }
    worldWitness2() {
      const t = h.rawcharactercollision_worldWitness2(this.__wbg_ptr);
      return D.__wrap(t);
    }
    worldNormal1() {
      const t = h.rawcharactercollision_worldNormal1(this.__wbg_ptr);
      return D.__wrap(t);
    }
    worldNormal2() {
      const t = h.rawcharactercollision_worldNormal2(this.__wbg_ptr);
      return D.__wrap(t);
    }
  }
  const nc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawcolliderset_free(i >>> 0));
  class fe {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(fe.prototype);
      return e.__wbg_ptr = t, nc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, nc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawcolliderset_free(t);
    }
    coTranslation(t) {
      const e = h.rawcolliderset_coTranslation(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    coRotation(t) {
      const e = h.rawcolliderset_coRotation(this.__wbg_ptr, t);
      return kt.__wrap(e);
    }
    coSetTranslation(t, e, n, r) {
      h.rawcolliderset_coSetTranslation(this.__wbg_ptr, t, e, n, r);
    }
    coSetTranslationWrtParent(t, e, n, r) {
      h.rawcolliderset_coSetTranslationWrtParent(this.__wbg_ptr, t, e, n, r);
    }
    coSetRotation(t, e, n, r, s) {
      h.rawcolliderset_coSetRotation(this.__wbg_ptr, t, e, n, r, s);
    }
    coSetRotationWrtParent(t, e, n, r, s) {
      h.rawcolliderset_coSetRotationWrtParent(this.__wbg_ptr, t, e, n, r, s);
    }
    coIsSensor(t) {
      return h.rawcolliderset_coIsSensor(this.__wbg_ptr, t) !== 0;
    }
    coShapeType(t) {
      return h.rawcolliderset_coShapeType(this.__wbg_ptr, t);
    }
    coHalfspaceNormal(t) {
      const e = h.rawcolliderset_coHalfspaceNormal(this.__wbg_ptr, t);
      return e === 0 ? void 0 : D.__wrap(e);
    }
    coHalfExtents(t) {
      const e = h.rawcolliderset_coHalfExtents(this.__wbg_ptr, t);
      return e === 0 ? void 0 : D.__wrap(e);
    }
    coSetHalfExtents(t, e) {
      R(e, D), h.rawcolliderset_coSetHalfExtents(this.__wbg_ptr, t, e.__wbg_ptr);
    }
    coRadius(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawcolliderset_coRadius(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    coSetRadius(t, e) {
      h.rawcolliderset_coSetRadius(this.__wbg_ptr, t, e);
    }
    coHalfHeight(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawcolliderset_coHalfHeight(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    coSetHalfHeight(t, e) {
      h.rawcolliderset_coSetHalfHeight(this.__wbg_ptr, t, e);
    }
    coRoundRadius(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawcolliderset_coRoundRadius(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    coSetRoundRadius(t, e) {
      h.rawcolliderset_coSetRoundRadius(this.__wbg_ptr, t, e);
    }
    coVertices(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawcolliderset_coVertices(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = At()[r / 4 + 1];
        let s;
        return e !== 0 && (s = tc(e, n).slice(), h.__wbindgen_free(e, n * 4, 4)), s;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    coIndices(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawcolliderset_coIndices(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = At()[r / 4 + 1];
        let s;
        return e !== 0 && (s = ug(e, n).slice(), h.__wbindgen_free(e, n * 4, 4)), s;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    coTriMeshFlags(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawcolliderset_coTriMeshFlags(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = At()[r / 4 + 1];
        return e === 0 ? void 0 : n >>> 0;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    coHeightFieldFlags(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawcolliderset_coHeightFieldFlags(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = At()[r / 4 + 1];
        return e === 0 ? void 0 : n >>> 0;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    coHeightfieldHeights(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawcolliderset_coHeightfieldHeights(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = At()[r / 4 + 1];
        let s;
        return e !== 0 && (s = tc(e, n).slice(), h.__wbindgen_free(e, n * 4, 4)), s;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    coHeightfieldScale(t) {
      const e = h.rawcolliderset_coHeightfieldScale(this.__wbg_ptr, t);
      return e === 0 ? void 0 : D.__wrap(e);
    }
    coHeightfieldNRows(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawcolliderset_coHeightfieldNRows(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = At()[r / 4 + 1];
        return e === 0 ? void 0 : n >>> 0;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    coHeightfieldNCols(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawcolliderset_coHeightfieldNCols(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = At()[r / 4 + 1];
        return e === 0 ? void 0 : n >>> 0;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    coParent(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawcolliderset_coParent(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = cs()[r / 8 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    coSetEnabled(t, e) {
      h.rawcolliderset_coSetEnabled(this.__wbg_ptr, t, e);
    }
    coIsEnabled(t) {
      return h.rawcolliderset_coIsEnabled(this.__wbg_ptr, t) !== 0;
    }
    coSetContactSkin(t, e) {
      h.rawcolliderset_coSetContactSkin(this.__wbg_ptr, t, e);
    }
    coContactSkin(t) {
      return h.rawcolliderset_coContactSkin(this.__wbg_ptr, t);
    }
    coFriction(t) {
      return h.rawcolliderset_coFriction(this.__wbg_ptr, t);
    }
    coRestitution(t) {
      return h.rawcolliderset_coRestitution(this.__wbg_ptr, t);
    }
    coDensity(t) {
      return h.rawcolliderset_coDensity(this.__wbg_ptr, t);
    }
    coMass(t) {
      return h.rawcolliderset_coMass(this.__wbg_ptr, t);
    }
    coVolume(t) {
      return h.rawcolliderset_coVolume(this.__wbg_ptr, t);
    }
    coCollisionGroups(t) {
      return h.rawcolliderset_coCollisionGroups(this.__wbg_ptr, t) >>> 0;
    }
    coSolverGroups(t) {
      return h.rawcolliderset_coSolverGroups(this.__wbg_ptr, t) >>> 0;
    }
    coActiveHooks(t) {
      return h.rawcolliderset_coActiveHooks(this.__wbg_ptr, t) >>> 0;
    }
    coActiveCollisionTypes(t) {
      return h.rawcolliderset_coActiveCollisionTypes(this.__wbg_ptr, t);
    }
    coActiveEvents(t) {
      return h.rawcolliderset_coActiveEvents(this.__wbg_ptr, t) >>> 0;
    }
    coContactForceEventThreshold(t) {
      return h.rawcolliderset_coContactForceEventThreshold(this.__wbg_ptr, t);
    }
    coContainsPoint(t, e) {
      return R(e, D), h.rawcolliderset_coContainsPoint(this.__wbg_ptr, t, e.__wbg_ptr) !== 0;
    }
    coCastShape(t, e, n, r, s, a, o, l, c) {
      R(e, D), R(n, Et), R(r, D), R(s, kt), R(a, D);
      const u = h.rawcolliderset_coCastShape(this.__wbg_ptr, t, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s.__wbg_ptr, a.__wbg_ptr, o, l, c);
      return u === 0 ? void 0 : Rs.__wrap(u);
    }
    coCastCollider(t, e, n, r, s, a, o) {
      R(e, D), R(r, D);
      const l = h.rawcolliderset_coCastCollider(this.__wbg_ptr, t, e.__wbg_ptr, n, r.__wbg_ptr, s, a, o);
      return l === 0 ? void 0 : Ms.__wrap(l);
    }
    coIntersectsShape(t, e, n, r) {
      return R(e, Et), R(n, D), R(r, kt), h.rawcolliderset_coIntersectsShape(this.__wbg_ptr, t, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr) !== 0;
    }
    coContactShape(t, e, n, r, s) {
      R(e, Et), R(n, D), R(r, kt);
      const a = h.rawcolliderset_coContactShape(this.__wbg_ptr, t, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s);
      return a === 0 ? void 0 : cr.__wrap(a);
    }
    coContactCollider(t, e, n) {
      const r = h.rawcolliderset_coContactCollider(this.__wbg_ptr, t, e, n);
      return r === 0 ? void 0 : cr.__wrap(r);
    }
    coProjectPoint(t, e, n) {
      R(e, D);
      const r = h.rawcolliderset_coProjectPoint(this.__wbg_ptr, t, e.__wbg_ptr, n);
      return Es.__wrap(r);
    }
    coIntersectsRay(t, e, n, r) {
      return R(e, D), R(n, D), h.rawcolliderset_coIntersectsRay(this.__wbg_ptr, t, e.__wbg_ptr, n.__wbg_ptr, r) !== 0;
    }
    coCastRay(t, e, n, r, s) {
      return R(e, D), R(n, D), h.rawcolliderset_coCastRay(this.__wbg_ptr, t, e.__wbg_ptr, n.__wbg_ptr, r, s);
    }
    coCastRayAndGetNormal(t, e, n, r, s) {
      R(e, D), R(n, D);
      const a = h.rawcolliderset_coCastRayAndGetNormal(this.__wbg_ptr, t, e.__wbg_ptr, n.__wbg_ptr, r, s);
      return a === 0 ? void 0 : Ts.__wrap(a);
    }
    coSetSensor(t, e) {
      h.rawcolliderset_coSetSensor(this.__wbg_ptr, t, e);
    }
    coSetRestitution(t, e) {
      h.rawcolliderset_coSetRestitution(this.__wbg_ptr, t, e);
    }
    coSetFriction(t, e) {
      h.rawcolliderset_coSetFriction(this.__wbg_ptr, t, e);
    }
    coFrictionCombineRule(t) {
      return h.rawcolliderset_coFrictionCombineRule(this.__wbg_ptr, t) >>> 0;
    }
    coSetFrictionCombineRule(t, e) {
      h.rawcolliderset_coSetFrictionCombineRule(this.__wbg_ptr, t, e);
    }
    coRestitutionCombineRule(t) {
      return h.rawcolliderset_coRestitutionCombineRule(this.__wbg_ptr, t) >>> 0;
    }
    coSetRestitutionCombineRule(t, e) {
      h.rawcolliderset_coSetRestitutionCombineRule(this.__wbg_ptr, t, e);
    }
    coSetCollisionGroups(t, e) {
      h.rawcolliderset_coSetCollisionGroups(this.__wbg_ptr, t, e);
    }
    coSetSolverGroups(t, e) {
      h.rawcolliderset_coSetSolverGroups(this.__wbg_ptr, t, e);
    }
    coSetActiveHooks(t, e) {
      h.rawcolliderset_coSetActiveHooks(this.__wbg_ptr, t, e);
    }
    coSetActiveEvents(t, e) {
      h.rawcolliderset_coSetActiveEvents(this.__wbg_ptr, t, e);
    }
    coSetActiveCollisionTypes(t, e) {
      h.rawcolliderset_coSetActiveCollisionTypes(this.__wbg_ptr, t, e);
    }
    coSetShape(t, e) {
      R(e, Et), h.rawcolliderset_coSetShape(this.__wbg_ptr, t, e.__wbg_ptr);
    }
    coSetContactForceEventThreshold(t, e) {
      h.rawcolliderset_coSetContactForceEventThreshold(this.__wbg_ptr, t, e);
    }
    coSetDensity(t, e) {
      h.rawcolliderset_coSetDensity(this.__wbg_ptr, t, e);
    }
    coSetMass(t, e) {
      h.rawcolliderset_coSetMass(this.__wbg_ptr, t, e);
    }
    coSetMassProperties(t, e, n, r, s) {
      R(n, D), R(r, D), R(s, kt), h.rawcolliderset_coSetMassProperties(this.__wbg_ptr, t, e, n.__wbg_ptr, r.__wbg_ptr, s.__wbg_ptr);
    }
    constructor() {
      const t = h.rawcolliderset_new();
      return this.__wbg_ptr = t >>> 0, this;
    }
    len() {
      return h.rawcolliderset_len(this.__wbg_ptr) >>> 0;
    }
    contains(t) {
      return h.rawcolliderset_contains(this.__wbg_ptr, t) !== 0;
    }
    createCollider(t, e, n, r, s, a, o, l, c, u, f, p, _, g, v, m, d, T, E, y, H, P, A, N, S) {
      try {
        const W = h.__wbindgen_add_to_stack_pointer(-16);
        R(e, Et), R(n, D), R(r, kt), R(o, D), R(l, D), R(c, kt), R(S, we), h.rawcolliderset_createCollider(W, this.__wbg_ptr, t, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s, a, o.__wbg_ptr, l.__wbg_ptr, c.__wbg_ptr, u, f, p, _, g, v, m, d, T, E, y, H, P, A, N, S.__wbg_ptr);
        var x = At()[W / 4 + 0], C = cs()[W / 8 + 1];
        return x === 0 ? void 0 : C;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    remove(t, e, n, r) {
      R(e, In), R(n, we), h.rawcolliderset_remove(this.__wbg_ptr, t, e.__wbg_ptr, n.__wbg_ptr, r);
    }
    isHandleValid(t) {
      return h.rawcolliderset_contains(this.__wbg_ptr, t) !== 0;
    }
    forEachColliderHandle(t) {
      try {
        h.rawcolliderset_forEachColliderHandle(this.__wbg_ptr, ue(t));
      } finally {
        jt[re++] = void 0;
      }
    }
  }
  const ic = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawcollidershapecasthit_free(i >>> 0));
  class Ms {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(Ms.prototype);
      return e.__wbg_ptr = t, ic.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, ic.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawcollidershapecasthit_free(t);
    }
    colliderHandle() {
      return h.rawcharactercollision_handle(this.__wbg_ptr);
    }
    time_of_impact() {
      return h.rawcollidershapecasthit_time_of_impact(this.__wbg_ptr);
    }
    witness1() {
      const t = h.rawcollidershapecasthit_witness1(this.__wbg_ptr);
      return D.__wrap(t);
    }
    witness2() {
      const t = h.rawcollidershapecasthit_witness2(this.__wbg_ptr);
      return D.__wrap(t);
    }
    normal1() {
      const t = h.rawcharactercollision_translationDeltaApplied(this.__wbg_ptr);
      return D.__wrap(t);
    }
    normal2() {
      const t = h.rawcharactercollision_translationDeltaRemaining(this.__wbg_ptr);
      return D.__wrap(t);
    }
  }
  typeof FinalizationRegistry > "u" || new FinalizationRegistry((i) => h.__wbg_rawcontactforceevent_free(i >>> 0));
  const rc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawcontactmanifold_free(i >>> 0));
  class bo {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(bo.prototype);
      return e.__wbg_ptr = t, rc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, rc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawcontactmanifold_free(t);
    }
    normal() {
      const t = h.rawcontactmanifold_normal(this.__wbg_ptr);
      return D.__wrap(t);
    }
    local_n1() {
      const t = h.rawcontactmanifold_local_n1(this.__wbg_ptr);
      return D.__wrap(t);
    }
    local_n2() {
      const t = h.rawcontactmanifold_local_n2(this.__wbg_ptr);
      return D.__wrap(t);
    }
    subshape1() {
      return h.rawcontactmanifold_subshape1(this.__wbg_ptr) >>> 0;
    }
    subshape2() {
      return h.rawcontactmanifold_subshape2(this.__wbg_ptr) >>> 0;
    }
    num_contacts() {
      return h.rawcontactmanifold_num_contacts(this.__wbg_ptr) >>> 0;
    }
    contact_local_p1(t) {
      const e = h.rawcontactmanifold_contact_local_p1(this.__wbg_ptr, t);
      return e === 0 ? void 0 : D.__wrap(e);
    }
    contact_local_p2(t) {
      const e = h.rawcontactmanifold_contact_local_p2(this.__wbg_ptr, t);
      return e === 0 ? void 0 : D.__wrap(e);
    }
    contact_dist(t) {
      return h.rawcontactmanifold_contact_dist(this.__wbg_ptr, t);
    }
    contact_fid1(t) {
      return h.rawcontactmanifold_contact_fid1(this.__wbg_ptr, t) >>> 0;
    }
    contact_fid2(t) {
      return h.rawcontactmanifold_contact_fid2(this.__wbg_ptr, t) >>> 0;
    }
    contact_impulse(t) {
      return h.rawcontactmanifold_contact_impulse(this.__wbg_ptr, t);
    }
    contact_tangent_impulse_x(t) {
      return h.rawcontactmanifold_contact_tangent_impulse_x(this.__wbg_ptr, t);
    }
    contact_tangent_impulse_y(t) {
      return h.rawcontactmanifold_contact_tangent_impulse_y(this.__wbg_ptr, t);
    }
    num_solver_contacts() {
      return h.rawcontactmanifold_num_solver_contacts(this.__wbg_ptr) >>> 0;
    }
    solver_contact_point(t) {
      const e = h.rawcontactmanifold_solver_contact_point(this.__wbg_ptr, t);
      return e === 0 ? void 0 : D.__wrap(e);
    }
    solver_contact_dist(t) {
      return h.rawcontactmanifold_solver_contact_dist(this.__wbg_ptr, t);
    }
    solver_contact_friction(t) {
      return h.rawcontactmanifold_solver_contact_friction(this.__wbg_ptr, t);
    }
    solver_contact_restitution(t) {
      return h.rawcontactmanifold_solver_contact_restitution(this.__wbg_ptr, t);
    }
    solver_contact_tangent_velocity(t) {
      const e = h.rawcontactmanifold_solver_contact_tangent_velocity(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
  }
  const sc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawcontactpair_free(i >>> 0));
  class xo {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(xo.prototype);
      return e.__wbg_ptr = t, sc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, sc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawcontactpair_free(t);
    }
    collider1() {
      return h.rawcontactpair_collider1(this.__wbg_ptr);
    }
    collider2() {
      return h.rawcontactpair_collider2(this.__wbg_ptr);
    }
    numContactManifolds() {
      return h.rawcontactpair_numContactManifolds(this.__wbg_ptr) >>> 0;
    }
    contactManifold(t) {
      const e = h.rawcontactpair_contactManifold(this.__wbg_ptr, t);
      return e === 0 ? void 0 : bo.__wrap(e);
    }
  }
  const pg = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawdebugrenderpipeline_free(i >>> 0));
  class _g {
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, pg.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawdebugrenderpipeline_free(t);
    }
    constructor() {
      const t = h.rawdebugrenderpipeline_new();
      return this.__wbg_ptr = t >>> 0, this;
    }
    vertices() {
      const t = h.rawdebugrenderpipeline_vertices(this.__wbg_ptr);
      return ls(t);
    }
    colors() {
      const t = h.rawdebugrenderpipeline_colors(this.__wbg_ptr);
      return ls(t);
    }
    render(t, e, n, r, s) {
      R(t, we), R(e, fe), R(n, Pn), R(r, Ln), R(s, qn), h.rawdebugrenderpipeline_render(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s.__wbg_ptr);
    }
  }
  const ac = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawdeserializedworld_free(i >>> 0));
  class So {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(So.prototype);
      return e.__wbg_ptr = t, ac.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, ac.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawdeserializedworld_free(t);
    }
    takeGravity() {
      const t = h.rawdeserializedworld_takeGravity(this.__wbg_ptr);
      return t === 0 ? void 0 : D.__wrap(t);
    }
    takeIntegrationParameters() {
      const t = h.rawdeserializedworld_takeIntegrationParameters(this.__wbg_ptr);
      return t === 0 ? void 0 : fi.__wrap(t);
    }
    takeIslandManager() {
      const t = h.rawdeserializedworld_takeIslandManager(this.__wbg_ptr);
      return t === 0 ? void 0 : In.__wrap(t);
    }
    takeBroadPhase() {
      const t = h.rawdeserializedworld_takeBroadPhase(this.__wbg_ptr);
      return t === 0 ? void 0 : di.__wrap(t);
    }
    takeNarrowPhase() {
      const t = h.rawdeserializedworld_takeNarrowPhase(this.__wbg_ptr);
      return t === 0 ? void 0 : qn.__wrap(t);
    }
    takeBodies() {
      const t = h.rawdeserializedworld_takeBodies(this.__wbg_ptr);
      return t === 0 ? void 0 : we.__wrap(t);
    }
    takeColliders() {
      const t = h.rawdeserializedworld_takeColliders(this.__wbg_ptr);
      return t === 0 ? void 0 : fe.__wrap(t);
    }
    takeImpulseJoints() {
      const t = h.rawdeserializedworld_takeImpulseJoints(this.__wbg_ptr);
      return t === 0 ? void 0 : Pn.__wrap(t);
    }
    takeMultibodyJoints() {
      const t = h.rawdeserializedworld_takeMultibodyJoints(this.__wbg_ptr);
      return t === 0 ? void 0 : Ln.__wrap(t);
    }
  }
  const mg = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawdynamicraycastvehiclecontroller_free(i >>> 0));
  class gg {
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, mg.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawdynamicraycastvehiclecontroller_free(t);
    }
    constructor(t) {
      const e = h.rawdynamicraycastvehiclecontroller_new(t);
      return this.__wbg_ptr = e >>> 0, this;
    }
    current_vehicle_speed() {
      return h.rawdynamicraycastvehiclecontroller_current_vehicle_speed(this.__wbg_ptr);
    }
    chassis() {
      return h.rawdynamicraycastvehiclecontroller_chassis(this.__wbg_ptr);
    }
    index_up_axis() {
      return h.rawdynamicraycastvehiclecontroller_index_up_axis(this.__wbg_ptr) >>> 0;
    }
    set_index_up_axis(t) {
      h.rawdynamicraycastvehiclecontroller_set_index_up_axis(this.__wbg_ptr, t);
    }
    index_forward_axis() {
      return h.rawdynamicraycastvehiclecontroller_index_forward_axis(this.__wbg_ptr) >>> 0;
    }
    set_index_forward_axis(t) {
      h.rawdynamicraycastvehiclecontroller_set_index_forward_axis(this.__wbg_ptr, t);
    }
    add_wheel(t, e, n, r, s) {
      R(t, D), R(e, D), R(n, D), h.rawdynamicraycastvehiclecontroller_add_wheel(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r, s);
    }
    num_wheels() {
      return h.rawdynamicraycastvehiclecontroller_num_wheels(this.__wbg_ptr) >>> 0;
    }
    update_vehicle(t, e, n, r, s, a, o) {
      try {
        R(e, we), R(n, fe), R(r, yo), h.rawdynamicraycastvehiclecontroller_update_vehicle(this.__wbg_ptr, t, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s, !gt(a), gt(a) ? 0 : a, ue(o));
      } finally {
        jt[re++] = void 0;
      }
    }
    wheel_chassis_connection_point_cs(t) {
      const e = h.rawdynamicraycastvehiclecontroller_wheel_chassis_connection_point_cs(this.__wbg_ptr, t);
      return e === 0 ? void 0 : D.__wrap(e);
    }
    set_wheel_chassis_connection_point_cs(t, e) {
      R(e, D), h.rawdynamicraycastvehiclecontroller_set_wheel_chassis_connection_point_cs(this.__wbg_ptr, t, e.__wbg_ptr);
    }
    wheel_suspension_rest_length(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_suspension_rest_length(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    set_wheel_suspension_rest_length(t, e) {
      h.rawdynamicraycastvehiclecontroller_set_wheel_suspension_rest_length(this.__wbg_ptr, t, e);
    }
    wheel_max_suspension_travel(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_max_suspension_travel(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    set_wheel_max_suspension_travel(t, e) {
      h.rawdynamicraycastvehiclecontroller_set_wheel_max_suspension_travel(this.__wbg_ptr, t, e);
    }
    wheel_radius(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_radius(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    set_wheel_radius(t, e) {
      h.rawdynamicraycastvehiclecontroller_set_wheel_radius(this.__wbg_ptr, t, e);
    }
    wheel_suspension_stiffness(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_suspension_stiffness(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    set_wheel_suspension_stiffness(t, e) {
      h.rawdynamicraycastvehiclecontroller_set_wheel_suspension_stiffness(this.__wbg_ptr, t, e);
    }
    wheel_suspension_compression(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_suspension_compression(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    set_wheel_suspension_compression(t, e) {
      h.rawdynamicraycastvehiclecontroller_set_wheel_suspension_compression(this.__wbg_ptr, t, e);
    }
    wheel_suspension_relaxation(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_suspension_relaxation(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    set_wheel_suspension_relaxation(t, e) {
      h.rawdynamicraycastvehiclecontroller_set_wheel_suspension_relaxation(this.__wbg_ptr, t, e);
    }
    wheel_max_suspension_force(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_max_suspension_force(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    set_wheel_max_suspension_force(t, e) {
      h.rawdynamicraycastvehiclecontroller_set_wheel_max_suspension_force(this.__wbg_ptr, t, e);
    }
    wheel_brake(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_brake(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    set_wheel_brake(t, e) {
      h.rawdynamicraycastvehiclecontroller_set_wheel_brake(this.__wbg_ptr, t, e);
    }
    wheel_steering(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_steering(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    set_wheel_steering(t, e) {
      h.rawdynamicraycastvehiclecontroller_set_wheel_steering(this.__wbg_ptr, t, e);
    }
    wheel_engine_force(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_engine_force(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    set_wheel_engine_force(t, e) {
      h.rawdynamicraycastvehiclecontroller_set_wheel_engine_force(this.__wbg_ptr, t, e);
    }
    wheel_direction_cs(t) {
      const e = h.rawdynamicraycastvehiclecontroller_wheel_direction_cs(this.__wbg_ptr, t);
      return e === 0 ? void 0 : D.__wrap(e);
    }
    set_wheel_direction_cs(t, e) {
      R(e, D), h.rawdynamicraycastvehiclecontroller_set_wheel_direction_cs(this.__wbg_ptr, t, e.__wbg_ptr);
    }
    wheel_axle_cs(t) {
      const e = h.rawdynamicraycastvehiclecontroller_wheel_axle_cs(this.__wbg_ptr, t);
      return e === 0 ? void 0 : D.__wrap(e);
    }
    set_wheel_axle_cs(t, e) {
      R(e, D), h.rawdynamicraycastvehiclecontroller_set_wheel_axle_cs(this.__wbg_ptr, t, e.__wbg_ptr);
    }
    wheel_friction_slip(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_friction_slip(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    set_wheel_friction_slip(t, e) {
      h.rawdynamicraycastvehiclecontroller_set_wheel_friction_slip(this.__wbg_ptr, t, e);
    }
    wheel_side_friction_stiffness(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_side_friction_stiffness(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    set_wheel_side_friction_stiffness(t, e) {
      h.rawdynamicraycastvehiclecontroller_set_wheel_side_friction_stiffness(this.__wbg_ptr, t, e);
    }
    wheel_rotation(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_rotation(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    wheel_forward_impulse(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_forward_impulse(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    wheel_side_impulse(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_side_impulse(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    wheel_suspension_force(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_suspension_force(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    wheel_contact_normal_ws(t) {
      const e = h.rawdynamicraycastvehiclecontroller_wheel_contact_normal_ws(this.__wbg_ptr, t);
      return e === 0 ? void 0 : D.__wrap(e);
    }
    wheel_contact_point_ws(t) {
      const e = h.rawdynamicraycastvehiclecontroller_wheel_contact_point_ws(this.__wbg_ptr, t);
      return e === 0 ? void 0 : D.__wrap(e);
    }
    wheel_suspension_length(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_suspension_length(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = he()[r / 4 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    wheel_hard_point_ws(t) {
      const e = h.rawdynamicraycastvehiclecontroller_wheel_hard_point_ws(this.__wbg_ptr, t);
      return e === 0 ? void 0 : D.__wrap(e);
    }
    wheel_is_in_contact(t) {
      return h.rawdynamicraycastvehiclecontroller_wheel_is_in_contact(this.__wbg_ptr, t) !== 0;
    }
    wheel_ground_object(t) {
      try {
        const r = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawdynamicraycastvehiclecontroller_wheel_ground_object(r, this.__wbg_ptr, t);
        var e = At()[r / 4 + 0], n = cs()[r / 8 + 1];
        return e === 0 ? void 0 : n;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
  }
  const wg = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_raweventqueue_free(i >>> 0));
  class hh {
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, wg.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_raweventqueue_free(t);
    }
    constructor(t) {
      const e = h.raweventqueue_new(t);
      return this.__wbg_ptr = e >>> 0, this;
    }
    drainCollisionEvents(t) {
      try {
        h.raweventqueue_drainCollisionEvents(this.__wbg_ptr, ue(t));
      } finally {
        jt[re++] = void 0;
      }
    }
    drainContactForceEvents(t) {
      try {
        h.raweventqueue_drainContactForceEvents(this.__wbg_ptr, ue(t));
      } finally {
        jt[re++] = void 0;
      }
    }
    clear() {
      h.raweventqueue_clear(this.__wbg_ptr);
    }
  }
  const oc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawgenericjoint_free(i >>> 0));
  class Te {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(Te.prototype);
      return e.__wbg_ptr = t, oc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, oc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawgenericjoint_free(t);
    }
    static generic(t, e, n, r) {
      R(t, D), R(e, D), R(n, D);
      const s = h.rawgenericjoint_generic(t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r);
      return s === 0 ? void 0 : Te.__wrap(s);
    }
    static spring(t, e, n, r, s) {
      R(r, D), R(s, D);
      const a = h.rawgenericjoint_spring(t, e, n, r.__wbg_ptr, s.__wbg_ptr);
      return Te.__wrap(a);
    }
    static rope(t, e, n) {
      R(e, D), R(n, D);
      const r = h.rawgenericjoint_rope(t, e.__wbg_ptr, n.__wbg_ptr);
      return Te.__wrap(r);
    }
    static spherical(t, e) {
      R(t, D), R(e, D);
      const n = h.rawgenericjoint_spherical(t.__wbg_ptr, e.__wbg_ptr);
      return Te.__wrap(n);
    }
    static prismatic(t, e, n, r, s, a) {
      R(t, D), R(e, D), R(n, D);
      const o = h.rawgenericjoint_prismatic(t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r, s, a);
      return o === 0 ? void 0 : Te.__wrap(o);
    }
    static fixed(t, e, n, r) {
      R(t, D), R(e, kt), R(n, D), R(r, kt);
      const s = h.rawgenericjoint_fixed(t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr);
      return Te.__wrap(s);
    }
    static revolute(t, e, n) {
      R(t, D), R(e, D), R(n, D);
      const r = h.rawgenericjoint_revolute(t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr);
      return r === 0 ? void 0 : Te.__wrap(r);
    }
  }
  const lc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawimpulsejointset_free(i >>> 0));
  class Pn {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(Pn.prototype);
      return e.__wbg_ptr = t, lc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, lc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawimpulsejointset_free(t);
    }
    jointType(t) {
      return h.rawimpulsejointset_jointType(this.__wbg_ptr, t);
    }
    jointBodyHandle1(t) {
      return h.rawimpulsejointset_jointBodyHandle1(this.__wbg_ptr, t);
    }
    jointBodyHandle2(t) {
      return h.rawimpulsejointset_jointBodyHandle2(this.__wbg_ptr, t);
    }
    jointFrameX1(t) {
      const e = h.rawimpulsejointset_jointFrameX1(this.__wbg_ptr, t);
      return kt.__wrap(e);
    }
    jointFrameX2(t) {
      const e = h.rawimpulsejointset_jointFrameX2(this.__wbg_ptr, t);
      return kt.__wrap(e);
    }
    jointAnchor1(t) {
      const e = h.rawimpulsejointset_jointAnchor1(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    jointAnchor2(t) {
      const e = h.rawimpulsejointset_jointAnchor2(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    jointSetAnchor1(t, e) {
      R(e, D), h.rawimpulsejointset_jointSetAnchor1(this.__wbg_ptr, t, e.__wbg_ptr);
    }
    jointSetAnchor2(t, e) {
      R(e, D), h.rawimpulsejointset_jointSetAnchor2(this.__wbg_ptr, t, e.__wbg_ptr);
    }
    jointContactsEnabled(t) {
      return h.rawimpulsejointset_jointContactsEnabled(this.__wbg_ptr, t) !== 0;
    }
    jointSetContactsEnabled(t, e) {
      h.rawimpulsejointset_jointSetContactsEnabled(this.__wbg_ptr, t, e);
    }
    jointLimitsEnabled(t, e) {
      return h.rawimpulsejointset_jointLimitsEnabled(this.__wbg_ptr, t, e) !== 0;
    }
    jointLimitsMin(t, e) {
      return h.rawimpulsejointset_jointLimitsMin(this.__wbg_ptr, t, e);
    }
    jointLimitsMax(t, e) {
      return h.rawimpulsejointset_jointLimitsMax(this.__wbg_ptr, t, e);
    }
    jointSetLimits(t, e, n, r) {
      h.rawimpulsejointset_jointSetLimits(this.__wbg_ptr, t, e, n, r);
    }
    jointConfigureMotorModel(t, e, n) {
      h.rawimpulsejointset_jointConfigureMotorModel(this.__wbg_ptr, t, e, n);
    }
    jointConfigureMotorVelocity(t, e, n, r) {
      h.rawimpulsejointset_jointConfigureMotorVelocity(this.__wbg_ptr, t, e, n, r);
    }
    jointConfigureMotorPosition(t, e, n, r, s) {
      h.rawimpulsejointset_jointConfigureMotorPosition(this.__wbg_ptr, t, e, n, r, s);
    }
    jointConfigureMotor(t, e, n, r, s, a) {
      h.rawimpulsejointset_jointConfigureMotor(this.__wbg_ptr, t, e, n, r, s, a);
    }
    constructor() {
      const t = h.rawimpulsejointset_new();
      return this.__wbg_ptr = t >>> 0, this;
    }
    createJoint(t, e, n, r) {
      return R(t, Te), h.rawimpulsejointset_createJoint(this.__wbg_ptr, t.__wbg_ptr, e, n, r);
    }
    remove(t, e) {
      h.rawimpulsejointset_remove(this.__wbg_ptr, t, e);
    }
    len() {
      return h.rawimpulsejointset_len(this.__wbg_ptr) >>> 0;
    }
    contains(t) {
      return h.rawimpulsejointset_contains(this.__wbg_ptr, t) !== 0;
    }
    forEachJointHandle(t) {
      try {
        h.rawimpulsejointset_forEachJointHandle(this.__wbg_ptr, ue(t));
      } finally {
        jt[re++] = void 0;
      }
    }
    forEachJointAttachedToRigidBody(t, e) {
      try {
        h.rawimpulsejointset_forEachJointAttachedToRigidBody(this.__wbg_ptr, t, ue(e));
      } finally {
        jt[re++] = void 0;
      }
    }
  }
  const cc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawintegrationparameters_free(i >>> 0));
  class fi {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(fi.prototype);
      return e.__wbg_ptr = t, cc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, cc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawintegrationparameters_free(t);
    }
    constructor() {
      const t = h.rawintegrationparameters_new();
      return this.__wbg_ptr = t >>> 0, this;
    }
    get dt() {
      return h.rawintegrationparameters_dt(this.__wbg_ptr);
    }
    get contact_erp() {
      return h.rawintegrationparameters_contact_erp(this.__wbg_ptr);
    }
    get normalizedAllowedLinearError() {
      return h.rawdynamicraycastvehiclecontroller_current_vehicle_speed(this.__wbg_ptr);
    }
    get normalizedPredictionDistance() {
      return h.rawcontactforceevent_max_force_magnitude(this.__wbg_ptr);
    }
    get numSolverIterations() {
      return h.rawintegrationparameters_numSolverIterations(this.__wbg_ptr) >>> 0;
    }
    get numAdditionalFrictionIterations() {
      return h.rawdynamicraycastvehiclecontroller_index_up_axis(this.__wbg_ptr) >>> 0;
    }
    get numInternalPgsIterations() {
      return h.rawdynamicraycastvehiclecontroller_index_forward_axis(this.__wbg_ptr) >>> 0;
    }
    get minIslandSize() {
      return h.rawimpulsejointset_len(this.__wbg_ptr) >>> 0;
    }
    get maxCcdSubsteps() {
      return h.rawintegrationparameters_maxCcdSubsteps(this.__wbg_ptr) >>> 0;
    }
    get lengthUnit() {
      return h.rawintegrationparameters_lengthUnit(this.__wbg_ptr);
    }
    set dt(t) {
      h.rawintegrationparameters_set_dt(this.__wbg_ptr, t);
    }
    set contact_natural_frequency(t) {
      h.rawintegrationparameters_set_contact_natural_frequency(this.__wbg_ptr, t);
    }
    set normalizedAllowedLinearError(t) {
      h.rawintegrationparameters_set_normalizedAllowedLinearError(this.__wbg_ptr, t);
    }
    set normalizedPredictionDistance(t) {
      h.rawintegrationparameters_set_normalizedPredictionDistance(this.__wbg_ptr, t);
    }
    set numSolverIterations(t) {
      h.rawintegrationparameters_set_numSolverIterations(this.__wbg_ptr, t);
    }
    set numAdditionalFrictionIterations(t) {
      h.rawdynamicraycastvehiclecontroller_set_index_up_axis(this.__wbg_ptr, t);
    }
    set numInternalPgsIterations(t) {
      h.rawdynamicraycastvehiclecontroller_set_index_forward_axis(this.__wbg_ptr, t);
    }
    set minIslandSize(t) {
      h.rawintegrationparameters_set_minIslandSize(this.__wbg_ptr, t);
    }
    set maxCcdSubsteps(t) {
      h.rawintegrationparameters_set_maxCcdSubsteps(this.__wbg_ptr, t);
    }
    set lengthUnit(t) {
      h.rawintegrationparameters_set_lengthUnit(this.__wbg_ptr, t);
    }
    switchToStandardPgsSolver() {
      h.rawintegrationparameters_switchToStandardPgsSolver(this.__wbg_ptr);
    }
    switchToSmallStepsPgsSolver() {
      h.rawintegrationparameters_switchToSmallStepsPgsSolver(this.__wbg_ptr);
    }
    switchToSmallStepsPgsSolverWithoutWarmstart() {
      h.rawintegrationparameters_switchToSmallStepsPgsSolverWithoutWarmstart(this.__wbg_ptr);
    }
  }
  const hc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawislandmanager_free(i >>> 0));
  class In {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(In.prototype);
      return e.__wbg_ptr = t, hc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, hc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawislandmanager_free(t);
    }
    constructor() {
      const t = h.rawislandmanager_new();
      return this.__wbg_ptr = t >>> 0, this;
    }
    forEachActiveRigidBodyHandle(t) {
      try {
        h.rawislandmanager_forEachActiveRigidBodyHandle(this.__wbg_ptr, ue(t));
      } finally {
        jt[re++] = void 0;
      }
    }
  }
  const vg = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawkinematiccharactercontroller_free(i >>> 0));
  class bg {
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, vg.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawkinematiccharactercontroller_free(t);
    }
    constructor(t) {
      const e = h.rawkinematiccharactercontroller_new(t);
      return this.__wbg_ptr = e >>> 0, this;
    }
    up() {
      const t = h.rawcharactercollision_translationDeltaApplied(this.__wbg_ptr);
      return D.__wrap(t);
    }
    setUp(t) {
      R(t, D), h.rawkinematiccharactercontroller_setUp(this.__wbg_ptr, t.__wbg_ptr);
    }
    normalNudgeFactor() {
      return h.rawkinematiccharactercontroller_normalNudgeFactor(this.__wbg_ptr);
    }
    setNormalNudgeFactor(t) {
      h.rawkinematiccharactercontroller_setNormalNudgeFactor(this.__wbg_ptr, t);
    }
    offset() {
      return h.rawintegrationparameters_dt(this.__wbg_ptr);
    }
    setOffset(t) {
      h.rawkinematiccharactercontroller_setOffset(this.__wbg_ptr, t);
    }
    slideEnabled() {
      return h.rawkinematiccharactercontroller_slideEnabled(this.__wbg_ptr) !== 0;
    }
    setSlideEnabled(t) {
      h.rawkinematiccharactercontroller_setSlideEnabled(this.__wbg_ptr, t);
    }
    autostepMaxHeight() {
      try {
        const n = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawkinematiccharactercontroller_autostepMaxHeight(n, this.__wbg_ptr);
        var t = At()[n / 4 + 0], e = he()[n / 4 + 1];
        return t === 0 ? void 0 : e;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    autostepMinWidth() {
      try {
        const n = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawkinematiccharactercontroller_autostepMinWidth(n, this.__wbg_ptr);
        var t = At()[n / 4 + 0], e = he()[n / 4 + 1];
        return t === 0 ? void 0 : e;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    autostepIncludesDynamicBodies() {
      const t = h.rawkinematiccharactercontroller_autostepIncludesDynamicBodies(this.__wbg_ptr);
      return t === 16777215 ? void 0 : t !== 0;
    }
    autostepEnabled() {
      return h.rawkinematiccharactercontroller_autostepEnabled(this.__wbg_ptr) !== 0;
    }
    enableAutostep(t, e, n) {
      h.rawkinematiccharactercontroller_enableAutostep(this.__wbg_ptr, t, e, n);
    }
    disableAutostep() {
      h.rawkinematiccharactercontroller_disableAutostep(this.__wbg_ptr);
    }
    maxSlopeClimbAngle() {
      return h.rawkinematiccharactercontroller_maxSlopeClimbAngle(this.__wbg_ptr);
    }
    setMaxSlopeClimbAngle(t) {
      h.rawkinematiccharactercontroller_setMaxSlopeClimbAngle(this.__wbg_ptr, t);
    }
    minSlopeSlideAngle() {
      return h.rawkinematiccharactercontroller_minSlopeSlideAngle(this.__wbg_ptr);
    }
    setMinSlopeSlideAngle(t) {
      h.rawkinematiccharactercontroller_setMinSlopeSlideAngle(this.__wbg_ptr, t);
    }
    snapToGroundDistance() {
      try {
        const n = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawkinematiccharactercontroller_snapToGroundDistance(n, this.__wbg_ptr);
        var t = At()[n / 4 + 0], e = he()[n / 4 + 1];
        return t === 0 ? void 0 : e;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
    enableSnapToGround(t) {
      h.rawkinematiccharactercontroller_enableSnapToGround(this.__wbg_ptr, t);
    }
    disableSnapToGround() {
      h.rawkinematiccharactercontroller_disableSnapToGround(this.__wbg_ptr);
    }
    snapToGroundEnabled() {
      return h.rawkinematiccharactercontroller_snapToGroundEnabled(this.__wbg_ptr) !== 0;
    }
    computeColliderMovement(t, e, n, r, s, a, o, l, c, u, f) {
      try {
        R(e, we), R(n, fe), R(r, yo), R(a, D), h.rawkinematiccharactercontroller_computeColliderMovement(this.__wbg_ptr, t, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s, a.__wbg_ptr, o, !gt(l), gt(l) ? 0 : l, c, !gt(u), gt(u) ? 0 : u, ue(f));
      } finally {
        jt[re++] = void 0;
      }
    }
    computedMovement() {
      const t = h.rawkinematiccharactercontroller_computedMovement(this.__wbg_ptr);
      return D.__wrap(t);
    }
    computedGrounded() {
      return h.rawkinematiccharactercontroller_computedGrounded(this.__wbg_ptr) !== 0;
    }
    numComputedCollisions() {
      return h.rawkinematiccharactercontroller_numComputedCollisions(this.__wbg_ptr) >>> 0;
    }
    computedCollision(t, e) {
      return R(e, ch), h.rawkinematiccharactercontroller_computedCollision(this.__wbg_ptr, t, e.__wbg_ptr) !== 0;
    }
  }
  const uc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawmultibodyjointset_free(i >>> 0));
  class Ln {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(Ln.prototype);
      return e.__wbg_ptr = t, uc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, uc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawmultibodyjointset_free(t);
    }
    jointType(t) {
      return h.rawmultibodyjointset_jointType(this.__wbg_ptr, t);
    }
    jointFrameX1(t) {
      const e = h.rawmultibodyjointset_jointFrameX1(this.__wbg_ptr, t);
      return kt.__wrap(e);
    }
    jointFrameX2(t) {
      const e = h.rawmultibodyjointset_jointFrameX2(this.__wbg_ptr, t);
      return kt.__wrap(e);
    }
    jointAnchor1(t) {
      const e = h.rawmultibodyjointset_jointAnchor1(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    jointAnchor2(t) {
      const e = h.rawmultibodyjointset_jointAnchor2(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    jointContactsEnabled(t) {
      return h.rawmultibodyjointset_jointContactsEnabled(this.__wbg_ptr, t) !== 0;
    }
    jointSetContactsEnabled(t, e) {
      h.rawmultibodyjointset_jointSetContactsEnabled(this.__wbg_ptr, t, e);
    }
    jointLimitsEnabled(t, e) {
      return h.rawmultibodyjointset_jointLimitsEnabled(this.__wbg_ptr, t, e) !== 0;
    }
    jointLimitsMin(t, e) {
      return h.rawmultibodyjointset_jointLimitsMin(this.__wbg_ptr, t, e);
    }
    jointLimitsMax(t, e) {
      return h.rawmultibodyjointset_jointLimitsMax(this.__wbg_ptr, t, e);
    }
    constructor() {
      const t = h.rawmultibodyjointset_new();
      return this.__wbg_ptr = t >>> 0, this;
    }
    createJoint(t, e, n, r) {
      return R(t, Te), h.rawmultibodyjointset_createJoint(this.__wbg_ptr, t.__wbg_ptr, e, n, r);
    }
    remove(t, e) {
      h.rawmultibodyjointset_remove(this.__wbg_ptr, t, e);
    }
    contains(t) {
      return h.rawmultibodyjointset_contains(this.__wbg_ptr, t) !== 0;
    }
    forEachJointHandle(t) {
      try {
        h.rawmultibodyjointset_forEachJointHandle(this.__wbg_ptr, ue(t));
      } finally {
        jt[re++] = void 0;
      }
    }
    forEachJointAttachedToRigidBody(t, e) {
      try {
        h.rawmultibodyjointset_forEachJointAttachedToRigidBody(this.__wbg_ptr, t, ue(e));
      } finally {
        jt[re++] = void 0;
      }
    }
  }
  const dc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawnarrowphase_free(i >>> 0));
  class qn {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(qn.prototype);
      return e.__wbg_ptr = t, dc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, dc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawnarrowphase_free(t);
    }
    constructor() {
      const t = h.rawnarrowphase_new();
      return this.__wbg_ptr = t >>> 0, this;
    }
    contact_pairs_with(t, e) {
      h.rawnarrowphase_contact_pairs_with(this.__wbg_ptr, t, Fi(e));
    }
    contact_pair(t, e) {
      const n = h.rawnarrowphase_contact_pair(this.__wbg_ptr, t, e);
      return n === 0 ? void 0 : xo.__wrap(n);
    }
    intersection_pairs_with(t, e) {
      h.rawnarrowphase_intersection_pairs_with(this.__wbg_ptr, t, Fi(e));
    }
    intersection_pair(t, e) {
      return h.rawnarrowphase_intersection_pair(this.__wbg_ptr, t, e) !== 0;
    }
  }
  const xg = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawphysicspipeline_free(i >>> 0));
  class Sg {
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, xg.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawphysicspipeline_free(t);
    }
    constructor() {
      const t = h.rawphysicspipeline_new();
      return this.__wbg_ptr = t >>> 0, this;
    }
    step(t, e, n, r, s, a, o, l, c, u) {
      R(t, D), R(e, fi), R(n, In), R(r, di), R(s, qn), R(a, we), R(o, fe), R(l, Pn), R(c, Ln), R(u, Za), h.rawphysicspipeline_step(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s.__wbg_ptr, a.__wbg_ptr, o.__wbg_ptr, l.__wbg_ptr, c.__wbg_ptr, u.__wbg_ptr);
    }
    stepWithEvents(t, e, n, r, s, a, o, l, c, u, f, p, _, g) {
      R(t, D), R(e, fi), R(n, In), R(r, di), R(s, qn), R(a, we), R(o, fe), R(l, Pn), R(c, Ln), R(u, Za), R(f, hh), h.rawphysicspipeline_stepWithEvents(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s.__wbg_ptr, a.__wbg_ptr, o.__wbg_ptr, l.__wbg_ptr, c.__wbg_ptr, u.__wbg_ptr, f.__wbg_ptr, Fi(p), Fi(_), Fi(g));
    }
  }
  const fc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawpointcolliderprojection_free(i >>> 0));
  class hs {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(hs.prototype);
      return e.__wbg_ptr = t, fc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, fc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawpointcolliderprojection_free(t);
    }
    colliderHandle() {
      return h.rawpointcolliderprojection_colliderHandle(this.__wbg_ptr);
    }
    point() {
      const t = h.rawpointcolliderprojection_point(this.__wbg_ptr);
      return D.__wrap(t);
    }
    isInside() {
      return h.rawpointcolliderprojection_isInside(this.__wbg_ptr) !== 0;
    }
    featureType() {
      return h.rawpointcolliderprojection_featureType(this.__wbg_ptr);
    }
    featureId() {
      try {
        const n = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawpointcolliderprojection_featureId(n, this.__wbg_ptr);
        var t = At()[n / 4 + 0], e = At()[n / 4 + 1];
        return t === 0 ? void 0 : e >>> 0;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
  }
  const pc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawpointprojection_free(i >>> 0));
  class Es {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(Es.prototype);
      return e.__wbg_ptr = t, pc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, pc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawpointprojection_free(t);
    }
    point() {
      const t = h.rawpointprojection_point(this.__wbg_ptr);
      return D.__wrap(t);
    }
    isInside() {
      return h.rawpointprojection_isInside(this.__wbg_ptr) !== 0;
    }
  }
  const yg = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawquerypipeline_free(i >>> 0));
  class yo {
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, yg.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawquerypipeline_free(t);
    }
    constructor() {
      const t = h.rawquerypipeline_new();
      return this.__wbg_ptr = t >>> 0, this;
    }
    update(t) {
      R(t, fe), h.rawquerypipeline_update(this.__wbg_ptr, t.__wbg_ptr);
    }
    castRay(t, e, n, r, s, a, o, l, c, u, f) {
      try {
        R(t, we), R(e, fe), R(n, D), R(r, D);
        const p = h.rawquerypipeline_castRay(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s, a, o, !gt(l), gt(l) ? 0 : l, !gt(c), gt(c) ? 0 : c, !gt(u), gt(u) ? 0 : u, ue(f));
        return p === 0 ? void 0 : Mo.__wrap(p);
      } finally {
        jt[re++] = void 0;
      }
    }
    castRayAndGetNormal(t, e, n, r, s, a, o, l, c, u, f) {
      try {
        R(t, we), R(e, fe), R(n, D), R(r, D);
        const p = h.rawquerypipeline_castRayAndGetNormal(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s, a, o, !gt(l), gt(l) ? 0 : l, !gt(c), gt(c) ? 0 : c, !gt(u), gt(u) ? 0 : u, ue(f));
        return p === 0 ? void 0 : Eo.__wrap(p);
      } finally {
        jt[re++] = void 0;
      }
    }
    intersectionsWithRay(t, e, n, r, s, a, o, l, c, u, f, p) {
      try {
        R(t, we), R(e, fe), R(n, D), R(r, D), h.rawquerypipeline_intersectionsWithRay(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s, a, ue(o), l, !gt(c), gt(c) ? 0 : c, !gt(u), gt(u) ? 0 : u, !gt(f), gt(f) ? 0 : f, ue(p));
      } finally {
        jt[re++] = void 0, jt[re++] = void 0;
      }
    }
    intersectionWithShape(t, e, n, r, s, a, o, l, c, u) {
      try {
        const _ = h.__wbindgen_add_to_stack_pointer(-16);
        R(t, we), R(e, fe), R(n, D), R(r, kt), R(s, Et), h.rawquerypipeline_intersectionWithShape(_, this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s.__wbg_ptr, a, !gt(o), gt(o) ? 0 : o, !gt(l), gt(l) ? 0 : l, !gt(c), gt(c) ? 0 : c, ue(u));
        var f = At()[_ / 4 + 0], p = cs()[_ / 8 + 1];
        return f === 0 ? void 0 : p;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16), jt[re++] = void 0;
      }
    }
    projectPoint(t, e, n, r, s, a, o, l, c) {
      try {
        R(t, we), R(e, fe), R(n, D);
        const u = h.rawquerypipeline_projectPoint(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r, s, !gt(a), gt(a) ? 0 : a, !gt(o), gt(o) ? 0 : o, !gt(l), gt(l) ? 0 : l, ue(c));
        return u === 0 ? void 0 : hs.__wrap(u);
      } finally {
        jt[re++] = void 0;
      }
    }
    projectPointAndGetFeature(t, e, n, r, s, a, o, l) {
      try {
        R(t, we), R(e, fe), R(n, D);
        const c = h.rawquerypipeline_projectPointAndGetFeature(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r, !gt(s), gt(s) ? 0 : s, !gt(a), gt(a) ? 0 : a, !gt(o), gt(o) ? 0 : o, ue(l));
        return c === 0 ? void 0 : hs.__wrap(c);
      } finally {
        jt[re++] = void 0;
      }
    }
    intersectionsWithPoint(t, e, n, r, s, a, o, l, c) {
      try {
        R(t, we), R(e, fe), R(n, D), h.rawquerypipeline_intersectionsWithPoint(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, ue(r), s, !gt(a), gt(a) ? 0 : a, !gt(o), gt(o) ? 0 : o, !gt(l), gt(l) ? 0 : l, ue(c));
      } finally {
        jt[re++] = void 0, jt[re++] = void 0;
      }
    }
    castShape(t, e, n, r, s, a, o, l, c, u, f, p, _, g) {
      try {
        R(t, we), R(e, fe), R(n, D), R(r, kt), R(s, D), R(a, Et);
        const v = h.rawquerypipeline_castShape(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s.__wbg_ptr, a.__wbg_ptr, o, l, c, u, !gt(f), gt(f) ? 0 : f, !gt(p), gt(p) ? 0 : p, !gt(_), gt(_) ? 0 : _, ue(g));
        return v === 0 ? void 0 : Ms.__wrap(v);
      } finally {
        jt[re++] = void 0;
      }
    }
    intersectionsWithShape(t, e, n, r, s, a, o, l, c, u, f) {
      try {
        R(t, we), R(e, fe), R(n, D), R(r, kt), R(s, Et), h.rawquerypipeline_intersectionsWithShape(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s.__wbg_ptr, ue(a), o, !gt(l), gt(l) ? 0 : l, !gt(c), gt(c) ? 0 : c, !gt(u), gt(u) ? 0 : u, ue(f));
      } finally {
        jt[re++] = void 0, jt[re++] = void 0;
      }
    }
    collidersWithAabbIntersectingAabb(t, e, n) {
      try {
        R(t, D), R(e, D), h.rawquerypipeline_collidersWithAabbIntersectingAabb(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, ue(n));
      } finally {
        jt[re++] = void 0;
      }
    }
  }
  const _c = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawraycolliderhit_free(i >>> 0));
  class Mo {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(Mo.prototype);
      return e.__wbg_ptr = t, _c.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, _c.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawraycolliderhit_free(t);
    }
    colliderHandle() {
      return h.rawcharactercollision_handle(this.__wbg_ptr);
    }
    timeOfImpact() {
      return h.rawcollidershapecasthit_time_of_impact(this.__wbg_ptr);
    }
  }
  const mc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawraycolliderintersection_free(i >>> 0));
  class Eo {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(Eo.prototype);
      return e.__wbg_ptr = t, mc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, mc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawraycolliderintersection_free(t);
    }
    colliderHandle() {
      return h.rawpointcolliderprojection_colliderHandle(this.__wbg_ptr);
    }
    normal() {
      const t = h.rawcollidershapecasthit_witness1(this.__wbg_ptr);
      return D.__wrap(t);
    }
    time_of_impact() {
      return h.rawcollidershapecasthit_time_of_impact(this.__wbg_ptr);
    }
    featureType() {
      return h.rawpointcolliderprojection_featureType(this.__wbg_ptr);
    }
    featureId() {
      try {
        const n = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawpointcolliderprojection_featureId(n, this.__wbg_ptr);
        var t = At()[n / 4 + 0], e = At()[n / 4 + 1];
        return t === 0 ? void 0 : e >>> 0;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
  }
  const gc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawrayintersection_free(i >>> 0));
  class Ts {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(Ts.prototype);
      return e.__wbg_ptr = t, gc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, gc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawrayintersection_free(t);
    }
    normal() {
      const t = h.rawcollidershapecasthit_witness1(this.__wbg_ptr);
      return D.__wrap(t);
    }
    time_of_impact() {
      return h.rawcollidershapecasthit_time_of_impact(this.__wbg_ptr);
    }
    featureType() {
      return h.rawpointcolliderprojection_featureType(this.__wbg_ptr);
    }
    featureId() {
      try {
        const n = h.__wbindgen_add_to_stack_pointer(-16);
        h.rawpointcolliderprojection_featureId(n, this.__wbg_ptr);
        var t = At()[n / 4 + 0], e = At()[n / 4 + 1];
        return t === 0 ? void 0 : e >>> 0;
      } finally {
        h.__wbindgen_add_to_stack_pointer(16);
      }
    }
  }
  const wc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawrigidbodyset_free(i >>> 0));
  class we {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(we.prototype);
      return e.__wbg_ptr = t, wc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, wc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawrigidbodyset_free(t);
    }
    rbTranslation(t) {
      const e = h.rawrigidbodyset_rbTranslation(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    rbRotation(t) {
      const e = h.rawrigidbodyset_rbRotation(this.__wbg_ptr, t);
      return kt.__wrap(e);
    }
    rbSleep(t) {
      h.rawrigidbodyset_rbSleep(this.__wbg_ptr, t);
    }
    rbIsSleeping(t) {
      return h.rawrigidbodyset_rbIsSleeping(this.__wbg_ptr, t) !== 0;
    }
    rbIsMoving(t) {
      return h.rawrigidbodyset_rbIsMoving(this.__wbg_ptr, t) !== 0;
    }
    rbNextTranslation(t) {
      const e = h.rawrigidbodyset_rbNextTranslation(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    rbNextRotation(t) {
      const e = h.rawrigidbodyset_rbNextRotation(this.__wbg_ptr, t);
      return kt.__wrap(e);
    }
    rbSetTranslation(t, e, n, r, s) {
      h.rawrigidbodyset_rbSetTranslation(this.__wbg_ptr, t, e, n, r, s);
    }
    rbSetRotation(t, e, n, r, s, a) {
      h.rawrigidbodyset_rbSetRotation(this.__wbg_ptr, t, e, n, r, s, a);
    }
    rbSetLinvel(t, e, n) {
      R(e, D), h.rawrigidbodyset_rbSetLinvel(this.__wbg_ptr, t, e.__wbg_ptr, n);
    }
    rbSetAngvel(t, e, n) {
      R(e, D), h.rawrigidbodyset_rbSetAngvel(this.__wbg_ptr, t, e.__wbg_ptr, n);
    }
    rbSetNextKinematicTranslation(t, e, n, r) {
      h.rawrigidbodyset_rbSetNextKinematicTranslation(this.__wbg_ptr, t, e, n, r);
    }
    rbSetNextKinematicRotation(t, e, n, r, s) {
      h.rawrigidbodyset_rbSetNextKinematicRotation(this.__wbg_ptr, t, e, n, r, s);
    }
    rbRecomputeMassPropertiesFromColliders(t, e) {
      R(e, fe), h.rawrigidbodyset_rbRecomputeMassPropertiesFromColliders(this.__wbg_ptr, t, e.__wbg_ptr);
    }
    rbSetAdditionalMass(t, e, n) {
      h.rawrigidbodyset_rbSetAdditionalMass(this.__wbg_ptr, t, e, n);
    }
    rbSetAdditionalMassProperties(t, e, n, r, s, a) {
      R(n, D), R(r, D), R(s, kt), h.rawrigidbodyset_rbSetAdditionalMassProperties(this.__wbg_ptr, t, e, n.__wbg_ptr, r.__wbg_ptr, s.__wbg_ptr, a);
    }
    rbLinvel(t) {
      const e = h.rawrigidbodyset_rbLinvel(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    rbAngvel(t) {
      const e = h.rawrigidbodyset_rbAngvel(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    rbLockTranslations(t, e, n) {
      h.rawrigidbodyset_rbLockTranslations(this.__wbg_ptr, t, e, n);
    }
    rbSetEnabledTranslations(t, e, n, r, s) {
      h.rawrigidbodyset_rbSetEnabledTranslations(this.__wbg_ptr, t, e, n, r, s);
    }
    rbLockRotations(t, e, n) {
      h.rawrigidbodyset_rbLockRotations(this.__wbg_ptr, t, e, n);
    }
    rbSetEnabledRotations(t, e, n, r, s) {
      h.rawrigidbodyset_rbSetEnabledRotations(this.__wbg_ptr, t, e, n, r, s);
    }
    rbDominanceGroup(t) {
      return h.rawrigidbodyset_rbDominanceGroup(this.__wbg_ptr, t);
    }
    rbSetDominanceGroup(t, e) {
      h.rawrigidbodyset_rbSetDominanceGroup(this.__wbg_ptr, t, e);
    }
    rbEnableCcd(t, e) {
      h.rawrigidbodyset_rbEnableCcd(this.__wbg_ptr, t, e);
    }
    rbSetSoftCcdPrediction(t, e) {
      h.rawrigidbodyset_rbSetSoftCcdPrediction(this.__wbg_ptr, t, e);
    }
    rbMass(t) {
      return h.rawrigidbodyset_rbMass(this.__wbg_ptr, t);
    }
    rbInvMass(t) {
      return h.rawrigidbodyset_rbInvMass(this.__wbg_ptr, t);
    }
    rbEffectiveInvMass(t) {
      const e = h.rawrigidbodyset_rbEffectiveInvMass(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    rbLocalCom(t) {
      const e = h.rawrigidbodyset_rbLocalCom(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    rbWorldCom(t) {
      const e = h.rawrigidbodyset_rbWorldCom(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    rbInvPrincipalInertiaSqrt(t) {
      const e = h.rawrigidbodyset_rbInvPrincipalInertiaSqrt(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    rbPrincipalInertiaLocalFrame(t) {
      const e = h.rawrigidbodyset_rbPrincipalInertiaLocalFrame(this.__wbg_ptr, t);
      return kt.__wrap(e);
    }
    rbPrincipalInertia(t) {
      const e = h.rawrigidbodyset_rbPrincipalInertia(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    rbEffectiveWorldInvInertiaSqrt(t) {
      const e = h.rawrigidbodyset_rbEffectiveWorldInvInertiaSqrt(this.__wbg_ptr, t);
      return us.__wrap(e);
    }
    rbEffectiveAngularInertia(t) {
      const e = h.rawrigidbodyset_rbEffectiveAngularInertia(this.__wbg_ptr, t);
      return us.__wrap(e);
    }
    rbWakeUp(t) {
      h.rawrigidbodyset_rbWakeUp(this.__wbg_ptr, t);
    }
    rbIsCcdEnabled(t) {
      return h.rawrigidbodyset_rbIsCcdEnabled(this.__wbg_ptr, t) !== 0;
    }
    rbSoftCcdPrediction(t) {
      return h.rawrigidbodyset_rbSoftCcdPrediction(this.__wbg_ptr, t);
    }
    rbNumColliders(t) {
      return h.rawrigidbodyset_rbNumColliders(this.__wbg_ptr, t) >>> 0;
    }
    rbCollider(t, e) {
      return h.rawrigidbodyset_rbCollider(this.__wbg_ptr, t, e);
    }
    rbBodyType(t) {
      return h.rawrigidbodyset_rbBodyType(this.__wbg_ptr, t);
    }
    rbSetBodyType(t, e, n) {
      h.rawrigidbodyset_rbSetBodyType(this.__wbg_ptr, t, e, n);
    }
    rbIsFixed(t) {
      return h.rawrigidbodyset_rbIsFixed(this.__wbg_ptr, t) !== 0;
    }
    rbIsKinematic(t) {
      return h.rawrigidbodyset_rbIsKinematic(this.__wbg_ptr, t) !== 0;
    }
    rbIsDynamic(t) {
      return h.rawrigidbodyset_rbIsDynamic(this.__wbg_ptr, t) !== 0;
    }
    rbLinearDamping(t) {
      return h.rawrigidbodyset_rbLinearDamping(this.__wbg_ptr, t);
    }
    rbAngularDamping(t) {
      return h.rawrigidbodyset_rbAngularDamping(this.__wbg_ptr, t);
    }
    rbSetLinearDamping(t, e) {
      h.rawrigidbodyset_rbSetLinearDamping(this.__wbg_ptr, t, e);
    }
    rbSetAngularDamping(t, e) {
      h.rawrigidbodyset_rbSetAngularDamping(this.__wbg_ptr, t, e);
    }
    rbSetEnabled(t, e) {
      h.rawrigidbodyset_rbSetEnabled(this.__wbg_ptr, t, e);
    }
    rbIsEnabled(t) {
      return h.rawrigidbodyset_rbIsEnabled(this.__wbg_ptr, t) !== 0;
    }
    rbGravityScale(t) {
      return h.rawrigidbodyset_rbGravityScale(this.__wbg_ptr, t);
    }
    rbSetGravityScale(t, e, n) {
      h.rawrigidbodyset_rbSetGravityScale(this.__wbg_ptr, t, e, n);
    }
    rbResetForces(t, e) {
      h.rawrigidbodyset_rbResetForces(this.__wbg_ptr, t, e);
    }
    rbResetTorques(t, e) {
      h.rawrigidbodyset_rbResetTorques(this.__wbg_ptr, t, e);
    }
    rbAddForce(t, e, n) {
      R(e, D), h.rawrigidbodyset_rbAddForce(this.__wbg_ptr, t, e.__wbg_ptr, n);
    }
    rbApplyImpulse(t, e, n) {
      R(e, D), h.rawrigidbodyset_rbApplyImpulse(this.__wbg_ptr, t, e.__wbg_ptr, n);
    }
    rbAddTorque(t, e, n) {
      R(e, D), h.rawrigidbodyset_rbAddTorque(this.__wbg_ptr, t, e.__wbg_ptr, n);
    }
    rbApplyTorqueImpulse(t, e, n) {
      R(e, D), h.rawrigidbodyset_rbApplyTorqueImpulse(this.__wbg_ptr, t, e.__wbg_ptr, n);
    }
    rbAddForceAtPoint(t, e, n, r) {
      R(e, D), R(n, D), h.rawrigidbodyset_rbAddForceAtPoint(this.__wbg_ptr, t, e.__wbg_ptr, n.__wbg_ptr, r);
    }
    rbApplyImpulseAtPoint(t, e, n, r) {
      R(e, D), R(n, D), h.rawrigidbodyset_rbApplyImpulseAtPoint(this.__wbg_ptr, t, e.__wbg_ptr, n.__wbg_ptr, r);
    }
    rbAdditionalSolverIterations(t) {
      return h.rawrigidbodyset_rbAdditionalSolverIterations(this.__wbg_ptr, t) >>> 0;
    }
    rbSetAdditionalSolverIterations(t, e) {
      h.rawrigidbodyset_rbSetAdditionalSolverIterations(this.__wbg_ptr, t, e);
    }
    rbUserData(t) {
      return h.rawrigidbodyset_rbUserData(this.__wbg_ptr, t) >>> 0;
    }
    rbSetUserData(t, e) {
      h.rawrigidbodyset_rbSetUserData(this.__wbg_ptr, t, e);
    }
    rbUserForce(t) {
      const e = h.rawrigidbodyset_rbUserForce(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    rbUserTorque(t) {
      const e = h.rawrigidbodyset_rbUserTorque(this.__wbg_ptr, t);
      return D.__wrap(e);
    }
    constructor() {
      const t = h.rawrigidbodyset_new();
      return this.__wbg_ptr = t >>> 0, this;
    }
    createRigidBody(t, e, n, r, s, a, o, l, c, u, f, p, _, g, v, m, d, T, E, y, H, P, A, N, S, x) {
      return R(e, D), R(n, kt), R(o, D), R(l, D), R(c, D), R(u, D), R(f, kt), h.rawrigidbodyset_createRigidBody(this.__wbg_ptr, t, e.__wbg_ptr, n.__wbg_ptr, r, s, a, o.__wbg_ptr, l.__wbg_ptr, c.__wbg_ptr, u.__wbg_ptr, f.__wbg_ptr, p, _, g, v, m, d, T, E, y, H, P, A, N, S, x);
    }
    remove(t, e, n, r, s) {
      R(e, In), R(n, fe), R(r, Pn), R(s, Ln), h.rawrigidbodyset_remove(this.__wbg_ptr, t, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s.__wbg_ptr);
    }
    len() {
      return h.rawcolliderset_len(this.__wbg_ptr) >>> 0;
    }
    contains(t) {
      return h.rawrigidbodyset_contains(this.__wbg_ptr, t) !== 0;
    }
    forEachRigidBodyHandle(t) {
      try {
        h.rawrigidbodyset_forEachRigidBodyHandle(this.__wbg_ptr, ue(t));
      } finally {
        jt[re++] = void 0;
      }
    }
    propagateModifiedBodyPositionsToColliders(t) {
      R(t, fe), h.rawrigidbodyset_propagateModifiedBodyPositionsToColliders(this.__wbg_ptr, t.__wbg_ptr);
    }
  }
  const vc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawrotation_free(i >>> 0));
  class kt {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(kt.prototype);
      return e.__wbg_ptr = t, vc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, vc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawrotation_free(t);
    }
    constructor(t, e, n, r) {
      const s = h.rawrotation_new(t, e, n, r);
      return this.__wbg_ptr = s >>> 0, this;
    }
    static identity() {
      const t = h.rawrotation_identity();
      return kt.__wrap(t);
    }
    get x() {
      return h.rawrotation_x(this.__wbg_ptr);
    }
    get y() {
      return h.rawintegrationparameters_dt(this.__wbg_ptr);
    }
    get z() {
      return h.rawcollidershapecasthit_time_of_impact(this.__wbg_ptr);
    }
    get w() {
      return h.rawrotation_w(this.__wbg_ptr);
    }
  }
  const bc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawsdpmatrix3_free(i >>> 0));
  class us {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(us.prototype);
      return e.__wbg_ptr = t, bc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, bc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawsdpmatrix3_free(t);
    }
    elements() {
      const t = h.rawsdpmatrix3_elements(this.__wbg_ptr);
      return ls(t);
    }
  }
  const Mg = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawserializationpipeline_free(i >>> 0));
  class Eg {
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, Mg.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawserializationpipeline_free(t);
    }
    constructor() {
      const t = h.rawserializationpipeline_new();
      return this.__wbg_ptr = t >>> 0, this;
    }
    serializeAll(t, e, n, r, s, a, o, l, c) {
      R(t, D), R(e, fi), R(n, In), R(r, di), R(s, qn), R(a, we), R(o, fe), R(l, Pn), R(c, Ln);
      const u = h.rawserializationpipeline_serializeAll(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s.__wbg_ptr, a.__wbg_ptr, o.__wbg_ptr, l.__wbg_ptr, c.__wbg_ptr);
      return ls(u);
    }
    deserializeAll(t) {
      const e = h.rawserializationpipeline_deserializeAll(this.__wbg_ptr, Fi(t));
      return e === 0 ? void 0 : So.__wrap(e);
    }
  }
  const xc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawshape_free(i >>> 0));
  class Et {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(Et.prototype);
      return e.__wbg_ptr = t, xc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, xc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawshape_free(t);
    }
    static cuboid(t, e, n) {
      const r = h.rawshape_cuboid(t, e, n);
      return Et.__wrap(r);
    }
    static roundCuboid(t, e, n, r) {
      const s = h.rawshape_roundCuboid(t, e, n, r);
      return Et.__wrap(s);
    }
    static ball(t) {
      const e = h.rawshape_ball(t);
      return Et.__wrap(e);
    }
    static halfspace(t) {
      R(t, D);
      const e = h.rawshape_halfspace(t.__wbg_ptr);
      return Et.__wrap(e);
    }
    static capsule(t, e) {
      const n = h.rawshape_capsule(t, e);
      return Et.__wrap(n);
    }
    static cylinder(t, e) {
      const n = h.rawshape_cylinder(t, e);
      return Et.__wrap(n);
    }
    static roundCylinder(t, e, n) {
      const r = h.rawshape_roundCylinder(t, e, n);
      return Et.__wrap(r);
    }
    static cone(t, e) {
      const n = h.rawshape_cone(t, e);
      return Et.__wrap(n);
    }
    static roundCone(t, e, n) {
      const r = h.rawshape_roundCone(t, e, n);
      return Et.__wrap(r);
    }
    static polyline(t, e) {
      const n = ei(t, h.__wbindgen_malloc), r = We, s = Zr(e, h.__wbindgen_malloc), a = We, o = h.rawshape_polyline(n, r, s, a);
      return Et.__wrap(o);
    }
    static trimesh(t, e, n) {
      const r = ei(t, h.__wbindgen_malloc), s = We, a = Zr(e, h.__wbindgen_malloc), o = We, l = h.rawshape_trimesh(r, s, a, o, n);
      return Et.__wrap(l);
    }
    static heightfield(t, e, n, r, s) {
      const a = ei(n, h.__wbindgen_malloc), o = We;
      R(r, D);
      const l = h.rawshape_heightfield(t, e, a, o, r.__wbg_ptr, s);
      return Et.__wrap(l);
    }
    static segment(t, e) {
      R(t, D), R(e, D);
      const n = h.rawshape_segment(t.__wbg_ptr, e.__wbg_ptr);
      return Et.__wrap(n);
    }
    static triangle(t, e, n) {
      R(t, D), R(e, D), R(n, D);
      const r = h.rawshape_triangle(t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr);
      return Et.__wrap(r);
    }
    static roundTriangle(t, e, n, r) {
      R(t, D), R(e, D), R(n, D);
      const s = h.rawshape_roundTriangle(t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r);
      return Et.__wrap(s);
    }
    static convexHull(t) {
      const e = ei(t, h.__wbindgen_malloc), n = We, r = h.rawshape_convexHull(e, n);
      return r === 0 ? void 0 : Et.__wrap(r);
    }
    static roundConvexHull(t, e) {
      const n = ei(t, h.__wbindgen_malloc), r = We, s = h.rawshape_roundConvexHull(n, r, e);
      return s === 0 ? void 0 : Et.__wrap(s);
    }
    static convexMesh(t, e) {
      const n = ei(t, h.__wbindgen_malloc), r = We, s = Zr(e, h.__wbindgen_malloc), a = We, o = h.rawshape_convexMesh(n, r, s, a);
      return o === 0 ? void 0 : Et.__wrap(o);
    }
    static roundConvexMesh(t, e, n) {
      const r = ei(t, h.__wbindgen_malloc), s = We, a = Zr(e, h.__wbindgen_malloc), o = We, l = h.rawshape_roundConvexMesh(r, s, a, o, n);
      return l === 0 ? void 0 : Et.__wrap(l);
    }
    castShape(t, e, n, r, s, a, o, l, c, u) {
      R(t, D), R(e, kt), R(n, D), R(r, Et), R(s, D), R(a, kt), R(o, D);
      const f = h.rawshape_castShape(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s.__wbg_ptr, a.__wbg_ptr, o.__wbg_ptr, l, c, u);
      return f === 0 ? void 0 : Rs.__wrap(f);
    }
    intersectsShape(t, e, n, r, s) {
      return R(t, D), R(e, kt), R(n, Et), R(r, D), R(s, kt), h.rawshape_intersectsShape(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s.__wbg_ptr) !== 0;
    }
    contactShape(t, e, n, r, s, a) {
      R(t, D), R(e, kt), R(n, Et), R(r, D), R(s, kt);
      const o = h.rawshape_contactShape(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s.__wbg_ptr, a);
      return o === 0 ? void 0 : cr.__wrap(o);
    }
    containsPoint(t, e, n) {
      return R(t, D), R(e, kt), R(n, D), h.rawshape_containsPoint(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr) !== 0;
    }
    projectPoint(t, e, n, r) {
      R(t, D), R(e, kt), R(n, D);
      const s = h.rawshape_projectPoint(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r);
      return Es.__wrap(s);
    }
    intersectsRay(t, e, n, r, s) {
      return R(t, D), R(e, kt), R(n, D), R(r, D), h.rawshape_intersectsRay(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s) !== 0;
    }
    castRay(t, e, n, r, s, a) {
      return R(t, D), R(e, kt), R(n, D), R(r, D), h.rawshape_castRay(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s, a);
    }
    castRayAndGetNormal(t, e, n, r, s, a) {
      R(t, D), R(e, kt), R(n, D), R(r, D);
      const o = h.rawshape_castRayAndGetNormal(this.__wbg_ptr, t.__wbg_ptr, e.__wbg_ptr, n.__wbg_ptr, r.__wbg_ptr, s, a);
      return o === 0 ? void 0 : Ts.__wrap(o);
    }
  }
  const Sc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawshapecasthit_free(i >>> 0));
  class Rs {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(Rs.prototype);
      return e.__wbg_ptr = t, Sc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, Sc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawshapecasthit_free(t);
    }
    time_of_impact() {
      return h.rawrotation_x(this.__wbg_ptr);
    }
    witness1() {
      const t = h.rawshapecasthit_witness1(this.__wbg_ptr);
      return D.__wrap(t);
    }
    witness2() {
      const t = h.rawcontactforceevent_total_force(this.__wbg_ptr);
      return D.__wrap(t);
    }
    normal1() {
      const t = h.rawshapecasthit_normal1(this.__wbg_ptr);
      return D.__wrap(t);
    }
    normal2() {
      const t = h.rawshapecasthit_normal2(this.__wbg_ptr);
      return D.__wrap(t);
    }
  }
  const yc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawshapecontact_free(i >>> 0));
  class cr {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(cr.prototype);
      return e.__wbg_ptr = t, yc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, yc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawshapecontact_free(t);
    }
    distance() {
      return h.rawkinematiccharactercontroller_maxSlopeClimbAngle(this.__wbg_ptr);
    }
    point1() {
      const t = h.rawpointprojection_point(this.__wbg_ptr);
      return D.__wrap(t);
    }
    point2() {
      const t = h.rawcollidershapecasthit_witness1(this.__wbg_ptr);
      return D.__wrap(t);
    }
    normal1() {
      const t = h.rawcollidershapecasthit_witness2(this.__wbg_ptr);
      return D.__wrap(t);
    }
    normal2() {
      const t = h.rawcharactercollision_translationDeltaApplied(this.__wbg_ptr);
      return D.__wrap(t);
    }
  }
  const Mc = typeof FinalizationRegistry > "u" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((i) => h.__wbg_rawvector_free(i >>> 0));
  class D {
    static __wrap(t) {
      t = t >>> 0;
      const e = Object.create(D.prototype);
      return e.__wbg_ptr = t, Mc.register(e, e.__wbg_ptr, e), e;
    }
    __destroy_into_raw() {
      const t = this.__wbg_ptr;
      return this.__wbg_ptr = 0, Mc.unregister(this), t;
    }
    free() {
      const t = this.__destroy_into_raw();
      h.__wbg_rawvector_free(t);
    }
    static zero() {
      const t = h.rawvector_zero();
      return D.__wrap(t);
    }
    constructor(t, e, n) {
      const r = h.rawvector_new(t, e, n);
      return this.__wbg_ptr = r >>> 0, this;
    }
    get x() {
      return h.rawrotation_x(this.__wbg_ptr);
    }
    set x(t) {
      h.rawvector_set_x(this.__wbg_ptr, t);
    }
    get y() {
      return h.rawintegrationparameters_dt(this.__wbg_ptr);
    }
    set y(t) {
      h.rawintegrationparameters_set_dt(this.__wbg_ptr, t);
    }
    get z() {
      return h.rawcollidershapecasthit_time_of_impact(this.__wbg_ptr);
    }
    set z(t) {
      h.rawvector_set_z(this.__wbg_ptr, t);
    }
    xyz() {
      const t = h.rawvector_xyz(this.__wbg_ptr);
      return D.__wrap(t);
    }
    yxz() {
      const t = h.rawvector_yxz(this.__wbg_ptr);
      return D.__wrap(t);
    }
    zxy() {
      const t = h.rawvector_zxy(this.__wbg_ptr);
      return D.__wrap(t);
    }
    xzy() {
      const t = h.rawvector_xzy(this.__wbg_ptr);
      return D.__wrap(t);
    }
    yzx() {
      const t = h.rawvector_yzx(this.__wbg_ptr);
      return D.__wrap(t);
    }
    zyx() {
      const t = h.rawvector_zyx(this.__wbg_ptr);
      return D.__wrap(t);
    }
  }
  class Xe {
    constructor(t, e, n) {
      this.x = t, this.y = e, this.z = n;
    }
  }
  class I {
    static new(t, e, n) {
      return new Xe(t, e, n);
    }
    static intoRaw(t) {
      return new D(t.x, t.y, t.z);
    }
    static zeros() {
      return I.new(0, 0, 0);
    }
    static fromRaw(t) {
      if (!t) return null;
      let e = I.new(t.x, t.y, t.z);
      return t.free(), e;
    }
    static copy(t, e) {
      t.x = e.x, t.y = e.y, t.z = e.z;
    }
  }
  class ds {
    constructor(t, e, n, r) {
      this.x = t, this.y = e, this.z = n, this.w = r;
    }
  }
  class Bt {
    static identity() {
      return new ds(0, 0, 0, 1);
    }
    static fromRaw(t) {
      if (!t) return null;
      let e = new ds(t.x, t.y, t.z, t.w);
      return t.free(), e;
    }
    static intoRaw(t) {
      return new kt(t.x, t.y, t.z, t.w);
    }
    static copy(t, e) {
      t.x = e.x, t.y = e.y, t.z = e.z, t.w = e.w;
    }
  }
  class uh {
    constructor(t) {
      this.elements = t;
    }
    get m11() {
      return this.elements[0];
    }
    get m12() {
      return this.elements[1];
    }
    get m21() {
      return this.m12;
    }
    get m13() {
      return this.elements[2];
    }
    get m31() {
      return this.m13;
    }
    get m22() {
      return this.elements[3];
    }
    get m23() {
      return this.elements[4];
    }
    get m32() {
      return this.m23;
    }
    get m33() {
      return this.elements[5];
    }
  }
  class $a {
    static fromRaw(t) {
      const e = new uh(t.elements());
      return t.free(), e;
    }
  }
  var rn;
  (function(i) {
    i[i.Dynamic = 0] = "Dynamic", i[i.Fixed = 1] = "Fixed", i[i.KinematicPositionBased = 2] = "KinematicPositionBased", i[i.KinematicVelocityBased = 3] = "KinematicVelocityBased";
  })(rn || (rn = {}));
  class Ja {
    constructor(t, e, n) {
      this.rawSet = t, this.colliderSet = e, this.handle = n;
    }
    finalizeDeserialization(t) {
      this.colliderSet = t;
    }
    isValid() {
      return this.rawSet.contains(this.handle);
    }
    lockTranslations(t, e) {
      return this.rawSet.rbLockTranslations(this.handle, t, e);
    }
    lockRotations(t, e) {
      return this.rawSet.rbLockRotations(this.handle, t, e);
    }
    setEnabledTranslations(t, e, n, r) {
      return this.rawSet.rbSetEnabledTranslations(this.handle, t, e, n, r);
    }
    restrictTranslations(t, e, n, r) {
      this.setEnabledTranslations(t, e, n, r);
    }
    setEnabledRotations(t, e, n, r) {
      return this.rawSet.rbSetEnabledRotations(this.handle, t, e, n, r);
    }
    restrictRotations(t, e, n, r) {
      this.setEnabledRotations(t, e, n, r);
    }
    dominanceGroup() {
      return this.rawSet.rbDominanceGroup(this.handle);
    }
    setDominanceGroup(t) {
      this.rawSet.rbSetDominanceGroup(this.handle, t);
    }
    additionalSolverIterations() {
      return this.rawSet.rbAdditionalSolverIterations(this.handle);
    }
    setAdditionalSolverIterations(t) {
      this.rawSet.rbSetAdditionalSolverIterations(this.handle, t);
    }
    enableCcd(t) {
      this.rawSet.rbEnableCcd(this.handle, t);
    }
    setSoftCcdPrediction(t) {
      this.rawSet.rbSetSoftCcdPrediction(this.handle, t);
    }
    softCcdPrediction() {
      return this.rawSet.rbSoftCcdPrediction(this.handle);
    }
    translation() {
      let t = this.rawSet.rbTranslation(this.handle);
      return I.fromRaw(t);
    }
    rotation() {
      let t = this.rawSet.rbRotation(this.handle);
      return Bt.fromRaw(t);
    }
    nextTranslation() {
      let t = this.rawSet.rbNextTranslation(this.handle);
      return I.fromRaw(t);
    }
    nextRotation() {
      let t = this.rawSet.rbNextRotation(this.handle);
      return Bt.fromRaw(t);
    }
    setTranslation(t, e) {
      this.rawSet.rbSetTranslation(this.handle, t.x, t.y, t.z, e);
    }
    setLinvel(t, e) {
      let n = I.intoRaw(t);
      this.rawSet.rbSetLinvel(this.handle, n, e), n.free();
    }
    gravityScale() {
      return this.rawSet.rbGravityScale(this.handle);
    }
    setGravityScale(t, e) {
      this.rawSet.rbSetGravityScale(this.handle, t, e);
    }
    setRotation(t, e) {
      this.rawSet.rbSetRotation(this.handle, t.x, t.y, t.z, t.w, e);
    }
    setAngvel(t, e) {
      let n = I.intoRaw(t);
      this.rawSet.rbSetAngvel(this.handle, n, e), n.free();
    }
    setNextKinematicTranslation(t) {
      this.rawSet.rbSetNextKinematicTranslation(this.handle, t.x, t.y, t.z);
    }
    setNextKinematicRotation(t) {
      this.rawSet.rbSetNextKinematicRotation(this.handle, t.x, t.y, t.z, t.w);
    }
    linvel() {
      return I.fromRaw(this.rawSet.rbLinvel(this.handle));
    }
    angvel() {
      return I.fromRaw(this.rawSet.rbAngvel(this.handle));
    }
    mass() {
      return this.rawSet.rbMass(this.handle);
    }
    effectiveInvMass() {
      return I.fromRaw(this.rawSet.rbEffectiveInvMass(this.handle));
    }
    invMass() {
      return this.rawSet.rbInvMass(this.handle);
    }
    localCom() {
      return I.fromRaw(this.rawSet.rbLocalCom(this.handle));
    }
    worldCom() {
      return I.fromRaw(this.rawSet.rbWorldCom(this.handle));
    }
    invPrincipalInertiaSqrt() {
      return I.fromRaw(this.rawSet.rbInvPrincipalInertiaSqrt(this.handle));
    }
    principalInertia() {
      return I.fromRaw(this.rawSet.rbPrincipalInertia(this.handle));
    }
    principalInertiaLocalFrame() {
      return Bt.fromRaw(this.rawSet.rbPrincipalInertiaLocalFrame(this.handle));
    }
    effectiveWorldInvInertiaSqrt() {
      return $a.fromRaw(this.rawSet.rbEffectiveWorldInvInertiaSqrt(this.handle));
    }
    effectiveAngularInertia() {
      return $a.fromRaw(this.rawSet.rbEffectiveAngularInertia(this.handle));
    }
    sleep() {
      this.rawSet.rbSleep(this.handle);
    }
    wakeUp() {
      this.rawSet.rbWakeUp(this.handle);
    }
    isCcdEnabled() {
      return this.rawSet.rbIsCcdEnabled(this.handle);
    }
    numColliders() {
      return this.rawSet.rbNumColliders(this.handle);
    }
    collider(t) {
      return this.colliderSet.get(this.rawSet.rbCollider(this.handle, t));
    }
    setEnabled(t) {
      this.rawSet.rbSetEnabled(this.handle, t);
    }
    isEnabled() {
      return this.rawSet.rbIsEnabled(this.handle);
    }
    bodyType() {
      return this.rawSet.rbBodyType(this.handle);
    }
    setBodyType(t, e) {
      return this.rawSet.rbSetBodyType(this.handle, t, e);
    }
    isSleeping() {
      return this.rawSet.rbIsSleeping(this.handle);
    }
    isMoving() {
      return this.rawSet.rbIsMoving(this.handle);
    }
    isFixed() {
      return this.rawSet.rbIsFixed(this.handle);
    }
    isKinematic() {
      return this.rawSet.rbIsKinematic(this.handle);
    }
    isDynamic() {
      return this.rawSet.rbIsDynamic(this.handle);
    }
    linearDamping() {
      return this.rawSet.rbLinearDamping(this.handle);
    }
    angularDamping() {
      return this.rawSet.rbAngularDamping(this.handle);
    }
    setLinearDamping(t) {
      this.rawSet.rbSetLinearDamping(this.handle, t);
    }
    recomputeMassPropertiesFromColliders() {
      this.rawSet.rbRecomputeMassPropertiesFromColliders(this.handle, this.colliderSet.raw);
    }
    setAdditionalMass(t, e) {
      this.rawSet.rbSetAdditionalMass(this.handle, t, e);
    }
    setAdditionalMassProperties(t, e, n, r, s) {
      let a = I.intoRaw(e), o = I.intoRaw(n), l = Bt.intoRaw(r);
      this.rawSet.rbSetAdditionalMassProperties(this.handle, t, a, o, l, s), a.free(), o.free(), l.free();
    }
    setAngularDamping(t) {
      this.rawSet.rbSetAngularDamping(this.handle, t);
    }
    resetForces(t) {
      this.rawSet.rbResetForces(this.handle, t);
    }
    resetTorques(t) {
      this.rawSet.rbResetTorques(this.handle, t);
    }
    addForce(t, e) {
      const n = I.intoRaw(t);
      this.rawSet.rbAddForce(this.handle, n, e), n.free();
    }
    applyImpulse(t, e) {
      const n = I.intoRaw(t);
      this.rawSet.rbApplyImpulse(this.handle, n, e), n.free();
    }
    addTorque(t, e) {
      const n = I.intoRaw(t);
      this.rawSet.rbAddTorque(this.handle, n, e), n.free();
    }
    applyTorqueImpulse(t, e) {
      const n = I.intoRaw(t);
      this.rawSet.rbApplyTorqueImpulse(this.handle, n, e), n.free();
    }
    addForceAtPoint(t, e, n) {
      const r = I.intoRaw(t), s = I.intoRaw(e);
      this.rawSet.rbAddForceAtPoint(this.handle, r, s, n), r.free(), s.free();
    }
    applyImpulseAtPoint(t, e, n) {
      const r = I.intoRaw(t), s = I.intoRaw(e);
      this.rawSet.rbApplyImpulseAtPoint(this.handle, r, s, n), r.free(), s.free();
    }
    userForce() {
      return I.fromRaw(this.rawSet.rbUserForce(this.handle));
    }
    userTorque() {
      return I.fromRaw(this.rawSet.rbUserTorque(this.handle));
    }
  }
  class hn {
    constructor(t) {
      this.enabled = true, this.status = t, this.translation = I.zeros(), this.rotation = Bt.identity(), this.gravityScale = 1, this.linvel = I.zeros(), this.mass = 0, this.massOnly = false, this.centerOfMass = I.zeros(), this.translationsEnabledX = true, this.translationsEnabledY = true, this.angvel = I.zeros(), this.principalAngularInertia = I.zeros(), this.angularInertiaLocalFrame = Bt.identity(), this.translationsEnabledZ = true, this.rotationsEnabledX = true, this.rotationsEnabledY = true, this.rotationsEnabledZ = true, this.linearDamping = 0, this.angularDamping = 0, this.canSleep = true, this.sleeping = false, this.ccdEnabled = false, this.softCcdPrediction = 0, this.dominanceGroup = 0, this.additionalSolverIterations = 0;
    }
    static dynamic() {
      return new hn(rn.Dynamic);
    }
    static kinematicPositionBased() {
      return new hn(rn.KinematicPositionBased);
    }
    static kinematicVelocityBased() {
      return new hn(rn.KinematicVelocityBased);
    }
    static fixed() {
      return new hn(rn.Fixed);
    }
    static newDynamic() {
      return new hn(rn.Dynamic);
    }
    static newKinematicPositionBased() {
      return new hn(rn.KinematicPositionBased);
    }
    static newKinematicVelocityBased() {
      return new hn(rn.KinematicVelocityBased);
    }
    static newStatic() {
      return new hn(rn.Fixed);
    }
    setDominanceGroup(t) {
      return this.dominanceGroup = t, this;
    }
    setAdditionalSolverIterations(t) {
      return this.additionalSolverIterations = t, this;
    }
    setEnabled(t) {
      return this.enabled = t, this;
    }
    setTranslation(t, e, n) {
      if (typeof t != "number" || typeof e != "number" || typeof n != "number") throw TypeError("The translation components must be numbers.");
      return this.translation = { x: t, y: e, z: n }, this;
    }
    setRotation(t) {
      return Bt.copy(this.rotation, t), this;
    }
    setGravityScale(t) {
      return this.gravityScale = t, this;
    }
    setAdditionalMass(t) {
      return this.mass = t, this.massOnly = true, this;
    }
    setLinvel(t, e, n) {
      if (typeof t != "number" || typeof e != "number" || typeof n != "number") throw TypeError("The linvel components must be numbers.");
      return this.linvel = { x: t, y: e, z: n }, this;
    }
    setAngvel(t) {
      return I.copy(this.angvel, t), this;
    }
    setAdditionalMassProperties(t, e, n, r) {
      return this.mass = t, I.copy(this.centerOfMass, e), I.copy(this.principalAngularInertia, n), Bt.copy(this.angularInertiaLocalFrame, r), this.massOnly = false, this;
    }
    enabledTranslations(t, e, n) {
      return this.translationsEnabledX = t, this.translationsEnabledY = e, this.translationsEnabledZ = n, this;
    }
    restrictTranslations(t, e, n) {
      return this.enabledTranslations(t, e, n);
    }
    lockTranslations() {
      return this.enabledTranslations(false, false, false);
    }
    enabledRotations(t, e, n) {
      return this.rotationsEnabledX = t, this.rotationsEnabledY = e, this.rotationsEnabledZ = n, this;
    }
    restrictRotations(t, e, n) {
      return this.enabledRotations(t, e, n);
    }
    lockRotations() {
      return this.restrictRotations(false, false, false);
    }
    setLinearDamping(t) {
      return this.linearDamping = t, this;
    }
    setAngularDamping(t) {
      return this.angularDamping = t, this;
    }
    setCanSleep(t) {
      return this.canSleep = t, this;
    }
    setSleeping(t) {
      return this.sleeping = t, this;
    }
    setCcdEnabled(t) {
      return this.ccdEnabled = t, this;
    }
    setSoftCcdPrediction(t) {
      return this.softCcdPrediction = t, this;
    }
    setUserData(t) {
      return this.userData = t, this;
    }
  }
  class As {
    constructor() {
      this.fconv = new Float64Array(1), this.uconv = new Uint32Array(this.fconv.buffer), this.data = new Array(), this.size = 0;
    }
    set(t, e) {
      let n = this.index(t);
      for (; this.data.length <= n; ) this.data.push(null);
      this.data[n] == null && (this.size += 1), this.data[n] = e;
    }
    len() {
      return this.size;
    }
    delete(t) {
      let e = this.index(t);
      e < this.data.length && (this.data[e] != null && (this.size -= 1), this.data[e] = null);
    }
    clear() {
      this.data = new Array();
    }
    get(t) {
      let e = this.index(t);
      return e < this.data.length ? this.data[e] : null;
    }
    forEach(t) {
      for (const e of this.data) e != null && t(e);
    }
    getAll() {
      return this.data.filter((t) => t != null);
    }
    index(t) {
      return this.fconv[0] = t, this.uconv[0];
    }
  }
  class dh {
    constructor(t) {
      this.raw = t || new we(), this.map = new As(), t && t.forEachRigidBodyHandle((e) => {
        this.map.set(e, new Ja(t, null, e));
      });
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0, this.map && this.map.clear(), this.map = void 0;
    }
    finalizeDeserialization(t) {
      this.map.forEach((e) => e.finalizeDeserialization(t));
    }
    createRigidBody(t, e) {
      let n = I.intoRaw(e.translation), r = Bt.intoRaw(e.rotation), s = I.intoRaw(e.linvel), a = I.intoRaw(e.centerOfMass), o = I.intoRaw(e.angvel), l = I.intoRaw(e.principalAngularInertia), c = Bt.intoRaw(e.angularInertiaLocalFrame), u = this.raw.createRigidBody(e.enabled, n, r, e.gravityScale, e.mass, e.massOnly, a, s, o, l, c, e.translationsEnabledX, e.translationsEnabledY, e.translationsEnabledZ, e.rotationsEnabledX, e.rotationsEnabledY, e.rotationsEnabledZ, e.linearDamping, e.angularDamping, e.status, e.canSleep, e.sleeping, e.softCcdPrediction, e.ccdEnabled, e.dominanceGroup, e.additionalSolverIterations);
      n.free(), r.free(), s.free(), a.free(), o.free(), l.free(), c.free();
      const f = new Ja(this.raw, t, u);
      return f.userData = e.userData, this.map.set(u, f), f;
    }
    remove(t, e, n, r, s) {
      for (let a = 0; a < this.raw.rbNumColliders(t); a += 1) n.unmap(this.raw.rbCollider(t, a));
      r.forEachJointHandleAttachedToRigidBody(t, (a) => r.unmap(a)), s.forEachJointHandleAttachedToRigidBody(t, (a) => s.unmap(a)), this.raw.remove(t, e.raw, n.raw, r.raw, s.raw), this.map.delete(t);
    }
    len() {
      return this.map.len();
    }
    contains(t) {
      return this.get(t) != null;
    }
    get(t) {
      return this.map.get(t);
    }
    forEach(t) {
      this.map.forEach(t);
    }
    forEachActiveRigidBody(t, e) {
      t.forEachActiveRigidBodyHandle((n) => {
        e(this.get(n));
      });
    }
    getAll() {
      return this.map.getAll();
    }
  }
  class fh {
    constructor(t) {
      this.raw = t || new fi();
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0;
    }
    get dt() {
      return this.raw.dt;
    }
    get contact_erp() {
      return this.raw.contact_erp;
    }
    get lengthUnit() {
      return this.raw.lengthUnit;
    }
    get normalizedAllowedLinearError() {
      return this.raw.normalizedAllowedLinearError;
    }
    get normalizedPredictionDistance() {
      return this.raw.normalizedPredictionDistance;
    }
    get numSolverIterations() {
      return this.raw.numSolverIterations;
    }
    get numAdditionalFrictionIterations() {
      return this.raw.numAdditionalFrictionIterations;
    }
    get numInternalPgsIterations() {
      return this.raw.numInternalPgsIterations;
    }
    get minIslandSize() {
      return this.raw.minIslandSize;
    }
    get maxCcdSubsteps() {
      return this.raw.maxCcdSubsteps;
    }
    set dt(t) {
      this.raw.dt = t;
    }
    set contact_natural_frequency(t) {
      this.raw.contact_natural_frequency = t;
    }
    set lengthUnit(t) {
      this.raw.lengthUnit = t;
    }
    set normalizedAllowedLinearError(t) {
      this.raw.normalizedAllowedLinearError = t;
    }
    set normalizedPredictionDistance(t) {
      this.raw.normalizedPredictionDistance = t;
    }
    set numSolverIterations(t) {
      this.raw.numSolverIterations = t;
    }
    set numAdditionalFrictionIterations(t) {
      this.raw.numAdditionalFrictionIterations = t;
    }
    set numInternalPgsIterations(t) {
      this.raw.numInternalPgsIterations = t;
    }
    set minIslandSize(t) {
      this.raw.minIslandSize = t;
    }
    set maxCcdSubsteps(t) {
      this.raw.maxCcdSubsteps = t;
    }
    switchToStandardPgsSolver() {
      this.raw.switchToStandardPgsSolver();
    }
    switchToSmallStepsPgsSolver() {
      this.raw.switchToSmallStepsPgsSolver();
    }
    switchToSmallStepsPgsSolverWithoutWarmstart() {
      this.raw.switchToSmallStepsPgsSolverWithoutWarmstart();
    }
  }
  var Pe;
  (function(i) {
    i[i.Revolute = 0] = "Revolute", i[i.Fixed = 1] = "Fixed", i[i.Prismatic = 2] = "Prismatic", i[i.Rope = 3] = "Rope", i[i.Spring = 4] = "Spring", i[i.Spherical = 5] = "Spherical", i[i.Generic = 6] = "Generic";
  })(Pe || (Pe = {}));
  var Qa;
  (function(i) {
    i[i.AccelerationBased = 0] = "AccelerationBased", i[i.ForceBased = 1] = "ForceBased";
  })(Qa || (Qa = {}));
  var to;
  (function(i) {
    i[i.LinX = 1] = "LinX", i[i.LinY = 2] = "LinY", i[i.LinZ = 4] = "LinZ", i[i.AngX = 8] = "AngX", i[i.AngY = 16] = "AngY", i[i.AngZ = 32] = "AngZ";
  })(to || (to = {}));
  class ln {
    constructor(t, e, n) {
      this.rawSet = t, this.bodySet = e, this.handle = n;
    }
    static newTyped(t, e, n) {
      switch (t.jointType(n)) {
        case sn.Revolute:
          return new wh(t, e, n);
        case sn.Prismatic:
          return new gh(t, e, n);
        case sn.Fixed:
          return new ph(t, e, n);
        case sn.Spring:
          return new mh(t, e, n);
        case sn.Rope:
          return new _h(t, e, n);
        case sn.Spherical:
          return new bh(t, e, n);
        case sn.Generic:
          return new vh(t, e, n);
        default:
          return new ln(t, e, n);
      }
    }
    finalizeDeserialization(t) {
      this.bodySet = t;
    }
    isValid() {
      return this.rawSet.contains(this.handle);
    }
    body1() {
      return this.bodySet.get(this.rawSet.jointBodyHandle1(this.handle));
    }
    body2() {
      return this.bodySet.get(this.rawSet.jointBodyHandle2(this.handle));
    }
    type() {
      return this.rawSet.jointType(this.handle);
    }
    frameX1() {
      return Bt.fromRaw(this.rawSet.jointFrameX1(this.handle));
    }
    frameX2() {
      return Bt.fromRaw(this.rawSet.jointFrameX2(this.handle));
    }
    anchor1() {
      return I.fromRaw(this.rawSet.jointAnchor1(this.handle));
    }
    anchor2() {
      return I.fromRaw(this.rawSet.jointAnchor2(this.handle));
    }
    setAnchor1(t) {
      const e = I.intoRaw(t);
      this.rawSet.jointSetAnchor1(this.handle, e), e.free();
    }
    setAnchor2(t) {
      const e = I.intoRaw(t);
      this.rawSet.jointSetAnchor2(this.handle, e), e.free();
    }
    setContactsEnabled(t) {
      this.rawSet.jointSetContactsEnabled(this.handle, t);
    }
    contactsEnabled() {
      return this.rawSet.jointContactsEnabled(this.handle);
    }
  }
  class To extends ln {
    limitsEnabled() {
      return this.rawSet.jointLimitsEnabled(this.handle, this.rawAxis());
    }
    limitsMin() {
      return this.rawSet.jointLimitsMin(this.handle, this.rawAxis());
    }
    limitsMax() {
      return this.rawSet.jointLimitsMax(this.handle, this.rawAxis());
    }
    setLimits(t, e) {
      this.rawSet.jointSetLimits(this.handle, this.rawAxis(), t, e);
    }
    configureMotorModel(t) {
      this.rawSet.jointConfigureMotorModel(this.handle, this.rawAxis(), t);
    }
    configureMotorVelocity(t, e) {
      this.rawSet.jointConfigureMotorVelocity(this.handle, this.rawAxis(), t, e);
    }
    configureMotorPosition(t, e, n) {
      this.rawSet.jointConfigureMotorPosition(this.handle, this.rawAxis(), t, e, n);
    }
    configureMotor(t, e, n, r) {
      this.rawSet.jointConfigureMotor(this.handle, this.rawAxis(), t, e, n, r);
    }
  }
  class ph extends ln {
  }
  class _h extends ln {
  }
  class mh extends ln {
  }
  class gh extends To {
    rawAxis() {
      return ys.LinX;
    }
  }
  class wh extends To {
    rawAxis() {
      return ys.AngX;
    }
  }
  class vh extends ln {
  }
  class bh extends ln {
  }
  class Mn {
    constructor() {
    }
    static fixed(t, e, n, r) {
      let s = new Mn();
      return s.anchor1 = t, s.anchor2 = n, s.frame1 = e, s.frame2 = r, s.jointType = Pe.Fixed, s;
    }
    static spring(t, e, n, r, s) {
      let a = new Mn();
      return a.anchor1 = r, a.anchor2 = s, a.length = t, a.stiffness = e, a.damping = n, a.jointType = Pe.Spring, a;
    }
    static rope(t, e, n) {
      let r = new Mn();
      return r.anchor1 = e, r.anchor2 = n, r.length = t, r.jointType = Pe.Rope, r;
    }
    static generic(t, e, n, r) {
      let s = new Mn();
      return s.anchor1 = t, s.anchor2 = e, s.axis = n, s.axesMask = r, s.jointType = Pe.Generic, s;
    }
    static spherical(t, e) {
      let n = new Mn();
      return n.anchor1 = t, n.anchor2 = e, n.jointType = Pe.Spherical, n;
    }
    static prismatic(t, e, n) {
      let r = new Mn();
      return r.anchor1 = t, r.anchor2 = e, r.axis = n, r.jointType = Pe.Prismatic, r;
    }
    static revolute(t, e, n) {
      let r = new Mn();
      return r.anchor1 = t, r.anchor2 = e, r.axis = n, r.jointType = Pe.Revolute, r;
    }
    intoRaw() {
      let t = I.intoRaw(this.anchor1), e = I.intoRaw(this.anchor2), n, r, s = false, a = 0, o = 0;
      switch (this.jointType) {
        case Pe.Fixed:
          let l = Bt.intoRaw(this.frame1), c = Bt.intoRaw(this.frame2);
          r = Te.fixed(t, l, e, c), l.free(), c.free();
          break;
        case Pe.Spring:
          r = Te.spring(this.length, this.stiffness, this.damping, t, e);
          break;
        case Pe.Rope:
          r = Te.rope(this.length, t, e);
          break;
        case Pe.Prismatic:
          n = I.intoRaw(this.axis), this.limitsEnabled && (s = true, a = this.limits[0], o = this.limits[1]), r = Te.prismatic(t, e, n, s, a, o), n.free();
          break;
        case Pe.Generic:
          n = I.intoRaw(this.axis);
          let u = this.axesMask;
          r = Te.generic(t, e, n, u);
          break;
        case Pe.Spherical:
          r = Te.spherical(t, e);
          break;
        case Pe.Revolute:
          n = I.intoRaw(this.axis), r = Te.revolute(t, e, n), n.free();
          break;
      }
      return t.free(), e.free(), r;
    }
  }
  class xh {
    constructor(t) {
      this.raw = t || new Pn(), this.map = new As(), t && t.forEachJointHandle((e) => {
        this.map.set(e, ln.newTyped(t, null, e));
      });
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0, this.map && this.map.clear(), this.map = void 0;
    }
    finalizeDeserialization(t) {
      this.map.forEach((e) => e.finalizeDeserialization(t));
    }
    createJoint(t, e, n, r, s) {
      const a = e.intoRaw(), o = this.raw.createJoint(a, n, r, s);
      a.free();
      let l = ln.newTyped(this.raw, t, o);
      return this.map.set(o, l), l;
    }
    remove(t, e) {
      this.raw.remove(t, e), this.unmap(t);
    }
    forEachJointHandleAttachedToRigidBody(t, e) {
      this.raw.forEachJointAttachedToRigidBody(t, e);
    }
    unmap(t) {
      this.map.delete(t);
    }
    len() {
      return this.map.len();
    }
    contains(t) {
      return this.get(t) != null;
    }
    get(t) {
      return this.map.get(t);
    }
    forEach(t) {
      this.map.forEach(t);
    }
    getAll() {
      return this.map.getAll();
    }
  }
  class jn {
    constructor(t, e) {
      this.rawSet = t, this.handle = e;
    }
    static newTyped(t, e) {
      switch (t.jointType(e)) {
        case sn.Revolute:
          return new Mh(t, e);
        case sn.Prismatic:
          return new yh(t, e);
        case sn.Fixed:
          return new Sh(t, e);
        case sn.Spherical:
          return new Eh(t, e);
        default:
          return new jn(t, e);
      }
    }
    isValid() {
      return this.rawSet.contains(this.handle);
    }
    setContactsEnabled(t) {
      this.rawSet.jointSetContactsEnabled(this.handle, t);
    }
    contactsEnabled() {
      return this.rawSet.jointContactsEnabled(this.handle);
    }
  }
  class Ro extends jn {
  }
  class Sh extends jn {
  }
  class yh extends Ro {
    rawAxis() {
      return ys.LinX;
    }
  }
  class Mh extends Ro {
    rawAxis() {
      return ys.AngX;
    }
  }
  class Eh extends jn {
  }
  class Th {
    constructor(t) {
      this.raw = t || new Ln(), this.map = new As(), t && t.forEachJointHandle((e) => {
        this.map.set(e, jn.newTyped(this.raw, e));
      });
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0, this.map && this.map.clear(), this.map = void 0;
    }
    createJoint(t, e, n, r) {
      const s = t.intoRaw(), a = this.raw.createJoint(s, e, n, r);
      s.free();
      let o = jn.newTyped(this.raw, a);
      return this.map.set(a, o), o;
    }
    remove(t, e) {
      this.raw.remove(t, e), this.map.delete(t);
    }
    unmap(t) {
      this.map.delete(t);
    }
    len() {
      return this.map.len();
    }
    contains(t) {
      return this.get(t) != null;
    }
    get(t) {
      return this.map.get(t);
    }
    forEach(t) {
      this.map.forEach(t);
    }
    forEachJointHandleAttachedToRigidBody(t, e) {
      this.raw.forEachJointAttachedToRigidBody(t, e);
    }
    getAll() {
      return this.map.getAll();
    }
  }
  var hr;
  (function(i) {
    i[i.Average = 0] = "Average", i[i.Min = 1] = "Min", i[i.Multiply = 2] = "Multiply", i[i.Max = 3] = "Max";
  })(hr || (hr = {}));
  class Rh {
    constructor(t) {
      this.raw = t || new Za();
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0;
    }
  }
  class Ah {
    constructor(t) {
      this.raw = t || new In();
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0;
    }
    forEachActiveRigidBodyHandle(t) {
      this.raw.forEachActiveRigidBodyHandle(t);
    }
  }
  class Ch {
    constructor(t) {
      this.raw = t || new di();
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0;
    }
  }
  class Ph {
    constructor(t) {
      this.raw = t || new qn(), this.tempManifold = new Ih(null);
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0;
    }
    contactPairsWith(t, e) {
      this.raw.contact_pairs_with(t, e);
    }
    intersectionPairsWith(t, e) {
      this.raw.intersection_pairs_with(t, e);
    }
    contactPair(t, e, n) {
      const r = this.raw.contact_pair(t, e);
      if (r) {
        const s = r.collider1() != t;
        let a;
        for (a = 0; a < r.numContactManifolds(); ++a) this.tempManifold.raw = r.contactManifold(a), this.tempManifold.raw && n(this.tempManifold, s), this.tempManifold.free();
        r.free();
      }
    }
    intersectionPair(t, e) {
      return this.raw.intersection_pair(t, e);
    }
  }
  class Ih {
    constructor(t) {
      this.raw = t;
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0;
    }
    normal() {
      return I.fromRaw(this.raw.normal());
    }
    localNormal1() {
      return I.fromRaw(this.raw.local_n1());
    }
    localNormal2() {
      return I.fromRaw(this.raw.local_n2());
    }
    subshape1() {
      return this.raw.subshape1();
    }
    subshape2() {
      return this.raw.subshape2();
    }
    numContacts() {
      return this.raw.num_contacts();
    }
    localContactPoint1(t) {
      return I.fromRaw(this.raw.contact_local_p1(t));
    }
    localContactPoint2(t) {
      return I.fromRaw(this.raw.contact_local_p2(t));
    }
    contactDist(t) {
      return this.raw.contact_dist(t);
    }
    contactFid1(t) {
      return this.raw.contact_fid1(t);
    }
    contactFid2(t) {
      return this.raw.contact_fid2(t);
    }
    contactImpulse(t) {
      return this.raw.contact_impulse(t);
    }
    contactTangentImpulseX(t) {
      return this.raw.contact_tangent_impulse_x(t);
    }
    contactTangentImpulseY(t) {
      return this.raw.contact_tangent_impulse_y(t);
    }
    numSolverContacts() {
      return this.raw.num_solver_contacts();
    }
    solverContactPoint(t) {
      return I.fromRaw(this.raw.solver_contact_point(t));
    }
    solverContactDist(t) {
      return this.raw.solver_contact_dist(t);
    }
    solverContactFriction(t) {
      return this.raw.solver_contact_friction(t);
    }
    solverContactRestitution(t) {
      return this.raw.solver_contact_restitution(t);
    }
    solverContactTangentVelocity(t) {
      return I.fromRaw(this.raw.solver_contact_tangent_velocity(t));
    }
  }
  class ki {
    constructor(t, e, n, r, s) {
      this.distance = t, this.point1 = e, this.point2 = n, this.normal1 = r, this.normal2 = s;
    }
    static fromRaw(t) {
      if (!t) return null;
      const e = new ki(t.distance(), I.fromRaw(t.point1()), I.fromRaw(t.point2()), I.fromRaw(t.normal1()), I.fromRaw(t.normal2()));
      return t.free(), e;
    }
  }
  var Vi;
  (function(i) {
    i[i.Vertex = 0] = "Vertex", i[i.Edge = 1] = "Edge", i[i.Face = 2] = "Face", i[i.Unknown = 3] = "Unknown";
  })(Vi || (Vi = {}));
  class mr {
    constructor(t, e) {
      this.point = t, this.isInside = e;
    }
    static fromRaw(t) {
      if (!t) return null;
      const e = new mr(I.fromRaw(t.point()), t.isInside());
      return t.free(), e;
    }
  }
  class ur {
    constructor(t, e, n, r, s) {
      this.featureType = Vi.Unknown, this.featureId = void 0, this.collider = t, this.point = e, this.isInside = n, s !== void 0 && (this.featureId = s), r !== void 0 && (this.featureType = r);
    }
    static fromRaw(t, e) {
      if (!e) return null;
      const n = new ur(t.get(e.colliderHandle()), I.fromRaw(e.point()), e.isInside(), e.featureType(), e.featureId());
      return e.free(), n;
    }
  }
  class Tg {
    constructor(t, e) {
      this.origin = t, this.dir = e;
    }
    pointAt(t) {
      return { x: this.origin.x + this.dir.x * t, y: this.origin.y + this.dir.y * t, z: this.origin.z + this.dir.z * t };
    }
  }
  class gr {
    constructor(t, e, n, r) {
      this.featureType = Vi.Unknown, this.featureId = void 0, this.timeOfImpact = t, this.normal = e, r !== void 0 && (this.featureId = r), n !== void 0 && (this.featureType = n);
    }
    static fromRaw(t) {
      if (!t) return null;
      const e = new gr(t.time_of_impact(), I.fromRaw(t.normal()), t.featureType(), t.featureId());
      return t.free(), e;
    }
  }
  class dr {
    constructor(t, e, n, r, s) {
      this.featureType = Vi.Unknown, this.featureId = void 0, this.collider = t, this.timeOfImpact = e, this.normal = n, s !== void 0 && (this.featureId = s), r !== void 0 && (this.featureType = r);
    }
    static fromRaw(t, e) {
      if (!e) return null;
      const n = new dr(t.get(e.colliderHandle()), e.time_of_impact(), I.fromRaw(e.normal()), e.featureType(), e.featureId());
      return e.free(), n;
    }
  }
  class Cs {
    constructor(t, e) {
      this.collider = t, this.timeOfImpact = e;
    }
    static fromRaw(t, e) {
      if (!e) return null;
      const n = new Cs(t.get(e.colliderHandle()), e.timeOfImpact());
      return e.free(), n;
    }
  }
  class Ki {
    constructor(t, e, n, r, s) {
      this.time_of_impact = t, this.witness1 = e, this.witness2 = n, this.normal1 = r, this.normal2 = s;
    }
    static fromRaw(t, e) {
      if (!e) return null;
      const n = new Ki(e.time_of_impact(), I.fromRaw(e.witness1()), I.fromRaw(e.witness2()), I.fromRaw(e.normal1()), I.fromRaw(e.normal2()));
      return e.free(), n;
    }
  }
  class wr extends Ki {
    constructor(t, e, n, r, s, a) {
      super(e, n, r, s, a), this.collider = t;
    }
    static fromRaw(t, e) {
      if (!e) return null;
      const n = new wr(t.get(e.colliderHandle()), e.time_of_impact(), I.fromRaw(e.witness1()), I.fromRaw(e.witness2()), I.fromRaw(e.normal1()), I.fromRaw(e.normal2()));
      return e.free(), n;
    }
  }
  class Me {
    static fromRaw(t, e) {
      const n = t.coShapeType(e);
      let r, s, a, o, l, c, u;
      switch (n) {
        case Ce.Ball:
          return new Ao(t.coRadius(e));
        case Ce.Cuboid:
          return r = t.coHalfExtents(e), new Co(r.x, r.y, r.z);
        case Ce.RoundCuboid:
          return r = t.coHalfExtents(e), s = t.coRoundRadius(e), new Po(r.x, r.y, r.z, s);
        case Ce.Capsule:
          return l = t.coHalfHeight(e), c = t.coRadius(e), new Io(l, c);
        case Ce.Segment:
          return a = t.coVertices(e), new Lo(I.new(a[0], a[1], a[2]), I.new(a[3], a[4], a[5]));
        case Ce.Polyline:
          return a = t.coVertices(e), o = t.coIndices(e), new Fo(a, o);
        case Ce.Triangle:
          return a = t.coVertices(e), new Do(I.new(a[0], a[1], a[2]), I.new(a[3], a[4], a[5]), I.new(a[6], a[7], a[8]));
        case Ce.RoundTriangle:
          return a = t.coVertices(e), s = t.coRoundRadius(e), new Uo(I.new(a[0], a[1], a[2]), I.new(a[3], a[4], a[5]), I.new(a[6], a[7], a[8]), s);
        case Ce.HalfSpace:
          return u = I.fromRaw(t.coHalfspaceNormal(e)), new Lh(u);
        case Ce.TriMesh:
          a = t.coVertices(e), o = t.coIndices(e);
          const f = t.coTriMeshFlags(e);
          return new No(a, o, f);
        case Ce.HeightField:
          const p = t.coHeightfieldScale(e), _ = t.coHeightfieldHeights(e), g = t.coHeightfieldNRows(e), v = t.coHeightfieldNCols(e), m = t.coHeightFieldFlags(e);
          return new Oo(g, v, _, p, m);
        case Ce.ConvexPolyhedron:
          return a = t.coVertices(e), o = t.coIndices(e), new fs(a, o);
        case Ce.RoundConvexPolyhedron:
          return a = t.coVertices(e), o = t.coIndices(e), s = t.coRoundRadius(e), new ps(a, o, s);
        case Ce.Cylinder:
          return l = t.coHalfHeight(e), c = t.coRadius(e), new zo(l, c);
        case Ce.RoundCylinder:
          return l = t.coHalfHeight(e), c = t.coRadius(e), s = t.coRoundRadius(e), new Bo(l, c, s);
        case Ce.Cone:
          return l = t.coHalfHeight(e), c = t.coRadius(e), new Ho(l, c);
        case Ce.RoundCone:
          return l = t.coHalfHeight(e), c = t.coRadius(e), s = t.coRoundRadius(e), new Go(l, c, s);
        default:
          throw new Error("unknown shape type: " + n);
      }
    }
    castShape(t, e, n, r, s, a, o, l, c, u) {
      let f = I.intoRaw(t), p = Bt.intoRaw(e), _ = I.intoRaw(n), g = I.intoRaw(s), v = Bt.intoRaw(a), m = I.intoRaw(o), d = this.intoRaw(), T = r.intoRaw(), E = Ki.fromRaw(null, d.castShape(f, p, _, T, g, v, m, l, c, u));
      return f.free(), p.free(), _.free(), g.free(), v.free(), m.free(), d.free(), T.free(), E;
    }
    intersectsShape(t, e, n, r, s) {
      let a = I.intoRaw(t), o = Bt.intoRaw(e), l = I.intoRaw(r), c = Bt.intoRaw(s), u = this.intoRaw(), f = n.intoRaw(), p = u.intersectsShape(a, o, f, l, c);
      return a.free(), o.free(), l.free(), c.free(), u.free(), f.free(), p;
    }
    contactShape(t, e, n, r, s, a) {
      let o = I.intoRaw(t), l = Bt.intoRaw(e), c = I.intoRaw(r), u = Bt.intoRaw(s), f = this.intoRaw(), p = n.intoRaw(), _ = ki.fromRaw(f.contactShape(o, l, p, c, u, a));
      return o.free(), l.free(), c.free(), u.free(), f.free(), p.free(), _;
    }
    containsPoint(t, e, n) {
      let r = I.intoRaw(t), s = Bt.intoRaw(e), a = I.intoRaw(n), o = this.intoRaw(), l = o.containsPoint(r, s, a);
      return r.free(), s.free(), a.free(), o.free(), l;
    }
    projectPoint(t, e, n, r) {
      let s = I.intoRaw(t), a = Bt.intoRaw(e), o = I.intoRaw(n), l = this.intoRaw(), c = mr.fromRaw(l.projectPoint(s, a, o, r));
      return s.free(), a.free(), o.free(), l.free(), c;
    }
    intersectsRay(t, e, n, r) {
      let s = I.intoRaw(e), a = Bt.intoRaw(n), o = I.intoRaw(t.origin), l = I.intoRaw(t.dir), c = this.intoRaw(), u = c.intersectsRay(s, a, o, l, r);
      return s.free(), a.free(), o.free(), l.free(), c.free(), u;
    }
    castRay(t, e, n, r, s) {
      let a = I.intoRaw(e), o = Bt.intoRaw(n), l = I.intoRaw(t.origin), c = I.intoRaw(t.dir), u = this.intoRaw(), f = u.castRay(a, o, l, c, r, s);
      return a.free(), o.free(), l.free(), c.free(), u.free(), f;
    }
    castRayAndGetNormal(t, e, n, r, s) {
      let a = I.intoRaw(e), o = Bt.intoRaw(n), l = I.intoRaw(t.origin), c = I.intoRaw(t.dir), u = this.intoRaw(), f = gr.fromRaw(u.castRayAndGetNormal(a, o, l, c, r, s));
      return a.free(), o.free(), l.free(), c.free(), u.free(), f;
    }
  }
  var xe;
  (function(i) {
    i[i.Ball = 0] = "Ball", i[i.Cuboid = 1] = "Cuboid", i[i.Capsule = 2] = "Capsule", i[i.Segment = 3] = "Segment", i[i.Polyline = 4] = "Polyline", i[i.Triangle = 5] = "Triangle", i[i.TriMesh = 6] = "TriMesh", i[i.HeightField = 7] = "HeightField", i[i.ConvexPolyhedron = 9] = "ConvexPolyhedron", i[i.Cylinder = 10] = "Cylinder", i[i.Cone = 11] = "Cone", i[i.RoundCuboid = 12] = "RoundCuboid", i[i.RoundTriangle = 13] = "RoundTriangle", i[i.RoundCylinder = 14] = "RoundCylinder", i[i.RoundCone = 15] = "RoundCone", i[i.RoundConvexPolyhedron = 16] = "RoundConvexPolyhedron", i[i.HalfSpace = 17] = "HalfSpace";
  })(xe || (xe = {}));
  var eo;
  (function(i) {
    i[i.FIX_INTERNAL_EDGES = 1] = "FIX_INTERNAL_EDGES";
  })(eo || (eo = {}));
  var no;
  (function(i) {
    i[i.DELETE_BAD_TOPOLOGY_TRIANGLES = 4] = "DELETE_BAD_TOPOLOGY_TRIANGLES", i[i.ORIENTED = 8] = "ORIENTED", i[i.MERGE_DUPLICATE_VERTICES = 16] = "MERGE_DUPLICATE_VERTICES", i[i.DELETE_DEGENERATE_TRIANGLES = 32] = "DELETE_DEGENERATE_TRIANGLES", i[i.DELETE_DUPLICATE_TRIANGLES = 64] = "DELETE_DUPLICATE_TRIANGLES", i[i.FIX_INTERNAL_EDGES = 152] = "FIX_INTERNAL_EDGES";
  })(no || (no = {}));
  class Ao extends Me {
    constructor(t) {
      super(), this.type = xe.Ball, this.radius = t;
    }
    intoRaw() {
      return Et.ball(this.radius);
    }
  }
  class Lh extends Me {
    constructor(t) {
      super(), this.type = xe.HalfSpace, this.normal = t;
    }
    intoRaw() {
      let t = I.intoRaw(this.normal), e = Et.halfspace(t);
      return t.free(), e;
    }
  }
  class Co extends Me {
    constructor(t, e, n) {
      super(), this.type = xe.Cuboid, this.halfExtents = I.new(t, e, n);
    }
    intoRaw() {
      return Et.cuboid(this.halfExtents.x, this.halfExtents.y, this.halfExtents.z);
    }
  }
  class Po extends Me {
    constructor(t, e, n, r) {
      super(), this.type = xe.RoundCuboid, this.halfExtents = I.new(t, e, n), this.borderRadius = r;
    }
    intoRaw() {
      return Et.roundCuboid(this.halfExtents.x, this.halfExtents.y, this.halfExtents.z, this.borderRadius);
    }
  }
  class Io extends Me {
    constructor(t, e) {
      super(), this.type = xe.Capsule, this.halfHeight = t, this.radius = e;
    }
    intoRaw() {
      return Et.capsule(this.halfHeight, this.radius);
    }
  }
  class Lo extends Me {
    constructor(t, e) {
      super(), this.type = xe.Segment, this.a = t, this.b = e;
    }
    intoRaw() {
      let t = I.intoRaw(this.a), e = I.intoRaw(this.b), n = Et.segment(t, e);
      return t.free(), e.free(), n;
    }
  }
  class Do extends Me {
    constructor(t, e, n) {
      super(), this.type = xe.Triangle, this.a = t, this.b = e, this.c = n;
    }
    intoRaw() {
      let t = I.intoRaw(this.a), e = I.intoRaw(this.b), n = I.intoRaw(this.c), r = Et.triangle(t, e, n);
      return t.free(), e.free(), n.free(), r;
    }
  }
  class Uo extends Me {
    constructor(t, e, n, r) {
      super(), this.type = xe.RoundTriangle, this.a = t, this.b = e, this.c = n, this.borderRadius = r;
    }
    intoRaw() {
      let t = I.intoRaw(this.a), e = I.intoRaw(this.b), n = I.intoRaw(this.c), r = Et.roundTriangle(t, e, n, this.borderRadius);
      return t.free(), e.free(), n.free(), r;
    }
  }
  class Fo extends Me {
    constructor(t, e) {
      super(), this.type = xe.Polyline, this.vertices = t, this.indices = e ?? new Uint32Array(0);
    }
    intoRaw() {
      return Et.polyline(this.vertices, this.indices);
    }
  }
  class No extends Me {
    constructor(t, e, n) {
      super(), this.type = xe.TriMesh, this.vertices = t, this.indices = e, this.flags = n;
    }
    intoRaw() {
      return Et.trimesh(this.vertices, this.indices, this.flags);
    }
  }
  class fs extends Me {
    constructor(t, e) {
      super(), this.type = xe.ConvexPolyhedron, this.vertices = t, this.indices = e;
    }
    intoRaw() {
      return this.indices ? Et.convexMesh(this.vertices, this.indices) : Et.convexHull(this.vertices);
    }
  }
  class ps extends Me {
    constructor(t, e, n) {
      super(), this.type = xe.RoundConvexPolyhedron, this.vertices = t, this.indices = e, this.borderRadius = n;
    }
    intoRaw() {
      return this.indices ? Et.roundConvexMesh(this.vertices, this.indices, this.borderRadius) : Et.roundConvexHull(this.vertices, this.borderRadius);
    }
  }
  class Oo extends Me {
    constructor(t, e, n, r, s) {
      super(), this.type = xe.HeightField, this.nrows = t, this.ncols = e, this.heights = n, this.scale = r, this.flags = s;
    }
    intoRaw() {
      let t = I.intoRaw(this.scale), e = Et.heightfield(this.nrows, this.ncols, this.heights, t, this.flags);
      return t.free(), e;
    }
  }
  class zo extends Me {
    constructor(t, e) {
      super(), this.type = xe.Cylinder, this.halfHeight = t, this.radius = e;
    }
    intoRaw() {
      return Et.cylinder(this.halfHeight, this.radius);
    }
  }
  class Bo extends Me {
    constructor(t, e, n) {
      super(), this.type = xe.RoundCylinder, this.borderRadius = n, this.halfHeight = t, this.radius = e;
    }
    intoRaw() {
      return Et.roundCylinder(this.halfHeight, this.radius, this.borderRadius);
    }
  }
  class Ho extends Me {
    constructor(t, e) {
      super(), this.type = xe.Cone, this.halfHeight = t, this.radius = e;
    }
    intoRaw() {
      return Et.cone(this.halfHeight, this.radius);
    }
  }
  class Go extends Me {
    constructor(t, e, n) {
      super(), this.type = xe.RoundCone, this.halfHeight = t, this.radius = e, this.borderRadius = n;
    }
    intoRaw() {
      return Et.roundCone(this.halfHeight, this.radius, this.borderRadius);
    }
  }
  class Dh {
    constructor(t) {
      this.raw = t || new Sg();
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0;
    }
    step(t, e, n, r, s, a, o, l, c, u, f, p) {
      let _ = I.intoRaw(t);
      f ? this.raw.stepWithEvents(_, e.raw, n.raw, r.raw, s.raw, a.raw, o.raw, l.raw, c.raw, u.raw, f.raw, p, p ? p.filterContactPair : null, p ? p.filterIntersectionPair : null) : this.raw.step(_, e.raw, n.raw, r.raw, s.raw, a.raw, o.raw, l.raw, c.raw, u.raw), _.free();
    }
  }
  var io;
  (function(i) {
    i[i.EXCLUDE_FIXED = 1] = "EXCLUDE_FIXED", i[i.EXCLUDE_KINEMATIC = 2] = "EXCLUDE_KINEMATIC", i[i.EXCLUDE_DYNAMIC = 4] = "EXCLUDE_DYNAMIC", i[i.EXCLUDE_SENSORS = 8] = "EXCLUDE_SENSORS", i[i.EXCLUDE_SOLIDS = 16] = "EXCLUDE_SOLIDS", i[i.ONLY_DYNAMIC = 3] = "ONLY_DYNAMIC", i[i.ONLY_KINEMATIC = 5] = "ONLY_KINEMATIC", i[i.ONLY_FIXED = 6] = "ONLY_FIXED";
  })(io || (io = {}));
  class Uh {
    constructor(t) {
      this.raw = t || new yo();
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0;
    }
    update(t) {
      this.raw.update(t.raw);
    }
    castRay(t, e, n, r, s, a, o, l, c, u) {
      let f = I.intoRaw(n.origin), p = I.intoRaw(n.dir), _ = Cs.fromRaw(e, this.raw.castRay(t.raw, e.raw, f, p, r, s, a, o, l, c, u));
      return f.free(), p.free(), _;
    }
    castRayAndGetNormal(t, e, n, r, s, a, o, l, c, u) {
      let f = I.intoRaw(n.origin), p = I.intoRaw(n.dir), _ = dr.fromRaw(e, this.raw.castRayAndGetNormal(t.raw, e.raw, f, p, r, s, a, o, l, c, u));
      return f.free(), p.free(), _;
    }
    intersectionsWithRay(t, e, n, r, s, a, o, l, c, u, f) {
      let p = I.intoRaw(n.origin), _ = I.intoRaw(n.dir), g = (v) => a(dr.fromRaw(e, v));
      this.raw.intersectionsWithRay(t.raw, e.raw, p, _, r, s, g, o, l, c, u, f), p.free(), _.free();
    }
    intersectionWithShape(t, e, n, r, s, a, o, l, c, u) {
      let f = I.intoRaw(n), p = Bt.intoRaw(r), _ = s.intoRaw(), g = this.raw.intersectionWithShape(t.raw, e.raw, f, p, _, a, o, l, c, u);
      return f.free(), p.free(), _.free(), g;
    }
    projectPoint(t, e, n, r, s, a, o, l, c) {
      let u = I.intoRaw(n), f = ur.fromRaw(e, this.raw.projectPoint(t.raw, e.raw, u, r, s, a, o, l, c));
      return u.free(), f;
    }
    projectPointAndGetFeature(t, e, n, r, s, a, o, l) {
      let c = I.intoRaw(n), u = ur.fromRaw(e, this.raw.projectPointAndGetFeature(t.raw, e.raw, c, r, s, a, o, l));
      return c.free(), u;
    }
    intersectionsWithPoint(t, e, n, r, s, a, o, l, c) {
      let u = I.intoRaw(n);
      this.raw.intersectionsWithPoint(t.raw, e.raw, u, r, s, a, o, l, c), u.free();
    }
    castShape(t, e, n, r, s, a, o, l, c, u, f, p, _, g) {
      let v = I.intoRaw(n), m = Bt.intoRaw(r), d = I.intoRaw(s), T = a.intoRaw(), E = wr.fromRaw(e, this.raw.castShape(t.raw, e.raw, v, m, d, T, o, l, c, u, f, p, _, g));
      return v.free(), m.free(), d.free(), T.free(), E;
    }
    intersectionsWithShape(t, e, n, r, s, a, o, l, c, u, f) {
      let p = I.intoRaw(n), _ = Bt.intoRaw(r), g = s.intoRaw();
      this.raw.intersectionsWithShape(t.raw, e.raw, p, _, g, a, o, l, c, u, f), p.free(), _.free(), g.free();
    }
    collidersWithAabbIntersectingAabb(t, e, n) {
      let r = I.intoRaw(t), s = I.intoRaw(e);
      this.raw.collidersWithAabbIntersectingAabb(r, s, n), r.free(), s.free();
    }
  }
  class ro {
    constructor(t) {
      this.raw = t || new Eg();
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0;
    }
    serializeAll(t, e, n, r, s, a, o, l, c) {
      let u = I.intoRaw(t);
      const f = this.raw.serializeAll(u, e.raw, n.raw, r.raw, s.raw, a.raw, o.raw, l.raw, c.raw);
      return u.free(), f;
    }
    deserializeAll(t) {
      return vr.fromRaw(this.raw.deserializeAll(t));
    }
  }
  class Fh {
    constructor(t, e) {
      this.vertices = t, this.colors = e;
    }
  }
  class Nh {
    constructor(t) {
      this.raw = t || new _g();
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0, this.vertices = void 0, this.colors = void 0;
    }
    render(t, e, n, r, s) {
      this.raw.render(t.raw, e.raw, n.raw, r.raw, s.raw), this.vertices = this.raw.vertices(), this.colors = this.raw.colors();
    }
  }
  class Oh {
  }
  class zh {
    constructor(t, e, n, r, s) {
      this.params = e, this.bodies = n, this.colliders = r, this.queries = s, this.raw = new bg(t), this.rawCharacterCollision = new ch(), this._applyImpulsesToDynamicBodies = false, this._characterMass = null;
    }
    free() {
      this.raw && (this.raw.free(), this.rawCharacterCollision.free()), this.raw = void 0, this.rawCharacterCollision = void 0;
    }
    up() {
      return this.raw.up();
    }
    setUp(t) {
      let e = I.intoRaw(t);
      return this.raw.setUp(e);
    }
    applyImpulsesToDynamicBodies() {
      return this._applyImpulsesToDynamicBodies;
    }
    setApplyImpulsesToDynamicBodies(t) {
      this._applyImpulsesToDynamicBodies = t;
    }
    characterMass() {
      return this._characterMass;
    }
    setCharacterMass(t) {
      this._characterMass = t;
    }
    offset() {
      return this.raw.offset();
    }
    setOffset(t) {
      this.raw.setOffset(t);
    }
    normalNudgeFactor() {
      return this.raw.normalNudgeFactor();
    }
    setNormalNudgeFactor(t) {
      this.raw.setNormalNudgeFactor(t);
    }
    slideEnabled() {
      return this.raw.slideEnabled();
    }
    setSlideEnabled(t) {
      this.raw.setSlideEnabled(t);
    }
    autostepMaxHeight() {
      return this.raw.autostepMaxHeight();
    }
    autostepMinWidth() {
      return this.raw.autostepMinWidth();
    }
    autostepIncludesDynamicBodies() {
      return this.raw.autostepIncludesDynamicBodies();
    }
    autostepEnabled() {
      return this.raw.autostepEnabled();
    }
    enableAutostep(t, e, n) {
      this.raw.enableAutostep(t, e, n);
    }
    disableAutostep() {
      return this.raw.disableAutostep();
    }
    maxSlopeClimbAngle() {
      return this.raw.maxSlopeClimbAngle();
    }
    setMaxSlopeClimbAngle(t) {
      this.raw.setMaxSlopeClimbAngle(t);
    }
    minSlopeSlideAngle() {
      return this.raw.minSlopeSlideAngle();
    }
    setMinSlopeSlideAngle(t) {
      this.raw.setMinSlopeSlideAngle(t);
    }
    snapToGroundDistance() {
      return this.raw.snapToGroundDistance();
    }
    enableSnapToGround(t) {
      this.raw.enableSnapToGround(t);
    }
    disableSnapToGround() {
      this.raw.disableSnapToGround();
    }
    snapToGroundEnabled() {
      return this.raw.snapToGroundEnabled();
    }
    computeColliderMovement(t, e, n, r, s) {
      let a = I.intoRaw(e);
      this.raw.computeColliderMovement(this.params.dt, this.bodies.raw, this.colliders.raw, this.queries.raw, t.handle, a, this._applyImpulsesToDynamicBodies, this._characterMass, n, r, this.colliders.castClosure(s)), a.free();
    }
    computedMovement() {
      return I.fromRaw(this.raw.computedMovement());
    }
    computedGrounded() {
      return this.raw.computedGrounded();
    }
    numComputedCollisions() {
      return this.raw.numComputedCollisions();
    }
    computedCollision(t, e) {
      if (this.raw.computedCollision(t, this.rawCharacterCollision)) {
        let n = this.rawCharacterCollision;
        return e = e ?? new Oh(), e.translationDeltaApplied = I.fromRaw(n.translationDeltaApplied()), e.translationDeltaRemaining = I.fromRaw(n.translationDeltaRemaining()), e.toi = n.toi(), e.witness1 = I.fromRaw(n.worldWitness1()), e.witness2 = I.fromRaw(n.worldWitness2()), e.normal1 = I.fromRaw(n.worldNormal1()), e.normal2 = I.fromRaw(n.worldNormal2()), e.collider = this.colliders.get(n.handle()), e;
      } else return null;
    }
  }
  class Bh {
    constructor(t, e, n, r) {
      this.raw = new gg(t.handle), this.bodies = e, this.colliders = n, this.queries = r, this._chassis = t;
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0;
    }
    updateVehicle(t, e, n, r) {
      this.raw.update_vehicle(t, this.bodies.raw, this.colliders.raw, this.queries.raw, e, n, this.colliders.castClosure(r));
    }
    currentVehicleSpeed() {
      return this.raw.current_vehicle_speed();
    }
    chassis() {
      return this._chassis;
    }
    get indexUpAxis() {
      return this.raw.index_up_axis();
    }
    set indexUpAxis(t) {
      this.raw.set_index_up_axis(t);
    }
    get indexForwardAxis() {
      return this.raw.index_forward_axis();
    }
    set setIndexForwardAxis(t) {
      this.raw.set_index_forward_axis(t);
    }
    addWheel(t, e, n, r, s) {
      let a = I.intoRaw(t), o = I.intoRaw(e), l = I.intoRaw(n);
      this.raw.add_wheel(a, o, l, r, s), a.free(), o.free(), l.free();
    }
    numWheels() {
      return this.raw.num_wheels();
    }
    wheelChassisConnectionPointCs(t) {
      return I.fromRaw(this.raw.wheel_chassis_connection_point_cs(t));
    }
    setWheelChassisConnectionPointCs(t, e) {
      let n = I.intoRaw(e);
      this.raw.set_wheel_chassis_connection_point_cs(t, n), n.free();
    }
    wheelSuspensionRestLength(t) {
      return this.raw.wheel_suspension_rest_length(t);
    }
    setWheelSuspensionRestLength(t, e) {
      this.raw.set_wheel_suspension_rest_length(t, e);
    }
    wheelMaxSuspensionTravel(t) {
      return this.raw.wheel_max_suspension_travel(t);
    }
    setWheelMaxSuspensionTravel(t, e) {
      this.raw.set_wheel_max_suspension_travel(t, e);
    }
    wheelRadius(t) {
      return this.raw.wheel_radius(t);
    }
    setWheelRadius(t, e) {
      this.raw.set_wheel_radius(t, e);
    }
    wheelSuspensionStiffness(t) {
      return this.raw.wheel_suspension_stiffness(t);
    }
    setWheelSuspensionStiffness(t, e) {
      this.raw.set_wheel_suspension_stiffness(t, e);
    }
    wheelSuspensionCompression(t) {
      return this.raw.wheel_suspension_compression(t);
    }
    setWheelSuspensionCompression(t, e) {
      this.raw.set_wheel_suspension_compression(t, e);
    }
    wheelSuspensionRelaxation(t) {
      return this.raw.wheel_suspension_relaxation(t);
    }
    setWheelSuspensionRelaxation(t, e) {
      this.raw.set_wheel_suspension_relaxation(t, e);
    }
    wheelMaxSuspensionForce(t) {
      return this.raw.wheel_max_suspension_force(t);
    }
    setWheelMaxSuspensionForce(t, e) {
      this.raw.set_wheel_max_suspension_force(t, e);
    }
    wheelBrake(t) {
      return this.raw.wheel_brake(t);
    }
    setWheelBrake(t, e) {
      this.raw.set_wheel_brake(t, e);
    }
    wheelSteering(t) {
      return this.raw.wheel_steering(t);
    }
    setWheelSteering(t, e) {
      this.raw.set_wheel_steering(t, e);
    }
    wheelEngineForce(t) {
      return this.raw.wheel_engine_force(t);
    }
    setWheelEngineForce(t, e) {
      this.raw.set_wheel_engine_force(t, e);
    }
    wheelDirectionCs(t) {
      return I.fromRaw(this.raw.wheel_direction_cs(t));
    }
    setWheelDirectionCs(t, e) {
      let n = I.intoRaw(e);
      this.raw.set_wheel_direction_cs(t, n), n.free();
    }
    wheelAxleCs(t) {
      return I.fromRaw(this.raw.wheel_axle_cs(t));
    }
    setWheelAxleCs(t, e) {
      let n = I.intoRaw(e);
      this.raw.set_wheel_axle_cs(t, n), n.free();
    }
    wheelFrictionSlip(t) {
      return this.raw.wheel_friction_slip(t);
    }
    setWheelFrictionSlip(t, e) {
      this.raw.set_wheel_friction_slip(t, e);
    }
    wheelSideFrictionStiffness(t) {
      return this.raw.wheel_side_friction_stiffness(t);
    }
    setWheelSideFrictionStiffness(t, e) {
      this.raw.set_wheel_side_friction_stiffness(t, e);
    }
    wheelRotation(t) {
      return this.raw.wheel_rotation(t);
    }
    wheelForwardImpulse(t) {
      return this.raw.wheel_forward_impulse(t);
    }
    wheelSideImpulse(t) {
      return this.raw.wheel_side_impulse(t);
    }
    wheelSuspensionForce(t) {
      return this.raw.wheel_suspension_force(t);
    }
    wheelContactNormal(t) {
      return I.fromRaw(this.raw.wheel_contact_normal_ws(t));
    }
    wheelContactPoint(t) {
      return I.fromRaw(this.raw.wheel_contact_point_ws(t));
    }
    wheelSuspensionLength(t) {
      return this.raw.wheel_suspension_length(t);
    }
    wheelHardPoint(t) {
      return I.fromRaw(this.raw.wheel_hard_point_ws(t));
    }
    wheelIsInContact(t) {
      return this.raw.wheel_is_in_contact(t);
    }
    wheelGroundObject(t) {
      return this.colliders.get(this.raw.wheel_ground_object(t));
    }
  }
  class vr {
    constructor(t, e, n, r, s, a, o, l, c, u, f, p, _, g) {
      this.gravity = t, this.integrationParameters = new fh(e), this.islands = new Ah(n), this.broadPhase = new Ch(r), this.narrowPhase = new Ph(s), this.bodies = new dh(a), this.colliders = new Gh(o), this.impulseJoints = new xh(l), this.multibodyJoints = new Th(c), this.ccdSolver = new Rh(u), this.queryPipeline = new Uh(f), this.physicsPipeline = new Dh(p), this.serializationPipeline = new ro(_), this.debugRenderPipeline = new Nh(g), this.characterControllers = /* @__PURE__ */ new Set(), this.vehicleControllers = /* @__PURE__ */ new Set(), this.impulseJoints.finalizeDeserialization(this.bodies), this.bodies.finalizeDeserialization(this.colliders), this.colliders.finalizeDeserialization(this.bodies);
    }
    free() {
      this.integrationParameters.free(), this.islands.free(), this.broadPhase.free(), this.narrowPhase.free(), this.bodies.free(), this.colliders.free(), this.impulseJoints.free(), this.multibodyJoints.free(), this.ccdSolver.free(), this.queryPipeline.free(), this.physicsPipeline.free(), this.serializationPipeline.free(), this.debugRenderPipeline.free(), this.characterControllers.forEach((t) => t.free()), this.vehicleControllers.forEach((t) => t.free()), this.integrationParameters = void 0, this.islands = void 0, this.broadPhase = void 0, this.narrowPhase = void 0, this.bodies = void 0, this.colliders = void 0, this.ccdSolver = void 0, this.impulseJoints = void 0, this.multibodyJoints = void 0, this.queryPipeline = void 0, this.physicsPipeline = void 0, this.serializationPipeline = void 0, this.debugRenderPipeline = void 0, this.characterControllers = void 0, this.vehicleControllers = void 0;
    }
    static fromRaw(t) {
      return t ? new vr(I.fromRaw(t.takeGravity()), t.takeIntegrationParameters(), t.takeIslandManager(), t.takeBroadPhase(), t.takeNarrowPhase(), t.takeBodies(), t.takeColliders(), t.takeImpulseJoints(), t.takeMultibodyJoints()) : null;
    }
    takeSnapshot() {
      return this.serializationPipeline.serializeAll(this.gravity, this.integrationParameters, this.islands, this.broadPhase, this.narrowPhase, this.bodies, this.colliders, this.impulseJoints, this.multibodyJoints);
    }
    static restoreSnapshot(t) {
      return new ro().deserializeAll(t);
    }
    debugRender() {
      return this.debugRenderPipeline.render(this.bodies, this.colliders, this.impulseJoints, this.multibodyJoints, this.narrowPhase), new Fh(this.debugRenderPipeline.vertices, this.debugRenderPipeline.colors);
    }
    step(t, e) {
      this.physicsPipeline.step(this.gravity, this.integrationParameters, this.islands, this.broadPhase, this.narrowPhase, this.bodies, this.colliders, this.impulseJoints, this.multibodyJoints, this.ccdSolver, t, e), this.queryPipeline.update(this.colliders);
    }
    propagateModifiedBodyPositionsToColliders() {
      this.bodies.raw.propagateModifiedBodyPositionsToColliders(this.colliders.raw);
    }
    updateSceneQueries() {
      this.propagateModifiedBodyPositionsToColliders(), this.queryPipeline.update(this.colliders);
    }
    get timestep() {
      return this.integrationParameters.dt;
    }
    set timestep(t) {
      this.integrationParameters.dt = t;
    }
    get lengthUnit() {
      return this.integrationParameters.lengthUnit;
    }
    set lengthUnit(t) {
      this.integrationParameters.lengthUnit = t;
    }
    get numSolverIterations() {
      return this.integrationParameters.numSolverIterations;
    }
    set numSolverIterations(t) {
      this.integrationParameters.numSolverIterations = t;
    }
    get numAdditionalFrictionIterations() {
      return this.integrationParameters.numAdditionalFrictionIterations;
    }
    set numAdditionalFrictionIterations(t) {
      this.integrationParameters.numAdditionalFrictionIterations = t;
    }
    get numInternalPgsIterations() {
      return this.integrationParameters.numInternalPgsIterations;
    }
    set numInternalPgsIterations(t) {
      this.integrationParameters.numInternalPgsIterations = t;
    }
    switchToStandardPgsSolver() {
      this.integrationParameters.switchToStandardPgsSolver();
    }
    switchToSmallStepsPgsSolver() {
      this.integrationParameters.switchToSmallStepsPgsSolver();
    }
    switchToSmallStepsPgsSolverWithoutWarmstart() {
      this.integrationParameters.switchToSmallStepsPgsSolverWithoutWarmstart();
    }
    createRigidBody(t) {
      return this.bodies.createRigidBody(this.colliders, t);
    }
    createCharacterController(t) {
      let e = new zh(t, this.integrationParameters, this.bodies, this.colliders, this.queryPipeline);
      return this.characterControllers.add(e), e;
    }
    removeCharacterController(t) {
      this.characterControllers.delete(t), t.free();
    }
    createVehicleController(t) {
      let e = new Bh(t, this.bodies, this.colliders, this.queryPipeline);
      return this.vehicleControllers.add(e), e;
    }
    removeVehicleController(t) {
      this.vehicleControllers.delete(t), t.free();
    }
    createCollider(t, e) {
      let n = e ? e.handle : void 0;
      return this.colliders.createCollider(this.bodies, t, n);
    }
    createImpulseJoint(t, e, n, r) {
      return this.impulseJoints.createJoint(this.bodies, t, e.handle, n.handle, r);
    }
    createMultibodyJoint(t, e, n, r) {
      return this.multibodyJoints.createJoint(t, e.handle, n.handle, r);
    }
    getRigidBody(t) {
      return this.bodies.get(t);
    }
    getCollider(t) {
      return this.colliders.get(t);
    }
    getImpulseJoint(t) {
      return this.impulseJoints.get(t);
    }
    getMultibodyJoint(t) {
      return this.multibodyJoints.get(t);
    }
    removeRigidBody(t) {
      this.bodies && this.bodies.remove(t.handle, this.islands, this.colliders, this.impulseJoints, this.multibodyJoints);
    }
    removeCollider(t, e) {
      this.colliders && this.colliders.remove(t.handle, this.islands, this.bodies, e);
    }
    removeImpulseJoint(t, e) {
      this.impulseJoints && this.impulseJoints.remove(t.handle, e);
    }
    removeMultibodyJoint(t, e) {
      this.impulseJoints && this.multibodyJoints.remove(t.handle, e);
    }
    forEachCollider(t) {
      this.colliders.forEach(t);
    }
    forEachRigidBody(t) {
      this.bodies.forEach(t);
    }
    forEachActiveRigidBody(t) {
      this.bodies.forEachActiveRigidBody(this.islands, t);
    }
    castRay(t, e, n, r, s, a, o, l) {
      return this.queryPipeline.castRay(this.bodies, this.colliders, t, e, n, r, s, a ? a.handle : null, o ? o.handle : null, this.colliders.castClosure(l));
    }
    castRayAndGetNormal(t, e, n, r, s, a, o, l) {
      return this.queryPipeline.castRayAndGetNormal(this.bodies, this.colliders, t, e, n, r, s, a ? a.handle : null, o ? o.handle : null, this.colliders.castClosure(l));
    }
    intersectionsWithRay(t, e, n, r, s, a, o, l, c) {
      this.queryPipeline.intersectionsWithRay(this.bodies, this.colliders, t, e, n, r, s, a, o ? o.handle : null, l ? l.handle : null, this.colliders.castClosure(c));
    }
    intersectionWithShape(t, e, n, r, s, a, o, l) {
      let c = this.queryPipeline.intersectionWithShape(this.bodies, this.colliders, t, e, n, r, s, a ? a.handle : null, o ? o.handle : null, this.colliders.castClosure(l));
      return c != null ? this.colliders.get(c) : null;
    }
    projectPoint(t, e, n, r, s, a, o) {
      return this.queryPipeline.projectPoint(this.bodies, this.colliders, t, e, n, r, s ? s.handle : null, a ? a.handle : null, this.colliders.castClosure(o));
    }
    projectPointAndGetFeature(t, e, n, r, s, a) {
      return this.queryPipeline.projectPointAndGetFeature(this.bodies, this.colliders, t, e, n, r ? r.handle : null, s ? s.handle : null, this.colliders.castClosure(a));
    }
    intersectionsWithPoint(t, e, n, r, s, a, o) {
      this.queryPipeline.intersectionsWithPoint(this.bodies, this.colliders, t, this.colliders.castClosure(e), n, r, s ? s.handle : null, a ? a.handle : null, this.colliders.castClosure(o));
    }
    castShape(t, e, n, r, s, a, o, l, c, u, f, p) {
      return this.queryPipeline.castShape(this.bodies, this.colliders, t, e, n, r, s, a, o, l, c, u ? u.handle : null, f ? f.handle : null, this.colliders.castClosure(p));
    }
    intersectionsWithShape(t, e, n, r, s, a, o, l, c) {
      this.queryPipeline.intersectionsWithShape(this.bodies, this.colliders, t, e, n, this.colliders.castClosure(r), s, a, o ? o.handle : null, l ? l.handle : null, this.colliders.castClosure(c));
    }
    collidersWithAabbIntersectingAabb(t, e, n) {
      this.queryPipeline.collidersWithAabbIntersectingAabb(t, e, this.colliders.castClosure(n));
    }
    contactPairsWith(t, e) {
      this.narrowPhase.contactPairsWith(t.handle, this.colliders.castClosure(e));
    }
    intersectionPairsWith(t, e) {
      this.narrowPhase.intersectionPairsWith(t.handle, this.colliders.castClosure(e));
    }
    contactPair(t, e, n) {
      this.narrowPhase.contactPair(t.handle, e.handle, n);
    }
    intersectionPair(t, e) {
      return this.narrowPhase.intersectionPair(t.handle, e.handle);
    }
  }
  var _s;
  (function(i) {
    i[i.NONE = 0] = "NONE", i[i.COLLISION_EVENTS = 1] = "COLLISION_EVENTS", i[i.CONTACT_FORCE_EVENTS = 2] = "CONTACT_FORCE_EVENTS";
  })(_s || (_s = {}));
  class Hh {
    free() {
      this.raw && this.raw.free(), this.raw = void 0;
    }
    collider1() {
      return this.raw.collider1();
    }
    collider2() {
      return this.raw.collider2();
    }
    totalForce() {
      return I.fromRaw(this.raw.total_force());
    }
    totalForceMagnitude() {
      return this.raw.total_force_magnitude();
    }
    maxForceDirection() {
      return I.fromRaw(this.raw.max_force_direction());
    }
    maxForceMagnitude() {
      return this.raw.max_force_magnitude();
    }
  }
  class Rg {
    constructor(t, e) {
      this.raw = e || new hh(t);
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0;
    }
    drainCollisionEvents(t) {
      this.raw.drainCollisionEvents(t);
    }
    drainContactForceEvents(t) {
      let e = new Hh();
      this.raw.drainContactForceEvents((n) => {
        e.raw = n, t(e), e.free();
      });
    }
    clear() {
      this.raw.clear();
    }
  }
  var ms;
  (function(i) {
    i[i.NONE = 0] = "NONE", i[i.FILTER_CONTACT_PAIRS = 1] = "FILTER_CONTACT_PAIRS", i[i.FILTER_INTERSECTION_PAIRS = 2] = "FILTER_INTERSECTION_PAIRS";
  })(ms || (ms = {}));
  var so;
  (function(i) {
    i[i.EMPTY = 0] = "EMPTY", i[i.COMPUTE_IMPULSE = 1] = "COMPUTE_IMPULSE";
  })(so || (so = {}));
  var gs;
  (function(i) {
    i[i.DYNAMIC_DYNAMIC = 1] = "DYNAMIC_DYNAMIC", i[i.DYNAMIC_KINEMATIC = 12] = "DYNAMIC_KINEMATIC", i[i.DYNAMIC_FIXED = 2] = "DYNAMIC_FIXED", i[i.KINEMATIC_KINEMATIC = 52224] = "KINEMATIC_KINEMATIC", i[i.KINEMATIC_FIXED = 8704] = "KINEMATIC_FIXED", i[i.FIXED_FIXED = 32] = "FIXED_FIXED", i[i.DEFAULT = 15] = "DEFAULT", i[i.ALL = 60943] = "ALL";
  })(gs || (gs = {}));
  class ao {
    constructor(t, e, n, r) {
      this.colliderSet = t, this.handle = e, this._parent = n, this._shape = r;
    }
    finalizeDeserialization(t) {
      this.handle != null && (this._parent = t.get(this.colliderSet.raw.coParent(this.handle)));
    }
    ensureShapeIsCached() {
      this._shape || (this._shape = Me.fromRaw(this.colliderSet.raw, this.handle));
    }
    get shape() {
      return this.ensureShapeIsCached(), this._shape;
    }
    isValid() {
      return this.colliderSet.raw.contains(this.handle);
    }
    translation() {
      return I.fromRaw(this.colliderSet.raw.coTranslation(this.handle));
    }
    rotation() {
      return Bt.fromRaw(this.colliderSet.raw.coRotation(this.handle));
    }
    isSensor() {
      return this.colliderSet.raw.coIsSensor(this.handle);
    }
    setSensor(t) {
      this.colliderSet.raw.coSetSensor(this.handle, t);
    }
    setShape(t) {
      let e = t.intoRaw();
      this.colliderSet.raw.coSetShape(this.handle, e), e.free(), this._shape = t;
    }
    setEnabled(t) {
      this.colliderSet.raw.coSetEnabled(this.handle, t);
    }
    isEnabled() {
      return this.colliderSet.raw.coIsEnabled(this.handle);
    }
    setRestitution(t) {
      this.colliderSet.raw.coSetRestitution(this.handle, t);
    }
    setFriction(t) {
      this.colliderSet.raw.coSetFriction(this.handle, t);
    }
    frictionCombineRule() {
      return this.colliderSet.raw.coFrictionCombineRule(this.handle);
    }
    setFrictionCombineRule(t) {
      this.colliderSet.raw.coSetFrictionCombineRule(this.handle, t);
    }
    restitutionCombineRule() {
      return this.colliderSet.raw.coRestitutionCombineRule(this.handle);
    }
    setRestitutionCombineRule(t) {
      this.colliderSet.raw.coSetRestitutionCombineRule(this.handle, t);
    }
    setCollisionGroups(t) {
      this.colliderSet.raw.coSetCollisionGroups(this.handle, t);
    }
    setSolverGroups(t) {
      this.colliderSet.raw.coSetSolverGroups(this.handle, t);
    }
    contactSkin() {
      return this.colliderSet.raw.coContactSkin(this.handle);
    }
    setContactSkin(t) {
      return this.colliderSet.raw.coSetContactSkin(this.handle, t);
    }
    activeHooks() {
      return this.colliderSet.raw.coActiveHooks(this.handle);
    }
    setActiveHooks(t) {
      this.colliderSet.raw.coSetActiveHooks(this.handle, t);
    }
    activeEvents() {
      return this.colliderSet.raw.coActiveEvents(this.handle);
    }
    setActiveEvents(t) {
      this.colliderSet.raw.coSetActiveEvents(this.handle, t);
    }
    activeCollisionTypes() {
      return this.colliderSet.raw.coActiveCollisionTypes(this.handle);
    }
    setContactForceEventThreshold(t) {
      return this.colliderSet.raw.coSetContactForceEventThreshold(this.handle, t);
    }
    contactForceEventThreshold() {
      return this.colliderSet.raw.coContactForceEventThreshold(this.handle);
    }
    setActiveCollisionTypes(t) {
      this.colliderSet.raw.coSetActiveCollisionTypes(this.handle, t);
    }
    setDensity(t) {
      this.colliderSet.raw.coSetDensity(this.handle, t);
    }
    setMass(t) {
      this.colliderSet.raw.coSetMass(this.handle, t);
    }
    setMassProperties(t, e, n, r) {
      let s = I.intoRaw(e), a = I.intoRaw(n), o = Bt.intoRaw(r);
      this.colliderSet.raw.coSetMassProperties(this.handle, t, s, a, o), s.free(), a.free(), o.free();
    }
    setTranslation(t) {
      this.colliderSet.raw.coSetTranslation(this.handle, t.x, t.y, t.z);
    }
    setTranslationWrtParent(t) {
      this.colliderSet.raw.coSetTranslationWrtParent(this.handle, t.x, t.y, t.z);
    }
    setRotation(t) {
      this.colliderSet.raw.coSetRotation(this.handle, t.x, t.y, t.z, t.w);
    }
    setRotationWrtParent(t) {
      this.colliderSet.raw.coSetRotationWrtParent(this.handle, t.x, t.y, t.z, t.w);
    }
    shapeType() {
      return this.colliderSet.raw.coShapeType(this.handle);
    }
    halfExtents() {
      return I.fromRaw(this.colliderSet.raw.coHalfExtents(this.handle));
    }
    setHalfExtents(t) {
      const e = I.intoRaw(t);
      this.colliderSet.raw.coSetHalfExtents(this.handle, e);
    }
    radius() {
      return this.colliderSet.raw.coRadius(this.handle);
    }
    setRadius(t) {
      this.colliderSet.raw.coSetRadius(this.handle, t);
    }
    roundRadius() {
      return this.colliderSet.raw.coRoundRadius(this.handle);
    }
    setRoundRadius(t) {
      this.colliderSet.raw.coSetRoundRadius(this.handle, t);
    }
    halfHeight() {
      return this.colliderSet.raw.coHalfHeight(this.handle);
    }
    setHalfHeight(t) {
      this.colliderSet.raw.coSetHalfHeight(this.handle, t);
    }
    vertices() {
      return this.colliderSet.raw.coVertices(this.handle);
    }
    indices() {
      return this.colliderSet.raw.coIndices(this.handle);
    }
    heightfieldHeights() {
      return this.colliderSet.raw.coHeightfieldHeights(this.handle);
    }
    heightfieldScale() {
      let t = this.colliderSet.raw.coHeightfieldScale(this.handle);
      return I.fromRaw(t);
    }
    heightfieldNRows() {
      return this.colliderSet.raw.coHeightfieldNRows(this.handle);
    }
    heightfieldNCols() {
      return this.colliderSet.raw.coHeightfieldNCols(this.handle);
    }
    parent() {
      return this._parent;
    }
    friction() {
      return this.colliderSet.raw.coFriction(this.handle);
    }
    restitution() {
      return this.colliderSet.raw.coRestitution(this.handle);
    }
    density() {
      return this.colliderSet.raw.coDensity(this.handle);
    }
    mass() {
      return this.colliderSet.raw.coMass(this.handle);
    }
    volume() {
      return this.colliderSet.raw.coVolume(this.handle);
    }
    collisionGroups() {
      return this.colliderSet.raw.coCollisionGroups(this.handle);
    }
    solverGroups() {
      return this.colliderSet.raw.coSolverGroups(this.handle);
    }
    containsPoint(t) {
      let e = I.intoRaw(t), n = this.colliderSet.raw.coContainsPoint(this.handle, e);
      return e.free(), n;
    }
    projectPoint(t, e) {
      let n = I.intoRaw(t), r = mr.fromRaw(this.colliderSet.raw.coProjectPoint(this.handle, n, e));
      return n.free(), r;
    }
    intersectsRay(t, e) {
      let n = I.intoRaw(t.origin), r = I.intoRaw(t.dir), s = this.colliderSet.raw.coIntersectsRay(this.handle, n, r, e);
      return n.free(), r.free(), s;
    }
    castShape(t, e, n, r, s, a, o, l) {
      let c = I.intoRaw(t), u = I.intoRaw(n), f = Bt.intoRaw(r), p = I.intoRaw(s), _ = e.intoRaw(), g = Ki.fromRaw(this.colliderSet, this.colliderSet.raw.coCastShape(this.handle, c, _, u, f, p, a, o, l));
      return c.free(), u.free(), f.free(), p.free(), _.free(), g;
    }
    castCollider(t, e, n, r, s, a) {
      let o = I.intoRaw(t), l = I.intoRaw(n), c = wr.fromRaw(this.colliderSet, this.colliderSet.raw.coCastCollider(this.handle, o, e.handle, l, r, s, a));
      return o.free(), l.free(), c;
    }
    intersectsShape(t, e, n) {
      let r = I.intoRaw(e), s = Bt.intoRaw(n), a = t.intoRaw(), o = this.colliderSet.raw.coIntersectsShape(this.handle, a, r, s);
      return r.free(), s.free(), a.free(), o;
    }
    contactShape(t, e, n, r) {
      let s = I.intoRaw(e), a = Bt.intoRaw(n), o = t.intoRaw(), l = ki.fromRaw(this.colliderSet.raw.coContactShape(this.handle, o, s, a, r));
      return s.free(), a.free(), o.free(), l;
    }
    contactCollider(t, e) {
      return ki.fromRaw(this.colliderSet.raw.coContactCollider(this.handle, t.handle, e));
    }
    castRay(t, e, n) {
      let r = I.intoRaw(t.origin), s = I.intoRaw(t.dir), a = this.colliderSet.raw.coCastRay(this.handle, r, s, e, n);
      return r.free(), s.free(), a;
    }
    castRayAndGetNormal(t, e, n) {
      let r = I.intoRaw(t.origin), s = I.intoRaw(t.dir), a = gr.fromRaw(this.colliderSet.raw.coCastRayAndGetNormal(this.handle, r, s, e, n));
      return r.free(), s.free(), a;
    }
  }
  var ci;
  (function(i) {
    i[i.Density = 0] = "Density", i[i.Mass = 1] = "Mass", i[i.MassProps = 2] = "MassProps";
  })(ci || (ci = {}));
  class be {
    constructor(t) {
      this.enabled = true, this.shape = t, this.massPropsMode = ci.Density, this.density = 1, this.friction = 0.5, this.restitution = 0, this.rotation = Bt.identity(), this.translation = I.zeros(), this.isSensor = false, this.collisionGroups = 4294967295, this.solverGroups = 4294967295, this.frictionCombineRule = hr.Average, this.restitutionCombineRule = hr.Average, this.activeCollisionTypes = gs.DEFAULT, this.activeEvents = _s.NONE, this.activeHooks = ms.NONE, this.mass = 0, this.centerOfMass = I.zeros(), this.contactForceEventThreshold = 0, this.contactSkin = 0, this.principalAngularInertia = I.zeros(), this.angularInertiaLocalFrame = Bt.identity();
    }
    static ball(t) {
      const e = new Ao(t);
      return new be(e);
    }
    static capsule(t, e) {
      const n = new Io(t, e);
      return new be(n);
    }
    static segment(t, e) {
      const n = new Lo(t, e);
      return new be(n);
    }
    static triangle(t, e, n) {
      const r = new Do(t, e, n);
      return new be(r);
    }
    static roundTriangle(t, e, n, r) {
      const s = new Uo(t, e, n, r);
      return new be(s);
    }
    static polyline(t, e) {
      const n = new Fo(t, e);
      return new be(n);
    }
    static trimesh(t, e, n) {
      const r = new No(t, e, n);
      return new be(r);
    }
    static cuboid(t, e, n) {
      const r = new Co(t, e, n);
      return new be(r);
    }
    static roundCuboid(t, e, n, r) {
      const s = new Po(t, e, n, r);
      return new be(s);
    }
    static heightfield(t, e, n, r, s) {
      const a = new Oo(t, e, n, r, s);
      return new be(a);
    }
    static cylinder(t, e) {
      const n = new zo(t, e);
      return new be(n);
    }
    static roundCylinder(t, e, n) {
      const r = new Bo(t, e, n);
      return new be(r);
    }
    static cone(t, e) {
      const n = new Ho(t, e);
      return new be(n);
    }
    static roundCone(t, e, n) {
      const r = new Go(t, e, n);
      return new be(r);
    }
    static convexHull(t) {
      const e = new fs(t, null);
      return new be(e);
    }
    static convexMesh(t, e) {
      const n = new fs(t, e);
      return new be(n);
    }
    static roundConvexHull(t, e) {
      const n = new ps(t, null, e);
      return new be(n);
    }
    static roundConvexMesh(t, e, n) {
      const r = new ps(t, e, n);
      return new be(r);
    }
    setTranslation(t, e, n) {
      if (typeof t != "number" || typeof e != "number" || typeof n != "number") throw TypeError("The translation components must be numbers.");
      return this.translation = { x: t, y: e, z: n }, this;
    }
    setRotation(t) {
      return Bt.copy(this.rotation, t), this;
    }
    setSensor(t) {
      return this.isSensor = t, this;
    }
    setEnabled(t) {
      return this.enabled = t, this;
    }
    setContactSkin(t) {
      return this.contactSkin = t, this;
    }
    setDensity(t) {
      return this.massPropsMode = ci.Density, this.density = t, this;
    }
    setMass(t) {
      return this.massPropsMode = ci.Mass, this.mass = t, this;
    }
    setMassProperties(t, e, n, r) {
      return this.massPropsMode = ci.MassProps, this.mass = t, I.copy(this.centerOfMass, e), I.copy(this.principalAngularInertia, n), Bt.copy(this.angularInertiaLocalFrame, r), this;
    }
    setRestitution(t) {
      return this.restitution = t, this;
    }
    setFriction(t) {
      return this.friction = t, this;
    }
    setFrictionCombineRule(t) {
      return this.frictionCombineRule = t, this;
    }
    setRestitutionCombineRule(t) {
      return this.restitutionCombineRule = t, this;
    }
    setCollisionGroups(t) {
      return this.collisionGroups = t, this;
    }
    setSolverGroups(t) {
      return this.solverGroups = t, this;
    }
    setActiveHooks(t) {
      return this.activeHooks = t, this;
    }
    setActiveEvents(t) {
      return this.activeEvents = t, this;
    }
    setActiveCollisionTypes(t) {
      return this.activeCollisionTypes = t, this;
    }
    setContactForceEventThreshold(t) {
      return this.contactForceEventThreshold = t, this;
    }
  }
  class Gh {
    constructor(t) {
      this.raw = t || new fe(), this.map = new As(), t && t.forEachColliderHandle((e) => {
        this.map.set(e, new ao(this, e, null));
      });
    }
    free() {
      this.raw && this.raw.free(), this.raw = void 0, this.map && this.map.clear(), this.map = void 0;
    }
    castClosure(t) {
      return (e) => {
        if (t) return t(this.get(e));
      };
    }
    finalizeDeserialization(t) {
      this.map.forEach((e) => e.finalizeDeserialization(t));
    }
    createCollider(t, e, n) {
      let r = n != null && n != null;
      if (r && isNaN(n)) throw Error("Cannot create a collider with a parent rigid-body handle that is not a number.");
      let s = e.shape.intoRaw(), a = I.intoRaw(e.translation), o = Bt.intoRaw(e.rotation), l = I.intoRaw(e.centerOfMass), c = I.intoRaw(e.principalAngularInertia), u = Bt.intoRaw(e.angularInertiaLocalFrame), f = this.raw.createCollider(e.enabled, s, a, o, e.massPropsMode, e.mass, l, c, u, e.density, e.friction, e.restitution, e.frictionCombineRule, e.restitutionCombineRule, e.isSensor, e.collisionGroups, e.solverGroups, e.activeCollisionTypes, e.activeHooks, e.activeEvents, e.contactForceEventThreshold, e.contactSkin, r, r ? n : 0, t.raw);
      s.free(), a.free(), o.free(), l.free(), c.free(), u.free();
      let p = r ? t.get(n) : null, _ = new ao(this, f, p, e.shape);
      return this.map.set(f, _), _;
    }
    remove(t, e, n, r) {
      this.raw.remove(t, e.raw, n.raw, r), this.unmap(t);
    }
    unmap(t) {
      this.map.delete(t);
    }
    get(t) {
      return this.map.get(t);
    }
    len() {
      return this.map.len();
    }
    contains(t) {
      return this.get(t) != null;
    }
    forEach(t) {
      this.map.forEach(t);
    }
    getAll() {
      return this.map.getAll();
    }
  }
  function Ag() {
    return hg();
  }
  const Cg = Object.freeze(Object.defineProperty({ __proto__: null, get ActiveCollisionTypes() {
    return gs;
  }, get ActiveEvents() {
    return _s;
  }, get ActiveHooks() {
    return ms;
  }, Ball: Ao, BroadPhase: Ch, CCDSolver: Rh, Capsule: Io, CharacterCollision: Oh, get CoefficientCombineRule() {
    return hr;
  }, Collider: ao, ColliderDesc: be, ColliderSet: Gh, ColliderShapeCastHit: wr, Cone: Ho, ConvexPolyhedron: fs, Cuboid: Co, Cylinder: zo, DebugRenderBuffers: Fh, DebugRenderPipeline: Nh, DynamicRayCastVehicleController: Bh, EventQueue: Rg, get FeatureType() {
    return Vi;
  }, FixedImpulseJoint: ph, FixedMultibodyJoint: Sh, GenericImpulseJoint: vh, HalfSpace: Lh, get HeightFieldFlags() {
    return eo;
  }, Heightfield: Oo, ImpulseJoint: ln, ImpulseJointSet: xh, IntegrationParameters: fh, IslandManager: Ah, get JointAxesMask() {
    return to;
  }, JointData: Mn, get JointType() {
    return Pe;
  }, KinematicCharacterController: zh, get MassPropsMode() {
    return ci;
  }, get MotorModel() {
    return Qa;
  }, MultibodyJoint: jn, MultibodyJointSet: Th, NarrowPhase: Ph, PhysicsPipeline: Dh, PointColliderProjection: ur, PointProjection: mr, Polyline: Fo, PrismaticImpulseJoint: gh, PrismaticMultibodyJoint: yh, Quaternion: ds, get QueryFilterFlags() {
    return io;
  }, QueryPipeline: Uh, Ray: Tg, RayColliderHit: Cs, RayColliderIntersection: dr, RayIntersection: gr, RevoluteImpulseJoint: wh, RevoluteMultibodyJoint: Mh, RigidBody: Ja, RigidBodyDesc: hn, RigidBodySet: dh, get RigidBodyType() {
    return rn;
  }, RopeImpulseJoint: _h, RotationOps: Bt, RoundCone: Go, RoundConvexPolyhedron: ps, RoundCuboid: Po, RoundCylinder: Bo, RoundTriangle: Uo, SdpMatrix3: uh, SdpMatrix3Ops: $a, Segment: Lo, SerializationPipeline: ro, Shape: Me, ShapeCastHit: Ki, ShapeContact: ki, get ShapeType() {
    return xe;
  }, get SolverFlags() {
    return so;
  }, SphericalImpulseJoint: bh, SphericalMultibodyJoint: Eh, SpringImpulseJoint: mh, TempContactForceEvent: Hh, TempContactManifold: Ih, TriMesh: No, get TriMeshFlags() {
    return no;
  }, Triangle: Do, UnitImpulseJoint: To, UnitMultibodyJoint: Ro, Vector3: Xe, VectorOps: I, World: vr, version: Ag }, Symbol.toStringTag, { value: "Module" }));
  class Pg {
    constructor() {
      __publicField(this, "rapier", Cg);
      __publicField(this, "world");
      __publicField(this, "fixedTimeStep", 1 / 60);
      __publicField(this, "accumulator", 0);
    }
    async init() {
      const t = new Xe(0, -9.81, 0);
      this.world = new vr(t);
    }
    step(t, e) {
      const n = Math.min(t, 0.1);
      for (this.accumulator += n; this.accumulator >= this.fixedTimeStep; ) e && e(this.fixedTimeStep), this.world.step(), this.accumulator -= this.fixedTimeStep;
    }
  }
  class Ig {
    constructor(t, e, n) {
      __publicField(this, "group");
      __publicField(this, "rigidBodies", []);
      this.group = new Ii(), t.add(this.group), this.buildMap(e, n);
    }
    buildMap(t, e) {
      const n = new qe(300, 2, 300), r = new li({ color: 3028283, roughness: 0.85, metalness: 0.1 }), s = new Re(n, r);
      s.position.set(0, -1, 0), s.receiveShadow = true, this.group.add(s), this.createStaticTrimesh(s, t, e);
      const a = new ig(300, 60, 5596791, 4016210);
      a.position.y = 0.02, this.group.add(a);
      const o = new li({ color: 15105570, roughness: 0.5, metalness: 0.2 }), l = this.createRampMesh(14, 3, 24, o);
      l.position.set(0, 1.5, 30), l.rotation.x = -Math.PI * 0.08, this.group.add(l), this.createStaticTrimesh(l, t, e);
      const c = this.createRampMesh(18, 5, 28, o);
      c.position.set(-35, 2.5, -40), c.rotation.y = Math.PI * 0.25, c.rotation.x = -Math.PI * 0.1, this.group.add(c), this.createStaticTrimesh(c, t, e);
      const u = this.createRampMesh(16, 4, 25, o);
      u.position.set(45, 2, -20), u.rotation.y = -Math.PI * 0.4, u.rotation.x = -Math.PI * 0.09, this.group.add(u), this.createStaticTrimesh(u, t, e);
      const f = new li({ color: 3447003, roughness: 0.4, metalness: 0.3 }), p = [{ size: [6, 4, 6], pos: [20, 2, 20] }, { size: [8, 5, 8], pos: [-25, 2.5, 20] }, { size: [12, 3, 6], pos: [0, 1.5, -30] }, { size: [4, 6, 20], pos: [-40, 3, 10] }, { size: [4, 6, 20], pos: [40, 3, 10] }];
      for (const v of p) {
        const m = new qe(v.size[0], v.size[1], v.size[2]), d = new Re(m, f);
        d.position.set(v.pos[0], v.pos[1], v.pos[2]), d.castShadow = true, d.receiveShadow = true, this.group.add(d), this.createStaticTrimesh(d, t, e);
      }
      const _ = new li({ color: 8359053, roughness: 0.9 }), g = [{ size: [300, 8, 4], pos: [0, 4, 150] }, { size: [300, 8, 4], pos: [0, 4, -150] }, { size: [4, 8, 300], pos: [150, 4, 0] }, { size: [4, 8, 300], pos: [-150, 4, 0] }];
      for (const v of g) {
        const m = new qe(v.size[0], v.size[1], v.size[2]), d = new Re(m, _);
        d.position.set(v.pos[0], v.pos[1], v.pos[2]), d.receiveShadow = true, this.group.add(d), this.createStaticTrimesh(d, t, e);
      }
    }
    createRampMesh(t, e, n, r) {
      const s = new qe(t, e, n), a = new Re(s, r);
      return a.castShadow = true, a.receiveShadow = true, a;
    }
    createStaticTrimesh(t, e, n) {
      t.updateMatrixWorld(true);
      const r = t.geometry.clone();
      r.applyMatrix4(t.matrixWorld);
      const s = r.attributes.position, a = new Float32Array(s.array);
      let o;
      if (r.index) o = new Uint32Array(r.index.array);
      else {
        o = new Uint32Array(s.count);
        for (let f = 0; f < o.length; f++) o[f] = f;
      }
      const l = e.RigidBodyDesc.fixed(), c = n.createRigidBody(l), u = e.ColliderDesc.trimesh(a, o);
      u.setFriction(0.85), u.setRestitution(0.1), n.createCollider(u, c), this.rigidBodies.push(c), r.dispose();
    }
  }
  class Lg {
    constructor(t, e, n) {
      __publicField(this, "mesh");
      __publicField(this, "body");
      __publicField(this, "collider");
      __publicField(this, "accelerationForce", 5e4);
      __publicField(this, "reverseForce", 25e3);
      __publicField(this, "turnTorque", 45e3);
      __publicField(this, "maxVelocity", 45);
      __publicField(this, "lateralFriction", 0.95);
      this.mesh = new Ii();
      const r = new li({ color: 15672124, metalness: 0.6, roughness: 0.3 }), s = new Re(new qe(2, 0.7, 4.2), r);
      s.position.y = 0.5, s.castShadow = true, s.receiveShadow = true, this.mesh.add(s);
      const a = new li({ color: 1118481, metalness: 0.8, roughness: 0.2 }), o = new Re(new qe(1.6, 0.6, 2.2), a);
      o.position.set(0, 1, -0.2), o.castShadow = true, this.mesh.add(o);
      const l = new ss({ color: 16777130 }), c = new Re(new qe(0.3, 0.15, 0.1), l);
      c.position.set(-0.65, 0.5, 2.11);
      const u = c.clone();
      u.position.x = 0.65, this.mesh.add(c), this.mesh.add(u);
      const f = new ss({ color: 16711731 }), p = new Re(new qe(0.35, 0.15, 0.1), f);
      p.position.set(-0.65, 0.5, -2.11);
      const _ = p.clone();
      _.position.x = 0.65, this.mesh.add(p), this.mesh.add(_);
      const g = new li({ color: 2236962, roughness: 0.8 }), v = new wo(0.4, 0.4, 0.3, 24);
      v.rotateZ(Math.PI / 2);
      const m = [[-1, 0.3, 1.3], [1, 0.3, 1.3], [-1, 0.3, -1.3], [1, 0.3, -1.3]];
      for (const E of m) {
        const y = new Re(v, g);
        y.position.set(E[0], E[1], E[2]), y.castShadow = true, this.mesh.add(y);
      }
      t.add(this.mesh);
      const d = e.RigidBodyDesc.dynamic().setTranslation(0, 2, 0).setCanSleep(false).setLinearDamping(0.4).setAngularDamping(2.5);
      this.body = n.createRigidBody(d);
      const T = e.ColliderDesc.cuboid(1, 0.45, 2.1).setDensity(250).setFriction(0.05).setRestitution(0.05);
      this.collider = n.createCollider(T, this.body), this.body.setAdditionalMass(200, true);
    }
    updateFixed(t, e) {
      const n = this.body.rotation(), r = new qi(n.x, n.y, n.z, n.w), s = new z(0, 0, 1).applyQuaternion(r), a = new z(1, 0, 0).applyQuaternion(r), o = new z(0, 1, 0).applyQuaternion(r), l = this.body.linvel(), c = new z(l.x, l.y, l.z), u = c.dot(s);
      if (o.dot(new z(0, 1, 0)) > 0.25) {
        if (t.forward) {
          if (u < this.maxVelocity) {
            const d = s.clone().multiplyScalar(this.accelerationForce);
            this.body.applyImpulse(new Xe(d.x * e, d.y * e, d.z * e), true);
          }
        } else if (t.backward && u > -this.maxVelocity * 0.4) {
          const d = s.clone().multiplyScalar(-this.reverseForce);
          this.body.applyImpulse(new Xe(d.x * e, d.y * e, d.z * e), true);
        }
        let p = 0;
        if (t.left && (p += 1), t.right && (p -= 1), p !== 0) {
          const d = u < -0.5 ? -1 : 1, T = p * this.turnTorque * d, E = new z(0, T * e, 0);
          this.body.applyTorqueImpulse(new Xe(E.x, E.y, E.z), true);
        }
        const _ = c.dot(a);
        let g = this.lateralFriction;
        t.brake && (g = 0.35);
        const v = a.clone().multiplyScalar(-_ * this.body.mass() * g * 0.2);
        if (this.body.applyImpulse(new Xe(v.x, v.y * 0.1, v.z), true), t.brake && Math.abs(u) > 0.1) {
          const d = s.clone().multiplyScalar(-Math.sign(u) * 35e3 * e);
          this.body.applyImpulse(new Xe(d.x, d.y, d.z), true);
        }
        if (!t.forward && !t.backward && Math.abs(u) > 0.05) {
          const d = s.clone().multiplyScalar(-Math.sign(u) * 8e3 * e);
          this.body.applyImpulse(new Xe(d.x, d.y, d.z), true);
        }
        const m = new z(0, 1, 0).cross(o).multiplyScalar(-2500);
        this.body.applyTorqueImpulse(new Xe(m.x * e, m.y * e, m.z * e), true);
      }
    }
    reset(t = 0, e = 2, n = 0) {
      this.body.setTranslation(new Xe(t, e, n), true), this.body.setRotation(new ds(0, 0, 0, 1), true), this.body.setLinvel(new Xe(0, 0, 0), true), this.body.setAngvel(new Xe(0, 0, 0), true);
    }
    syncRender() {
      const t = this.body.translation(), e = this.body.rotation();
      this.mesh.position.set(t.x, t.y, t.z), this.mesh.quaternion.set(e.x, e.y, e.z, e.w);
    }
  }
  class Dg {
    constructor() {
      __publicField(this, "renderer");
      __publicField(this, "physics");
      __publicField(this, "map");
      __publicField(this, "car");
      __publicField(this, "inputs", { forward: false, backward: false, left: false, right: false, brake: false });
      __publicField(this, "lastTime", 0);
      __publicField(this, "cameraTarget", new z());
      __publicField(this, "cameraPos", new z());
    }
    async start() {
      const t = document.getElementById("game-canvas");
      if (!t) throw new Error("Canvas element #game-canvas not found");
      this.renderer = new rg(t), this.physics = new Pg(), await this.physics.init(), this.map = new Ig(this.renderer.scene, this.physics.rapier, this.physics.world), this.car = new Lg(this.renderer.scene, this.physics.rapier, this.physics.world), this.setupInputs(), this.lastTime = performance.now(), requestAnimationFrame(this.loop.bind(this));
    }
    setupInputs() {
      window.addEventListener("keydown", (t) => {
        switch (t.code) {
          case "KeyW":
          case "ArrowUp":
            this.inputs.forward = true;
            break;
          case "KeyS":
          case "ArrowDown":
            this.inputs.backward = true;
            break;
          case "KeyA":
          case "ArrowLeft":
            this.inputs.left = true;
            break;
          case "KeyD":
          case "ArrowRight":
            this.inputs.right = true;
            break;
          case "Space":
            this.inputs.brake = true;
            break;
          case "KeyR":
            this.car.reset(0, 2, 0);
            break;
        }
      }), window.addEventListener("keyup", (t) => {
        switch (t.code) {
          case "KeyW":
          case "ArrowUp":
            this.inputs.forward = false;
            break;
          case "KeyS":
          case "ArrowDown":
            this.inputs.backward = false;
            break;
          case "KeyA":
          case "ArrowLeft":
            this.inputs.left = false;
            break;
          case "KeyD":
          case "ArrowRight":
            this.inputs.right = false;
            break;
          case "Space":
            this.inputs.brake = false;
            break;
        }
      });
    }
    loop(t) {
      const e = (t - this.lastTime) / 1e3;
      this.lastTime = t, this.physics.step(e, (n) => {
        this.car.updateFixed(this.inputs, n);
      }), this.car.syncRender(), this.updateCamera(e), this.renderer.render(), requestAnimationFrame(this.loop.bind(this));
    }
    updateCamera(t) {
      const e = this.car.mesh.position, n = this.car.mesh.quaternion, r = new z(0, 4.5, -9.5).applyQuaternion(n), s = e.clone().add(r), a = Math.min(1, t * 7.5);
      this.cameraPos.lerp(s, a), this.renderer.camera.position.copy(this.cameraPos);
      const o = new z(0, 1.2, 5).applyQuaternion(n), l = e.clone().add(o);
      this.cameraTarget.lerp(l, a), this.renderer.camera.lookAt(this.cameraTarget), this.renderer.dirLight.position.set(e.x + 45, e.y + 60, e.z - 30), this.renderer.dirLight.target.position.copy(e), this.renderer.dirLight.target.updateMatrixWorld();
    }
  }
  const kh = new Dg();
  window.__GAME__ = kh;
  kh.start().catch((i) => {
    console.error("Failed to initialize 3D driving game:", i);
  });
});
var stdin_default = Ug();
export {
  stdin_default as default
};
