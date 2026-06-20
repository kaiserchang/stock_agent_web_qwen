import { spawn } from 'child_process';
import { resolve } from 'path';
import { insertScanLog } from '../db';

export async function executePythonScript(scriptPath: string, args: (string | object)[] = [], progressCallback?: (progress: number) => void): Promise<any> {
  return new Promise((resolvePromise, reject) => {
    const processedArgs = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        return JSON.stringify(arg);
      } else {
        return String(arg);
      }
    });

    const pythonProcess = spawn('python3', [scriptPath, ...processedArgs]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      stdout += dataStr;
      // Check for progress updates
      const progressMatch = dataStr.match(/PROGRESS:(\d+)/);
      if (progressMatch && progressCallback) {
        const progress = parseInt(progressMatch[1], 10);
        progressCallback(progress);
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      const dataStr = data.toString();
      stderr += dataStr;
      // Process log lines (LOG:...)
      const logLines = dataStr.split('\n');
      for (const line of logLines) {
        if (line.startsWith('LOG:')) {
          try {
            const logData = JSON.parse(line.substring(4));
            // Asynchronously write log to database
            insertScanLog(logData).catch(err => console.error('Failed to insert scan log:', err));
          } catch (e) {
            console.error('Failed to parse log line:', line, e);
          }
        }
      }
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Remove progress lines from stdout before parsing JSON
          const cleanStdout = stdout.replace(/PROGRESS:\d+\n/g, '');
          resolvePromise(JSON.parse(cleanStdout));
        } catch (e) {
          reject(new Error(`Python script output is not valid JSON: ${stdout}`));
        }
      } else {
        reject(new Error(`Python script exited with code ${code}. Stderr: ${stderr}`));
      }
    });

    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start Python script: ${err.message}`));
    });
  });
}
