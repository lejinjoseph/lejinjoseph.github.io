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
                showBtn.fadeOut(100, function () {
                    hideBtn.fadeIn(100);
                });
            });
        });

        $("#holyMass").on("click", ".hidePrevSchedule", function () {
            var hideBtn = $(this);
            var showBtn = $(this).siblings(".showPrevSchedule");
            $(".scheduleItemContainer:visible .schedule-item.finishedOrLate").fadeOut(500, function () {
                hideBtn.fadeOut(100, function () {
                    showBtn.fadeIn(100);
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

            // Disabling Pre Caching of Live Videos for Youtube API quota restriction
            //csVideo.processChannelIdsToBeCached();
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
                                data-video-status=${videoBtnText}
                                data-video-time=${statusObj.scheduleTimestamp}>
                                <i class="${videoTypeObj.icon} pr-2"></i>${videoBtnText}
                            </button>
                            ${statusText}
                        </div>
                    </div>`
                );

            })

            if (finishedOrLateCount > 0) {
                $(tabId).find(".showPrevSchedule").fadeIn();
                $(".scheduleItemContainer:visible .schedule-item.finishedOrLate").fadeOut();
                $(tabId).find(".schedule-item").removeClass("wow");
            }
        });

    }
}
