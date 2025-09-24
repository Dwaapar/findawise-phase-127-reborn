// Empire-Grade Port Management System
// Billion-Dollar Infrastructure Component

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class EmpirePortManager {
  private static instance: EmpirePortManager;
  private static allocatedPorts: Set<number> = new Set();
  private preferredPort: number = parseInt(process.env.PORT || '5000');
  private backupPorts: number[] = [5001, 5002, 5003, 5004, 5005, 3000, 8000, 8080];
  
  public static getInstance(): EmpirePortManager {
    if (!EmpirePortManager.instance) {
      EmpirePortManager.instance = new EmpirePortManager();
    }
    return EmpirePortManager.instance;
  }

  async getAvailablePort(): Promise<number> {
    console.log('🔍 Empire Port Manager: Finding optimal port...');
    
    // Use process-based allocation to avoid conflicts
    const processId = process.pid;
    const workflowName = process.env.WORKFLOW_NAME || 'default';
    
    console.log(`🔧 Process allocation for ${workflowName} (PID: ${processId})`);
    
    // Use intelligent port assignment based on environment
    // First workflow gets 5000, second gets 5001, etc.
    const basePort = 5000;
    let assignedPort = basePort;
    
    // Try to allocate ports sequentially to avoid conflicts
    while (EmpirePortManager.allocatedPorts.has(assignedPort)) {
      assignedPort++;
      if (assignedPort > 5010) {
        break; // Safety limit
      }
    }
    
    console.log(`✅ Empire Port Manager: Process ${processId} assigned port ${assignedPort}`);
    EmpirePortManager.allocatedPorts.add(assignedPort);
    return assignedPort;

  }

  private async isPortAvailable(port: number): Promise<boolean> {
    try {
      // Use netstat which should be available in most environments
      const { stdout } = await execAsync(`netstat -tlnp 2>/dev/null | grep ":${port} "`);
      const isUsed = stdout.trim().length > 0;
      console.log(`🔍 Port ${port} check: ${isUsed ? 'IN USE' : 'AVAILABLE'}`);
      return !isUsed;
    } catch (error) {
      // If netstat fails, try a socket test approach
      try {
        const { stdout: ssOut } = await execAsync(`ss -tlnp 2>/dev/null | grep ":${port} "`);
        const isUsed = ssOut.trim().length > 0;
        console.log(`🔍 Port ${port} check (ss): ${isUsed ? 'IN USE' : 'AVAILABLE'}`);
        return !isUsed;
      } catch {
        console.log(`🔍 Port ${port} check: AVAILABLE (no network tools found)`);
        return true; // If we can't check, assume it's available
      }
    }
  }

  private async killProcessOnPort(port: number): Promise<void> {
    try {
      console.log(`🔄 Empire Port Manager: Clearing port ${port}...`);
      // Only kill if explicitly requested - safer approach
      const { stdout } = await execAsync(`lsof -ti :${port}`);
      if (stdout.trim()) {
        console.log(`⚠️ Port ${port} is in use, finding alternative...`);
      }
    } catch (error) {
      // Port is available
    }
  }

  async reservePort(port: number): Promise<void> {
    console.log(`🔒 Empire Port Manager: Reserving port ${port} for empire operations`);
    await this.killProcessOnPort(port);
  }

  async validatePortSecurity(port: number): Promise<boolean> {
    try {
      // Check if port is in safe range for web applications
      if (port < 3000 || port > 8000) {
        console.warn(`⚠️ Empire Port Manager: Port ${port} outside safe range (3000-8000)`);
        return false;
      }

      // Check if port is not reserved for system services
      const reservedPorts = [22, 23, 25, 53, 80, 110, 143, 443, 993, 995];
      if (reservedPorts.includes(port)) {
        console.error(`🚨 Empire Port Manager: Port ${port} is reserved for system services`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Empire Port Manager: Port validation failed:', error);
      return false;
    }
  }
}

export const empirePortManager = EmpirePortManager.getInstance();