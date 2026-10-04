/**
 * 导航栏与侧边栏，按库返回不同条目。
 *
 * 与 VuePress 版的差异：
 * - 侧边栏 link 要写成**站点根路径**（VuePress 版是相对当前目录的，如 `quickstart`）；
 * - 侧边栏按目录前缀分组，`/component/` 与 `/wiki/` 各自成组；
 * - `sidebarDepth: 0` 没有对应项，靠 nav/sidebar 结构本身控制层级。
 */

/** 导航栏的版本文档下拉（版本列表是硬编码的，见下） */
const docsVersions = [
  { main: '1.0', version: '1.2.0' },
  { main: '0.1', version: '0.1.2' }
]

const verNavCreator = () => ({
  text: docsVersions[0].version,
  items: docsVersions.map((item, index) => ({
    text: item.version,
    // 1.2.0 指向当前站点。仓库已从 wxhccc 迁到 wxhccche，因此不再指向 wxhccc.github.io。
    // gh-pages 上仍保留 ui-extend.wxhice.com 的 CNAME，域名恢复服务后如需改指自定义域名，
    // 把下面这行换成： https://ui-extend.wxhice.com/${index ? `${item.main}/` : ''}index.html
    link: index
      ? `https://ui-extend.wxhice.com/${item.main}/index.html`
      : 'https://wxhccche.github.io/ui-extend/'
  }))
})

export const navbar = (lib: 'antd-vue' | 'element') => {
  const [curLib, otherLib] = lib === 'antd-vue' ? ['ant-design-vue', 'element-plus'] : ['element-plus', 'ant-design-vue']
  return [
    {
      text: curLib,
      items: [
        {
          text: otherLib,
          // 仓库已从 wxhccc 迁到 wxhccche；换自定义域名时这里与 versions.ts 要一起改
          link: `https://wxhccche.github.io/ui-extend/${lib === 'antd-vue' ? 'element' : 'antd-vue'}/`
        }
      ]
    },
    { text: '组件', link: '/component/' },
    { text: '文档', link: '/wiki/' },
    verNavCreator()
  ]
}

export const sidebar = (lib: 'antd-vue' | 'element') => ({
  '/component/': [
    {
      text: '开发指南',
      items: [
        { text: '安装', link: '/component/' },
        { text: '快速上手', link: '/component/quickstart' }
      ]
    },
    {
      text: '组件',
      collapsed: false,
      items: [
        {
          text: 'Basic',
          collapsed: false,
          items: [
            { text: 'ActionBtns 操作按钮组', link: '/component/action-btns' },
            { text: 'Ticker 倒计时器', link: '/component/ticker' },
            { text: 'Loading 加载组件', link: '/component/loading' },
            { text: 'CopyClipboard 复制板', link: '/component/copy-clipboard' },
            { text: 'MediaContainer 多媒体容器', link: '/component/media-container' }
          ]
        },
        {
          text: 'Form',
          collapsed: false,
          items: [
            { text: 'SearchInput 搜索输入框', link: '/component/search-input' },
            ...(lib === 'antd-vue' ? [{ text: 'MultiLineInput 多行输入框', link: '/component/multi-line-input' }] : []),
            { text: 'TreeField 树表单域', link: '/component/tree-field' },
            { text: 'FormBtns 表单操作按钮', link: '/component/form-btns' },
            { text: 'CommonField 通用表单域', link: '/component/common-field' },
            { text: 'FormFieldItem 表单项', link: '/component/form-field-item' },
            { text: 'FormFields 表单项组', link: '/component/form-fields' },
            ...(lib === 'antd-vue'
              ? [{ text: 'ObjectArrayField 对象数组表单域', link: '/component/object-array-field' }]
              : []),
            { text: 'RemoteCascader 异步级联', link: '/component/remote-cascader' }
          ]
        },
        {
          text: 'Data',
          collapsed: false,
          items: [
            ...(lib === 'element' ? [{ text: 'DataTable 数据表格', link: '/component/data-table' }] : []),
            { text: 'InfoTable 信息表格', link: '/component/info-table' },
            { text: 'TreeTransfer 树型穿梭框', link: '/component/tree-transfer' },
            { text: 'PagedList 分页列表', link: '/component/paged-list' },
            { text: 'PagedTable 分页表格', link: '/component/paged-table' }
          ]
        },
        {
          text: 'Notice',
          collapsed: false,
          items: [{ text: 'MultiAlert 多模块警告', link: '/component/multi-alert' }]
        },
        {
          text: 'Plugins',
          collapsed: false,
          items: [{ text: 'Cropper 图片裁剪', link: '/component/cropper' }]
        },
        {
          text: 'Higher',
          collapsed: false,
          items: [
            { text: 'ScrollPane 瀑布流容器', link: '/component/scroll-pane' },
            { text: 'SearchForm 搜索表单', link: '/component/search-form' },
            { text: 'CommonListPage 通用列表页模版', link: '/component/common-list-page' }
          ]
        }
      ]
    }
  ],
  '/wiki/': [
    { text: 'Utils', link: '/wiki/utils' },
    { text: 'Optionals', link: '/wiki/optionals' },
    { text: '数据结构', link: '/wiki/data' }
  ]
})
