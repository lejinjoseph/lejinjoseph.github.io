package in.jyinfopark.catholicstream.controller;

import in.jyinfopark.catholicstream.entity.Mass;
import in.jyinfopark.catholicstream.repo.MassRepo;
import in.jyinfopark.catholicstream.service.MassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.format.DateTimeFormatter;
import java.util.List;

@org.springframework.web.bind.annotation.RestController
public class RestController {

    @Autowired
    private MassRepo massRepo;

    @GetMapping("/clear")
    @CacheEvict(value = "language", allEntries = true)
    public String clearCache() {
        return "success";

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
