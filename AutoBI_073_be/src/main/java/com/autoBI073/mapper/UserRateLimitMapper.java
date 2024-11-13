package com.autoBI073.mapper;

import com.autoBI073.model.entity.UserRateLimit;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;

/**
* @author lingyikong
* @description 针对表【user_rate_limit】的数据库操作Mapper
* @createDate 2024-11-10 13:50:43
* @Entity com.autoBI073.model.entity.UserRateLimit
*/
public interface UserRateLimitMapper extends BaseMapper<UserRateLimit> {
    void resetDailyRemainingRequests(int dailyLimit);
}




