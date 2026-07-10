/**
 * Compiler API Service
 * Abstracted execution layer — currently uses Piston API (emkc.org).
 * Can be swapped to JDoodle, Judge0, or self-hosted backend later.
 */

import { LANGUAGE_CONFIG } from '../data/codeQuestions';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: string;
  memory: string;
  status: 'success' | 'error' | 'timeout' | 'compilation_error';
  compilationOutput?: string;
}

interface PistonRunResponse {
  stdout: string;
  stderr: string;
  code: number;
  signal: string | null;
  output: string;
}

interface PistonResponse {
  language: string;
  version: string;
  run: PistonRunResponse;
  compile?: PistonRunResponse;
}

/**
 * Execute source code via the Piston API.
 */
export async function executeCode(
  language: string,
  sourceCode: string,
  stdin: string = ''
): Promise<ExecutionResult> {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    return {
      stdout: '',
      stderr: `Unsupported language: ${language}`,
      exitCode: 1,
      executionTime: '0ms',
      memory: 'N/A',
      status: 'error',
    };
  }

  const startTime = performance.now();

  try {
    const response = await fetch(`${PISTON_API_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: config.pistonId,
        version: config.pistonVersion,
        files: [
          {
            name: `main.${config.extension}`,
            content: sourceCode,
          },
        ],
        stdin,
        args: [],
        compile_timeout: 10000,
        run_timeout: 5000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
    });

    const elapsed = performance.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        stdout: '',
        stderr: `API Error (${response.status}): ${errorText}`,
        exitCode: 1,
        executionTime: `${elapsed.toFixed(0)}ms`,
        memory: 'N/A',
        status: 'error',
      };
    }

    const data: PistonResponse = await response.json();

    // Check for compilation errors
    if (data.compile && data.compile.stderr) {
      return {
        stdout: data.compile.stdout || '',
        stderr: data.compile.stderr,
        exitCode: data.compile.code || 1,
        executionTime: `${elapsed.toFixed(0)}ms`,
        memory: 'N/A',
        status: 'compilation_error',
        compilationOutput: data.compile.output,
      };
    }

    // Check for runtime errors
    const hasError = data.run.stderr && data.run.stderr.trim().length > 0;
    const timedOut = data.run.signal === 'SIGKILL' || data.run.signal === 'SIGTERM';

    return {
      stdout: data.run.stdout || '',
      stderr: data.run.stderr || '',
      exitCode: data.run.code || 0,
      executionTime: `${elapsed.toFixed(0)}ms`,
      memory: 'N/A',
      status: timedOut ? 'timeout' : hasError && data.run.code !== 0 ? 'error' : 'success',
    };
  } catch (err) {
    const elapsed = performance.now() - startTime;
    return {
      stdout: '',
      stderr: err instanceof Error ? err.message : 'Unknown execution error',
      exitCode: 1,
      executionTime: `${elapsed.toFixed(0)}ms`,
      memory: 'N/A',
      status: 'error',
    };
  }
}

/**
 * Get available runtimes from Piston.
 */
export async function getRuntimes(): Promise<Array<{ language: string; version: string; aliases: string[] }>> {
  try {
    const response = await fetch(`${PISTON_API_URL}/runtimes`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}
