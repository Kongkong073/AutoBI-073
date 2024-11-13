package com.autoBI073.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserLimitVO {

    // 总共剩余数量
    private int totalRemainingRequests;

    //每天剩余数量
    private int remainingRequestsPerDay;


}
