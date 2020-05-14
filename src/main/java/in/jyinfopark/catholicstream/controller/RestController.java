package in.jyinfopark.catholicstream.controller;

import com.google.gson.Gson;
import in.jyinfopark.catholicstream.dto.*;
import in.jyinfopark.catholicstream.entity.Channel;
import in.jyinfopark.catholicstream.entity.Day;
import in.jyinfopark.catholicstream.entity.Mass;
import in.jyinfopark.catholicstream.repo.ChannelRepo;
import in.jyinfopark.catholicstream.repo.DaysRepo;
import in.jyinfopark.catholicstream.repo.MassRepo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@org.springframework.web.bind.annotation.RestController
public class RestController {

    @Autowired
    private MassRepo massRepo;

    @Autowired
    private DaysRepo daysRepo;

    @Autowired
    private ChannelRepo channelRepo;

    List<String> normalDays = Arrays.asList("sun", "mon", "tue", "wed", "thu", "fri", "sat");

    @GetMapping("/clear")
    @CacheEvict(value = "language", allEntries = true)
    public String clearCache() {
        return "success";

    }

    @GetMapping("/getLanguages")
    public List<String> getLanguages() {
        return massRepo.getLanguages();

    }

    @GetMapping("/getDays")
    public List<Day> getAllDays() {
        return daysRepo.getAllActive();
    }

    @GetMapping("/getDayLang")
    public DayLang getDayLang() {
        DayLang dayLang = new DayLang();
        dayLang.setLangs(massRepo.getLanguages());
        dayLang.setDays(daysRepo.getAllActive());
        return dayLang;
    }

    @GetMapping("/getSchedule/{language}/{day}")
    public List<Mass> getSchedule(@PathVariable String language, @PathVariable String day) {
        List<Mass> massList = massRepo.findAllByLanguageEquals(language, day);
        massList.removeIf(e -> e.getTime() == null);
        massList.removeIf(e -> !normalDays.contains(day) && e.getDay().equalsIgnoreCase("Everyday"));
        for (Mass mass : massList) {
            if (null != mass.getTime()) {
                try {
                    mass.setPrettyTime(mass.getTime().toLocalTime().format(DateTimeFormatter.ofPattern("hh:mm a")));
                } catch (Exception e) {
                    e.printStackTrace();
                    mass.setPrettyTime("N/A");
                }
            } else {
                mass.setPrettyTime("N/A");
            }
        }
        return massList;
    }

    @GetMapping("/getAll")

    public List<Mass> getAll() {
        List<Mass> massList = massRepo.getAll();
        massList.removeIf(e -> e.getTime() == null);
        for (Mass mass : massList) {
            if (null != mass.getTime()) {
                try {
                    mass.setPrettyTime(mass.getTime().toLocalTime().format(DateTimeFormatter.ofPattern("hh:mm a")));
                } catch (Exception e) {
                    mass.setPrettyTime("N/A");
                }
            } else {
                mass.setPrettyTime("N/A");
            }
        }
        return massList;

    }

    @GetMapping("/liveStreamRefresh/{channelId}/{eventType}")
    public CacheResponse getLive(@PathVariable String channelId, @PathVariable String eventType, @RequestParam(name = "publishedAfter", required = false) String dateTime) {
        List<Channel> channelList = new ArrayList();
        CacheResponse cacheResponse = new CacheResponse();
        cacheResponse.setRequestTimeStamp(LocalDateTime.now());
        String uri = "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=" + channelId + "&type=video&eventType=" + eventType + "&key=AIzaSyAvcxy7qbSPvZhVn8ueAqM_oMijj08SAmY&maxResults=10&order=date";
        if (null != dateTime) {
            uri = uri + "&publishedAfter=" + dateTime;
        }
        Channel refreshChannel = channelRepo.getChannelByIdAndStreamId(channelId, "metadata");
        if (null == refreshChannel) {
            refreshChannel = new Channel();
            refreshChannel.setChannelId(channelId);
            refreshChannel.setStreamId("metadata");
        }



        RestTemplate restTemplate = new RestTemplate();
        String result = restTemplate.getForObject(uri, String.class);
        try {
            Youtube youtube = new Gson().fromJson(result, Youtube.class);
            for (Item e : youtube.getItems()) {
                Channel channel = channelRepo.getChannelByIdAndStreamId(channelId, e.getId().getVideoId());
                if (null == channel) {
                    channel = new Channel();
                    channel.setChannelId(channelId);
                    channel.setStreamId(e.getId().getVideoId());
                }
                refreshChannel.setTitle(e.getSnippet().getChannelTitle());
                refreshChannel.setTimestamp(LocalDateTime.now());
                channelRepo.save(refreshChannel);
                channel.setTitle(e.getSnippet().getTitle());
                channel.setThumbnail(e.getSnippet().getThumbnails().getMedium().getUrl());
                if (!StringUtils.isEmpty(e.getSnippet().getPublishedAt())) {
                    channel.setPublishedAt(LocalDateTime.parse(e.getSnippet().getPublishedAt().replace("Z", "")));
                }
                channel.setLiveBroadcastContent(e.getSnippet().getLiveBroadcastContent());
                channel.setTimestamp(LocalDateTime.now());
                if ("live".equalsIgnoreCase(channel.getLiveBroadcastContent()) || "upcoming".equalsIgnoreCase(channel.getLiveBroadcastContent())) {
                    channelRepo.save(channel);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        channelRepo.findAll().stream().filter(e->!"none".equalsIgnoreCase(e.getLiveBroadcastContent())||"metadata".equalsIgnoreCase(e.getStreamId()));
        cacheResponse.setChannels(channelList);

        return cacheResponse;
    }

    @GetMapping("/liveStreamCache")
    public CacheResponse getAllChannels() {
        LocalDateTime requestTimeStamp = LocalDateTime.now();
        CacheResponse cacheResponse = new CacheResponse();
        cacheResponse.setRequestTimeStamp(requestTimeStamp);
        List<Channel> channelList=channelRepo.findAll();
        List<Channel> channels = channelList
                .stream()
                .filter(Objects::nonNull)
                .filter(e -> (null != e.getLiveBroadcastContent() && !e.getLiveBroadcastContent().equalsIgnoreCase("none"))||e.getStreamId().equalsIgnoreCase("metadata"))
                .filter(e -> (e.getScheduledEndTime() == null || e.getScheduledEndTime().isAfter(requestTimeStamp))
                        || (e.getActualEndTime() == null || e.getActualEndTime().isAfter(requestTimeStamp)))
                .collect(Collectors.toList());
        cacheResponse.setChannels(channels);
        return cacheResponse;
    }

    @PostMapping("/liveStreamCache")
    public Channel updatetable(@RequestBody Channel channel) {
        LocalDateTime today = LocalDateTime.now();
        channel.setTimestamp(today);
        return channelRepo.save(channel);
    }

    @PostMapping("/refreshVideoDetails")
    public CacheResponse refresh(@RequestBody PostRequest postRequest) {
        List<Channel> channels = new ArrayList<>();
        CacheResponse cacheResponse = new CacheResponse();
        cacheResponse.setRequestTimeStamp(LocalDateTime.now());
        String url = "https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=" + postRequest.getId() + "&key=AIzaSyAvcxy7qbSPvZhVn8ueAqM_oMijj08SAmY";
        RestTemplate restTemplate = new RestTemplate();
        String result = restTemplate.getForObject(url, String.class);
        try {
            YoutubeV2 youtube = new Gson().fromJson(result, YoutubeV2.class);
            for (ItemV2 item : youtube.getItems()) {
                Channel channel = channelRepo.getChannelByIdAndStreamId(item.getSnippet().getChannelId(), item.getId());
                if (null == channel) {
                    channel = new Channel();
                    channel.setChannelId(item.getSnippet().getChannelId());
                    channel.setStreamId(item.getId());
                }
                if (!StringUtils.isEmpty(item.getSnippet().getPublishedAt())) {
                    channel.setPublishedAt(LocalDateTime.parse(item.getSnippet().getPublishedAt().replace("Z", "")));
                }
                channel.setLiveBroadcastContent(item.getSnippet().getLiveBroadcastContent());
                Channel finalChannel = channel;
                if(null==item.getLiveStreamingDetails().getActualStartTime()){
                    finalChannel.setActualStartTime(null);
                }else {
                    finalChannel.setActualStartTime(LocalDateTime.parse(item.getLiveStreamingDetails().getActualStartTime().replace("Z", "")));
                }

                if(null==item.getLiveStreamingDetails().getActualEndTime()){
                    finalChannel.setActualEndTime(null);
                }else {
                    finalChannel.setActualEndTime(LocalDateTime.parse(item.getLiveStreamingDetails().getActualEndTime().replace("Z", "")));
                }

                if(null==item.getLiveStreamingDetails().getScheduledEndTime()){
                    finalChannel.setScheduledEndTime(null);
                }else {
                    finalChannel.setScheduledEndTime(LocalDateTime.parse(item.getLiveStreamingDetails().getScheduledEndTime().replace("Z", "")));
                }

                if(null==item.getLiveStreamingDetails().getScheduledStartTime()){
                    finalChannel.setScheduledStartTime(null);
                }else {
                    finalChannel.setScheduledStartTime(LocalDateTime.parse(item.getLiveStreamingDetails().getScheduledStartTime().replace("Z", "")));
                }

                finalChannel.setTimestamp(LocalDateTime.now());
                finalChannel.setTitle(item.getSnippet().getTitle());
                finalChannel.setThumbnail(item.getSnippet().getThumbnails().getMedium().getUrl());
                channelRepo.save(finalChannel);
                channels.add(finalChannel);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        cacheResponse.setChannels(channels);
        return cacheResponse;
    }

}
