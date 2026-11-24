# Loom UI

Moduloom 使用的 React 基础组件库。按钮、表单、弹窗、菜单和布局共享主题 Token，可独立接入 React 应用。

![Loom UI 的偏好设置示例](docs/preview.png)

## 快速开始

需要 Node.js 22.18+ 和 pnpm 11。

~~~sh
git clone https://github.com/Moduloom/loom-ui.git
cd loom-ui
pnpm install --frozen-lockfile
pnpm build
~~~

构建输出位于 dist/components。把构建后的包接入 React 项目即可使用。

~~~tsx
import { Button } from 'loom-ui'
import 'loom-ui/styles.css'

<Button variant="primary">保存</Button>
~~~

[组件源码](src/index.ts) · [预览框架 Moduloom](https://github.com/Moduloom/moduloom) · [GPL v3](LICENSE)
