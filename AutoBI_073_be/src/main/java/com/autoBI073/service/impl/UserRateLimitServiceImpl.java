package com.autoBI073.service.impl;

import com.autoBI073.constant.Constants;
import com.autoBI073.model.vo.UserLimitVO;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.autoBI073.model.entity.UserRateLimit;
import com.autoBI073.service.UserRateLimitService;
import com.autoBI073.mapper.UserRateLimitMapper;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

/**
* @author lingyikong
* @description 针对表【user_rate_limit】的数据库操作Service实现
* @createDate 2024-11-10 13:50:43
*/
@Service
public class UserRateLimitServiceImpl extends ServiceImpl<UserRateLimitMapper, UserRateLimit>
    implements UserRateLimitService{

    @Resource
    private UserRateLimitMapper userRateLimitMapper;

    @Autowired
    private RedissonClient redissonClient;

    @Override
    public UserLimitVO getAvailableFromDB(long userId){
        UserLimitVO userLimitVO = new UserLimitVO();
        QueryWrapper<UserRateLimit> userRateLimitQueryWrapper = new QueryWrapper<>();
        userRateLimitQueryWrapper.eq("userId", userId);
        UserRateLimit userRateLimit = userRateLimitMapper.selectOne(userRateLimitQueryWrapper);
        userLimitVO.setTotalRemainingRequests(userRateLimit.getTotalRemainingRequests());
        userLimitVO.setRemainingRequestsPerDay(userRateLimit.getRemainingRequestsPerDay());
        return userLimitVO;
    }

    @Override
    public boolean addUserRateLimit(long userId){
        UserRateLimit userRateLimit = new UserRateLimit();
        userRateLimit.setUserId(userId);
        userRateLimit.setTotalRemainingRequests(Constants.TOTAL_REMAINING_REQUESTS);
        userRateLimit.setRemainingRequestsPerDay(Constants.DAILY_REMAINING_REQUESTS);
        return this.save(userRateLimit);
    }

    // 定时批量更新 Redis 中的限流数据到数据库
    @Scheduled(cron = "0 */10 * * * ?") // 每隔10分钟执行一次
    public void updateRateLimitInDatabase() {
        String updateFlagKey = Constants.UPDATE_FLAG_KEY_PREFIX;

        // 获取当前时间
        long currentTime = Instant.now().toEpochMilli();

        // 获取所有需要更新的用户 ID 和上次更新时间
        Map<Object, Object> rawUpdateMap = redissonClient.getMap(updateFlagKey).readAllMap();
        Map<String, Long> updateMap = rawUpdateMap.entrySet().stream()
                .collect(Collectors.toMap(
                        entry -> (String) entry.getKey(),
                        entry -> (Long) entry.getValue()
                ));

        // 过滤出符合批量更新条件的用户（例如，更新间隔超过10分钟的用户）
        Map<String, Long> usersToUpdate = updateMap.entrySet().stream()
                .filter(entry -> currentTime - entry.getValue() >= Constants.BATCH_UPDATE_INTERVAL)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        for (String userIdStr : usersToUpdate.keySet()) {
            Long userId = Long.valueOf(userIdStr);
            String totalKey = Constants.TOTAL_KEY_PREFIX + userId;
            String dailyKey = Constants.DAILY_KEY_PREFIX + userId;

            Long totalRemaining = redissonClient.getAtomicLong(totalKey).get();
            Long dailyRemaining = redissonClient.getAtomicLong(dailyKey).get();

            UserRateLimit userRateLimit = userRateLimitMapper.selectById(userId);
            if (userRateLimit == null) {
                userRateLimit = new UserRateLimit();
                userRateLimit.setUserId(userId);
                userRateLimit.setTotalRemainingRequests(totalRemaining.intValue());
                userRateLimit.setRemainingRequestsPerDay(dailyRemaining.intValue());
                userRateLimitMapper.insert(userRateLimit);
            } else {
                userRateLimit.setTotalRemainingRequests(totalRemaining.intValue());
                userRateLimit.setRemainingRequestsPerDay(dailyRemaining.intValue());
                userRateLimitMapper.updateById(userRateLimit);
            }

            // 从 update_flag 集合中移除已更新的用户 ID
            redissonClient.getMap(updateFlagKey).remove(userIdStr);
        }
    }

    // 每天凌晨 0 点重置所有用户的 dailyRemainingRequests
    @Scheduled(cron = "0 0 0 * * ?")
    public void resetDailyLimit() {
        Set<String> keys = new HashSet<>();
        redissonClient.getKeys().getKeysByPattern("rate_limit:daily:*").forEach(keys::add);

        for (String dailyKey : keys) {
            String totalKey = dailyKey.replace("daily", "total");
            long totalRemaining = redissonClient.getAtomicLong(totalKey).get();
            long newDailyLimit = (totalRemaining >= 50) ? 50 : totalRemaining;
            redissonClient.getAtomicLong(dailyKey).set(newDailyLimit);
        }
    }

    @Scheduled(cron = "0 0 0 * * ?") // 每天 0 点执行
    public void resetDailyLimitInDatabase() {
        // 将还未更新到数据库的用户总请求剩余次数更新入数据库
        String updateFlagKey = Constants.UPDATE_FLAG_KEY_PREFIX;
        Map<Object, Object> rawUpdateMap = redissonClient.getMap(updateFlagKey).readAllMap();
        Map<String, Long> updateMap = rawUpdateMap.entrySet().stream()
                .collect(Collectors.toMap(
                        entry -> (String) entry.getKey(),
                        entry -> (Long) entry.getValue()
                ));
        Map<String, Long> usersToUpdate = updateMap.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        for (String userIdStr : usersToUpdate.keySet()) {
            Long userId = Long.valueOf(userIdStr);
            String totalKey = Constants.TOTAL_KEY_PREFIX + userId;

            Long totalRemaining = redissonClient.getAtomicLong(totalKey).get();

            UserRateLimit userRateLimit = userRateLimitMapper.selectById(userId);
            if (userRateLimit == null) {
                userRateLimit = new UserRateLimit();
                userRateLimit.setUserId(userId);
                userRateLimit.setTotalRemainingRequests(totalRemaining.intValue());
                userRateLimitMapper.insert(userRateLimit);
            } else {
                userRateLimit.setTotalRemainingRequests(totalRemaining.intValue());
                userRateLimitMapper.updateById(userRateLimit);
            }

            redissonClient.getMap(updateFlagKey).remove(userIdStr);
        }
        // 更新每日限制次数
        userRateLimitMapper.resetDailyRemainingRequests(50);
        System.out.println("Database dailyRemainingRequests reset completed at " + LocalDateTime.now());
    }
}




