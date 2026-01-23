import { useLanguage } from '../contexts/LanguageContext';

export const useMessageService = () => {
    const { languageCode } = useLanguage();
    const getMessage = (term) => {
        const languages = {
            en: require('../assets/localizables/Localizable_en.json'),
            fr: require('../assets/localizables/Localizable_fr.json'),
            de: require('../assets/localizables/Localizable_de.json'),
            es: require('../assets/localizables/Localizable_es.json'),
            it: require('../assets/localizables/Localizable_it.json')

        };

        const languageData = languages[languageCode];
        const termObject = languageData.find(item => item.term === term);
        return termObject ? termObject.definition : term;
    };

    return { getMessage };
};