package in.jyinfopark.catholicstream.controller;

import in.jyinfopark.catholicstream.entity.Mass;
import in.jyinfopark.catholicstream.repo.MassRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.TimeZone;
import java.util.stream.Collectors;

@Controller
public class FrontEndController {

    @Autowired
    private MassRepo massRepo;

    @GetMapping(value = "/")
    public String hello(Model model, TimeZone timeZone) {
        List<Mass> massList=massRepo.findAllByLanguageEquals("malayalam");
        for (Mass mass : massList) {
            ZoneId fromTimeZone = ZoneId.of(timeZone.getID());
            if(null!=mass.getTime()){
                try {
                    mass.setPrettyTime(mass.getTime().toInstant().atZone(fromTimeZone).format(DateTimeFormatter.ofPattern("hh:mm a")));

                }catch (Exception e){
                    mass.setPrettyTime("N/A");
                }
            }else {
                mass.setPrettyTime("N/A");
            }
        }
        model.addAttribute("sunday",massList.stream().filter(e->e.getDay().equalsIgnoreCase("sun")).collect(Collectors.toList()));
        model.addAttribute("monday",massList.stream().filter(e->e.getDay().equalsIgnoreCase("mon")).collect(Collectors.toList()));
        model.addAttribute("tuesday",massList.stream().filter(e->e.getDay().equalsIgnoreCase("tue")).collect(Collectors.toList()));
        model.addAttribute("wednesday",massList.stream().filter(e->e.getDay().equalsIgnoreCase("wed")).collect(Collectors.toList()));
        model.addAttribute("thursday",massList.stream().filter(e->e.getDay().equalsIgnoreCase("thu")).collect(Collectors.toList()));
        model.addAttribute("friday",massList.stream().filter(e->e.getDay().equalsIgnoreCase("fri")).collect(Collectors.toList()));
        model.addAttribute("saturday",massList.stream().filter(e->e.getDay().equalsIgnoreCase("sat")).collect(Collectors.toList()));
        model.addAttribute("timezone",timeZone.getID());
        model.addAttribute("language","malayalam");
        
        return "index";
    }

    @GetMapping("/masses/{language}")
    public String getMasses(Model model, @PathVariable String language,TimeZone timeZone) {
        if(language==null){
            language="Malayalam";
        }
        List<Mass> massList=massRepo.findAllByLanguageEquals(language);
        for (Mass mass : massList) {
            ZoneId fromTimeZone = ZoneId.of(timeZone.getID());
            if(null!=mass.getTime()){
                try {
                    mass.setPrettyTime(mass.getTime().toInstant().atZone(fromTimeZone).format(DateTimeFormatter.ofPattern("hh:mm a")));

                }catch (Exception e){
                    mass.setPrettyTime("N/A");
                }
            }else {
                mass.setPrettyTime("N/A");
            }
        }
        model.addAttribute("sunday",massList.stream().filter(e->e.getDay().equalsIgnoreCase("sun")).collect(Collectors.toList()));
        model.addAttribute("monday",massList.stream().filter(e->e.getDay().equalsIgnoreCase("mun")).collect(Collectors.toList()));
        model.addAttribute("tuesday",massList.stream().filter(e->e.getDay().equalsIgnoreCase("tue")).collect(Collectors.toList()));
        model.addAttribute("wednesday",massList.stream().filter(e->e.getDay().equalsIgnoreCase("wed")).collect(Collectors.toList()));
        model.addAttribute("thursday",massList.stream().filter(e->e.getDay().equalsIgnoreCase("thu")).collect(Collectors.toList()));
        model.addAttribute("friday",massList.stream().filter(e->e.getDay().equalsIgnoreCase("fri")).collect(Collectors.toList()));
        model.addAttribute("saturday",massList.stream().filter(e->e.getDay().equalsIgnoreCase("sat")).collect(Collectors.toList()));
        model.addAttribute("timezone",timeZone.getID());
        model.addAttribute("language",language);
        
        return "index";
    }
    
}
