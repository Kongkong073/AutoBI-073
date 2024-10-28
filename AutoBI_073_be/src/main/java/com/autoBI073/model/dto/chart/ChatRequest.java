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
    @JsonProperty("max_tokens")
    private int n = 150;
    @JsonProperty("temperature")
    private double temperature = 0.7;

    private static final long serialVersionUID = 1L;

    public ChatRequest(String model, String prompt) {
        this.model = model;

        this.messages = new ArrayList<>();
        this.messages.add(new Message("user", prompt));
    }

    // getters and setters
}
