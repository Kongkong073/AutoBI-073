package com.autoBI073.model.dto.chart;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class ChatResponse implements Serializable {

    private List<Choice> choices;

    private static final long serialVersionUID = 1L;

    // constructors, getters and setters

    @Data
    public static class Choice {

        private int index;
        private Message message;

        // constructors, getters and setters
    }
}

