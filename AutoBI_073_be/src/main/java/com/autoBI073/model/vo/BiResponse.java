package com.autoBI073.model.vo;

import lombok.Data;

/**
 * Bi 的返回结果
 */
@Data
public class BiResponse {

//    private String genChart;

    private String genResult;

    private String genJsEchartCode;

    private Long chartId;

    public String toString(){
        return  "genResult: " + getGenResult() + "\n"+
                "genJsEchartCode: " + getGenJsEchartCode()+ "\n";
//                + "genJsonChart: " + getGenChart();
    }
}
