package com.autoBI073.model.dto.chart;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
public class Message implements Serializable {

    private String role;
    private String content;


    public Message(@JsonProperty("role") String role, @JsonProperty("content") String content) {
        this.role = role;
        this.content = content;
    }

    private static final long serialVersionUID = 1L;
}
