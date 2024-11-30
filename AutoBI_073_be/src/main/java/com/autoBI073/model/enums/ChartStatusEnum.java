package com.autoBI073.model.enums;

/**
 * Enum representing the status of a chart.
 */
public enum ChartStatusEnum {
    WAITING("WAITING", "Waiting for execution"),
    RUNNING("RUNNING","Currently running"),
    SUCCEED("SUCCEED","Execution succeeded"),
    FAILED("FAILED","Execution failed");

    private final String code;
    private final String description;

    ChartStatusEnum(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public String getCode() {
        return code;
    }

    /**
     * Gets the enum value corresponding to a given status string.
     *
     * @param status the status string
     * @return the corresponding ChartStatusEnum, or null if no match is found
     */
    public static ChartStatusEnum fromString(String status) {
        for (ChartStatusEnum chartStatus : ChartStatusEnum.values()) {
            if (chartStatus.name().equalsIgnoreCase(status)) {
                return chartStatus;
            }
        }
        return null;
    }
}