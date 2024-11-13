package com.autoBI073.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * 
 * @TableName user_rate_limit
 */
@TableName(value ="user_rate_limit")
@Data
public class UserRateLimit implements Serializable {
    /**
     * id
     */
    @TableId
    private Long userId;

    /**
     * 总共剩余请求数量
     */
    private Integer totalRemainingRequests;

    /**
     * 每天剩余数量
     */
    private Integer remainingRequestsPerDay;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}