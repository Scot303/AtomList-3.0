package atomdance.app.config;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

import static atomdance.app.common.utils.StaticValuesUtil.PHONE_COUNTRY_CODE;


@Configuration
public class SmsPhoneWhitelistConfig {

	/**
	 * Empty means no restriction, which is how production runs.
	 */
	@Bean
	List<String> phoneWhitelist(@Value("${app.sms.phoneWhitelist}") String phoneWhitelistDelimited) {
		if (StringUtils.isBlank(phoneWhitelistDelimited)) {
			return List.of();
		}

		return Arrays.stream(phoneWhitelistDelimited.split(","))
				.map(SmsPhoneWhitelistConfig::toLocalDigits)
				.filter(StringUtils::isNotBlank)
				.distinct()
				.toList();
	}


	private static String toLocalDigits(String entry) {
		String digits = entry.replaceAll("\\D", "");

		if (digits.length() > 9 && digits.startsWith(PHONE_COUNTRY_CODE)) {
			return digits.substring(PHONE_COUNTRY_CODE.length());
		}

		return digits;
	}
}
