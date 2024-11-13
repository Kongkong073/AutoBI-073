package com.autoBI073.config;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.Data;
import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.codec.JsonJacksonCodec;
import org.redisson.config.Config;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration
@ConfigurationProperties(prefix = "spring.redission")
@Data
public class RedissonConfig {

    private Integer database;

    private String host;

    private Integer port;

    @Bean
    public RedissonClient getRedissonClient() {
        Config config = new Config();
        // 使用 Jackson 序列化器，将所有数据序列化为 JSON 格式
        ObjectMapper objectMapper = JsonMapper.builder()
                .addModule(new JavaTimeModule()) // 支持 Java 8 时间模块
                .build();
        config.useSingleServer()
                .setDatabase(database)
                .setAddress("redis://" + host + ":" + port);

        config.setCodec(new JsonJacksonCodec(objectMapper));

        RedissonClient redisson = Redisson.create(config);
        return redisson;
    }
}
