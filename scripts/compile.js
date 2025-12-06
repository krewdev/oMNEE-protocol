#!/usr/bin/env node
import solc from 'solc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find all Solidity files in contracts directory
const contractsDir = path.join(__dirname, '..', 'contracts');
const files = fs.readdirSync(contractsDir).filter(f => f.endsWith('.sol'));

const sources = {};

// Read all contract files
for (const file of files) {
  const filePath = path.join(contractsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  sources[file] = { content };
}

// Prepare input for solc
const input = {
  language: 'Solidity',
  sources: sources,
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode']
      }
    },
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};

// Import callback to resolve OpenZeppelin imports
function findImports(importPath) {
  try {
    // Try to find in node_modules
    const nodePath = path.join(__dirname, '..', 'node_modules', importPath);
    if (fs.existsSync(nodePath)) {
      return { contents: fs.readFileSync(nodePath, 'utf8') };
    }
  } catch (e) {
    console.error('Error importing:', importPath, e.message);
  }
  return { error: 'File not found: ' + importPath };
}

// Compile
console.log('Compiling contracts...');
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

// Check for errors
if (output.errors) {
  let hasErrors = false;
  output.errors.forEach(error => {
    console.error(error.formattedMessage);
    if (error.severity === 'error') {
      hasErrors = true;
    }
  });
  if (hasErrors) {
    process.exit(1);
  }
}

// Create artifacts directory
const artifactsDir = path.join(__dirname, '..', 'artifacts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

// Save compiled contracts
if (output.contracts) {
  for (const [fileName, fileContracts] of Object.entries(output.contracts)) {
    for (const [contractName, contract] of Object.entries(fileContracts)) {
      const artifact = {
        contractName,
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object
      };
      
      const artifactPath = path.join(artifactsDir, `${contractName}.json`);
      fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
      console.log(`✓ Compiled ${contractName}`);
    }
  }
}

console.log('\nCompilation successful!');
