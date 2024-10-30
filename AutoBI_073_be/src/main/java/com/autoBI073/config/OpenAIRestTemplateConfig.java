package com.autoBI073.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class OpenAIRestTemplateConfig {

    @Value("${openai.api.key}")
    private String openaiApiKey;

    @Bean
    @Qualifier("openaiRestTemplate")
    public RestTemplate openaiRestTemplate() {
        // 创建 HttpComponentsClientHttpRequestFactory 实例并设置超时时间
        HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory();
        requestFactory.setConnectTimeout(10000); // 设置连接超时时间为10秒
        requestFactory.setReadTimeout(20000);    // 设置读取超时时间为10秒

        // 创建 RestTemplate 实例并应用 requestFactory
        RestTemplate restTemplate = new RestTemplate(requestFactory);

        // 添加拦截器以设置 Authorization 头
        restTemplate.getInterceptors().add((request, body, execution) -> {
            request.getHeaders().add("Authorization", "Bearer " + openaiApiKey);
            return execution.execute(request, body);
        });

        return restTemplate;
    }
}