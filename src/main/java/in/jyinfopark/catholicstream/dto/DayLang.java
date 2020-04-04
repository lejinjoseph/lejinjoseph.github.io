package in.jyinfopark.catholicstream.dto;

import in.jyinfopark.catholicstream.entity.Day;

import java.util.List;

public class DayLang {

    private List<Day> days;

    private List<String> langs;

    public List<Day> getDays() {
        return days;
    }

    public void setDays(List<Day> days) {
        this.days = days;
    }

    public List<String> getLangs() {
        return langs;
    }

    public void setLangs(List<String> langs) {
        this.langs = langs;
    }
}
