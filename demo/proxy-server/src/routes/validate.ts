/**
 * Validate route handler
 */

import { Router, Request, Response } from 'express';
import { validateTspecContent } from '@boolesai/tspec';

const router = Router();

interface ValidateRequest {
  files: string[];
  fileContents: Record<string, string>;
}

router.post('/', async (req: Request, res: Response) => {
  const { files, fileContents } = req.body as ValidateRequest;
  
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
    const results: Array<{ file: string; valid: boolean; errors: string[] }> = [];
    
    for (const filePath of files) {
      const content = fileContents[filePath];
      if (!content) {
        results.push({
          file: filePath,
          valid: false,
          errors: ['File content not provided']
        });
        continue;
      }
      
      try {
        const validationResult = validateTspecContent(content);
        results.push({
          file: filePath,
          valid: validationResult.valid,
          errors: validationResult.errors || []
        });
      } catch (err) {
        results.push({
          file: filePath,
          valid: false,
          errors: [err instanceof Error ? err.message : String(err)]
        });
      }
    }
    
    const valid = results.filter(r => r.valid).length;
    const invalid = results.length - valid;
    
    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        valid,
        invalid
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

export { router as validateRouter };
