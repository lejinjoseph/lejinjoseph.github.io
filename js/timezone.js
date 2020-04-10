jQuery(document).ready(function ($) {
    csTimeZone.registerEvents();
});

var csTimeZone = {

    defaultTz: function () {
        return localStorage.getItem("csUserTimeZone") || null;
    },

    createDropDown: function (domSelector) {
        var defaultTz = csTimeZone.defaultTz();
        var tzSelect = `<select class="csTzSelect show-tick" data-container=".container" data-width="fit"
                                data-live-search="true" data-live-search-placeholder="search timezone">
                            <option value="">select timezone
                        </option>`;
        var tzArr = moment.tz.names();
        tzArr.forEach(function (tz) {
            var selected = defaultTz === tz ? "selected" : "";
            tzSelect += `<option value="${tz}" ${selected}>${tz}</option>`;
        });
        tzSelect += '</select>';

        $(domSelector).append(tzSelect);
        $('.csTzSelect').selectpicker();
    },

    registerEvents: function (params) {
        $("body").on("change", ".csTzSelect", function ($e) {
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
            targetDom.removeClass("text-secondary").addClass("text-warning").text(tzText);
        }
        else {
            targetDom.removeClass("text-warning").addClass("text-secondary").text(userTzDate.time);
        }
        return targetDom;
    },

    addDatesToDays: function (days) {
        let knownDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

        for (let day of days) {
            if (!day.date) {
                let indexOfWeek = knownDays.indexOf(day.name);
                if (indexOfWeek >= 0) {
                    let date = moment().day(indexOfWeek);
                    day.date = date.format("YYYY-MM-DD");
                } else {
                    day.date = "missing";
                }
            }
        }

        return days;
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

    }

};