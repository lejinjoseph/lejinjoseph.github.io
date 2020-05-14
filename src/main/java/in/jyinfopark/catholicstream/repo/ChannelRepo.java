package in.jyinfopark.catholicstream.repo;

import in.jyinfopark.catholicstream.entity.Channel;
import in.jyinfopark.catholicstream.entity.Day;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface ChannelRepo extends CrudRepository<Channel,Integer> {
    List<Channel> findAll();

    @Query(value = "select * from channel where channel_id=?1 and stream_id=?2",nativeQuery = true)
    Channel getChannelByIdAndStreamId(String channelId,String streamId);


}
