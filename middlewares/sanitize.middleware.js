function sanitizeObjectInPlace(obj, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 10) return
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const val = obj[i]
      if (val && typeof val === "object") sanitizeObjectInPlace(val, depth + 1)
    }
    return
  }
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key === "__proto__" || key.includes(".__proto__")) {
      delete obj[key]
      continue
    }
    const val = obj[key]
    if (val && typeof val === "object") sanitizeObjectInPlace(val, depth + 1)
  }
}

export function sanitizeRequest(req, _res, next) {
  if (req.body && typeof req.body === "object") sanitizeObjectInPlace(req.body)
  if (req.params && typeof req.params === "object") sanitizeObjectInPlace(req.params)
  if (req.query && typeof req.query === "object") sanitizeObjectInPlace(req.query)
  next()
}

export function enforceJson(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const type = req.headers['content-type'] || ''
    if (!type.includes('application/json')) {
      return res.status(415).json({ success: false, message: 'Unsupported Media Type' })
    }
  }
  next()
}

export function hpp(req, _res, next) {
  const dedupe = (obj) => {
    if (!obj || typeof obj !== 'object') return
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      if (Array.isArray(val)) obj[key] = val[0]
    }
  }
  dedupe(req.query)
  next()
}

