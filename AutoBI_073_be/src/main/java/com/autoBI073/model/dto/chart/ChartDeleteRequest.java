package com.autoBI073.model.dto.chart;

import lombok.Data;

@Data
public class ChartDeleteRequest {
    /**
     * id
     */
    private Long[] id;

    /**
     * 创建用户 id
     */
    private Long userId;

    private static final long serialVersionUID = 1L;
}
