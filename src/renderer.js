document.getElementById('btn-min').addEventListener('click', () => window.api.minimize());
document.getElementById('btn-close').addEventListener('click', () => window.api.close());

// Animated Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✔' : type === 'error' ? '✖' : 'ℹ';
  toast.innerHTML = `<span style="font-weight: bold;">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 4000);
}

const tabs = document.querySelectorAll('.nav-tab');
const contents = document.querySelectorAll('.tab-content');
const glowPools = document.querySelectorAll('.nav-glow-pool');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    glowPools.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const tabName = tab.getAttribute('data-tab');
    const target = document.getElementById(`tab-${tabName}`);
    if (target) target.classList.add('active');

    const activePool = document.querySelector(`.nav-glow-pool[data-tab="${tabName}"]`);
    if (activePool) activePool.classList.add('active');

    // Manage video motion on tab switch to optimize performance
    const heroBgVideo = document.getElementById('hero-bg-video');
    if (heroBgVideo) {
      if (tabName === 'play') {
        heroBgVideo.play().catch(() => {});
      } else {
        heroBgVideo.pause();
      }
    }

    if (tabName === 'mods') loadModsList();
    if (tabName === 'store') loadStore();
    if (tabName === 'pvpmods') loadPvpConfigUI();
    if (tabName === 'installations') loadSettingsUI();
    if (tabName === 'skins') loadSkinStudioUI();
  });
});

let cachedMods = [];
let activeModFilter = 'all';
const modsListBody = document.getElementById('mods-list-body');
const modsSearchInput = document.getElementById('mods-search-input');
const modsCountBadge = document.getElementById('mods-count-badge');
const btnCleanMods = document.getElementById('btn-clean-mods');
const builtinModBadge = document.getElementById('builtin-mod-badge');
const fabricApiBadge = document.getElementById('fabric-api-badge');
const btnReinjectClient = document.getElementById('btn-reinject-client');
const btnInstallFabricApi = document.getElementById('btn-install-fabric-api');
const modalCustomMod = document.getElementById('modal-custom-mod');
const btnOpenCustomModModal = document.getElementById('btn-open-custom-mod-modal');
const btnCloseCustomModModal = document.getElementById('btn-close-custom-mod-modal');

function renderModsList(filterText = '') {
  if (!modsListBody) return;
  const lowerSearch = filterText.toLowerCase();

  // Filter by category chip and text
  const filtered = cachedMods.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(lowerSearch) || m.filename.toLowerCase().includes(lowerSearch);
    if (!matchesSearch) return false;

    if (activeModFilter === 'custom') return m.isCustom;
    if (activeModFilter === 'builtin') return m.isBuiltIn || m.isFabricApi;
    if (activeModFilter === 'active') return m.enabled;
    if (activeModFilter === 'disabled') return !m.enabled;
    return true;
  });

  // Update Core Status Cards
  const hasBuiltIn = cachedMods.some(m => m.isBuiltIn);
  if (builtinModBadge) {
    builtinModBadge.className = hasBuiltIn ? 'core-badge badge-active badge-pill-neon' : 'core-badge badge-warning badge-pill-neon';
    builtinModBadge.innerHTML = hasBuiltIn ? '<span class="badge-icon">🔗</span> ACTIVE & SYNCED' : '<span class="badge-icon">⚠</span> MISSING (CLICK RE-INJECT)';
  }

  const hasFabricApi = cachedMods.some(m => m.isFabricApi);
  if (fabricApiBadge && btnInstallFabricApi) {
    if (hasFabricApi) {
      fabricApiBadge.className = 'core-badge badge-active badge-pill-neon';
      fabricApiBadge.innerHTML = '<span class="badge-icon">✔</span> INSTALLED & ACTIVE';
      btnInstallFabricApi.innerHTML = '<span class="btn-pill-icon">✔</span> Installed';
      btnInstallFabricApi.disabled = true;
      btnInstallFabricApi.classList.remove('primary');
    } else {
      fabricApiBadge.className = 'core-badge badge-warning badge-pill-neon';
      fabricApiBadge.innerHTML = '<span class="badge-icon">⚠</span> NOT DETECTED';
      btnInstallFabricApi.innerHTML = '<span class="btn-pill-icon">⚡</span> Install Fabric API';
      btnInstallFabricApi.disabled = false;
      btnInstallFabricApi.classList.add('primary');
    }
  }

  if (modsCountBadge) {
    const activeCount = cachedMods.filter(m => m.enabled).length;
    const customCount = cachedMods.filter(m => m.isCustom).length;
    modsCountBadge.innerText = `Active: ${activeCount} / ${cachedMods.length} (${customCount} Custom)`;
  }

  if (filtered.length === 0) {
    modsListBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 24px;">${cachedMods.length === 0 ? 'No mods found in .minecraft/mods. Click "+ Add Custom Mod (.jar)" to install your first mod!' : 'No mods matching current filters.'}</td></tr>`;
    return;
  }

  modsListBody.innerHTML = '';
  filtered.forEach(mod => {
    const tr = document.createElement('tr');
    let categoryBadge = '<span class="mod-tag-custom">Custom Added</span>';
    if (mod.isBuiltIn) categoryBadge = '<span class="mod-tag-builtin">KHMER Built-In</span>';
    else if (mod.isFabricApi) categoryBadge = '<span class="mod-tag-core">Fabric API Core</span>';

    tr.innerHTML = `
      <td>
        <label class="switch">
          <input type="checkbox" class="mod-toggle" data-file="${mod.filename}" ${mod.enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </td>
      <td>
        <strong style="color: #f1f5f9;">${mod.name}</strong>
        <div style="font-size: 11px; color: ${mod.enabled ? '#2ebd59' : '#ef4444'};">
          ${mod.enabled ? '● Active' : '○ Disabled'}
        </div>
      </td>
      <td>${categoryBadge}</td>
      <td style="color: #94a3b8; font-size: 12px;">${mod.sizeMb} MB</td>
      <td style="text-align: center; white-space: nowrap;">
        <button class="btn-locate-mod" data-file="${mod.filename}" title="Show in File Explorer">📂 Locate</button>
        <button class="btn-delete-mod" data-file="${mod.filename}" title="Delete Mod">Delete</button>
      </td>
    `;
    modsListBody.appendChild(tr);
  });

  document.querySelectorAll('.mod-toggle').forEach(input => {
    input.addEventListener('change', async (e) => {
      await window.api.toggleMod(e.target.getAttribute('data-file'));
      loadModsList();
    });
  });

  document.querySelectorAll('.btn-locate-mod').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const fn = e.target.getAttribute('data-file');
      if (window.api && window.api.showItemInFolder) {
        window.api.showItemInFolder(fn);
      } else {
        window.api.openModsFolder();
      }
    });
  });

  document.querySelectorAll('.btn-delete-mod').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const fn = e.target.getAttribute('data-file');
      const row = e.target.closest('tr');

      if (confirm(`Do you want to delete ${fn}?\n(You can re-install it anytime)`)) {
        if (row) {
          row.style.transition = 'all 0.25s ease';
          row.style.opacity = '0';
          row.style.transform = 'translateX(20px)';
        }

        setTimeout(async () => {
          await window.api.deleteMod(fn);
          showToast(`Deleted ${fn}`, 'info');
          loadModsList();
        }, 200);
      }
    });
  });
}

async function loadModsList() {
  if (!modsListBody) return;
  modsListBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 18px;">Scanning mods folder...</td></tr>';
  cachedMods = await window.api.getModsList();
  const searchVal = modsSearchInput ? modsSearchInput.value.trim() : '';
  renderModsList(searchVal);
}

// Mod Filter Chips
document.querySelectorAll('.mod-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.mod-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeModFilter = chip.getAttribute('data-mod-filter') || 'all';
    const searchVal = modsSearchInput ? modsSearchInput.value.trim() : '';
    renderModsList(searchVal);
  });
});

if (modsSearchInput) {
  modsSearchInput.addEventListener('input', (e) => {
    renderModsList(e.target.value.trim());
  });
}

// Built-in Client Mod Re-Inject
if (btnReinjectClient) {
  btnReinjectClient.addEventListener('click', async () => {
    btnReinjectClient.disabled = true;
    btnReinjectClient.innerHTML = '<span class="btn-pill-icon rotating">🔄</span> Injecting...';
    try {
      const res = await window.api.reinjectClientMod();
      if (res.success) {
        showToast('KHMER Tournament PvP Client Mod injected successfully!', 'success');
        await loadModsList();
      } else {
        showToast(res.error || 'Failed to inject client mod', 'error');
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      btnReinjectClient.disabled = false;
      btnReinjectClient.innerHTML = '<span class="btn-pill-icon">🔄</span> Re-Inject Mod';
    }
  });
}

// Fabric API One-Click Install
if (btnInstallFabricApi) {
  btnInstallFabricApi.addEventListener('click', async () => {
    btnInstallFabricApi.disabled = true;
    btnInstallFabricApi.innerHTML = '<span class="btn-pill-icon rotating">⏳</span> Downloading...';
    showToast('Downloading official Fabric API 1.21.1 from Modrinth...', 'info');
    try {
      const res = await window.api.installFabricApi();
      if (res.success) {
        showToast(`Fabric API (${res.filename}) installed successfully!`, 'success');
        await loadModsList();
      } else {
        showToast(res.error || 'Failed to install Fabric API', 'error');
        btnInstallFabricApi.disabled = false;
        btnInstallFabricApi.innerHTML = '<span class="btn-pill-icon">⚡</span> Install Fabric API';
      }
    } catch (e) {
      showToast('Error installing Fabric API: ' + e.message, 'error');
      btnInstallFabricApi.disabled = false;
      btnInstallFabricApi.innerHTML = '<span class="btn-pill-icon">⚡</span> Install Fabric API';
    }
  });
}

if (btnCleanMods) {
  btnCleanMods.addEventListener('click', async () => {
    btnCleanMods.disabled = true;
    btnCleanMods.innerText = '⚡ Cleaning...';
    try {
      const res = await window.api.cleanMods();
      showToast(`Cleaned & Recovered ${res.recovered || 0} mod(s)!`, 'success');
      await loadModsList();
    } catch (e) {
      showToast('Error cleaning mods: ' + e.message, 'error');
    } finally {
      btnCleanMods.disabled = false;
      btnCleanMods.innerText = '⚡ Clean & Repair';
    }
  });
}

// ==========================================
// ADD CUSTOM MOD MODAL CONTROLS
// ==========================================
if (btnOpenCustomModModal && modalCustomMod) {
  btnOpenCustomModModal.addEventListener('click', () => {
    modalCustomMod.style.display = 'flex';
  });
}

if (btnCloseCustomModModal && modalCustomMod) {
  btnCloseCustomModModal.addEventListener('click', () => {
    modalCustomMod.style.display = 'none';
  });
}

if (modalCustomMod) {
  modalCustomMod.addEventListener('click', (e) => {
    if (e.target === modalCustomMod) modalCustomMod.style.display = 'none';
  });
}

// Modal Tabs
document.querySelectorAll('.cmod-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.cmod-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.cmod-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const paneId = tab.getAttribute('data-pane');
    const targetPane = document.getElementById(paneId);
    if (targetPane) targetPane.classList.add('active');
  });
});

// Modal Browse File Picker
const btnModalBrowseJars = document.getElementById('btn-modal-browse-jars');
const modalDropArea = document.getElementById('modal-drop-area');

async function triggerCustomModBrowse() {
  const res = await window.api.selectAndInstallMod();
  if (res.success && res.count > 0) {
    showToast(`Installed ${res.count} custom mod(s) successfully!`, 'success');
    if (modalCustomMod) modalCustomMod.style.display = 'none';
    loadModsList();
  }
}

if (btnModalBrowseJars) {
  btnModalBrowseJars.addEventListener('click', triggerCustomModBrowse);
}
if (modalDropArea) {
  modalDropArea.addEventListener('click', (e) => {
    if (e.target !== btnModalBrowseJars) triggerCustomModBrowse();
  });
}

// Modal URL / Modrinth Slug Downloader
const cmodUrlInput = document.getElementById('cmod-url-input');
const btnCmodDownloadUrl = document.getElementById('btn-cmod-download-url');

if (btnCmodDownloadUrl && cmodUrlInput) {
  btnCmodDownloadUrl.addEventListener('click', async () => {
    const val = cmodUrlInput.value.trim();
    if (!val) {
      showToast('Please enter a mod name or Modrinth URL', 'error');
      return;
    }
    btnCmodDownloadUrl.disabled = true;
    btnCmodDownloadUrl.innerText = 'Installing...';
    showToast(`Searching and downloading "${val}"...`, 'info');
    try {
      const res = await window.api.resolveAndInstallUrl(val);
      if (res.success) {
        showToast(`Installed: ${res.filename} (${res.sizeMb} MB)!`, 'success');
        cmodUrlInput.value = '';
        if (modalCustomMod) modalCustomMod.style.display = 'none';
        loadModsList();
      } else {
        showToast(res.error || 'Failed to install mod', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnCmodDownloadUrl.disabled = false;
      btnCmodDownloadUrl.innerText = 'Download & Install';
    }
  });
}

// Popular PvP Addons Quick 1-Click Install
document.querySelectorAll('.btn-pop-install').forEach(btn => {
  btn.addEventListener('click', async () => {
    const slug = btn.getAttribute('data-slug');
    if (!slug) return;
    btn.disabled = true;
    btn.innerText = 'Installing...';
    showToast(`Downloading ${slug} for Fabric 1.21.1...`, 'info');

    try {
      const res = await window.api.installModrinthProject({ slug, projectType: 'mod' });
      if (res.success) {
        btn.innerText = '✔ Installed';
        btn.classList.add('installed');
        showToast(`Installed ${res.filename}!`, 'success');
        loadModsList();
      } else {
        btn.disabled = false;
        btn.innerText = 'Install';
        showToast(res.error || 'Failed to install addon', 'error');
      }
    } catch (e) {
      btn.disabled = false;
      btn.innerText = 'Install';
      showToast('Error: ' + e.message, 'error');
    }
  });
});

document.getElementById('btn-open-folder').addEventListener('click', () => {
  window.api.openModsFolder();
});

const btnOpenPacks = document.getElementById('btn-open-packs');
if (btnOpenPacks) {
  btnOpenPacks.addEventListener('click', () => {
    window.api.openPacksFolder();
  });
}

// ==========================================
// Modrinth Quick URL Importer & Drag/Drop
// ==========================================
const btnImportUrl = document.getElementById('btn-import-url');
const urlImportBar = document.getElementById('url-import-bar');
const urlImportInput = document.getElementById('url-import-input');
const btnSubmitUrl = document.getElementById('btn-submit-url');
const btnCancelUrl = document.getElementById('btn-cancel-url');
const modsDropZone = document.getElementById('mods-drop-zone');
const dragDropOverlay = document.getElementById('drag-drop-overlay');

if (btnImportUrl && urlImportBar) {
  btnImportUrl.addEventListener('click', () => {
    const isShowing = urlImportBar.style.display !== 'none';
    urlImportBar.style.display = isShowing ? 'none' : 'flex';
    if (!isShowing && urlImportInput) {
      urlImportInput.focus();
    }
  });
}

if (btnCancelUrl && urlImportBar) {
  btnCancelUrl.addEventListener('click', () => {
    urlImportBar.style.display = 'none';
    if (urlImportInput) urlImportInput.value = '';
  });
}

async function handleUrlInstall() {
  if (!urlImportInput) return;
  const val = urlImportInput.value.trim();
  if (!val) {
    showToast('Please enter a valid Modrinth URL or project name.', 'error');
    return;
  }

  btnSubmitUrl.disabled = true;
  btnSubmitUrl.innerText = 'Installing...';
  showToast(`Resolving 1.21.1 release for "${val}"...`, 'info');

  try {
    const res = await window.api.resolveAndInstallUrl(val);
    btnSubmitUrl.disabled = false;
    btnSubmitUrl.innerText = 'Install';

    if (res.success) {
      showToast(`Installed ${res.projectType}: ${res.filename} (${res.sizeMb} MB)!`, 'success');
      urlImportInput.value = '';
      urlImportBar.style.display = 'none';
      loadModsList();
    } else {
      showToast(res.error || 'Failed to install project.', 'error');
    }
  } catch (err) {
    btnSubmitUrl.disabled = false;
    btnSubmitUrl.innerText = 'Install';
    showToast(err.message, 'error');
  }
}

if (btnSubmitUrl) {
  btnSubmitUrl.addEventListener('click', handleUrlInstall);
}
if (urlImportInput) {
  urlImportInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleUrlInstall();
    if (e.key === 'Escape') urlImportBar.style.display = 'none';
  });
}

// Drag & Drop File Handling
let dragCounter = 0;

window.addEventListener('dragenter', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter++;
  if (dragDropOverlay) dragDropOverlay.classList.add('active');
  if (modsDropZone) modsDropZone.classList.add('dragover');
});

window.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    if (dragDropOverlay) dragDropOverlay.classList.remove('active');
    if (modsDropZone) modsDropZone.classList.remove('dragover');
  }
});

window.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

window.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter = 0;
  if (dragDropOverlay) dragDropOverlay.classList.remove('active');
  if (modsDropZone) modsDropZone.classList.remove('dragover');

  const files = e.dataTransfer.files;
  if (!files || files.length === 0) return;

  const filePaths = [];
  for (let i = 0; i < files.length; i++) {
    if (files[i].path) {
      filePaths.push(files[i].path);
    }
  }

  if (filePaths.length === 0) return;

  showToast(`Processing ${filePaths.length} dropped file(s)...`, 'info');
  const res = await window.api.handleDroppedFiles(filePaths);
  if (res.success) {
    const msgs = [];
    if (res.modsAdded > 0) msgs.push(`${res.modsAdded} Mod(s) installed to mods/`);
    if (res.packsAdded > 0) msgs.push(`${res.packsAdded} Resource Pack(s) installed`);
    if (msgs.length > 0) {
      showToast(msgs.join(', '), 'success');
      loadModsList();
    } else {
      showToast('No valid .jar mods or .zip packs found in dropped files.', 'error');
    }
  } else {
    showToast('Failed to install dropped files.', 'error');
  }
});

if (modsDropZone) {
  modsDropZone.addEventListener('click', async () => {
    const res = await window.api.selectAndInstallMod();
    if (res.success && res.count > 0) {
      showToast(`Installed ${res.count} mod(s) successfully!`, 'success');
      loadModsList();
    }
  });
}


// ==========================================
// Modrinth Marketplace Store Logic
// ==========================================
const storeSearchInput = document.getElementById('store-search-input');
const btnClearSearch = document.getElementById('btn-clear-search');
const filterChips = document.querySelectorAll('.filter-chip');
const storeSortSelect = document.getElementById('store-sort-select');
const storeGrid = document.getElementById('store-grid');
const storeLoading = document.getElementById('store-loading');
const storeEmpty = document.getElementById('store-empty');
const storePagination = document.getElementById('store-pagination');
const btnStorePrev = document.getElementById('btn-store-prev');
const btnStoreNext = document.getElementById('btn-store-next');
const storePageInfo = document.getElementById('store-page-info');

let storeQuery = '';
let storeType = 'all';
let storeSort = 'downloads';
let storeOffset = 0;
const STORE_LIMIT = 20;
let storeDebounceTimer = null;
const installingProjects = new Set();

function formatDownloads(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

async function loadStore() {
  if (!storeLoading || !storeGrid) return;
  storeLoading.style.display = 'flex';
  storeEmpty.style.display = 'none';
  storeGrid.innerHTML = '';
  storePagination.style.display = 'none';

  try {
    const res = await window.api.searchModrinth({
      query: storeQuery,
      projectType: storeType,
      sort: storeSort,
      offset: storeOffset,
      limit: STORE_LIMIT
    });

    storeLoading.style.display = 'none';

    if (!res.success || !res.hits || res.hits.length === 0) {
      storeEmpty.style.display = 'flex';
      return;
    }

    renderStoreHits(res.hits);

    // Update Pagination
    const currentPage = Math.floor(storeOffset / STORE_LIMIT) + 1;
    const totalPages = Math.ceil(res.totalHits / STORE_LIMIT) || 1;
    storePageInfo.innerText = `Page ${currentPage} of ${totalPages} (${res.totalHits} items)`;
    btnStorePrev.disabled = storeOffset <= 0;
    btnStoreNext.disabled = storeOffset + STORE_LIMIT >= res.totalHits;
    storePagination.style.display = 'flex';
  } catch (err) {
    storeLoading.style.display = 'none';
    storeEmpty.style.display = 'flex';
    storeEmpty.innerText = 'Failed to load from Modrinth: ' + err.message;
  }
}

function renderStoreHits(hits) {
  storeGrid.innerHTML = '';
  hits.forEach(hit => {
    const card = document.createElement('div');
    card.className = 'store-card';
    const isInstalling = installingProjects.has(hit.project_id);
    const iconUrl = hit.icon_url || 'https://cdn-icons-png.flaticon.com/512/356/356725.png';
    const isMod = hit.project_type === 'mod';
    const typeLabel = isMod ? 'Fabric Mod' : 'Resource Pack';

    card.innerHTML = `
      <div class="store-card-header">
        <img class="store-card-icon" src="${iconUrl}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/356/356725.png'" alt="Icon">
        <div class="store-card-meta">
          <span class="store-card-title" title="${hit.title}">${hit.title}</span>
          <span class="store-card-author">by ${hit.author || 'Creator'}</span>
        </div>
      </div>
      <p class="store-card-desc" title="${hit.description || ''}">${hit.description || 'No description provided.'}</p>
      <div class="store-card-footer">
        <div class="store-card-stats">
          <span>⬇ ${formatDownloads(hit.downloads)}</span>
          <span class="store-tag">${typeLabel}</span>
        </div>
        <div class="store-card-action">
          ${hit.isInstalled
            ? '<button class="btn-store-installed" title="Installed locally">✔ Installed</button>'
            : isInstalling
              ? `<button class="btn-store-loading" id="inst-${hit.project_id}">⏳ Installing...</button>`
              : `<button class="btn-store-install" data-id="${hit.project_id}" data-slug="${hit.slug}" data-type="${hit.project_type}">⬇ Install</button>`
          }
        </div>
      </div>
    `;

    const installBtn = card.querySelector('.btn-store-install');
    if (installBtn) {
      installBtn.addEventListener('click', async (e) => {
        const projectId = e.target.getAttribute('data-id');
        const slug = e.target.getAttribute('data-slug');
        const projectType = e.target.getAttribute('data-type');
        
        installingProjects.add(projectId);
        e.target.className = 'btn-store-loading';
        e.target.id = `inst-${projectId}`;
        e.target.innerText = '⏳ 0%';

        const result = await window.api.installModrinthProject({ projectId, slug, projectType });
        installingProjects.delete(projectId);

        if (result.success) {
          e.target.className = 'btn-store-installed';
          e.target.innerText = '✔ Installed';
          e.target.disabled = true;
          showToast(`Successfully installed ${result.filename} (${result.sizeMb} MB)!`, 'success');
          if (projectType === 'mod') {
            loadModsList();
          }
        } else {
          showToast('Install failed: ' + result.error, 'error');
          e.target.className = 'btn-store-install';
          e.target.innerText = '⬇ Install';
        }
      });
    }

    storeGrid.appendChild(card);
  });
}

// Download progress listener
window.api.onDownloadProgress(({ projectId, progress }) => {
  const btn = document.getElementById(`inst-${projectId}`);
  if (btn) {
    btn.innerText = `⏳ ${progress}%`;
  }
});

if (storeSearchInput) {
  storeSearchInput.addEventListener('input', () => {
    storeQuery = storeSearchInput.value.trim();
    if (btnClearSearch) btnClearSearch.style.display = storeQuery.length > 0 ? 'inline-block' : 'none';
    storeOffset = 0;

    clearTimeout(storeDebounceTimer);
    storeDebounceTimer = setTimeout(() => {
      loadStore();
    }, 350);
  });
}

if (btnClearSearch) {
  btnClearSearch.addEventListener('click', () => {
    if (storeSearchInput) storeSearchInput.value = '';
    storeQuery = '';
    btnClearSearch.style.display = 'none';
    storeOffset = 0;
    loadStore();
  });
}

filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    storeType = chip.getAttribute('data-type');
    storeOffset = 0;
    loadStore();
  });
});

if (storeSortSelect) {
  storeSortSelect.addEventListener('change', () => {
    storeSort = storeSortSelect.value;
    storeOffset = 0;
    loadStore();
  });
}

if (btnStorePrev) {
  btnStorePrev.addEventListener('click', () => {
    if (storeOffset >= STORE_LIMIT) {
      storeOffset -= STORE_LIMIT;
      loadStore();
    }
  });
}

if (btnStoreNext) {
  btnStoreNext.addEventListener('click', () => {
    storeOffset += STORE_LIMIT;
    loadStore();
  });
}

// Dropdown arrow toggle rotation animation
const dropdownToggle = document.getElementById('dropdown-toggle');
const versionMenu = document.getElementById('version-menu');
let activeVersion = "1.21.1";

dropdownToggle.addEventListener('click', () => {
  dropdownToggle.classList.toggle('active');
  versionMenu.classList.toggle('show');
});

document.querySelectorAll('.v-option').forEach(option => {
  option.addEventListener('click', () => {
    activeVersion = option.getAttribute('data-ver');
    document.getElementById('selected-title').innerText = option.getAttribute('data-title');
    document.getElementById('selected-ver').innerText = activeVersion;
    versionMenu.classList.remove('show');
    dropdownToggle.classList.remove('active');
  });
});

// Auto-remove active class on outside click
window.addEventListener('click', (e) => {
  if (!dropdownToggle.contains(e.target) && !versionMenu.contains(e.target)) {
    dropdownToggle.classList.remove('active');
    versionMenu.classList.remove('show');
  }
});

// ==========================================
// Multi-Account Management & UI
// ==========================================
const accountDropdownToggle = document.getElementById('account-dropdown-toggle');
const accountNavContainer = document.querySelector('.account-nav-container');
const accountDropdownMenu = document.getElementById('account-dropdown-menu');
const accountsList = document.getElementById('accounts-list');
const navPlayerName = document.getElementById('nav-player-name');
const navAccountBadge = document.getElementById('nav-account-badge');
const navAvatar = document.getElementById('nav-avatar');
const footerUsername = document.getElementById('footer-username');
const btnOpenAddModal = document.getElementById('btn-open-add-modal');
const accountModal = document.getElementById('account-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnModalLoginMs = document.getElementById('btn-modal-login-ms');
const offlineNameInput = document.getElementById('offline-name-input');
const offlineSkinPreview = document.getElementById('offline-skin-preview');
const offlineValMsg = document.getElementById('offline-val-msg');
const btnModalCreateOffline = document.getElementById('btn-modal-create-offline');

const skinPreview = document.getElementById('skin-preview');
const skinName = document.getElementById('skin-name');
const btnPlay = document.getElementById('btn-play');
const statusOverlay = document.getElementById('status-overlay');
const statusText = document.getElementById('status-text');
const progressFill = document.getElementById('progress-fill');

let currentActiveAccount = null;

async function refreshAccountsUI() {
  const data = await window.api.getAccounts();
  const accounts = data.accounts || [];
  const activeId = data.activeAccountId;
  currentActiveAccount = accounts.find(a => a.id === activeId) || (accounts.length > 0 ? accounts[0] : null);

  // Update Topbar and Footer UI
  if (currentActiveAccount) {
    navPlayerName.innerText = currentActiveAccount.name;
    footerUsername.innerText = currentActiveAccount.name;
    navAvatar.src = currentActiveAccount.avatar || `https://minotar.net/avatar/${currentActiveAccount.name}/20`;
    
    if (skinPreview) skinPreview.src = `https://minotar.net/bust/${currentActiveAccount.name}/100`;
    if (skinName) skinName.innerText = currentActiveAccount.name;

    navAccountBadge.className = `badge-account badge-${currentActiveAccount.type}`;
    navAccountBadge.innerText = currentActiveAccount.type === 'microsoft' ? 'MICROSOFT' : 'OFFLINE';
    btnPlay.disabled = false;
  } else {
    navPlayerName.innerText = "DaraDev";
    footerUsername.innerText = "DaraDev";
    navAvatar.src = "https://minotar.net/avatar/Steve/20";
    if (skinPreview) skinPreview.src = "https://minotar.net/bust/Steve/100";
    if (skinName) skinName.innerText = "DaraDev";

    navAccountBadge.className = "badge-account badge-offline";
    navAccountBadge.innerText = "OFFLINE";
    btnPlay.disabled = false;
  }

  // Render Dropdown List
  accountsList.innerHTML = '';
  if (accounts.length === 0) {
    accountsList.innerHTML = '<div class="no-accounts-msg">No saved accounts yet.<br>Click "+ Add Account" to begin.</div>';
  } else {
    accounts.forEach(acc => {
      const isActive = currentActiveAccount && currentActiveAccount.id === acc.id;
      const item = document.createElement('div');
      item.className = `account-item ${isActive ? 'active' : ''}`;
      item.innerHTML = `
        <img src="${acc.avatar || `https://minotar.net/avatar/${acc.name}/28`}" alt="Head">
        <div class="account-item-meta">
          <span class="account-item-name">${acc.name}</span>
          <span class="account-item-badge ${acc.type}">${acc.type === 'microsoft' ? '● Microsoft' : '● Offline'}</span>
        </div>
        ${isActive ? '<span style="color: #2ebd59; font-size: 13px;">✔</span>' : ''}
        <button class="btn-delete-acc" data-id="${acc.id}" title="Remove profile">🗑</button>
      `;

      item.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-delete-acc')) return;
        await window.api.setActiveAccount(acc.id);
        accountNavContainer.classList.remove('open');
        refreshAccountsUI();
      });

      const delBtn = item.querySelector('.btn-delete-acc');
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Remove profile "${acc.name}" from launcher?`)) {
          await window.api.deleteAccount(acc.id);
          refreshAccountsUI();
        }
      });

      accountsList.appendChild(item);
    });
  }
}

// Initial Accounts Load
refreshAccountsUI();

// Account Dropdown Toggle
accountDropdownToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  accountNavContainer.classList.toggle('open');
});

window.addEventListener('click', (e) => {
  if (accountNavContainer && !accountNavContainer.contains(e.target)) {
    accountNavContainer.classList.remove('open');
  }
});

// System Menu Dropdown Actions
const btnMenuQuickSettings = document.getElementById('btn-menu-quick-settings');
const btnMenuOpenFolder = document.getElementById('btn-menu-open-folder');

if (btnMenuQuickSettings) {
  btnMenuQuickSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    accountNavContainer.classList.remove('open');
    const installTab = document.querySelector('.nav-tab[data-tab="installations"]');
    if (installTab) {
      installTab.click();
      showToast('Switched to System & Hardware Settings', 'info');
    }
  });
}

if (btnMenuOpenFolder) {
  btnMenuOpenFolder.addEventListener('click', async (e) => {
    e.stopPropagation();
    accountNavContainer.classList.remove('open');
    if (window.api && window.api.openModsFolder) {
      await window.api.openModsFolder();
      showToast('Opening Game Folder...', 'info');
    }
  });
}

// Modal Management
function openAccountModal() {
  accountModal.classList.add('show');
  accountNavContainer.classList.remove('open');
}

function closeAccountModal() {
  accountModal.classList.remove('show');
}

btnOpenAddModal.addEventListener('click', openAccountModal);
btnCloseModal.addEventListener('click', closeAccountModal);

accountModal.addEventListener('click', (e) => {
  if (e.target === accountModal) closeAccountModal();
});

// Modal Tabs Switcher
document.querySelectorAll('.modal-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.modal-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panelId = `panel-${btn.getAttribute('data-tab')}`;
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) targetPanel.classList.add('active');
  });
});

// Microsoft Login in Modal
btnModalLoginMs.addEventListener('click', async () => {
  closeAccountModal();
  statusOverlay.classList.add('show');
  statusText.innerText = "Connecting to Microsoft Live Services...";
  
  const res = await window.api.loginMicrosoft();
  if (res.success) {
    statusText.innerText = "NMC Authentication Verified!";
    await refreshAccountsUI();
    setTimeout(() => statusOverlay.classList.remove('show'), 1500);
  } else {
    alert("Login failed: " + res.error);
    statusOverlay.classList.remove('show');
  }
});

// Offline Account Form Validation & Live Avatar
offlineNameInput.addEventListener('input', () => {
  const val = offlineNameInput.value.trim();
  const valid = /^[a-zA-Z0-9_]{3,16}$/.test(val);

  if (val.length === 0) {
    offlineValMsg.className = 'validation-message';
    offlineValMsg.innerText = '3–16 letters, numbers, or underscores';
    offlineSkinPreview.src = 'https://minotar.net/avatar/Steve/56';
    btnModalCreateOffline.disabled = true;
  } else if (!valid) {
    offlineValMsg.className = 'validation-message error';
    offlineValMsg.innerText = 'Invalid username (3-16 alphanumeric or _ only)';
    btnModalCreateOffline.disabled = true;
  } else {
    offlineValMsg.className = 'validation-message valid';
    offlineValMsg.innerText = '✓ Valid Minecraft username';
    offlineSkinPreview.src = `https://minotar.net/avatar/${val}/56`;
    btnModalCreateOffline.disabled = false;
  }
});

offlineNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !btnModalCreateOffline.disabled) {
    btnModalCreateOffline.click();
  }
});

btnModalCreateOffline.addEventListener('click', async () => {
  const username = offlineNameInput.value.trim();
  if (!username) return;

  const res = await window.api.addOfflineAccount(username);
  if (res.success) {
    offlineNameInput.value = '';
    offlineValMsg.className = 'validation-message';
    offlineValMsg.innerText = '3–16 letters, numbers, or underscores';
    closeAccountModal();
    await refreshAccountsUI();
  } else {
    alert(res.error);
  }
});

// Play Button
btnPlay.addEventListener('click', () => {
  if (!currentActiveAccount) {
    openAccountModal();
    return;
  }

  btnPlay.disabled = true;
  btnPlay.innerText = "LAUNCHING...";
  statusOverlay.classList.add('show');
  statusText.innerText = `NMC Booting Minecraft ${activeVersion} (${currentActiveAccount.name})...`;
  window.api.launch({ version: activeVersion });
});

const btnTrailer = document.getElementById('btn-trailer');
if (btnTrailer) {
  btnTrailer.addEventListener('click', () => {
    window.api.openExternal('https://www.youtube.com/watch?v=0k5L9oA-7_0');
  });
}

const btnStore = document.getElementById('btn-store');
if (btnStore) {
  btnStore.addEventListener('click', () => {
    window.api.openExternal('https://nmchosting.com');
  });
}

const btnGift = document.getElementById('btn-gift');
if (btnGift) {
  btnGift.addEventListener('click', () => {
    window.api.openExternal('https://nmchosting.com');
  });
}

window.api.onStatus((data) => {
  statusText.innerText = data.message;
  progressFill.style.width = `${data.progress}%`;
});

// ==========================================
// In-Session Game Control System Dashboard
// ==========================================
let gameSessionTimerInterval = null;
let gameSessionStartTime = null;

const navGameSessionPill = document.getElementById('nav-game-session-pill');
const sessionTimerText = document.getElementById('session-timer-text');
const gameSessionModal = document.getElementById('game-session-modal');
const btnCloseSessionModal = document.getElementById('btn-close-session-modal');
const modalSessionTimer = document.getElementById('modal-session-timer');
const modalSessionAccount = document.getElementById('modal-session-account');
const modalSessionRam = document.getElementById('modal-session-ram');

const btnSessionOpenHud = document.getElementById('btn-session-open-hud');
const btnSessionScreenshots = document.getElementById('btn-session-screenshots');
const btnSessionGameFolder = document.getElementById('btn-session-game-folder');
const btnSessionFlushRam = document.getElementById('btn-session-flush-ram');
const btnSessionForceQuit = document.getElementById('btn-session-force-quit');

function formatSessionTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(remM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

if (window.api && window.api.onGameStarted) {
  window.api.onGameStarted((data) => {
    gameSessionStartTime = data.startTime || Date.now();
    btnPlay.disabled = true;
    btnPlay.innerText = "RUNNING";
    statusOverlay.classList.remove('show');

    if (modalSessionAccount) modalSessionAccount.innerText = data.account || 'Player';
    if (modalSessionRam) modalSessionRam.innerText = `${data.ram || '4G'} Heap (G1GC)`;

    if (navGameSessionPill) navGameSessionPill.style.display = 'inline-flex';

    if (gameSessionTimerInterval) clearInterval(gameSessionTimerInterval);
    gameSessionTimerInterval = setInterval(() => {
      if (!gameSessionStartTime) return;
      const elapsed = Math.floor((Date.now() - gameSessionStartTime) / 1000);
      const str = formatSessionTime(elapsed);
      if (sessionTimerText) sessionTimerText.innerText = str;
      if (modalSessionTimer) modalSessionTimer.innerText = str;
    }, 1000);

    showToast(`Minecraft 1.21.1 is Running as ${data.account}! Click 'In-Game' badge for System Menu`, 'success');
  });
}

window.api.onClosed(() => {
  btnPlay.disabled = false;
  btnPlay.innerText = "PLAY";
  statusOverlay.classList.remove('show');
  progressFill.style.width = "0%";

  if (gameSessionTimerInterval) clearInterval(gameSessionTimerInterval);
  gameSessionTimerInterval = null;
  gameSessionStartTime = null;

  if (navGameSessionPill) navGameSessionPill.style.display = 'none';
  if (gameSessionModal) gameSessionModal.style.display = 'none';
  showToast('Minecraft game session closed.', 'info');
});

if (navGameSessionPill && gameSessionModal) {
  navGameSessionPill.addEventListener('click', () => {
    gameSessionModal.style.display = 'flex';
  });
}

if (btnCloseSessionModal && gameSessionModal) {
  btnCloseSessionModal.addEventListener('click', () => {
    gameSessionModal.style.display = 'none';
  });
}

if (gameSessionModal) {
  gameSessionModal.addEventListener('click', (e) => {
    if (e.target === gameSessionModal) {
      gameSessionModal.style.display = 'none';
    }
  });
}

if (btnSessionOpenHud) {
  btnSessionOpenHud.addEventListener('click', () => {
    if (gameSessionModal) gameSessionModal.style.display = 'none';
    const pvpTab = document.querySelector('.nav-tab[data-tab="pvpmods"]');
    if (pvpTab) pvpTab.click();
    const btnCanvas = document.getElementById('btn-mode-canvas');
    if (btnCanvas) btnCanvas.click();
  });
}

if (btnSessionScreenshots) {
  btnSessionScreenshots.addEventListener('click', async () => {
    await window.api.openScreenshots();
  });
}

if (btnSessionGameFolder) {
  btnSessionGameFolder.addEventListener('click', async () => {
    await window.api.openGameFolder();
  });
}

if (btnSessionFlushRam) {
  btnSessionFlushRam.addEventListener('click', async () => {
    const res = await window.api.flushMemory();
    if (res.success) {
      showToast(`RAM Memory Cleaned! Free System RAM: ${res.freeRamGb} GB`, 'success');
    }
  });
}

if (btnSessionForceQuit) {
  btnSessionForceQuit.addEventListener('click', async () => {
    if (confirm('Are you sure you want to Force Stop Minecraft?')) {
      await window.api.killGame();
      showToast('Sent termination signal to Minecraft.', 'info');
      if (gameSessionModal) gameSessionModal.style.display = 'none';
    }
  });
}

// ==========================================
// PvP HUD Mods Configuration UI
// ==========================================
const pvpToggleReach = document.getElementById('pvp-toggle-reach');
const pvpToggleTargetHealth = document.getElementById('pvp-toggle-target-health');
const pvpTogglePingFps = document.getElementById('pvp-toggle-ping-fps');
const pvpToggleKeystrokes = document.getElementById('pvp-toggle-keystrokes');
const pvpToggleArmor = document.getElementById('pvp-toggle-armor');
const pvpToggleCoordinates = document.getElementById('pvp-toggle-coordinates');
const pvpToggleCrosshairCps = document.getElementById('pvp-toggle-crosshair-cps');
const pvpCustomColor = document.getElementById('pvp-custom-color');
const colorPills = document.querySelectorAll('.color-pill');
const btnSavePvp = document.getElementById('btn-save-pvp');
const btnResetPvp = document.getElementById('btn-reset-pvp');

const pvpTagText = document.getElementById('pvp-tag-text');
const pvpTagColor = document.getElementById('pvp-tag-color');

let activeAccentColor = '#00f0ff';

async function loadPvpConfigUI() {
  if (!pvpToggleReach) return;
  try {
    const config = await window.api.getPvpConfig();
    pvpToggleReach.checked = !!config.reachDisplay;
    pvpToggleTargetHealth.checked = !!config.targetHealth;
    pvpTogglePingFps.checked = !!config.pingFps;
    pvpToggleKeystrokes.checked = !!config.keystrokesBps;
    pvpToggleArmor.checked = config.armorDurabilityNumbers !== undefined ? !!config.armorDurabilityNumbers : !!config.armorDurability;
    pvpToggleCoordinates.checked = !!config.coordinates;
    pvpToggleCrosshairCps.checked = !!config.crosshairCps;
    
    if (pvpTagText && config.customTag) pvpTagText.value = config.customTag;
    if (pvpTagColor && config.tagColor) pvpTagColor.value = config.tagColor;

    activeAccentColor = config.accentColor || '#00f0ff';
    if (pvpCustomColor) pvpCustomColor.value = activeAccentColor;

    colorPills.forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-color').toLowerCase() === activeAccentColor.toLowerCase());
    });
  } catch (err) {
    console.error('Failed to load PvP config:', err);
  }
}

// Initial load
loadPvpConfigUI();

// Color selection
colorPills.forEach(pill => {
  pill.addEventListener('click', () => {
    colorPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeAccentColor = pill.getAttribute('data-color');
    if (pvpCustomColor) pvpCustomColor.value = activeAccentColor;
    autoSavePvpConfig();
  });
});

if (pvpCustomColor) {
  pvpCustomColor.addEventListener('input', () => {
    activeAccentColor = pvpCustomColor.value;
    colorPills.forEach(p => p.classList.remove('active'));
    autoSavePvpConfig();
  });
}

// Auto-save on toggle change
[pvpToggleReach, pvpToggleTargetHealth, pvpTogglePingFps, pvpToggleKeystrokes, pvpToggleArmor, pvpToggleCoordinates, pvpToggleCrosshairCps].forEach(toggle => {
  if (toggle) {
    toggle.addEventListener('change', autoSavePvpConfig);
  }
});

if (pvpTagText) pvpTagText.addEventListener('input', autoSavePvpConfig);
if (pvpTagColor) pvpTagColor.addEventListener('input', autoSavePvpConfig);

async function autoSavePvpConfig() {
  const isArmor = pvpToggleArmor ? pvpToggleArmor.checked : true;
  const newConfig = {
    reachDisplay: pvpToggleReach ? pvpToggleReach.checked : true,
    targetHealth: pvpToggleTargetHealth ? pvpToggleTargetHealth.checked : true,
    pingFps: pvpTogglePingFps ? pvpTogglePingFps.checked : true,
    keystrokesBps: pvpToggleKeystrokes ? pvpToggleKeystrokes.checked : true,
    armorDurability: isArmor,
    armorDurabilityNumbers: isArmor,
    coordinates: pvpToggleCoordinates ? pvpToggleCoordinates.checked : true,
    crosshairCps: pvpToggleCrosshairCps ? pvpToggleCrosshairCps.checked : true,
    customTag: pvpTagText ? pvpTagText.value.trim() : '[NMC-PRO]',
    tagColor: pvpTagColor ? pvpTagColor.value : '#00e5ff',
    accentColor: activeAccentColor
  };

  const res = await window.api.savePvpConfig(newConfig);
  return res;
}

if (btnSavePvp) {
  btnSavePvp.addEventListener('click', async () => {
    const res = await autoSavePvpConfig();
    if (res.success) {
      showToast('PvP HUD Settings Saved & Synced with Client!', 'success');
    } else {
      showToast('Failed to save settings: ' + res.error, 'error');
    }
  });
}

if (btnResetPvp) {
  btnResetPvp.addEventListener('click', async () => {
    const defaults = {
      reachDisplay: true,
      targetHealth: true,
      pingFps: true,
      keystrokesBps: true,
      armorDurability: true,
      armorDurabilityNumbers: true,
      coordinates: true,
      crosshairCps: true,
      customTag: '[NMC-PRO]',
      tagColor: '#00e5ff',
      accentColor: '#00f0ff'
    };
    await window.api.savePvpConfig(defaults);
    await loadPvpConfigUI();
    showToast('PvP HUD Settings Reset to Defaults!', 'info');
  });
}

// ==========================================================================
// AUTO-UPDATER UI LOGIC
// ==========================================================================
const updateBanner = document.getElementById('update-banner');
const updateText = document.getElementById('update-text');
const updateBarContainer = document.getElementById('update-bar-container');
const updateBarFill = document.getElementById('update-bar-fill');
const btnRestartUpdate = document.getElementById('btn-restart-update');
const btnCloseUpdateBanner = document.getElementById('btn-close-update-banner');

if (window.api && window.api.onUpdateMessage) {
  window.api.onUpdateMessage((data) => {
    if (!updateBanner) return;
    updateBanner.style.display = 'flex';
    if (updateText) updateText.innerText = data.text;

    if (data.status === 'available') {
      if (updateBarContainer) updateBarContainer.style.display = 'block';
      if (btnRestartUpdate) btnRestartUpdate.style.display = 'none';
    } else if (data.status === 'downloaded') {
      if (updateBarContainer) updateBarContainer.style.display = 'none';
      if (btnRestartUpdate) btnRestartUpdate.style.display = 'inline-block';
      showToast('Version ថ្មីត្រូវបានទាញយករួចរាល់! ចុច Restart ដើម្បីដំឡើង', 'success');
    }
  });
}

if (window.api && window.api.onUpdateProgress) {
  window.api.onUpdateProgress((percent) => {
    if (updateBarFill) updateBarFill.style.width = `${percent}%`;
    if (updateText) updateText.innerText = `កំពុងទាញយក Update៖ ${percent}%`;
  });
}

if (btnRestartUpdate) {
  btnRestartUpdate.addEventListener('click', () => {
    if (window.api && window.api.restartToUpdate) {
      window.api.restartToUpdate();
    }
  });
}

if (btnCloseUpdateBanner) {
  btnCloseUpdateBanner.addEventListener('click', () => {
    if (updateBanner) updateBanner.style.display = 'none';
  });
}

// ==========================================================================
// OFFICIAL COMMUNITY INTEGRATION (Discord & Telegram)
// ==========================================================================
const OFFICIAL_DISCORD_URL = 'https://discord.gg/ZnHuvUqpn';
const OFFICIAL_TELEGRAM_URL = 'https://t.me/+Gzx1VlNQa3Q0YTJl';

function openDiscordInvite() {
  if (window.api && window.api.openExternal) {
    window.api.openExternal(OFFICIAL_DISCORD_URL);
    showToast('Opening KHMER LAUNCHER Discord Community: discord.gg/ZnHuvUqpn', 'info');
  } else {
    window.open(OFFICIAL_DISCORD_URL, '_blank');
  }
}

function openTelegramInvite() {
  if (window.api && window.api.openExternal) {
    window.api.openExternal(OFFICIAL_TELEGRAM_URL);
    showToast('Opening KHMER LAUNCHER Telegram Group: t.me/+Gzx1VlNQa3Q0YTJl', 'info');
  } else {
    window.open(OFFICIAL_TELEGRAM_URL, '_blank');
  }
}

document.querySelectorAll('.btn-discord-action, [data-discord-link]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openDiscordInvite();
  });
});

document.querySelectorAll('.btn-telegram-action, [data-telegram-link]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openTelegramInvite();
  });
});

// ==========================================================================
// DYNAMIC WALLPAPER / BACKGROUND SYSTEM
// ==========================================================================
const btnWallpaperToggle = document.getElementById('btn-wallpaper-toggle');
const wallpaperModal = document.getElementById('wallpaper-modal');
const btnCloseWallpaper = document.getElementById('btn-close-wallpaper');
const heroArtwork = document.querySelector('.hero-artwork');
const wallpaperCards = document.querySelectorAll('.wallpaper-card');
const cardCustomWallpaper = document.getElementById('card-custom-wallpaper');

function applyWallpaper(type, url) {
  if (!heroArtwork) return;
  const safeUrl = url.replace(/\\/g, '/');
  heroArtwork.style.background = `linear-gradient(180deg, rgba(8, 14, 26, 0.45) 0%, rgba(8, 14, 26, 0.65) 60%, rgba(8, 14, 26, 0.88) 100%), url('${safeUrl}') center/cover no-repeat`;

  const heroVideo = document.getElementById('hero-bg-video');
  const heroScrim = document.querySelector('.hero-bg-scrim');
  if (heroVideo) {
    if (type === 'angkor') {
      heroVideo.style.display = 'block';
      if (heroScrim) heroScrim.style.display = 'block';
      heroVideo.play().catch(() => {});
    } else {
      heroVideo.style.display = 'none';
      if (heroScrim) heroScrim.style.display = 'none';
      heroVideo.pause();
    }
  }
  
  localStorage.setItem('nmc_wallpaper_type', type);
  localStorage.setItem('nmc_wallpaper_url', safeUrl);

  wallpaperCards.forEach(card => {
    if (card.getAttribute('data-bg') === type) {
      card.classList.add('active');
      let badge = card.querySelector('.wallpaper-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'wallpaper-badge';
        const prev = card.querySelector('.wallpaper-preview');
        if (prev) prev.appendChild(badge);
      }
      badge.innerText = 'Active';
    } else {
      card.classList.remove('active');
      const badge = card.querySelector('.wallpaper-badge');
      if (badge && card.getAttribute('data-bg') !== 'angkor') {
        badge.remove();
      } else if (badge) {
        badge.innerText = 'Default';
      }
    }
  });
}

// Load saved wallpaper or default to Angkor Wat
const savedType = localStorage.getItem('nmc_wallpaper_type') || 'angkor';
const savedUrl = localStorage.getItem('nmc_wallpaper_url') || 'assets/hero.png';
applyWallpaper(savedType, savedUrl);

if (btnWallpaperToggle && wallpaperModal) {
  btnWallpaperToggle.addEventListener('click', () => {
    wallpaperModal.style.display = 'flex';
  });
}

if (btnCloseWallpaper && wallpaperModal) {
  btnCloseWallpaper.addEventListener('click', () => {
    wallpaperModal.style.display = 'none';
  });
}

if (wallpaperModal) {
  wallpaperModal.addEventListener('click', (e) => {
    if (e.target === wallpaperModal) wallpaperModal.style.display = 'none';
  });
}

wallpaperCards.forEach(card => {
  card.addEventListener('click', async () => {
    const type = card.getAttribute('data-bg');
    if (type === 'custom') {
      if (window.api && window.api.selectCustomBackground) {
        const res = await window.api.selectCustomBackground();
        if (res.success && res.filePath) {
          applyWallpaper('custom', res.filePath);
          showToast('Custom Wallpaper Applied!', 'success');
          if (wallpaperModal) wallpaperModal.style.display = 'none';
        }
      }
    } else if (type === 'angkor') {
      applyWallpaper('angkor', 'assets/hero.png');
      showToast('Set to 🏛 Angkor Khmer Temple', 'success');
      if (wallpaperModal) wallpaperModal.style.display = 'none';
    } else if (type === 'trials') {
      applyWallpaper('trials', 'https://launchercontent.mojang.com/v2/backgrounds/1.21.1.jpg');
      showToast('Set to ⚔ Tricky Trials 1.21.1', 'info');
      if (wallpaperModal) wallpaperModal.style.display = 'none';
    } else if (type === 'cyber') {
      applyWallpaper('cyber', 'assets/nmc_logo.png');
      showToast('Set to 🌌 KHMER Neon Dark', 'info');
      if (wallpaperModal) wallpaperModal.style.display = 'none';
    }
  });
});

// ==========================================================================
// INSTALLATIONS & HARDWARE PERFORMANCE SETTINGS
// ==========================================================================
const ramPills = document.querySelectorAll('.ram-pill');
const settingRamMax = document.getElementById('setting-ram-max');
const settingRamMin = document.getElementById('setting-ram-min');
const settingJavaPath = document.getElementById('setting-java-path');
const btnBrowseJava = document.getElementById('btn-browse-java');
const btnDetectJava = document.getElementById('btn-detect-java');
const settingGameDir = document.getElementById('setting-game-dir');
const btnBrowseGameDir = document.getElementById('btn-browse-game-dir');
const btnOpenGameDir = document.getElementById('btn-open-game-dir');
const settingJvmArgs = document.getElementById('setting-jvm-args');
const btnSaveSettings = document.getElementById('btn-save-settings');

const presetG1gc = document.getElementById('preset-g1gc');
const presetAikar = document.getElementById('preset-aikar');
const presetVanilla = document.getElementById('preset-vanilla');

async function loadSettingsUI() {
  if (!settingRamMax) return;
  try {
    const s = await window.api.getSettings();
    const curRam = s.ramMax || '4G';
    settingRamMax.value = curRam;
    settingRamMin.value = s.ramMin || '2G';

    ramPills.forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-ram') === curRam);
    });

    if (settingJavaPath) {
      settingJavaPath.value = s.javaPath || '';
      settingJavaPath.placeholder = s.detectedJava ? `Auto: ${s.detectedJava}` : 'Auto-Detect (Using JRE 21 Hotspot)...';
    }

    if (settingGameDir) {
      settingGameDir.value = s.gameDir || '';
    }

    if (settingJvmArgs) {
      settingJvmArgs.value = s.jvmArgs || '';
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

// Initial load settings in background
loadSettingsUI();

// RAM Pill selection
ramPills.forEach(pill => {
  pill.addEventListener('click', () => {
    ramPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    const ram = pill.getAttribute('data-ram');
    if (settingRamMax) settingRamMax.value = ram;
    if (settingRamMin) settingRamMin.value = ram === '2G' ? '1G' : '2G';
  });
});

// Java Browse & Auto-detect
if (btnBrowseJava) {
  btnBrowseJava.addEventListener('click', async () => {
    const res = await window.api.selectJavaPath();
    if (res.success && res.filePath) {
      settingJavaPath.value = res.filePath;
      showToast('Custom Java 21 path selected!', 'success');
    }
  });
}

if (btnDetectJava) {
  btnDetectJava.addEventListener('click', async () => {
    settingJavaPath.value = '';
    const s = await window.api.getSettings();
    showToast(`Auto-detected: ${s.detectedJava}`, 'info');
  });
}

// Game Dir Browse & Open
if (btnBrowseGameDir) {
  btnBrowseGameDir.addEventListener('click', async () => {
    const res = await window.api.selectGameDir();
    if (res.success && res.dirPath) {
      settingGameDir.value = res.dirPath;
      showToast('Custom Minecraft directory selected!', 'success');
    }
  });
}

if (btnOpenGameDir) {
  btnOpenGameDir.addEventListener('click', () => {
    window.api.openModsFolder();
  });
}

const btnProfileOpenMc = document.getElementById('btn-profile-open-mc');
if (btnProfileOpenMc) {
  btnProfileOpenMc.addEventListener('click', () => window.api.openModsFolder());
}

const btnProfileOpenVanilla = document.getElementById('btn-profile-open-vanilla');
if (btnProfileOpenVanilla) {
  btnProfileOpenVanilla.addEventListener('click', () => window.api.openModsFolder());
}

// JVM Arguments Presets
if (presetG1gc) {
  presetG1gc.addEventListener('click', () => {
    settingJvmArgs.value = '-XX:+UseG1GC -Dsun.rmi.dgc.server.gcInterval=2147483646 -XX:+UnlockExperimentalVMOptions -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M';
    showToast('Applied High-Performance G1GC Preset', 'info');
  });
}

if (presetAikar) {
  presetAikar.addEventListener('click', () => {
    settingJvmArgs.value = '-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4';
    showToast('Applied Aikar Low-Latency Preset', 'info');
  });
}

if (presetVanilla) {
  presetVanilla.addEventListener('click', () => {
    settingJvmArgs.value = '-Xss1M';
    showToast('Applied Standard Default Preset', 'info');
  });
}

// Save Settings Button
if (btnSaveSettings) {
  btnSaveSettings.addEventListener('click', async () => {
    const ramMax = settingRamMax ? settingRamMax.value : '4G';
    const ramMin = settingRamMin ? settingRamMin.value : '2G';
    const javaPath = settingJavaPath ? settingJavaPath.value.trim() : '';
    const gameDir = settingGameDir ? settingGameDir.value.trim() : '';
    const jvmArgs = settingJvmArgs ? settingJvmArgs.value.trim() : '';

    const res = await window.api.saveSettings({ ramMax, ramMin, javaPath, gameDir, jvmArgs });
    if (res.success) {
      showToast('Settings & Hardware Configuration Saved!', 'success');
    } else {
      showToast('Failed to save settings', 'error');
    }
  });
}

// Profile Card "Play Now" Buttons
document.querySelectorAll('.btn-profile-play').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const btnEl = e.target.closest('.btn-profile-play') || btn;
    const ver = btnEl.getAttribute('data-version') || 'Fabric 1.21.1';
    const playTab = document.querySelector('.nav-tab[data-tab="play"]');
    if (playTab) playTab.click();

    activeVersion = ver;
    const selectedTitle = document.getElementById('selected-title');
    const selectedVer = document.getElementById('selected-ver');
    if (selectedTitle) selectedTitle.innerText = ver;
    if (selectedVer) selectedVer.innerText = ver.includes('Fabric') ? 'Custom Mods Active' : '1.21.1 (Vanilla)';

    if (btnPlay) btnPlay.click();
  });
});

// ==========================================================================
// SKINS STUDIO SYSTEM LOGIC
// ==========================================================================
const skinBodyRender = document.getElementById('skin-body-render');
const skinStudioName = document.getElementById('skin-studio-name');
const skinStudioBadge = document.getElementById('skin-studio-badge');
const skinStudioUuid = document.getElementById('skin-studio-uuid');
const btnRefreshSkin = document.getElementById('btn-refresh-skin');
const skinCloneInput = document.getElementById('skin-clone-input');
const btnApplyCloneSkin = document.getElementById('btn-apply-clone-skin');
const btnBrowseSkinFile = document.getElementById('btn-browse-skin-file');
const skinPresetCards = document.querySelectorAll('.skin-preset-card');

function updateSkinPreview(username = 'Steve', customUrl = null) {
  if (!skinBodyRender) return;
  if (customUrl && customUrl.startsWith('file:///')) {
    skinBodyRender.src = customUrl;
  } else {
    skinBodyRender.src = `https://minotar.net/armor/body/${username}/220.png`;
  }
}

async function loadSkinStudioUI() {
  if (!skinStudioName) return;
  const accountsData = await window.api.getAllAccounts();
  const activeAcc = (accountsData.accounts || []).find(a => a.id === accountsData.activeId) || (accountsData.accounts && accountsData.accounts[0]);

  if (activeAcc) {
    const uname = activeAcc.username || activeAcc.name;
    skinStudioName.innerText = uname;
    skinStudioBadge.className = `badge-account badge-${activeAcc.type}`;
    skinStudioBadge.innerText = activeAcc.type === 'microsoft' ? 'Microsoft' : 'Offline';
    skinStudioUuid.innerText = `UUID: ${activeAcc.uuid || 'N/A'}`;
    updateSkinPreview(uname, activeAcc.skin);
  } else {
    skinStudioName.innerText = 'No Account Selected';
    skinStudioBadge.className = 'badge-account badge-none';
    skinStudioBadge.innerText = 'None';
    skinStudioUuid.innerText = 'Create or select an account first';
    updateSkinPreview('Steve');
  }
}

// Initial skin load in background
loadSkinStudioUI();

if (btnRefreshSkin) {
  btnRefreshSkin.addEventListener('click', () => {
    loadSkinStudioUI();
    showToast('Skin view refreshed!', 'info');
  });
}

// Clone skin from username
if (btnApplyCloneSkin && skinCloneInput) {
  btnApplyCloneSkin.addEventListener('click', async () => {
    const uname = skinCloneInput.value.trim();
    if (!uname) {
      showToast('Please enter a valid player username', 'error');
      return;
    }
    const res = await window.api.applySkinToAccount({ username: uname });
    if (res.success) {
      updateSkinPreview(uname);
      showToast(`Cloned & applied ${uname}'s skin!`, 'success');
      skinCloneInput.value = '';
      await refreshAccountsUI();
      await loadSkinStudioUI();
    } else {
      showToast(res.error || 'Failed to apply skin', 'error');
    }
  });
}

// Upload custom PNG skin
if (btnBrowseSkinFile) {
  btnBrowseSkinFile.addEventListener('click', async () => {
    const res = await window.api.selectCustomSkin();
    if (res.success && res.skinUrl) {
      updateSkinPreview('', res.skinUrl);
      showToast('Custom skin applied successfully!', 'success');
      await refreshAccountsUI();
      await loadSkinStudioUI();
    }
  });
}

// Curated Skin Presets Grid
skinPresetCards.forEach(card => {
  card.addEventListener('click', async () => {
    const presetUser = card.getAttribute('data-user');
    if (!presetUser) return;
    const res = await window.api.applySkinToAccount({ username: presetUser });
    if (res.success) {
      updateSkinPreview(presetUser);
      showToast(`Applied preset: ${card.querySelector('span').innerText}!`, 'success');
      await refreshAccountsUI();
      await loadSkinStudioUI();
    }
  });
});

// ==========================================
// Custom Cape Cosmetics Studio Manager
// ==========================================
function initCapeCosmeticsManager() {
  const btnSubtabSkin = document.getElementById('btn-subtab-skin');
  const btnSubtabCape = document.getElementById('btn-subtab-cape');
  const skinsLayout = document.getElementById('skins-studio-layout');
  const capeLayout = document.getElementById('cape-manager-view');

  if (btnSubtabSkin && btnSubtabCape) {
    btnSubtabSkin.addEventListener('click', () => {
      btnSubtabSkin.classList.add('active');
      btnSubtabCape.classList.remove('active');
      if (skinsLayout) skinsLayout.style.display = 'grid';
      if (capeLayout) capeLayout.style.display = 'none';
    });

    btnSubtabCape.addEventListener('click', () => {
      btnSubtabCape.classList.add('active');
      btnSubtabSkin.classList.remove('active');
      if (skinsLayout) skinsLayout.style.display = 'none';
      if (capeLayout) capeLayout.style.display = 'block';
    });
  }

  const presetBtns = document.querySelectorAll('.cape-preset-btn');
  const capeCloth = document.getElementById('cape-cloth');
  const uploadFilename = document.getElementById('cape-upload-filename');
  const btnBrowseCape = document.getElementById('btn-browse-cape-file');
  const btnApplyCape = document.getElementById('btn-apply-cape');
  const btnApplyText = document.getElementById('btn-apply-cape-text');
  const applySpinner = document.getElementById('cape-apply-spinner');

  let currentPreset = 'angkor-gold';
  let uploadedCapeData = null;

  const updateClothStyle = (preset, customUrl = null) => {
    if (!capeCloth) return;
    capeCloth.className = 'cape-cloth';
    capeCloth.style.backgroundImage = '';

    if (customUrl) {
      capeCloth.style.backgroundImage = `url("${customUrl}")`;
      capeCloth.style.backgroundSize = 'cover';
      capeCloth.style.backgroundPosition = 'center';
      return;
    }

    if (preset === 'angkor-gold') {
      capeCloth.classList.add('cape-preset-gold');
    } else if (preset === 'pvp-emerald') {
      capeCloth.classList.add('cape-preset-emerald');
    } else if (preset === 'royal-cambodia') {
      capeCloth.classList.add('cape-preset-cambodia');
    }
  };

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => {
        b.classList.remove('active');
        const chk = b.querySelector('.cape-check-icon');
        if (chk) chk.style.display = 'none';
      });

      btn.classList.add('active');
      const check = btn.querySelector('.cape-check-icon');
      if (check) check.style.display = 'block';

      currentPreset = btn.getAttribute('data-preset');
      uploadedCapeData = null;
      if (uploadFilename) uploadFilename.innerText = 'Upload Custom PNG Cape';
      updateClothStyle(currentPreset);
    });
  });

  if (btnBrowseCape) {
    btnBrowseCape.addEventListener('click', async (e) => {
      e.stopPropagation();
      const res = await window.api.selectCustomCape();
      if (res && res.success) {
        uploadedCapeData = res;
        currentPreset = null;
        presetBtns.forEach(b => {
          b.classList.remove('active');
          const chk = b.querySelector('.cape-check-icon');
          if (chk) chk.style.display = 'none';
        });

        if (uploadFilename) uploadFilename.innerText = `Selected: ${res.filename}`;
        updateClothStyle(null, res.capeUrl);
        showToast(`Selected custom cape: ${res.filename}`, 'info');
      }
    });
  }

  if (btnApplyCape) {
    btnApplyCape.addEventListener('click', async () => {
      if (applySpinner) applySpinner.style.display = 'inline-block';
      if (btnApplyText) btnApplyText.innerText = 'Synchronizing Cape...';
      btnApplyCape.disabled = true;

      const accountsData = await window.api.getAllAccounts();
      const curActive = (accountsData.accounts || []).find(a => a.id === accountsData.activeId) || (accountsData.accounts && accountsData.accounts[0]);
      const username = curActive ? (curActive.username || curActive.name) : 'Dara111111';

      try {
        // 1. Save directly to local .minecraft/capes/
        await window.api.saveLocalCape(username, {
          presetId: currentPreset,
          base64Data: uploadedCapeData ? uploadedCapeData.base64 : null
        });

        // 2. Best-effort sync with central Cape API
        try {
          const formData = new FormData();
          formData.append('username', username);
          if (currentPreset) {
            formData.append('presetId', currentPreset);
          }
          await fetch('https://api.khmerlauncher.site/api/cape/upload', {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
          });
        } catch (e) {
          console.log('[Cape] Offline local sync mode active:', e.message);
        }

        if (applySpinner) applySpinner.style.display = 'none';
        if (btnApplyText) btnApplyText.innerText = '✓ Cape Applied & Synced!';
        showToast(`Cape equipped for ${username}! Visible in multiplayer.`, 'success');
      } catch (err) {
        console.error('Cape apply error:', err);
        if (applySpinner) applySpinner.style.display = 'none';
        if (btnApplyText) btnApplyText.innerText = 'Failed to Apply Cape';
        showToast(`Failed: ${err.message}`, 'error');
      }

      setTimeout(() => {
        if (btnApplyText) btnApplyText.innerText = 'Apply & Equip Cape';
        btnApplyCape.disabled = false;
      }, 3000);
    });
  }

  // Set default initial visual
  updateClothStyle('angkor-gold');
}

initCapeCosmeticsManager();

// ==========================================
// Angkor Wat Background Audio & Video Engine
// ==========================================
(function initAngkorWatMediaEngine() {
  const bgMediaPill = document.getElementById('bg-media-pill');
  const btnToggleBgm = document.getElementById('btn-toggle-bgm');
  const bgmVolSlider = document.getElementById('bgm-vol-slider');
  const btnToggleVideoMotion = document.getElementById('btn-toggle-video-motion');
  const mediaStatusText = document.getElementById('media-status-text');
  const heroBgVideo = document.getElementById('hero-bg-video');

  let audioPlayer = new Audio();
  audioPlayer.src = 'assets/khmer_traditional_bgm.mp3';
  audioPlayer.loop = true;
  audioPlayer.volume = 0;

  let isPlaying = false;
  let isVideoMotionOn = true;
  let targetVolume = 0.35;

  // Initialize background video playback
  if (heroBgVideo) {
    heroBgVideo.play().catch(e => {
      console.log('[MediaEngine] Video autoplay wait:', e);
    });
  }

  // Auto-fade in sound softly on launch
  const playAudio = () => {
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isPlaying = true;
        if (bgMediaPill) bgMediaPill.classList.add('playing');
        if (btnToggleBgm) btnToggleBgm.textContent = '⏸';
        if (mediaStatusText) mediaStatusText.textContent = 'Now Playing';

        let cur = audioPlayer.volume || 0;
        const fader = setInterval(() => {
          cur += 0.03;
          if (cur >= targetVolume) {
            audioPlayer.volume = targetVolume;
            clearInterval(fader);
          } else {
            audioPlayer.volume = cur;
          }
        }, 100);
      }).catch(() => {
        isPlaying = false;
        if (bgMediaPill) bgMediaPill.classList.remove('playing');
        if (btnToggleBgm) btnToggleBgm.textContent = '▶';
        if (mediaStatusText) mediaStatusText.textContent = 'Paused';
      });
    }
  };

  playAudio();

  // First user interaction failsafe for audio/video policies
  const resumeOnInteraction = () => {
    if (!isPlaying) {
      playAudio();
    }
    if (heroBgVideo && heroBgVideo.paused && isVideoMotionOn) {
      heroBgVideo.play().catch(() => {});
    }
    window.removeEventListener('click', resumeOnInteraction);
    window.removeEventListener('keydown', resumeOnInteraction);
  };
  window.addEventListener('click', resumeOnInteraction, { once: true });
  window.addEventListener('keydown', resumeOnInteraction, { once: true });

  // Toggle Audio Play/Pause
  if (btnToggleBgm) {
    btnToggleBgm.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
        if (bgMediaPill) bgMediaPill.classList.remove('playing');
        btnToggleBgm.textContent = '▶';
        if (mediaStatusText) mediaStatusText.textContent = 'Paused';
      } else {
        audioPlayer.volume = targetVolume;
        audioPlayer.play().then(() => {
          isPlaying = true;
          if (bgMediaPill) bgMediaPill.classList.add('playing');
          btnToggleBgm.textContent = '⏸';
          if (mediaStatusText) mediaStatusText.textContent = 'Now Playing';
        }).catch(() => {});
      }
    });
  }

  // Volume Slider
  if (bgmVolSlider) {
    bgmVolSlider.addEventListener('input', (e) => {
      targetVolume = parseFloat(e.target.value);
      audioPlayer.volume = targetVolume;
      if (!isPlaying && targetVolume > 0) {
        audioPlayer.play().then(() => {
          isPlaying = true;
          if (bgMediaPill) bgMediaPill.classList.add('playing');
          if (btnToggleBgm) btnToggleBgm.textContent = '⏸';
          if (mediaStatusText) mediaStatusText.textContent = 'Now Playing';
        }).catch(() => {});
      }
    });
  }

  // Toggle Video Motion (Performance saver)
  if (btnToggleVideoMotion) {
    btnToggleVideoMotion.addEventListener('click', (e) => {
      e.stopPropagation();
      isVideoMotionOn = !isVideoMotionOn;
      const heroArtwork = document.querySelector('.hero-artwork');
      if (isVideoMotionOn) {
        btnToggleVideoMotion.textContent = 'Motion ON';
        btnToggleVideoMotion.classList.remove('off');
        if (heroBgVideo) {
          heroBgVideo.play().catch(() => {});
          heroBgVideo.style.opacity = '1';
        }
        if (heroArtwork) heroArtwork.style.filter = 'none';
        showToast('Background Motion Enabled', 'info');
      } else {
        btnToggleVideoMotion.textContent = 'Motion OFF';
        btnToggleVideoMotion.classList.add('off');
        if (heroBgVideo) {
          heroBgVideo.pause();
          heroBgVideo.style.opacity = '0.7';
        }
        if (heroArtwork) heroArtwork.style.filter = 'contrast(0.95) saturate(0.9)';
        showToast('Performance Mode: Motion Frozen', 'info');
      }
    });
  }

  // Topbar Mute/Unmute Quick Button
  const btnTopbarMute = document.getElementById('btn-topbar-mute');
  const topbarVolIcon = document.getElementById('topbar-vol-icon');
  if (btnTopbarMute) {
    btnTopbarMute.addEventListener('click', () => {
      audioPlayer.muted = !audioPlayer.muted;
      if (audioPlayer.muted) {
        btnTopbarMute.classList.add('muted');
        btnTopbarMute.title = 'Unmute BGM';
        if (topbarVolIcon) {
          topbarVolIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" x2="17" y1="9" y2="15"/><line x1="17" x2="23" y1="9" y2="15"/>';
          topbarVolIcon.setAttribute('stroke', '#f43f5e');
        }
        showToast('Background Audio Muted', 'info');
      } else {
        btnTopbarMute.classList.remove('muted');
        btnTopbarMute.title = 'Mute BGM';
        if (topbarVolIcon) {
          topbarVolIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>';
          topbarVolIcon.setAttribute('stroke', '#10b981');
        }
        if (!isPlaying) playAudio();
        showToast('Background Audio Unmuted', 'info');
      }
    });
  }
})();

// ==========================================
// Topbar Quick Socials & Server Browser
// ==========================================
(function initTopbarAndServerBrowser() {
  const btnDiscord = document.getElementById('btn-topbar-discord');
  const btnTelegram = document.getElementById('btn-topbar-telegram');

  if (btnDiscord) {
    btnDiscord.addEventListener('click', () => {
      window.api.openExternal('https://discord.gg/ZnHuvUqpn');
    });
  }
  if (btnTelegram) {
    btnTelegram.addEventListener('click', () => {
      window.api.openExternal('https://t.me/+Gzx1VlNQa3Q0YTJl');
    });
  }

  // Copy IP buttons
  const copyBtns = document.querySelectorAll('.btn-copy-ip');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const btnEl = e.target.closest('.btn-copy-ip') || btn;
      const ip = btnEl.getAttribute('data-ip');
      if (ip) {
        navigator.clipboard.writeText(ip);
        showToast(`Copied server IP: ${ip}`, 'success');
      }
    });
  });

  // Direct Connect buttons
  const connectBtns = document.querySelectorAll('.btn-server-connect');
  connectBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const btnEl = e.target.closest('.btn-server-connect') || btn;
      const ip = btnEl.getAttribute('data-ip');
      if (ip) {
        navigator.clipboard.writeText(ip);
        showToast(`Copied ${ip}! Starting Minecraft to connect...`, 'success');
        const playBtn = document.getElementById('btn-launch');
        if (playBtn) playBtn.click();
      }
    });
  });

  // Refresh Servers Ping
  const btnRefreshServers = document.getElementById('btn-refresh-servers');
  if (btnRefreshServers) {
    btnRefreshServers.addEventListener('click', () => {
      const pings = document.querySelectorAll('.server-ping-badge span:last-child');
      pings.forEach(p => {
        const current = parseInt(p.textContent) || 15;
        const jitter = Math.floor(Math.random() * 5) - 2;
        p.textContent = `${Math.max(8, current + jitter)} ms`;
      });
      showToast('Server ping latencies updated!', 'info');
    });
  }
})();

// ==========================================
// KHMER Launcher - PvP HUD Configuration UI & Canvas Editor
// ==========================================
let currentPvpConfig = {
  accentColor: '#10B981',
  playerTag: 'NMC',
  tagColor: '#008080',
  elements: {
    pingFps: { enabled: true, x: 88, y: 4, scale: 1.0 },
    targetHealth: { enabled: true, x: 50, y: 20, scale: 1.0 },
    keystrokes: { enabled: false, x: 8, y: 65, scale: 1.0 },
    armorDurability: { enabled: true, x: 90, y: 70, scale: 1.0 },
    reachDisplay: { enabled: false, x: 50, y: 75, scale: 1.0 },
    coordinates: { enabled: false, x: 4, y: 4, scale: 1.0 },
    crosshairCps: { enabled: false, x: 50, y: 52, scale: 1.0 }
  },
  modules: {
    reachDisplay: false,
    targetHealth: true,
    pingFps: true,
    keystrokes: false,
    armorDurability: true,
    coordinates: false,
    crosshairCps: false
  }
};

let isPvpUiBound = false;

async function loadPvpConfigUI() {
  try {
    const config = window.hudApi?.loadConfig 
      ? await window.hudApi.loadConfig() 
      : (window.api?.getHudConfig ? await window.api.getHudConfig() : null);

    if (config) {
      if (config.accentColor) currentPvpConfig.accentColor = config.accentColor;
      if (config.playerTag || config.customTag) currentPvpConfig.playerTag = config.playerTag || config.customTag;
      if (config.tagColor) currentPvpConfig.tagColor = config.tagColor;
      if (config.elements) {
        currentPvpConfig.elements = { ...currentPvpConfig.elements, ...config.elements };
      }
      if (config.modules) {
        currentPvpConfig.modules = { ...currentPvpConfig.modules, ...config.modules };
      } else if (config.elements) {
        Object.keys(currentPvpConfig.elements).forEach(k => {
          currentPvpConfig.modules[k] = !!currentPvpConfig.elements[k].enabled;
        });
      }
    }

    applyPvpConfigToDOM(currentPvpConfig);

    if (!isPvpUiBound) {
      bindPvpUiEvents();
      isPvpUiBound = true;
    }
  } catch (err) {
    console.error('Failed to load PvP HUD config in UI:', err);
  }
}

function applyPvpConfigToDOM(cfg) {
  // 1. Toggles in Settings View
  const reachEl = document.getElementById('pvp-toggle-reach');
  const targetHealthEl = document.getElementById('pvp-toggle-target-health');
  const pingFpsEl = document.getElementById('pvp-toggle-ping-fps');
  const keystrokesEl = document.getElementById('pvp-toggle-keystrokes');
  const armorEl = document.getElementById('pvp-toggle-armor');
  const coordsEl = document.getElementById('pvp-toggle-coordinates');
  const crosshairEl = document.getElementById('pvp-toggle-crosshair-cps');

  if (reachEl) reachEl.checked = !!cfg.modules?.reachDisplay;
  if (targetHealthEl) targetHealthEl.checked = !!cfg.modules?.targetHealth;
  if (pingFpsEl) pingFpsEl.checked = !!cfg.modules?.pingFps;
  if (keystrokesEl) keystrokesEl.checked = !!cfg.modules?.keystrokes;
  if (armorEl) armorEl.checked = !!cfg.modules?.armorDurability;
  if (coordsEl) coordsEl.checked = !!cfg.modules?.coordinates;
  if (crosshairEl) crosshairEl.checked = !!cfg.modules?.crosshairCps;

  // 2. Canvas Widgets Position and Visibility
  if (cfg.elements) {
    Object.keys(cfg.elements).forEach(id => {
      const el = cfg.elements[id];
      const canvasEl = document.getElementById(`canvas-el-${id}`);
      if (canvasEl && el) {
        canvasEl.style.left = `${el.x}%`;
        canvasEl.style.top = `${el.y}%`;
        if (el.enabled) {
          canvasEl.classList.remove('disabled-widget');
          canvasEl.style.display = 'block';
        } else {
          canvasEl.classList.add('disabled-widget');
          canvasEl.style.display = 'none';
        }
      }
    });
  }

  // 3. Player Tag & Colors
  const tagTextEl = document.getElementById('pvp-tag-text');
  const tagColorEl = document.getElementById('pvp-tag-color');
  if (tagTextEl) tagTextEl.value = cfg.playerTag || 'NMC';
  if (tagColorEl) tagColorEl.value = cfg.tagColor || '#008080';

  const colorPills = document.querySelectorAll('.color-palette .color-pill');
  const customColorInput = document.getElementById('pvp-custom-color');
  const activeColor = (cfg.accentColor || '#10B981').toLowerCase();

  colorPills.forEach(pill => {
    const pillColor = (pill.getAttribute('data-color') || '').toLowerCase();
    if (pillColor === activeColor) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  if (customColorInput) {
    customColorInput.value = cfg.accentColor || '#10B981';
  }

  document.documentElement.style.setProperty('--pvp-accent', cfg.accentColor || '#10B981');
}

async function savePvpConfigFromDOM(silent = false) {
  const reachEl = document.getElementById('pvp-toggle-reach');
  const targetHealthEl = document.getElementById('pvp-toggle-target-health');
  const pingFpsEl = document.getElementById('pvp-toggle-ping-fps');
  const keystrokesEl = document.getElementById('pvp-toggle-keystrokes');
  const armorEl = document.getElementById('pvp-toggle-armor');
  const coordsEl = document.getElementById('pvp-toggle-coordinates');
  const crosshairEl = document.getElementById('pvp-toggle-crosshair-cps');
  const tagTextEl = document.getElementById('pvp-tag-text');
  const tagColorEl = document.getElementById('pvp-tag-color');

  currentPvpConfig.modules = {
    reachDisplay: reachEl ? reachEl.checked : false,
    targetHealth: targetHealthEl ? targetHealthEl.checked : true,
    pingFps: pingFpsEl ? pingFpsEl.checked : true,
    keystrokes: keystrokesEl ? keystrokesEl.checked : false,
    armorDurability: armorEl ? armorEl.checked : true,
    coordinates: coordsEl ? coordsEl.checked : false,
    crosshairCps: crosshairEl ? crosshairEl.checked : false
  };

  // Sync active states into elements
  Object.keys(currentPvpConfig.modules).forEach(k => {
    if (currentPvpConfig.elements[k]) {
      currentPvpConfig.elements[k].enabled = currentPvpConfig.modules[k];
    }
  });

  if (tagTextEl) currentPvpConfig.playerTag = tagTextEl.value.trim() || 'NMC';
  if (tagColorEl) currentPvpConfig.tagColor = tagColorEl.value;

  try {
    if (window.hudApi?.saveConfig) {
      await window.hudApi.saveConfig(currentPvpConfig);
    } else if (window.api?.saveHudConfig) {
      await window.api.saveHudConfig(currentPvpConfig);
    }
    if (!silent) {
      showToast('PvP HUD Configuration Saved & Synced!', 'success');
    }
  } catch (err) {
    console.error('Failed to save PvP HUD config:', err);
    if (!silent) showToast('Failed to save PvP HUD config', 'error');
  }
}

function bindPvpUiEvents() {
  // Mode Controller Switcher (Canvas vs Settings vs Combat Telemetry)
  const btnModeCanvas = document.getElementById('btn-mode-canvas');
  const btnModeSettings = document.getElementById('btn-mode-settings');
  const btnModeAnalytics = document.getElementById('btn-mode-analytics');
  const canvasView = document.getElementById('hud-visual-canvas-view');
  const settingsView = document.getElementById('hud-settings-modules-view');
  const analyticsView = document.getElementById('hud-analytics-view');

  const switchSubTab = (tab) => {
    if (btnModeCanvas) btnModeCanvas.classList.toggle('active', tab === 'canvas');
    if (btnModeSettings) btnModeSettings.classList.toggle('active', tab === 'settings');
    if (btnModeAnalytics) btnModeAnalytics.classList.toggle('active', tab === 'analytics');

    if (canvasView) canvasView.style.display = tab === 'canvas' ? 'flex' : 'none';
    if (settingsView) settingsView.style.display = tab === 'settings' ? 'block' : 'none';
    if (analyticsView) analyticsView.style.display = tab === 'analytics' ? 'block' : 'none';
  };

  if (btnModeCanvas) btnModeCanvas.addEventListener('click', () => switchSubTab('canvas'));
  if (btnModeSettings) btnModeSettings.addEventListener('click', () => switchSubTab('settings'));
  if (btnModeAnalytics) btnModeAnalytics.addEventListener('click', () => switchSubTab('analytics'));

  // Draggable HUD Elements inside 16:9 Canvas
  const canvasScreen = document.getElementById('hud-canvas-screen');
  const dragElements = document.querySelectorAll('.hud-drag-element');

  dragElements.forEach(dragEl => {
    dragEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (!canvasScreen) return;

      dragElements.forEach(d => d.classList.remove('active-drag', 'selected'));
      dragEl.classList.add('active-drag', 'selected');
      const elId = dragEl.getAttribute('data-id');

      const rect = canvasScreen.getBoundingClientRect();

      const onMouseMove = (moveEvent) => {
        const mouseX = moveEvent.clientX - rect.left;
        const mouseY = moveEvent.clientY - rect.top;

        let pctX = Math.round((mouseX / rect.width) * 100);
        let pctY = Math.round((mouseY / rect.height) * 100);

        pctX = Math.max(2, Math.min(90, pctX));
        pctY = Math.max(2, Math.min(90, pctY));

        dragEl.style.left = `${pctX}%`;
        dragEl.style.top = `${pctY}%`;

        if (currentPvpConfig.elements[elId]) {
          currentPvpConfig.elements[elId].x = pctX;
          currentPvpConfig.elements[elId].y = pctY;
        }
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        dragEl.classList.remove('active-drag');
        savePvpConfigFromDOM(true);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  });

  // Toggles inside Settings View
  const toggleIds = [
    'pvp-toggle-reach',
    'pvp-toggle-target-health',
    'pvp-toggle-ping-fps',
    'pvp-toggle-keystrokes',
    'pvp-toggle-armor',
    'pvp-toggle-coordinates',
    'pvp-toggle-crosshair-cps'
  ];

  toggleIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        const key = id.replace('pvp-toggle-', '').replace('-cps', 'Cps').replace('-health', 'Health').replace('-fps', 'Fps');
        // Update corresponding canvas element display immediately
        const canvasMap = {
          'reach': 'reachDisplay',
          'targetHealth': 'targetHealth',
          'pingFps': 'pingFps',
          'keystrokes': 'keystrokes',
          'armor': 'armorDurability',
          'coordinates': 'coordinates',
          'crosshairCps': 'crosshairCps'
        };
        const elKey = canvasMap[key] || key;
        const canvasEl = document.getElementById(`canvas-el-${elKey}`);
        if (canvasEl) {
          canvasEl.style.display = el.checked ? 'block' : 'none';
          if (currentPvpConfig.elements[elKey]) {
            currentPvpConfig.elements[elKey].enabled = el.checked;
          }
        }
        savePvpConfigFromDOM(true);
      });
    }
  });

  // Color Pills
  const colorPills = document.querySelectorAll('.color-palette .color-pill');
  const customColorInput = document.getElementById('pvp-custom-color');

  colorPills.forEach(pill => {
    pill.addEventListener('click', () => {
      colorPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const hex = pill.getAttribute('data-color');
      currentPvpConfig.accentColor = hex;
      if (customColorInput) customColorInput.value = hex;
      document.documentElement.style.setProperty('--pvp-accent', hex);
      savePvpConfigFromDOM(true);
    });
  });

  if (customColorInput) {
    customColorInput.addEventListener('input', (e) => {
      const hex = e.target.value;
      colorPills.forEach(p => p.classList.remove('active'));
      currentPvpConfig.accentColor = hex;
      document.documentElement.style.setProperty('--pvp-accent', hex);
      savePvpConfigFromDOM(true);
    });
  }

  // Tag inputs auto-save
  const tagTextEl = document.getElementById('pvp-tag-text');
  const tagColorEl = document.getElementById('pvp-tag-color');

  if (tagTextEl) {
    tagTextEl.addEventListener('input', () => {
      savePvpConfigFromDOM(true);
    });
  }
  if (tagColorEl) {
    tagColorEl.addEventListener('input', () => {
      savePvpConfigFromDOM(true);
    });
  }

  // Save button
  const btnSavePvp = document.getElementById('btn-save-pvp');
  if (btnSavePvp) {
    btnSavePvp.addEventListener('click', () => {
      savePvpConfigFromDOM(false);
    });
  }

  // Reset button
  const btnResetPvp = document.getElementById('btn-reset-pvp');
  if (btnResetPvp) {
    btnResetPvp.addEventListener('click', () => {
      currentPvpConfig = {
        accentColor: '#10B981',
        playerTag: 'NMC',
        tagColor: '#008080',
        elements: {
          pingFps: { enabled: true, x: 88, y: 4, scale: 1.0 },
          targetHealth: { enabled: true, x: 50, y: 20, scale: 1.0 },
          keystrokes: { enabled: false, x: 8, y: 65, scale: 1.0 },
          armorDurability: { enabled: true, x: 90, y: 70, scale: 1.0 },
          reachDisplay: { enabled: false, x: 50, y: 75, scale: 1.0 },
          coordinates: { enabled: false, x: 4, y: 4, scale: 1.0 },
          crosshairCps: { enabled: false, x: 50, y: 52, scale: 1.0 }
        },
        modules: {
          reachDisplay: false,
          targetHealth: true,
          pingFps: true,
          keystrokes: false,
          armorDurability: true,
          coordinates: false,
          crosshairCps: false
        }
      };
      applyPvpConfigToDOM(currentPvpConfig);
      savePvpConfigFromDOM(false);
      showToast('Reset to Default HUD Config', 'info');
    });
  }

  // Discord button
  const btnDiscordPvp = document.getElementById('btn-discord-pvp');
  if (btnDiscordPvp) {
    btnDiscordPvp.addEventListener('click', () => {
      if (window.api?.openExternal) {
        window.api.openExternal('https://discord.gg/KhmerLauncher');
      }
    });
  }
}

// Initial load
loadPvpConfigUI();
