package com.autoBI073.service;

import com.autoBI073.model.entity.Post;
import com.autoBI073.model.entity.UserRateLimit;
import com.autoBI073.model.vo.PostVO;
import com.autoBI073.model.vo.UserLimitVO;
import com.baomidou.mybatisplus.extension.service.IService;

import javax.servlet.http.HttpServletRequest;

/**
* @author lingyikong
* @description 针对表【user_rate_limit】的数据库操作Service
* @createDate 2024-11-10 13:50:43
*/
public interface UserRateLimitService extends IService<UserRateLimit> {

    /**
     * 获取用户请求次数
     *
     * @param userId
     * @return
     */
    UserLimitVO getAvailableFromDB(long userId);

    /**
     * 添加用户流量限制
     *
     * @param userId
     * @return
     */
    boolean addUserRateLimit(long userId);

    /**
     * 每小时将redis中限流数据保存到数据库
     */
    public void updateRateLimitInDatabase();

    /**
     * 每天凌晨 0 点重置所有用户的 dailyRemainingRequests
     */
    public void resetDailyLimit();



}
