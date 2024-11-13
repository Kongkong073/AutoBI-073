package com.autoBI073.model.dto.chart;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
public class ChatResponse implements Serializable {

    private List<Choice> choices;
    private static final long serialVersionUID = 1L;

    @Data
    @NoArgsConstructor
    public static class Choice {

        private int index;
        private Message message;

    }
}

