export interface SpeakingQuestion {
  id: string;
  testId: string;
  testName: string;
  part: number;
  questionNumber: number;
  questionType: 'Speaking';
  skill: string;
  skillId: string;
  question: string;
  topic: string;
  followUpQuestions?: string[];
  rubricCriteria?: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  level: string;
  timeAllocation: number; // in minutes
  sampleAnswer?: string;
}

export const speakingQuestions: SpeakingQuestion[] = [
  // Part 1 - Introduction and Interview (4-5 minutes)
  {
    id: 'SPK-A1-001',
    testId: 'ST-001',
    testName: 'IELTS Speaking Mock Test 1',
    part: 1,
    questionNumber: 1,
    questionType: 'Speaking',
    skill: 'Speaking - Part 1',
    skillId: 'speaking-part1-intro',
    question: 'Let\'s talk about your hometown. Where are you from?',
    topic: 'Hometown and Background',
    followUpQuestions: [
      'What do you like most about your hometown?',
      'Has your hometown changed much since you were a child?',
      'Would you like to live there in the future?'
    ],
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'Easy',
    level: 'A2',
    timeAllocation: 1,
    sampleAnswer: 'I\'m from Manchester, which is a vibrant city in the northwest of England. It\'s known for its rich industrial heritage and fantastic music scene.'
  },
  {
    id: 'SPK-A2-002',
    testId: 'ST-001',
    testName: 'IELTS Speaking Mock Test 1',
    part: 1,
    questionNumber: 2,
    questionType: 'Speaking',
    skill: 'Speaking - Part 1',
    skillId: 'speaking-part1-personal',
    question: 'Do you work or are you a student?',
    topic: 'Work and Study',
    followUpQuestions: [
      'What do you enjoy most about your job/studies?',
      'What are your future career plans?',
      'Do you prefer working/studying alone or with others?'
    ],
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'Easy',
    level: 'A2',
    timeAllocation: 1,
    sampleAnswer: 'I\'m currently a university student studying Computer Science. I find it incredibly engaging because technology is constantly evolving.'
  },
  {
    id: 'SPK-B1-003',
    testId: 'ST-001',
    testName: 'IELTS Speaking Mock Test 1',
    part: 1,
    questionNumber: 3,
    questionType: 'Speaking',
    skill: 'Speaking - Part 1',
    skillId: 'speaking-part1-hobbies',
    question: 'What do you like to do in your free time?',
    topic: 'Hobbies and Interests',
    followUpQuestions: [
      'How did you become interested in this activity?',
      'Do you prefer indoor or outdoor activities?',
      'Have your hobbies changed over the years?'
    ],
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'Easy',
    level: 'B1',
    timeAllocation: 1
  },
  {
    id: 'SPK-B1-004',
    testId: 'ST-001',
    testName: 'IELTS Speaking Mock Test 1',
    part: 1,
    questionNumber: 4,
    questionType: 'Speaking',
    skill: 'Speaking - Part 1',
    skillId: 'speaking-part1-daily',
    question: 'How do you usually spend your weekends?',
    topic: 'Daily Routine and Lifestyle',
    followUpQuestions: [
      'Do you think weekends are important? Why?',
      'Would you like to change how you spend your weekends?',
      'Do you prefer to relax or be active on weekends?'
    ],
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'Easy',
    level: 'B1',
    timeAllocation: 1
  },

  // Part 2 - Long Turn (3-4 minutes including preparation)
  {
    id: 'SPK-B2-005',
    testId: 'ST-001',
    testName: 'IELTS Speaking Mock Test 1',
    part: 2,
    questionNumber: 5,
    questionType: 'Speaking',
    skill: 'Speaking - Part 2',
    skillId: 'speaking-part2-description',
    question: 'Describe a memorable journey you have taken. You should say: where you went, who you went with, what you did there, and explain why this journey was memorable.',
    topic: 'Travel and Experiences',
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation', 'Task Achievement'],
    difficulty: 'Medium',
    level: 'B2',
    timeAllocation: 3,
    sampleAnswer: 'I\'d like to talk about a trip I took to the Scottish Highlands last summer. I went with my close friend Sarah, who shares my passion for hiking and photography. We spent five days exploring the breathtaking landscapes, climbing Ben Nevis, and visiting ancient castles. What made this journey truly memorable was the combination of natural beauty and the sense of achievement we felt after completing challenging hikes.'
  },
  {
    id: 'SPK-B2-006',
    testId: 'ST-002',
    testName: 'IELTS Speaking Mock Test 2',
    part: 2,
    questionNumber: 1,
    questionType: 'Speaking',
    skill: 'Speaking - Part 2',
    skillId: 'speaking-part2-person',
    question: 'Describe a person who has influenced you greatly. You should say: who this person is, how you know them, what qualities they have, and explain how they have influenced you.',
    topic: 'People and Relationships',
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation', 'Task Achievement'],
    difficulty: 'Medium',
    level: 'B2',
    timeAllocation: 3
  },
  {
    id: 'SPK-B2-007',
    testId: 'ST-002',
    testName: 'IELTS Speaking Mock Test 2',
    part: 2,
    questionNumber: 2,
    questionType: 'Speaking',
    skill: 'Speaking - Part 2',
    skillId: 'speaking-part2-event',
    question: 'Describe an important event in your life. You should say: what the event was, when it happened, who was involved, and explain why it was important to you.',
    topic: 'Life Events and Milestones',
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation', 'Task Achievement'],
    difficulty: 'Medium',
    level: 'B2',
    timeAllocation: 3
  },
  {
    id: 'SPK-C1-008',
    testId: 'ST-002',
    testName: 'IELTS Speaking Mock Test 2',
    part: 2,
    questionNumber: 3,
    questionType: 'Speaking',
    skill: 'Speaking - Part 2',
    skillId: 'speaking-part2-achievement',
    question: 'Describe something you have achieved that you are proud of. You should say: what you achieved, how you achieved it, what challenges you faced, and explain why you are proud of this achievement.',
    topic: 'Achievements and Success',
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation', 'Task Achievement'],
    difficulty: 'Hard',
    level: 'C1',
    timeAllocation: 3
  },

  // Part 3 - Two-way Discussion (4-5 minutes)
  {
    id: 'SPK-B2-009',
    testId: 'ST-001',
    testName: 'IELTS Speaking Mock Test 1',
    part: 3,
    questionNumber: 6,
    questionType: 'Speaking',
    skill: 'Speaking - Part 3',
    skillId: 'speaking-part3-abstract',
    question: 'How has technology changed the way people travel compared to the past?',
    topic: 'Technology and Travel',
    followUpQuestions: [
      'Do you think technology has made travel too easy?',
      'What are the advantages and disadvantages of using technology when traveling?',
      'How might travel change in the future with advances in technology?'
    ],
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation', 'Critical Thinking'],
    difficulty: 'Medium',
    level: 'B2',
    timeAllocation: 2
  },
  {
    id: 'SPK-C1-010',
    testId: 'ST-001',
    testName: 'IELTS Speaking Mock Test 1',
    part: 3,
    questionNumber: 7,
    questionType: 'Speaking',
    skill: 'Speaking - Part 3',
    skillId: 'speaking-part3-society',
    question: 'What role do mentors play in professional development?',
    topic: 'Education and Professional Development',
    followUpQuestions: [
      'How can organizations encourage mentorship programs?',
      'Is formal mentorship better than informal guidance?',
      'What qualities make someone a good mentor?'
    ],
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation', 'Critical Thinking'],
    difficulty: 'Hard',
    level: 'C1',
    timeAllocation: 2
  },
  {
    id: 'SPK-C1-011',
    testId: 'ST-003',
    testName: 'IELTS Speaking Mock Test 3',
    part: 3,
    questionNumber: 1,
    questionType: 'Speaking',
    skill: 'Speaking - Part 3',
    skillId: 'speaking-part3-culture',
    question: 'How important is it to preserve traditional customs in modern society?',
    topic: 'Culture and Tradition',
    followUpQuestions: [
      'What challenges do societies face in maintaining traditions?',
      'Should governments play a role in preserving cultural heritage?',
      'Can traditional values coexist with modern lifestyles?'
    ],
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation', 'Critical Thinking'],
    difficulty: 'Hard',
    level: 'C1',
    timeAllocation: 2
  },
  {
    id: 'SPK-C1-012',
    testId: 'ST-003',
    testName: 'IELTS Speaking Mock Test 3',
    part: 3,
    questionNumber: 2,
    questionType: 'Speaking',
    skill: 'Speaking - Part 3',
    skillId: 'speaking-part3-environment',
    question: 'What are the main environmental challenges facing cities today?',
    topic: 'Environment and Sustainability',
    followUpQuestions: [
      'How can urban planning address environmental issues?',
      'What responsibility do individuals have for environmental protection?',
      'Will technology solve environmental problems in cities?'
    ],
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation', 'Critical Thinking'],
    difficulty: 'Hard',
    level: 'C1',
    timeAllocation: 2
  },
  {
    id: 'SPK-B1-013',
    testId: 'ST-004',
    testName: 'IELTS Speaking Mock Test 4',
    part: 1,
    questionNumber: 1,
    questionType: 'Speaking',
    skill: 'Speaking - Part 1',
    skillId: 'speaking-part1-food',
    question: 'What kind of food do you like to eat?',
    topic: 'Food and Cuisine',
    followUpQuestions: [
      'Do you prefer home-cooked meals or eating out?',
      'Have your food preferences changed over time?',
      'What traditional dishes are popular in your country?'
    ],
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'Easy',
    level: 'B1',
    timeAllocation: 1
  },
  {
    id: 'SPK-B1-014',
    testId: 'ST-004',
    testName: 'IELTS Speaking Mock Test 4',
    part: 1,
    questionNumber: 2,
    questionType: 'Speaking',
    skill: 'Speaking - Part 1',
    skillId: 'speaking-part1-weather',
    question: 'What is the weather like in your country?',
    topic: 'Weather and Climate',
    followUpQuestions: [
      'What is your favorite type of weather?',
      'Does the weather affect your mood?',
      'How do people in your country deal with extreme weather?'
    ],
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'],
    difficulty: 'Easy',
    level: 'B1',
    timeAllocation: 1
  },
  {
    id: 'SPK-C1-015',
    testId: 'ST-004',
    testName: 'IELTS Speaking Mock Test 4',
    part: 2,
    questionNumber: 3,
    questionType: 'Speaking',
    skill: 'Speaking - Part 2',
    skillId: 'speaking-part2-skill',
    question: 'Describe a skill you would like to learn. You should say: what the skill is, why you want to learn it, how you plan to learn it, and explain how this skill would benefit you.',
    topic: 'Skills and Learning',
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation', 'Task Achievement'],
    difficulty: 'Hard',
    level: 'C1',
    timeAllocation: 3
  },
  {
    id: 'SPK-B2-016',
    testId: 'ST-004',
    testName: 'IELTS Speaking Mock Test 4',
    part: 2,
    questionNumber: 4,
    questionType: 'Speaking',
    skill: 'Speaking - Part 2',
    skillId: 'speaking-part2-book',
    question: 'Describe a book that has had a significant impact on you. You should say: what the book is about, when you read it, why it impacted you, and explain what you learned from it.',
    topic: 'Literature and Reading',
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation', 'Task Achievement'],
    difficulty: 'Medium',
    level: 'B2',
    timeAllocation: 3
  },
  {
    id: 'SPK-C1-017',
    testId: 'ST-004',
    testName: 'IELTS Speaking Mock Test 4',
    part: 3,
    questionNumber: 5,
    questionType: 'Speaking',
    skill: 'Speaking - Part 3',
    skillId: 'speaking-part3-education',
    question: 'How has the education system changed in recent years?',
    topic: 'Education System',
    followUpQuestions: [
      'What are the benefits and drawbacks of online education?',
      'Should education focus more on practical skills or academic knowledge?',
      'How important is lifelong learning in today\'s world?'
    ],
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation', 'Critical Thinking'],
    difficulty: 'Hard',
    level: 'C1',
    timeAllocation: 2
  },
  {
    id: 'SPK-C1-018',
    testId: 'ST-005',
    testName: 'IELTS Speaking Mock Test 5',
    part: 3,
    questionNumber: 1,
    questionType: 'Speaking',
    skill: 'Speaking - Part 3',
    skillId: 'speaking-part3-health',
    question: 'What factors contribute to a healthy lifestyle?',
    topic: 'Health and Wellness',
    followUpQuestions: [
      'How has public awareness of health issues changed?',
      'Should governments regulate unhealthy food products?',
      'What role does mental health play in overall well-being?'
    ],
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation', 'Critical Thinking'],
    difficulty: 'Hard',
    level: 'C1',
    timeAllocation: 2
  },
  {
    id: 'SPK-C1-019',
    testId: 'ST-005',
    testName: 'IELTS Speaking Mock Test 5',
    part: 3,
    questionNumber: 2,
    questionType: 'Speaking',
    skill: 'Speaking - Part 3',
    skillId: 'speaking-part3-media',
    question: 'How has social media influenced communication in society?',
    topic: 'Media and Communication',
    followUpQuestions: [
      'What are the positive and negative effects of social media?',
      'How has traditional media adapted to the digital age?',
      'Will social media continue to grow in importance?'
    ],
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation', 'Critical Thinking'],
    difficulty: 'Hard',
    level: 'C1',
    timeAllocation: 2
  },
  {
    id: 'SPK-C2-020',
    testId: 'ST-005',
    testName: 'IELTS Speaking Mock Test 5',
    part: 3,
    questionNumber: 3,
    questionType: 'Speaking',
    skill: 'Speaking - Part 3',
    skillId: 'speaking-part3-economics',
    question: 'What impact does globalization have on local economies?',
    topic: 'Economics and Globalization',
    followUpQuestions: [
      'How can small businesses compete in a globalized market?',
      'What are the cultural implications of economic globalization?',
      'Should countries prioritize local production over imports?'
    ],
    rubricCriteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation', 'Critical Thinking'],
    difficulty: 'Hard',
    level: 'C2',
    timeAllocation: 2
  }
];
