const { Client, Authenticator } = require('minecraft-launcher-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const launcher = new Client();
const mcPath = path.join(process.env.APPDATA, '.minecraft');

// 1. រកមើល Java 21 ដែលត្រូវនឹង Minecraft 1.21.1
function findJavaExecutable() {
    // ពិនិត្យ PATH ប្រព័ន្ធ
    try {
        const pathJava = execSync('where java', { encoding: 'utf-8' }).trim().split('\r\n')[0];
        if (pathJava && fs.existsSync(pathJava)) return pathJava;
    } catch (e) {
        // Java មិនទាន់មានក្នុង PATH
    }

    // ពិនិត្យក្នុង .minecraft/jre
    const jreBase = path.join(mcPath, 'jre');
    if (fs.existsSync(jreBase)) {
        const findInDir = (dir) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    const candidate = path.join(fullPath, 'bin', 'java.exe');
                    if (fs.existsSync(candidate)) return candidate;
                    const nested = findInDir(fullPath);
                    if (nested) return nested;
                }
            }
            return null;
        };
        const found = findInDir(jreBase);
        if (found) return found;
    }

    // ពិនិត្យក្នុង C:\Program Files\Java ឬ Adoptium
    const standardPaths = [
        'C:\\Program Files\\Java',
        'C:\\Program Files\\Eclipse Adoptium',
        'C:\\Program Files\\Microsoft'
    ];
    for (const p of standardPaths) {
        if (fs.existsSync(p)) {
            const items = fs.readdirSync(p);
            for (const item of items) {
                const candidate = path.join(p, item, 'bin', 'java.exe');
                if (fs.existsSync(candidate)) return candidate;
            }
        }
    }

    return undefined; // បើគ្មាន ទុកឱ្យ launcher-core ស្វែងរកតាមលំនាំដើម
}

// 2. ស្វែងរក Fabric Loader Version ដែលបានដំឡើងរួចក្នុង .minecraft/versions
function getFabricVersion(targetMcVersion) {
    const versionsDir = path.join(mcPath, 'versions');
    if (!fs.existsSync(versionsDir)) return null;

    const installed = fs.readdirSync(versionsDir);
    const fabric = installed.find(v => v.toLowerCase().includes('fabric-loader') && v.includes(targetMcVersion));
    return fabric || null;
}

// ធានាថាមាន folder mods
const modsDir = path.join(mcPath, 'mods');
if (!fs.existsSync(modsDir)) {
    fs.mkdirSync(modsDir, { recursive: true });
}

// កំណត់ arguments ពី Command Line (ឧ. node launcher.js --user Dara --ram 4G)
const args = process.argv.slice(2);
let username = "Dara_PvP";
let ram = "4G";

for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--user' || args[i] === '-u') && args[i + 1]) {
        username = args[i + 1];
    }
    if ((args[i] === '--ram' || args[i] === '-r') && args[i + 1]) {
        ram = args[i + 1];
    }
}

const javaPath = findJavaExecutable();
const fabricVersionName = getFabricVersion("1.21.1");

console.log("==================================================");
console.log("       🌟 DARA CLIENT - MINECRAFT 1.21.1 🌟       ");
console.log("==================================================");
console.log(`👤 កីឡាករ: ${username}`);
console.log(`⚡ អង្គចងចាំ RAM: ${ram}`);
console.log(`☕ Java Path: ${javaPath || 'ប្រើប្រាស់តាម System Default'}`);
console.log(`🧩 Fabric Mode: ${fabricVersionName ? `✅ ស្គាល់ (${fabricVersionName})` : '⚠️ មិនទាន់ឃើញ (បើកជា Vanilla)'}`);
console.log("==================================================");

if (!fabricVersionName) {
    console.warn("⚠️ ចំណាំ៖ ដើម្បីឱ្យ Mod (SimplePvP) ដំណើរការ សូមប្រាកដថាបាន install Fabric Loader 1.21.1");
    console.warn("   ទាញយក Fabric Installer ពី: https://fabricmc.net/use/installer/\n");
}

const opt = {
    clientPackage: null,
    authorization: Authenticator.getAuth(username),
    root: mcPath,
    javaPath: javaPath,
    version: {
        number: "1.21.1",
        type: "release",
        ...(fabricVersionName ? { custom: fabricVersionName } : {})
    },
    memory: {
        max: ram,
        min: "2G"
    }
};

console.log("🚀 កំពុងរៀបចំ និងចាប់ផ្ដើមដំណើរការ...");
launcher.launch(opt);

launcher.on('debug', (e) => {
    // បង្ហាញ debug សំខាន់ៗ
    if (e.includes('Download') || e.includes('Launching') || e.includes('Arguments')) {
        console.log(`[Debug]: ${e}`);
    }
});

launcher.on('data', (e) => {
    console.log(`[Minecraft]: ${e.trim()}`);
});

launcher.on('progress', (e) => {
    if (e.total > 0) {
        const percent = Math.round((e.task / e.total) * 100);
        process.stdout.write(`\r⏳ [ទាញយក Resource]: ${e.type} - ${percent}% (${e.task}/${e.total})`);
        if (percent === 100) console.log("");
    }
});

launcher.on('close', (code) => {
    console.log(`\n🛑 ហ្គេមត្រូវបានបិទជាមួយ Exit Code: ${code}`);
});
