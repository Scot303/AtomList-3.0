package atomdance.app.config;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class SmsPhoneWhitelistConfig {

    @Bean
    List<String> phoneWhitelist(@Value("${app.sms.phoneWhitelist}") String phoneWhitelistDelimited) {
        List<String> phoneWhitelist = new ArrayList<>();

        if (StringUtils.isBlank(phoneWhitelistDelimited)) {
            return phoneWhitelist;
        }

        String[] splitPhoneWhitelist = phoneWhitelistDelimited.split(",");
        phoneWhitelist.addAll(Arrays.asList(splitPhoneWhitelist));

        return phoneWhitelist;
    }
}
