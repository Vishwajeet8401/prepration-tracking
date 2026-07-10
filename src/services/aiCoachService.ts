/**
 * AI Coach Service
 * Provides progressive, structured guidance for code problems without spoilers.
 * Uses smart heuristics based on the problem and the user's code to provide highly realistic feedback.
 */

import { CodeQuestion, CodeLanguage } from '../types';

export interface AICoachResponse {
  type: string;
  title: string;
  content: string;
  // Additional structured meta-data
  metadata?: {
    timeComplexity?: string;
    spaceComplexity?: string;
    score?: {
      correctness: number;
      readability: number;
      optimization: number;
      edgeCases: number;
      overall: number;
    };
    dryRun?: Array<{
      step: number;
      state: string;
      explanation: string;
    }>;
    concepts?: string[];
    suggestedProblems?: Array<{ title: string; difficulty: 'Easy' | 'Medium' | 'Hard' }>;
  };
}

// Pre-programmed progressive hints to ensure zero spoilers
const PROGRESSIVE_HINTS: Record<string, string[]> = {
  'two-sum': [
    'Think about what information you need to remember while iterating through the array. Can you look up elements you have already seen?',
    'Can a hash map help you check for the required complement value in constant O(1) time?',
    'Store each number index as you traverse the array. For each number, check whether (target - num) exists in the map.',
    'A HashMap solution achieves O(N) time complexity and O(N) space complexity. Try iterating once!'
  ],
  'reverse-string': [
    'How do we reverse elements in place? Can we do it without allocating extra memory?',
    'Try using two pointers: one starting at the beginning (left) and one at the end (right).',
    'Swap the characters at the left and right pointers, then move left forward and right backward. Repeat until they meet.',
    'This two-pointer swap achieves O(N) time and O(1) space complexity.'
  ],
  'palindrome-number': [
    'Can you reverse the integer digits? Be careful about negative numbers; can they ever be palindromes?',
    'If we reverse the entire integer, we might overflow. Is there a way to reverse only the second half of the number?',
    'Compare the first half of the number with the reversed second half. If they match, or match after dividing by 10 (for odd digits), it is a palindrome.',
    'This mathematical division achieves O(log10(N)) time and O(1) space complexity.'
  ],
  'fizz-buzz': [
    'Iterate from 1 to n. For each number, check if it is divisible by both 3 and 5.',
    'Make sure you check divisibility by 15 (or both 3 and 5) first, otherwise you might output Fizz or Buzz prematurely.',
    'Alternatively, you can concatenate strings ("Fizz" + "Buzz") to keep code clean and extensible.',
    'This linear scan runs in O(N) time complexity and uses O(1) extra space.'
  ],
  'valid-parentheses': [
    'We need to match the most recently opened bracket with the next closing bracket. Which data structure supports Last-In-First-Out?',
    'Use a Stack. Push opening brackets `(`, `{`, `[` onto the stack.',
    'When you see a closing bracket, check if the stack is empty. If not, pop the top and verify it matches the current closing bracket.',
    'If the stack is empty at the end, the string is valid. This runs in O(N) time and O(N) space.'
  ],
  'max-subarray': [
    'Can we solve this by keeping track of the running sum of subarray? When does a running sum become useless?',
    'If the current subarray sum drops below 0, it will only decrease any future sum. We should reset it to 0.',
    'This is Kadane\'s Algorithm: `currentMax = max(nums[i], currentMax + nums[i])`. Track the global max.',
    'Kadane\'s algorithm runs in O(N) time and O(1) space.'
  ],
  'binary-search': [
    'Use the sorted nature of the array. Find the middle element.',
    'If target is smaller than middle, look left. If larger, look right. Adjust the boundaries `low` and `high` accordingly.',
    'Calculate the middle safely: `mid = low + (high - low) / 2` to avoid integer overflow.',
    'Binary search cuts search space in half each step, achieving O(log N) time.'
  ],
  'fibonacci': [
    'The naive recursive solution `F(n) = F(n-1) + F(n-2)` takes exponential O(2^n) time. How can we optimize it?',
    'Avoid redundant calculations by storing previous results (memoization) or calculating bottom-up (dynamic programming).',
    'Since we only need the last two values to compute the next one, we can just keep two variables instead of a whole array.',
    'This space-optimized iterative approach achieves O(N) time and O(1) space.'
  ],
  'longest-common-prefix': [
    'If we sort the strings alphabetically, which strings will have the least similarity?',
    'The first and the last strings in the sorted list will have the maximum difference. Comparing only these two is sufficient!',
    'Alternatively, pick the first string as the prefix and scan/trim it against each subsequent string.',
    'Sorting takes O(N * L log N), while scanning takes O(N * L). Choose the approach that fits best!'
  ],
  'sum-array': [
    'Initialize a variable `sum = 0`.',
    'Loop through each element in the array and add it to `sum`.',
    'Return the total sum after the loop finishes.',
    'This is a simple O(N) time operation with O(1) auxiliary space.'
  ]
};

/**
 * Generate a dynamic hint based on the progress level.
 */
export function getHint(questionId: string, currentHintIndex: number): AICoachResponse {
  const hints = PROGRESSIVE_HINTS[questionId] || [
    'Read the constraints carefully.',
    'Try to break the problem into smaller subproblems.',
    'Consider the time and space complexity of your approach.'
  ];

  const index = Math.min(Math.max(0, currentHintIndex), hints.length - 1);
  const nextIndex = index + 1 < hints.length ? index + 1 : null;
  const progressText = `Hint ${index + 1} of ${hints.length}`;

  return {
    type: 'hint',
    title: `💡 Progressive Hint (${progressText})`,
    content: hints[index],
    metadata: {
      concepts: nextIndex !== null ? [`Next hint available: click again`] : [`You've unlocked all hints!`]
    }
  };
}

/**
 * Heuristic code analysis to detect complexity and quality.
 */
function analyzeCodeStructure(code: string) {
  const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // strip comments

  // Check loops
  const forLoops = (cleanCode.match(/for\s*\(/g) || []).length;
  const whileLoops = (cleanCode.match(/while\s*\(/g) || []).length;
  const nestedLoops = (cleanCode.match(/for\s*\(.*\{\s*[^}]*for\s*\(/g) || []).length;

  // Check data structures
  const hasMap = cleanCode.includes('HashMap') || cleanCode.includes('Map') || cleanCode.includes('dict') || cleanCode.includes('set(') || cleanCode.includes('HashSet');
  const hasStack = cleanCode.includes('Stack') || cleanCode.includes('.pop()') || cleanCode.includes('stack =');

  let timeComplexity = 'O(N)';
  let spaceComplexity = 'O(1)';
  let complexityExplanation = 'Linear iteration through the inputs.';

  if (nestedLoops > 0 || forLoops >= 2) {
    if (nestedLoops > 0) {
      timeComplexity = 'O(N²)';
      complexityExplanation = 'Nested iterations cause quadratic comparisons.';
    } else {
      timeComplexity = 'O(N)';
      complexityExplanation = 'Sequential loops scale linearly.';
    }
  } else if (cleanCode.includes('/ 2') || cleanCode.includes('>> 1') || cleanCode.includes('mid')) {
    timeComplexity = 'O(log N)';
    complexityExplanation = 'The search space is halved in each step.';
  }

  if (hasMap || hasStack) {
    spaceComplexity = 'O(N)';
  }

  return {
    timeComplexity,
    spaceComplexity,
    complexityExplanation,
    hasMap,
    hasStack,
    forLoops,
    nestedLoops
  };
}

/**
 * Main function that produces Coach responses based on tab/action.
 */
export function getCoachFeedback(
  action: string,
  question: CodeQuestion,
  code: string,
  language: CodeLanguage,
  compileError?: string
): AICoachResponse {
  const analysis = analyzeCodeStructure(code);

  switch (action) {
    case 'explain':
      return {
        type: 'explain',
        title: '🧠 Code Explanation',
        content: `### Code Analysis

Your implementation is written in **${language.toUpperCase()}**.

**Heuristics detected:**
- Time Complexity: \`${analysis.timeComplexity}\` (${analysis.complexityExplanation})
- Space Complexity: \`${analysis.spaceComplexity}\`

### How it works:
1. It processes the input structures as defined in your entry method.
2. ${analysis.nestedLoops > 0 
          ? 'It relies on nested loops to compare elements. While correct, this can cause performance issues on very large arrays (N > 10,000).' 
          : 'It runs in linear or sub-linear time, avoiding nested comparisons for optimal scaling.'}
3. Memory overhead is \`${analysis.spaceComplexity}\` based on the auxiliary objects allocated in memory.`,
        metadata: {
          timeComplexity: analysis.timeComplexity,
          spaceComplexity: analysis.spaceComplexity,
        }
      };

    case 'debug':
      if (compileError) {
        return {
          type: 'debug',
          title: '🐞 Compiler Debugger',
          content: `### Diagnostic Feedback

The compiler reported a syntax or typing error:
\`\`\`text
${compileError}
\`\`\`

**AI Advice:**
1. Check that all opening brackets \`{\`, \`(\`, \`[\` have matching closing ones.
2. Confirm variables are declared before use and matching target types.
3. Make sure semicolons are present on statements if using Java/C/C++.`,
        metadata: {
          concepts: ['Syntax checking', 'Type safety']
        }
      }
    }

      // Runtime / general debugging
      return {
        type: 'debug',
        title: '🐞 Runtime Debugger',
        content: `### Dry Run Audit

No compile errors detected. If you are failing cases:
1. Check boundary limits (empty array, single element, negative numbers).
2. Ensure you do not modify arrays in place while iterating unless intended.
3. Verify loop termination conditions to avoid infinite loops.`,
        metadata: {
          concepts: ['Edge Cases', 'Index Verification']
        }
      };

    case 'optimize':
      const canOptimize = analysis.timeComplexity === 'O(N²)';
      return {
        type: 'optimize',
        title: '⚡ Code Optimization Helper',
        content: canOptimize
          ? `### Optimization Suggestion

**Current Complexity:** \`O(N²)\`
**Possible Improvement:** \`O(N)\`

**How to optimize:**
Replace nested loops with a hash-based lookup map (e.g. \`HashMap\` or \`dict\`). Instead of re-checking previous elements, store them as you go to look them up instantly in O(1) time.`
          : `### Performance Profile

Your code looks optimized! It has a complexity of \`${analysis.timeComplexity}\` which is clean.
Keep an eye on hidden operations like string concatenation in loops or sub-array slicing.`,
        metadata: {
          timeComplexity: analysis.timeComplexity,
          spaceComplexity: analysis.spaceComplexity,
        }
      };

    case 'complexity':
      return {
        type: 'complexity',
        title: '🔍 Complexity Analysis',
        content: `### Complexity Statistics

- **Time Complexity:** \`${analysis.timeComplexity}\`
- **Space Complexity:** \`${analysis.spaceComplexity}\`

*Note: Runtime scales primarily based on iterations over structural arrays or key recursive steps.*`,
        metadata: {
          timeComplexity: analysis.timeComplexity,
          spaceComplexity: analysis.spaceComplexity
        }
      };

    case 'dryrun':
      // Dynamic dry run steps based on question
      let steps: Array<{ step: number; state: string; explanation: string }> = [];
      if (question.id === 'two-sum') {
        steps = [
          { step: 1, state: 'current = 2 | need = 7 | map = {}', explanation: '7 is not in map. Store 2 -> index 0.' },
          { step: 2, state: 'current = 7 | need = 2 | map = {2: 0}', explanation: '2 is found in map! Solution indices: [0, 1].' }
        ];
      } else {
        steps = [
          { step: 1, state: 'Initialize pointers / index scanning', explanation: 'Check bounds and setup state variables.' },
          { step: 2, state: 'Loop iteration', explanation: 'Process element and compute local step values.' }
        ];
      }

      return {
        type: 'dryrun',
        title: '📝 Dry Run Visualization',
        content: `Here is how the algorithm processes the input:`,
        metadata: {
          dryRun: steps
        }
      };

    case 'learn':
      return {
        type: 'learn',
        title: '📚 Concept Learning',
        content: `### Key Concepts for this Problem

This question practices the following algorithms:
- **Array Traversal**: Moving pointers or loops through linear arrays.
- **Lookup Maps**: Optimizing search query overhead from quadratic to constant time.

**Recommended related problems:**
1. *Contains Duplicate* (Easy)
2. *Intersection of Two Arrays* (Easy)
3. *3Sum* (Medium)`,
        metadata: {
          concepts: question.tags,
          suggestedProblems: [
            { title: 'Contains Duplicate', difficulty: 'Easy' },
            { title: '3Sum', difficulty: 'Medium' }
          ]
        }
      };

    default:
      return {
        type: 'ask',
        title: '🤖 Ask AI mentor',
        content: 'I am here to guide you step-by-step. Let me know what questions you have about this algorithm.'
      };
  }
}

/**
 * Generate post-submission evaluation metrics.
 */
export function evaluateSubmission(
  question: CodeQuestion,
  code: string,
  passedAll: boolean
): AICoachResponse {
  const analysis = analyzeCodeStructure(code);
  
  const correctness = passedAll ? 100 : 40;
  const readability = code.length > 50 ? 90 : 60;
  const optimization = analysis.timeComplexity === 'O(N²)' ? 65 : 95;
  const edgeCases = passedAll ? 100 : 50;
  const overall = Math.round((correctness + readability + optimization + edgeCases) / 4);

  return {
    type: 'evaluation',
    title: '📝 Interview Simulator Feedback',
    content: `### Interview Evaluation Score: **${overall}/100**

- **Correctness:** ${correctness}%
- **Code Readability:** ${readability}%
- **Optimization:** ${optimization}%
- **Edge Cases:** ${edgeCases}%

${passedAll 
  ? 'Great job! Your solution passes all test cases and is optimally structured.' 
  : 'Your solution didn\'t pass all test cases yet. Refine boundary inputs or check logic constraints.'}`,
    metadata: {
      score: { correctness, readability, optimization, edgeCases, overall }
    }
  };
}
