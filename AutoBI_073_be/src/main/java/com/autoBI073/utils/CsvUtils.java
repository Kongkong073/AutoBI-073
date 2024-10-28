package com.autoBI073.utils;

import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class CsvUtils {

    /**
     * 将CSV格式的MultipartFile转换为String
     *
     * @param file 用户上传的CSV文件
     * @return 文件内容作为字符串
     * @throws IOException 如果文件读取失败
     */
    public static String convertCsvToString(MultipartFile file) throws IOException {
        StringBuilder content = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
        }

        return content.toString();
    }
}

