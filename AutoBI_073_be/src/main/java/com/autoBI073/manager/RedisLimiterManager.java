package com.autoBI073.manager;
import com.autoBI073.common.ErrorCode;
import com.autoBI073.constant.Constants;
import com.autoBI073.exception.BusinessException;
import com.autoBI073.mapper.UserRateLimitMapper;
import com.autoBI073.model.vo.UserLimitVO;
import com.autoBI073.service.UserRateLimitService;
import io.swagger.models.auth.In;
import org.redisson.api.*;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

import javax.annotation.Resource;

@Service
public class RedisLimiterManager {
    @Resource
    private RedissonClient redissonClient;
    @Resource
    private UserRateLimitService userRateLimitService;


    /**
     * 限流操作
     * 令牌桶限流，为每个用户生成一个限流器，每秒最多1个请求，总共允许100次请求
     * @param key 区分不同的限流器，比如不同的用户 id 应该分别统计
     */
    public void doRateLimit(String key) {
        RRateLimiter rateLimiter = redissonClient.getRateLimiter(key);
        rateLimiter.trySetRate(RateType.OVERALL, 1, 1, RateIntervalUnit.SECONDS);
        // 每次请求消耗1个令牌
        boolean canOp = rateLimiter.tryAcquire(1);
        // 判断总计请求次数是否超过100次
        if (rateLimiter.availablePermits() > 50) {
            canOp = false;
        }
        if (!canOp) {
            throw new BusinessException(ErrorCode.TOO_MANY_REQUEST);
        }
    }

    /**
     * 限流操作
     * 令牌桶限流
     * @param userId
     */
    public UserLimitVO checkRateLimit(Long userId) {
        // 定义 Redis 缓存键
        String totalKey = Constants.TOTAL_KEY_PREFIX + userId;
        String dailyKey = Constants.DAILY_KEY_PREFIX + userId;
        String updateFlagKey = Constants.UPDATE_FLAG_KEY_PREFIX; // 用于标记需要更新的用户集合

        // 获取 Redis 中的计数器
        RAtomicLong totalRemainingCounter = redissonClient.getAtomicLong(totalKey);
        RAtomicLong dailyRemainingCounter = redissonClient.getAtomicLong(dailyKey);

        // 获取当前的剩余次数
        long totalRemaining = totalRemainingCounter.get();
        long dailyRemaining = dailyRemainingCounter.get();


        // 如果 Redis 中没有值，从数据库加载并设置默认值
        if (totalRemaining == 0 || dailyRemaining == 0) {
            UserLimitVO userLimitVO = userRateLimitService.getAvailableFromDB(userId);

            if (userLimitVO == null) {
                totalRemaining = Constants.TOTAL_REMAINING_REQUESTS;
                dailyRemaining = Constants.DAILY_REMAINING_REQUESTS;
            } else {
                totalRemaining = userLimitVO.getTotalRemainingRequests();
                dailyRemaining = userLimitVO.getRemainingRequestsPerDay();
            }

            // 将数据库值初始化到 Redis 中
            totalRemainingCounter.set(totalRemaining);
            totalRemainingCounter.expire(7, TimeUnit.DAYS);
            dailyRemainingCounter.set(dailyRemaining);
            dailyRemainingCounter.expire(1, TimeUnit.DAYS);
        }

        // 配置每秒限流器
        RRateLimiter rateLimiter = redissonClient.getRateLimiter(Constants.SECOND_KEY_PREFIX + userId);
        rateLimiter.trySetRate(RateType.OVERALL, Constants.PER_SECOND_LIMIT, 1, RateIntervalUnit.SECONDS);

        // 检查每秒限流器
        if (!rateLimiter.tryAcquire()) {
            throw new BusinessException(ErrorCode.TOO_MANY_REQUEST);
        }

        // 检查总请求限流
        if (totalRemaining <= 0) {
            throw new BusinessException(ErrorCode.NO_AVAILABLE_REQUEST_TOTAL);
        }

        // 检查每日请求限流
        if (dailyRemaining <= 0) {
            throw new BusinessException(ErrorCode.NO_AVAILABLE_REQUEST_DAILY);
        }

        // 使用原子递减操作更新 Redis 中的剩余次数
        totalRemaining = totalRemainingCounter.decrementAndGet();
        dailyRemaining = dailyRemainingCounter.decrementAndGet();

        // 将用户 ID 和更新时间戳存储在一个 Redis 集合中，供批量更新使用
        redissonClient.getMap(updateFlagKey).put(userId.toString(), Instant.now().toEpochMilli());

        // 返回新的剩余请求次数
        return new UserLimitVO((int) totalRemaining, (int) dailyRemaining);
    }

}

