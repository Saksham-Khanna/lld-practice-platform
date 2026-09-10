export interface Problem {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  context: string;
}

export interface Attempt {
  id: string;
  problemId: string;
  status: 'Completed' | 'In Progress' | 'Failed';
  date: string;
  score?: number;
  evaluationId?: string;
}

export interface Submission {
  id: string;
  attemptId: string;
  problemId: string;
  content: {
    requirements: string;
    classes: string;
    responsibilities: string;
    relationships: string;
    decisions: string;
    edgeCases: string;
  };
}

export interface Evaluation {
  id: string;
  submissionId: string;
  overallScore: number;
  rubricScores: {
    requirementUnderstanding: number;
    classResponsibilities: number;
    couplingCohesion: number;
    encapsulationInterfaces: number;
    abstractionPatterns: number;
    extensibility: number;
    edgeCasesTestability: number;
    explanationQuality: number;
  };
  feedback: {
    concern: string;
    evidence: string;
    suggestion: string;
  }[];
}

export const PROBLEMS: Problem[] = [
  {
    id: 'parking-lot',
    title: 'Parking Lot System',
    description: 'Design a system to manage a multi-story parking lot with different vehicle types.',
    requirements: [
      'Support multiple floors',
      'Support different vehicle types (Car, Motorcycle, Truck)',
      'Automated ticketing and payment system',
      'Ability to find the nearest available spot for a vehicle type',
      'Support for multiple entry and exit points'
    ],
    difficulty: 'Medium',
    tags: ['Object-Oriented Design', 'State Management', 'Concurrency'],
    context: 'The parking lot needs to handle high throughput of vehicles and ensure fair allocation of spots. Consider how you would handle different pricing strategies based on vehicle type and duration.'
  },
  {
    id: 'elevator-system',
    title: 'Elevator Control System',
    description: 'Design the control logic for a building with multiple elevators and floors.',
    requirements: [
      'Support multiple elevators',
      'Optimize for minimum wait time (scheduling algorithm)',
      'Handle internal (floor) and external (lobby) requests',
      'Implement safety constraints (max load, emergency stop)',
      'Support for different building modes (Maintenance, Fire Alarm)'
    ],
    difficulty: 'Hard',
    tags: ['Scheduling', 'Algorithm', 'State Machine'],
    context: 'The system must be efficient. Think about the dispatching strategy. Should elevators be assigned based on proximity or direction?'
  },
  {
    id: 'vending-machine',
    title: 'Vending Machine',
    description: 'Design a vending machine that handles product selection and payments.',
    requirements: [
      'Support multiple product types with different prices',
      'Handle various payment methods (Coins, Cards)',
      'Manage inventory and out-of-stock states',
      'Implement a state machine for the purchase flow',
      'Dispense change accurately'
    ],
    difficulty: 'Easy',
    tags: ['State Pattern', 'Financial Logic', 'Inventory'],
    context: 'The vending machine should be highly extensible to support new payment methods or product types without changing core logic.'
  },
  {
    id: 'library-management',
    title: 'Library Management System',
    description: 'Design a system to manage books, members, and loans in a library.',
    requirements: [
      'Search books by title, author, or category',
      'Handle book issuing and returning',
      'Manage member subscriptions and fines',
      'Support reservations for currently loaned books',
      'Implement a notification system for overdue books'
    ],
    difficulty: 'Medium',
    tags: ['Search', 'Notification', 'CRUD'],
    context: 'Focus on the relationship between books, copies, and members. Consider how to handle reservation queues.'
  }
];

export const MOCK_ATTEMPTS: Attempt[] = [
  {
    id: 'att-1',
    problemId: 'parking-lot',
    status: 'Completed',
    date: '2023-10-20',
    score: 85,
    evaluationId: 'eval-1'
  },
  {
    id: 'att-2',
    problemId: 'vending-machine',
    status: 'In Progress',
    date: '2023-10-22'
  },
  {
    id: 'att-3',
    problemId: 'elevator-system',
    status: 'Failed',
    date: '2023-10-15',
    score: 40,
    evaluationId: 'eval-2'
  }
];

export const MOCK_EVALUATIONS: Record<string, Evaluation> = {
  'eval-1': {
    id: 'eval-1',
    submissionId: 'sub-1',
    overallScore: 85,
    rubricScores: {
      requirementUnderstanding: 90,
      classResponsibilities: 80,
      couplingCohesion: 85,
      encapsulationInterfaces: 80,
      abstractionPatterns: 85,
      extensibility: 90,
      edgeCasesTestability: 80,
      explanationQuality: 90
    },
    feedback: [
      {
        concern: 'Slight tight coupling between ParkingSpot and Vehicle.',
        evidence: 'The ParkingSpot class directly checks the Vehicle type using an instanceOf check in the assignVehicle method.',
        suggestion: 'Introduce a VehicleType interface or enum that both ParkingSpot and Vehicle use to determine compatibility.'
      },
      {
        concern: 'Concurrency handling for spot allocation is missing.',
        evidence: 'The current implementation of findAvailableSpot does not use any synchronization mechanisms.',
        suggestion: 'Use a ConcurrentQueue or implement a locking mechanism to prevent double-allocation of the same spot.'
      }
    ]
  },
  'eval-2': {
    id: 'eval-2',
    submissionId: 'sub-2',
    overallScore: 40,
    rubricScores: {
      requirementUnderstanding: 50,
      classResponsibilities: 30,
      couplingCohesion: 40,
      encapsulationInterfaces: 30,
      abstractionPatterns: 20,
      extensibility: 30,
      edgeCasesTestability: 40,
      explanationQuality: 60
    },
    feedback: [
      {
        concern: 'Lack of abstraction in elevator movement logic.',
        evidence: 'The Elevator class contains a massive if-else block handling every possible state transition.',
        suggestion: 'Implement the State Pattern to encapsulate different elevator states (Idle, MovingUp, MovingDown).'
      },
      {
        concern: 'Inefficient scheduling algorithm.',
        evidence: 'The system simply processes requests in the order they arrived (FIFO), regardless of elevator position.',
        suggestion: 'Implement the SCAN algorithm (Elevator Algorithm) to optimize movement and reduce wait times.'
      }
    ]
  }
};
