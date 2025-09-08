// 示例手册数据
const manuals = [

    {
        id: 29,
        title: "Docker中文文档",
        description:"Docker 是一个开源项目，诞生于 2013 年初，最初是 dotCloud 公司内部的一个业余项目。它基于 Google 公司推出的 Go 语言实现。 项目后来加入了 Linux 基金会，遵从了 Apache 2.0 协议，项目代码在 GitHub 上进行维护。",
        tags:["Docker","容器","运维","工具"],
        url: "http://www.dockerinfo.net/document"
    },
    {
        id: 28,
        title: "KubeOperator文档",
        description:"KubeOperator 是一个开源的轻量级 Kubernetes 发行版，专注于帮助企业规划、部署和运营生产级别的 Kubernetes 集群。",
        tags:["KubeOperator","k8s","运维","工具"],
        url: "https://kubeoperator.io/docs/"
    },
    {
        id: 27,
        title: "深入理解PHP内核",
        description:"TIPI项目是一个自发项目, 项目主要关注PHP的内部实现, 以及PHP相关的方方面面, 该项目包括《深入理解PHP内核》这本书，以及一些相关的PHP项目，例如一些PHP扩展及研究项目.",
        tags:["php","php内核","后端"],
        url: "https://docs.kilvn.com/tipi/"
    },
    {
        id: 26,
        title: "gRPC中文文档",
        description:"gRPC  是一个高性能、开源和通用的 RPC 框架，面向移动和 HTTP/2 设计。目前提供 C、Java 和 Go 语言版本，分别是：grpc, grpc-java, grpc-go. 其中 C 版本支持 C, C++, Node.js, Python, Ruby, Objective-C, PHP 和 C# 支持.",
        tags:["grpc","服务端"],
        url: "https://doc.oschina.net/grpc"
    },
    {
        id: 25,
        title: "PHP标准规范",
        description:"PSR是PHP Standard Recommendations （PHP 推荐标准）的简写，由 PHP FIG 组织制定的 PHP 规范，是 PHP 开发的实践标准。",
        tags:["php","psr","php标准"],
        url: "https://learnku.com/docs/psr"
    },
    {
        id: 24,
        title: "PHP中文手册",
        description:"php手册",
        tags:["php","php手册"],
        url: "https://www.php.net/manual/zh"
    },
    {
        id: 23,
        title: "agentzh的Nginx教程",
        description:"",
        tags:["nginx","服务器"],
        url: "https://openresty.org/download/agentzh-nginx-tutorials-zhcn.html"
    },
    {
        id: 22,
        title: "Nginx第三方模块试用记",
        description:"",
        tags:["nginx","服务器"],
        url: "https://www.cnblogs.com/jony413/articles/2287231.html"
    },
    {
        id: 21,
        title: "openresty介绍",
        description:"OpenResty® 是一个基于 Nginx 与 Lua 的高性能 Web 平台，其内部集成了大量精良的 Lua 库、第三方模块以及大多数的依赖项。用于方便地搭建能够处理超高并发、扩展性极高的动态 Web 应用、Web 服务和动态网关。",
        tags:["openresty","服务器"],
        url: "https://openresty.org/cn/"
    },
    {
        id: 20,
        title: "cors",
        description:"跨源资源共享（CORS，或通俗地译为跨域资源共享）是一种基于 HTTP 头的机制，该机制通过允许服务器标示除了它自己以外的其他源（域、协议或端口），使得浏览器允许这些源访问加载自己的资源。跨源资源共享还通过一种机制来检查服务器是否会允许要发送的真实请求，该机制通过浏览器发起一个到服务器托管的跨源资源的“预检”请求。在预检中，浏览器发送的头中标示有 HTTP 方法和真实请求中会用到的头",
        tags:["cors","跨源资源共享","前端"],
        url: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CORS"
    },
    {
        id: 19,
        title: "W3C",
        description:"",
        tags:["w3c","前端"],
        url: "http://www.chinaw3c.org"
    },

    {
        id: 18,
        title: "gin官方文档",
        description: "Gin 是一个用 Go (Golang) 编写的 HTTP Web 框架。 它具有类似 Martini 的 API，但性能比 Martini 快 40 倍。如果你需要极好的性能，使用 Gin 吧。",
        tags: ["gin", "go", "编程", "后端"],
        url: "https://gin-gonic.com/zh-cn/docs"
    },
    {
        id: 17,
        title: "MongoDB权限说明",
        description: "MongoDB是一个流行的开源文档型数据库，它使用类似 JSON 的文档模型存储数据，这使得数据存储变得非常灵活。",
        tags: ["MongoDB", "数据库", "编程", "后端"],
        url: "/2020/06/20/mongodb-user-rbc/"
    },
    {
        id: 16,
        title: "Laravel中文文档",
        description: "Laravel 是优雅的 PHP Web 开发框架。具有高效、简洁、富于表达力等优点。采用 MVC 设计，是崇尚开发效率的全栈框架",
        tags: ["laravel", "php", "编程", "后端"],
        url: "https://learnku.com/docs/laravel/"
    },
    {
        id: 15,
        title: "imi",
        description: "imi 是一款支持长连接微服务的PHP开发框架，它可以运行在PHP-FPM、Swoole、Workerman等RoadRunner多种容器环境下",
        tags: ["imi", "php", "编程", "后端"],
        url: "https://github.com/imiphp/imi"
    },
    {
        id: 14,
        title: "Easyswoole",
        description: "EasySwoole 是一款基于 Swoole Server 开发的常驻内存型的分布式 PHP 框架，专为 API 而生，摆脱传统 PHP 运行模式在进程唤起和文件加载上带来的性能损失。 EasySwoole 高度封装了 Swoole Server 而依旧维持 Swoole Server 原有特性，支持同时混合监听 HTTP、自定义 TCP、UDP 协议，让开发者以最低的学习成本和精力编写出多进程、可异步、高可用的应用服务。",
        tags: ["Easyswoole", "php", "编程", "后端"],
        url: "https://www.easyswoole.com/Preface/intro.html"
    },
    {
        id: 13,
        title: "Hyperf",
        description: "Hyperf 是一个高性能、高灵活性的渐进式 PHP 协程框架，内置协程服务器及大量常用的组件，性能较传统基于 PHP-FPM 的框架有质的提升，提供超高性能的同时，也保持着极其灵活的可扩展性，标准组件均基于 PSR 标准 实现，基于强大的依赖注入设计，保证了绝大部分组件或类都是 可替换 与 可复用 的。",
        tags: ["Hyperf", "php", "编程", "后端"],
        url: "https://hyperf.wiki"
    },
    {
        id: 12,
        title: "swoft中文文档",
        description: "Swoft 是一款基于 Swoole 扩展实现的 PHP 微服务协程框架。Swoft 能像 Go 一样，内置协程网络服务器及常用的协程客户端且常驻内存，不依赖传统的 PHP-FPM。有类似 Go 语言的协程操作方式，有类似 Spring Cloud 框架灵活的注解、强大的全局依赖注入容器、完善的服务治理、灵活强大的 AOP、标准的 PSR 规范等实现。",
        tags: ["swoft", "php", "编程", "后端"],
        url: "https://github.com/swoft-cloud/swoft/blob/master/README.zh-CN.md"
    },
    {
        id: 11,
        title: "webman",
        description: "Webman是一款基于Workerman构建的高性能服务框架，集成了HTTP、WebSocket、TCP、UDP等多种模块。通过常驻内存、协程、连接池等先进技术，Webman不仅突破了传统PHP的性能瓶颈，还极大地扩展了其应用场景。",
        tags: ["webman", "php", "编程", "后端"],
        url: "https://www.workerman.net/doc/webman#/"
    },
    {
        id: 10,
        title: "swoole",
        description: "Swoole 是一个使用 C++ 语言编写的基于异步事件驱动和协程的并行网络通信引擎，为 PHP 提供协程、高性能网络编程支持。提供了多种通信协议的网络服务器和客户端模块，可以方便快速的实现 TCP/UDP服务、高性能Web、WebSocket服务、物联网、实时通讯、游戏、微服务等，使 PHP 不再局限于传统的 Web 领域。",
        tags: ["swoole", "php", "编程", "后端"],
        url: "https://wiki.swoole.com/zh-cn/#/"
    },
    {
        id: 9,
        title: "layui",
        description: "全面的JavaScript编程语言指南，包含基础到高级概念。",
        tags: ["layui", "编程", "前端", "脚本语言"],
        url: "https://layuion.com/docs/"
    },
    {
        id: 8,
        title: "slim中文文档",
        description: "Slim 是一个 PHP 微型框架，可帮助您快速编写简单但功能强大的 Web 应用程序和 API。Slim 的核心是一个调度程序，它接收 HTTP 请求、调用适当的回调例程并返回 HTTP 响应。就是这样。",
        tags: ["编程", "后端", "脚本语言", "php", "slim"],
        url: "/docs/slim/home.html"
    },
    {
        id: 7,
        title: "zola中文文档",
        description: "Zola 是一个静态站点生成器 (SSG)，类似于Hugo、Pelican和Jekyll（有关 SSG 的完整列表，请参阅Jamstack）。它用Rust编写并使用Tera模板引擎，类似于Jinja2、Django 模板、Liquid和Twig。",
        tags: ["zola", "编程", "前端", "脚本语言"],
        url: "/docs/zola/getting-started/overview.html"
    },
    {
        id: 1,
        title: "JavaScript指南",
        description: "全面的JavaScript编程语言指南，包含基础到高级概念。",
        tags: ["编程", "前端", "脚本语言"],
        url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript"
    },
    {
        id: 2,
        title: "Python手册",
        description: "Python编程语言的完整参考手册。",
        tags: ["编程", "后端", "数据科学"],
        url: "https://docs.python.org/zh-cn/3/"
    },
    {
        id: 3,
        title: "CSS设计指南",
        description: "层叠样式表(CSS)的设计和实现指南。",
        tags: ["前端", "设计", "样式"],
        url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS"
    },
    {
        id: 4,
        title: "HTML5参考手册",
        description: "HTML5最新标准的详细参考手册。",
        tags: ["前端", "标记语言", "网页"],
        url: "https://developer.mozilla.org/zh-CN/docs/Web/Guide/HTML/HTML5"
    },
    {
        id: 5,
        title: "React开发手册",
        description: "Facebook React库的开发和使用手册。",
        tags: ["前端", "框架", "组件"],
        url: "https://reactjs.org/"
    },
    {
        id: 6,
        title: "Node.js后端开发",
        description: "使用Node.js进行后端开发的完整指南。",
        tags: ["后端", "服务器", "JavaScript"],
        url: "https://nodejs.org/zh-cn/"
    }
];

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
    renderManuals(manuals);
    setupEventListeners();
}

// 更新版权年份
function updateCopyrightYear() {
    const currentYear = new Date().getFullYear();
    document.getElementById('currentYear').textContent = currentYear;
}

// 获取当前应该显示的手册数组
function getCurrentManuals() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm === '') {
        return manuals;
    }

    return manuals.filter(manual =>
        manual.title.toLowerCase().includes(searchTerm) ||
        manual.description.toLowerCase().includes(searchTerm) ||
        manual.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
}

// 设置事件监听器
function setupEventListeners() {
    searchButton.addEventListener('click', handleSearch);
    clearButton.addEventListener('click', clearSearch);
    searchInput.addEventListener('keyup', function (event) {
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
    currentPage = 1; // 重置页码
    renderManuals(manuals);
}

// 处理搜索
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm === '') {
        currentPage = 1; // 重置页码
        renderManuals(manuals);
        return;
    }

    const filteredManuals = manuals.filter(manual =>
        manual.title.toLowerCase().includes(searchTerm) ||
        manual.description.toLowerCase().includes(searchTerm) ||
        manual.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );

    currentPage = 1; // 重置页码
    renderManuals(filteredManuals);
}

// 渲染手册卡片（支持分页）
function renderManuals(manualsToRender) {
    manualsContainer.innerHTML = '';

    if (manualsToRender.length === 0) {
        manualsContainer.innerHTML = '<p class="no-results">未找到匹配的手册。</p>';
        return;
    }

    // 计算当前页需要显示的手册
    const startIndex = (currentPage - 1) * manualsPerPage;
    const endIndex = startIndex + manualsPerPage;
    const manualsToShow = manualsToRender.slice(startIndex, endIndex);

    manualsToShow.forEach(manual => {
        const manualCard = document.createElement('div');
        manualCard.className = 'manual-card';
        manualCard.innerHTML = `
            <h2>${manual.title}</h2>
            <p>${manual.description}</p>
            <div class="tags">
                ${manual.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <a href="#" class="view-btn" onclick="viewManual(${manual.id})">查看手册</a>
        `;
        manualsContainer.appendChild(manualCard);
    });

    // 如果总手册数超过每页显示数量，则添加分页控件
    if (manualsToRender.length > manualsPerPage) {
        renderPagination(manualsToRender.length);
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
function renderPagination(totalManuals) {
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
            currentPage = i;
            // 重新渲染手册
            const currentManuals = getCurrentManuals();
            renderManuals(currentManuals);
        });

        paginationControls.appendChild(pageButton);
    }

    // 将分页控件添加到页面
    paginationContainer.appendChild(paginationControls);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);