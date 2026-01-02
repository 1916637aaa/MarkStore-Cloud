// script.js - 完整最终版（favicon.im 服务 + 跨设备合并同步 + 所有优化）

let bookmarks = [];
let categories = [{id: 'uncategorized', name: '未分类'}];
let userKey = localStorage.getItem('userKey');
if (!userKey) {
    userKey = generateUserKey();
    localStorage.setItem('userKey', userKey);
}

function generateUserKey() {
    return Math.random().toString(36).substring(2, 18);
}

function loadLocalData() {
    const storedBookmarks = localStorage.getItem('bookmarks');
    const storedCategories = localStorage.getItem('categories');
    if (storedBookmarks) bookmarks = JSON.parse(storedBookmarks);
    if (storedCategories) categories = JSON.parse(storedCategories);
    updateUI();
}

function saveLocalData() {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    localStorage.setItem('categories', JSON.stringify(categories));
}

function updateUI(filterCategory = 'all', searchTerm = '') {
    updateCategoryList(filterCategory);
    updateBookmarkList(filterCategory, searchTerm);
    updateStats();
}

function updateCategoryList(activeId) {
    const list = document.getElementById('categoryList');
    list.innerHTML = '<li data-id="all" class="' + (activeId === 'all' ? 'active' : '') + '">全部书签</li>' +
                     '<li data-id="uncategorized" class="' + (activeId === 'uncategorized' ? 'active' : '') + '">未分类</li>';
    categories.filter(c => c.id !== 'uncategorized').forEach(cat => {
        const li = document.createElement('li');
        li.dataset.id = cat.id;
        li.textContent = cat.name;
        if (cat.id === activeId) li.classList.add('active');
        list.appendChild(li);
    });
}

function updateBookmarkList(category, search) {
    const list = document.getElementById('bookmarkList');
    list.innerHTML = '';
    let filtered = bookmarks;

    if (category === 'uncategorized') {
        filtered = filtered.filter(b => !b.category_id);
    } else if (category !== 'all') {
        filtered = filtered.filter(b => b.category_id === category);
    }

    if (search) {
        const lowerSearch = search.toLowerCase();
        filtered = filtered.filter(b =>
            b.title.toLowerCase().includes(lowerSearch) ||
            b.url.toLowerCase().includes(lowerSearch) ||
            b.tags.some(tag => tag.toLowerCase().includes(lowerSearch))
        );
    }

    filtered.sort((a, b) => b.add_time - a.add_time);

    filtered.forEach(b => {
        const card = document.createElement('div');
        card.className = 'bookmark-card';
        card.draggable = true;
        card.dataset.id = b.id;

        const tagHtml = b.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('');

        card.innerHTML = `
            <div class="info">
                <img src="${b.favicon || 'default.ico'}" 
                     onerror="this.src='default.ico'; this.onerror=null;" 
                     alt="icon">
                <div>
                    <strong>${escapeHtml(b.title)}</strong><br>
                    <span>${truncateUrl(b.url)}</span><br>
                    <div class="tags">${tagHtml}</div>
                    <small>添加于: ${new Date(b.add_time).toLocaleDateString()}</small>
                </div>
            </div>
            <div class="actions">
                <button onclick="editBookmark('${b.id}')">编辑</button>
                <button onclick="deleteBookmark('${b.id}')">删除</button>
                <button onclick="visitBookmark('${b.id}')">访问</button>
            </div>
        `;
        list.appendChild(card);
    });
    setupDragAndDrop();
}

function truncateUrl(url) {
    return url.length > 50 ? url.substring(0, 47) + '...' : url;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateStats() {
    document.getElementById('totalBookmarks').textContent = bookmarks.length;
    document.getElementById('totalCategories').textContent = categories.length - 1;
    document.getElementById('lastSync').textContent = localStorage.getItem('lastSync') || '未同步';
}

function showModal(title, content) {
    const modal = document.getElementById('modal');
    const body = document.getElementById('modalBody');
    body.innerHTML = `<h2>${title}</h2>${content}`;
    modal.style.display = 'block';
}

document.querySelector('.close').onclick = () => document.getElementById('modal').style.display = 'none';
window.onclick = (e) => {
    if (e.target === document.getElementById('modal')) {
        document.getElementById('modal').style.display = 'none';
    }
};

document.getElementById('addBookmarkBtn').onclick = () => {
    showModal('添加书签', `
        <form id="bookmarkForm">
            <label>标题:</label><input type="text" id="title" required><br>
            <label>网址:</label><input type="url" id="url" required placeholder="https://example.com"><br>
            <label>分类:</label><select id="category">${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select><br>
            <label>标签:</label><input type="text" id="tags" placeholder="多个标签用空格分隔，如 工具 学习 PHP"><br>
            <button type="submit">保存</button>
        </form>
    `);
    document.getElementById('bookmarkForm').onsubmit = addBookmark;
};

function addBookmark(e) {
    e.preventDefault();
    const id = Date.now().toString();
    let title = document.getElementById('title').value.trim();
    const url = document.getElementById('url').value.trim();
    const category_id = document.getElementById('category').value;
    const tags = document.getElementById('tags').value.split(' ').filter(t => t.trim());

    if (!title) title = new URL(url).hostname;

    let hostname;
    try {
        hostname = new URL(url).hostname;
    } catch {
        alert('请输入有效的网址');
        return;
    }

    const favicon = `https://favicon.im/${hostname}`;

    bookmarks.push({
        id, title, url, category_id, tags,
        add_time: Date.now(), visit_count: 0, favicon
    });

    saveLocalData();
    updateUI();
    document.getElementById('modal').style.display = 'none';
}

function editBookmark(id) {
    const b = bookmarks.find(book => book.id === id);
    if (!b) return;

    showModal('编辑书签', `
        <form id="bookmarkForm">
            <label>标题:</label><input type="text" id="title" value="${escapeHtml(b.title)}" required><br>
            <label>网址:</label><input type="url" id="url" value="${b.url}" required><br>
            <label>分类:</label><select id="category">${categories.map(c => `<option value="${c.id}" ${c.id === b.category_id ? 'selected' : ''}>${c.name}</option>`).join('')}</select><br>
            <label>标签:</label><input type="text" id="tags" value="${b.tags.join(' ')}"><br>
            <button type="submit">保存</button>
        </form>
    `);

    document.getElementById('bookmarkForm').onsubmit = (e) => {
        e.preventDefault();
        b.title = document.getElementById('title').value.trim();
        b.url = document.getElementById('url').value.trim();
        b.category_id = document.getElementById('category').value;
        b.tags = document.getElementById('tags').value.split(' ').filter(t => t.trim());

        try {
            const hostname = new URL(b.url).hostname;
            b.favicon = `https://favicon.im/${hostname}`;
        } catch {}

        saveLocalData();
        updateUI();
        document.getElementById('modal').style.display = 'none';
    };
}

function deleteBookmark(id) {
    if (confirm('确认删除此书签？操作不可恢复')) {
        bookmarks = bookmarks.filter(b => b.id !== id);
        saveLocalData();
        updateUI();
    }
}

function visitBookmark(id) {
    const b = bookmarks.find(book => book.id === id);
    if (b) {
        b.visit_count++;
        saveLocalData();
        window.open(b.url, '_blank');
    }
}

document.getElementById('newCategoryBtn').onclick = () => {
    const name = prompt('请输入新分类名称：');
    if (name && name.trim()) {
        const id = Date.now().toString();
        categories.push({id, name: name.trim()});
        saveLocalData();
        updateUI();
    }
};

document.getElementById('categoryList').addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        document.querySelectorAll('.categories li').forEach(li => li.classList.remove('active'));
        e.target.classList.add('active');
        updateUI(e.target.dataset.id, document.getElementById('searchInput').value);
    }
});

document.getElementById('searchInput').addEventListener('input', (e) => {
    const activeCat = document.querySelector('.categories li.active')?.dataset.id || 'all';
    updateUI(activeCat, e.target.value.trim());
});

function setupDragAndDrop() {
    const cards = document.querySelectorAll('.bookmark-card');
    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', card.dataset.id));
    });

    const catItems = document.querySelectorAll('.categories li');
    catItems.forEach(item => {
        item.addEventListener('dragover', e => e.preventDefault());
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            const b = bookmarks.find(book => book.id === id);
            if (b) {
                b.category_id = (item.dataset.id === 'all' || item.dataset.id === 'uncategorized') ? null : item.dataset.id;
                saveLocalData();
                updateUI(item.dataset.id);
            }
        });
    });
}

document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();

document.getElementById('importFile').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(ev.target.result, 'text/html');
        const links = doc.querySelectorAll('a');

        let imported = 0;
        links.forEach(a => {
            let url = a.getAttribute('href');
            if (!url || !/^https?:\/\//i.test(url)) return;

            let title = a.textContent.trim() || url;
            const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);

            let hostname;
            try {
                hostname = new URL(url).hostname;
            } catch {
                return;
            }

            const favicon = `https://favicon.im/${hostname}`;

            bookmarks.push({
                id, title, url,
                category_id: 'uncategorized',
                tags: [],
                add_time: Date.now(),
                visit_count: 0,
                favicon
            });
            imported++;
        });

        saveLocalData();
        updateUI();
        alert(`成功导入 ${imported} 条书签`);
    };
    reader.readAsText(file);
};

document.getElementById('exportHtmlBtn').onclick = () => {
    let html = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n';
    html += '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n';
    html += '<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n';

    bookmarks.forEach(b => {
        html += `    <DT><A HREF="${b.url}">${escapeHtml(b.title)}</A></DT>\n`;
    });

    html += '</DL><p>';
    download('my-bookmarks.html', html);
};

document.getElementById('exportJsonBtn').onclick = () => {
    const data = { bookmarks, categories };
    download('my-bookmarks.json', JSON.stringify(data, null, 2));
};

function download(filename, text) {
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

// ==================== 同步功能（支持跨设备合并） ====================
document.getElementById('syncBtn').onclick = () => {
    showModal('云同步与合并', `
        <p style="margin-bottom:8px;">当前设备密钥（不可修改）：</p>
        <input type="text" id="currentKey" value="${userKey}" readonly style="width:100%; padding:10px; margin-bottom:20px; background:#f1f5f9;">

        <p style="margin-bottom:8px;">输入另一个设备的密钥（用于合并数据）：</p>
        <input type="text" id="otherKey" placeholder="粘贴另一个设备的密钥" style="width:100%; padding:10px; margin-bottom:25px;">

        <div style="display:grid; grid-template-columns:1fr; gap:12px;">
            <button id="uploadBtn">上传当前数据到云端</button>
            <button id="downloadBtn">从云端下载（覆盖本地）</button>
            <button id="mergeBtn" style="background:#f59e0b; color:white;">从另一个密钥合并下载</button>
        </div>

        <p id="syncStatus" style="margin-top:20px; font-size:14px; min-height:20px;"></p>
    `);

    document.getElementById('uploadBtn').onclick = uploadToCloud;
    document.getElementById('downloadBtn').onclick = downloadFromCloud;

    document.getElementById('mergeBtn').onclick = () => {
        const otherKey = document.getElementById('otherKey').value.trim();
        if (!otherKey) {
            alert('请先输入另一个设备的密钥！');
            return;
        }
        if (otherKey === userKey) {
            alert('不能输入当前设备的密钥哦～');
            return;
        }

        const status = document.getElementById('syncStatus');
        status.textContent = '正在从另一个密钥下载并合并数据...';

        fetch(`api.php?action=download&user_key=${encodeURIComponent(otherKey)}`)
            .then(res => res.json())
            .then(data => {
                if (!data.success || !data.bookmarks) {
                    status.textContent = '❌ 合并失败：对方密钥无数据或不存在';
                    return;
                }

                const incomingCats = data.categories || [];
                const incomingBooks = data.bookmarks || [];

                // 合并分类（按名称去重）
                incomingCats.forEach(cat => {
                    if (cat.id === 'uncategorized') return;
                    if (!categories.some(c => c.name === cat.name)) {
                        cat.id = Date.now().toString() + Math.random().toString(36).substr(2,5);
                        categories.push(cat);
                    }
                });

                // 合并书签（全部保留，生成新ID）
                incomingBooks.forEach(b => {
                    b.id = Date.now().toString() + Math.random().toString(36).substr(2,9);

                    if (b.category_id && b.category_id !== 'uncategorized') {
                        const matchedCat = categories.find(c =>
                            incomingCats.find(ic => ic.id === b.category_id)?.name === c.name
                        );
                        b.category_id = matchedCat ? matchedCat.id : 'uncategorized';
                    } else {
                        b.category_id = 'uncategorized';
                    }

                    // 更新 favicon 为新服务
                    try {
                        const hostname = new URL(b.url).hostname;
                        b.favicon = `https://favicon.im/${hostname}`;
                    } catch {}

                    bookmarks.push(b);
                });

                saveLocalData();
                updateUI();
                localStorage.setItem('lastSync', new Date().toLocaleString());
                updateStats();

                status.innerHTML = `✅ 成功合并 ${incomingBooks.length} 条书签和 ${incomingCats.length} 个分类！<br>
                                   <strong>建议立即点击“上传当前数据到云端”保存合并结果。</strong>`;
            })
            .catch(() => {
                status.textContent = '❌ 网络错误，请检查服务器';
            });
    };
};

function uploadToCloud() {
    const status = document.getElementById('syncStatus') || { textContent: '' };
    status.textContent = '上传中...';
    fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upload', user_key: userKey, bookmarks, categories })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('lastSync', new Date().toLocaleString());
            updateStats();
            status.textContent = '✅ 上传成功！';
        } else {
            status.textContent = '❌ 上传失败：' + (data.message || '未知错误');
        }
    })
    .catch(() => status.textContent = '❌ 网络错误');
}

function downloadFromCloud() {
    if (!confirm('这将用云端数据完全覆盖本地所有书签和分类，确定继续吗？')) return;

    const status = document.getElementById('syncStatus') || { textContent: '' };
    status.textContent = '下载中...';
    fetch(`api.php?action=download&user_key=${userKey}`)
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            bookmarks = data.bookmarks || [];
            categories = data.categories || [{id: 'uncategorized', name: '未分类'}];

            // 下载后统一更新旧书签的 favicon 为新服务
            bookmarks.forEach(b => {
                try {
                    const hostname = new URL(b.url).hostname;
                    b.favicon = `https://favicon.im/${hostname}`;
                } catch {}
            });

            saveLocalData();
            localStorage.setItem('lastSync', new Date().toLocaleString());
            updateUI();
            status.textContent = '✅ 下载成功，本地数据已更新';
        } else {
            status.textContent = '❌ 下载失败：' + (data.message || '无数据');
        }
    })
    .catch(() => status.textContent = '❌ 网络错误');
}

document.getElementById('settingsBtn').onclick = () => {
    showModal('设置', `
        <button onclick="if(confirm('确定清空所有本地数据？')) { localStorage.clear(); location.reload(); }">清空本地数据</button><br><br>
        <button style="background:#dc2626;" onclick="clearCloudData()">清空云端数据</button>
    `);
};

function clearCloudData() {
    if (confirm('确定清空当前密钥的云端所有数据？此操作不可恢复！')) {
        fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clear', user_key: userKey })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) alert('云端数据已清空');
            else alert('清空失败：' + data.message);
        });
    }
}

// 初始化
loadLocalData();