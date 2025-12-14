/**
 * AuraLogic Assistant Setup Script
 * 
 * This script:
 * 1. Uploads company knowledge files to OpenAI
 * 2. Creates an Assistant with file search enabled
 * 3. Associates the uploaded files with the Assistant
 * 4. Saves the Assistant ID to .env file
 * 
 * Run this script once to set up the assistant:
 * node setup-assistant.js
 */

require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Knowledge files directory
const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge');

// Assistant configuration
const ASSISTANT_CONFIG = {
    name: 'AuraLogic Website Assistant',
    instructions: `You are AuraLogic's official website assistant.

Answer ONLY using the information contained in the uploaded company files.

If the answer is not found in those files, respond with:
"I'm sorry, I don't have that information yet."

Keep responses concise, accurate, and professional. Do not make up information or guess answers.`,
    model: 'gpt-4o-mini', // Using GPT-4o-mini for cost efficiency, can change to 'gpt-4o' for better quality
    tools: [{ type: 'file_search' }], // Enable file search
};

/**
 * Upload a file to OpenAI
 */
async function uploadFile(filePath) {
    try {
        console.log(`📤 Uploading: ${path.basename(filePath)}...`);
        
        const file = await openai.files.create({
            file: fs.createReadStream(filePath),
            purpose: 'assistants',
        });

        console.log(`✅ Uploaded: ${file.id} - ${file.filename}`);
        return file.id;
    } catch (error) {
        console.error(`❌ Error uploading ${filePath}:`, error.message);
        throw error;
    }
}

/**
 * Get all knowledge files
 */
function getKnowledgeFiles() {
    const files = [];
    const fileExtensions = ['.md', '.txt', '.pdf', '.json'];
    
    if (!fs.existsSync(KNOWLEDGE_DIR)) {
        throw new Error(`Knowledge directory not found: ${KNOWLEDGE_DIR}`);
    }

    const dirFiles = fs.readdirSync(KNOWLEDGE_DIR);
    
    for (const file of dirFiles) {
        const filePath = path.join(KNOWLEDGE_DIR, file);
        const ext = path.extname(file).toLowerCase();
        
        if (fs.statSync(filePath).isFile() && fileExtensions.includes(ext)) {
            files.push(filePath);
        }
    }

    return files;
}

/**
 * Create vector store and upload files
 * Tries multiple API paths for compatibility
 */
async function createVectorStore(fileIds) {
    try {
        console.log('\n📦 Creating vector store...');
        
        let vectorStore;
        
        // Try different API paths for vector stores
        if (openai.beta && openai.beta.vectorStores && typeof openai.beta.vectorStores.create === 'function') {
            // Standard path: openai.beta.vectorStores.create
            vectorStore = await openai.beta.vectorStores.create({
                name: 'AuraLogic Knowledge Base',
                file_ids: fileIds,
            });
        } else if (openai.vectorStores && typeof openai.vectorStores.create === 'function') {
            // Alternative path: openai.vectorStores.create
            vectorStore = await openai.vectorStores.create({
                name: 'AuraLogic Knowledge Base',
                file_ids: fileIds,
            });
        } else {
            throw new Error('Vector stores API not available in this SDK version');
        }

        console.log(`✅ Vector store created: ${vectorStore.id}`);
        return vectorStore.id;
    } catch (error) {
        console.error('❌ Error creating vector store:', error.message);
        console.error('   This might be due to SDK version. Trying alternative approach...');
        throw error; // Re-throw to handle in main function
    }
}

/**
 * Create vector store using step-by-step approach (for SDK compatibility)
 */
async function createVectorStoreStepByStep(fileIds) {
    try {
        console.log('\n📦 Creating vector store (step-by-step)...');
        
        // Step 1: Create empty vector store
        let vectorStore;
        if (openai.beta && openai.beta.vectorStores) {
            vectorStore = await openai.beta.vectorStores.create({
                name: 'AuraLogic Knowledge Base',
            });
        } else if (openai.vectorStores) {
            vectorStore = await openai.vectorStores.create({
                name: 'AuraLogic Knowledge Base',
            });
        } else {
            throw new Error('Vector stores API not available');
        }
        
        console.log(`   ✅ Vector store created: ${vectorStore.id}`);
        
        // Step 2: Add files to vector store one by one
        console.log('   📎 Adding files to vector store...');
        const vectorStoreId = vectorStore.id;
        const vsFiles = openai.beta?.vectorStores?.files || openai.vectorStores?.files;
        
        if (vsFiles) {
            for (const fileId of fileIds) {
                try {
                    await vsFiles.create(vectorStoreId, {
                        file_id: fileId,
                    });
                    console.log(`   ✅ Added file: ${fileId}`);
                } catch (fileError) {
                    console.log(`   ⚠️  Warning: Could not add file ${fileId}: ${fileError.message}`);
                }
            }
        } else {
            // If we can't add files individually, try updating vector store with all files
            try {
                if (openai.beta && openai.beta.vectorStores && openai.beta.vectorStores.update) {
                    await openai.beta.vectorStores.update(vectorStoreId, {
                        file_ids: fileIds,
                    });
                } else if (openai.vectorStores && openai.vectorStores.update) {
                    await openai.vectorStores.update(vectorStoreId, {
                        file_ids: fileIds,
                    });
                }
                console.log(`   ✅ Added ${fileIds.length} files to vector store`);
            } catch (updateError) {
                console.log(`   ⚠️  Warning: Could not update vector store with files: ${updateError.message}`);
            }
        }
        
        return vectorStoreId;
    } catch (error) {
        console.error('❌ Error in step-by-step vector store creation:', error.message);
        throw error;
    }
}

/**
 * Create or update assistant
 */
async function createAssistant(vectorStoreId, fileIds) {
    try {
        console.log('\n🤖 Creating assistant...');
        
        const assistantConfig = {
            ...ASSISTANT_CONFIG,
            tool_resources: {
                file_search: {
                    vector_store_ids: [vectorStoreId],
                },
            },
        };
        
        const assistant = await openai.beta.assistants.create(assistantConfig);

        console.log(`✅ Assistant created: ${assistant.id}`);
        console.log(`   Name: ${assistant.name}`);
        console.log(`   Model: ${assistant.model}`);
        console.log(`   Vector Store: ${vectorStoreId}`);
        
        return assistant.id;
    } catch (error) {
        console.error('❌ Error creating assistant:', error.message);
        throw error;
    }
}

/**
 * Update .env file with assistant ID
 */
function updateEnvFile(assistantId) {
    const envPath = path.join(__dirname, '.env');
    let envContent = '';

    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add OPENAI_ASSISTANT_ID
    if (envContent.includes('OPENAI_ASSISTANT_ID=')) {
        envContent = envContent.replace(
            /OPENAI_ASSISTANT_ID=.*/,
            `OPENAI_ASSISTANT_ID=${assistantId}`
        );
    } else {
        envContent += `\nOPENAI_ASSISTANT_ID=${assistantId}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`\n✅ Updated .env file with Assistant ID`);
}

/**
 * Main setup function
 */
async function setupAssistant() {
    try {
        console.log('🚀 Starting AuraLogic Assistant Setup\n');
        console.log('=' .repeat(50));

        // Check API key
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY not found in .env file');
        }

        // Get knowledge files
        console.log('\n📚 Scanning knowledge files...');
        const knowledgeFiles = getKnowledgeFiles();
        
        if (knowledgeFiles.length === 0) {
            throw new Error('No knowledge files found in knowledge/ directory');
        }

        console.log(`Found ${knowledgeFiles.length} file(s):`);
        knowledgeFiles.forEach(file => {
            console.log(`   - ${path.basename(file)}`);
        });

        // Upload files
        console.log('\n📤 Uploading files to OpenAI...');
        const fileIds = [];
        
        for (const filePath of knowledgeFiles) {
            const fileId = await uploadFile(filePath);
            fileIds.push(fileId);
        }

        // Create vector store
        let vectorStoreId;
        try {
            // Try the standard approach first
            vectorStoreId = await createVectorStore(fileIds);
        } catch (error) {
            // If that fails, try step-by-step approach
            console.log('\n   Trying alternative vector store creation method...');
            try {
                vectorStoreId = await createVectorStoreStepByStep(fileIds);
            } catch (stepError) {
                throw new Error(`Failed to create vector store: ${stepError.message}\n` +
                    `Please ensure you're using OpenAI SDK v4.20.0 or later.`);
            }
        }

        // Create assistant with vector store
        const assistantId = await createAssistant(vectorStoreId, fileIds);

        // Update .env file
        updateEnvFile(assistantId);

        console.log('\n' + '='.repeat(50));
        console.log('✅ Setup completed successfully!\n');
        console.log(`📝 Assistant ID: ${assistantId}`);
        console.log(`\n💡 Next steps:`);
        console.log(`   1. Start the server: node server.js`);
        console.log(`   2. Test the chatbot on your website`);
        console.log(`\n⚠️  Note: Keep your Assistant ID secure and do not commit it to version control.`);

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

// Run setup
if (require.main === module) {
    setupAssistant();
}

module.exports = { setupAssistant };

