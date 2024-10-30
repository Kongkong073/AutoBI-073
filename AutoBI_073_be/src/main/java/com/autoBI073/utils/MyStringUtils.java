package com.autoBI073.utils;

import cn.hutool.core.util.StrUtil;

public class MyStringUtils {

    /**
     * 将字符串从指定分隔符处分割成两部分，第二部分包含分隔符
     *
     * @param originalString 原始字符串
     * @param delimiter1 第一个分隔符
     * @param delimiter2 第二个分隔符
     * @return 包含两个部分的字符串数组，如果未找到分隔符，则返回仅包含原始字符串的数组
     */
    public static String[] splitWithDelimiter(String originalString, String delimiter1, String delimiter2) {
        if (originalString.startsWith("{") && originalString.endsWith("}")) {
            originalString = originalString.substring(1, originalString.length() - 1);
        }
        int index1 = StrUtil.indexOf(originalString, delimiter1, 0, false);
        int index2 = StrUtil.indexOf(originalString, delimiter2, index1, false);

        if (index1 != -1 && index2 != -1) {
            String part1 = StrUtil.sub(originalString, 0, index1); // part1
            String part2 = StrUtil.sub(originalString, index1, index2); // part2
            String part3 = StrUtil.sub(originalString, index2, originalString.length()); // part3
            return new String[]{part1, part2, part3};
        } else {
            return new String[]{originalString}; // 未找到分隔符时返回原字符串
        }
    }

    public static String extractContent(String input) {
        // 找到第一个冒号的位置
        int colonIndex = input.indexOf(":");

        if (colonIndex == -1) {
            // 如果没有冒号，返回空字符串
            return "";
        }

        // 提取冒号之后的字符串
        String content = input.substring(colonIndex + 1).trim();

        // 如果字符串以逗号结尾，去掉最后一个逗号
        if (content.endsWith(",")) {
            content = content.substring(0, content.length() - 1).trim();
        }

        return content;
    }


}
