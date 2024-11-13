package com.autoBI073.controller;

import com.autoBI073.common.BaseResponse;
import com.autoBI073.common.ErrorCode;
import com.autoBI073.common.ResultUtils;
import com.autoBI073.constant.Constants;
import com.autoBI073.exception.BusinessException;
import com.autoBI073.exception.ThrowUtils;
import com.autoBI073.manager.RedisLimiterManager;
import com.autoBI073.model.dto.userLImit.UserLimitQueryRequest;
import com.autoBI073.model.entity.User;
import com.autoBI073.model.entity.UserRateLimit;
import com.autoBI073.model.vo.UserLimitVO;
import com.autoBI073.service.UserRateLimitService;
import com.autoBI073.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RAtomicLong;
import org.redisson.api.RedissonClient;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;

/**
 * 限流接口
 */
@RestController
@RequestMapping("/user_rate_limit")
@Slf4j
public class UserRateLimitController {

    @Resource
    private UserRateLimitService userRateLimitService;

    @Resource
    private UserService userService;

    @Resource
    private RedisLimiterManager redisLimiterManager;

    @Resource
    private RedissonClient redissonClient;
    /**
     * 获取访问次数
     * @param request
     */

    @GetMapping("/show-available")
    public BaseResponse<UserLimitVO> showAvailableRequests(HttpServletRequest request) {
        User loginUser = userService.getLoginUser(request);
        if (loginUser == null) {
            return ResultUtils.error(ErrorCode.NOT_LOGIN_ERROR);
        }

        long userId = loginUser.getId();

        // 定义 Redis 键
        String totalKey = Constants.TOTAL_KEY_PREFIX + userId;
        String dailyKey = Constants.DAILY_KEY_PREFIX + userId;

        // 使用 RAtomicLong 来确保数据类型的一致性
        RAtomicLong totalRemainingCounter = redissonClient.getAtomicLong(totalKey);
        RAtomicLong dailyRemainingCounter = redissonClient.getAtomicLong(dailyKey);

        // 获取 Redis 中的限流信息
        long totalRemaining = totalRemainingCounter.get();
        long dailyRemaining = dailyRemainingCounter.get();

        // 如果 Redis 中没有值，从数据库加载并设置默认值
        if (totalRemaining == 0 && dailyRemaining == 0) {
            UserLimitVO userLimitVO = userRateLimitService.getAvailableFromDB(userId);

            if (userLimitVO == null) {
                totalRemaining = Constants.TOTAL_REMAINING_REQUESTS;
                dailyRemaining = Constants.DAILY_REMAINING_REQUESTS;
            } else {
                totalRemaining = userLimitVO.getTotalRemainingRequests();
                dailyRemaining = userLimitVO.getRemainingRequestsPerDay();
            }

            // 将数据库中的值初始化到 Redis 中
            totalRemainingCounter.set(totalRemaining);
            dailyRemainingCounter.set(dailyRemaining);
        }

        // 创建 UserLimitVO 并返回
        UserLimitVO userLimitVO = new UserLimitVO((int) totalRemaining, (int) dailyRemaining);
        return ResultUtils.success(userLimitVO);
    }

}