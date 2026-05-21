export interface ListeningQuestion {
  id: string;
  testId: string;
  testName: string;
  section: number;
  questionNumber: number;
  questionType: 'Multiple Choice' | 'Form Completion' | 'Note Completion' | 'Table Completion' | 'Flow Chart' | 'Map Labeling' | 'Matching' | 'Short Answer' | 'Sentence Completion';
  skill: string;
  skillId: string;
  question: string;
  context?: string;
  options?: string[];
  correctAnswer: string;
  audioFile?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  level: string;
  topic: string;
}

export interface ListeningTest {
  id: string;
  name: string;
  description: string;
  sections: number;
  totalQuestions: number;
  duration: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
}

export const listeningTests: ListeningTest[] = [
  {
    id: 'LT-001',
    name: 'IELTS Listening Practice Test 1',
    description: 'Complete listening practice test covering social and academic contexts',
    sections: 4,
    totalQuestions: 40,
    duration: 30,
    difficulty: 'Medium',
    topic: 'General & Academic'
  },
  {
    id: 'LT-002',
    name: 'IELTS Listening Practice Test 2',
    description: 'Academic listening test focusing on university life and lectures',
    sections: 4,
    totalQuestions: 40,
    duration: 30,
    difficulty: 'Hard',
    topic: 'Academic'
  },
  {
    id: 'LT-003',
    name: 'IELTS Listening Practice Test 3',
    description: 'General training test with everyday social situations',
    sections: 4,
    totalQuestions: 40,
    duration: 30,
    difficulty: 'Easy',
    topic: 'General Social'
  },
  {
    id: 'LT-004',
    name: 'IELTS Listening Practice Test 4',
    description: 'Mixed context test with workplace and academic scenarios',
    sections: 4,
    totalQuestions: 40,
    duration: 30,
    difficulty: 'Medium',
    topic: 'Professional & Academic'
  },
  {
    id: 'LT-005',
    name: 'IELTS Listening Practice Test 5',
    description: 'Advanced academic listening with complex lectures and discussions',
    sections: 4,
    totalQuestions: 40,
    duration: 30,
    difficulty: 'Hard',
    topic: 'Academic'
  }
];

export const listeningQuestions: ListeningQuestion[] = [
  // Test 1 - Section 1: Form Completion (Social context)
  {
    id: 'LQ-001',
    testId: 'LT-001',
    testName: 'IELTS Listening Practice Test 1',
    section: 1,
    questionNumber: 1,
    questionType: 'Form Completion',
    skill: 'Listening for specific information',
    skillId: 'LISTENING_SPECIFIC_INFORMATION',
    question: 'Customer Name',
    context: 'A conversation between a customer and a gym receptionist about membership',
    correctAnswer: 'Sarah Johnson',
    audioFile: 'test1-section1.mp3',
    difficulty: 'Easy',
    level: 'B1',
    topic: 'Health & Lifestyle'
  },
  {
    id: 'LQ-002',
    testId: 'LT-001',
    testName: 'IELTS Listening Practice Test 1',
    section: 1,
    questionNumber: 2,
    questionType: 'Form Completion',
    skill: 'Listening for specific information',
    skillId: 'LISTENING_SPECIFIC_INFORMATION',
    question: 'Membership Type',
    context: 'A conversation between a customer and a gym receptionist about membership',
    correctAnswer: 'Premium',
    audioFile: 'test1-section1.mp3',
    difficulty: 'Easy',
    level: 'B1',
    topic: 'Health & Lifestyle'
  },
  {
    id: 'LQ-003',
    testId: 'LT-001',
    testName: 'IELTS Listening Practice Test 1',
    section: 1,
    questionNumber: 3,
    questionType: 'Form Completion',
    skill: 'Listening for specific information',
    skillId: 'LISTENING_SPECIFIC_INFORMATION',
    question: 'Payment Method',
    context: 'A conversation between a customer and a gym receptionist about membership',
    correctAnswer: 'Direct Debit',
    audioFile: 'test1-section1.mp3',
    difficulty: 'Easy',
    level: 'B1',
    topic: 'Health & Lifestyle'
  },

  // Test 1 - Section 2: Multiple Choice (Monologue)
  {
    id: 'LQ-011',
    testId: 'LT-001',
    testName: 'IELTS Listening Practice Test 1',
    section: 2,
    questionNumber: 11,
    questionType: 'Multiple Choice',
    skill: 'Listening for gist',
    skillId: 'LISTENING_GIST',
    question: 'What is the main purpose of the community center?',
    context: 'A monologue about a new community center opening in the local area',
    options: [
      'To provide sports facilities',
      'To offer educational programs',
      'To serve as a social gathering space',
      'To host cultural events'
    ],
    correctAnswer: 'To serve as a social gathering space',
    audioFile: 'test1-section2.mp3',
    difficulty: 'Medium',
    level: 'B2',
    topic: 'Culture & Society'
  },
  {
    id: 'LQ-012',
    testId: 'LT-001',
    testName: 'IELTS Listening Practice Test 1',
    section: 2,
    questionNumber: 12,
    questionType: 'Multiple Choice',
    skill: 'Listening for detailed understanding',
    skillId: 'LISTENING_DETAIL',
    question: 'When will the community center officially open?',
    context: 'A monologue about a new community center opening in the local area',
    options: [
      'Next Monday',
      'Next Friday',
      'Next month',
      'Next year'
    ],
    correctAnswer: 'Next Friday',
    audioFile: 'test1-section2.mp3',
    difficulty: 'Medium',
    level: 'B2',
    topic: 'Culture & Society'
  },
  {
    id: 'LQ-013',
    testId: 'LT-001',
    testName: 'IELTS Listening Practice Test 1',
    section: 2,
    questionNumber: 13,
    questionType: 'Multiple Choice',
    skill: 'Inferring speaker meaning',
    skillId: 'LISTENING_INFERENCE',
    question: 'What does the speaker imply about the old community center?',
    context: 'A monologue about a new community center opening in the local area',
    options: [
      'It was too small',
      'It was poorly maintained',
      'It lacked modern facilities',
      'All of the above'
    ],
    correctAnswer: 'All of the above',
    audioFile: 'test1-section2.mp3',
    difficulty: 'Hard',
    level: 'C1',
    topic: 'Culture & Society'
  },

  // Test 1 - Section 3: Note Completion (Academic discussion)
  {
    id: 'LQ-021',
    testId: 'LT-001',
    testName: 'IELTS Listening Practice Test 1',
    section: 3,
    questionNumber: 21,
    questionType: 'Note Completion',
    skill: 'Note taking and completion',
    skillId: 'LISTENING_NOTE_TAKING',
    question: 'The research project focuses on _____ in urban areas',
    context: 'A conversation between two students and a tutor about their research project',
    correctAnswer: 'air pollution',
    audioFile: 'test1-section3.mp3',
    difficulty: 'Medium',
    level: 'B2',
    topic: 'Environment'
  },
  {
    id: 'LQ-022',
    testId: 'LT-001',
    testName: 'IELTS Listening Practice Test 1',
    section: 3,
    questionNumber: 22,
    questionType: 'Note Completion',
    skill: 'Note taking and completion',
    skillId: 'LISTENING_NOTE_TAKING',
    question: 'Data collection will take place over _____ months',
    context: 'A conversation between two students and a tutor about their research project',
    correctAnswer: 'six',
    audioFile: 'test1-section3.mp3',
    difficulty: 'Medium',
    level: 'B2',
    topic: 'Environment'
  },
  {
    id: 'LQ-023',
    testId: 'LT-001',
    testName: 'IELTS Listening Practice Test 1',
    section: 3,
    questionNumber: 23,
    questionType: 'Matching',
    skill: 'Recognizing attitude and opinion',
    skillId: 'LISTENING_ATTITUDE_OPINION',
    question: 'Match each person with their opinion about the research methodology',
    context: 'A conversation between two students and a tutor about their research project',
    correctAnswer: 'Student A: Concerned about sample size | Student B: Confident in approach | Tutor: Suggests additional controls',
    audioFile: 'test1-section3.mp3',
    difficulty: 'Hard',
    level: 'C1',
    topic: 'Environment'
  },

  // Test 1 - Section 4: Sentence Completion (Academic lecture)
  {
    id: 'LQ-031',
    testId: 'LT-001',
    testName: 'IELTS Listening Practice Test 1',
    section: 4,
    questionNumber: 31,
    questionType: 'Sentence Completion',
    skill: 'Listening for detailed understanding',
    skillId: 'LISTENING_DETAIL',
    question: 'Ancient civilizations used _____ to preserve food for long periods',
    context: 'A lecture on food preservation techniques throughout history',
    correctAnswer: 'salt and ice',
    audioFile: 'test1-section4.mp3',
    difficulty: 'Hard',
    level: 'C1',
    topic: 'Scientific'
  },
  {
    id: 'LQ-032',
    testId: 'LT-001',
    testName: 'IELTS Listening Practice Test 1',
    section: 4,
    questionNumber: 32,
    questionType: 'Sentence Completion',
    skill: 'Understanding sequence and process',
    skillId: 'LISTENING_SEQUENCE',
    question: 'The first step in modern canning is to _____',
    context: 'A lecture on food preservation techniques throughout history',
    correctAnswer: 'heat the containers',
    audioFile: 'test1-section4.mp3',
    difficulty: 'Hard',
    level: 'C1',
    topic: 'Scientific'
  },

  // Test 2 - Section 1: Table Completion
  {
    id: 'LQ-041',
    testId: 'LT-002',
    testName: 'IELTS Listening Practice Test 2',
    section: 1,
    questionNumber: 1,
    questionType: 'Table Completion',
    skill: 'Listening for specific information',
    skillId: 'LISTENING_SPECIFIC_INFORMATION',
    question: 'Course Name',
    context: 'A conversation between a student and university administrator about course enrollment',
    correctAnswer: 'Environmental Science',
    audioFile: 'test2-section1.mp3',
    difficulty: 'Easy',
    level: 'B1',
    topic: 'Academic'
  },
  {
    id: 'LQ-042',
    testId: 'LT-002',
    testName: 'IELTS Listening Practice Test 2',
    section: 1,
    questionNumber: 2,
    questionType: 'Table Completion',
    skill: 'Listening for specific information',
    skillId: 'LISTENING_SPECIFIC_INFORMATION',
    question: 'Course Code',
    context: 'A conversation between a student and university administrator about course enrollment',
    correctAnswer: 'ENV201',
    audioFile: 'test2-section1.mp3',
    difficulty: 'Easy',
    level: 'B1',
    topic: 'Academic'
  },

  // Test 2 - Section 2: Map Labeling
  {
    id: 'LQ-051',
    testId: 'LT-002',
    testName: 'IELTS Listening Practice Test 2',
    section: 2,
    questionNumber: 11,
    questionType: 'Map Labeling',
    skill: 'Listening for specific information',
    skillId: 'LISTENING_SPECIFIC_INFORMATION',
    question: 'Location of the library on campus map',
    context: 'A campus tour guide describing university facilities',
    correctAnswer: 'Building C, North Wing',
    audioFile: 'test2-section2.mp3',
    difficulty: 'Medium',
    level: 'B2',
    topic: 'Academic'
  },

  // Test 3 - Section 1: Form Completion (Travel)
  {
    id: 'LQ-061',
    testId: 'LT-003',
    testName: 'IELTS Listening Practice Test 3',
    section: 1,
    questionNumber: 1,
    questionType: 'Form Completion',
    skill: 'Listening for specific information',
    skillId: 'LISTENING_SPECIFIC_INFORMATION',
    question: 'Passenger Name',
    context: 'A phone conversation booking a flight ticket',
    correctAnswer: 'Michael Thompson',
    audioFile: 'test3-section1.mp3',
    difficulty: 'Easy',
    level: 'A2',
    topic: 'Travel'
  },
  {
    id: 'LQ-062',
    testId: 'LT-003',
    testName: 'IELTS Listening Practice Test 3',
    section: 1,
    questionNumber: 2,
    questionType: 'Form Completion',
    skill: 'Listening for specific information',
    skillId: 'LISTENING_SPECIFIC_INFORMATION',
    question: 'Destination',
    context: 'A phone conversation booking a flight ticket',
    correctAnswer: 'Singapore',
    audioFile: 'test3-section1.mp3',
    difficulty: 'Easy',
    level: 'A2',
    topic: 'Travel'
  },

  // Test 4 - Section 1: Multiple Choice (Workplace)
  {
    id: 'LQ-071',
    testId: 'LT-004',
    testName: 'IELTS Listening Practice Test 4',
    section: 1,
    questionNumber: 1,
    questionType: 'Multiple Choice',
    skill: 'Listening for gist',
    skillId: 'LISTENING_GIST',
    question: 'What is the main topic of the staff meeting?',
    context: 'A workplace staff meeting discussion',
    options: [
      'New health and safety procedures',
      'Upcoming company restructuring',
      'Annual performance reviews',
      'Office relocation plans'
    ],
    correctAnswer: 'New health and safety procedures',
    audioFile: 'test4-section1.mp3',
    difficulty: 'Medium',
    level: 'B1',
    topic: 'Professional / Workplace'
  },

  // Test 5 - Section 4: Flow Chart Completion (Academic)
  {
    id: 'LQ-081',
    testId: 'LT-005',
    testName: 'IELTS Listening Practice Test 5',
    section: 4,
    questionNumber: 31,
    questionType: 'Flow Chart',
    skill: 'Understanding sequence and process',
    skillId: 'LISTENING_SEQUENCE',
    question: 'First stage of the water purification process',
    context: 'A lecture on water treatment and purification systems',
    correctAnswer: 'Screening and filtration',
    audioFile: 'test5-section4.mp3',
    difficulty: 'Hard',
    level: 'C2',
    topic: 'Scientific'
  },
  {
    id: 'LQ-082',
    testId: 'LT-005',
    testName: 'IELTS Listening Practice Test 5',
    section: 4,
    questionNumber: 32,
    questionType: 'Flow Chart',
    skill: 'Understanding sequence and process',
    skillId: 'LISTENING_SEQUENCE',
    question: 'Second stage involves adding _____',
    context: 'A lecture on water treatment and purification systems',
    correctAnswer: 'chlorine',
    audioFile: 'test5-section4.mp3',
    difficulty: 'Hard',
    level: 'C2',
    topic: 'Scientific'
  }
];

export function getQuestionsByTest(testId: string): ListeningQuestion[] {
  return listeningQuestions.filter(q => q.testId === testId);
}

export function getQuestionsBySkill(skillId: string): ListeningQuestion[] {
  return listeningQuestions.filter(q => q.skillId === skillId);
}

export function getTestById(testId: string): ListeningTest | undefined {
  return listeningTests.find(t => t.id === testId);
}
