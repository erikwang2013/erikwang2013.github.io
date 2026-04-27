// 手册数据
let manuals = [];
let totalManuals = 0; // 添加总手册数变量

// API端点
const API_ENDPOINT = 'http://api.erik.xyz/api/see/v1/home/manual'; // 请替换为实际的API端点

// 获取手册数据
async function fetchManuals(page = 1, searchTerm = '') {
    try {
        showLoading();
        // 构建API URL，包含分页和搜索参数
        let url = `${API_ENDPOINT}?page=${page}&limit=${manualsPerPage}`;
        if (searchTerm) {
            url += `&search=${encodeURIComponent(searchTerm)}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        // 假设API返回的数据结构包含items和total属性
        manuals = data.items || data;
        totalManuals = data.count || manuals.length;
        
        renderManuals(manuals['data']);
        renderPagination(totalManuals, page);
    } catch (error) {
        console.error('获取手册数据时出错:', error);
        showError('无法加载手册数据，请稍后再试。');
    } finally {
        hideLoading();
    }
}

// 显示加载状态
function showLoading() {
    manualsContainer.innerHTML = '<p class="loading">正在加载手册数据...</p>';
}

// 隐藏加载状态
function hideLoading() {
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.remove();
    }
}

// 显示错误信息
function showError(message) {
    manualsContainer.innerHTML = `<p class="error">${message}</p>`;
}

// DOM元素
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const clearButton = document.getElementById('clearButton');
const manualsContainer = document.getElementById('manualsContainer');
const paginationContainer = document.getElementById('paginationContainer');
const backToTopButton = document.getElementById('backToTop');

// 分页相关变量
const manualsPerPage = 6; // 每页显示的手册数量
let currentPage = 1; // 当前页码

// 初始化页面
function init() {
    updateCopyrightYear();
    fetchManuals(); // 从API获取手册数据
    setupEventListeners();
}

// 更新版权年份
function updateCopyrightYear() {
    const currentYear = new Date().getFullYear();
    document.getElementById('currentYear').textContent = currentYear;
}

// 获取当前应该显示的手册数组
function getCurrentManuals() {
    // 由于我们已经通过API处理了搜索和分页，直接返回当前手册数据
    return manuals;
}

// 设置事件监听器
function setupEventListeners() {
    searchButton.addEventListener('click', handleSearch);
    clearButton.addEventListener('click', clearSearch);
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
    
    // 返回顶部按钮事件监听器
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // 滚动事件监听器
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });
}

// 清除搜索
function clearSearch() {
    searchInput.value = '';
    
    // 重置页码并通过API获取所有数据
    currentPage = 1;
    fetchManuals(currentPage);
}

// 处理搜索
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // 重置页码
    currentPage = 1;
    
    // 通过API获取搜索结果
    fetchManuals(currentPage, searchTerm);
}

// 渲染手册卡片（支持分页）
function renderManuals(manualsToRender) {
    manualsContainer.innerHTML = '';
    
    if (manualsToRender.length === 0) {
        manualsContainer.innerHTML = '<p class="no-results">未找到匹配的手册。</p>';
        return;
    }
    // 渲染所有从API获取的手册（API已经处理了分页）
    manualsToRender.forEach( manual => {
        //manual.tags=Array.from(manual.tags)
        let tag=JSON.parse(manual.tags)
        const manualCard = document.createElement('div');
        manualCard.className = 'manual-card';
        manualCard.innerHTML = `
            <h2>${manual.title}</h2>
            <p>${manual.description}</p>
            <div class="tags">
            <span class="tag">${tag.map(tag=>tag).join(",")}</span>
                
            </div>
            <a href="#" class="view-btn" onclick="viewManual(${manual.id})">查看手册</a>
        `;
        manualsContainer.appendChild(manualCard);
    });
    
    // 渲染分页控件（如果总手册数超过每页显示数量）
    if (totalManuals > manualsPerPage) {
        renderPagination(totalManuals, currentPage);
    }
}

// 查看手册详情
function viewManual(id) {
    // 跳转到外部链接
    const manual = manuals.find(m => m.id == id);
    if (manual && manual.url) {
        window.open(manual.url, '_blank');
    }
}

// 渲染分页控件
function renderPagination(totalManuals, currentPage = 1) {
    // 清空分页容器
    paginationContainer.innerHTML = '';
    
    // 计算总页数
    const totalPages = Math.ceil(totalManuals / manualsPerPage);
    
    // 创建分页控件容器
    const paginationControls = document.createElement('div');
    paginationControls.className = 'pagination';
    
    // 添加分页按钮
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = 'page-btn';
        pageButton.textContent = i;
        
        // 如果是当前页，添加active类
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        
        // 添加点击事件
        pageButton.addEventListener('click', () => {
            // 通过API获取指定页面的数据
            const searchTerm = searchInput.value.toLowerCase().trim();
            fetchManuals(i, searchTerm);
        });
        
        paginationControls.appendChild(pageButton);
    }
    
    // 将分页控件添加到页面
    paginationContainer.appendChild(paginationControls);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);