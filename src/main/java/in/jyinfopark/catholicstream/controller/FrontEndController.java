package in.jyinfopark.catholicstream.controller;

import in.jyinfopark.catholicstream.entity.Mass;
import in.jyinfopark.catholicstream.repo.MassRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import javax.servlet.http.HttpSession;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.TimeZone;
import java.util.stream.Collectors;

@Controller
public class FrontEndController {

    @Autowired
    private MassRepo massRepo;

    @GetMapping({ "/","/home"})
    public String home(Model model) {
        System.out.println(">>>>> /home controller in");
        try {
            List<Mass> massList = massRepo.findAllByLanguageEquals("malayalam");
            massList.removeIf(e->e.getTime()==null);
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
            populateModel(model, "IST", massList);
            model.addAttribute("language", "malayalam");
        }catch (Exception e){
            e.printStackTrace();
        }
        System.out.println(">>>>> /home controller out");


        return "index";
    }

    @GetMapping("/masses/{language}")
    public String getMasses(Model model, @PathVariable String language) {

        System.out.println(">>>>> /masses controller in lang  "+language);
        if(language==null){
            language="malayalam";
        }
        List<Mass> massList=massRepo.findAllByLanguageEquals(language);
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
        populateModel(model, "IST", massList);
        model.addAttribute("language",language);
        System.out.println(">>>>> /masses controller out");
        return "index";
    }

    private void populateModel(Model model, String time, List<Mass> massList) {
        model.addAttribute("sunday", massList.stream().filter(e -> e.getDay().equalsIgnoreCase("sun") || e.getDay().equalsIgnoreCase("Everyday")).collect(Collectors.toList()));
        model.addAttribute("monday", massList.stream().filter(e -> e.getDay().equalsIgnoreCase("mon") || e.getDay().equalsIgnoreCase("Everyday")).collect(Collectors.toList()));
        model.addAttribute("tuesday", massList.stream().filter(e -> e.getDay().equalsIgnoreCase("tue") || e.getDay().equalsIgnoreCase("Everyday")).collect(Collectors.toList()));
        model.addAttribute("wednesday", massList.stream().filter(e -> e.getDay().equalsIgnoreCase("wed") || e.getDay().equalsIgnoreCase("Everyday")).collect(Collectors.toList()));
        model.addAttribute("thursday", massList.stream().filter(e -> e.getDay().equalsIgnoreCase("thu") || e.getDay().equalsIgnoreCase("Everyday")).collect(Collectors.toList()));
        model.addAttribute("friday", massList.stream().filter(e -> e.getDay().equalsIgnoreCase("fri") || e.getDay().equalsIgnoreCase("Everyday")).collect(Collectors.toList()));
        model.addAttribute("saturday", massList.stream().filter(e -> e.getDay().equalsIgnoreCase("sat") || e.getDay().equalsIgnoreCase("Everyday")).collect(Collectors.toList()));
        model.addAttribute("timezone", time);
    }

}
