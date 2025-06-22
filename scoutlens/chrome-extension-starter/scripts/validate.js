// Validate manifest.json and extension files
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Chrome extension...');

// Check if manifest.json exists and is valid
function validateManifest() {
    const manifestPath = path.join(__dirname, '..', 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
        console.error('❌ manifest.json not found');
        return false;
    }
    
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        // Check required fields
        const requiredFields = ['manifest_version', 'name', 'version'];
        for (const field of requiredFields) {
            if (!manifest[field]) {
                console.error(`❌ Missing required field: ${field}`);
                return false;
            }
        }
        
        // Check manifest version
        if (manifest.manifest_version !== 3) {
            console.error('❌ This template requires Manifest V3');
            return false;
        }
        
        console.log('✅ manifest.json is valid');
        return true;
    } catch (error) {
        console.error('❌ Invalid JSON in manifest.json:', error.message);
        return false;
    }
}

// Check if referenced files exist
function validateFiles() {
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
    const requiredFiles = [];
    
    // Add background script
    if (manifest.background?.service_worker) {
        requiredFiles.push(manifest.background.service_worker);
    }
    
    // Add content scripts
    if (manifest.content_scripts) {
        manifest.content_scripts.forEach(script => {
            if (script.js) requiredFiles.push(...script.js);
            if (script.css) requiredFiles.push(...script.css);
        });
    }
    
    // Add popup
    if (manifest.action?.default_popup) {
        requiredFiles.push(manifest.action.default_popup);
    }
    
    // Add options page
    if (manifest.options_page) {
        requiredFiles.push(manifest.options_page);
    }
    
    // Add web accessible resources
    if (manifest.web_accessible_resources) {
        manifest.web_accessible_resources.forEach(resource => {
            if (resource.resources) {
                requiredFiles.push(...resource.resources);
            }
        });
    }
    
    // Check each file
    let allFilesExist = true;
    for (const file of requiredFiles) {
        const filePath = path.join(__dirname, '..', file);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Referenced file not found: ${file}`);
            allFilesExist = false;
        }
    }
    
    if (allFilesExist) {
        console.log('✅ All referenced files exist');
    }
    
    return allFilesExist;
}

// Check for common issues
function validateStructure() {
    const issues = [];
    
    // Check for common HTML files
    const htmlFiles = ['popup.html', 'options.html'];
    htmlFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for inline scripts (not allowed in Manifest V3)
            if (content.includes('<script>') && !content.includes('src=')) {
                issues.push(`${file} contains inline scripts (not allowed in Manifest V3)`);
            }
            
            // Check for eval() usage
            if (content.includes('eval(')) {
                issues.push(`${file} contains eval() (not allowed in Manifest V3)`);
            }
        }
    });
    
    // Check JavaScript files
    const jsFiles = ['background.js', 'content.js', 'popup.js', 'options.js'];
    jsFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for eval() usage
            if (content.includes('eval(')) {
                issues.push(`${file} contains eval() (not allowed in Manifest V3)`);
            }
            
            // Check for chrome.extension API (deprecated)
            if (content.includes('chrome.extension')) {
                issues.push(`${file} uses deprecated chrome.extension API`);
            }
        }
    });
    
    if (issues.length === 0) {
        console.log('✅ No structural issues found');
        return true;
    } else {
        console.log('⚠️  Issues found:');
        issues.forEach(issue => console.log(`   - ${issue}`));
        return false;
    }
}

// Run validation
async function validate() {
    let isValid = true;
    
    isValid = validateManifest() && isValid;
    isValid = validateFiles() && isValid;
    isValid = validateStructure() && isValid;
    
    if (isValid) {
        console.log('\n🎉 Extension validation passed!');
        console.log('📦 Ready to load in Chrome at chrome://extensions/');
    } else {
        console.log('\n❌ Extension validation failed!');
        console.log('🔧 Please fix the issues above before loading the extension');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    validate();
}

module.exports = { validate };
