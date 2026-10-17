# KHMER LAUNCHER - Minecraft 1.21.1 Custom Launcher & PvP Client

គម្រោងនេះជា **KHMER LAUNCHER (Electron GUI Client)** ដំណើរការជាមួយ Minecraft 1.21.1 Fabric & Vanilla រួមបញ្ចូលប្រព័ន្ធពេញលេញ (Multi-Account, Mod Manager, Modrinth Store, PvP HUD Editor, Installations Manager, Skin Studio) ដែល Build ចេញជា **`KHMERLUNCHER.exe`** ដំណើរការលើ Windows ដោយស្វ័យប្រវត្តិ។

---

## ⚡ ប្រព័ន្ធទាំងអស់ដែលដំណើរការ (All Working Systems)

1. **🎮 Play & Auto-Installer System**:
   - គាំទ្រទាំង **Fabric 1.21.1** (PvP Modded) និង **Vanilla 1.21.1**។
   - **Auto-Install Fabric Loader**: ប្រព័ន្ធទាញយក និងដំឡើង Fabric Loader ដោយស្វ័យប្រវត្តិតាមរយៈ Fabric Meta API ប្រសិនបើម៉ាស៊ីនពុំទាន់មាន។
   - **Auto-Detect Java 21**: រកឃើញ OpenJDK 21 រួមជាមួយ JRE ក្នុង `.minecraft/jre` និង Windows PATH។
   - **Mods Auto-Repair**: ជួសជុល និង recover ឯកសារ `.temp.jar` ទៅជា `.jar` ស្វ័យប្រវត្តិ។

2. **👤 Multi-Account Management**:
   - **Microsoft Official Login**: ភ្ជាប់ជាមួយគណនី Mojang/Microsoft ផ្លូវការ (Xbox Live / msmc)។
   - **Offline Profiles**: បង្កើត profile ជាមួយឈ្មោះផ្ទាល់ខ្លួន និង dynamic skin avatar (`Dara`)។
   - **Quick Account Switcher**: ផ្លាស់ប្តូរ account ពី menu dropdown លើ header ភ្លាមៗ។

3. **⚙️ Installations & Hardware Performance Tuning**:
   - កំណត់ទំហំ RAM Allocation (2 GB, 4 GB, 6 GB, 8 GB, 12 GB, 16 GB)។
   - កំណត់ Custom Java Runtime Path (រើស `javaw.exe` / `java.exe` ផ្ទាល់ខ្លួន)។
   - កំណត់ Custom Game Directory Folder។
   - Advanced JVM Arguments Preset (High-Performance G1GC, Aikar Low-Latency, Vanilla)។

4. **👕 Character Appearance & Skin Studio**:
   - Live Full-Body 3D/HD Skin Render។
   - Curated Tournament PvP Skin Presets (Cyber Shinobi, Neon Assassin, Void Knight, Diamond Slayer, etc.)។
   - Clone Skin ពីឈ្មោះកីឡាករ Minecraft ណាមួយ (Technoblade, Dream, Rosv2...)។
   - ផ្ទុកឡើងឯកសារស្បែកផ្ទាល់ខ្លួន (Custom `.png` Skin Upload)។

5. **📦 Modifications Manager**:
   - បង្ហាញបញ្ជី Mod ទាំងអស់ក្នុង `.minecraft/mods` ជាមួយ Status (Active / Disabled)។
   - KHMER Client Mod (SimplePvP) & Fabric API 1.21.1 One-Click Re-Inject & Install។
   - Switch On/Off និង Delete Mod ដោយមាន Confirm Dialog។
   - Mod Search Filter & Mod Counter Badge។
   - Clean & Repair Button សម្អាត និង activate `.temp.jar` mods។
   - Drag & Drop `.jar` និង `.zip` mods/resourcepacks ចូលក្នុងផ្ទាំង Launcher ផ្ទាល់។
   - One-click Import ពី Modrinth URL ឬ slug។

6. **🛒 Modrinth Marketplace**:
   - ស្វែងរក និងទាញយក Mods & Resource Packs សម្រាប់ Minecraft 1.21.1 Fabric។
   - 1-Click Auto Install ជាមួយ Download Progress Bar ផ្ទាល់។
   - Filter តាម Category (All, Mods, Resource Packs) និង Sort (Most Downloaded, Relevance, Newest)។

7. **⚔️ PvP HUD Mods & Combat Analytics**:
   - Reach Display, Target Health Indicator, Ping & FPS, Keystrokes & Speedometer (BPS), Armor Durability, Coordinates, Crosshair CPS, Custom Player Tag (`[NMC-PRO]`, `[VIP]`, `[DEV]`)។
   - Real-time Sync ទៅ `.minecraft/nmc_pvp_modules.json`។
   - Neon Color Palette & Custom Hex Color Picker។

8. **🎨 Dynamic Wallpaper System**:
   - រើស Wallpaper (🏛 Angkor Khmer Temple, ⚔ Tricky Trials 1.21.1, 🌌 Neon Dark, 🖼 Custom File)។

9. **💬 Community Integration**:
   - Discord: [https://discord.gg/ZnHuvUqpn](https://discord.gg/ZnHuvUqpn)
   - Telegram: [https://t.me/+Gzx1VlNQa3Q0YTJl](https://t.me/+Gzx1VlNQa3Q0YTJl)

---

## 🚀 របៀបដំណើរការ និង Rebuild ជា .exe

### ១. តេស្តដំណើរការ Launcher ក្នុង Dev Mode
```bash
npm start
```

### ២. បង្កើតឯកសារ `KHMERLUNCHER.exe` ថ្មី
```bash
npm run build
```

ឯកសារ Executable នឹងត្រូវបានបង្កើតឡើងនៅ៖
- 🚀 **`KHMERLUNCHER.exe`** (នៅក្នុង root directory)
- 📦 **`dist/KHMER-Launcher-Setup-1.3.0.exe`** (Installer)
- 🚀 **`dist/KHMERLUNCHER.exe`** (Portable Executable)
