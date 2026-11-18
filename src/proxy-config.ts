export const variants = [
  { name: 'my_black_ad', title: '黑名单过滤 + 广告', source: 'sr_top500_banlist_ad.conf' },
  { name: 'my_white_ad', title: '白名单过滤 + 广告', source: 'sr_top500_whitelist_ad.conf' },
  { name: 'my_lazy', title: '懒人配置', source: 'lazy.conf' },
];

export const services = ['OpenAI', 'TikTok', 'Gemini', 'Anthropic'];
export const serviceRegions = ['新加坡', '台湾', '日本', '韩国', '美国'];

export const regions = [
  { name: '新加坡', shadowrocketAliases: 'Singapore|sg', clashAliases: 'Singapore|SG|🇸🇬' },
  { name: '香港', shadowrocketAliases: 'Hong Kong|hk', clashAliases: 'Hong[ -]?Kong|HK|🇭🇰' },
  {
    name: '美国',
    shadowrocketAliases: 'United States|USA|America|us',
    clashAliases: '美國|United States|USA|America|US|🇺🇸',
  },
  { name: '日本', shadowrocketAliases: 'Japan|jp', clashAliases: 'Japan|JP|🇯🇵' },
  { name: '台湾', shadowrocketAliases: 'Taiwan|tw', clashAliases: '台灣|Taiwan|TW|🇹🇼' },
  { name: '泰国', shadowrocketAliases: 'Thailand|th', clashAliases: '泰國|Thailand|TH|🇹🇭' },
  {
    name: '韩国',
    shadowrocketAliases: 'South Korea|Korea|kr',
    clashAliases: '韓國|South Korea|Korea|KR|🇰🇷',
  },
  { name: '菲律宾', shadowrocketAliases: 'Philippines|ph', clashAliases: '菲律賓|Philippines|PH|🇵🇭' },
  { name: '德国', shadowrocketAliases: 'Germany|de', clashAliases: '德國|Germany|DE|🇩🇪' },
];

export const latencyTest = { intervalSeconds: 600, toleranceMs: 10, timeoutSeconds: 5 };

export const blackmatrixRuleRoot = 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule';
export const ghproxyPrefix = 'https://ghproxy.net/';
export const citylineDomain = 'cityline.com';
