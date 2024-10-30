package com.autoBI073.model.dto.chart;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
public class ChatRequest implements Serializable {

    private String model;
    private List<Message> messages;
    @JsonProperty("max_completion_tokens")
    private int max_completion_tokens = 800;
    @JsonProperty("temperature")
    private double temperature = 0.7;
    @JsonProperty("response_format")
    private ResponseFormat responseFormat;

    private static final long serialVersionUID = 1L;

    public ChatRequest(String model, String prompt) {
        this.model = model;

        this.messages = new ArrayList<>();
        this.messages.add(new Message("system", "你是一个数据分析师，Echarts大师。接下来我会给你我的分析目标，目标图表类型和原始数据。" +
                "请帮生成分析结果，并生成指定图表类型的可以运行的Echarts JS代码（只包含option中内容）和可以在React前端显示的Json代码。"));
        this.messages.add(new Message("user", prompt));
        this.responseFormat = new ResponseFormat(new JsonSchema("AnalysisSchema"));
    }

    // getters and setters
}
