/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Topic, Question, JobApplication, Interview, Mistake, StudySession, AppNotification, InterviewIntelligenceQuestion, Subject } from './types';

export const initialSubjects: Subject[] = [
  {
    id: 'subj-backend',
    name: 'Backend Engineering',
    description: 'Server-side programming, frameworks, and architecture.',
    color: 'bg-emerald-500',
    createdAt: new Date().toISOString()
  },
  {
    id: 'subj-system-design',
    name: 'System Design',
    description: 'Scalability, distributed systems, and architectural patterns.',
    color: 'bg-indigo-500',
    createdAt: new Date().toISOString()
  }
];

export const initialTopics: Topic[] = [
  {
    id: 'java-core',
    subjectId: 'subj-backend',
    name: 'Java Core',
    category: 'Java Core',
    description: 'OOP Principles, JVM Architecture, Memory Management, and Basic Garbage Collection constructs.',
    status: 'Interview Ready',
    confidenceScore: 82,
    recallScore: 85,
    revisionCount: 8,
    lastRevisionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    nextRevisionDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // in 4 days
    forgotCount: 0,
    notes: `* **4 Principles of OOP**: Abstraction, Polymorphism, Inheritance, Encapsulation.
* **JVM memory**: Stack (stores local variables, method call frames) vs Heap (stores dynamically allocated objects).
* **Garbage Collectors**: G1GC, ZGC, Serial, Parallel. Main parts: Young Gen (Eden, S0, S1), Old/Tenured Gen, Metaspace.
* **String Pool**: Implements string interning to save heap memory. Strings in Java are immutable.`,
    dependencyIds: []
  },
  {
    id: 'collections',
    subjectId: 'subj-backend',
    name: 'Collections Framework',
    category: 'Collections',
    description: 'List, Set, Map interfaces, custom hashing, Concurrent HashMap, Fail-Fast vs Fail-Safe iterators.',
    status: 'Revising',
    confidenceScore: 68,
    recallScore: 55,
    revisionCount: 5,
    lastRevisionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    nextRevisionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Overdue by 1 day!
    forgotCount: 2,
    notes: `* **Fail-Fast**: Throws ConcurrentModificationException if collection modified during iteration (e.g. ArrayList, HashMap). Uses internal modCount.
* **Fail-Safe**: Operates on a clone or offers weakly consistent iteration (e.g., ConcurrentHashMap, CopyOnWriteArrayList).
* **ConcurrentHashMap**: Uses bucket-level locking (synchronized node headers in Java 8) instead of locking the entire table (like Hashtable / Collections.synchronizedMap).
* **Load Factor**: Default is 0.75. When size exceeds capacity * load factor, resizing happens (triggers rehashing).`,
    dependencyIds: ['java-core']
  },
  {
    id: 'streams',
    subjectId: 'subj-backend',
    name: 'Java 8 Streams & Lambdas',
    category: 'Java 8',
    description: 'Functional interfaces, Streams API, lazy evaluation, intermediate vs terminal operations, custom collectors.',
    status: 'Learning',
    confidenceScore: 45, // Weak Confidence!
    recallScore: 40,
    revisionCount: 3,
    lastRevisionDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    nextRevisionDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    forgotCount: 1,
    notes: `* **Stream Pipeline**: Source -> Zero or more intermediate operations -> One terminal operation.
* **Intermediate Operations**: Lazy evaluation (e.g., filter, map, flatMap, sorted, distinct). They return a new stream and do not execute until a terminal action is called.
* **Terminal Operations**: Eager evaluation (e.g., collect, forEach, reduce, count, findFirst). Trigger the actual pipeline execution.
* **Functional Interfaces**: Interface with exactly one abstract method (e.g., Predicate<T> [t -> boolean], Function<T,R> [t -> r], Consumer<T> [t -> void], Supplier<T> [() -> t]).`,
    dependencyIds: ['collections']
  },
  {
    id: 'completable-future',
    subjectId: 'subj-backend',
    name: 'CompletableFuture & Multithreading',
    category: 'Multithreading',
    description: 'Asynchronous task orchestration, Executing, ThreadPools, task callbacks, and CompletableFuture combinations.',
    status: 'Practicing',
    confidenceScore: 40,
    recallScore: 30,
    revisionCount: 2,
    lastRevisionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    nextRevisionDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    forgotCount: 3, // Forgot 3 times!
    notes: `* **CompletableFuture**: Future that can be explicitly completed. Supports callbacks (thenApply, thenAccept, thenRun) and chaining.
* **ForkJoinPool.commonPool()**: Used by default for all async tasks if custom Executor is not specified. Highly dangerous in heavy-load productions!
* **Combining**:
  * \`thenCombine()\`: runs two futures and combines results when both complete.
  * \`allOf()\`: returns a composite future that completes when all input futures complete.
  * \`anyOf()\`: completes as soon as any of the input futures finishes.`,
    dependencyIds: ['java-core']
  },
  {
    id: 'spring-boot',
    subjectId: 'subj-backend',
    name: 'Spring Boot Architecture',
    category: 'Spring Boot',
    description: 'Bean lifecycles, Autowiring, Dependency Injection, Inversion of Control, Profiles, Actuator metrics.',
    status: 'Revising',
    confidenceScore: 88,
    recallScore: 90,
    revisionCount: 12,
    lastRevisionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    nextRevisionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // interview in 5 days matches!
    forgotCount: 0,
    notes: `* **IoC Container**: Manages bean instantiation, configuration, and destruction lifecycle.
* **Bean Scope**: Singleton (default - one instance per container), Prototype (new instance on every request), Request, Session.
* **@SpringBootApplication**: Meta-annotation combining \`@Configuration\`, \`@EnableAutoConfiguration\`, and \`@ComponentScan\`.
* **Spring Boot Actuator**: Exposes production-ready telemetry endpoints (health, info, metrics, env).`,
    dependencyIds: ['streams']
  },
  {
    id: 'spring-data',
    subjectId: 'subj-backend',
    name: 'Spring Data JPA & Hibernate',
    category: 'Hibernate',
    description: 'Entity mappings, persistence context, lazy loading issues, N+1 query problem, dirty checking.',
    status: 'Learning',
    confidenceScore: 52,
    recallScore: 50,
    revisionCount: 4,
    lastRevisionDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    nextRevisionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Overdue!
    forgotCount: 1,
    notes: `* **N+1 Problem**: Happens when child entities are loaded lazily. If parent has N records, hibernate runs 1 query to fetch parents, and N separate queries to fetch children.
  * *Solution*: Use \`@Query("SELECT p FROM Parent p LEFT JOIN FETCH p.children")\` or EntityGraphs.
* **First-Level Cache**: Bound to the Session object (enabled by default). Saves DB lookups within the same transaction.
* **Second-Level Cache**: Shared across Sessions (cluster-wide or JVM-wide). Needs custom provider setup like Ehcache.`,
    dependencyIds: ['spring-boot']
  },
  {
    id: 'system-design',
    subjectId: 'subj-system-design',
    name: 'System Design: Scalability & Caching',
    category: 'System Design',
    description: 'Load balancing, CDN, vertical vs horizontal scaling, Redis caching strategies, database replication.',
    status: 'Not Started',
    confidenceScore: 5,
    recallScore: 0,
    revisionCount: 0,
    forgotCount: 0,
    notes: `* **Caching Strategies**: Cache-Aside (Lazy load), Write-Through, Write-Behind (Async cache update).
* **Load Balancer Algorithms**: Round Robin, Least Connections, IP Hash, Weighted RR.
* **CAP Theorem**: Consistency, Availability, Partition Tolerance. A distributed system can guarantee at most two simultaneously.`,
    dependencyIds: []
  }
];

export const initialQuestions: Question[] = [
  {
    id: 'q1',
    question: 'What is a fail-fast iterator? Explain with examples.',
    answer: 'A fail-fast iterator throws a ConcurrentModificationException immediately if the underlying collection is modified structurally (add or delete) during traversal, except through the iterator\'s own remove() method. ArrayList and HashMap iterators are fail-fast. It tracks changes using an internal "modCount" counter of the collection structure.',
    difficulty: 'Medium',
    topicId: 'collections',
    tags: ['Collections', 'Iterators', 'JVM'],
    source: 'Interview',
    askedCount: 5,
    lastAskedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 28 May
    lastRevisedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 May
  },
  {
    id: 'q2',
    question: 'How does ConcurrentHashMap achieve thread safety in Java 8?',
    answer: 'In Java 8, ConcurrentHashMap replaces segment-level locking (reentrant locks on segments) with table-bucket level synchronization. It uses CAS (Compare-And-Swap) operations to insert empty bucket headers, and Synchronized monitors directly on the first node of each non-empty bucket chain or tree. This allows multiple threads to access separate buckets concurrently without blocking each other.',
    difficulty: 'Hard',
    topicId: 'collections',
    tags: ['Collections', 'Concurrency', 'Multithreading'],
    source: 'Interview',
    askedCount: 8,
    lastAskedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    lastRevisedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'q3',
    question: 'What is the N+1 select problem in Hibernate, and how do you solve it?',
    answer: 'The N+1 problem occurs when Hibernate executes 1 query to retrieve primary parent entities, and then makes N additional subqueries to fetch lazy relationships for each parent. \n\nSolutions:\n1. Use "JOIN FETCH" in JPQL queries.\n2. Configure @EntityGraph to fetch associations eagerly in a single database join.\n3. Set batch-size configuration in Hibernate settings (e.g., hibernate.default_batch_fetch_size) to load children in bundles.',
    difficulty: 'Hard',
    topicId: 'spring-data',
    tags: ['Hibernate', 'JPA', 'SQL'],
    source: 'Interview',
    askedCount: 4,
    lastAskedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastRevisedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'q4',
    question: 'Explain the difference between Stream.map() and Stream.flatMap() in Java 8.',
    answer: 'Stream.map() is a 1-to-1 transformation: it takes each element in the input stream and transforms it into a single output element, yielding a Stream of Stream type if applied to nested lists.\nStream.flatMap() is a 1-to-Many flattening transformation: it takes each element, maps it into its own stream of sub-elements, and merges (flattens) all these generated streams into a single flat stream.',
    difficulty: 'Easy',
    topicId: 'streams',
    tags: ['Streams', 'Java 8', 'Functions'],
    source: 'Course',
    askedCount: 3,
    lastAskedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastRevisedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'q5',
    question: 'What happens when you use ThreadPoolExecutor and all threads are busy?',
    answer: 'When a new task is submitted to a ThreadPoolExecutor and all core threads are busy, the task is appended to the BlockingQueue. If the queue becomes full, a new temporary thread is created until the maximumPoolSize is reached. If maximum pool threads are active and the queue is full, the RejectedExecutionHandler is invoked (e.g. AbortPolicy, CallerRunsPolicy, DiscardPolicy).',
    difficulty: 'Hard',
    topicId: 'completable-future',
    tags: ['Concurrency', 'Multithreading', 'ThreadPool'],
    source: 'Book',
    askedCount: 2,
    lastAskedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    lastRevisedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'q6',
    question: 'What is a Marker Interface? Can you name some in Java?',
    answer: 'A marker interface is an empty interface with no fields or methods declared. It works as a tag/label to notify the compiler or JVM that the implementing class has certain runtime attributes. Examples include Serializable, Cloneable, and Remote. Reflections explore these tags to toggle specialized processes.',
    difficulty: 'Easy',
    topicId: 'java-core',
    tags: ['Java Core', 'OOP'],
    source: 'Interview',
    askedCount: 6,
    lastAskedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastRevisedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const initialJobApplications: JobApplication[] = [
  {
    id: 'job1',
    company: 'Fintech Solutions Ltd',
    position: 'Senior Java Backend Engineer',
    appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Interview Scheduled',
    notes: 'Rounds scheduled: Technical Round 1 on June 3rd (focused on JVM internals & Concurrency).'
  },
  {
    id: 'job2',
    company: 'TechCorp International',
    position: 'Full Stack Engineer (Java + React)',
    appliedDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Applied',
    notes: 'Awaiting dynamic resume scanning feedback from initial portal screening.'
  },
  {
    id: 'job3',
    company: 'Stripe Partners',
    position: 'Platform engineer',
    appliedDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Offer Received',
    notes: 'Offered base + stock options! Reviewing terms and matching other queues before signing.'
  }
];

export const initialInterviews: Interview[] = [
  {
    id: 'int1',
    companyName: 'Fintech Solutions Ltd',
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // In 4 Days
    status: 'Scheduled',
    questionsAsked: [],
    questionsMissed: [],
    feedback: 'Pre-round summary: Be sure to review custom threadpool sizing calculations and spring context initialization scope.',
    result: 'Pending'
  },
  {
    id: 'int2',
    companyName: 'Stripe Partners',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Completed',
    questionsAsked: ['How does ConcurrentHashMap achieve thread safety?', 'Explain differences between Stream.map and Stream.flatMap'],
    questionsMissed: [],
    feedback: 'Both engineering rounds went exceptionally well! Handled system scalability and caching answers flawlessly.',
    result: 'Selected'
  },
  {
    id: 'int3',
    companyName: 'Uber Tech Inc',
    date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Completed',
    questionsAsked: ['What is a Marker Interface?', 'Explain N+1 query problem', 'Detail G1GC Young GC Sweep phases'],
    questionsMissed: ['Detail G1GC Young GC Sweep phases', 'Explain N+1 query problem'],
    feedback: 'Missed explaining the exact G1GC sweep phases accurately, and N+1 join fetch mitigation was incomplete.',
    result: 'Rejected'
  }
];

export const initialMistakes: Mistake[] = [
  {
    id: 'm1',
    companyName: 'Uber Tech Inc',
    date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    missedQuestions: ['G1GC Young GC Sweep Phases', 'N+1 session caching limits'],
    reason: 'Forgot the internal JVM young generation memory promotion triggers and Session vs EntityManager transactional constraints.'
  },
  {
    id: 'm2',
    companyName: 'Stripe Partners Round 1 Practice',
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    missedQuestions: ['Fail-fast iterator exceptions'],
    reason: 'Unclear distinction behind modCount validation checks on local collection modifications.'
  }
];

export const initialStudySessions: StudySession[] = [
  {
    id: 's1',
    topicId: 'collections',
    startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(),
    duration: 45, // 45 mins
    notes: 'Reviewed ConcurrentHashMap segment differences and fail-fast triggers.'
  },
  {
    id: 's2',
    topicId: 'spring-boot',
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 5 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    notes: 'Tested bean lifecycle methods and autowire conflicts solution.'
  },
  {
    id: 's3',
    topicId: 'streams',
    startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(),
    duration: 90,
    notes: 'Practiced combining intermediate functional operations.'
  },
  {
    id: 's4',
    topicId: 'java-core',
    startTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(),
    duration: 90,
    notes: 'Studied JVM layout (Heap vs Stack Memory layout and components).'
  },
  {
    id: 's5',
    topicId: 'spring-data',
    startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000 - 40 * 60 * 1000).toISOString(),
    duration: 80,
    notes: 'Configured join fetch entitygraph annotations to fix lazy N+1 select alerts.'
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'Revision Due: Collections Framework',
    message: 'Your memory retention for ConcurrentHashMap might be fading. 1 topic overdue!',
    type: 'revision',
    date: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    read: false
  },
  {
    id: 'n2',
    title: 'Upcoming Interview Reminder',
    message: 'Fintech Solutions Ltd interview is scheduled in 4 days. Double check Spring Boot!',
    type: 'interview',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false
  },
  {
    id: 'n3',
    title: 'Weak Topic Alert',
    message: 'Java 8 Streams confidence score is below 50%. Schedule an active recall practice block.',
    type: 'weakness',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    read: true
  }
];

export const initialIntelliQuestions: InterviewIntelligenceQuestion[] = [
  {
    id: 'intq-1',
    company: 'OpenAI Inc',
    question: 'What is the internal working of ConcurrentHashMap in Java 8 and how does it prevent lock contention?',
    topic: 'Collections Framework',
    difficulty: 'Hard',
    dateAsked: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    answer: 'It uses node-level locking (synchronized first node of buckets) instead of segment locking, and CAS for initial empty bucket inserts. Contention is isolated per bucket hash index.',
    result: 'Answered Correctly'
  },
  {
    id: 'intq-2',
    company: 'Uber Tech Inc',
    question: 'Detail G1GC Young GC Sweep phases, heap fragmentation issues, and promotion threshold rules.',
    topic: 'Java Core',
    difficulty: 'Hard',
    dateAsked: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    answer: 'Copies active objects from Young regions to Survivor/Old regions; uses region-level allocation. Frag is mitigated by compaction. Missed explaining promotion ages.',
    result: 'Failed'
  },
  {
    id: 'intq-3',
    company: 'Stripe Partners',
    question: 'How do you coordinate multiple threads using CompletableFuture.allOf() and how do you handle partial failures?',
    topic: 'CompletableFuture & Multithreading',
    difficulty: 'Hard',
    dateAsked: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    answer: 'Combine them in allOf(). Try-catch or exceptionally() block can intercept individual failures, preventing total failure on the main combined trigger thread.',
    result: 'Answered Correctly'
  },
  {
    id: 'intq-4',
    company: 'Fintech Solutions Ltd',
    question: 'Explain the N+1 select problem in Hibernate/JPA, dirty checking, and first-level cache boundaries.',
    topic: 'Spring Data JPA & Hibernate',
    difficulty: 'Hard',
    dateAsked: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    answer: 'Queries child elements for each parent elements separately. Fixed using JOIN FETCH or @EntityGraph. Dirty checks monitor entity state updates in transaction.',
    result: 'Struggled'
  },
  {
    id: 'intq-5',
    company: 'Google',
    question: 'Explain Difference between Bean Factory and Application Context container in Spring core framework.',
    topic: 'Spring Boot Architecture',
    difficulty: 'Medium',
    dateAsked: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    answer: 'ApplicationContext is a sub-interface of BeanFactory adding publishing, AOP, transaction, internationalization, and instant eager loaded singleton bean initialization.',
    result: 'Answered Correctly'
  }
];

