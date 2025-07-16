---
title: Nginx 学习笔记
description: 不会前端的后端程序员不是好架构师
---

## Overview

### About Nginx

2004 年由俄罗斯程序员 Igor Sysoev 开发，他想要开发一款 Apache 的替代品，主要关注以下几个方面：：

- high performance
- high concurrency
- low resource usage

### Nginx vs Apache

Apache is configured in what's called prefork mode, meaning that it spawns a set number of processors, 
each of which can serve a single request at a time, regardless of whether that request is for a PHP

Nginx 是异步处理

## Installation

参考：[掘金](https://juejin.cn/post/6986190222241464350)

笔者使用的是 MacBook，因此可以直接基于 `brew` 进行安装

```shell
brew install nginx
```

安装完成之后，可以使用如下命令查看 nginx 的配置信息

```shell
brew info nginx
```

得到的结果为

```text
➜  ~ brew info nginx
==> nginx: stable 1.27.4 (bottled), HEAD
HTTP(S) server and reverse proxy, and IMAP/POP3 proxy server
https://nginx.org/
Installed
/opt/homebrew/Cellar/nginx/1.27.4 (27 files, 2.5MB) *
  Poured from bottle using the formulae.brew.sh API on 2025-03-28 at 15:32:09
From: https://github.com/Homebrew/homebrew-core/blob/HEAD/Formula/n/nginx.rb
License: BSD-2-Clause
==> Dependencies
Required: openssl@3 ✔, pcre2 ✘
==> Options
--HEAD
	Install HEAD version
==> Caveats
Docroot is: /opt/homebrew/var/www

The default port has been set in /opt/homebrew/etc/nginx/nginx.conf to 8080 so that
nginx can run without sudo.

nginx will load all files in /opt/homebrew/etc/nginx/servers/.

To restart nginx after an upgrade:
  brew services restart nginx
Or, if you don't want/need a background service you can just run:
  /opt/homebrew/opt/nginx/bin/nginx -g daemon\ off\;
==> Analytics
install: 11,941 (30 days), 36,550 (90 days), 166,345 (365 days)
install-on-request: 11,926 (30 days), 36,451 (90 days), 165,904 (365 days)
build-error: 14 (30 days)
```

通过观察上面信息，我们可以得知：

- nginx 的安装路径是 `/opt/homebrew/Cellar/nginx/1.27.4`
- nginx 的配置文件是 `/opt/homebrew/etc/nginx/nginx.conf`


我们可以通过 `brew` 来启动 nginx 服务

```shell
brew services start nginx
```

执行上述命令之后，可以通过查看后台进程来判断 nginx 是否运行

```shell
ps aux | grep nginx
```

运行结果如下所示，一个 master process 进程和一个 worker process 进程代表我们的 nginx 服务已经成功启动了

```text
44180   0.2  0.0 410060272     32 s006  S+    5:04PM   0:00.00 grep --color=auto --exclude-dir=.bzr --exclude-dir=CVS --exclude-dir=.git --exclude-dir=.hg --exclude-dir=.svn --exclude-dir=.idea --exclude-dir=.tox --exclude-dir=.venv --exclude-dir=venv nginx
72497   0.0  0.0 410881200    512   ??  S     3:32PM   0:00.00 nginx: worker process
72482   0.0  0.0 410740912   3648   ??  S     3:32PM   0:00.03 nginx: master process /opt/homebrew/opt/nginx/bin/nginx -g daemon off;
```

此时我们访问 [](localhost:8080)，即可见到 nginx 的 homepage

![](/images/frontend/nginx/homepage.png)

## Configuration

Term

- directive: specific configuration options that get set in the configuration files and consist a name and a value
- context: a section within the configuration where directives can be set for that given context (like scope)

### Location block

在 Nginx 中，`location` 块用于定义如何处理特定的 URL 请求。它是 Nginx 配置文件中非常重要的一部分，通常用于匹配客户端请求的路径，并指定如何处理这些请求（例如，转发到后端服务器、提供静态文件、执行重定向等）。

**基本语法**

```text
location [modifier] [URI] {
    # 配置指令
}
```

- modifier（可选）：用于指定匹配规则的类型。
- URI：用于匹配请求的路径。
- {}：包含处理该路径的配置指令。

**modifier 类型**

以下 modifier 已经按照它们的优先级进行了排序，如果多个 modifier 同时出现的话那么会按照如下优先级选择匹配规则

- 精确匹配 (=)。 
- 前缀匹配 (^~)。 
- 正则匹配 (~ 和 ~*)（按配置文件中出现的顺序匹配）。 
- 普通前缀匹配（无 modifier）。 
- 通配符匹配 (/)。