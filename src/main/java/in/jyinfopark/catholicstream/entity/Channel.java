package in.jyinfopark.catholicstream.entity;

import javax.persistence.*;
import java.sql.Timestamp;
import java.time.ZonedDateTime;
import java.util.Date;

@Entity
public class Channel {


    @Id
    @Column(name = "channel_id")
    private String channelId;

    @Column(name = "stream_id")
    private String streamId;

    @Column(name = "last_updated")
    private ZonedDateTime timestamp;



    public String getChannelId() {
        return channelId;
    }

    public void setChannelId(String channelId) {
        this.channelId = channelId;
    }

    public String getStreamId() {
        return streamId;
    }

    public void setStreamId(String streamId) {
        this.streamId = streamId;
    }

    public ZonedDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(ZonedDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
