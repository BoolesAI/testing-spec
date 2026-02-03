import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { CLIOutput, CLIExecuteOptions, TSpecTestingConfig } from './types';

/**
 * Adapter for interacting with the TSpec CLI
 */
export class CLIAdapter {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('TSpec Tests');
  }

  /**
   * Get testing configuration from VS Code settings
   */
  getConfig(): TSpecTestingConfig {
    const config = vscode.workspace.getConfiguration('tspec.testing');
    return {
      enabled: config.get('enabled', true),
      cliPath: config.get('cliPath', ''),
      concurrency: config.get('concurrency', 5),
      defaultTimeout: config.get('defaultTimeout', 30),
      watchMode: config.get('watchMode', true),
      envVars: config.get('envVars', {}),
    };
  }

  /**
   * Find the tspec CLI executable
   * Search order: config path > workspace node_modules > global PATH
   */
  async findCLI(): Promise<string | null> {
    const config = this.getConfig();

    // 1. Check configured path
    if (config.cliPath && fs.existsSync(config.cliPath)) {
      return config.cliPath;
    }

    // 2. Check workspace node_modules
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      for (const folder of workspaceFolders) {
        const localBin = path.join(folder.uri.fsPath, 'node_modules', '.bin', 'tspec');
        if (fs.existsSync(localBin)) {
          return localBin;
        }
        // Also check Windows .cmd extension
        const localBinCmd = localBin + '.cmd';
        if (fs.existsSync(localBinCmd)) {
          return localBinCmd;
        }
      }
    }

    // 3. Check if available in PATH
    const isAvailable = await this.checkCliInPath();
    if (isAvailable) {
      return 'tspec';
    }

    return null;
  }

  /**
   * Check if tspec is available in PATH
   */
  private async checkCliInPath(): Promise<boolean> {
    return new Promise((resolve) => {
      const command = process.platform === 'win32' ? 'where' : 'which';
      const proc = spawn(command, ['tspec'], { shell: true });
      proc.on('close', (code) => {
        resolve(code === 0);
      });
      proc.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Prompt user to install CLI if not found
   */
  async promptInstallCLI(): Promise<boolean> {
    const action = await vscode.window.showErrorMessage(
      'TSpec CLI not found. Would you like to install it?',
      'Install',
      'Cancel'
    );

    if (action === 'Install') {
      const terminal = vscode.window.createTerminal('TSpec CLI Install');
      terminal.sendText('npm install -g @boolesai/tspec-cli');
      terminal.show();
      
      await vscode.window.showInformationMessage(
        'Installing TSpec CLI... Please wait for installation to complete, then try again.'
      );
      return true;
    }
    return false;
  }

  /**
   * Execute tspec CLI with given files and options
   */
  async execute(
    files: string[],
    options: CLIExecuteOptions = {},
    cancellationToken?: vscode.CancellationToken
  ): Promise<CLIOutput> {
    const cliPath = await this.findCLI();
    
    if (!cliPath) {
      await this.promptInstallCLI();
      throw new Error('TSpec CLI not found');
    }

    const args = this.buildArgs(files, options);
    this.outputChannel.appendLine(`Executing: ${cliPath} ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let killed = false;

      const proc = spawn(cliPath, args, {
        shell: true,
        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
        env: {
          ...process.env,
          ...options.envVars,
        },
      });

      // Handle cancellation
      if (cancellationToken) {
        const disposable = cancellationToken.onCancellationRequested(() => {
          killed = true;
          proc.kill('SIGTERM');
          disposable.dispose();
        });
      }

      // Timeout handling
      const timeout = options.timeout || this.getConfig().defaultTimeout;
      const timeoutId = setTimeout(() => {
        if (!killed) {
          killed = true;
          proc.kill('SIGTERM');
          reject(new Error(`Test execution timed out after ${timeout}s`));
        }
      }, timeout * 1000);

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
        this.outputChannel.append(data.toString());
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
        this.outputChannel.append(data.toString());
      });

      proc.on('close', (code) => {
        clearTimeout(timeoutId);
        
        if (killed) {
          reject(new Error('Test execution was cancelled'));
          return;
        }

        try {
          const output = this.parseOutput(stdout);
          resolve(output);
        } catch (parseError) {
          this.outputChannel.appendLine(`Parse error: ${parseError}`);
          this.outputChannel.appendLine(`Raw stdout: ${stdout}`);
          reject(new Error(`Failed to parse CLI output: ${parseError}`));
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timeoutId);
        this.outputChannel.appendLine(`Process error: ${err.message}`);
        reject(err);
      });
    });
  }

  /**
   * Build CLI arguments from options
   */
  private buildArgs(files: string[], options: CLIExecuteOptions): string[] {
    const args = ['run', ...files, '-o', 'json'];

    if (options.concurrency) {
      args.push('-c', options.concurrency.toString());
    }

    if (options.verbose) {
      args.push('-v');
    }

    if (options.quiet) {
      args.push('-q');
    }

    if (options.failFast) {
      args.push('--fail-fast');
    }

    if (options.envVars) {
      for (const [key, value] of Object.entries(options.envVars)) {
        args.push('-e', `${key}=${value}`);
      }
    }

    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        args.push('-p', `${key}=${value}`);
      }
    }

    return args;
  }

  /**
   * Parse JSON output from CLI
   */
  parseOutput(stdout: string): CLIOutput {
    // Find JSON in output (may have other text before/after)
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in output');
    }

    const parsed = JSON.parse(jsonMatch[0]) as CLIOutput & { error?: string };
    
    // Handle error response from CLI
    if (parsed.error) {
      throw new Error(parsed.error);
    }
    
    // Validate structure
    if (!parsed.results || !Array.isArray(parsed.results)) {
      throw new Error('Invalid CLI output: missing results array');
    }

    return parsed;
  }

  /**
   * Show output channel
   */
  showOutput(): void {
    this.outputChannel.show();
  }

  /**
   * Clear output channel
   */
  clearOutput(): void {
    this.outputChannel.clear();
  }

  dispose(): void {
    this.outputChannel.dispose();
  }
}
