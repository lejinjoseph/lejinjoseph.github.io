package in.jyinfopark.catholicstream.repo;

import in.jyinfopark.catholicstream.entity.Mass;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface MassRepo extends CrudRepository<Mass,Integer> {
    @Query(value = "SELECT * FROM mass WHERE language=?1 and day is not null ORDER BY time_ist asc",nativeQuery = true)
    List<Mass> findAllByLanguageEquals(String language);
}
