---
title: "docker 拉取失败&clash_for_linux丝滑拉取"
date: "2025-05-19"
categories: 工具与环境
tags:
- docker拉取失败
- 怎么丝滑拉取镜像
description: "Ubuntu 环境下的 Docker 镜像拉取故障排查与代理配置。"
legacyPath: "/2025/05/19/docker-拉取失败-clash-for-linux丝滑拉取/"
---

# **docker 拉取失败**???&**clash_for_linux**丝滑拉取

## clash安装

详情：为了解决docker拉取镜像失败，让docker yml走代理，从而有了这篇文章

设备：ubuntu22

deb文件：[clash-verge-rev/clash-verge-rev：基于 Tauri 的现代 GUI 客户端，旨在在 Windows、macOS 和 Linux 中运行，以提供定制的代理体验](https://github.com/clash-verge-rev/clash-verge-rev)

### 安装教程

#### 1.安装deb

```
sudo dpkg -i Clash.Verge_2.2.3_amd64.deb
```

有可能会出现缺少依赖的情况，使用下面的命令进行修复

```
sudo apt --fix-broken install -y
sudo apt install flatpak -y
sudo dpkg -i Clash.Verge_2.2.3_amd64.deb
```

#### 2.配置文件

可以在应用点击打开了此时

![image-20250515100436736](/images/docker-拉取失败-clash-for-linux丝滑拉取/image-20250515100436736.png)

注意：如果导入失败，不一定是订阅链接问题，可以把你的购买机场地址放入浏览器，在里面点击导入clash

![image-20250515100912886](/images/docker-拉取失败-clash-for-linux丝滑拉取/image-20250515100912886.png)

#### 3.启动

clash打开首页下拉打开系统代理，并且把网络代理设置成clash代理

![image-20250515101233442](/images/docker-拉取失败-clash-for-linux丝滑拉取/image-20250515101233442.png)

## docker配置文件修改

进入到你要拉取的镜像的目录。

编辑docker-compose.yml

加上下面缺失代码，让镜像拉取走代理

```
    build:
      context: .
      network: host                # 使用宿主网络，继承 Clash 代理和 DNS
      args:
        HTTP_PROXY: "http://127.0.0.1:7897"    # Clash HTTP 代理端口，请与 Clash Verge 中“混合代理端口”保持一致
        HTTPS_PROXY: "http://127.0.0.1:7897"   # Clash HTTPS 代理端口
```

## 心得

**看起来很简单是吧。真是花了我两天去搞，一开始不是走代理，就是简单修改dockerfile和dockercompose.后面发现依旧不理想，甚至让我到了抓狂的地步。好吧，也没有那么夸张。后面尝试了利用走梯子，其中首先遇到了命令方式配置，行不通，我的问题吧，反正我是不会。又下载了图形，经过几次的更改后，终于找到极品方法。HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH**
