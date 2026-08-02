package atomdance.app.common.ratelimit;

/**
 * A token bucket: {@code capacity} tokens that refill smoothly over {@code refillPeriod}.
 * Smooth refill rather than a fixed window is the point. A fixed window lets a caller spend the
 * whole budget at 11:59:59 and the whole next budget at 12:00:00 - double the intended rate at the
 * boundary. Here a token becomes available every {@code refillPeriod / capacity}, so a burst up to
 * the capacity is allowed, but the sustained rate cannot exceed the configured one.
 */
final class TokenBucket {

	private final double capacity;
	private final double tokensPerNano;

	private double tokens;
	private long lastRefillNanos;

	TokenBucket(int capacity, long refillPeriodNanos, long nowNanos) {
		this.capacity = capacity;
		this.tokensPerNano = (double) capacity / refillPeriodNanos;
		this.tokens = capacity;
		this.lastRefillNanos = nowNanos;
	}

	/**
	 * Takes one token if available. Returns false when the caller is over their limit.
	 */
	synchronized boolean tryConsume(long nowNanos) {
		refill(nowNanos);

		if (tokens >= 1.0d) {
			tokens -= 1.0d;
			return true;
		}

		return false;
	}

	/**
	 * Whole seconds until the next token, for the {@code Retry-After} header. Never below 1.
	 */
	synchronized long retryAfterSeconds(long nowNanos) {
		refill(nowNanos);

		double missing = 1.0d - tokens;
		if (missing <= 0) {
			return 1;
		}

		return Math.max(1, (long) Math.ceil(missing / tokensPerNano / 1_000_000_000d));
	}

	/**
	 * A bucket back at full capacity is indistinguishable from a fresh one, so it can be dropped
	 * to keep the tracking map from growing without bound.
	 */
	synchronized boolean isIdle(long nowNanos) {
		refill(nowNanos);

		return tokens >= capacity;
	}

	private void refill(long nowNanos) {
		long elapsed = nowNanos - lastRefillNanos;

		if (elapsed <= 0) {
			return;
		}

		tokens = Math.min(capacity, tokens + elapsed * tokensPerNano);
		lastRefillNanos = nowNanos;
	}
}