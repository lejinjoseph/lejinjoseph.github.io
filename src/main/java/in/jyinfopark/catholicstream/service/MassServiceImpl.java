package in.jyinfopark.catholicstream.service;

import in.jyinfopark.catholicstream.entity.Mass;
import in.jyinfopark.catholicstream.repo.MassRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class MassServiceImpl implements MassService {

    @Autowired
    private MassRepo massRepo;

    @Override
    @Cacheable("language")
    public List<Mass> getMasses(String language) {
       return massRepo.findAllByLanguageEquals(language);
    }
}
