package com.autoBI073.constant;

import java.util.Arrays;
import java.util.List;

public class Constants {

    // 最大文件大小
    public static final long ONE_MB = 1024 * 1024L;

    //上传文件类型
    public static final List<String> validFileSuffixList = Arrays.asList("csv", "xls", "xlxs");

    //总共AI访问次数限制
    public static final int TOTAL_REMAINING_REQUESTS = 200;

    //每日AI访问次数限制
    public static final int DAILY_REMAINING_REQUESTS = 50;

    //每秒AI访问次数限制
    public static final int PER_SECOND_LIMIT = 1;

    //每10分钟更新限流信息
    public static final long BATCH_UPDATE_INTERVAL = 10 * 60 * 1000;

    public static final String TOTAL_KEY_PREFIX = "rate_limit:total:";

    public static final String DAILY_KEY_PREFIX = "rate_limit:daily:";

    public static final String SECOND_KEY_PREFIX = "rate_limit:second:";

    public static final String UPDATE_FLAG_KEY_PREFIX = "rate_limit:update_flag";

}
