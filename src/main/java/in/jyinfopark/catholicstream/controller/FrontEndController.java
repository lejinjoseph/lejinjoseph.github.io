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


    @GetMapping({"/","/route"})
    public String route(Model model){
        return "route";
    }

    @GetMapping(value = "/home")
    public String home(Model model, HttpSession httpSession,@RequestParam(name="timezone",required = false) String timeZone) {
        System.out.println(">>>>> /home controller in timezone="+timeZone);
        if(null!=timeZone){
            httpSession.setAttribute("timezone",timeZone);
        }
        if(null==httpSession.getAttribute("timezone") && null==timeZone){
            return "redirect:/route";
        }
        String time=httpSession.getAttribute("timezone").toString();


        try {


            List<Mass> massList = massRepo.findAllByLanguageEquals("malayalam");
            for (Mass mass : massList) {
                ZoneId fromTimeZone = ZoneId.of(time);
                if (null != mass.getTime()) {
                    try {
                        ZonedDateTime zonedDateTime = ZonedDateTime.parse("2015-05-05T"+mass.getTime().toString()+"+05:30[Asia/Kolkata]");
                        mass.setPrettyTime(zonedDateTime.toInstant().atZone(fromTimeZone).format(DateTimeFormatter.ofPattern("hh:mm a")));

                    } catch (Exception e) {
                        e.printStackTrace();
                        mass.setPrettyTime("N/A");
                    }
                } else {
                    mass.setPrettyTime("N/A");
                }
            }
            populateModel(model, time, massList);
            model.addAttribute("language", "malayalam");
        }catch (Exception e){
            e.printStackTrace();
        }
        System.out.println(">>>>> /home controller out");


        return "index";
    }

    @GetMapping("/masses/{language}")
    public String getMasses(Model model, @PathVariable String language,HttpSession httpSession) {
        if(null==httpSession.getAttribute("timezone")){
            return "redirect:/route";
        }
        String time=httpSession.getAttribute("timezone").toString();

        System.out.println(">>>>> /masses controller in lang  "+language+" time zone"+time);
        if(language==null){
            language="malayalam";
        }
        List<Mass> massList=massRepo.findAllByLanguageEquals(language);
        for (Mass mass : massList) {
            ZoneId fromTimeZone = ZoneId.of(time);
            if(null!=mass.getTime()){
                try {
                    ZonedDateTime zonedDateTime = ZonedDateTime.parse("2015-05-05T"+mass.getTime().toString()+"+05:30[Asia/Kolkata]");
                    mass.setPrettyTime(zonedDateTime.toInstant().atZone(fromTimeZone).format(DateTimeFormatter.ofPattern("hh:mm a")));
                }catch (Exception e){
                    mass.setPrettyTime("N/A");
                }
            }else {
                mass.setPrettyTime("N/A");
            }
        }
        populateModel(model, time, massList);
        model.addAttribute("language",language);
        System.out.println(">>>>> /masses controller out");
        return "index";
    }

    private void populateModel(Model model, String time, List<Mass> massList) {
        model.addAttribute("sunday", massList.stream().filter(e -> e.getDay().equalsIgnoreCase("sun")).collect(Collectors.toList()));
        model.addAttribute("monday", massList.stream().filter(e -> e.getDay().equalsIgnoreCase("mon")).collect(Collectors.toList()));
        model.addAttribute("tuesday", massList.stream().filter(e -> e.getDay().equalsIgnoreCase("tue")).collect(Collectors.toList()));
        model.addAttribute("wednesday", massList.stream().filter(e -> e.getDay().equalsIgnoreCase("wed")).collect(Collectors.toList()));
        model.addAttribute("thursday", massList.stream().filter(e -> e.getDay().equalsIgnoreCase("thu")).collect(Collectors.toList()));
        model.addAttribute("friday", massList.stream().filter(e -> e.getDay().equalsIgnoreCase("fri")).collect(Collectors.toList()));
        model.addAttribute("saturday", massList.stream().filter(e -> e.getDay().equalsIgnoreCase("sat")).collect(Collectors.toList()));
        model.addAttribute("timezone", time);
    }

}
