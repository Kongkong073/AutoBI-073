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


//    public Message(@JsonProperty("role") String role, @JsonProperty("content") String content) {
//        this.role = role;
//        this.content = content;
//    }

    public Message(@JsonProperty("role") String role, @JsonProperty("content") String content) {
        this.role = role;
        this.content = content;

    }

//    public String getAnalysis(){
//        return getContent().split("\\\"eChartCode\\\"")[0];
//    }
//
//    public String getEchartCode(){
//        return getContent().split("\\\"eChartCode\\\"")[1];
//    }


    private static final long serialVersionUID = 1L;
}
