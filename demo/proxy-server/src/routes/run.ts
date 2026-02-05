/**
 * Run route handler
 */

import { Router, Request, Response } from 'express';
import { 
  parseTestCasesFromString,
  scheduler,
  clearTemplateCache
} from '@boolesai/tspec';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

const router = Router();

interface RunRequest {
  files: string[];
  fileContents: Record<string, string>;
  options?: {
    concurrency?: number;
    failFast?: boolean;
    env?: Record<string, string>;
    params?: Record<string, string>;
  };
}

router.post('/', async (req: Request, res: Response) => {
  const { files, fileContents, options } = req.body as RunRequest;
  
  // Validate request
  if (!files || !Array.isArray(files)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PROXY_VALIDATION_ERROR',
        message: 'Missing required field: files'
      }
    });
  }
  
  if (!fileContents || typeof fileContents !== 'object') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PROXY_VALIDATION_ERROR',
        message: 'Missing required field: fileContents'
      }
    });
  }
  
  // Create temp directory
  const tempDir = join(tmpdir(), `tspec-proxy-${randomUUID()}`);
  
  try {
    mkdirSync(tempDir, { recursive: true });
    
    // Write files to temp directory
    for (const [filePath, content] of Object.entries(fileContents)) {
      const fullPath = join(tempDir, filePath);
      const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
      if (dir && !existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(fullPath, content);
    }
    
    // Clear template cache
    clearTemplateCache();
    
    // Parse and execute tests
    const allResults: Array<{
      testCaseId: string;
      file: string;
      passed: boolean;
      duration: number;
      assertions: Array<{ type: string; passed: boolean; message?: string }>;
      error?: string;
    }> = [];
    const parseErrors: Array<{ file: string; message: string }> = [];
    
    const concurrency = options?.concurrency ?? 5;
    const env = options?.env ?? {};
    const params = options?.params ?? {};
    
    for (const filePath of files) {
      const content = fileContents[filePath];
      if (!content) {
        parseErrors.push({ file: filePath, message: 'File content not provided' });
        continue;
      }
      
      try {
        const testCases = parseTestCasesFromString(content, { env, params });
        
        if (testCases.length === 0) {
          continue;
        }
        
        const scheduleResult = await scheduler.schedule(testCases, { concurrency });
        
        for (const result of scheduleResult.results) {
          allResults.push({
            testCaseId: result.testCaseId,
            file: filePath,
            passed: result.passed,
            duration: result.duration,
            assertions: result.assertions.map(a => ({
              type: a.type,
              passed: a.passed,
              message: a.message
            }))
          });
        }
      } catch (err) {
        parseErrors.push({
          file: filePath,
          message: err instanceof Error ? err.message : String(err)
        });
      }
    }
    
    // Calculate summary
    const passed = allResults.filter(r => r.passed).length;
    const failed = allResults.length - passed;
    
    res.json({
      success: true,
      results: allResults,
      summary: {
        total: allResults.length,
        passed,
        failed,
        passRate: allResults.length > 0 ? (passed / allResults.length) * 100 : 0,
        duration: allResults.reduce((sum, r) => sum + r.duration, 0)
      },
      parseErrors
    });
    
  } catch (err) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PROXY_EXECUTION_ERROR',
        message: err instanceof Error ? err.message : String(err)
      }
    });
  } finally {
    // Cleanup temp directory
    try {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  }
});

export { router as runRouter };
