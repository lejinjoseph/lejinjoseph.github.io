package in.jyinfopark.catholicstream.dto;

import in.jyinfopark.catholicstream.entity.Channel;

import java.time.LocalDateTime;
import java.util.List;

public class CacheResponse {
    private List<Channel> channels;

    private LocalDateTime requestTimeStamp;

    public List<Channel> getChannels() {
        return channels;
    }

    public void setChannels(List<Channel> channels) {
        this.channels = channels;
    }

    public LocalDateTime getRequestTimeStamp() {
        return requestTimeStamp;
    }

    public void setRequestTimeStamp(LocalDateTime requestTimeStamp) {
        this.requestTimeStamp = requestTimeStamp;
    }
}
