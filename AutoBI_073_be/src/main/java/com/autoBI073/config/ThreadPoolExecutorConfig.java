package com.autoBI073.config;

import org.jetbrains.annotations.NotNull;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

@Configuration
public class ThreadPoolExecutorConfig {
    @Bean
    public ThreadPoolExecutor threadPoolExecutor() {
        ThreadFactory threadFactory = new ThreadFactory() {
            private int count = 1;

            @Override
            public Thread newThread(@NotNull Runnable r) {
                Thread thread = new Thread(r);
                thread.setName("线程" + count);
                count++;
                return thread;
            }
        };
        // 线程池核心大小为4，最大线程数为8，
        // 非核心线程空闲时间为100秒，任务队列为阻塞队列，长度为8，使用自定义的线程工厂创建线程
        // 返回创建的线程池
        return new ThreadPoolExecutor(4, 8, 100, TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(8), threadFactory);
    }
}

