export interface ReadingQuestion {
  id: string;
  testId: string;
  testName: string;
  passage: number;
  questionNumber: number;
  questionType: 'Multiple Choice' | 'True/False/Not Given' | 'Yes/No/Not Given' | 'Matching Headings' | 'Sentence Completion' | 'Summary Completion' | 'Matching Information' | 'Short Answer';
  skill: string;
  skillId: string;
  question: string;
  passageTitle: string;
  passageText: string;
  options?: { label: string; text: string; correct: boolean }[];
  correctAnswer: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  level: string;
  topic: string;
  subSkill: string;
}

export const readingQuestions: ReadingQuestion[] = [
  // Passage 1 - Questions about Climate Change
  {
    id: 'RDG-B2-001',
    testId: 'RT-001',
    testName: 'IELTS Academic Reading Practice Test 1',
    passage: 1,
    questionNumber: 1,
    questionType: 'Multiple Choice',
    skill: 'Reading',
    skillId: 'reading-main-idea',
    question: 'What is the main idea of the passage?',
    passageTitle: 'The Impact of Climate Change on Arctic Wildlife',
    passageText: 'Climate change is having a profound impact on Arctic ecosystems, particularly affecting wildlife that has adapted to cold conditions over millennia. Polar bears, which depend on sea ice for hunting seals, are experiencing dramatic habitat loss as ice melts earlier each spring and forms later each autumn. This extended ice-free period forces bears to spend more time on land, where food sources are scarce and competition increases. Scientists have documented declining body conditions, reduced reproductive success, and increased mortality rates among polar bear populations in recent decades. The situation is similarly dire for other Arctic species, including walruses, Arctic foxes, and various seabird colonies that rely on stable ice platforms for breeding and feeding.',
    options: [
      { label: 'A', text: 'Polar bears are the only species affected by Arctic climate change', correct: false },
      { label: 'B', text: 'Climate change is significantly impacting Arctic wildlife through habitat loss', correct: true },
      { label: 'C', text: 'Scientists disagree about climate change effects on Arctic animals', correct: false },
      { label: 'D', text: 'Arctic animals are successfully adapting to warmer temperatures', correct: false }
    ],
    correctAnswer: 'B',
    difficulty: 'Medium',
    level: 'B2',
    topic: 'Environment and Climate',
    subSkill: 'Identifying main ideas'
  },
  {
    id: 'RDG-B2-002',
    testId: 'RT-001',
    testName: 'IELTS Academic Reading Practice Test 1',
    passage: 1,
    questionNumber: 2,
    questionType: 'True/False/Not Given',
    skill: 'Reading',
    skillId: 'reading-inference',
    question: 'Polar bears spend more time on land during winter than before.',
    passageTitle: 'The Impact of Climate Change on Arctic Wildlife',
    passageText: 'Climate change is having a profound impact on Arctic ecosystems, particularly affecting wildlife that has adapted to cold conditions over millennia. Polar bears, which depend on sea ice for hunting seals, are experiencing dramatic habitat loss as ice melts earlier each spring and forms later each autumn. This extended ice-free period forces bears to spend more time on land, where food sources are scarce and competition increases.',
    correctAnswer: 'Not Given',
    difficulty: 'Medium',
    level: 'B2',
    topic: 'Environment and Climate',
    subSkill: 'Making inferences'
  },
  {
    id: 'RDG-C1-003',
    testId: 'RT-001',
    testName: 'IELTS Academic Reading Practice Test 1',
    passage: 1,
    questionNumber: 3,
    questionType: 'Sentence Completion',
    skill: 'Reading',
    skillId: 'reading-detail',
    question: 'Complete the sentence: Scientists have observed _______ among polar bear populations.',
    passageTitle: 'The Impact of Climate Change on Arctic Wildlife',
    passageText: 'Scientists have documented declining body conditions, reduced reproductive success, and increased mortality rates among polar bear populations in recent decades.',
    correctAnswer: 'declining body conditions, reduced reproductive success, and increased mortality rates',
    difficulty: 'Hard',
    level: 'C1',
    topic: 'Environment and Climate',
    subSkill: 'Understanding specific details'
  },

  // Passage 2 - Questions about Ancient Civilizations
  {
    id: 'RDG-B2-004',
    testId: 'RT-001',
    testName: 'IELTS Academic Reading Practice Test 1',
    passage: 2,
    questionNumber: 4,
    questionType: 'Multiple Choice',
    skill: 'Reading',
    skillId: 'reading-purpose',
    question: 'What was the primary purpose of the Mayan astronomical observatories?',
    passageTitle: 'Advanced Astronomy in Ancient Maya Civilization',
    passageText: 'The Maya civilization, which flourished in Mesoamerica from approximately 2000 BCE to 1500 CE, achieved remarkable sophistication in astronomical observation and calendar systems. Mayan astronomers constructed elaborate observatories, such as the famous El Caracol at Chichén Itzá, specifically designed to track celestial movements with extraordinary precision. These structures featured carefully aligned windows and platforms that allowed priests to observe and record the positions of Venus, Mars, and other celestial bodies. The Maya developed multiple interconnected calendar systems, including a 260-day ritual calendar and a 365-day solar calendar, which worked together to create the Long Count calendar capable of measuring vast spans of time.',
    options: [
      { label: 'A', text: 'To worship celestial deities', correct: false },
      { label: 'B', text: 'To track celestial movements with precision', correct: true },
      { label: 'C', text: 'To predict weather patterns', correct: false },
      { label: 'D', text: 'To navigate during sea voyages', correct: false }
    ],
    correctAnswer: 'B',
    difficulty: 'Medium',
    level: 'B2',
    topic: 'History and Culture',
    subSkill: 'Understanding purpose and function'
  },
  {
    id: 'RDG-C1-005',
    testId: 'RT-001',
    testName: 'IELTS Academic Reading Practice Test 1',
    passage: 2,
    questionNumber: 5,
    questionType: 'Yes/No/Not Given',
    skill: 'Reading',
    skillId: 'reading-claims',
    question: 'The Maya civilization had the most advanced astronomical knowledge of all ancient civilizations.',
    passageTitle: 'Advanced Astronomy in Ancient Maya Civilization',
    passageText: 'The Maya civilization, which flourished in Mesoamerica from approximately 2000 BCE to 1500 CE, achieved remarkable sophistication in astronomical observation and calendar systems.',
    correctAnswer: 'Not Given',
    difficulty: 'Hard',
    level: 'C1',
    topic: 'History and Culture',
    subSkill: 'Evaluating claims and evidence'
  },

  // Passage 3 - Questions about Artificial Intelligence
  {
    id: 'RDG-C1-006',
    testId: 'RT-002',
    testName: 'IELTS Academic Reading Practice Test 2',
    passage: 1,
    questionNumber: 1,
    questionType: 'Multiple Choice',
    skill: 'Reading',
    skillId: 'reading-vocabulary',
    question: 'In the context of the passage, what does "paradigm shift" refer to?',
    passageTitle: 'Artificial Intelligence and the Future of Work',
    passageText: 'The rapid advancement of artificial intelligence represents a paradigm shift comparable to the Industrial Revolution. Machine learning algorithms are increasingly capable of performing tasks once thought to require uniquely human intelligence, from diagnosing medical conditions to composing music. This technological transformation is reshaping labor markets worldwide, automating routine tasks while creating demand for new skills in AI development, data analysis, and human-machine collaboration. Economists debate whether AI will ultimately create more jobs than it eliminates, but there is consensus that workers must adapt through continuous learning and skill development.',
    options: [
      { label: 'A', text: 'A minor adjustment in thinking', correct: false },
      { label: 'B', text: 'A fundamental change in approach or underlying assumptions', correct: true },
      { label: 'C', text: 'A temporary trend in technology', correct: false },
      { label: 'D', text: 'A return to traditional methods', correct: false }
    ],
    correctAnswer: 'B',
    difficulty: 'Hard',
    level: 'C1',
    topic: 'Technology and Society',
    subSkill: 'Understanding vocabulary in context'
  },
  {
    id: 'RDG-B2-007',
    testId: 'RT-002',
    testName: 'IELTS Academic Reading Practice Test 2',
    passage: 1,
    questionNumber: 2,
    questionType: 'True/False/Not Given',
    skill: 'Reading',
    skillId: 'reading-fact-opinion',
    question: 'All economists agree that AI will create more jobs than it eliminates.',
    passageTitle: 'Artificial Intelligence and the Future of Work',
    passageText: 'Economists debate whether AI will ultimately create more jobs than it eliminates, but there is consensus that workers must adapt through continuous learning and skill development.',
    correctAnswer: 'False',
    difficulty: 'Medium',
    level: 'B2',
    topic: 'Technology and Society',
    subSkill: 'Distinguishing fact from opinion'
  },
  {
    id: 'RDG-C1-008',
    testId: 'RT-002',
    testName: 'IELTS Academic Reading Practice Test 2',
    passage: 1,
    questionNumber: 3,
    questionType: 'Summary Completion',
    skill: 'Reading',
    skillId: 'reading-summary',
    question: 'Complete the summary: AI is transforming labor markets by automating _______ tasks while creating demand for skills in AI development and _______.',
    passageTitle: 'Artificial Intelligence and the Future of Work',
    passageText: 'This technological transformation is reshaping labor markets worldwide, automating routine tasks while creating demand for new skills in AI development, data analysis, and human-machine collaboration.',
    correctAnswer: 'routine; data analysis',
    difficulty: 'Hard',
    level: 'C1',
    topic: 'Technology and Society',
    subSkill: 'Summarizing key information'
  },

  // Passage 4 - Questions about Marine Biology
  {
    id: 'RDG-B2-009',
    testId: 'RT-002',
    testName: 'IELTS Academic Reading Practice Test 2',
    passage: 2,
    questionNumber: 4,
    questionType: 'Multiple Choice',
    skill: 'Reading',
    skillId: 'reading-cause-effect',
    question: 'According to the passage, what is the primary cause of coral bleaching?',
    passageTitle: 'Coral Reef Ecosystems Under Threat',
    passageText: 'Coral reefs, often called the rainforests of the sea, are among Earth\'s most biodiverse ecosystems, supporting approximately 25% of all marine species despite covering less than 1% of the ocean floor. However, these vital ecosystems face unprecedented threats from climate change, ocean acidification, and pollution. Rising ocean temperatures trigger coral bleaching, a stress response in which corals expel the symbiotic algae that provide them with nutrients and vibrant colors. Without these algae, corals appear white and become vulnerable to disease and death. Recent mass bleaching events have affected reefs globally, with some regions experiencing mortality rates exceeding 50%.',
    options: [
      { label: 'A', text: 'Ocean pollution', correct: false },
      { label: 'B', text: 'Rising ocean temperatures', correct: true },
      { label: 'C', text: 'Overfishing', correct: false },
      { label: 'D', text: 'Natural predators', correct: false }
    ],
    correctAnswer: 'B',
    difficulty: 'Medium',
    level: 'B2',
    topic: 'Marine Biology',
    subSkill: 'Identifying cause and effect'
  },
  {
    id: 'RDG-C1-010',
    testId: 'RT-002',
    testName: 'IELTS Academic Reading Practice Test 2',
    passage: 2,
    questionNumber: 5,
    questionType: 'Short Answer',
    skill: 'Reading',
    skillId: 'reading-specific-info',
    question: 'What percentage of the ocean floor do coral reefs cover?',
    passageTitle: 'Coral Reef Ecosystems Under Threat',
    passageText: 'Coral reefs, often called the rainforests of the sea, are among Earth\'s most biodiverse ecosystems, supporting approximately 25% of all marine species despite covering less than 1% of the ocean floor.',
    correctAnswer: 'Less than 1%',
    difficulty: 'Hard',
    level: 'C1',
    topic: 'Marine Biology',
    subSkill: 'Locating specific information'
  },

  // Passage 5 - Questions about Renewable Energy
  {
    id: 'RDG-B2-011',
    testId: 'RT-003',
    testName: 'IELTS Academic Reading Practice Test 3',
    passage: 1,
    questionNumber: 1,
    questionType: 'Multiple Choice',
    skill: 'Reading',
    skillId: 'reading-comparison',
    question: 'How does solar panel efficiency in 2020 compare to 1990?',
    passageTitle: 'The Evolution of Solar Energy Technology',
    passageText: 'Solar energy technology has undergone dramatic transformation over the past three decades. In 1990, commercial solar panels typically converted only 10-12% of sunlight into electricity, making them expensive and impractical for widespread use. By 2020, average efficiency rates had more than doubled to 22-24%, while costs per watt decreased by approximately 90%. This remarkable progress resulted from advances in photovoltaic cell materials, manufacturing processes, and economies of scale as production expanded globally. Modern solar installations now compete economically with fossil fuels in many regions, driving rapid adoption worldwide.',
    options: [
      { label: 'A', text: 'Solar panels are slightly more efficient', correct: false },
      { label: 'B', text: 'Efficiency has more than doubled', correct: true },
      { label: 'C', text: 'Efficiency has decreased', correct: false },
      { label: 'D', text: 'Efficiency remains unchanged', correct: false }
    ],
    correctAnswer: 'B',
    difficulty: 'Medium',
    level: 'B2',
    topic: 'Energy and Technology',
    subSkill: 'Making comparisons'
  },
  {
    id: 'RDG-C1-012',
    testId: 'RT-003',
    testName: 'IELTS Academic Reading Practice Test 3',
    passage: 1,
    questionNumber: 2,
    questionType: 'True/False/Not Given',
    skill: 'Reading',
    skillId: 'reading-implicit',
    question: 'The passage suggests that solar energy is now economically viable in all countries.',
    passageTitle: 'The Evolution of Solar Energy Technology',
    passageText: 'Modern solar installations now compete economically with fossil fuels in many regions, driving rapid adoption worldwide.',
    correctAnswer: 'False',
    difficulty: 'Hard',
    level: 'C1',
    topic: 'Energy and Technology',
    subSkill: 'Understanding implicit information'
  },

  // Passage 6 - Questions about Psychology
  {
    id: 'RDG-C1-013',
    testId: 'RT-003',
    testName: 'IELTS Academic Reading Practice Test 3',
    passage: 2,
    questionNumber: 3,
    questionType: 'Multiple Choice',
    skill: 'Reading',
    skillId: 'reading-theory',
    question: 'According to the passage, what does neuroplasticity demonstrate?',
    passageTitle: 'Neuroplasticity and Cognitive Development',
    passageText: 'Neuroplasticity, the brain\'s ability to reorganize itself by forming new neural connections throughout life, has revolutionized our understanding of cognitive development and learning. Contrary to earlier beliefs that brain structure was fixed after childhood, research now shows that the adult brain remains remarkably adaptable. This discovery has profound implications for education, rehabilitation after brain injury, and understanding age-related cognitive changes. Studies demonstrate that learning new skills, from languages to musical instruments, literally reshapes brain structure by strengthening certain neural pathways while pruning others. Even in elderly individuals, cognitive training can improve memory and processing speed by promoting neuroplastic changes.',
    options: [
      { label: 'A', text: 'Brain structure is fixed after childhood', correct: false },
      { label: 'B', text: 'The brain remains adaptable throughout life', correct: true },
      { label: 'C', text: 'Only children can form new neural connections', correct: false },
      { label: 'D', text: 'Brain plasticity decreases with age', correct: false }
    ],
    correctAnswer: 'B',
    difficulty: 'Hard',
    level: 'C1',
    topic: 'Psychology and Neuroscience',
    subSkill: 'Understanding theoretical concepts'
  },
  {
    id: 'RDG-C1-014',
    testId: 'RT-003',
    testName: 'IELTS Academic Reading Practice Test 3',
    passage: 2,
    questionNumber: 4,
    questionType: 'Sentence Completion',
    skill: 'Reading',
    skillId: 'reading-paraphrase',
    question: 'Learning new skills changes the brain by strengthening some neural pathways and _______ others.',
    passageTitle: 'Neuroplasticity and Cognitive Development',
    passageText: 'Studies demonstrate that learning new skills, from languages to musical instruments, literally reshapes brain structure by strengthening certain neural pathways while pruning others.',
    correctAnswer: 'pruning',
    difficulty: 'Hard',
    level: 'C1',
    topic: 'Psychology and Neuroscience',
    subSkill: 'Paraphrasing and synonyms'
  },

  // Passage 7 - Questions about Urban Planning
  {
    id: 'RDG-B2-015',
    testId: 'RT-004',
    testName: 'IELTS Academic Reading Practice Test 4',
    passage: 1,
    questionNumber: 1,
    questionType: 'Multiple Choice',
    skill: 'Reading',
    skillId: 'reading-argument',
    question: 'What is the author\'s main argument about sustainable cities?',
    passageTitle: 'Sustainable Urban Development in the 21st Century',
    passageText: 'As urban populations continue growing rapidly, cities must embrace sustainable development principles to ensure livability and environmental responsibility. Successful sustainable cities integrate multiple strategies: efficient public transportation reducing private vehicle dependence, green spaces improving air quality and resident well-being, energy-efficient buildings minimizing resource consumption, and circular economy approaches to waste management. Copenhagen, Singapore, and Curitiba exemplify how comprehensive planning can create urban environments that balance economic vitality with environmental stewardship and quality of life.',
    options: [
      { label: 'A', text: 'Cities should focus solely on economic growth', correct: false },
      { label: 'B', text: 'Sustainable cities require integration of multiple strategies', correct: true },
      { label: 'C', text: 'Only wealthy cities can afford sustainability', correct: false },
      { label: 'D', text: 'Traditional urban planning is more effective', correct: false }
    ],
    correctAnswer: 'B',
    difficulty: 'Medium',
    level: 'B2',
    topic: 'Urban Planning',
    subSkill: 'Identifying arguments'
  },
  {
    id: 'RDG-B2-016',
    testId: 'RT-004',
    testName: 'IELTS Academic Reading Practice Test 4',
    passage: 1,
    questionNumber: 2,
    questionType: 'Matching Information',
    skill: 'Reading',
    skillId: 'reading-examples',
    question: 'Which cities are mentioned as examples of sustainable urban planning?',
    passageTitle: 'Sustainable Urban Development in the 21st Century',
    passageText: 'Copenhagen, Singapore, and Curitiba exemplify how comprehensive planning can create urban environments that balance economic vitality with environmental stewardship and quality of life.',
    correctAnswer: 'Copenhagen, Singapore, and Curitiba',
    difficulty: 'Medium',
    level: 'B2',
    topic: 'Urban Planning',
    subSkill: 'Matching examples to concepts'
  },

  // Passage 8 - Questions about Medical Research
  {
    id: 'RDG-C1-017',
    testId: 'RT-004',
    testName: 'IELTS Academic Reading Practice Test 4',
    passage: 2,
    questionNumber: 3,
    questionType: 'Multiple Choice',
    skill: 'Reading',
    skillId: 'reading-research',
    question: 'What does the research suggest about the human microbiome?',
    passageTitle: 'The Human Microbiome: A New Frontier in Medicine',
    passageText: 'The human microbiome, the vast community of microorganisms inhabiting our bodies, has emerged as a crucial factor in health and disease. Recent research reveals that these trillions of bacteria, viruses, and fungi influence not only digestion but also immune function, mental health, and susceptibility to various diseases. Disruption of microbiome balance, termed dysbiosis, has been linked to conditions ranging from inflammatory bowel disease to depression and obesity. Scientists are exploring therapeutic interventions including personalized probiotics, fecal microbiota transplantation, and dietary modifications designed to restore healthy microbial communities. This research represents a paradigm shift from viewing microbes primarily as pathogens to recognizing them as essential partners in human health.',
    options: [
      { label: 'A', text: 'Microorganisms only affect digestion', correct: false },
      { label: 'B', text: 'Microbes influence multiple aspects of health including mental well-being', correct: true },
      { label: 'C', text: 'All microorganisms are harmful to humans', correct: false },
      { label: 'D', text: 'The microbiome cannot be modified through treatment', correct: false }
    ],
    correctAnswer: 'B',
    difficulty: 'Hard',
    level: 'C1',
    topic: 'Medical Science',
    subSkill: 'Understanding research findings'
  },
  {
    id: 'RDG-C1-018',
    testId: 'RT-004',
    testName: 'IELTS Academic Reading Practice Test 4',
    passage: 2,
    questionNumber: 4,
    questionType: 'Yes/No/Not Given',
    skill: 'Reading',
    skillId: 'reading-writer-view',
    question: 'The writer believes that microbiome research will replace all traditional medical treatments.',
    passageTitle: 'The Human Microbiome: A New Frontier in Medicine',
    passageText: 'Scientists are exploring therapeutic interventions including personalized probiotics, fecal microbiota transplantation, and dietary modifications designed to restore healthy microbial communities.',
    correctAnswer: 'Not Given',
    difficulty: 'Hard',
    level: 'C1',
    topic: 'Medical Science',
    subSkill: 'Identifying writer\'s views'
  },

  // Passage 9 - Questions about Language and Communication
  {
    id: 'RDG-B2-019',
    testId: 'RT-005',
    testName: 'IELTS Academic Reading Practice Test 5',
    passage: 1,
    questionNumber: 1,
    questionType: 'Multiple Choice',
    skill: 'Reading',
    skillId: 'reading-organization',
    question: 'How is the information about language endangerment organized in the passage?',
    passageTitle: 'Language Endangerment and Preservation Efforts',
    passageText: 'Linguists estimate that approximately 40% of the world\'s 7,000 languages are endangered, with many facing extinction within the next century. Language loss occurs when younger generations shift to more dominant languages for economic and social opportunities, breaking the chain of transmission. Each extinct language represents irreplaceable loss of unique cultural knowledge, historical information, and diverse ways of conceptualizing the world. Preservation efforts combine documentation through audio and video recording, development of writing systems and educational materials, and community revitalization programs engaging younger speakers. Technology plays an increasingly important role, with apps and online platforms making language learning more accessible and engaging for new generations.',
    options: [
      { label: 'A', text: 'By presenting problems followed by solutions', correct: true },
      { label: 'B', text: 'By comparing different language families', correct: false },
      { label: 'C', text: 'By chronological order of language development', correct: false },
      { label: 'D', text: 'By geographical regions', correct: false }
    ],
    correctAnswer: 'A',
    difficulty: 'Medium',
    level: 'B2',
    topic: 'Linguistics and Culture',
    subSkill: 'Understanding text organization'
  },
  {
    id: 'RDG-C2-020',
    testId: 'RT-005',
    testName: 'IELTS Academic Reading Practice Test 5',
    passage: 1,
    questionNumber: 2,
    questionType: 'Summary Completion',
    skill: 'Reading',
    skillId: 'reading-synthesis',
    question: 'Complete the summary: Language extinction results in the loss of unique _______ knowledge and diverse ways of _______ the world.',
    passageTitle: 'Language Endangerment and Preservation Efforts',
    passageText: 'Each extinct language represents irreplaceable loss of unique cultural knowledge, historical information, and diverse ways of conceptualizing the world.',
    correctAnswer: 'cultural; conceptualizing',
    difficulty: 'Hard',
    level: 'C2',
    topic: 'Linguistics and Culture',
    subSkill: 'Synthesizing information'
  }
];
