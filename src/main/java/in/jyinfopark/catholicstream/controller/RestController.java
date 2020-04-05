package in.jyinfopark.catholicstream.controller;

import in.jyinfopark.catholicstream.dto.DayLang;
import in.jyinfopark.catholicstream.entity.Day;
import in.jyinfopark.catholicstream.entity.Mass;
import in.jyinfopark.catholicstream.repo.DaysRepo;
import in.jyinfopark.catholicstream.repo.MassRepo;
import in.jyinfopark.catholicstream.service.MassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.security.PublicKey;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

@org.springframework.web.bind.annotation.RestController
public class RestController {

    @Autowired
    private MassRepo massRepo;

    @Autowired
    private DaysRepo daysRepo;

    List<String> normalDays= Arrays.asList("sun","mon","tue","wed","thu","fri","sat");

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
    public List<Day> getAllDays(){
        return daysRepo.getAllActive();
    }

    @GetMapping("/getDayLang")
    public DayLang getDayLang(){
        DayLang dayLang=new DayLang();
        dayLang.setLangs(massRepo.getLanguages());
        dayLang.setDays(daysRepo.getAllActive());
        return dayLang;
    }

    @GetMapping("/getSchedule/{language}/{day}")
    public List<Mass> getSchedule(@PathVariable String language,@PathVariable String day) {
        List<Mass> massList=massRepo.findAllByLanguageEquals(language,day);
        massList.removeIf(e->e.getTime()==null);
        massList.removeIf(e->!normalDays.contains(day)&&e.getDay().equalsIgnoreCase("Everyday"));
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
        List<Mass> massList=massRepo.getAll();
        massList.removeIf(e->e.getTime()==null);
        for (Mass mass : massList) {
            if(null!=mass.getTime()){
                try {
                    mass.setPrettyTime(mass.getTime().toLocalTime().format(DateTimeFormatter.ofPattern("hh:mm a")));
                }catch (Exception e){
                    mass.setPrettyTime("N/A");
                }
            }else {
                mass.setPrettyTime("N/A");
            }
        }
        return massList;

    }
}
