import fs from 'node:fs';
import path from 'node:path';

import { mkDist, distPath } from './common'

mkDist();

const conf_map = {
  black_ad: {
    name: '黑名单过滤 + 广告',
    conf_file: 'sr_top500_banlist.conf',
    output_file: 'my_black_ad.conf',
  },
  white_ad: {
    name: '白名单过滤 + 广告',
    conf_file: 'sr_top500_whitelist_ad.conf',
    output_file: 'my_white_ad.conf',
  },
  lazy: {
    name: '懒人配置',
    conf_file: 'lazy.conf',
    output_file: 'my_lazy.conf',
  },
};

const template = `

[General]
# 基于{__name__}(https://github.com/Johnshall/Shadowrocket-ADBlock-Rules-Forever)的扩展版本
# {__time__}
include = {__conf_file__}


[Proxy Group]
# 新加坡 = url-test,url=http://www.gstatic.com/generate_204,interval=3600,tolerance=10,timeout=5,select=0,policy-regex-filter=(?=.*(新加坡).)^((?!(IPLC)).)*$
新加坡 = url-test,url=http://www.gstatic.com/generate_204,interval=600,tolerance=10,timeout=5,select=0,policy-regex-filter=新加坡(A|B)
香港 = url-test,url=http://www.gstatic.com/generate_204,interval=600,tolerance=10,timeout=5,select=0,policy-regex-filter=香港(A|B)
美国 = url-test,url=http://www.gstatic.com/generate_204,interval=600,tolerance=10,timeout=5,select=0,policy-regex-filter=美国(A|B)
日本 = url-test,url=http://www.gstatic.com/generate_204,interval=600,tolerance=10,timeout=5,select=0,policy-regex-filter=日本(A|B)


[Rule]
DOMAIN-SUFFIX,cityline.com,PROXY
RULE_SET,https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Shadowrocket/TikTok/TikTok.list,新加坡

`;

const time = new Date().toLocaleString('zh-CN', {
  timeZone: 'Asia/Shanghai',
  hour12: false,
});

for (const [key, conf] of Object.entries(conf_map)) {
  const content = template
    .replace('{__name__}', conf.name)
    .replace('{__time__}', time)
    .replace('{__conf_file__}', conf.conf_file);
  fs.writeFileSync(path.join(distPath, conf.output_file), content);
}
