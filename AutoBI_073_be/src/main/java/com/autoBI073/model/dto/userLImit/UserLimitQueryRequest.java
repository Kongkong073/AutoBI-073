package com.autoBI073.model.dto.userLImit;

import com.autoBI073.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

@EqualsAndHashCode(callSuper = true)
@Data
public class UserLimitQueryRequest extends PageRequest implements Serializable {
    /**
     * 创建用户 id
     */
    private Long userId;

}
