package in.jyinfopark.catholicstream.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonPropertyOrder({
        "actualStartTime",
        "actualEndTime",
        "scheduledStartTime",
        "scheduledEndTime"
})
public class LiveStreamingDetails {
    @JsonProperty("actualStartTime")
    private String actualStartTime;
    @JsonProperty("actualEndTime")
    private String actualEndTime;
    @JsonProperty("scheduledStartTime")
    private String scheduledStartTime;
    @JsonProperty("scheduledEndTime")
    private String scheduledEndTime;

    @JsonProperty("actualStartTime")
    public String getActualStartTime() {
        return actualStartTime;
    }

    @JsonProperty("actualStartTime")
    public void setActualStartTime(String actualStartTime) {
        this.actualStartTime = actualStartTime;
    }

    @JsonProperty("actualEndTime")
    public String getActualEndTime() {
        return actualEndTime;
    }

    @JsonProperty("actualEndTime")
    public void setActualEndTime(String actualEndTime) {
        this.actualEndTime = actualEndTime;
    }

    @JsonProperty("scheduledStartTime")
    public String getScheduledStartTime() {
        return scheduledStartTime;
    }

    @JsonProperty("scheduledStartTime")
    public void setScheduledStartTime(String scheduledStartTime) {
        this.scheduledStartTime = scheduledStartTime;
    }

    @JsonProperty("scheduledEndTime")
    public String getScheduledEndTime() {
        return scheduledEndTime;
    }

    @JsonProperty("scheduledEndTime")
    public void setScheduledEndTime(String scheduledEndTime) {
        this.scheduledEndTime = scheduledEndTime;
    }
}
