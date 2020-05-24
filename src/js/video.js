var csVideo = {

    testChannelId: "UCxqxxgXZxSwLpPk6pCC_XJA",

    youtubeApiUrl: "https://www.googleapis.com/youtube/v3/",

    apiKey: "removedFromHereForSecurityReasons",

    videoModal: null,

    //all timing in minutes
    timing: {
        startingSoonLimit: -15,
        justStartedLimit: 5,
        inProgressLimit: 30,
        channelLiveRefresh: 30,
        videoDetailsRefresh: 30,
        scheduledStartDelayLimit: 60,
        noUpdateLimit: 2880 //two days
    },

    liveVideoCache: {},

    channelsToBeCached: { //in progress and soon starting live channel Ids
        live: [],
        upcoming: []
    },

    channelsPendingRefresh: 0, //gloabl counter for ajax

    videosToBeRefreshed: {},

    registerEvents: function () {

        csVideo.videoModal = $("#videoModal");

        $("body").on("click", "button.watchStream", csVideo.onWatch);
        $('#videoModal').on('hidden.bs.modal', csVideo.resetYoutubeModal)
    },

    getVideoType: function (videoUrl) {
        var hostname = csVideo.parseUrl(videoUrl).hostname;
        if (hostname.includes('youtube.com')) {
            return { type: "youtube", btn: "btn-outline-danger", icon: "fab fa-youtube" };
        }
        else if (hostname.includes('facebook.com')) {
            return { type: "facebook", btn: "btn-outline-primary", icon: "fab fa-facebook-square" };
        }
        else if (hostname.includes('instagram.com')) {
            return { type: "instagram", btn: "btn-outline-success", icon: "fab fa-instagram" };
        }
        else {
            return { type: "unknown", btn: "btn-outline-warning", icon: "fas fa-tv" };
        }
    },

    getScheduleStatusClass: function (scheduleTimeIst, videoType, videoUrl) {
        var mDif = csTimeZone.minutesDiffFromNow(scheduleTimeIst);
        var scheduleTimestamp = moment.tz(scheduleTimeIst, 'Asia/Kolkata').unix()
        var statusObj = {
            scheduleTimestamp: scheduleTimestamp
        };

        if (videoType === "youtube") {
            var channelId = csVideo.getYoutubeChannelId(videoUrl);
            if (mDif >= csVideo.timing.startingSoonLimit && mDif < 0) {
                // DISABLED fetching upcoming live for now due to Youtube API quota limitations
                // csVideo.channelsToBeCached.upcoming.push({ channelId: channelId, scheduleTime: scheduleTimestamp });
            }

            if (mDif >= 0 && mDif <= csVideo.timing.inProgressLimit) {
                csVideo.channelsToBeCached.live.push({ channelId: channelId, scheduleTime: scheduleTimestamp });
            }
        }

        if (mDif < csVideo.timing.startingSoonLimit) {
            $.extend(statusObj, { class: "upComing", title: null });
        }
        else if (mDif >= csVideo.timing.startingSoonLimit && mDif < 0) {
            $.extend(statusObj, { class: "startingSoon", title: `${Math.abs(mDif)} mins to go` });
        }
        else if (mDif >= 0 && mDif <= csVideo.timing.justStartedLimit) {
            $.extend(statusObj, { class: "justStarted", title: "just started" });
        }
        else if (mDif > csVideo.timing.justStartedLimit && mDif <= csVideo.timing.inProgressLimit) {
            $.extend(statusObj, { class: "inProgress", title: `${Math.abs(mDif)} mins ago` });
        }
        else {
            $.extend(statusObj, { class: "finishedOrLate", title: null });
        }

        return statusObj;
    },

    validateAndSaveVideosToBeRefreshed: function (cacheObj) {
        var streamId = cacheObj.channelKey.streamId;
        var updatedMinBefore = csTimeZone.minutesDiffFromNow(cacheObj.timestamp, 'utc');
        var scheduleStartMinBefore = cacheObj.scheduledStartTime ? csTimeZone.minutesDiffFromNow(cacheObj.scheduledStartTime, 'utc') : 0;
        var publishedMinBefore = cacheObj.publishedAt ? csTimeZone.minutesDiffFromNow(cacheObj.publishedAt, 'utc') : 0;

        /**
         * video has endtime
         * video not started one hour after scheduled time
         * video updated with refresh duration
         * video published and updated before 2 days and scheduleStart and actualStart are empty - possible invalid video
         */
        if (cacheObj.actualEndTime !== null
            || (cacheObj.actualStartTime === null && scheduleStartMinBefore > csVideo.timing.scheduledStartDelayLimit)
            || updatedMinBefore < csVideo.timing.videoDetailsRefresh
            || (cacheObj.scheduledStartTime === null && cacheObj.actualStartTime === null && updatedMinBefore > csVideo.timing.noUpdateLimit && publishedMinBefore > csVideo.timing.noUpdateLimit)) {
            if (csVideo.videosToBeRefreshed[streamId]) { // Refresh not needed or invalid video
                delete csVideo.videosToBeRefreshed[streamId];
            }
            // Valid and updated video need to added/updated to Video Gallery
            if (cacheObj.actualStartTime !== null && cacheObj.actualEndTime === null) {
                csGallery.validateAndVideoToGallery(cacheObj);
            }
        }
        else {
            csVideo.videosToBeRefreshed[streamId] = cacheObj;
        }
    },

    addToLiveCache: function (cacheObj) {
        var channelId = cacheObj.channelKey.channelId;
        var streamId = cacheObj.channelKey.streamId;

        if (typeof csVideo.liveVideoCache[channelId] === "undefined") {
            csVideo.liveVideoCache[channelId] = {};
        }

        if (streamId === 'metadata') {
            csVideo.liveVideoCache[channelId]["metadata"] = {
                title: cacheObj.title,
                timestamp: cacheObj.timestamp
            };
        } else {
            csVideo.liveVideoCache[channelId][streamId] = cacheObj;
            //save videoIds for fetching time details
            csVideo.validateAndSaveVideosToBeRefreshed(cacheObj);
        }
    },

    removeFromLiveCache: function (channelId, streamId) {
        if (csVideo.liveVideoCache[channelId] && csVideo.liveVideoCache[channelId][streamId]) {
            delete csVideo.liveVideoCache[channelId][streamId];
        }
    },

    /**
     * CHeck if we have valid cache entries for a channel at a scheduled time
     */
    isStreamCacheValid: function (channelId, scheduleTimestamp) {
        var scheduleTime = moment.unix(scheduleTimestamp);
        if (csVideo.liveVideoCache[channelId]) {
            var validStreams = [];
            var metadata = csVideo.liveVideoCache[channelId]['metadata'];
            for (var streamId in csVideo.liveVideoCache[channelId]) {
                var streamObj = csVideo.liveVideoCache[channelId][streamId];
                if (streamId !== 'metadata' && ['live', 'upcoming'].includes(streamObj.liveBroadcastContent)) {
                    var startValid = streamObj.scheduledStartTime ? moment.tz(streamObj.scheduledStartTime, 'Asia/Kolkata').isSameOrBefore(scheduleTime) : true;
                    var endValid = streamObj.scheduledEndTime ? moment.tz(streamObj.scheduledEndTime, 'Asia/Kolkata').isAfter(scheduleTime) : true;
                    if (startValid && endValid) {
                        validStreams.push(streamObj);
                    }
                }
            }

            if (validStreams.length) {
                return validStreams;
            }
            else if (!metadata) {
                console.log("Error: missing metadata");
                return true; //assume as cache valid to avoid repeated Youtube API calls
            }
            else if (metadata && moment.tz(metadata.timestamp, 'Asia/Kolkata').isAfter(scheduleTime)) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    },

    getStreamIdFromLiveCache: function (channelId) {
        if (csVideo.liveVideoCache[channelId]) {
            for (var streamId in csVideo.liveVideoCache[channelId]) {
                console.log(streamId);
                //need changes here based on the start/end time once available
                if (streamId !== "metadata") {
                    return streamId;
                }
            }
        }
        return null;
    },

    getLiveStreamCache: function () {
        $.get(csService.url + `/liveStreamCache`, function (data) {
            if (data.channels) {
                csVideo.validateAndSaveStreams(data.channels);
            }
            else {
                console.log("No live stream cache found!");
            }
        })
            .fail(function () {
                console.log('failed to get live stream cache!');
            });
    },

    refreshLiveStream: function (channelId, eventType) {
        return $.get(csService.url + `/liveStreamRefresh/${channelId}/${eventType}`);
    },

    refreshVideoDetails: function (videoIds) {
        $.ajax({
            method: "POST",
            url: csService.url + `/refreshVideoDetails`,
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify({ id: videoIds })
        })
            .done(function (data) {
                console.log("video refresh success: " + data);
            })
            .fail(function () {
                console.log("video refresh failed: " + data);
            });
    },

    processChannelIdsToBeCached: function () {
        for (const eventType in csVideo.channelsToBeCached) {
            csVideo.channelsPendingRefresh += (csVideo.channelsToBeCached[eventType].length || 0);
            $.each(csVideo.channelsToBeCached[eventType], function (index, obj) {
                if (csVideo.isStreamCacheValid(obj.channelId, obj.scheduleTime)) {
                    console.log("Live video cache already upto date for " + obj.channelId);
                    obj.status = "cached";
                    --csVideo.channelsPendingRefresh;
                }
                else {
                    csVideo.refreshLiveStream(obj.channelId, eventType)
                        .done(function (data) {
                            csVideo.validateAndSaveStreams(data.channels);
                            obj.status = "refreshed";
                        })
                        .fail(function () {
                            console.log("Cache refresh failed for " + obj.channelId);
                            obj.status = "failed";
                        })
                        .always(function () {
                            --csVideo.channelsPendingRefresh;
                            if (csVideo.channelsPendingRefresh === 0) { //checking when every api call completes
                                console.log("Processing videos to be refreshed...");
                                csVideo.processVideoDetailsRefresh();
                            }
                        });
                }
            });
        }

        if (csVideo.channelsPendingRefresh === 0) { //checking after the looping - for no service calls and no channels.
            console.log("Processing videos to be refreshed...");
            csVideo.processVideoDetailsRefresh();
        }
    },

    processVideoDetailsRefresh: function () {
        var videoIdArr = Object.keys(csVideo.videosToBeRefreshed);
        if (videoIdArr.length) {
            var videoIds = videoIdArr.join(",");
            console.log("videoIds: " + videoIds);
            csVideo.refreshVideoDetails(videoIds);
        }
    },

    validateAndSaveStreams: function (data) {
        //sort cache such that 'metadata' records comes first
        // this is fix channelTitle missing issue while loading video gallery
        data.sort(function (a, b) {
            var aStream = a.channelKey.streamId;
            var bStream = a.channelKey.streamId;
            var comparison = 0;

            if (aStream === 'metadata') {
                comparison = -1;
            }
            else if (bStream === 'metadata') {
                comparison = 1;
            }
            return comparison;
        });

        $.each(data, function (index, cache) {
            if (['live', 'upcoming'].includes(cache.liveBroadcastContent)
                || cache.channelKey.streamId === 'metadata') {
                csVideo.addToLiveCache(cache);
            }
            else {
                csVideo.removeFromLiveCache(cache.channelKey.channelId, cache.channelKey.streamId);
            }
        });
    },

    parseUrl: function (url) {
        var anchor = document.createElement("a");
        anchor.href = url;
        return anchor;
    },

    /**
     * Understand your channel URLs: https://support.google.com/youtube/answer/6180214?hl=en
     * Channel ID vs Name: https://stackoverflow.com/questions/27974296/how-to-tell-the-difference-between-a-channel-id-and-youtube-username
     */
    getYoutubeChannelId: function (videoUrl) {
        var path = csVideo.parseUrl(videoUrl).pathname;
        var urlId = path.substr(path.lastIndexOf('/') + 1);
        if (urlId.match(/^(UC|HC)[A-Za-z0-9_\-]+$/i)) {
            return urlId;
        }
        else {
            console.log("Invalid Channel Id: ", urlId);
            return null;
        }
    },

    // Deprecated in favour of server api
    getYoutubeLiveStreamUrl: function (videoUrl, success, fail) {
        var channelId = csVideo.getYoutubeChannelId(videoUrl);
        if (channelId) {
            console.log("Detected Channel Id: " + channelId);
            var apiUrl = `${csVideo.youtubeApiUrl}search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=${csVideo.apiKey}`;
            $.get(apiUrl, function (json) {
                if (json.items.length) {
                    var videoId = json.items[0].id.videoId;
                    console.log("Live Video Id: ", videoUrl);
                    var liveStreamUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
                    csVideo.loadLiveStream(liveStreamUrl)
                }
                else {
                    csVideo.showChannelBtn(videoUrl);
                }
            })
                .fail(function (json) {
                    console.log("API call failed: ", json);
                    csVideo.showChannelBtn(videoUrl);
                });
        }
        else {
            csVideo.showChannelBtn(videoUrl);
        }

    },

    showYoutubeLive: function (videoId) {
        var liveStreamUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
        csVideo.loadLiveStream(liveStreamUrl)
    },

    refreshYoutubeLive: function (videoUrl, channelId, scheduleTimestamp) {
        csVideo.refreshLiveStream(channelId, "live")
            .done(function (data) {
                csVideo.validateAndSaveStreams(data.channels);
                csVideo.checkYoutubeLive(videoUrl, channelId, scheduleTimestamp, true);
            })
            .fail(function () {
                console.log('failed to get refresh stream!');
                csVideo.showChannelBtn(videoUrl);
            });
    },

    checkYoutubeLive: function (videoUrl, channelId, scheduleTimestamp, refreshed) {
        var cacheStreamsValid = csVideo.isStreamCacheValid(channelId, scheduleTimestamp);
        if (cacheStreamsValid) {
            if (typeof cacheStreamsValid === "boolean") {
                console.log("cache valid but no streams");
                csVideo.showChannelBtn(videoUrl);
            } else {
                console.log("cache valid and have streams");
                console.log(cacheStreamsValid);
                // todo: May need better logic here if we have multiple Live within the schedule
                var streamObj = cacheStreamsValid[0];
                if (streamObj.embeddable) {
                    var cacheStreamId = streamObj.channelKey.streamId;
                    csVideo.showYoutubeLive(cacheStreamId);
                }
                else {
                    console.log("Live Embedding permission denied!!");
                    csVideo.showChannelBtn(videoUrl);
                }
            }
        }
        else if (refreshed) {
            console.log("Live not found after Refresh!!!");
            csVideo.showChannelBtn(videoUrl);
        }
        else {
            console.log("REFRESHING Data.....!!!!");
            csVideo.refreshYoutubeLive(videoUrl, channelId, scheduleTimestamp);
        }
    },

    isYoutubeVideo: function (videoUrl) {
        return csVideo.parseUrl(videoUrl).hostname.includes('youtube.com')
    },

    onWatch: function ($e) {
        var videoUrl = $(this).attr("data-video-url");
        var videoTitle = $(this).attr("data-video-title");
        var videoType = $(this).attr("data-video-type");
        var videoStatus = $(this).attr("data-video-status");
        var timestamp = $(this).attr("data-video-time");
        if (videoType === "youtube" && videoStatus === "LIVE") {
            csVideo.openYoutubeModal(videoUrl, videoTitle);
            var channelId = csVideo.getYoutubeChannelId(videoUrl);
            if (channelId) {
                csVideo.checkYoutubeLive(videoUrl, channelId, timestamp, false);
            }
            else {
                csVideo.showChannelBtn(videoUrl);
            }
        }
        else {
            window.open(videoUrl, "_blank");
        }
    },

    loadLiveStream: function (liveStreamUrl) {
        $("#videoSpinner").fadeOut(700, function () {
            $("#videoModal .modal-content").addClass('darkMode');
            $("#videoModal .modal-body").append(`
                <iframe id="ytPlayer" src="${liveStreamUrl}" type="text/html" frameborder="0" allowfullscreen>
            `);
        });
    },

    showChannelBtn: function (videoUrl) {
        $("#videoSpinner").fadeOut(700, function () {
            $("#videoModal #visitChannel").fadeIn(700);
        });
    },

    resetYoutubeModal: function () {
        $("#videoSpinner").removeAttr("style");
        $("#videoModal #ytPlayer").remove();
        $("#videoModal .modal-content").removeClass('darkMode');
        $("#videoModal #visitChannel").hide();
        $("#videoModal #visitChannelName").text('');
        $("#videoModal #visitChannelLink").removeAttr('href');
    },

    openYoutubeModal: function (url, title) {
        //url and title not required when opened on Video Gallery click
        if (typeof title !== 'undefined') {
            $("#videoModal #visitChannelName").text(title);
        }
        if (typeof url !== "undefined") {
            $("#videoModal #visitChannelLink").attr('href', url);
        }
        $("#videoModal #visitChannel").hide();
        csVideo.videoModal.modal("show");
        //csVideo.getYoutubeLiveStreamUrl(url);
    }
};