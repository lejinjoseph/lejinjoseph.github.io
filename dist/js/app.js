jQuery(document).ready(function ($) {
    csTimeZone.registerEvents();
    csTimeZone.createDropDown('#timeZones');
});

var csTimeZone = {

    defaultTz: function () {
        return localStorage.getItem("csUserTimeZone") || null;
    },

    createDropDown: function (domSelector) {
        var defaultTz = csTimeZone.defaultTz();
        var tzSelect = `<select id="csTzSelect" class="show-tick" data-container="#schedule" data-width="fit"
                                data-live-search="true" data-live-search-placeholder="search timezone"
                                data-style="btn-outline-cs-blue">
                            <option value="">select timezone
                        </option>`;
        var tzArr = moment.tz.names();
        tzArr.forEach(function (tz) {
            var selected = defaultTz === tz ? "selected" : "";
            tzSelect += `<option value="${tz}" ${selected}>${tz}</option>`;
        });
        tzSelect += '</select>';

        $(domSelector).append(tzSelect);
        $('#csTzSelect').selectpicker();
    },

    registerEvents: function (params) {
        $("body").on("changed.bs.select", "#csTzSelect", function ($e) {
            if ($(this).val()) {
                localStorage.setItem("csUserTimeZone", $(this).val());
                csTimeZone.convertAllScheduleRows($(this).val());
            }
        })
    },

    convertAllScheduleRows: function name(selectedTz) {
        $(".schedule-item").each(function (index, dom) {
            var istDate = $(dom).attr("data-ist-date");
            var userTzDate = csTimeZone.convertIstToSelected(istDate, selectedTz);
            var target = $(dom).find(".userTzTime");
            csTimeZone.updateDom(userTzDate, target);
        });
    },

    updateDom: function (userTzDate, targetDom) {
        if (userTzDate.day) {
            var tzText = userTzDate.day + ", " + userTzDate.time;
            targetDom.removeClass("noDayChange").addClass("hasDayChange").text(tzText);
        }
        else {
            targetDom.removeClass("hasDayChange").addClass("noDayChange").text(userTzDate.time);
        }
        return targetDom;
    },

    addDatesToDays: function (days) {
        let knownDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        let sortedDays = [];

        for (let day of days) {
            if (!day.date) {
                let indexOfWeek = knownDays.indexOf(day.name);
                if (indexOfWeek >= 0) {
                    let todayIstDayIndex = moment.tz('Asia/Kolkata').day();
                    indexOfWeek = indexOfWeek < todayIstDayIndex ? indexOfWeek + 7 : indexOfWeek;
                    let date = moment().day(indexOfWeek).tz('Asia/Kolkata');

                    day.sortIndex = indexOfWeek;
                    day.date = date.format("YYYY-MM-DD");
                    day.view = {
                        day: date.format("ddd"),
                        date: date.format("DD"),
                        ym: date.format("MMM, YYYY")
                    };
                } else {
                    day.date = "missing";
                }
            }
            else {
                let date = moment(day.date, "YYYY-MM-DD").tz('Asia/Kolkata');
                day.sortIndex = date.day();
                day.view = {
                    day: date.format("ddd"),
                    date: date.format("DD"),
                    ym: date.format("MMM, YYYY")
                };
            }
        }

        csTimeZone.sortDays(days);

        return days;
    },

    sortDays: function (days) {
        return days.sort(function (a, b) {
            return a.sortIndex - b.sortIndex;
        });
    },

    formatScheduleDateTime: function (date, istTime) {
        var fullDateIST = date + " " + istTime + " +05:30";
        var mDateTime = moment.parseZone(fullDateIST, "YYYY-MM-DD hh:mm A ZZ");
        return mDateTime.format();
    },

    convertIstToSelected: function (istTime, timeZoneName) {
        var istDate = moment.parseZone(istTime);
        var userDate = istDate.clone().tz(timeZoneName);
        var ret = { time: userDate.format("hh:mm A z") };
        if (istDate.format("dddd") != userDate.format("dddd")) {
            ret.day = userDate.format("dddd");
        }
        return ret;

    },

    minutesDiffFromNow: function (inputTime, timezone) {
        if (typeof timezone !== "undefined" && timezone === "utc") {
            var inputUtc = moment.utc(inputTime);
            var nowUtc = moment.utc();
            return nowUtc.diff(inputUtc, "minutes");
        }
        else {
            var inputLocalTz = moment(inputTime);
            var nowLocalTz = moment();
            // testing
            nowLocalTz.add(0, 'hours').add(30, "minutes");
            console.log(nowLocalTz.format("LTZ"));
            // test end
            return nowLocalTz.diff(inputLocalTz, "minutes");
        }
    }

};
jQuery(document).ready(function ($) {
    csService.init();
});

var csService = {
    url: 'http://catholicstreamlive-env.eba-mh2niqse.ap-south-1.elasticbeanstalk.com',
    //url: 'https://api.catholicstreams.live',

    init: function (params) {
        csService.getLanguanges();

        $("body").on("click", "#instructions", csService.showGuidelineModal);

        $("#holyMass").on("click", ".showPrevSchedule", function () {
            var showBtn = $(this);
            var hideBtn = $(this).siblings(".hidePrevSchedule");
            $(".scheduleItemContainer:visible .schedule-item.finishedOrLate").fadeIn(500, function () {
                showBtn.fadeOut(500, function () {
                    hideBtn.fadeIn(500);
                });
            });
        });

        $("#holyMass").on("click", ".hidePrevSchedule", function () {
            var hideBtn = $(this);
            var showBtn = $(this).siblings(".showPrevSchedule");
            $(".scheduleItemContainer:visible .schedule-item.finishedOrLate").fadeOut(500, function () {
                hideBtn.fadeOut(500, function () {
                    showBtn.fadeIn(500);
                });
            });
        });

        $("body").on('shown.bs.tab', '.daySelection a[data-toggle="tab"]', function ($event) {
            var aLink = $($event.target);
            var tabId = aLink.attr("href");
            var date = aLink.attr("data-day-date");
            if ($(tabId).children(".schedule-item:not(.showHide)").length < 1) {
                var day = aLink.attr("data-day-id");
                var language = aLink.parents(".tab-pane").attr("data-mass-lang");
                csService.getSchedule(language, day, tabId, date, true);
            }
            csService.showTitleDate(date, tabId);
            csService.scrollToHolyMass();
            csVideo.getLiveStreamCache();
        });

    },

    scrollToHolyMass: function () {
        $('html, body').animate({
            scrollTop: $(".fullHeight:visible").offset().top - $("#header").outerHeight()
        }, 1000, 'easeInOutExpo');
    },

    showUnderMaintanence: function () {
        $("#schedule, #footer").hide();
        $('#maintenanceModal').modal('show');
    },

    showGuidelineModal: function () {
        $('#guidelinesModal').modal('show');
    },

    capitalizeString: function (string) {
        return string.replace(/\b\w/g, function (l) { return l.toUpperCase() })
    },

    getLanguanges: function () {
        $.get(csService.url + '/getLanguages', function (data) {
            csService.showGuidelineModal();
            csService.displayLanguages(data);
            registerFixedHolyMassTitle();
        })
            .fail(function () {
                console.log('failed to get languages!');
                csService.showUnderMaintanence();
            });
    },

    getDays: function () {
        $.get(csService.url + '/getDays', function (data) {
            days = csTimeZone.addDatesToDays(data);
            csService.displayDays(days)
        })
            .fail(function () {
                console.log('failed to get days!');
            });
    },

    getSchedule: function (language, day, tabId, date, addWow) {
        $.get(csService.url + `/getSchedule/${language}/${day}`, function (data) {
            csService.displaySchedule(data, tabId, date, addWow);
            csVideo.processChannelIdsToBeCached();
        })
            .fail(function () {
                console.log('failed to get schedule!');
            });
    },

    displayLanguages: function (data) {
        var firstItem = true;

        $("#langSelection").siblings(".loadingContent").fadeOut(500, function () {
            $(this).remove();

            $.each(data, function (index, orginalLang) {
                var language = csService.capitalizeString(orginalLang);
                var activeClass = firstItem ? "show active" : "";
                // add language button
                $("#langSelection").append(
                    `<li class="nav-item lej-padding">
                        <a class="nav-link ${activeClass}" href="#${language}Mass" role="tab" data-toggle="tab"
                            aria-selected="${firstItem}">${language}</a>
                     </li>`
                );

                //add schedule tab panel
                $("#holyMass").append(
                    `<div id="${language}Mass" data-mass-lang="${orginalLang}" role="tabpanel" class="tab-pane fade ${activeClass}">
                        <ul class="daySelection nav nav-tabs nav-fill" role="tablist">
                        </ul>
                        <div class="fullHeight pt-3 pt-md-4">
                            <h4 class="langDateUserTitle text-center font-weight-bold">
                                ${language} Holy Mass
                                <span class="d-none d-md-inline-block px-md-2">-</span>
                                <span class="scheduleDate d-block d-md-inline-block"></span>                              
                            </h4>
                            <div class="tab-content justify-content-center my-3">
                                <div class="d-flex justify-content-center loadingContent">
                                    <div class="spinner-grow text-warning" role="status">
                                        <span class="sr-only">Loading...</span>
                                    </div>
                                </div>
                            </div>
                        </div>                        
                    </div>`
                );

                firstItem = false;
            })

            $('[data-toggle="tooltip"]').tooltip();

            csService.getDays();
        });

    },

    dayViewHtml: function (day, fresh) {
        if (fresh) {
            let dayName, splClass, normalDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
            if (!normalDays.includes(day.name)) {
                dayName = day.displayName;
                splClass = "text-danger";
            }
            else {
                dayName = day.view.day;
                splClass = "";
            }
            return `
                <div class="dayView">
                    <div class="dayName ${splClass}">${dayName}</div>
                    <div class="dayDate">${day.view.date}</div>
                    <div class="dayMY">${day.view.ym}</div>
                </div>
            `;
        }
        else {
            return day.displayName;
        }
    },

    displayDays: function (days) {
        $.each($("ul.daySelection"), function (index, dom) {
            var language = $(dom).parents(".tab-pane").attr("data-mass-lang");
            var tabContent = $(dom).siblings(".fullHeight").find("div.tab-content");

            $(tabContent).children(".loadingContent").fadeOut(500, function () {
                $(this).remove();

                var firstItem = true;
                $.each(days, function (index, day) {
                    var activeClass = firstItem ? "show active" : "";
                    var langDayId = (day.name + csService.capitalizeString(language) + "Mass").replace(' ', '-');
                    $(dom).append(
                        `<li class="nav-item lej-padding">
                            <a class="nav-link ${activeClass}" href="#${langDayId}" 
                                data-day-id="${day.name}" data-day-date="${day.date}" role="tab" data-toggle="tab">
                                ${csService.dayViewHtml(day, true)}
                            </a>
                        </li>`
                    );

                    $(tabContent).append(
                        `<div  role="tabpanel" class="tab-pane fade scheduleItemContainer container ${activeClass}" id="${langDayId}">
                            <div class="d-flex justify-content-center m-5 loadingContent">
                                <div class="spinner-grow text-danger" role="status">
                                    <span class="sr-only">Loading...</span>
                                </div>
                            </div>
                            <div class="row schedule-item showHide text-info">
                                <div class="col-12 offset-md-3 col-md-6 text-center">
                                    <a class="showPrevSchedule">
                                        <i class="fas fa-eye"></i>
                                        Show Finished Holy Masses
                                    </a>
                                    <a class="hidePrevSchedule">
                                        <i class="fas fa-eye-slash"></i>
                                        Hide Finished Holy Masses
                                    </a>
                                </div>
                            </div>
                        </div>`
                    );

                    if (firstItem) {
                        var addWow = $(dom).is(":visible");
                        csService.getSchedule(language, day.name, `#${langDayId}`, day.date, addWow);
                        csService.showTitleDate(day.date, `#${langDayId}`);
                    }

                    firstItem = false;
                });
            });
        });
    },

    showTitleDate: function (date, tabId) {
        var formatted = moment(date).format("ddd, DD MMM YYYY");
        $(tabId).parents(".fullHeight").find("span.scheduleDate").fadeOut(500, function () {
            $(this).html(formatted).fadeIn(500);
        });
    },

    displaySchedule: function (data, tabId, date, addWow) {
        $(tabId).children(".loadingContent").fadeOut(500, function () {
            $(this).remove();
            if (data.length < 1) {
                $(tabId).append(
                    `<div class="row schedule-item noSchedulesFound">
                        <div class="col-12 offset-md-2 col-md-8 py-1">
                            <h4 class="text-danger">Sorry! We could not find any Holy Mass schedules</h4>
                            <small>Please <a href="http://jyinfopark.in" target="_blank">contact us</a> to add new Holy Mass schedules here.</small>
                        </div>
                    </div>`);

                return false;
            }

            var finishedOrLateCount = 0;

            $.each(data, function (index, row) {
                var videoTypeObj = csVideo.getVideoType(row.link);
                var scheduleTime = csTimeZone.formatScheduleDateTime(date, row.prettyTime);
                var statusObj = csVideo.getScheduleStatusClass(scheduleTime, videoTypeObj.type, row.link);

                var videoBtnText = ['justStarted', 'inProgress'].includes(statusObj.class) ? "LIVE" : "Video";
                finishedOrLateCount += statusObj.class === "finishedOrLate" ? 1 : 0;
                var wowClass = addWow && statusObj.class !== "finishedOrLate" ? "wow fadeInUp" : "";
                var description = row.description ? `<p>${row.description}</p>` : "";
                var statusText = statusObj.title ? `<small class="float-right float-md-none">${statusObj.title}</small>` : '';
                var $target = $('<time class="userTzTime d-inline-block d-md-block float-right float-md-none"></time>');
                if (csTimeZone.defaultTz()) {
                    var userTzDate = csTimeZone.convertIstToSelected(scheduleTime, csTimeZone.defaultTz());
                    $target = csTimeZone.updateDom(userTzDate, $target);
                }
                $(tabId).append(
                    `<div class="row schedule-item ${wowClass} ${statusObj.class}" data-ist-date="${scheduleTime}">
                        <div class="col-md-3 py-1">
                            <time>${row.prettyTime} IST</time>
                            ${$target[0].outerHTML}
                        </div>
                        <div class="col-md-7 py-1">
                            <h4>${row.name}</h4>
                            ${description}
                        </div>
                        <div class="col-md-2 py-1 text-md-right">
                            <button class="btn btn-sm ${videoTypeObj.btn} watchStream" 
                                data-video-url="${row.link}"
                                data-video-title="${row.name}"
                                data-video-type=${videoTypeObj.type}
                                data-video-status=${videoBtnText}>
                                <i class="${videoTypeObj.icon} pr-2"></i>${videoBtnText}
                            </button>
                            ${statusText}
                        </div>
                    </div>`
                );

            })

            if (finishedOrLateCount > 0) {
                $(tabId).find(".hidePrevSchedule").fadeIn();
                $(tabId).find(".schedule-item").removeClass("wow");
            }
        });

    }
}

jQuery(document).ready(function ($) {
    csVideo.registerEvents();
    csVideo.getLiveStreamCache();
});

var csVideo = {

    testChannelId: "UCxqxxgXZxSwLpPk6pCC_XJA",

    youtubeApiUrl: "https://www.googleapis.com/youtube/v3/",

    apiKey: "removedFromHereForSecurityReasons",

    videoModal: null,

    liveVideoCache: {},

    serverCacheDuration: 45, //minutes

    channelsToBeCached: { //in progress and soon starting live channel Ids
        live: [],
        upcoming: []
    },

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

    getScheduleStatusClass: function (scheduleTime, videoType, videoUrl) {
        var mDif = csTimeZone.minutesDiffFromNow(scheduleTime);

        if (videoType === "youtube") {
            var channelId = csVideo.getYoutubeChannelId(videoUrl);
            if (mDif >= -15 && mDif < 0) {

                // Turn Off Upcoming Live fetching for now
                // csVideo.channelsToBeCached.upcoming.push(channelId);
            }

            if (mDif >= 0 && mDif <= 30) {
                csVideo.channelsToBeCached.live.push(channelId);
            }
        }

        if (mDif < -15) {
            return { class: "upComing", title: null };
        }
        else if (mDif >= -15 && mDif < 0) {
            return { class: "startingSoon", title: `${Math.abs(mDif)} mins to go` };
        }
        else if (mDif >= 0 && mDif <= 5) {
            return { class: "justStarted", title: "just started" };
        }
        else if (mDif > 5 && mDif <= 30) {
            return { class: "inProgress", title: `${Math.abs(mDif)} mins ago` };
        }
        else {
            return { class: "finishedOrLate", title: null };
        }
    },

    addToLiveCache: function (cacheObj) {
        var channelId = cacheObj.channelId;
        var streamId = cacheObj.streamId;
        var videoUpdated = moment.utc(cacheObj.timestamp).unix();
        // delete cacheObj.channelId;
        // delete cacheObj.streamId;
        if (typeof csVideo.liveVideoCache[channelId] === "undefined") {
            csVideo.liveVideoCache[channelId] = {};
        }

        if (typeof csVideo.liveVideoCache[channelId]["metadata"] === "undefined") {
            csVideo.liveVideoCache[channelId]["metadata"] = { lastUpdated: videoUpdated}
        }

        if(cacheObj.timestamp && videoUpdated > csVideo.liveVideoCache[channelId]["metadata"]["lastUpdated"]) {
            csVideo.liveVideoCache[channelId]["metadata"]["lastUpdated"] = videoUpdated;
        }

        if (streamId) {
            csVideo.liveVideoCache[channelId][streamId] = cacheObj;
        }
    },

    removeFromLiveCache: function (channelId, streamId) {
        if (csVideo.liveVideoCache[channelId] && csVideo.liveVideoCache[channelId][streamId]) {
            delete csVideo.liveVideoCache[channelId][streamId];
        }
    },

    getStreamIdFromLiveCache: function (channelId) {
        if (csVideo.liveVideoCache[channelId]) {
            for (const streamId in csVideo.liveVideoCache[channelId]) {
                //need changes here based on the start/end time once available
                return streamId;
            }
        }
        return null;
    },

    getLiveStreamCache: function () {
        $.get(csService.url + `/liveStreamCache`, function (data) {
            if (data) {
                csVideo.validateAndSaveStreams(data);
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

    processChannelIdsToBeCached: function () {
        for (const eventType in csVideo.channelsToBeCached) {
            $.each(csVideo.channelsToBeCached[eventType], function (index, channelId) {
                if (csVideo.getStreamIdFromLiveCache(channelId)) {
                    console.log("Live video cache already available for " + channelId);
                }
                else {
                    csVideo.refreshLiveStream(channelId, eventType)
                        .done(function (data) {
                            csVideo.addToLiveCache(data);
                        })
                        .fail(function () {
                            console.log("Cache refresh failed for " + channelId);
                        });
                }
            });
        }
    },

    validateAndSaveStreams: function (data) {
        $.each(data, function (index, cache) {
            var cachedMins = csTimeZone.minutesDiffFromNow(cache.timestamp, "utc");
            if (cachedMins < csVideo.serverCacheDuration) {
                csVideo.addToLiveCache(cache);
            }
            else {
                csVideo.removeFromLiveCache(cache.channelId, cache.streamId);
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

    checkYoutubeLive: function (channelId, videoUrl) {
        csVideo.refreshLiveStream(channelId, "live")
            .done(function (data) {
                if (data.channelId && data.streamId) {
                    csVideo.addToLiveCache(data);
                    csVideo.showYoutubeLive(data.streamId);
                }
                else {
                    console.log("No Live Streams found!");
                    csVideo.showChannelBtn(videoUrl);
                }
            })
            .fail(function () {
                console.log('failed to get refresh stream!');
                csVideo.showChannelBtn(videoUrl);
            });
    },

    processYoutubeLive: function (videoUrl) {
        var channelId = csVideo.getYoutubeChannelId(videoUrl);
        if (channelId) {
            var cacheStreamId = csVideo.getStreamIdFromLiveCache(channelId);
            if (cacheStreamId) {
                csVideo.showYoutubeLive(cacheStreamId);
            }
            else {
                csVideo.checkYoutubeLive(channelId, videoUrl);
            }
        }
        else {
            csVideo.showChannelBtn(videoUrl);
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
        if (videoType === "youtube" && videoStatus === "LIVE") {
            csVideo.openYoutubeModal(videoUrl, videoTitle);
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
        $("#videoModal #visitChannelName").text(title);
        $("#videoModal #visitChannelLink").attr('href', url);
        $("#videoModal #visitChannel").hide();
        csVideo.videoModal.modal("show");
        //csVideo.getYoutubeLiveStreamUrl(url);
        csVideo.processYoutubeLive(url);
    }
};
jQuery(document).ready(function ($) {

  $('[data-toggle="tooltip"]').tooltip();

  // Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      $('.back-to-top').fadeIn('slow');
    } else {
      $('.back-to-top').fadeOut('slow');
    }
  });
  $('.back-to-top').click(function () {
    $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
    return false;
  });

  // Header fixed on scroll
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      $('#header').addClass('header-scrolled');
    } else {
      $('#header').removeClass('header-scrolled');
    }
  });

  if ($(window).scrollTop() > 100) {
    $('#header').addClass('header-scrolled');
  }

  // Real view height for mobile devices
  if (window.matchMedia("(max-width: 767px)").matches) {
    $('#intro').css({ height: $(window).height() });
  }

  // Initiate the wowjs animation library
  new WOW().init();

  // Mobile Navigation
  if ($('#nav-menu-container').length) {
    var $mobile_nav = $('#nav-menu-container').clone().prop({
      id: 'mobile-nav'
    });
    $mobile_nav.find('> ul').attr({
      'class': '',
      'id': ''
    });
    $('body').append($mobile_nav);
    $('body').prepend('<button type="button" id="mobile-nav-toggle"><i class="fa fa-bars"></i></button>');
    $('body').append('<div id="mobile-body-overly"></div>');
    $('#mobile-nav').find('.menu-has-children').prepend('<i class="fa fa-chevron-down"></i>');

    $(document).on('click', '.menu-has-children i', function (e) {
      $(this).next().toggleClass('menu-item-active');
      $(this).nextAll('ul').eq(0).slideToggle();
      $(this).toggleClass("fa-chevron-up fa-chevron-down");
    });

    $(document).on('click', '#mobile-nav-toggle', function (e) {
      $('body').toggleClass('mobile-nav-active');
      $('#mobile-nav-toggle i').toggleClass('fa-times fa-bars');
      $('#mobile-body-overly').toggle();
    });

    $(document).click(function (e) {
      var container = $("#mobile-nav, #mobile-nav-toggle");
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('#mobile-nav-toggle i').toggleClass('fa-times fa-bars');
          $('#mobile-body-overly').fadeOut();
        }
      }
    });
  } else if ($("#mobile-nav, #mobile-nav-toggle").length) {
    $("#mobile-nav, #mobile-nav-toggle").hide();
  }

  // Smooth scroll for the menu and links with .scrollto classes
  $('.nav-menu a, #mobile-nav a, .scrollto').on('click', function () {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      if (target.length) {
        var top_space = 0;

        if ($('#header').length) {
          top_space = $('#header').outerHeight();

          if (!$('#header').hasClass('header-fixed')) {
            top_space = top_space - 20;
          }
        }

        $('html, body').animate({
          scrollTop: target.offset().top - top_space
        }, 1500, 'easeInOutExpo');

        if ($(this).parents('.nav-menu').length) {
          $('.nav-menu .menu-active').removeClass('menu-active');
          $(this).closest('li').addClass('menu-active');
        }

        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('#mobile-nav-toggle i').toggleClass('fa-times fa-bars');
          $('#mobile-body-overly').fadeOut();
        }
        return false;
      }
    }
  });

});

function dayOfWeekAsString(dayIndex) {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dayIndex];
}
var day = dayOfWeekAsString(new Date().getDay());
$('#' + day).addClass('active');
$('#' + day).addClass('show');
$('#' + day + '-link').addClass('active');
$('#' + day + '-link').addClass('show');
$('#' + day + '-link').attr('aria-selected', 'true');

// Schedule Title fixed on scroll
function registerFixedHolyMassTitle() {
  $(window).scroll(function () {
    var $title = $('.langDateUserTitle:visible');
    var offset = $('.fullHeight:visible').offset();
    if ((offset.top - $(this).scrollTop()) < 75) {
      $title.addClass('fixed-top');
    } else {
      $title.removeClass('fixed-top');
    }
  });
}