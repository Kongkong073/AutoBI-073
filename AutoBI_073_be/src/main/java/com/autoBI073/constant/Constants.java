package com.autoBI073.model.entity;

import java.util.Arrays;
import java.util.List;

public class Constants {

    // 最大文件大小
    public final long ONE_MB = 1024 * 1024L;

    //上传文件类型
    public final List<String> validFileSuffixList = Arrays.asList("csv", "xls", "xlxs");
}
