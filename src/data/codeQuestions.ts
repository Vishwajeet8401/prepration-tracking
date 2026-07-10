import { CodeQuestion } from '../types';

export const CODE_QUESTIONS: CodeQuestion[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    description:
      'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    examples: [
      {
        input: '4\n2 7 11 15\n9',
        output: '0 1',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: '3\n3 2 4\n6',
        output: '1 2',
      },
    ],
    testCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1' },
      { input: '3\n3 2 4\n6', expectedOutput: '1 2' },
      { input: '2\n3 3\n6', expectedOutput: '0 1' },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    tags: ['Array', 'Hash Table'],
    starterCode: {
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();

        // Your solution here
        int[] result = twoSum(nums, target);
        System.out.println(result[0] + " " + result[1]);
    }

    static int[] twoSum(int[] nums, int target) {
        // TODO: implement
        return new int[]{};
    }
}`,
      python: `def two_sum(nums, target):
    # TODO: implement
    pass

n = int(input())
nums = list(map(int, input().split()))
target = int(input())
result = two_sum(nums, target)
print(result[0], result[1])`,
      c: `#include <stdio.h>
#include <stdlib.h>

void twoSum(int* nums, int n, int target, int* result) {
    // TODO: implement
}

int main() {
    int n, target;
    scanf("%d", &n);
    int nums[n];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);
    scanf("%d", &target);

    int result[2] = {0, 0};
    twoSum(nums, n, target, result);
    printf("%d %d\\n", result[0], result[1]);
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // TODO: implement
    return {};
}

int main() {
    int n, target;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    cin >> target;

    auto result = twoSum(nums, target);
    cout << result[0] << " " << result[1] << endl;
    return 0;
}`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l));
rl.on('close', () => {
    const n = parseInt(lines[0]);
    const nums = lines[1].split(' ').map(Number);
    const target = parseInt(lines[2]);

    function twoSum(nums, target) {
        // TODO: implement
        return [];
    }

    const result = twoSum(nums, target);
    console.log(result[0] + ' ' + result[1]);
});`,
      typescript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines: string[] = [];
rl.on('line', (l: string) => lines.push(l));
rl.on('close', () => {
    const n = parseInt(lines[0]);
    const nums = lines[1].split(' ').map(Number);
    const target = parseInt(lines[2]);

    function twoSum(nums: number[], target: number): number[] {
        // TODO: implement
        return [];
    }

    const result = twoSum(nums, target);
    console.log(result[0] + ' ' + result[1]);
});`,
      go: `package main

import "fmt"

func twoSum(nums []int, target int) []int {
    // TODO: implement
    return []int{}
}

func main() {
    var n, target int
    fmt.Scan(&n)
    nums := make([]int, n)
    for i := 0; i < n; i++ {
        fmt.Scan(&nums[i])
    }
    fmt.Scan(&target)

    result := twoSum(nums, target)
    fmt.Println(result[0], result[1])
}`,
      kotlin: `fun twoSum(nums: IntArray, target: Int): IntArray {
    // TODO: implement
    return intArrayOf()
}

fun main() {
    val n = readLine()!!.trim().toInt()
    val nums = readLine()!!.trim().split(" ").map { it.toInt() }.toIntArray()
    val target = readLine()!!.trim().toInt()
    val result = twoSum(nums, target)
    println("\${result[0]} \${result[1]}")
}`,
    },
  },
  {
    id: 'reverse-string',
    title: 'Reverse String',
    difficulty: 'Easy',
    description:
      'Write a function that reverses a string. The input string is given as a single line.\n\nPrint the reversed string.',
    examples: [
      { input: 'hello', output: 'olleh' },
      { input: 'Hannah', output: 'hannaH' },
    ],
    testCases: [
      { input: 'hello', expectedOutput: 'olleh' },
      { input: 'Hannah', expectedOutput: 'hannaH' },
      { input: 'abcdef', expectedOutput: 'fedcba' },
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of printable ASCII characters.'],
    tags: ['String', 'Two Pointers'],
    starterCode: {
      java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        // TODO: reverse and print
    }
}`,
      python: `s = input()
# TODO: reverse and print
`,
      c: `#include <stdio.h>
#include <string.h>

int main() {
    char s[100001];
    scanf("%s", s);
    // TODO: reverse and print
    return 0;
}`,
      cpp: `#include <iostream>
#include <algorithm>
#include <string>
using namespace std;

int main() {
    string s;
    getline(cin, s);
    // TODO: reverse and print
    return 0;
}`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (s) => {
    // TODO: reverse and print
    rl.close();
});`,
      typescript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (s: string) => {
    // TODO: reverse and print
    rl.close();
});`,
      go: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    reader := bufio.NewReader(os.Stdin)
    s, _ := reader.ReadString('\\n')
    // TODO: reverse and print
    fmt.Println(s)
}`,
      kotlin: `fun main() {
    val s = readLine()!!
    // TODO: reverse and print
}`,
    },
  },
  {
    id: 'palindrome-number',
    title: 'Palindrome Number',
    difficulty: 'Easy',
    description:
      'Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.\n\nAn integer is a palindrome when it reads the same forward and backward.\n\nPrint `true` or `false`.',
    examples: [
      { input: '121', output: 'true', explanation: '121 reads as 121 from left to right and from right to left.' },
      { input: '-121', output: 'false', explanation: 'From left to right, it reads -121. From right to left it becomes 121-. Therefore it is not a palindrome.' },
    ],
    testCases: [
      { input: '121', expectedOutput: 'true' },
      { input: '-121', expectedOutput: 'false' },
      { input: '10', expectedOutput: 'false' },
      { input: '0', expectedOutput: 'true' },
    ],
    constraints: ['-2^31 <= x <= 2^31 - 1'],
    tags: ['Math'],
    starterCode: {
      java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int x = sc.nextInt();
        System.out.println(isPalindrome(x));
    }

    static boolean isPalindrome(int x) {
        // TODO: implement
        return false;
    }
}`,
      python: `def is_palindrome(x):
    # TODO: implement
    return False

x = int(input())
print(str(is_palindrome(x)).lower())`,
      c: `#include <stdio.h>

int isPalindrome(int x) {
    // TODO: implement
    return 0;
}

int main() {
    int x;
    scanf("%d", &x);
    printf("%s\\n", isPalindrome(x) ? "true" : "false");
    return 0;
}`,
      cpp: `#include <iostream>
using namespace std;

bool isPalindrome(int x) {
    // TODO: implement
    return false;
}

int main() {
    int x;
    cin >> x;
    cout << (isPalindrome(x) ? "true" : "false") << endl;
    return 0;
}`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const x = parseInt(line);
    // TODO: implement isPalindrome
    console.log(false);
    rl.close();
});`,
      typescript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line: string) => {
    const x = parseInt(line);
    // TODO: implement isPalindrome
    console.log(false);
    rl.close();
});`,
      go: `package main

import "fmt"

func isPalindrome(x int) bool {
    // TODO: implement
    return false
}

func main() {
    var x int
    fmt.Scan(&x)
    fmt.Println(isPalindrome(x))
}`,
      kotlin: `fun isPalindrome(x: Int): Boolean {
    // TODO: implement
    return false
}

fun main() {
    val x = readLine()!!.trim().toInt()
    println(isPalindrome(x))
}`,
    },
  },
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz',
    difficulty: 'Easy',
    description:
      'Given an integer `n`, print numbers from 1 to n. But for multiples of 3 print `Fizz` instead, for multiples of 5 print `Buzz`, and for multiples of both 3 and 5 print `FizzBuzz`.\n\nPrint one value per line.',
    examples: [
      { input: '5', output: '1\n2\nFizz\n4\nBuzz' },
      { input: '15', output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz' },
    ],
    testCases: [
      { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz' },
      { input: '3', expectedOutput: '1\n2\nFizz' },
      { input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz' },
    ],
    constraints: ['1 <= n <= 10^4'],
    tags: ['Math', 'String', 'Simulation'],
    starterCode: {
      java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // TODO: implement FizzBuzz
    }
}`,
      python: `n = int(input())
# TODO: implement FizzBuzz
`,
      c: `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    // TODO: implement FizzBuzz
    return 0;
}`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    // TODO: implement FizzBuzz
    return 0;
}`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const n = parseInt(line);
    // TODO: implement FizzBuzz
    rl.close();
});`,
      typescript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line: string) => {
    const n = parseInt(line);
    // TODO: implement FizzBuzz
    rl.close();
});`,
      go: `package main

import "fmt"

func main() {
    var n int
    fmt.Scan(&n)
    // TODO: implement FizzBuzz
    fmt.Println(n)
}`,
      kotlin: `fun main() {
    val n = readLine()!!.trim().toInt()
    // TODO: implement FizzBuzz
}`,
    },
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    description:
      "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.\n\nPrint `true` or `false`.",
    examples: [
      { input: '()', output: 'true' },
      { input: '()[]{}', output: 'true' },
      { input: '(]', output: 'false' },
    ],
    testCases: [
      { input: '()', expectedOutput: 'true' },
      { input: '()[]{}', expectedOutput: 'true' },
      { input: '(]', expectedOutput: 'false' },
      { input: '([)]', expectedOutput: 'false' },
      { input: '{[]}', expectedOutput: 'true' },
    ],
    constraints: ['1 <= s.length <= 10^4', "s consists of parentheses only '()[]{}'."],
    tags: ['String', 'Stack'],
    starterCode: {
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        System.out.println(isValid(s));
    }

    static boolean isValid(String s) {
        // TODO: implement using stack
        return false;
    }
}`,
      python: `def is_valid(s):
    # TODO: implement using stack
    return False

s = input()
print(str(is_valid(s)).lower())`,
      c: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

bool isValid(char* s) {
    // TODO: implement using stack
    return false;
}

int main() {
    char s[10001];
    scanf("%s", s);
    printf("%s\\n", isValid(s) ? "true" : "false");
    return 0;
}`,
      cpp: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

bool isValid(string s) {
    // TODO: implement using stack
    return false;
}

int main() {
    string s;
    cin >> s;
    cout << (isValid(s) ? "true" : "false") << endl;
    return 0;
}`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (s) => {
    // TODO: implement using stack
    console.log(false);
    rl.close();
});`,
      typescript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (s: string) => {
    // TODO: implement using stack
    console.log(false);
    rl.close();
});`,
      go: `package main

import "fmt"

func isValid(s string) bool {
    // TODO: implement using stack
    return false
}

func main() {
    var s string
    fmt.Scan(&s)
    fmt.Println(isValid(s))
}`,
      kotlin: `fun isValid(s: String): Boolean {
    // TODO: implement using stack
    return false
}

fun main() {
    val s = readLine()!!.trim()
    println(isValid(s))
}`,
    },
  },
  {
    id: 'maximum-subarray',
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    description:
      'Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\nA **subarray** is a contiguous non-empty sequence of elements within an array.',
    examples: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: '1\n1', output: '1' },
    ],
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6' },
      { input: '1\n1', expectedOutput: '1' },
      { input: '5\n5 4 -1 7 8', expectedOutput: '23' },
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    tags: ['Array', 'Divide and Conquer', 'Dynamic Programming'],
    starterCode: {
      java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        System.out.println(maxSubArray(nums));
    }

    static int maxSubArray(int[] nums) {
        // TODO: implement Kadane's algorithm
        return 0;
    }
}`,
      python: `def max_sub_array(nums):
    # TODO: implement Kadane's algorithm
    return 0

n = int(input())
nums = list(map(int, input().split()))
print(max_sub_array(nums))`,
      c: `#include <stdio.h>

int maxSubArray(int* nums, int n) {
    // TODO: implement Kadane's algorithm
    return 0;
}

int main() {
    int n;
    scanf("%d", &n);
    int nums[n];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);
    printf("%d\\n", maxSubArray(nums, n));
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <climits>
using namespace std;

int maxSubArray(vector<int>& nums) {
    // TODO: implement Kadane's algorithm
    return 0;
}

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    cout << maxSubArray(nums) << endl;
    return 0;
}`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l));
rl.on('close', () => {
    const n = parseInt(lines[0]);
    const nums = lines[1].split(' ').map(Number);

    function maxSubArray(nums) {
        // TODO: implement Kadane's algorithm
        return 0;
    }

    console.log(maxSubArray(nums));
});`,
      typescript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines: string[] = [];
rl.on('line', (l: string) => lines.push(l));
rl.on('close', () => {
    const n = parseInt(lines[0]);
    const nums = lines[1].split(' ').map(Number);

    function maxSubArray(nums: number[]): number {
        // TODO: implement Kadane's algorithm
        return 0;
    }

    console.log(maxSubArray(nums));
});`,
      go: `package main

import "fmt"

func maxSubArray(nums []int) int {
    // TODO: implement Kadane's algorithm
    return 0
}

func main() {
    var n int
    fmt.Scan(&n)
    nums := make([]int, n)
    for i := 0; i < n; i++ {
        fmt.Scan(&nums[i])
    }
    fmt.Println(maxSubArray(nums))
}`,
      kotlin: `fun maxSubArray(nums: IntArray): Int {
    // TODO: implement Kadane's algorithm
    return 0
}

fun main() {
    val n = readLine()!!.trim().toInt()
    val nums = readLine()!!.trim().split(" ").map { it.toInt() }.toIntArray()
    println(maxSubArray(nums))
}`,
    },
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    difficulty: 'Easy',
    description:
      'Given a sorted array of distinct integers `nums` and a target value `target`, return the index if the target is found. If not, return `-1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.',
    examples: [
      { input: '6\n-1 0 3 5 9 12\n9', output: '4', explanation: '9 exists in nums and its index is 4.' },
      { input: '6\n-1 0 3 5 9 12\n2', output: '-1', explanation: '2 does not exist in nums so return -1.' },
    ],
    testCases: [
      { input: '6\n-1 0 3 5 9 12\n9', expectedOutput: '4' },
      { input: '6\n-1 0 3 5 9 12\n2', expectedOutput: '-1' },
      { input: '1\n5\n5', expectedOutput: '0' },
    ],
    constraints: ['1 <= nums.length <= 10^4', 'nums is sorted in ascending order.', 'All values of nums are unique.'],
    tags: ['Array', 'Binary Search'],
    starterCode: {
      java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        System.out.println(binarySearch(nums, target));
    }

    static int binarySearch(int[] nums, int target) {
        // TODO: implement
        return -1;
    }
}`,
      python: `def binary_search(nums, target):
    # TODO: implement
    return -1

n = int(input())
nums = list(map(int, input().split()))
target = int(input())
print(binary_search(nums, target))`,
      c: `#include <stdio.h>

int binarySearch(int* nums, int n, int target) {
    // TODO: implement
    return -1;
}

int main() {
    int n, target;
    scanf("%d", &n);
    int nums[n];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);
    scanf("%d", &target);
    printf("%d\\n", binarySearch(nums, n, target));
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int binarySearch(vector<int>& nums, int target) {
    // TODO: implement
    return -1;
}

int main() {
    int n, target;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    cin >> target;
    cout << binarySearch(nums, target) << endl;
    return 0;
}`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l));
rl.on('close', () => {
    const n = parseInt(lines[0]);
    const nums = lines[1].split(' ').map(Number);
    const target = parseInt(lines[2]);

    function binarySearch(nums, target) {
        // TODO: implement
        return -1;
    }

    console.log(binarySearch(nums, target));
});`,
      typescript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines: string[] = [];
rl.on('line', (l: string) => lines.push(l));
rl.on('close', () => {
    const n = parseInt(lines[0]);
    const nums = lines[1].split(' ').map(Number);
    const target = parseInt(lines[2]);

    function binarySearch(nums: number[], target: number): number {
        // TODO: implement
        return -1;
    }

    console.log(binarySearch(nums, target));
});`,
      go: `package main

import "fmt"

func binarySearch(nums []int, target int) int {
    // TODO: implement
    return -1
}

func main() {
    var n, target int
    fmt.Scan(&n)
    nums := make([]int, n)
    for i := 0; i < n; i++ {
        fmt.Scan(&nums[i])
    }
    fmt.Scan(&target)
    fmt.Println(binarySearch(nums, target))
}`,
      kotlin: `fun binarySearch(nums: IntArray, target: Int): Int {
    // TODO: implement
    return -1
}

fun main() {
    val n = readLine()!!.trim().toInt()
    val nums = readLine()!!.trim().split(" ").map { it.toInt() }.toIntArray()
    val target = readLine()!!.trim().toInt()
    println(binarySearch(nums, target))
}`,
    },
  },
  {
    id: 'fibonacci-number',
    title: 'Fibonacci Number',
    difficulty: 'Easy',
    description:
      'The **Fibonacci numbers**, commonly denoted `F(n)`, form a sequence such that each number is the sum of the two preceding ones, starting from 0 and 1.\n\n`F(0) = 0, F(1) = 1`\n`F(n) = F(n - 1) + F(n - 2)`, for `n > 1`.\n\nGiven `n`, calculate `F(n)`.',
    examples: [
      { input: '2', output: '1', explanation: 'F(2) = F(1) + F(0) = 1 + 0 = 1.' },
      { input: '4', output: '3', explanation: 'F(4) = F(3) + F(2) = 2 + 1 = 3.' },
    ],
    testCases: [
      { input: '2', expectedOutput: '1' },
      { input: '3', expectedOutput: '2' },
      { input: '4', expectedOutput: '3' },
      { input: '10', expectedOutput: '55' },
    ],
    constraints: ['0 <= n <= 30'],
    tags: ['Math', 'Recursion', 'Dynamic Programming'],
    starterCode: {
      java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        System.out.println(fib(n));
    }

    static int fib(int n) {
        // TODO: implement
        return 0;
    }
}`,
      python: `def fib(n):
    # TODO: implement
    return 0

n = int(input())
print(fib(n))`,
      c: `#include <stdio.h>

int fib(int n) {
    // TODO: implement
    return 0;
}

int main() {
    int n;
    scanf("%d", &n);
    printf("%d\\n", fib(n));
    return 0;
}`,
      cpp: `#include <iostream>
using namespace std;

int fib(int n) {
    // TODO: implement
    return 0;
}

int main() {
    int n;
    cin >> n;
    cout << fib(n) << endl;
    return 0;
}`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const n = parseInt(line);
    function fib(n) {
        // TODO: implement
        return 0;
    }
    console.log(fib(n));
    rl.close();
});`,
      typescript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line: string) => {
    const n = parseInt(line);
    function fib(n: number): number {
        // TODO: implement
        return 0;
    }
    console.log(fib(n));
    rl.close();
});`,
      go: `package main

import "fmt"

func fib(n int) int {
    // TODO: implement
    return 0
}

func main() {
    var n int
    fmt.Scan(&n)
    fmt.Println(fib(n))
}`,
      kotlin: `fun fib(n: Int): Int {
    // TODO: implement
    return 0
}

fun main() {
    val n = readLine()!!.trim().toInt()
    println(fib(n))
}`,
    },
  },
  {
    id: 'longest-common-prefix',
    title: 'Longest Common Prefix',
    difficulty: 'Easy',
    description:
      'Write a function to find the longest common prefix string amongst an array of strings.\n\nIf there is no common prefix, return an empty string `""`.\n\nFirst line contains `n` (number of strings), followed by `n` strings one per line.',
    examples: [
      { input: '3\nflower\nflow\nflight', output: 'fl' },
      { input: '3\ndog\nracecar\ncar', output: '' },
    ],
    testCases: [
      { input: '3\nflower\nflow\nflight', expectedOutput: 'fl' },
      { input: '3\ndog\nracecar\ncar', expectedOutput: '' },
      { input: '1\nalone', expectedOutput: 'alone' },
    ],
    constraints: ['1 <= strs.length <= 200', '0 <= strs[i].length <= 200', 'strs[i] consists of only lowercase English letters.'],
    tags: ['String', 'Trie'],
    starterCode: {
      java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.nextLine().trim());
        String[] strs = new String[n];
        for (int i = 0; i < n; i++) strs[i] = sc.nextLine().trim();
        System.out.println(longestCommonPrefix(strs));
    }

    static String longestCommonPrefix(String[] strs) {
        // TODO: implement
        return "";
    }
}`,
      python: `def longest_common_prefix(strs):
    # TODO: implement
    return ""

n = int(input())
strs = [input() for _ in range(n)]
print(longest_common_prefix(strs))`,
      c: `#include <stdio.h>
#include <string.h>

void longestCommonPrefix(char strs[][201], int n, char* result) {
    // TODO: implement
    result[0] = '\\0';
}

int main() {
    int n;
    scanf("%d", &n);
    char strs[n][201];
    for (int i = 0; i < n; i++) scanf("%s", strs[i]);
    char result[201];
    longestCommonPrefix(strs, n, result);
    printf("%s\\n", result);
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

string longestCommonPrefix(vector<string>& strs) {
    // TODO: implement
    return "";
}

int main() {
    int n;
    cin >> n;
    vector<string> strs(n);
    for (int i = 0; i < n; i++) cin >> strs[i];
    cout << longestCommonPrefix(strs) << endl;
    return 0;
}`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l));
rl.on('close', () => {
    const n = parseInt(lines[0]);
    const strs = lines.slice(1, n + 1);

    function longestCommonPrefix(strs) {
        // TODO: implement
        return '';
    }

    console.log(longestCommonPrefix(strs));
});`,
      typescript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines: string[] = [];
rl.on('line', (l: string) => lines.push(l));
rl.on('close', () => {
    const n = parseInt(lines[0]);
    const strs = lines.slice(1, n + 1);

    function longestCommonPrefix(strs: string[]): string {
        // TODO: implement
        return '';
    }

    console.log(longestCommonPrefix(strs));
});`,
      go: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func longestCommonPrefix(strs []string) string {
    // TODO: implement
    return ""
}

func main() {
    var n int
    fmt.Scan(&n)
    scanner := bufio.NewScanner(os.Stdin)
    strs := make([]string, n)
    for i := 0; i < n; i++ {
        scanner.Scan()
        strs[i] = scanner.Text()
    }
    fmt.Println(longestCommonPrefix(strs))
}`,
      kotlin: `fun longestCommonPrefix(strs: Array<String>): String {
    // TODO: implement
    return ""
}

fun main() {
    val n = readLine()!!.trim().toInt()
    val strs = Array(n) { readLine()!! }
    println(longestCommonPrefix(strs))
}`,
    },
  },
  {
    id: 'sum-of-array',
    title: 'Sum of Array Elements',
    difficulty: 'Easy',
    description:
      'Given an array of `n` integers, find the sum of all elements.\n\nFirst line contains `n`, the second line contains `n` space-separated integers.',
    examples: [
      { input: '5\n1 2 3 4 5', output: '15' },
      { input: '3\n10 20 30', output: '60' },
    ],
    testCases: [
      { input: '5\n1 2 3 4 5', expectedOutput: '15' },
      { input: '3\n10 20 30', expectedOutput: '60' },
      { input: '1\n100', expectedOutput: '100' },
      { input: '4\n-1 -2 3 4', expectedOutput: '4' },
    ],
    constraints: ['1 <= n <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['Array', 'Math'],
    starterCode: {
      java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        // TODO: compute and print sum
    }
}`,
      python: `n = int(input())
nums = list(map(int, input().split()))
# TODO: compute and print sum
`,
      c: `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        // TODO: add to sum
    }
    printf("%lld\\n", sum);
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    // TODO: compute and print sum
    return 0;
}`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l));
rl.on('close', () => {
    const n = parseInt(lines[0]);
    const nums = lines[1].split(' ').map(Number);
    // TODO: compute and print sum
});`,
      typescript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines: string[] = [];
rl.on('line', (l: string) => lines.push(l));
rl.on('close', () => {
    const n = parseInt(lines[0]);
    const nums = lines[1].split(' ').map(Number);
    // TODO: compute and print sum
});`,
      go: `package main

import "fmt"

func main() {
    var n int
    fmt.Scan(&n)
    nums := make([]int, n)
    for i := 0; i < n; i++ {
        fmt.Scan(&nums[i])
    }
    // TODO: compute and print sum
}`,
      kotlin: `fun main() {
    val n = readLine()!!.trim().toInt()
    val nums = readLine()!!.trim().split(" ").map { it.toInt() }
    // TODO: compute and print sum
}`,
    },
  },
];

// Language metadata for display and API
export const LANGUAGE_CONFIG: Record<string, { label: string; monacoId: string; pistonId: string; pistonVersion: string; extension: string; icon: string }> = {
  java:       { label: 'Java',       monacoId: 'java',       pistonId: 'java',       pistonVersion: '15.0.2', extension: 'java', icon: '☕' },
  python:     { label: 'Python',     monacoId: 'python',     pistonId: 'python',     pistonVersion: '3.10.0', extension: 'py',   icon: '🐍' },
  c:          { label: 'C',          monacoId: 'c',          pistonId: 'c',          pistonVersion: '10.2.0', extension: 'c',    icon: '⚙️' },
  cpp:        { label: 'C++',        monacoId: 'cpp',        pistonId: 'c++',        pistonVersion: '10.2.0', extension: 'cpp',  icon: '⚡' },
  javascript: { label: 'JavaScript', monacoId: 'javascript', pistonId: 'javascript', pistonVersion: '18.15.0', extension: 'js',  icon: '🟨' },
  typescript: { label: 'TypeScript', monacoId: 'typescript', pistonId: 'typescript', pistonVersion: '5.0.3', extension: 'ts',   icon: '🔷' },
  go:         { label: 'Go',         monacoId: 'go',         pistonId: 'go',         pistonVersion: '1.16.2', extension: 'go',   icon: '🔵' },
  kotlin:     { label: 'Kotlin',     monacoId: 'kotlin',     pistonId: 'kotlin',     pistonVersion: '1.8.20', extension: 'kt',   icon: '🟣' },
};
