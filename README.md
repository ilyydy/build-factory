# build-factory

## 目录

- [Clash Verge Rev 分流配置](#clash-verge-rev-分流配置)
  - [黑名单过滤 + 广告](#黑名单过滤--广告)
  - [白名单过滤 + 广告](#白名单过滤--广告)
  - [懒人配置](#懒人配置)
  - [首次设置](#首次设置)
  - [日常更新](#日常更新)
  - [构建产物](#构建产物)
- [Shadowrocket 分流规则](#shadowrocket-分流规则)
  - [黑名单过滤 + 广告](#基于黑名单过滤--广告的分流规则)
  - [白名单过滤 + 广告](#基于名单过滤--广告的分流规则)
  - [懒人配置](#基于懒人配置的分流规则)

## Clash Verge Rev 分流配置

### 黑名单过滤 + 广告

未命中的流量走直连。

- ghproxy <https://ghproxy.net/https://raw.githubusercontent.com/ilyydy/build-factory/release/my_black_ad_ghproxy.yaml>
- GitHub Raw <https://raw.githubusercontent.com/ilyydy/build-factory/release/my_black_ad.yaml>
- jsDelivr <https://cdn.jsdelivr.net/gh/ilyydy/build-factory@release/my_black_ad.yaml>

| ghproxy | GitHub Raw | jsDelivr |
| --- | --- | --- |
| ![Clash 黑名单 ghproxy 二维码](doc/clash_black_ad_ghproxy.png) | ![Clash 黑名单 GitHub Raw 二维码](doc/clash_black_ad.png) | ![Clash 黑名单 jsDelivr 二维码](doc/clash_black_ad_jsdelivr.png) |

### 白名单过滤 + 广告

未命中的流量走「节点选择」。

- ghproxy <https://ghproxy.net/https://raw.githubusercontent.com/ilyydy/build-factory/release/my_white_ad_ghproxy.yaml>
- GitHub Raw <https://raw.githubusercontent.com/ilyydy/build-factory/release/my_white_ad.yaml>
- jsDelivr <https://cdn.jsdelivr.net/gh/ilyydy/build-factory@release/my_white_ad.yaml>

| ghproxy | GitHub Raw | jsDelivr |
| --- | --- | --- |
| ![Clash 白名单 ghproxy 二维码](doc/clash_white_ad_ghproxy.png) | ![Clash 白名单 GitHub Raw 二维码](doc/clash_white_ad.png) | ![Clash 白名单 jsDelivr 二维码](doc/clash_white_ad_jsdelivr.png) |

### 懒人配置

未命中的流量走「节点选择」。

- ghproxy <https://ghproxy.net/https://raw.githubusercontent.com/ilyydy/build-factory/release/my_lazy_ghproxy.yaml>
- GitHub Raw <https://raw.githubusercontent.com/ilyydy/build-factory/release/my_lazy.yaml>
- jsDelivr <https://cdn.jsdelivr.net/gh/ilyydy/build-factory@release/my_lazy.yaml>

| ghproxy | GitHub Raw | jsDelivr |
| --- | --- | --- |
| ![Clash 懒人 ghproxy 二维码](doc/clash_lazy_ghproxy.png) | ![Clash 懒人 GitHub Raw 二维码](doc/clash_lazy.png) | ![Clash 懒人 jsDelivr 二维码](doc/clash_lazy_jsdelivr.png) |

ghproxy 版的分流 YAML 和其中引用的公开规则集都通过 ghproxy 下载。GitHub Raw 和 jsDelivr 入口提供引用 GitHub Raw 规则集的版本。

### 首次设置

1. 在 Clash Verge Rev 的「订阅」页导入所选配置的任一地址。
2. 右键新导入的**分流配置卡片**，打开「扩展覆写配置」，粘贴下面的 YAML，将 `url` 换成自己的代理订阅链接。
3. 保存后启用分流配置卡片，使用「规则」模式。在「代理 → 代理集合」查看 `my-nodes`，在「代理」页选择 OpenAI、TikTok、Gemini 和 Anthropic 各自使用的策略组。

```yaml
proxy-providers:
  my-nodes:
    type: http
    url: "https://example.invalid/your-subscription"
    proxy: DIRECT
    interval: 21600
    health-check:
      enable: true
      url: https://www.gstatic.com/generate_204
      interval: 600
```

订阅链接和 token 只填在本地覆写里。Mihomo 可以从原订阅 URL 读取含 `proxies:` 的 YAML 或其支持的 URI/Base64 节点列表。首次启动时，节点订阅和公开规则集通过直连拉取，以便在节点组为空时完成加载。服务策略组首次使用时默认选「新加坡」，已有的选择会被保留。选择末尾的「节点选择」即可跟随通用代理节点。 [代理集合格式](https://wiki.metacubex.one/config/proxy-providers/content/)

### 日常更新

| 想更新的内容 | 操作 |
| --- | --- |
| 整份分流配置，包括策略组、规则顺序和兜底 | 「订阅」→ **本项目的分流配置卡片** →「更新」。保存过的本地覆写会重新应用。 |
| 服务商节点 | 「代理」→「代理集合」→ 更新 `my-nodes`。上例也会每 6 小时刷新。 |
| 规则集内的域名或 IP | 「规则」→「规则集合」→ 更新对应规则集或更新全部。规则集也会每 24 小时刷新。 |

### 构建产物

运行 `npm run clash-build` 后，`dist/` 包含两类文件。

- `my_*.yaml` 是客户端导入的分流配置，定义策略组、规则顺序和每个规则集命中后的动作。每种分流配置都有 GitHub Raw 版和 ghproxy 版。
- `clash-rules/*.txt` 是从 Johnshall 的 Shadowrocket 配置提取并转换的域名、关键词和 IP 段规则集，由 YAML 的 `rule-providers` 引用。例如 `my_black_ad-reject-1-domain.txt` 收录黑名单版的一组广告域名，YAML 指定命中后执行 `REJECT`。Mihomo 会自动下载这些文件，也可以在「规则 → 规则集合」中独立刷新。

GitHub Actions 在北京时间每天 09:17 拉取上游并发布到 `release`。外部服务规则集引用 blackmatrix7 的 Clash 版本。DNS、TUN 与系统代理由客户端设置管理。 [上游配置](https://github.com/Johnshall/Shadowrocket-ADBlock-Rules-Forever) · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

## shadowrocket 分流规则

### 基于[黑名单过滤 + 广告](https://github.com/Johnshall/Shadowrocket-ADBlock-Rules-Forever?tab=readme-ov-file#%E9%BB%91%E5%90%8D%E5%8D%95%E8%BF%87%E6%BB%A4--%E5%B9%BF%E5%91%8A)的分流规则

github 规则地址：<https://github.com/ilyydy/build-factory/blob/release/my_black_ad.conf>

![my_black_ad](doc/my_black_ad.png)

jsdelivr 规则地址：<https://cdn.jsdelivr.net/gh/ilyydy/build-factory@release/my_black_ad.conf>

![my_black_ad (jsdelivr)](doc/my_black_ad_jsdelivr.png)

ghproxy 规则地址：<https://ghproxy.net/https://raw.githubusercontent.com/ilyydy/build-factory/release/my_black_ad.conf>

![my_black_ad (ghproxy)](doc/my_black_ad_ghproxy.png)

### 基于[名单过滤 + 广告](https://github.com/Johnshall/Shadowrocket-ADBlock-Rules-Forever?tab=readme-ov-file#%E7%99%BD%E5%90%8D%E5%8D%95%E8%BF%87%E6%BB%A4--%E5%B9%BF%E5%91%8A)的分流规则

github 规则地址：<https://github.com/ilyydy/build-factory/blob/release/my_white_ad.conf>

![my_white_ad](doc/my_white_ad.png)

jsdelivr 规则地址：<https://cdn.jsdelivr.net/gh/ilyydy/build-factory@release/my_white_ad.conf>

![my_white_ad (jsdelivr)](doc/my_white_ad_jsdelivr.png)

ghproxy 规则地址：<https://ghproxy.net/https://raw.githubusercontent.com/ilyydy/build-factory/release/my_white_ad.conf>

![my_white_ad (ghproxy)](doc/my_white_ad_ghproxy.png)

### 基于[懒人配置](https://github.com/Johnshall/Shadowrocket-ADBlock-Rules-Forever?tab=readme-ov-file#%E6%87%92%E4%BA%BA%E9%85%8D%E7%BD%AE)的分流规则

github 规则地址：<https://github.com/ilyydy/build-factory/blob/release/my_lazy.conf>

![my_lazy](doc/my_lazy.png)

jsdelivr 规则地址：<https://cdn.jsdelivr.net/gh/ilyydy/build-factory@release/my_lazy.conf>

![my_lazy (jsdelivr)](doc/my_lazy_jsdelivr.png)

ghproxy 规则地址：<https://ghproxy.net/https://raw.githubusercontent.com/ilyydy/build-factory/release/my_lazy.conf>

![my_lazy (ghproxy)](doc/my_lazy_ghproxy.png)
