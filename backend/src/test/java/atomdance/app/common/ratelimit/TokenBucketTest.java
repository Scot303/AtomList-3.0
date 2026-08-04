package atomdance.app.common.ratelimit;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class TokenBucketTest {

	private static final long ONE_MINUTE_NANOS = Duration.ofMinutes(1).toNanos();

	@Test
	void allowsABurstUpToCapacityThenRefuses() {
		TokenBucket bucket = new TokenBucket(3, ONE_MINUTE_NANOS, 0L);

		assertThat(bucket.tryConsume(0L)).isTrue();
		assertThat(bucket.tryConsume(0L)).isTrue();
		assertThat(bucket.tryConsume(0L)).isTrue();
		assertThat(bucket.tryConsume(0L)).isFalse();
	}

	@Test
	void refillsSmoothlyRatherThanInWindows() {
		TokenBucket bucket = new TokenBucket(10, ONE_MINUTE_NANOS, 0L);

		for (int i = 0; i < 10; i++) {
			bucket.tryConsume(0L);
		}

		// A token every refillPeriod/capacity - here every 6 seconds. Checked either side of that
		// mark rather than exactly on it: refill accumulates in floating point, so the boundary can
		// land a fraction of a token short.
		assertThat(bucket.tryConsume(Duration.ofSeconds(5).toNanos())).isFalse();
		assertThat(bucket.tryConsume(Duration.ofSeconds(7).toNanos())).isTrue();
	}

	@Test
	void doesNotHandOutTheWholeNextWindowAtOnce() {
		TokenBucket bucket = new TokenBucket(10, ONE_MINUTE_NANOS, 0L);

		for (int i = 0; i < 10; i++) {
			bucket.tryConsume(0L);
		}

		// The failure mode a fixed window has: spend the budget at the end of one window and the
		// whole next budget immediately after, for double the intended rate at the boundary.
		long justPastTheWindow = ONE_MINUTE_NANOS + 1;
		int granted = 0;

		for (int i = 0; i < 20; i++) {
			if (bucket.tryConsume(justPastTheWindow)) {
				granted++;
			}
		}

		assertThat(granted).isEqualTo(10);
	}

	@Test
	void neverAccumulatesBeyondCapacity() {
		TokenBucket bucket = new TokenBucket(2, ONE_MINUTE_NANOS, 0L);

		// Idle for an hour: the bucket must not have banked 120 requests.
		long muchLater = Duration.ofHours(1).toNanos();

		assertThat(bucket.tryConsume(muchLater)).isTrue();
		assertThat(bucket.tryConsume(muchLater)).isTrue();
		assertThat(bucket.tryConsume(muchLater)).isFalse();
	}

	@Test
	void reportsAWholeSecondRetryAfterThatIsNeverZero() {
		TokenBucket bucket = new TokenBucket(1, ONE_MINUTE_NANOS, 0L);
		bucket.tryConsume(0L);

		// Retry-After: 0 would invite an immediate retry that is guaranteed to fail again.
		assertThat(bucket.retryAfterSeconds(0L)).isBetween(1L, 60L);
	}

	@Test
	void aFullBucketIsIdleAndCollectable() {
		TokenBucket bucket = new TokenBucket(5, ONE_MINUTE_NANOS, 0L);

		assertThat(bucket.isIdle(0L)).isTrue();

		bucket.tryConsume(0L);
		assertThat(bucket.isIdle(0L)).isFalse();

		// Once fully refilled it is indistinguishable from a fresh bucket, so it can be evicted.
		assertThat(bucket.isIdle(ONE_MINUTE_NANOS)).isTrue();
	}
}
