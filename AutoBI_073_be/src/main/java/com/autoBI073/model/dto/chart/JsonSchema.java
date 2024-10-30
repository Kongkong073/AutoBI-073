package com.autoBI073.model.dto.chart;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class JsonSchema implements Serializable {
    @JsonProperty("strict")
    private boolean strict = true;

    @JsonProperty("name")
    private String name;

    // 新增 schema 字段，定义整个结构
    @JsonProperty("schema")
    private Schema schema = new Schema();

    private static final long serialVersionUID = 1L;

    public JsonSchema(String name) {
        this.name = name;
    }

    @Data
    public static class Schema {
        @JsonProperty("type")
        private String type = "object";

        @JsonProperty("properties")
        private Properties properties = new Properties();

        @JsonProperty("required")
        List<String> required = new ArrayList<>();

        @JsonProperty("additionalProperties")
        private Boolean additionalProperties = false;

        public Schema() {
            required.add("analysisResult");
            required.add("JsEChartCode");
            required.add("JsonEChartCode");
        }
    }
    @Data
    public static class Properties {
        @JsonProperty("analysisResult")
        private Type analysisResult = new Type("string");
        @JsonProperty("JsEChartCode")
        private Type JsEChartCode = new Type("string");
        @JsonProperty("JsonEChartCode")
        private Type JsonEChartCode = new Type("string");
    }

    @Data
    public static class Type {
        @JsonProperty("type")
        private String type;

        public Type(String type) {
            this.type = type;
        }
    }
}