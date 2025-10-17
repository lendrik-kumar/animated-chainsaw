const store = new Map()

function getKey(req, bucket) {
  const ip = req.ip || req.connection?.remoteAddress || "unknown"
  return `${bucket}:${ip}`
}

export function rateLimit({ windowMs = 60000, max = 60, bucket = "global" } = {}) {
  return (req, res, next) => {
    const key = getKey(req, bucket)
    const now = Date.now()
    let entry = store.get(key)
    if (!entry || now > entry.reset) {
      entry = { count: 0, reset: now + windowMs }
      store.set(key, entry)
    }
    entry.count += 1
    const remaining = Math.max(0, max - entry.count)
    res.setHeader("X-RateLimit-Limit", String(max))
    res.setHeader("X-RateLimit-Remaining", String(remaining))
    res.setHeader("X-RateLimit-Reset", String(Math.floor(entry.reset / 1000)))
    if (entry.count > max) {
      return res.status(429).json({ success: false, message: "Too many requests" })
    }
    next()
  }
}

export const limitAuth = rateLimit({ windowMs: 60_000, max: 20, bucket: "auth" })
export const limitApi = rateLimit({ windowMs: 60_000, max: 120, bucket: "api" })

