jQuery(document).ready(function ($) {
    csVideo.registerEvents();
});

var csVideo = {

    testChannelId: "UCxqxxgXZxSwLpPk6pCC_XJA",

    youtubeApiUrl: "https://www.googleapis.com/youtube/v3/",

    apiKey: "AIzaSyAvcxy7qbSPvZhVn8ueAqM_oMijj08SAmY",

    videoModal: null,

    registerEvents: function () {

        csVideo.videoModal = $("#videoModal");

        $("body").on("click", "button.watchStream", csVideo.onWatch);
        $('#videoModal').on('hidden.bs.modal', csVideo.resetYoutubeModal)
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
        if (urlId.match(/^(UC|HC)[A-Za-z0-9]+$/i)) {
            return urlId;
        }
        else {
            console.log("Custom Channel Name or User Name: ", urlId);
            //to do: get channelId from channel custom name or user name
            return csVideo.testChannelId;
            //return null;
        }
    },

    getYoutubeLiveStreamUrl: function (videoUrl, success, fail) {
        var channelId = csVideo.getYoutubeChannelId(videoUrl);
        if (channelId) {
            console.log("Detected Channel Id: " + channelId);
            var apiUrl = `${csVideo.youtubeApiUrl}search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=${csVideo.apiKey}`;
            $.get(apiUrl, function (json) {
                if (json.items.length) {
                    var videoId = json.items[0].id.videoId;
                    console.log("Live Video Id: ", videoUrl);
                    var liveStreamUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
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

    onWatch: function ($e) {
        var videoUrl = $(this).attr("data-video-url");
        var videoTitle = $(this).attr("data-video-title");
        if (csVideo.parseUrl(videoUrl).hostname.includes('youtube.com')) {
            csVideo.openYoutubeModal(videoUrl, videoTitle);
        }
        else {
            window.open(videoUrl, "_blank");
        }
    },

    loadLiveStream: function (liveStreamUrl) {
        $("#videoSpinner").removeClass('d-flex').hide(700, function () {
            $("#videoModal .modal-body").append(`
                <iframe id="ytPlayer" src="${liveStreamUrl}" type="text/html" width="100%" height="320px" frameborder="0" allowfullscreen>
            `);
        });
    },

    showChannelBtn: function (videoUrl) {
        $("#videoSpinner").removeClass('d-flex').hide(700, function () {
            $("#videoModal #visitChannel").show();
        });
    },

    resetYoutubeModal: function () {
        $("#videoModal #ytPlayer").remove();
        $("#videoModal #visitChannel").hide();
        $("#videoModal #videoModalLabel, #videoModal #visitChannelName").text('');
        $("#videoModal #visitChannelLink").removeAttr('href');
    },

    openYoutubeModal: function (url, title) {
        csVideo.videoModal.find("#videoModalLabel").text(title);
        $("#videoModal #visitChannelName").text(title);
        $("#videoModal #visitChannelLink").attr('href', url);
        $("#videoModal #visitChannel").hide();
        csVideo.videoModal.modal("show");
        csVideo.getYoutubeLiveStreamUrl(url);
    }
};