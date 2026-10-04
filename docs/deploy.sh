set -e

# esbuild 在部分 Windows 机器的默认 TEMP（实测 G:\Temp）下，编译跑完后清理自己的临时目录会
# 报 "Access is denied"，导致构建以非 0 退出、产物为空。指向仓库内的目录即可绕开，
# 根因未定位，详见 AGENTS.md 的「已知问题」。
export TMPDIR="$(pwd)/.tmp-esbuild"
export TEMP="$TMPDIR"
export TMP="$TMPDIR"
mkdir -p "$TMPDIR"

rm -rf .vitepress/dist .vitepress/cache

pnpm run build

cd .vitepress/dist

# 根路径需要一个跳转页（站点分 antd-vue / element 两套，入口默认给 antd-vue 版）
cp ../../index.html index.html

# 【不要启用】写 CNAME 会让 GitHub Pages 绑定自定义域名 ui-extend.wxhice.com，
# 而该域名解析到 47.243.116.217（腾讯云 IP）且 80/443 拒绝连接，站点会因此打不开。
#
# 注意域名生效有**两个**开关：gh-pages 根目录的 CNAME 文件，与仓库
# Settings → Pages → Custom domain。**只去掉这里的 CNAME 不够**——设置里留过域名的话，
# GitHub Pages 仍会把 wxhccche.github.io/ui-extend/ 跳到那个死域名。要彻底不跳转，
# 必须同时把仓库设置里的 Custom domain 清空（这一步只能在网页/API 做，脚本管不到）。
# echo 'ui-extend.wxhice.com' > CNAME

git init
git add -A
git commit -m 'deploy'

# 仓库已从 wxhccc 迁到 wxhccche（旧账号 2FA 丢失无法登录），github.com/wxhccc/... 会重定向过来
git push -f git@github.com:wxhccche/ui-extend.git master:gh-pages

cd -
