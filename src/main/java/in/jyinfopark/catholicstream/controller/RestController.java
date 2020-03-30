package in.jyinfopark.catholicstream.controller;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.web.bind.annotation.GetMapping;

@org.springframework.web.bind.annotation.RestController
public class RestController {
    @GetMapping("/clear")
    @CacheEvict(value = "language", allEntries = true)
    public String clearCache() {
        return "success";

    }
}
