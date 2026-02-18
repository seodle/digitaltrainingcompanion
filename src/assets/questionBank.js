const questionBank = {
  fr: {
    '0': {
      question: "Dans quelle mesure êtes-vous motivé à participer à cette formation ?",
      shortName: "Motivation",
      questionType: "radio-ordered",
      options: ["Pas du tout motivé", "Pas motivé", "Plutôt pas motivé", "Ni motivé ni démotivé", "Plutôt motivé", "Motivé", "Tout à fait motivé"]
    },
    '1': {
      question: "Dans quelle mesure considérez-vous la technologie bénéfique pour votre travail ?",
      shortName: "Bénéfices de la Technologie",
      questionType: "radio-ordered",
      options: ["Pas du tout bénéfique", "Pas bénéfique", "Plutôt pas bénéfique", "Ni bénéfique ni nuisible", "Plutôt bénéfique", "Bénéfique", "Tout à fait bénéfique"]
    },
    '2': {
      question: "Dans quelle mesure les opinions des autres influencent-elles votre décision de participer à cette formation ?",
      shortName: "Influence des Pairs",
      questionType: "radio-ordered",
      options: ["Pas du tout influencé", "Pas influencé", "Plutôt pas influencé", "Ni influencé ni non influencé", "Plutôt influencé", "Influencé", "Tout à fait influencé"]
    },
    '3': {
      question: "Dans quelle mesure votre inscription à cette formation était-elle un choix personnel plutôt qu'une obligation ?",
      shortName: "Choix Personnel",
      questionType: "radio-ordered",
      options: ["Complètement une obligation", "Principalement une obligation", "Plutôt une obligation", "Ni un choix personnel ni une obligation", "Plutôt un choix personnel", "Principalement un choix personnel", "Complètement un choix personnel"]
    },
    '4': {
      question: "Dans quelle mesure vous sentez-vous capable d'utiliser les technologies de l'information pour accomplir vos tâches ?",
      shortName: "Confiance en Technologie",
      questionType: "radio-ordered",
      options: ["Pas du tout capable", "Pas capable", "Plutôt pas capable", "Ni capable ni incapable", "Plutôt capable", "Capable", "Tout à fait capable"]
    },
    '5': {
      question: "Comment évalueriez-vous la capacité de l'instructeur à engager les participants ?",
      shortName: "Engagement",
      questionType: "radio-ordered",
      options: ["Pas du tout engageant", "Pas engageant", "Plutôt pas engageant", "Ni engageant ni non engageant", "Plutôt engageant", "Engageant", "Tout à fait engageant"]
    },
    '6': {
      question: "Comment évalueriez-vous la capacité de l'instructeur à gérer le temps ?",
      shortName: "Gestion du Temps",
      questionType: "radio-ordered",
      options: ["Très mauvaise gestion du temps", "Mauvaise gestion du temps", "Plutôt mauvaise gestion du temps", "Gestion du temps moyenne", "Bonne gestion du temps", "Très bonne gestion du temps", "Excellente gestion du temps"]
    },
    '7': {
      question: "Comment évalueriez-vous la pertinence des méthodes d'enseignement de l'instructeur ?",
      shortName: "Méthodes d'Enseignement",
      questionType: "radio-ordered",
      options: ["Pas du tout pertinent", "Pas pertinent", "Plutôt pas pertinent", "Neutre", "Plutôt pertinent", "Pertinent", "Tout à fait pertinent"]
    },
    '8': {
      question: "Comment évalueriez-vous la pertinence de l'environnement d'apprentissage ?",
      shortName: "Environnement",
      questionType: "radio-ordered",
      options: ["Pas du tout pertinent", "Pas pertinent", "Plutôt pas pertinent", "Neutre", "Plutôt pertinent", "Pertinent", "Tout à fait pertinent"]
    },
    '9': {
      question: "Comment évalueriez-vous la pertinence des outils pédagogiques utilisés ?",
      shortName: "Pertinence des Outils",
      questionType: "radio-ordered",
      options: ["Pas du tout pertinent", "Pas pertinent", "Plutôt pas pertinent", "Neutre", "Plutôt pertinent", "Pertinent", "Tout à fait pertinent"]
    },
    '10': {
      question: "Comment évalueriez-vous la capacité de l'instructeur à adapter ses méthodes d'enseignement au public ?",
      shortName: "Pédagogie",
      questionType: "radio-ordered",
      options: ["Pas du tout pertinent", "Pas pertinent", "Plutôt pas pertinent", "Neutre", "Plutôt pertinent", "Pertinent", "Tout à fait pertinent"]
    },
    '11': {
      question: "À quel point avez-vous apprécié la session de formation ?",
      shortName: "Satisfaction",
      questionType: "radio-ordered",
      options: ["Pas du tout apprécié", "Pas apprécié", "Plutôt pas apprécié", "Ni apprécié ni pas apprécié", "Plutôt apprécié", "Apprécié", "Tout à fait apprécié"]
    },
    '12': {
      question: "À quel point avez-vous trouvé la session de formation utile ?",
      shortName: "Utilité Perçue",
      questionType: "radio-ordered",
      options: ["Pas du tout utile", "Pas utile", "Plutôt pas utile", "Ni utile ni inutile", "Plutôt utile", "Utile", "Tout à fait utile"]
    },
    '13': {
      question: "À quel point trouvez-vous facile d'intégrer ce que vous avez vu dans une activité en classe ?",
      shortName: "Facilité d'Utilisation",
      questionType: "radio-ordered",
      options: ["Pas du tout facile", "Pas facile", "Plutôt pas facile", "Ni facile ni difficile", "Plutôt facile", "Facile", "Tout à fait facile"]
    },
    '14': {
      question: "À quel point vous sentez-vous confiant à l'idée d'intégrer ce que vous avez vu dans une activité en classe ?",
      shortName: "Auto-Efficacité",
      questionType: "radio-ordered",
      options: ["Pas du tout confiant", "Pas confiant", "Plutôt pas confiant", "Ni confiant ni pas confiant", "Plutôt confiant", "Confiant", "Tout à fait confiant"]
    },
    '15': {
      question: "Dans quelle mesure avez-vous l'intention d'utiliser ce que vous avez vu pour mener une activité en classe ?",
      shortName: "Intention Comportementale",
      questionType: "radio-ordered",
      options: ["Pas du tout l'intention d'intégrer", "Pas l'intention d'intégrer", "Plutôt pas l'intention d'intégrer", "Ni l'intention ni pas l'intention", "Plutôt  l'intention d'intégrer", "Intention d'intégrer", "Tout à fait l'intention d'intégrer"]
    },
    '16': {
      question: "À quel niveau estimez-vous votre besoin en matériel nécessaire pour intégrer efficacement les ressources de formation dans votre pratique ?",
      shortName: "Ressources Matérielles",
      questionType: "radio-ordered",
      options: ["Très élevé", "Élevé", "Assez élevé", "Moyen", "Assez faible", "Faible", "Très faible"]
    },
    '17': {
      question: "À quel niveau estimez-vous votre besoin de temps disponible pour intégrer les ressources de formation dans votre pratique ?",
      shortName: "Ressources en Temps",
      questionType: "radio-ordered",
      options: ["Très élevé", "Élevé", "Assez élevé", "Moyen", "Assez faible", "Faible", "Très faible"]
    },
    '18': {
      question: "À quel niveau estimez-vous votre besoin de soutien de la part de votre hiérarchie pour intégrer les ressources de formation dans votre pratique ?",
      shortName: "Soutien Hiérarchique",
      questionType: "radio-ordered",
      options: ["Très élevé", "Élevé", "Assez élevé", "Moyen", "Assez faible", "Faible", "Très faible"]
    },
    '19': {
      question: "À quel niveau estimez-vous votre besoin de soutien de la part de vos collègues pour intégrer les ressources de formation dans votre pratique ?",
      shortName: "Soutien des Pairs",
      questionType: "radio-ordered",
      options: ["Très élevé", "Élevé", "Assez élevé", "Moyen", "Assez faible", "Faible", "Très faible"]
    },
    '20': {
      question: "À quel niveau estimez-vous votre besoin de soutien technique pour intégrer les ressources de formation dans votre pratique ?",
      shortName: "Soutien Technique",
      questionType: "radio-ordered",
      options: ["Très élevé", "Élevé", "Assez élevé", "Moyen", "Assez faible", "Faible", "Très faible"]
    },
    '21': {
      question: "À quel niveau estimez-vous votre besoin de mentorat (par exemple, avec un collègue plus expérimenté) pour intégrer les ressources de formation dans votre pratique ?",
      shortName: "Mentorat",
      questionType: "radio-ordered",
      options: ["Très élevé", "Élevé", "Assez élevé", "Moyen", "Assez faible", "Faible", "Très faible"]
    },
    '22': {
      question: "Dans quelle mesure le matériel introduit est-il compatible avec vos pratiques d'enseignement antérieures ?",
      shortName: "Compatibilité",
      questionType: "radio-ordered",
      options: ["Pas du tout compatible", "Pas compatible", "Plutôt pas compatible", "Ni compatible ni incompatible", "Plutôt compatible", "Compatible", "Tout à fait compatible"]
    },
    '23': {
      question: "Comment trouvez-vous la progression de vos élèves avec les nouveaux matériaux ?",
      shortName: "Progression des Élèves",
      questionType: "radio-ordered",
      options: ["Significativement diminuée", "Légèrement diminuée", "Restée la même", "Légèrement augmentée", "Modérément augmentée", "Significativement augmentée"]
    },
    '24': {
      question: "Comment évalueriez-vous votre sentiment d'auto-efficacité à utiliser les nouvelles ressources ?",
      shortName: "Auto-Efficacité",
      questionType: "radio-ordered",
      options: ["Pas du tout confiant", "Pas confiant", "Plutôt pas confiant", "Ni confiant ni pas confiant", "Plutôt confiant", "Confiant", "Tout à fait confiant"]
    },
    '25': {
      question: "À quel point trouvez-vous mentalement exigeante la mise en œuvre des nouvelles ressources ?",
      shortName: "Charge Cognitive",
      questionType: "radio-ordered",
      options: ["Extrêmement exigeante", "Très exigeante", "Assez exigeante", "Modérément exigeante", "Légèrement exigeante", "Pas du tout exigeante"]
    },
    '26': {
      question: "Dans quelle mesure les nouvelles ressources augmentent-elles votre charge de travail ?",
      shortName: "Impact sur la Charge de Travail",
      questionType: "radio-ordered",
      options: ["Massivement augmenté", "Significativement augmenté", "Assez augmenté", "Neutre", "Modérément augmenté", "Légèrement augmenté", "Pas du tout augmenté"]
    },
    '27': {
      question: "Combien de temps vous a-t-il fallu pour mettre en œuvre les nouveaux matériaux après la formation ?",
      shortName: "Temps de Mise en Œuvre",
      questionType: "radio-ordered",
      options: ["Pas encore mis en œuvre", "Plus de 3 mois", "Dans les 3 mois", "Dans le mois", "Dans la semaine", "Immédiatement"]
    },
    '28': {
      question: "À quel groupe d'âge appartenez-vous ?",
      shortName: "Âge",
      questionType: "radio-unordered",
      options: ["Moins de 10 ans", "10-15 ans", "16-20 ans", "21-25 ans", "26-30 ans", "31 ans et plus"]
    },
    '29': {
      question: "Quel est votre principal domaine de spécialisation ou d'intérêt ?",
      shortName: "Spécialisation",
      questionType: "radio-unordered",
      options: ["Sciences", "Arts", "Technologie", "Mathématiques", "Humanités", "Autre"]
    },
    '30': {
      question: "À quel niveau d'éducation êtes-vous actuellement ?",
      shortName: "Niveau d'Éducation",
      questionType: "radio-unordered",
      options: ["Primaire", "Secondaire", "Licence (ou équivalent)", "Master/Doctorat (ou équivalent)"]
    },
    '31': {
      question: "À quelle fréquence utilisez-vous des outils numériques pour apprendre ou vous divertir ?",
      shortName: "Utilisation des Outils Numériques",
      questionType: "radio-unordered",
      options: ["Jamais", "Rarement", "Parfois", "Souvent", "Toujours"]
    },
    '32': {
      question: "Quand avez-vous terminé la formation ?",
      shortName: "Délai post-formation",
      questionType: "radio-unordered",
      options: ["Moins d'un mois", "1-3 mois", "3-6 mois", "Plus de 6 mois"]
    },
    '33': {
      question: "À quel(s) niveau(x) enseignez-vous actuellement ?",
      shortName: "Niveaux d'Enseignement",
      questionType: "checkbox",
      options: ["Maternelle", "Primaire (CP-CE2)", "Primaire (CM1-CM2)", "Collège", "Lycée", "Université"]
    },
    '34': {
      question: "Dans quelle mesure avez-vous eu l'opportunité de mettre en œuvre les concepts de la formation ?",
      shortName: "Niveau d'Opportunité",
      questionType: "radio-ordered",
      options: ["Aucune opportunité", "Opportunités limitées", "Opportunités modérées", "Opportunités abondantes"]
    },
    '35': {
      question: "À quelle fréquence avez-vous mis en œuvre ce que vous avez vu en formation ?",
      shortName: "Fréquence d'Implémentation",
      questionType: "radio-ordered",
      options: [
        "Jamais",
        "Rarement (1-2 fois par mois)",
        "Parfois (1-2 fois par semaine)",
        "Souvent (3-4 fois par semaine)",
        "Quotidiennement"
      ]
    },
    '36': {
      question: "Quels aspects de la formation avez-vous mis en œuvre ?",
      shortName: "Aspects Implémentés",
      questionType: "checkbox",
      options: [
        "Stratégies d'enseignement",
        "Méthodes d'évaluation",
        "Techniques de gestion de classe",
        "Intégration technologique",
        "Techniques d'engagement des élèves",
        "Stratégies de différenciation",
        "Autre"
      ]
    },
    '37': {
      question: "Si autre, veuillez préciser :",
      shortName: "Aspects Implémentés (Autre)",
      questionType: "text",
      options: []
    },
    '38': {
      question: "Veuillez décrire, le cas échéant, un exemple spécifique de mise en œuvre de la formation dans votre classe :",
      shortName: "Exemple d'Implémentation",
      questionType: "text",
      options: []
    },
    '39': {
      question: "Évaluez votre niveau de confiance actuel dans la mise en œuvre des compétences vues en formation :",
      shortName: "Niveau de Confiance",
      questionType: "radio-ordered",
      options: [
        "Pas du tout confiant",
        "Légèrement confiant",
        "Modérément confiant",
        "Très confiant",
        "Extrêmement confiant"
      ]
    },
    '40': {
      question: "Dans quels aspects estimez-vous avoir atteint une bonne maîtrise des compétences vues en formation ?",
      shortName: "Domaines de Maîtrise",
      questionType: "checkbox",
      options: [
        "Compréhension des concepts fondamentaux",
        "Application dans différents contextes",
        "Adaptation aux besoins des élèves",
        "Résolution des problèmes connexes",
        "Explication aux collègues",
        "Aucun des éléments ci-dessus",
        "Autre"
      ]
    },
    '41': {
      question: "Si autre, veuillez préciser :",
      shortName: "Domaines de Maîtrise (Autre)",
      questionType: "text",
      options: []
    },
    '42': {
      question: "Quelles preuves avez-vous d'une mise en œuvre réussie ? Veuillez décrire les résultats ou changements observés :",
      shortName: "Preuves de Réussite",
      questionType: "text",
      options: []
    },
    '43': {
      question: "Quel soutien supplémentaire vous aiderait à mettre en œuvre la formation plus efficacement ?",
      shortName: "Soutien Supplémentaire",
      questionType: "checkbox",
      options: [
        "Sessions de formation complémentaires",
        "Coaching par les pairs",
        "Matériels pédagogiques",
        "Opportunités d'observation",
        "Support technique",
        "Temps de planification",
        "Autre"
      ]
    },
    '44': {
      question: "Si autre, veuillez préciser :",
      shortName: "Soutien Supplémentaire (Autre)",
      questionType: "text",
      options: []
    },
    '45': {
      question: "Quelles recommandations feriez-vous pour améliorer la formation ou soutenir la mise en œuvre future ?",
      shortName: "Recommandations",
      questionType: "text",
      options: []
    },
    '46': {
      question: "Évaluez l'impact global de la formation sur votre pratique d'enseignement :",
      shortName: "Impact Global",
      questionType: "radio-ordered",
      options: [
        "Aucun impact",
        "Impact minimal",
        "Impact modéré",
        "Impact significatif",
        "Impact transformateur"
      ]
    },
    '47': {
      question: "Veuillez décrire le changement le plus significatif dans votre pratique d'enseignement résultant de cette formation :",
      shortName: "Changement Significatif",
      questionType: "text",
      options: []
    },
    '48': {
      question: "Y a-t-il autre chose que vous souhaiteriez partager sur votre expérience de mise en œuvre de la formation ?",
      shortName: "Commentaires Additionnels",
      questionType: "text",
      options: []
    }
  },

  en: {
    '0': {
      question: "To what extent are you motivated to participate in this training?",
      shortName: "Motivation",
      questionType: "radio-ordered",
      options: ["Not at all motivated", "Slightly motivated", "Somewhat unmotivated", "Neither motivated nor unmotivated", "Somewhat motivated", "Very motivated", "Extremely motivated"]
    },
    '1': {
      question: "To what extent do you consider technology beneficial to your work?",
      shortName: "Benefits of Technology",
      questionType: "radio-ordered",
      options: ["Not at all beneficial", "Slightly beneficial", "Somewhat not beneficial", "Neither beneficial nor harmful", "Somewhat beneficial", "Very beneficial", "Extremely beneficial"]
    },
    '2': {
      question: "To what extent do others' opinions influence your decision to participate in this training?",
      shortName: "Peer Influence",
      questionType: "radio-ordered",
      options: ["Not influenced at all", "Slightly influenced", "Somewhat not influenced", "Neither influenced nor not influenced", "Somewhat influenced", "Very influenced", "Extremely influenced"]
    },
    '3': {
      question: "To what extent was your enrollment in this training a personal choice rather than an obligation?",
      shortName: "Personal Choice",
      questionType: "radio-ordered",
      options: ["Completely an obligation", "Mostly an obligation", "Somewhat an obligation", "Neither a personal choice nor an obligation", "Somewhat a personal choice", "Mostly a personal choice", "Completely a personal choice"]
    },
    '4': {
      question: "To what extent do you feel capable of using IT technologies to accomplish your tasks?",
      shortName: "Technology Confidence",
      questionType: "radio-ordered",
      options: ["Not capable at all", "Slightly capable", "Somewhat not capable", "Neither capable nor incapable", "Somewhat capable", "Very capable", "Extremely capable"]
    },
    '5': {
      question: "How would you rate the trainer's ability to engage participants?",
      shortName: "Engagement",
      questionType: "radio-ordered",
      options: ["Not engaging at all", "Rarely engaging", "Somewhat not engaging", "Neutral", "Quite engaging", "Generally engaging", "Always engaging"]
    },
    '6': {
      question: "How would you rate the trainer's ability to manage time?",
      shortName: "Time Management",
      questionType: "radio-ordered",
      options: ["Very poor time management", "Poor time management", "Somewhat poor time management", "Average time management", "Good time management", "Very good time management", "Excellent time management"]
    },
    '7': {
      question: "How would you rate the relevance of the trainer's teaching methods?",
      shortName: "Teaching Methods",
      questionType: "radio-ordered",
      options: ["Not relevant at all", "Slightly relevant", "Somewhat not relevant", "Neutral", "Quite relevant", "Very relevant", "Extremely relevant"]
    },
    '8': {
      question: "How would you rate the relevance of the learning environment?",
      shortName: "Environment",
      questionType: "radio-ordered",
      options: ["Not relevant at all", "Slightly relevant", "Somewhat not relevant", "Neutral", "Quite relevant", "Very relevant", "Extremely relevant"]
    },
    '9': {
      question: "How would you rate the relevance of the teaching tools used?",
      shortName: "Tool Suitability",
      questionType: "radio-ordered",
      options: ["Not relevant at all", "Slightly relevant", "Somewhat not relevant", "Neutral", "Quite relevant", "Very relevant", "Extremely relevant"]
    },
    '10': {
      question: "How would you rate the trainer's ability to adapt their teaching methods to suit the audience?",
      shortName: "Pedagogy",
      questionType: "radio-ordered",
      options: ["Not relevant at all", "Slightly relevant", "Somewhat not relevant", "Neutral", "Quite relevant", "Very relevant", "Extremely relevant"]
    },
    '11': {
      question: "How much did you enjoy the training session?",
      shortName: "Perceived Enjoyment",
      questionType: "radio-ordered",
      options: ["Did not enjoy at all", "Slightly enjoyed", "Quite enjoyed", "Neutral", "Very enjoyed", "Extremely enjoyed"]
    },
    '12': {
      question: "How useful did you find the training session?",
      shortName: "Perceived Usefulness",
      questionType: "radio-ordered",
      options: ["Not useful at all", "Slightly useful", "Moderately useful", "Neutral", "Very useful", "Extremely useful"]
    },
    '13': {
      question: "How easy do you find integrating what you've seen into a classroom activity?",
      shortName: "Perceived Ease of Use",
      questionType: "radio-ordered",
      options: ["Not easy at all", "A bit difficult", "Moderately easy", "Neutral", "Quite easy", "Very easy", "Extremely easy"]
    },
    '14': {
      question: "How confident do you feel about integrating what you've seen into a classroom activity?",
      shortName: "Self-Efficacy",
      questionType: "radio-ordered",
      options: ["Not confident at all", "Slightly confident", "Moderately confident", "Neutral", "Very confident", "Extremely confident"]
    },
    '15': {
      question: "To what extent do you intend to use what you've seen to conduct a classroom activity?",
      shortName: "Behavioral Intention",
      questionType: "radio-ordered",
      options: ["Do not intend to integrate at all", "Slight intention to integrate", "Moderate intention to integrate", "Neutral", "Strong intention to integrate", "Very strong intention to integrate", "Absolutely intend to integrate"]
    },

    '16': {
      question: "At what level do you estimate your need for necessary equipment to effectively integrate training resources into your practice?",
      shortName: "Material Resources",
      questionType: "radio-ordered",
      options: ["Very high", "High", "Quite high", "Medium", "Quite low", "Low", "Very low"]
    },
    '17': {
      question: "At what level do you estimate your need for available time to integrate training resources into your practice?",
      shortName: "Time Resources",
      questionType: "radio-ordered",
      options: ["Very high", "High", "Quite high", "Medium", "Quite low", "Low", "Very low"]
    },
    '18': {
      question: "At what level do you estimate your need for support from your hierarchy to integrate training resources into your practice?",
      shortName: "Hierarchical Support",
      questionType: "radio-ordered",
      options: ["Very high", "High", "Quite high", "Medium", "Quite low", "Low", "Very low"]
    },
    '19': {
      question: "At what level do you estimate your need for support from your colleagues to integrate training resources into your practice?",
      shortName: "Peer Support",
      questionType: "radio-ordered",
      options: ["Very high", "High", "Quite high", "Medium", "Quite low", "Low", "Very low"]
    },
    '20': {
      question: "At what level do you estimate your need for technical support to integrate training resources into your practice?",
      shortName: "Technical Support",
      questionType: "radio-ordered",
      options: ["Very high", "High", "Quite high", "Medium", "Quite low", "Low", "Very low"]
    },
    '21': {
      question: "At what level do you estimate your need for mentoring (for example, with a more experienced colleague) to integrate training resources into your practice?",
      shortName: "Mentorship",
      questionType: "radio-ordered",
      options: ["Very high", "High", "Quite high", "Medium", "Quite low", "Low", "Very low"]
    },


    '22': {
      question: "How compatible is the introduced material with your prior teaching practices?",
      shortName: "Compatibility",
      questionType: "radio-ordered",
      options: ["Not compatible at all", "Slightly compatible", "Quite compatible", "Neutral", "Moderately compatible", "Very compatible", "Extremely compatible"]
    },
    '23': {
      question: "How do you find your students progress with the new materials?",
      shortName: "Student Progress",
      questionType: "radio-ordered",
      options: ["Decreased significantly", "Decreased slightly", "Remained the same", "Increased slightly", "Moderately increased", "Increased significantly"]
    },
    '24': {
      question: "How would you rate your sense of self-efficacy in using the new resources?",
      shortName: "Self-Efficacy",
      questionType: "radio-ordered",
      options: ["Not confident at all", "Slightly confident", "Quite confident", "Neutral", "Moderately confident", "Very confident", "Extremely confident"]
    },
    '25': {
      question: "How mentally demanding do you find the implementation of the new resources?",
      shortName: "Cognitive Load",
      questionType: "radio-ordered",
      options: ["Extremely demanding", "Very demanding", "Quite demanding", "Moderately demanding", "Slightly demanding", "Not at all demanding"]
    },
    '26': {
      question: "To what extent do the new resources increase your workload?",
      shortName: "Impact on Workload",
      questionType: "radio-ordered",
      options: ["Massively increased", "Significantly increased", "Quite increased", "Neutral", "Moderately increased", "Slightly increased", "Did not increase at all"]
    },
    '27': {
      question: "How long did it take you to implement the new materials after the training?",
      shortName: "Implementation Time",
      questionType: "radio-ordered",
      options: ["Not yet implemented", "More than 3 months", "Within 3 months", "Within a month", "Within a week", "Immediately"]
    },


    '28': {
      question: "Which age group do you belong to?",
      shortName: "Age",
      questionType: "radio-unordered",
      options: ["Under 10 years", "10-15 years", "16-20 years", "21-25 years", "26-30 years", "31 years and above"]
    },
    '29': {
      question: "What is your main area of specialization or interest?",
      shortName: "Specialization",
      questionType: "radio-unordered",
      options: ["Sciences", "Arts", "Technology", "Mathematics", "Humanities", "Other"]
    },
    '30': {
      question: "Which education level are you currently in?",
      shortName: "Education Level",
      questionType: "radio-unordered",
      options: ["Primary", "Secondary", "Bachelor's (or equivalent)", "Master's/Doctorate (or equivalent)"]
    },
    '31': {
      question: "How often do you use digital tools for learning or leisure?",
      shortName: "Use of Digital Tools",
      questionType: "radio-unordered",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"]
    },
    '32': {
      question: "When did you complete the training?",
      shortName: "Post-training Delay",
      questionType: "radio-unordered",
      options: ["Less than a month", "1-3 months", "3-6 months", "More than 6 months"]
    },
    '33': {
      question: "At which level(s) do you currently teach?",
      shortName: "Teaching Levels",
      questionType: "checkbox",
      options: ["Kindergarten", "Primary (Grades 1-3)", "Primary (Grades 4-5)", "Middle School", "High School", "University"]
    },
    '34': {
      question: "To what extent have you had the opportunity to implement the training concepts?",
      shortName: "Opportunity Level",
      questionType: "radio-ordered",
      options: ["No opportunity", "Limited opportunities", "Moderate opportunities", "Abundant opportunities"]
    },
    '35': {
      question: "How frequently have you implemented what you learned in training?",
      shortName: "Implementation Frequency",
      questionType: "radio-ordered",
      options: [
        "Never",
        "Rarely (1-2 times per month)",
        "Sometimes (1-2 times per week)",
        "Often (3-4 times per week)",
        "Daily"
      ]
    },
    '36': {
      question: "Which aspects of the training have you implemented?",
      shortName: "Implemented Aspects",
      questionType: "checkbox",
      options: [
        "Teaching strategies",
        "Assessment methods",
        "Classroom management techniques",
        "Technology integration",
        "Student engagement techniques",
        "Differentiation strategies",
        "Other"
      ]
    },
    '37': {
      question: "If other, please specify:",
      shortName: "Implemented Aspects (Other)",
      questionType: "text",
      options: []
    },
    '38': {
      question: "Please describe, if applicable, a specific example of implementing the training in your classroom:",
      shortName: "Implementation Example",
      questionType: "text",
      options: []
    },
    '39': {
      question: "Rate your current confidence level in implementing the skills learned in training:",
      shortName: "Confidence Level",
      questionType: "radio-ordered",
      options: [
        "Not at all confident",
        "Slightly confident",
        "Moderately confident",
        "Very confident",
        "Extremely confident"
      ]
    },
    '40': {
      question: "In which aspects do you feel you have achieved good mastery of the skills learned in training?",
      shortName: "Mastery Areas",
      questionType: "checkbox",
      options: [
        "Understanding of core concepts",
        "Application in different contexts",
        "Adapting to student needs",
        "Solving related problems",
        "Explaining to colleagues",
        "None of the above",
        "Other"
      ]
    },
    '41': {
      question: "If other, please specify:",
      shortName: "Mastery Areas (Other)",
      questionType: "text",
      options: []
    },
    '42': {
      question: "What evidence do you have of successful implementation? Please describe observed results or changes:",
      shortName: "Success Evidence",
      questionType: "text",
      options: []
    },
    '43': {
      question: "What additional support would help you implement the training more effectively?",
      shortName: "Additional Support",
      questionType: "checkbox",
      options: [
        "Follow-up training sessions",
        "Peer coaching",
        "Teaching materials",
        "Observation opportunities",
        "Technical support",
        "Planning time",
        "Other"
      ]
    },
    '44': {
      question: "If other, please specify:",
      shortName: "Additional Support (Other)",
      questionType: "text",
      options: []
    },
    '45': {
      question: "What recommendations would you make to improve the training or support future implementation?",
      shortName: "Recommendations",
      questionType: "text",
      options: []
    },
    '46': {
      question: "Rate the overall impact of the training on your teaching practice:",
      shortName: "Overall Impact",
      questionType: "radio-ordered",
      options: [
        "No impact",
        "Minimal impact",
        "Moderate impact",
        "Significant impact",
        "Transformative impact"
      ]
    },
    '47': {
      question: "Please describe the most significant change in your teaching practice resulting from this training:",
      shortName: "Significant Change",
      questionType: "text",
      options: []
    },
    '48': {
      question: "Is there anything else you would like to share about your experience implementing the training?",
      shortName: "Additional Comments",
      questionType: "text",
      options: []
    }
  },
  de: {
    '0': {
      question: "Wie motiviert sind Sie, an dieser Schulung teilzunehmen?",
      shortName: "Motivation",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht motiviert", "Nicht motiviert", "Eher nicht motiviert", "Weder motiviert noch unmotiviert", "Eher motiviert", " Motiviert", "Sehr motiviert"]
    },
    '1': {
      question: "Wie vorteilhaft halten Sie Technologie für Ihre Arbeit?",
      shortName: "Vorteile der Technologie",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht vorteilhaft", "Nicht vorteilhaft", "Eher nicht vorteilhaft", "Weder vorteilhaft noch nachteilig", "Eher vorteilhaft", " Vorteilhaft", "Völlig vorteilhaft"]
    },
    '2': {
      question: "Wie beeinflussen die Meinungen anderer Ihre Entscheidung, an dieser Schulung teilzunehmen?",
      shortName: "Einfluss von Kollegen",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht beeinflusst", "Nicht beeinflusst", "Eher nicht beeinflusst", "Weder beeinflusst noch nicht beeinflusst", "Eher beeinflusst", " Beeinflusst", "Völlig beeinflusst"]
    },
    '3': {
      question: "Inwieweit war Ihre Anmeldung zu dieser Schulung eine persönliche Wahl?",
      shortName: "Persönliche Wahl",
      questionType: "radio-ordered",
      options: ["Vollständig? eine Verpflichtung", "Hauptsächlich/Vorwiegend? eine Verpflichtung", "Eher eine Verpflichtung", "Weder eine persönliche Wahl noch eine Verpflichtung", "Eher eine persönliche Wahl", "Hauptsächlich/Vorwiegend eine persönliche Wahl", "Vollständig eine persönliche Wahl"]
    },
    '4': {
      question: "Inwieweit fühlen Sie sich in der Lage, IT-Technologien zu nutzen, um Ihre Aufgaben zu erledigen?",
      shortName: "Technologievertrauen",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht in der Lage", "Nicht in der Lage", "Eher nicht in der Lage", "Weder in der Lage noch unfähig", "Eher in der Lage", " In der Lage", "Vollkommen in der Lage"]
    },
    '5': {
      question: "Wie bewerten Sie die Fähigkeit des Trainers, die Teilnehmer zu engagieren?",
      shortName: "Engagement",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht engagierend", "Nicht engagierend", "Eher nicht engagierend", "Neutral", "Ziemlich engagierend", " Engagierend", "Immer engagierend"]
    },
    '6': {
      question: "Wie bewerten Sie das Zeitmanagement des Trainers?",
      shortName: "Zeitmanagement",
      questionType: "radio-ordered",
      options: ["Sehr schlechtes Zeitmanagement", "Schlechtes Zeitmanagement", "Eher schlechtes Zeitmanagement", "Durchschnittliches Zeitmanagement", "Gutes Zeitmanagement", "Sehr gutes Zeitmanagement", "Exzellentes Zeitmanagement"]
    },
    '7': {
      question: "Wie relevant sind die Lehrmethoden des Trainers?",
      shortName: "Lehrmethoden",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht relevant", "Nicht relevant", "Eher nicht relevant", "Neutral", "Eher relevant", " Relevant", "Vollkommen relevant"]
    },
    '8': {
      question: "Wie bewerten Sie die Relevanz  der Lernumgebung? «Wie angemessen ist die Lernumgebung?»",
      shortName: "Umgebung",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht relevant", "Nicht relevant", "Eher nicht relevant", "Neutral", "Ziemlich relevant", " Relevant", "Äußerst relevant"]
    },
    '9': {
      question: "Wie bewerten Sie die Relevanz der verwendeten Lehrmittel?",
      shortName: "Werkzeugtauglichkeit",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht relevant", "Nicht relevant", "Eher nicht relevant", "Neutral", "Ziemlich relevant", " Relevant", "Äußerst relevant"]
    },
    '10': {
      question: "Wie bewerten Sie die Fähigkeit des Trainers, seine Lehrmethoden an das Publikum anzupassen?",
      shortName: "Pädagogik",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht relevant", "Wenig relevant", "Eher nicht relevant", "Neutral", "Ziemlich relevant", "Sehr relevant", "Äußerst relevant"]
    },
    '11': {
      question: "Wie sehr haben Sie die Schulungssitzung geschätzt? / Wie sehr hat ihnen die Schulungssitzung gefallen",
      shortName: "Gefallen",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht gefallen", "Nicht gefallen", "Eher nicht gefallen", "Neutral", "Eher gefallen", "Gefallen", "Äußerst gefallen"]
    },
    '12': {
      question: "Wie /hilfreich fanden Sie die Schulungssitzung?",
      shortName: "Nützlichkeit",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht hilfreich", "Nicht hilfreich", "Eher nicht hilfreich", "Neutral", " Eher hilfreich", "Hilfreich", "Äußerst hilfreich"]
    },
    '13': {
      question: "Wie einfach fällt es Ihnen, das Gesehene in eine Aktivität im Unterricht einzubauen?",
      shortName: "Benutzerfreundlichkeit",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht einfach", "Nicht einfach ", "Eher nicht einfach", "Neutral", "Eher einfach", " Einfach", "Sehr einfach"]
    },
    '14': {
      question: "Wie zuversichtlich fühlen Sie sich, das Gesehene in eine Klassenaktivität zu integrieren?",
      shortName: "Selbstwirksamkeit",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht zuversichtlich", "Nicht zuversichtlich", "Eher nicht zuversichtlich", "Neutral", "Eher zuversichtlich", "Zuversichtlich", "Äußerst zuversichtlich"]
    },
    '15': {
      question: "Beabsichtigen Sie, das Gesehene für eine Aktivität in der Klasse zu nutzen?",
      shortName: "Verhaltensabsicht",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht beabsichtigt", "Geringe Absicht", "Eher keine Absicht", "Neutral", "Eher eine Absicht das Geschehene zu nutzen", "Absicht das Geschehene zu nutzen", "Starke Absicht das Geschehene zu nutzen"]
    },
    '16': {
      question: "Wie hoch schätzen Sie Ihren Bedarf an Materialien ein, die Sie benötigen, um die Schulungsressourcen effektiv in Ihre Praxis integrieren zu können??",
      shortName: "Materielle Ressourcen",
      questionType: "radio-ordered",
      options: ["Sehr hoch", "Hoch", "Eher hoch", "Mittel", "Eher niedrig", "Niedrig", "Sehr niedrig"]
    },
    '17': {
      question: "Wie hoch schätzen Sie Ihren Bedarf an verfügbarer Zeit, um die Schulungsressourcen in Ihre Praxis integrieren zu können?",
      shortName: "Zeitressourcen",
      questionType: "radio-ordered",
      options: ["Sehr hoch", "Hoch", "Eher hoch", "Mittel", "Eher niedrig", "Niedrig", "Sehr niedrig"]
    },
    '18': {
      question: "Wie hoch schätzen Sie Ihren Bedarf an Unterstützung durch Ihre Vorgesetzten ein, um die Schulungsressourcen in Ihre Praxis integrieren zu können?",
      shortName: "Hierarchische Unterstützung",
      questionType: "radio-ordered",
      options: ["Sehr hoch", "Hoch", "Eher hoch", "Mittel", "Eher niedrig", "Niedrig", "Sehr niedrig"]
    },
    '19': {
      question: "Wie hoch schätzen Sie Ihren Bedarf an Unterstützung durch Ihre Kollegen, um die Schulungsressourcen in Ihre Praxis zu integrieren?",
      shortName: "Kollegiale Unterstützung",
      questionType: "radio-ordered",
      options: ["Sehr hoch", "Hoch", "Ziemlich hoch", "Mittel", "Ziemlich niedrig", "Niedrig", "Sehr niedrig"]
    },
    '20': {
      question: "Wie hoch schätzen Sie Ihren Bedarf an technischer Unterstützung, um die Schulungsressourcen in Ihre Praxis integrieren zu können?",
      shortName: "Technische Unterstützung",
      questionType: "radio-ordered",
      options: ["Sehr hoch", "Hoch", "eher hoch", "Mittel", "Eher niedrig", "Niedrig", "Sehr niedrig"]
    },
    '21': {
      question: "Wie hoch schätzen Sie Ihren Bedarf an Mentoring (z.B. durch einen erfahreneren Kollegen) ein, um die Schulungsressourcen in Ihre Praxis integrieren zu können?",
      shortName: "Mentoring",
      questionType: "radio-ordered",
      options: ["Sehr hoch", "Hoch", "eher hoch", "Mittel", "Eher niedrig", "Niedrig", "Sehr niedrig"]
    },
    '22': {
      question: "Wie sark ist das eingeführte Material mit Ihrer bisherigen Unterrichtspraxis kompatibel?",
      shortName: "Kompatibilität",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht kompatibel", "Nicht kompatibel", "Eher kompatibel", "Neutral", "Eher kompatibel", " Kompatibel", "Vollkommen kompatibel"]
    },
    '23': {
      question: "Wie beurteilen Sie den Fortschritt Ihrer Schüler mit den neuen Materialien?",
      shortName: "Schülerfortschritt",
      questionType: "radio-ordered",
      options: ["Deutlich abgenommen", "Leicht abgenommen", "Gleich geblieben", "Leicht zugenommen", "Mäßig/moderat zugenommen", "Deutlich zugenommen"]
    },
    '24': {
      question: "Wie würden Sie Ihr Selbstwirksamkeitserleben bei der Nutzung der neuen Ressourcen bewerten?",
      shortName: "Selbstwirksamkeit",
      questionType: "radio-ordered",
      options: ["Überhaupt nicht zuversichtlich", "Nicht zuversichtlich", "Eher nicht zuversichtlich", "Neutral", "Eher zuversichtlich", " Zuversichtlich", "Äußerst zuversichtlich"]
    },
    '25': {
      question: "Wie geistig anspruchsvoll finden Sie die Umsetzung der neuen Ressourcen?",
      shortName: "Kognitive Belastung",
      questionType: "radio-ordered",
      options: ["Extrem anspruchsvoll", "Sehr anspruchsvoll", "Ziemlich anspruchsvoll", "Mäßig anspruchsvoll", "Leicht anspruchsvoll", "Überhaupt nicht anspruchsvoll"]
    },
    '26': {
      question: "Inwieweit erhöhen die neuen Ressourcen Ihre Arbeitsbelastung?",
      shortName: "Auswirkung auf die Arbeitsbelastung",
      questionType: "radio-ordered",
      options: ["Massiv erhöht", "Deutlich erhöht", "Ziemlich erhöht", "Neutral", "Mäßig erhöht", "Leicht erhöht", "Überhaupt nicht erhöht"]
    },
    '27': {
      question: "Wie lange hat es gedauert, bis Sie die neuen Materialien nach der Schulung eingesetzt haben?",
      shortName: "Umsetzungszeit",
      questionType: "radio-ordered",
      options: ["Noch nicht umgesetzt", "Mehr als 3 Monate", "Innerhalb von 3 Monaten", "Innerhalb eines Monats", "Innerhalb einer Woche", "Sofort"]
    },
    '28': {
      question: "Welche Altersgruppe gehören Sie an?",
      shortName: "Alter",
      questionType: "radio-unordered",
      options: ["Unter 10 Jahren", "10-15 Jahre", "16-20 Jahre", "21-25 Jahre", "26-30 Jahre", "31 Jahre und älter"]
    },
    '29': {
      question: "Was ist Ihr Hauptfachgebiet oder Interessengebiet?",
      shortName: "Spezialisierung",
      questionType: "radio-unordered",
      options: ["Naturwissenschaften", "Künste", "Technologie", "Mathematik", "Geisteswissenschaften", "Andere"]
    },
    '30': {
      question: "Welches ist ihr aktueller Bildungsstand?",
      shortName: "Bildungsniveau",
      questionType: "radio-unordered",
      options: ["Grundschule", "Sekundarschule", "Bachelor (oder gleichwertig)", "Master/Doktorat (oder gleichwertig)"]
    },
    '31': {
      question: "Wie oft nutzen Sie digitale Hilfsmittel zum Lernen oder zur Unterhaltung?",
      shortName: "Nutzung digitaler Werkzeuge",
      questionType: "radio-unordered",
      options: ["Nie", "Selten", "Manchmal", "Oft", "Immer"]
    },
    '32': {
      question: "Wann haben Sie die Fortbildung abgeschlossen?",
      shortName: "Zeit nach Fortbildung",
      questionType: "radio-unordered",
      options: ["Weniger als einen Monat", "1-3 Monate", "3-6 Monate", "Mehr als 6 Monate"]
    },
    '33': {
      question: "In welcher/n Schulstufe(n) unterrichten Sie derzeit?",
      shortName: "Unterrichtsstufen",
      questionType: "checkbox",
      options: ["Kindergarten", "Grundschule (1.-3. Klasse)", "Grundschule (4.-5. Klasse)", "Mittelstufe ", "Gymnasium", "Universität"]
    },
    '34': {
      question: "Inwieweit hatten Sie die Möglichkeit, die Fortbildungsinhalte umzusetzen?",
      shortName: "Umsetzungsmöglichkeiten",
      questionType: "radio-ordered",
      options: ["Keine Möglichkeit", "Begrenzte Möglichkeiten", "Einige Möglichkeiten", "Reichliche Möglichkeiten"]
    },
    '35': {
      question: "Wie häufig haben Sie die Fortbildungsinhalte umgesetzt?",
      shortName: "Umsetzungshäufigkeit",
      questionType: "radio-ordered",
      options: [
        "Nie",
        "Selten (1-2 mal pro Monat)",
        "Manchmal (1-2 mal pro Woche)",
        "Oft (3-4 mal pro Woche)",
        "Täglich"
      ]
    },
    '36': {
      question: "Welche Aspekte der Fortbildung haben Sie umgesetzt?",
      shortName: "Umgesetzte Aspekte",
      questionType: "checkbox",
      options: [
        "Unterrichtsstrategien",
        "Bewertungsmethoden",
        "Klassenführungstechniken",
        "Technologieintegration",
        "Techniken zur Schülermotivation",
        "Differenzierungsstrategien",
        "Sonstiges"
      ]
    },
    '37': {
      question: "Falls Sonstiges, bitte spezifizieren:",
      shortName: "Umgesetzte Aspekte (Sonstiges)",
      questionType: "text",
      options: []
    },
    '38': {
      question: "Bitte beschreiben Sie gegebenenfalls ein konkretes Beispiel für die Umsetzung der Fortbildung in Ihrem Unterricht:",
      shortName: "Umsetzungsbeispiel",
      questionType: "text",
      options: []
    },
    '39': {
      question: "Wie schätzen Sie Ihr aktuelles Selbstvertrauen bei der Umsetzung der erlernten Fähigkeiten ein?",
      shortName: "Selbstvertrauen",
      questionType: "radio-ordered",
      options: [
        "Gar nicht selbstsicher",
        "Etwas selbstsicher",
        "Mäßig? selbstsicher",
        "Sehr selbstsicher",
        "Extrem selbstsicher"
      ]
    },
    '40': {
      question: " In welchen Bereichen glauben Sie, dass Sie die in der Ausbildung besprochenen Kompetenzen gut beherrschen? ",
      shortName: "Beherrschte Bereiche",
      questionType: "checkbox",
      options: [
        "Verständnis der Kernkonzepte",
        "Anwendung in verschiedenen Kontexten",
        "Anpassung an Schülerbedürfnisse",
        "Lösung verwandter Probleme",
        "Erläuterungen für Kollegen",
        "Keine der genannten Optionen",
        "Sonstiges"
      ]
    },
    '41': {
      question: "Falls Sonstiges, bitte spezifizieren:",
      shortName: "Beherrschte Bereiche (Sonstiges)",
      questionType: "text",
      options: []
    },
    '42': {
      question: " Welche Beweise haben Sie für eine erfolgreiche Umsetzung? Bitte beschreiben Sie beobachtete Ergebnisse oder Veränderungen:",
      shortName: "Erfolgsnachweise",
      questionType: "text",
      options: []
    },
    '43': {
      question: "Welche zusätzliche Unterstützung würde Ihnen helfen, die Fortbildung effektiver umzusetzen?",
      shortName: "Zusätzliche Unterstützung",
      questionType: "checkbox",
      options: [
        "Nachfolgende/Ergänzende Fortbildungssitzungen",
        "Peer-Coaching",
        "Unterrichtsmaterialien",
        "Hospitationsmöglichkeiten",
        "Technische Unterstützung",
        "Planungszeit",
        "Sonstiges"
      ]
    },
    '44': {
      question: "Falls Sonstiges, bitte spezifizieren:",
      shortName: "Zusätzliche Unterstützung (Sonstiges)",
      questionType: "text",
      options: []
    },
    '45': {
      question: "Welche Empfehlungen würden Sie zur Verbesserung der Fortbildung oder zur Unterstützung zukünftiger Umsetzungen geben?",
      shortName: "Empfehlungen",
      questionType: "text",
      options: []
    },
    '46': {
      question: "Wie bewerten Sie den Gesamteinfluss der Fortbildung auf Ihre Unterrichtspraxis?",
      shortName: "Gesamteinfluss",
      questionType: "radio-ordered",
      options: [
        "Kein Einfluss",
        "Minimaler Einfluss",
        "Moderater Einfluss",
        "Bedeutender Einfluss",
        "Transformativer Einfluss"
      ]
    },
    '47': {
      question: "Bitte beschreiben Sie die wichtigste Veränderung in Ihrer Unterrichtspraxis, die sich aus dieser Fortbildung ergeben hat:",
      shortName: "Wichtigste Veränderung",
      questionType: "text",
      options: []
    },
    '48': {
      question: "Gibt es noch etwas, das Sie über Ihre Erfahrungen bei der Umsetzung der Fortbildung mitteilen möchten?",
      shortName: "Zusätzliche Kommentare",
      questionType: "text",
      options: []
    }
  },
  es: {
    '0': {
      question: "¿En qué medida estás motivado-a para participar en esta formación?",
      shortName: "Motivación",
      questionType: "radio-ordered",
      options: ["Nada motivado-a", "Poco motivado-a", "Algo desmotivado-a", "Ni motivado-a ni desmotivado-a", "Más bien motivado-a", "Muy motivado-a", "Totalmente motivado-a"]
    },
    '1': {
      question: "¿En qué medida consideras que la tecnología es beneficiosa para tu trabajo?",
      shortName: "Beneficios de la tecnología",
      questionType: "radio-ordered",
      options: ["Nada beneficiosa", "Muy poco beneficiosa", "Poco beneficiosa", "Ni beneficiosa ni perjudicial", "Más bien beneficiosa", "Muy beneficiosa", "Totalmente beneficiosa"]
    },
    '2': {
      question: "¿En qué medida influyen las opiniones de los demás en tu decisión de participar en esta formación?",
      shortName: "Influencia de las compañeras y los compañeros",
      questionType: "radio-ordered",
      options: ["Nada influido-a", "Muy poco influido-a", "Poco influido-a", "Ni influido-a ni no influido-a", "Algo influido-a", "Muy influido-a", "Totalmente influido-a"]
    },
    '3': {
      question: "¿Hasta qué punto tu inscripción en esta formación fue más una elección personal que una obligación?",
      shortName: "Elección Personal",
      questionType: "radio-ordered",
      options: ["Completamente una obligación", "Principalmente una obligación", "Más bien una obligación", "Ni elección personal ni obligación", "Más bien una elección personal", "Principalmente una elección personal", "Completamente una elección personal"]
    },
    '4': {
      question: "¿Hasta qué punto te sientes capaz de utilizar tecnologías digitales para realizar tus tareas?",
      shortName: "Confianza Tecnológica",
      questionType: "radio-ordered",
      options: ["Nada capaz", "Muy poco capaz", "Poco incapaz", "Ni capaz ni incapaz", "Bastante capaz", "Capaz", "Totalmente capaz"]
    },

    '5': {
      question: "¿Cómo evaluarías la capacidad de la persona formadora/docente para motivar a las/los participantes?",
      shortName: "Implicación",
      questionType: "radio-ordered",
      options: ["Nada motivadora", "Muy poco motivadora", "Poco motivadora", "Ni motivadora ni no motivadora", "Bastante motivadora", "Generalmente motivadora", "Siempre motivadora"]
    },
    '6': {
      question: "¿Cómo evaluarías la capacidad de la persona formadora/docente para gestionar el tiempo??",
      shortName: "Gestión del tiempo",
      questionType: "radio-ordered",
      options: ["Muy mala gestion del tiempo", "Mala gestion del tiempo", "No buena gestion del tiempo", "Ni buena ni mala gestion del tiempo", "Buena gestion del tiempo", "Muy buena gestion del tiempo", "Excelente gestion del tiempo"]
    },
    '7': {
      question: "¿Cómo evaluarías la pertinencia de los métodos de enseñanza de la persona formadora/docente?",
      shortName: "Métodos de enseñanza",
      questionType: "radio-ordered",
      options: ["Nada pertinente", "Muy pertinente", "Poco pertinente", "Medianamente pertinente", "Más bien pertinente", "Pertinente", "Totalmente pertinente"]
    },
    '8': {
      question: "¿Cómo evaluarías la pertinencia del entorno de aprendizaje? ​",
      shortName: "Entorno",
      questionType: "radio-ordered",
      options: ["Nada pertinente", "Muy pertinente", "Poco pertinente", "Medianamente pertinente", "Más bien pertinente", "Pertinente", "Totalmente pertinente"]
    },
    '9': {
      question: "¿Cómo evaluarías la pertinencia de las herramientas pedagógicas utilizadas?",
      shortName: "Pertinencia de las herramientas",
      questionType: "radio-ordered",
      options: ["Nada pertinente", "Muy pertinente", "Poco pertinente", "Medianamente pertinente", "Más bien pertinente", "Pertinente", "Totalmente pertinente"]
    },
    '10': {
      question: "¿Cómo evaluaría la capacidad la persona formadora/docente para adaptar sus métodos de enseñanza al público?",
      shortName: "Pedagogía",
      questionType: "radio-ordered",
      options: ["Muy mala capacidad", "Mala capacidad", "No buena capacidad", "Ni buena ni mala capacidad", "Buena capacidad", "Muy buena capacidad", "Excelente capacidad"]
    },
    '11': {
      question: "¿En qué medida ha disfrutado de la sesión de formación?",
      shortName: "Disfrute percibido",
      questionType: "radio-ordered",
      options: ["Nada disfrutado", "Muy poco disfrutado", "Poco disfrutado", "Ni disfrutado ni no disfrutado", "Más bien disfrutado", "Disfrutado", "Totalmente disfrutado"]
    },
    '12': {
      question: "¿Hasta qué punto encontraste útil la sesión de formación?",
      shortName: "Utilidad Percibida",
      questionType: "radio-ordered",
      options: ["Nada útil", "Muy poco útil", "Poco útil", "Ni útil ni inútil", "Más bien útil", "Útil", "Totalmente útil"]
    },
    '13': {
      question: "¿Hasta qué punto te resulta fácil integrar lo aprendido en una actividad de aula?",
      shortName: "Facilidad de Uso",
      questionType: "radio-ordered",
      options: ["Nada fácil", "Muy poco fácil", "Poco fácil", "Ni fácil ni difícil", "Más bien fácil", "Fácil", "Totalmente fácil"]
    },
    '14': {
      question: "¿Cómo valorarías tu nivel de confianza para aplicar lo aprendido en una actividad en clase??",
      shortName: "Autoeficacia",
      questionType: "radio-ordered",
      options: ["Nada confiado-a", "Muy poco confiado-a", "Poco confiado-a", "Ni confiado-a ni no confiado-a", "Más bien confiado-a", "Confiado-a", "Totalmente confiado-a"]
    },
    '15': {
      question: "¿Hasta qué punto tienes la intención de utilizar lo aprendido para llevar a cabo una actividad de aula?",
      shortName: "Intención Comportamental",
      questionType: "radio-ordered",
      options: ["Ninguna intención de integrar", "Muy poca intención de integrar", "Poca intención de integrar", "Ni mucha ni poca intención", "Algo de intención de integrar", "Intención de integrar", "Mucha intención de integrar"]
    },
    '16': {
      question: "¿En qué medida estimas tu necesidad de recursos materiales para integrar eficazmente las herramientas de formación en tu práctica?",
      shortName: "Recursos Materiales",
      questionType: "radio-ordered",
      options: ["Muy alta", "Alta", "Bastante alta", "Media", "Bastante baja", "Baja", "Muy baja"]
    },
    '17': {
      question: "¿En qué medida estimas tu necesidad de tiempo disponible para integrar los recursos de formación en tu práctica?",
      shortName: "Recursos temporales",
      questionType: "radio-ordered",
      options: ["Muy alta", "Alta", "Bastante alta", "Media", "Bastante baja", "Baja", "Muy baja"]
    },
    '18': {
      question: "¿En qué medida estimas tu necesidad de apoyo por parte de su jerarquía para integrar los recursos de formación en tu práctica?",
      shortName: "Apoyo jerárquico",
      questionType: "radio-ordered",
      options: ["Muy alta", "Alta", "Bastante alta", "Media", "Bastante baja", "Baja", "Muy baja"]
    },
    '19': {
      question: "¿En qué medida estimas tu necesidad de apoyo institucional para integrar eficazmente las herramientas de formación en tu práctica?",
      shortName: "Apoyo Institucional",
      questionType: "radio-ordered",
      options: ["Muy alta", "Alta", "Bastante alta", "Media", "Bastante baja", "Baja", "Muy baja"]
    },
    '20': {
      question: "¿En qué medida estimas tu necesidad de apoyo por parte de tus colegas para integrar eficazmente las herramientas de formación en tu práctica?",
      shortName: "Apoyo Técnico",
      questionType: "radio-ordered",
      options: ["Muy alta", "Alta", "Bastante alta", "Media", "Bastante baja", "Baja", "Muy baja"]
    },
    '21': {
      question: "¿En qué medida necesitas mentoría (por ejemplo, de un colega más experimentado) para integrar los recursos de formación en tu práctica?",
      shortName: "Mentoría",
      questionType: "radio-ordered",
      options: ["Muy alta", "Alta", "Bastante alta", "Media", "Bastante baja", "Baja", "Muy baja"]
    },
    '22': {
      question: "¿Hasta qué punto el material introducido es compatible con tus prácticas de enseñanza anteriores?",
      shortName: "Compatibilidad",
      questionType: "radio-ordered",
      options: ["Nada compatible", "Muy poco compatible", "Poco compatible", "Ni compatible ni incompatible", "Más bien compatible", "Compatible", "Totalmente compatible"]
    },
    '23': {
      question: "¿Cómo percibes la progresión de tu alumnado con los nuevos materiales?",
      shortName: "Progresión del Alumnado",
      questionType: "radio-ordered",
      options: ["Disminución significativa", "Disminución ligera", "Se mantiene igual", "Ligero aumento", "Aumento moderado", "Aumento significativo"]
    },
    '24': {
      question: "¿Cómo evaluarías tu sensación de autoeficacia al utilizar los nuevos recursos?",
      shortName: "Autoeficacia",
      questionType: "radio-ordered",
      options: ["Nada confiado-a", "Muy poco confiado-a", "Poco confiado-a", "Ni confiado-a ni no confiado-a", "Más bien confiado-a", "Confiado-a", "Totalmente confiado-a"]
    },
    '25': {
      question: "¿Hasta qué punto encuentras mentalmente exigente la implementación de los nuevos recursos?",
      shortName: "Carga Cognitiva",
      questionType: "radio-ordered",
      options: ["Extremadamente exigente", "Muy exigente", "Bastante exigente", "Moderadamente exigente", "Ligeramente exigente", "Nada exigente"]
    },
    '26': {
      question: "¿Hasta qué punto las nuevas herramientas aumentan tu carga de trabajo?",
      shortName: "Impacto en la Carga de Trabajo",
      questionType: "radio-ordered",
      options: ["Aumento masivo", "Aumento significativo", "Aumento considerable", "Neutro", "Aumento moderado", "Aumento ligero", "Ningún aumento"]
    },
    '27': {
      question: "¿Cuánto tiempo te llevó implementar los nuevos materiales después de la formación?",
      shortName: "Tiempo de Implementación",
      questionType: "radio-ordered",
      options: ["Aún no implementado", "Más de 3 meses", "No más de 3 meses", "No más de un mes", "No más de una semana", "Inmediatamente"]
    },
    '28': {
      question: "¿A qué grupo de edad perteneces?",
      shortName: "Edad",
      questionType: "radio-unordered",
      options: ["Menos de 10 años", "10-15 años", "16-20 años", "21-25 años", "26-30 años", "31 años o más"]
    },
    '29': {
      question: "¿Cuál es tu principal área de especialización o interés?",
      shortName: "Especialización",
      questionType: "radio-unordered",
      options: ["Ciencias", "Artes", "Tecnología", "Matemáticas", "Humanidades", "Otro"]
    },
    '30': {
      question: "¿En qué nivel educativo te encuentras actualmente?",
      shortName: "Nivel Educativo",
      questionType: "radio-unordered",
      options: ["Primaria", "Secundaria", "Licenciatura (o equivalente)", "Máster/Doctorado (o equivalente)"]
    },
    '31': {
      question: "¿Con qué frecuencia utilizas herramientas digitales para aprender o para el entretenimiento?",
      shortName: "Uso de Herramientas Digitales",
      questionType: "radio-unordered",
      options: ["Nunca", "Raramente", "A veces", "A menudo", "Siempre"]
    },
    '32': {
      question: "¿Cuándo finalizaste la formación?",
      shortName: "Plazo Post-formación",
      questionType: "radio-unordered",
      options: ["Menos de un mes", "1-3 meses", "3-6 meses", "Más de 6 meses"]
    },
    '33': {
      question: "¿En qué nivel(es) enseñas actualmente?",
      shortName: "Niveles de Enseñanza",
      questionType: "checkbox",
      options: ["Educación Infantil", "Primaria (1.º-3.º)", "Primaria (4.º-5.º)", "Secundaria (ESO)", "Bachillerato", "Universidad"]
    },
    '34': {
      question: "¿En qué medida has tenido la oportunidad de aplicar los conceptos de la formación?",
      shortName: "Nivel de Oportunidad",
      questionType: "radio-ordered",
      options: ["Ninguna oportunidad", "Oportunidades limitadas", "Oportunidades moderadas", "Oportunidades abundantes"]
    },

    '35': {
      question: "¿Con qué frecuencia has implementado lo aprendido en la formación?",
      shortName: "Frecuencia de Implementación",
      questionType: "radio-ordered",
      options: [
        "Nunca",
        "Raramente (1-2 veces al mes)",
        "A veces (1-2 veces por semana)",
        "A menudo (3-4 veces por semana)",
        "Diariamente"
      ]
    },
    '36': {
      question: "¿Qué aspectos de la formación has implementado?",
      shortName: "Aspectos Implementados",
      questionType: "checkbox",
      options: [
        "Estrategias de enseñanza",
        "Métodos de evaluación",
        "Técnicas de gestión del aula",
        "Integración tecnológica",
        "Técnicas de participación del alumnado",
        "Estrategias de diferenciación",
        "Otro"
      ]
    },
    '37': {
      question: "Si seleccionaste 'Otro', por favor especifica:",
      shortName: "Aspectos Implementados (Otro)",
      questionType: "text",
      options: []
    },
    '38': {
      question: "Describe, si es posible, un ejemplo específico de implementación de la formación en tu aula:",
      shortName: "Ejemplo de Implementación",
      questionType: "text",
      options: []
    },
    '39': {
      question: "Evalúa tu nivel actual de confianza en la implementación de las competencias aprendidas en la formación:",
      shortName: "Nivel de Confianza",
      questionType: "radio-ordered",
      options: [
        "Nada confiado-a",
        "Ligeramente confiado-a",
        "Moderadamente confiado-a",
        "Muy confiado",
        "Extremadamente confiado-a"
      ]
    },

    '40': {
      question: "¿En qué aspectos consideras que has alcanzado un buen dominio de las competencias aprendidas en la formación?",
      shortName: "Áreas de Dominio",
      questionType: "checkbox",
      options: [
        "Comprensión de los conceptos fundamentales",
        "Aplicación en diferentes contextos",
        "Adaptación a las necesidades del alumnado",
        "Resolución de problemas relacionados",
        "Explicación a colegas",
        "Ninguno de los anteriores",
        "Otro"
      ]
    },
    '41': {
      question: "Si seleccionaste 'Otro', por favor especifica:",
      shortName: "Áreas de Dominio (Otro)",
      questionType: "text",
      options: []
    },
    '42': {
      question: "¿Qué evidencias tienes de una implementación exitosa? Describe los resultados o cambios observados:",
      shortName: "Evidencias de Éxito",
      questionType: "text",
      options: []
    },
    '43': {
      question: "¿Qué apoyo adicional te ayudaría a implementar la formación de manera más eficaz?",
      shortName: "Apoyo Adicional",
      questionType: "checkbox",
      options: [
        "Sesiones de formación complementarias",
        "Coaching entre pares",
        "Materiales pedagógicos",
        "Oportunidades de observación",
        "Soporte técnico",
        "Tiempo de planificación",
        "Otro"
      ]
    },
    '44': {
      question: "Si seleccionaste 'Otro', por favor especifica:",
      shortName: "Apoyo Adicional (Otro)",
      questionType: "text",
      options: []
    },
    '45': {
      question: "¿Qué recomendaciones harías para mejorar la formación o apoyar su implementación futura?",
      shortName: "Recomendaciones",
      questionType: "text",
      options: []
    },
    '46': {
      question: "Evalúa el impacto global de la formación en tu práctica de enseñanza:",
      shortName: "Impacto Global",
      questionType: "radio-ordered",
      options: [
        "Sin impacto",
        "Impacto mínimo",
        "Impacto moderado",
        "Impacto significativo",
        "Impacto transformador"
      ]
    },
    '47': {
      question: "Describe el cambio más significativo en tu práctica de enseñanza como resultado de esta formación:",
      shortName: "Cambio Significativo",
      questionType: "text",
      options: []
    },
    '48': {
      question: "¿Hay algo más que quisieras compartir sobre tu experiencia de implementación de la formación?",
      shortName: "Comentarios Adicionales",
      questionType: "text",
      options: []
    }
  },
  it: {
    '0': {
      question: "In che misura sei motivato/a a partecipare a questa formazione?",
      shortName: "Motivazione",
      questionType: "radio-ordered",
      options: ["Per niente motivato/a", "Leggermente motivato/a", "Abbastanza demotivato/a", "Né motivato/a né demotivato/a", "Abbastanza motivato/a", "Molto motivato/a", "Estremamente motivato/a"]
    },
    '1': {
      question: "In che misura ritieni che la tecnologia sia benefica per il tuo lavoro?",
      shortName: "Benefici della Tecnologia",
      questionType: "radio-ordered",
      options: ["Per niente benefica", "Leggermente benefica", "Abbastanza non benefica", "Né benefica né dannosa", "Abbastanza benefica", "Molto benefica", "Estremamente benefica"]
    },
    '2': {
      question: "In che misura le opinioni degli altri influenzano la tua decisione di partecipare a questa formazione?",
      shortName: "Influenza dei Pari",
      questionType: "radio-ordered",
      options: ["Per niente influenzato/a", "Leggermente influenzato/a", "Abbastanza non influenzato/a", "Né influenzato/a né non influenzato/a", "Abbastanza influenzato/a", "Molto influenzato/a", "Estremamente influenzato/a"]
    },
    '3': {
      question: "In che misura la tua iscrizione a questa formazione è stata una scelta personale piuttosto che un obbligo?",
      shortName: "Scelta Personale",
      questionType: "radio-ordered",
      options: ["Completamente un obbligo", "Principalmente un obbligo", "Abbastanza un obbligo", "Né una scelta personale né un obbligo", "Abbastanza una scelta personale", "Principalmente una scelta personale", "Completamente una scelta personale"]
    },
    '4': {
      question: "In che misura ti senti capace di utilizzare le tecnologie informatiche per svolgere i tuoi compiti?",
      shortName: "Fiducia nella Tecnologia",
      questionType: "radio-ordered",
      options: ["Per niente capace", "Leggermente capace", "Abbastanza non capace", "Né capace né incapace", "Abbastanza capace", "Molto capace", "Estremamente capace"]
    },
    '5': {
      question: "Come valuteresti la capacità del formatore di coinvolgere i partecipanti?",
      shortName: "Coinvolgimento",
      questionType: "radio-ordered",
      options: ["Per niente coinvolgente", "Raramente coinvolgente", "Abbastanza non coinvolgente", "Neutrale", "Abbastanza coinvolgente", "Generalmente coinvolgente", "Sempre coinvolgente"]
    },
    '6': {
      question: "Come valuteresti la capacità del formatore di gestire il tempo?",
      shortName: "Gestione del Tempo",
      questionType: "radio-ordered",
      options: ["Gestione del tempo molto scarsa", "Gestione del tempo scarsa", "Gestione del tempo abbastanza scarsa", "Gestione del tempo media", "Buona gestione del tempo", "Gestione del tempo molto buona", "Eccellente gestione del tempo"]
    },
    '7': {
      question: "Come valuteresti la pertinenza dei metodi di insegnamento del formatore?",
      shortName: "Metodi di Insegnamento",
      questionType: "radio-ordered",
      options: ["Per niente pertinenti", "Leggermente pertinenti", "Abbastanza non pertinenti", "Neutrale", "Abbastanza pertinenti", "Molto pertinenti", "Estremamente pertinenti"]
    },
    '8': {
      question: "Come valuteresti la pertinenza dell'ambiente di apprendimento?",
      shortName: "Ambiente",
      questionType: "radio-ordered",
      options: ["Per niente pertinente", "Leggermente pertinente", "Abbastanza non pertinente", "Neutrale", "Abbastanza pertinente", "Molto pertinente", "Estremamente pertinente"]
    },
    '9': {
      question: "Come valuteresti la pertinenza degli strumenti didattici utilizzati?",
      shortName: "Adeguatezza degli Strumenti",
      questionType: "radio-ordered",
      options: ["Per niente pertinenti", "Leggermente pertinenti", "Abbastanza non pertinenti", "Neutrale", "Abbastanza pertinenti", "Molto pertinenti", "Estremamente pertinenti"]
    },
    '10': {
      question: "Come valuteresti la capacità del formatore di adattare i propri metodi di insegnamento al pubblico?",
      shortName: "Pedagogia",
      questionType: "radio-ordered",
      options: ["Per niente pertinente", "Leggermente pertinente", "Abbastanza non pertinente", "Neutrale", "Abbastanza pertinente", "Molto pertinente", "Estremamente pertinente"]
    },
    '11': {
      question: "Quanto ti è piaciuta la sessione di formazione?",
      shortName: "Grado di Godimento",
      questionType: "radio-ordered",
      options: ["Per niente piacevole", "Leggermente piacevole", "Abbastanza piacevole", "Neutrale", "Molto piacevole", "Estremamente piacevole"]
    },
    '12': {
      question: "Quanto hai trovato utile la sessione di formazione?",
      shortName: "Utilità Percepita",
      questionType: "radio-ordered",
      options: ["Per niente utile", "Leggermente utile", "Moderatamente utile", "Neutrale", "Molto utile", "Estremamente utile"]
    },
    '13': {
      question: "Quanto trovi facile integrare ciò che hai visto in un'attività in classe?",
      shortName: "Facilità d'Uso Percepita",
      questionType: "radio-ordered",
      options: ["Per niente facile", "Un po' difficile", "Moderatamente facile", "Neutrale", "Abbastanza facile", "Molto facile", "Estremamente facile"]
    },
    '14': {
      question: "Quanto ti senti sicuro/a nell'integrare ciò che hai visto in un'attività in classe?",
      shortName: "Autoefficacia",
      questionType: "radio-ordered",
      options: ["Per niente sicuro/a", "Leggermente sicuro/a", "Moderatamente sicuro/a", "Neutrale", "Molto sicuro/a", "Estremamente sicuro/a"]
    },
    '15': {
      question: "In che misura intendi utilizzare ciò che hai visto per condurre un'attività in classe?",
      shortName: "Intenzione Comportamentale",
      questionType: "radio-ordered",
      options: ["Non intendo affatto integrare", "Leggera intenzione di integrare", "Moderata intenzione di integrare", "Neutrale", "Forte intenzione di integrare", "Intenzione molto forte di integrare", "Intendo assolutamente integrare"]
    },
    '16': {
      question: "A quale livello stimi il tuo bisogno di attrezzature necessarie per integrare efficacemente le risorse della formazione nella tua pratica?",
      shortName: "Risorse Materiali",
      questionType: "radio-ordered",
      options: ["Molto alto", "Alto", "Abbastanza alto", "Medio", "Abbastanza basso", "Basso", "Molto basso"]
    },
    '17': {
      question: "A quale livello stimi il tuo bisogno di tempo disponibile per integrare le risorse della formazione nella tua pratica?",
      shortName: "Risorse Temporali",
      questionType: "radio-ordered",
      options: ["Molto alto", "Alto", "Abbastanza alto", "Medio", "Abbastanza basso", "Basso", "Molto basso"]
    },
    '18': {
      question: "A quale livello stimi il tuo bisogno di supporto da parte della tua gerarchia per integrare le risorse della formazione nella tua pratica?",
      shortName: "Supporto Gerarchico",
      questionType: "radio-ordered",
      options: ["Molto alto", "Alto", "Abbastanza alto", "Medio", "Abbastanza basso", "Basso", "Molto basso"]
    },
    '19': {
      question: "A quale livello stimi il tuo bisogno di supporto da parte dei tuoi colleghi per integrare le risorse della formazione nella tua pratica?",
      shortName: "Supporto dei Pari",
      questionType: "radio-ordered",
      options: ["Molto alto", "Alto", "Abbastanza alto", "Medio", "Abbastanza basso", "Basso", "Molto basso"]
    },
    '20': {
      question: "A quale livello stimi il tuo bisogno di supporto tecnico per integrare le risorse della formazione nella tua pratica?",
      shortName: "Supporto Tecnico",
      questionType: "radio-ordered",
      options: ["Molto alto", "Alto", "Abbastanza alto", "Medio", "Abbastanza basso", "Basso", "Molto basso"]
    },
    '21': {
      question: "A quale livello stimi il tuo bisogno di mentoring (ad esempio, con un collega più esperto) per integrare le risorse della formazione nella tua pratica?",
      shortName: "Mentorato",
      questionType: "radio-ordered",
      options: ["Molto alto", "Alto", "Abbastanza alto", "Medio", "Abbastanza basso", "Basso", "Molto basso"]
    },
    '22': {
      question: "Quanto è compatibile il materiale introdotto con le tue precedenti pratiche di insegnamento?",
      shortName: "Compatibilità",
      questionType: "radio-ordered",
      options: ["Per niente compatibile", "Leggermente compatibile", "Abbastanza compatibile", "Neutrale", "Moderatamente compatibile", "Molto compatibile", "Estremamente compatibile"]
    },
    '23': {
      question: "Come trovi i progressi dei tuoi studenti con i nuovi materiali?",
      shortName: "Progresso degli Studenti",
      questionType: "radio-ordered",
      options: ["Diminuito significativamente", "Diminuito leggermente", "Rimasto uguale", "Aumentato leggermente", "Moderatamente aumentato", "Aumentato significativamente"]
    },
    '24': {
      question: "Come valuteresti il tuo senso di autoefficacia nell'utilizzare le nuove risorse?",
      shortName: "Autoefficacia",
      questionType: "radio-ordered",
      options: ["Per niente sicuro/a", "Leggermente sicuro/a", "Abbastanza sicuro/a", "Neutrale", "Moderatamente sicuro/a", "Molto sicuro/a", "Estremamente sicuro/a"]
    },
    '25': {
      question: "Quanto mentalmente impegnativa trovi l'implementazione delle nuove risorse?",
      shortName: "Carico Cognitivo",
      questionType: "radio-ordered",
      options: ["Estremamente impegnativa", "Molto impegnativa", "Abbastanza impegnativa", "Moderatamente impegnativa", "Leggermente impegnativa", "Per niente impegnativa"]
    },
    '26': {
      question: "In che misura le nuove risorse aumentano il tuo carico di lavoro?",
      shortName: "Impatto sul Carico di Lavoro",
      questionType: "radio-ordered",
      options: ["Aumentato massicciamente", "Aumentato significativamente", "Abbastanza aumentato", "Neutrale", "Moderatamente aumentato", "Leggermente aumentato", "Non aumentato affatto"]
    },
    '27': {
      question: "Quanto tempo ci è voluto per implementare i nuovi materiali dopo la formazione?",
      shortName: "Tempo di Implementazione",
      questionType: "radio-ordered",
      options: ["Non ancora implementato", "Più di 3 mesi", "Entro 3 mesi", "Entro un mese", "Entro una settimana", "Immediatamente"]
    },
    '28': {
      question: "A quale fascia d'età appartieni?",
      shortName: "Età",
      questionType: "radio-unordered",
      options: ["Meno di 10 anni", "10-15 anni", "16-20 anni", "21-25 anni", "26-30 anni", "31 anni e oltre"]
    },
    '29': {
      question: "Qual è la tua principale area di specializzazione o interesse?",
      shortName: "Specializzazione",
      questionType: "radio-unordered",
      options: ["Scienze", "Arti", "Tecnologia", "Matematica", "Scienze umane", "Altro"]
    },
    '30': {
      question: "A quale livello di istruzione sei attualmente?",
      shortName: "Livello di Istruzione",
      questionType: "radio-unordered",
      options: ["Scuola primaria", "Scuola secondaria", "Laurea triennale (o equivalente)", "Laurea magistrale/Dottorato (o equivalente)"]
    },
    '31': {
      question: "Con quale frequenza utilizzi strumenti digitali per l'apprendimento o il tempo libero?",
      shortName: "Uso di Strumenti Digitali",
      questionType: "radio-unordered",
      options: ["Mai", "Raramente", "A volte", "Spesso", "Sempre"]
    },
    '32': {
      question: "Quando hai completato la formazione?",
      shortName: "Ritardo Post-Formazione",
      questionType: "radio-unordered",
      options: ["Meno di un mese", "1-3 mesi", "3-6 mesi", "Più di 6 mesi"]
    },
    '33': {
      question: "A quale livello/i insegni attualmente?",
      shortName: "Livelli di Insegnamento",
      questionType: "checkbox",
      options: ["Scuola dell'infanzia", "Scuola primaria (Classi 1-3)", "Scuola primaria (Classi 4-5)", "Scuola media", "Scuola superiore", "Università"]
    },
    '34': {
      question: "In che misura hai avuto l'opportunità di implementare i concetti della formazione?",
      shortName: "Livello di Opportunità",
      questionType: "radio-ordered",
      options: ["Nessuna opportunità", "Opportunità limitate", "Opportunità moderate", "Opportunità abbondanti"]
    },
    '35': {
      question: "Con quale frequenza hai implementato ciò che hai imparato nella formazione?",
      shortName: "Frequenza di Implementazione",
      questionType: "radio-ordered",
      options: [
        "Mai",
        "Raramente (1-2 volte al mese)",
        "A volte (1-2 volte a settimana)",
        "Spesso (3-4 volte a settimana)",
        "Quotidiano"
      ]
    },
    '36': {
      question: "Quali aspetti della formazione hai implementato?",
      shortName: "Aspetti Implementati",
      questionType: "checkbox",
      options: [
        "Strategie di insegnamento",
        "Metodi di valutazione",
        "Tecniche di gestione della classe",
        "Integrazione della tecnologia",
        "Tecniche di coinvolgimento degli studenti",
        "Strategie di differenziazione",
        "Altro"
      ]
    },
    '37': {
      question: "Se altro, specifica:",
      shortName: "Aspetti Implementati (Altro)",
      questionType: "text",
      options: []
    },
    '38': {
      question: "Descrivi, se applicabile, un esempio specifico di implementazione della formazione nella tua classe:",
      shortName: "Esempio di Implementazione",
      questionType: "text",
      options: []
    },
    '39': {
      question: "Valuta il tuo attuale livello di fiducia nell'implementare le competenze apprese nella formazione:",
      shortName: "Livello di Fiducia",
      questionType: "radio-ordered",
      options: [
        "Per niente fiducioso/a",
        "Leggermente fiducioso/a",
        "Moderatamente fiducioso/a",
        "Molto fiducioso/a",
        "Estremamente fiducioso/a"
      ]
    },
    '40': {
      question: "In quali aspetti senti di aver raggiunto una buona padronanza delle competenze apprese nella formazione?",
      shortName: "Aree di Padronanza",
      questionType: "checkbox",
      options: [
        "Comprensione dei concetti fondamentali",
        "Applicazione in diversi contesti",
        "Adattamento alle esigenze degli studenti",
        "Risoluzione di problemi correlati",
        "Spiegazione ai colleghi",
        "Nessuno dei precedenti",
        "Altro"
      ]
    },
    '41': {
      question: "Se altro, specifica:",
      shortName: "Aree di Padronanza (Altro)",
      questionType: "text",
      options: []
    },
    '42': {
      question: "Quali prove hai del successo dell'implementazione? Descrivi i risultati o i cambiamenti osservati:",
      shortName: "Prove di Successo",
      questionType: "text",
      options: []
    },
    '43': {
      question: "Quale supporto aggiuntivo ti aiuterebbe a implementare la formazione in modo più efficace?",
      shortName: "Supporto Aggiuntivo",
      questionType: "checkbox",
      options: [
        "Sessioni di follow-up",
        "Coaching tra pari",
        "Materiali didattici",
        "Opportunità di osservazione",
        "Supporto tecnico",
        "Tempo per la pianificazione",
        "Altro"
      ]
    },
    '44': {
      question: "Se altro, specifica:",
      shortName: "Supporto Aggiuntivo (Altro)",
      questionType: "text",
      options: []
    },
    '45': {
      question: "Quali raccomandazioni faresti per migliorare la formazione o supportare l'implementazione futura?",
      shortName: "Raccomandazioni",
      questionType: "text",
      options: []
    },
    '46': {
      question: "Valuta l'impatto complessivo della formazione sulla tua pratica di insegnamento:",
      shortName: "Impatto Complessivo",
      questionType: "radio-ordered",
      options: [
        "Nessun impatto",
        "Impatto minimo",
        "Impatto moderato",
        "Impatto significativo",
        "Impatto trasformativo"
      ]
    },
    '47': {
      question: "Descrivi il cambiamento più significativo nella tua pratica di insegnamento risultante da questa formazione:",
      shortName: "Cambiamento Significativo",
      questionType: "text",
      options: []
    },
    '48': {
      question: "C'è altro che vorresti condividere sulla tua esperienza nell'implementazione della formazione?",
      shortName: "Commenti Aggiuntivi",
      questionType: "text",
      options: []
    }
  }
};

export { questionBank };
