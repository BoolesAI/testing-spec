/**
 * Parse route handler
 */

import { Router, Request, Response } from 'express';
import { parseTestCasesFromString, clearTemplateCache } from '@boolesai/tspec';

const router = Router();

interface ParseRequest {
  files: string[];
  fileContents: Record<string, string>;
  options?: {
    env?: Record<string, string>;
    params?: Record<string, string>;
  };
}

router.post('/', async (req: Request, res: Response) => {
  const { files, fileContents, options } = req.body as ParseRequest;
  
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
  
  try {
    clearTemplateCache();
    
    const allTestCases: unknown[] = [];
    const parseErrors: Array<{ file: string; message: string }> = [];
    
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
        allTestCases.push(...testCases);
      } catch (err) {
        parseErrors.push({
          file: filePath,
          message: err instanceof Error ? err.message : String(err)
        });
      }
    }
    
    res.json({
      success: true,
      testCases: allTestCases,
      parseErrors,
      summary: {
        totalFiles: files.length,
        totalTestCases: allTestCases.length,
        parseErrors: parseErrors.length
      }
    });
    
  } catch (err) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PROXY_EXECUTION_ERROR',
        message: err instanceof Error ? err.message : String(err)
      }
    });
  }
});

export { router as parseRouter };
