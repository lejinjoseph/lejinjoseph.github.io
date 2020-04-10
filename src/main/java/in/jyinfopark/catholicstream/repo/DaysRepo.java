package in.jyinfopark.catholicstream.repo;

import in.jyinfopark.catholicstream.entity.Day;
import in.jyinfopark.catholicstream.entity.Mass;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface DaysRepo extends CrudRepository<Day,Integer> {
    @Query(value = "select * from days where active=1 order by sort_order asc",nativeQuery = true)
    List<Day> getAllActive();
}
