/**
 * Microsoft GenAI Script Integration
 * Provides AI agent functionality and proxy API
 * Using genaiscript npm package for Microsoft AI capabilities
 */

// Import genaiscript modules
let genAIScript = null;
let genAICore = null;

export class GenAIService {
  constructor(config) {
    this.config = config;
    this.agents = new Map();
    this.tasks = new Map();
    this.isEnabled = config.genAiConfig?.enabled || false;
    this.isInitialized = false;
  }

  /**
   * Initialize GenAI service
   */
  async initialize() {
    if (!this.isEnabled) {
      console.log('⚠️  GenAI service disabled - set ENABLE_GENAI=true to enable');
      return false;
    }

    try {
      // Dynamically import genaiscript modules
      try {
        const { createContext } = await import('@genaiscript/core');
        const { run } = await import('@genaiscript/api');
        genAICore = { createContext };
        genAIScript = { run };

        console.log('✅ GenAI service initialized with Microsoft GenAI Script');
        this.isInitialized = true;

        // Initialize default agents
        await this.initializeAgents();

        return true;
      } catch (importError) {
        console.log('⚠️  GenAI packages not installed, running in simulation mode');
        this.isInitialized = false;
        return true;
      }
    } catch (error) {
      console.error('Failed to initialize GenAI service:', error);
      return false;
    }
  }

  /**
   * Initialize default AI agents
   */
  async initializeAgents() {
    // Define default agents for HostBill/Crayon integration
    const defaultAgents = [
      {
        id: 'billing-analyzer',
        name: 'Billing Data Analyzer',
        description: 'Analyzes billing data patterns and suggests optimizations',
        type: 'analysis',
        capabilities: ['data-analysis', 'reporting', 'recommendations']
      },
      {
        id: 'customer-support',
        name: 'Customer Support Assistant',
        description: 'Assists with customer inquiries and support tasks',
        type: 'support',
        capabilities: ['customer-service', 'issue-resolution', 'documentation']
      },
      {
        id: 'sync-monitor',
        name: 'Sync Process Monitor',
        description: 'Monitors and analyzes sync processes between systems',
        type: 'monitoring',
        capabilities: ['monitoring', 'alerting', 'diagnostics']
      }
    ];

    for (const agentConfig of defaultAgents) {
      this.agents.set(agentConfig.id, {
        ...agentConfig,
        status: 'active',
        createdAt: new Date().toISOString(),
        taskCount: 0
      });
    }

    console.log(`✅ Initialized ${this.agents.size} GenAI agents`);
  }

  /**
   * Get agent status
   */
  getAgentStatus() {
    if (!this.isEnabled) {
      return {
        enabled: false,
        message: 'GenAI service is disabled. Set ENABLE_GENAI=true to enable.'
      };
    }

    return {
      enabled: true,
      agents: {
        total: this.agents.size,
        active: Array.from(this.agents.values()).filter(a => a.status === 'active').length
      },
      tasks: {
        total: this.tasks.size,
        pending: Array.from(this.tasks.values()).filter(t => t.status === 'pending').length,
        completed: Array.from(this.tasks.values()).filter(t => t.status === 'completed').length
      },
      mcpServers: {
        active: 1 // Placeholder for MCP server count
      }
    };
  }

  /**
   * Create a new task
   */
  async createTask(taskData) {
    if (!this.isEnabled) {
      throw new Error('GenAI service is disabled');
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task = {
      id: taskId,
      type: taskData.type || 'analysis',
      priority: taskData.priority || 'medium',
      payload: taskData.payload || {},
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tasks.set(taskId, task);

    // Process task with GenAI Script if available
    if (this.isInitialized && genAIScript) {
      this.processTaskWithGenAI(task);
    } else {
      // Fallback simulation mode
      setTimeout(() => {
        task.status = 'completed';
        task.updatedAt = new Date().toISOString();
        task.result = `Sample analysis completed for ${task.type} (simulation mode)`;
        this.tasks.set(taskId, task);
      }, 2000);
    }

    return { taskId, status: 'created' };
  }

  /**
   * Process task using GenAI Script
   */
  async processTaskWithGenAI(task) {
    try {
      const prompt = this.generatePromptForTask(task);

      // Use GenAI Script to process the task
      const result = await genAIScript.run(prompt, {
        model: this.config.genAiConfig?.model || 'gpt-4',
        apiKey: this.config.genAiConfig?.apiKey,
        maxTokens: 1000
      });

      task.status = 'completed';
      task.updatedAt = new Date().toISOString();
      task.result = result.text || result.content || 'Task completed successfully';
      this.tasks.set(task.id, task);

      // Update agent task count
      const agentId = this.selectAgentForTask(task);
      if (this.agents.has(agentId)) {
        const agent = this.agents.get(agentId);
        agent.taskCount++;
        this.agents.set(agentId, agent);
      }
    } catch (error) {
      console.error(`Failed to process task ${task.id} with GenAI:`, error);
      task.status = 'failed';
      task.error = error.message;
      task.updatedAt = new Date().toISOString();
      this.tasks.set(task.id, task);
    }
  }

  /**
   * Generate appropriate prompt for task type
   */
  generatePromptForTask(task) {
    const { type, payload } = task;

    switch (type) {
    case 'analysis':
      return `Analyze the following data and provide insights: ${JSON.stringify(payload, null, 2)}
        
Please provide:
1. Key findings
2. Trends identified  
3. Recommendations for improvement
4. Any anomalies or concerns

Format your response as structured analysis.`;

    case 'billing-review':
      return `Review the following billing data for accuracy and optimization opportunities: ${JSON.stringify(payload, null, 2)}
        
Please check for:
1. Billing discrepancies
2. Cost optimization opportunities
3. Usage pattern analysis
4. Renewal recommendations

Provide actionable recommendations.`;

    case 'customer-support':
      return `Help resolve the following customer support issue: ${JSON.stringify(payload, null, 2)}
        
Please provide:
1. Issue analysis
2. Recommended resolution steps
3. Customer communication template
4. Follow-up actions needed

Be professional and helpful in your response.`;

    default:
      return `Process the following request: ${JSON.stringify(payload, null, 2)}
        
Please analyze the request and provide appropriate assistance based on the context provided.`;
    }
  }

  /**
   * Select best agent for task type
   */
  selectAgentForTask(task) {
    const { type } = task;

    switch (type) {
    case 'analysis':
    case 'billing-review':
      return 'billing-analyzer';
    case 'customer-support':
      return 'customer-support';
    case 'sync-monitoring':
      return 'sync-monitor';
    default:
      return 'billing-analyzer'; // Default agent
    }
  }

  /**
   * Process workflow
   */
  async processWorkflow(workflowData) {
    if (!this.isEnabled) {
      throw new Error('GenAI service is disabled');
    }

    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create workflow definition
    const workflow = {
      id: workflowId,
      name: workflowData.name || 'Unnamed Workflow',
      steps: workflowData.steps || [],
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Process workflow steps
    if (this.isInitialized && genAIScript) {
      this.processWorkflowWithGenAI(workflow);
    } else {
      // Simulation mode
      setTimeout(() => {
        workflow.status = 'completed';
        workflow.updatedAt = new Date().toISOString();
        workflow.result = 'Workflow completed successfully (simulation mode)';
      }, 3000);
    }

    return {
      workflowId,
      status: 'processing',
      steps: workflow.steps,
      message: 'Workflow processing started'
    };
  }

  /**
   * Process workflow using GenAI Script
   */
  async processWorkflowWithGenAI(workflow) {
    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];

        // Generate prompt for this workflow step
        const prompt = `Execute the following workflow step:
        
Step ${i + 1}: ${step.name || 'Unnamed Step'}
Description: ${step.description || 'No description provided'}
Input: ${JSON.stringify(step.input || {}, null, 2)}
Type: ${step.type || 'general'}

Please process this step and provide the output that can be used for subsequent steps.`;

        const result = await genAIScript.run(prompt, {
          model: this.config.genAiConfig?.model || 'gpt-4',
          apiKey: this.config.genAiConfig?.apiKey,
          maxTokens: 800
        });

        // Update step with result
        step.status = 'completed';
        step.output = result.text || result.content || 'Step completed';
        step.completedAt = new Date().toISOString();
      }

      workflow.status = 'completed';
      workflow.updatedAt = new Date().toISOString();
      workflow.result = 'All workflow steps completed successfully';
    } catch (error) {
      console.error(`Failed to process workflow ${workflow.id} with GenAI:`, error);
      workflow.status = 'failed';
      workflow.error = error.message;
      workflow.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Get task status
   */
  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Direct GenAI proxy - execute GenAI Script directly
   */
  async executeGenAIScript(scriptData) {
    if (!this.isEnabled) {
      throw new Error('GenAI service is disabled');
    }

    if (!this.isInitialized || !genAIScript) {
      throw new Error('GenAI Script not available - running in simulation mode');
    }

    try {
      const result = await genAIScript.run(scriptData.prompt, {
        model: scriptData.model || this.config.genAiConfig?.model || 'gpt-4',
        apiKey: this.config.genAiConfig?.apiKey,
        maxTokens: scriptData.maxTokens || 1000,
        temperature: scriptData.temperature || 0.7,
        ...scriptData.options
      });

      return {
        success: true,
        result: result.text || result.content || result,
        metadata: {
          model: scriptData.model || 'gpt-4',
          tokensUsed: result.usage?.total_tokens || 0,
          executedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('GenAI Script execution failed:', error);
      return {
        success: false,
        error: error.message,
        executedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Get available GenAI models
   */
  getAvailableModels() {
    return {
      models: [
        {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'openai',
          capabilities: ['text', 'analysis', 'code']
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          provider: 'openai',
          capabilities: ['text', 'analysis']
        },
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          provider: 'openai',
          capabilities: ['text', 'vision', 'analysis']
        }
      ],
      default: this.config.genAiConfig?.model || 'gpt-4'
    };
  }

  /**
   * Get task status
   */
  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Get all tasks
   */
  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.agents.clear();
    this.tasks.clear();
    console.log('✅ GenAI service cleaned up');
  }
}
