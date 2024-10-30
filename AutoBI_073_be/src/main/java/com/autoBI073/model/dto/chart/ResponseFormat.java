package com.autoBI073.model.dto.chart;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
public class ResponseFormat implements Serializable {

    @JsonProperty("type")
    private String type = "json_schema";
    @JsonProperty("json_schema")
    private JsonSchema jsonSchema;

    private static final long serialVersionUID = 1L;

    public ResponseFormat(JsonSchema jsonSchema) {
        this.jsonSchema = jsonSchema;
    }
}

