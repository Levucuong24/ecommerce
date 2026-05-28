const rateLimit = ({ windowMs, max, message }) => {
  const hits = new Map();

  // Dọn dẹp bộ nhớ định kỳ để tránh rò rỉ bộ nhớ (memory leak)
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of hits.entries()) {
      const active = timestamps.filter(time => now - time < windowMs);
      if (active.length === 0) {
        hits.delete(ip);
      } else {
        hits.set(ip, active);
      }
    }
  }, 10 * 60 * 1000); // 10 phút dọn dẹp một lần

  return (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const now = Date.now();

    if (!hits.has(ip)) {
      hits.set(ip, []);
    }

    const timestamps = hits.get(ip);
    // Lọc bỏ các timestamp đã hết hạn
    const activeTimestamps = timestamps.filter(time => now - time < windowMs);

    if (activeTimestamps.length >= max) {
      const oldestActive = activeTimestamps[0];
      const msLeft = windowMs - (now - oldestActive);
      const minutesLeft = Math.ceil(msLeft / 60000);

      return res.status(429).json({
        message: message || `Bạn đã gửi yêu cầu quá nhanh. Vui lòng thử lại sau ${minutesLeft} phút.`,
      });
    }

    activeTimestamps.push(now);
    hits.set(ip, activeTimestamps);
    next();
  };
};

module.exports = rateLimit;
