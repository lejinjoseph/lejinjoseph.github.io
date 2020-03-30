package in.jyinfopark.catholicstream;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

import javax.annotation.PostConstruct;
import java.util.Date;
import java.util.TimeZone;

@SpringBootApplication
@EnableCaching
public class CatholicstreamApplication {

	public static void main(String[] args) {
		SpringApplication.run(CatholicstreamApplication.class, args);
	}

}
