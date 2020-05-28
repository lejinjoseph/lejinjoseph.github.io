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
                    let date = moment.tz('Asia/Kolkata').day(indexOfWeek);

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

    formatScheduleISTDateTime: function (date, istTime) {
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
            var inputIstTz = moment.tz(inputTime, 'Asia/Kolkata');
            var nowIstTz = moment().tz('Asia/Kolkata');
            // testing
            // nowIstTz.add(7, 'hours').add(10, "minutes");
            // console.log(nowIstTz.format("LTZ"));
            // test end
            return nowIstTz.diff(inputIstTz, "minutes");
        }
    }

};