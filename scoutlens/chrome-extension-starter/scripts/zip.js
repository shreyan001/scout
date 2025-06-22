// Create a ZIP file for Chrome Web Store upload
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('📦 Creating ZIP file for Chrome Web Store...');

function createZip() {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    const zipName = `chrome-extension-v${manifest.version}.zip`;
    
    // Create output stream
    const output = fs.createWriteStream(zipName);
    const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
    });
    
    // Listen for archive events
    output.on('close', () => {
        console.log(`✅ ZIP created: ${zipName} (${archive.pointer()} bytes)`);
        console.log('🚀 Ready to upload to Chrome Web Store!');
    });
    
    archive.on('error', (err) => {
        console.error('❌ Error creating ZIP:', err);
        throw err;
    });
    
    // Pipe archive data to file
    archive.pipe(output);
    
    // Add files to archive
    const filesToInclude = [
        'manifest.json',
        'background.js',
        'content.js',
        'content.css',
        'popup.html',
        'popup.js',
        'popup.css',
        'options.html',
        'options.js',
        'options.css',
        'injected.js'
    ];
    
    // Add individual files
    filesToInclude.forEach(file => {
        if (fs.existsSync(file)) {
            archive.file(file, { name: file });
        }
    });
    
    // Add icons directory if it exists
    if (fs.existsSync('icons') && fs.statSync('icons').isDirectory()) {
        archive.directory('icons/', 'icons/');
    }
    
    // Exclude development files
    const excludePatterns = [
        'node_modules',
        'scripts',
        'package.json',
        'package-lock.json',
        '.git',
        '.gitignore',
        '*.zip',
        'README.md'
    ];
    
    console.log('📁 Files included in ZIP:');
    filesToInclude.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`   ✓ ${file}`);
        }
    });
    
    if (fs.existsSync('icons')) {
        console.log('   ✓ icons/');
    }
    
    console.log('🚫 Files excluded:');
    excludePatterns.forEach(pattern => {
        console.log(`   - ${pattern}`);
    });
    
    // Finalize the archive
    archive.finalize();
}

// Run if called directly
if (require.main === module) {
    createZip();
}

module.exports = { createZip };
