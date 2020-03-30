package in.jyinfopark.catholicstream.service;

import in.jyinfopark.catholicstream.entity.Mass;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface MassService {
    List<Mass> getMasses(String language);
}
